"""موتور ربات‌ساز: سند ربات را روی ربات مشتری اجرا می‌کند.

ورودی‌ها (پیام، دکمهٔ شیشه‌ای، دکمهٔ کیبورد، شماره، موقعیت، پرداخت) به
«پیام» بعدی می‌رسند. صاحب ربات با «تست» نسخهٔ پیش‌نویس را در چت واقعی
خودش می‌بیند؛ بقیه همیشه نسخهٔ منتشرشده را.

داده‌های دکمه‌های شیشه‌ای: bk|<کار>|<پیام مبدأ>|<دکمه>
  g = رفتن به پیام، a = پیام کوتاه، p = پرداخت ستاره، n = بی‌کار
"""
from __future__ import annotations

import asyncio
import html
import logging
import re
import time
from urllib.parse import quote

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError, TelegramBadRequest, TelegramForbiddenError
from aiogram.types import (
    CallbackQuery,
    CopyTextButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    InputMediaVideo,
    KeyboardButton,
    KeyboardButtonPollType,
    KeyboardButtonRequestChat,
    KeyboardButtonRequestUsers,
    LabeledPrice,
    LinkPreviewOptions,
    Message,
    PreCheckoutQuery,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    WebAppInfo,
)

from ..config import config
from . import schema, store

log = logging.getLogger("easysaz.botkit")

TEST_NOTICE = "🧪 <b>حالت تست</b> · نسخهٔ پیش‌نویس\nفقط تو این نسخه را می‌بینی. برای خروج: /exit"
TEST_EXIT = "از حالت تست بیرون آمدی. از حالا نسخهٔ منتشرشده را می‌بینی."
_VAR_IN_TEXT = re.compile(r"\{([^{}<>\n]{1,24})\}")
_IRAN = 3.5 * 3600   # ایران از ۱۴۰۱ ساعت تابستانی ندارد


# ---------------------------------------------------------------- تاریخ شمسی
def jalali(gy: int, gm: int, gd: int) -> tuple[int, int, int]:
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm, jd = 1 + days // 31, 1 + days % 31
    else:
        jm, jd = 7 + (days - 186) // 30, 1 + (days - 186) % 30
    return jy, jm, jd


MONTHS = ("فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند")


def iran_now() -> time.struct_time:
    return time.gmtime(time.time() + _IRAN)


def today_fa() -> str:
    t = iran_now()
    y, m, d = jalali(t.tm_year, t.tm_mon, t.tm_mday)
    return f"{d} {MONTHS[m - 1]} {y}".translate(schema._FA)


def clock_fa() -> str:
    t = iran_now()
    return f"{t.tm_hour:02d}:{t.tm_min:02d}".translate(schema._FA)


# ---------------------------------------------------------------- زمینهٔ اجرا
class Ctx:
    """همه چیزی که برای ساختن پیام لازم است: سند، کاربر، متغیرها."""

    def __init__(self, bot: Bot, db, app, doc: dict, user: dict, tg_user, globals_: dict, premium: bool, test: bool) -> None:  # noqa: ANN001
        self.bot = bot
        self.db = db
        self.app = app
        self.doc = doc
        self.user = user
        self.tg_user = tg_user
        self.globals = globals_
        self.premium = premium
        self.test = test
        self.vars = {v["name"]: v for v in doc.get("vars", [])}
        self._busy: set[str] = set()

    # مقدار خام یک متغیر
    def raw(self, name: str):  # noqa: ANN201
        u = self.tg_user
        if name == "نام":
            return (u.first_name if u else self.user.get("first_name")) or "دوست من"
        if name == "نام کامل":
            return " ".join(x for x in ((u.first_name if u else ""), (u.last_name if u else "")) if x) or "دوست من"
        if name == "یوزرنیم":
            un = (u.username if u else self.user.get("username")) or ""
            return f"@{un}" if un else ""
        if name == "شناسه":
            return str(u.id if u else self.user.get("tg_id"))
        if name == "تاریخ امروز":
            return today_fa()
        if name == "ساعت":
            return clock_fa()
        v = self.vars.get(name)
        if v is None:
            return None
        if v["formula"]:
            if name in self._busy:       # فرمولی که به خودش برمی‌گردد
                return 0
            self._busy.add(name)
            try:
                return schema.evaluate(v["formula"], self.raw)
            except schema.FormulaError:
                return 0
            finally:
                self._busy.discard(name)
        src = self.globals if v["scope"] == "bot" else self.user.get("vars", {})
        val = src.get(name, v["init"])
        if v["type"] == "number":
            return schema.to_number(val)
        if v["type"] == "bool":
            return "بله" if str(val).strip() in ("1", "true", "بله", "آره", "yes") else "نه"
        return val

    def text(self, name: str) -> str | None:
        val = self.raw(name)
        if val is None:
            return None
        if isinstance(val, float):
            return schema.fa_number(val)
        return str(val)

    def fill(self, text: str) -> str:
        """جایگذاری {متغیر} در HTML پیام (مقدارها escape می‌شوند)."""
        def rep(m: re.Match) -> str:
            val = self.text(m.group(1).strip())
            return m.group(0) if val is None else html.escape(val, quote=False)

        return _VAR_IN_TEXT.sub(rep, text or "")

    def fill_plain(self, text: str) -> str:
        def rep(m: re.Match) -> str:
            val = self.text(m.group(1).strip())
            return m.group(0) if val is None else val

        return _VAR_IN_TEXT.sub(rep, text or "")

    # تغییر متغیر با دکمه
    def apply_set(self, s: dict | None) -> bool:
        if not s:
            return False
        v = self.vars.get(s["var"])
        if not v or v["formula"]:
            return False
        target = self.globals if v["scope"] == "bot" else self.user.setdefault("vars", {})
        value = self.fill_plain(s.get("value", ""))
        if s["op"] in ("+", "-") and v["type"] == "number":
            cur = schema.to_number(target.get(v["name"], v["init"]))
            n = schema.to_number(value)
            target[v["name"]] = cur + n if s["op"] == "+" else cur - n
        else:
            target[v["name"]] = value
        return True

    def save_var(self, name: str, value: str) -> None:
        v = self.vars.get(name)
        if not v or v["formula"]:
            return
        (self.globals if v["scope"] == "bot" else self.user.setdefault("vars", {}))[name] = value[:500]


async def owner_premium(db, app) -> bool:  # noqa: ANN001
    row = await db.get_user(app["owner_id"])
    try:
        return bool(row and row["is_premium"])
    except (IndexError, KeyError):
        return False


async def _ctx(bot: Bot, db, app, tg_user, force_test: bool | None = None) -> Ctx | None:  # noqa: ANN001
    user = await store.touch_user(db, app["id"], tg_user)
    test = bool(user["test"]) if force_test is None else force_test
    if test and tg_user.id != app["owner_id"]:
        test = False
    doc = await store.load(db, app["id"], published=not test)
    if doc is None or not doc["msgs"]:
        return None
    return Ctx(bot, db, app, doc, user, tg_user, await store.get_globals(db, app["id"]), await owner_premium(db, app), test)


async def _persist(ctx: Ctx) -> None:
    await store.set_user(ctx.db, ctx.app["id"], ctx.user["tg_id"], vars=ctx.user.get("vars", {}), state=ctx.user.get("state", {}))
    await store.set_globals(ctx.db, ctx.app["id"], ctx.globals)


# ---------------------------------------------------------------- ساختن دکمه‌ها
def _cb(kind: str, src: str, bid: str) -> str:
    return f"bk|{kind}|{src}|{bid}"


def _inline(ctx: Ctx, msg: dict, premium: bool) -> InlineKeyboardMarkup | None:
    rows = []
    for row in msg["rows"]:
        out = []
        for b in row:
            kw: dict = {"text": ctx.fill_plain(b["text"])[:64] or "•"}
            if b["style"]:
                kw["style"] = b["style"]
            if premium and b["icon"]:
                kw["icon_custom_emoji_id"] = b["icon"]
            a = b["act"]
            t = a["type"]
            if t == "goto":
                kw["callback_data"] = _cb("g", msg["id"], b["id"])
            elif t == "alert":
                kw["callback_data"] = _cb("a", msg["id"], b["id"])
            elif t == "pay":
                kw["callback_data"] = _cb("p", msg["id"], b["id"])
            elif t == "url" and a["url"]:
                kw["url"] = a["url"]
            elif t == "copy" and a["text"]:
                kw["copy_text"] = CopyTextButton(text=ctx.fill_plain(a["text"])[:256])
            elif t == "app":
                kw["web_app"] = WebAppInfo(url=a["url"] or config.page_url(ctx.app["slug"]))
            elif t == "share":
                link = f"https://t.me/{ctx.app['bot_username']}" if ctx.app["bot_username"] else config.page_url(ctx.app["slug"])
                kw["url"] = "https://t.me/share/url?url=" + quote(link, safe="") + "&text=" + quote(ctx.fill_plain(a["text"]), safe="")
            else:
                kw["callback_data"] = _cb("n", msg["id"], b["id"])
            out.append(InlineKeyboardButton(**kw))
        rows.append(out)
    return InlineKeyboardMarkup(inline_keyboard=rows) if rows else None


def _reply(ctx: Ctx, msg: dict, premium: bool) -> ReplyKeyboardMarkup | None:
    rows, rid = [], 0
    for row in msg["keys"]:
        out = []
        for b in row:
            rid += 1
            kw: dict = {"text": ctx.fill_plain(b["text"])[:64] or "•"}
            if b["style"]:
                kw["style"] = b["style"]
            if premium and b["icon"]:
                kw["icon_custom_emoji_id"] = b["icon"]
            t = b["act"]["type"]
            if t == "contact":
                kw["request_contact"] = True
            elif t == "location":
                kw["request_location"] = True
            elif t == "user":
                kw["request_users"] = KeyboardButtonRequestUsers(request_id=rid, user_is_bot=False, max_quantity=1)
            elif t == "chat":
                kw["request_chat"] = KeyboardButtonRequestChat(request_id=rid, chat_is_channel=False)
            elif t == "poll":
                kw["request_poll"] = KeyboardButtonPollType()
            elif t == "app":
                kw["web_app"] = WebAppInfo(url=b["act"]["url"] or config.page_url(ctx.app["slug"]))
            out.append(KeyboardButton(**kw))
        rows.append(out)
    if not rows:
        return None
    o = msg["kbopt"]
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=o["resize"], one_time_keyboard=o["once"] or None,
                               is_persistent=o["persist"] or None, input_field_placeholder=o["placeholder"] or None)


def markup(ctx: Ctx, msg: dict, premium: bool):  # noqa: ANN201
    if msg["kb"] == "inline":
        return _inline(ctx, msg, premium)
    if msg["kb"] == "reply":
        return _reply(ctx, msg, premium)
    if msg["opts"]["remove_kb"]:
        return ReplyKeyboardRemove()
    return None


# ---------------------------------------------------------------- فرستادن
def _emoji_error(exc: Exception) -> bool:
    s = str(exc).lower()
    return "emoji" in s or "entit" in s or "icon" in s or "style" in s


async def send(ctx: Ctx, chat_id: int, msg: dict, edit: Message | None = None, depth: int = 0) -> None:
    """یک «پیام» سند را می‌فرستد (یا جای پیام قبلی می‌نشاند) و پیام بعدی همان مرحله را هم."""
    o = msg["opts"]
    for attempt in (0, 1):
        premium = ctx.premium and attempt == 0
        text = ctx.fill(msg["text"])
        if not premium:
            text = schema.strip_custom_emoji(text)
        if not text.strip() and not msg["media"]:
            text = "…"
        kb = markup(ctx, msg, premium)
        try:
            await _deliver(ctx, chat_id, msg, text, kb, edit if depth == 0 else None)
            break
        except TelegramBadRequest as exc:
            if attempt == 0 and _emoji_error(exc):
                continue
            raise
    st = ctx.user.setdefault("state", {})
    st["last"] = msg["id"]
    if msg["wait"]:
        st["wait"] = msg["wait"]
    else:
        st.pop("wait", None)
    if msg["then"] and depth < 5:
        nxt = schema.find(ctx.doc, msg["then"])
        if nxt:
            await send(ctx, chat_id, nxt, None, depth + 1)


async def _deliver(ctx: Ctx, chat_id: int, msg: dict, text: str, kb, edit: Message | None) -> None:  # noqa: ANN001, C901
    o = msg["opts"]
    bot = ctx.bot
    media = msg["media"]
    if o["typing"]:
        try:
            await bot.send_chat_action(chat_id, "upload_photo" if media and media["type"] == "photo" else "typing")
        except TelegramAPIError:
            pass
        await asyncio.sleep(0.8)
    # جای پیام قبلی: فقط دکمهٔ شیشه‌ای را می‌شود روی پیام ویرایش‌شده گذاشت
    if edit is not None and o["replace"] and msg["kb"] != "reply" and not o["remove_kb"]:
        had_media = bool(edit.photo or edit.video or edit.animation or edit.document)
        try:
            if not media and not had_media:
                await bot.edit_message_text(text=text, chat_id=chat_id, message_id=edit.message_id, reply_markup=kb,
                                            link_preview_options=LinkPreviewOptions(is_disabled=not o["preview"]))
                return
            if media and had_media:
                im = (InputMediaPhoto if media["type"] == "photo" else InputMediaVideo)(media=media["url"], caption=text)
                await bot.edit_message_media(media=im, chat_id=chat_id, message_id=edit.message_id, reply_markup=kb)
                return
            try:
                await bot.delete_message(chat_id, edit.message_id)
            except TelegramAPIError:
                pass
        except TelegramBadRequest as exc:
            if "not modified" in str(exc):
                return
            if _emoji_error(exc):
                raise
            # پیام قدیمی‌تر از ۴۸ ساعت یا پاک‌شده: پیام تازه می‌فرستیم
    common: dict = {"chat_id": chat_id, "reply_markup": kb, "disable_notification": o["silent"] or None,
                    "protect_content": o["protect"] or None}
    if o["effect"] and edit is None:
        common["message_effect_id"] = schema.EFFECTS.get(o["effect"])
    if media and media["type"] == "photo":
        await bot.send_photo(photo=media["url"], caption=text, **common)
    elif media and media["type"] == "video":
        await bot.send_video(video=media["url"], caption=text, **common)
    else:
        await bot.send_message(text=text, link_preview_options=LinkPreviewOptions(is_disabled=not o["preview"]), **common)


# ---------------------------------------------------------------- ورودی‌ها
def _keys_by_type(ctx: Ctx, kind: str) -> list[dict]:
    """دکمه‌های کیبورد از این نوع؛ اول کیبورد آخرین پیام."""
    last = schema.find(ctx.doc, ctx.user.get("state", {}).get("last", ""))
    order = ([last] if last else []) + [m for m in ctx.doc["msgs"] if m is not last]
    out = []
    for m in order:
        for row in m["keys"]:
            for b in row:
                if b["act"]["type"] == kind:
                    out.append(b)
    return out


async def goto(ctx: Ctx, chat_id: int, mid: str, edit: Message | None = None) -> bool:
    msg = schema.find(ctx.doc, mid)
    if not msg:
        return False
    await send(ctx, chat_id, msg, edit)
    return True


async def start_test(bot: Bot, db, app, owner, from_msg: str = "") -> None:  # noqa: ANN001
    """صاحب ربات وارد حالت تست می‌شود؛ متغیرهایش از نو و پیام (شروع یا همان پیام) فرستاده می‌شود."""
    await store.touch_user(db, app["id"], owner)
    await store.set_user(db, app["id"], owner.id, test=1, vars={} if not from_msg else None, state={})
    ctx = await _ctx(bot, db, app, owner, force_test=True)
    if ctx is None:
        return
    await bot.send_message(owner.id, TEST_NOTICE)
    mid = from_msg if from_msg and schema.find(ctx.doc, from_msg) else ctx.doc["start"]
    await goto(ctx, owner.id, mid)
    await _persist(ctx)


async def on_message(bot: Bot, db, app, message: Message) -> bool:  # noqa: ANN001, C901
    """True یعنی ربات‌ساز پیام را جواب داد (یا عمداً ساکت ماند)."""
    u = message.from_user
    if u is None or message.chat.type != "private":
        return False
    text = (message.text or "").strip()
    is_owner = u.id == app["owner_id"]

    # جواب صاحب ربات به پیام پشتیبانی
    if is_owner and message.reply_to_message:
        row = await db.fetchone("SELECT tg_id FROM bk_support WHERE app_id = ? AND admin_msg = ?",
                                (app["id"], message.reply_to_message.message_id))
        if row:
            try:
                await bot.copy_message(row["tg_id"], message.chat.id, message.message_id)
                await message.reply("✓ فرستاده شد")
            except TelegramForbiddenError:
                await message.reply("این کاربر ربات را بسته است.")
            return True

    if is_owner and text in ("/start test", "/test"):
        await start_test(bot, db, app, u)
        return True
    if is_owner and text == "/exit":
        await store.set_user(db, app["id"], u.id, test=0, state={})
        await message.answer(TEST_EXIT)
        ctx = await _ctx(bot, db, app, u, force_test=False)
        if ctx:
            await goto(ctx, message.chat.id, ctx.doc["start"])
            await _persist(ctx)
        return True

    ctx = await _ctx(bot, db, app, u)
    if ctx is None:
        return False
    chat = message.chat.id
    st = ctx.user.setdefault("state", {})

    if text.startswith("/start"):
        st.pop("wait", None)
        await goto(ctx, chat, ctx.doc["start"])
        await _persist(ctx)
        return True

    # منتظر جواب (پرسش یا پشتیبانی)
    wait = st.get("wait")
    if wait and not text.startswith("/"):
        st.pop("wait", None)
        if wait["kind"] == "support":
            await _to_admin(ctx, message)
        else:
            value = text or (message.contact.phone_number if message.contact else "") or (message.caption or "")
            ctx.save_var(wait["var"], value)
        if wait.get("to"):
            await goto(ctx, chat, wait["to"])
        await _persist(ctx)
        return True

    # دکمه‌های کیبورد با درخواست
    special = None
    if message.contact:
        special = ("contact", message.contact.phone_number)
    elif message.location:
        special = ("location", f"{message.location.latitude:.5f},{message.location.longitude:.5f}")
    elif message.users_shared:
        special = ("user", str(message.users_shared.users[0].user_id) if message.users_shared.users else "")
    elif message.chat_shared:
        special = ("chat", str(message.chat_shared.chat_id))
    elif message.poll:
        special = ("poll", message.poll.question)
    if special:
        keys = _keys_by_type(ctx, special[0])
        if keys:
            act = keys[0]["act"]
            if act.get("var"):
                ctx.save_var(act["var"], special[1])
            if act.get("to"):
                await goto(ctx, chat, act["to"])
            await _persist(ctx)
            return True

    if text:
        word = text.split()[0].lower().split("@")[0]
        if word.startswith("/"):
            for m in ctx.doc["msgs"]:
                if m["cmd"] == word:
                    await goto(ctx, chat, m["id"])
                    await _persist(ctx)
                    return True
        # دکمهٔ کیبورد (متن همان برچسب است)
        for b in _keys_by_type(ctx, "text"):
            if ctx.fill_plain(b["text"]) == text:
                ctx.apply_set(b["act"].get("set"))
                if b["act"].get("to"):
                    await goto(ctx, chat, b["act"]["to"])
                await _persist(ctx)
                return True
        low = text.casefold()
        for m in ctx.doc["msgs"]:
            if any(k.casefold() in low for k in m["kw"]):
                await goto(ctx, chat, m["id"])
                await _persist(ctx)
                return True
    if ctx.doc["fallback"]:
        await goto(ctx, chat, ctx.doc["fallback"])
        await _persist(ctx)
    return True


async def _to_admin(ctx: Ctx, message: Message) -> None:
    """پیام کاربر به صاحب ربات (در همین ربات). صاحب با «پاسخ» جواب می‌دهد."""
    u = message.from_user
    who = html.escape(u.full_name or "کاربر", quote=False) + (f" (@{u.username})" if u.username else "")
    owner = ctx.app["owner_id"]
    try:
        await ctx.bot.send_message(owner, f"📩 <b>پیام پشتیبانی</b> از {who}\nبرای جواب، روی پیام پایین «پاسخ» بزن.")
        copied = await ctx.bot.copy_message(owner, message.chat.id, message.message_id)
        await ctx.db.execute("INSERT OR REPLACE INTO bk_support(app_id, admin_msg, tg_id, created_at) VALUES (?,?,?,?)",
                             (ctx.app["id"], copied.message_id, u.id, store.now()))
    except TelegramAPIError:
        log.info("support forward failed for app %s (owner has not started the bot?)", ctx.app["id"])


async def on_callback(bot: Bot, db, app, call: CallbackQuery) -> bool:  # noqa: ANN001
    data = call.data or ""
    if not data.startswith("bk|"):
        return False
    parts = data.split("|")
    if len(parts) != 4 or call.message is None:
        await call.answer()
        return True
    _, kind, src, bid = parts
    ctx = await _ctx(bot, db, app, call.from_user)
    msg = schema.find(ctx.doc, src) if ctx else None
    btn = schema.find_button(msg, bid) if msg else None
    if ctx is None or btn is None:
        await call.answer("این دکمه دیگر کار نمی‌کند؛ /start را بزن.", show_alert=True)
        return True
    a = btn["act"]
    chat = call.message.chat.id
    if kind == "g" and a["type"] == "goto":
        ctx.apply_set(a.get("set"))
        await call.answer()
        if a["to"]:
            target = schema.find(ctx.doc, a["to"])
            if target:
                await send(ctx, chat, target, edit=call.message if target["opts"]["replace"] else None)
        await _persist(ctx)
        return True
    if kind == "a" and a["type"] == "alert":
        await call.answer(ctx.fill_plain(a["text"])[:190] or "✓", show_alert=a["popup"])
        return True
    if kind == "p" and a["type"] == "pay":
        await call.answer()
        await bot.send_invoice(chat_id=chat, title=a["title"][:32], description=(a["title"] + " · " + (app["name"] or ""))[:255],
                               payload=f"bk|{src}|{bid}", currency="XTR", prices=[LabeledPrice(label=a["title"][:32], amount=a["stars"])])
        return True
    await call.answer()
    return True


async def on_pre_checkout(bot: Bot, db, app, q: PreCheckoutQuery) -> bool:  # noqa: ANN001
    if not (q.invoice_payload or "").startswith("bk|"):
        return False
    await q.answer(ok=True)
    return True


async def on_paid(bot: Bot, db, app, message: Message) -> bool:  # noqa: ANN001
    sp = message.successful_payment
    if sp is None or not (sp.invoice_payload or "").startswith("bk|"):
        return False
    _, src, bid = (sp.invoice_payload.split("|") + ["", ""])[:3]
    await db.execute(
        "INSERT OR IGNORE INTO bk_payments(app_id, tg_id, stars, charge_id, title, created_at) VALUES (?,?,?,?,?,?)",
        (app["id"], message.from_user.id, sp.total_amount, sp.telegram_payment_charge_id, "", store.now()))
    ctx = await _ctx(bot, db, app, message.from_user)
    msg = schema.find(ctx.doc, src) if ctx else None
    btn = schema.find_button(msg, bid) if msg else None
    if ctx and btn and btn["act"].get("to"):
        await goto(ctx, message.chat.id, btn["act"]["to"])
        await _persist(ctx)
    else:
        await message.answer("✅ پرداخت انجام شد. ممنون!")
    return True
