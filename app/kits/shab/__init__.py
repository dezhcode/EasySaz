"""قسمت: کتابخانهٔ داستان برای کانال‌ها — بخش سرور.

ویرایش همان سند پیش‌نویس است (پنل، app/blocks.py). با «انتشار»:
- متن قسمت‌های منتشرشده در جدول shab_chapters می‌نشیند و از سندِ عمومی
  برداشته می‌شود. صفحهٔ مینی‌اپ سبک می‌ماند و متن هر قسمت وقتی باز شد
  جدا گرفته می‌شود؛ قسمت «فقط اعضا» فقط به عضو کانال داده می‌شود.
- قسمت‌های تازه (که قبلاً منتشر نشده بودند) به پنل برمی‌گردند تا صاحب
  کانال اگر خواست به خواننده‌ها و کانال اعلامشان کند.

جای خواندن، نشان‌ها و «خبرم کن» هر خواننده (با initData ربات همان مینی‌اپ)
در shab_readers، shab_progress و shab_marks است؛ روی هر گوشی یکی.
"""
from __future__ import annotations

import re
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS shab_chapters (
  app_id INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  story_title TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  lock INTEGER NOT NULL DEFAULT 0,
  ord INTEGER NOT NULL DEFAULT 0,
  words INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, chapter_id)
);
CREATE TABLE IF NOT EXISTS shab_readers (
  app_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  first_name TEXT,
  username TEXT,
  notify INTEGER NOT NULL DEFAULT 1,       -- «خبرم کن» قسمت تازه
  last_story TEXT,
  last_chapter TEXT,
  last_pct REAL NOT NULL DEFAULT 0,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (app_id, tg_id)
);
CREATE TABLE IF NOT EXISTS shab_progress (
  app_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  pct REAL NOT NULL DEFAULT 0,             -- بیشترین جایی که خوانده (۰ تا ۱)
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, tg_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_shab_progress_ch ON shab_progress(app_id, chapter_id);
CREATE TABLE IF NOT EXISTS shab_marks (
  app_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, tg_id, chapter_id)
);
CREATE TABLE IF NOT EXISTS shab_announces (
  app_id INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  readers INTEGER NOT NULL DEFAULT 0,
  channel INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, chapter_id)
);
"""

_MARKS = re.compile(r"\*\*|!!|~~|\(\(|\)\)")
_PREFIX = re.compile(r"^(#|[—–-]|~|!|>|\^)\s+|^✉\s*")
_WORD = re.compile(r"[^\s#~!>^✉—*-]\S*")
# خط‌های یک قسمت (قالب «قسمت»): بلوک‌ها با خط خالی جدا می‌شوند.
#   «@<شناسهٔ شخصیت>: متن»  خط گفت‌وگو (حباب)   ·   «!img(<نشانی>) زیرنویس»  تصویر
#   بقیه: متن راوی، با همان نشانه‌های قدیمی قسمت. متن قدیمی یعنی همه راوی.
_WHO = re.compile(r"^@(c[a-z0-9]{5,15}):[ \t]?")
_IMG = re.compile(r"^!img\((\S+?)\)[ \t]*")


def blocks_of(body: str) -> list[str]:
    return [b.strip() for b in re.split(r"\n\s*\n", body or "") if b.strip()]


def line(block: str) -> tuple[str, str, str]:
    """(گوینده، متن، تصویر) یک بلوک؛ گویندهٔ خالی یعنی راوی."""
    who, img = "", ""
    m = _WHO.match(block)
    if m:
        who, block = m.group(1), block[m.end():]
    m = _IMG.match(block)
    if m:
        img, block = m.group(1), block[m.end():]
    return who, block.strip(), img


def plain(body: str) -> str:
    return _MARKS.sub("", "\n\n".join(line(b)[1] for b in blocks_of(body)))


def words(body: str) -> int:
    return len(_WORD.findall(plain(body)))


def teaser(body: str, limit: int = 280) -> str:
    """خط اول متنی بدون نشانه‌ها؛ برای پیام اعلام و متن کوتاه."""
    for b in blocks_of(body):
        text = line(b)[1]
        if text and not re.fullmatch(r"(\*\s*){3}", text):
            text = _PREFIX.sub("", _MARKS.sub("", text)).strip()
            return text[:limit] + ("…" if len(text) > limit else "")
    return ""


def teaser_lines(body: str, count: int = 2, limit: int = 240) -> str:
    """چند خط اول قسمت قفل، با گوینده (تا خواننده حباب‌ها را ببیند)، بی‌تصویر."""
    out = []
    for b in blocks_of(body):
        who, text, _img = line(b)
        if not text or re.fullmatch(r"(\*\s*){3}", text):
            continue
        text = text[:limit] + ("…" if len(text) > limit else "")
        out.append((f"@{who}: " if who else "") + text)
        if len(out) >= count:
            break
    return "\n\n".join(out)


def lead(body: str, count: int = 3) -> list[dict]:
    """سه خط اول برای کارت فید (متن کامل قسمت در سند خواننده نیست)."""
    out = []
    for b in blocks_of(body):
        who, text, img = line(b)
        if re.fullmatch(r"(\*\s*){3}", text):
            continue
        text = _PREFIX.sub("", _MARKS.sub("", text)).strip()
        out.append({"w": who, "t": text[:160] + ("…" if len(text) > 160 else ""), "i": bool(img)})
        if len(out) >= count:
            break
    return out


def stories(doc: dict):  # noqa: ANN201
    """(بلوک داستان) همهٔ صفحه‌ها به ترتیب."""
    for pg in doc.get("pages", []):
        for b in pg.get("blocks", []):
            if b.get("type") == "story" and isinstance(b.get("props"), dict):
                yield b


def public_view(doc: dict) -> dict:
    """سند خواننده: متن قسمت‌ها برداشته می‌شود و فقط تعداد کلمه‌اش می‌ماند.

    پیش‌نویس‌ها را blocks.reader_view قبلاً برداشته است."""
    for b in stories(doc):
        out = []
        for ch in b["props"].get("chapters") or []:
            if not isinstance(ch, dict):
                continue
            c = {k: v for k, v in ch.items() if k != "body"}
            c["words"] = words(ch.get("body") or "")
            c["lead"] = lead(ch.get("body") or "", 2 if ch.get("lock") else 3)
            c["chat"] = any(line(x)[0] for x in blocks_of(ch.get("body") or ""))
            out.append(c)
        b["props"]["chapters"] = out
    return doc


async def on_publish(db, app, doc: dict) -> dict:  # noqa: ANN001
    """متن قسمت‌های منتشرشده را در جدول می‌گذارد؛ قسمت‌های تازه را برمی‌گرداند."""
    t = int(time.time())
    rows = []
    for b in stories(doc):
        p = b["props"]
        order = 0
        for ch in p.get("chapters") or []:
            if not isinstance(ch, dict) or ch.get("draft") or not ch.get("id"):
                continue
            rows.append((app["id"], ch["id"], b["id"], p.get("title") or "", ch.get("title") or "",
                         ch.get("body") or "", 1 if ch.get("lock") else 0, order, words(ch.get("body") or ""), t, t))
            order += 1
    before = {r["chapter_id"] for r in await db.fetchall(
        "SELECT chapter_id FROM shab_chapters WHERE app_id = ?", (app["id"],))}
    conn = db.conn
    await conn.executemany(
        "INSERT INTO shab_chapters(app_id, chapter_id, story_id, story_title, title, body, lock, ord, words, published_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(app_id, chapter_id) DO UPDATE SET "
        "story_id=excluded.story_id, story_title=excluded.story_title, title=excluded.title, body=excluded.body, "
        "lock=excluded.lock, ord=excluded.ord, words=excluded.words, updated_at=excluded.updated_at",
        rows,
    )
    keep = {r[1] for r in rows}
    gone = before - keep
    if gone:
        await conn.executemany("DELETE FROM shab_chapters WHERE app_id = ? AND chapter_id = ?",
                               [(app["id"], c) for c in gone])
    await conn.commit()
    announced = {r["chapter_id"] for r in await db.fetchall(
        "SELECT chapter_id FROM shab_announces WHERE app_id = ?", (app["id"],))}
    fresh = [{"id": r[1], "story": r[3], "title": r[4]} for r in rows if r[1] not in before and r[1] not in announced]
    return {"new_chapters": fresh}
