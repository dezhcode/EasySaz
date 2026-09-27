"""کامپوننت های آماده و اعتبارسنجی صفحه.

صفحه هر مینی اپ یک سند JSON است، نه HTML (نسخهٔ ۲: چندصفحه‌ای):

    {
      "v": 2,
      "theme":  {"accent": "#1D55F0", "mode": "auto", "radius": "soft", "radius_px": 18, "bg": "tint"},
      "header": {"enabled": true, "style": "bar", "title": "...", ...},
      "tabbar": {"enabled": true, "style": "floating"},
      "pages":  [{"id": "home", "title": "خانه", "icon": "home",
                  "blocks": [{"id": "b1a2c3", "type": "hero", "props": {...}, "style": {...}}]}]
    }

سند نسخهٔ ۱ ({"blocks": [...]}) خودکار به یک صفحهٔ «خانه» تبدیل می‌شود.

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

SCHEMA_VERSION = 2

# ---------- تم ----------
THEME_FIELDS: dict[str, dict[str, Any]] = {
    "accent": {"type": "color", "default": "#1D55F0"},
    "mode": {"type": "select", "options": ["auto", "light", "dark"], "default": "auto"},
    "radius": {"type": "select", "options": ["soft", "round", "sharp", "custom"], "default": "soft"},
    "radius_px": {"type": "int", "min": 0, "max": 32, "default": 18},
    "bg": {"type": "select", "options": ["tint", "plain"], "default": "tint"},
}

# رنگ‌های آماده (توکن‌های accent-* سیستم طراحی «کاشی»)
SWATCHES = [
    ["آبی عبور", "#1D55F0"], ["سرمه‌ای", "#0A2572"], ["بنفش", "#6A55E0"], ["فیروزه‌ای", "#0E8FAE"],
    ["سبز", "#12A071"], ["کهربایی", "#E09A1F"], ["مرجانی", "#E0573E"], ["گلی", "#E0457B"],
]

# دسته‌های کامپوننت (رنگ یعنی معنا): write=محتوا، act=اقدام، media=رسانه، shop=فروش، frame=ساختار
CATEGORIES = {
    "write": "محتوا", "act": "اقدام و ارتباط", "media": "رسانه", "shop": "فروش", "frame": "ساختار",
}

SOCIAL_KINDS = [
    "telegram", "instagram", "whatsapp", "youtube", "x", "website", "phone", "email",
]

# ---------- کامپوننت ها ----------
# نوع فیلدها: text, textarea, url, image, select, list
# premium=True یعنی فقط در پلن های پولی قابل افزودن است.
SCHEMA: dict[str, dict[str, Any]] = {
    "hero": {
        "cat": "write",
        "title": "سربرگ",
        "icon": "sparkle",
        "desc": "عنوان بزرگ، توضیح کوتاه و لوگو",
        "premium": False,
        "fields": [
            {"key": "title", "label": "عنوان", "type": "text", "max": 60, "default": "به مینی اپ من خوش اومدی"},
            {"key": "subtitle", "label": "توضیح", "type": "textarea", "max": 200, "default": "اینجا همه چیز رو یک جا پیدا می کنی."},
            {"key": "image", "label": "لوگو (اختیاری)", "type": "image", "default": ""},
            {"key": "cover", "label": "تصویر زمینه", "type": "image", "default": "", "when": {"style": ["cover"]}},
            {"key": "chip", "label": "برچسب کوچک (اختیاری)", "type": "text", "max": 24, "default": ""},
            {"key": "style", "label": "سبک", "type": "select", "default": "solid", "look": True,
             "options": [["solid", "پررنگ"], ["pass", "کارت عبور"], ["cover", "تصویر زمینه"], ["soft", "ملایم"], ["plain", "ساده"]]},
            {"key": "align", "label": "چینش", "type": "select", "default": "center", "look": True,
             "options": [["center", "وسط"], ["start", "راست"]]},
        ],
    },
    "text": {
        "cat": "write",
        "title": "متن",
        "icon": "text",
        "desc": "یک پاراگراف با عنوان",
        "premium": False,
        "fields": [
            {"key": "title", "label": "عنوان (اختیاری)", "type": "text", "max": 80, "default": "درباره ما"},
            {"key": "body", "label": "متن", "type": "textarea", "max": 1500, "default": "چند خط درباره کسب و کارت بنویس."},
            {"key": "align", "label": "چینش", "type": "select", "look": True, "default": "start",
             "options": [["start", "راست"], ["center", "وسط"]]},
        ],
    },
    "button": {
        "cat": "act",
        "title": "دکمه",
        "icon": "button",
        "desc": "یک دکمه که به لینک می رود",
        "premium": False,
        "fields": [
            {"key": "label", "label": "متن دکمه", "type": "text", "max": 40, "default": "شروع کن"},
            {"key": "url", "label": "لینک", "type": "url", "default": "https://t.me/EasySazBot"},
            {"key": "style", "label": "سبک", "type": "select", "look": True, "default": "primary",
             "options": [["primary", "پررنگ"], ["soft", "ملایم"], ["outline", "خطی"]]},
        ],
    },
    "links": {
        "cat": "act",
        "title": "لیست لینک",
        "icon": "links",
        "desc": "چند لینک زیر هم، مثل لینک بیو",
        "premium": False,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "list",
             "options": [["list", "فهرست"], ["tiles", "کاشی"], ["pills", "قرص"]]},
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
        "cat": "media",
        "title": "تصویر",
        "icon": "image",
        "desc": "یک تصویر با زیرنویس",
        "premium": False,
        "fields": [
            {"key": "src", "label": "تصویر", "type": "image", "default": ""},
            {"key": "caption", "label": "زیرنویس", "type": "text", "max": 120, "default": ""},
            {"key": "ratio", "label": "نسبت", "type": "select", "look": True, "default": "16:9",
             "options": [["16:9", "افقی"], ["1:1", "مربع"], ["4:5", "عمودی"], ["auto", "اصلی"]]},
        ],
    },
    "faq": {
        "cat": "write",
        "title": "سوالات متداول",
        "icon": "faq",
        "desc": "سوال و جواب های بازشونده",
        "premium": False,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "list",
             "options": [["list", "فهرست"], ["cards", "کارت‌های جدا"]]},
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
        "cat": "act",
        "title": "شبکه های اجتماعی",
        "icon": "social",
        "desc": "آیکون راه های ارتباطی",
        "premium": False,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "icons",
             "options": [["icons", "آیکن"], ["pills", "با اسم"]]},
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
        "cat": "write",
        "title": "اطلاعیه",
        "icon": "notice",
        "desc": "یک نوار رنگی برای خبر مهم",
        "premium": False,
        "fields": [
            {"key": "text", "label": "متن", "type": "textarea", "max": 240, "default": "۲۰٪ تخفیف ویژه تا آخر هفته"},
            {"key": "tone", "label": "رنگ", "type": "select", "look": True, "default": "accent",
             "options": [["accent", "رنگ اصلی"], ["success", "سبز"], ["warning", "کهربایی"], ["info", "خنثی"]]},
        ],
    },
    "divider": {
        "cat": "frame",
        "title": "جداکننده",
        "icon": "divider",
        "desc": "فاصله یا خط بین بخش ها",
        "premium": False,
        "fields": [
            {"key": "style", "label": "سبک", "type": "select", "look": True, "default": "line",
             "options": [["line", "خط"], ["dots", "نقطه"], ["space", "فقط فاصله"]]},
        ],
    },
    # ----- پریمیوم -----
    "cards": {
        "cat": "shop",
        "title": "کارت محصول",
        "icon": "cards",
        "desc": "محصول یا خدمت با قیمت و دکمه",
        "premium": True,
        "fields": [
            {"key": "title", "label": "عنوان بخش", "type": "text", "max": 60, "default": "محصولات"},
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "grid",
             "options": [["grid", "دوستونه"], ["list", "لیستی"]]},
            {"key": "items", "label": "کارت ها", "type": "list", "max_items": 12, "item_label": "کارت",
             "fields": [
                 {"key": "title", "label": "نام", "type": "text", "max": 50, "default": "محصول"},
                 {"key": "price", "label": "قیمت", "type": "text", "max": 30, "default": ""},
                 {"key": "desc", "label": "توضیح", "type": "textarea", "max": 200, "default": ""},
                 {"key": "image", "label": "تصویر", "type": "image", "default": ""},
                 {"key": "url", "label": "لینک دکمه", "type": "url", "default": ""},
                 {"key": "cta", "label": "متن دکمه", "type": "text", "max": 24, "default": "سفارش"},
             ],
             "default": [
                 {"title": "محصول اول", "price": "۱۹۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
                 {"title": "محصول دوم", "price": "۲۴۰ هزار تومان", "desc": "توضیح کوتاه", "image": "", "url": "", "cta": "سفارش"},
             ]},
        ],
    },
    "pricing": {
        "cat": "shop",
        "title": "پلن‌ها",
        "icon": "pricing",
        "desc": "پلن و اشتراک با قیمت و ویژگی‌ها",
        "premium": True,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "stack",
             "options": [["stack", "زیر هم"], ["scroll", "کشویی"]]},
            {"key": "title", "label": "عنوان بخش", "type": "text", "max": 60, "default": "پلن‌ها"},
            {"key": "items", "label": "پلن‌ها", "type": "list", "max_items": 6, "item_label": "پلن",
             "fields": [
                 {"key": "name", "label": "نام پلن", "type": "text", "max": 30, "default": "پلن ماهانه"},
                 {"key": "price", "label": "قیمت", "type": "text", "max": 30, "default": "۹۹ هزار تومان"},
                 {"key": "period", "label": "دوره", "type": "text", "max": 20, "default": "ماهانه"},
                 {"key": "features", "label": "ویژگی‌ها (هر خط یکی)", "type": "textarea", "max": 300, "default": "ویژگی اول\nویژگی دوم"},
                 {"key": "badge", "label": "برچسب (اختیاری)", "type": "text", "max": 16, "default": ""},
                 {"key": "url", "label": "لینک خرید", "type": "url", "default": ""},
                 {"key": "cta", "label": "متن دکمه", "type": "text", "max": 20, "default": "خرید"},
             ],
             "default": [
                 {"name": "پایه", "price": "۹۹ هزار تومان", "period": "ماهانه", "features": "ویژگی اول\nویژگی دوم", "badge": "", "url": "", "cta": "خرید"},
                 {"name": "ویژه", "price": "۲۴۹ هزار تومان", "period": "ماهانه", "features": "همهٔ ویژگی‌های پایه\nپشتیبانی سریع", "badge": "پیشنهادی", "url": "", "cta": "خرید"},
             ]},
        ],
    },
    "gallery": {
        "cat": "media",
        "title": "گالری",
        "icon": "gallery",
        "desc": "اسلایدر افقی تصاویر",
        "premium": True,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "slider",
             "options": [["slider", "اسلایدر"], ["grid", "شبکه"]]},
            {"key": "items", "label": "تصاویر", "type": "list", "max_items": 12, "item_label": "تصویر",
             "fields": [
                 {"key": "src", "label": "تصویر", "type": "image", "default": ""},
                 {"key": "caption", "label": "زیرنویس", "type": "text", "max": 80, "default": ""},
             ],
             "default": [{"src": "", "caption": ""}, {"src": "", "caption": ""}]},
        ],
    },
    "features": {
        "cat": "shop",
        "title": "ویژگی ها",
        "icon": "features",
        "desc": "شبکه ای از مزیت ها با ایموجی",
        "premium": True,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "grid",
             "options": [["grid", "دوستونه"], ["list", "لیستی"]]},
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
    },    # ---------- کامپوننت‌های کاربردی به سبک عبور ----------
    "passcard": {
        "cat": "shop",
        "title": "کارت عبور",
        "icon": "ticket",
        "desc": "کارت اشتراک، عضویت یا پیشنهاد ویژه با نوار پیشرفت",
        "premium": True,
        "fields": [
            {"key": "tone", "label": "رنگ کارت", "type": "select", "look": True, "default": "deep",
             "options": [["deep", "عمیق"], ["accent", "رنگی"], ["light", "روشن"]]},
            {"key": "title", "label": "عنوان کارت", "type": "text", "max": 40, "default": "پلن طلایی"},
            {"key": "status", "label": "برچسب وضعیت", "type": "text", "max": 24, "default": "پرفروش"},
            {"key": "value", "label": "عدد بزرگ", "type": "text", "max": 12, "default": "100"},
            {"key": "unit", "label": "واحد کنار عدد", "type": "text", "max": 24, "default": "گیگ · ۹۰ روز"},
            {"key": "progress", "label": "نوار پیشرفت (۰ تا ۱۰۰، صفر یعنی بدون نوار)", "type": "int", "min": 0, "max": 100, "default": 0},
            {"key": "meta", "label": "متن پایین کارت", "type": "text", "max": 60, "default": "۳۹۰ هزار تومان"},
            {"key": "cta", "label": "متن دکمه", "type": "text", "max": 20, "default": "خرید"},
            {"key": "url", "label": "لینک دکمه", "type": "url", "default": ""},
        ],
    },
    "calc": {
        "cat": "shop",
        "title": "ماشین‌حساب قیمت",
        "icon": "sliders",
        "desc": "مقدار را با اسلایدر انتخاب کنند و قیمت را زنده ببینند",
        "premium": True,
        "fields": [
            {"key": "tone", "label": "رنگ کارت", "type": "select", "look": True, "default": "deep",
             "options": [["deep", "عمیق"], ["light", "روشن"]]},
            {"key": "title", "label": "عنوان", "type": "text", "max": 40, "default": "سرویس دلخواه"},
            {"key": "label", "label": "اسم مقدار", "type": "text", "max": 24, "default": "حجم"},
            {"key": "unit", "label": "واحد", "type": "text", "max": 12, "default": "گیگ"},
            {"key": "min", "label": "کمترین", "type": "int", "min": 1, "max": 100000, "default": 5},
            {"key": "max", "label": "بیشترین", "type": "int", "min": 1, "max": 100000, "default": 100},
            {"key": "step", "label": "گام", "type": "int", "min": 1, "max": 10000, "default": 5},
            {"key": "start", "label": "مقدار اول", "type": "int", "min": 1, "max": 100000, "default": 20},
            {"key": "rate", "label": "قیمت هر واحد", "type": "int", "min": 0, "max": 100000000, "default": 3500},
            {"key": "currency", "label": "واحد پول", "type": "text", "max": 12, "default": "تومان"},
            {"key": "options_label", "label": "اسم گزینه‌ها (مثلاً مدت)", "type": "text", "max": 20, "default": "مدت"},
            {"key": "options", "label": "گزینه‌ها و درصد قیمت", "type": "list", "max_items": 6, "item_label": "گزینه",
             "fields": [
                 {"key": "label", "label": "اسم", "type": "text", "max": 20, "default": "۱ ماه"},
                 {"key": "percent", "label": "درصد قیمت (۱۰۰ یعنی بدون تغییر)", "type": "int", "min": 1, "max": 1000, "default": 100},
             ],
             "default": [
                 {"label": "۱ ماه", "percent": 100},
                 {"label": "۳ ماه", "percent": 115},
                 {"label": "۶ ماه", "percent": 125},
             ]},
            {"key": "cta", "label": "متن دکمه", "type": "text", "max": 20, "default": "خرید"},
            {"key": "url", "label": "لینک دکمه", "type": "url", "default": ""},
        ],
    },
    "steps": {
        "cat": "write",
        "title": "راهنمای قدم‌به‌قدم",
        "icon": "steps",
        "desc": "آموزش مرحله‌ای، با تب جدا برای هر دستگاه",
        "premium": False,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "timeline",
             "options": [["timeline", "خط زمان"], ["cards", "کارت‌ها"]]},
            {"key": "title", "label": "عنوان", "type": "text", "max": 60, "default": "راهنمای شروع"},
            {"key": "items", "label": "تب‌ها", "type": "list", "max_items": 6, "item_label": "تب",
             "fields": [
                 {"key": "label", "label": "اسم تب", "type": "text", "max": 20, "default": "اندروید"},
                 {"key": "steps", "label": "قدم‌ها (هر خط یک قدم؛ «عنوان | توضیح»)", "type": "textarea", "max": 900,
                  "default": "برنامه را نصب کن | از فروشگاه برنامه‌ها\nوارد حسابت شو | با شمارهٔ تلفن\nتمام! | حالا آماده‌ای"},
                 {"key": "app", "label": "اسم برنامه (اختیاری)", "type": "text", "max": 30, "default": ""},
                 {"key": "url", "label": "لینک دانلود (اختیاری)", "type": "url", "default": ""},
             ],
             "default": [
                 {"label": "اندروید", "steps": "برنامه را نصب کن | از گوگل‌پلی یا لینک زیر\nربات را باز کن | دکمهٔ «شروع» را بزن\nتمام! | از منوی ربات همه‌چیز در دسترس است", "app": "", "url": ""},
                 {"label": "آیفون", "steps": "برنامه را نصب کن | از اپ‌استور\nربات را باز کن | دکمهٔ «شروع» را بزن\nتمام! | از منوی ربات همه‌چیز در دسترس است", "app": "", "url": ""},
             ]},
            {"key": "note", "label": "نکتهٔ هشدار (اختیاری)", "type": "text", "max": 160, "default": ""},
        ],
    },
    "apps": {
        "cat": "act",
        "title": "برنامه‌ها",
        "icon": "download",
        "desc": "دکمه‌های دانلود برنامه برای هر دستگاه",
        "premium": False,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "chips",
             "options": [["chips", "دکمه‌ها"], ["rows", "ردیف‌ها"]]},
            {"key": "title", "label": "عنوان", "type": "text", "max": 60, "default": "دانلود برنامه"},
            {"key": "items", "label": "برنامه‌ها", "type": "list", "max_items": 8, "item_label": "برنامه",
             "fields": [
                 {"key": "name", "label": "اسم برنامه", "type": "text", "max": 30, "default": "برنامه"},
                 {"key": "platform", "label": "دستگاه", "type": "select", "default": "android",
                  "options": [["android", "اندروید"], ["ios", "آیفون"], ["windows", "ویندوز"], ["mac", "مک"], ["linux", "لینوکس"], ["web", "وب"]]},
                 {"key": "note", "label": "توضیح کوتاه", "type": "text", "max": 30, "default": ""},
                 {"key": "url", "label": "لینک دانلود", "type": "url", "default": ""},
                 {"key": "best", "label": "پیشنهادی", "type": "bool", "default": False},
             ],
             "default": [
                 {"name": "اندروید", "platform": "android", "note": "", "url": "", "best": True},
                 {"name": "آیفون", "platform": "ios", "note": "", "url": "", "best": False},
                 {"name": "ویندوز", "platform": "windows", "note": "", "url": "", "best": False},
             ]},
        ],
    },
    "stats": {
        "cat": "write",
        "title": "آمار",
        "icon": "chart",
        "desc": "چند عدد مهم کنار هم",
        "premium": False,
        "fields": [
            {"key": "layout", "label": "چیدمان", "type": "select", "look": True, "default": "strip",
             "options": [["strip", "نوار"], ["tiles", "کاشی"]]},
            {"key": "items", "label": "عددها", "type": "list", "max_items": 4, "item_label": "عدد",
             "fields": [
                 {"key": "value", "label": "عدد", "type": "text", "max": 12, "default": "۹۹٪"},
                 {"key": "label", "label": "برچسب", "type": "text", "max": 24, "default": "رضایت"},
             ],
             "default": [
                 {"value": "+12,000", "label": "کاربر راضی"},
                 {"value": "99%", "label": "پایداری"},
                 {"value": "24/7", "label": "پشتیبانی"},
             ]},
        ],
    },
}

_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f‪-‮⁦-⁩]")
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
_ID = re.compile(r"^[a-z0-9_-]{3,24}$")
_TG_USER = re.compile(r"^@?[A-Za-z][A-Za-z0-9_]{3,31}$")


# ترتیب کاتالوگ «افزودن کامپوننت»: دسته به دسته
CATALOG_ORDER = [
    "hero", "text", "notice", "faq", "steps", "stats",
    "button", "links", "social", "apps",
    "image", "gallery",
    "cards", "pricing", "features", "passcard", "calc",
    "divider",
]

# مقدارهای قدیمی که هنوز در صفحه‌های ذخیره‌شده هستند
_LEGACY = {("hero", "style", "gradient"): "solid"}


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


def _upload_prefix() -> str:
    from .config import config

    return (config.base_url + "/u/") if config.base_url else ""


def clean_url(value: Any, *, images: bool = False) -> str:
    """فقط لینک https (و http برای لینک عادی). بقیه پاک می شود.

    javascript: و data: و هر اسکیم دیگری رد می شود. لینک خالی یا فقط
    https:// هم خالی حساب می شود تا دکمه بی لینک ساخته نشود.
    """
    url = _clean_text(value, 500)
    if not url:
        return ""
    if images and _upload_prefix() and url.startswith(_upload_prefix()) and re.match(r"^[a-f0-9]{24}\.(jpg|png|webp)$", url[len(_upload_prefix()):]):
        return url  # تصویر آپلودشده روی سرور خودمان
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


# ---------- استایل هر کامپوننت (شخصی‌سازی) ----------
# همهٔ کامپوننت‌ها این تنظیم‌ها را دارند، ولی هر نوع فقط آن‌هایی را که برایش
# معنی دارد نشان می‌دهد (STYLE_SUPPORT). مقدار خالی یعنی «از ظاهر کل صفحه».
STYLE_FIELDS: list[dict[str, Any]] = [
    {"key": "box", "label": "قاب", "type": "select", "default": "auto",
     "options": [["auto", "پیش‌فرض"], ["card", "کارت"], ["outline", "خطی"], ["soft", "ملایم"], ["solid", "توپر"], ["plain", "بی‌قاب"]]},
    {"key": "radius", "label": "گوشه‌ها", "type": "int", "min": 0, "max": 40, "default": None, "unit": "px"},
    {"key": "pad", "label": "فاصلهٔ داخلی", "type": "select", "default": "md",
     "options": [["sm", "کم"], ["md", "معمولی"], ["lg", "زیاد"]]},
    {"key": "accent", "label": "رنگ اختصاصی", "type": "color", "default": ""},
]
STYLE_SUPPORT: dict[str, list[str]] = {
    "hero": ["radius", "pad", "accent"],
    "text": ["box", "radius", "pad", "accent"],
    "button": ["radius", "accent"],
    "links": ["box", "radius", "accent"],
    "image": ["radius"],
    "faq": ["box", "radius", "pad", "accent"],
    "social": ["box", "accent"],
    "notice": ["box", "radius", "pad", "accent"],
    "divider": [],
    "cards": ["box", "radius", "accent"],
    "pricing": ["box", "radius", "accent"],
    "gallery": ["radius"],
    "features": ["box", "radius", "accent"],
    "passcard": ["radius", "accent"],
    "calc": ["radius", "accent"],
    "steps": ["box", "radius", "accent"],
    "apps": ["box", "accent"],
    "stats": ["box", "radius", "accent"],
}

# ---------- سبک‌های آماده ----------
# هر سبک ترکیب ازپیش‌طراحی‌شده‌ای از فیلدهای ظاهری (look) و ظاهر کامپوننت
# (style) است. انتخاب سبک، همین‌ها را روی کامپوننت می‌نشاند؛ محتوا و رنگ
# اختصاصی دست نمی‌خورد. چیزی ذخیره نمی‌شود جز همان props و style، پس سبک
# فعال در ادیتور از روی تطابق پیدا می‌شود. test_smoke همه را با clean_page
# می‌سنجد.
def _v(vid: str, title: str, props: dict | None = None, style: dict | None = None) -> dict:
    return {"id": vid, "title": title, "props": props or {}, "style": style or {}}


VARIANTS: dict[str, list[dict]] = {
    "hero": [
        _v("solid", "پررنگ", {"style": "solid", "align": "center"}),
        _v("pass", "کارت عبور", {"style": "pass", "align": "start"}),
        _v("cover", "تصویر زمینه", {"style": "cover", "align": "center"}),
        _v("soft", "ملایم", {"style": "soft", "align": "center"}),
        _v("plain", "مینیمال", {"style": "plain", "align": "start"}),
    ],
    "text": [
        _v("card", "کارت", {"align": "start"}),
        _v("soft", "ملایم", {"align": "start"}, {"box": "soft"}),
        _v("outline", "خطی", {"align": "start"}, {"box": "outline"}),
        _v("spot", "برجسته", {"align": "center"}, {"box": "solid", "pad": "lg"}),
        _v("plain", "بی‌قاب", {"align": "start"}, {"box": "plain", "pad": "sm"}),
    ],
    "button": [
        _v("primary", "پررنگ", {"style": "primary"}),
        _v("pill", "قرصی", {"style": "primary"}, {"radius": 40}),
        _v("soft", "ملایم", {"style": "soft"}),
        _v("outline", "خطی", {"style": "outline"}),
    ],
    "links": [
        _v("list", "فهرست", {"layout": "list"}),
        _v("tiles", "کاشی", {"layout": "tiles"}),
        _v("pills", "قرص", {"layout": "pills"}),
        _v("soft", "ملایم", {"layout": "list"}, {"box": "soft"}),
        _v("solid", "توپر", {"layout": "list"}, {"box": "solid"}),
    ],
    "image": [
        _v("wide", "افقی", {"ratio": "16:9"}),
        _v("square", "مربع", {"ratio": "1:1"}),
        _v("portrait", "عمودی", {"ratio": "4:5"}),
        _v("round", "گوشه‌گرد", {"ratio": "4:5"}, {"radius": 36}),
        _v("sharp", "بی‌گوشه", {"ratio": "16:9"}, {"radius": 0}),
    ],
    "faq": [
        _v("list", "فهرست", {"layout": "list"}),
        _v("cards", "کارت‌های جدا", {"layout": "cards"}),
        _v("soft", "ملایم", {"layout": "list"}, {"box": "soft"}),
        _v("plain", "بی‌قاب", {"layout": "list"}, {"box": "plain"}),
    ],
    "social": [
        _v("icons", "آیکن", {"layout": "icons"}),
        _v("pills", "با اسم", {"layout": "pills"}),
        _v("soft", "ملایم", {"layout": "icons"}, {"box": "soft"}),
        _v("solid", "توپر", {"layout": "icons"}, {"box": "solid"}),
    ],
    "notice": [
        _v("accent", "رنگی", {"tone": "accent"}),
        _v("solid", "توپر", {"tone": "accent"}, {"box": "solid"}),
        _v("outline", "خطی", {"tone": "accent"}, {"box": "outline"}),
        _v("success", "سبز", {"tone": "success"}),
        _v("warning", "کهربایی", {"tone": "warning"}),
        _v("info", "خنثی", {"tone": "info"}),
    ],
    "divider": [
        _v("line", "خط", {"style": "line"}),
        _v("dots", "نقطه", {"style": "dots"}),
        _v("space", "فاصله", {"style": "space"}),
    ],
    "cards": [
        _v("grid", "دوستونه", {"layout": "grid"}),
        _v("list", "لیستی", {"layout": "list"}),
        _v("soft", "ملایم", {"layout": "grid"}, {"box": "soft"}),
        _v("outline", "خطی", {"layout": "list"}, {"box": "outline"}),
    ],
    "pricing": [
        _v("stack", "زیر هم", {"layout": "stack"}),
        _v("scroll", "کشویی", {"layout": "scroll"}),
        _v("soft", "ملایم", {"layout": "stack"}, {"box": "soft"}),
        _v("outline", "خطی", {"layout": "stack"}, {"box": "outline"}),
    ],
    "gallery": [
        _v("slider", "اسلایدر", {"layout": "slider"}),
        _v("grid", "شبکه", {"layout": "grid"}),
        _v("round", "گوشه‌گرد", {"layout": "slider"}, {"radius": 32}),
    ],
    "passcard": [
        _v("deep", "کارت عبور", {"tone": "deep"}),
        _v("accent", "رنگی", {"tone": "accent"}),
        _v("light", "روشن", {"tone": "light"}),
    ],
    "calc": [
        _v("deep", "کارت عبور", {"tone": "deep"}),
        _v("light", "روشن", {"tone": "light"}),
    ],
    "steps": [
        _v("timeline", "خط زمان", {"layout": "timeline"}),
        _v("cards", "کارت‌ها", {"layout": "cards"}),
        _v("soft", "ملایم", {"layout": "timeline"}, {"box": "soft"}),
    ],
    "apps": [
        _v("chips", "دکمه‌ها", {"layout": "chips"}),
        _v("rows", "ردیف‌ها", {"layout": "rows"}),
        _v("soft", "ملایم", {"layout": "rows"}, {"box": "soft"}),
    ],
    "stats": [
        _v("strip", "نوار", {"layout": "strip"}),
        _v("tiles", "کاشی", {"layout": "tiles"}),
        _v("solid", "توپر", {"layout": "strip"}, {"box": "solid"}),
    ],
    "features": [
        _v("grid", "دوستونه", {"layout": "grid"}),
        _v("list", "لیستی", {"layout": "list"}),
        _v("soft", "ملایم", {"layout": "grid"}, {"box": "soft"}),
        _v("solid", "توپر", {"layout": "list"}, {"box": "solid"}),
    ],
}


# ---------- سربرگ، نوار پایین و صفحه‌ها ----------
HEADER_FIELDS: list[dict[str, Any]] = [
    {"key": "enabled", "label": "نمایش سربرگ", "type": "bool", "default": False},
    {"key": "style", "label": "سبک", "type": "select", "default": "bar",
     "options": [["bar", "نوار"], ["solid", "توپر"], ["plain", "ساده"]]},
    {"key": "title", "label": "عنوان", "type": "text", "max": 40, "default": ""},
    {"key": "subtitle", "label": "زیرعنوان", "type": "text", "max": 60, "default": ""},
    {"key": "logo", "label": "لوگو", "type": "image", "default": ""},
    {"key": "align", "label": "چینش", "type": "select", "default": "start",
     "options": [["start", "راست"], ["center", "وسط"]]},
]
TABBAR_FIELDS: list[dict[str, Any]] = [
    {"key": "enabled", "label": "نمایش نوار پایین", "type": "bool", "default": True},
    {"key": "style", "label": "سبک", "type": "select", "default": "floating",
     "options": [["floating", "شناور"], ["docked", "چسبیده"], ["minimal", "فقط آیکن"]]},
]
PAGE_ICONS = [
    ["home", "خانه"], ["menu", "منو"], ["shop", "فروشگاه"], ["star", "ویژه"],
    ["image", "گالری"], ["info", "درباره"], ["chat", "تماس"], ["user", "حساب"],
]
_PAGE_ICON_KEYS = [k for k, _ in PAGE_ICONS]
_PAGE_ID = re.compile(r"^[a-z0-9_-]{2,24}$")


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
    if ftype == "bool":
        return value if isinstance(value, bool) else field.get("default", False)
    if ftype == "int":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return field.get("default")
        return max(field.get("min", 0), min(field.get("max", 100), int(value)))
    if ftype == "color":
        return value if isinstance(value, str) and _HEX.match(value) else field.get("default", "")
    if ftype == "list":
        if not isinstance(value, list):
            return []
        out = []
        for item in value[: field.get("max_items", 10)]:
            if isinstance(item, dict):
                out.append({f["key"]: _clean_field(f, item.get(f["key"])) for f in field["fields"]})
        return out
    return None


def _clean_group(fields: list[dict], raw: Any) -> dict:
    raw = raw if isinstance(raw, dict) else {}
    return {f["key"]: _clean_field(f, raw.get(f["key"], _default_of(f))) for f in fields}


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
        elif spec["type"] == "int":
            out[key] = _clean_field(spec, val)
        else:
            out[key] = val if val in spec["options"] else spec["default"]
    return out


def clean_style(btype: str, raw: Any) -> dict:
    """فقط تنظیم‌هایی که این نوع پشتیبانی می‌کند و با مقدار غیرپیش‌فرض ذخیره می‌شوند."""
    raw = raw if isinstance(raw, dict) else {}
    allowed = STYLE_SUPPORT.get(btype, [])
    out = {}
    for f in STYLE_FIELDS:
        if f["key"] in allowed and f["key"] in raw:
            val = _clean_field(f, raw[f["key"]])
            if val not in (None, "", f["default"]):
                out[f["key"]] = val
    return out


class PageError(ValueError):
    """سند صفحه با محدودیت پلن نمی خواند. متن خطا فارسی و قابل نمایش است."""


def _clean_blocks(raw_blocks: Any, premium: bool, seen: set[str]) -> list[dict]:
    blocks = []
    for raw in raw_blocks if isinstance(raw_blocks, list) else []:
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
        props = dict(raw.get("props")) if isinstance(raw.get("props"), dict) else {}
        for (lt, lk, lv), new in _LEGACY.items():
            if btype == lt and props.get(lk) == lv:
                props[lk] = new
        clean = {f["key"]: _clean_field(f, props.get(f["key"], _default_of(f))) for f in spec["fields"]}
        block = {"id": bid, "type": btype, "props": clean}
        style = clean_style(btype, raw.get("style"))
        if style:
            block["style"] = style
        blocks.append(block)
    return blocks


def clean_page(doc: Any, *, max_blocks: int, premium: bool, max_pages: int = 1) -> dict:
    """پاکسازی کامل سند.

    کلیدها و نوع های ناشناخته بی صدا حذف می شوند (ممکن است از نسخه جدیدتر
    ادیتور آمده باشند). ولی عبور از سقف پلن خطای صریح می دهد، چون کاربر
    باید بداند چرا چیزی ذخیره نشد. سقف کامپوننت برای کل مینی‌اپ است.
    """
    doc = doc if isinstance(doc, dict) else {}
    raw_pages = doc.get("pages")
    if not isinstance(raw_pages, list):
        # سند نسخهٔ ۱: یک صفحه
        raw_pages = [{"id": "home", "title": "خانه", "icon": "home", "blocks": doc.get("blocks")}]
    if not raw_pages:
        raw_pages = [{"id": "home", "title": "خانه", "icon": "home", "blocks": []}]
    if len(raw_pages) > max_pages:
        raise PageError(f"پلن فعلی تو حداکثر {max_pages} صفحه دارد")

    seen_blocks: set[str] = set()
    seen_pages: set[str] = set()
    pages = []
    for i, raw in enumerate(raw_pages):
        raw = raw if isinstance(raw, dict) else {}
        pid = raw.get("id")
        if not isinstance(pid, str) or not _PAGE_ID.match(pid) or pid in seen_pages:
            pid = "p" + secrets.token_hex(3)
        seen_pages.add(pid)
        title = _clean_text(raw.get("title"), 24) or ("خانه" if i == 0 else f"صفحهٔ {i + 1}")
        icon = raw.get("icon") if raw.get("icon") in _PAGE_ICON_KEYS else ("home" if i == 0 else "star")
        pages.append({"id": pid, "title": title, "icon": icon,
                      "blocks": _clean_blocks(raw.get("blocks"), premium, seen_blocks)})

    total = sum(len(p["blocks"]) for p in pages)
    if total > max_blocks:
        raise PageError(f"پلن فعلی تو حداکثر {max_blocks} کامپوننت دارد")

    theme = doc.get("theme") if isinstance(doc.get("theme"), dict) else {}
    return {
        "v": SCHEMA_VERSION,
        "theme": clean_theme(theme),
        "header": _clean_group(HEADER_FIELDS, doc.get("header")),
        "tabbar": _clean_group(TABBAR_FIELDS, doc.get("tabbar")),
        "pages": pages,
    }


def upgrade(doc: Any) -> dict:
    """سند ذخیره‌شدهٔ قدیمی (نسخهٔ ۱) را بدون سخت‌گیری پلن به شکل نسخهٔ ۲ درمی‌آورد."""
    doc = doc if isinstance(doc, dict) else {}
    if isinstance(doc.get("pages"), list):
        return doc
    out = empty_page()
    out["theme"] = clean_theme(doc.get("theme"))
    out["pages"][0]["blocks"] = doc.get("blocks") if isinstance(doc.get("blocks"), list) else []
    return out


def all_blocks(doc: dict) -> list[dict]:
    """همهٔ کامپوننت‌های همهٔ صفحه‌ها (برای شمارش و فیلتر پلن)."""
    return [b for p in doc.get("pages", []) for b in p.get("blocks", [])]


def empty_page(accent: str | None = None) -> dict:
    """صفحه خالی شروع کار. عمدا هیچ کامپوننتی ندارد."""
    theme = clean_theme({"accent": accent} if accent else {})
    return {
        "v": SCHEMA_VERSION,
        "theme": theme,
        "header": _clean_group(HEADER_FIELDS, {}),
        "tabbar": _clean_group(TABBAR_FIELDS, {}),
        "pages": [{"id": "home", "title": "خانه", "icon": "home", "blocks": []}],
    }


def public_schema() -> dict:
    """نسخه ای از اسکیما که به ادیتور داده می شود."""
    blocks = {k: dict(v, style=STYLE_SUPPORT.get(k, [])) for k, v in SCHEMA.items()}
    return {
        "version": SCHEMA_VERSION,
        "blocks": blocks,
        "order": CATALOG_ORDER,
        "categories": CATEGORIES,
        "theme": THEME_FIELDS,
        "style": STYLE_FIELDS,
        "header": HEADER_FIELDS,
        "tabbar": TABBAR_FIELDS,
        "page_icons": PAGE_ICONS,
        "swatches": SWATCHES,
        "variants": VARIANTS,
    }
