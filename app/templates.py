"""قالب‌های آماده.

فعلاً فقط «شب‌نوشت» (کتابخانهٔ داستان برای کانال‌ها) عرضه می‌شود؛ قالب‌های
قدیمی برداشته شدند ولی مینی‌اپ‌های ساخته‌شده با آن‌ها (kit=base) کار می‌کنند.

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


# متن فصل‌ها با سبک‌های نوشتاری شب‌نوشت (render.js، storyText):
# پاراگراف با «# » میان‌تیتر، «— » گفت‌وگو، «~ » زمزمه، «! » فریاد، «✉ » نامه،
# «> » نقل‌قول، «^ » وسط‌چین و «***» جداکننده؛ داخل متن **پررنگ**، !!خونی!!،
# ~~خط‌خورده~~ و ((کم‌رنگ)).
_CH13 = [
    {"title": "کلید", "note": "", "lock": False, "url": "", "draft": False, "body": (
        "کلید را زیر گلدان خشک‌شدهٔ کنار در گذاشته بودند؛ همان‌جا که بنگاهی گفته بود. سرد بود، سردتر از هوای آبان.\n\n"
        "خانه بوی نم و نفتالین می‌داد. پرده‌ها را کنار زدم و نور کم‌رنگ عصر روی کف چوبی پهن شد. "
        "همه‌چیز عادی بود، جز یک چیز: !!ساعت دیواری هال کار می‌کرد.!! خانه‌ای که **شش سال** خالی مانده بود.\n\n"
        "***\n\n"
        "~ شب اول صدای آب آمد. از آشپزخانه. شیر را بسته بودم؛ مطمئن بودم.")},
    {"title": "صدای قدم‌ها", "note": "", "lock": False, "url": "", "draft": False, "body": (
        "شب دوم صدا از سقف بود. آرام، سنگین، درست هم‌وزن قدم‌های خودم.\n\n"
        "به بنگاهی زنگ زدم. ساعت دو نصفه‌شب بود و او انگار منتظر تلفنم بود.\n\n"
        "— کی بالای سقفه؟\n\n"
        "— هیچ‌کس، آقا. زیر شیروانی را سال‌ها پیش با آجر پر کردیم.\n\n"
        "— پس این صدای چیه؟\n\n"
        "((چند ثانیه چیزی نگفت.)) بعد گوشی را گذاشت.\n\n"
        "قدم‌ها ساعت سه ایستادند؛ درست بالای تختم.")},
    {"title": "زیرزمین", "note": "امروز", "lock": False, "url": "", "draft": False, "body": (
        "پله‌ها زیر پایم ناله می‌کردند؛ انگار هر کدام اسم کسی را که پیش از من پایین رفته بود به خاطر داشتند. "
        "چراغ‌قوه فقط دایرهٔ کوچکی از تاریکی را کنار می‌زد و بقیه‌اش، سنگین و خیس، سر جایش می‌ماند.\n\n"
        "ته زیرزمین، کنار دیگ‌های زنگ‌زده، در کوچکی بود که هیچ‌وقت ندیده بودم. رویش با گچ نوشته بودند:\n\n"
        "✉ سیزده.\nمنتظرت بودیم.\n\n"
        "***\n\n"
        "~ صدای قدم‌ها از بالای سرم آمد.\n\n"
        "! این بار دو نفر بودند.")},
    {"title": "در سیزدهم", "note": "به‌زودی", "lock": True, "url": "", "draft": False, "body": (
        "دستگیره گرم بود؛ گرم مثل دستی که تازه رهایش کرده باشند. در را که باز کردم، "
        "بوی نفتالین برگشت، این بار از پشت سرم.")},
]
_TRAIN = [
    {"title": "ایستگاه متروک", "note": "", "lock": False, "url": "", "draft": False, "body": (
        "# ساعت ۲۳:۴۰\n\n"
        "قطار ساعت ۲۳:۴۰ هیچ‌وقت در برنامه نبود، ولی هر شب می‌آمد.\n\n"
        "> فقط کسانی سوارش می‌شوند که بلیت ندارند.\n\n"
        "این را نگهبان پیر ایستگاه می‌گفت. من بلیت داشتم. توی جیبم بود. ~~تا وقتی که دیگر نبود.~~")},
    {"title": "واگن آخر", "note": "", "lock": False, "url": "", "draft": False, "body": (
        "واگن آخر پر بود از آدم‌هایی که همه یک‌جور نشسته بودند: رو به پنجره، دست‌ها روی زانو.\n\n"
        "^ هیچ‌کدام\nدر شیشه\nتصویر نداشتند.\n\n"
        "! جز من.")},
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
            _b("story", {"title": "خانهٔ شمارهٔ ۱۳", "subtitle": "رمان کوتاه وحشت در سیزده شب", "genre": "وحشت", "status": "ongoing", "tone": "blood",
                         "blurb": "خانه‌ای که شش سال خالی مانده، ولی ساعتش هنوز کار می‌کند.", "chapters": _CH13}),
            _b("story", {"title": "آخرین قطار", "subtitle": "داستان بلند معمایی", "genre": "معمایی", "status": "ongoing", "tone": "night",
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


TEMPLATES: list[dict] = [shab()]
BY_ID = {t["id"]: t for t in TEMPLATES}


def public() -> dict:
    return {"categories": CATEGORIES, "templates": TEMPLATES}
