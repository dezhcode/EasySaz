#!/usr/bin/env bash
# به‌روزرسانی EasySaz روی هاست از گیت‌هاب (شاخهٔ main) و ری‌استارت Passenger.
#
#   ./deploy.sh            آخرین main را می‌گیرد، کتابخانه‌ها را (اگر عوض شده) نصب و اپ را ری‌استارت می‌کند
#   ./deploy.sh --test     همین، به‌علاوهٔ اجرای test_smoke.py پیش از ری‌استارت
#
# .env، data/، logs/ و uploads/ در گیت نیستند و دست نمی‌خورند.
# اگر فایلی روی هاست دستی عوض شده باشد، pull متوقف می‌شود تا چیزی گم نشود.
set -euo pipefail
cd "$(dirname "$0")"

BRANCH="${DEPLOY_BRANCH:-main}"
before="$(git rev-parse HEAD)"

echo "→ گرفتن آخرین $BRANCH از گیت‌هاب…"
git fetch origin "$BRANCH"
if ! git merge --ff-only "origin/$BRANCH"; then
  echo "✗ روی هاست تغییری هست که در گیت‌هاب نیست. با «git status» ببین؛"
  echo "  اگر لازم نیست: git reset --hard origin/$BRANCH  (بعد دوباره ./deploy.sh)"
  exit 1
fi
after="$(git rev-parse HEAD)"

if [ "$before" = "$after" ]; then
  echo "• کد تازه‌ای نبود ($after)"
else
  echo "✓ از ${before:0:7} به ${after:0:7}:"
  git log --oneline "$before..$after" | head -20
  if git diff --name-only "$before" "$after" | grep -qx "requirements.txt"; then
    echo "→ requirements.txt عوض شده؛ نصب کتابخانه‌ها…"
    python -m pip install -q -r requirements.txt
  fi
fi

if [ "${1:-}" = "--test" ]; then
  echo "→ اجرای تست‌ها…"
  python test_smoke.py | tail -1
fi

./restart.sh
echo "✓ تمام. بررسی: curl -s \"\$(grep ^BASE_URL= .env | cut -d= -f2-)/health\""
