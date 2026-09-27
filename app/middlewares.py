"""میان افزارهای ربات اصلی: ثبت کاربر، مسدودی و ضداسپم."""
from __future__ import annotations

import time
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, TelegramObject

from .db import Database


class UserMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        db: Database = data["db"]
        if user is None or user.is_bot:
            return await handler(event, data)
        await db.upsert_user(user.id, user.username, user.first_name, user.language_code)
        row = await db.get_user(user.id)
        if row and row["is_blocked"]:
            if isinstance(event, CallbackQuery):
                await event.answer("دسترسی تو محدود شده.", show_alert=True)
            return None
        data["user_row"] = row
        return await handler(event, data)


class ThrottleMiddleware(BaseMiddleware):
    """جلوگیری از رگبار پیام/کلیک. در حافظه است و ری استارت پاکش می کند؛ کافی است."""

    def __init__(self, delay: float = 0.4) -> None:
        self.delay = delay
        self._last: dict[int, float] = {}

    async def __call__(self, handler, event, data):  # noqa: ANN001, ANN204
        user = data.get("event_from_user")
        if user is not None:
            t = time.monotonic()
            if t - self._last.get(user.id, 0.0) < self.delay:
                if isinstance(event, CallbackQuery):
                    await event.answer()
                return None
            self._last[user.id] = t
            if len(self._last) > 5000:
                self._last.clear()
        return await handler(event, data)

