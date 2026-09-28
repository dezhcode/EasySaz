"""API شب‌نوشت.

خواننده (/api/page/<slug>/<کار>): هویت از initData امضاشده با توکن ربات همان
مینی‌اپ است (مثل ثبت بازدید). بدون initData معتبر فقط متن فصل‌های آزاد
داده می‌شود؛ جای خواندن و نشان‌ها در این حالت فقط در گوشی می‌ماند.

صاحب مینی‌اپ (/api/kit/shab/<کار>): با initData ربات اصلی و مالکیت اپ،
مثل بقیهٔ پنل (Api._owner و Api._owned).

عضویت کانال با getChatMember ربات مشتری سنجیده می‌شود؛ ربات باید ادمین
کانال باشد (هنگام ثبت کانال چک می‌شود). جواب «عضو است» ۱۰ دقیقه و «نیست»
۴۵ ثانیه کش می‌شود تا کسی که تازه عضو شده زود برسد.
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from typing import Any

from aiogram.exceptions import TelegramAPIError, TelegramForbiddenError, TelegramRetryAfter
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from app import secure
from app.config import config
from app.webapp.api import ApiError, _rate_ok
from app.webapp.auth import AuthError, WebAppUser, verify

from . import teaser

log = logging.getLogger("easysaz.shab")


_CH_ID = re.compile(r"^c[a-z0-9]{5,15}$")
_MEMBER: dict[tuple[int, int], tuple[bool, float]] = {}
_SENDING: set[int] = set()


def _cid(value: Any) -> str:
    v = str(value or "")
    if not _CH_ID.match(v):
        raise ApiError(400, "فصل نامعتبر")
    return v


class ShabApi:
    READER = ("chapter", "me", "progress", "mark", "notify")
    OWNER = ("channel", "stats", "announce")

    def __init__(self, db, clients, api) -> None:  # noqa: ANN001
        self.db = db
        self.clients = clients
        self.api = api  # Api پنل: برای _owner و _owned

    # ---------- خواننده ----------
    async def _app(self, slug: str):  # noqa: ANN202
        app = await self.db.get_app_by_slug(slug)
        if not app or app["status"] != "active":
            raise ApiError(404, "این مینی اپ در دسترس نیست")
        return app

    def _reader(self, app, init_data: str, required: bool = True) -> WebAppUser | None:  # noqa: ANN001
        token = secure.decrypt_token(app["bot_token_enc"]) if app["bot_token_enc"] else ""
        if token and init_data:
            try:
                return verify(init_data, token)
            except AuthError:
                pass
        if required:
            raise ApiError(401, "مینی اپ را از داخل ربات باز کن")
        return None

    async def _touch(self, app, user: WebAppUser) -> None:  # noqa: ANN001
        t = int(time.time())
        await self.db.execute(
            "INSERT INTO shab_readers(app_id, tg_id, first_name, username, first_seen, last_seen) VALUES (?,?,?,?,?,?) "
            "ON CONFLICT(app_id, tg_id) DO UPDATE SET first_name=excluded.first_name, username=excluded.username, last_seen=excluded.last_seen",
            (app["id"], user.id, user.first_name[:64], user.username[:64], t, t),
        )

    async def is_member(self, app, uid: int, fresh: bool = False) -> bool:  # noqa: ANN001
        if uid == app["owner_id"]:
            return True
        chat = app["channel_id"]
        bot = self.clients.for_app(app)
        if not chat or bot is None:
            return False
        key = (app["id"], uid)
        hit = _MEMBER.get(key)
        if hit and time.time() - hit[1] < (600 if hit[0] else (5 if fresh else 45)):
            return hit[0]
        try:
            m = await bot.get_chat_member(chat, uid)
            ok = m.status in ("creator", "administrator", "member") or (m.status == "restricted" and bool(getattr(m, "is_member", False)))
        except TelegramAPIError as exc:
            log.info("membership check failed app=%s: %s", app["id"], exc)
            ok = False
        _MEMBER[key] = (ok, time.time())
        if len(_MEMBER) > 20000:
            _MEMBER.clear()
        return ok

    def _join_url(self, app, row) -> str:  # noqa: ANN001
        if app["channel_username"]:
            return f"https://t.me/{app['channel_username']}"
        return ""

    async def chapter(self, slug: str, init_data: str, query: dict) -> dict:
        """متن یک فصل منتشرشده. فصل قفل فقط برای عضو کانال (و صاحب مینی‌اپ)."""
        app = await self._app(slug)
        row = await self.db.fetchone(
            "SELECT * FROM shab_chapters WHERE app_id = ? AND chapter_id = ?", (app["id"], _cid(query.get("id"))))
        if not row:
            raise ApiError(404, "این فصل پیدا نشد؛ شاید برداشته شده")
        base = {"id": row["chapter_id"], "story": row["story_id"], "title": row["title"], "words": row["words"]}
        if not row["lock"]:
            return dict(base, body=row["body"])
        user = self._reader(app, init_data, required=False)
        if user and await self.is_member(app, user.id, fresh=query.get("fresh") == "1"):
            return dict(base, body=row["body"], member=True)
        return dict(base, locked=True, teaser=teaser(row["body"]), join_url=self._join_url(app, row),
                    channel=app["channel_title"] or "", members_only=bool(app["channel_id"]))

    async def me(self, slug: str, init_data: str, query: dict) -> dict:
        """وضعیت خواندن این خواننده: آخرین جا، هر فصل تا کجا، نشان‌ها، «خبرم کن»."""
        app = await self._app(slug)
        user = self._reader(app, init_data)
        await self._touch(app, user)
        r = await self.db.fetchone("SELECT * FROM shab_readers WHERE app_id = ? AND tg_id = ?", (app["id"], user.id))
        read = {x["chapter_id"]: round(x["pct"], 3) for x in await self.db.fetchall(
            "SELECT chapter_id, pct FROM shab_progress WHERE app_id = ? AND tg_id = ?", (app["id"], user.id))}
        marks = [{"s": x["story_id"], "k": x["chapter_id"]} for x in await self.db.fetchall(
            "SELECT story_id, chapter_id FROM shab_marks WHERE app_id = ? AND tg_id = ? ORDER BY created_at", (app["id"], user.id))]
        last = {"s": r["last_story"], "k": r["last_chapter"], "p": r["last_pct"]} if r and r["last_chapter"] else None
        return {"last": last, "read": read, "marks": marks, "notify": bool(r["notify"]) if r else True,
                "can_notify": app["mode"] == "full" or bool(app["bot_username"])}

    async def progress(self, slug: str, init_data: str, body: dict) -> dict:
        app = await self._app(slug)
        user = self._reader(app, init_data)
        if not _rate_ok(("shab-p", app["id"], user.id), limit=30):
            return {"ok": False}
        cid = _cid(body.get("k"))
        row = await self.db.fetchone("SELECT story_id FROM shab_chapters WHERE app_id = ? AND chapter_id = ?", (app["id"], cid))
        if not row:
            return {"ok": False}
        try:
            pct = max(0.0, min(1.0, float(body.get("p") or 0)))
        except (TypeError, ValueError):
            pct = 0.0
        t = int(time.time())
        await self._touch(app, user)
        await self.db.execute(
            "INSERT INTO shab_progress(app_id, tg_id, chapter_id, story_id, pct, updated_at) VALUES (?,?,?,?,?,?) "
            "ON CONFLICT(app_id, tg_id, chapter_id) DO UPDATE SET pct=MAX(pct, excluded.pct), updated_at=excluded.updated_at",
            (app["id"], user.id, cid, row["story_id"], pct, t),
        )
        await self.db.execute(
            "UPDATE shab_readers SET last_story = ?, last_chapter = ?, last_pct = ? WHERE app_id = ? AND tg_id = ?",
            (row["story_id"], cid, pct, app["id"], user.id),
        )
        return {"ok": True}

    async def mark(self, slug: str, init_data: str, body: dict) -> dict:
        app = await self._app(slug)
        user = self._reader(app, init_data)
        cid = _cid(body.get("k"))
        row = await self.db.fetchone("SELECT story_id FROM shab_chapters WHERE app_id = ? AND chapter_id = ?", (app["id"], cid))
        if not row:
            raise ApiError(404, "این فصل پیدا نشد")
        if body.get("on"):
            await self.db.execute(
                "INSERT OR IGNORE INTO shab_marks(app_id, tg_id, chapter_id, story_id, created_at) VALUES (?,?,?,?,?)",
                (app["id"], user.id, cid, row["story_id"], int(time.time())))
        else:
            await self.db.execute("DELETE FROM shab_marks WHERE app_id = ? AND tg_id = ? AND chapter_id = ?", (app["id"], user.id, cid))
        return {"ok": True}

    async def notify(self, slug: str, init_data: str, body: dict) -> dict:
        app = await self._app(slug)
        user = self._reader(app, init_data)
        await self._touch(app, user)
        on = 1 if body.get("on") else 0
        await self.db.execute("UPDATE shab_readers SET notify = ? WHERE app_id = ? AND tg_id = ?", (on, app["id"], user.id))
        return {"ok": True, "notify": bool(on)}

    # ---------- صاحب مینی‌اپ ----------
    async def _mine(self, init_data: str, app_id: Any, write: bool = False):  # noqa: ANN202
        user, _ = await self.api._owner(init_data, write=write)
        return await self.api._owned(user.id, app_id)

    async def channel(self, init_data: str, body: dict) -> dict:
        """ثبت کانال: ربات مشتری باید ادمین کانال باشد. خالی = برداشتن کانال."""
        app = await self._mine(init_data, body.get("id"), write=True)
        raw = str(body.get("channel") or "").strip()
        if not raw:
            await self.db.set_channel(app["id"], None, None, None)
            return {"channel": None}
        bot = self.clients.for_app(app)
        if bot is None:
            raise ApiError(400, "اول ربات مینی‌اپ را وصل کن؛ همان ربات باید ادمین کانال باشد")
        m = re.match(r"^(?:https?://)?(?:t\.me/|telegram\.me/)?@?([A-Za-z][A-Za-z0-9_]{3,31})/?$", raw)
        chat_ref: Any = "@" + m.group(1) if m else (int(raw) if re.match(r"^-100\d{5,}$", raw) else None)
        if chat_ref is None:
            raise ApiError(400, "آیدی کانال را مثل ‎@my_channel‎ بنویس")
        try:
            chat = await bot.get_chat(chat_ref)
            me = await bot.get_chat_member(chat.id, bot.id)
        except TelegramAPIError as exc:
            log.info("channel check failed app=%s: %s", app["id"], exc)
            raise ApiError(400, "این کانال پیدا نشد یا ربات عضوش نیست. ربات را ادمین کانال کن و دوباره بزن.") from None
        if chat.type != "channel":
            raise ApiError(400, "این آیدی مال کانال نیست")
        if me.status not in ("administrator", "creator"):
            raise ApiError(400, f"ربات @{app['bot_username']} باید ادمین کانال باشد (برای دیدن اعضا و فرستادن پست)")
        await self.db.set_channel(app["id"], chat.id, chat.username, (chat.title or "")[:80])
        return {"channel": {"id": chat.id, "username": chat.username or "", "title": chat.title or ""}}

    async def stats(self, init_data: str, query: dict) -> dict:
        """آمار خواندن: هر فصل چند نفر شروع کرده و چند نفر تا آخر خوانده."""
        app = await self._mine(init_data, query.get("id"))
        a = app["id"]
        chapters = {r["chapter_id"]: {"readers": r["n"], "finished": r["f"]} for r in await self.db.fetchall(
            "SELECT chapter_id, COUNT(*) AS n, SUM(pct >= 0.9) AS f FROM shab_progress WHERE app_id = ? GROUP BY chapter_id", (a,))}
        stories = {r["story_id"]: {"readers": r["n"]} for r in await self.db.fetchall(
            "SELECT story_id, COUNT(DISTINCT tg_id) AS n FROM shab_progress WHERE app_id = ? GROUP BY story_id", (a,))}
        tot = await self.db.fetchone(
            "SELECT COUNT(*) AS n, COALESCE(SUM(notify), 0) AS f FROM shab_readers WHERE app_id = ?", (a,))
        return {"readers": tot["n"], "followers": tot["f"], "stories": stories, "chapters": chapters}

    async def announce(self, init_data: str, body: dict) -> dict:
        """اعلام فصل‌های تازه: پست در کانال و پیام به خواننده‌هایی که «خبرم کن» دارند.

        فرستادن در پس‌زمینه (همان event loop) و با سرعت مجاز تلگرام انجام
        می‌شود؛ هر فصل فقط یک بار اعلام می‌شود."""
        app = await self._mine(init_data, body.get("id"), write=True)
        bot = self.clients.for_app(app)
        if bot is None:
            raise ApiError(400, "اول ربات مینی‌اپ را وصل کن")
        ids = [_cid(x) for x in (body.get("chapters") or [])][:20]
        if not ids:
            raise ApiError(400, "فصلی انتخاب نشده")
        done = {r["chapter_id"] for r in await self.db.fetchall(
            "SELECT chapter_id FROM shab_announces WHERE app_id = ?", (app["id"],))}
        rows = []
        for cid in ids:
            if cid in done:
                continue
            r = await self.db.fetchone("SELECT * FROM shab_chapters WHERE app_id = ? AND chapter_id = ?", (app["id"], cid))
            if r:
                rows.append(r)
        if not rows:
            raise ApiError(400, "این فصل‌ها قبلاً اعلام شده‌اند یا منتشر نشده‌اند")
        if app["id"] in _SENDING:
            raise ApiError(429, "اعلام قبلی هنوز در حال فرستادن است")
        to_channel = bool(body.get("channel")) and bool(app["channel_id"])
        to_readers = bool(body.get("readers"))
        readers = [r["tg_id"] for r in await self.db.fetchall(
            "SELECT tg_id FROM shab_readers WHERE app_id = ? AND notify = 1", (app["id"],))] if to_readers else []
        t = int(time.time())
        for r in rows:
            await self.db.execute(
                "INSERT OR IGNORE INTO shab_announces(app_id, chapter_id, sent_at, readers, channel) VALUES (?,?,?,?,?)",
                (app["id"], r["chapter_id"], t, len(readers), 1 if to_channel else 0))
        _SENDING.add(app["id"])
        asyncio.get_running_loop().create_task(self._send(app, bot, rows, to_channel, readers))
        return {"ok": True, "readers": len(readers), "channel": to_channel, "chapters": len(rows)}

    async def _send(self, app, bot, rows, to_channel: bool, readers: list[int]) -> None:  # noqa: ANN001
        try:
            first = rows[0]
            if len(rows) == 1:
                text = f"📖 فصل تازه از «{_esc(first['story_title'])}»\n<b>{_esc(first['title'])}</b>"
            else:
                names = "\n".join(f"• {_esc(r['title'])} — «{_esc(r['story_title'])}»" for r in rows[:8])
                text = f"📖 {len(rows)} فصل تازه\n{names}"
            page = config.page_url(app["slug"]) + "#read=" + first["chapter_id"]
            if to_channel:
                # دکمهٔ web_app در کانال مجاز نیست؛ لینک به ربات، که در حالت کامل خودش مینی‌اپ را باز می‌کند
                link = f"https://t.me/{app['bot_username']}" + (f"?start=c_{first['chapter_id']}" if app["mode"] == "full" else "")
                kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="خواندن در مینی‌اپ", url=link)]])
                try:
                    await bot.send_message(app["channel_id"], text, reply_markup=kb)
                except TelegramAPIError as exc:
                    log.info("channel post failed app=%s: %s", app["id"], exc)
            kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="📖 خواندن", web_app=WebAppInfo(url=page))]])
            sent = 0
            for uid in readers:
                try:
                    await bot.send_message(uid, text, reply_markup=kb)
                    sent += 1
                except TelegramRetryAfter as exc:
                    await asyncio.sleep(exc.retry_after + 1)
                except TelegramForbiddenError:
                    # ربات را بلاک کرده یا هرگز شروعش نکرده؛ دیگر پیام نمی‌گیرد
                    await self.db.execute("UPDATE shab_readers SET notify = 0 WHERE app_id = ? AND tg_id = ?", (app["id"], uid))
                except TelegramAPIError:
                    pass
                await asyncio.sleep(0.05)  # زیر سقف ۳۰ پیام در ثانیهٔ تلگرام
            log.info("announce app=%s chapters=%s readers=%s/%s channel=%s", app["id"], len(rows), sent, len(readers), to_channel)
        except Exception:  # noqa: BLE001
            log.exception("announce failed app=%s", app["id"])
        finally:
            _SENDING.discard(app["id"])


def _esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
