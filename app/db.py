"""لایه دیتابیس (SQLite با WAL).

یک اتصال aiosqlite روی همان event loop ربات. زمان ها به ثانیه یونیکس
ذخیره می شوند تا مقایسه ساده و بدون دردسر منطقه زمانی باشد.
"""
from __future__ import annotations

import json
import logging
import os
import secrets
import time
from typing import Any, Iterable

import aiosqlite

from . import blocks, plans

log = logging.getLogger("easysaz.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  tg_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  lang TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_until INTEGER,             -- NULL برای رایگان؛ بعد از این زمان به رایگان برمی گردد
  is_blocked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(tg_id),
  slug TEXT NOT NULL UNIQUE,      -- بخش آخر آدرس عمومی: /a/<slug>
  name TEXT NOT NULL,
  draft TEXT NOT NULL,            -- سند صفحه در حال ویرایش
  published TEXT,                 -- سندی که بازدیدکننده ها می بینند
  status TEXT NOT NULL DEFAULT 'active',   -- active | paused
  bot_id INTEGER UNIQUE,          -- ربات مشتری وصل شده (یک ربات فقط به یک اپ)
  bot_username TEXT,
  bot_name TEXT,
  bot_token_enc TEXT,             -- توکن رمزنگاری شده با TOKEN_KEY
  mode TEXT NOT NULL DEFAULT 'none',       -- none | menu | full
  welcome TEXT,                   -- پیام /start ربات مشتری در حالت full
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_apps_owner ON apps(owner_id);

CREATE TABLE IF NOT EXISTS visitors (
  app_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  visits INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (app_id, tg_id)
);

CREATE TABLE IF NOT EXISTS views_daily (
  app_id INTEGER NOT NULL,
  day TEXT NOT NULL,              -- YYYY-MM-DD (UTC)
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, day)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  stars INTEGER NOT NULL,
  charge_id TEXT NOT NULL UNIQUE, -- telegram_payment_charge_id: ضد ثبت تکراری
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  name TEXT PRIMARY KEY,          -- <sha256[:24]>.<ext>؛ فایل در UPLOAD_DIR
  owner_id INTEGER NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_owner ON uploads(owner_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fsm_state (
  key TEXT PRIMARY KEY,
  state TEXT,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);
"""

# ستون‌هایی که بعد از نسخهٔ اول اضافه شدند (دیتابیس قدیمی را بی‌خطر به‌روز می‌کنند)
MIGRATIONS = [
    # کانال مینی‌اپ: قفل «فقط اعضا» و اعلام فصل تازه (ربات مشتری باید ادمینش باشد)
    "ALTER TABLE apps ADD COLUMN channel_id INTEGER",
    "ALTER TABLE apps ADD COLUMN channel_username TEXT",
    "ALTER TABLE apps ADD COLUMN channel_title TEXT",
]

_SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"  # بدون l/o/0/1 که با هم قاطی می شوند


def now() -> int:
    return int(time.time())


def today() -> str:
    return time.strftime("%Y-%m-%d", time.gmtime())


def _slug() -> str:
    return "".join(secrets.choice(_SLUG_ALPHABET) for _ in range(8))


def effective_plan(user: Any) -> plans.Plan:
    """پلن واقعی کاربر با در نظر گرفتن انقضا."""
    if user is None:
        return plans.get(None)
    key = user["plan"]
    until = user["plan_until"]
    if key != plans.DEFAULT_PLAN and until is not None and until < now():
        return plans.get(None)
    return plans.get(key)


class Database:
    def __init__(self, path: str) -> None:
        self.path = path
        self.conn: aiosqlite.Connection | None = None

    # ---------- اتصال ----------
    async def connect(self) -> None:
        os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
        self.conn = await aiosqlite.connect(self.path, timeout=15)
        self.conn.row_factory = aiosqlite.Row
        # WAL: خواندن و نوشتن همزمان از چند پروسه پسنجر بدون قفل کامل
        await self.conn.execute("PRAGMA journal_mode=WAL")
        await self.conn.execute("PRAGMA busy_timeout=10000")
        await self.conn.execute("PRAGMA foreign_keys=ON")
        await self.conn.executescript(SCHEMA)
        from . import kits

        await self.conn.executescript(kits.SCHEMA)
        for sql in MIGRATIONS:
            try:
                await self.conn.execute(sql)
            except aiosqlite.OperationalError as exc:  # ستون از قبل هست
                if "duplicate column" not in str(exc):
                    raise
        await self.conn.commit()

    async def close(self) -> None:
        if self.conn is not None:
            await self.conn.close()
            self.conn = None

    # ---------- ابزار ----------
    async def execute(self, sql: str, params: Iterable[Any] = ()) -> int:
        assert self.conn is not None
        cur = await self.conn.execute(sql, tuple(params))
        await self.conn.commit()
        return cur.rowcount

    async def insert(self, sql: str, params: Iterable[Any] = ()) -> int:
        assert self.conn is not None
        cur = await self.conn.execute(sql, tuple(params))
        await self.conn.commit()
        return cur.lastrowid or 0

    async def fetchone(self, sql: str, params: Iterable[Any] = ()) -> aiosqlite.Row | None:
        assert self.conn is not None
        async with self.conn.execute(sql, tuple(params)) as cur:
            return await cur.fetchone()

    async def fetchall(self, sql: str, params: Iterable[Any] = ()) -> list[aiosqlite.Row]:
        assert self.conn is not None
        async with self.conn.execute(sql, tuple(params)) as cur:
            return list(await cur.fetchall())

    # ---------- کاربران ----------
    async def upsert_user(self, tg_id: int, username: str | None, first_name: str | None, lang: str | None) -> None:
        t = now()
        await self.execute(
            "INSERT INTO users(tg_id, username, first_name, lang, created_at, last_seen) "
            "VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(tg_id) DO UPDATE SET username = excluded.username, "
            "first_name = excluded.first_name, lang = excluded.lang, last_seen = excluded.last_seen",
            (tg_id, username, first_name, lang, t, t),
        )

    async def get_user(self, tg_id: int) -> aiosqlite.Row | None:
        return await self.fetchone("SELECT * FROM users WHERE tg_id = ?", (tg_id,))

    async def user_plan(self, tg_id: int) -> plans.Plan:
        return effective_plan(await self.get_user(tg_id))

    async def set_plan(self, tg_id: int, plan_key: str, until: int | None) -> None:
        await self.execute(
            "UPDATE users SET plan = ?, plan_until = ? WHERE tg_id = ?", (plan_key, until, tg_id)
        )

    async def extend_plan(self, tg_id: int, plan_key: str, days: int) -> int:
        """تمدید پلن. اگر همان پلن هنوز فعال است، روزها به انتهایش اضافه می شود."""
        user = await self.get_user(tg_id)
        start = now()
        if user and user["plan"] == plan_key and (user["plan_until"] or 0) > start:
            start = user["plan_until"]
        until = start + days * 86400
        await self.set_plan(tg_id, plan_key, until)
        return until

    async def set_blocked(self, tg_id: int, blocked: bool) -> None:
        await self.execute("UPDATE users SET is_blocked = ? WHERE tg_id = ?", (int(blocked), tg_id))

    # ---------- مینی اپ ها ----------
    async def count_apps(self, owner_id: int) -> int:
        row = await self.fetchone("SELECT COUNT(*) AS n FROM apps WHERE owner_id = ?", (owner_id,))
        return int(row["n"]) if row else 0

    async def list_apps(self, owner_id: int) -> list[aiosqlite.Row]:
        return await self.fetchall("SELECT * FROM apps WHERE owner_id = ? ORDER BY id", (owner_id,))

    async def get_app(self, app_id: int) -> aiosqlite.Row | None:
        return await self.fetchone("SELECT * FROM apps WHERE id = ?", (app_id,))

    async def get_owned_app(self, owner_id: int, app_id: int) -> aiosqlite.Row | None:
        return await self.fetchone(
            "SELECT * FROM apps WHERE id = ? AND owner_id = ?", (app_id, owner_id)
        )

    async def get_app_by_slug(self, slug: str) -> aiosqlite.Row | None:
        return await self.fetchone("SELECT * FROM apps WHERE slug = ?", (slug,))

    async def get_app_by_bot(self, bot_id: int) -> aiosqlite.Row | None:
        return await self.fetchone("SELECT * FROM apps WHERE bot_id = ?", (bot_id,))

    async def create_app(self, owner_id: int, name: str, max_apps: int) -> int | None:
        """ساخت اپ با رعایت سقف پلن، به صورت اتمیک.

        شرط شمارش داخل همان INSERT است؛ دو درخواست همزمان (دابل تپ روی
        «ساخت») نمی توانند هر دو از سقف رد شوند. None یعنی سقف پر است.
        """
        doc = json.dumps(blocks.empty_page(), ensure_ascii=False)
        t = now()
        for _ in range(5):  # برخورد slug تقریبا غیرممکن است، ولی بی خطر
            try:
                assert self.conn is not None
                cur = await self.conn.execute(
                    "INSERT INTO apps(owner_id, slug, name, draft, published, created_at, updated_at) "
                    "SELECT ?, ?, ?, ?, ?, ?, ? "
                    "WHERE (SELECT COUNT(*) FROM apps WHERE owner_id = ?) < ?",
                    (owner_id, _slug(), name, doc, doc, t, t, owner_id, max_apps),
                )
                await self.conn.commit()
                return cur.lastrowid if cur.rowcount else None
            except aiosqlite.IntegrityError as exc:
                if "slug" not in str(exc):
                    raise
        raise RuntimeError("could not allocate slug")

    async def rename_app(self, app_id: int, name: str) -> None:
        await self.execute(
            "UPDATE apps SET name = ?, updated_at = ? WHERE id = ?", (name, now(), app_id)
        )

    async def save_draft(self, app_id: int, doc: dict) -> None:
        await self.execute(
            "UPDATE apps SET draft = ?, updated_at = ? WHERE id = ?",
            (json.dumps(doc, ensure_ascii=False), now(), app_id),
        )

    async def publish(self, app_id: int, doc: dict) -> None:
        raw = json.dumps(doc, ensure_ascii=False)
        t = now()
        await self.execute(
            "UPDATE apps SET draft = ?, published = ?, updated_at = ?, published_at = ? WHERE id = ?",
            (raw, raw, t, t, app_id),
        )

    async def set_status(self, app_id: int, status: str) -> None:
        await self.execute(
            "UPDATE apps SET status = ?, updated_at = ? WHERE id = ?", (status, now(), app_id)
        )

    async def set_channel(self, app_id: int, chat_id: int | None, username: str | None, title: str | None) -> None:
        await self.execute(
            "UPDATE apps SET channel_id = ?, channel_username = ?, channel_title = ?, updated_at = ? WHERE id = ?",
            (chat_id, username, title, now(), app_id),
        )

    async def delete_app(self, app_id: int) -> None:
        from app import kits

        await kits.remove(self, app_id)
        await self.execute("DELETE FROM visitors WHERE app_id = ?", (app_id,))
        await self.execute("DELETE FROM views_daily WHERE app_id = ?", (app_id,))
        await self.execute("DELETE FROM apps WHERE id = ?", (app_id,))

    # ---------- ربات مشتری ----------
    async def attach_bot(
        self, app_id: int, bot_id: int, username: str, name: str, token_enc: str
    ) -> bool:
        """وصل کردن ربات. False یعنی این ربات به اپ دیگری وصل است."""
        try:
            await self.execute(
                "UPDATE apps SET bot_id = ?, bot_username = ?, bot_name = ?, bot_token_enc = ?, "
                "mode = 'none', updated_at = ? WHERE id = ?",
                (bot_id, username, name, token_enc, now(), app_id),
            )
            return True
        except aiosqlite.IntegrityError:
            return False

    async def detach_bot(self, app_id: int) -> None:
        await self.execute(
            "UPDATE apps SET bot_id = NULL, bot_username = NULL, bot_name = NULL, "
            "bot_token_enc = NULL, mode = 'none', updated_at = ? WHERE id = ?",
            (now(), app_id),
        )

    async def set_mode(self, app_id: int, mode: str) -> None:
        await self.execute(
            "UPDATE apps SET mode = ?, updated_at = ? WHERE id = ?", (mode, now(), app_id)
        )

    async def set_welcome(self, app_id: int, text: str | None) -> None:
        await self.execute(
            "UPDATE apps SET welcome = ?, updated_at = ? WHERE id = ?", (text, now(), app_id)
        )

    # ---------- آمار ----------
    async def record_view(self, app_id: int, tg_id: int | None) -> None:
        t = now()
        await self.execute(
            "INSERT INTO views_daily(app_id, day, views) VALUES (?, ?, 1) "
            "ON CONFLICT(app_id, day) DO UPDATE SET views = views + 1",
            (app_id, today()),
        )
        if tg_id:
            await self.execute(
                "INSERT INTO visitors(app_id, tg_id, first_seen, last_seen) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(app_id, tg_id) DO UPDATE SET last_seen = excluded.last_seen, "
                "visits = visits + 1",
                (app_id, tg_id, t, t),
            )

    async def app_stats(self, app_id: int) -> dict:
        users = await self.fetchone(
            "SELECT COUNT(*) AS n FROM visitors WHERE app_id = ?", (app_id,)
        )
        day = await self.fetchone(
            "SELECT views FROM views_daily WHERE app_id = ? AND day = ?", (app_id, today())
        )
        week_start = time.strftime("%Y-%m-%d", time.gmtime(now() - 6 * 86400))
        week = await self.fetchone(
            "SELECT COALESCE(SUM(views), 0) AS n FROM views_daily WHERE app_id = ? AND day >= ?",
            (app_id, week_start),
        )
        return {
            "visitors": int(users["n"]) if users else 0,
            "views_today": int(day["views"]) if day else 0,
            "views_week": int(week["n"]) if week else 0,
        }

    async def global_stats(self) -> dict:
        async def one(sql: str) -> int:
            row = await self.fetchone(sql)
            return int(row[0]) if row else 0

        return {
            "users": await one("SELECT COUNT(*) FROM users"),
            "apps": await one("SELECT COUNT(*) FROM apps"),
            "bots": await one("SELECT COUNT(*) FROM apps WHERE bot_id IS NOT NULL"),
            "full": await one("SELECT COUNT(*) FROM apps WHERE mode = 'full'"),
            "paid": await one(
                f"SELECT COUNT(*) FROM users WHERE plan != 'free' AND plan_until > {now()}"
            ),
        }

    # ---------- پرداخت ----------
    async def record_payment(self, tg_id: int, plan_key: str, stars: int, charge_id: str) -> bool:
        """ثبت پرداخت. False یعنی این پرداخت قبلا ثبت شده (آپدیت تکراری)."""
        try:
            await self.insert(
                "INSERT INTO payments(tg_id, plan, stars, charge_id, created_at) VALUES (?, ?, ?, ?, ?)",
                (tg_id, plan_key, stars, charge_id, now()),
            )
            return True
        except aiosqlite.IntegrityError:
            return False

    # ---------- آپلود ----------
    async def record_upload(self, name: str, owner_id: int, size: int) -> None:
        await self.execute(
            "INSERT OR IGNORE INTO uploads(name, owner_id, size, created_at) VALUES (?, ?, ?, ?)",
            (name, owner_id, size, now()),
        )

    async def upload_usage(self, owner_id: int) -> tuple[int, int]:
        row = await self.fetchone(
            "SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS b FROM uploads WHERE owner_id = ?", (owner_id,)
        )
        return (int(row["n"]), int(row["b"])) if row else (0, 0)

    # ---------- تنظیمات ----------
    async def get_setting(self, key: str, default: str | None = None) -> str | None:
        row = await self.fetchone("SELECT value FROM settings WHERE key = ?", (key,))
        return row["value"] if row else default

    async def set_setting(self, key: str, value: str) -> None:
        await self.execute(
            "INSERT INTO settings(key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )


def load_doc(raw: str | None) -> dict:
    if not raw:
        return blocks.empty_page()
    try:
        doc = json.loads(raw)
    except (ValueError, TypeError):
        return blocks.empty_page()
    return blocks.upgrade(doc) if isinstance(doc, dict) else blocks.empty_page()
