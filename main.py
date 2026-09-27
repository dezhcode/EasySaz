"""اجرای ربات اصلی با polling (تست محلی).

  python main.py

مینی اپ ها و ربات های مشتری در حالت «کنترل کامل» به HTTPS و وبهوک نیاز
دارند، پس فقط روی هاست (passenger_wsgi.py) کامل کار می کنند. اینجا
فقط گفتگوی @EasySazBot قابل تست است.
"""
from __future__ import annotations

import asyncio
import logging

from app.config import config
from app.runtime import build, setup_logging, setup_main_bot

setup_logging()
log = logging.getLogger("easysaz")


async def main() -> None:
    if not config.bot_token:
        raise SystemExit("BOT_TOKEN در فایل .env تنظیم نشده است")
    parts = build()
    await parts.db.connect()
    me = await parts.bot.get_me()
    await parts.db.set_setting("bot_username", me.username or "")
    await parts.bot.delete_webhook(drop_pending_updates=True)
    await setup_main_bot(parts.bot)
    log.info("@%s started (polling)", me.username)
    try:
        await parts.dp.start_polling(parts.bot, allowed_updates=list(config.allowed_updates))
    finally:
        await parts.db.close()
        await parts.bot.session.close()
        await parts.clients.session.close()


if __name__ == "__main__":
    asyncio.run(main())
