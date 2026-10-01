"""تست دود: بدون شبکه و بدون تلگرام واقعی.

  python test_smoke.py

تلگرام با یک session ساختگی جایگزین می شود که هر درخواست را ثبت می کند؛
پس جریان واقعی ربات (اتصال توکن، ست دکمه منو، وبهوک مشتری) و مسیرهای
وب (پنل، API، صفحه عمومی) از سر تا ته اجرا می شوند.
"""
from __future__ import annotations

import hashlib
import hmac
import io
import json
import os
import re
import sys
import tempfile
import time
from urllib.parse import quote, urlencode

TMP = tempfile.mkdtemp(prefix="easysaz-test-")
MAIN_TOKEN = "1000001:" + "A" * 35
CLIENT_TOKEN = "2000002:" + "B" * 35

from cryptography.fernet import Fernet  # noqa: E402

os.environ.update(
    BOT_TOKEN=MAIN_TOKEN,
    ADMIN_IDS="42",
    BASE_URL="https://example.com/easysaz",
    WEBHOOK_PATH="/tg/secretpath",
    WEBHOOK_SECRET="whsecret",
    ADMIN_KEY="adminkey",
    TOKEN_KEY=Fernet.generate_key().decode(),
    DB_PATH=os.path.join(TMP, "t.db"),
    LOG_PATH=os.path.join(TMP, "t.log"),
    LOG_LEVEL="WARNING",
)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aiogram.client.session.base import BaseSession  # noqa: E402
from aiogram.methods import GetMe, GetWebhookInfo, TelegramMethod  # noqa: E402
from aiogram.types import Message, User, WebhookInfo  # noqa: E402

from app import blocks, secure  # noqa: E402
from app.webapp import auth  # noqa: E402

PASSED = 0


def ok(cond: bool, title: str) -> None:
    global PASSED
    if not cond:
        raise AssertionError(title)
    PASSED += 1
    print("  ✓", title)


# ---------------------------------------------------------------- session ساختگی
class FakeSession(BaseSession):
    """به جای تلگرام: درخواست ها ثبت می شوند و جواب ساختگی برمی گردد."""

    calls: list[tuple[str, str, dict]] = []  # (bot_id, method, params)
    webhooks: dict[str, str] = {}
    members: set[int] = set()  # اعضای کانال ساختگی (getChatMember)

    async def make_request(self, bot, method: TelegramMethod, timeout=None):  # noqa: ANN001, ANN201
        name = type(method).__name__
        params = method.model_dump(exclude_none=True)
        FakeSession.calls.append((str(bot.id), name, params))
        if isinstance(method, GetMe):
            if bot.id == 2000002:
                return User(id=2000002, is_bot=True, first_name="Cafe Bot", username="cafe_bot")
            return User(id=bot.id, is_bot=True, first_name="EasySaz", username="EasySazBot")
        if isinstance(method, GetWebhookInfo):
            return WebhookInfo(url=FakeSession.webhooks.get(str(bot.id), ""), has_custom_certificate=False, pending_update_count=0)
        if name == "SetWebhook":
            FakeSession.webhooks[str(bot.id)] = params["url"]
        if name == "DeleteWebhook":
            FakeSession.webhooks.pop(str(bot.id), None)
        if name == "GetChat":
            from types import SimpleNamespace

            return SimpleNamespace(id=-1001234567890, type="channel", title="Kaboos", username="kaboos_ch")
        if name == "GetChatMember":
            from types import SimpleNamespace

            uid = params["user_id"]
            status = "administrator" if uid == bot.id else ("member" if uid in FakeSession.members else "left")
            return SimpleNamespace(status=status)
        if name == "CopyMessage":
            from aiogram.types import MessageId

            return MessageId(message_id=9000 + len(FakeSession.calls))
        if name == "GetStickerSet":
            from aiogram.types import Sticker, StickerSet

            stk = [Sticker(file_id=f"f{i}", file_unique_id=f"u{i}", type="custom_emoji", width=100, height=100,
                           is_animated=False, is_video=False, emoji="🔥", custom_emoji_id=f"5{i:018d}") for i in range(3)]
            return StickerSet(name=params["name"], title="Pack", sticker_type="custom_emoji", stickers=stk)
        if name == "GetManagedBotToken":
            return "3000003:" + "C" * 35
        if name in ("SendMessage", "EditMessageText"):
            return Message.model_validate(
                {"message_id": len(FakeSession.calls), "date": int(time.time()),
                 "chat": {"id": params.get("chat_id", 1), "type": "private"},
                 "text": params.get("text", "")},
                context={"bot": bot},
            )
        return True

    async def close(self) -> None:
        return None

    async def stream_content(self, *a, **k):  # noqa: ANN002, ANN003, ANN201
        raise NotImplementedError


def calls(method: str, bot_id: int | None = None) -> list[dict]:
    return [p for b, m, p in FakeSession.calls if m == method and (bot_id is None or b == str(bot_id))]


import app.runtime as rt  # noqa: E402

rt.make_session = lambda: FakeSession()  # همه ربات ها (اصلی و مشتری) session ساختگی می گیرند

import passenger_wsgi  # noqa: E402


# ---------------------------------------------------------------- ابزار
def init_data(user_id: int, token: str = MAIN_TOKEN, name: str = "Ali") -> str:
    fields = {
        "auth_date": str(int(time.time())),
        "query_id": "AAE",
        "user": json.dumps({"id": user_id, "first_name": name}, separators=(",", ":")),
    }
    check = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(fields, quote_via=quote)


def call(method: str, path: str, body=None, headers: dict | None = None):  # noqa: ANN001, ANN201
    raw = b"" if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
    path, _, qs = path.partition("?")
    env = {
        "REQUEST_METHOD": method,
        "PATH_INFO": "/easysaz" + path,
        "SCRIPT_NAME": "",
        "QUERY_STRING": qs,
        "CONTENT_LENGTH": str(len(raw)),
        "wsgi.input": io.BytesIO(raw),
    }
    for k, v in (headers or {}).items():
        env["HTTP_" + k.upper().replace("-", "_")] = v
    out = {}

    def start_response(status, hdrs):  # noqa: ANN001, ANN202
        out["status"] = int(status.split()[0])
        out["headers"] = dict(hdrs)

    out["body"] = b"".join(passenger_wsgi.application(env, start_response))
    return out


def jcall(method: str, path: str, body=None, uid: int | None = 7, token: str = MAIN_TOKEN):  # noqa: ANN001, ANN201
    headers = {"X-Init-Data": init_data(uid, token)} if uid else {}
    r = call(method, path, body, headers)
    return r["status"], json.loads(r["body"] or b"{}")


_UPD = [100]


def update(text: str, uid: int = 7, callback: str | None = None) -> dict:
    _UPD[0] += 1
    user = {"id": uid, "is_bot": False, "first_name": "Ali"}
    chat = {"id": uid, "type": "private"}
    if callback:
        return {"update_id": _UPD[0], "callback_query": {
            "id": str(_UPD[0]), "from": user, "chat_instance": "x", "data": callback,
            "message": {"message_id": 5, "date": int(time.time()), "chat": chat, "text": "…"},
        }}
    return {"update_id": _UPD[0], "message": {
        "message_id": _UPD[0], "date": int(time.time()), "chat": chat, "from": user, "text": text,
        **({"entities": [{"type": "bot_command", "offset": 0, "length": len(text.split()[0])}]} if text.startswith("/") else {}),
    }}


def hook(upd: dict) -> int:
    time.sleep(0.45)  # ضداسپم ربات پیام های زیر ۰.۴ ثانیه را دور می ریزد
    return call("POST", "/tg/secretpath", upd, {"X-Telegram-Bot-Api-Secret-Token": "whsecret"})["status"]


# ---------------------------------------------------------------- تست ها
def test_blocks() -> None:
    print("اسکیما و پاکسازی")
    doc = {
        "theme": {"accent": "red", "mode": "weird"},
        "blocks": [
            {"id": "b1234567", "type": "button", "props": {"label": "x" * 99, "url": "javascript:alert(1)", "evil": 1}},
            {"id": "b1234567", "type": "links", "props": {"items": [{"label": "a", "url": "t.me/foo"}] * 30}},
            {"type": "nope", "props": {}},
            {"type": "hero", "props": {"title": "‮سلام\x00", "image": "http://insecure/img.png"}},
        ],
    }
    clean = blocks.clean_page(doc, max_blocks=10, premium=False)
    b = clean["pages"][0]["blocks"]
    ok(clean["theme"]["accent"] == "#1D55F0" and clean["theme"]["mode"] == "light", "تم نامعتبر به پیش فرض برمی گردد")
    ok(len(b) == 3, "نوع ناشناخته حذف می شود")
    ok(b[0]["props"]["url"] == "" and "evil" not in b[0]["props"], "لینک javascript و کلید اضافه حذف می شود")
    ok(len(b[0]["props"]["label"]) == 40, "طول متن بریده می شود")
    ok(b[0]["id"] != b[1]["id"], "آیدی تکراری عوض می شود")
    ok(len(b[1]["props"]["items"]) == 12 and b[1]["props"]["items"][0]["url"] == "https://t.me/foo", "سقف آیتم و اصلاح لینک t.me")
    ok(b[2]["props"]["title"] == "سلام" and b[2]["props"]["image"] == "", "کاراکتر کنترلی و تصویر http حذف می شود")
    for bad, why in (
        ({"blocks": [{"type": "gallery", "props": {}}]}, "کامپوننت پریمیوم در پلن رایگان رد می شود"),
        ({"blocks": [{"type": "text", "props": {}}] * 11}, "سقف تعداد کامپوننت رعایت می شود"),
    ):
        try:
            blocks.clean_page(bad, max_blocks=10, premium=False)
            ok(False, why)
        except blocks.PageError:
            ok(True, why)
    ok(blocks.social_href("whatsapp", "+98 912 000 0000") == "https://wa.me/989120000000", "لینک واتساپ")
    legacy = blocks.clean_page({"theme": {"bg": "glow"}, "blocks": [{"type": "hero", "props": {"style": "gradient"}}]}, max_blocks=8, premium=False)
    ok(legacy["pages"][0]["blocks"][0]["props"]["style"] == "solid" and legacy["theme"]["bg"] == "tint", "دادهٔ قدیمی (گرادیان/درخشان) به سیستم طراحی تازه نگاشت می‌شود")
    v2 = blocks.clean_page({"pages": [
        {"id": "home", "title": "خانه", "icon": "home", "blocks": [{"type": "text", "props": {}, "style": {"box": "outline", "radius": 99, "accent": "red", "pad": "md", "evil": 1}}]},
        {"id": "home", "title": "", "icon": "nope", "blocks": [{"type": "divider", "props": {}, "style": {"radius": 4}}]}],
        "header": {"enabled": True, "style": "x", "logo": "javascript:alert(1)"}, "tabbar": {"style": "docked"}}, max_blocks=8, premium=False, max_pages=2)
    st = v2["pages"][0]["blocks"][0]["style"]
    ok(st == {"box": "outline", "radius": 40}, "استایل کامپوننت: گوشه محدود، رنگ نامعتبر و پیش‌فرض‌ها حذف")
    ok("style" not in v2["pages"][1]["blocks"][0], "استایلی که نوع پشتیبانی نمی‌کند حذف می‌شود")
    ok(v2["pages"][1]["id"] != "home" and v2["pages"][1]["icon"] == "star" and v2["pages"][1]["title"], "صفحهٔ تکراری/نامعتبر اصلاح می‌شود")
    ok(v2["header"]["style"] == "bar" and v2["header"]["logo"] == "" and v2["tabbar"]["style"] == "docked", "سربرگ و نوار پایین پاکسازی می‌شوند")
    try:
        blocks.clean_page({"pages": [{"blocks": []}] * 3}, max_blocks=8, premium=False, max_pages=2)
        ok(False, "سقف صفحه")
    except blocks.PageError:
        ok(True, "سقف صفحه‌های پلن رعایت می‌شود")
    try:
        blocks.clean_page({"pages": [{"blocks": [{"type": "text"}] * 5}, {"blocks": [{"type": "text"}] * 4}]}, max_blocks=8, premium=False, max_pages=2)
        ok(False, "سقف کل")
    except blocks.PageError:
        ok(True, "سقف کامپوننت برای کل مینی‌اپ است، نه هر صفحه")
    from app import templates
    for t in templates.TEMPLATES:
        again = blocks.clean_page(t["doc"], max_blocks=100, premium=True, max_pages=12)
        assert again["pages"] and t["category"] in templates.CATEGORIES, t["id"]
    ok([t["id"] for t in templates.TEMPLATES] == ["shab", "mag"] and [t["kit"] for t in templates.TEMPLATES] == ["shab", "mag"],
       "قالب‌های قسمت و مجله عرضه می‌شوند و معتبرند")
    doms = {d["id"] for d in templates.DOMAINS}
    hexok = lambda c: bool(re.fullmatch(r"#[0-9A-Fa-f]{6}", c or ""))
    ok(all(e["domain"] in doms and hexok(e["color"]) and hexok(e["tint"]) and e["status"] in ("ready", "soon")
           and (e["status"] != "ready" or e.get("template") in templates.BY_ID) for e in templates.STORE)
       and len({e["id"] for e in templates.STORE}) == len(templates.STORE)
       and "store" in templates.public() and "domains" in templates.public(),
       "فروشگاه قالب: حوزه، رنگ و قالب آماده‌ها معتبر است")
    covers = [b["props"]["cover"] for b in blocks.all_blocks(templates.BY_ID["shab"]["doc"]) if b["type"] == "story"]
    ok(len(covers) == 2 and all(c.startswith(blocks.sample_prefix()) and blocks.clean_url(c, images=True) == c
                                and os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(__file__)), "app/webapp/static/samples", c.rsplit("/", 1)[1])) for c in covers),
       "جلد داستان‌های نمونه از static/samples می‌آید")
    from app.kits import shab as shab_kit
    body = "راوی **گفت**.\n\n@cmen001: سلام\n\n@cbongah: !img(https://x.test/a.jpg) عکس\n\n!img(https://x.test/b.jpg)"
    ok(shab_kit.line("@cmen001: سلام") == ("cmen001", "سلام", "")
       and shab_kit.line("@cbongah: !img(https://x.test/a.jpg) عکس") == ("cbongah", "عکس", "https://x.test/a.jpg")
       and shab_kit.line("متن ساده") == ("", "متن ساده", "")
       and shab_kit.words(body) == 4
       and shab_kit.teaser_lines(body) == "راوی **گفت**.\n\n@cmen001: سلام"
       and [x["w"] for x in shab_kit.lead(body)] == ["", "cmen001", "cbongah"] and shab_kit.lead(body)[2]["i"],
       "خط‌های قسمت: گوینده، تصویر، شمارش کلمه و چند خط اول")
    pv = shab_kit.public_view({"pages": [{"blocks": [{"type": "story", "props": {"chapters": [
        {"id": "caaaaa1", "body": body}, {"id": "caaaaa2", "body": body, "lock": True}]}}]}]})
    pch = pv["pages"][0]["blocks"][0]["props"]["chapters"]
    ok(all("body" not in c and c["chat"] for c in pch) and len(pch[0]["lead"]) == 3 and len(pch[1]["lead"]) == 2,
       "سند خواننده: بی‌متن، با نوع گفت‌وگو و سه خط اول (قسمت قفل دو خط)")
    ok(blocks.empty_page()["kit"] == "shab" and blocks.upgrade({"blocks": [{"type": "text"}]})["kit"] == "base",
       "مینی‌اپ تازه روی قسمت است؛ سند قدیمی روی قالب پایه می‌ماند")
    ok(set(blocks.CATALOG_ORDER) == set(blocks.SCHEMA) and all(b["cat"] in blocks.CATEGORIES for b in blocks.SCHEMA.values()), "هر کامپوننت دسته و جای کاتالوگ دارد")
    # سبک‌های آماده: هر کدام باید دست‌نخورده از پاکسازی سرور رد شود و فقط فیلدهای ظاهری را عوض کند
    for btype, variants in blocks.VARIANTS.items():
        looks = {f["key"] for f in blocks.SCHEMA[btype]["fields"] if f.get("look")}
        ids = [v["id"] for v in variants]
        assert len(ids) == len(set(ids)) >= 2, btype
        for v in variants:
            assert set(v["props"]) <= looks, (btype, v["id"])
            props = dict(blocks.default_props(btype), **v["props"])
            doc = {"kit": blocks.SCHEMA[btype].get("kit", "base"),
                   "pages": [{"blocks": [{"id": "bvar00001", "type": btype, "props": props, "style": v["style"]}]}]}
            out = blocks.clean_page(doc, max_blocks=10, premium=True)["pages"][0]["blocks"][0]
            assert all(out["props"][k] == val for k, val in v["props"].items()), (btype, v["id"])
            assert out.get("style", {}) == v["style"], (btype, v["id"], out.get("style"))
    ok(set(blocks.VARIANTS) >= {k for k, b in blocks.SCHEMA.items() if not b.get("kit")},
       "همهٔ سبک‌های آماده معتبرند و هر کامپوننت عمومی سبک دارد")

    # قالب قسمت: کامپوننت‌های اختصاصی فقط در قالب خودشان
    story = {"type": "story", "props": {"title": "x", "chapters": [{"title": "۱", "body": "متن", "lock": "yes"}]}}
    shab = blocks.clean_page({"kit": "shab", "pages": [{"blocks": [story, {"type": "text"}]}]}, max_blocks=8, premium=False)
    ch = shab["pages"][0]["blocks"][0]["props"]["chapters"][0]
    ok(shab["kit"] == "shab" and len(shab["pages"][0]["blocks"]) == 2 and ch["lock"] is False and ch["url"] == "",
       "کامپوننت داستان در قالب قسمت ذخیره و پاکسازی می‌شود")
    base = blocks.clean_page({"kit": "nope", "pages": [{"blocks": [story, {"type": "text"}]}]}, max_blocks=8, premium=False)
    ok(base["kit"] == "base" and [b["type"] for b in base["pages"][0]["blocks"]] == ["text"],
       "قالب ناشناخته پایه می‌شود و کامپوننت داستان بیرون قالبش حذف می‌شود")
    big = {"type": "story", "props": {"chapters": [{"body": "ا" * 8000}] * 30}}
    try:
        blocks.clean_page({"kit": "shab", "pages": [{"blocks": [big]}]}, max_blocks=8, premium=False)
        ok(False, "سقف متن داستان‌ها")
    except blocks.PageError:
        ok(True, "سقف مجموع متن فصل‌ها رعایت می‌شود")


def test_auth() -> None:
    print("احراز هویت initData")
    u = auth.verify(init_data(9, MAIN_TOKEN))
    ok(u.id == 9, "امضای درست پذیرفته می شود")
    try:
        auth.verify(init_data(9, CLIENT_TOKEN))
        ok(False, "امضا با توکن دیگر")
    except auth.AuthError:
        ok(True, "امضای ربات دیگر رد می شود")
    ok(auth.verify(init_data(9, CLIENT_TOKEN), CLIENT_TOKEN).id == 9, "امضای ربات مشتری با توکن خودش")
    enc = secure.encrypt_token(CLIENT_TOKEN)
    ok(CLIENT_TOKEN not in enc and secure.decrypt_token(enc) == CLIENT_TOKEN, "توکن رمزنگاری و بازگشایی می شود")


def test_web() -> None:
    print("مسیرهای وب و API پنل")
    ok(call("GET", "/health")["body"].startswith(b"easysaz: ok"), "/health")
    r = call("GET", "/panel")
    ok(r["status"] == 200 and b"/easysaz/static/panel.js" in r["body"], "پنل با آدرس پایه درست")
    ok("Content-Security-Policy" in r["headers"], "هدر CSP")
    from app.webapp import wsgi as wsgi_mod
    ver = wsgi_mod.asset_version("panel.js")
    ok(len(ver) == 10 and f"static/panel.js?v={ver}".encode() in r["body"] and b"?v=21" not in r["body"]
       and call("GET", "/static/panel.js?v=" + ver)["headers"]["Cache-Control"].endswith("immutable")
       and call("GET", "/static/panel.js")["headers"]["Cache-Control"] == "no-cache",
       "نسخهٔ js/css از هش محتواست؛ بعد از هر به‌روزرسانی نسخهٔ قدیمی از حافظه نمی‌آید")
    ok(call("GET", "/static/render.js")["status"] == 200, "فایل ثابت")
    ok(call("GET", "/static/../../.env")["status"] == 404, "جلوگیری از خروج از پوشه static")
    ok(call("GET", "/static/fonts/peyda-400.woff2")["headers"]["Content-Type"] == "font/woff2", "فونت")
    tokens = call("GET", "/static/tokens.css")
    ok(tokens["status"] == 200 and b"--brand:" in tokens["body"] and b"--pg-accent:" in tokens["body"], "توکن‌های سیستم طراحی سرو می‌شوند")
    import subprocess
    built = subprocess.run([sys.executable, "scripts/build_tokens.py"], capture_output=True, cwd=os.path.dirname(os.path.abspath(__file__)))
    ok(built.returncode == 0 and call("GET", "/static/tokens.css")["body"] == tokens["body"], "tokens.css با design/tokens.json همگام است")
    demo = call("GET", "/a/demo")
    ok(demo["status"] == 200 and b"demo.js" in demo["body"], "صفحهٔ نمایشی /a/demo")
    st, schema = jcall("GET", "/api/schema", uid=None)
    ok(st == 200 and "hero" in schema["blocks"] and schema["order"][0] == "hero" and "write" in schema["categories"], "اسکیما با دسته‌ها و ترتیب کاتالوگ")
    st, _ = jcall("GET", "/api/me", uid=None)
    ok(st == 401, "بدون initData: ۴۰۱")
    st, _ = jcall("GET", "/api/me", uid=7, token=CLIENT_TOKEN)
    ok(st == 401, "initData ربات دیگر برای پنل پذیرفته نمی شود")

    st, me = jcall("GET", "/api/me")
    ok(st == 200 and me["apps"] == [] and me["can_create"], "کاربر تازه: بدون اپ")
    ok([p["key"] for p in me["plans"]] == ["free", "pro", "business"] and me["plans"][1]["price_stars"] > 0, "فهرست پلن‌ها برای صفحهٔ حساب")
    st, res = jcall("POST", "/api/app/create", {"name": " "})
    ok(st == 400, "اسم خالی رد می شود")
    st, res = jcall("POST", "/api/app/create", {"name": "کافه نارنج"})
    ok(st == 200 and res["doc"]["pages"][0]["blocks"] == [] and res["app"]["kit"] == "shab", "ساخت اپ با صفحه خالی روی قالب قسمت")
    app_id, slug = res["app"]["id"], res["app"]["slug"]
    st, res = jcall("POST", "/api/app/create", {"name": "دومی"})
    ok(st == 402, "پلن رایگان: فقط یک مینی اپ")

    st, res = jcall("GET", f"/api/app?id={app_id}", uid=8)
    ok(st == 404, "کاربر دیگر به اپ دسترسی ندارد")

    doc = {"theme": {"accent": "#E0457B"}, "blocks": [
        {"id": "bhero001", "type": "hero", "props": {"title": "سلام"}},
        {"id": "bbtn0001", "type": "button", "props": {"label": "برو", "url": "javascript:x"}},
    ]}
    st, res = jcall("POST", "/api/app/save", {"id": app_id, "doc": doc})
    ok(st == 200 and res["doc"]["pages"][0]["blocks"][1]["props"]["url"] == "" and res["app"]["dirty"], "ذخیره پیش نویس پاکسازی شده")
    st, page = jcall("GET", f"/api/page/{slug}", uid=None)
    ok(st == 200 and page["doc"]["pages"][0]["blocks"] == [], "قبل از انتشار صفحه عمومی خالی است")
    st, res = jcall("POST", "/api/app/save", {"id": app_id, "doc": {"blocks": [{"type": "cards", "props": {}}]}})
    ok(st == 402, "کامپوننت پریمیوم در پلن رایگان ذخیره نمی شود")
    st, res = jcall("POST", "/api/app/publish", {"id": app_id, "doc": doc})
    ok(st == 200 and not res["app"]["dirty"], "انتشار")
    st, page = jcall("GET", f"/api/page/{slug}", uid=None)
    ok(len(page["doc"]["pages"][0]["blocks"]) == 2 and page["branding"] is True and page["brand_bot"] == "EasySazBot", "صفحه عمومی بعد از انتشار + نشان برند")
    r = call("GET", f"/a/{slug}")
    ok(r["status"] == 200 and "کافه نارنج".encode() in r["body"], "HTML صفحه با عنوان اپ")
    ok(call("GET", "/a/../../x")["status"] == 404, "slug نامعتبر")

    st, tp = jcall("GET", "/api/templates", uid=None)
    ok(st == 200 and tp["templates"] and tp["categories"], "API قالب‌ها")
    shab_tpl = next(t for t in tp["templates"] if t["kit"] == "shab")
    cut = dict(shab_tpl["doc"], pages=shab_tpl["doc"]["pages"][:2])
    st, res = jcall("POST", "/api/app/save", {"id": app_id, "doc": cut})
    ok(st == 200 and res["doc"]["kit"] == "shab" and res["doc"]["pages"][1]["blocks"][0]["type"] == "story",
       "قالب «قسمت» ذخیره می‌شود")
    st, _ = jcall("POST", "/api/app/save", {"id": app_id, "doc": shab_tpl["doc"]})
    ok(st == 200 and len(shab_tpl["doc"]["pages"]) == 2, "قالب کامل «قسمت» (دو صفحه) در پلن رایگان جا می‌شود")
    import copy
    drafty = copy.deepcopy(cut)
    drafty["pages"][1]["blocks"][0]["props"]["chapters"][0]["draft"] = True
    drafty["pages"][1]["blocks"][0]["props"]["chapters"][0]["body"] = "متن منتشرنشده"
    st, _ = jcall("POST", "/api/app/publish", {"id": app_id, "doc": drafty})
    st, page = jcall("GET", f"/api/page/{slug}", uid=None)
    chs = page["doc"]["pages"][1]["blocks"][0]["props"]["chapters"]
    ok(st == 200 and len(chs) == 3 and "متن منتشرنشده" not in json.dumps(page, ensure_ascii=False),
       "فصل پیش‌نویس به صفحهٔ عمومی نمی‌رسد")

    import base64
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 64
    st, up = jcall("POST", "/api/upload", {"data": "data:image/png;base64," + base64.b64encode(png).decode()})
    ok(st == 200 and up["url"].startswith("https://example.com/easysaz/u/") and up["url"].endswith(".png"), "آپلود تصویر")
    served = call("GET", "/u/" + up["url"].rsplit("/", 1)[1])
    ok(served["status"] == 200 and served["body"] == png and served["headers"]["Content-Type"] == "image/png", "تصویر آپلودشده سرو می‌شود")
    st, _ = jcall("POST", "/api/upload", {"data": base64.b64encode(b"<svg onload=alert(1)>").decode()})
    ok(st == 400, "فایل غیرتصویری رد می‌شود")
    ok(call("GET", "/u/../../.env")["status"] == 404, "مسیر /u/ امن است")
    img_doc = {"pages": [{"blocks": [{"type": "image", "props": {"src": up["url"]}}]}]}
    st, res = jcall("POST", "/api/app/save", {"id": app_id, "doc": img_doc})
    ok(res["doc"]["pages"][0]["blocks"][0]["props"]["src"] == up["url"], "تصویر آپلودشده در سند پذیرفته می‌شود")

    st, pv = jcall("GET", "/api/previews")
    ok(st == 200 and list(pv["docs"]) == [str(app_id)] and pv["docs"][str(app_id)]["pages"][0]["blocks"][0]["type"] == "image",
       "پیش‌نمایش مینی‌اپ‌ها برای ویترین خانه")
    st, pv = jcall("GET", "/api/previews", uid=8)
    ok(st == 200 and pv["docs"] == {}, "پیش‌نمایش مینی‌اپ دیگران دیده نمی‌شود")
    st, _ = jcall("GET", "/api/previews", uid=None)
    ok(st == 401, "پیش‌نمایش بدون initData: ۴۰۱")

    st, res = jcall("POST", "/api/app/welcome", {"id": app_id, "text": "سلام <b>دوست</b>"})
    ok(st == 200 and res["app"]["welcome"] == "سلام &lt;b&gt;دوست&lt;/b&gt;", "پیام خوش‌آمد از پنل ذخیره و امن می‌شود")
    st, _ = jcall("POST", "/api/app/welcome", {"id": app_id, "text": "x"}, uid=8)
    ok(st == 404, "پیام خوش‌آمد اپ دیگران قابل تغییر نیست")


def test_bot() -> None:
    print("ربات اصلی و ربات مشتری")
    ok(hook(update("/start")) == 200, "وبهوک ربات اصلی")
    ok(call("POST", "/tg/secretpath", update("/start"), {"X-Telegram-Bot-Api-Secret-Token": "bad"})["status"] == 403, "رمز غلط وبهوک: ۴۰۳")
    sent = calls("SendMessage", 1000001)
    ok(sent and "EasySaz" in sent[-1]["text"], "/start منوی اصلی را می فرستد")

    hook(update("", callback="connect"))
    ok("توکن" in calls("EditMessageText", 1000001)[-1]["text"], "درخواست توکن")
    hook(update("/start"))  # وسط انتظار توکن، /start باید کار کند نه اینکه توکن حساب شود
    ok("EasySaz" in calls("SendMessage", 1000001)[-1]["text"], "دستور وسط FSM به جای توکن گرفته نمی شود")

    hook(update("", callback="connect"))
    hook(update(CLIENT_TOKEN))
    ok(calls("DeleteMessage", 1000001), "پیام حاوی توکن پاک می شود")
    ok(calls("GetMe", 2000002), "توکن با getMe بررسی می شود")
    last = calls("EditMessageText", 1000001)[-1]
    ok("cafe_bot" in last["text"] and "دکمه منو" in last["text"], "انتخاب حالت اتصال")

    import sqlite3

    con = sqlite3.connect(os.environ["DB_PATH"])
    row = con.execute("SELECT id, slug, bot_id, bot_token_enc FROM apps").fetchone()
    ok(row[2] == 2000002 and CLIENT_TOKEN not in (row[3] or ""), "ربات به همان اپ وصل شد و توکن خام ذخیره نشده")
    app_id, slug = row[0], row[1]

    hook(update("", callback=f"mode:{app_id}:menu"))
    menu = calls("SetChatMenuButton", 2000002)
    ok(menu and menu[-1]["menu_button"]["web_app"]["url"] == f"https://example.com/easysaz/a/{slug}", "حالت منو: دکمه منوی ربات مشتری ست شد")
    ok(not calls("SetWebhook", 2000002), "حالت منو به وبهوک ربات مشتری دست نمی زند")

    hook(update("", callback=f"mode:{app_id}:full"))
    ok("از کار می‌افته" in calls("EditMessageText", 1000001)[-1]["text"], "هشدار قبل از کنترل کامل")
    ok(not calls("SetWebhook", 2000002), "بدون تایید، وبهوک عوض نمی شود")
    hook(update("", callback=f"mode:{app_id}:fullok"))
    wh = calls("SetWebhook", 2000002)
    ok(wh and wh[-1]["url"] == "https://example.com/easysaz/hook/2000002" and wh[-1]["secret_token"] == secure.client_hook_secret(2000002), "کنترل کامل: وبهوک با رمز مشتق")

    upd = update("/start", uid=55)
    bad = call("POST", "/hook/2000002", upd, {"X-Telegram-Bot-Api-Secret-Token": "x"})
    ok(bad["status"] == 403, "وبهوک مشتری با رمز غلط رد می شود")
    good = call("POST", "/hook/2000002", upd, {"X-Telegram-Bot-Api-Secret-Token": secure.client_hook_secret(2000002)})
    reply = calls("SendMessage", 2000002)
    ok(good["status"] == 200 and reply, "ربات مشتری به /start جواب می دهد")
    btn = reply[-1]["reply_markup"]["inline_keyboard"][0][0]
    ok(btn["web_app"]["url"].endswith(f"/a/{slug}"), "دکمه ورود به مینی اپ")

    st, res = jcall("POST", f"/api/page/{slug}/view", uid=55, token=CLIENT_TOKEN)
    ok(res.get("ok") is True, "بازدید با initData ربات مشتری ثبت می شود")
    st, res = jcall("POST", f"/api/page/{slug}/view", uid=55, token=MAIN_TOKEN)
    ok(res.get("ok") is False, "بازدید جعلی (امضای ربات دیگر) ثبت نمی شود")
    st, me = jcall("GET", "/api/me")
    stt = next(a for a in me["apps"] if a["id"] == app_id)["stats"]
    ok(len(stt["days"]) == 14 and stt["days"][-1] == stt["views_today"] >= 1 and stt["views_week"] >= 1
       and stt["people_week"] == 1 and stt["views_prev_week"] == 0 and me["plan_until"] is None,
       "خانهٔ پنل: آمار هر مینی‌اپ (آدم‌های این هفته و نمودار ۱۴ روزه)")

    test_shab(slug, app_id)

    hook(update("", callback=f"mode:{app_id}:menu"))
    ok("2000002" not in FakeSession.webhooks, "برگشت به منو وبهوک ما را برمی دارد")

    hook(update("", callback=f"unlinkok:{app_id}"))
    row = con.execute("SELECT bot_id, bot_token_enc, mode FROM apps WHERE id = ?", (app_id,)).fetchone()
    ok(row == (None, None, "none"), "جدا کردن ربات توکن را پاک می کند")
    ok(calls("SetChatMenuButton", 2000002)[-1]["menu_button"]["type"] == "default", "دکمه منوی ربات مشتری به حالت اول برگشت")

    # آمار ادمین و دادن پلن
    hook(update("/grant 7 pro 30", uid=42))
    ok("فعال شد" in calls("SendMessage", 1000001)[-1]["text"], "ادمین پلن می دهد")
    st, me = jcall("GET", "/api/me")
    ok(me["plan"]["key"] == "pro" and me["can_create"], "بعد از ارتقا، ساخت اپ دوم مجاز است")
    hook(update("/grant 7 pro 30", uid=99))
    ok("فعال شد" not in calls("SendMessage", 1000001)[-1]["text"], "غیرادمین نمی تواند پلن بدهد")


def test_shab(slug: str, app_id: int) -> None:
    """قسمت سمت سرور: فصل‌ها در جدول، قفل عضویت، وضعیت خواندن، آمار و اعلام."""
    print("قسمت (سرور)")
    st, tp = jcall("GET", "/api/templates", uid=None)
    doc = dict(tp["templates"][0]["doc"], pages=tp["templates"][0]["doc"]["pages"][:2])
    story = doc["pages"][1]["blocks"][0]
    chs = story["props"]["chapters"]
    free_id, locked_id = chs[0]["id"], chs[3]["id"]
    ok(chs[3]["lock"] and all(c["id"] for c in chs), "فصل‌ها شناسهٔ پایدار دارند و قالب فصل قفل دارد")
    st, res = jcall("POST", "/api/app/publish", {"id": app_id, "doc": doc})
    fresh = [c["id"] for c in res["kit"]["new_chapters"]]
    ok(st == 200 and free_id in fresh, "انتشار فصل‌های تازه را برای اعلام برمی‌گرداند")
    st, page = jcall("GET", f"/api/page/{slug}", uid=None)
    pchs = page["doc"]["pages"][1]["blocks"][0]["props"]["chapters"]
    ok(all("body" not in c and c["words"] > 0 for c in pchs), "صفحهٔ عمومی متن فصل‌ها را ندارد، فقط تعداد کلمه")
    st, pv = jcall("GET", "/api/previews")
    vchs = pv["docs"][str(app_id)]["pages"][1]["blocks"][0]["props"]["chapters"]
    ok(st == 200 and all("body" not in c and c["lead"] for c in vchs), "پیش‌نمایش خانه سبک است: بدون متن کامل قسمت‌ها")
    st, ch = jcall("GET", f"/api/page/{slug}/chapter?id={free_id}", uid=None)
    ok(st == 200 and "کلید" in ch["title"] and len(ch["body"]) > 50, "متن فصل آزاد جدا گرفته می‌شود")
    st, ch = jcall("GET", f"/api/page/{slug}/chapter?id={locked_id}", uid=None)
    ok(ch.get("locked") and ch["teaser"] and "body" not in ch, "فصل قفل بدون هویت فقط چند خط اولش را می‌دهد")

    st, res = jcall("POST", "/api/kit/shab/channel", {"id": app_id, "channel": "https://t.me/kaboos_ch"})
    ok(st == 200 and res["channel"]["title"] == "Kaboos", "کانال با ادمین بودن ربات ثبت می‌شود")
    st, ch = jcall("GET", f"/api/page/{slug}/chapter?id={locked_id}", uid=55, token=CLIENT_TOKEN)
    ok(ch.get("locked") and ch["members_only"] and ch["join_url"] == "https://t.me/kaboos_ch", "غیرعضو کانال فصل قفل را نمی‌گیرد")
    FakeSession.members.add(56)
    st, ch = jcall("GET", f"/api/page/{slug}/chapter?id={locked_id}", uid=56, token=CLIENT_TOKEN)
    ok(ch.get("member") and "دستگیره" in ch["body"], "عضو کانال (امضای ربات همان مینی‌اپ) فصل قفل را می‌خواند")
    st, ch = jcall("GET", f"/api/page/{slug}/chapter?id={locked_id}", uid=56, token=MAIN_TOKEN)
    ok(ch.get("locked"), "امضای ربات دیگر برای فصل قفل پذیرفته نمی‌شود")

    st, _ = jcall("GET", f"/api/page/{slug}/me", uid=None)
    ok(st == 401, "وضعیت خواندن بدون initData داده نمی‌شود")
    st, r = jcall("POST", f"/api/page/{slug}/progress", {"s": story["id"], "k": free_id, "p": 0.5}, uid=55, token=CLIENT_TOKEN)
    jcall("POST", f"/api/page/{slug}/progress", {"s": story["id"], "k": free_id, "p": 0.2}, uid=55, token=CLIENT_TOKEN)
    jcall("POST", f"/api/page/{slug}/mark", {"k": free_id, "on": True}, uid=55, token=CLIENT_TOKEN)
    jcall("POST", f"/api/page/{slug}/notify", {"on": False}, uid=55, token=CLIENT_TOKEN)
    st, me = jcall("GET", f"/api/page/{slug}/me", uid=55, token=CLIENT_TOKEN)
    ok(me["last"]["k"] == free_id and me["read"][free_id] == 0.5 and me["marks"][0]["k"] == free_id and me["notify"] is False,
       "جای خواندن (بیشترین)، نشان و «خبرم کن» روی سرور می‌ماند")
    st, bad = jcall("POST", f"/api/page/{slug}/progress", {"k": "cnotreal00", "p": 1}, uid=55, token=CLIENT_TOKEN)
    ok(bad.get("ok") is False, "پیشرفت فصلِ ناموجود ثبت نمی‌شود")

    st, stats = jcall("GET", f"/api/kit/shab/stats?id={app_id}")
    ok(stats["chapters"][free_id]["readers"] == 1 and stats["readers"] >= 1, "آمار خواندن هر فصل برای صاحب مینی‌اپ")
    st, _ = jcall("GET", f"/api/kit/shab/stats?id={app_id}", uid=99)
    ok(st == 404, "آمار مینی‌اپ دیگران داده نمی‌شود")

    jcall("GET", f"/api/page/{slug}/me", uid=57, token=CLIENT_TOKEN)  # خوانندهٔ تازه با «خبرم کن» روشن
    before = len(calls("SendMessage", 2000002))
    st, res = jcall("POST", "/api/kit/shab/announce", {"id": app_id, "chapters": [free_id], "channel": True, "readers": True})
    ok(st == 200 and res["readers"] >= 1 and res["channel"], "اعلام فصل تازه صف می‌شود")
    time.sleep(0.6)
    sent = calls("SendMessage", 2000002)[before:]
    to_channel = [m for m in sent if m["chat_id"] == -1001234567890]
    to_57 = [m for m in sent if m["chat_id"] == 57]
    ok(to_channel and "start=c_" in to_channel[-1]["reply_markup"]["inline_keyboard"][0][0]["url"], "پست کانال با لینک همان فصل")
    ok(to_57 and to_57[-1]["reply_markup"]["inline_keyboard"][0][0]["web_app"]["url"].endswith("#read=" + free_id)
       and not [m for m in sent if m["chat_id"] == 55], "پیام خواننده‌ها فقط به «خبرم کن»‌ها، با دکمهٔ همان فصل")
    st, _ = jcall("POST", "/api/kit/shab/announce", {"id": app_id, "chapters": [free_id], "readers": True})
    ok(st == 400, "هر فصل فقط یک بار اعلام می‌شود")

    upd = update(f"/start c_{free_id}", uid=58)
    call("POST", "/hook/2000002", upd, {"X-Telegram-Bot-Api-Secret-Token": secure.client_hook_secret(2000002)})
    btn = calls("SendMessage", 2000002)[-1]["reply_markup"]["inline_keyboard"][0][0]
    ok(btn["web_app"]["url"].endswith("#read=" + free_id), "لینک کانال (start=c_…) همان فصل را در مینی‌اپ باز می‌کند")

    # خاموش/روشن و حذف قالب از پنل
    st, res = jcall("POST", "/api/app/status", {"id": app_id, "active": False})
    st2, page = jcall("GET", f"/api/page/{slug}", uid=None)
    st3, ch = jcall("GET", f"/api/page/{slug}/chapter?id={free_id}", uid=None)
    ok(st == 200 and res["app"]["status"] == "paused" and page.get("paused") and st3 != 200,
       "خاموش: خواننده «فعلاً بسته» می‌بیند و متن قسمت هم داده نمی‌شود")
    st, res = jcall("POST", "/api/app/status", {"id": app_id, "active": True})
    st2, page = jcall("GET", f"/api/page/{slug}", uid=None)
    ok(res["app"]["status"] == "active" and "doc" in page, "روشن: مینی‌اپ دوباره همان است")
    st, _ = jcall("POST", "/api/app/status", {"id": app_id, "active": False}, uid=99)
    ok(st == 404, "مینی‌اپ دیگران خاموش نمی‌شود")
    st, _ = jcall("POST", "/api/app/remove_kit", {"id": app_id}, uid=99)
    ok(st == 404, "قالب مینی‌اپ دیگران حذف نمی‌شود")
    st, res = jcall("POST", "/api/app/remove_kit", {"id": app_id})
    st2, page = jcall("GET", f"/api/page/{slug}", uid=None)
    import sqlite3
    left = sqlite3.connect(os.environ["DB_PATH"]).execute("SELECT COUNT(*) FROM shab_chapters WHERE app_id = ?", (app_id,)).fetchone()[0]
    ok(st == 200 and res["doc"]["kit"] == "base" and not res["doc"]["pages"][0]["blocks"] and page["doc"]["kit"] == "base" and left == 0,
       "حذف قالب: مینی‌اپ خالی و متن قسمت‌ها از سرور پاک می‌شود")


def test_site() -> None:
    print("وب‌سایت و ورود با QR")
    import sqlite3
    r = call("GET", "/")
    ok(r["status"] == 200 and b"/easysaz/site/static/site.css?v=" in r["body"] and "frame-ancestors 'none'" in r["headers"]["Content-Security-Policy"],
       "لندینگ با css نسخه‌دار و CSP")
    ok(call("GET", "/health")["body"].startswith(b"easysaz: ok"), "/health هنوز سلامت را می‌گوید")
    ok(call("GET", "/site/static/site.css")["status"] == 200 and call("GET", "/site/static/../wsgi.py")["status"] == 404,
       "فایل ثابت سایت و جلوگیری از خروج از پوشه")
    r = call("GET", "/account")
    ok(r["status"] == 302 and r["headers"]["Location"] == "/easysaz/login", "حساب بدون ورود ← صفحهٔ ورود")
    ok(call("GET", "/login")["status"] == 200, "صفحهٔ ورود")

    ua = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36",
          "CF-IPCountry": "IR", "X-ES": "1"}

    def site(method: str, path: str, body=None, cookie: str = "", es: bool = True):  # noqa: ANN001, ANN202
        h = dict(ua) if es else {k: v for k, v in ua.items() if k != "X-ES"}
        if cookie:
            h["Cookie"] = "es_site=" + cookie
        r = call(method, path, body, h)
        return r["status"], json.loads(r["body"] or b"{}"), r["headers"]

    st, _, _ = site("POST", "/site/api/login/start", es=False)
    ok(st == 403, "POST سایت بدون هدر X-ES رد می‌شود (CSRF)")
    st, lg, _ = site("POST", "/site/api/login/start")
    code, poll = lg["code"], lg["poll"]
    ok(st == 200 and lg["qr"] == f"https://t.me/EasySazBot?start=wl_{code}" and lg["refresh"] == 30, "کد تازه و متن QR")
    st, res, _ = site("POST", "/site/api/login/poll", {"code": code, "poll": poll})
    ok(st == 200 and res["status"] == "pending", "در انتظار اسکن")
    st, _, _ = site("POST", "/site/api/login/poll", {"code": code, "poll": "x" * 32})
    ok(st == 404, "بدون کلید پرسش همان مرورگر نشستی داده نمی‌شود")

    st, _ = jcall("POST", "/api/weblogin/approve", {"code": code})
    ok(st == 400, "تأیید بدون اسکن پذیرفته نمی‌شود")
    st, ins = jcall("POST", "/api/weblogin/inspect", {"text": lg["qr"]})
    ok(st == 200 and ins["device"]["label"] == "Chrome روی Windows" and ins["place"] == "ایران",
       "اسکن در مینی‌اپ: اسم مرورگر و جا برای تأیید")
    st, _ = jcall("POST", "/api/weblogin/inspect", {"code": code}, uid=8)
    ok(st == 409, "کد اسکن‌شده مال کس دیگری نمی‌شود")
    st, _ = jcall("POST", "/api/weblogin/approve", {"code": code}, uid=8)
    ok(st == 409, "کاربر دیگر نمی‌تواند تأیید کند")
    st, res, _ = site("POST", "/site/api/login/poll", {"code": code, "poll": poll})
    ok(res["status"] == "scanned", "سایت می‌فهمد اسکن شد")
    st, res = jcall("POST", "/api/weblogin/approve", {"code": code})
    ok(st == 200 and res["status"] == "approved", "تأیید روی گوشی")
    st, res, hd = site("POST", "/site/api/login/poll", {"code": code, "poll": poll})
    sc = hd.get("Set-Cookie", "")
    token = sc.split(";")[0].split("=", 1)[1] if sc.startswith("es_site=") else ""
    ok(res["status"] == "approved" and res["user"]["first_name"] == "Ali" and token
       and all(a in sc for a in ("HttpOnly", "Secure", "SameSite=Lax", "Path=/easysaz")), "نشست با کوکی HttpOnly")
    st, res, hd = site("POST", "/site/api/login/poll", {"code": code, "poll": poll})
    ok(res["status"] == "used" and "Set-Cookie" not in hd, "هر کد فقط یک نشست می‌سازد")
    db = sqlite3.connect(os.environ["DB_PATH"])
    ok(db.execute("SELECT COUNT(*) FROM web_sessions WHERE token_hash = ?", (token,)).fetchone()[0] == 0,
       "توکن نشست خام در دیتابیس نیست")

    r = call("GET", "/login", headers={"Cookie": "es_site=" + token})
    ok(r["status"] == 302 and r["headers"]["Location"] == "/easysaz/studio", "وارد شده ← ورود به استودیو می‌رود")
    ok(call("GET", "/account", headers={"Cookie": "es_site=" + token})["status"] == 200, "صفحهٔ حساب با کوکی")
    st, me, _ = site("GET", "/site/api/me", cookie=token)
    ok(st == 200 and me["user"]["id"] == 7 and len(me["sessions"]) == 1 and me["sessions"][0]["current"]
       and me["sessions"][0]["device"]["label"] == "Chrome روی Windows" and isinstance(me["apps"], list),
       "حساب سایت: کاربر، مینی‌اپ‌ها و همین دستگاه")
    st, ss = jcall("GET", "/api/weblogin/sessions")
    ok(st == 200 and len(ss["sessions"]) == 1, "دستگاه‌های واردشده در مینی‌اپ")
    st, _ = jcall("POST", "/api/weblogin/revoke", {"id": ss["sessions"][0]["id"]}, uid=8)
    ok(st == 404, "دستگاه دیگران را نمی‌شود بیرون کرد")
    st, _ = jcall("POST", "/api/weblogin/revoke", {"all": True})
    st, _, hd = site("GET", "/site/api/me", cookie=token)
    ok(st == 401 and "Max-Age=0" in hd.get("Set-Cookie", ""), "خروج از همهٔ دستگاه‌ها از مینی‌اپ ← سایت بیرون می‌شود")

    # رد کردن، انقضا و خروج
    st, lg, _ = site("POST", "/site/api/login/start")
    jcall("POST", "/api/weblogin/inspect", {"code": lg["code"]})
    st, res = jcall("POST", "/api/weblogin/deny", {"code": lg["code"]})
    st, res, _ = site("POST", "/site/api/login/poll", {"code": lg["code"], "poll": lg["poll"]})
    ok(res["status"] == "denied", "«نه، من نبودم» ← سایت رد شدن را می‌بیند")
    st, lg, _ = site("POST", "/site/api/login/start")
    db.execute("UPDATE web_logins SET expires_at = 1 WHERE code = ?", (lg["code"],))
    db.commit()
    st, res, _ = site("POST", "/site/api/login/poll", {"code": lg["code"], "poll": lg["poll"]})
    st2, _ = jcall("POST", "/api/weblogin/inspect", {"code": lg["code"]})
    ok(res["status"] == "expired" and st2 == 410, "کد منقضی‌شده پذیرفته نمی‌شود")
    st, lg, _ = site("POST", "/site/api/login/start")
    jcall("POST", "/api/weblogin/inspect", {"code": lg["code"]})
    jcall("POST", "/api/weblogin/approve", {"code": lg["code"]})
    _, _, hd = site("POST", "/site/api/login/poll", {"code": lg["code"], "poll": lg["poll"]})
    tok2 = hd["Set-Cookie"].split(";")[0].split("=", 1)[1]
    st, _, _ = site("POST", "/site/api/logout", cookie=tok2, es=False)
    ok(st == 403, "خروج بدون X-ES رد می‌شود")
    st, _, hd = site("POST", "/site/api/logout", cookie=tok2)
    st2, _, _ = site("GET", "/site/api/me", cookie=tok2)
    ok(st == 200 and st2 == 401, "خروج همین مرورگر")

    # QR با دوربین معمولی: لینک ربات ← دکمهٔ تأیید در پنل
    st, lg, _ = site("POST", "/site/api/login/start")
    hook(update(f"/start wl_{lg['code']}"))
    btn = calls("SendMessage")[-1]["reply_markup"]["inline_keyboard"][0][0]
    ok(btn["web_app"]["url"].endswith("/panel#weblogin=" + lg["code"]), "لینک QR در ربات ← پنل با صفحهٔ تأیید")


def site_login(uid: int) -> str:
    """ورود به سایت با QR برای کاربر uid؛ توکن کوکی برمی‌گردد."""
    h = {"X-ES": "1"}
    st = json.loads(call("POST", "/site/api/login/start", None, h)["body"])
    jcall("POST", "/api/weblogin/inspect", {"code": st["code"]}, uid=uid)
    jcall("POST", "/api/weblogin/approve", {"code": st["code"]}, uid=uid)
    r = call("POST", "/site/api/login/poll", {"code": st["code"], "poll": st["poll"]}, h)
    return r["headers"]["Set-Cookie"].split(";")[0].split("=", 1)[1]


def test_mag() -> None:
    print("قالب مجله: سایت، مینی‌اپ و خواننده")
    import sqlite3
    uid = 31
    jcall("GET", "/api/me", uid=uid)
    tok = site_login(uid)

    def site(method: str, path: str, body=None, raw: bytes | None = None, extra: dict | None = None):  # noqa: ANN001, ANN202
        h = {"X-ES": "1", "Cookie": "es_site=" + tok, **(extra or {})}
        r = call(method, path, raw if raw is not None else body, h)
        return r["status"], json.loads(r["body"] or b"{}") if r["headers"].get("Content-Type", "").startswith("application/json") else r["body"], r["headers"]

    ok(call("GET", "/studio", headers={"Cookie": "es_site=" + tok})["status"] == 200
       and call("GET", "/studio/12")["status"] == 302, "استودیو فقط با ورود")
    st, apps, _ = site("GET", "/site/api/apps")
    ok(st == 200 and apps["apps"] == [] and any(t["id"] == "mag" for t in apps["templates"]), "استودیو: قالب مجله در فهرست")
    st, res, _ = site("POST", "/site/api/app/create", {"name": "دیجی‌نوشت", "template": "mag"})
    ok(st == 200 and res["app"]["kit"] == "mag", "ساختن مینی‌اپ با قالب مجله از سایت")
    aid, slug = res["app"]["id"], res["app"]["slug"]
    st, app, _ = site("GET", f"/site/api/app?id={aid}")
    ok(st == 200 and [p["id"] for p in app["doc"]["pages"]] == ["home", "cats", "saved", "authors"]
       and app["doc"]["opts"]["mood"] == "news" and len(app["mag_home"]["cats"]) == 3 and len(app["mag_home"]["latest"]) == 1,
       "مجلهٔ تازه: چهار صفحه، سه دسته و مطلب خوش‌آمد")

    # طراحی فقط از سایت
    doc = app["doc"]
    st, _ = jcall("POST", "/api/app/save", {"id": aid, "doc": doc}, uid=uid)
    st2, _ = jcall("POST", "/api/app/publish", {"id": aid, "doc": doc}, uid=uid)
    st3, _ = jcall("POST", "/api/app/remove_kit", {"id": aid}, uid=uid)
    ok(st == st2 == st3 == 403, "مینی‌اپ ایزی‌ساز طراحی مجله را عوض نمی‌کند (ذخیره، انتشار، حذف قالب)")
    shab_doc = dict(doc, kit="shab")
    st, _, _ = site("POST", "/site/api/app/save", {"id": aid, "doc": shab_doc})
    ok(st == 400, "ذخیرهٔ طراحی قالب را عوض نمی‌کند")
    doc["opts"]["mood"] = "classic"
    doc["pages"][0]["blocks"][2]["props"]["layout"] = "grid"
    st, res, _ = site("POST", "/site/api/app/publish", {"id": aid, "doc": doc})
    st2, page = jcall("GET", f"/api/page/{slug}", uid=None)
    ok(st == 200 and page["doc"]["opts"]["mood"] == "classic" and page["doc"]["pages"][0]["blocks"][2]["props"]["layout"] == "grid"
       and len(page["doc"]["pages"]) == 4 and page["mag"]["latest"][0]["title"] == "به مجلهٔ ما خوش آمدی",
       "انتشار طراحی از سایت؛ صفحهٔ خواننده با دادهٔ خانهٔ مجله")

    # محتوا از مینی‌اپ (تلگرام)
    st, data = jcall("GET", f"/api/kit/mag/data?app={aid}", uid=uid)
    cats = {c["name"]: c["id"] for c in data["cats"]}
    ok(st == 200 and data["counts"]["pub"] == 1 and len(data["authors"]) == 1, "دادهٔ مجله در مینی‌اپ")
    body = [{"t": "p", "text": "متن **اول**"}, {"t": "h", "text": "تیتر"}, {"t": "img", "src": "javascript:alert(1)"},
            {"t": "link", "url": "https://example.org", "title": "لینک"}, {"t": "evil", "x": 1}, {"t": "hr"}]
    st, res = jcall("POST", "/api/kit/mag/save", {"app": aid, "title": "عکاسی در شب", "lead": "پنج ترفند",
                                                  "body": body, "cat": cats["آموزش"], "tags": ["#عکاسی", "موبایل شب"], "status": "pub"}, uid=uid)
    p1 = res["post"]
    ok(st == 200 and p1["state"] == "pub" and p1["source"] == "tg" and [b["t"] for b in p1["body"]] == ["p", "h", "link", "hr"]
       and p1["tags"] == ["عکاسی", "موبایل_شب"], "مطلب از تلگرام: بلوک‌ها و برچسب‌ها پاکسازی می‌شوند")
    st, res = jcall("POST", "/api/kit/mag/save", {"app": aid, "title": "پیش‌نویس", "status": "draft"}, uid=uid)
    draft = res["post"]["id"]
    st, res = jcall("POST", "/api/kit/mag/save", {"app": aid, "title": "فردا", "status": "sched", "pub_at": int(time.time()) + 86400}, uid=uid)
    ok(res["post"]["state"] == "sched", "مطلب زمان‌بندی‌شده")
    st, _ = jcall("POST", "/api/kit/mag/cat_save", {"app": aid, "name": "سفر"}, uid=uid)
    ok(st == 403, "دسته‌ها فقط از سایت")
    st, _ = jcall("GET", f"/api/kit/mag/data?app={aid}", uid=8)
    ok(st == 404, "مجلهٔ دیگران دیده نمی‌شود")

    # خواننده
    st, lst = jcall("GET", f"/api/page/{slug}/mag/list", uid=None)
    titles = [p["title"] for p in lst["posts"]]
    ok(st == 200 and "عکاسی در شب" in titles and "پیش‌نویس" not in titles and "فردا" not in titles,
       "خواننده پیش‌نویس و زمان‌بندی‌شده را نمی‌بیند")
    st, lst = jcall("GET", f"/api/page/{slug}/mag/list?cat={cats['آموزش']}", uid=None)
    st2, lst2 = jcall("GET", f"/api/page/{slug}/mag/list?tag=" + quote("موبایل_شب"), uid=None)
    st3, lst3 = jcall("GET", f"/api/page/{slug}/mag/list?q=" + quote("ترفند"), uid=None)
    ok(len(lst["posts"]) == 2 and [p["id"] for p in lst2["posts"]] == [p1["id"]] and [p["id"] for p in lst3["posts"]] == [p1["id"]],
       "فیلتر دسته، برچسب و جستجو")
    st, one = jcall("GET", f"/api/page/{slug}/mag/post?id={p1['id']}&v=1", uid=None)
    st2, _ = jcall("GET", f"/api/page/{slug}/mag/post?id={draft}", uid=None)
    ok(st == 200 and one["post"]["body"][0]["text"] == "متن **اول**" and st2 == 404, "متن کامل مطلب؛ پیش‌نویس نه")
    st, data = jcall("GET", f"/api/kit/mag/data?app={aid}", uid=uid)
    ok(next(p for p in data["posts"] if p["id"] == p1["id"])["views"] == 1, "شمارش بازدید مطلب")

    # دسته و نویسنده از سایت
    st, res, _ = site("POST", "/site/api/mag/cat_save", {"app": aid, "name": "سفر", "color": "#12A071", "icon": "globe"})
    ok(st == 200 and res["id"].startswith("c"), "دستهٔ تازه از سایت")
    st, _, _ = site("POST", "/site/api/mag/cat_delete", {"app": aid, "id": cats["آموزش"]})
    st2, one = jcall("GET", f"/api/page/{slug}/mag/post?id={p1['id']}", uid=None)
    ok(st == 200 and one["post"]["cat"] == "", "حذف دسته: مطلب‌هایش بی‌دسته می‌شوند")
    st, res, _ = site("POST", "/site/api/mag/author_save", {"app": aid, "name": "سارا", "bio": "عکاس"})
    st2, res2, _ = site("POST", "/site/api/mag/save", {"app": aid, "id": p1["id"], "title": "عکاسی در شب", "author": res["id"], "status": "pub", "body": body})
    ok(st == 200 and res2["post"]["author"] == res["id"] and res2["post"]["source"] == "tg", "نویسندهٔ تازه؛ منبع مطلب عوض نمی‌شود")
    st, _, _ = site("POST", "/site/api/mag/author_delete", {"app": aid, "id": res["id"]})
    ok(st == 400, "نویسندهٔ دارای مطلب پاک نمی‌شود")

    # صوت و ویدیو
    mp3 = b"ID3\x03\x00\x00\x00" + b"\x00" * 200
    st, res, _ = site("POST", "/site/api/upload_media", raw=mp3, extra={"Content-Type": "audio/mpeg"})
    ok(st == 200 and res["url"].endswith(".mp3") and res["kind"] == "audio", "آپلود صوت از سایت")
    name = res["url"].rsplit("/", 1)[1]
    r = call("GET", "/u/" + name, headers={"Range": "bytes=0-3"})
    ok(r["status"] == 206 and r["body"] == b"ID3\x03" and r["headers"]["Content-Range"] == f"bytes 0-3/{len(mp3)}",
       "پخش صوت با Range")
    st, _, _ = site("POST", "/site/api/upload_media", raw=b"<html>not media</html>")
    ok(st == 400, "فایل غیرصوتی/تصویری رد می‌شود")
    r = call("POST", "/api/upload_media", b"\x00\x00\x00\x18ftypisom" + b"\x00" * 64, {"X-Init-Data": init_data(uid)})
    ok(r["status"] == 200 and json.loads(r["body"])["url"].endswith(".mp4"), "آپلود ویدیو از مینی‌اپ")

    # لینک عمیق و پست کانال (ربات در حالت کنترل کامل)
    db = sqlite3.connect(os.environ["DB_PATH"])
    db.execute("UPDATE apps SET bot_id = 2000002, bot_username = 'cafe_bot', bot_token_enc = ?, mode = 'full', "
               "channel_id = -1001234567890, channel_title = 'Kaboos' WHERE id = ?", (secure.encrypt_token(CLIENT_TOKEN), aid))
    db.commit()
    upd = update(f"/start a_{p1['id']}", uid=77)
    call("POST", "/hook/2000002", upd, {"X-Telegram-Bot-Api-Secret-Token": secure.client_hook_secret(2000002)})
    btn = calls("SendMessage", 2000002)[-1]["reply_markup"]["inline_keyboard"][0][0]
    ok(btn["web_app"]["url"].endswith(f"/a/{slug}#post={p1['id']}"), "لینک پست کانال (start=a_…) همان مطلب را باز می‌کند")
    st, res, _ = site("POST", "/site/api/mag/channel_post", {"app": aid, "id": draft})
    ok(st == 400, "پیش‌نویس به کانال نمی‌رود")
    st, res, _ = site("POST", "/site/api/mag/channel_post", {"app": aid, "id": p1["id"], "text": "متن پست", "button": "بخوان"})
    sent = calls("SendMessage", 2000002)[-1]
    ok(st == 200 and sent["chat_id"] == -1001234567890 and "start=a_" + p1["id"] in sent["reply_markup"]["inline_keyboard"][0][0]["url"]
       and "بخوان" in sent["reply_markup"]["inline_keyboard"][0][0]["text"], "پست کانال با دکمهٔ لینک عمیق")
    st, data = jcall("GET", f"/api/kit/mag/data?app={aid}", uid=uid)
    ok(next(p for p in data["posts"] if p["id"] == p1["id"])["link"] == f"https://t.me/cafe_bot?start=a_{p1['id']}",
       "لینک هر مطلب در دادهٔ صاحب")
    st, _ = jcall("POST", "/api/kit/mag/delete", {"app": aid, "id": draft}, uid=uid)
    st2, _ = jcall("GET", f"/api/kit/mag/get?app={aid}&id={draft}", uid=uid)
    ok(st == 200 and st2 == 404, "حذف مطلب از مینی‌اپ")

    # استودیوی مینی‌اپ: پنهان، پس‌زمینه، سربرگ و نوار پایین؛ نسخهٔ منتشرشده برای فهرست تغییرها
    d2 = json.loads(json.dumps(doc))
    d2["pages"][0]["blocks"][0]["hidden"] = True
    d2["theme"].update({"bg": "gradient", "bg_color": "#FFF4EC", "bg_image": "javascript:x"})
    d2["header"].update({"style": "cover", "cover": "https://example.org/c.jpg", "sticky": False, "search": False})
    d2["tabbar"]["labels"] = False
    st, res, _ = site("POST", "/site/api/app/save", {"id": aid, "doc": d2})
    sd = res["doc"]
    ok(st == 200 and sd["pages"][0]["blocks"][0].get("hidden") is True and sd["theme"]["bg"] == "gradient"
       and sd["theme"]["bg_color"] == "#FFF4EC" and sd["theme"]["bg_image"] == "" and sd["header"]["style"] == "cover"
       and sd["header"]["sticky"] is False and sd["tabbar"]["labels"] is False, "طراحی تازه ذخیره می‌شود (بخش پنهان، گرادیان، کاور، بی‌نام)")
    st, app2, _ = site("GET", f"/site/api/app?id={aid}")
    ok(app2["published"]["pages"][0]["blocks"][0].get("hidden") is None and app2["app"]["dirty"] and len(app2["demo_mag"]["latest"]) == 5,
       "استودیو نسخهٔ منتشرشده را برای «تغییرهای منتشرنشده» می‌دهد")
    hid = sd["pages"][0]["blocks"][0]["id"]
    site("POST", "/site/api/app/publish", {"id": aid, "doc": sd})
    st, page = jcall("GET", f"/api/page/{slug}", uid=None)
    ok(all(b["id"] != hid for b in page["doc"]["pages"][0]["blocks"]) and page["doc"]["header"]["style"] == "cover",
       "بخش پنهان به خواننده نمی‌رسد")
    st, apps, _ = site("GET", "/site/api/apps")
    tpl = {t["id"]: t for t in apps["templates"]}
    ok("{name}" not in json.dumps(tpl["mag"]["doc"], ensure_ascii=False) and tpl["mag"]["parts"] >= 4 and apps["demo"]["mag"]["cats"],
       "گالری قالب‌ها: سند پیش‌نمایش و دادهٔ نمایشی")
    ok(call("GET", "/studio/templates", headers={"Cookie": "es_site=" + tok})["status"] == 200, "صفحهٔ قالب‌ها")

    r = call("GET", f"/studio/{aid}/design", headers={"Cookie": "es_site=" + tok})
    ok(r["status"] == 200 and b"site/static/studio.js?v=" in r["body"] and b"static/render.js" in r["body"], "صفحهٔ استودیو با موتور پیش‌نمایش")
    st, _, _ = site("POST", "/site/api/app/save", {"id": aid, "doc": doc}, extra={"Cookie": "es_site=bad"})
    ok(st == 401, "استودیو بدون نشست معتبر کاری نمی‌کند")
    st, res, _ = site("POST", "/site/api/app/template", {"id": aid, "template": "shab"})
    left = sqlite3.connect(os.environ["DB_PATH"]).execute("SELECT COUNT(*) FROM mag_posts WHERE app_id = ?", (aid,)).fetchone()[0]
    ok(st == 200 and res["doc"]["kit"] == "shab" and left == 0, "عوض کردن قالب از سایت: دادهٔ مجله پاک می‌شود")
    st, _ = jcall("POST", "/api/app/save", {"id": aid, "doc": res["doc"]}, uid=uid)
    ok(st == 200, "بعد از قالب قسمت، مینی‌اپ دوباره طراحی را ذخیره می‌کند")


# ---------------------------------------------------------------- ربات‌ساز
def init_data_p(user_id: int, premium: bool) -> str:
    fields = {
        "auth_date": str(int(time.time())),
        "query_id": "AAE",
        "user": json.dumps({"id": user_id, "first_name": "Ali", "is_premium": premium}, separators=(",", ":")),
    }
    check = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret = hmac.new(b"WebAppData", MAIN_TOKEN.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(fields, quote_via=quote)


def chook(upd: dict, bot_id: int = 2000002) -> int:
    return call("POST", f"/hook/{bot_id}", upd, {"X-Telegram-Bot-Api-Secret-Token": secure.client_hook_secret(bot_id)})["status"]


def cmsg(uid: int, **fields) -> dict:
    _UPD[0] += 1
    msg = {"message_id": _UPD[0], "date": int(time.time()), "chat": {"id": uid, "type": "private"},
           "from": {"id": uid, "is_bot": False, "first_name": "Sara", "username": "sara"}}
    msg.update(fields)
    if str(fields.get("text", "")).startswith("/"):
        msg["entities"] = [{"type": "bot_command", "offset": 0, "length": len(fields["text"].split()[0])}]
    return {"update_id": _UPD[0], "message": msg}


def ccb(uid: int, data: str, text: str = "…") -> dict:
    _UPD[0] += 1
    return {"update_id": _UPD[0], "callback_query": {
        "id": str(_UPD[0]), "from": {"id": uid, "is_bot": False, "first_name": "Sara"}, "chat_instance": "x", "data": data,
        "message": {"message_id": 77, "date": int(time.time()), "chat": {"id": uid, "type": "private"}, "text": text}}}


BOT_DOC = {
    "start": "m_welcome",
    "fallback": "m_dunno",
    "vars": [
        {"name": "امتیاز", "type": "number", "scope": "user", "init": "0"},
        {"name": "قیمت", "type": "number", "scope": "bot", "init": "480000"},
        {"name": "تعداد", "type": "number", "scope": "user", "init": "2"},
        {"name": "جمع", "type": "number", "formula": "{قیمت} × {تعداد} − ۱۰٪"},
        {"name": "شماره", "type": "text"},
    ],
    "msgs": [
        {"id": "m_welcome", "name": "خوش‌آمد",
         "text": '<div>سلام {نام} <tg-emoji emoji-id="5368324170671202286">📷</tg-emoji></div><div>جمع: <b>{جمع}</b></div><script>x</script>',
         "kb": "inline", "opts": {"effect": "🎉"},
         "rows": [[{"id": "b_more", "text": "📚 دوره‌ها", "style": "primary", "icon": "5368324170671202286",
                    "act": {"type": "goto", "to": "m_more", "set": {"var": "امتیاز", "op": "+", "value": "10"}}},
                   {"id": "b_copy", "text": "📋 کپی", "style": "success", "act": {"type": "copy", "text": "CODE-{شناسه}"}}],
                  [{"id": "b_url", "text": "سایت", "act": {"type": "url", "url": "https://example.org"}},
                   {"id": "b_js", "text": "بد", "style": "purple", "act": {"type": "url", "url": "javascript:alert(1)"}}],
                  [{"id": "b_app", "text": "مینی‌اپ", "act": {"type": "app"}},
                   {"id": "b_share", "text": "معرفی", "act": {"type": "share", "text": "این ربات رو ببین"}}],
                  [{"id": "b_alert", "text": "؟", "act": {"type": "alert", "text": "امتیاز تو: {امتیاز}", "popup": True}},
                   {"id": "b_pay", "text": "⭐ خرید", "act": {"type": "pay", "stars": 50, "title": "دوره", "to": "m_more"}},
                   {"id": "b_sup", "text": "پشتیبانی", "style": "danger", "act": {"type": "goto", "to": "m_sup"}}]]},
        {"id": "m_more", "name": "دوره‌ها", "text": "امتیاز تو: {امتیاز}", "kb": "inline", "then": "m_menu",
         "rows": [[{"id": "b_back", "text": "↩️", "act": {"type": "goto", "to": "m_welcome"}}]]},
        {"id": "m_menu", "name": "منوی پایین", "text": "از منو انتخاب کن", "kb": "reply",
         "kbopt": {"resize": True, "placeholder": "یکی را بزن"},
         "keys": [[{"id": "k_phone", "text": "📱 شماره", "style": "success", "act": {"type": "contact", "var": "شماره", "to": "m_thanks"}}],
                  [{"id": "k_more", "text": "📚 دوره‌ها", "act": {"type": "text", "to": "m_more"}},
                   {"id": "k_loc", "text": "📍", "act": {"type": "location", "to": "m_thanks"}}]]},
        {"id": "m_thanks", "name": "ممنون", "text": "شماره‌ات {شماره} ثبت شد", "opts": {"remove_kb": True}},
        {"id": "m_help", "name": "راهنما", "text": "راهنما", "cmd": "/help", "kw": ["کمک"]},
        {"id": "m_sup", "name": "پشتیبانی", "text": "پیامت را بنویس", "wait": {"kind": "support", "to": "m_got"}},
        {"id": "m_got", "name": "رسید", "text": "رسید ✅"},
        {"id": "m_dunno", "name": "نفهمیدم", "text": "نفهمیدم 🙂", "then": "m_ghost"},
        {"id": "BAD ID", "name": "x", "text": "x"},
    ],
}


def test_botkit() -> None:  # noqa: C901
    print("ربات‌ساز")
    import sqlite3

    from app.botkit import engine, schema

    ok(schema.clean_html('<b>a<i>b</b>c</i><script>x</script><a href="javascript:x">y</a>') == "<b>a<i>b</i></b>cy",
       "متن: فقط HTML مجاز تلگرام، برچسب‌ها درست بسته می‌شوند، اسکریپت و لینک خطرناک حذف")
    g = {"قیمت": 480000, "تعداد": 2}.get
    ok(schema.evaluate("{قیمت} × {تعداد} − ۱۰٪", g) == 864000 and schema.evaluate("گرد(۲.۶) + کمینه(۳، ۷)", g) == 6,
       "فرمول امن: ضرب، درصد مثل ماشین‌حساب، تابع‌ها، ارقام فارسی")
    try:
        schema.evaluate("__import__('os')", g)
        ok(False, "فرمول مخرب")
    except schema.FormulaError:
        ok(True, "فرمول مخرب پذیرفته نمی‌شود")
    ok(schema.fa_number(864000) == "۸۶۴٬۰۰۰" and engine.jalali(2026, 10, 1) == (1405, 7, 9), "عدد فارسی با جداکننده و تاریخ شمسی")

    con = sqlite3.connect(os.environ["DB_PATH"])
    app_id, slug = con.execute("SELECT id, slug FROM apps WHERE owner_id = 7 ORDER BY id").fetchone()
    st, res = jcall("GET", f"/api/bot?id={app_id}")
    ok(st == 200 and res["fresh"] and res["doc"]["start"] == "m_welcome" and not res["bot"]["connected"],
       "ربات تازه: سند آغازین با پیام خوش‌آمد")
    st, res = jcall("GET", f"/api/bot?id={app_id}", uid=8)
    ok(st == 404, "ربات‌ساز مینی‌اپ دیگران در دسترس نیست")

    st, res = jcall("POST", "/api/bot/save", {"id": app_id, "doc": BOT_DOC})
    doc = res["doc"]
    ids = [m["id"] for m in doc["msgs"]]
    w = doc["msgs"][0]
    ok(st == 200 and "BAD ID" not in ids and doc["msgs"][-1]["then"] == "" and "<script>" not in w["text"]
       and w["rows"][1][1]["style"] == "" and w["rows"][1][1]["act"]["url"] == "", "ذخیره: شناسهٔ بد، ارجاع ناموجود، رنگ و لینک نامعتبر پاک می‌شوند")
    ok(next(v for v in doc["vars"] if v["name"] == "جمع")["formula"] and w["rows"][0][0]["act"]["set"]["op"] == "+",
       "متغیر فرمولی و تغییر متغیر با دکمه ذخیره می‌شوند")

    st, res = jcall("POST", "/api/bot/test", {"id": app_id})
    ok(st == 400 and "وصل" in res["error"], "تست بدون ربات وصل‌شده ممکن نیست")
    # وصل کردن دوبارهٔ ربات (در حالت منو)
    hook(update("", callback="connect"))
    hook(update(CLIENT_TOKEN))
    hook(update("", callback=f"mode:{app_id}:menu"))
    st, res = jcall("POST", "/api/bot/test", {"id": app_id})
    ok(st == 409 and res["error"] == "need_full", "تست در حالت منو: اول اجازهٔ اجرای ربات روی ایزی‌ساز")
    st, res = jcall("POST", "/api/bot/takeover", {"id": app_id})
    ok(st == 200 and res["bot"]["mode"] == "full" and FakeSession.webhooks.get("2000002", "").endswith("/hook/2000002"), "اجرای ربات روی ایزی‌ساز")
    wh = calls("SetWebhook", 2000002)[-1]
    ok("pre_checkout_query" in wh["allowed_updates"], "وبهوک پرداخت ستاره را هم می‌گیرد")

    n0 = len(FakeSession.calls)
    st, res = jcall("POST", "/api/bot/test", {"id": app_id, "doc": BOT_DOC})
    sent = [p for b, m, p in FakeSession.calls[n0:] if b == "2000002" and m == "SendMessage"]
    ok(st == 200 and res["link"] == "https://t.me/cafe_bot" and len(sent) == 2 and "حالت تست" in sent[0]["text"],
       "تست: پیام حالت تست و پیام شروع در چت واقعی صاحب ربات")
    wl = sent[1]
    kb = wl["reply_markup"]["inline_keyboard"]
    ok("سلام Ali" in wl["text"] and "۸۶۴٬۰۰۰" in wl["text"] and "tg-emoji" not in wl["text"] and "📷" in wl["text"],
       "متغیرها و فرمول جایگذاری؛ بدون پریمیوم ایموجی سفارشی معمولی می‌شود")
    ok(kb[0][0]["style"] == "primary" and "icon_custom_emoji_id" not in kb[0][0] and kb[0][0]["callback_data"] == "bk|g|m_welcome|b_more"
       and kb[0][1]["copy_text"]["text"] == "CODE-7" and kb[2][0]["web_app"]["url"].endswith(f"/a/{slug}")
       and kb[2][1]["url"].startswith("https://t.me/share/url?url=https%3A%2F%2Ft.me%2Fcafe_bot") and wl.get("message_effect_id") == schema.EFFECTS["🎉"],
       "دکمه‌ها: رنگ، کپی با متغیر، مینی‌اپ، اشتراک، افکت پیام")

    # دکمهٔ شیشه‌ای: جای پیام قبلی + تغییر متغیر + پیام بعدی با کیبورد
    n0 = len(FakeSession.calls)
    chook(ccb(7, "bk|g|m_welcome|b_more"))
    new = FakeSession.calls[n0:]
    ed = [p for b, m, p in new if m == "EditMessageText"]
    rk = [p for b, m, p in new if m == "SendMessage"]
    ok(ed and ed[0]["message_id"] == 77 and "۱۰" in ed[0]["text"], "دکمه پیام بعدی را جای همان پیام می‌نشاند و متغیر را تغییر می‌دهد")
    ok(rk and rk[0]["reply_markup"]["keyboard"][0][0]["request_contact"] and rk[0]["reply_markup"]["input_field_placeholder"] == "یکی را بزن",
       "پیام بعدی همان مرحله با کیبورد (درخواست شماره)")
    chook(ccb(7, "bk|a|m_welcome|b_alert"))
    ans = calls("AnswerCallbackQuery", 2000002)[-1]
    ok(ans.get("show_alert") and "۱۰" in ans["text"], "پیام کوتاه بالای چت با متغیر")
    chook(ccb(7, "bk|p|m_welcome|b_pay"))
    inv = calls("SendInvoice", 2000002)[-1]
    ok(inv["currency"] == "XTR" and inv["prices"][0]["amount"] == 50, "پرداخت ستاره: صورت‌حساب XTR")

    # کاربر عادی تا انتشار نسخهٔ ساده را می‌بیند
    n0 = len(FakeSession.calls)
    chook(cmsg(55, text="/start"))
    s55 = [p for b, m, p in FakeSession.calls[n0:] if m == "SendMessage"]
    ok(s55 and s55[-1]["reply_markup"]["inline_keyboard"][0][0].get("web_app"), "پیش‌نویس به کاربرها نمی‌رسد")

    con.execute("UPDATE users SET is_premium = 1 WHERE tg_id = 7")
    con.commit()
    r = call("POST", "/api/bot/publish", {"id": app_id, "doc": BOT_DOC}, {"X-Init-Data": init_data_p(7, True)})
    ok(r["status"] == 200 and json.loads(r["body"])["bot"]["live"], "انتشار")
    n0 = len(FakeSession.calls)
    chook(cmsg(55, text="/start"))
    s55 = [p for b, m, p in FakeSession.calls[n0:] if m == "SendMessage"]
    ok(s55 and "tg-emoji emoji-id" in s55[-1]["text"] and s55[-1]["reply_markup"]["inline_keyboard"][0][0]["icon_custom_emoji_id"],
       "سازندهٔ پریمیوم: ایموجی سفارشی در متن و آیکن دکمه")
    chook(cmsg(55, text="/help"))
    ok(calls("SendMessage", 2000002)[-1]["text"] == "راهنما", "دستور /help")
    chook(cmsg(55, text="یه کمک می‌خوام"))
    ok(calls("SendMessage", 2000002)[-1]["text"] == "راهنما", "کلمهٔ کلیدی")
    chook(cmsg(55, text="📚 دوره‌ها"))
    ok("امتیاز تو" in calls("SendMessage", 2000002)[-2]["text"], "دکمهٔ کیبورد پیامش را می‌فرستد")
    chook(cmsg(55, contact={"phone_number": "+989121234567", "first_name": "Sara", "user_id": 55}))
    last = calls("SendMessage", 2000002)[-1]
    ok("+989121234567" in last["text"] and last["reply_markup"].get("remove_keyboard"), "شماره در متغیر ذخیره و کیبورد برداشته می‌شود")
    chook(cmsg(55, text="چیز عجیب"))
    ok(calls("SendMessage", 2000002)[-1]["text"] == "نفهمیدم 🙂", "پیام «هر چیز دیگر»")

    # پشتیبانی: پیام کاربر به صاحب، جواب صاحب به کاربر
    chook(ccb(55, "bk|g|m_welcome|b_sup"))
    n0 = len(FakeSession.calls)
    chook(cmsg(55, text="کلاس کی شروع میشه؟"))
    cp = [p for b, m, p in FakeSession.calls[n0:] if m == "CopyMessage"]
    ok(cp and cp[0]["chat_id"] == 7 and calls("SendMessage", 2000002)[-1]["text"] == "رسید ✅", "پشتیبانی: پیام کاربر برای صاحب ربات کپی می‌شود")
    admin_msg = con.execute("SELECT admin_msg FROM bk_support WHERE app_id = ?", (app_id,)).fetchone()[0]
    chook(cmsg(7, text="شنبه ساعت ۱۰", reply_to_message={"message_id": admin_msg, "date": int(time.time()), "chat": {"id": 7, "type": "private"}, "text": "x"}))
    ok(calls("CopyMessage", 2000002)[-1]["chat_id"] == 55, "جواب صاحب ربات به همان کاربر می‌رسد")

    chook(cmsg(7, text="/exit"))
    ok("بیرون آمدی" in calls("SendMessage", 2000002)[-2]["text"], "خروج از حالت تست")

    # ایموجی پریمیوم از ربات اصلی
    hook(update(f"/start emoji_{app_id}"))
    ok("ایموجی‌هایت" in calls("SendMessage", 1000001)[-1]["text"], "ربات اصلی ایموجی پریمیوم می‌خواهد")
    up = update("🔥 t.me/addemoji/SaraIcons")
    up["message"]["entities"] = [{"type": "custom_emoji", "offset": 0, "length": 2, "custom_emoji_id": "5111111111111111111"}]
    hook(up)
    ok("ذخیره شد" in calls("SendMessage", 1000001)[-1]["text"], "ایموجی و بسته ذخیره می‌شوند")
    hook(update("/start"))
    ok("EasySaz" in calls("SendMessage", 1000001)[-1]["text"], "وسط افزودن ایموجی، /start کار خودش را می‌کند")
    hook(update(f"/start emoji_{app_id}"))
    hook(update("", callback="bkemoji:done"))
    ok(calls("SendMessage", 1000001)[-1]["reply_markup"]["inline_keyboard"][0][0]["web_app"]["url"].endswith(f"#bot={app_id}&tab=emoji"),
       "برگشت به ربات‌ساز از چت ایزی‌ساز")
    st, res = jcall("GET", f"/api/bot?id={app_id}")
    ok(len(res["emoji"]) == 4 and res["emoji"][0]["id"] == "5111111111111111111", "کتابخانهٔ ایموجی در ربات‌ساز")
    st, res = jcall("POST", "/api/bot/emoji_del", {"id": app_id, "emoji": "5111111111111111111"})
    st, res = jcall("POST", "/api/bot/emoji_pack", {"id": app_id, "link": "https://t.me/addemoji/Other"})
    ok(st == 200 and len(res["emoji"]) == 3 and res["added"] == 0, "حذف ایموجی و بستهٔ تکراری")

    st, res = jcall("POST", "/api/bot/off", {"id": app_id})
    n0 = len(FakeSession.calls)
    chook(cmsg(56, text="/start"))
    s56 = [p for b, m, p in FakeSession.calls[n0:] if m == "SendMessage"]
    ok(st == 200 and s56 and s56[-1]["reply_markup"]["inline_keyboard"][0][0].get("web_app"), "خاموش کردن ربات‌ساز: خوش‌آمد ساده")

    # ساخت ربات با یک دکمه
    hook(update(f"/start newbot_{app_id}"))
    btn = calls("SendMessage", 1000001)[-1]["reply_markup"]["keyboard"][0][0]
    ok(btn["request_managed_bot"]["request_id"] == 1, "دکمهٔ ساخت ربات مدیریت‌شده")
    up = update("")
    up["message"].pop("text")
    up["message"]["managed_bot_created"] = {"bot": {"id": 3000003, "is_bot": True, "first_name": "New", "username": "new_bot"}}
    hook(up)
    row = con.execute("SELECT bot_id, bot_username, mode FROM apps WHERE id = ?", (app_id,)).fetchone()
    ok(row == (3000003, "new_bot", "full") and calls("GetManagedBotToken", 1000001), "ربات تازه ساخته، توکنش گرفته و در حالت کامل وصل شد")


if __name__ == "__main__":
    test_blocks()
    test_auth()
    test_web()
    test_bot()
    test_botkit()
    test_site()
    test_mag()
    print(f"\nهمه {PASSED} تست گذشت ✅")
