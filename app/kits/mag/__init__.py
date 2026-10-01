"""مجله: مطلب‌نویسی برای کانال‌ها — بخش سرور.

برخلاف «قسمت»، محتوا داخل سند صفحه نیست: مطلب‌ها، دسته‌ها و نویسنده‌ها در
جدول‌های خودشان‌اند تا هم از سایت و هم از مینی‌اپ ایزی‌ساز (تلگرام) نوشته
شوند و هر مطلب لینک مستقیم داشته باشد (t.me/<ربات>?start=a_<مطلب>).
سند صفحه فقط طراحی است: حال‌وهوا، رنگ و بخش‌های خانه؛ و آن فقط از سایت
عوض می‌شود (app/webapp/api.py جلوی ذخیرهٔ طراحی مجله از مینی‌اپ را می‌گیرد).

بدنهٔ مطلب فهرست بلوک است:
  p    متن          {text}            h      تیتر        {text}
  img  تصویر        {src, cap}        audio  صوت         {src, title}
  video ویدیو       {src, cap}        link   کارت لینک   {url, title, note}
  btn  دکمه         {url, label}      quote  نقل‌قول      {text, by}
  hr   جداکننده
"""
from __future__ import annotations

import json
import re
import secrets
import time
from typing import Any

from app import blocks

SCHEMA = """
CREATE TABLE IF NOT EXISTS mag_posts (
  app_id INTEGER NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  lead TEXT NOT NULL DEFAULT '',
  cover TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '[]',
  cat_id TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  author_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',    -- draft | pub (pub با pub_at آینده = زمان‌بندی‌شده)
  pub_at INTEGER,
  source TEXT NOT NULL DEFAULT 'site',     -- site | tg : از کجا نوشته شد
  words INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  posted_at INTEGER,                       -- آخرین پست در کانال
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, id)
);
CREATE INDEX IF NOT EXISTS idx_mag_posts_pub ON mag_posts(app_id, status, pub_at);
CREATE TABLE IF NOT EXISTS mag_cats (
  app_id INTEGER NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  ord INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, id)
);
CREATE TABLE IF NOT EXISTS mag_authors (
  app_id INTEGER NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  tg_id INTEGER,
  ord INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, id)
);
"""

MAX_POSTS = 3000
MAX_BLOCKS = 200
MAX_CATS = 30
MAX_AUTHORS = 30
MAX_TAGS = 8
BLOCK_TYPES = ("p", "h", "img", "audio", "video", "link", "btn", "quote", "hr")
CAT_ICONS = ("cap", "spark", "cup", "globe", "chat", "star", "book", "image", "music", "heart", "shop", "list")
COLORS = ("#1D55F0", "#0E8FAE", "#12A071", "#E09A1F", "#E0573E", "#E0457B", "#6A55E0", "#0A2572")
DEFAULT_CATS = [("آموزش", "#1D55F0", "cap"), ("خبر", "#0E8FAE", "spark"), ("گفت‌وگو", "#E0457B", "chat")]

_PID = re.compile(r"^p[a-z0-9]{7,12}$")
_XID = re.compile(r"^[ca][a-z0-9]{5,12}$")
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f‪-‮⁦-⁩]")
_WORD = re.compile(r"\S+")
_MEDIA = re.compile(r"\.(mp3|m4a|ogg|wav|mp4|webm)$")


class MagError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def now() -> int:
    return int(time.time())


def new_id(prefix: str) -> str:
    alphabet = "abcdefghijkmnpqrstuvwxyz23456789"
    return prefix + "".join(secrets.choice(alphabet) for _ in range(8))


def text(value: Any, limit: int, multiline: bool = False) -> str:
    s = _CTRL.sub("", str(value or ""))
    if not multiline:
        s = re.sub(r"\s+", " ", s)
    else:
        s = re.sub(r"\r\n?", "\n", s)
        s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()[:limit]


def media_url(value: Any) -> str:
    """صوت/ویدیو: فایل آپلودشده در همین سرور یا هر نشانی https (لینک بیرونی)."""
    url = blocks.clean_url(value)
    return url if url.startswith("https://") or url.startswith("http://") else ""


def is_own_media(url: str) -> bool:
    return url.startswith(blocks._upload_prefix()) and bool(_MEDIA.search(url))


# ---------- پاکسازی ----------
def clean_body(raw: Any) -> list[dict]:
    out = []
    for b in raw if isinstance(raw, list) else []:
        if not isinstance(b, dict) or b.get("t") not in BLOCK_TYPES:
            continue
        t = b["t"]
        if t == "p":
            v = {"t": t, "text": text(b.get("text"), 6000, multiline=True)}
            if not v["text"]:
                continue
        elif t == "h":
            v = {"t": t, "text": text(b.get("text"), 160)}
            if not v["text"]:
                continue
        elif t == "img":
            v = {"t": t, "src": blocks.clean_url(b.get("src"), images=True), "cap": text(b.get("cap"), 200)}
            if not v["src"]:
                continue
        elif t in ("audio", "video"):
            v = {"t": t, "src": media_url(b.get("src")), ("title" if t == "audio" else "cap"): text(b.get("title") if t == "audio" else b.get("cap"), 120)}
            if not v["src"]:
                continue
        elif t == "link":
            v = {"t": t, "url": blocks.clean_url(b.get("url")), "title": text(b.get("title"), 120), "note": text(b.get("note"), 160)}
            if not v["url"]:
                continue
        elif t == "btn":
            v = {"t": t, "url": blocks.clean_url(b.get("url")), "label": text(b.get("label"), 40) or "باز کردن"}
            if not v["url"]:
                continue
        elif t == "quote":
            v = {"t": t, "text": text(b.get("text"), 600, multiline=True), "by": text(b.get("by"), 60)}
            if not v["text"]:
                continue
        else:
            v = {"t": "hr"}
        out.append(v)
        if len(out) >= MAX_BLOCKS:
            break
    return out


def clean_tags(raw: Any) -> list[str]:
    items = raw if isinstance(raw, list) else re.split(r"[,،\n]", str(raw or ""))
    out: list[str] = []
    for t in items:
        t = re.sub(r"\s+", "_", text(t, 40).lstrip("#").strip())[:24]
        if t and t not in out:
            out.append(t)
        if len(out) >= MAX_TAGS:
            break
    return out


def words_of(title: str, lead: str, body: list[dict]) -> int:
    n = len(_WORD.findall(title)) + len(_WORD.findall(lead))
    for b in body:
        n += len(_WORD.findall(b.get("text") or "")) if b["t"] in ("p", "h", "quote") else 0
    return n


def minutes(words: int) -> int:
    return max(1, round(words / 200))


# ---------- ردیف ← JSON ----------
def _loads(raw: str, default: Any) -> Any:
    try:
        v = json.loads(raw or "")
    except ValueError:
        return default
    return v if isinstance(v, type(default)) else default


def state(row) -> str:  # noqa: ANN001
    if row["status"] != "pub":
        return "draft"
    return "sched" if (row["pub_at"] or 0) > now() else "pub"


def summary(row) -> dict:  # noqa: ANN001
    body = _loads(row["body"], [])
    return {
        "id": row["id"], "title": row["title"], "lead": row["lead"], "cover": row["cover"],
        "cat": row["cat_id"], "tags": _loads(row["tags"], []), "author": row["author_id"],
        "at": row["pub_at"] or row["updated_at"], "mins": minutes(row["words"]), "views": row["views"],
        "audio": any(b.get("t") == "audio" for b in body), "video": any(b.get("t") == "video" for b in body),
    }


def full(row) -> dict:  # noqa: ANN001
    return dict(summary(row), body=_loads(row["body"], []))


def owner_row(row) -> dict:  # noqa: ANN001
    return dict(summary(row), state=state(row), source=row["source"], words=row["words"],
                posted_at=row["posted_at"], updated_at=row["updated_at"], created_at=row["created_at"])


def cat_json(row, count: int = 0) -> dict:  # noqa: ANN001
    return {"id": row["id"], "name": row["name"], "color": row["color"] or COLORS[0], "icon": row["icon"] or "list", "count": count}


def author_json(row, count: int = 0) -> dict:  # noqa: ANN001
    return {"id": row["id"], "name": row["name"], "bio": row["bio"], "avatar": row["avatar"], "count": count, "tg": bool(row["tg_id"])}


VISIBLE = "status = 'pub' AND pub_at <= ?"


# ---------- خواندن ----------
async def taxonomy(db, app_id: int, public: bool = True) -> tuple[list[dict], list[dict]]:  # noqa: ANN001
    t = now()
    cond = f"AND {VISIBLE}" if public else ""
    args = (app_id, t) if public else (app_id,)
    cc = {r["cat_id"]: r["n"] for r in await db.fetchall(
        f"SELECT cat_id, COUNT(*) AS n FROM mag_posts WHERE app_id = ? {cond} GROUP BY cat_id", args)}
    ac = {r["author_id"]: r["n"] for r in await db.fetchall(
        f"SELECT author_id, COUNT(*) AS n FROM mag_posts WHERE app_id = ? {cond} GROUP BY author_id", args)}
    cats = [cat_json(r, cc.get(r["id"], 0)) for r in await db.fetchall(
        "SELECT * FROM mag_cats WHERE app_id = ? ORDER BY ord, rowid", (app_id,))]
    authors = [author_json(r, ac.get(r["id"], 0)) for r in await db.fetchall(
        "SELECT * FROM mag_authors WHERE app_id = ? ORDER BY ord, rowid", (app_id,))]
    return cats, authors


async def home(db, app_id: int) -> dict:  # noqa: ANN001
    """دادهٔ خانهٔ مجله برای خواننده: دسته‌ها، نویسنده‌ها، تازه‌ها، پرخواننده‌ها."""
    t = now()
    cats, authors = await taxonomy(db, app_id)
    latest = [summary(r) for r in await db.fetchall(
        f"SELECT * FROM mag_posts WHERE app_id = ? AND {VISIBLE} ORDER BY pub_at DESC LIMIT 40", (app_id, t))]
    popular = [summary(r) for r in await db.fetchall(
        f"SELECT * FROM mag_posts WHERE app_id = ? AND {VISIBLE} AND pub_at > ? ORDER BY views DESC, pub_at DESC LIMIT 10",
        (app_id, t, t - 45 * 86400))]
    return {"cats": cats, "authors": authors, "latest": latest, "popular": popular}


async def listing(db, app_id: int, q: dict) -> dict:  # noqa: ANN001
    """فهرست مطالب منتشرشده با فیلتر دسته/برچسب/نویسنده/جستجو؛ ۲۰تا ۲۰تا."""
    where, args = [f"app_id = ? AND {VISIBLE}"], [app_id, now()]
    if q.get("cat"):
        where.append("cat_id = ?")
        args.append(str(q["cat"])[:20])
    if q.get("author"):
        where.append("author_id = ?")
        args.append(str(q["author"])[:20])
    if q.get("tag"):
        tag = clean_tags([q["tag"]])
        if tag:
            like = json.dumps(tag[0], ensure_ascii=False).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            where.append("tags LIKE ? ESCAPE '\\'")
            args.append(f"%{like}%")
    if q.get("q"):
        term = text(q["q"], 60).replace("%", "").replace("_", "")
        if term:
            where.append("(title LIKE ? OR lead LIKE ? OR body LIKE ?)")
            args += [f"%{term}%"] * 3
    try:
        offset = max(0, min(5000, int(q.get("offset") or 0)))
    except ValueError:
        offset = 0
    rows = await db.fetchall(
        f"SELECT * FROM mag_posts WHERE {' AND '.join(where)} ORDER BY pub_at DESC LIMIT 21 OFFSET {offset}", args)
    return {"posts": [summary(r) for r in rows[:20]], "more": len(rows) > 20, "offset": offset}


async def post(db, app_id: int, pid: str, count: bool = False) -> dict:  # noqa: ANN001
    if not _PID.match(pid or ""):
        raise MagError(404, "مطلب پیدا نشد")
    row = await db.fetchone(f"SELECT * FROM mag_posts WHERE app_id = ? AND id = ? AND {VISIBLE}", (app_id, pid, now()))
    if not row:
        raise MagError(404, "این مطلب پیدا نشد یا هنوز منتشر نشده")
    if count:
        await db.execute("UPDATE mag_posts SET views = views + 1 WHERE app_id = ? AND id = ?", (app_id, pid))
    return full(row)


async def title_of(db, app_id: int, pid: str) -> str | None:  # noqa: ANN001
    if not _PID.match(pid or ""):
        return None
    row = await db.fetchone(f"SELECT title FROM mag_posts WHERE app_id = ? AND id = ? AND {VISIBLE}", (app_id, pid, now()))
    return row["title"] if row else None


# ---------- صاحب مینی‌اپ (سایت و مینی‌اپ ایزی‌ساز) ----------
async def ensure_author(db, app_id: int, uid: int, name: str) -> str:  # noqa: ANN001
    """نویسندهٔ همین کاربر تلگرام؛ اگر نبود ساخته می‌شود."""
    row = await db.fetchone("SELECT id FROM mag_authors WHERE app_id = ? AND tg_id = ?", (app_id, uid))
    if row:
        return row["id"]
    aid = new_id("a")
    n = await db.fetchone("SELECT COUNT(*) AS n FROM mag_authors WHERE app_id = ?", (app_id,))
    await db.execute("INSERT INTO mag_authors(app_id, id, name, tg_id, ord) VALUES (?,?,?,?,?)",
                     (app_id, aid, text(name, 40) or "نویسنده", uid, n["n"]))
    return aid


async def seed(db, app_id: int, uid: int, name: str) -> None:  # noqa: ANN001
    """مجلهٔ تازه: سه دسته، نویسندهٔ صاحب مینی‌اپ و یک مطلب خوش‌آمد."""
    have = await db.fetchone("SELECT COUNT(*) AS n FROM mag_cats WHERE app_id = ?", (app_id,))
    if have["n"]:
        return
    cids = []
    for i, (cname, color, icon) in enumerate(DEFAULT_CATS):
        cid = new_id("c")
        cids.append(cid)
        await db.execute("INSERT INTO mag_cats(app_id, id, name, color, icon, ord) VALUES (?,?,?,?,?,?)",
                         (app_id, cid, cname, color, icon, i))
    aid = await ensure_author(db, app_id, uid, name)
    body = [
        {"t": "p", "text": "این اولین مطلب مجلهٔ توست. از سایت ایزی‌ساز یا داخل تلگرام مطلب تازه بنویس؛ "
                          "متن، تیتر، عکس، صوت، ویدیو، لینک و دکمه."},
        {"t": "h", "text": "هر مطلب، یک لینک"},
        {"t": "p", "text": "از هر مطلب یک پست آماده برای کانال بساز. دکمهٔ «ادامه در مینی‌اپ» همین مطلب را مستقیم باز می‌کند."},
    ]
    await save_post(db, app_id, uid, {"title": "به مجلهٔ ما خوش آمدی", "lead": "یک مطلب نمونه؛ ویرایشش کن یا پاکش کن.",
                                      "body": body, "cat": cids[0], "author": aid, "tags": ["شروع"], "status": "pub"},
                    source="site", owner_name=name)


async def owner_data(db, app_id: int) -> dict:  # noqa: ANN001
    cats, authors = await taxonomy(db, app_id, public=False)
    rows = await db.fetchall("SELECT * FROM mag_posts WHERE app_id = ? ORDER BY COALESCE(pub_at, updated_at) DESC LIMIT 500", (app_id,))
    posts = [owner_row(r) for r in rows]
    t = now()
    counts = {"all": len(posts), "pub": sum(1 for p in posts if p["state"] == "pub"),
              "draft": sum(1 for p in posts if p["state"] == "draft"), "sched": sum(1 for p in posts if p["state"] == "sched")}
    views = await db.fetchone("SELECT COALESCE(SUM(views), 0) AS v FROM mag_posts WHERE app_id = ?", (app_id,))
    tg = sum(1 for p in posts if p["source"] == "tg")
    tags: dict[str, int] = {}
    for p in posts:
        for tag in p["tags"]:
            tags[tag] = tags.get(tag, 0) + 1
    return {"cats": cats, "authors": authors, "posts": posts, "counts": counts,
            "tags": sorted(([k, v] for k, v in tags.items()), key=lambda x: -x[1])[:60],
            "views": views["v"], "from_tg": tg, "now": t}


async def get_owned_post(db, app_id: int, pid: Any):  # noqa: ANN001, ANN201
    if not _PID.match(str(pid or "")):
        raise MagError(404, "مطلب پیدا نشد")
    row = await db.fetchone("SELECT * FROM mag_posts WHERE app_id = ? AND id = ?", (app_id, pid))
    if not row:
        raise MagError(404, "مطلب پیدا نشد")
    return row


async def save_post(db, app_id: int, uid: int, body: dict, source: str, owner_name: str = "") -> dict:  # noqa: ANN001
    t = now()
    pid = str(body.get("id") or "")
    row = await get_owned_post(db, app_id, pid) if pid else None
    title = text(body.get("title"), 140)
    if not title:
        raise MagError(400, "تیتر مطلب را بنویس")
    content = clean_body(body.get("body"))
    lead = text(body.get("lead"), 300)
    cover = blocks.clean_url(body.get("cover"), images=True)
    cat = str(body.get("cat") or "")
    if cat and not await db.fetchone("SELECT 1 FROM mag_cats WHERE app_id = ? AND id = ?", (app_id, cat)):
        cat = ""
    author = str(body.get("author") or "")
    if not author or not await db.fetchone("SELECT 1 FROM mag_authors WHERE app_id = ? AND id = ?", (app_id, author)):
        author = row["author_id"] if row else await ensure_author(db, app_id, uid, owner_name or "نویسنده")
    status = "pub" if body.get("status") in ("pub", "sched") else "draft"
    pub_at = None
    if status == "pub":
        try:
            want = int(body.get("pub_at") or 0)
        except (TypeError, ValueError):
            want = 0
        if body.get("status") == "sched" and want > t:
            pub_at = min(want, t + 365 * 86400)
        else:  # انتشار دوباره، تاریخ اول را نگه می‌دارد
            pub_at = row["pub_at"] if row and row["status"] == "pub" and row["pub_at"] and row["pub_at"] <= t else t
    words = words_of(title, lead, content)
    data = (title, lead, cover, json.dumps(content, ensure_ascii=False), cat,
            json.dumps(clean_tags(body.get("tags")), ensure_ascii=False), author, status, pub_at, words, t)
    if row:
        await db.execute(
            "UPDATE mag_posts SET title=?, lead=?, cover=?, body=?, cat_id=?, tags=?, author_id=?, status=?, pub_at=?, words=?, updated_at=? "
            "WHERE app_id = ? AND id = ?", data + (app_id, pid))
    else:
        n = await db.fetchone("SELECT COUNT(*) AS n FROM mag_posts WHERE app_id = ?", (app_id,))
        if n["n"] >= MAX_POSTS:
            raise MagError(402, f"هر مجله حداکثر {MAX_POSTS} مطلب دارد")
        pid = new_id("p")
        await db.execute(
            "INSERT INTO mag_posts(title, lead, cover, body, cat_id, tags, author_id, status, pub_at, words, updated_at, "
            "app_id, id, source, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            data + (app_id, pid, "tg" if source == "tg" else "site", t))
    row = await get_owned_post(db, app_id, pid)
    return dict(owner_row(row), body=_loads(row["body"], []))


async def delete_post(db, app_id: int, pid: Any) -> None:  # noqa: ANN001
    await get_owned_post(db, app_id, pid)
    await db.execute("DELETE FROM mag_posts WHERE app_id = ? AND id = ?", (app_id, pid))


async def save_cat(db, app_id: int, body: dict) -> dict:  # noqa: ANN001
    name = text(body.get("name"), 30)
    if not name:
        raise MagError(400, "اسم دسته را بنویس")
    color = body.get("color") if body.get("color") in COLORS else COLORS[0]
    icon = body.get("icon") if body.get("icon") in CAT_ICONS else "list"
    cid = str(body.get("id") or "")
    if cid:
        if not await db.execute("UPDATE mag_cats SET name=?, color=?, icon=? WHERE app_id = ? AND id = ?",
                                (name, color, icon, app_id, cid)):
            raise MagError(404, "دسته پیدا نشد")
    else:
        n = await db.fetchone("SELECT COUNT(*) AS n FROM mag_cats WHERE app_id = ?", (app_id,))
        if n["n"] >= MAX_CATS:
            raise MagError(400, f"حداکثر {MAX_CATS} دسته")
        cid = new_id("c")
        await db.execute("INSERT INTO mag_cats(app_id, id, name, color, icon, ord) VALUES (?,?,?,?,?,?)",
                         (app_id, cid, name, color, icon, n["n"]))
    return {"id": cid}


async def delete_cat(db, app_id: int, cid: Any) -> None:  # noqa: ANN001
    if not await db.execute("DELETE FROM mag_cats WHERE app_id = ? AND id = ?", (app_id, str(cid or ""))):
        raise MagError(404, "دسته پیدا نشد")
    await db.execute("UPDATE mag_posts SET cat_id = '' WHERE app_id = ? AND cat_id = ?", (app_id, str(cid)))


async def order(db, app_id: int, table: str, ids: Any) -> None:  # noqa: ANN001
    assert table in ("mag_cats", "mag_authors")
    for i, x in enumerate(ids if isinstance(ids, list) else []):
        await db.execute(f"UPDATE {table} SET ord = ? WHERE app_id = ? AND id = ?", (i, app_id, str(x)))


async def save_author(db, app_id: int, body: dict) -> dict:  # noqa: ANN001
    name = text(body.get("name"), 40)
    if not name:
        raise MagError(400, "اسم نویسنده را بنویس")
    bio = text(body.get("bio"), 120)
    avatar = blocks.clean_url(body.get("avatar"), images=True)
    aid = str(body.get("id") or "")
    if aid:
        if not await db.execute("UPDATE mag_authors SET name=?, bio=?, avatar=? WHERE app_id = ? AND id = ?",
                                (name, bio, avatar, app_id, aid)):
            raise MagError(404, "نویسنده پیدا نشد")
    else:
        n = await db.fetchone("SELECT COUNT(*) AS n FROM mag_authors WHERE app_id = ?", (app_id,))
        if n["n"] >= MAX_AUTHORS:
            raise MagError(400, f"حداکثر {MAX_AUTHORS} نویسنده")
        aid = new_id("a")
        await db.execute("INSERT INTO mag_authors(app_id, id, name, bio, avatar, ord) VALUES (?,?,?,?,?,?)",
                         (app_id, aid, name, bio, avatar, n["n"]))
    return {"id": aid}


async def delete_author(db, app_id: int, aid: Any) -> None:  # noqa: ANN001
    used = await db.fetchone("SELECT COUNT(*) AS n FROM mag_posts WHERE app_id = ? AND author_id = ?", (app_id, str(aid or "")))
    if used["n"]:
        raise MagError(400, f"این نویسنده {used['n']} مطلب دارد؛ اول مطلب‌هایش را به نویسندهٔ دیگری بده")
    if not await db.execute("DELETE FROM mag_authors WHERE app_id = ? AND id = ?", (app_id, str(aid or ""))):
        raise MagError(404, "نویسنده پیدا نشد")


# ---------- قلاب‌های کیت ----------
def public_view(doc: dict) -> dict:
    return doc


async def on_publish(db, app, doc: dict) -> dict:  # noqa: ANN001
    return {}


TABLES = ("mag_posts", "mag_cats", "mag_authors")


async def on_remove(db, app_id: int) -> None:  # noqa: ANN001
    for table in TABLES:
        await db.execute(f"DELETE FROM {table} WHERE app_id = ?", (app_id,))
