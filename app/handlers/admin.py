"""دستورهای مدیر پلتفرم (فقط ADMIN_IDS).

/stats                       آمار کلی
/grant <tg_id> <plan> <days> دادن پلن دستی (plan: free|pro|business)
/block <tg_id>  /unblock <tg_id>
"""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, CommandObject
from aiogram.types import Message

from .. import plans
from ..config import config
from ..db import Database

router = Router(name="admin")
router.message.filter(F.from_user.id.in_(set(config.admin_ids)))


@router.message(Command("stats"))
async def cmd_stats(message: Message, db: Database) -> None:
    s = await db.global_stats()
    await message.answer(
        "<b>📊 آمار EasySaz</b>\n\n"
        f"کاربران: <b>{s['users']}</b>\n"
        f"مینی اپ‌ها: <b>{s['apps']}</b>\n"
        f"ربات‌های وصل: <b>{s['bots']}</b> (کنترل کامل: {s['full']})\n"
        f"اشتراک فعال: <b>{s['paid']}</b>"
    )


@router.message(Command("grant"))
async def cmd_grant(message: Message, command: CommandObject, db: Database) -> None:
    args = (command.args or "").split()
    if len(args) != 3 or not args[0].isdigit() or args[1] not in plans.PLANS or not args[2].isdigit():
        await message.answer("شکل درست: <code>/grant 123456 pro 30</code>")
        return
    tg_id, key, days = int(args[0]), args[1], int(args[2])
    if not await db.get_user(tg_id):
        await message.answer("این کاربر هنوز ربات را استارت نکرده.")
        return
    if key == plans.DEFAULT_PLAN:
        await db.set_plan(tg_id, key, None)
        await message.answer("پلن کاربر به رایگان برگشت.")
        return
    until = await db.extend_plan(tg_id, key, days)
    await message.answer(f"✅ پلن {plans.PLANS[key].title} برای {tg_id} تا <code>{until}</code> فعال شد.")


@router.message(Command("block", "unblock"))
async def cmd_block(message: Message, command: CommandObject, db: Database) -> None:
    arg = (command.args or "").strip()
    if not arg.isdigit():
        await message.answer(f"شکل درست: <code>/{command.command} 123456</code>")
        return
    blocked = command.command == "block"
    await db.set_blocked(int(arg), blocked)
    await message.answer("مسدود شد." if blocked else "آزاد شد.")
