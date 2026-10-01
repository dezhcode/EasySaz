"""ربات های مشتری: نگهداری نمونه Bot و وصل کردنشان به مینی اپ.

همه ربات های مشتری یک session مشترک aiohttp دارند؛ ساختن session جدا
برای هر ربات روی هاست اشتراکی حافظه و اتصال هدر می دهد.

دو حالت اتصال:
- menu : فقط دکمه منوی ربات مشتری به مینی اپ ست می شود. وبهوک دست
         نمی خورد، پس اگر ربات روی سرور دیگری اجرا شده، سالم می ماند.
- full : علاوه بر دکمه منو، وبهوک ربات به EasySaz می آید و /start با
         پیام خوش آمد و دکمه ورود جواب داده می شود. هر برنامه دیگری که
         الان این ربات را اجرا می کند از کار می افتد.
"""
from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramAPIError, TelegramUnauthorizedError
from aiogram.types import (
    BotCommand,
    MenuButtonDefault,
    MenuButtonWebApp,
    User,
    WebAppInfo,
)

from . import secure
from .config import config

log = logging.getLogger("easysaz.clients")

CLIENT_UPDATES = ["message", "callback_query", "pre_checkout_query"]


class LinkError(Exception):
    """خطای قابل نمایش به کاربر."""


class ClientBots:
    def __init__(self, session: AiohttpSession) -> None:
        self.session = session
        self._bots: dict[int, Bot] = {}

    def get(self, token: str) -> Bot:
        """نمونه Bot برای این توکن (کش می شود؛ تعویض توکن نمونه را عوض می کند)."""
        bot_id = secure.bot_id_of(token)
        bot = self._bots.get(bot_id)
        if bot is None or bot.token != token:
            bot = Bot(
                token=token,
                session=self.session,
                default=DefaultBotProperties(parse_mode=ParseMode.HTML),
            )
            self._bots[bot_id] = bot
        return bot

    def for_app(self, app) -> Bot | None:  # noqa: ANN001
        if not app or not app["bot_token_enc"]:
            return None
        token = secure.decrypt_token(app["bot_token_enc"])
        return self.get(token) if token else None

    def forget(self, bot_id: int) -> None:
        self._bots.pop(bot_id, None)

    # ---------- عملیات ----------
    async def probe(self, token: str) -> User:
        """اعتبارسنجی توکن با getMe. خطا را به زبان کاربر برمی گرداند."""
        if not secure.looks_like_token(token):
            raise LinkError("این شبیه توکن ربات نیست. توکن را از @BotFather کپی کن.")
        bot = self.get(token)
        try:
            me = await bot.get_me()
        except TelegramUnauthorizedError:
            self.forget(secure.bot_id_of(token))
            raise LinkError("تلگرام این توکن را قبول نکرد. شاید باطل شده؛ از @BotFather دوباره بگیر.")
        except TelegramAPIError as exc:
            raise LinkError(f"ارتباط با تلگرام نشد: {exc.message}")
        if not me.is_bot:
            raise LinkError("این توکن مال یک ربات نیست.")
        return me

    async def apply(self, app, mode: str) -> None:  # noqa: ANN001
        """اعمال حالت اتصال روی ربات مشتری."""
        bot = self.for_app(app)
        if bot is None:
            raise LinkError("توکن این ربات خوانده نشد. دوباره وصلش کن.")
        url = config.page_url(app["slug"])
        try:
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text=menu_text(app["name"]), web_app=WebAppInfo(url=url)
                )
            )
            if mode == "full":
                await bot.set_webhook(
                    url=config.client_hook_url(bot.id),
                    secret_token=secure.client_hook_secret(bot.id),
                    allowed_updates=CLIENT_UPDATES,
                    drop_pending_updates=True,
                )
                await bot.set_my_commands(
                    [BotCommand(command="start", description="باز کردن مینی اپ")]
                )
            else:
                # برگشت از full به menu: وبهوک ما را برمی داریم تا صاحب ربات
                # بتواند دوباره برنامه خودش را روی آن اجرا کند. اگر وبهوک
                # مال کس دیگری است، دست نمی زنیم.
                info = await bot.get_webhook_info()
                if info.url and info.url.startswith(config.base_url):
                    await bot.delete_webhook()
        except TelegramUnauthorizedError:
            raise LinkError("توکن ربات باطل شده. از @BotFather توکن تازه بگیر و دوباره وصل کن.")
        except TelegramAPIError as exc:
            raise LinkError(f"تلگرام خطا داد: {exc.message}")

    async def ensure_updates(self, app) -> None:  # noqa: ANN001
        """ربات در حالت full: وبهوک همهٔ نوع‌های آپدیتِ لازم را بگیرد (مثلاً پرداخت ستاره).
        آپدیت‌های در صف دور ریخته نمی‌شوند."""
        bot = self.for_app(app)
        if bot is None:
            raise LinkError("توکن این ربات خوانده نشد. دوباره وصلش کن.")
        try:
            info = await bot.get_webhook_info()
            if info.url == config.client_hook_url(bot.id) and set(info.allowed_updates or []) >= set(CLIENT_UPDATES):
                return
            await bot.set_webhook(
                url=config.client_hook_url(bot.id),
                secret_token=secure.client_hook_secret(bot.id),
                allowed_updates=CLIENT_UPDATES,
            )
        except TelegramUnauthorizedError:
            raise LinkError("توکن ربات باطل شده. از @BotFather توکن تازه بگیر و دوباره وصل کن.")
        except TelegramAPIError as exc:
            raise LinkError(f"تلگرام خطا داد: {exc.message}")

    async def release(self, app) -> None:  # noqa: ANN001
        """برگرداندن ربات مشتری به حالت اول. خطا فقط لاگ می شود."""
        bot = self.for_app(app)
        if bot is None:
            return
        try:
            await bot.set_chat_menu_button(menu_button=MenuButtonDefault())
            info = await bot.get_webhook_info()
            if info.url and info.url.startswith(config.base_url):
                await bot.delete_webhook()
                await bot.delete_my_commands()
        except TelegramAPIError:
            log.info("release bot %s failed (token revoked?)", app["bot_id"], exc_info=True)
        finally:
            self.forget(bot.id)

    async def refresh_menu(self, app) -> None:  # noqa: ANN001
        """بعد از تغییر نام اپ، متن دکمه منو هم عوض شود."""
        if app and app["mode"] in ("menu", "full"):
            try:
                await self.apply(app, app["mode"])
            except LinkError:
                log.info("refresh menu failed for app %s", app["id"])


def menu_text(name: str) -> str:
    """متن دکمه منو. تلگرام متن خیلی بلند را قبول نمی کند."""
    name = (name or "").strip()
    return name[:24] if name else "Open"
