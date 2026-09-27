"""ربات های مشتری در حالت «کنترل کامل».

همه ربات های مشتری یک Dispatcher مشترک دارند. میان افزار اپ مربوط به
ربات را از دیتابیس پیدا می کند و اگر اپ در حالت full و فعال نباشد،
آپدیت بی صدا نادیده گرفته می شود.
"""
from __future__ import annotations

from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware, Bot, F, Router
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, TelegramObject, WebAppInfo

from .. import texts
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


@router.message(F.chat.type == "private")
async def any_private(message: Message, app) -> None:  # noqa: ANN001
    """/start و هر پیام دیگر: خوش آمد + دکمه ورود به مینی اپ."""
    if app["status"] != "active":
        await message.answer("این ربات موقتاً در دسترس نیست.")
        return
    text = app["welcome"] or texts.default_welcome(app["name"])
    await message.answer(text, reply_markup=_open_kb(app))
