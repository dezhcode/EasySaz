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

کد را از گیت‌هاب در `easysaz_app` بگیر (بخش «گرفتن کد از گیت‌هاب» پایین همین راهنما؛ به‌روزرسانی‌های بعدی هم با همان روش و `./deploy.sh` است). اگر سی‌پنل خودش `passenger_wsgi.py` ساخته، نسخهٔ پروژه جایش می‌نشیند. بعد:
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
python test_smoke.py         # اختیاری: ۱۱۰ تست بدون شبکه
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

**ساخت ربات با یک دکمه (ربات‌ساز):** در مینی‌اپ BotFather برای @EasySazBot بخش **Bot Management** (مدیریت ربات‌های دیگر) را روشن کن. بدون آن دکمهٔ «ساختن ربات» کار نمی‌کند و کاربر باید ربات را از BotFather بسازد و با توکن وصل کند.

**دستیار ساخت ربات با گفتگو (هوش مصنوعی):** در فایل `.env` کنار برنامه این خط را اضافه کن و Restart بزن:
```
EASYSAZ_AI_KEY=کلیدی-که-مدیر-سرویس-داده
```
(آدرس سرویس پیش‌فرض `https://dezhcode.pyho.ir` است؛ اگر فرق دارد `EASYSAZ_AI_URL` را هم بگذار.) بدون کلید، دستیار خاموش است و بقیهٔ ربات‌ساز کار می‌کند. کلید را هرگز در گیت یا پیام عمومی نگذار. سهم روزانه برای هر پلن در `app/plans.py` (`ai_daily`) است.

**ویدیوی معرفی:** کاربرها در اولین `/start` ویدیوی ۳۵ ثانیه‌ای ایزی‌ساز را می‌گیرند (کاربرهای قدیمی هم در `/start` بعدی‌شان، یک بار). بعد از به‌روزرسانی یک بار `python manage_webhook.py set` (یا `/setwebhook`) بزن تا دستور `/intro` در فهرست دستورهای ربات بیاید. اولین ارسال فایل را آپلود می‌کند و از آن به بعد فقط file_id فرستاده می‌شود.

بعد از به‌روزرسانی به نسخهٔ ربات‌ساز، اولین «انتشار» هر ربات وبهوکش را با نوع تازهٔ `pre_checkout_query` (پرداخت ستاره) دوباره ثبت می‌کند؛ کار دستی لازم نیست.

## ۷. گرم نگه داشتن

Passenger پروسه بیکار را می‌خواباند. در **Cron Jobs** هر ۵ دقیقه (`*/5 * * * *`) این را اجرا کن:
```
curl -s https://dezhcode.pyho.ir/easysaz/health >/dev/null 2>&1
```

## ۸. وب‌سایت

سایت روی همان اپ و همان دامنه است و تنظیم تازه‌ای نمی‌خواهد:

- `https://dezhcode.pyho.ir/easysaz/` لندینگ
- `https://dezhcode.pyho.ir/easysaz/login` ورود با تلگرام (QR)
- `https://dezhcode.pyho.ir/easysaz/account` حساب

- `https://dezhcode.pyho.ir/easysaz/studio` استودیو: مینی‌اپ‌ها، قالب‌ها (`/studio/templates`) و طراحی با کشیدن و رها کردن

جدول‌های ورود (`web_logins`، `web_sessions`) و مجله (`mag_posts`، `mag_cats`، `mag_authors`) خودشان در اولین اجرا ساخته می‌شوند. صوت و ویدیوی مطلب‌ها در همان `UPLOAD_DIR` ذخیره می‌شوند (صوت تا ۲۰ و ویدیو تا ۴۰ مگابایت)؛ اگر هاست سقف حجم درخواست دارد، دست‌کم ۴۰ مگابایت باشد. برای سلامت و cron همان `/health` را بزن، نه صفحهٔ اول.

## ۹. تست نهایی

1. در @EasySazBot دستور `/start` را بزن و «پنل ساخت» را باز کن.
2. یک اسم بگذار، چند کامپوننت اضافه کن و «انتشار» را بزن.
3. یک ربات تست در BotFather بساز و توکنش را در «اتصال ربات» بفرست.
4. حالت «دکمه منو» را انتخاب کن. در ربات تست، دکمه منو باید مینی اپ را باز کند.
5. حالت «کنترل کامل» را امتحان کن. `/start` ربات تست باید پیام خوش‌آمد و دکمه بدهد.
6. شب‌نوشت: ربات تست را ادمین یک کانال تست کن (با اجازهٔ پست)، در پنل «تنظیمات ← کانال داستان‌ها» آیدی کانال را ثبت کن. یک فصل را «فقط اعضا» کن و منتشر کن؛ با یک حساب که عضو کانال نیست باید فقط پاراگراف اول و دکمهٔ عضویت را ببینی، و بعد از عضویت با «عضو شدم» متن کامل باز شود.
7. بعد از انتشار فصل تازه، در کارت «فصل تازه منتشر شد» دکمهٔ «اعلام کن» را بزن؛ پست کانال و پیام ربات به خواننده‌ها باید برسد. برای این‌که لینک پست کانال همان فصل را باز کند، ربات در حالت «کنترل کامل» باشد.
8. وب‌سایت: `/login` را در کامپیوتر باز کن. در مینی‌اپ «حساب ← ورود به سایت» را بزن و QR را اسکن کن؛ اسم مرورگر را ببین و «بله، وارد شو» را بزن. سایت باید «وصل شدی» بگوید و به حساب برود. در «دستگاه‌های واردشده» خروج را امتحان کن.
9. مجله: در `/studio` یک مینی‌اپ با قالب «مجله» بساز، در «طراحی» حال‌وهوا را عوض کن و «انتشار ظاهر» را بزن، در «مطالب» یک مطلب با عکس و صوت منتشر کن. در مینی‌اپ ایزی‌ساز همان مینی‌اپ «مطلب تازه» دارد ولی طراحی ندارد. با ربات در «کنترل کامل» و ادمین کانال، «پست کانال» را بزن؛ دکمهٔ پست باید همان مطلب را باز کند.
10. ربات‌ساز: در داشبورد مینی‌اپ «ربات‌ساز» را باز کن. اگر ربات وصل نیست، «ساخت ربات با یک دکمه» را امتحان کن. پیام خوش‌آمد را عوض کن، یک دکمهٔ سبز با «کپی متن» و یک پیام کیبوردی با «فرستادن شماره» بساز و «تست» را بزن؛ در چت ربات باید نوار «حالت تست» و همان پیام‌ها و رنگ‌ها را ببینی. با یک حساب دیگر /start بزن: تا «انتشار» نسخهٔ قبلی را می‌بیند. «افزودن از تلگرام» در تب ایموجی را بزن، یک ایموجی پریمیوم بفرست و «برگشت به ربات‌ساز» را بزن.

## گرفتن کد از گیت‌هاب و به‌روزرسانی

همهٔ دستورها در **Terminal** سی‌پنل (یا `ssh USERNAME@HOST`) اجرا می‌شوند.

### یک بار: کلید دسترسی فقط‌خواندنی (Deploy key)

اگر مخزن خصوصی است، هاست با یک کلید SSH مخصوص خودش از گیت‌هاب می‌خواند (اگر عمومی است، این قسمت را رد کن و در دستورهای بعدی به‌جای `git@github-easysaz:` بنویس `https://github.com/`).
```bash
ssh-keygen -t ed25519 -C "easysaz-deploy" -f ~/.ssh/easysaz_deploy -N ""
cat ~/.ssh/easysaz_deploy.pub
```
خروجی را در گیت‌هاب بگذار: مخزن `dezhcode/EasySaz` ← **Settings** ← **Deploy keys** ← **Add deploy key** (تیک «Allow write access» را نزن).
بعد به SSH بگو برای این مخزن از همین کلید استفاده کند:
```bash
cat >> ~/.ssh/config <<'CFG'
Host github-easysaz
  HostName github.com
  User git
  IdentityFile ~/.ssh/easysaz_deploy
  IdentitiesOnly yes
CFG
chmod 600 ~/.ssh/config
ssh -T github-easysaz        # باید بگوید: successfully authenticated
```

### یک بار: وصل کردن پوشهٔ اپ به مخزن

پوشهٔ `easysaz_app` را Setup Python App ساخته (و شاید قبلاً فایل‌ها را با zip آپلود کرده‌ای)، پس به‌جای clone همین پوشه را به گیت وصل می‌کنیم:
```bash
cp -a ~/easysaz_app ~/easysaz_app.bak-$(date +%F)     # پشتیبان، برای احتیاط
cd ~/easysaz_app
git init -b main
git remote add origin git@github-easysaz:dezhcode/EasySaz.git
git fetch origin main
git reset --hard origin/main
chmod +x deploy.sh restart.sh
```
`reset --hard` فقط فایل‌های پروژه را با نسخهٔ گیت‌هاب یکی می‌کند؛ `.env`، `data/` (دیتابیس)، `logs/` و `uploads/` در گیت نیستند و دست نمی‌خورند. بعد مرحله‌های ۲ تا ۵ همین راهنما (کتابخانه‌ها، `.env`، بررسی و وبهوک) را اگر قبلاً انجام نداده‌ای، انجام بده.

### هر بار: فرستادن نسخهٔ تازه روی هاست

وقتی تغییری روی شاخهٔ `main` گیت‌هاب رفت:
```bash
source /home/USERNAME/virtualenv/easysaz_app/3.11/bin/activate && cd /home/USERNAME/easysaz_app
./deploy.sh              # یا ./deploy.sh --test تا قبل از ری‌استارت تست‌ها هم اجرا شوند
```
`deploy.sh` آخرین `main` را می‌گیرد، اگر `requirements.txt` عوض شده کتابخانه‌ها را نصب می‌کند و اپ را ری‌استارت می‌کند. بعد `…/easysaz/health` را باز کن. وبهوک لازم نیست دوباره ثبت شود، مگر `BASE_URL` یا `WEBHOOK_PATH` عوض شده باشد.

برگشت به نسخهٔ قبل (اگر نسخهٔ تازه مشکل داشت):
```bash
git log --oneline -5                 # شناسهٔ نسخهٔ سالم را پیدا کن
git reset --hard <شناسه> && ./restart.sh
```
دفعهٔ بعد `./deploy.sh` دوباره روی آخرین `main` می‌رود.

## رفع مشکل

- **ثبت کانال «پیدا نشد یا ربات عضوش نیست» می‌دهد:** ربات مینی‌اپ (نه @EasySazBot) باید ادمین همان کانال باشد. کانال خصوصی را با آیدی عددی (‎-100…‎) بنویس.

- **۵۰۰ روی /health:** `tail -50 logs/easysaz.log` و error log دامنه را ببین. معمولاً یعنی کتابخانه‌ها نصب نیستند یا `.env` ناقص است.
- **پنل «امضای initData معتبر نیست» می‌دهد:** `BOT_TOKEN` در `.env` با ربات اصلی یکی نیست.
- **ربات مشتری در حالت کنترل کامل جواب نمی‌دهد:** وبهوکش را با `getWebhookInfo` بررسی کن. آدرس باید `BASE_URL/hook/<bot_id>` باشد. اگر توکن را در BotFather عوض کرده، باید دوباره وصلش کند.
- **تغییر کد اعمال نمی‌شود:** `./restart.sh` را بزن. پنل را در تلگرام یک بار ببند و باز کن (فایل‌های JS/CSS تا ۵ دقیقه کش می‌شوند).
- **`./deploy.sh` می‌گوید تغییری روی هاست هست:** یعنی فایلی دستی روی هاست ویرایش شده. `git status` نشانش می‌دهد؛ اگر لازم نیست `git reset --hard origin/main` و دوباره `./deploy.sh`.
- **database is locked:** اپ را ری‌استارت کن. اگر ادامه داشت، از پشتیبانی هاست بخواه `passenger_max_pool_size` را ۱ کند.
