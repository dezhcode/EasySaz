"""جدول‌ها و دادهٔ ربات‌ساز: سند (پیش‌نویس/منتشرشده)، کاربرهای ربات و متغیرهایشان،
متغیرهای کل ربات، ایموجی‌های پریمیوم و نگاشت پیام‌های پشتیبانی."""
from __future__ import annotations

import json
import time
from typing import Any

from . import schema

SCHEMA = """
CREATE TABLE IF NOT EXISTS bk_flows (
  app_id INTEGER PRIMARY KEY,
  draft TEXT NOT NULL,
  published TEXT,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE TABLE IF NOT EXISTS bk_users (
  app_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  first_name TEXT,
  username TEXT,
  vars TEXT NOT NULL DEFAULT '{}',
  state TEXT NOT NULL DEFAULT '{}',     -- {"wait": {...}, "last": پیام آخر}
  test INTEGER NOT NULL DEFAULT 0,      -- صاحب ربات در حال تست پیش‌نویس
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (app_id, tg_id)
);
CREATE INDEX IF NOT EXISTS idx_bk_users_seen ON bk_users(app_id, last_seen);
CREATE TABLE IF NOT EXISTS bk_globals (
  app_id INTEGER PRIMARY KEY,
  vars TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS bk_emoji (
  app_id INTEGER NOT NULL,
  emoji_id TEXT NOT NULL,
  alt TEXT NOT NULL,
  pack TEXT NOT NULL DEFAULT '',
  added_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, emoji_id)
);
CREATE TABLE IF NOT EXISTS bk_support (
  app_id INTEGER NOT NULL,
  admin_msg INTEGER NOT NULL,           -- پیام کپی‌شده در چت صاحب ربات
  tg_id INTEGER NOT NULL,               -- کاربری که پیام داده
  created_at INTEGER NOT NULL,
  PRIMARY KEY (app_id, admin_msg)
);
CREATE TABLE IF NOT EXISTS bk_payments (
  app_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  charge_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
"""

MAX_EMOJI = 300


def now() -> int:
    return int(time.time())


def _loads(raw: str | None, default: Any) -> Any:
    try:
        v = json.loads(raw) if raw else default
    except (ValueError, TypeError):
        return default
    return v if isinstance(v, type(default)) else default


def _dumps(v: Any) -> str:
    return json.dumps(v, ensure_ascii=False, separators=(",", ":"))


# ---------------------------------------------------------------- سند
async def flow_row(db, app_id: int):  # noqa: ANN001, ANN201
    return await db.fetchone("SELECT * FROM bk_flows WHERE app_id = ?", (app_id,))


async def load(db, app_id: int, published: bool = False) -> dict | None:  # noqa: ANN001
    row = await flow_row(db, app_id)
    if row is None:
        return None
    raw = row["published"] if published else row["draft"]
    if not raw:
        return None
    try:
        return schema.clean_doc(json.loads(raw))
    except (ValueError, schema.BotDocError):
        return None


async def save_draft(db, app_id: int, doc: dict) -> None:  # noqa: ANN001
    await db.execute(
        "INSERT INTO bk_flows(app_id, draft, updated_at) VALUES (?,?,?) "
        "ON CONFLICT(app_id) DO UPDATE SET draft = excluded.draft, updated_at = excluded.updated_at",
        (app_id, _dumps(doc), now()))


async def publish(db, app_id: int, doc: dict) -> None:  # noqa: ANN001
    raw = _dumps(doc)
    t = now()
    await db.execute(
        "INSERT INTO bk_flows(app_id, draft, published, updated_at, published_at) VALUES (?,?,?,?,?) "
        "ON CONFLICT(app_id) DO UPDATE SET draft = excluded.draft, published = excluded.published, "
        "updated_at = excluded.updated_at, published_at = excluded.published_at",
        (app_id, raw, raw, t, t))


async def unpublish(db, app_id: int) -> None:  # noqa: ANN001
    """ربات‌ساز خاموش: ربات به رفتار ساده (خوش‌آمد + دکمهٔ مینی‌اپ) برمی‌گردد."""
    await db.execute("UPDATE bk_flows SET published = NULL, published_at = NULL WHERE app_id = ?", (app_id,))


# ---------------------------------------------------------------- کاربرها
async def touch_user(db, app_id: int, user) -> dict:  # noqa: ANN001
    t = now()
    await db.execute(
        "INSERT INTO bk_users(app_id, tg_id, first_name, username, first_seen, last_seen) VALUES (?,?,?,?,?,?) "
        "ON CONFLICT(app_id, tg_id) DO UPDATE SET first_name = excluded.first_name, username = excluded.username, "
        "last_seen = excluded.last_seen",
        (app_id, user.id, (user.first_name or "")[:64], (user.username or "")[:64], t, t))
    return await get_user(db, app_id, user.id)


async def get_user(db, app_id: int, tg_id: int) -> dict:  # noqa: ANN001
    row = await db.fetchone("SELECT * FROM bk_users WHERE app_id = ? AND tg_id = ?", (app_id, tg_id))
    if row is None:
        return {"tg_id": tg_id, "first_name": "", "username": "", "vars": {}, "state": {}, "test": 0}
    return {"tg_id": tg_id, "first_name": row["first_name"] or "", "username": row["username"] or "",
            "vars": _loads(row["vars"], {}), "state": _loads(row["state"], {}), "test": row["test"]}


async def set_user(db, app_id: int, tg_id: int, *, vars: dict | None = None, state: dict | None = None,  # noqa: A002
                   test: int | None = None) -> None:
    t = now()
    await db.execute(
        "INSERT OR IGNORE INTO bk_users(app_id, tg_id, first_seen, last_seen) VALUES (?,?,?,?)", (app_id, tg_id, t, t))
    sets, params = [], []
    if vars is not None:
        sets.append("vars = ?")
        params.append(_dumps(vars))
    if state is not None:
        sets.append("state = ?")
        params.append(_dumps(state))
    if test is not None:
        sets.append("test = ?")
        params.append(int(test))
    if sets:
        await db.execute(f"UPDATE bk_users SET {', '.join(sets)} WHERE app_id = ? AND tg_id = ?", (*params, app_id, tg_id))


async def get_globals(db, app_id: int) -> dict:  # noqa: ANN001
    row = await db.fetchone("SELECT vars FROM bk_globals WHERE app_id = ?", (app_id,))
    return _loads(row["vars"] if row else None, {})


async def set_globals(db, app_id: int, vars: dict) -> None:  # noqa: ANN001, A002
    await db.execute(
        "INSERT INTO bk_globals(app_id, vars) VALUES (?,?) ON CONFLICT(app_id) DO UPDATE SET vars = excluded.vars",
        (app_id, _dumps(vars)))


async def stats(db, app_id: int) -> dict:  # noqa: ANN001
    day0 = now() - now() % 86400
    row = await db.fetchone(
        "SELECT COUNT(*) AS n, SUM(CASE WHEN last_seen >= ? THEN 1 ELSE 0 END) AS today FROM bk_users WHERE app_id = ? AND test = 0",
        (day0, app_id))
    return {"users": (row["n"] if row else 0) or 0, "today": (row["today"] if row else 0) or 0}


# ---------------------------------------------------------------- ایموجی پریمیوم
async def emoji_list(db, app_id: int) -> list[dict]:  # noqa: ANN001
    rows = await db.fetchall("SELECT emoji_id, alt, pack FROM bk_emoji WHERE app_id = ? ORDER BY added_at, rowid", (app_id,))
    return [{"id": r["emoji_id"], "alt": r["alt"], "pack": r["pack"]} for r in rows]


async def emoji_add(db, app_id: int, items: list[tuple[str, str]], pack: str = "") -> int:  # noqa: ANN001
    """(شناسه، ایموجی معمولی) ها را اضافه می‌کند؛ تعداد تازه‌ها را برمی‌گرداند."""
    have = {e["id"] for e in await emoji_list(db, app_id)}
    added = 0
    t = now()
    for eid, alt in items:
        if not schema.EMOJI_ID_RE.match(str(eid)) or eid in have or len(have) >= MAX_EMOJI:
            continue
        await db.execute("INSERT OR IGNORE INTO bk_emoji(app_id, emoji_id, alt, pack, added_at) VALUES (?,?,?,?,?)",
                         (app_id, eid, (alt or "⭐")[:8], pack[:64], t))
        have.add(eid)
        added += 1
    return added


async def emoji_remove(db, app_id: int, emoji_id: str) -> None:  # noqa: ANN001
    await db.execute("DELETE FROM bk_emoji WHERE app_id = ? AND emoji_id = ?", (app_id, emoji_id))


async def remove_all(db, app_id: int) -> None:  # noqa: ANN001
    for t in ("bk_flows", "bk_users", "bk_globals", "bk_emoji", "bk_support"):
        await db.execute(f"DELETE FROM {t} WHERE app_id = ?", (app_id,))
