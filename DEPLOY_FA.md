# راهنمای دپلوی EasySaz روی هاست سی‌پنل

همان روش Obour است. آدرس نمونه: `https://dezhcode.pyho.ir/easysaz`
هاست خارج از ایران است، پس دسترسی به `api.telegram.org` مشکلی ندارد و پروکسی لازم نیست.

> پوشه کدها **نباید** داخل `public_html` باشد، وگرنه `.env` از مرورگر قابل دانلود می‌شود.

## ۱. ساخت اپ پایتون

در سی‌پنل وارد **Setup Python App** شو و **CREATE APPLICATION** را بزن:

| فیلد | مقدار |
|---|---|
| Python version | حداقل `3.10` |
| Application root | `easysaz_app` |
| Application URL | دامنه + مسیر `easysaz` |
| Application startup file | `passenger_wsgi.py` |
| Application entry point | `application` |

دستور «ورود به محیط» را که بالای صفحه نشان می‌دهد کپی کن:
```
source /home/USERNAME/virtualenv/easysaz_app/3.11/bin/activate && cd /home/USERNAME/easysaz_app
```

## ۲. کد و کتابخانه‌ها

فایل‌ها را در `easysaz_app` قرار بده (با git clone یا آپلود zip). اگر سی‌پنل خودش `passenger_wsgi.py` ساخته، با نسخه پروژه جایگزینش کن. بعد:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## ۳. فایل تنظیمات

```bash
cp .env.example .env && chmod 600 .env
python -c "import secrets; print('WEBHOOK_SECRET=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('WEBHOOK_PATH=/tg/' + secrets.token_urlsafe(16))"
python -c "import secrets; print('ADMIN_KEY=' + secrets.token_urlsafe(24))"
python -c "from cryptography.fernet import Fernet; print('TOKEN_KEY=' + Fernet.generate_key().decode())"
```
خروجی‌ها را همراه `BOT_TOKEN`، `ADMIN_IDS` و `BASE_URL=https://dezhcode.pyho.ir/easysaz` در `.env` بگذار.

> **از `TOKEN_KEY` بکاپ بگیر.** اگر گم شود، توکن ربات همه مشتری‌ها غیرقابل خواندن می‌شود و باید دوباره وصل کنند.

## ۴. بررسی و راه‌اندازی

```bash
python check_setup.py        # همه خطوط باید «درست» باشند
python test_smoke.py         # اختیاری: ۶۰ تست بدون شبکه
chmod 700 data logs
./restart.sh
```

`https://dezhcode.pyho.ir/easysaz/health` باید `easysaz: ok (warm)` بدهد.

## ۵. ثبت وبهوک

```bash
python manage_webhook.py set
```
یا در مرورگر: `https://dezhcode.pyho.ir/easysaz/setwebhook?key=ADMIN_KEY`

این دستور علاوه بر وبهوک، فهرست دستورها و دکمه منوی «پنل ساخت» ربات را هم تنظیم می‌کند.
برای دیدن وضعیت: `.../status?key=ADMIN_KEY`

## ۶. BotFather (اختیاری ولی پیشنهادی)

برای @EasySazBot:
- `/mybots` ← EasySazBot ← **Bot Settings** ← **Configure Mini App** ← Enable ← آدرس `https://dezhcode.pyho.ir/easysaz/panel`
  (تا لینک `t.me/EasySazBot?startapp` پنل را مستقیم باز کند)
- اگر می‌خواهی پنل با ظاهر کامل باز شود، در همان بخش حالت **Fullsize** را انتخاب کن.

برای پرداخت با Stars تنظیم خاصی لازم نیست.

## ۷. گرم نگه داشتن

Passenger پروسه بیکار را می‌خواباند. در **Cron Jobs** هر ۵ دقیقه (`*/5 * * * *`) این را اجرا کن:
```
curl -s https://dezhcode.pyho.ir/easysaz/health >/dev/null 2>&1
```

## ۸. تست نهایی

1. در @EasySazBot دستور `/start` را بزن و «پنل ساخت» را باز کن.
2. یک اسم بگذار، چند کامپوننت اضافه کن و «انتشار» را بزن.
3. یک ربات تست در BotFather بساز و توکنش را در «اتصال ربات» بفرست.
4. حالت «دکمه منو» را انتخاب کن. در ربات تست، دکمه منو باید مینی اپ را باز کند.
5. حالت «کنترل کامل» را امتحان کن. `/start` ربات تست باید پیام خوش‌آمد و دکمه بدهد.
6. شب‌نوشت: ربات تست را ادمین یک کانال تست کن (با اجازهٔ پست)، در پنل «تنظیمات ← کانال داستان‌ها» آیدی کانال را ثبت کن. یک فصل را «فقط اعضا» کن و منتشر کن؛ با یک حساب که عضو کانال نیست باید فقط پاراگراف اول و دکمهٔ عضویت را ببینی، و بعد از عضویت با «عضو شدم» متن کامل باز شود.
7. بعد از انتشار فصل تازه، در کارت «فصل تازه منتشر شد» دکمهٔ «اعلام کن» را بزن؛ پست کانال و پیام ربات به خواننده‌ها باید برسد. برای این‌که لینک پست کانال همان فصل را باز کند، ربات در حالت «کنترل کامل» باشد.

## رفع مشکل

- **ثبت کانال «پیدا نشد یا ربات عضوش نیست» می‌دهد:** ربات مینی‌اپ (نه @EasySazBot) باید ادمین همان کانال باشد. کانال خصوصی را با آیدی عددی (‎-100…‎) بنویس.

- **۵۰۰ روی /health:** `tail -50 logs/easysaz.log` و error log دامنه را ببین. معمولاً یعنی کتابخانه‌ها نصب نیستند یا `.env` ناقص است.
- **پنل «امضای initData معتبر نیست» می‌دهد:** `BOT_TOKEN` در `.env` با ربات اصلی یکی نیست.
- **ربات مشتری در حالت کنترل کامل جواب نمی‌دهد:** وبهوکش را با `getWebhookInfo` بررسی کن. آدرس باید `BASE_URL/hook/<bot_id>` باشد. اگر توکن را در BotFather عوض کرده، باید دوباره وصلش کند.
- **تغییر کد اعمال نمی‌شود:** `./restart.sh` را بزن.
- **database is locked:** اپ را ری‌استارت کن. اگر ادامه داشت، از پشتیبانی هاست بخواه `passenger_max_pool_size` را ۱ کند.
