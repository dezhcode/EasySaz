"""API ربات‌ساز برای مینی‌اپ ایزی‌ساز (فقط صاحب مینی‌اپ، با initData ربات اصلی).

  GET  /api/bot?id=            سند پیش‌نویس، منتشرشده، آمار، ایموجی‌ها
  POST /api/bot/save           ذخیرهٔ پیش‌نویس
  POST /api/bot/publish        انتشار برای همهٔ کاربرهای ربات
  POST /api/bot/off            خاموش کردن ربات‌ساز (ربات به خوش‌آمد ساده برمی‌گردد)
  POST /api/bot/test           تست در چت واقعی: پیش‌نویس فقط برای صاحب ربات
  POST /api/bot/takeover       اجرای ربات روی ایزی‌ساز (وبهوک)
  POST /api/bot/emoji_pack     افزودن یک بستهٔ ایموجی با لینک t.me/addemoji/…
  POST /api/bot/emoji_del      حذف یک ایموجی از کتابخانه
  GET  /api/bot/ai?id=         گفتگوی دستیار ساخت ربات، سهم امروز
  POST /api/bot/ai_send        پیام تازه به دستیار (کار پس‌زمینه؛ شمارهٔ نوبت برمی‌گردد)
  GET  /api/bot/ai_poll?id=&turn=  متن در حال تایپ، جای صف، نتیجه و پیش‌نویس تازه
  POST /api/bot/ai_undo        برگرداندن پیش‌نویس به پیش از یک نوبت
  POST /api/bot/ai_stop        توقف نوبت در جریان (پیش‌نویس دست نمی‌خورد)
  POST /api/bot/ai_restore     برگشت پیش‌نویس به «نسخهٔ» بعد از یک نوبت (یا نسخهٔ منتشرشده)
  GET  /api/bot/ai_compare?id=&turn=  قبل و بعد پیام‌های عوض‌شده در یک نوبت
  GET  /api/bot/data?id=&form= فرم‌ها و جواب‌های ثبت‌شده با کار «ثبت در داده‌ها»
  POST /api/bot/data_export    فایل CSV یک فرم در چت صاحب ربات
  GET  /api/bot/shop?id=       محصولات، دسته‌ها، شمار سفارش‌ها
  POST /api/bot/product_save   محصول تازه یا ویرایش (عکس، قیمت، موجودی، دسته)
  POST /api/bot/product_del    حذف محصول
  GET  /api/bot/orders?id=&status=  سفارش‌ها
  POST /api/bot/order_status   وضعیت سفارش (به مشتری پیام می‌رود)
"""
from __future__ import annotations

import csv
import html
import io
import logging
import re
import time

from aiogram.exceptions import TelegramAPIError
from aiogram.types import BufferedInputFile

from ..clients import LinkError
from ..config import config
from .. import plans
from . import agent, ai_client, schema, shop, store

log = logging.getLogger("easysaz.botkit.api")

PACK_RE = re.compile(r"(?:t\.me/addemoji/|addemoji/)?([A-Za-z0-9_]{3,64})/?$")

ACTIONS = {"": "GET", "save": "POST", "publish": "POST", "off": "POST", "test": "POST", "takeover": "POST",
           "emoji_pack": "POST", "emoji_del": "POST", "ai": "GET", "ai_send": "POST", "ai_poll": "GET", "ai_undo": "POST", "ai_stop": "POST", "ai_restore": "POST", "ai_compare": "GET",
           "data": "GET", "data_export": "POST", "shop": "GET", "product_save": "POST", "product_del": "POST",
           "orders": "GET", "order_status": "POST"}


def _image_b64(raw: object) -> str | None:
    """عکس پیوست دستیار: data URL یا base64 خالص، حداکثر حدود ۱ مگابایت."""
    if not isinstance(raw, str) or not raw:
        return None
    m = re.match(r"^data:image/(?:jpeg|png|webp);base64,", raw)
    b64 = raw[m.end():] if m else raw
    if len(b64) > 800_000 or not re.fullmatch(r"[A-Za-z0-9+/=\s]+", b64[:2000]):
        raise _err(400, "عکس خیلی بزرگ یا نامعتبر است")
    return b64


def _err(status: int, message: str):  # noqa: ANN202
    from ..webapp.api import ApiError

    return ApiError(status, message)


class BotApi:
    def __init__(self, api, main_bot) -> None:  # noqa: ANN001
        self.api = api
        self.db = api.db
        self.clients = api.clients
        self.main_bot = main_bot

    async def _ctx(self, init_data: str, app_id: object, write: bool = False):  # noqa: ANN202
        user, plan = await self.api._owner(init_data, write=write)
        await self.db.execute("UPDATE users SET is_premium = ? WHERE tg_id = ?", (int(user.is_premium), user.id))
        app = await self.api._owned(user.id, app_id)
        return user, plan, app

    def _bot_json(self, app, row) -> dict:  # noqa: ANN001
        return {
            "connected": bool(app["bot_token_enc"]),
            "username": app["bot_username"] or "",
            "name": app["bot_name"] or "",
            "mode": app["mode"],
            "live": bool(row and row["published"]),
            "published_at": row["published_at"] if row else None,
        }

    def _clean(self, raw: object) -> dict:
        try:
            return schema.clean_doc(raw)
        except schema.BotDocError as exc:
            raise _err(400, str(exc)) from exc

    async def handle(self, action: str, init_data: str, query: dict, body: dict) -> dict:
        if action == "":
            return await self.get(init_data, query.get("id"))
        if action in ("ai", "ai_poll", "ai_compare", "data", "shop", "orders"):
            return await getattr(self, action)(init_data, query)
        return await getattr(self, action)(init_data, body)

    # ------------------------------------------------------------ خواندن
    async def get(self, init_data: str, app_id: object) -> dict:
        user, _plan, app = await self._ctx(init_data, app_id)
        row = await store.flow_row(self.db, app["id"])
        draft = await store.load(self.db, app["id"])
        pub = await store.load(self.db, app["id"], published=True)
        return {
            "app": {"id": app["id"], "name": app["name"], "slug": app["slug"], "url": config.page_url(app["slug"])},
            "bot": self._bot_json(app, row),
            "doc": draft or schema.empty_doc(app["name"]),
            "published": pub,
            "fresh": draft is None,
            "stats": await store.stats(self.db, app["id"]),
            "emoji": await store.emoji_list(self.db, app["id"]),
            "premium": bool(user.is_premium),
            "main_bot": await self.db.get_setting("bot_username", "EasySazBot"),
            "limits": {"msgs": schema.MAX_MSGS, "vars": schema.MAX_VARS},
        }

    # ------------------------------------------------------------ نوشتن
    async def save(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        doc = self._clean(body.get("doc"))
        await store.save_draft(self.db, app["id"], doc)
        return {"doc": doc}

    async def _run_here(self, app) -> None:  # noqa: ANN001
        """ربات باید وبهوکش روی ایزی‌ساز باشد (حالت کنترل کامل)."""
        try:
            if app["mode"] != "full":
                await self.clients.apply(app, "full")
                await self.db.set_mode(app["id"], "full")
            else:
                await self.clients.ensure_updates(app)
        except LinkError as exc:
            raise _err(400, str(exc)) from exc

    async def publish(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if not app["bot_token_enc"]:
            raise _err(400, "اول ربات را وصل کن")
        doc = self._clean(body.get("doc"))
        if not doc["msgs"]:
            raise _err(400, "ربات هنوز پیامی ندارد")
        await self._run_here(app)
        await store.publish(self.db, app["id"], doc)
        app = await self.db.get_app(app["id"])
        return {"doc": doc, "published": doc, "bot": self._bot_json(app, await store.flow_row(self.db, app["id"])),
                "stats": await store.stats(self.db, app["id"])}

    async def off(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        await store.unpublish(self.db, app["id"])
        return {"bot": self._bot_json(app, await store.flow_row(self.db, app["id"])), "published": None}

    async def takeover(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if not app["bot_token_enc"]:
            raise _err(400, "اول ربات را وصل کن")
        await self._run_here(app)
        app = await self.db.get_app(app["id"])
        return {"bot": self._bot_json(app, await store.flow_row(self.db, app["id"]))}

    async def test(self, init_data: str, body: dict) -> dict:
        user, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if not app["bot_token_enc"]:
            raise _err(400, "اول ربات را وصل کن")
        if app["mode"] != "full":
            raise _err(409, "need_full")
        doc = self._clean(body.get("doc")) if isinstance(body.get("doc"), dict) else None
        if doc is not None:
            await store.save_draft(self.db, app["id"], doc)
        if not app["bot_username"]:
            raise _err(400, "توکن ربات خوانده نشد؛ دوباره وصلش کن")
        # تست از خود ربات واقعی: مینی‌اپ جمع می‌شود و چت ربات با لینک استارت باز می‌شود؛
        # ربات با /start test (یا t_<پیام>) حالت تست را روشن می‌کند و پیش‌نویس را جلوی چشم صاحبش می‌فرستد.
        frm = schema._id(body.get("from"))
        payload = f"t_{frm}" if frm and doc is not None and schema.find(doc, frm) else "test"
        return {"ok": True, "link": f"https://t.me/{app['bot_username']}?start={payload}"}

    # ------------------------------------------------------------ داده‌ها (جواب فرم‌ها)
    async def data(self, init_data: str, query: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, query.get("id"))
        forms = await store.forms(self.db, app["id"])
        form = str(query.get("form") or "")[:40]
        out: dict = {"forms": forms}
        if form:
            out["form"] = form
            out["rows"] = await store.rows_of(self.db, app["id"], form)
        return out

    async def data_export(self, init_data: str, body: dict) -> dict:
        """فایل CSV جواب‌های یک فرم را ربات ایزی‌ساز در چت صاحبش می‌فرستد."""
        user, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        form = str(body.get("form") or "")[:40]
        rows = await store.rows_of(self.db, app["id"], form, limit=5000)
        if not rows:
            raise _err(404, "هنوز جوابی برای این فرم ثبت نشده")
        cols: list[str] = []
        for r in rows:
            for k in r["data"]:
                if k not in cols:
                    cols.append(k)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["ردیف", "زمان", "شناسه", "نام", "یوزرنیم", *cols, "تست"])
        for i, r in enumerate(reversed(rows), 1):
            when = time.strftime("%Y-%m-%d %H:%M", time.gmtime(r["at"] + 3.5 * 3600))
            w.writerow([i, when, r["tg_id"], r["name"], ("@" + r["username"]) if r["username"] else "",
                        *[str(r["data"].get(c, "")) for c in cols], "بله" if r["test"] else ""])
        data = ("\ufeff" + buf.getvalue()).encode("utf-8")   # BOM: اکسل فارسی را درست باز کند
        safe = re.sub(r"[^\w\-]+", "_", form, flags=re.UNICODE).strip("_") or "form"
        try:
            await self.main_bot.send_document(
                user.id, BufferedInputFile(data, filename=f"{safe}.csv"),
                caption=f"📊 جواب‌های «{html.escape(form)}» · {len(rows)} ردیف",
            )
        except TelegramAPIError as exc:
            log.info("csv export failed: %s", exc)
            raise _err(400, "ربات ایزی‌ساز نتوانست فایل را بفرستد؛ اول ربات را استارت کن") from exc
        return {"ok": True, "count": len(rows)}

    # ------------------------------------------------------------ فروشگاه
    async def _shop_json(self, app_id: int) -> dict:
        items = await shop.products(self.db, app_id)
        return {"products": items, "cats": sorted({p["cat"] for p in items if p["cat"]}),
                "counts": await shop.order_counts(self.db, app_id), "max": shop.MAX_PRODUCTS}

    async def shop(self, init_data: str, query: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, query.get("id"))
        return await self._shop_json(app["id"])

    async def product_save(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        try:
            p = await shop.save_product(self.db, app["id"], body.get("product") or {})
        except schema.BotDocError as exc:
            raise _err(400, str(exc)) from exc
        return {"product": p, **await self._shop_json(app["id"])}

    async def product_del(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        await shop.delete_product(self.db, app["id"], body.get("product"))
        return await self._shop_json(app["id"])

    async def orders(self, init_data: str, query: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, query.get("id"))
        return {"orders": await shop.orders(self.db, app["id"], str(query.get("status") or "")),
                "counts": await shop.order_counts(self.db, app["id"])}

    async def order_status(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        status = str(body.get("status") or "")
        if status not in shop.STATUSES:
            raise _err(400, "وضعیت نامعتبر است")
        o = await shop.set_status(self.db, self.clients.for_app(app), app, body.get("order"), status)
        if o is None:
            raise _err(404, "سفارش پیدا نشد")
        return {"order": o, "counts": await shop.order_counts(self.db, app["id"])}

    # ------------------------------------------------------------ ایموجی
    async def emoji_pack(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        m = PACK_RE.search(str(body.get("link") or "").strip())
        if not m:
            raise _err(400, "لینک بسته باید مثل t.me/addemoji/نام باشد")
        items, name = await fetch_pack(self.main_bot, m.group(1))
        if not items:
            raise _err(404, "این بسته پیدا نشد یا ایموجی پریمیوم ندارد")
        added = await store.emoji_add(self.db, app["id"], items, pack=name)
        return {"added": added, "emoji": await store.emoji_list(self.db, app["id"])}

    async def emoji_del(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        await store.emoji_remove(self.db, app["id"], str(body.get("emoji") or ""))
        return {"emoji": await store.emoji_list(self.db, app["id"])}

    # ------------------------------------------------------------ دستیار هوش مصنوعی
    async def _quota(self, user_id: int, plan) -> dict:  # noqa: ANN001
        p = plan if isinstance(plan, plans.Plan) else plans.get(getattr(plan, "key", None))
        return {"used": await agent.used_today(self.db, user_id), "limit": p.ai_daily}

    async def ai(self, init_data: str, query: dict) -> dict:
        user, plan, app = await self._ctx(init_data, query.get("id"))
        await agent.expire_stale(self.db)
        doc = await store.load(self.db, app["id"]) or schema.empty_doc(app["name"])
        return {"enabled": ai_client.enabled(), "turns": await agent.history(self.db, app["id"]),
                "quota": await self._quota(user.id, plan), "max_ask": agent.MAX_ASK, "insights": agent.insights(doc)}

    async def ai_send(self, init_data: str, body: dict) -> dict:
        user, plan, app = await self._ctx(init_data, body.get("id"), write=True)
        if not ai_client.enabled():
            raise _err(503, "دستیار هوش مصنوعی روی این سرور روشن نشده")
        ask = schema._s(body.get("text"), agent.MAX_ASK)
        if not ask:
            raise _err(400, "پیامت خالی است")
        q = await self._quota(user.id, plan)
        if q["used"] >= q["limit"]:
            raise _err(429, f"سهم امروزت ({schema.fa_number(q['limit'])} پیام) تمام شد؛ فردا دوباره")
        busy = await self.db.fetchone("SELECT id FROM bk_ai_turns WHERE app_id = ? AND status IN ('queued','running') AND updated_at > ?",
                                      (app["id"], store.now() - agent.STALE))
        if busy:
            raise _err(409, "دستیار هنوز روی پیام قبلی کار می‌کند")
        # پایه همان چیزی است که کاربر الان در مینی‌اپ می‌بیند
        base = self._clean(body["doc"]) if isinstance(body.get("doc"), dict) else (await store.load(self.db, app["id"]) or schema.empty_doc(app["name"]))
        await store.save_draft(self.db, app["id"], base)
        focus = schema._id(body.get("focus")) or None
        image = _image_b64(body.get("image"))
        row = await store.flow_row(self.db, app["id"])
        info = {"BOT_NAME": app["bot_name"] or app["name"], "BOT_USERNAME": ("@" + app["bot_username"]) if app["bot_username"] else "(not connected yet)",
                "MINI_APP_NAME": app["name"], "MINI_APP_URL": config.page_url(app["slug"]),
                "PUBLISHED": "yes" if row and row["published"] else "not yet"}
        turn = await agent.start_job(self.db, app["id"], user.id, base, ("📷 " if image else "") + ask, focus, info, image)
        return {"turn": turn, "pos": await agent.queue_pos(self.db, turn), "quota": {"used": q["used"] + 1, "limit": q["limit"]}}

    async def ai_poll(self, init_data: str, query: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, query.get("id"))
        try:
            turn_id = int(query.get("turn") or 0)
        except (TypeError, ValueError):
            turn_id = 0
        row = await self.db.fetchone("SELECT * FROM bk_ai_turns WHERE id = ? AND app_id = ?", (turn_id, app["id"]))
        if not row:
            raise _err(404, "پیدا نشد")
        if row["status"] in ("queued", "running") and row["updated_at"] < store.now() - agent.STALE:
            await agent.expire_stale(self.db)
            row = await self.db.fetchone("SELECT * FROM bk_ai_turns WHERE id = ?", (turn_id,))
        out = {"turn": agent.turn_json(row)}
        if row["status"] == "queued":
            out["pos"] = await agent.queue_pos(self.db, turn_id)
        if row["status"] == "done":
            out["doc"] = await store.load(self.db, app["id"])
        return out

    async def ai_stop(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        try:
            turn_id = int(body.get("turn") or 0)
        except (TypeError, ValueError):
            turn_id = 0
        await self.db.execute("UPDATE bk_ai_turns SET status = 'error', error = ?, updated_at = ? WHERE id = ? AND app_id = ? AND status IN ('queued','running')",
                              ("متوقفش کردی؛ پیش‌نویس دست نخورد", store.now(), turn_id, app["id"]))
        return {"turns": await agent.history(self.db, app["id"])}

    async def ai_undo(self, init_data: str, body: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        try:
            turn_id = int(body.get("turn") or 0)
        except (TypeError, ValueError):
            turn_id = 0
        row = await self.db.fetchone("SELECT * FROM bk_ai_turns WHERE id = ? AND app_id = ? AND status = 'done'", (turn_id, app["id"]))
        if not row or not row["doc_before"]:
            raise _err(404, "این نقطه برای برگشت پیدا نشد")
        doc = self._clean(store._loads(row["doc_before"], {}))
        await store.save_draft(self.db, app["id"], doc)
        # این نوبت و بعدی‌ها «برگردانده‌شده» علامت می‌خورند
        await self._mark_undone(app["id"], lambda tid: tid >= turn_id)
        return {"doc": doc, "turns": await agent.history(self.db, app["id"])}

    async def _mark_undone(self, app_id: int, undone) -> None:  # noqa: ANN001
        for r in await self.db.fetchall("SELECT id, result FROM bk_ai_turns WHERE app_id = ? AND status = 'done'", (app_id,)):
            res = store._loads(r["result"], {})
            if not res.get("changes"):
                continue
            want = bool(undone(r["id"]))
            if bool(res.get("undone")) != want:
                res["undone"] = want
                await self.db.execute("UPDATE bk_ai_turns SET result = ? WHERE id = ?", (store._dumps(res), r["id"]))

    async def ai_restore(self, init_data: str, body: dict) -> dict:
        """«برگرد به نسخهٔ k»: پیش‌نویس همان می‌شود که بعد از نوبت k بود؛ نوبت‌های بعدی کم‌رنگ می‌شوند
        و می‌شود دوباره به جلو برگشت. published=true یعنی پیش‌نویس = نسخهٔ منتشرشده."""
        _u, _p, app = await self._ctx(init_data, body.get("id"), write=True)
        if body.get("published"):
            doc = await store.load(self.db, app["id"], published=True)
            if doc is None:
                raise _err(404, "هنوز نسخهٔ منتشرشده‌ای نیست")
            await store.save_draft(self.db, app["id"], doc)
            await self._mark_undone(app["id"], lambda tid: True)
            return {"doc": doc, "turns": await agent.history(self.db, app["id"])}
        try:
            turn_id = int(body.get("turn") or 0)
        except (TypeError, ValueError):
            turn_id = 0
        row = await self.db.fetchone("SELECT doc_after FROM bk_ai_turns WHERE id = ? AND app_id = ? AND status = 'done'", (turn_id, app["id"]))
        if not row or not row["doc_after"]:
            raise _err(404, "این نسخه پیدا نشد")
        doc = self._clean(store._loads(row["doc_after"], {}))
        await store.save_draft(self.db, app["id"], doc)
        await self._mark_undone(app["id"], lambda tid: tid > turn_id)
        return {"doc": doc, "turns": await agent.history(self.db, app["id"])}

    async def ai_compare(self, init_data: str, query: dict) -> dict:
        _u, _p, app = await self._ctx(init_data, query.get("id"))
        try:
            turn_id = int(query.get("turn") or 0)
        except (TypeError, ValueError):
            turn_id = 0
        row = await self.db.fetchone("SELECT doc_before, doc_after FROM bk_ai_turns WHERE id = ? AND app_id = ? AND status = 'done'", (turn_id, app["id"]))
        if not row or not row["doc_after"]:
            raise _err(404, "این نسخه پیدا نشد")
        return {"items": agent.compare(store._loads(row["doc_before"], {}), store._loads(row["doc_after"], {}))}


async def fetch_pack(bot, name: str) -> tuple[list[tuple[str, str]], str]:  # noqa: ANN001
    try:
        st = await bot.get_sticker_set(name=name)
    except TelegramAPIError:
        return [], name
    items = [(s.custom_emoji_id, s.emoji or "⭐") for s in st.stickers if getattr(s, "custom_emoji_id", None)]
    return items, st.name
