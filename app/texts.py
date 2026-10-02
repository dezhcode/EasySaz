"""همه متن های ربات اصلی (@EasySazBot). HTML است؛ ورودی کاربر همیشه escape می شود."""
from __future__ import annotations

from html import escape

MODE_TITLES = {
    "none": "وصل نشده",
    "menu": "دکمه منو",
    "full": "کنترل کامل",
}

HOME = (
    "<b>✨ EasySaz</b>\n"
    "مینی اپ تلگرام خودت رو بدون کدنویسی بساز.\n\n"
    "<b>۱.</b> از «پنل ساخت» یک اسم بذار و صفحه‌ت رو با کامپوننت‌های آماده بچین.\n"
    "<b>۲.</b> توکن رباتت رو اینجا بفرست.\n"
    "<b>۳.</b> تمام! مینی اپت روی ربات خودت بالا میاد."
)

INTRO_CAPTION = (
    "🎬 <b>ایزی‌ساز در ۳۵ ثانیه</b>\n"
    "مینی‌اپ و ربات تلگرام خودت رو بدون کد بساز؛ همین‌جا، داخل تلگرام.\n\n"
    "<i>پیانو: Salamander Grand Piano، Alexander Holm (CC-BY 3.0)</i>"
)

INTRO_MISSING = "ویدیوی معرفی الان در دسترس نیست؛ کمی بعد دوباره امتحان کن."

CONNECT_ASK = (
    "<b>🤖 اتصال ربات</b>\n\n"
    "توکن رباتت رو از @BotFather کپی کن و همین‌جا بفرست.\n"
    "<i>شکلش این‌طوریه:</i> <code>123456789:AAH...</code>\n\n"
    "🔒 توکن رمزنگاری‌شده نگه داشته می‌شه و پیامت رو هم پاک می‌کنیم."
)

CONNECT_CHECKING = "⏳ دارم توکن رو بررسی می‌کنم…"
CONNECT_TAKEN = "این ربات قبلاً به یک مینی اپ دیگه وصل شده."
CONNECT_SELF = "این توکن خود EasySaz است 🙂 توکن ربات خودت رو بفرست."
CONNECT_LIMIT = (
    "پلن فعلی تو اجازه مینی اپ جدید نمی‌ده.\n"
    "برای ساخت مینی اپ بیشتر، یک پلن بگیر."
)
CANCELLED = "لغو شد."


def connected(bot_username: str, app_name: str) -> str:
    return (
        f"✅ ربات <b>@{escape(bot_username)}</b> به مینی اپ «{escape(app_name)}» وصل شد.\n\n"
        "حالا انتخاب کن EasySaz چطور با رباتت کار کنه:"
    )


MODE_CHOOSE = (
    "<b>🔘 دکمه منو</b> — امن و پیشنهادی\n"
    "فقط دکمه پایین چت رباتت به مینی اپ وصل می‌شه. اگه رباتت الان جای دیگه‌ای "
    "اجرا شده، هیچ تغییری نمی‌کنه.\n\n"
    "<b>⚡ کنترل کامل</b>\n"
    "علاوه بر دکمه منو، EasySaz جواب /start رباتت رو با یک پیام خوش‌آمد و دکمه ورود می‌ده."
)

FULL_WARNING = (
    "<b>⚠️ قبل از فعال کردن کنترل کامل بخون</b>\n\n"
    "با این گزینه وبهوک رباتت به EasySaz منتقل می‌شه.\n"
    "<b>اگه رباتت الان روی سرور یا برنامه دیگه‌ای اجرا می‌شه، از کار می‌افته</b> "
    "و دیگه پیامی بهش نمی‌رسه.\n\n"
    "هر وقت خواستی می‌تونی برگردی به «دکمه منو» تا ربات آزاد بشه."
)


def linked(app_name: str, bot_username: str, url: str, mode: str) -> str:
    extra = (
        "\n\n⚡ حالا /start رباتت هم پیام خوش‌آمد و دکمه ورود می‌ده."
        if mode == "full"
        else ""
    )
    return (
        f"🎉 <b>مینی اپ «{escape(app_name)}» روی @{escape(bot_username)} فعال شد!</b>\n\n"
        f"دکمه منوی رباتت الان مینی اپ رو باز می‌کنه.{extra}\n\n"
        f"🔗 لینک مینی اپ:\n<code>{escape(url)}</code>\n\n"
        "<b>لینک مستقیم (اختیاری):</b> برای اینکه لینک "
        f"<code>t.me/{escape(bot_username)}?startapp</code> هم کار کنه، در @BotFather:\n"
        "<i>/mybots ← رباتت ← Bot Settings ← Configure Mini App ← Enable</i>\n"
        "و همین لینک بالا رو بده."
    )


def app_card(app, stats: dict, plan_title: str, url: str) -> str:  # noqa: ANN001
    bot = f"@{escape(app['bot_username'])}" if app["bot_username"] else "— هنوز وصل نشده"
    status = "🟢 فعال" if app["status"] == "active" else "⏸ متوقف"
    published = "منتشر شده" if app["published_at"] else "هنوز منتشر نشده"
    return (
        f"<b>📱 {escape(app['name'])}</b>\n"
        f"{status} · {published}\n\n"
        f"🤖 ربات: {bot}\n"
        f"🔌 اتصال: {MODE_TITLES.get(app['mode'], app['mode'])}\n"
        f"💎 پلن: {escape(plan_title)}\n\n"
        f"👥 بازدیدکننده‌ها: <b>{stats['visitors']}</b>\n"
        f"👁 بازدید امروز: <b>{stats['views_today']}</b> · هفت روز: <b>{stats['views_week']}</b>\n\n"
        f"🔗 <code>{escape(url)}</code>"
    )


NO_APP = (
    "هنوز مینی اپی نساختی.\n"
    "از «🎨 پنل ساخت» شروع کن یا مستقیم توکن رباتت رو وصل کن."
)

WELCOME_ASK = (
    "متن پیام خوش‌آمدی که رباتت در جواب /start می‌فرسته رو بنویس.\n"
    "(حداکثر ۵۰۰ کاراکتر — برای برگشت به پیش‌فرض بنویس <code>-</code>)"
)


def default_welcome(app_name: str) -> str:
    return f"سلام! 👋\nبه «{escape(app_name)}» خوش اومدی.\nبرای شروع روی دکمه زیر بزن."


def plans_text(current_key: str, plan_until: int | None, plan_list) -> str:  # noqa: ANN001
    import time

    lines = ["<b>💎 پلن‌های EasySaz</b>\n"]
    for p in plan_list:
        mark = " ✅" if p.key == current_key else ""
        price = "رایگان" if p.price_stars == 0 else f"{p.price_stars} ⭐ / ماه"
        lines.append(f"<b>{escape(p.title)}</b> — {price}{mark}")
        lines.extend(f"  • {escape(f)}" for f in p.features)
        lines.append("")
    if current_key != "free" and plan_until:
        left = max(0, (plan_until - int(time.time())) // 86400)
        lines.append(f"⏳ {left} روز از پلن فعلی‌ت مونده.")
    return "\n".join(lines).strip()


def paid(plan_title: str, until: int) -> str:
    import time

    date = time.strftime("%Y-%m-%d", time.gmtime(until))
    return f"🎉 پلن <b>{escape(plan_title)}</b> فعال شد!\nاعتبار تا {date}"


WEB_LOGIN = (
    "<b>🔐 ورود به سایت ایزی‌ساز</b>\n\n"
    "یک مرورگر می‌خواهد با حساب تلگرامت وارد سایت شود.\n"
    "دکمهٔ زیر را بزن، اسم مرورگر را ببین و اگر خودت بودی تأیید کن.\n\n"
    "اگر خودت این QR را اسکن نکرده‌ای، کاری نکن."
)

HELP = (
    "<b>❓ راهنما</b>\n\n"
    "<b>ساخت توکن:</b> در @BotFather دستور /newbot رو بزن، اسم و یوزرنیم بده و توکن رو کپی کن.\n\n"
    "<b>ساخت صفحه:</b> «🎨 پنل ساخت» رو باز کن، اسم مینی اپ رو بنویس و از دکمه ➕ کامپوننت اضافه کن. "
    "روی هر کامپوننت بزن تا ویرایشش کنی. آخر کار «انتشار» رو بزن.\n\n"
    "<b>اتصال:</b> «🤖 اتصال ربات» و فرستادن توکن. بعدش دکمه منوی رباتت مینی اپ رو باز می‌کنه."
)
