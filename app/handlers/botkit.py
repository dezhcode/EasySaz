"""ربات‌ساز در ربات اصلی @EasySazBot.

- /start emoji_<مینی‌اپ>  : صاحب ربات ایموجی‌های پریمیومش (یا لینک بسته) را می‌فرستد
                            و به کتابخانهٔ ربات‌ساز همان مینی‌اپ اضافه می‌شوند.
- /start newbot_<مینی‌اپ> : ساخت ربات با یک دکمه (ربات مدیریت‌شده): تلگرام ربات را
                            می‌سازد و توکنش را به ایزی‌ساز می‌دهد؛ بی BotFather.
"""
from __future__ import annotations

import logging
import re

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramAPIError
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    KeyboardButtonRequestManagedBot,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    WebAppInfo,
)

from .. import secure
from ..botkit import store
from ..botkit.api import PACK_RE, fetch_pack
from ..clients import ClientBots, LinkError
from ..config import config
from ..db import Database

router = Router(name="botkit")
log = logging.getLogger("easysaz.botkit.main")

_PACK_LINK = re.compile(r"t\.me/addemoji/([A-Za-z0-9_]{3,64})")


class Emoji(StatesGroup):
    collect = State()


class NewBot(StatesGroup):
    wait = State()


def back_kb(app_id: int, tab: str = "") -> InlineKeyboardMarkup:
    url = f"{config.panel_url}#bot={app_id}" + (f"&tab={tab}" if tab else "")
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="↩️ برگشت به ربات‌ساز", style="primary",
                                                                       web_app=WebAppInfo(url=url))]])


def _done_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="✅ تمام", style="success", callback_data="bkemoji:done")]])


# ---------------------------------------------------------------- ایموجی پریمیوم
async def start_emoji(message: Message, state: FSMContext, db: Database, app_id: int) -> None:
    app = await db.get_owned_app(message.from_user.id, app_id)
    if not app:
        await message.answer("این مینی‌اپ پیدا نشد.")
        return
    await state.set_state(Emoji.collect)
    await state.set_data({"app_id": app_id, "added": 0})
    note = "" if message.from_user.is_premium else (
        "\n\n⚠️ حساب تو پریمیوم نیست؛ ایموجی‌ها ذخیره می‌شوند ولی در ربات فقط وقتی دیده می‌شوند که سازندهٔ ربات پریمیوم داشته باشد.")
    await message.answer(
        f"برای ربات <b>«{app['name']}»</b> ایموجی پریمیوم اضافه می‌کنیم ✨\n"
        "ایموجی‌هایت را همین‌جا بفرست؛ هر چندتا خواستی. لینک یک بسته (t.me/addemoji/…) هم قبول است.\n"
        "آخرش «تمام» را بزن." + note,
        reply_markup=_done_kb(),
    )


@router.message(Emoji.collect, F.text | F.sticker)
async def got_emoji(message: Message, state: FSMContext, db: Database, bot: Bot) -> None:
    data = await state.get_data()
    app_id = data.get("app_id")
    if not app_id or not await db.get_owned_app(message.from_user.id, app_id):
        await state.clear()
        return
    await db.execute("UPDATE users SET is_premium = ? WHERE tg_id = ?", (int(bool(message.from_user.is_premium)), message.from_user.id))
    items: list[tuple[str, str]] = []
    text = message.text or ""
    for ent in message.entities or []:
        if ent.type == "custom_emoji" and ent.custom_emoji_id:
            items.append((ent.custom_emoji_id, ent.extract_from(text) or "⭐"))
    if message.sticker and message.sticker.custom_emoji_id:
        items.append((message.sticker.custom_emoji_id, message.sticker.emoji or "⭐"))
    added = await store.emoji_add(db, app_id, items) if items else 0
    packs = 0
    for name in _PACK_LINK.findall(text)[:3]:
        got, real = await fetch_pack(bot, name)
        if got:
            added += await store.emoji_add(db, app_id, got, pack=real)
            packs += 1
    if not items and not packs:
        await message.answer("ایموجی پریمیومی در این پیام پیدا نکردم. ایموجی پریمیوم یا لینک بسته بفرست، یا «تمام» را بزن.",
                             reply_markup=_done_kb())
        return
    total = data.get("added", 0) + added
    await state.update_data(added=total)
    await message.answer(f"✓ {added} ایموجی تازه ذخیره شد" + (f" (از {packs} بسته)" if packs else "") + ". باز هم بفرست یا «تمام» را بزن.",
                         reply_markup=_done_kb())


@router.callback_query(F.data == "bkemoji:done")
async def emoji_done(call: CallbackQuery, state: FSMContext, db: Database) -> None:
    data = await state.get_data()
    app_id = data.get("app_id")
    await state.clear()
    await call.answer()
    if not app_id:
        await call.message.edit_reply_markup(reply_markup=None)
        return
    lib = await store.emoji_list(db, app_id)
    await call.message.answer(
        f"{data.get('added', 0)} ایموجی اضافه شد ✨\nکتابخانهٔ این ربات حالا {len(lib)} ایموجی دارد؛ "
        "در ربات‌ساز، در متن پیام و آیکن دکمه‌ها می‌بینیشان.",
        reply_markup=back_kb(app_id, "emoji"),
    )


# ---------------------------------------------------------------- ساخت ربات با یک دکمه
async def start_newbot(message: Message, state: FSMContext, db: Database, app_id: int) -> None:
    app = await db.get_owned_app(message.from_user.id, app_id)
    if not app:
        await message.answer("این مینی‌اپ پیدا نشد.")
        return
    await state.set_state(NewBot.wait)
    await state.set_data({"app_id": app_id})
    kb = ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True, keyboard=[[KeyboardButton(
        text="🤖 ساختن ربات", style="primary",
        request_managed_bot=KeyboardButtonRequestManagedBot(request_id=1, suggested_name=(app["name"] or "")[:64] or None))]])
    await message.answer(
        f"ربات تازه برای <b>«{app['name']}»</b>\nدکمهٔ پایین را بزن؛ تلگرام اسم و نام کاربری می‌پرسد و ربات را می‌سازد. "
        "بعد ربات خودکار به ایزی‌ساز وصل می‌شود.",
        reply_markup=kb,
    )


@router.message(F.managed_bot_created)
async def managed_created(message: Message, state: FSMContext, db: Database, bot: Bot, clients: ClientBots) -> None:
    created = message.managed_bot_created.bot_user
    data = await state.get_data()
    app_id = data.get("app_id")
    if not app_id:
        apps = await db.list_apps(message.from_user.id)
        app_id = apps[0]["id"] if len(apps) == 1 else None
    await state.clear()
    if not app_id:
        await message.answer("ربات ساخته شد. برای وصل کردنش از ربات‌ساز «ساخت ربات» را دوباره بزن.",
                             reply_markup=ReplyKeyboardRemove())
        return
    app = await db.get_owned_app(message.from_user.id, app_id)
    try:
        token = await bot.get_managed_bot_token(user_id=created.id)
    except TelegramAPIError as exc:
        log.warning("managed bot token failed: %s", exc)
        await message.answer("ربات ساخته شد ولی توکنش را نگرفتم. از @BotFather توکن بگیر و با /connect وصلش کن.",
                             reply_markup=ReplyKeyboardRemove())
        return
    taken = await db.get_app_by_bot(created.id)
    if not app or (taken and taken["id"] != app_id):
        await message.answer("این ربات به مینی‌اپ دیگری وصل است.", reply_markup=ReplyKeyboardRemove())
        return
    if app["bot_id"] and app["bot_id"] != created.id:
        await clients.release(app)
    try:
        enc = secure.encrypt_token(token)
    except secure.TokenKeyError:
        await message.answer("سرویس موقتاً در دسترس نیست.", reply_markup=ReplyKeyboardRemove())
        return
    await db.attach_bot(app_id, created.id, created.username or "", created.first_name or "", enc)
    app = await db.get_app(app_id)
    try:
        await clients.apply(app, "full")
        await db.set_mode(app_id, "full")
    except LinkError as exc:
        log.warning("apply full for managed bot failed: %s", exc)
    await message.answer(f"✅ ربات @{created.username} ساخته و وصل شد.", reply_markup=ReplyKeyboardRemove())
    await message.answer("حالا برگرد و پیام‌های ربات را بساز.", reply_markup=back_kb(app_id))


def parse_arg(arg: str) -> tuple[str, int] | None:
    m = re.match(r"^(emoji|newbot)_(\d{1,9})$", arg or "")
    return (m.group(1), int(m.group(2))) if m else None


__all__ = ["router", "start_emoji", "start_newbot", "parse_arg", "PACK_RE"]
