"""ویدیوی معرفی ۳۵ ثانیه‌ای ایزی‌ساز.

در اولین /start خودکار پخش می‌شود و بعد از آن با دکمهٔ منو یا /intro. فایل فقط یک
بار آپلود می‌شود؛ file_id تلگرام در settings نگه داشته می‌شود و به اثرانگشت فایل
گره خورده تا با عوض شدن app/assets/intro.mp4 دوباره آپلود شود.
"""
from __future__ import annotations

import hashlib
import logging
from functools import lru_cache
from pathlib import Path

from aiogram import Bot
from aiogram.enums import ChatAction
from aiogram.exceptions import TelegramAPIError, TelegramBadRequest
from aiogram.types import FSInputFile

from .. import texts
from ..db import Database

log = logging.getLogger("easysaz.intro")

ASSETS = Path(__file__).resolve().parents[1] / "assets"
VIDEO = ASSETS / "intro.mp4"
THUMB = ASSETS / "intro_thumb.jpg"
SETTING = "intro_video"  # مقدار: "<اثرانگشت>|<file_id>"
META = {"width": 1920, "height": 1080, "duration": 35}


@lru_cache(maxsize=4)
def _fingerprint(size: int, mtime: float) -> str:  # noqa: ARG001 (اندازه و زمان فقط کلید کش‌اند)
    h = hashlib.sha1()
    with VIDEO.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def fingerprint() -> str | None:
    if not VIDEO.is_file():
        return None
    st = VIDEO.stat()
    return _fingerprint(st.st_size, st.st_mtime)


async def send_intro(bot: Bot, chat_id: int, db: Database) -> bool:
    """ویدیو را می‌فرستد؛ اگر فایل نباشد یا تلگرام رد کند False (کاربر در هر حال منو را می‌گیرد)."""
    fp = fingerprint()
    if fp is None:
        log.warning("ویدیوی معرفی پیدا نشد: %s", VIDEO)
        return False
    saved = await db.get_setting(SETTING) or ""
    cached = saved.split("|", 1)[1] if saved.startswith(fp + "|") else None
    if cached:
        try:
            await bot.send_video(chat_id, cached, caption=texts.INTRO_CAPTION, supports_streaming=True, **META)
            return True
        except TelegramBadRequest as exc:  # file_id دیگر معتبر نیست (مثلاً توکن ربات عوض شده): دوباره آپلود
            log.info("file_id ویدیوی معرفی رد شد، آپلود دوباره: %s", exc)
    try:
        await bot.send_chat_action(chat_id, ChatAction.UPLOAD_VIDEO)
        msg = await bot.send_video(
            chat_id, FSInputFile(VIDEO, filename="easysaz.mp4"), caption=texts.INTRO_CAPTION,
            thumbnail=FSInputFile(THUMB) if THUMB.is_file() else None, supports_streaming=True, **META,
        )
    except TelegramAPIError as exc:
        log.warning("ارسال ویدیوی معرفی نشد: %s", exc)
        return False
    if msg.video:
        await db.set_setting(SETTING, f"{fp}|{msg.video.file_id}")
    return True
