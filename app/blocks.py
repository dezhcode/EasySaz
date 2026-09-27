"""کامپوننت های آماده و اعتبارسنجی صفحه.

صفحه هر مینی اپ یک سند JSON است، نه HTML:

    {
      "v": 1,
      "theme":  {"accent": "#2F6BFF", "mode": "auto", "radius": "soft", "bg": "tint"},
      "blocks": [{"id": "b1a2c3", "type": "hero", "props": {...}}, ...]
    }

این فایل تنها منبع حقیقت برای کامپوننت هاست:
- سرور هر سند را قبل از ذخیره با SCHEMA پاکسازی می کند (کلید ناشناخته
  حذف، طول ها بریده، لینک ها فقط https و ...).
- ادیتور فرم ویرایش هر کامپوننت را از همین SCHEMA می سازد (/api/schema).

چون کاربر فقط داده می فرستد و رندر را ما انجام می دهیم، تزریق اسکریپت
ممکن نیست و هر صفحه ای که کاربر بسازد در قالب طراحی ما می ماند.
"""
from __future__ import annotations

import re
import secrets
from typing import Any

SCHEMA_VERSION = 1

# ---------- تم ----------
THEME_FIELDS: dict[str, dict[str, Any]] = {
    "accent": {"type": "color", "default": "#2F6BFF"},
    "mode": {"type": "select", "options": ["auto", "light", "dark"], "default": "auto"},
    "radius": {"type": "select", "options": ["soft", "round", "sharp"], "default": "soft"},
    "bg": {"type": "select", "options": ["tint", "plain", "glow"], "default": "tint"},
}

# رنگ های آماده ای که در ادیتور پیشنهاد می شوند
SWATCHES = [
    "#2F6BFF", "#6A55E0", "#0E8FAE", "#12A071", "#E09A1F",
    "#E0573E", "#E0457B", "#1F2A44",
]

SOCIAL_KINDS = [
    "telegram", "instagram", "whatsapp", "youtube", "x", "website", "phone", "email",
]

# ---------- کامپوننت ها ----------
# نوع فیلدها: text, textarea, url, image, select, list
# premium=True یعنی فقط در پلن های پولی قابل افزودن است.
SCHEMA: dict[str, dict[str, Any]] = {
    "hero": {
        "title": "سربرگ",
        "icon": "sparkle",
        "desc": "عنوان بزرگ، توضیح کوتاه و لوگو",
        "premium": False,
        "fields": [
            {"key": "title", "label": "عنوان", "type": "text", "max": 60, "default": "به مینی اپ من خوش اومدی"},
            {"key": "subtitle", "label": "توضیح", "type": "textarea", "max": 200, "default": "اینجا همه چیز رو یک جا پیدا می کنی."},
            {"key": "image", "label": "آدرس لوگو یا تصویر (اختیاری)", "type": "image", "default": ""},
            {"key": "style", "label": "سبک", "type": "select", "default": "gradient",
             "options": [["gradient", "گرادینت"], ["soft", "ملایم"], ["plain", "ساده"]]},
            {"key": "align", "label": "چینش", "type": "select", "default": "center",
             "options": [["center", "وسط"], ["start", "راست"]]},
        ],
    },
    "text": {
        "title": "متن",
        "icon": "text",
        "desc": "یک پاراگراف با عنوان",
        "premium": False,
        "fields": [
            {"key": "title", "label": "عنوان (اختیاری)", "type": "text", "max": 80, "default": "درباره ما"},
            {"key": "body", "label": "متن", "type": "textarea", "max": 1500, "default": "چند خط درباره کسب و کارت بنویس."},
            {"key": "align", "label": "چینش", "type": "select", "default": "start",
             "options": [["start", "راست"], ["center", "وسط"]]},
        ],
    },
    "button": {
        "title": "دکمه",
        "icon": "button",
        "desc": "یک دکمه که به لینک می رود",
        "premium": False,
        "fields": [
            {"key": "label", "label": "متن دکمه", "type": "text", "max": 40, "default": "شروع کن"},
            {"key": "url", "label": "لینک", "type": "url", "default": "https://t.me/EasySazBot"},
            {"key": "style", "label": "سبک", "type": "select", "default": "primary",
             "options": [["primary", "پررنگ"], ["soft", "ملایم"], ["outline", "خطی"]]},
        ],
    },
    "links": {
        "title": "لیست لینک",
        "icon": "links",
        "desc": "چند لینک زیر هم، مثل لینک بیو",
        "premium": False,
        "fields": [
            {"key": "items", "label": "لینک ها", "type": "list", "max_items": 12, "item_label": "لینک",
             "fields": [
                 {"key": "label", "label": "عنوان", "type": "text", "max": 50, "default": "لینک جدید"},
                 {"key": "note", "label": "توضیح کوتاه", "type": "text", "max": 70, "default": ""},
                 {"key": "url", "label": "لینک", "type": "url", "default": "https://"},
             ],
             "default": [
                 {"label": "کانال تلگرام", "note": "آخرین خبرها", "url": "https://t.me/"},
                 {"label": "سایت ما", "note": "", "url": "https://"},
             ]},
        ],
    },
    "image": {
        "title": "تصویر",
        "icon": "image",
        "desc": "یک تصویر با زیرنویس",
        "premium": False,
        "fields": [
            {"key": "src", "label": "آدرس تصویر (https)", "type": "image", "default": ""},
            {"key": "caption", "label": "زیرنویس", "type": "text", "max": 120, "default": ""},
            {"key": "ratio", "label": "نسبت", "type": "select", "default": "16:9",
             "options": [["16:9", "افقی"], ["1:1", "مربع"], ["4:5", "عمودی"], ["auto", "اصلی"]]},
        ],
    },
    "faq": {
        "title": "سوالات متداول",
        "icon": "faq",
        "desc": "سوال و جواب های بازشونده",
        "premium": False,
        "fields": [
            {"key": "title", "label": "عنوان", "type": "text", "max": 60, "default": "سوالات متداول"},
            {"key": "items", "label": "سوال ها", "type": "list", "max_items": 15, "item_label": "سوال",
             "fields": [
                 {"key": "q", "label": "سوال", "type": "text", "max": 140, "default": "سوال جدید"},
                 {"key": "a", "label": "جواب", "type": "textarea", "max": 800, "default": ""},
             ],
             "default": [
                 {"q": "چطور سفارش بدم؟", "a": "از دکمه بالای صفحه به ما پیام بده."},
             ]},
        ],
    },
    "social": {
        "title": "شبکه های اجتماعی",
        "icon": "social",
        "desc": "آیکون راه های ارتباطی",
        "premium": False,
        "fields": [
            {"key": "items", "label": "راه ها", "type": "list", "max_items": 8, "item_label": "راه ارتباطی",
             "fields": [
                 {"key": "kind", "label": "نوع", "type": "select", "default": "telegram",
                  "options": [["telegram", "تلگرام"], ["instagram", "اینستاگرام"], ["whatsapp", "واتساپ"],
                              ["youtube", "یوتیوب"], ["x", "ایکس"], ["website", "وب سایت"],
                              ["phone", "تلفن"], ["email", "ایمیل"]]},
                 {"key": "value", "label": "آیدی، شماره یا لینک", "type": "text", "max": 120, "default": ""},
             ],
             "default": [
                 {"kind": "telegram", "value": "EasySazBot"},
                 {"kind": "instagram", "value": ""},
             ]},
        ],
    },
    "notice": {
        "title": "اطلاعیه",
        "icon": "notice",
        "desc": "یک نوار رنگی برای خبر مهم",
        "premium": False,
        "fields": [
            {"key": "text", "label": "متن", "type": "textarea", "max": 240, "default": "۲۰٪ تخفیف ویژه تا آخر هفته"},
            {"key": "tone", "label": "رنگ", "type": "select", "default": "accent",
             "options": [["accent", "رنگ اصلی"], ["success", "سبز"], ["warning", "کهربایی"], ["info", "خنثی"]]},
        ],
    },
    "divider": {
        "title": "جداکننده",
        "icon": "divider",
        "desc": "فاصله یا خط بین بخش ها",
        "premium": False,
        "fields": [
            {"key": "style", "label": "سبک", "type": "select", "default": "line",
             "options": [["line", "خط"], ["dots", "نقطه"], ["space", "فقط فاصله"]]},
        ],
    },
    # ----- پریمیوم -----
    "cards": {
        "title": "کارت محصول",
        "icon": "cards",
        "desc": "محصول یا خدمت با قیمت و دکمه",
        "premium": True,
        "fields": [
            {"key": "title", "label": "عنوان بخش", "type": "text", "max": 60, "default": "محصولات"},
            {"key": "layout", "label": "چیدمان", "type": "select", "default": "grid",
             "options": [["grid", "دوستونه"], ["list", "لیستی"]]},
            {"key": "items", "label": "کارت ها", "type": "list", "max_items": 12, "item_label": "کارت",
             "fields": [
                 {"key": "title", "label": "نام", "type": "text", "max": 50, "default": "محصول"},
                 {"key": "price", "label": "قیمت", "type": "text", "max": 30, "default": ""},
                 {"key": "desc", "label": "توضیح", "type": "textarea", "max": 200, "default": ""},
                 {"key": "image", "label": "آدرس تصویر", "type": "image", "default": ""},
                 {"key": "url", "label": "لینک دکمه", "type": "url", "default": ""},
                 {"key": "cta", "label": "متن دکمه", "type": "text", "max": 24, "default": "سفارش"},
             ],
             "default": [
                 {"title": "محصول اول", "price": "۱۹۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
                 {"title": "محصول دوم", "price": "۲۴۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
             ]},
        ],
    },
    "gallery": {
        "title": "گالری",
        "icon": "gallery",
        "desc": "اسلایدر افقی تصاویر",
        "premium": True,
        "fields": [
            {"key": "items", "label": "تصاویر", "type": "list", "max_items": 12, "item_label": "تصویر",
             "fields": [
                 {"key": "src", "label": "آدرس تصویر (https)", "type": "image", "default": ""},
                 {"key": "caption", "label": "زیرنویس", "type": "text", "max": 80, "default": ""},
             ],
             "default": [{"src": "", "caption": ""}, {"src": "", "caption": ""}]},
        ],
    },
    "features": {
        "title": "ویژگی ها",
        "icon": "features",
        "desc": "شبکه ای از مزیت ها با ایموجی",
        "premium": True,
        "fields": [
            {"key": "title", "label": "عنوان بخش", "type": "text", "max": 60, "default": "چرا ما؟"},
            {"key": "items", "label": "ویژگی ها", "type": "list", "max_items": 8, "item_label": "ویژگی",
             "fields": [
                 {"key": "emoji", "label": "ایموجی", "type": "text", "max": 4, "default": "⚡"},
                 {"key": "title", "label": "عنوان", "type": "text", "max": 40, "default": "سریع"},
                 {"key": "desc", "label": "توضیح", "type": "text", "max": 90, "default": ""},
             ],
             "default": [
                 {"emoji": "⚡", "title": "سریع", "desc": "تحویل در کمترین زمان"},
                 {"emoji": "🛡️", "title": "مطمئن", "desc": "پشتیبانی واقعی"},
             ]},
        ],
    },
}

_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f‪-‮⁦-⁩]")
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
_ID = re.compile(r"^[a-z0-9_-]{3,24}$")
_TG_USER = re.compile(r"^@?[A-Za-z][A-Za-z0-9_]{3,31}$")


def new_block_id() -> str:
    return "b" + secrets.token_hex(4)


def _clean_text(value: Any, limit: int, multiline: bool = False) -> str:
    if not isinstance(value, str):
        value = "" if value is None else str(value)
    value = _CTRL.sub("", value)
    if not multiline:
        value = value.replace("\n", " ").replace("\r", " ")
    else:
        value = value.replace("\r\n", "\n").replace("\r", "\n")
        value = re.sub(r"\n{4,}", "\n\n\n", value)
    return value.strip()[:limit]


def clean_url(value: Any, *, images: bool = False) -> str:
    """فقط لینک https (و http برای لینک عادی). بقیه پاک می شود.

    javascript: و data: و هر اسکیم دیگری رد می شود. لینک خالی یا فقط
    https:// هم خالی حساب می شود تا دکمه بی لینک ساخته نشود.
    """
    url = _clean_text(value, 500)
    if not url:
        return ""
    low = url.lower()
    if low.startswith("t.me/") or low.startswith("telegram.me/"):
        url, low = "https://" + url, "https://" + low
    allowed = ("https://",) if images else ("https://", "http://")
    if not low.startswith(allowed):
        return ""
    rest = url.split("://", 1)[1]
    if not rest or rest.startswith("/") or " " in rest:
        return ""
    return url


def social_href(kind: str, value: str) -> str:
    """ساخت لینک واقعی از آیدی/شماره. همان منطق سمت کلاینت هم هست."""
    v = value.strip()
    if not v:
        return ""
    if kind == "phone":
        digits = re.sub(r"[^\d+]", "", v)
        return f"tel:{digits}" if digits else ""
    if kind == "email":
        return f"mailto:{v}" if re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v) else ""
    if v.lower().startswith(("http://", "https://")):
        return clean_url(v)
    handle = v.lstrip("@")
    base = {
        "telegram": "https://t.me/",
        "instagram": "https://instagram.com/",
        "youtube": "https://youtube.com/@",
        "x": "https://x.com/",
        "whatsapp": "https://wa.me/",
    }.get(kind)
    if kind == "whatsapp":
        handle = re.sub(r"[^\d]", "", handle)
    if base and handle and re.match(r"^[A-Za-z0-9_.]{1,64}$", handle):
        return base + handle
    if kind == "website":
        return clean_url("https://" + v)
    return ""


def _default_of(field: dict) -> Any:
    d = field.get("default")
    if isinstance(d, list):
        return [dict(x) for x in d]
    return d


def _clean_field(field: dict, value: Any) -> Any:
    ftype = field["type"]
    if ftype == "text":
        return _clean_text(value, field.get("max", 120))
    if ftype == "textarea":
        return _clean_text(value, field.get("max", 1000), multiline=True)
    if ftype == "url":
        return clean_url(value)
    if ftype == "image":
        return clean_url(value, images=True)
    if ftype == "select":
        keys = [o[0] if isinstance(o, list) else o for o in field["options"]]
        return value if value in keys else field.get("default", keys[0])
    if ftype == "list":
        if not isinstance(value, list):
            return []
        out = []
        for item in value[: field.get("max_items", 10)]:
            if isinstance(item, dict):
                out.append({f["key"]: _clean_field(f, item.get(f["key"])) for f in field["fields"]})
        return out
    return None


def default_props(btype: str) -> dict:
    spec = SCHEMA[btype]
    return {f["key"]: _default_of(f) for f in spec["fields"]}


def clean_theme(theme: Any) -> dict:
    theme = theme if isinstance(theme, dict) else {}
    out = {}
    for key, spec in THEME_FIELDS.items():
        val = theme.get(key)
        if spec["type"] == "color":
            out[key] = val if isinstance(val, str) and _HEX.match(val) else spec["default"]
        else:
            out[key] = val if val in spec["options"] else spec["default"]
    return out


class PageError(ValueError):
    """سند صفحه با محدودیت پلن نمی خواند. متن خطا فارسی و قابل نمایش است."""


def clean_page(doc: Any, *, max_blocks: int, premium: bool) -> dict:
    """پاکسازی کامل سند صفحه.

    کلیدها و نوع های ناشناخته بی صدا حذف می شوند (ممکن است از نسخه جدیدتر
    ادیتور آمده باشند). ولی عبور از سقف پلن خطای صریح می دهد، چون کاربر
    باید بداند چرا کامپوننتش ذخیره نشد.
    """
    doc = doc if isinstance(doc, dict) else {}
    raw_blocks = doc.get("blocks") if isinstance(doc.get("blocks"), list) else []

    blocks = []
    seen: set[str] = set()
    for raw in raw_blocks:
        if not isinstance(raw, dict):
            continue
        btype = raw.get("type")
        spec = SCHEMA.get(btype)
        if spec is None:
            continue
        if spec["premium"] and not premium:
            raise PageError(f"کامپوننت «{spec['title']}» مخصوص پلن های حرفه ای است")
        bid = raw.get("id")
        if not isinstance(bid, str) or not _ID.match(bid) or bid in seen:
            bid = new_block_id()
        seen.add(bid)
        props = raw.get("props") if isinstance(raw.get("props"), dict) else {}
        clean = {f["key"]: _clean_field(f, props.get(f["key"], _default_of(f))) for f in spec["fields"]}
        blocks.append({"id": bid, "type": btype, "props": clean})

    if len(blocks) > max_blocks:
        raise PageError(f"پلن فعلی تو حداکثر {max_blocks} کامپوننت دارد")

    return {"v": SCHEMA_VERSION, "theme": clean_theme(doc.get("theme")), "blocks": blocks}


def empty_page(accent: str | None = None) -> dict:
    """صفحه خالی شروع کار. عمدا هیچ کامپوننتی ندارد."""
    theme = clean_theme({"accent": accent} if accent else {})
    return {"v": SCHEMA_VERSION, "theme": theme, "blocks": []}


def public_schema() -> dict:
    """نسخه ای از اسکیما که به ادیتور داده می شود."""
    return {
        "version": SCHEMA_VERSION,
        "blocks": SCHEMA,
        "theme": THEME_FIELDS,
        "swatches": SWATCHES,
    }
