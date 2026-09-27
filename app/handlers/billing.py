"""پلن ها و پرداخت با Telegram Stars.

پرداخت ستاره ای نیاز به درگاه ندارد (provider_token خالی، ارز XTR).
هر پرداخت با telegram_payment_charge_id یکتا ثبت می شود تا آپدیت تکراری
تلگرام پلن را دوبار تمدید نکند.
"""
from __future__ import annotations

import logging

from aiogram import Bot, F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, LabeledPrice, Message, PreCheckoutQuery

from .. import keyboards as kb
from .. import plans, texts
from ..db import Database

router = Router(name="billing")
log = logging.getLogger("easysaz.billing")

PLAN_DAYS = 30


def _paid_plans() -> list[plans.Plan]:
    return list(plans.PLANS.values())


async def plans_view(db: Database, user_id: int) -> tuple[str, object]:
    user = await db.get_user(user_id)
    current = await db.user_plan(user_id)
    until = user["plan_until"] if user else None
    return texts.plans_text(current.key, until, _paid_plans()), kb.plans(_paid_plans())


@router.message(Command("plans"))
async def cmd_plans(message: Message, db: Database) -> None:
    text, markup = await plans_view(db, message.from_user.id)
    await message.answer(text, reply_markup=markup)


@router.callback_query(F.data == "plans")
async def cb_plans(call: CallbackQuery, db: Database) -> None:
    text, markup = await plans_view(db, call.from_user.id)
    await call.message.edit_text(text, reply_markup=markup)
    await call.answer()


@router.callback_query(F.data.startswith("buy:"))
async def cb_buy(call: CallbackQuery, bot: Bot) -> None:
    plan = plans.PLANS.get(call.data.split(":", 1)[1])
    if not plan or plan.price_stars <= 0:
        await call.answer("این پلن قابل خرید نیست", show_alert=True)
        return
    await bot.send_invoice(
        chat_id=call.from_user.id,
        title=f"پلن {plan.title} EasySaz",
        description=f"{PLAN_DAYS} روز · " + " · ".join(plan.features),
        payload=f"plan:{plan.key}:{call.from_user.id}",
        currency="XTR",
        prices=[LabeledPrice(label=plan.title, amount=plan.price_stars)],
        provider_token="",
    )
    await call.answer()


@router.pre_checkout_query()
async def pre_checkout(query: PreCheckoutQuery) -> None:
    parts = (query.invoice_payload or "").split(":")
    plan = plans.PLANS.get(parts[1]) if len(parts) == 3 and parts[0] == "plan" else None
    ok = bool(
        plan
        and query.currency == "XTR"
        and query.total_amount == plan.price_stars
        and parts[2] == str(query.from_user.id)
    )
    await query.answer(ok=ok, error_message=None if ok else "قیمت این پلن عوض شده؛ دوباره از منوی پلن‌ها بخر.")


@router.message(F.successful_payment)
async def paid(message: Message, db: Database) -> None:
    sp = message.successful_payment
    parts = (sp.invoice_payload or "").split(":")
    plan = plans.PLANS.get(parts[1]) if len(parts) == 3 else None
    if plan is None:
        log.error("payment with unknown payload %r", sp.invoice_payload)
        return
    if not await db.record_payment(
        message.from_user.id, plan.key, sp.total_amount, sp.telegram_payment_charge_id
    ):
        return  # تکراری
    until = await db.extend_plan(message.from_user.id, plan.key, PLAN_DAYS)
    await message.answer(texts.paid(plan.title, until), reply_markup=kb.home())
