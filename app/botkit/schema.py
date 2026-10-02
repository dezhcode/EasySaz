"""سند ربات‌ساز: پیام‌ها، دکمه‌ها، کیبورد، متغیرها و اجزای آماده.

ربات = چند «پیام» که با «دکمه» به هم وصل‌اند. سند از پنل می‌آید و قبل از
ذخیره کامل پاک‌سازی می‌شود: هر چه این‌جا قبول شود، موتور (engine.py) بی‌دردسر
به تلگرام می‌فرستد.

  {"v": 1, "start": "<پیام شروع>", "fallback": "<پیام برای هر چیز دیگر>",
   "msgs": [پیام…], "vars": [متغیر…], "comps": [جزء…]}

پیام:
  id, name, text (HTML مجاز تلگرام + {متغیر})، media {type, url}،
  kb: none | inline | reply ، rows (دکمه‌های شیشه‌ای) ، keys (دکمه‌های کیبورد)،
  kbopt {resize, once, persist, placeholder} ، opts {replace, typing, effect,
  preview, silent, protect, remove_kb} ، cmd (/help) ، kw [کلمه…] ،
  then (پیام بعدی در همان مرحله) ، wait {kind: var|support, var, to} ، group (جزء)

کارها (steps): پیش از فرستادن پیام به ترتیب اجرا می‌شوند؛ شرط و تصادفی می‌توانند به پیام دیگری بپرند.
  if{rules[{k: var|tag|hour|day|member, a, op, b}], mode: and|or, yes, no}  calc{var, op: =|+|-, value}
  random{to[…]}  delay{sec}  member{chat, no}  notify{text}  tag{tag, op: add|remove}
  save{form, vars[…], notify}
پرسش: wait{kind: var, var, to, check: text|number|phone|email|date|photo|choice, min, max, choices[…], error}

دکمهٔ شیشه‌ای: {id, text, style, icon, act}
  act: goto{to, set?} | url{url} | copy{text} | app{url} | share{text}
       | pay{stars, title, to} | alert{text, popup} | none
دکمهٔ کیبورد: {id, text, style, icon, act}
  act: text{to, set?} | contact{var, to} | location{var, to} | user{var, to}
       | chat{var, to} | poll{to} | app{url}
"""
from __future__ import annotations

import html
import math
import random
import re
from html.parser import HTMLParser

MAX_MSGS = 120
MAX_ROWS = 12
MAX_PER_ROW = 8
MAX_VARS = 60
MAX_COMPS = 30
MAX_TEXT = 3800          # پیش از جایگذاری متغیرها؛ سقف تلگرام ۴۰۹۶ است
MAX_CAPTION = 1000

ID_RE = re.compile(r"^[a-z][a-z0-9_]{2,24}$")
VAR_RE = re.compile(r"^[\w‌ ؟?]{1,24}$")
CMD_RE = re.compile(r"^/[a-z0-9_]{1,32}$")
EMOJI_ID_RE = re.compile(r"^\d{5,24}$")
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f‪-‮⁦-⁩]")

STYLES = ("", "primary", "success", "danger")
INLINE_ACTS = ("goto", "url", "copy", "app", "share", "pay", "alert", "shop", "cart", "none")
KEY_ACTS = ("text", "contact", "location", "user", "chat", "poll", "app")
MEDIA_TYPES = ("photo", "video")
VAR_TYPES = ("text", "number", "bool", "date")
# افکت‌های پیام تلگرام (فقط چت خصوصی)
EFFECTS = {
    "🔥": "5104841245755180586", "👍": "5107584321108051014", "👎": "5104858069142078462",
    "❤️": "5159385139981059251", "🎉": "5046509860389126442", "💩": "5046589136895476101",
}

STEP_TYPES = ("if", "calc", "random", "delay", "member", "notify", "tag", "save")
CHECKS = ("text", "number", "phone", "email", "date", "photo", "choice")
RULE_KINDS = ("var", "tag", "hour", "day", "member")
RULE_OPS = ("=", "!=", ">", "<", ">=", "<=", "has", "empty", "filled", "in", "not")
MAX_STEPS = 12
MAX_DELAY = 30 * 86400
CHAT_RE = re.compile(r"^(@[A-Za-z][A-Za-z0-9_]{3,31}|-100\d{6,14})$")

# متغیرهای آماده از تلگرام (نامشان در متن مثل {نام})
BUILTINS = ("نام", "نام کامل", "یوزرنیم", "شناسه", "تاریخ امروز", "ساعت")


class BotDocError(Exception):
    pass


# ---------------------------------------------------------------- ابزار
def _s(value: object, limit: int) -> str:
    return _CTRL.sub("", str(value if value is not None else "")).strip()[:limit]


def _one_line(value: object, limit: int) -> str:
    return re.sub(r"\s+", " ", _s(value, limit * 2))[:limit].strip()


def _id(value: object) -> str:
    v = str(value or "")
    return v if ID_RE.match(v) else ""


def _url(value: object, allow_tg: bool = True) -> str:
    v = _s(value, 512).replace(" ", "%20")
    if v.startswith("https://") or v.startswith("http://") or (allow_tg and v.startswith("tg://")):
        return v if '"' not in v and "<" not in v else ""
    return ""


def _https(value: object) -> str:
    v = _url(value, allow_tg=False)
    return v if v.startswith("https://") else ""


def _var_name(value: object) -> str:
    v = _one_line(value, 24).strip("{} ")
    return v if v and VAR_RE.match(v) else ""


# ---------------------------------------------------------------- متن (HTML تلگرام)
_SIMPLE = {"b": "b", "strong": "b", "i": "i", "em": "i", "u": "u", "ins": "u", "s": "s", "strike": "s",
           "del": "s", "code": "code", "pre": "pre", "tg-spoiler": "tg-spoiler"}
_BLOCK_BREAK = {"div", "p", "li", "h1", "h2", "h3"}


class _Sanitizer(HTMLParser):
    """فقط زیرمجموعهٔ HTML تلگرام؛ هر چیز دیگر متن ساده می‌شود. برچسب‌ها همیشه
    درست بسته می‌شوند تا تلگرام پیام را رد نکند."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self.stack: list[tuple[str, str | None]] = []   # (برچسب ورودی، برچسب خروجی یا None)
        self.skip = 0                                    # داخل script/style
        self.open: list[str] = []           # برچسب‌های باز خروجی

    def _push(self, tag: str, attrs: str = "") -> str:
        self.out.append(f"<{tag}{attrs}>")
        self.open.append(tag)
        return tag

    def handle_starttag(self, tag, attrs):  # noqa: ANN001, ANN201, C901
        a = dict(attrs)
        tag = tag.lower()
        if tag in ("script", "style"):
            self.skip += 1
            return
        if tag == "br":
            self.out.append("\n")
            return
        if tag in _BLOCK_BREAK:
            if self.out and not "".join(self.out).endswith("\n"):
                self.out.append("\n")
            self.stack.append((tag, None))
            return
        out = None
        if tag in _SIMPLE and _SIMPLE[tag] not in self.open:
            out = self._push(_SIMPLE[tag])
        elif tag == "span" and "tg-spoiler" in (a.get("class") or "") and "tg-spoiler" not in self.open:
            out = self._push("tg-spoiler")
        elif tag == "blockquote" and "blockquote" not in self.open and not self.open:
            out = self._push("blockquote", " expandable" if "expandable" in a else "")
        elif tag == "a" and "a" not in self.open:
            href = _url(a.get("href"))
            if href:
                out = self._push("a", f' href="{html.escape(href, quote=True)}"')
        elif tag == "tg-emoji" and "tg-emoji" not in self.open:
            eid = str(a.get("emoji-id") or "")
            if EMOJI_ID_RE.match(eid):
                out = self._push("tg-emoji", f' emoji-id="{eid}"')
        self.stack.append((tag, out))

    def handle_endtag(self, tag):  # noqa: ANN001, ANN201
        tag = tag.lower()
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
            return
        if tag == "br":
            return
        # آخرین برچسب باز با همین نام؛ برچسب‌های داخلی‌ترِ بسته‌نشده هم همین‌جا بسته می‌شوند
        idx = next((i for i in range(len(self.stack) - 1, -1, -1) if self.stack[i][0] == tag), None)
        if idx is None:
            return
        closing = [out for _t, out in self.stack[idx:] if out]
        del self.stack[idx:]
        if closing:
            target = closing[0]
            while self.open:
                t = self.open.pop()
                self.out.append(f"</{t}>")
                if t == target:
                    break

    def handle_startendtag(self, tag, attrs):  # noqa: ANN001, ANN201
        if tag.lower() == "br":
            self.out.append("\n")

    def handle_data(self, data):  # noqa: ANN001, ANN201
        if self.skip:
            return
        self.out.append(html.escape(data, quote=False))

    def result(self) -> str:
        while self.open:
            self.out.append(f"</{self.open.pop()}>")
        text = "".join(self.out)
        text = re.sub(r"\n{3,}", "\n\n", text)
        # برچسب خالی تلگرام را اذیت نمی‌کند ولی بی‌فایده است
        text = re.sub(r"<(b|i|u|s|code|tg-spoiler)></\1>", "", text)
        return text.strip()


def clean_html(value: object, limit: int = MAX_TEXT) -> str:
    raw = _CTRL.sub("", str(value or ""))[: limit * 3]
    p = _Sanitizer()
    try:
        p.feed(raw)
        p.close()
    except Exception:  # noqa: BLE001
        return html.escape(re.sub(r"<[^>]*>", "", raw), quote=False)[:limit]
    out = p.result()
    if len(out) > limit:
        # بریدن امن: متن ساده
        plain = re.sub(r"<[^>]*>", "", out)
        out = plain[:limit]
    return out


def plain_len(text: str) -> int:
    return len(html.unescape(re.sub(r"<[^>]*>", "", text or "")))


def strip_custom_emoji(text: str) -> str:
    """بدون پریمیوم: ایموجی سفارشی همان ایموجی معمولی‌اش می‌شود."""
    return re.sub(r'<tg-emoji emoji-id="\d+">(.*?)</tg-emoji>', r"\1", text or "", flags=re.S)


# ---------------------------------------------------------------- فرمول
class FormulaError(Exception):
    pass


_FUNCS = {
    "گرد": lambda *a: round(a[0], int(a[1])) if len(a) > 1 else round(a[0]),
    "کمینه": lambda *a: min(a),
    "بیشینه": lambda *a: max(a),
    "تصادفی": lambda *a: random.randint(int(min(a[0], a[1])), int(max(a[0], a[1]))) if len(a) > 1 else random.random(),
    "قدرمطلق": lambda *a: abs(a[0]),
    "پایین": lambda *a: math.floor(a[0]),
    "بالا": lambda *a: math.ceil(a[0]),
}
_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩٫−–٪", "01234567890123456789.--%")
_TOKEN = re.compile(r"\s*(?:(\d+(?:\.\d+)?)|\{([^{}]{1,24})\}|([+\-*/×÷()%,،^])|([^\W\d_][\w‌]*))")


def _tokens(src: str) -> list[tuple[str, object]]:
    s = (src or "").translate(_DIGITS).replace("٬", "")
    pos, out = 0, []
    while pos < len(s):
        if s[pos:].strip() == "":
            break
        m = _TOKEN.match(s, pos)
        if not m or m.end() == pos:
            raise FormulaError("فرمول درست نیست")
        num, var, op, name = m.groups()
        if num is not None:
            out.append(("num", float(num)))
        elif var is not None:
            out.append(("var", var.strip()))
        elif op is not None:
            out.append(("op", {"×": "*", "÷": "/", "،": ","}.get(op, op)))
        elif name is not None:
            out.append(("fn", name))
        pos = m.end()
    return out


class _Parser:
    def __init__(self, toks, get) -> None:  # noqa: ANN001
        self.t = toks
        self.i = 0
        self.get = get
        self.depth = 0

    def peek(self):  # noqa: ANN201
        return self.t[self.i] if self.i < len(self.t) else (None, None)

    def eat(self, kind, val=None):  # noqa: ANN001, ANN201
        k, v = self.peek()
        if k == kind and (val is None or v == val):
            self.i += 1
            return v
        raise FormulaError("فرمول ناقص است")

    def expr(self) -> float:
        self.depth += 1
        if self.depth > 40:
            raise FormulaError("فرمول خیلی تودرتوست")
        v = self.term()
        while self.peek() in (("op", "+"), ("op", "-")):
            op = self.eat("op")
            start = self.i
            r = self.term()
            if self._bare_percent(start):
                r = v * r          # مثل ماشین‌حساب: x − ۱۰٪ یعنی ۹۰٪ از x
            v = v + r if op == "+" else v - r
        self.depth -= 1
        return v

    def _bare_percent(self, start: int) -> bool:
        """تکهٔ تازه فقط «عدد٪» بود (بدون ضرب و تقسیم در همان سطح)؟"""
        part = self.t[start:self.i]
        if not part or part[-1] != ("op", "%"):
            return False
        depth = 0
        for k, v in part:
            if k == "op" and v == "(":
                depth += 1
            elif k == "op" and v == ")":
                depth -= 1
            elif depth == 0 and k == "op" and v in ("*", "/", "^"):
                return False
        return True

    def term(self) -> float:
        v = self.power()
        while self.peek() in (("op", "*"), ("op", "/")):
            op = self.eat("op")
            r = self.power()
            if op == "*":
                v *= r
            else:
                if r == 0:
                    raise FormulaError("تقسیم بر صفر")
                v /= r
        return v

    def power(self) -> float:
        v = self.unary()
        if self.peek() == ("op", "^"):
            self.eat("op")
            e = self.unary()
            if abs(e) > 64 or abs(v) > 1e12:
                raise FormulaError("عدد خیلی بزرگ است")
            v = v ** e
        return v

    def unary(self) -> float:
        if self.peek() == ("op", "-"):
            self.eat("op")
            return -self.unary()
        if self.peek() == ("op", "+"):
            self.eat("op")
            return self.unary()
        return self.postfix()

    def postfix(self) -> float:
        v = self.atom()
        while self.peek() == ("op", "%"):
            self.eat("op")
            v = v / 100
        return v

    def atom(self) -> float:
        k, v = self.peek()
        if k == "num":
            self.i += 1
            return float(v)  # type: ignore[arg-type]
        if k == "var":
            self.i += 1
            return self.get(v)
        if k == "op" and v == "(":
            self.i += 1
            r = self.expr()
            self.eat("op", ")")
            return r
        if k == "fn":
            self.i += 1
            fn = _FUNCS.get(v)  # type: ignore[arg-type]
            if fn is None:
                raise FormulaError(f"تابع «{v}» را نمی‌شناسم")
            self.eat("op", "(")
            args = [self.expr()]
            while self.peek() == ("op", ","):
                self.eat("op")
                args.append(self.expr())
            self.eat("op", ")")
            try:
                return float(fn(*args))
            except (TypeError, ValueError, IndexError):
                raise FormulaError(f"ورودی «{v}» درست نیست") from None
        raise FormulaError("فرمول ناقص است")


def to_number(value: object) -> float:
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value or "").translate(_DIGITS).replace("٬", "").replace(",", "").strip()
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


def evaluate(formula: str, get) -> float:  # noqa: ANN001
    """فرمول امن: عدد، {متغیر}، + − × ÷ ^ ( ) ٪ و چند تابع. هرگز eval پایتون نیست."""
    toks = _tokens(formula)
    if not toks:
        raise FormulaError("فرمول خالی است")
    if len(toks) > 200:
        raise FormulaError("فرمول خیلی بلند است")
    p = _Parser(toks, lambda name: to_number(get(name)))
    v = p.expr()
    if p.i != len(toks):
        raise FormulaError("فرمول درست نیست")
    if math.isnan(v) or math.isinf(v):
        raise FormulaError("نتیجه عدد نیست")
    return v


def check_formula(formula: str, names: set[str]) -> str:
    """خطای فرمول برای پنل (خالی یعنی درست)."""
    try:
        toks = _tokens(formula)
    except FormulaError as exc:
        return str(exc)
    for k, v in toks:
        if k == "var" and v not in names:
            return f"متغیر «{v}» تعریف نشده"
    try:
        evaluate(formula, lambda _n: 1)
    except FormulaError as exc:
        if "صفر" not in str(exc):
            return str(exc)
    return ""


_FA = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def fa_number(v: float) -> str:
    """عدد برای متن پیام: ارقام فارسی، جداکنندهٔ هزارگان، حداکثر دو رقم اعشار."""
    if abs(v - round(v)) < 1e-9:
        s = f"{int(round(v)):,}".replace(",", "٬")
    else:
        s = f"{v:,.2f}".rstrip("0").rstrip(".").replace(",", "٬").replace(".", "٫")
    return s.translate(_FA)


# ---------------------------------------------------------------- پاک‌سازی سند
def _style(v: object) -> str:
    return v if v in STYLES else ""


def _icon(v: object) -> str:
    v = str(v or "")
    return v if EMOJI_ID_RE.match(v) else ""


def _set(raw: object, var_names: set[str]) -> dict | None:
    if not isinstance(raw, dict):
        return None
    name = _var_name(raw.get("var"))
    if not name or name not in var_names:
        return None
    op = raw.get("op") if raw.get("op") in ("=", "+", "-") else "="
    return {"var": name, "op": op, "value": _one_line(raw.get("value"), 120)}


def _inline_act(raw: object, var_names: set[str]) -> dict:
    a = raw if isinstance(raw, dict) else {}
    t = a.get("type") if a.get("type") in INLINE_ACTS else "none"
    if t == "goto":
        out = {"type": "goto", "to": _id(a.get("to"))}
        s = _set(a.get("set"), var_names)
        if s:
            out["set"] = s
        return out
    if t == "url":
        return {"type": "url", "url": _url(a.get("url"))}
    if t == "copy":
        return {"type": "copy", "text": _s(a.get("text"), 256)}
    if t == "app":
        return {"type": "app", "url": _https(a.get("url"))}
    if t == "share":
        return {"type": "share", "text": _one_line(a.get("text"), 200)}
    if t == "pay":
        try:
            stars = int(a.get("stars") or 0)
        except (TypeError, ValueError):
            stars = 0
        return {"type": "pay", "stars": max(1, min(stars, 10000)), "title": _one_line(a.get("title"), 32) or "خرید",
                "to": _id(a.get("to"))}
    if t == "alert":
        return {"type": "alert", "text": _s(a.get("text"), 190), "popup": bool(a.get("popup"))}
    if t == "shop":
        return {"type": "shop", "cat": _one_line(a.get("cat"), 30)}
    if t == "cart":
        return {"type": "cart"}
    return {"type": "none"}


def _key_act(raw: object, var_names: set[str]) -> dict:
    a = raw if isinstance(raw, dict) else {}
    t = a.get("type") if a.get("type") in KEY_ACTS else "text"
    if t == "app":
        return {"type": "app", "url": _https(a.get("url"))}
    out: dict = {"type": t, "to": _id(a.get("to"))}
    if t in ("contact", "location", "user", "chat"):
        v = _var_name(a.get("var"))
        out["var"] = v if v in var_names else ""
    if t == "text":
        s = _set(a.get("set"), var_names)
        if s:
            out["set"] = s
    return out


def _button(raw: object, ids: set[str], var_names: set[str], key: bool) -> dict | None:
    if not isinstance(raw, dict):
        return None
    text = _one_line(raw.get("text"), 64)
    if not text:
        return None
    bid = _id(raw.get("id"))
    if not bid or bid in ids:
        return None
    ids.add(bid)
    return {"id": bid, "text": text, "style": _style(raw.get("style")), "icon": _icon(raw.get("icon")),
            "act": _key_act(raw.get("act"), var_names) if key else _inline_act(raw.get("act"), var_names)}


def _rows(raw: object, ids: set[str], var_names: set[str], key: bool) -> list[list[dict]]:
    rows = []
    for row in (raw if isinstance(raw, list) else [])[:MAX_ROWS]:
        btns = [b for b in (_button(x, ids, var_names, key) for x in (row if isinstance(row, list) else [])[:MAX_PER_ROW]) if b]
        if btns:
            rows.append(btns)
    return rows


def _num(v: object, lo: float, hi: float) -> float | None:
    try:
        n = float(str(v).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")).replace("٫", "."))
    except (TypeError, ValueError):
        return None
    return max(lo, min(hi, n))


def _rule(raw: object, var_names: set[str]) -> dict | None:
    if not isinstance(raw, dict):
        return None
    k = raw.get("k") if raw.get("k") in RULE_KINDS else "var"
    op = raw.get("op") if raw.get("op") in RULE_OPS else "="
    a = _one_line(raw.get("a"), 40)
    if k == "var":
        a = _var_name(a)
        if not a or (a not in var_names and a not in BUILTINS):
            return None
    elif k == "member":
        a = a if CHAT_RE.match(a) else ""
        if not a:
            return None
        op = "not" if op == "not" else "in"
    elif k == "tag":
        op = "not" if op == "not" else "has"
    return {"k": k, "a": a, "op": op, "b": _one_line(raw.get("b"), 120)}


def _step(raw: object, var_names: set[str]) -> dict | None:
    if not isinstance(raw, dict) or raw.get("type") not in STEP_TYPES:
        return None
    t = raw["type"]
    if t == "if":
        rules = [r for r in (_rule(x, var_names) for x in (raw.get("rules") if isinstance(raw.get("rules"), list) else [])[:6]) if r]
        if not rules:
            return None
        return {"type": "if", "rules": rules, "mode": "or" if raw.get("mode") == "or" else "and",
                "yes": _id(raw.get("yes")), "no": _id(raw.get("no"))}
    if t == "calc":
        v = _var_name(raw.get("var"))
        if v not in var_names:
            return None
        return {"type": "calc", "var": v, "op": raw.get("op") if raw.get("op") in ("=", "+", "-") else "=", "value": _one_line(raw.get("value"), 300)}
    if t == "random":
        to = [x for x in (_id(y) for y in (raw.get("to") if isinstance(raw.get("to"), list) else [])[:8]) if x]
        return {"type": "random", "to": to} if to else None
    if t == "delay":
        sec = _num(raw.get("sec"), 1, MAX_DELAY)
        return {"type": "delay", "sec": int(sec)} if sec else None
    if t == "member":
        chat = _one_line(raw.get("chat"), 40)
        return {"type": "member", "chat": chat, "no": _id(raw.get("no"))} if CHAT_RE.match(chat) else None
    if t == "notify":
        text = _s(raw.get("text"), 800)
        return {"type": "notify", "text": text} if text else None
    if t == "tag":
        tag = _one_line(raw.get("tag"), 24).strip("#")
        return {"type": "tag", "tag": tag, "op": "remove" if raw.get("op") == "remove" else "add"} if tag else None
    if t == "save":
        form = _one_line(raw.get("form"), 40)
        vs = [v for v in (_var_name(x) for x in (raw.get("vars") if isinstance(raw.get("vars"), list) else [])[:20]) if v and (v in var_names or v in BUILTINS)]
        return {"type": "save", "form": form, "vars": list(dict.fromkeys(vs)), "notify": bool(raw.get("notify"))} if form and vs else None
    return None


def _wait(wait: dict, var_names: set[str]) -> dict | None:
    if wait.get("kind") == "support":
        return {"kind": "support", "to": _id(wait.get("to"))}
    if wait.get("kind") == "var" and _var_name(wait.get("var")) in var_names:
        out = {"kind": "var", "var": _var_name(wait.get("var")), "to": _id(wait.get("to"))}
        check = wait.get("check") if wait.get("check") in CHECKS else "text"
        if check != "text" or wait.get("error"):
            out["check"] = check
            if check == "number":
                lo, hi = _num(wait.get("min"), -1e12, 1e12), _num(wait.get("max"), -1e12, 1e12)
                if lo is not None:
                    out["min"] = lo
                if hi is not None:
                    out["max"] = hi
            if check == "choice":
                out["choices"] = [c for c in (_one_line(x, 40) for x in (wait.get("choices") if isinstance(wait.get("choices"), list) else [])[:12]) if c]
            out["error"] = _one_line(wait.get("error"), 200)
        return out
    return None


def _msg(raw: dict, var_names: set[str], btn_ids: set[str]) -> dict:
    mid = _id(raw.get("id"))
    media = raw.get("media") if isinstance(raw.get("media"), dict) else None
    m_out = None
    if media and media.get("type") in MEDIA_TYPES and _https(media.get("url")):
        m_out = {"type": media["type"], "url": _https(media.get("url"))}
    text = clean_html(raw.get("text"), MAX_CAPTION if m_out else MAX_TEXT)
    kb = raw.get("kb") if raw.get("kb") in ("none", "inline", "reply") else "none"
    rows = _rows(raw.get("rows"), btn_ids, var_names, key=False)
    keys = _rows(raw.get("keys"), btn_ids, var_names, key=True)
    ko = raw.get("kbopt") if isinstance(raw.get("kbopt"), dict) else {}
    o = raw.get("opts") if isinstance(raw.get("opts"), dict) else {}
    eff = str(o.get("effect") or "")
    w_out = _wait(raw.get("wait") if isinstance(raw.get("wait"), dict) else {}, var_names)
    steps = [x for x in (_step(st, var_names) for st in (raw.get("steps") if isinstance(raw.get("steps"), list) else [])[:MAX_STEPS]) if x]
    cmd = _s(raw.get("cmd"), 33).lower()
    kws = [k for k in (_one_line(x, 40) for x in (raw.get("kw") if isinstance(raw.get("kw"), list) else [])[:12]) if k]
    return {
        "id": mid,
        "name": _one_line(raw.get("name"), 40) or "پیام",
        "text": text,
        "media": m_out,
        "kb": kb,
        "rows": rows,
        "keys": keys,
        "kbopt": {"resize": ko.get("resize", True) is not False, "once": bool(ko.get("once")),
                  "persist": bool(ko.get("persist")), "placeholder": _one_line(ko.get("placeholder"), 64)},
        "opts": {"replace": o.get("replace", True) is not False, "typing": bool(o.get("typing")),
                 "effect": eff if eff in EFFECTS else "", "preview": bool(o.get("preview")),
                 "silent": bool(o.get("silent")), "protect": bool(o.get("protect")), "remove_kb": bool(o.get("remove_kb"))},
        "cmd": cmd if CMD_RE.match(cmd) and cmd != "/start" else "",
        "kw": kws,
        "then": _id(raw.get("then")),
        "wait": w_out,
        "steps": steps,
        "group": _id(raw.get("group")),
    }


def _var(raw: object) -> dict | None:
    if not isinstance(raw, dict):
        return None
    name = _var_name(raw.get("name"))
    if not name or name in BUILTINS:
        return None
    t = raw.get("type") if raw.get("type") in VAR_TYPES else "text"
    return {"name": name, "type": t, "scope": "bot" if raw.get("scope") == "bot" else "user",
            "init": _one_line(raw.get("init"), 120), "formula": _one_line(raw.get("formula"), 300) if t == "number" else ""}


COMP_TYPES = ("menu", "faq", "coupon", "support")


def _comp(raw: object) -> dict | None:
    if not isinstance(raw, dict) or raw.get("type") not in COMP_TYPES:
        return None
    cid = _id(raw.get("id"))
    if not cid:
        return None
    settings = raw.get("settings") if isinstance(raw.get("settings"), dict) else {}
    # تنظیمات جزء فقط برای پنل است (موتور پیام‌های ساخته‌شده را می‌خواند)؛ اندازه‌اش را مهار می‌کنیم
    import json

    blob = json.dumps(settings, ensure_ascii=False)
    if len(blob) > 20000:
        settings = {}
    return {"id": cid, "type": raw["type"], "title": _one_line(raw.get("title"), 40), "settings": settings}


def clean_doc(raw: object) -> dict:
    if not isinstance(raw, dict):
        raise BotDocError("سند ربات نامعتبر است")
    vars_: list[dict] = []
    seen_v: set[str] = set()
    for v in (raw.get("vars") if isinstance(raw.get("vars"), list) else [])[:MAX_VARS]:
        c = _var(v)
        if c and c["name"] not in seen_v:
            seen_v.add(c["name"])
            vars_.append(c)
    names = set(seen_v)
    for v in vars_:
        if v["formula"] and check_formula(v["formula"], names | set(BUILTINS)):
            # فرمول خراب ذخیره می‌شود تا کاربر درستش کند، ولی موتور نتیجه را خالی نشان می‌دهد
            pass
    msgs_raw = raw.get("msgs") if isinstance(raw.get("msgs"), list) else []
    if len(msgs_raw) > MAX_MSGS:
        raise BotDocError(f"حداکثر {MAX_MSGS} پیام")
    msgs: list[dict] = []
    seen: set[str] = set()
    btn_ids: set[str] = set()
    for m in msgs_raw:
        if not isinstance(m, dict):
            continue
        c = _msg(m, names, btn_ids)
        if not c["id"] or c["id"] in seen:
            continue
        seen.add(c["id"])
        msgs.append(c)
    # ارجاع به پیام ناموجود پاک می‌شود
    for m in msgs:
        if m["then"] not in seen or m["then"] == m["id"]:
            m["then"] = ""
        if m["wait"] and m["wait"].get("to") not in seen:
            m["wait"]["to"] = ""
        for st in m["steps"]:
            for f in ("yes", "no"):
                if f in st and (st[f] not in seen):
                    st[f] = ""
            if st["type"] == "random":
                st["to"] = [x for x in st["to"] if x in seen]
        m["steps"] = [st for st in m["steps"] if st["type"] != "random" or st["to"]]
        for row in m["rows"] + m["keys"]:
            for b in row:
                if "to" in b["act"] and b["act"]["to"] not in seen:
                    b["act"]["to"] = ""
    comps = []
    cids: set[str] = set()
    for c in (raw.get("comps") if isinstance(raw.get("comps"), list) else [])[:MAX_COMPS]:
        cc = _comp(c)
        if cc and cc["id"] not in cids:
            cids.add(cc["id"])
            comps.append(cc)
    for m in msgs:
        if m["group"] not in cids:
            m["group"] = ""
    start = _id(raw.get("start"))
    if start not in seen:
        start = msgs[0]["id"] if msgs else ""
    fb = _id(raw.get("fallback"))
    shop = clean_shop(raw.get("shop"))
    if shop["after"] not in seen:
        shop["after"] = ""
    return {"v": 1, "start": start, "fallback": fb if fb in seen else "", "msgs": msgs, "vars": vars_, "comps": comps, "shop": shop}


# ---------------------------------------------------------------- تنظیمات فروشگاه
PAY_METHODS = ("card", "cod", "stars")
COUPON_RE = re.compile(r"^[A-Z0-9_\-]{2,20}$")


def _int(v: object, lo: int, hi: int, default: int = 0) -> int:
    n = _num(v, lo, hi)
    return default if n is None else int(n)


def clean_shop(raw: object) -> dict:
    """فروشگاه: روش‌های پرداخت، کارت، نرخ ستاره، هزینهٔ ارسال، کدهای تخفیف، پرسش نشانی، پیام بعد از سفارش."""
    r = raw if isinstance(raw, dict) else {}
    pay = [p for p in (r.get("pay") if isinstance(r.get("pay"), list) else ["card", "cod"]) if p in PAY_METHODS]
    digits = re.sub(r"\D", "", _one_line(r.get("card"), 40).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")))[:19]
    card = " ".join(digits[i:i + 4] for i in range(0, len(digits), 4))
    coupons, seen = [], set()
    for c in (r.get("coupons") if isinstance(r.get("coupons"), list) else [])[:20]:
        if not isinstance(c, dict):
            continue
        code = _one_line(c.get("code"), 20).upper()
        pct, amount = _int(c.get("pct"), 0, 100), _int(c.get("amount"), 0, 10**10)
        if COUPON_RE.match(code) and code not in seen and (pct or amount):
            seen.add(code)
            coupons.append({"code": code, "pct": pct, "amount": 0 if pct else amount})
    return {
        "pay": list(dict.fromkeys(pay)),
        "card": card, "card_name": _one_line(r.get("card_name"), 40),
        "stars_rate": _int(r.get("stars_rate"), 0, 10**7),      # چند تومان = یک ستاره؛ ۰ یعنی ستاره خاموش
        "ship": _int(r.get("ship"), 0, 10**9),
        "coupons": coupons,
        "ask_info": bool(r.get("ask_info", True)),
        "info_text": _one_line(r.get("info_text"), 200),
        "after": _id(r.get("after")),
        "unit": _one_line(r.get("unit"), 12) or "تومان",
    }


def empty_doc(name: str = "") -> dict:
    """ربات تازه: یک پیام خوش‌آمد با دو دکمه که کاربر از آن شروع می‌کند."""
    title = html.escape(name or "ربات من", quote=False)
    return clean_doc({
        "start": "m_welcome",
        "msgs": [
            {"id": "m_welcome", "name": "خوش‌آمد", "text": f"سلام {{نام}} 👋\nبه <b>{title}</b> خوش اومدی.",
             "kb": "inline", "rows": [[{"id": "b_about", "text": "ℹ️ درباره ما", "style": "primary", "act": {"type": "goto", "to": "m_about"}}]]},
            {"id": "m_about", "name": "درباره ما", "text": "این‌جا دربارهٔ کارت بنویس.",
             "kb": "inline", "rows": [[{"id": "b_back", "text": "↩️ برگشت", "act": {"type": "goto", "to": "m_welcome"}}]]},
        ],
    })


def find(doc: dict, mid: str) -> dict | None:
    for m in doc.get("msgs", []):
        if m["id"] == mid:
            return m
    return None


def find_button(msg: dict, bid: str, key: bool = False) -> dict | None:
    for row in msg.get("keys" if key else "rows", []):
        for b in row:
            if b["id"] == bid:
                return b
    return None
