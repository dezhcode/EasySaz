"""خانه، راهنما و لغو."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from .. import keyboards as kb
from .. import texts
from ..db import Database

router = Router(name="start")


@router.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject, state: FSMContext, db: Database) -> None:
    """/start با پارامتر: پنل ساخت با لینک t.me/EasySazBot?start=... کاربر را
    مستقیم به بخش مربوط می فرستد."""
    await state.clear()
    arg = (command.args or "").strip()
    if arg == "connect":
        from .connect import start_connect

        await start_connect(message, message.from_user.id, state, db, edit=False)
        return
    if arg == "plans":
        from .billing import plans_view

        text, markup = await plans_view(db, message.from_user.id)
        await message.answer(text, reply_markup=markup)
        return
    if arg == "help":
        await message.answer(texts.HELP, reply_markup=kb.back_home())
        return
    if arg.startswith("wl_"):
        # QR صفحهٔ ورود سایت که با دوربین معمولی اسکن شده
        from ..site.logins import CODE_RE

        if CODE_RE.match(arg[3:]):
            await message.answer(texts.WEB_LOGIN, reply_markup=kb.web_login(arg[3:]))
            return
    from .botkit import parse_arg

    bk = parse_arg(arg)
    if bk:
        # ربات‌ساز: افزودن ایموجی پریمیوم یا ساخت ربات با یک دکمه
        from .botkit import start_emoji, start_newbot

        await (start_emoji if bk[0] == "emoji" else start_newbot)(message, state, db, bk[1])
        return
    if arg == "myapp":
        from .myapp import show_apps

        await show_apps(message, message.from_user.id, db, edit=False)
        return
    await message.answer(texts.HOME, reply_markup=kb.home())


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(texts.HELP, reply_markup=kb.back_home())


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(texts.CANCELLED, reply_markup=kb.home())


@router.callback_query(F.data == "home")
async def cb_home(call: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await call.message.edit_text(texts.HOME, reply_markup=kb.home())
    await call.answer()


@router.callback_query(F.data == "help")
async def cb_help(call: CallbackQuery) -> None:
    await call.message.edit_text(texts.HELP, reply_markup=kb.back_home())
    await call.answer()


@router.message(F.chat.type == "private")
async def fallback(message: Message) -> None:
    """هر پیام دیگری: منوی اصلی. (باید آخرین روتر باشد.)"""
    await message.answer(texts.HOME, reply_markup=kb.home())
