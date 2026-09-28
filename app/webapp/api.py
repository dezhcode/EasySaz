"""API مینی اپ ها.

دو گروه مسیر:
- پنل ساخت (/api/me، /api/app/...): فقط صاحب اپ، با initData ربات اصلی.
- صفحه عمومی (/api/page/<slug>): محتوای منتشر شده، برای همه.

هر تابع (status, body) برمی گرداند و روی event loop ربات اجرا می شود.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time

from app import blocks, kits, secure
from app.config import config
from app.db import Database, effective_plan, load_doc
from app.plans import PLANS, Plan

from .auth import AuthError, WebAppUser, verify

log = logging.getLogger("easysaz.api")

_RATE: dict[object, list[float]] = {}
_NAME_CTRL = re.compile(r"[\x00-\x1f\x7f‪-‮⁦-⁩]")


UPLOAD_MAX_SIZE = 1_500_000          # هر تصویر بعد از کوچک‌سازی در مرورگر
UPLOAD_MAX_FILES = 300
UPLOAD_MAX_BYTES = 60_000_000
_MAGIC = ((b"\xff\xd8\xff", "jpg"), (b"\x89PNG\r\n\x1a\n", "png"), (b"RIFF", "webp"))


def _decode_image(value: object) -> tuple[str, bytes]:
    """data URL → (نام فایل بر اساس محتوا، بایت‌ها). فقط JPEG، PNG و WEBP واقعی."""
    import base64
    import hashlib

    raw = str(value or "")
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[-1]
    try:
        data = base64.b64decode(raw, validate=True)
    except (ValueError, TypeError):
        raise ApiError(400, "تصویر خراب است") from None
    if not data or len(data) > UPLOAD_MAX_SIZE:
        raise ApiError(413, "تصویر خیلی بزرگ است")
    ext = next((e for sig, e in _MAGIC if data.startswith(sig)), None)
    if ext == "webp" and data[8:12] != b"WEBP":
        ext = None
    if not ext:
        raise ApiError(400, "فقط تصویر JPG، PNG یا WEBP")
    return f"{hashlib.sha256(data).hexdigest()[:24]}.{ext}", data


class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _rate_ok(key: object, limit: int = 40, window: float = 60.0) -> bool:
    now = time.monotonic()
    hits = [t for t in _RATE.get(key, []) if now - t < window]
    if len(hits) >= limit:
        _RATE[key] = hits
        return False
    hits.append(now)
    _RATE[key] = hits
    if len(_RATE) > 2000:
        _RATE.clear()
    return True


def clean_name(value: object) -> str:
    name = _NAME_CTRL.sub("", str(value or "")).strip()
    name = re.sub(r"\s+", " ", name)
    if len(name) < 2:
        raise ApiError(400, "اسم مینی اپ حداقل ۲ حرف باشد")
    if len(name) > 40:
        raise ApiError(400, "اسم مینی اپ حداکثر ۴۰ حرف باشد")
    return name


def _plan_json(plan: Plan) -> dict:
    return {
        "key": plan.key,
        "title": plan.title,
        "max_apps": plan.max_apps,
        "max_blocks": plan.max_blocks,
        "max_pages": plan.max_pages,
        "premium_blocks": plan.premium_blocks,
        "branding": plan.branding,
    }


def _app_json(app) -> dict:  # noqa: ANN001
    return {
        "id": app["id"],
        "name": app["name"],
        "slug": app["slug"],
        "url": config.page_url(app["slug"]),
        "bot_username": app["bot_username"],
        "mode": app["mode"],
        "status": app["status"],
        "published_at": app["published_at"],
        "updated_at": app["updated_at"],
        "dirty": (app["draft"] or "") != (app["published"] or ""),
        "welcome": app["welcome"] or "",
        "channel": ({"id": app["channel_id"], "username": app["channel_username"] or "", "title": app["channel_title"] or ""}
                    if app["channel_id"] else None),
    }


class Api:
    def __init__(self, db: Database, clients) -> None:  # noqa: ANN001
        self.db = db
        self.clients = clients

    # ---------- احراز هویت پنل ----------
    async def _owner(self, init_data: str, write: bool = False) -> tuple[WebAppUser, Plan]:
        try:
            user = verify(init_data)
        except AuthError as exc:
            raise ApiError(401, str(exc)) from exc
        if write and not _rate_ok(user.id):
            raise ApiError(429, "کمی آهسته تر 🙂")
        await self.db.upsert_user(user.id, user.username, user.first_name, user.language_code)
        row = await self.db.get_user(user.id)
        if row and row["is_blocked"]:
            raise ApiError(403, "دسترسی تو محدود شده")
        return user, effective_plan(row)

    async def _owned(self, uid: int, app_id: object):  # noqa: ANN202
        try:
            aid = int(app_id)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            raise ApiError(400, "شناسه نامعتبر") from None
        app = await self.db.get_owned_app(uid, aid)
        if not app:
            raise ApiError(404, "مینی اپ پیدا نشد")
        return app

    # ---------- پنل ----------
    async def me(self, init_data: str) -> dict:
        user, plan = await self._owner(init_data)
        apps = await self.db.list_apps(user.id)
        return {
            "user": {"id": user.id, "first_name": user.first_name},
            "plan": _plan_json(plan),
            "apps": [_app_json(a) for a in apps],
            "can_create": len(apps) < plan.max_apps,
            "bot": await self.db.get_setting("bot_username", ""),
            # برای بلیت‌های پلن در صفحهٔ حساب؛ خرید همیشه در خود ربات است
            "plans": [dict(_plan_json(p), price_stars=p.price_stars, features=list(p.features)) for p in PLANS.values()],
        }

    async def app(self, init_data: str, app_id: object) -> dict:
        user, plan = await self._owner(init_data)
        app = await self._owned(user.id, app_id)
        return {
            "app": _app_json(app),
            "doc": load_doc(app["draft"]),
            "stats": await self.db.app_stats(app["id"]),
            "plan": _plan_json(plan),
        }

    async def create(self, init_data: str, body: dict) -> dict:
        user, plan = await self._owner(init_data, write=True)
        name = clean_name(body.get("name"))
        app_id = await self.db.create_app(user.id, name, plan.max_apps)
        if not app_id:
            raise ApiError(402, f"پلن {plan.title} فقط {plan.max_apps} مینی اپ دارد. برای بیشتر، پلن بگیر.")
        app = await self.db.get_app(app_id)
        return {"app": _app_json(app), "doc": load_doc(app["draft"])}

    async def rename(self, init_data: str, body: dict) -> dict:
        user, _ = await self._owner(init_data, write=True)
        app = await self._owned(user.id, body.get("id"))
        await self.db.rename_app(app["id"], clean_name(body.get("name")))
        app = await self.db.get_app(app["id"])
        await self.clients.refresh_menu(app)
        return {"app": _app_json(app)}

    def _clean(self, body: dict, plan: Plan) -> dict:
        try:
            return blocks.clean_page(
                body.get("doc"), max_blocks=plan.max_blocks, premium=plan.premium_blocks,
                max_pages=plan.max_pages,
            )
        except blocks.PageError as exc:
            raise ApiError(402, str(exc)) from exc

    async def save(self, init_data: str, body: dict) -> dict:
        user, plan = await self._owner(init_data, write=True)
        app = await self._owned(user.id, body.get("id"))
        doc = self._clean(body, plan)
        await self.db.save_draft(app["id"], doc)
        app = await self.db.get_app(app["id"])
        return {"doc": doc, "app": _app_json(app)}

    async def publish(self, init_data: str, body: dict) -> dict:
        user, plan = await self._owner(init_data, write=True)
        app = await self._owned(user.id, body.get("id"))
        doc = self._clean(body, plan)
        await self.db.publish(app["id"], doc)
        app = await self.db.get_app(app["id"])
        # کار سمت سرورِ قالب (شب‌نوشت: متن فصل‌ها به جدول، فصل‌های تازه برای اعلام)
        kit = await kits.on_publish(self.db, app, doc)
        return {"doc": doc, "app": _app_json(app), "kit": kit}

    async def welcome(self, init_data: str, body: dict) -> dict:
        """پیام خوش‌آمد ربات مشتری در حالت کنترل کامل (خالی = متن پیش‌فرض)."""
        user, _ = await self._owner(init_data, write=True)
        app = await self._owned(user.id, body.get("id"))
        text = _NAME_CTRL.sub("", str(body.get("text") or "")).strip()[:1000]
        # ربات با parse_mode=HTML می‌فرستد؛ متن ساده را escape می‌کنیم
        from html import escape

        await self.db.set_welcome(app["id"], escape(text, quote=False) if text else None)
        app = await self.db.get_app(app["id"])
        return {"app": _app_json(app)}

    async def upload(self, init_data: str, body: dict) -> dict:
        """ذخیرهٔ تصویر. مرورگر قبلاً آن را کوچک کرده (حداکثر ۱۶۰۰ پیکسل)."""
        user, _ = await self._owner(init_data, write=True)
        name, data = _decode_image(body.get("data"))
        count, total = await self.db.upload_usage(user.id)
        if count >= UPLOAD_MAX_FILES or total + len(data) > UPLOAD_MAX_BYTES:
            raise ApiError(402, "فضای تصویرهایت پر شده؛ تصویرهای بلااستفاده را حذف کن")
        os.makedirs(config.upload_dir, exist_ok=True)
        path = os.path.join(config.upload_dir, name)
        if not os.path.exists(path):
            with open(path, "wb") as fh:
                fh.write(data)
        await self.db.record_upload(name, user.id, len(data))
        return {"url": f"{config.base_url}/u/{name}"}

    # ---------- صفحه عمومی ----------
    async def page(self, slug: str) -> dict:
        app = await self.db.get_app_by_slug(slug)
        if not app:
            raise ApiError(404, "این مینی اپ وجود ندارد")
        if app["status"] != "active":
            return {"name": app["name"], "paused": True}
        plan = effective_plan(await self.db.get_user(app["owner_id"]))
        doc = load_doc(app["published"])
        # اگر پلن صاحب اپ منقضی شده، صفحه‌ها و کامپوننت‌های بیش از سقف و
        # پریمیوم نمایش داده نمی‌شوند؛ صفحه نمی‌شکند، فقط کوتاه می‌شود.
        budget = plan.max_blocks
        pages = []
        for pg in doc.get("pages", [])[: plan.max_pages]:
            visible = [
                b for b in pg.get("blocks", [])
                if plan.premium_blocks or not blocks.SCHEMA.get(b.get("type"), {}).get("premium")
            ][: max(0, budget)]
            budget -= len(visible)
            pages.append(dict(pg, blocks=visible))
        doc["pages"] = pages
        blocks.reader_view(doc)
        kits.public_view(doc)
        return {
            "name": app["name"],
            "doc": doc,
            "branding": plan.branding,
            "brand_bot": await self.db.get_setting("bot_username", "EasySazBot"),
        }

    async def view(self, slug: str, init_data: str) -> dict:
        """ثبت بازدید. فقط با initData معتبرِ ربات همین اپ شمرده می شود."""
        app = await self.db.get_app_by_slug(slug)
        if not app or not app["bot_token_enc"] or not init_data:
            return {"ok": False}
        token = secure.decrypt_token(app["bot_token_enc"])
        if not token:  # بدون توکن مشتری، verify به توکن ربات اصلی برمی گشت
            return {"ok": False}
        try:
            user = verify(init_data, token)
        except AuthError:
            return {"ok": False}
        if not _rate_ok(("view", app["id"], user.id), limit=10):
            return {"ok": False}
        await self.db.record_view(app["id"], user.id)
        return {"ok": True}


def dumps(body: dict) -> str:
    return json.dumps(body, ensure_ascii=False, separators=(",", ":"))
