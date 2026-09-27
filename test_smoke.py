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
    ok(len(templates.TEMPLATES) >= 6 and any(t["premium"] for t in templates.TEMPLATES), "همهٔ قالب‌ها معتبرند و دسته دارند")
    ok(set(blocks.CATALOG_ORDER) == set(blocks.SCHEMA) and all(b["cat"] in blocks.CATEGORIES for b in blocks.SCHEMA.values()), "هر کامپوننت دسته و جای کاتالوگ دارد")
    # سبک‌های آماده: هر کدام باید دست‌نخورده از پاکسازی سرور رد شود و فقط فیلدهای ظاهری را عوض کند
    for btype, variants in blocks.VARIANTS.items():
        looks = {f["key"] for f in blocks.SCHEMA[btype]["fields"] if f.get("look")}
        ids = [v["id"] for v in variants]
        assert len(ids) == len(set(ids)) >= 2, btype
        for v in variants:
            assert set(v["props"]) <= looks, (btype, v["id"])
            props = dict(blocks.default_props(btype), **v["props"])
            doc = {"pages": [{"blocks": [{"id": "bvar00001", "type": btype, "props": props, "style": v["style"]}]}]}
            out = blocks.clean_page(doc, max_blocks=10, premium=True)["pages"][0]["blocks"][0]
            assert all(out["props"][k] == val for k, val in v["props"].items()), (btype, v["id"])
            assert out.get("style", {}) == v["style"], (btype, v["id"], out.get("style"))
    ok(set(blocks.VARIANTS) == set(blocks.SCHEMA), "همهٔ سبک‌های آماده معتبرند و هر کامپوننت سبک دارد")


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
    ok(st == 200 and res["doc"]["pages"][0]["blocks"] == [], "ساخت اپ با صفحه خالی")
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
    free_tpl = next(t for t in tp["templates"] if not t["premium"])
    st, _ = jcall("POST", "/api/app/save", {"id": app_id, "doc": free_tpl["doc"]})
    ok(st == 200, "قالب رایگان در پلن رایگان ذخیره می‌شود")
    pro_tpl = next(t for t in tp["templates"] if t["premium"])
    st, _ = jcall("POST", "/api/app/save", {"id": app_id, "doc": pro_tpl["doc"]})
    ok(st == 402, "قالب PRO در پلن رایگان ذخیره نمی‌شود")

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


if __name__ == "__main__":
    test_blocks()
    test_auth()
    test_web()
    test_bot()
    print(f"\nهمه {PASSED} تست گذشت ✅")
