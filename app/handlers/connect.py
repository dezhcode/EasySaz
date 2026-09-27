"""اتصال ربات مشتری: گرفتن توکن، انتخاب حالت (منو / کنترل کامل)."""
from __future__ import annotations

import logging

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from .. import keyboards as kb
from .. import secure, texts
from ..clients import ClientBots, LinkError
from ..config import config
from ..db import Database
from ..states import Connect

router = Router(name="connect")
log = logging.getLogger("easysaz.connect")


async def _ask_token(target: Message, state: FSMContext, app_id: int | None, edit: bool) -> None:
    await state.set_state(Connect.token)
    await state.set_data({"app_id": app_id})
    if edit:
        await target.edit_text(texts.CONNECT_ASK, reply_markup=kb.cancel())
    else:
        await target.answer(texts.CONNECT_ASK, reply_markup=kb.cancel())


async def start_connect(target: Message, user_id: int, state: FSMContext, db: Database, edit: bool) -> None:
    apps = await db.list_apps(user_id)
    if len(apps) > 1:
        text = "توکن را برای کدام مینی اپ می‌فرستی؟"
        markup = kb.pick_app(apps, "rebind")
        await (target.edit_text(text, reply_markup=markup) if edit else target.answer(text, reply_markup=markup))
        return
    await _ask_token(target, state, apps[0]["id"] if apps else None, edit)


@router.message(Command("connect"))
async def cmd_connect(message: Message, state: FSMContext, db: Database) -> None:
    await start_connect(message, message.from_user.id, state, db, edit=False)


@router.callback_query(F.data == "connect")
async def cb_connect(call: CallbackQuery, state: FSMContext, db: Database) -> None:
    await start_connect(call.message, call.from_user.id, state, db, edit=True)
    await call.answer()


@router.callback_query(F.data.startswith("rebind:"))
async def cb_rebind(call: CallbackQuery, state: FSMContext, db: Database) -> None:
    app = await db.get_owned_app(call.from_user.id, int(call.data.split(":")[1]))
    if not app:
        await call.answer("پیدا نشد", show_alert=True)
        return
    await _ask_token(call.message, state, app["id"], edit=True)
    await call.answer()


@router.message(Connect.token, F.text, ~F.text.startswith("/"))
async def got_token(
    message: Message, state: FSMContext, db: Database, bot: Bot, clients: ClientBots
) -> None:
    token = message.text.strip()
    # پیام حاوی توکن را از تاریخچه چت پاک می کنیم
    try:
        await message.delete()
    except TelegramBadRequest:
        pass

    if not secure.looks_like_token(token):
        await message.answer(
            "این شبیه توکن ربات نیست. دوباره بفرست یا لغو کن.", reply_markup=kb.cancel()
        )
        return

    wait = await message.answer(texts.CONNECT_CHECKING)
    user_id = message.from_user.id

    async def fail(text: str) -> None:
        await wait.edit_text(text, reply_markup=kb.cancel())

    if secure.bot_id_of(token) == bot.id:
        await fail(texts.CONNECT_SELF)
        return
    try:
        me = await clients.probe(token)
    except LinkError as exc:
        await fail(str(exc))
        return

    data = await state.get_data()
    app_id = data.get("app_id")

    taken = await db.get_app_by_bot(me.id)
    if taken and taken["id"] != app_id:
        await fail(texts.CONNECT_TAKEN)
        return

    if app_id:
        app = await db.get_owned_app(user_id, app_id)
        if not app:
            await state.clear()
            await fail("این مینی اپ پیدا نشد.")
            return
    else:
        # هنوز اپی ندارد: با اسم ربات یک اپ خالی می سازیم. اسم را بعدا
        # از پنل عوض می کند.
        plan = await db.user_plan(user_id)
        app_id = await db.create_app(user_id, (me.first_name or me.username)[:40], plan.max_apps)
        if not app_id:
            await state.clear()
            await wait.edit_text(texts.CONNECT_LIMIT, reply_markup=kb.home())
            return
        app = await db.get_app(app_id)

    # اگر این اپ قبلا ربات دیگری داشت، آن را آزاد می کنیم
    if app["bot_id"] and app["bot_id"] != me.id:
        await clients.release(app)

    try:
        enc = secure.encrypt_token(token)
    except secure.TokenKeyError:
        log.error("TOKEN_KEY is not configured")
        await fail("سرویس موقتا در دسترس نیست. کمی بعد امتحان کن.")
        return
    if not await db.attach_bot(app["id"], me.id, me.username or "", me.first_name or "", enc):
        await fail(texts.CONNECT_TAKEN)
        return

    await state.clear()
    plan = await db.user_plan(user_id)
    await wait.edit_text(
        texts.connected(me.username or str(me.id), app["name"]) + "\n\n" + texts.MODE_CHOOSE,
        reply_markup=kb.choose_mode(app["id"], plan.full_mode),
    )


@router.message(Connect.token, ~F.text)
async def got_non_text(message: Message) -> None:
    await message.answer("فقط متن توکن رو بفرست.", reply_markup=kb.cancel())


@router.callback_query(F.data.startswith("modes:"))
async def cb_modes(call: CallbackQuery, db: Database) -> None:
    app = await db.get_owned_app(call.from_user.id, int(call.data.split(":")[1]))
    if not app or not app["bot_id"]:
        await call.answer("اول ربات رو وصل کن", show_alert=True)
        return
    plan = await db.user_plan(call.from_user.id)
    await call.message.edit_text(texts.MODE_CHOOSE, reply_markup=kb.choose_mode(app["id"], plan.full_mode))
    await call.answer()


@router.callback_query(F.data.startswith("mode:"))
async def cb_mode(call: CallbackQuery, db: Database, clients: ClientBots) -> None:
    _, raw_id, choice = call.data.split(":")
    app = await db.get_owned_app(call.from_user.id, int(raw_id))
    if not app or not app["bot_id"]:
        await call.answer("اول ربات رو وصل کن", show_alert=True)
        return

    plan = await db.user_plan(call.from_user.id)
    if choice in ("full", "fullok") and not plan.full_mode:
        await call.answer("کنترل کامل در پلن فعلی تو نیست", show_alert=True)
        return
    if choice == "full":
        await call.message.edit_text(texts.FULL_WARNING, reply_markup=kb.confirm_full(app["id"]))
        await call.answer()
        return

    mode = "full" if choice == "fullok" else "menu"
    await call.answer("⏳")
    try:
        await clients.apply(app, mode)
    except LinkError as exc:
        await call.message.edit_text(f"❌ {exc}", reply_markup=kb.app_actions(app))
        return
    await db.set_mode(app["id"], mode)
    app = await db.get_app(app["id"])
    await call.message.edit_text(
        texts.linked(app["name"], app["bot_username"], config.page_url(app["slug"]), mode),
        reply_markup=kb.app_actions(app),
        disable_web_page_preview=True,
    )
