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
         note: str = "") -> dict:
    doc = {
        "theme": {"accent": accent, "mode": "auto", "radius": "soft", "bg": "tint", **(theme or {})},
        "header": {"enabled": False, **(header or {})},
        "tabbar": {"enabled": True, "style": "floating", **(tabbar or {})},
        "pages": pages,
    }
    doc = blocks.clean_page(doc, max_blocks=100, premium=True, max_pages=12)
    premium = any(blocks.SCHEMA[b["type"]]["premium"] for b in blocks.all_blocks(doc))
    return {
        "id": tid, "title": title, "desc": desc, "category": category, "accent": accent,
        "premium": premium, "pages": len(doc["pages"]), "blocks": len(blocks.all_blocks(doc)),
        "note": note, "doc": doc,
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
    """به سبک عبور: کارت سرمه‌ای، پلن‌ها، راهنمای اتصال و پشتیبانی."""
    return _tpl("vpn", "فروش سرویس اینترنت", "به سبک عبور: پلن‌ها، راهنمای اتصال و پشتیبانی", "digital", "#1D55F0", [
        _page("home", "خانه", "home", [
            _b("hero", {"title": "{name}", "subtitle": "اینترنت آزاد، پایدار و سریع.\nمسیرت با ماست.", "style": "pass", "align": "start", "chip": "همهٔ سرورها فعال"}),
            _b("features", {"title": "چرا ما؟", "items": [
                {"emoji": "⚡", "title": "سرعت بالا", "desc": "سرورهای اختصاصی"},
                {"emoji": "🛡️", "title": "پایدار", "desc": "بدون قطعی"},
                {"emoji": "💬", "title": "پشتیبانی", "desc": "جواب زیر ۱۰ دقیقه"},
                {"emoji": "🎁", "title": "تست رایگان", "desc": "قبل از خرید"}]}),
            _b("button", {"label": "دریافت تست رایگان", "url": ""}),
        ]),
        _page("plans", "پلن‌ها", "shop", [
            _b("pricing", {"title": "پلن‌ها", "items": [
                {"name": "یک ماهه", "price": "۱۵۰ هزار تومان", "period": "۳۰ روز", "features": "۳۰ گیگ\nدو کاربر\nهمهٔ لوکیشن‌ها", "badge": "", "url": "", "cta": "خرید"},
                {"name": "سه ماهه", "price": "۳۹۰ هزار تومان", "period": "۹۰ روز", "features": "۱۰۰ گیگ\nسه کاربر\nهمهٔ لوکیشن‌ها", "badge": "بهترین ارزش", "url": "", "cta": "خرید"}]}),
            _b("notice", {"text": "بعد از خرید، لینک اتصال همان لحظه در ربات تحویل می‌شود.", "tone": "info"}),
        ]),
        _page("guide", "راهنما", "info", [
            _b("links", {"items": [
                {"label": "اندروید", "note": "v2rayNG", "url": ""},
                {"label": "آیفون", "note": "Streisand / V2Box", "url": ""},
                {"label": "ویندوز", "note": "v2rayN", "url": ""},
                {"label": "مک", "note": "V2Box", "url": ""}]}),
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


TEMPLATES: list[dict] = [cafe(), shop(), vpn(), portfolio(), linkbio(), academy()]
BY_ID = {t["id"]: t for t in TEMPLATES}


def public() -> dict:
    return {"categories": CATEGORIES, "templates": TEMPLATES}
