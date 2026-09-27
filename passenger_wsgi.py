"""نقطه ورود Passenger روی هاست سی پنل.

در Setup Python App سی پنل:
  Application startup file : passenger_wsgi.py
  Application entry point  : application

مسیرها (نسبت به BASE_URL، مثلا /easysaz):
  POST  <WEBHOOK_PATH>          وبهوک ربات اصلی @EasySazBot
  POST  /hook/<bot_id>          وبهوک ربات های مشتری (حالت کنترل کامل)
  GET   /panel, /a/<slug>, /static/*, /api/*   مینی اپ ها (app/webapp/wsgi.py)
  GET   /health                 سلامت و گرم نگه داشتن
  GET   /status?key=ADMIN_KEY       وضعیت کامل
  GET   /setwebhook?key=ADMIN_KEY   ثبت وبهوک + دستورها + دکمه منوی ربات اصلی
  GET   /delwebhook?key=ADMIN_KEY   حذف وبهوک ربات اصلی
"""
from __future__ import annotations

import hmac
import json
import logging
import os
import sys
import traceback

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.chdir(BASE_DIR)

_BOOT_ERROR: str | None = None

try:
    from aiogram.types import Update

    from app import secure
    from app.config import config
    from app.runtime import runtime, setup_logging, setup_main_bot

    setup_logging()
except Exception:  # noqa: BLE001
    _BOOT_ERROR = traceback.format_exc()

log = logging.getLogger("easysaz.wsgi")


def _respond(start_response, status: str, body: str, ctype: str = "text/plain; charset=utf-8"):  # noqa: ANN001, ANN202
    data = body.encode("utf-8")
    start_response(
        status,
        [("Content-Type", ctype), ("Content-Length", str(len(data))), ("Cache-Control", "no-store")],
    )
    return [data]


def _path(environ: dict) -> str:
    """مسیر داخل اپ؛ PATH_INFO ممکن است زیرمسیر اپ را داشته باشد یا نه."""
    path = environ.get("PATH_INFO", "") or "/"
    for prefix in (environ.get("SCRIPT_NAME", "") or "", config.app_base_uri):
        prefix = prefix.rstrip("/")
        if prefix and (path == prefix or path.startswith(prefix + "/")):
            path = path[len(prefix):] or "/"
    return "/" + path.strip("/")


def _query_raw(environ: dict, name: str) -> str:
    """پارامتر query بدون تبدیل + به فاصله (کلیدهای base64 + دارند)."""
    from urllib.parse import unquote

    for part in (environ.get("QUERY_STRING", "") or "").split("&"):
        key, _, value = part.partition("=")
        if unquote(key) == name:
            return unquote(value)
    return ""


def _authorized(environ: dict) -> bool:
    key = config.admin_key
    if not key:
        return False
    given = environ.get("HTTP_X_ADMIN_KEY") or _query_raw(environ, "key")
    return bool(given) and hmac.compare_digest(given.strip().encode(), key.encode())


def _read(environ: dict) -> bytes:
    try:
        length = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        length = 0
    if length <= 0 or length > 1_000_000:
        return b""
    return environ["wsgi.input"].read(length)


def _feed(dp, bot, raw: bytes) -> None:  # noqa: ANN001
    """دادن آپدیت به dispatcher. خطا فقط لاگ می شود و همیشه ۲۰۰ برمی گردد
    تا تلگرام یک آپدیت خراب را بی نهایت بار دوباره نفرستد."""
    try:
        update = Update.model_validate(json.loads(raw.decode("utf-8")), context={"bot": bot})
        runtime.run(dp.feed_update(bot, update), timeout=50)
    except Exception:  # noqa: BLE001
        log.exception("update handling failed")


def _client_bot(bot_id: int):  # noqa: ANN202
    """ربات مشتری برای وبهوک ورودی، فقط اگر اپش در حالت full باشد."""
    app = runtime.run(runtime.db.get_app_by_bot(bot_id), timeout=15)
    if not app or app["mode"] != "full":
        return None
    return runtime.parts.clients.for_app(app)


def application(environ, start_response):  # noqa: ANN001, ANN201, C901
    if _BOOT_ERROR:
        sys.stderr.write(_BOOT_ERROR)
        return _respond(start_response, "500 Internal Server Error", "boot error")

    path = _path(environ)
    method = environ.get("REQUEST_METHOD", "GET").upper()

    # ---------- مینی اپ ها ----------
    try:
        from app.webapp.wsgi import handle, is_webapp_path

        if is_webapp_path(path):
            environ["_es_path"] = path
            return handle(environ, start_response, runtime)
    except Exception:  # noqa: BLE001
        sys.stderr.write(traceback.format_exc())
        return _respond(start_response, "500 Internal Server Error", "webapp error")

    # ---------- وبهوک ربات اصلی ----------
    if method == "POST" and path == config.webhook_path:
        secret = environ.get("HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN", "")
        if not config.webhook_secret or not hmac.compare_digest(secret, config.webhook_secret):
            return _respond(start_response, "403 Forbidden", "forbidden")
        raw = _read(environ)
        runtime.ensure_started()
        _feed(runtime.parts.dp, runtime.bot, raw)
        return _respond(start_response, "200 OK", "ok")

    # ---------- وبهوک ربات های مشتری ----------
    if method == "POST" and path.startswith("/hook/"):
        raw_id = path[len("/hook/"):]
        if not raw_id.isdigit():
            return _respond(start_response, "404 Not Found", "not found")
        bot_id = int(raw_id)
        secret = environ.get("HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN", "")
        if not config.webhook_secret or not hmac.compare_digest(secret, secure.client_hook_secret(bot_id)):
            return _respond(start_response, "403 Forbidden", "forbidden")
        raw = _read(environ)
        try:
            runtime.ensure_started()
            bot = _client_bot(bot_id)
        except Exception:  # noqa: BLE001
            log.exception("client bot lookup failed")
            bot = None
        if bot is not None:
            _feed(runtime.parts.client_dp, bot, raw)
        return _respond(start_response, "200 OK", "ok")

    # ---------- سلامت ----------
    if path in ("/health", "/") and method == "GET":
        warm = "cold"
        try:
            runtime.ensure_started()
            warm = "warm"
        except Exception:  # noqa: BLE001
            log.warning("warm-up failed", exc_info=True)
        return _respond(start_response, "200 OK", f"easysaz: ok ({warm})")

    # ---------- مدیریت ----------
    if path in ("/status", "/setwebhook", "/delwebhook"):
        if not _authorized(environ):
            return _respond(start_response, "403 Forbidden", "forbidden")
        try:
            runtime.ensure_started()
            bot = runtime.bot
            if path == "/setwebhook":
                runtime.run(
                    bot.set_webhook(
                        url=config.webhook_url,
                        secret_token=config.webhook_secret,
                        allowed_updates=list(config.allowed_updates),
                    ),
                    timeout=30,
                )
                runtime.run(setup_main_bot(bot), timeout=30)
            elif path == "/delwebhook":
                runtime.run(bot.delete_webhook(), timeout=30)
            info = runtime.run(bot.get_webhook_info(), timeout=30)
            me = runtime.run(bot.get_me(), timeout=30)
            stats = runtime.run(runtime.db.global_stats(), timeout=30)
            body = {
                "pid": os.getpid(),
                "python": sys.version.split()[0],
                "bot": f"@{me.username}",
                "expected_webhook": config.webhook_url,
                "current_webhook": info.url,
                "pending_updates": info.pending_update_count,
                "last_error": info.last_error_message,
                "stats": stats,
            }
            return _respond(
                start_response, "200 OK",
                json.dumps(body, ensure_ascii=False, indent=2),
                "application/json; charset=utf-8",
            )
        except Exception:  # noqa: BLE001
            sys.stderr.write(traceback.format_exc())
            return _respond(start_response, "500 Internal Server Error", "failed")

    return _respond(start_response, "404 Not Found", "not found")
