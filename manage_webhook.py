"""مدیریت وبهوک ربات اصلی از ترمینال.

  python manage_webhook.py set     ثبت وبهوک + دستورها + دکمه منوی پنل
  python manage_webhook.py info    وضعیت وبهوک
  python manage_webhook.py delete  حذف وبهوک
"""
from __future__ import annotations

import asyncio
import sys

from app.config import config
from app.runtime import make_session, setup_main_bot

from aiogram import Bot


async def main(action: str) -> None:
    bot = Bot(token=config.bot_token, session=make_session())
    try:
        if action == "set":
            if not config.base_url.startswith("https://"):
                raise SystemExit("BASE_URL باید با https:// شروع شود")
            if not config.webhook_secret:
                raise SystemExit("WEBHOOK_SECRET خالی است")
            await bot.set_webhook(
                url=config.webhook_url,
                secret_token=config.webhook_secret,
                allowed_updates=list(config.allowed_updates),
            )
            await setup_main_bot(bot)
            print("webhook set:", config.webhook_url)
        elif action == "delete":
            await bot.delete_webhook()
            print("webhook deleted")
        info = await bot.get_webhook_info()
        print("url            :", info.url or "-")
        print("pending_updates:", info.pending_update_count)
        print("last_error     :", info.last_error_message or "-")
    finally:
        await bot.session.close()


if __name__ == "__main__":
    act = sys.argv[1] if len(sys.argv) > 1 else "info"
    if act not in ("set", "info", "delete"):
        raise SystemExit(__doc__)
    asyncio.run(main(act))
