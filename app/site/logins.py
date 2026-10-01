"""ورود به سایت با QR و نشست‌های سایت.

جریان:
  ۱. مرورگر start می‌زند ← کد عمومی (داخل QR) + کلید پرسش (فقط در حافظهٔ همان صفحه).
  ۲. مینی‌اپ (با initData) کد را inspect می‌کند ← کد به همان کاربر بسته می‌شود و
     اسم مرورگر، جا و زمان برای تأیید نشان داده می‌شود.
  ۳. کاربر approve یا deny می‌زند.
  ۴. مرورگر با poll (کد + کلید پرسش) می‌پرسد؛ بعد از تأیید یک بار نشست می‌گیرد.

کسی که فقط QR را دیده (کد) بدون کلید پرسش نشستی نمی‌گیرد، و کسی که QR را
از صفحهٔ دیگری آورده (QRLjacking) در صفحهٔ تأیید اسم مرورگر غریبه را می‌بیند.
در دیتابیس فقط هش کلید پرسش و هش توکن نشست نگه داشته می‌شود.
"""
from __future__ import annotations

import hashlib
import re
import secrets
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS web_logins (
  code TEXT PRIMARY KEY,          -- داخل QR؛ عمومی
  poll_hash TEXT NOT NULL,        -- sha256 کلید پرسش مرورگر
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | scanned | approved | denied | used
  ip TEXT, ua TEXT, place TEXT,
  tg_id INTEGER,                  -- کسی که اسکن کرد
  first_name TEXT, username TEXT, photo_url TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_web_logins_ip ON web_logins(ip, created_at);

CREATE TABLE IF NOT EXISTS web_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  tg_id INTEGER NOT NULL,
  ip TEXT, ua TEXT, place TEXT,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_web_sessions_user ON web_sessions(tg_id);
"""

CODE_TTL = 45            # QR هر ۳۰ ثانیه عوض می‌شود؛ کمی فرصت برای اسکنِ لحظهٔ آخر
CONFIRM_TTL = 180        # بعد از اسکن، فرصت تأیید روی گوشی
SESSION_TTL = 30 * 86400
STARTS_PER_IP = 60       # در ۱۰ دقیقه (چند زبانه یا خانه‌ای با یک IP)
CODE_RE = re.compile(r"^[A-Za-z0-9_-]{20,40}$")
SCAN_RE = re.compile(r"wl_([A-Za-z0-9_-]{20,40})")


class LoginError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _h(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def now() -> int:
    return int(time.time())


# ---------- مرورگر و جا ----------
_BROWSERS = (("Edg/", "Edge"), ("OPR/", "Opera"), ("SamsungBrowser", "Samsung"), ("Firefox/", "Firefox"),
             ("CriOS", "Chrome"), ("Chrome/", "Chrome"), ("Safari/", "Safari"))
_SYSTEMS = (("iPhone", "iPhone"), ("iPad", "iPad"), ("Android", "Android"), ("Windows", "Windows"),
            ("Mac OS X", "macOS"), ("CrOS", "ChromeOS"), ("Linux", "Linux"))
_PLACES = {"IR": "ایران", "TR": "ترکیه", "AE": "امارات", "DE": "آلمان", "GB": "انگلیس", "US": "آمریکا",
           "NL": "هلند", "FR": "فرانسه", "CA": "کانادا", "SE": "سوئد", "AM": "ارمنستان", "IQ": "عراق"}


def device(ua: str) -> dict:
    """«Chrome روی Windows» از روی User-Agent؛ برای تشخیص، نه امنیت."""
    ua = ua or ""
    browser = next((name for key, name in _BROWSERS if key in ua), "مرورگر")
    system = next((name for key, name in _SYSTEMS if key in ua), "")
    mobile = system in ("iPhone", "Android") or "Mobile" in ua
    return {"browser": browser, "os": system, "mobile": mobile,
            "label": f"{browser} روی {system}" if system else browser}


def client_info(environ: dict) -> tuple[str, str, str]:
    """(ip، user-agent، جا). جا از هدر کشور CDN اگر باشد.

    IP همان REMOTE_ADDR است، نه X-Forwarded-For: سقف ساخت کد بر اساس IP است و
    هدر را هر کسی می‌تواند بسازد."""
    ip = (environ.get("REMOTE_ADDR") or "")[:64]
    ua = (environ.get("HTTP_USER_AGENT") or "")[:300]
    cc = (environ.get("HTTP_CF_IPCOUNTRY") or environ.get("HTTP_X_COUNTRY_CODE") or "").upper()[:2]
    return ip, ua, _PLACES.get(cc, cc if cc.isalpha() else "")


def scan_text(bot_username: str, code: str) -> str:
    """متن QR: لینک ربات؛ دوربین معمولی هم تلگرام را باز می‌کند."""
    return f"https://t.me/{bot_username}?start=wl_{code}"


def code_from_scan(text: str) -> str:
    m = SCAN_RE.search(text or "")
    return m.group(1) if m else ""


# ---------- مرورگر ----------
async def start(db, ip: str, ua: str, place: str) -> dict:  # noqa: ANN001
    t = now()
    row = await db.fetchone("SELECT COUNT(*) AS n FROM web_logins WHERE ip = ? AND created_at > ?", (ip, t - 600))
    if row and row["n"] >= STARTS_PER_IP:
        raise LoginError(429, "کمی صبر کن و دوباره امتحان کن")
    if secrets.randbelow(20) == 0:  # جمع‌وجور نگه داشتن جدول
        await db.execute("DELETE FROM web_logins WHERE expires_at < ?", (t - 86400,))
        await db.execute("DELETE FROM web_sessions WHERE expires_at < ? OR (revoked = 1 AND last_seen < ?)",
                         (t, t - 30 * 86400))
    code, poll = secrets.token_urlsafe(18), secrets.token_urlsafe(24)
    await db.execute(
        "INSERT INTO web_logins(code, poll_hash, ip, ua, place, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (code, _h(poll), ip, ua, place, t, t + CODE_TTL),
    )
    return {"code": code, "poll": poll}


async def poll(db, code: str, poll_key: str, ip: str, ua: str, place: str) -> tuple[dict, str | None]:  # noqa: ANN001
    """وضعیت ورود. بعد از تأیید، یک بار توکن نشست برمی‌گردد (برای کوکی)."""
    if not CODE_RE.match(code or "") or not poll_key:
        raise LoginError(400, "درخواست نامعتبر")
    row = await db.fetchone("SELECT * FROM web_logins WHERE code = ?", (code,))
    if not row or not secrets.compare_digest(row["poll_hash"], _h(poll_key)):
        raise LoginError(404, "کد پیدا نشد")
    status = row["status"]
    if status in ("pending", "scanned") and row["expires_at"] < now():
        return {"status": "expired"}, None
    if status != "approved":
        return {"status": status}, None
    # فقط یک بار: اگر دو پرسش هم‌زمان برسند، فقط یکی از used رد می‌شود
    taken = await db.execute("UPDATE web_logins SET status = 'used' WHERE code = ? AND status = 'approved'", (code,))
    if not taken:
        return {"status": "used"}, None
    token = secrets.token_urlsafe(32)
    t = now()
    await db.execute(
        "INSERT INTO web_sessions(token_hash, tg_id, ip, ua, place, created_at, last_seen, expires_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (_h(token), row["tg_id"], ip, ua, place, t, t, t + SESSION_TTL),
    )
    user = {"first_name": row["first_name"] or "", "username": row["username"] or "", "photo_url": row["photo_url"] or ""}
    return {"status": "approved", "user": user}, token


# ---------- مینی‌اپ (کاربر تلگرام) ----------
async def _claimable(db, code: str, uid: int):  # noqa: ANN001, ANN202
    if not CODE_RE.match(code or ""):
        raise LoginError(400, "این QR مال ورود به سایت ایزی‌ساز نیست")
    row = await db.fetchone("SELECT * FROM web_logins WHERE code = ?", (code,))
    if not row:
        raise LoginError(404, "این کد پیدا نشد؛ صفحهٔ ورود را تازه کن")
    if row["tg_id"] and row["tg_id"] != uid:
        raise LoginError(409, "این کد را کس دیگری اسکن کرده")
    if row["status"] in ("approved", "used"):
        raise LoginError(410, "با این کد قبلاً وارد شده‌اند")
    if row["status"] == "denied":
        raise LoginError(410, "این ورود رد شده؛ صفحهٔ ورود را تازه کن")
    if row["expires_at"] < now():
        raise LoginError(410, "کد منقضی شده؛ QR تازه را اسکن کن")
    return row


async def inspect(db, code: str, user) -> dict:  # noqa: ANN001
    """اسکن شد: کد به این کاربر بسته می‌شود و مشخصات مرورگر برای تأیید برمی‌گردد."""
    row = await _claimable(db, code, user.id)
    t = now()
    await db.execute(
        "UPDATE web_logins SET status = 'scanned', tg_id = ?, first_name = ?, username = ?, photo_url = ?, "
        "expires_at = ? WHERE code = ? AND status IN ('pending', 'scanned') AND (tg_id IS NULL OR tg_id = ?)",
        (user.id, user.first_name, user.username, getattr(user, "photo_url", ""), t + CONFIRM_TTL, code, user.id),
    )
    return {"device": device(row["ua"]), "ip": row["ip"] or "", "place": row["place"] or "", "at": row["created_at"]}


async def decide(db, code: str, user, approve: bool) -> dict:  # noqa: ANN001
    row = await _claimable(db, code, user.id)
    if row["status"] != "scanned":
        raise LoginError(400, "اول QR را اسکن کن")
    done = await db.execute(
        "UPDATE web_logins SET status = ? WHERE code = ? AND status = 'scanned' AND tg_id = ?",
        ("approved" if approve else "denied", code, user.id),
    )
    if not done:
        raise LoginError(410, "این ورود دیگر معتبر نیست")
    return {"ok": True, "status": "approved" if approve else "denied"}


# ---------- نشست‌ها ----------
async def session(db, token: str):  # noqa: ANN001, ANN201
    """ردیف نشست معتبر برای کوکی، یا None. last_seen حداکثر دقیقه‌ای یک بار نوشته می‌شود."""
    if not token or len(token) > 100:
        return None
    t = now()
    row = await db.fetchone(
        "SELECT * FROM web_sessions WHERE token_hash = ? AND revoked = 0 AND expires_at > ?", (_h(token), t)
    )
    if row and t - row["last_seen"] > 60:
        await db.execute("UPDATE web_sessions SET last_seen = ? WHERE id = ?", (t, row["id"]))
    return row


def _session_json(row, current_id: int | None) -> dict:  # noqa: ANN001
    return {"id": row["id"], "device": device(row["ua"]), "place": row["place"] or "", "ip": row["ip"] or "",
            "created_at": row["created_at"], "last_seen": row["last_seen"], "current": row["id"] == current_id}


async def sessions(db, uid: int, current_id: int | None = None) -> list[dict]:  # noqa: ANN001
    rows = await db.fetchall(
        "SELECT * FROM web_sessions WHERE tg_id = ? AND revoked = 0 AND expires_at > ? ORDER BY last_seen DESC",
        (uid, now()),
    )
    return [_session_json(r, current_id) for r in rows]


async def revoke(db, uid: int, sid: object = None, everything: bool = False) -> int:  # noqa: ANN001
    if everything:
        return await db.execute("UPDATE web_sessions SET revoked = 1 WHERE tg_id = ? AND revoked = 0", (uid,))
    try:
        sid = int(sid)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        raise LoginError(400, "شناسه نامعتبر") from None
    n = await db.execute("UPDATE web_sessions SET revoked = 1 WHERE id = ? AND tg_id = ? AND revoked = 0", (sid, uid))
    if not n:
        raise LoginError(404, "این دستگاه پیدا نشد")
    return n
