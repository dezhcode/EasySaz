"""مسیرهای وب مینی اپ ها (زیر passenger_wsgi.py).

  GET  /panel                    پنل ساخت (داخل @EasySazBot)
  GET  /a/<slug>                 مینی اپ ساخته شده (داخل ربات مشتری)
  GET  /static/<file>            فایل های ثابت
  GET  /api/schema               کامپوننت ها و تم (عمومی)
  GET  /api/me                   کاربر، پلن و اپ ها          (initData ربات اصلی)
  GET  /api/app?id=              سند پیش نویس یک اپ          (initData ربات اصلی)
  POST /api/app/create|rename|save|publish                  (initData ربات اصلی)
  GET  /api/templates            قالب‌های آماده (عمومی)
  POST /api/app/welcome          پیام خوش‌آمد ربات مشتری          (initData ربات اصلی)
  POST /api/app/status           روشن/خاموش برای خواننده‌ها        (initData ربات اصلی)
  POST /api/app/remove_kit       حذف قالب و محتوایش              (initData ربات اصلی)
  POST /api/upload               آپلود تصویر (data URL)          (initData ربات اصلی)
  GET  /u/<name>                 تصویرهای آپلودشده
  GET  /api/page/<slug>          سند منتشر شده (عمومی)
  POST /api/page/<slug>/view     ثبت بازدید                  (initData ربات مشتری)
"""
from __future__ import annotations

import hashlib
import json
import logging
import mimetypes
import os
import re
from html import escape
from urllib.parse import parse_qs

from app import blocks
from app.config import config

from app.kits.shab.api import ShabApi

from .api import Api, ApiError, dumps

log = logging.getLogger("easysaz.web")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
_SLUG = re.compile(r"^[a-z0-9]{6,16}$")
_UPLOAD = re.compile(r"^[a-f0-9]{24}\.(jpg|png|webp)$")
_STATIC_EXT = {".js", ".css", ".woff2", ".png", ".jpg", ".webp", ".svg", ".ico"}

CSP = (
    "default-src 'self'; "
    "script-src 'self' https://telegram.org; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' https: data:; "
    "font-src 'self'; "
    "connect-src 'self'; "
    "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org; "
    "base-uri 'none'; form-action 'none'"
)


def is_webapp_path(path: str) -> bool:
    return (
        path == "/panel"
        or path.startswith("/a/")
        or path.startswith("/static/")
        or path.startswith("/api/")
        or path.startswith("/u/")
    )


def _send(start_response, status: str, body: bytes, ctype: str, extra: list | None = None):  # noqa: ANN001, ANN202
    headers = [
        ("Content-Type", ctype),
        ("Content-Length", str(len(body))),
        ("X-Content-Type-Options", "nosniff"),
        ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ]
    headers.extend(extra or [])
    start_response(status, headers)
    return [body]


def _json(start_response, status: int, body: dict):  # noqa: ANN001, ANN202
    reason = {200: "OK", 400: "Bad Request", 401: "Unauthorized", 402: "Payment Required",
              403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed",
              413: "Payload Too Large", 429: "Too Many Requests", 500: "Internal Server Error"}
    return _send(
        start_response,
        f"{status} {reason.get(status, 'Error')}",
        dumps(body).encode("utf-8"),
        "application/json; charset=utf-8",
        [("Cache-Control", "no-store")],
    )


def _body(environ: dict, limit: int = 262_144) -> dict:
    try:
        size = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        size = 0
    if size > limit:
        raise ApiError(413, "داده خیلی بزرگ است")
    if size <= 0:
        return {}
    try:
        data = json.loads(environ["wsgi.input"].read(size).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise ApiError(400, "بدنه نامعتبر") from None
    return data if isinstance(data, dict) else {}


_ASSET = re.compile(r"__BASE__static/([\w.-]+\.(?:css|js))(?:\?v=\w+)?")
_versions: dict[str, tuple[float, str]] = {}


def asset_version(rel: str) -> str:
    """نسخهٔ فایل ثابت از روی محتوایش: هر به‌روزرسانی نشانی تازه می‌سازد و
    تلگرام و مرورگر نسخهٔ قدیمی را از حافظه نمی‌آورند."""
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


def _html(name: str, title: str = "EasySaz") -> bytes:
    with open(os.path.join(STATIC_DIR, name), encoding="utf-8") as fh:
        html = fh.read()
    html = _ASSET.sub(lambda m: f"__BASE__static/{m.group(1)}?v={asset_version(m.group(1))}", html)
    base = (config.app_base_uri or "") + "/"
    return html.replace("__BASE__", escape(base)).replace("__TITLE__", escape(title)).encode("utf-8")


def _static(start_response, rel: str, query: str = ""):  # noqa: ANN001, ANN202
    rel = rel.lstrip("/")
    full = os.path.realpath(os.path.join(STATIC_DIR, rel))
    if (
        not full.startswith(os.path.realpath(STATIC_DIR) + os.sep)
        or os.path.splitext(full)[1] not in _STATIC_EXT
        or not os.path.isfile(full)
    ):
        return _send(start_response, "404 Not Found", b"not found", "text/plain")
    with open(full, "rb") as fh:
        data = fh.read()
    ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
    if full.endswith(".js"):
        ctype = "text/javascript; charset=utf-8"
    elif full.endswith(".woff2"):
        ctype = "font/woff2"
    # فونت‌ها عوض نمی‌شوند و js/css در HTML با ?v=<هش محتوا> می‌آیند (asset_version)
    cache = "public, max-age=31536000, immutable" if full.endswith(".woff2") or "v=" in query else "no-cache"
    return _send(start_response, "200 OK", data, ctype, [("Cache-Control", cache)])


def handle(environ: dict, start_response, runtime):  # noqa: ANN001, ANN201, C901
    path = environ["_es_path"]
    method = environ.get("REQUEST_METHOD", "GET").upper()
    init_data = environ.get("HTTP_X_INIT_DATA", "")
    page_headers = [("Content-Security-Policy", CSP), ("Cache-Control", "no-cache")]

    if path.startswith("/static/") and method == "GET":
        return _static(start_response, path[len("/static/"):], environ.get("QUERY_STRING", ""))

    if path.startswith("/u/") and method == "GET":
        name = path[3:]
        full = os.path.join(config.upload_dir, name)
        if not _UPLOAD.match(name) or not os.path.isfile(full):
            return _send(start_response, "404 Not Found", b"not found", "text/plain")
        with open(full, "rb") as fh:
            data = fh.read()
        ctype = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}[name.rsplit(".", 1)[1]]
        # نام فایل از محتواست، پس هرگز عوض نمی‌شود
        return _send(start_response, "200 OK", data, ctype, [("Cache-Control", "public, max-age=31536000, immutable")])

    if path == "/panel" and method == "GET":
        return _send(start_response, "200 OK", _html("panel.html", "EasySaz"), "text/html; charset=utf-8", page_headers)

    if path.startswith("/a/") and method == "GET":
        slug = path[3:].strip("/")
        if slug == "demo":  # حالت نمایشی فرانت‌اند؛ داده از localStorage مرورگر (demo.js)
            return _send(start_response, "200 OK", _html("page.html", "کافه نارنج"), "text/html; charset=utf-8", page_headers)
        if not _SLUG.match(slug):
            return _send(start_response, "404 Not Found", b"not found", "text/plain")
        title = "EasySaz"
        try:
            runtime.ensure_started()
            app = runtime.run(runtime.db.get_app_by_slug(slug), timeout=15)
            if app:
                title = app["name"]
        except Exception:  # noqa: BLE001
            log.warning("title lookup failed", exc_info=True)
        return _send(start_response, "200 OK", _html("page.html", title), "text/html; charset=utf-8", page_headers)

    if not path.startswith("/api/"):
        return _send(start_response, "404 Not Found", b"not found", "text/plain")

    # ---------- API ----------
    if path == "/api/schema" and method == "GET":
        return _json(start_response, 200, blocks.public_schema())
    if path == "/api/templates" and method == "GET":
        from app import templates

        return _json(start_response, 200, templates.public())

    try:
        runtime.ensure_started()
        api = Api(runtime.db, runtime.parts.clients)
        query = {k: v[0] for k, v in parse_qs(environ.get("QUERY_STRING", "")).items()}

        if method == "GET" and path == "/api/me":
            coro = api.me(init_data)
        elif method == "GET" and path == "/api/app":
            coro = api.app(init_data, query.get("id"))
        elif method == "POST" and path in ("/api/app/create", "/api/app/rename", "/api/app/save",
                                           "/api/app/publish", "/api/app/welcome", "/api/app/status",
                                           "/api/app/remove_kit"):
            action = path.rsplit("/", 1)[1]
            coro = getattr(api, action)(init_data, _body(environ, limit=1_000_000 if action in ("save", "publish") else 262_144))
        elif method == "POST" and path == "/api/upload":
            coro = api.upload(init_data, _body(environ, limit=2_200_000))
        elif path.startswith("/api/page/"):
            rest = path[len("/api/page/"):].strip("/")
            slug, _, tail = rest.partition("/")
            if not _SLUG.match(slug):
                raise ApiError(404, "پیدا نشد")
            if method == "GET" and not tail:
                coro = api.page(slug)
            elif method == "POST" and tail == "view":
                coro = api.view(slug, init_data)
            elif tail in ShabApi.READER:
                # خوانندهٔ شب‌نوشت: متن فصل، وضعیت خواندن، نشان‌ها
                shab = ShabApi(runtime.db, runtime.parts.clients, api)
                if method == "GET" and tail in ("chapter", "me"):
                    coro = getattr(shab, tail)(slug, init_data, query)
                elif method == "POST" and tail in ("progress", "mark", "notify"):
                    coro = getattr(shab, tail)(slug, init_data, _body(environ, limit=8192))
                else:
                    raise ApiError(405, "روش نامعتبر")
            else:
                raise ApiError(404, "پیدا نشد")
        elif path.startswith("/api/kit/shab/"):
            # صاحب مینی‌اپ: کانال، آمار خواندن، اعلام فصل تازه
            action = path[len("/api/kit/shab/"):].strip("/")
            shab = ShabApi(runtime.db, runtime.parts.clients, api)
            if method == "GET" and action == "stats":
                coro = shab.stats(init_data, query)
            elif method == "POST" and action in ("channel", "announce"):
                coro = getattr(shab, action)(init_data, _body(environ))
            else:
                raise ApiError(404, "پیدا نشد")
        else:
            raise ApiError(404, "پیدا نشد")

        return _json(start_response, 200, runtime.run(coro, timeout=30))
    except ApiError as exc:
        return _json(start_response, exc.status, {"error": exc.message})
    except Exception:  # noqa: BLE001
        log.exception("api error on %s", path)
        return _json(start_response, 500, {"error": "خطای سرور؛ دوباره امتحان کن"})
