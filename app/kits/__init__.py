"""قالب‌های اختصاصی (کیت) سمت سرور.

ایزی‌ساز «مادر» قالب‌هاست: هر مینی‌اپ روی یک کیت سوار است (doc["kit"]).
طرح صفحه و کامپوننت‌ها در app/blocks.py تعریف می‌شوند؛ هر چه کیت سمت سرور
لازم دارد (جدول، API خواننده، کار بعد از انتشار) این‌جا در یک بسته کنار هم
است. کیت تازه = یک بسته زیر app/kits با همین چند قلاب و ثبتش در KITS:

  SCHEMA                      جدول‌های خودش (CREATE TABLE IF NOT EXISTS)
  public_view(doc)            سندی که به خواننده می‌رسد (مثلاً بدون متن فصل‌ها)
  on_publish(db, app, doc)    بعد از انتشار؛ خروجی در پاسخ انتشار به پنل می‌رسد
  READER / OWNER              نام کارهای API خواننده (/api/page/<slug>/<کار>)
                              و صاحب مینی‌اپ (/api/kit/<کیت>/<کار>)
"""
from __future__ import annotations

from typing import Any

from . import shab

KITS: dict[str, Any] = {"shab": shab}

SCHEMA = "".join(k.SCHEMA for k in KITS.values())


def of(doc: dict | None):  # noqa: ANN201
    return KITS.get((doc or {}).get("kit") or "")


def public_view(doc: dict) -> dict:
    kit = of(doc)
    return kit.public_view(doc) if kit else doc


async def on_publish(db, app, doc: dict) -> dict:  # noqa: ANN001
    kit = of(doc)
    if not kit:
        return {}
    return await kit.on_publish(db, app, doc) or {}
