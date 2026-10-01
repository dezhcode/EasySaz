"""هسته مشترک اجرا: ساخت ربات اصلی، ربات های مشتری، dispatcher ها و دیتابیس.

زیر Passenger (passenger_wsgi.py) اپ همزمان (sync) است ولی aiogram async.
پس یک event loop دائمی در یک ترد جدا بالا می آید و درخواست ها با
run_coroutine_threadsafe به آن سپرده می شوند. همه کارهای async روی همان
یک loop انجام می شوند، پس اتصال SQLite و session تلگرام سالم می مانند.
(همان الگوی Obour.)

دو dispatcher داریم:
- dp        : ربات اصلی @EasySazBot (پنل، اتصال، پلن ها)
- client_dp : همه ربات های مشتری در حالت «کنترل کامل»
"""
from __future__ import annotations

import asyncio
import logging
import logging.handlers
import os
import threading
from dataclasses import dataclass
from typing import Any, Coroutine

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError, TelegramRetryAfter
from aiogram.types import BotCommand, ErrorEvent, MenuButtonWebApp, WebAppInfo

from .clients import ClientBots
from .config import config
from .db import Database
from .fsm_storage import SQLiteStorage
from .middlewares import ThrottleMiddleware, UserMiddleware

log = logging.getLogger("easysaz")

_LOG_READY = False


def setup_logging() -> None:
    """لاگ همزمان در فایل و stderr. روی سی پنل stderr به error log دامنه می رود."""
    global _LOG_READY
    if _LOG_READY:
        return
    fmt = logging.Formatter("%(asctime)s | %(levelname)-7s | %(name)s | %(message)s")
    root = logging.getLogger()
    root.setLevel(getattr(logging, config.log_level, logging.INFO))
    stream = logging.StreamHandler()
    stream.setFormatter(fmt)
    root.addHandler(stream)
    try:
        os.makedirs(os.path.dirname(config.log_path), exist_ok=True)
        fileh = logging.handlers.RotatingFileHandler(
            config.log_path, maxBytes=2_000_000, backupCount=3, encoding="utf-8"
        )
        fileh.setFormatter(fmt)
        root.addHandler(fileh)
    except OSError:
        pass
    logging.getLogger("aiogram.event").setLevel(logging.WARNING)
    _LOG_READY = True


def make_session() -> AiohttpSession:
    kwargs: dict[str, Any] = {}
    if config.tg_proxy:
        kwargs["proxy"] = config.tg_proxy
    if config.tg_api_base:
        kwargs["api"] = TelegramAPIServer.from_base(config.tg_api_base)
    return AiohttpSession(**kwargs)


async def _on_error(event: ErrorEvent) -> bool:
    """خطاهای بی ضرر تلگرام لاگ را شلوغ نکنند؛ بقیه ثبت و به کاربر خبر داده شود."""
    exc = event.exception
    if isinstance(exc, TelegramBadRequest) and (
        "message is not modified" in str(exc) or "query is too old" in str(exc)
    ):
        return True
    if isinstance(exc, TelegramRetryAfter):
        log.warning("rate limited for %ss", exc.retry_after)
        return True
    if isinstance(exc, TelegramForbiddenError):
        return True  # کاربر ربات را بلاک کرده
    log.exception("unhandled error while processing update", exc_info=exc)
    callback = getattr(event.update, "callback_query", None)
    if callback is not None:
        try:
            await callback.answer("یه مشکلی پیش اومد. دوباره امتحان کن.", show_alert=True)
        except Exception:  # noqa: BLE001
            pass
    return True


@dataclass(slots=True)
class Parts:
    dp: Dispatcher
    bot: Bot
    client_dp: Dispatcher
    clients: ClientBots
    db: Database


def build() -> Parts:
    """ساخت همه اجزا. هیچ I/O ای اینجا انجام نمی شود."""
    db = Database(config.db_path)
    bot = Bot(
        token=config.bot_token,
        session=make_session(),
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    clients = ClientBots(make_session())

    dp = Dispatcher(storage=SQLiteStorage(db))
    dp["db"] = db
    dp["clients"] = clients
    throttle = ThrottleMiddleware(delay=0.4)
    user_mw = UserMiddleware()
    for observer in (dp.message, dp.callback_query):
        observer.outer_middleware(throttle)
        observer.middleware(user_mw)

    from .handlers import admin, billing, botkit, connect, myapp, start

    # connect/myapp زودتر از start می آیند چون start یک fallback برای هر
    # پیام دارد و نباید پیام توکن را قبل از هندلر FSM بگیرد.
    dp.include_routers(
        billing.router, admin.router, connect.router, myapp.router, botkit.router, start.router
    )
    dp.errors.register(_on_error)

    from .client.handlers import AppMiddleware
    from .client.handlers import router as client_router

    client_dp = Dispatcher()
    client_dp["db"] = db
    client_dp.message.middleware(AppMiddleware())
    client_dp.callback_query.middleware(AppMiddleware())
    client_dp.pre_checkout_query.middleware(AppMiddleware())
    client_dp.include_router(client_router)
    client_dp.errors.register(_on_error)

    return Parts(dp=dp, bot=bot, client_dp=client_dp, clients=clients, db=db)


MAIN_COMMANDS = [
    BotCommand(command="start", description="خانه"),
    BotCommand(command="connect", description="اتصال ربات"),
    BotCommand(command="myapp", description="مینی اپ من"),
    BotCommand(command="plans", description="پلن‌ها"),
    BotCommand(command="help", description="راهنما"),
]


async def setup_main_bot(bot: Bot) -> None:
    """دستورها و دکمه منوی ربات اصلی (دکمه منو = پنل ساخت)."""
    await bot.set_my_commands(MAIN_COMMANDS)
    if config.base_url.startswith("https://"):
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="پنل ساخت", web_app=WebAppInfo(url=config.panel_url))
        )


class Runtime:
    """نگهدارنده event loop دائمی برای اجرا زیر WSGI."""

    def __init__(self) -> None:
        self._loop: asyncio.AbstractEventLoop | None = None
        self._lock = threading.Lock()
        self.parts: Parts | None = None

    # میانبرها
    @property
    def db(self) -> Database:
        assert self.parts is not None
        return self.parts.db

    @property
    def bot(self) -> Bot:
        assert self.parts is not None
        return self.parts.bot

    def ensure_started(self) -> None:
        if self._loop is not None and self._loop.is_running():
            return
        with self._lock:
            if self._loop is not None and self._loop.is_running():
                return
            setup_logging()
            if not config.bot_token:
                raise RuntimeError("BOT_TOKEN در فایل .env تنظیم نشده است")

            loop = asyncio.new_event_loop()
            ready = threading.Event()

            def _runner() -> None:
                asyncio.set_event_loop(loop)
                loop.call_soon(ready.set)
                loop.run_forever()

            threading.Thread(target=_runner, name="easysaz-loop", daemon=True).start()
            ready.wait(timeout=10)
            self._loop = loop
            self.parts = build()
            asyncio.run_coroutine_threadsafe(self._boot(), loop).result(timeout=30)
            log.info("easysaz runtime ready (pid=%s)", os.getpid())

    async def _boot(self) -> None:
        assert self.parts is not None
        await self.parts.db.connect()
        # نام کاربری ربات اصلی برای لینک ها در پنل لازم است؛ یک بار گرفته می شود
        try:
            me = await asyncio.wait_for(self.parts.bot.get_me(), 8)
            if me.username:
                await self.parts.db.set_setting("bot_username", me.username)
        except Exception:  # noqa: BLE001
            log.debug("get_me failed on boot", exc_info=True)

    def run(self, coro: Coroutine, timeout: float = 50.0) -> Any:
        self.ensure_started()
        assert self._loop is not None
        return asyncio.run_coroutine_threadsafe(coro, self._loop).result(timeout=timeout)


runtime = Runtime()
