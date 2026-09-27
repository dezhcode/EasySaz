"""قالب‌های آماده.

کاربر بعد از انتخاب اسم (یا بعداً از ابزار «قالب‌ها») یک قالب برمی‌دارد تا
از صفحهٔ خالی شروع نکند. هر قالب یک سند کامل نسخهٔ ۲ است (صفحه‌ها، سربرگ،
نوار پایین، رنگ) و با همان blocks.clean_page اعتبارسنجی می‌شود؛ test_smoke
این را برای همهٔ قالب‌ها چک می‌کند.

«{name}» در متن‌ها هنگام اعمال با اسم مینی‌اپ جایگزین می‌شود.
قالب‌هایی که کامپوننت PRO دارند فقط در پلن‌های پولی قابل اعمال‌اند.

افزودن قالب تازه: یک تابع که _tpl(...) برمی‌گرداند و افزودنش به TEMPLATES.
"""
from __future__ import annotations

from typing import Any

from . import blocks

CATEGORIES = {
    "local": "کسب‌وکار محلی",
    "shop": "فروشگاه",
    "digital": "خدمات دیجیتال",
    "personal": "شخصی",
    "edu": "آموزش",
    "story": "داستان و کانال",
}


def _b(btype: str, props: dict | None = None, style: dict | None = None) -> dict:
    """یک کامپوننت با مقدارهای پیش‌فرض اسکیما و تغییرهای داده‌شده."""
    base = blocks.default_props(btype)
    base.update(props or {})
    out: dict[str, Any] = {"type": btype, "props": base}
    if style:
        out["style"] = style
    return out


def _page(pid: str, title: str, icon: str, items: list[dict]) -> dict:
    return {"id": pid, "title": title, "icon": icon, "blocks": items}


def _tpl(tid: str, title: str, desc: str, category: str, accent: str, pages: list[dict], *,
         header: dict | None = None, tabbar: dict | None = None, theme: dict | None = None,
         note: str = "", kit: str = "base") -> dict:
    doc = {
        "kit": kit,
        "theme": {"accent": accent, "mode": "light", "radius": "soft", "bg": "tint", **(theme or {})},
        "header": {"enabled": False, **(header or {})},
        "tabbar": {"enabled": True, "style": "floating", **(tabbar or {})},
        "pages": pages,
    }
    doc = blocks.clean_page(doc, max_blocks=100, premium=True, max_pages=12)
    premium = any(blocks.SCHEMA[b["type"]]["premium"] for b in blocks.all_blocks(doc))
    return {
        "id": tid, "title": title, "desc": desc, "category": category, "accent": accent,
        "premium": premium, "pages": len(doc["pages"]), "blocks": len(blocks.all_blocks(doc)),
        "note": note, "kit": doc["kit"], "doc": doc,
    }


def cafe() -> dict:
    return _tpl("cafe", "کافه و رستوران", "منو، ساعت کاری، سفارش و راه‌های تماس", "local", "#E0573E", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "قهوهٔ تازه‌برشت و کیک خانگی، هر روز از ۸ صبح.", "style": "solid"}),
            _b("notice", {"text": "۲۰٪ تخفیف همهٔ نوشیدنی‌ها تا آخر هفته"}),
            _b("button", {"label": "سفارش آنلاین", "url": ""}),
            _b("text", {"title": "درباره ما", "body": "چند خط دربارهٔ کافه‌ات بنویس: از کِی باز شدید و چه چیزی شما را خاص می‌کند."}),
            _b("social", {"items": [{"kind": "telegram", "value": ""}, {"kind": "instagram", "value": ""}, {"kind": "phone", "value": ""}]}),
        ]),
        _page("menu", "منو", "menu", [
            _b("links", {"items": [
                {"label": "نوشیدنی‌های گرم", "note": "اسپرسو، لاته، دمنوش", "url": ""},
                {"label": "نوشیدنی‌های سرد", "note": "آیس‌لاته، اسموتی", "url": ""},
                {"label": "کیک و دسر", "note": "هر روز تازه", "url": ""}]}),
            _b("faq", {"title": "سوالات متداول", "items": [
                {"q": "ساعت کاری کافه چیه؟", "a": "هر روز از ۸ صبح تا ۱۱ شب."},
                {"q": "پیک دارید؟", "a": "تا ۳ کیلومتری کافه."}]}),
        ]),
    ], header={"enabled": True, "style": "plain", "title": "{name}"})


def shop() -> dict:
    return _tpl("shop", "فروشگاه آنلاین", "محصولات با قیمت، دسته‌بندی و سفارش در تلگرام", "shop", "#6A55E0", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "ارسال به سراسر کشور، پرداخت امن", "style": "soft"}),
            _b("cards", {"title": "پرفروش‌ها", "items": [
                {"title": "محصول اول", "price": "۴۸۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
                {"title": "محصول دوم", "price": "۳۲۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
                {"title": "محصول سوم", "price": "۶۹۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
                {"title": "محصول چهارم", "price": "۲۱۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"}]}),
        ]),
        _page("shop", "محصولات", "shop", [
            _b("features", {"title": "چرا از ما بخری؟", "items": [
                {"emoji": "🚚", "title": "ارسال سریع", "desc": "تحویل ۲ تا ۴ روزه"},
                {"emoji": "🔁", "title": "۷ روز ضمانت", "desc": "بازگشت بدون سوال"}]}),
            _b("button", {"label": "سفارش در تلگرام", "url": ""}),
        ]),
        _page("contact", "تماس", "chat", [
            _b("faq", {"title": "سوالات متداول", "items": [
                {"q": "هزینهٔ ارسال چقدره؟", "a": "برای خرید بالای [مبلغ] رایگان است."}]}),
            _b("social", {"items": [{"kind": "telegram", "value": ""}, {"kind": "instagram", "value": ""}]}),
        ]),
    ], header={"enabled": True, "style": "bar", "title": "{name}"})


def vpn() -> dict:
    """به سبک عبور: کارت عبور، آمار، بلیت پلن‌ها، سرویس دلخواه با اسلایدر،
    راهنمای اتصال با تب هر دستگاه، برنامه‌ها و پشتیبانی."""
    return _tpl("vpn", "فروش سرویس اینترنت", "به سبک عبور: پلن‌ها، سرویس دلخواه، راهنمای اتصال و پشتیبانی", "digital", "#1D55F0", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "اینترنت آزاد، پایدار و سریع.\nمسیرت با ماست.", "style": "pass", "align": "start", "chip": "همهٔ سرورها فعال"}),
            _b("stats", {"layout": "strip", "items": [
                {"value": "+12,000", "label": "هم‌سفر"}, {"value": "99.9%", "label": "پایداری"}, {"value": "24/7", "label": "پشتیبانی"}]}),
            _b("passcard", {"tone": "accent", "title": "پرفروش‌ترین", "status": "۹۰ روزه", "value": "100", "unit": "گیگ · سه کاربر",
                            "progress": 0, "meta": "۳۹۰ هزار تومان", "cta": "خرید", "url": ""}),
            _b("button", {"label": "دریافت تست رایگان", "url": ""}),
        ]),
        _page("plans", "فروشگاه", "shop", [
            _b("pricing", {"title": "پلن‌ها", "layout": "stack", "items": [
                {"name": "یک ماهه", "price": "۱۵۰ هزار تومان", "period": "۳۰ روز", "features": "۳۰ گیگ\nدو کاربر\nهمهٔ لوکیشن‌ها", "badge": "", "url": "", "cta": "خرید"},
                {"name": "سه ماهه", "price": "۳۹۰ هزار تومان", "period": "۹۰ روز", "features": "۱۰۰ گیگ\nسه کاربر\nهمهٔ لوکیشن‌ها", "badge": "بهترین ارزش", "url": "", "cta": "خرید"}]}),
            _b("calc", {"tone": "deep", "title": "سرویس دلخواه", "label": "حجم", "unit": "گیگ", "min": 5, "max": 100, "step": 5, "start": 20,
                        "rate": 3500, "currency": "تومان", "options_label": "مدت",
                        "options": [{"label": "۱ ماه", "percent": 100}, {"label": "۲ ماه", "percent": 110}, {"label": "۳ ماه", "percent": 115}, {"label": "۶ ماه", "percent": 125}],
                        "cta": "خرید سرویس", "url": ""}),
            _b("notice", {"text": "بعد از خرید، لینک اتصال همان لحظه در ربات تحویل می‌شود.", "tone": "info"}),
        ]),
        _page("guide", "راهنما", "info", [
            _b("steps", {"layout": "timeline", "title": "راهنمای اتصال", "items": [
                {"label": "اندروید", "steps": "برنامه را نصب کن | v2rayNG از گوگل‌پلی یا دکمهٔ زیر\nلینک را کپی کن | از ربات، «سرویس‌های من»\nلینک را اضافه کن | + بالای برنامه ← وارد کردن از کلیپ‌بورد\nوصل شو | دکمهٔ گرد پایین صفحه", "app": "v2rayNG", "url": ""},
                {"label": "آیفون", "steps": "برنامه را نصب کن | V2Box از اپ‌استور\nلینک را کپی کن | از ربات، «سرویس‌های من»\nلینک را اضافه کن | Configs ← + ← Import from clipboard\nوصل شو | دکمهٔ اتصال", "app": "V2Box", "url": ""},
                {"label": "ویندوز", "steps": "برنامه را نصب کن | v2rayN\nلینک را کپی کن | از ربات\nلینک را اضافه کن | Servers ← Import from clipboard\nوصل شو | System proxy ← Set", "app": "v2rayN", "url": ""},
                {"label": "مک", "steps": "برنامه را نصب کن | V2Box\nلینک را کپی کن | از ربات\nوصل شو | Import و بعد Connect", "app": "V2Box", "url": ""}],
                "note": "لینک اتصال را برای کسی نفرست؛ هر لینک مخصوص خود توست."}),
            _b("apps", {"layout": "chips", "title": "برنامه‌ها", "items": [
                {"name": "v2rayNG", "platform": "android", "note": "", "url": "", "best": True},
                {"name": "V2Box", "platform": "ios", "note": "", "url": "", "best": False},
                {"name": "v2rayN", "platform": "windows", "note": "", "url": "", "best": False},
                {"name": "V2Box", "platform": "mac", "note": "", "url": "", "best": False}]}),
            _b("faq", {"title": "مشکل اتصال", "items": [
                {"q": "وصل نمی‌شم", "a": "لینک را دوباره از ربات بگیر و برنامه را به‌روز کن."},
                {"q": "سرعت کمه", "a": "لوکیشن دیگری را امتحان کن."}]}),
        ]),
        _page("support", "پشتیبانی", "chat", [
            _b("text", {"title": "پشتیبانی", "body": "هر سوالی داشتی در ربات بپرس. تا ۱۰ دقیقه جواب می‌دیم."}),
            _b("button", {"label": "پیام به پشتیبانی", "url": "", "style": "soft"}),
        ]),
    ], header={"enabled": True, "style": "plain", "title": "{name}"},
       note="اتصال مستقیم به پنل PasarGuard (ساخت خودکار سرویس بعد از خرید) در مرحلهٔ بک‌اند اضافه می‌شود.")

def portfolio() -> dict:
    return _tpl("portfolio", "پورتفولیو", "نمونه‌کار، دربارهٔ من و راه‌های همکاری", "personal", "#0A2572", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "طراح محصول · تهران", "style": "plain", "align": "start"}),
            _b("text", {"title": "دربارهٔ من", "body": "چند خط دربارهٔ کار و تجربه‌ات بنویس."}),
            _b("image", {"caption": "یک نمونه‌کار شاخص", "ratio": "4:5"}),
            _b("button", {"label": "همکاری با من", "url": "", "style": "outline"}),
        ]),
        _page("work", "نمونه‌کار", "image", [
            _b("image", {"caption": "پروژهٔ اول", "ratio": "16:9"}),
            _b("image", {"caption": "پروژهٔ دوم", "ratio": "16:9"}),
            _b("social", {"items": [{"kind": "telegram", "value": ""}, {"kind": "instagram", "value": ""}, {"kind": "email", "value": ""}]}),
        ]),
    ], theme={"radius": "sharp", "bg": "plain"})


def linkbio() -> dict:
    return _tpl("linkbio", "لینک بیو", "یک صفحه با همهٔ لینک‌هایت", "personal", "#E0457B", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "همهٔ لینک‌های من یک جا", "style": "soft"}),
            _b("links", {"items": [
                {"label": "کانال تلگرام", "note": "", "url": ""},
                {"label": "اینستاگرام", "note": "", "url": ""},
                {"label": "سایت", "note": "", "url": ""}]}),
            _b("social", {"items": [{"kind": "telegram", "value": ""}, {"kind": "instagram", "value": ""}, {"kind": "youtube", "value": ""}]}),
        ]),
    ], tabbar={"enabled": False}, theme={"radius": "round"})


def academy() -> dict:
    return _tpl("academy", "آموزشگاه و دوره", "معرفی دوره، زمان‌بندی و ثبت‌نام", "edu", "#12A071", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "دوره‌های کوتاه و کاربردی، حضوری و آنلاین", "style": "solid"}),
            _b("notice", {"text": "ثبت‌نام ترم پاییز باز است.", "tone": "success"}),
            _b("links", {"items": [
                {"label": "دورهٔ مقدماتی", "note": "۸ جلسه · شنبه‌ها", "url": ""},
                {"label": "دورهٔ پیشرفته", "note": "۱۲ جلسه · دوشنبه‌ها", "url": ""}]}),
            _b("button", {"label": "ثبت‌نام", "url": ""}),
        ]),
        _page("faq", "سوالات", "info", [
            _b("faq", {"title": "سوالات متداول", "items": [
                {"q": "گواهی می‌دید؟", "a": "بله، در پایان هر دوره."},
                {"q": "قسطی می‌شه پرداخت کرد؟", "a": "بله، در دو قسط."}]}),
        ]),
    ], header={"enabled": True, "style": "solid", "title": "{name}"})


_CH13 = [
    {"title": "کلید", "note": "", "lock": False, "url": "", "body": (
        "کلید را زیر گلدان خشک‌شدهٔ کنار در گذاشته بودند؛ همان‌جا که بنگاهی گفته بود. سرد بود، سردتر از هوای آبان.\n\n"
        "خانه بوی نم و نفتالین می‌داد. پرده‌ها را کنار زدم و نور کم‌رنگ عصر روی کف چوبی پهن شد. "
        "همه‌چیز عادی بود، جز یک چیز: ساعت دیواری هال کار می‌کرد. خانه‌ای که شش سال خالی مانده بود.\n\n"
        "***\n\n"
        "شب اول صدای آب آمد. از آشپزخانه. شیر را بسته بودم؛ مطمئن بودم.")},
    {"title": "صدای قدم‌ها", "note": "", "lock": False, "url": "", "body": (
        "شب دوم صدا از سقف بود. آرام، سنگین، درست هم‌وزن قدم‌های خودم.\n\n"
        "خانه یک طبقه بود. سقفش شیروانی بود و زیر شیروانی را با آجر پر کرده بودند؛ این را بنگاهی با افتخار گفته بود، "
        "انگار عیبی را پوشانده باشد.\n\n"
        "چراغ‌قوه را برداشتم و تا صبح بیدار ماندم. قدم‌ها ساعت سه ایستادند؛ درست بالای تختم.")},
    {"title": "زیرزمین", "note": "امروز", "lock": False, "url": "", "body": (
        "پله‌ها زیر پایم ناله می‌کردند؛ انگار هر کدام اسم کسی را که پیش از من پایین رفته بود به خاطر داشتند. "
        "چراغ‌قوه فقط دایرهٔ کوچکی از تاریکی را کنار می‌زد و بقیه‌اش، سنگین و خیس، سر جایش می‌ماند.\n\n"
        "ته زیرزمین، کنار دیگ‌های زنگ‌زده، در کوچکی بود که هیچ‌وقت ندیده بودم. رویش با گچ نوشته بودند: «سیزده». "
        "و زیرش، با خطی که هنوز خشک نشده بود: «منتظرت بودیم.»\n\n"
        "***\n\n"
        "صدای قدم‌ها از بالای سرم آمد. این بار دو نفر بودند.")},
    {"title": "در سیزدهم", "note": "به‌زودی", "lock": True, "url": "", "body": (
        "دستگیره گرم بود؛ گرم مثل دستی که تازه رهایش کرده باشند. در را که باز کردم، "
        "بوی نفتالین برگشت، این بار از پشت سرم.")},
]
_TRAIN = [
    {"title": "ایستگاه متروک", "note": "", "lock": False, "url": "", "body": (
        "قطار ساعت ۲۳:۴۰ هیچ‌وقت در برنامه نبود، ولی هر شب می‌آمد.\n\n"
        "نگهبان پیر ایستگاه می‌گفت فقط کسانی سوارش می‌شوند که بلیت ندارند. "
        "من بلیت داشتم. توی جیبم بود. تا وقتی که دیگر نبود.")},
    {"title": "واگن آخر", "note": "", "lock": False, "url": "", "body": (
        "واگن آخر پر بود از آدم‌هایی که همه یک‌جور نشسته بودند: رو به پنجره، دست‌ها روی زانو.\n\n"
        "هیچ‌کدام در شیشه تصویر نداشتند. جز من.")},
]


def shab() -> dict:
    """قالب اختصاصی «شب‌نوشت»: کتابخانهٔ داستان برای کانال‌ها، با پوسته و کامپوننت‌های خودش."""
    return _tpl("shab", "شب‌نوشت", "کتابخانهٔ داستان برای کانال‌ها: قفسه، فصل‌ها، صفحهٔ خواندن و نشان‌گذاری", "story", "#C8192F", [
        _page("library", "کتابخانه", "book", [
            _b("shab_continue"),
            _b("shab_shelf"),
            _b("shab_latest", {"count": 3}),
            _b("button", {"label": "عضویت در کانال", "url": ""}),
        ]),
        _page("stories", "داستان‌ها", "list", [
            _b("story", {"title": "خانهٔ شمارهٔ ۱۳", "genre": "وحشت", "status": "ongoing", "tone": "blood",
                         "blurb": "خانه‌ای که شش سال خالی مانده، ولی ساعتش هنوز کار می‌کند.", "chapters": _CH13}),
            _b("story", {"title": "آخرین قطار", "genre": "معمایی", "status": "ongoing", "tone": "night",
                         "blurb": "قطاری که در هیچ برنامه‌ای نیست و هر شب می‌آید.", "chapters": _TRAIN}),
        ]),
        _page("marks", "نشان‌ها", "bookmark", [
            _b("shab_marks"),
        ]),
        _page("channel", "کانال", "send", [
            _b("shab_quote", {"source": "خانهٔ شمارهٔ ۱۳ · زیرزمین"}),
            _b("text", {"title": "دربارهٔ کانال", "body": "هر شب ساعت ۱۱ یک فصل تازه. داستان‌ها را این‌جا راحت‌تر بخوان؛ هر جا بمانی، دفعهٔ بعد از همان‌جا ادامه می‌دهی."}),
        ]),
    ], header={"enabled": True, "title": "{name}", "subtitle": "کانال داستان · هر شب یک فصل"},
       tabbar={"style": "floating"}, kit="shab")


TEMPLATES: list[dict] = [shab(), cafe(), shop(), vpn(), portfolio(), linkbio(), academy()]
BY_ID = {t["id"]: t for t in TEMPLATES}


def public() -> dict:
    return {"categories": CATEGORIES, "templates": TEMPLATES}
