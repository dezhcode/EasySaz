"""API مجله.

خواننده (/api/page/<slug>/mag/<کار>): عمومی؛ فقط مطلب‌های منتشرشده.
  list   فهرست با فیلتر دسته/برچسب/نویسنده/جستجو      (GET)
  post   متن کامل یک مطلب (+ شمارش بازدید با v=1)       (GET)

صاحب مینی‌اپ: همین کارها هم از مینی‌اپ ایزی‌ساز (/api/kit/mag/<کار>، initData)
و هم از سایت (/site/api/mag/<کار>، کوکی) می‌رسند؛ هر دو اینجا به Owner می‌رسند.
مینی‌اپ ایزی‌ساز فقط محتوا: مطلب بنویسد، ویرایش کند، پاک کند و پست کانال
بفرستد. دسته‌ها و نویسنده‌ها و طراحی فقط از سایت.
"""
from __future__ import annotations

import html
import logging
import re
from typing import Any

from aiogram.exceptions import TelegramAPIError
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.webapp.api import ApiError, _rate_ok

from . import MagError, delete_author, delete_cat, delete_post, get_owned_post, listing, now, order, owner_data
from . import post as read_post
from . import save_author, save_cat, save_post

log = logging.getLogger("easysaz.mag")

READER = ("list", "post")
# کارهای صاحب: (روش، فقط سایت؟)
OWNER = {
    "data": ("GET", False), "get": ("GET", False), "save": ("POST", False), "delete": ("POST", False),
    "channel_post": ("POST", False),
    "cat_save": ("POST", True), "cat_delete": ("POST", True), "cat_order": ("POST", True),
    "author_save": ("POST", True), "author_delete": ("POST", True), "author_order": ("POST", True),
}


def deep_link(app, pid: str) -> str:  # noqa: ANN001
    return f"https://t.me/{app['bot_username']}?start=a_{pid}" if app["bot_username"] else ""


def _err(exc: MagError) -> ApiError:
    return ApiError(exc.status, exc.message)


async def reader(db, app, action: str, query: dict) -> dict:  # noqa: ANN001
    try:
        if action == "list":
            return await listing(db, app["id"], query)
        if action == "post":
            count = query.get("v") == "1" and _rate_ok(("magv", app["id"], query.get("id"), query.get("_ip")), limit=3, window=600)
            return {"post": await read_post(db, app["id"], str(query.get("id") or ""), count=bool(count))}
    except MagError as exc:
        raise _err(exc) from exc
    raise ApiError(404, "پیدا نشد")


class Owner:
    """کارهای صاحب مجله؛ app و uid را لایهٔ احراز هویت (پنل یا سایت) داده است."""

    def __init__(self, db, clients, app, uid: int, name: str, source: str) -> None:  # noqa: ANN001
        self.db, self.clients, self.app, self.uid, self.name, self.source = db, clients, app, uid, name, source

    def _with_link(self, p: dict) -> dict:
        p["link"] = deep_link(self.app, p["id"])
        return p

    async def run(self, action: str, body: dict) -> dict:
        a = self.app["id"]
        try:
            if action == "data":
                d = await owner_data(self.db, a)
                d["posts"] = [self._with_link(p) for p in d["posts"]]
                d["channel"] = ({"id": self.app["channel_id"], "username": self.app["channel_username"] or "",
                                 "title": self.app["channel_title"] or ""} if self.app["channel_id"] else None)
                d["bot"] = self.app["bot_username"] or ""
                d["mode"] = self.app["mode"]
                return d
            if action == "get":
                row = await get_owned_post(self.db, a, body.get("id"))
                from . import _loads, owner_row

                return {"post": self._with_link(dict(owner_row(row), body=_loads(row["body"], [])))}
            if action == "save":
                p = await save_post(self.db, a, self.uid, body, self.source, self.name)
                out = {"post": self._with_link(p)}
                if body.get("to_channel") and p["state"] == "pub":
                    out["channel"] = await self.channel_post({"id": p["id"]})
                return out
            if action == "delete":
                await delete_post(self.db, a, body.get("id"))
                return {"ok": True}
            if action == "channel_post":
                return await self.channel_post(body)
            if action == "cat_save":
                return await save_cat(self.db, a, body)
            if action == "cat_delete":
                await delete_cat(self.db, a, body.get("id"))
                return {"ok": True}
            if action == "cat_order":
                await order(self.db, a, "mag_cats", body.get("ids"))
                return {"ok": True}
            if action == "author_save":
                return await save_author(self.db, a, body)
            if action == "author_delete":
                await delete_author(self.db, a, body.get("id"))
                return {"ok": True}
            if action == "author_order":
                await order(self.db, a, "mag_authors", body.get("ids"))
                return {"ok": True}
        except MagError as exc:
            raise _err(exc) from exc
        raise ApiError(404, "پیدا نشد")

    async def channel_post(self, body: dict) -> dict:
        """پست کانال: کاور، تیتر و متن کوتاه با دکمه‌ای که همین مطلب را در مینی‌اپ باز می‌کند."""
        app = self.app
        row = await get_owned_post(self.db, app["id"], body.get("id"))
        if row["status"] != "pub" or (row["pub_at"] or 0) > now():
            raise ApiError(400, "اول مطلب را منتشر کن؛ بعد پستش را در کانال بگذار")
        bot = self.clients.for_app(app)
        if bot is None:
            raise ApiError(400, "اول ربات مینی‌اپ را وصل کن")
        if app["mode"] != "full":
            raise ApiError(400, "برای این‌که دکمهٔ پست همان مطلب را باز کند، ربات باید در حالت «کنترل کامل» باشد")
        if not app["channel_id"]:
            raise ApiError(400, "اول کانال را در تنظیمات ثبت کن؛ ربات باید ادمین کانال باشد")
        if not _rate_ok(("magpost", app["id"]), limit=6, window=300):
            raise ApiError(429, "چند پست پشت سر هم فرستادی؛ چند دقیقه صبر کن")
        intro = re.sub(r"\s+", " ", str(body.get("text") or row["lead"] or "")).strip()[:700]
        cta = re.sub(r"\s+", " ", str(body.get("button") or "")).strip()[:30] or "ادامه در مینی‌اپ"
        caption = f"<b>{html.escape(row['title'])}</b>" + (f"\n\n{html.escape(intro)}" if intro else "")
        kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=f"📖 {cta}", url=deep_link(app, row["id"]))]])
        try:
            if row["cover"] and len(caption) <= 1000:
                try:
                    await bot.send_photo(app["channel_id"], photo=row["cover"], caption=caption, parse_mode="HTML", reply_markup=kb)
                except TelegramAPIError:  # تلگرام به عکس نرسید؛ متن خالی بهتر از هیچ
                    await bot.send_message(app["channel_id"], caption, parse_mode="HTML", reply_markup=kb)
            else:
                await bot.send_message(app["channel_id"], caption, parse_mode="HTML", reply_markup=kb)
        except TelegramAPIError as exc:
            log.info("mag channel post failed app=%s: %s", app["id"], exc)
            raise ApiError(400, "تلگرام پست را نپذیرفت؛ ربات هنوز ادمین کانال است؟") from None
        await self.db.execute("UPDATE mag_posts SET posted_at = ? WHERE app_id = ? AND id = ?", (now(), app["id"], row["id"]))
        return {"ok": True, "channel": app["channel_title"] or app["channel_username"] or ""}


def check_action(action: str, method: str, site: bool) -> None:
    spec = OWNER.get(action)
    if not spec or spec[0] != method:
        raise ApiError(404, "پیدا نشد")
    if spec[1] and not site:
        raise ApiError(403, "دسته‌ها و نویسنده‌ها را از سایت ایزی‌ساز مدیریت کن")


def as_int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(400, "شناسه نامعتبر") from None


async def panel(api, action: str, method: str, init_data: str, query: dict, body: dict) -> dict:  # noqa: ANN001
    """از مینی‌اپ ایزی‌ساز (initData ربات اصلی)."""
    from app.db import load_doc

    check_action(action, method, site=False)
    user, _ = await api._owner(init_data, write=method == "POST")
    app = await api._owned(user.id, (body if method == "POST" else query).get("app"))
    if (load_doc(app["draft"]) or {}).get("kit") != "mag":
        raise ApiError(400, "این مینی‌اپ قالب مجله ندارد")
    return await Owner(api.db, api.clients, app, user.id, user.first_name, "tg").run(action, body if method == "POST" else query)
