"""تنظیمات از فایل .env — هیچ توکنی هاردکد نمی شود."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# ریشه پروژه (پوشه ای که main.py و passenger_wsgi.py در آن هستند).
# روی سی پنل پوشه جاری همیشه ریشه اپ نیست، پس env از اینجا خوانده می شود.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _abs_path(value: str) -> str:
    p = Path(value).expanduser()
    return str(p if p.is_absolute() else (BASE_DIR / p))


def _bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


def _int_list(name: str) -> list[int]:
    raw = os.getenv(name, "")
    return [int(x) for x in raw.replace(" ", "").split(",") if x.strip().lstrip("-").isdigit()]


@dataclass(slots=True)
class Config:
    # ===== ربات اصلی (@EasySazBot) =====
    bot_token: str = os.getenv("BOT_TOKEN", "").strip()
    admin_ids: list[int] = field(default_factory=lambda: _int_list("ADMIN_IDS"))

    # آدرس عمومی اپ، بدون / آخر. مثال: https://dezhcode.pyho.ir/easysaz
    # همه آدرس ها از همین ساخته می شوند: وبهوک ها، پنل، صفحه مینی اپ ها.
    base_url: str = os.getenv("BASE_URL", "").strip().rstrip("/")

    webhook_mode: bool = _bool("WEBHOOK_MODE", "true")
    # مسیر وبهوک ربات اصلی (بخش تصادفی دارد تا حدس زده نشود)
    webhook_path: str = "/" + os.getenv("WEBHOOK_PATH", "/tg/main").strip().strip("/")
    # رمز وبهوک. برای ربات های مشتری هم از همین، رمز جداگانه مشتق می شود.
    webhook_secret: str = os.getenv("WEBHOOK_SECRET", "").strip()
    # کلید مسیرهای مدیریتی (/status، /setwebhook). جدا از WEBHOOK_SECRET
    # چون در URL می آید و در access log می ماند.
    admin_key: str = os.getenv("ADMIN_KEY", "").strip()

    # کلید رمزنگاری توکن ربات مشتری ها در دیتابیس (Fernet).
    # گم شدن این کلید یعنی همه توکن ها باید دوباره فرستاده شوند.
    token_key: str = os.getenv("TOKEN_KEY", "").strip()

    # ===== اتصال تلگرام (اختیاری) =====
    tg_proxy: str = os.getenv("TG_PROXY", "").strip()
    tg_api_base: str = os.getenv("TG_API_BASE", "").strip()

    # ===== دستیار هوش مصنوعی (ساخت ربات با گفتگو) =====
    # کلید را مدیر سرویس می‌دهد؛ فقط سمت سرور می‌ماند (هرگز در گیت یا مرورگر)
    ai_key: str = os.getenv("EASYSAZ_AI_KEY", "").strip()
    ai_base_url: str = (os.getenv("EASYSAZ_AI_URL", "").strip() or "https://dezhcode.pyho.ir").rstrip("/")

    # ===== مسیرها =====
    db_path: str = _abs_path(os.getenv("DB_PATH", "").strip() or "data/easysaz.db")
    log_path: str = _abs_path(os.getenv("LOG_PATH", "").strip() or "logs/easysaz.log")
    log_level: str = os.getenv("LOG_LEVEL", "INFO").strip().upper()
    # تصویرهای آپلودشدهٔ صاحبان مینی‌اپ (بیرون از public_html)؛ از /u/<نام> سرو می‌شوند
    upload_dir: str = _abs_path(os.getenv("UPLOAD_DIR", "").strip() or "data/uploads")

    # عمر مجاز initData مینی اپ (ثانیه)
    webapp_max_age: int = int(os.getenv("WEBAPP_MAX_AGE", "21600") or 21600)

    # فقط همین نوع آپدیت ها از تلگرام گرفته می شود
    allowed_updates: tuple[str, ...] = (
        "message",
        "callback_query",
        "pre_checkout_query",
    )

    # ---------- آدرس های مشتق ----------
    @property
    def app_base_uri(self) -> str:
        """فقط بخش مسیر BASE_URL (مثلا /easysaz) برای جدا کردن زیرمسیر."""
        from urllib.parse import urlparse

        return urlparse(self.base_url).path.rstrip("/") if self.base_url else ""

    @property
    def webhook_url(self) -> str:
        return f"{self.base_url}{self.webhook_path}"

    @property
    def panel_url(self) -> str:
        """مینی اپ ادمین (ادیتور) که داخل @EasySazBot باز می شود."""
        return f"{self.base_url}/panel"

    def page_url(self, slug: str) -> str:
        """آدرس مینی اپ ساخته شده که روی ربات مشتری ست می شود."""
        return f"{self.base_url}/a/{slug}"

    def client_hook_path(self, bot_id: int) -> str:
        return f"/hook/{bot_id}"

    def client_hook_url(self, bot_id: int) -> str:
        return f"{self.base_url}{self.client_hook_path(bot_id)}"


config = Config()
