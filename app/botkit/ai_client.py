"""کلاینت سرویس هوش مصنوعی ایزی‌ساز (/api/chat و /api/chat/stream).

هر درخواست بی‌حافظه است و prompt حداکثر ۸۰۰۰ نویسه؛ تاریخچه را agent.py می‌سازد.
کلید فقط سمت سرور است (config.ai_key). خطای ۵۰۲ یک بار تکرار می‌شود؛ بقیه
با پیام روشن فارسی به AIError تبدیل می‌شوند.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator

import aiohttp

from ..config import config

log = logging.getLogger("easysaz.ai")

MAX_PROMPT = 8000
TIMEOUT = aiohttp.ClientTimeout(total=150, sock_read=120)


class AIError(Exception):
    def __init__(self, message: str, status: int = 0) -> None:
        super().__init__(message)
        self.status = status


def enabled() -> bool:
    return bool(config.ai_key)


def _headers() -> dict:
    return {"Authorization": f"Bearer {config.ai_key}", "Content-Type": "application/json"}


def _body(prompt: str, image_b64: str | None) -> dict:
    body: dict = {"prompt": prompt[:MAX_PROMPT]}
    if image_b64:
        body["image_base64"] = image_b64
    return body


def _explain(status: int, text: str) -> AIError:
    msg = {
        400: "درخواست برای دستیار نامعتبر بود",
        401: "کلید دستیار هوش مصنوعی پذیرفته نشد",
        503: "سرویس دستیار هنوز تنظیم نشده",
        502: "دستیار الان جواب نداد",
        504: "جواب دستیار خیلی طول کشید",
        524: "جواب دستیار خیلی طول کشید",
    }.get(status, "دستیار الان در دسترس نیست")
    log.warning("ai service %s: %s", status, text[:200])
    return AIError(msg, status)


async def stream(prompt: str, image_b64: str | None = None) -> AsyncIterator[str]:
    """تکه‌های جواب را به ترتیب می‌دهد. ۵۰۲ پیش از شروع جریان یک بار تکرار می‌شود."""
    if not enabled():
        raise AIError("دستیار هوش مصنوعی روی این سرور روشن نشده", 503)
    url = f"{config.ai_base_url}/api/chat/stream"
    for attempt in (0, 1):
        try:
            async with aiohttp.ClientSession(timeout=TIMEOUT) as s:
                async with s.post(url, headers=_headers(), json=_body(prompt, image_b64)) as r:
                    if r.status != 200:
                        err = _explain(r.status, await r.text())
                        if r.status == 502 and attempt == 0:
                            await asyncio.sleep(2)
                            continue
                        raise err
                    buf = b""
                    async for chunk in r.content.iter_any():
                        buf += chunk
                        while b"\n" in buf:
                            raw, buf = buf.split(b"\n", 1)
                            line = raw.decode("utf-8", "replace").strip()
                            if not line.startswith("data:"):
                                continue
                            try:
                                ev = json.loads(line[5:])
                            except ValueError:
                                continue
                            kind = ev.get("type")
                            if kind == "delta":
                                yield str(ev.get("text") or "")
                            elif kind == "error":
                                raise AIError("دستیار وسط کار متوقف شد", 502)
                            elif kind == "done":
                                return
                    return
        except AIError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
            log.warning("ai connection: %s", exc)
            if attempt == 0:
                await asyncio.sleep(2)
                continue
            raise AIError("ارتباط با دستیار برقرار نشد", 502) from exc


async def complete(prompt: str, image_b64: str | None = None) -> str:
    """کل جواب یک‌جا (از همان جریان جمع می‌شود)."""
    out = []
    async for piece in stream(prompt, image_b64):
        out.append(piece)
    return "".join(out)
