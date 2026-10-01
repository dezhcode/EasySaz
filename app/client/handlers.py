"""ربات های مشتری در حالت «کنترل کامل».

همه ربات های مشتری یک Dispatcher مشترک دارند. میان افزار اپ مربوط به
ربات را از دیتابیس پیدا می کند و اگر اپ در حالت full و فعال نباشد،
آپدیت بی صدا نادیده گرفته می شود.
"""
from __future__ import annotations

import html
import time
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware, Bot, F, Router
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    PreCheckoutQuery,
    TelegramObject,
    WebAppInfo,
)

from .. import texts
from ..botkit import engine
from ..clients import menu_text
from ..config import config
from ..db import Database

router = Router(name="client")


class AppMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        bot: Bot = data["bot"]
        db: Database = data["db"]
        app = await db.get_app_by_bot(bot.id)
        if app is None or app["mode"] != "full":
            return None
        data["app"] = app
        return await handler(event, data)


def _open_kb(app) -> InlineKeyboardMarkup:  # noqa: ANN001
    return InlineKeyboardMarkup(
        inline_keyboard=[[
            InlineKeyboardButton(
                text=f"✨ {menu_text(app['name'])}",
                web_app=WebAppInfo(url=config.page_url(app["slug"])),
            )
        ]]
    )


async def _reader(db: Database, app, message: Message) -> None:  # noqa: ANN001
    """کسی که ربات را شروع کرده، خوانندهٔ شب‌نوشت است و پیام فصل تازه می‌گیرد."""
    u = message.from_user
    if u is None:
        return
    t = int(time.time())
    await db.execute(
        "INSERT INTO shab_readers(app_id, tg_id, first_name, username, first_seen, last_seen) VALUES (?,?,?,?,?,?) "
        "ON CONFLICT(app_id, tg_id) DO UPDATE SET first_name=excluded.first_name, username=excluded.username, last_seen=excluded.last_seen",
        (app["id"], u.id, (u.first_name or "")[:64], (u.username or "")[:64], t, t),
    )


@router.message(F.chat.type == "private", F.text.regexp(r"^/start c_(c[a-z0-9]{5,15})$").as_("m"))
async def open_chapter(message: Message, app, db: Database, m) -> None:  # noqa: ANN001
    """لینک پست کانال (t.me/<ربات>?start=c_<فصل>): همان فصل در مینی‌اپ باز می‌شود."""
    if app["status"] != "active":
        await message.answer("این ربات موقتاً در دسترس نیست.")
        return
    await _reader(db, app, message)
    row = await db.fetchone(
        "SELECT title, story_title FROM shab_chapters WHERE app_id = ? AND chapter_id = ?", (app["id"], m.group(1)))
    if row is None:
        await message.answer(app["welcome"] or texts.default_welcome(app["name"]), reply_markup=_open_kb(app))
        return
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(
        text="📖 خواندن", web_app=WebAppInfo(url=config.page_url(app["slug"]) + "#read=" + m.group(1)))]])
    title = html.escape(row["title"] or "")
    story = html.escape(row["story_title"] or "")
    await message.answer(f"<b>{title}</b>\nاز «{story}»", reply_markup=kb)


@router.message(F.chat.type == "private", F.text.regexp(r"^/start a_(p[a-z0-9]{7,12})$").as_("m"))
async def open_post(message: Message, app, db: Database, m) -> None:  # noqa: ANN001
    """لینک پست کانال مجله (t.me/<ربات>?start=a_<مطلب>): همان مطلب در مینی‌اپ باز می‌شود."""
    if app["status"] != "active":
        await message.answer("این ربات موقتاً در دسترس نیست.")
        return
    from ..kits import mag

    title = await mag.title_of(db, app["id"], m.group(1))
    if title is None:
        await message.answer(app["welcome"] or texts.default_welcome(app["name"]), reply_markup=_open_kb(app))
        return
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(
        text="📖 خواندن", web_app=WebAppInfo(url=config.page_url(app["slug"]) + "#post=" + m.group(1)))]])
    await message.answer(f"<b>{html.escape(title)}</b>", reply_markup=kb)


@router.message(F.successful_payment)
async def paid(message: Message, app, db: Database, bot: Bot) -> None:  # noqa: ANN001
    """پرداخت ستاره از دکمهٔ ربات‌ساز."""
    await engine.on_paid(bot, db, app, message)


@router.pre_checkout_query()
async def pre_checkout(query: PreCheckoutQuery, app, db: Database, bot: Bot) -> None:  # noqa: ANN001
    if not await engine.on_pre_checkout(bot, db, app, query):
        await query.answer(ok=False, error_message="این پرداخت دیگر معتبر نیست.")


@router.callback_query()
async def any_callback(call: CallbackQuery, app, db: Database, bot: Bot) -> None:  # noqa: ANN001
    """دکمه‌های شیشه‌ای ربات‌ساز."""
    if app["status"] != "active":
        await call.answer("این ربات موقتاً در دسترس نیست.", show_alert=True)
        return
    if not await engine.on_callback(bot, db, app, call):
        await call.answer()


@router.message(F.chat.type == "private")
async def any_private(message: Message, app, db: Database, bot: Bot) -> None:  # noqa: ANN001
    """/start و هر پیام دیگر: اگر ربات‌ساز منتشر شده، موتور جواب می‌دهد؛
    وگرنه خوش آمد + دکمه ورود به مینی اپ."""
    if app["status"] != "active":
        await message.answer("این ربات موقتاً در دسترس نیست.")
        return
    if (message.text or "").startswith("/start"):
        await _reader(db, app, message)
    if await engine.on_message(bot, db, app, message):
        return
    text = app["welcome"] or texts.default_welcome(app["name"])
    await message.answer(text, reply_markup=_open_kb(app))
