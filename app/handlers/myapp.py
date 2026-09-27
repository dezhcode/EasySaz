"""مینی اپ من: کارت وضعیت، توقف، جدا کردن ربات و پیام خوش آمد."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from .. import keyboards as kb
from .. import texts
from ..clients import ClientBots
from ..config import config
from ..db import Database
from ..states import Welcome

router = Router(name="myapp")


async def _card(db: Database, app) -> tuple[str, object]:  # noqa: ANN001
    stats = await db.app_stats(app["id"])
    plan = await db.user_plan(app["owner_id"])
    text = texts.app_card(app, stats, plan.title, config.page_url(app["slug"]))
    return text, kb.app_actions(app)


async def show_apps(target: Message, user_id: int, db: Database, edit: bool) -> None:
    apps = await db.list_apps(user_id)
    if not apps:
        text, markup = texts.NO_APP, kb.home()
    elif len(apps) == 1:
        text, markup = await _card(db, apps[0])
    else:
        text, markup = "<b>📱 مینی اپ‌های تو</b>", kb.pick_app(apps, "app")
    if edit:
        await target.edit_text(text, reply_markup=markup, disable_web_page_preview=True)
    else:
        await target.answer(text, reply_markup=markup, disable_web_page_preview=True)


@router.message(Command("myapp"))
async def cmd_myapp(message: Message, db: Database) -> None:
    await show_apps(message, message.from_user.id, db, edit=False)


@router.callback_query(F.data == "myapps")
async def cb_myapps(call: CallbackQuery, db: Database) -> None:
    await show_apps(call.message, call.from_user.id, db, edit=True)
    await call.answer()


async def _owned(call: CallbackQuery, db: Database):  # noqa: ANN202
    app = await db.get_owned_app(call.from_user.id, int(call.data.split(":")[1]))
    if not app:
        await call.answer("پیدا نشد", show_alert=True)
    return app


@router.callback_query(F.data.startswith("app:"))
async def cb_app(call: CallbackQuery, db: Database) -> None:
    app = await _owned(call, db)
    if app:
        text, markup = await _card(db, app)
        await call.message.edit_text(text, reply_markup=markup, disable_web_page_preview=True)
        await call.answer()


@router.callback_query(F.data.startswith("toggle:"))
async def cb_toggle(call: CallbackQuery, db: Database) -> None:
    app = await _owned(call, db)
    if not app:
        return
    await db.set_status(app["id"], "paused" if app["status"] == "active" else "active")
    app = await db.get_app(app["id"])
    text, markup = await _card(db, app)
    await call.message.edit_text(text, reply_markup=markup, disable_web_page_preview=True)
    await call.answer("⏸ متوقف شد" if app["status"] == "paused" else "▶️ فعال شد")


@router.callback_query(F.data.startswith("unlink:"))
async def cb_unlink(call: CallbackQuery, db: Database) -> None:
    app = await _owned(call, db)
    if app:
        await call.message.edit_text(
            f"ربات @{app['bot_username']} از این مینی اپ جدا بشه؟\n"
            "دکمه منوی ربات به حالت عادی برمی‌گرده و توکن از EasySaz پاک می‌شه.",
            reply_markup=kb.confirm_unlink(app["id"]),
        )
        await call.answer()


@router.callback_query(F.data.startswith("unlinkok:"))
async def cb_unlink_ok(call: CallbackQuery, db: Database, clients: ClientBots) -> None:
    app = await _owned(call, db)
    if not app:
        return
    await clients.release(app)
    await db.detach_bot(app["id"])
    app = await db.get_app(app["id"])
    text, markup = await _card(db, app)
    await call.message.edit_text(text, reply_markup=markup, disable_web_page_preview=True)
    await call.answer("جدا شد")


@router.callback_query(F.data.startswith("welcome:"))
async def cb_welcome(call: CallbackQuery, state: FSMContext, db: Database) -> None:
    app = await _owned(call, db)
    if not app:
        return
    await state.set_state(Welcome.text)
    await state.set_data({"app_id": app["id"]})
    current = app["welcome"] or texts.default_welcome(app["name"])
    await call.message.edit_text(
        f"{texts.WELCOME_ASK}\n\n<b>متن فعلی:</b>\n{current}", reply_markup=kb.cancel()
    )
    await call.answer()


@router.message(Welcome.text, F.text, ~F.text.startswith("/"))
async def got_welcome(message: Message, state: FSMContext, db: Database) -> None:
    data = await state.get_data()
    app = await db.get_owned_app(message.from_user.id, data.get("app_id") or 0)
    await state.clear()
    if not app:
        return
    # html_text فرمت تلگرامی (بولد و ...) را نگه می دارد و بقیه را escape می کند
    raw = message.html_text.strip()
    await db.set_welcome(app["id"], None if raw == "-" else raw[:1500])
    app = await db.get_app(app["id"])
    text, markup = await _card(db, app)
    await message.answer("✅ پیام خوش‌آمد ذخیره شد.\n\n" + text, reply_markup=markup, disable_web_page_preview=True)
