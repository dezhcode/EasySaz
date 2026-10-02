"""فروشگاه ربات‌ساز: محصولات، سبد خرید، کد تخفیف، سفارش و پرداخت.

محصولات «داده»اند (جدول bk_products، بدون پیش‌نویس)؛ تنظیمات فروشگاه در سند ربات
(doc["shop"]). دکمهٔ «نمایش محصولات» (act shop) کارت محصول با ورق‌زدن می‌سازد و
دکمهٔ «سبد خرید» (act cart) سبد را نشان می‌دهد.

callback ها (حداکثر ۶۴ بایت):
  bs|p|<pid>        نمایش یک محصول (جای همان پیام)
  bs|a|<pid>        افزودن به سبد          bs|l          برگشت به محصولات
  bs|c              سبد خرید               bs|e          ویرایش سبد
  bs|+|<pid> / bs|-|<pid>  تعداد             bs|x          خالی کردن سبد
  bs|k              کد تخفیف              bs|o          ثبت سفارش
  bs|m|<card|cod|stars>    روش پرداخت      bs|s|<order>|<status>  وضعیت (فقط صاحب ربات؛ در engine)
  bs|n              هیچ (شمارهٔ صفحه)

پرداخت: کارت‌به‌کارت (سفارش «منتظر رسید»؛ عکس رسید برای صاحب ربات می‌رود)، در محل،
یا ستارهٔ تلگرام (XTR، payload «bs|<سفارش>»). موجودی هنگام ثبت سفارش کم و با لغو برمی‌گردد.
"""
from __future__ import annotations

import html
import json
import logging
import math

from aiogram.exceptions import TelegramAPIError, TelegramBadRequest
from aiogram.types import (
    CallbackQuery,
    CopyTextButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    LabeledPrice,
    Message,
    PreCheckoutQuery,
)

from . import schema, store

log = logging.getLogger("easysaz.botkit.shop")

MAX_PRODUCTS = 300
STATUSES = ("pending", "new", "paid", "sent", "done", "canceled")
STATUS_FA = {"pending": "منتظر پرداخت", "new": "تازه", "paid": "پرداخت‌شده", "sent": "ارسال‌شده", "done": "تحویل‌شده", "canceled": "لغوشده"}
PAY_FA = {"card": "کارت‌به‌کارت", "cod": "پرداخت در محل", "stars": "ستارهٔ تلگرام"}
WAITS = ("coupon", "shopinfo", "receipt")
TELL = {
    "paid": "✅ پرداخت سفارش <b>#{n}</b> تأیید شد؛ به‌زودی آماده می‌شود.",
    "sent": "🚚 سفارش <b>#{n}</b> ارسال شد.",
    "done": "📬 سفارش <b>#{n}</b> تحویل شد. ممنون از خریدت 🌱",
    "canceled": "❌ سفارش <b>#{n}</b> لغو شد. اگر سؤالی داری همین‌جا بپرس.",
}


# ---------------------------------------------------------------- داده
def _p(row) -> dict:  # noqa: ANN001
    return {"id": row["id"], "title": row["title"], "descr": row["descr"], "price": row["price"], "stock": row["stock"],
            "cat": row["cat"], "photo": row["photo"], "active": bool(row["active"]), "pos": row["pos"]}


async def products(db, app_id: int, active_only: bool = False, cat: str = "") -> list[dict]:  # noqa: ANN001
    sql = "SELECT * FROM bk_products WHERE app_id = ?"
    args: list = [app_id]
    if active_only:
        sql += " AND active = 1"
    if cat:
        sql += " AND cat = ?"
        args.append(cat)
    return [_p(r) for r in await db.fetchall(sql + " ORDER BY pos, id", tuple(args))]


async def product(db, app_id: int, pid: object) -> dict | None:  # noqa: ANN001
    try:
        pid = int(pid)
    except (TypeError, ValueError):
        return None
    row = await db.fetchone("SELECT * FROM bk_products WHERE app_id = ? AND id = ?", (app_id, pid))
    return _p(row) if row else None


def clean_product(raw: object) -> dict:
    r = raw if isinstance(raw, dict) else {}
    title = schema._one_line(r.get("title"), 60)
    if not title:
        raise schema.BotDocError("نام محصول لازم است")
    stock = schema._num(r.get("stock"), -1, 10**6)
    return {
        "title": title,
        "descr": schema.clean_html(schema._s(r.get("descr"), 700)),
        "price": int(max(0, min(10**11, schema.to_number(r.get("price"))))),
        "stock": -1 if stock is None or stock < 0 else int(stock),
        "cat": schema._one_line(r.get("cat"), 30),
        "photo": schema._https(r.get("photo")),
        "active": bool(r.get("active", True)),
    }


async def save_product(db, app_id: int, raw: dict) -> dict:  # noqa: ANN001
    p = clean_product(raw)
    now = store.now()
    old = await product(db, app_id, raw.get("id")) if raw.get("id") else None
    if old:
        await db.execute("UPDATE bk_products SET title=?, descr=?, price=?, stock=?, cat=?, photo=?, active=?, updated_at=? WHERE id=?",
                         (p["title"], p["descr"], p["price"], p["stock"], p["cat"], p["photo"], int(p["active"]), now, old["id"]))
        pid = old["id"]
    else:
        n = (await db.fetchone("SELECT COUNT(*) AS n, COALESCE(MAX(pos), 0) AS m FROM bk_products WHERE app_id = ?", (app_id,)))
        if n["n"] >= MAX_PRODUCTS:
            raise schema.BotDocError(f"حداکثر {MAX_PRODUCTS} محصول")
        pid = await db.insert("INSERT INTO bk_products(app_id, title, descr, price, stock, cat, photo, active, pos, created_at, updated_at) "
                              "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                              (app_id, p["title"], p["descr"], p["price"], p["stock"], p["cat"], p["photo"], int(p["active"]), n["m"] + 1, now, now))
    return await product(db, app_id, pid)


async def delete_product(db, app_id: int, pid: object) -> None:  # noqa: ANN001
    p = await product(db, app_id, pid)
    if p:
        await db.execute("DELETE FROM bk_products WHERE id = ?", (p["id"],))


def _o(row) -> dict:  # noqa: ANN001
    keys = row.keys()
    return {"id": row["id"], "num": row["num"], "tg_id": row["tg_id"], "items": store._loads(row["items"], []),
            "subtotal": row["subtotal"], "discount": row["discount"], "ship": row["ship"], "total": row["total"],
            "coupon": row["coupon"], "pay": row["pay"], "stars": row["stars"], "status": row["status"], "info": row["info"],
            "receipt": bool(row["receipt"]), "test": bool(row["test"]), "at": row["created_at"], "updated_at": row["updated_at"],
            "name": (row["first_name"] if "first_name" in keys else "") or "", "username": (row["username"] if "username" in keys else "") or ""}


async def order(db, app_id: int, oid: object) -> dict | None:  # noqa: ANN001
    try:
        oid = int(oid)
    except (TypeError, ValueError):
        return None
    row = await db.fetchone("SELECT o.*, u.first_name, u.username FROM bk_orders o LEFT JOIN bk_users u ON u.app_id = o.app_id AND u.tg_id = o.tg_id "
                            "WHERE o.app_id = ? AND o.id = ?", (app_id, oid))
    return _o(row) if row else None


async def orders(db, app_id: int, status: str = "", limit: int = 100) -> list[dict]:  # noqa: ANN001
    sql = ("SELECT o.*, u.first_name, u.username FROM bk_orders o LEFT JOIN bk_users u ON u.app_id = o.app_id AND u.tg_id = o.tg_id "
           "WHERE o.app_id = ?")
    args: list = [app_id]
    if status in STATUSES:
        sql += " AND o.status = ?"
        args.append(status)
    args.append(limit)
    return [_o(r) for r in await db.fetchall(sql + " ORDER BY o.id DESC LIMIT ?", tuple(args))]


async def order_counts(db, app_id: int) -> dict:  # noqa: ANN001
    rows = await db.fetchall("SELECT status, COUNT(*) AS n FROM bk_orders WHERE app_id = ? GROUP BY status", (app_id,))
    out = {s: 0 for s in STATUSES}
    for r in rows:
        out[r["status"]] = r["n"]
    today = await db.fetchone("SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS t FROM bk_orders WHERE app_id = ? AND status NOT IN ('pending', 'canceled') "
                              "AND created_at >= ?", (app_id, store.now() - 86400))
    out["today"], out["today_total"] = today["n"], today["t"]
    return out


# ---------------------------------------------------------------- قیمت و سبد
def money(n: int, unit: str = "تومان") -> str:
    return f"{schema.fa_number(n)} {unit}"


def _cart(ctx) -> dict:  # noqa: ANN001
    c = ctx.user.setdefault("state", {}).setdefault("cart", {})
    return c if isinstance(c, dict) else {}


def _shop(ctx) -> dict:  # noqa: ANN001
    return ctx.doc.get("shop") or schema.clean_shop({})


async def priced(ctx) -> dict:  # noqa: ANN001
    """سبد با قیمت امروز؛ محصولِ پاک‌شده یا غیرفعال کنار می‌رود."""
    cart = _cart(ctx)
    lines, sub = [], 0
    for pid, qty in list(cart.items()):
        p = await product(ctx.db, ctx.app["id"], pid)
        if not p or not p["active"] or qty <= 0:
            cart.pop(pid, None)
            continue
        lines.append({"pid": p["id"], "title": p["title"], "price": p["price"], "qty": int(qty), "stock": p["stock"]})
        sub += p["price"] * int(qty)
    shop = _shop(ctx)
    code = ctx.user["state"].get("coupon") or ""
    c = next((x for x in shop["coupons"] if x["code"] == code), None)
    disc = 0
    if c:
        disc = sub * c["pct"] // 100 if c["pct"] else min(c["amount"], sub)
    else:
        ctx.user["state"].pop("coupon", None)
        code = ""
    ship = shop["ship"] if lines else 0
    return {"lines": lines, "subtotal": sub, "discount": disc, "coupon": code, "ship": ship, "total": max(0, sub - disc + ship)}


def _summary(pc: dict, unit: str) -> str:
    out = [f"{schema.fa_number(x['qty'])}× {html.escape(x['title'])} — {schema.fa_number(x['price'] * x['qty'])}" for x in pc["lines"]]
    if pc["discount"]:
        out.append(f"کد تخفیف <b>{pc['coupon']}</b>: −{schema.fa_number(pc['discount'])}")
    if pc["ship"]:
        out.append(f"ارسال: {schema.fa_number(pc['ship'])}")
    out.append("━━━━━━━━")
    out.append(f"جمع: <b>{money(pc['total'], unit)}</b>")
    return "\n".join(out)


def _kb(rows: list[list[tuple]]) -> InlineKeyboardMarkup:
    out = []
    for row in rows:
        r = []
        for item in row:
            text, data = item[0], item[1]
            kw: dict = {"text": text}
            if isinstance(data, CopyTextButton):
                kw["copy_text"] = data
            else:
                kw["callback_data"] = data
            if len(item) > 2 and item[2]:
                kw["style"] = item[2]
            r.append(InlineKeyboardButton(**kw))
        out.append(r)
    return InlineKeyboardMarkup(inline_keyboard=out)


async def _show(ctx, chat_id: int, text: str, kb, photo: str = "", edit: Message | None = None) -> None:  # noqa: ANN001
    """جای همان پیام (اگر شکلش جور باشد) یا پیام تازه."""
    bot = ctx.bot
    if edit is not None:
        had = bool(edit.photo)
        try:
            if photo and had:
                await bot.edit_message_media(media=InputMediaPhoto(media=photo, caption=text), chat_id=chat_id, message_id=edit.message_id, reply_markup=kb)
                return
            if not photo and not had:
                await bot.edit_message_text(text=text, chat_id=chat_id, message_id=edit.message_id, reply_markup=kb)
                return
            try:
                await bot.delete_message(chat_id, edit.message_id)
            except TelegramAPIError:
                pass
        except TelegramBadRequest as exc:
            if "not modified" in str(exc):
                return
    if photo:
        await bot.send_photo(chat_id, photo=photo, caption=text, reply_markup=kb)
    else:
        await bot.send_message(chat_id, text, reply_markup=kb)


# ---------------------------------------------------------------- کارت محصول
async def show_product(ctx, chat_id: int, pid: object = None, edit: Message | None = None) -> None:  # noqa: ANN001
    st = ctx.user.setdefault("state", {})
    items = await products(ctx.db, ctx.app["id"], active_only=True, cat=st.get("shop_cat") or "")
    if not items and st.get("shop_cat"):
        st.pop("shop_cat", None)
        items = await products(ctx.db, ctx.app["id"], active_only=True)
    if not items:
        await _show(ctx, chat_id, "🛍 فعلاً محصولی برای نمایش نیست؛ به‌زودی برمی‌گردیم.", None, edit=edit)
        return
    idx = next((i for i, p in enumerate(items) if str(p["id"]) == str(pid)), 0)
    p = items[idx]
    unit = _shop(ctx)["unit"]
    text = f"<b>{html.escape(p['title'])}</b>"
    if p["descr"]:
        text += "\n" + p["descr"]
    text += f"\n\n💰 <b>{money(p['price'], unit)}</b>"
    if p["stock"] == 0:
        text += "\n❌ <i>تمام شد</i>"
    elif 0 < p["stock"] <= 3:
        text += f"\n📦 فقط {schema.fa_number(p['stock'])} عدد مانده"
    cart = _cart(ctx)
    rows: list[list[tuple]] = []
    if len(items) > 1:
        nxt, prv = items[(idx + 1) % len(items)], items[idx - 1]
        rows.append([("بعدی ◀️", f"bs|p|{nxt['id']}"), (f"{schema.fa_number(idx + 1)} از {schema.fa_number(len(items))}", "bs|n"),
                     ("▶️ قبلی", f"bs|p|{prv['id']}")])
    if p["stock"] == 0:
        rows.append([("ناموجود", "bs|n")])
    else:
        inc = cart.get(str(p["id"]), 0)
        rows.append([("🛒 افزودن به سبد" + (f" ({schema.fa_number(inc)} در سبد)" if inc else ""), f"bs|a|{p['id']}", "success")])
    n = sum(cart.values())
    rows.append([("🧺 سبد خرید" + (f" ({schema.fa_number(n)})" if n else ""), "bs|c", "primary")])
    await _show(ctx, chat_id, text, _kb(rows), p["photo"], edit)


async def show_cart(ctx, chat_id: int, edit: Message | None = None, editing: bool = False) -> None:  # noqa: ANN001
    pc = await priced(ctx)
    if not pc["lines"]:
        await _show(ctx, chat_id, "🧺 سبد خریدت خالیه.", _kb([[("🛍 دیدن محصولات", "bs|l", "primary")]]), edit=edit)
        return
    unit = _shop(ctx)["unit"]
    text = "🧺 <b>سبد خرید تو</b>\n" + _summary(pc, unit)
    if editing:
        rows = [[("➖", f"bs|-|{x['pid']}"), (f"{x['title'][:24]} ×{schema.fa_number(x['qty'])}", "bs|n"), ("➕", f"bs|+|{x['pid']}")] for x in pc["lines"]]
        rows += [[("🗑 خالی کردن سبد", "bs|x", "danger")], [("✅ تمام", "bs|c", "success")]]
    else:
        rows = [[("✅ ثبت سفارش", "bs|o", "success")], [("✏️ ویرایش سبد", "bs|e"), ("🎟 کد تخفیف", "bs|k")], [("🛍 ادامهٔ خرید", "bs|l")]]
        if not _shop(ctx)["coupons"]:
            rows[1] = [("✏️ ویرایش سبد", "bs|e")]
    await _show(ctx, chat_id, text, _kb(rows), edit=edit)


# ---------------------------------------------------------------- سفارش
async def _pay_choice(ctx, chat_id: int) -> None:  # noqa: ANN001
    shop = _shop(ctx)
    pc = await priced(ctx)
    rows = []
    for m in shop["pay"]:
        if m == "card" and shop["card"]:
            rows.append([("💳 کارت‌به‌کارت", "bs|m|card")])
        elif m == "stars" and shop["stars_rate"] > 0:
            rows.append([(f"⭐ پرداخت با ستاره ({schema.fa_number(_stars(pc['total'], shop))} ستاره)", "bs|m|stars")])
        elif m == "cod":
            rows.append([("🚚 پرداخت در محل", "bs|m|cod")])
    if not rows:
        rows = [[("✅ ثبت نهایی", "bs|m|cod", "success")]]
    await ctx.bot.send_message(chat_id, f"💳 <b>روش پرداخت</b>\nمبلغ: <b>{money(pc['total'], shop['unit'])}</b>", reply_markup=_kb(rows))


def _stars(total: int, shop: dict) -> int:
    return max(1, math.ceil(total / shop["stars_rate"])) if shop["stars_rate"] else 0


async def checkout(ctx, chat_id: int) -> str | None:  # noqa: ANN001
    """None یعنی ادامه؛ متن یعنی مشکل برای نمایش به کاربر."""
    pc = await priced(ctx)
    if not pc["lines"]:
        return "سبد خریدت خالیه"
    for x in pc["lines"]:
        if 0 <= x["stock"] < x["qty"]:
            _cart(ctx)[str(x["pid"])] = max(0, x["stock"])
            if x["stock"] == 0:
                _cart(ctx).pop(str(x["pid"]), None)
            return f"از «{x['title']}» فقط {schema.fa_number(x['stock'])} عدد مانده؛ سبد را درست کردیم"
    shop = _shop(ctx)
    if shop["ask_info"]:
        ctx.user["state"]["wait"] = {"kind": "shopinfo", "to": ""}
        await ctx.bot.send_message(chat_id, shop["info_text"] or "📝 برای ارسال، <b>نام، شماره تماس و نشانی</b>ات را در یک پیام بفرست.")
        return None
    await _pay_choice(ctx, chat_id)
    return None


async def _new_order(ctx, method: str) -> dict | str:  # noqa: ANN001
    err = None
    pc = await priced(ctx)
    if not pc["lines"]:
        return "سبد خریدت خالیه"
    for x in pc["lines"]:
        if 0 <= x["stock"] < x["qty"]:
            err = f"از «{x['title']}» فقط {schema.fa_number(x['stock'])} عدد مانده"
    if err:
        return err
    shop = _shop(ctx)
    db, app_id, now = ctx.db, ctx.app["id"], store.now()
    for x in pc["lines"]:
        await db.execute("UPDATE bk_products SET stock = CASE WHEN stock < 0 THEN stock ELSE MAX(0, stock - ?) END WHERE id = ?", (x["qty"], x["pid"]))
    num = (await db.fetchone("SELECT COALESCE(MAX(num), 1000) AS n FROM bk_orders WHERE app_id = ?", (app_id,)))["n"] + 1
    items = [{k: x[k] for k in ("pid", "title", "price", "qty")} for x in pc["lines"]]
    status = "new" if method == "cod" else "pending"
    stars = _stars(pc["total"], shop) if method == "stars" else 0
    oid = await db.insert(
        "INSERT INTO bk_orders(app_id, num, tg_id, items, subtotal, discount, ship, total, coupon, pay, stars, status, info, test, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (app_id, num, ctx.user["tg_id"], json.dumps(items, ensure_ascii=False), pc["subtotal"], pc["discount"], pc["ship"], pc["total"],
         pc["coupon"], method, stars, status, ctx.user["state"].get("shop_info", ""), int(ctx.test), now, now))
    st = ctx.user["state"]
    st["cart"] = {}
    st.pop("coupon", None)
    return await order(db, app_id, oid)


def _owner_kb(o: dict) -> InlineKeyboardMarkup:
    rows = []
    if o["status"] in ("pending", "new") and o["pay"] == "card":
        rows.append([("💳 پرداخت تأیید شد", f"bs|s|{o['id']}|paid", "success")])
    rows.append([("🚚 ارسال شد", f"bs|s|{o['id']}|sent"), ("📬 تحویل شد", f"bs|s|{o['id']}|done")])
    rows.append([("❌ لغو سفارش", f"bs|s|{o['id']}|canceled", "danger")])
    return _kb(rows)


def order_text(o: dict, unit: str, who: str = "") -> str:
    lines = [f"{schema.fa_number(x['qty'])}× {html.escape(x['title'])} — {schema.fa_number(x['price'] * x['qty'])}" for x in o["items"]]
    if o["discount"]:
        lines.append(f"تخفیف ({o['coupon']}): −{schema.fa_number(o['discount'])}")
    if o["ship"]:
        lines.append(f"ارسال: {schema.fa_number(o['ship'])}")
    lines.append(f"جمع: <b>{money(o['total'], unit)}</b>")
    head = f"🛍 <b>سفارش #{schema.fa_number(o['num']).replace('٬', '')}</b>" + (" · 🧪 تست" if o["test"] else "")
    body = "\n".join(lines)
    extra = f"\n💳 {PAY_FA.get(o['pay'], o['pay'])} · {STATUS_FA[o['status']]}"
    if o["info"]:
        extra += "\n📝 " + html.escape(o["info"])
    return head + ("\n👤 " + who if who else "") + "\n" + body + extra


async def _notify_owner(ctx, o: dict, receipt: str = "") -> None:  # noqa: ANN001
    u = ctx.tg_user
    who = html.escape(u.full_name if u else (ctx.user.get("first_name") or "مشتری"), quote=False)
    if u and u.username:
        who += f" (@{u.username})"
    text = order_text(o, _shop(ctx)["unit"], who)
    try:
        if receipt:
            await ctx.bot.send_photo(ctx.app["owner_id"], photo=receipt, caption=text[:1000], reply_markup=_owner_kb(o))
        else:
            await ctx.bot.send_message(ctx.app["owner_id"], text, reply_markup=_owner_kb(o))
    except TelegramAPIError:
        log.info("order notify failed for app %s (owner has not started the bot?)", ctx.app["id"])


async def _placed(ctx, chat_id: int, o: dict, text: str) -> None:  # noqa: ANN001
    """تأیید به مشتری، خبر به صاحب ربات و پیام «بعد از سفارش» (مثلاً زمان تحویل)."""
    from . import engine

    await ctx.bot.send_message(chat_id, text)
    after = _shop(ctx)["after"]
    if after:
        await engine.goto(ctx, chat_id, after)


def _num(o: dict) -> str:
    return schema.fa_number(o["num"]).replace("٬", "")


async def pay(ctx, chat_id: int, method: str) -> str | None:  # noqa: ANN001
    shop = _shop(ctx)
    allowed = [m for m in shop["pay"] if (m != "card" or shop["card"]) and (m != "stars" or shop["stars_rate"] > 0)] or ["cod"]
    if method not in allowed:
        return "این روش پرداخت فعال نیست"
    o = await _new_order(ctx, method)
    if isinstance(o, str):
        return o
    unit = shop["unit"]
    if method == "cod":
        await _notify_owner(ctx, o)
        await _placed(ctx, chat_id, o, f"📦 سفارش <b>#{_num(o)}</b> ثبت شد.\nمبلغ <b>{money(o['total'], unit)}</b> را هنگام تحویل می‌پردازی.")
    elif method == "card":
        ctx.user["state"]["wait"] = {"kind": "receipt", "order": o["id"], "to": ""}
        text = (f"📦 سفارش <b>#{_num(o)}</b> ثبت شد.\nمبلغ <b>{money(o['total'], unit)}</b> را به این کارت بزن و <b>عکس رسید</b> را همین‌جا بفرست:\n\n"
                f"<code>{shop['card']}</code>" + (f"\nبه نام: {html.escape(shop['card_name'])}" if shop["card_name"] else ""))
        await ctx.bot.send_message(chat_id, text, reply_markup=_kb([[("📋 کپی شماره کارت", CopyTextButton(text=shop["card"].replace(" ", "")))]]))
    else:
        await ctx.bot.send_invoice(chat_id=chat_id, title=f"سفارش #{o['num']}"[:32], description=(", ".join(x["title"] for x in o["items"]) or "خرید")[:255],
                                   payload=f"bs|{o['id']}", currency="XTR", prices=[LabeledPrice(label=f"سفارش #{o['num']}", amount=o["stars"])])
    return None


async def set_status(db, bot, app, oid: object, status: str) -> dict | None:  # noqa: ANN001
    """تغییر وضعیت (از مینی‌اپ یا دکمهٔ صاحب ربات) و پیام به مشتری."""
    o = await order(db, app["id"], oid)
    if o is None or status not in STATUSES or o["status"] == status:
        return o
    if o["status"] == "canceled":
        return o            # سفارش لغوشده برنمی‌گردد (موجودی‌اش برگشته)
    await db.execute("UPDATE bk_orders SET status = ?, updated_at = ? WHERE id = ?", (status, store.now(), o["id"]))
    if status == "canceled":
        for x in o["items"]:
            await db.execute("UPDATE bk_products SET stock = stock + ? WHERE id = ? AND app_id = ? AND stock >= 0", (x["qty"], x["pid"], app["id"]))
    if status in TELL and bot is not None:
        try:
            await bot.send_message(o["tg_id"], TELL[status].format(n=_num(o)))
        except TelegramAPIError:
            log.info("order status message failed (app %s, order %s)", app["id"], o["id"])
    return await order(db, app["id"], o["id"])


# ---------------------------------------------------------------- ورودی‌ها
async def on_wait(ctx, message: Message, wait: dict) -> None:  # noqa: ANN001
    st = ctx.user["state"]
    chat = message.chat.id
    text = (message.text or "").strip()
    if wait["kind"] == "coupon":
        st.pop("wait", None)
        code = text.upper().replace(" ", "")
        if any(c["code"] == code for c in _shop(ctx)["coupons"]):
            st["coupon"] = code
            await ctx.bot.send_message(chat, f"🎟 کد <b>{html.escape(code)}</b> روی سبدت اعمال شد.")
        else:
            await ctx.bot.send_message(chat, "این کد تخفیف درست نیست 🙁")
        await show_cart(ctx, chat)
    elif wait["kind"] == "shopinfo":
        if not text:
            await ctx.bot.send_message(chat, "لطفاً نام، شماره و نشانی را به صورت متن بفرست 🙂")
            return
        st.pop("wait", None)
        st["shop_info"] = text[:500]
        await _pay_choice(ctx, chat)
    elif wait["kind"] == "receipt":
        if not message.photo:
            await ctx.bot.send_message(chat, "لطفاً <b>عکس رسید</b> را بفرست 📷 (برای انصراف /start)")
            return
        st.pop("wait", None)
        o = await order(ctx.db, ctx.app["id"], wait.get("order"))
        if o is None or o["status"] != "pending":
            await ctx.bot.send_message(chat, "این سفارش دیگر منتظر رسید نیست.")
            return
        fid = message.photo[-1].file_id
        await ctx.db.execute("UPDATE bk_orders SET receipt = ?, status = 'new', updated_at = ? WHERE id = ?", (fid, store.now(), o["id"]))
        o = await order(ctx.db, ctx.app["id"], o["id"])
        await _notify_owner(ctx, o, receipt=fid)
        await _placed(ctx, chat, o, f"🧾 رسید سفارش <b>#{_num(o)}</b> رسید ✅\nبعد از تأیید پرداخت، سفارشت آماده می‌شود.")


async def open_from_button(ctx, chat_id: int, act: dict, edit: Message | None) -> None:  # noqa: ANN001
    st = ctx.user.setdefault("state", {})
    if act["type"] == "cart":
        await show_cart(ctx, chat_id)
        return
    if act.get("cat"):
        st["shop_cat"] = act["cat"]
    else:
        st.pop("shop_cat", None)
    await show_product(ctx, chat_id, None, None)


async def on_callback(ctx, call: CallbackQuery) -> None:  # noqa: ANN001, C901
    parts = (call.data or "").split("|")
    kind = parts[1] if len(parts) > 1 else ""
    arg = parts[2] if len(parts) > 2 else ""
    chat = call.message.chat.id
    msg = call.message
    if kind == "n":
        await call.answer()
        return
    if kind == "p":
        await call.answer()
        await show_product(ctx, chat, arg, msg)
    elif kind == "l":
        await call.answer()
        await show_product(ctx, chat, None, msg)
    elif kind == "a":
        p = await product(ctx.db, ctx.app["id"], arg)
        if not p or not p["active"] or p["stock"] == 0:
            await call.answer("این محصول الان موجود نیست", show_alert=True)
            return
        cart = _cart(ctx)
        q = cart.get(str(p["id"]), 0) + 1
        if 0 <= p["stock"] < q:
            await call.answer(f"فقط {schema.fa_number(p['stock'])} عدد موجود است", show_alert=True)
            return
        cart[str(p["id"])] = q
        await call.answer(f"«{p['title']}» به سبد اضافه شد 🛒")
        await show_product(ctx, chat, p["id"], msg)
    elif kind == "c":
        await call.answer()
        await show_cart(ctx, chat, None if msg.photo else msg)
    elif kind == "e":
        await call.answer()
        await show_cart(ctx, chat, msg, editing=True)
    elif kind in ("+", "-"):
        cart = _cart(ctx)
        q = cart.get(arg, 0) + (1 if kind == "+" else -1)
        p = await product(ctx.db, ctx.app["id"], arg)
        if kind == "+" and p and 0 <= p["stock"] < q:
            await call.answer(f"فقط {schema.fa_number(p['stock'])} عدد موجود است", show_alert=True)
            return
        if q <= 0:
            cart.pop(arg, None)
        else:
            cart[arg] = q
        await call.answer()
        await show_cart(ctx, chat, msg, editing=bool(cart))
    elif kind == "x":
        ctx.user["state"]["cart"] = {}
        await call.answer("سبد خالی شد")
        await show_cart(ctx, chat, msg)
    elif kind == "k":
        await call.answer()
        ctx.user["state"]["wait"] = {"kind": "coupon", "to": ""}
        await ctx.bot.send_message(chat, "🎟 کد تخفیفت را بفرست:")
    elif kind == "o":
        err = await checkout(ctx, chat)
        await call.answer(err or "", show_alert=bool(err))
        if err:
            await show_cart(ctx, chat, msg)
    elif kind == "m":
        err = await pay(ctx, chat, arg)
        await call.answer(err or "", show_alert=bool(err))
        if not err:
            try:
                await msg.edit_reply_markup(reply_markup=None)
            except TelegramAPIError:
                pass
    else:
        await call.answer()


async def pre_checkout(db, app, q: PreCheckoutQuery) -> None:  # noqa: ANN001
    o = await order(db, app["id"], (q.invoice_payload or "")[3:])
    if o is None or o["status"] != "pending" or o["pay"] != "stars" or q.total_amount != o["stars"] or q.from_user.id != o["tg_id"]:
        await q.answer(ok=False, error_message="این سفارش دیگر معتبر نیست؛ دوباره از سبد خرید ثبت کن.")
        return
    await q.answer(ok=True)


async def mark_paid(db, app, sp) -> dict | None:  # noqa: ANN001
    """پرداخت ستاره ثبت می‌شود حتی اگر ربات‌ساز همان لحظه خاموش باشد."""
    o = await order(db, app["id"], (sp.invoice_payload or "")[3:])
    if o is None:
        return None
    await db.execute("UPDATE bk_orders SET status = 'paid', charge = ?, updated_at = ? WHERE id = ? AND status = 'pending'",
                     (sp.telegram_payment_charge_id, store.now(), o["id"]))
    return await order(db, app["id"], o["id"])


async def paid(ctx, message: Message) -> None:  # noqa: ANN001
    o = await mark_paid(ctx.db, ctx.app, message.successful_payment)
    if o is None:
        return
    await _notify_owner(ctx, o)
    await _placed(ctx, message.chat.id, o, f"⭐ پرداخت سفارش <b>#{_num(o)}</b> انجام شد. ممنون! ✅")
