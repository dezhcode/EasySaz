"""استودیوی سایت: ساختن و طراحی مینی‌اپ از سایت (کوکی نشست).

  GET  /site/api/apps                   مینی‌اپ‌های من + قالب‌ها
  POST /site/api/app/create {name, template}
  GET  /site/api/app?id=                سند پیش‌نویس، دادهٔ قالب و پیش‌نمایش
  POST /site/api/app/save|publish {id, doc}   طراحی (فقط این‌جا برای قالب‌های site_only)
  POST /site/api/app/template {id, template}  عوض کردن قالب
  POST /site/api/app/rename {id, name}
  POST /site/api/app/channel {id, channel}    کانال برای پست مطلب‌ها
  POST /site/api/upload {data}          تصویر (data URL)
  POST /site/api/upload_media           صوت/ویدیو (بدنه = فایل)
  *    /site/api/mag/<کار>              مطلب، دسته و نویسنده (app/kits/mag/api.py)
"""
from __future__ import annotations

import json
import os
import re
from typing import Any

from app import blocks, kits, templates
from app.config import config
from app.db import effective_plan, load_doc
from app.webapp.api import ApiError, _app_json, _decode_image, _plan_json, _rate_ok, clean_name, UPLOAD_MAX_BYTES, UPLOAD_MAX_FILES


def _mag_demo() -> dict:
    from app.kits import mag

    return mag.demo_home(blocks.sample_prefix())


class Studio:
    def __init__(self, db, clients, uid: int) -> None:  # noqa: ANN001
        self.db, self.clients, self.uid = db, clients, uid

    async def _user(self):  # noqa: ANN202
        row = await self.db.get_user(self.uid)
        if row and row["is_blocked"]:
            raise ApiError(403, "دسترسی تو محدود شده")
        return row, effective_plan(row)

    async def _app(self, app_id: Any):  # noqa: ANN202
        try:
            aid = int(app_id)
        except (TypeError, ValueError):
            raise ApiError(400, "شناسه نامعتبر") from None
        app = await self.db.get_owned_app(self.uid, aid)
        if not app:
            raise ApiError(404, "مینی‌اپ پیدا نشد")
        return app

    def _write(self) -> None:
        if not _rate_ok(("site", self.uid), limit=60):
            raise ApiError(429, "کمی آهسته‌تر 🙂")

    async def apps(self) -> dict:
        row, plan = await self._user()
        apps = await self.db.list_apps(self.uid)
        return {
            "apps": [dict(_app_json(a), stats=await self.db.app_stats(a["id"])) for a in apps],
            "plan": _plan_json(plan),
            "can_create": len(apps) < plan.max_apps,
            "templates": [dict({k: t[k] for k in ("id", "title", "desc", "kit", "accent", "note", "pages")},
                               doc=self._template_doc(t["id"], t["title"]),
                               parts=len({b["type"] for b in blocks.all_blocks(t["doc"])}),
                               store=next((x for x in templates.STORE if x.get("template") == t["id"]), {}))
                          for t in templates.TEMPLATES],
            "demo": {"mag": _mag_demo()},
            "store": templates.STORE,
            "bot": await self.db.get_setting("bot_username", "") or "EasySazBot",
        }

    def _template_doc(self, tid: str, name: str) -> dict:
        t = templates.BY_ID.get(tid)
        if not t:
            raise ApiError(400, "این قالب پیدا نشد")
        safe = name.replace('"', "").replace("\\", "")
        return json.loads(json.dumps(t["doc"], ensure_ascii=False).replace("{name}", safe))

    async def _install(self, app, tid: str) -> dict:  # noqa: ANN001
        _, plan = await self._user()
        doc = self._template_doc(tid, app["name"])
        try:
            doc = blocks.clean_page(doc, max_blocks=plan.max_blocks, premium=plan.premium_blocks, max_pages=max(plan.max_pages, 4))
        except blocks.PageError as exc:
            raise ApiError(402, str(exc)) from exc
        old = load_doc(app["draft"]).get("kit")
        if old and old != doc["kit"]:
            await kits.remove(self.db, app["id"])
        await self.db.publish(app["id"], doc)
        if doc["kit"] == "mag":
            from app.kits import mag

            user = await self.db.get_user(self.uid)
            await mag.seed(self.db, app["id"], self.uid, (user["first_name"] if user else "") or "نویسنده")
        return doc

    async def create(self, body: dict) -> dict:
        self._write()
        _, plan = await self._user()
        name = clean_name(body.get("name"))
        app_id = await self.db.create_app(self.uid, name, plan.max_apps)
        if not app_id:
            raise ApiError(402, f"پلن {plan.title} فقط {plan.max_apps} مینی‌اپ دارد. برای بیشتر، پلن بگیر.")
        app = await self.db.get_app(app_id)
        if body.get("template"):
            await self._install(app, str(body["template"]))
        app = await self.db.get_app(app_id)
        return {"app": _app_json(app)}

    async def app(self, query: dict) -> dict:
        app = await self._app(query.get("id"))
        _, plan = await self._user()
        doc = load_doc(app["draft"])
        # نسخهٔ منتشرشده برای فهرست «تغییرهای منتشرنشده» و برگرداندن تکی
        published = load_doc(app["published"]) if app["published"] else None
        out = {"app": _app_json(app), "doc": doc, "published": published, "plan": _plan_json(plan),
               "stats": await self.db.app_stats(app["id"]), "schema": {"kits": blocks.KITS}}
        if doc.get("kit") == "mag":
            from app.kits import mag

            out["mag_home"] = await mag.home(self.db, app["id"])
            out["demo_mag"] = _mag_demo()
        return out

    async def _clean(self, app, body: dict) -> dict:  # noqa: ANN001
        _, plan = await self._user()
        raw = body.get("doc") if isinstance(body.get("doc"), dict) else {}
        old = load_doc(app["draft"]).get("kit") or "base"
        if (raw.get("kit") or "base") != old:
            raise ApiError(400, "برای عوض کردن قالب از «قالب» استفاده کن")
        try:
            # صفحه‌های ثابت قالب‌های سایت (مثلاً چهار صفحهٔ مجله) جزو سقف پلن رایگان نیستند
            pages = max(plan.max_pages, 4) if kits.site_only(raw) else plan.max_pages
            return blocks.clean_page(raw, max_blocks=plan.max_blocks, premium=plan.premium_blocks, max_pages=pages)
        except blocks.PageError as exc:
            raise ApiError(402, str(exc)) from exc

    async def save(self, body: dict) -> dict:
        self._write()
        app = await self._app(body.get("id"))
        doc = await self._clean(app, body)
        await self.db.save_draft(app["id"], doc)
        return {"doc": doc, "app": _app_json(await self.db.get_app(app["id"]))}

    async def publish(self, body: dict) -> dict:
        self._write()
        app = await self._app(body.get("id"))
        doc = await self._clean(app, body)
        await self.db.publish(app["id"], doc)
        app = await self.db.get_app(app["id"])
        kit = await kits.on_publish(self.db, app, doc)
        return {"doc": doc, "app": _app_json(app), "kit": kit}

    async def template(self, body: dict) -> dict:
        self._write()
        app = await self._app(body.get("id"))
        doc = await self._install(app, str(body.get("template") or ""))
        return {"doc": doc, "app": _app_json(await self.db.get_app(app["id"]))}

    async def rename(self, body: dict) -> dict:
        self._write()
        app = await self._app(body.get("id"))
        await self.db.rename_app(app["id"], clean_name(body.get("name")))
        app = await self.db.get_app(app["id"])
        try:
            await self.clients.refresh_menu(app)
        except Exception:  # noqa: BLE001 — دکمهٔ منو بعداً هم درست می‌شود
            pass
        return {"app": _app_json(app)}

    async def channel(self, body: dict) -> dict:
        """ثبت کانال برای پست مطلب‌ها؛ ربات مینی‌اپ باید ادمین کانال باشد."""
        self._write()
        app = await self._app(body.get("id"))
        raw = str(body.get("channel") or "").strip()
        if not raw:
            await self.db.set_channel(app["id"], None, None, None)
            return {"channel": None}
        bot = self.clients.for_app(app)
        if bot is None:
            raise ApiError(400, "اول ربات مینی‌اپ را در @EasySazBot وصل کن؛ همان ربات باید ادمین کانال باشد")
        m = re.match(r"^(?:https?://)?(?:t\.me/|telegram\.me/)?@?([A-Za-z][A-Za-z0-9_]{3,31})/?$", raw)
        chat_ref: Any = "@" + m.group(1) if m else (int(raw) if re.match(r"^-100\d{5,}$", raw) else None)
        if chat_ref is None:
            raise ApiError(400, "آیدی کانال را مثل ‎@my_channel‎ بنویس")
        from aiogram.exceptions import TelegramAPIError

        try:
            chat = await bot.get_chat(chat_ref)
            me = await bot.get_chat_member(chat.id, bot.id)
        except TelegramAPIError:
            raise ApiError(400, "این کانال پیدا نشد یا ربات عضوش نیست. ربات را ادمین کانال کن و دوباره بزن.") from None
        if chat.type != "channel":
            raise ApiError(400, "این آیدی مال کانال نیست")
        if me.status not in ("administrator", "creator"):
            raise ApiError(400, f"ربات @{app['bot_username']} باید ادمین کانال باشد")
        await self.db.set_channel(app["id"], chat.id, chat.username, (chat.title or "")[:80])
        return {"channel": {"id": chat.id, "username": chat.username or "", "title": chat.title or ""}}

    async def upload(self, body: dict) -> dict:
        self._write()
        name, data = _decode_image(body.get("data"))
        count, total = await self.db.upload_usage(self.uid)
        if count >= UPLOAD_MAX_FILES or total + len(data) > UPLOAD_MAX_BYTES:
            raise ApiError(402, "فضای تصویرهایت پر شده")
        os.makedirs(config.upload_dir, exist_ok=True)
        path = os.path.join(config.upload_dir, name)
        if not os.path.exists(path):
            with open(path, "wb") as fh:
                fh.write(data)
        await self.db.record_upload(name, self.uid, len(data))
        return {"url": f"{config.base_url}/u/{name}"}

    async def mag(self, action: str, method: str, query: dict, body: dict) -> dict:
        from app.kits.mag import api as mag_api

        mag_api.check_action(action, method, site=True)
        if method == "POST":
            self._write()
        src = body if method == "POST" else query
        app = await self._app(src.get("app"))
        if load_doc(app["draft"]).get("kit") != "mag":
            raise ApiError(400, "این مینی‌اپ قالب مجله ندارد")
        user = await self.db.get_user(self.uid)
        return await mag_api.Owner(self.db, self.clients, app, self.uid, (user["first_name"] if user else "") or "",
                                   "site").run(action, src)
