"""API ربات‌ساز برای مینی‌اپ ایزی‌ساز (فقط صاحب مینی‌اپ، با initData ربات اصلی).

  GET  /api/bot?id=            سند پیش‌نویس، منتشرشده، آمار، ایموجی‌ها
  POST /api/bot/save           ذخیرهٔ پیش‌نویس
  POST /api/bot/publish        انتشار برای همهٔ کاربرهای ربات
  POST /api/bot/off            خاموش کردن ربات‌ساز (ربات به خوش‌آمد ساده برمی‌گردد)
  POST /api/bot/test           تست در چت واقعی: پیش‌نویس فقط برای صاحب ربات
  POST /api/bot/takeover       اجرای ربات روی ایزی‌ساز (وبهوک)
  POST /api/bot/emoji_pack     افزودن یک بستهٔ ایموجی با لینک t.me/addemoji/…
  POST /api/bot/emoji_del      حذف یک ایموجی از کتابخانه
"""
from __future__ import annotations

import logging
import re

from aiogram.exceptions import TelegramAPIError, TelegramBadRequest, TelegramForbiddenError
from aiogram.types import User

from ..clients import LinkError
from ..config import config
from . import engine, schema, store

log = logging.getLogger("easysaz.botkit.api")

PACK_RE = re.compile(r"(?:t\.me/addemoji/|addemoji/)?([A-Za-z0-9_]{3,64})/?$")

ACTIONS = {"": "GET", "save": "POST", "publish": "POST", "off": "POST", "test": "POST", "takeover": "POST",
           "emoji_pack": "POST", "emoji_del": "POST"}


def _err(status: int, message: str):  # noqa: ANN202
    from ..webapp.api import ApiError

    return ApiError(status, message)


class BotApi:
    def __init__(self, api, main_bot) -> None:  # noqa: ANN001
        self.api = api
        self.db = api.db
        self.clients = api.clients
        self.main_bot = main_bot

    async def _ctx(self, init_data: str, app_id: object, write: bool = False):  # noqa: ANN202
        user, plan = await self.api._owner(init_data, write=write)
        await self.db.execute("UPDATE users SET is_premium = ? WHERE tg_id = ?", (int(user.is_premium), user.id))
        app = await self.api._owned(user.id, app_id)
        return user, plan, app

    def _bot_json(self, app, row) -> dict:  # noqa: ANN001
        return {
            "connected": bool(app["bot_token_enc"]),
            "username": app["bot_username"] or "",
            "name": app["bot_name"] or "",
            "mode": app["mode"],
            "live": bool(row and row["published"]),
            "published_at": row["published_at"] if row else None,
        }

    def _clean(self, raw: object) -> dict:
        try:
            return schema.clean_doc(raw)
        except schema.BotDocError as exc:
            raise _err(400, str(exc)) from exc

    async def handle(self, action: str, init_data: str, query: dict, body: dict) -> dict:
        if action == "":
            return await self.get(init_data, query.get("id"))
        return await getattr(self, action)(init_data, body)

    # ------------------------------------------------------------ خواندن
    async def get(self, init_data: str, app_id: object) -> dict:
        user, _plan, app = await self._ctx(init_data, app_id)
        row = await store.flow_row(self.db, app["id"])
        draft = await store.load(self.db, app["id"])
        pub = await store.load(self.db, app["id"], published=True)
        return {
            "app": {"id": app["id"], "name": app["name"], "slug": app["slug"], "url": config.page_url(app["slug"])},
            "bot": self._bot_json(app, row),
            "doc": draft or schema.empty_doc(app["name"]),
            "published": pub,
            "fresh": draft is None,
            "stats": await store.stats(self.db, app["id"]),
            "emoji": await store.emoji_list(self.db, app["id"]),
            "premium": bool(user.is_premium),
            "main_bot": await self.db.get_setting("bot_username", "EasySazBot"),
            "limits": {"msgs": schema.MAX_MSGS, "vars": schema.MAX_VARS},
        }

    # ------------------------------------------------------------ نوشتن
    async def save(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        doc = self._clean(body.get("doc"))
        await store.save_draft(self.db, app["id"], doc)
        return {"doc": doc}

    async def _run_here(self, app) -> None:  # noqa: ANN001
        """ربات باید وبهوکش روی ایزی‌ساز باشد (حالت کنترل کامل)."""
        try:
            if app["mode"] != "full":
                await self.clients.apply(app, "full")
                await self.db.set_mode(app["id"], "full")
            else:
                await self.clients.ensure_updates(app)
        except LinkError as exc:
            raise _err(400, str(exc)) from exc

    async def publish(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if not app["bot_token_enc"]:
            raise _err(400, "اول ربات را وصل کن")
        doc = self._clean(body.get("doc"))
        if not doc["msgs"]:
            raise _err(400, "ربات هنوز پیامی ندارد")
        await self._run_here(app)
        await store.publish(self.db, app["id"], doc)
        app = await self.db.get_app(app["id"])
        return {"doc": doc, "published": doc, "bot": self._bot_json(app, await store.flow_row(self.db, app["id"])),
                "stats": await store.stats(self.db, app["id"])}

    async def off(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        await store.unpublish(self.db, app["id"])
        return {"bot": self._bot_json(app, await store.flow_row(self.db, app["id"])), "published": None}

    async def takeover(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if not app["bot_token_enc"]:
            raise _err(400, "اول ربات را وصل کن")
        await self._run_here(app)
        app = await self.db.get_app(app["id"])
        return {"bot": self._bot_json(app, await store.flow_row(self.db, app["id"]))}

    async def test(self, init_data: str, body: dict) -> dict:
        user, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if not app["bot_token_enc"]:
            raise _err(400, "اول ربات را وصل کن")
        if app["mode"] != "full":
            raise _err(409, "need_full")
        doc = self._clean(body.get("doc")) if isinstance(body.get("doc"), dict) else None
        if doc is not None:
            await store.save_draft(self.db, app["id"], doc)
        bot = self.clients.for_app(app)
        if bot is None:
            raise _err(400, "توکن ربات خوانده نشد؛ دوباره وصلش کن")
        owner = User(id=user.id, is_bot=False, first_name=user.first_name or "تو", username=user.username or None)
        link = f"https://t.me/{app['bot_username']}"
        try:
            await engine.start_test(bot, self.db, app, owner, str(body.get("from") or ""))
        except TelegramForbiddenError:
            return {"need_start": True, "link": link + "?start=test"}
        except TelegramBadRequest as exc:
            if "chat not found" in str(exc).lower():
                return {"need_start": True, "link": link + "?start=test"}
            raise _err(400, f"تلگرام پیام را قبول نکرد: {exc.message}") from exc
        except TelegramAPIError as exc:
            raise _err(400, f"ارتباط با تلگرام نشد: {exc.message}") from exc
        return {"ok": True, "link": link}

    # ------------------------------------------------------------ ایموجی
    async def emoji_pack(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        m = PACK_RE.search(str(body.get("link") or "").strip())
        if not m:
            raise _err(400, "لینک بسته باید مثل t.me/addemoji/نام باشد")
        items, name = await fetch_pack(self.main_bot, m.group(1))
        if not items:
            raise _err(404, "این بسته پیدا نشد یا ایموجی پریمیوم ندارد")
        added = await store.emoji_add(self.db, app["id"], items, pack=name)
        return {"added": added, "emoji": await store.emoji_list(self.db, app["id"])}

    async def emoji_del(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        await store.emoji_remove(self.db, app["id"], str(body.get("emoji") or ""))
        return {"emoji": await store.emoji_list(self.db, app["id"])}


async def fetch_pack(bot, name: str) -> tuple[list[tuple[str, str]], str]:  # noqa: ANN001
    try:
        st = await bot.get_sticker_set(name=name)
    except TelegramAPIError:
        return [], name
    items = [(s.custom_emoji_id, s.emoji or "⭐") for s in st.stickers if getattr(s, "custom_emoji_id", None)]
    return items, st.name
