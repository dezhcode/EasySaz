"""سمت مینی‌اپ ورود به سایت (initData ربات اصلی).

  POST /api/weblogin/inspect   {code|text}   اسکن شد؛ مشخصات مرورگر برای تأیید
  POST /api/weblogin/approve   {code}        «بله، وارد شو»
  POST /api/weblogin/deny      {code}        «نه، من نبودم»
  GET  /api/weblogin/sessions                دستگاه‌های واردشده
  POST /api/weblogin/revoke    {id|all}      خروج یک دستگاه یا همه
"""
from __future__ import annotations

from app.webapp.api import ApiError

from . import logins

ACTIONS = {"inspect": "POST", "approve": "POST", "deny": "POST", "sessions": "GET", "revoke": "POST"}


def _code(body: dict) -> str:
    code = str(body.get("code") or "")
    return code if logins.CODE_RE.match(code) else logins.code_from_scan(str(body.get("text") or code))


async def handle(api, action: str, init_data: str, body: dict) -> dict:  # noqa: ANN001
    user, _ = await api._owner(init_data, write=action != "sessions")
    db = api.db
    try:
        if action == "inspect":
            return await logins.inspect(db, _code(body), user)
        if action in ("approve", "deny"):
            return await logins.decide(db, _code(body), user, action == "approve")
        if action == "sessions":
            return {"sessions": await logins.sessions(db, user.id)}
        if action == "revoke":
            n = await logins.revoke(db, user.id, body.get("id"), everything=bool(body.get("all")))
            return {"revoked": n, "sessions": await logins.sessions(db, user.id)}
    except logins.LoginError as exc:
        raise ApiError(exc.status, exc.message) from exc
    raise ApiError(404, "پیدا نشد")
