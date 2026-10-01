"""احراز هویت مینی اپ با initData تلگرام.

هیچ کوکی و سشنی نداریم. هر درخواست API رشته initData را می آورد و امضایش
همان جا سنجیده می شود. آیدی کاربر هرگز از بدنه درخواست خوانده نمی شود.

نکته EasySaz: امضا با توکن رباتی ساخته می شود که مینی اپ را باز کرده.
- پنل ساخت داخل @EasySazBot باز می شود ← با BOT_TOKEN سنجیده می شود.
- صفحه هر مشتری داخل ربات خود او باز می شود ← با توکن همان ربات.
پس verify توکن را به عنوان ورودی می گیرد.

روش (مستند رسمی تلگرام):
  secret = HMAC_SHA256(key="WebAppData", msg=BOT_TOKEN)
  check  = "\\n".join(sorted("key=value"))   # بدون hash
  valid  = HMAC_SHA256(key=secret, msg=check).hexdigest() == hash
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl, unquote

from app.config import config


class AuthError(Exception):
    """initData نامعتبر یا منقضی."""


@dataclass(slots=True)
class WebAppUser:
    id: int
    first_name: str
    username: str
    language_code: str
    is_premium: bool
    start_param: str
    photo_url: str = ""


def _parse_qsl(init_data: str) -> dict:
    return dict(parse_qsl(init_data, keep_blank_values=True))


def _parse_raw(init_data: str) -> dict:
    """تجزیه بدون قاعده فرم: + همان + می ماند (بعضی کلاینت ها + خام می فرستند)."""
    out: dict[str, str] = {}
    for part in init_data.split("&"):
        if not part:
            continue
        key, _, value = part.partition("=")
        out[unquote(key)] = unquote(value)
    return out


def _sign(fields: dict, token: str) -> str:
    check = "\n".join(f"{k}={fields[k]}" for k in sorted(fields))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    return hmac.new(secret, check.encode("utf-8"), hashlib.sha256).hexdigest()


def _candidates(init_data: str):
    """همه شکل های محتمل data-check-string.

    تلگرام فیلد signature را هم می فرستد. مستند می گوید در رشته نیاید ولی
    بعضی پیاده سازی ها نگهش می دارند؛ هر دو حالت امتحان می شود. (از Obour)
    """
    for parser in (_parse_qsl, _parse_raw):
        base = parser(init_data)
        given = base.get("hash", "")
        for drop_signature in (True, False):
            fields = {k: v for k, v in base.items() if k != "hash"}
            if drop_signature:
                fields.pop("signature", None)
            yield fields, given


def verify(init_data: str, token: str | None = None) -> WebAppUser:
    """initData را با توکن داده شده (پیش فرض: ربات اصلی) می سنجد."""
    token = token or config.bot_token
    if not init_data:
        raise AuthError("initData خالی است")
    if not token:
        raise AuthError("توکن ربات در دسترس نیست")

    matched = None
    for fields, given in _candidates(init_data):
        if given and hmac.compare_digest(_sign(fields, token), given):
            matched = fields
            break
    if matched is None:
        raise AuthError("امضای initData معتبر نیست")

    try:
        auth_date = int(matched.get("auth_date", "0"))
    except ValueError:
        auth_date = 0
    if auth_date <= 0:
        raise AuthError("auth_date نامعتبر است")
    if config.webapp_max_age and (time.time() - auth_date) > config.webapp_max_age:
        raise AuthError("نشست منقضی شده؛ مینی اپ را دوباره باز کن")

    try:
        raw_user = json.loads(matched.get("user") or "{}")
    except ValueError:
        raw_user = {}
    uid = raw_user.get("id")
    if not isinstance(uid, int) or uid <= 0:
        raise AuthError("کاربر در initData نیست")

    return WebAppUser(
        id=uid,
        first_name=(raw_user.get("first_name") or "")[:64],
        username=(raw_user.get("username") or "")[:64],
        language_code=(raw_user.get("language_code") or "")[:8],
        is_premium=bool(raw_user.get("is_premium")),
        start_param=(matched.get("start_param") or "")[:64],
        # عکس پروفایل (نسخه‌های تازهٔ تلگرام)؛ فقط از دامنهٔ خود تلگرام
        photo_url=_photo(raw_user.get("photo_url")),
    )


def _photo(value: object) -> str:
    url = value if isinstance(value, str) else ""
    return url[:300] if url.startswith("https://t.me/") and '"' not in url and "'" not in url else ""
