"""ساخت app/webapp/static/tokens.css از design/tokens.json.

design/tokens.json کپی توکن‌های سیستم طراحی «ایزی‌ساز — کاشی» است و تنها
منبع رنگ، فاصله، گوشه و تایپ فرانت‌اند. هر تغییری در سیستم طراحی:
  ۱. tokens.json تازه را در design/ بگذار
  ۲. python scripts/build_tokens.py
CSS دستی در کد رنگ خام ندارد؛ همه چیز var(--نام-توکن) است.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "tokens.json"
OUT = ROOT / "app" / "webapp" / "static" / "tokens.css"


def _theme_block(tokens: dict, theme: str, first: str) -> str:
    out = []
    for fam in ("color", "shadow"):
        for t in tokens[fam]["tokens"]:
            v = t["value"]
            if isinstance(v, dict):
                v = v.get(theme, v[first])
            out.append(f"--{t['name']}:{v}")
    return ";".join(out)


def build() -> str:
    tokens = json.loads(SRC.read_text(encoding="utf-8"))
    themes = [t["id"] for t in tokens["color"]["themes"]]
    first = themes[0]
    lines = [
        "/* ساخته شده از design/tokens.json با scripts/build_tokens.py — دستی ویرایش نکن. */",
        f':root,[data-theme="{first}"]{{{_theme_block(tokens, first, first)}}}',
    ]
    for theme in themes[1:]:
        lines.append(f'[data-theme="{theme}"]{{{_theme_block(tokens, theme, first)};color-scheme:{theme}}}')
    dims = [f"--{t['name']}:{t['value']}" for fam in ("spacing", "radius", "size") for t in tokens[fam]["tokens"]]
    dims.append(f"--font-sans:{tokens['type']['families']['sans']}")
    lines.append(f":root{{{';'.join(dims)}}}")
    for group in tokens["type"]["groups"]:
        for st in group["styles"]:
            extra = f"letter-spacing:{st['letterSpacing']};" if "letterSpacing" in st else ""
            if st["name"].startswith("num"):
                extra += "font-variant-numeric:tabular-nums;"
            lines.append(
                f".{st['name']}{{font-size:{st['fontSize']};line-height:{st['lineHeight']};"
                f"font-weight:{st['fontWeight']};{extra}}}"
            )
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    css = build()
    OUT.write_text(css, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(css)} bytes")
