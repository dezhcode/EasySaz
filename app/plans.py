"""پلن ها و محدودیت هایشان.

مدل کسب و کار: هر کاربر رایگان یک مینی اپ با محدودیت دارد. برای مینی اپ
بیشتر یا برداشتن محدودیت ها باید پلن بخرد. همه سقف ها فقط همین جا تعریف
می شوند تا ربات، API و ادیتور یک حرف بزنند.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Plan:
    key: str
    title: str
    max_apps: int
    max_blocks: int
    max_pages: int
    # بج «ساخته شده با EasySaz» پایین صفحه
    branding: bool
    # کامپوننت های پریمیوم (گالری، کارت محصول و ...)
    premium_blocks: bool
    # گرفتن کنترل کامل ربات (وبهوک + پیام خوش آمد)
    full_mode: bool
    price_stars: int  # قیمت ماهانه به Telegram Stars؛ صفر یعنی رایگان
    features: tuple[str, ...]


PLANS: dict[str, Plan] = {
    "free": Plan(
        key="free",
        title="رایگان",
        max_apps=1,
        max_blocks=8,
        max_pages=2,
        branding=True,
        premium_blocks=False,
        full_mode=True,
        price_stars=0,
        features=(
            "۱ مینی اپ",
            "تا ۸ کامپوننت در ۲ صفحه",
            "کامپوننت های پایه",
            "نشان «ساخته شده با EasySaz»",
        ),
    ),
    "pro": Plan(
        key="pro",
        title="حرفه ای",
        max_apps=3,
        max_blocks=40,
        max_pages=6,
        branding=False,
        premium_blocks=True,
        full_mode=True,
        price_stars=250,
        features=(
            "۳ مینی اپ",
            "تا ۴۰ کامپوننت در ۶ صفحه",
            "همه کامپوننت ها",
            "بدون نشان EasySaz",
        ),
    ),
    "business": Plan(
        key="business",
        title="بیزینس",
        max_apps=10,
        max_blocks=100,
        max_pages=12,
        branding=False,
        premium_blocks=True,
        full_mode=True,
        price_stars=750,
        features=(
            "۱۰ مینی اپ",
            "تا ۱۰۰ کامپوننت در ۱۲ صفحه",
            "همه کامپوننت ها",
            "بدون نشان EasySaz",
        ),
    ),
}

DEFAULT_PLAN = "free"


def get(key: str | None) -> Plan:
    return PLANS.get(key or DEFAULT_PLAN, PLANS[DEFAULT_PLAN])
