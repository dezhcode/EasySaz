"""مسیرهای وب‌سایت ایزی‌ساز (زیر passenger_wsgi.py).

  GET  /                        لندینگ
  GET  /login                   ورود با QR (اگر وارد شده‌ای ← /account)
  GET  /account                 حساب (اگر وارد نشده‌ای ← /login)
  GET  /site/static/<file>      فایل‌های ثابت سایت
  POST /site/api/login/start    کد تازه برای QR
  POST /site/api/login/poll     وضعیت ورود؛ بعد از تأیید کوکی نشست
  GET  /site/api/me             کاربر، مینی‌اپ‌ها و دستگاه‌ها        (کوکی)
  POST /site/api/logout         خروج همین مرورگر                    (کوکی)
  POST /site/api/revoke         خروج یک دستگاه یا همه {id|all}      (کوکی)
  GET  /studio, /studio/<id>    استودیو: ساختن و طراحی مینی‌اپ       (app/site/studio.py)
  *    /site/api/apps|app/*|upload*|mag/*                            (کوکی)

POSTها هدر X-ES می‌خواهند: فرم یا سایت دیگری نمی‌تواند بدون پیش‌پرواز CORS
آن را بفرستد، پس کوکی SameSite=Lax به‌علاوهٔ این هدر جلوی CSRF را می‌گیرد.
"""
from __future__ import annotations

import hashlib
import json
import logging
import mimetypes
import os
import re
from html import escape
from http.cookies import SimpleCookie

from app.config import config
from app.db import effective_plan

from app.webapp.api import ApiError
from app.webapp.media import MediaError

from . import logins

log = logging.getLogger("easysaz.site")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
COOKIE = "es_site"
_STATIC_EXT = {".js", ".css", ".svg", ".png", ".jpg", ".webp", ".ico", ".woff2"}
_ASSET = re.compile(r"__BASE__site/static/([\w.-]+\.(?:css|js))")
_versions: dict[str, tuple[float, str]] = {}

CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' https: data:; font-src 'self'; connect-src 'self'; "
    "frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
)
PAGES = {"/studio": ("studio.html", "استودیو — ایزی‌ساز"),
         "/": ("landing.html", "ایزی‌ساز — مینی‌اپ تلگرامت را بساز"),
         "/login": ("login.html", "ورود با تلگرام — ایزی‌ساز"),
         "/account": ("account.html", "حساب — ایزی‌ساز")}


def _page_key(path: str) -> str:
    """/studio/<شناسه> همان صفحهٔ استودیو است (مسیر داخلی را JS می‌خواند)."""
    return "/studio" if re.match(r"^/studio/\d{1,9}(/[a-z]+)?$", path) else path


def is_site_path(path: str) -> bool:
    return _page_key(path) in PAGES or path.startswith("/site/")


class SiteError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


# ---------- پاسخ‌ها ----------
_REASON = {200: "OK", 302: "Found", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
           405: "Method Not Allowed", 409: "Conflict", 410: "Gone", 413: "Payload Too Large",
           429: "Too Many Requests", 500: "Internal Server Error"}


def _send(start_response, status: int, body: bytes, ctype: str, extra: list | None = None):  # noqa: ANN001, ANN202
    headers = [("Content-Type", ctype), ("Content-Length", str(len(body))),
               ("X-Content-Type-Options", "nosniff"), ("Referrer-Policy", "strict-origin-when-cross-origin")]
    headers.extend(extra or [])
    start_response(f"{status} {_REASON.get(status, 'Error')}", headers)
    return [body]


def _json(start_response, status: int, body: dict, extra: list | None = None):  # noqa: ANN001, ANN202
    data = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return _send(start_response, status, data, "application/json; charset=utf-8",
                 [("Cache-Control", "no-store")] + (extra or []))


def _redirect(start_response, to: str):  # noqa: ANN001, ANN202
    return _send(start_response, 302, b"", "text/plain", [("Location", (config.app_base_uri or "") + to),
                                                           ("Cache-Control", "no-store")])


def _base() -> str:
    return (config.app_base_uri or "") + "/"


def asset_version(rel: str) -> str:
    full = os.path.join(STATIC_DIR, rel)
    try:
        mtime = os.path.getmtime(full)
    except OSError:
        return "0"
    hit = _versions.get(rel)
    if hit and hit[0] == mtime:
        return hit[1]
    with open(full, "rb") as fh:
        ver = hashlib.sha256(fh.read()).hexdigest()[:10]
    _versions[rel] = (mtime, ver)
    return ver


def render(name: str, title: str) -> bytes:
    with open(os.path.join(STATIC_DIR, name), encoding="utf-8") as fh:
        html = fh.read()
    html = _ASSET.sub(lambda m: f"__BASE__site/static/{m.group(1)}?v={asset_version(m.group(1))}", html)
    return html.replace("__BASE__", escape(_base())).replace("__TITLE__", escape(title)).encode("utf-8")


def _static(start_response, rel: str, query: str):  # noqa: ANN001, ANN202
    full = os.path.realpath(os.path.join(STATIC_DIR, rel.lstrip("/")))
    if (not full.startswith(os.path.realpath(STATIC_DIR) + os.sep)
            or os.path.splitext(full)[1] not in _STATIC_EXT or not os.path.isfile(full)):
        return _send(start_response, 404, b"not found", "text/plain")
    with open(full, "rb") as fh:
        data = fh.read()
    ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
    if full.endswith(".js"):
        ctype = "text/javascript; charset=utf-8"
    elif full.endswith(".css"):
        ctype = "text/css; charset=utf-8"
    cache = "public, max-age=31536000, immutable" if "v=" in query else "no-cache"
    return _send(start_response, 200, data, ctype, [("Cache-Control", cache)])


# ---------- کوکی ----------
def _cookie(environ: dict) -> str:
    raw = environ.get("HTTP_COOKIE", "")
    if not raw:
        return ""
    try:
        jar = SimpleCookie()
        jar.load(raw)
    except Exception:  # noqa: BLE001
        return ""
    return jar[COOKIE].value if COOKIE in jar else ""


def _set_cookie(token: str, max_age: int) -> tuple[str, str]:
    parts = [f"{COOKIE}={token}", f"Path={config.app_base_uri or '/'}", f"Max-Age={max_age}", "HttpOnly", "SameSite=Lax"]
    if config.base_url.startswith("https://"):
        parts.append("Secure")
    return ("Set-Cookie", "; ".join(parts))


def _body(environ: dict, limit: int = 8192) -> dict:
    try:
        size = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        size = 0
    if size > limit:
        raise SiteError(413, "داده خیلی بزرگ است")
    if size <= 0:
        return {}
    try:
        data = json.loads(environ["wsgi.input"].read(size).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise SiteError(400, "بدنه نامعتبر") from None
    return data if isinstance(data, dict) else {}


# ---------- API ----------
async def _me(db, row) -> dict:  # noqa: ANN001
    from app.webapp.api import _app_json, _plan_json

    uid = row["tg_id"]
    user = await db.get_user(uid)
    apps = await db.list_apps(uid)
    return {
        "user": {"id": uid, "first_name": (user["first_name"] if user else "") or "",
                 "username": (user["username"] if user else "") or ""},
        "plan": _plan_json(effective_plan(user)),
        "apps": [dict(_app_json(a), stats=await db.app_stats(a["id"])) for a in apps],
        "sessions": await logins.sessions(db, uid, row["id"]),
        "bot": await db.get_setting("bot_username", "") or "EasySazBot",
    }


async def _start(db, environ: dict) -> dict:  # noqa: ANN001
    res = await logins.start(db, *logins.client_info(environ))
    bot = await db.get_setting("bot_username", "") or "EasySazBot"
    link = logins.scan_text(bot, res["code"])
    return dict(res, qr=link, link=link, bot=bot, refresh=30)


def _api(environ: dict, start_response, runtime, path: str, method: str):  # noqa: ANN001, ANN202, C901
    db = runtime.db
    if method == "POST" and environ.get("HTTP_X_ES") != "1":
        raise SiteError(403, "درخواست نامعتبر")
    if method == "POST" and path == "/site/api/login/start":
        return _json(start_response, 200, runtime.run(_start(db, environ), timeout=20))
    if method == "POST" and path == "/site/api/login/poll":
        body = _body(environ)
        res, token = runtime.run(logins.poll(db, str(body.get("code") or ""), str(body.get("poll") or ""),
                                             *logins.client_info(environ)), timeout=20)
        extra = [_set_cookie(token, logins.SESSION_TTL)] if token else []
        return _json(start_response, 200, res, extra)

    row = runtime.run(logins.session(db, _cookie(environ)), timeout=20)
    if not row:
        return _json(start_response, 401, {"error": "وارد نشده‌ای"}, [_set_cookie("", 0)] if _cookie(environ) else [])
    # ---------- استودیو (app/site/studio.py) ----------
    from urllib.parse import parse_qs

    from .studio import Studio

    st = Studio(db, runtime.parts.clients, row["tg_id"])
    query = {k: v[0] for k, v in parse_qs(environ.get("QUERY_STRING", "")).items()}
    run = lambda coro: _json(start_response, 200, runtime.run(coro, timeout=40))  # noqa: E731
    if method == "GET" and path == "/site/api/apps":
        return run(st.apps())
    if method == "GET" and path == "/site/api/app":
        return run(st.app(query))
    if method == "POST" and path.startswith("/site/api/app/"):
        action = path.rsplit("/", 1)[1]
        if action in ("create", "save", "publish", "template", "rename", "channel"):
            return run(getattr(st, action)(_body(environ, 1_000_000)))
    if method == "POST" and path == "/site/api/upload":
        return run(st.upload(_body(environ, 2_200_000)))
    if method == "POST" and path == "/site/api/upload_media":
        from app.webapp import media

        data = media.read_body(environ)

        async def _media():  # noqa: ANN202
            st._write()
            return await media.save(db, row["tg_id"], data, environ.get("CONTENT_TYPE", ""))

        return run(_media())
    if path.startswith("/site/api/mag/"):
        action = path[len("/site/api/mag/"):].strip("/")
        return run(st.mag(action, method, query, _body(environ, 700_000) if method == "POST" else {}))

    if method == "GET" and path == "/site/api/me":
        return _json(start_response, 200, runtime.run(_me(db, row), timeout=20))
    if method == "POST" and path == "/site/api/logout":
        runtime.run(logins.revoke(db, row["tg_id"], row["id"]), timeout=20)
        return _json(start_response, 200, {"ok": True}, [_set_cookie("", 0)])
    if method == "POST" and path == "/site/api/revoke":
        body = _body(environ)
        everything = bool(body.get("all"))
        runtime.run(logins.revoke(db, row["tg_id"], body.get("id"), everything=everything), timeout=20)
        if everything or str(body.get("id")) == str(row["id"]):
            return _json(start_response, 200, {"ok": True, "signed_out": True}, [_set_cookie("", 0)])
        return _json(start_response, 200, {"ok": True, "sessions": runtime.run(logins.sessions(db, row["tg_id"], row["id"]), timeout=20)})
    raise SiteError(404, "پیدا نشد")


def handle(environ: dict, start_response, runtime):  # noqa: ANN001, ANN201
    path = environ["_es_path"]
    method = environ.get("REQUEST_METHOD", "GET").upper()

    if path.startswith("/site/static/") and method == "GET":
        return _static(start_response, path[len("/site/static/"):], environ.get("QUERY_STRING", ""))

    if _page_key(path) in PAGES and method in ("GET", "HEAD"):
        path = _page_key(path)
        if path in ("/login", "/account", "/studio"):
            runtime.ensure_started()
            signed_in = bool(runtime.run(logins.session(runtime.db, _cookie(environ)), timeout=20))
            if path == "/login" and signed_in:
                return _redirect(start_response, "/studio")
            if path in ("/account", "/studio") and not signed_in:
                return _redirect(start_response, "/login")
        name, title = PAGES[path]
        return _send(start_response, 200, render(name, title), "text/html; charset=utf-8",
                     [("Content-Security-Policy", CSP), ("Cache-Control", "no-cache"), ("X-Frame-Options", "DENY")])

    if path.startswith("/site/api/"):
        try:
            runtime.ensure_started()
            return _api(environ, start_response, runtime, path, method)
        except (SiteError, logins.LoginError, ApiError, MediaError) as exc:
            return _json(start_response, exc.status, {"error": exc.message})
        except Exception:  # noqa: BLE001
            log.exception("site api error on %s", path)
            return _json(start_response, 500, {"error": "خطای سرور؛ دوباره امتحان کن"})

    return _send(start_response, 404, b"not found", "text/plain")
