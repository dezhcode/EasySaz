"""بررسی آمادگی قبل از اتصال: کتابخانه ها، تنظیمات، دیتابیس، تلگرام.

  python check_setup.py
"""
from __future__ import annotations

import asyncio
import os
import sys

ok_all = True


def line(ok: bool, title: str, detail: str = "") -> None:
    global ok_all
    ok_all &= ok
    print(f"[ {'درست' if ok else 'خطا '} ] {title}" + (f"  —  {detail}" if detail else ""))


def main() -> None:
    try:
        import aiogram, aiosqlite, cryptography, dotenv  # noqa: F401, E401
        line(True, "کتابخانه ها", f"aiogram {aiogram.__version__}")
    except ImportError as exc:
        line(False, "کتابخانه ها", str(exc))
        return

    from app.config import config
    from app import secure

    line(bool(config.bot_token), "BOT_TOKEN")
    line(config.base_url.startswith("https://"), "BASE_URL", config.base_url or "خالی")
    line(bool(config.webhook_secret), "WEBHOOK_SECRET")
    line(bool(config.admin_key), "ADMIN_KEY")
    line(bool(config.admin_ids), "ADMIN_IDS", ",".join(map(str, config.admin_ids)))
    try:
        secure.decrypt_token(secure.encrypt_token("1:test"))
        line(True, "TOKEN_KEY")
    except secure.TokenKeyError as exc:
        line(False, "TOKEN_KEY", str(exc))

    async def db_check() -> None:
        from app.db import Database

        db = Database(config.db_path)
        await db.connect()
        await db.close()

    try:
        asyncio.run(db_check())
        line(True, "دیتابیس", config.db_path)
    except Exception as exc:  # noqa: BLE001
        line(False, "دیتابیس", str(exc))

    async def tg_check() -> str:
        from aiogram import Bot
        from app.runtime import make_session

        bot = Bot(token=config.bot_token, session=make_session())
        try:
            me = await asyncio.wait_for(bot.get_me(), 15)
            return f"@{me.username}"
        finally:
            await bot.session.close()

    try:
        line(True, "اتصال به تلگرام", asyncio.run(tg_check()))
    except Exception as exc:  # noqa: BLE001
        line(False, "اتصال به تلگرام", str(exc))

    print()
    print("همه چیز آماده است." if ok_all else "موارد «خطا» را قبل از ادامه درست کن.")


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.getcwd())
    main()
