"""کیبوردهای ربات اصلی."""
from __future__ import annotations

from aiogram.types import InlineKeyboardButton as B
from aiogram.types import InlineKeyboardMarkup, WebAppInfo

from .config import config


def _kb(*rows: list[B]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[r for r in rows if r])


def panel_button(text: str = "🎨 پنل ساخت مینی اپ") -> B:
    return B(text=text, web_app=WebAppInfo(url=config.panel_url))


def home() -> InlineKeyboardMarkup:
    return _kb(
        [panel_button()],
        [B(text="🤖 اتصال ربات", callback_data="connect"), B(text="📱 مینی اپ من", callback_data="myapps")],
        [B(text="💎 پلن‌ها", callback_data="plans"), B(text="❓ راهنما", callback_data="help")],
    )


def web_login(code: str) -> InlineKeyboardMarkup:
    """لینک QR سایت که با دوربین معمولی باز شده: پنل با صفحهٔ تأیید همان کد."""
    return _kb([B(text="🔐 بررسی و تأیید", web_app=WebAppInfo(url=f"{config.panel_url}#weblogin={code}"))],
               [B(text="‹ بازگشت", callback_data="home")])


def back_home() -> InlineKeyboardMarkup:
    return _kb([B(text="‹ بازگشت", callback_data="home")])


def cancel() -> InlineKeyboardMarkup:
    return _kb([B(text="لغو", callback_data="home")])


def pick_app(apps, action: str) -> InlineKeyboardMarkup:  # noqa: ANN001
    rows = [[B(text=f"📱 {a['name']}", callback_data=f"{action}:{a['id']}")] for a in apps]
    rows.append([B(text="‹ بازگشت", callback_data="home")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def choose_mode(app_id: int, full_allowed: bool) -> InlineKeyboardMarkup:
    rows = [[B(text="🔘 دکمه منو (پیشنهادی)", callback_data=f"mode:{app_id}:menu")]]
    if full_allowed:
        rows.append([B(text="⚡ کنترل کامل", callback_data=f"mode:{app_id}:full")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def confirm_full(app_id: int) -> InlineKeyboardMarkup:
    return _kb(
        [B(text="✅ متوجه شدم، فعال کن", callback_data=f"mode:{app_id}:fullok")],
        [B(text="‹ نه، فقط دکمه منو", callback_data=f"mode:{app_id}:menu")],
    )


def app_actions(app) -> InlineKeyboardMarkup:  # noqa: ANN001
    aid = app["id"]
    rows = [[panel_button("🎨 ویرایش صفحه")]]
    if app["bot_id"]:
        rows.append(
            [
                B(text="🔌 حالت اتصال", callback_data=f"modes:{aid}"),
                B(text="🔁 تعویض ربات", callback_data=f"rebind:{aid}"),
            ]
        )
        if app["mode"] == "full":
            rows.append([B(text="👋 پیام خوش‌آمد", callback_data=f"welcome:{aid}")])
        rows.append([B(text="⛓ جدا کردن ربات", callback_data=f"unlink:{aid}")])
    else:
        rows.append([B(text="🤖 اتصال ربات", callback_data=f"rebind:{aid}")])
    toggle = "⏸ توقف موقت" if app["status"] == "active" else "▶️ فعال کردن"
    rows.append([B(text=toggle, callback_data=f"toggle:{aid}")])
    rows.append([B(text="‹ بازگشت", callback_data="home")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def confirm_unlink(app_id: int) -> InlineKeyboardMarkup:
    return _kb(
        [B(text="بله، جدا کن", callback_data=f"unlinkok:{app_id}")],
        [B(text="‹ نه", callback_data=f"app:{app_id}")],
    )


def plans(plan_list) -> InlineKeyboardMarkup:  # noqa: ANN001
    rows = [
        [B(text=f"⭐ خرید {p.title} — {p.price_stars} ستاره", callback_data=f"buy:{p.key}")]
        for p in plan_list
        if p.price_stars > 0
    ]
    rows.append([B(text="‹ بازگشت", callback_data="home")])
    return InlineKeyboardMarkup(inline_keyboard=rows)
