"""رمزنگاری توکن ربات مشتری ها و مشتق کردن رمز وبهوک.

توکن ربات یعنی کنترل کامل آن ربات. پس در دیتابیس خام ذخیره نمی شود:
اگر فایل دیتابیس جایی لو برود (بکاپ، دانلود اشتباه) بدون TOKEN_KEY
که فقط در .env است، توکن ها قابل استفاده نیستند.
"""
from __future__ import annotations

import hashlib
import hmac
import re

from cryptography.fernet import Fernet, InvalidToken

from .config import config

TOKEN_RE = re.compile(r"^\d{5,16}:[A-Za-z0-9_-]{30,64}$")


class TokenKeyError(RuntimeError):
    """TOKEN_KEY تنظیم نشده یا نامعتبر است."""


def _fernet() -> Fernet:
    if not config.token_key:
        raise TokenKeyError("TOKEN_KEY در فایل .env تنظیم نشده است")
    try:
        return Fernet(config.token_key.encode())
    except (ValueError, TypeError) as exc:
        raise TokenKeyError("TOKEN_KEY نامعتبر است (باید خروجی Fernet.generate_key باشد)") from exc


def looks_like_token(text: str) -> bool:
    return bool(TOKEN_RE.match((text or "").strip()))


def bot_id_of(token: str) -> int:
    """آیدی عددی ربات همان بخش قبل از : در توکن است."""
    return int(token.split(":", 1)[0])


def encrypt_token(token: str) -> str:
    return _fernet().encrypt(token.encode()).decode()


def decrypt_token(blob: str) -> str | None:
    try:
        return _fernet().decrypt(blob.encode()).decode()
    except (InvalidToken, ValueError):
        return None


def client_hook_secret(bot_id: int) -> str:
    """رمز وبهوک هر ربات مشتری، مشتق از WEBHOOK_SECRET.

    لازم نیست جایی ذخیره شود و برای هر ربات متفاوت است؛ لو رفتن رمز
    یک ربات، وبهوک بقیه را باز نمی کند. تلگرام فقط A-Z a-z 0-9 _ -
    قبول می کند که hex در آن جا می شود.
    """
    key = (config.webhook_secret or "easysaz").encode()
    return hmac.new(key, f"client:{bot_id}".encode(), hashlib.sha256).hexdigest()[:48]


def mask_token(token: str) -> str:
    if ":" not in token:
        return "***"
    head, tail = token.split(":", 1)
    return f"{head}:{tail[:4]}…{tail[-3:]}"
