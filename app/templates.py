"""قالب‌های آماده.

فعلاً فقط «قسمت» (کتابخانهٔ داستان برای کانال‌ها) عرضه می‌شود؛ قالب‌های
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


def _sample(name: str) -> str:
    """تصویر نمونهٔ همراه قالب (app/webapp/static/samples)؛ بدون BASE_URL خالی می‌ماند."""
    return blocks.sample_prefix() + name if blocks.sample_prefix() else ""


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


# قالب «قسمت» (کیت shab): هر قسمت فهرستی از خط‌هاست (kits/shab.line):
#   متن ساده = راوی · «@<شناسهٔ شخصیت>: متن» = حباب گفت‌وگو · «!img(<نشانی>) زیرنویس» = تصویر
# شناسهٔ شخصیت‌ها همان «cast» داستان است.
_ME1, _AGENT, _ME2, _GUARD = "cmen001", "cbongah", "cmen002", "cguard1"


def _chat(*lines: str) -> str:
    return "\n\n".join(lines)


_CH13 = [
    {"title": "کلید", "note": "", "lock": False, "url": "", "draft": False, "body": _chat(
        "کلید را زیر گلدان خشک‌شدهٔ کنار در گذاشته بودند؛ همان‌جا که بنگاهی گفته بود. سرد بود، سردتر از هوای آبان.",
        "خانه بوی نم و نفتالین می‌داد. همه‌چیز عادی بود، جز یک چیز: **ساعت دیواری هال کار می‌کرد.** خانه‌ای که شش سال خالی مانده بود.",
        f"@{_ME1}: کلید را پیدا کردم. ولی ساعت هال چرا کار می‌کند؟",
        f"@{_AGENT}: کدام ساعت؟ آن خانه ساعت ندارد، آقا.",
        "شب اول صدای آب آمد. از آشپزخانه. شیر را بسته بودم؛ مطمئن بودم.")},
    {"title": "صدای قدم‌ها", "note": "", "lock": False, "url": "", "draft": False, "body": _chat(
        "شب دوم صدا از سقف بود. آرام، سنگین، درست هم‌وزن قدم‌های خودم. ساعت دو نصفه‌شب به بنگاهی زنگ زدم.",
        f"@{_ME1}: الو؟ آقای بنگاهی؟",
        f"@{_AGENT}: بله… انگار منتظر زنگتان بودم.",
        f"@{_ME1}: کی بالای سقفه؟",
        f"@{_AGENT}: هیچ‌کس، آقا. زیر شیروانی را سال‌ها پیش با آجر پر کردیم.",
        f"@{_ME1}: پس این صدای چیه؟",
        "چند ثانیه چیزی نگفت. بعد گوشی را گذاشت. قدم‌ها ساعت سه ایستادند؛ درست بالای تختم.")},
    {"title": "زیرزمین", "note": "امروز", "lock": False, "url": "", "draft": False, "body": _chat(
        "پله‌ها زیر پایم ناله می‌کردند؛ انگار هر کدام اسم کسی را که پیش از من پایین رفته بود به خاطر داشتند.",
        f"@{_AGENT}: !img({{sample:ghosts.jpg}}) این عکس را از بایگانی پیدا کردم. همان خانه است، چهل سال پیش.",
        f"@{_ME1}: پشت پنجره… کسی ایستاده؟",
        f"@{_AGENT}: شما هم می‌بینیدش؟",
        "ته زیرزمین، کنار دیگ‌های زنگ‌زده، در کوچکی بود که هیچ‌وقت ندیده بودم. رویش با گچ نوشته بودند: «سیزده. منتظرت بودیم.»")},
    {"title": "در سیزدهم", "note": "به‌زودی", "lock": True, "url": "", "draft": False, "body": _chat(
        "دستگیره گرم بود؛ گرم مثل دستی که تازه رهایش کرده باشند.",
        f"@{_ME1}: کسی آن‌جاست؟",
        "در را که باز کردم، بوی نفتالین برگشت، این بار از پشت سرم.")},
]
_TRAIN = [
    {"title": "ایستگاه متروک", "note": "", "lock": False, "url": "", "draft": False, "body": _chat(
        "قطار ساعت ۲۳:۴۰ هیچ‌وقت در برنامه نبود، ولی هر شب می‌آمد.",
        f"@{_GUARD}: فقط کسانی سوارش می‌شوند که بلیت ندارند.",
        f"@{_ME2}: من بلیت دارم. توی جیبم است.",
        f"@{_GUARD}: مطمئنی؟",
        "دستم را توی جیبم بردم. خالی بود.")},
    {"title": "واگن آخر", "note": "", "lock": False, "url": "", "draft": False, "body": _chat(
        "واگن آخر پر بود از آدم‌هایی که همه یک‌جور نشسته بودند: رو به پنجره، دست‌ها روی زانو.",
        f"@{_ME2}: ببخشید، این قطار کجا می‌رود؟",
        f"@{_GUARD}: جایی که بلیتت را گم کردی.",
        f"@{_ME2}: من چیزی گم نکرده‌ام.",
        f"@{_GUARD}: پس چرا تصویرت در شیشه نیست؟")},
]


def _fill_samples(chapters: list[dict]) -> list[dict]:
    for ch in chapters:
        ch["body"] = ch["body"].replace("{sample:ghosts.jpg}", _sample("ghosts.jpg") or "")
    return chapters


def shab() -> dict:
    """قالب «قسمت»: داستان قسمت‌به‌قسمت؛ هر قسمت روایت است، گفت‌وگو یا هر دو (کیت shab)."""
    return _tpl("shab", "قسمت", "داستان قسمت‌به‌قسمت مثل پست کانال؛ روایت، گفت‌وگو یا هر دو", "story", "#D0452B", [
        _page("home", "قسمت‌ها", "list", [
            _b("shab_latest", {"title": "قسمت‌های تازه", "count": 6}),
        ]),
        _page("stories", "داستان‌ها", "book", [
            _b("story", {"title": "خانهٔ شمارهٔ ۱۳", "subtitle": "رمان کوتاه وحشت در سیزده شب", "genre": "وحشت", "status": "ongoing", "tone": "blood",
                         "blurb": "خانه‌ای که شش سال خالی مانده، ولی ساعتش هنوز کار می‌کند.", "cover": _sample("ghosts.jpg"),
                         "cast": [{"id": _ME1, "name": "من", "avatar": "", "side": "me", "color": ""},
                                  {"id": _AGENT, "name": "بنگاهی", "avatar": "", "side": "them", "color": "#9A5B00"}],
                         "avatars": True, "chat_theme": "light", "read_mode": "scroll",
                         "chapters": _fill_samples([dict(c) for c in _CH13])}),
            _b("story", {"title": "آخرین قطار", "subtitle": "داستان پیامکی معمایی", "genre": "معمایی", "status": "ongoing", "tone": "night",
                         "blurb": "قطاری که در هیچ برنامه‌ای نیست و هر شب می‌آید.", "cover": _sample("dream.jpg"),
                         "cast": [{"id": _ME2, "name": "من", "avatar": "", "side": "me", "color": ""},
                                  {"id": _GUARD, "name": "نگهبان", "avatar": "", "side": "them", "color": "#2C6E8F"}],
                         "avatars": True, "chat_theme": "dark", "read_mode": "notif",
                         "chapters": [dict(c) for c in _TRAIN]}),
        ]),
    ], header={"enabled": True, "title": "{name}", "subtitle": "داستان قسمت‌به‌قسمت · هر شب یک قسمت"},
       theme={"mode": "light"}, tabbar={"style": "floating"}, kit="shab")


TEMPLATES: list[dict] = [shab()]
BY_ID = {t["id"]: t for t in TEMPLATES}

# ── فروشگاه قالب ──
# ایزی‌ساز مادر قالب‌هاست: هر قالب یک «کار کامل» برای یک حوزه است (پوسته،
# کامپوننت‌ها و در صورت نیاز بخش سرور در app/kits). فروشگاه پنل از همین
# فهرست ساخته می‌شود؛ «ready» یعنی قالب ساخته شده و قابل نصب است (template
# به یکی از TEMPLATES اشاره می‌کند)، «soon» فقط در فروشگاه دیده می‌شود.
# color رنگ امضای قالب در پنل است و tint زمینهٔ روشن همان رنگ.
DOMAINS = [
    {"id": "story", "title": "داستان"},
    {"id": "shop", "title": "فروشگاه"},
    {"id": "booking", "title": "نوبت"},
    {"id": "food", "title": "کافه"},
    {"id": "edu", "title": "آموزش"},
    {"id": "personal", "title": "شخصی"},
    {"id": "event", "title": "رویداد"},
    {"id": "form", "title": "فرم"},
]

STORE: list[dict] = [
    {"id": "shab", "title": "قسمت", "domain": "story", "status": "ready", "template": "shab",
     "tagline": "داستان قسمت‌به‌قسمت؛ روایت، گفت‌وگو یا هر دو",
     "desc": "هر قسمت مثل یک پست کانال می‌رسد. راوی متن داستان را می‌نویسد و شخصیت‌ها با حباب گفت‌وگو حرف می‌زنند، "
             "با عکس پروفایل و تصویر داخل حباب. خواننده با اسکرول، با لمس یا مثل اعلان گوشی می‌خواند.",
     "color": "#B8391F", "tint": "#FBE6DF", "icon": "chat",
     "components": ["قسمت‌های تازه", "داستان", "شخصیت‌ها", "حباب گفت‌وگو", "تصویر در حباب", "خبرم کن"],
     "features": [["chat", "روایت و گفت‌وگو در یک قسمت", "راوی متن می‌نویسد، شخصیت‌ها حباب؛ هر خط یک گوینده"],
                  ["image", "تصویر و عکس پروفایل", "تصویر تنها یا داخل حباب، مثل تلگرام؛ عکس شخصیت‌ها روشن یا خاموش"],
                  ["eye", "سه حالت خواندن", "با اسکرول پیام‌ها تازه می‌آیند، با لمس خط به خط، یا مثل اعلان گوشی"],
                  ["notice", "خبرم کن", "قسمت تازه که آمد، ربات و کانال خبر می‌دهند"]]},
    {"id": "shop", "title": "ویترین", "domain": "shop", "status": "soon",
     "tagline": "محصول، سبد خرید و پرداخت با ستاره",
     "color": "#C9492A", "tint": "#FCE8E1", "icon": "shop"},
    {"id": "booking", "title": "نوبت", "domain": "booking", "status": "soon",
     "tagline": "رزرو وقت برای مطب، سالن و کلاس",
     "color": "#1F6E5C", "tint": "#E1F1EC", "icon": "cal"},
    {"id": "menu", "title": "منو", "domain": "food", "status": "soon",
     "tagline": "منوی دیجیتال کافه و رستوران",
     "color": "#9A6412", "tint": "#F8EDD8", "icon": "cup"},
    {"id": "card", "title": "کارت", "domain": "personal", "status": "soon",
     "tagline": "کارت ویزیت، لینک‌ها و راه‌های تماس",
     "color": "#2C4BC0", "tint": "#E3E8FB", "icon": "idcard"},
    {"id": "class", "title": "کلاس", "domain": "edu", "status": "soon",
     "tagline": "دوره، درس و پیشرفت هنرجو",
     "color": "#6A3FC8", "tint": "#EDE6FB", "icon": "cap"},
    {"id": "event", "title": "رویداد", "domain": "event", "status": "soon",
     "tagline": "ثبت‌نام، بلیت و یادآوری",
     "color": "#B8315A", "tint": "#FBE4EC", "icon": "ticket"},
    {"id": "poll", "title": "نظرسنجی", "domain": "form", "status": "soon",
     "tagline": "فرم، رأی و نتیجهٔ زنده",
     "color": "#4A5A6B", "tint": "#E6EBF0", "icon": "poll"},
]


def public() -> dict:
    return {"categories": CATEGORIES, "templates": TEMPLATES, "domains": DOMAINS, "store": STORE}
