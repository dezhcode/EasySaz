"""صوت و ویدیوی مطلب‌ها (قالب مجله).

بدنهٔ درخواست خود فایل است (نه base64)؛ از پنل با initData و از سایت با
کوکی می‌رسد. نوع فایل از روی بایت‌های اولش شناخته می‌شود، نه از اسم یا
هدر. نام فایل از هش محتواست، پس هر فایل یک بار ذخیره و برای همیشه کش
می‌شود. سرو از همان /u/<نام> با پشتیبانی Range (جلو و عقب بردن ویدیو در
آیفون بدون Range کار نمی‌کند).
"""
from __future__ import annotations

import hashlib
import os

from app.config import config

AUDIO_MAX = 20_000_000
VIDEO_MAX = 40_000_000
MEDIA_MAX_FILES = 300
MEDIA_MAX_BYTES = 400_000_000
TYPES = {"mp3": "audio/mpeg", "m4a": "audio/mp4", "ogg": "audio/ogg", "wav": "audio/wav",
         "mp4": "video/mp4", "webm": "video/webm"}


class MediaError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def sniff(head: bytes, ctype: str = "") -> str:
    """پسوند از روی محتوا؛ خالی یعنی ناشناخته."""
    if head.startswith(b"ID3") or head[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2", b"\xff\xe3"):
        return "mp3"
    if head.startswith(b"OggS"):
        return "ogg"
    if head.startswith(b"RIFF") and head[8:12] == b"WAVE":
        return "wav"
    if head.startswith(b"\x1a\x45\xdf\xa3"):
        return "webm"
    if head[4:8] == b"ftyp":
        brand = head[8:12]
        audio = brand in (b"M4A ", b"M4B ") or ctype.startswith("audio/")
        return "m4a" if audio else "mp4"
    return ""


def read_body(environ: dict, limit: int = VIDEO_MAX) -> bytes:
    try:
        size = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        size = 0
    if size <= 0:
        raise MediaError(400, "فایلی نرسید")
    if size > limit:
        raise MediaError(413, "فایل خیلی بزرگ است؛ صوت تا ۲۰ و ویدیو تا ۴۰ مگابایت")
    stream, chunks, got = environ["wsgi.input"], [], 0
    while got < size:
        part = stream.read(min(1 << 20, size - got))
        if not part:
            break
        chunks.append(part)
        got += len(part)
    return b"".join(chunks)


async def save(db, uid: int, data: bytes, ctype: str = "") -> dict:  # noqa: ANN001
    ext = sniff(data[:16], ctype or "")
    if not ext:
        raise MediaError(400, "فقط صوت (MP3، M4A، OGG) یا ویدیو (MP4، WEBM)")
    kind = "audio" if TYPES[ext].startswith("audio/") else "video"
    if len(data) > (AUDIO_MAX if kind == "audio" else VIDEO_MAX):
        raise MediaError(413, "فایل خیلی بزرگ است؛ صوت تا ۲۰ و ویدیو تا ۴۰ مگابایت")
    row = await db.fetchone(
        "SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS b FROM uploads WHERE owner_id = ? AND "
        "(name LIKE '%.mp3' OR name LIKE '%.m4a' OR name LIKE '%.ogg' OR name LIKE '%.wav' OR name LIKE '%.mp4' OR name LIKE '%.webm')",
        (uid,))
    if row["n"] >= MEDIA_MAX_FILES or row["b"] + len(data) > MEDIA_MAX_BYTES:
        raise MediaError(402, "فضای صوت و ویدیوی تو پر شده")
    name = f"{hashlib.sha256(data).hexdigest()[:24]}.{ext}"
    os.makedirs(config.upload_dir, exist_ok=True)
    path = os.path.join(config.upload_dir, name)
    if not os.path.exists(path):
        tmp = path + ".part"
        with open(tmp, "wb") as fh:
            fh.write(data)
        os.replace(tmp, path)
    await db.record_upload(name, uid, len(data))
    return {"url": f"{config.base_url}/u/{name}", "kind": kind, "size": len(data)}


def serve(start_response, full: str, ctype: str, range_header: str, send):  # noqa: ANN001, ANN201
    """فایل با Range: «bytes=start-end» → 206؛ بقیه 200."""
    size = os.path.getsize(full)
    start, end = 0, size - 1
    partial = False
    if range_header.startswith("bytes="):
        spec = range_header[6:].split(",")[0].strip()
        a, _, b = spec.partition("-")
        try:
            if a:
                start = int(a)
                end = int(b) if b else size - 1
            elif b:
                start = max(0, size - int(b))
            partial = True
        except ValueError:
            partial = False
        if partial and (start >= size or start > end):
            start_response("416 Range Not Satisfiable", [("Content-Range", f"bytes */{size}"), ("Content-Length", "0")])
            return [b""]
        end = min(end, size - 1)
    with open(full, "rb") as fh:
        fh.seek(start)
        data = fh.read(end - start + 1)
    extra = [("Accept-Ranges", "bytes"), ("Cache-Control", "public, max-age=31536000, immutable")]
    if partial:
        extra.append(("Content-Range", f"bytes {start}-{end}/{size}"))
        return send(start_response, "206 Partial Content", data, ctype, extra)
    return send(start_response, "200 OK", data, ctype, extra)
