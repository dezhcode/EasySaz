"""ساخت نسخهٔ نمایشی ایستای پنل ایزی‌ساز (بدون سرور و بدون تلگرام).

    python scripts/build_demo.py <پوشهٔ خروجی>

خروجی:
  index.html        پنل ساخت در حالت نمایشی (data-demo="1")
  a/demo            صفحهٔ منتشرشدهٔ همان دادهٔ نمایشی
  api/schema        همان پاسخ GET /api/schema
  api/templates     همان پاسخ GET /api/templates
  static/…          CSS، JS و فونت‌ها

دادهٔ نمایشی در localStorage همان مرورگر می‌ماند (static/demo.js).
index.html بدون doctype/head است تا میزبان (مثل Artifact) اسکلت سند را
خودش بسازد؛ برای سرو معمولی هم کار می‌کند.
"""
from __future__ import annotations

import base64
import json
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# نسخهٔ نمایشی سرور ندارد: تصویرهای نمونهٔ قالب‌ها (static/samples) با یک نشانی
# ساختگی ساخته می‌شوند و بعد همان‌جا به data URI تبدیل می‌شوند.
DEMO_BASE = "https://demo.easysaz.invalid"
os.environ["BASE_URL"] = DEMO_BASE

from app import blocks, templates  # noqa: E402

STATIC = ROOT / "app" / "webapp" / "static"
TG_SCRIPT = re.compile(r'<script src="https://telegram\.org/[^"]*"></script>\n?')
ASSET = re.compile(r"(static/([\w.-]+\.(?:css|js)))(?:\?v=\w+)?")


def versioned(html: str) -> str:
    """مثل سرور (wsgi.asset_version): نسخهٔ هر css/js از هش محتوایش، تا نسخهٔ قدیمی از حافظه نیاید."""
    import hashlib

    return ASSET.sub(lambda m: f"{m.group(1)}?v={hashlib.sha256((STATIC / m.group(2)).read_bytes()).hexdigest()[:10]}", html)


def build(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)

    # پنل: فقط محتوای head و body، با تنظیم ریشهٔ سند از اسکریپت
    html = (STATIC / "panel.html").read_text(encoding="utf-8")
    head = html.split("<head>", 1)[1].split("</head>", 1)[0]
    body = html.split("<body>", 1)[1].split("</body>", 1)[0]
    head = re.sub(r"<meta [^>]*>\n", "", head)
    head = TG_SCRIPT.sub("", head).replace("<title>ایزی‌ساز</title>", "<title>پنل ایزی‌ساز</title>")
    boot = ('<script>(function(r){r.lang="fa";r.dir="rtl";'
            'r.dataset.base="./";r.dataset.demo="1";})(document.documentElement);</script>\n')
    (out / "index.html").write_text(versioned((boot + head + body).replace("__BASE__", "./")), encoding="utf-8")

    # صفحهٔ منتشرشده: سند کامل، یک پوشه پایین‌تر
    page = (STATIC / "page.html").read_text(encoding="utf-8")
    page = TG_SCRIPT.sub("", page).replace("__BASE__", "../").replace("__TITLE__", "کافه نارنج")
    (out / "a").mkdir(exist_ok=True)
    (out / "a" / "demo").write_text(versioned(page), encoding="utf-8")

    (out / "api").mkdir(exist_ok=True)
    (out / "api" / "schema").write_text(json.dumps(blocks.public_schema(), ensure_ascii=False), encoding="utf-8")
    tpl_json = json.dumps(templates.public(), ensure_ascii=False)
    for img in sorted((STATIC / "samples").glob("*.jpg")):
        data = "data:image/jpeg;base64," + base64.b64encode(img.read_bytes()).decode()
        tpl_json = tpl_json.replace(blocks.sample_prefix() + img.name, data)
    (out / "api" / "templates").write_text(tpl_json, encoding="utf-8")

    dst = out / "static"
    dst.mkdir(exist_ok=True)
    for name in ("peyda.css", "tokens.css", "render.css", "panel.css", "page.css",
                 "render.js", "demo.js", "panel.js", "page.js"):
        shutil.copy2(STATIC / name, dst / name)
    shutil.copytree(STATIC / "fonts", dst / "fonts", dirs_exist_ok=True)
    shutil.copytree(STATIC / "brand", dst / "brand", dirs_exist_ok=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build(Path(sys.argv[1]))
    print("ok")
