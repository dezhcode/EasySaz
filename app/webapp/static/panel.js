/* ایزی‌ساز — پنل ساخت (داخل @EasySazBot)
   جزءها و قانون‌ها از سیستم طراحی «ایزی‌ساز — کاشی».

   پوستهٔ اپ به سبک عبور: اسپلش ← سه تب با ناوبری شناور (خانه، قالب‌ها،
   حساب). خانه = کارت عبورِ هر مینی‌اپ، کارهای سریع، اتصال و آمار.
   ادیتور زیرصفحه است (بدون ناوبری اصلی): نوار بالا (برگشت، اسم،
   پیش‌نمایش، انتشار) + ریل صفحه‌ها، بوم، و داک شناور ابزارها.
   جریان ساخت: اسم (با پیش‌نمایش زندهٔ کارت) ← قالب ← ادیتور.
   هر تغییر فوراً روی بوم رندر و با تأخیر کوتاه پیش‌نویس ذخیره می‌شود.

   حالت نمایشی: بیرون از تلگرام با #demo، همه چیز با demo.js و
   localStorage کار می‌کند (بدون سرور) تا فرانت‌اند جدا ساخته و دیده شود. */
(function () {
  'use strict';

  const tg = window.Telegram && window.Telegram.WebApp;
  const ES = window.EasySaz;
  const BASE = document.documentElement.dataset.base || '/';
  const DEMO = document.documentElement.dataset.demo === '1' || (location.hash === '#demo' && !(tg && tg.initData));
  const $ = id => document.getElementById(id);
  const h = ES.h;

  /* ---------- آیکن‌ها (خطی ۱.۸، همان مجموعهٔ سیستم طراحی) ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const UI = Object.assign({}, ES.ICONS, {
    plus: 'M12 5v14M5 12h14',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    page: 'M6 3h9l4 4v14H6zM14 3v5h5',
    cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3',
    cap: 'M2 9l10-5 10 5-10 5-10-5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
    idcard: 'M3 6h18v12H3zM8 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 16c.6-1.4 1.4-2 2.5-2s1.9.6 2.5 2M14 10h4M14 14h3',
    poll: 'M5 20V10M12 20V4M19 20v-7',
    palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-4.9-4-8.8-9-8.8zM7.5 11.5v.01M10 7.5v.01M14.5 7.5v.01',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    x: 'M6 6l12 12M18 6L6 18',
    back: 'M9 6l6 6-6 6',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    move: 'M4 7h11M11 3l4 4-4 4M20 17H9M13 13l-4 4 4 4',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    bot: 'M5 9h14v10H5zM12 5v4M9 13v.01M15 13v.01M9 16h6',
    lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
    warn: 'M4 10v4h3l5 4V6L7 10H4zM16 9a4 4 0 0 1 0 6',
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
    template: 'M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z',
    settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    grip: 'M9 6v.01M15 6v.01M9 12v.01M15 12v.01M9 18v.01M15 18v.01',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
    header: 'M4 4h16v6H4zM4 14h16M4 18h10',
    tabbar: 'M4 14h16v6H4zM4 4h16M4 8h10',
    brush: 'M14 4l6 6-9 9H5v-6zM12 6l6 6',
    cup: 'M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M11 3v2',
    bolt: 'M13 3L4 14h7l-1 7 9-11h-7z',
    book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7',
    undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
    redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12z',
    pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    rocket: 'M5 15c-1 1-1.5 3.5-1.5 5.5 2 0 4.5-.5 5.5-1.5M9 15l-3-3c1.5-4 5-8 12-8 0 7-4 10.5-8 12l-3-3zM15 9v.01',
    // کامپوننت‌ها (نام آیکن در اسکیمای سرور)
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    text: 'M5 6h14M5 11h14M5 16h9',
    button: 'M4 8h16v8H4zM9 12h6',
    links: 'M8 6h12M8 12h12M8 18h12M4 6v.01M4 12v.01M4 18v.01',
    faq: 'M12 21a9 9 0 1 0-9-9c0 1.6.4 3.1 1.2 4.4L3 21l4.6-1.2A9 9 0 0 0 12 21zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 16.5v.01',
    social: 'M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM22 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM22 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM7.7 10.6l8.6-3.3M7.7 13.4l8.6 3.3',
    divider: 'M4 12h16M8 7h8M8 17h8',
    cards: 'M4 4h7v9H4zM13 4h7v9h-7zM4 16h7M13 16h7M4 19h5M13 19h5',
    gallery: 'M3 7h13v11H3zM6 4h15v11',
    features: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    pricing: 'M4 5h16v14H4zM8 9h8M8 13h5M15 16h2',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    order: 'M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4',
    send: 'M21 3L3 11l7 3 3 7 8-18zM10 14l4-4',
    sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
    minus: 'M6 12h12',
    hand: 'M9 11V5a2 2 0 0 1 4 0v5M13 10a2 2 0 0 1 4 0v1M17 11a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L5 14a2 2 0 0 1 3.3-2.2L9 13',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-3.5 3.6-6 7-6s6.2 2.5 7 6M16 3.5a4 4 0 0 1 0 7.5M18 15c2 .8 3.4 2.9 4 6',
    crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 0 1 5 .5c0 1.7-2.5 2-2.5 3.5M12 17v.01',
    scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
    laptop: 'M4 5h16v11H4zM2 19h20',
    mobile: 'M7 3h10v18H7zM11 18h2',
    logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-4.5',
  });
  function ico(name, cls) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', cls ? 'ico ' + cls : 'ico');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', UI[name] || UI.sparkle);
    s.appendChild(p);
    return s;
  }
  function catTile(cat, iconName) {
    const t = h('span', 'cat-tile cat-' + (cat || 'brand'));
    t.appendChild(ico(iconName));
    return t;
  }
  /* نشان ایزی‌ساز: «سِ رو به بالا» — حرف «س» ساز با سه دندانه که پله‌پله بالا می‌روند
     (design/brand؛ برش مخصوص اندازه‌های کوچک) */
  const MARK_D = 'M240,104 L240,122 Q240,140.225 227.113,153.113 Q214.225,166 196,166 Q182.545,166 172,158.977 Q161.455,166 148,166 Q140.702,166 134.261,163.934 Q129.869,171.126 123.497,177.497 Q102.995,198 74,198 Q45.005,198 24.503,177.497 Q4,156.995 4,128 L4,114 Q4,110.022 5.522,106.346 Q7.045,102.671 9.858,99.858 Q12.671,97.045 16.346,95.522 Q20.022,94 24,94 Q27.978,94 31.654,95.522 Q35.329,97.045 38.142,99.858 Q40.955,102.671 42.478,106.346 Q44,110.022 44,114 L44,128 Q44,140.426 52.787,149.213 Q61.574,158 74,158 Q86.426,158 95.213,149.213 Q104,140.426 104,128 L104,70 Q104,66.022 105.522,62.346 Q107.045,58.671 109.858,55.858 Q112.671,53.045 116.346,51.522 Q120.022,50 124,50 Q127.978,50 131.654,51.522 Q135.329,53.045 138.142,55.858 Q140.955,58.671 142.478,62.346 Q144,66.022 144,70 L144,122 Q144,126 148,126 Q152,126 152,122 L152,88 Q152,84.022 153.522,80.346 Q155.045,76.671 157.858,73.858 Q160.671,71.045 164.346,69.522 Q168.022,68 172,68 Q175.978,68 179.654,69.522 Q183.329,71.045 186.142,73.858 Q188.955,76.671 190.478,80.346 Q192,84.022 192,88 L192,122 Q192,126 196,126 Q200,126 200,122 L200,104 Q200,100.022 201.522,96.346 Q203.045,92.671 205.858,89.858 Q208.671,87.045 212.346,85.522 Q216.022,84 220,84 Q223.978,84 227.654,85.522 Q231.329,87.045 234.142,89.858 Q236.955,92.671 238.478,96.346 Q240,100.022 240,104 Z';
  function markSvg() {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 256 256');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', MARK_D);
    s.appendChild(p);
    return s;
  }
  const CAT_DOT = { story: '#C8192F', write: 'var(--write)', act: 'var(--act)', media: 'var(--media)', shop: 'var(--shop)', frame: 'var(--ink-3)' };

  /* ---------- وضعیت ---------- */
  const S = {
    schema: null, templates: null, me: null, app: null, doc: null, stats: null, plan: null,
    pageId: null, selected: null, previewing: false,
    saveTimer: 0, saving: false, pendingSave: false, saveState: '',
  };
  const page = () => S.doc.pages.find(p => p.id === S.pageId) || S.doc.pages[0];
  const totalBlocks = () => S.doc.pages.reduce((n, p) => n + p.blocks.length, 0);

  /* ---------- تلگرام ---------- */
  const haptic = k => { try { tg.HapticFeedback.impactOccurred(k || 'light'); } catch (e) {} };
  const notify = k => { try { tg.HapticFeedback.notificationOccurred(k); } catch (e) {} };
  const select = () => { try { tg.HapticFeedback.selectionChanged(); } catch (e) {} };

  function applyChrome() {
    // پنل ایزی‌ساز همیشه روشن است (مثل عبور)، هر تمی که تلگرام داشته باشد.
    // تم صفحهٔ مینی‌اپ در بوم جداست و از تنظیم «حالت» صاحب مینی‌اپ می‌آید.
    document.documentElement.dataset.theme = 'light';
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim();
    if (tg) {
      try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); tg.setBottomBarColor && tg.setBottomBarColor(bg); } catch (e) {}
      const sa = tg.safeAreaInset || {}, ca = tg.contentSafeAreaInset || {};
      document.documentElement.style.setProperty('--safe-t', ((sa.top || 0) + (ca.top || 0)) + 'px');
    }
  }

  function toast(text, warn) {
    const t = $('toast');
    t.classList.toggle('warn', !!warn);
    const i = t.querySelector('.toast-ico');
    i.textContent = '';
    i.appendChild(ico(warn ? 'warn' : 'check'));
    t.querySelector('.toast-txt').textContent = text;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 2200);
  }

  function botLink(start) {
    const bot = (S.me && S.me.bot) || 'EasySazBot';
    return 'https://t.me/' + bot + (start ? '?start=' + start : '');
  }
  /* کارهای مربوط به ربات (اتصال، پلن) در خود ربات انجام می‌شوند */
  function openBot(start) {
    if (DEMO || !tg) { toast('در ربات باز می‌شه: /start ' + (start || '')); return; }
    tg.openTelegramLink(botLink(start));
  }

  /* تأیید: داخل تلگرام showConfirm بومی؛ بیرون از آن (نسخهٔ نمایشی، مرورگر)
     پنجرهٔ خود صفحه، چون confirm مرورگر در همه‌جا کار نمی‌کند */
  function confirmBox(message, cb, opts) {
    opts = opts || {};
    if (tg && tg.showConfirm && tg.initData) { tg.showConfirm(message, ok => ok && cb()); return; }
    const wrap = h('div', 'confirm');
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    const box = h('div', 'confirm-box');
    const row = h('div', 'confirm-row');
    const no = h('button', 'btn secondary', 'انصراف');
    const yes = h('button', 'btn ' + (opts.danger ? 'danger' : 'primary'), opts.yes || 'تأیید');
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    no.addEventListener('click', close);
    yes.addEventListener('click', () => { close(); cb(); });
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onKey);
    row.append(no, yes);
    box.append(h('p', 'body', message), row);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    yes.focus();
  }

  /* ---------- API ---------- */
  /* بعد از انتشار: قسمت‌های تازه را به کانال و خواننده‌ها اعلام کن (app/kits/shab/api.py) */
  function announceCard(fresh) {
    const card = h('div', 'ann');
    const head = h('div', 'ann-h');
    head.append(catTile('story', 'notice'), h('b', '', fresh.length > 1 ? `${faN(fresh.length)} قسمت تازه منتشر شد` : 'یک قسمت تازه منتشر شد'));
    card.appendChild(head);
    const list = h('ul', 'ann-l');
    fresh.slice(0, 5).forEach(c => list.appendChild(h('li', '', `${c.title} — «${c.story}»`)));
    if (fresh.length > 5) list.appendChild(h('li', 'caption', `و ${faN(fresh.length - 5)} قسمت دیگر`));
    card.appendChild(list);
    if (!S.app.bot_username) {
      card.appendChild(h('p', 'caption', 'برای خبر دادن به خواننده‌ها اول ربات مینی‌اپ را وصل کن.'));
      return card;
    }
    const opts = { readers: true, channel: !!S.app.channel };
    const sw = (key, label, sub, disabled) => {
      const row = switchControl({ label }, opts[key], v => { opts[key] = v; });
      if (sub) row.appendChild(h('span', 'caption ann-sub', sub));
      if (disabled) { row.classList.add('off'); row.querySelector('.switch').disabled = true; }
      card.appendChild(row);
    };
    sw('readers', 'پیام به خواننده‌ها', 'کسانی که «خبرم کن» را روشن دارند، از @' + S.app.bot_username);
    sw('channel', 'پست در کانال', S.app.channel ? (S.app.channel.title || '@' + S.app.channel.username) : 'اول کانال را در «تنظیمات» ثبت کن', !S.app.channel);
    const go = h('button', 'btn btn-p btn-block');
    go.type = 'button';
    go.append(ico('send'), document.createTextNode('اعلام کن'));
    go.addEventListener('click', async () => {
      if (!opts.readers && !opts.channel) { toast('یکی را روشن کن', true); return; }
      go.disabled = true;
      try {
        const res = await api('kit/shab/announce', { id: S.app.id, chapters: fresh.map(c => c.id), readers: opts.readers, channel: opts.channel });
        notify('success');
        card.textContent = '';
        card.appendChild(h('b', '', res.readers || res.channel
          ? `در حال فرستادن${res.channel ? ' به کانال' : ''}${res.readers ? `${res.channel ? ' و ' : ' به '}${faN(res.readers)} خواننده` : ''}`
          : 'اعلام ثبت شد؛ هنوز خواننده‌ای «خبرم کن» ندارد'));
      } catch (err) { failed(err); go.disabled = false; }
    });
    card.appendChild(go);
    return card;
  }

  async function api(path, body) {
    if (DEMO) return window.EasySazDemo.api(path, body);
    const opts = { headers: { 'X-Init-Data': (tg && tg.initData) || '' }, cache: 'no-store' };
    if (body !== undefined) {
      opts.method = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res, data;
    try {
      res = await fetch(BASE + 'api/' + path, opts);
      data = await res.json();
    } catch (e) {
      const err = new Error('اتصال برقرار نشد؛ اینترنتت رو چک کن');
      err.status = 0;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(data.error || 'خطا');
      err.status = res.status;
      throw err;
    }
    return data;
  }
  async function publicJson(name) {
    const res = await fetch(BASE + 'api/' + name, { cache: 'no-store' });
    return res.json();
  }

  function failed(err) {
    if (err.status === 402) { upsellSheet(err.message); return; }
    notify('error');
    toast(err.message, true);
  }

  /* ---------- صفحه‌ها ---------- */
  const TABS = ['home', 'store', 'stats', 'account'];
  const SCREENS = ['home', 'store', 'stats', 'account', 'app', 'onboard', 'stories', 'editor', 'blocked'];
  function show(id, asTab) {
    SCREENS.forEach(s => { $(s).hidden = s !== id; });
    const splash = $('splash');
    if (splash && !splash.classList.contains('off')) { splash.classList.add('off'); setTimeout(() => splash.remove(), 450); }
    S.screen = id;
    S.asTab = !!asTab;
    if (id !== 'editor') popAll();
    const withNav = asTab && TABS.indexOf(id) >= 0;
    $('nav').hidden = !withNav;
    document.body.classList.toggle('has-nav', withNav);
    if (withNav) { S.tab = id; renderNav(); }
    syncBack();
    window.scrollTo(0, 0);
  }

  /* ===== ناوبری پایین (آتلیه روی منشور): تب فعال پررنگ با نقطهٔ زیرش ===== */
  function renderNav() {
    document.querySelectorAll('#nav .nav-i').forEach(b => {
      const on = b.dataset.tab === S.tab;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  function tab(name) {
    if (!TABS.includes(name)) name = 'home';
    show(name, true);
    ({ home: renderHome, store: renderStore, stats: renderStats, account: renderAccount })[name]();
  }
  /* داشبورد مینی‌اپ و مدیریت داستان‌ها صفحهٔ کامل‌اند، بدون ناوبری پایین */
  async function openDash(id) {
    if (!S.app || String(S.app.id) !== String(id)) { await saveNow(); await openApp(id, true); }
    showApp();
  }
  function showApp() { show('app'); renderApp(); }
  function showStories() { show('stories'); renderStories(); }

  /* ===== شروع: اسم ===== */
  /* ===== ساخت مینی‌اپ تازه: جادوی سه‌قدمی =====
     ۱. برای چیه؟ (کاشی نوع ← قالب مناسب)  ۲. اسم و لوگو، روی کارت عبور زنده
     ۳. حال‌وهوا: همین مینی‌اپ در چند رنگ. آخرش مینی‌اپ کامل در ادیتور. */
  /* فقط یک نوع مینی‌اپ: کانال داستان با قالب «قسمت» */
  const KIND = { key: 'story', tpl: 'shab', title: 'کانال داستان · قسمت', names: ['کابوس‌های کوتاه', 'قصه‌های شب', 'رمان من'] };
  const MOODS = [
    ['آبی عبور', '#1D55F0'], ['سرمه‌ای', '#0A2572'], ['مرجانی', '#E0573E'], ['سبز', '#12A071'], ['بنفش', '#6A55E0'], ['فیروزه‌ای', '#0E8FAE'],
  ];
  const W = { step: 2, kind: 'story', name: '', logo: '', accent: '', tpl: 'shab' };

  function onboard(tplId) {
    Object.assign(W, { step: 2, kind: 'story', name: '', logo: '', accent: '', tpl: tplId || 'shab' });
    show('onboard');
    const input = $('ob-name');
    input.value = '';
    input.oninput = () => { W.name = input.value.trim(); drawPass(); wizardFoot(); };
    input.onkeydown = e => { if (e.key === 'Enter' && W.name.length >= 2) $('wz-next').click(); };
    $('wz-back').onclick = () => {
      haptic();
      if (W.step > 2) wizardStep(W.step - 1);
      else if (S.me && S.me.apps.length) tab('home');
    };
    $('wz-next').onclick = () => {
      haptic();
      if (W.step < 3) wizardStep(W.step + 1); else wizardFinish();
    };
    $('wz-logo').onclick = async () => {
      const t = $('wz-logo-t');
      try {
        t.textContent = 'در حال آپلود…';
        const url = await uploadImage();
        if (url) { W.logo = url; drawPass(); notify('success'); }
      } catch (err) { failed(err); }
      t.textContent = W.logo ? 'لوگو گذاشته شد · عوض کردن' : 'لوگو (اختیاری)';
    };
    wizardStep(2);
  }

  function wizardStep(n) {
    W.step = n;
    [2, 3].forEach(i => { $('wz-' + i).hidden = i !== n; });
    document.querySelectorAll('.wz-dots i').forEach((d, i) => d.classList.toggle('on', i < n - 1));
    const titles = {
      2: ['اسم کانال و لوگو', 'قدم ۱ از ۲ · بالای مینی‌اپ و روی ربات دیده می‌شه'],
      3: ['رنگ تأکید', 'قدم ۲ از ۲ · پوستهٔ «قسمت» روشن و گرم است؛ رنگ تأکیدش را انتخاب کن'],
    };
    $('wz-title').textContent = titles[n][0];
    $('wz-sub').textContent = titles[n][1];
    $('wz-back').style.visibility = n === 2 && !(S.me && S.me.apps.length) ? 'hidden' : '';
    if (n === 2) {
      drawChips();
      drawPass();
      setTimeout(() => $('ob-name').focus(), 300);
    }
    if (n === 3) drawMoods();
    wizardFoot();
    window.scrollTo(0, 0);
  }

  function wizardFoot() {
    const next = $('wz-next');
    next.textContent = W.step === 3 ? 'بساز!' : 'ادامه';
    next.disabled = (W.step === 1 && !W.kind) || (W.step === 2 && W.name.length < 2) || (W.step === 3 && !W.accent);
  }

  const tplById = id => S.templates.templates.find(t => t.id === id) || null;
  const shabTemplate = () => tplById('shab') || S.templates.templates[0];
  const kindTemplate = () => tplById(W.tpl) || shabTemplate();

  function drawChips() {
    const k = KIND;
    const chips = $('ob-chips');
    chips.textContent = '';
    k.names.forEach(name => {
      const c = h('button', 'chip' + (W.name === name ? ' on' : ''), name);
      c.type = 'button';
      c.addEventListener('click', () => { $('ob-name').value = name; $('ob-name').oninput(); select(); drawChips(); });
      chips.appendChild(c);
    });
  }

  /* کارت مینی‌اپ در حال ساخت، به رنگ قالب انتخاب‌شده (مثل کارت خانه) */
  function drawPass() {
    const t = kindTemplate();
    const entry = storeOfKit(t.kit);
    $('ob-pass-name').textContent = W.name || 'اسم مینی‌اپت';
    const ini = $('ob-pass-initial');
    ini.textContent = '';
    ini.classList.toggle('has-logo', !!W.logo);
    if (W.logo) {
      const img = h('img');
      img.src = W.logo;
      img.alt = '';
      ini.appendChild(img);
    } else if (W.name) ini.textContent = W.name.charAt(0);
    else ini.appendChild(ico(entry ? entry.icon : 'layers'));
    $('ob-pass-kind').textContent = entry ? `${entry.title} · ${entry.tagline}` : t.title;
    tint($('ob-card'), entry);
    const chip = $('wz-tpl');
    chip.textContent = '';
    if (entry) {
      tint(chip, entry);
      chip.append(tq(entry, 'xs'), h('span', '', 'قالب'), h('b', '', entry.title));
    }
  }

  /* سند قالب با اسم، لوگو و رنگ کاربر؛ و اگر پلن اجازه نمی‌دهد، نسخهٔ جمع‌وجورش */
  function wizardDoc(accent) {
    const t = kindTemplate();
    const name = W.name.replace(/["\\]/g, '');
    const doc = JSON.parse(JSON.stringify(t.doc).split('{name}').join(name));
    doc.theme = Object.assign({}, doc.theme, { accent: accent || doc.theme.accent, mode: 'light' });
    if (W.logo) {
      if (doc.header) doc.header.logo = W.logo;
      doc.pages.forEach(p => p.blocks.forEach(b => { if (b.type === 'hero' && 'image' in (b.props || {})) b.props.image = W.logo; }));
    }
    return doc;
  }
  function fitToPlan(doc, plan) {
    let budget = plan.max_blocks, cut = false;
    const pages = doc.pages.slice(0, plan.max_pages);
    if (pages.length < doc.pages.length) cut = true;
    doc.pages = pages.map(pg => {
      const keep = pg.blocks.filter(b => plan.premium_blocks || !(S.schema.blocks[b.type] || {}).premium);
      const blocks = keep.slice(0, Math.max(0, budget));
      if (blocks.length < pg.blocks.length) cut = true;
      budget -= blocks.length;
      return Object.assign({}, pg, { blocks });
    });
    return cut;
  }

  function drawMoods() {
    const t = kindTemplate();
    const box = $('wz-moods');
    box.textContent = '';
    const kit = kitOf(t.kit);
    const list = kit && kit.accents ? kit.accents.slice(0, 4) : [['رنگ قالب', t.accent]].concat(MOODS)
      .filter((m, i, a) => a.findIndex(x => x[1].toLowerCase() === m[1].toLowerCase()) === i).slice(0, 4);
    if (!W.accent) W.accent = list[0][1];
    list.forEach(([label, accent]) => {
      const b = h('button', 'mood' + (W.accent === accent ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'radio');
      const frame = h('div', 'mood-frame');
      const mini = h('div');
      frame.appendChild(mini);
      const doc = wizardDoc(accent);
      fitToPlan(doc, S.me.plan);
      ES.render(mini, doc, { page: doc.pages[0].id, appName: W.name });
      const name = h('span', 'mood-name');
      const sw = h('i');
      sw.style.background = accent;
      name.append(sw, document.createTextNode(label), ico('check', 'mood-check'));
      b.append(frame, name);
      b.addEventListener('click', () => { W.accent = accent; select(); drawMoods(); wizardFoot(); });
      box.appendChild(b);
    });
  }

  async function wizardFinish() {
    const next = $('wz-next');
    next.disabled = true;
    next.textContent = 'در حال ساخت…';
    try {
      const res = await api('app/create', { name: W.name });
      S.me.apps.push(res.app);
      await openApp(res.app.id, true);
      const doc = wizardDoc(W.accent);
      const cut = fitToPlan(doc, S.plan);
      const saved = await api('app/save', { id: S.app.id, doc });
      S.doc = ES.normalize(saved.doc);
      S.app = saved.app;
      S.pageId = S.doc.pages[0].id;
      resetHistory();
      notify('success');
      if (S.doc.kit === 'shab') showStories(); else showApp();
      if (cut) setTimeout(() => toast('نسخهٔ رایگانِ قالب ساخته شد؛ با پلن حرفه‌ای کامل می‌شه'), 2600);
    } catch (err) {
      failed(err);
      next.disabled = false;
      wizardFoot();
    }
  }

  /* ===== قالب‌ها (TemplatePicker) =====
     دو جور: «قالب اختصاصی» (کیت: پوسته، سربرگ و کامپوننت‌های خودش، مثل
     قسمت) که نصب می‌شود، و قالب‌های شروع سریع روی پوستهٔ پایه. */
  const kitOf = k => (k && k !== 'base' && S.schema.kits && S.schema.kits[k]) || null;
  const docKit = () => kitOf(S.doc && S.doc.kit);
  function fillName(doc) {
    const name = (S.app && S.app.name) || '';
    return JSON.parse(JSON.stringify(doc).split('{name}').join(name.replace(/["\\]/g, '')));
  }

  /* نصب (یا نصب دوباره) قالب قسمت روی همین مینی‌اپ؛ لوگو و اسم می‌ماند */
  function installShab() {
    pickTemplate(shabTemplate(), false);
  }

  function pickTemplate(t, isNew) {
    if (t.premium && !S.plan.premium_blocks) { upsellSheet(`قالب «${t.title}» کامپوننت‌های حرفه‌ای دارد.`); return; }
    const special = t.kit && t.kit !== 'base';
    const apply = async () => {
      const doc = fillName(t.doc);
      const cut = fitToPlan(doc, S.plan);
      if (S.doc && S.doc.header && S.doc.header.logo && doc.header && !doc.header.logo) doc.header.logo = S.doc.header.logo;
      try {
        const res = await api('app/save', { id: S.app.id, doc });
        S.doc = ES.normalize(res.doc);
        recordChange(true);
        S.app = res.app;
        S.pageId = S.doc.pages[0].id;
        S.selected = null;
        notify('success');
        popAll();
        if (S.doc.kit === 'shab') showStories(); else showApp();
        toast(special ? `قالب «${t.title}» نصب شد` : `قالب «${t.title}» اعمال شد`);
        if (cut) setTimeout(() => toast(`نسخهٔ پلن ${S.plan.title}: ${S.doc.pages.length} صفحهٔ اول؛ بقیه با پلن حرفه‌ای`), 2400);
        else if (t.note) setTimeout(() => toast(t.note), 2400);
      } catch (err) { failed(err); }
    };
    if (!isNew && totalBlocks()) confirmBox(special
      ? `قالب «${t.title}» با پوسته و کامپوننت‌های خودش جای همهٔ صفحه‌های فعلی می‌نشیند (لوگو می‌ماند). ادامه می‌دی؟`
      : 'قالب تازه جای همهٔ صفحه‌های فعلی می‌نشیند. ادامه می‌دی؟', apply);
    else apply();
  }

  /* ===== ادیتور ===== */
  /* شناسهٔ پایدار قسمت‌ها (جای خواندن، نشان و آمار خواننده‌ها به آن بسته است).
     سرور هم خالی/تکراری را پر می‌کند، ولی پنل خودش می‌گذارد تا پیش‌نویس
     و سند منتشرشده یک شناسه داشته باشند. */
  const newChId = () => 'c' + Array.from(crypto.getRandomValues(new Uint8Array(5)), b => b.toString(16).padStart(2, '0')).join('');
  function ensureIds(doc) {
    const seen = new Set();
    (doc.pages || []).forEach(p => p.blocks.forEach(b => {
      if (b.type !== 'story') return;
      (b.props.chapters || []).forEach(c => {
        if (!c.id || !/^c[a-z0-9]{5,15}$/.test(c.id) || seen.has(c.id)) c.id = newChId();
        seen.add(c.id);
      });
    }));
    return doc;
  }

  async function openApp(id, quiet) {
    const res = await api('app?id=' + encodeURIComponent(id));
    if (S.app && S.doc && S.previews) S.previews[S.app.id] = S.doc;
    S.app = res.app;
    S.doc = ensureIds(ES.normalize(res.doc));
    resetHistory();
    S.stats = res.stats;
    S.shabStats = null;
    S.plan = res.plan;
    S.pageId = S.doc.pages[0].id;
    S.selected = null;
    try { localStorage.setItem('es-last-app', String(id)); } catch (e) {}
    sampleCovers();
    if (!quiet) openEditor();
  }
  /* ===================== ادیتور (طرح د: بخش‌ها) =====================
     صفحهٔ اصلی ادیتور فهرست «بخش»هاست: هر کامپوننت یک کارت با نوار نام
     همیشگی (دستگیره، ویرایش، بیشتر) و پیش‌نمایش واقعی خودش. بین بخش‌ها
     «+ افزودن این‌جا». ویرایش، ترتیب، ظاهر، صفحه‌ها، تنظیمات و پیش‌نمایش
     زیرصفحه‌اند (پشتهٔ S.stack) با مسیر بالا و پیش‌نمایش زنده؛ کارهای
     کوتاه (بیشتر، افزودن، انتشار) شیت‌اند. */
  function openEditor() {
    popAll();
    show('editor');
    renderAll();
  }
  async function leaveEditor() {
    if ($('sheet').classList.contains('on')) closeSheet();
    popAll();
    await saveNow();
    showApp();
  }

  function renderAll() {
    renderBar();
    renderPages();
    renderSecs();
  }

  function renderBar() {
    $('bar-name').textContent = S.app.name;
    const live = !!S.app.published_at;
    const st = $('bar-status');
    // یک خط کوتاه: وضعیت ذخیره وقتی در جریان است، وگرنه وضعیت انتشار
    const pub = S.app.status === 'paused' ? 'خاموش' : !live ? 'پیش‌نویس' : (S.app.dirty ? 'منتشر نشده' : 'منتشر شده');
    const save = { busy: 'ذخیره…', err: 'ذخیره نشد', '': '' }[S.saveState];
    st.querySelector('span').textContent = save || pub;
    st.title = pub + (save ? ' · ' + save : ' · ذخیره شد');
    st.className = 'caption status ' + (S.saveState || (live && !S.app.dirty ? 'live' : ''));
    $('bar-publish').classList.toggle('dirty', !!S.app.dirty || !live);
    const ss = $('st-status');
    if (ss) { ss.querySelector('span').textContent = save || pub; ss.className = st.className; }
    const sp = $('st-publish');
    if (sp) sp.classList.toggle('dirty', !!S.app.dirty || !live);
    document.querySelectorAll('.saved').forEach(drawSaved);
    renderDock();
  }
  /* نوار وضعیت داک: صفحهٔ فعلی · تعداد بخش · ذخیره | سهم کامپوننت پلن */
  function renderDock() {
    const ds = $('dock-status');
    if (!ds || !S.doc) return;
    const pg = page(), st = S.saveState;
    const save = st === 'busy' ? 'ذخیره…' : st === 'err' ? 'ذخیره نشد' : 'ذخیره شد';
    ds.querySelector('span').textContent = `${pg.title || 'صفحه'} · ${pg.blocks.length} بخش · ${save}`;
    ds.className = 'status ' + (st || 'live');
    const used = totalBlocks(), max = S.plan.max_blocks;
    const cnt = $('dock-count');
    cnt.textContent = `${used} از ${max} کامپوننت`;
    cnt.classList.toggle('full', used >= max);
  }
  /* «ذخیره شد» کنار نوار بالای زیرصفحه‌ها */
  function drawSaved(el) {
    el.textContent = '';
    const st = S.saveState;
    el.className = 'saved ' + (st || 'ok');
    if (st !== 'busy') el.appendChild(ico(st === 'err' ? 'warn' : 'check'));
    el.appendChild(document.createTextNode(st === 'busy' ? 'ذخیره…' : st === 'err' ? 'ذخیره نشد' : 'ذخیره شد'));
  }
  function savedMark() {
    const el = h('span', 'saved');
    drawSaved(el);
    return el;
  }

  /* ریل صفحه‌ها (زیرخط): زدن = رفتن؛ زدن دوباره روی صفحهٔ فعلی = صفحه‌ها */
  function renderPages() {
    const strip = $('pagestrip');
    strip.textContent = '';
    S.doc.pages.forEach(p => {
      const on = p.id === page().id;
      const b = h('button', 'ut' + (on ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.append(ico(p.icon), h('span', '', p.title));
      b.addEventListener('click', () => { haptic(); if (on) pagesPage(p.id); else goPage(p.id); });
      strip.appendChild(b);
    });
    const add = h('button', 'ut add');
    add.type = 'button';
    add.append(ico('plus'), h('span', '', 'صفحه'));
    add.addEventListener('click', () => { haptic(); addPage(); });
    strip.appendChild(add);
    requestAnimationFrame(() => { const on = strip.querySelector('.ut.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
  }

  function goPage(id) {
    if ($('sheet').classList.contains('on')) closeSheet();
    S.pageId = id;
    select();
    renderPages();
    renderSecs();
    window.scrollTo(0, 0);
  }

  /* ---------- رندر کوچک: یک یا چند کامپوننت با ظاهر خود مینی‌اپ ---------- */
  const specOf = b => S.schema.blocks[b.type] || { title: b.type, cat: 'frame', icon: 'sparkle', fields: [], desc: '' };
  function mini(el, blocks, extra) {
    ES.render(el, Object.assign({
      v: 2, kit: S.doc.kit, theme: S.doc.theme, header: { enabled: false }, tabbar: { enabled: false },
      pages: [{ id: 'p', title: '', icon: 'home', blocks }],
    }, extra || {}), { page: 'p', appName: S.app.name, editing: true, library: S.doc });
    return el;
  }
  function defaultBlock(type, over) {
    const spec = S.schema.blocks[type];
    const props = {};
    spec.fields.forEach(f => { props[f.key] = JSON.parse(JSON.stringify(f.default === undefined ? '' : f.default)); });
    if (over) Object.assign(props, JSON.parse(JSON.stringify(over)));
    return { id: newId(), type, props };
  }
  function iconBtn(name, label, fn, cls) {
    const b = h('button', cls || 'ib');
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.title = label;
    b.appendChild(ico(name));
    b.addEventListener('click', e => { e.stopPropagation(); haptic(); fn(); });
    return b;
  }

  /* ---------- صفحهٔ اصلی: بخش‌ها ---------- */
  let secsQueued = false;
  function renderSecs() {
    if (secsQueued) return;
    secsQueued = true;
    requestAnimationFrame(() => { secsQueued = false; if (S.doc) drawSecs(); });
  }
  function drawSecs() {
    const box = $('secs');
    box.textContent = '';
    const pg = page();
    renderDock();
    if (coachOn()) box.appendChild(coachCard());
    box.appendChild(headerCard());
    if (!pg.blocks.length) { box.appendChild(emptyState()); return; }
    pg.blocks.forEach((b, i) => {
      box.appendChild(addHere(i));
      box.appendChild(secCard(b));
    });
    box.appendChild(addHere(pg.blocks.length, true));
  }

  function secHead(cat, icon, title, sub, onEdit, extraStart, extraEnd) {
    const head = h('div', 'dsec-h');
    if (extraStart) head.appendChild(extraStart);
    const t = h('div', 'dsec-t');
    t.appendChild(h('b', '', title));
    if (sub) t.appendChild(h('small', '', sub));
    const edit = h('button', 'pe');
    edit.type = 'button';
    edit.append(ico('pencil'), document.createTextNode('ویرایش'));
    edit.addEventListener('click', () => { haptic(); onEdit(); });
    head.append(catTile(cat, icon), t, edit);
    if (extraEnd) head.appendChild(extraEnd);
    return head;
  }
  function secCard(b) {
    const spec = specOf(b);
    const card = h('div', 'dsec');
    card.dataset.id = b.id;
    const grip = iconBtn('grip', 'ترتیب بخش‌ها', orderPage, 'dsec-grip');
    const more = iconBtn('more', 'کارهای بیشتر', () => moreSheet(b.id), 'dsec-more');
    card.appendChild(secHead(spec.cat, spec.icon, spec.title, summary(b), () => editPage(b.id), grip, more));
    const body = h('button', 'dsec-b');
    body.type = 'button';
    body.setAttribute('aria-label', 'ویرایش ' + spec.title);
    body.appendChild(mini(h('div', 'dsec-pv'), [b]));
    body.addEventListener('click', () => { haptic(); editPage(b.id); });
    card.appendChild(body);
    return card;
  }
  /* سربرگ مشترک همهٔ صفحه‌ها: کارت خودش، یا یک خط «روشن کن» */
  function headerCard() {
    const hd = S.doc.header;
    if (!hd.enabled) {
      const off = h('button', 'dsec-off');
      off.type = 'button';
      const t = h('span', 'grow');
      t.append(h('b', '', 'نوار بالا خاموش است'), h('small', '', 'اسم و لوگو بالای همهٔ صفحه‌ها'));
      off.append(catTile('frame', 'header'), t, h('span', 'dsec-off-go', 'روشن کن'));
      off.addEventListener('click', () => { haptic(); framePage(); });
      return off;
    }
    const card = h('div', 'dsec dsec-header');
    card.appendChild(secHead('frame', 'header', 'نوار بالا', 'اسم و لوگو، بالای همهٔ صفحه‌ها', framePage));
    const body = h('button', 'dsec-b');
    body.type = 'button';
    body.setAttribute('aria-label', 'ویرایش نوار بالا');
    body.appendChild(mini(h('div', 'dsec-pv hd'), [], { header: hd }));
    body.addEventListener('click', () => { haptic(); framePage(); });
    card.appendChild(body);
    return card;
  }
  function addHere(i, last) {
    const row = h('div', 'addhere' + (last ? ' last' : ''));
    const b = h('button', 'addhere-b');
    b.type = 'button';
    b.append(ico('plus'), document.createTextNode(last ? 'افزودن بخش' : 'افزودن این‌جا'));
    b.addEventListener('click', () => { haptic(); addSheet(i); });
    row.append(h('i'), b, h('i'));
    return row;
  }
  function emptyState() {
    const box = h('div', 'dempty');
    box.append(h('b', 'dempty-t', 'این صفحه هنوز خالیه'),
      h('span', 'dempty-s', 'با یکی از این بخش‌های آماده شروع کن؛ بعداً همه‌چیزش عوض می‌شود.'));
    const free = SECTIONS.filter(s => !presetLocked(s));
    free.concat(SECTIONS.filter(s => presetLocked(s))).slice(0, 3).forEach(sec => box.appendChild(presetCard(sec, 0, true)));
    const all = h('button', 'btn btn-s btn-block');
    all.type = 'button';
    all.append(ico('template'), document.createTextNode('همهٔ بخش‌ها و کامپوننت‌ها'));
    all.addEventListener('click', () => { haptic(); addSheet(0); });
    box.appendChild(all);
    return box;
  }

  /* راهنمای یک‌باره (بالای بخش‌ها تا «فهمیدم») */
  function coachOn() { try { return !localStorage.getItem('es-coach-d'); } catch (e) { return false; } }
  function coachCard() {
    const c = h('div', 'coach');
    c.append(h('b', '', 'مینی‌اپت آماده است!'),
      h('span', '', 'هر بخش را با «ویرایش» تغییر بده. با «+ افزودن این‌جا» بخش تازه بگذار و با دستگیره ترتیب را عوض کن.'));
    const ok = h('button', 'btn btn-sm', 'فهمیدم');
    ok.type = 'button';
    ok.addEventListener('click', () => { try { localStorage.setItem('es-coach-d', '1'); } catch (e) {} haptic(); c.remove(); });
    c.appendChild(ok);
    return c;
  }
  function showCoach() {}

  /* کارت بخش را در دید بیاور و لحظه‌ای روشنش کن */
  function flash(id) {
    if (S.stack.length) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const c = document.querySelector(`#secs .dsec[data-id="${CSS.escape(id)}"]`);
      if (!c) return;
      c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      c.classList.add('flash');
      setTimeout(() => c.classList.remove('flash'), 1300);
    }));
  }

  /* ---------- برگرد و دوباره (Undo/Redo) ----------
     H.base حالت فعلی ذخیره‌شده در تاریخچه است؛ هر تغییر حالت قبلی را در past
     می‌گذارد. تغییرهای پشت‌سرهم (تایپ) زیر ۷۰۰ میلی‌ثانیه یک قدم حساب می‌شوند. */
  const H = { past: [], future: [], base: null, t: 0 };
  function resetHistory() {
    H.past = []; H.future = []; H.base = JSON.stringify(S.doc); H.t = 0;
    renderUndo();
  }
  function recordChange(force) {
    const cur = JSON.stringify(S.doc);
    if (H.base == null) { H.base = cur; return; }
    if (cur === H.base) return;
    const now = Date.now();
    if (force || now - H.t > 700 || !H.past.length) {
      H.past.push(H.base);
      if (H.past.length > 60) H.past.shift();
    }
    H.t = now;
    H.base = cur;
    H.future = [];
    renderUndo();
  }
  function renderUndo() {
    const u = $('bar-undo'), r = $('bar-redo');
    if (u) u.disabled = !H.past.length;
    if (r) r.disabled = !H.future.length;
  }
  function travel(from, to, label) {
    if (!from.length) return;
    if ($('sheet').classList.contains('on')) closeSheet();
    // زیرصفحه‌هایی که به بخشِ قدیمی اشاره دارند بسته می‌شوند؛ نمای ساده می‌ماند
    while (S.stack.length && !S.stack[S.stack.length - 1].safeUndo) { const pg = S.stack.pop(); if (pg.onPop) pg.onPop(); pg.el.remove(); }
    to.push(JSON.stringify(S.doc));
    const snap = from.pop();
    S.doc = ES.normalize(JSON.parse(snap));
    H.base = snap;
    H.t = 0;
    if (!S.doc.pages.find(p => p.id === S.pageId)) S.pageId = S.doc.pages[0].id;
    S.app.dirty = true;
    renderAll();
    if (S.stack.length) queueRefresh(S.stack[S.stack.length - 1]); else document.body.classList.remove('has-sub');
    renderUndo();
    scheduleSave();
    select();
    toast(label);
  }
  const undo = () => travel(H.past, H.future, 'برگشت');
  const redo = () => travel(H.future, H.past, 'دوباره انجام شد');

  /* هر تغییر: تاریخچه، ذخیرهٔ خودکار و به‌روز کردن چیزی که دیده می‌شود
     (زیرصفحهٔ بالایی، یا فهرست بخش‌ها) */
  function changed(quiet) {
    recordChange();
    S.app.dirty = true;
    renderBar();
    scheduleSave();
    if (quiet) return;
    const top = S.stack[S.stack.length - 1];
    if (top) queueRefresh(top);
    else if (S.screen === 'stories') renderStoriesQ();
    else renderSecs();
  }
  function queueRefresh(pg) {
    if (pg.queued) return;
    pg.queued = true;
    requestAnimationFrame(() => { pg.queued = false; if (pg.refresh) pg.refresh(); });
  }

  /* ---------- ذخیره ---------- */
  function setSave(state) {
    S.saveState = state;
    if (S.app) renderBar();
  }
  function scheduleSave() {
    clearTimeout(S.saveTimer);
    setSave('busy');
    S.saveTimer = setTimeout(saveNow, 900);
  }
  async function saveNow() {
    clearTimeout(S.saveTimer);
    if (!S.app) return;
    if (S.saving) { S.pendingSave = true; return; }
    S.saving = true;
    try {
      const res = await api('app/save', { id: S.app.id, doc: ensureIds(S.doc) });
      S.app = res.app;
      setSave('');
    } catch (err) {
      setSave('err');
      failed(err);
    } finally {
      S.saving = false;
      if (S.pendingSave) { S.pendingSave = false; saveNow(); }
    }
  }

  /* ---------- زیرصفحه‌ها (پشته) ----------
     هر زیرصفحه تمام‌صفحه است و خودش اسکرول می‌خورد. pg.refresh بعد از هر
     تغییر (و وقتی زیرصفحهٔ رویی بسته شد) صدا زده می‌شود. */
  S.stack = [];
  function push(build) {
    const el = h('section', 'sub');
    const pg = { el, refresh: null, onPop: null, redrawers: [] };
    build(el, pg);
    $('subs').appendChild(el);
    S.stack.push(pg);
    document.body.classList.add('has-sub');
    syncBack();
    return pg;
  }
  function pop() {
    const pg = S.stack.pop();
    if (!pg) return;
    if (pg.onPop) pg.onPop();
    pg.el.classList.add('out');
    setTimeout(() => pg.el.remove(), 240);
    afterStack();
  }
  function popAll() {
    if (!S.stack || !S.stack.length) return;
    while (S.stack.length) {
      const pg = S.stack.pop();
      if (pg.onPop) pg.onPop();
      pg.el.remove();
    }
    afterStack();
  }
  function afterStack() {
    const top = S.stack[S.stack.length - 1];
    if (top) { queueRefresh(top); syncBack(); return; }
    document.body.classList.remove('has-sub');
    syncBack();
    if (S.screen === 'editor' && S.doc) renderAll();
    else if (S.screen === 'stories' && S.doc) renderStories();
    else if (S.screen === 'app' && S.doc) renderApp();
  }
  /* نوار بالای زیرصفحه: برگشت، مسیر، عنوان، و انتهای نوار */
  function subTop(el, crumb, title, end) {
    const top = h('header', 'stop');
    const back = iconBtn('back', 'برگشت', pop, 'icon-btn sm');
    const t = h('div', 'stop-t');
    if (crumb) t.appendChild(h('span', 'stop-c', crumb + ' ‹'));
    t.appendChild(h('b', '', title));
    top.append(back, t);
    (end || []).forEach(x => top.appendChild(x));
    el.appendChild(top);
    return top;
  }
  /* پیش‌نمایش زندهٔ بالای زیرصفحه */
  /* پیش‌نمایش زندهٔ بالای زیرصفحه. همراه نوار بالا پین می‌شود (.shead) تا
     فرم زیرش اسکرول بخورد و تغییرها همیشه دیده شوند.
     fit (پیش‌فرض): قاب هم‌اندازهٔ خود کامپوننت است؛ اگر کامپوننت از سقف
     قاب بلندتر باشد، کامل و به‌تناسب کوچک می‌شود، هیچ‌وقت بریده نمی‌شود.
     «بزرگ‌تر» سقف را بالا می‌برد (فقط وقتی کامپوننت کوچک شده باشد پیداست).
     page: پیش‌نمایش کل صفحه با ارتفاع ثابت (ظاهر، نوار بالا و پایین). */
  function livePv(el, draw, label, page) {
    const pv = h('div', 'pv' + (page ? ' page' : ''));
    const row = h('div', 'pv-row');
    const tag = h('span', 'pv-tag');
    tag.append(h('i', 'dot'), document.createTextNode(label || 'پیش‌نمایش زنده'));
    const size = h('button', 'pv-size');
    size.type = 'button';
    const box = h('div', 'pv-box');
    const stage = page ? box : h('div', 'pv-stage');
    if (!page) box.appendChild(stage);
    const fit = () => {
      if (page) return;
      stage.style.transform = '';
      const natural = stage.offsetHeight;
      if (!natural) return;
      const cap = Math.round(window.innerHeight * (pv.classList.contains('big') ? 0.56 : 0.34));
      const k = natural > cap ? cap / natural : 1;
      stage.style.transform = k < 1 ? `scale(${k})` : '';
      box.style.height = Math.ceil(natural * k) + 'px';
      pv.classList.toggle('scaled', k < 1 || pv.classList.contains('big'));
    };
    const setSize = big => {
      pv.classList.toggle('big', big);
      size.textContent = '';
      size.append(ico(big ? 'up' : 'down'), document.createTextNode(big ? 'کوچک‌تر' : 'بزرگ‌تر'));
      size.setAttribute('aria-expanded', big ? 'true' : 'false');
      fit();
    };
    size.addEventListener('click', () => { S.pvBig = !pv.classList.contains('big'); setSize(S.pvBig); haptic(); });
    row.append(tag, size);
    pv.append(row, box);
    const stop = el.querySelector(':scope > .stop');
    const head = h('div', 'shead');
    if (stop) el.insertBefore(head, stop);
    else el.appendChild(head);
    if (stop) head.appendChild(stop);
    head.appendChild(pv);
    if (window.ResizeObserver) {
      new ResizeObserver(() => el.style.setProperty('--shead-h', head.offsetHeight + 'px')).observe(head);
      // تصویرها دیرتر بار می‌شوند و اندازهٔ کامپوننت عوض می‌شود
      if (!page) new ResizeObserver(fit).observe(stage);
    }
    el.addEventListener('scroll', () => head.classList.toggle('lifted', el.scrollTop > 4), { passive: true });
    const redraw = () => { draw(stage); requestAnimationFrame(fit); };
    setSize(!!S.pvBig);
    redraw();
    return redraw;
  }
  /* صفحهٔ فعلی مینی‌اپ با سربرگ و نوار پایین، در قاب کوتاه */
  function pagePreview(box, height) {
    box.style.height = 'min(' + height + 'px, 30vh)';
    box.textContent = '';
    const inner = h('div', 'pv-page');
    box.appendChild(inner);
    ES.render(inner, S.doc, { page: page().id, appName: S.app.name, editing: true });
  }
  function secLabel(parent, title, sub) {
    const s = h('div', 'slabel');
    s.appendChild(h('b', '', title));
    if (sub) s.appendChild(h('span', '', sub));
    parent.appendChild(s);
    return s;
  }

  /* ---------- Sheet ---------- */
  let sheetClose = null;
  function openSheet(build, onClose) {
    const sheet = $('sheet');
    if (sheet.classList.contains('on') && sheetClose) { const cb = sheetClose; sheetClose = null; cb(); }
    sheet.textContent = '';
    sheet.appendChild(h('div', 'grip'));
    build(sheet);
    sheet.scrollTop = 0;
    sheet.classList.add('on');
    $('scrim').classList.add('on');
    sheetClose = onClose || null;
    syncBack();
  }
  function closeSheet() {
    $('sheet').classList.remove('on');
    $('scrim').classList.remove('on');
    const cb = sheetClose;
    sheetClose = null;
    if (cb) cb();
    syncBack();
  }
  /* دکمهٔ برگشت بومی تلگرام: شیت، زیرصفحه، ادیتور یا زیرصفحه‌های بیرون از تب */
  function syncBack() {
    if (!tg || !tg.BackButton) return;
    const need = $('sheet').classList.contains('on') || (S.stack && S.stack.length)
      || ['editor', 'app', 'stories'].includes(S.screen) || (!S.asTab && S.screen === 'onboard' && S.app);
    if (need) tg.BackButton.show(); else tg.BackButton.hide();
  }

  function sheetHead(parent, cat, iconName, title, sub) {
    const head = h('div', 'sh-head');
    const t = h('div', 'sh-title');
    t.appendChild(h('div', 'title-2', title));
    if (sub) t.appendChild(h('div', 'caption', sub));
    const x = h('button', 'sh-x');
    x.setAttribute('aria-label', 'بستن');
    x.appendChild(ico('x'));
    x.addEventListener('click', closeSheet);
    head.append(catTile(cat, iconName), t, x);
    parent.appendChild(head);
  }
  /* ---------- فرم‌ساز از روی اسکیما ---------- */
  let fieldSeq = 0;

  function selectControl(field, value, onChange) {
    const opts = (field.options || []).map(o => Array.isArray(o) ? o : [o, o]);
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', field.label));
    const box = h('div', opts.length <= 4 ? 'seg' : 'pills');
    box.setAttribute('role', 'radiogroup');
    opts.forEach(([key, label]) => {
      const b = h('button', key === value ? 'on' : '', label);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', key === value ? 'true' : 'false');
      b.addEventListener('click', () => {
        box.querySelectorAll('button').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('on');
        b.setAttribute('aria-checked', 'true');
        select();
        onChange(key);
      });
      box.appendChild(b);
    });
    wrap.appendChild(box);
    return wrap;
  }

  function switchControl(field, value, onChange) {
    const row = h('div', 'switch-row');
    const id = 'f' + (++fieldSeq);
    const label = h('label', 'body-strong', field.label);
    label.htmlFor = id;
    const sw = h('button', 'switch');
    sw.id = id;
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', value ? 'true' : 'false');
    sw.addEventListener('click', () => {
      const v = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', v ? 'true' : 'false');
      select();
      onChange(v);
    });
    row.append(label, sw);
    return row;
  }

  /* عدد با «خودکار»: گوشه‌ها */
  function intControl(field, value, onChange, autoLabel) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', field.label));
    const row = h('div', 'slider-row');
    const range = h('input');
    range.type = 'range';
    range.min = field.min || 0;
    range.max = field.max || 40;
    range.setAttribute('aria-label', field.label);
    const val = h('span', 'slider-val');
    const auto = field.default == null;
    const seg = auto ? h('div', 'seg') : null;
    let autoBtn = null;
    const set = v => {
      const isAuto = v == null;
      range.disabled = isAuto;
      range.value = isAuto ? (S.doc.theme.radius_px || 18) : v;
      val.textContent = isAuto ? '—' : v + 'px';
      if (autoBtn) autoBtn.classList.toggle('on', isAuto);
    };
    if (auto) {
      autoBtn = h('button', '', autoLabel || 'خودکار');
      autoBtn.type = 'button';
      autoBtn.addEventListener('click', () => {
        const v = autoBtn.classList.contains('on') ? Number(range.value) : null;
        set(v); onChange(v); select();
      });
      seg.appendChild(autoBtn);
      row.appendChild(seg);
    }
    range.addEventListener('input', () => { set(Number(range.value)); onChange(Number(range.value)); });
    row.append(range, val);
    wrap.appendChild(row);
    set(value == null ? (auto ? null : field.default) : value);
    return wrap;
  }

  /* عدد صحیح (قیمت، کمترین و بیشترین و …): رقم فارسی هم قبول است؛ با بیرون آمدن از فیلد به بازهٔ مجاز می‌چسبد */
  function numberControl(field, value, onChange) {
    const id = 'f' + (++fieldSeq);
    const wrap = h('div', 'field');
    const label = h('label', 'label', field.label);
    label.htmlFor = id;
    const input = h('input', 'ltr num-in');
    input.id = id;
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    const clamp = n => Math.max(field.min != null ? field.min : 0, Math.min(field.max != null ? field.max : 1e9, n));
    const parse = t => Number(String(t).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, ''));
    input.value = String(value != null ? value : field.default);
    input.addEventListener('input', () => {
      const t = input.value.trim();
      if (!t) return;
      const n = parse(t);
      if (!isNaN(n)) onChange(clamp(n));
    });
    input.addEventListener('blur', () => {
      const n = clamp(parse(input.value) || (field.default != null ? field.default : 0));
      input.value = String(n);
      onChange(n);
    });
    wrap.append(label, input);
    return wrap;
  }

  /* رنگ اختصاصی: «از صفحه» یا یکی از رنگ‌های آماده */
  function colorControl(field, value, onChange) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', field.label));
    const box = h('div', 'colors');
    const draw = () => {
      box.textContent = '';
      const inherit = h('button', 'inherit' + (!value ? ' on' : ''), 'از ظاهر صفحه');
      inherit.type = 'button';
      inherit.addEventListener('click', () => { value = ''; onChange(''); select(); draw(); });
      box.appendChild(inherit);
      S.schema.swatches.forEach(([name, color]) => {
        const on = (value || '').toLowerCase() === color.toLowerCase();
        const b = h('button', on ? 'on' : '');
        b.type = 'button';
        b.style.background = color;
        b.setAttribute('aria-label', name);
        b.appendChild(ico('check'));
        b.addEventListener('click', () => { value = color; onChange(color); select(); draw(); });
        box.appendChild(b);
      });
    };
    draw();
    wrap.appendChild(box);
    return wrap;
  }

  /* ---------- آپلود تصویر ---------- */
  function pickFile() {
    return new Promise(resolve => {
      const input = $('file');
      input.value = '';
      input.onchange = () => resolve(input.files && input.files[0]);
      input.click();
    });
  }
  function resizeImage(file, max) {
    // FileReader به‌جای blob: تا CSP (img-src 'self' https: data:) باز نشود
    return new Promise((resolve, reject) => {
      const bad = () => reject(Object.assign(new Error('این فایل تصویر نیست'), { status: 400 }));
      const reader = new FileReader();
      reader.onerror = bad;
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          let data = c.toDataURL('image/webp', 0.85);
          if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/jpeg', 0.85);
          resolve(data);
        };
        img.onerror = bad;
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function uploadImage() {
    const file = await pickFile();
    if (!file) return null;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw Object.assign(new Error('فقط تصویر JPG، PNG یا WEBP'), { status: 400 });
    const data = await resizeImage(file, DEMO ? 1000 : 1600);
    const res = await api('upload', { data });
    return res.url;
  }

  function imageControl(field, value, onChange) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', field.label));
    const box = h('div', 'imgf');
    const thumb = h('span', 'imgf-thumb');
    const actions = h('div', 'imgf-actions');
    const up = h('button', 'btn secondary xs');
    up.type = 'button';
    up.append(ico('upload'), document.createTextNode('آپلود تصویر'));
    const linkBtn = h('button', 'btn secondary xs', 'لینک');
    linkBtn.type = 'button';
    const del = h('button', 'btn danger xs', 'حذف');
    del.type = 'button';
    actions.append(up, linkBtn, del);
    box.append(thumb, actions);
    wrap.appendChild(box);
    const url = h('input');
    url.type = 'url';
    url.className = 'ltr imgf-url';
    url.placeholder = 'https://';
    url.setAttribute('aria-label', field.label + ' — لینک');
    url.hidden = true;
    wrap.appendChild(url);
    const draw = () => {
      thumb.textContent = '';
      const src = ES.safeUrl(value, true);
      if (src) { const i = h('img'); i.alt = ''; i.src = src; thumb.appendChild(i); } else thumb.appendChild(ico('image'));
      del.hidden = !value;
      url.value = /^data:/.test(value || '') ? '' : (value || '');
    };
    up.addEventListener('click', async () => {
      box.classList.add('busy');
      up.disabled = true;
      try {
        const res = await uploadImage();
        if (res) { value = res; onChange(res); draw(); notify('success'); }
      } catch (err) { failed(err); } finally { box.classList.remove('busy'); up.disabled = false; }
    });
    linkBtn.addEventListener('click', () => { url.hidden = !url.hidden; if (!url.hidden) url.focus(); });
    del.addEventListener('click', () => { value = ''; onChange(''); draw(); });
    url.addEventListener('input', () => { value = url.value; onChange(url.value); draw(); });
    draw();
    return wrap;
  }

  function control(field, value, onChange) {
    if (field.type === 'select') return selectControl(field, value, onChange);
    if (field.type === 'bool') return switchControl(field, value, onChange);
    if (field.type === 'int') return field.unit === 'px' ? intControl(field, value, onChange) : numberControl(field, value, onChange);
    if (field.type === 'color') return colorControl(field, value, onChange);
    if (field.type === 'image') return imageControl(field, value, onChange);
    const id = 'f' + (++fieldSeq);
    const wrap = h('div', 'field');
    const label = h('label', 'label', field.label);
    label.htmlFor = id;
    wrap.appendChild(label);
    let input;
    if (field.type === 'textarea') {
      input = h('textarea');
      input.rows = 3;
      const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(320, input.scrollHeight + 2) + 'px'; };
      input.addEventListener('input', grow);
      setTimeout(grow, 0);
    } else {
      input = h('input');
      input.type = field.type === 'url' ? 'url' : 'text';
      if (input.type === 'url') { input.classList.add('ltr'); input.placeholder = 'https://'; input.inputMode = 'url'; }
    }
    input.id = id;
    if (field.max) input.maxLength = field.max;
    input.value = value == null ? '' : value;
    wrap.appendChild(input);
    let count = null;
    const updateCount = () => {
      if (!field.max) return;
      const near = input.value.length >= field.max * 0.8;
      if (near && !count) { count = h('span', 'caption count'); wrap.appendChild(count); }
      if (count) { count.hidden = !near; count.textContent = input.value.length + ' / ' + field.max; }
    };
    input.addEventListener('input', () => { updateCount(); onChange(input.value); });
    updateCount();
    return wrap;
  }



  /* ---------- ویرایش کامپوننت ---------- */
  function findBlock(id) {
    for (const p of S.doc.pages) {
      const i = p.blocks.findIndex(b => b.id === id);
      if (i >= 0) return { page: p, index: i, block: p.blocks[i] };
    }
    return null;
  }

  /* ---------- سبک‌های آماده (VariantStrip) ----------
     هر سبک ترکیبی از فیلدهای ظاهری و ظاهر کامپوننت است (app/blocks.py VARIANTS).
     پیش‌نمایش‌ها همین کامپوننت با محتوای خود کاربرند، نه تصویر ثابت. */
  function variantBlock(block, v) {
    const style = Object.assign({}, v.style);
    if (block.style && block.style.accent) style.accent = block.style.accent;
    return { id: block.id + 'v', type: block.type, props: Object.assign({}, block.props, v.props), style };
  }
  function variantActive(block, v) {
    const spec = S.schema.blocks[block.type];
    const def = k => { const f = spec.fields.find(x => x.key === k); return f ? f.default : undefined; };
    const propsOk = Object.keys(v.props).every(k => (block.props[k] != null ? block.props[k] : def(k)) === v.props[k]);
    const cur = Object.assign({}, block.style || {});
    delete cur.accent;
    const norm = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
    return propsOk && norm(cur) === norm(v.style);
  }
  function applyVariant(block, v) {
    Object.assign(block.props, v.props);
    const accent = block.style && block.style.accent;
    block.style = Object.assign({}, v.style);
    if (accent) block.style.accent = accent;
  }
  function variantStrip(block, variants, onApply) {
    const sec = h('div', 'var-sec');
    sec.appendChild(h('div', 'label', 'سبک'));
    const row = h('div', 'var-row');
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', 'سبک کامپوننت');
    const cards = variants.map(v => {
      const b = h('button', 'var-card');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      const frame = h('div', 'var-frame');
      const mini = h('div');
      frame.appendChild(mini);
      const name = h('span', 'var-name');
      name.append(ico('check', 'var-check'), document.createTextNode(v.title));
      b.append(frame, name);
      b.addEventListener('click', () => {
        applyVariant(block, v);
        haptic();
        onApply();
        sec.redraw();
      });
      row.appendChild(b);
      return { v, b, mini };
    });
    sec.appendChild(row);
    sec.redraw = () => cards.forEach(({ v, b, mini }) => {
      ES.render(mini, {
        v: 2, kit: S.doc.kit, theme: S.doc.theme, header: { enabled: false }, tabbar: { enabled: false },
        pages: [{ id: 'p', title: '', icon: 'home', blocks: [variantBlock(block, v)] }],
      }, { page: 'p', appName: S.app.name, library: S.doc });
      const on = variantActive(block, v);
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    sec.redraw();
    // سبک فعال در دید باشد
    requestAnimationFrame(() => { const on = row.querySelector('.var-card.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    return sec;
  }
  function debounce(fn, ms) {
    let t = null;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function sortable(list, onDone) {
    let drag = null;
    list.addEventListener('pointerdown', e => {
      const handle = e.target.closest('.layer-handle');
      if (!handle) return;
      const row = handle.closest('.layer');
      drag = { row, startY: e.clientY };
      row.classList.add('dragging');
      handle.setPointerCapture(e.pointerId);
      haptic();
      e.preventDefault();
    });
    list.addEventListener('pointermove', e => {
      if (!drag) return;
      const rows = [...list.querySelectorAll('.layer[data-id]')].filter(r => r !== drag.row);
      const target = rows.find(r => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
      const before = drag.row.nextElementSibling;
      if (target) { if (target !== drag.row.nextElementSibling) list.insertBefore(drag.row, target); } else list.appendChild(drag.row);
      if (drag.row.nextElementSibling !== before) select();
    });
    const end = () => {
      if (!drag) return;
      drag.row.classList.remove('dragging');
      drag = null;
      onDone([...list.querySelectorAll('.layer[data-id]')].map(r => r.dataset.id));
    };
    list.addEventListener('pointerup', end);
    list.addEventListener('pointercancel', end);
  }

  function summary(block) {
    const p = block.props || {};
    const first = p.title || p.label || p.text || p.caption || p.name;
    if (first) return String(first).split('\n')[0];
    if (Array.isArray(p.items)) return p.items.length + ' مورد';
    return '';
  }

  function newId() {
    return 'b' + Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  }

  /* ---------- کارهای یک بخش (مشترک فهرست، «بیشتر»، پای صفحهٔ ویرایش و ترتیب) ---------- */
  function moveBlock(id, d) {
    const f = findBlock(id);
    if (!f) return false;
    const list = f.page.blocks, j = f.index + d;
    if (j < 0 || j >= list.length) return false;
    list.splice(j, 0, list.splice(f.index, 1)[0]);
    select();
    changed();
    return true;
  }
  function copyBlock(id) {
    const f = findBlock(id);
    if (!f) return null;
    if (totalBlocks() >= S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return null; }
    const copy = JSON.parse(JSON.stringify(f.block));
    copy.id = newId();
    f.page.blocks.splice(f.index + 1, 0, copy);
    haptic('medium');
    changed();
    return copy.id;
  }
  function removeBlock(id, after) {
    confirmBox('این بخش حذف بشه؟ با «برگرد» بالای ادیتور برمی‌گرده.', () => {
      const f = findBlock(id);
      if (!f) return;
      f.page.blocks.splice(f.index, 1);
      notify('warning');
      changed();
      toast('بخش حذف شد');
      if (after) after();
    });
  }

  /* ---------- ویرایش یک بخش (زیرصفحه) ----------
     بالا: مسیر و پیش‌نمایش زندهٔ خود بخش. بعد سبک‌های آماده، محتوا (فهرست‌ها
     ردیف‌اند و هر آیتم زیرصفحهٔ خودش را دارد) و «تنظیمات بیشتر ظاهر».
     پا: بالا، پایین، تکثیر، حذف. */
  function editPage(id) {
    const found = findBlock(id);
    if (!found) return;
    if (found.block.type === 'story') { storyPage(id); return; }
    const block = found.block;
    const spec = specOf(block);
    push((el, pg) => {
      subTop(el, found.page.title, spec.title, [savedMark(), iconBtn('more', 'کارهای بیشتر', () => moreSheet(id), 'icon-btn sm flat')]);
      const redrawPv = livePv(el, box => { const cur = findBlock(id); if (cur) mini(box, [cur.block]); });
      const body = h('div', 'sbody');
      el.appendChild(body);

      // ۱. سبک‌های آماده، با پیش‌نمایش زندهٔ همین کامپوننت
      const variants = (S.schema.variants || {})[block.type] || [];
      let strip = null;
      if (variants.length) {
        strip = variantStrip(block, variants, () => { changed(); drawMore(); });
        body.appendChild(strip);
      }
      const redrawStrip = debounce(() => strip && strip.redraw(), 260);

      // ۲. محتوا
      const content = h('div', 'content-sec');
      const whenRows = [];
      spec.fields.filter(f => !f.look).forEach(f => {
        let node;
        if (f.type === 'list') {
          if (!Array.isArray(block.props[f.key])) block.props[f.key] = [];
          node = itemRows(id, f, pg);
        } else {
          node = control(f, block.props[f.key], v => { block.props[f.key] = v; changed(); });
        }
        if (f.when) whenRows.push([node, f.when]);
        content.appendChild(node);
      });
      body.appendChild(content);
      const syncWhen = () => whenRows.forEach(([node, when]) => {
        node.hidden = !Object.keys(when).every(k => when[k].indexOf(block.props[k]) >= 0);
      });
      syncWhen();

      // ۳. «بیشتر»: تنظیم‌های ریز ظاهر برای کسی که دقیق‌تر می‌خواهد
      const looks = spec.fields.filter(f => f.look);
      const allowed = spec.style || [];
      const more = h('details', 'more-sec');
      more.open = !!S.moreOpen;
      more.addEventListener('toggle', () => { S.moreOpen = more.open; });
      const sum = h('summary');
      sum.append(ico('brush'), h('span', 'grow', 'تنظیمات بیشتر ظاهر'), ico('chev', 'more-chev'));
      more.appendChild(sum);
      const moreBody = h('div', 'more-body');
      more.appendChild(moreBody);
      function drawMore() {
        moreBody.textContent = '';
        looks.forEach(f => {
          moreBody.appendChild(control(f, block.props[f.key], v => { block.props[f.key] = v; changed(); }));
        });
        block.style = block.style || {};
        S.schema.style.filter(f => allowed.indexOf(f.key) >= 0).forEach(f => {
          const cur = block.style[f.key] != null ? block.style[f.key] : f.default;
          moreBody.appendChild(control(f, cur, v => {
            if (v === null || v === '' || v === f.default) delete block.style[f.key]; else block.style[f.key] = v;
            changed();
          }));
        });
        const reset = h('button', 'add-item', 'برگشت به ظاهر پیش‌فرض');
        reset.type = 'button';
        reset.addEventListener('click', () => {
          looks.forEach(f => { block.props[f.key] = f.default; });
          block.style = {};
          changed();
          drawMore();
        });
        moreBody.appendChild(reset);
      }
      if (looks.length || allowed.length) {
        drawMore();
        body.appendChild(more);
      }

      const foot = blockFoot(id);
      el.appendChild(foot);
      pg.refresh = () => {
        if (!findBlock(id)) return;
        redrawPv();
        redrawStrip();
        syncWhen();
        foot.sync();
        pg.redrawers.forEach(fn => fn());
      };
    });
  }

  function blockFoot(id) {
    const foot = h('div', 'sfoot');
    const mk = (icon, label, fn, cls) => {
      const b = h('button', 'btn btn-s ' + (cls || ''));
      b.type = 'button';
      b.append(ico(icon), h('span', '', label));
      b.addEventListener('click', () => { haptic(); fn(); });
      foot.appendChild(b);
      return b;
    };
    const up = mk('up', 'بالا', () => { if (moveBlock(id, -1)) toast('یکی بالاتر رفت'); });
    const dn = mk('down', 'پایین', () => { if (moveBlock(id, 1)) toast('یکی پایین‌تر رفت'); });
    mk('copy', 'تکثیر', () => { if (copyBlock(id)) toast('تکثیر شد؛ نسخهٔ تازه زیر همین بخش است'); });
    const del = mk('trash', 'حذف', () => removeBlock(id, () => { if (S.stack.length) pop(); }), 'danger sq');
    del.setAttribute('aria-label', 'حذف بخش');
    foot.sync = () => {
      const f = findBlock(id);
      if (!f) return;
      up.disabled = f.index <= 0;
      dn.disabled = f.index >= f.page.blocks.length - 1;
    };
    foot.sync();
    return foot;
  }

  /* ---------- فهرست داخل یک بخش (لینک‌ها، سوال‌ها، پلن‌ها…) ----------
     هر آیتم یک ردیف: زدن = زیرصفحهٔ همان آیتم، دستگیره = جابه‌جایی */
  function itemTitle(fd, it, i) {
    const f = fd.fields.find(x => x.type === 'text' || x.type === 'textarea' || x.type === 'select');
    let t = '';
    if (f && f.type === 'select') {
      const o = (f.options || []).find(o => (Array.isArray(o) ? o[0] : o) === it[f.key]);
      t = o ? (Array.isArray(o) ? o[1] : o) : '';
    } else if (f) t = String(it[f.key] || '').split('\n')[0];
    return t || (fd.item_label || 'مورد') + ' ' + (i + 1);
  }
  const emptyUrl = v => !v || /^https?:\/\/(t\.me\/?)?$/i.test(String(v).trim());
  function itemSub(fd, it) {
    const url = fd.fields.find(x => x.type === 'url');
    if (url) return emptyUrl(it[url.key]) ? { warn: true, t: 'لینک هنوز خالی است' } : { t: String(it[url.key]).replace(/^https?:\/\//, '') };
    const txt = fd.fields.filter(x => x.type === 'text' || x.type === 'textarea');
    const second = txt[txt[0] && fd.fields[0].type !== 'select' ? 1 : 0];
    return { t: second ? String(it[second.key] || '').split('\n')[0] : '' };
  }
  function blankItem(fd) {
    const it = {};
    fd.fields.forEach(sub => { it[sub.key] = sub.type === 'select' ? sub.default : (sub.type === 'bool' ? !!sub.default : (sub.default != null ? sub.default : '')); });
    return it;
  }
  function itemRows(id, fd, pg) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', fd.label));
    const list = h('div', 'layers');
    const add = h('button', 'add-item', '+ افزودن ' + (fd.item_label || 'مورد'));
    add.type = 'button';
    wrap.append(list, add);
    const items = () => { const f = findBlock(id); return f ? f.block.props[fd.key] : []; };
    const draw = () => {
      list.textContent = '';
      const arr = items();
      arr.forEach((it, i) => {
        const row = h('div', 'layer');
        row.dataset.id = String(i);
        const txt = h('button', 'layer-txt');
        txt.type = 'button';
        const sub = itemSub(fd, it);
        txt.append(h('b', 'body-strong', itemTitle(fd, it, i)), h('span', 'caption' + (sub.warn ? ' warn-t' : ''), sub.t));
        txt.addEventListener('click', () => { haptic(); itemPage(id, fd.key, i); });
        const go = ico('arrow', 'chev');
        const handle = h('span', 'layer-handle');
        handle.setAttribute('aria-label', 'جابه‌جایی');
        handle.appendChild(ico('grip'));
        row.append(txt, go, handle);
        list.appendChild(row);
      });
      if (!arr.length) list.appendChild(h('p', 'caption empty-items', 'هنوز چیزی اضافه نشده.'));
      add.hidden = arr.length >= (fd.max_items || 10);
    };
    sortable(list, order => {
      const arr = items();
      const next = order.map(k => arr[Number(k)]);
      arr.splice(0, arr.length, ...next);
      changed();
    });
    add.addEventListener('click', () => {
      const arr = items();
      arr.push(blankItem(fd));
      haptic();
      changed();
      itemPage(id, fd.key, arr.length - 1);
    });
    draw();
    pg.redrawers.push(draw);
    return wrap;
  }
  function itemPage(id, key, index) {
    const f = findBlock(id);
    if (!f) return;
    const spec = specOf(f.block);
    const fd = spec.fields.find(x => x.key === key);
    const it = (f.block.props[key] || [])[index];
    if (!fd || !it) return;
    push((el, pg) => {
      const top = subTop(el, f.page.title + ' ‹ ' + spec.title, itemTitle(fd, it, index), [savedMark()]);
      const titleEl = top.querySelector('.stop-t b');
      const redrawPv = livePv(el, box => { const cur = findBlock(id); if (cur) mini(box, [cur.block]); });
      const body = h('div', 'sbody');
      el.appendChild(body);
      fd.fields.forEach(sub => body.appendChild(control(sub, it[sub.key], v => {
        it[sub.key] = v;
        titleEl.textContent = itemTitle(fd, it, index);
        changed();
      })));
      const foot = h('div', 'sfoot');
      const del = h('button', 'btn danger');
      del.type = 'button';
      del.append(ico('trash'), h('span', '', 'حذف'));
      del.addEventListener('click', () => confirmBox(`این ${fd.item_label || 'مورد'} حذف بشه؟`, () => {
        const cur = findBlock(id);
        if (cur) cur.block.props[key].splice(cur.block.props[key].indexOf(it), 1);
        changed();
        pop();
        toast('حذف شد');
      }));
      const done = h('button', 'btn btn-d grow', 'تمام');
      done.type = 'button';
      done.addEventListener('click', () => { haptic(); pop(); });
      foot.append(del, done);
      el.appendChild(foot);
      pg.refresh = redrawPv;
    });
  }

  /* ---------- «بیشتر» یک بخش (شیت کارها) ---------- */
  function moreSheet(id) {
    const f = findBlock(id);
    if (!f) return;
    const spec = specOf(f.block);
    const inEdit = S.stack.length > 0;
    openSheet(sheet => {
      sheetHead(sheet, spec.cat, spec.icon, spec.title, `بخش ${f.index + 1} از ${f.page.blocks.length} در صفحهٔ «${f.page.title}»`);
      const list = h('div', 'acts');
      const act = (icon, label, fn, opt) => {
        opt = opt || {};
        const b = h('button', 'act' + (opt.danger ? ' danger' : ''));
        b.type = 'button';
        b.append(ico(icon), h('span', 'grow', label));
        if (opt.note) b.appendChild(h('small', '', opt.note));
        b.disabled = !!opt.disabled;
        b.addEventListener('click', () => { haptic(); closeSheet(); fn(); });
        list.appendChild(b);
      };
      if (!inEdit) act('pencil', 'ویرایش', () => editPage(id));
      act('up', 'یکی بالاتر', () => { moveBlock(id, -1); flash(id); }, { disabled: f.index <= 0 });
      act('down', 'یکی پایین‌تر', () => { moveBlock(id, 1); flash(id); }, { disabled: f.index >= f.page.blocks.length - 1 });
      act('copy', 'تکثیر', () => { const c = copyBlock(id); if (c) { toast('تکثیر شد'); flash(c); } });
      if (S.doc.pages.length > 1) {
        act('move', 'انتقال به صفحهٔ دیگر', () => moveToPageSheet(id), { note: S.doc.pages.filter(p => p !== f.page).map(p => p.title).join('، ') });
      }
      if (!inEdit) act('order', 'ترتیب همهٔ بخش‌ها', orderPage);
      act('trash', 'حذف بخش', () => removeBlock(id, () => { if (S.stack.length) pop(); }), { danger: true });
      sheet.appendChild(list);
    });
  }

  function moveToPageSheet(id) {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'move', 'انتقال به صفحهٔ دیگر', 'بخش آخر صفحهٔ مقصد قرار می‌گیرد.');
      const st = h('div', 'acts');
      const f = findBlock(id);
      S.doc.pages.forEach(p => {
        if (!f || p.id === f.page.id) return;
        const r = h('button', 'act');
        r.type = 'button';
        r.append(ico(p.icon), h('span', 'grow', p.title), h('small', '', p.blocks.length + ' بخش'));
        r.addEventListener('click', () => {
          const cur = findBlock(id);
          cur.page.blocks.splice(cur.index, 1);
          p.blocks.push(cur.block);
          closeSheet();
          popAll();
          changed();
          goPage(p.id);
          flash(id);
          toast(`به «${p.title}» منتقل شد`);
        });
        st.appendChild(r);
      });
      sheet.appendChild(st);
    });
  }

  /* ---------- ترتیب بخش‌ها (زیرصفحه) ---------- */
  function usageFoot() {
    const foot = h('div', 'sfoot usage');
    const row = h('div', 'usage-row');
    row.append(h('span', '', 'کامپوننت‌های کل مینی‌اپ'), h('b', '', `${totalBlocks()} از ${S.plan.max_blocks} · پلن ${S.plan.title}`));
    const bar = h('div', 'usage-bar');
    const fill = h('i');
    fill.style.width = Math.min(100, Math.round(totalBlocks() / S.plan.max_blocks * 100)) + '%';
    bar.appendChild(fill);
    foot.append(row, bar);
    return foot;
  }
  function orderPage() {
    push((el, pg) => {
      const done = h('button', 'btn btn-d btn-sm', 'تمام');
      done.type = 'button';
      done.addEventListener('click', () => { haptic(); pop(); });
      subTop(el, page().title, 'ترتیب بخش‌ها', [done]);
      el.appendChild(h('p', 'shint', 'دستگیره را نگه دار و بکش، یا با فلش‌ها جابه‌جا کن. تغییرها همان لحظه ذخیره می‌شوند.'));
      const list = h('div', 'layers olist');
      el.appendChild(list);
      const foot = usageFoot();
      el.appendChild(foot);
      const draw = () => {
        list.textContent = '';
        const blocks = page().blocks;
        blocks.forEach((b, i) => {
          const spec = specOf(b);
          const row = h('div', 'layer');
          row.dataset.id = b.id;
          const t = h('div', 'layer-txt');
          t.append(h('b', 'body-strong', spec.title), h('span', 'caption', summary(b)));
          const up = iconBtn('up', 'بالا', () => moveBlock(b.id, -1), 'ob');
          const dn = iconBtn('down', 'پایین', () => moveBlock(b.id, 1), 'ob');
          up.disabled = i === 0;
          dn.disabled = i === blocks.length - 1;
          const handle = h('span', 'layer-handle');
          handle.setAttribute('aria-label', 'جابه‌جایی ' + spec.title);
          handle.appendChild(ico('grip'));
          row.append(h('span', 'onum', String(i + 1)), catTile(spec.cat, spec.icon), t, up, dn, handle);
          list.appendChild(row);
        });
        if (!blocks.length) list.appendChild(h('p', 'caption empty-items', 'این صفحه هنوز بخشی ندارد.'));
      };
      sortable(list, ids => {
        const byId = {};
        page().blocks.forEach(b => { byId[b.id] = b; });
        page().blocks = ids.map(i => byId[i]);
        changed();
      });
      draw();
      pg.refresh = draw;
    });
  }

  /* ---------- بخش‌های آماده ----------
     چند کامپوننت که با هم یک بخش کامل می‌سازند. محتوا نمونه است و همه‌چیزش
     بعداً عوض می‌شود؛ کلیدها همان فیلدهای app/blocks.py هستند. */
  const SECTIONS = [
    { key: 'intro', title: 'معرفی کسب‌وکار', sub: 'کارت سربرگ + دکمهٔ اصلی', blocks: () => [
      ['hero', { style: 'pass', title: S.app.name, subtitle: 'یک جملهٔ کوتاه که بگوید چه کار می‌کنید و چرا شما.', chip: 'باز است' }],
      ['button', { label: 'شروع کن' }]] },
    { key: 'about', title: 'درباره ما و ساعت کاری', sub: 'دو متن کوتاه کنار هم', blocks: () => [
      ['text', { title: 'درباره ما', body: 'چند خط درباره کسب‌وکارت بنویس: از کی شروع کردی و چه چیزی تو را خاص می‌کند.' }],
      ['text', { title: 'ساعت کاری', body: 'شنبه تا پنج‌شنبه: ۹ صبح تا ۹ شب\nجمعه‌ها: ۱۰ صبح تا ۶ عصر' }]] },
    { key: 'contact', title: 'راه‌های ارتباط', sub: 'اطلاعیه + شبکه‌های اجتماعی', blocks: () => [
      ['notice', { text: 'سوالی داری؟ همین حالا پیام بده، زود جواب می‌دیم.' }],
      ['social', { items: [{ kind: 'telegram', value: '' }, { kind: 'instagram', value: '' }, { kind: 'phone', value: '' }] }]] },
    { key: 'faq', title: 'سوالات پرتکرار', sub: 'سه سوال آماده برای شروع', blocks: () => [
      ['faq', { title: 'سوالات پرتکرار', items: [
        { q: 'ساعت کاری‌تون چیه؟', a: 'هر روز از ۹ صبح تا ۹ شب.' },
        { q: 'ارسال دارید؟', a: 'بله، به همهٔ شهرها.' },
        { q: 'چطور پرداخت کنم؟', a: 'کارت‌به‌کارت یا درگاه آنلاین.' }] }]] },
    { key: 'links', title: 'لینک‌های مهم', sub: 'مثل لینک بیو', blocks: () => [
      ['links', { items: [
        { label: 'کانال تلگرام', note: 'آخرین خبرها', url: 'https://t.me/' },
        { label: 'اینستاگرام', note: 'عکس‌ها و ویدیوها', url: '' },
        { label: 'سایت ما', note: '', url: '' }] }]] },
    { key: 'download', title: 'دانلود و راهنما', sub: 'دکمهٔ دانلود + آموزش قدم‌به‌قدم', blocks: () => [
      ['apps', {}], ['steps', {}]] },
    { key: 'trust', title: 'اعتماد با عدد', sub: 'آمار + ویژگی‌ها', blocks: () => [['stats', {}], ['features', {}]] },
    { key: 'shop', title: 'ویترین محصولات', sub: 'کارت محصول + دکمهٔ همه', blocks: () => [['cards', {}], ['button', { label: 'دیدن همه' }]] },
    { key: 'plans', title: 'پلن‌ها و قیمت', sub: 'بلیت پلن + اطلاعیهٔ تخفیف', blocks: () => [
      ['notice', { text: 'تا آخر هفته ۲۰٪ تخفیف روی همهٔ پلن‌ها' }], ['pricing', {}]] },
    { key: 'service', title: 'اشتراک و قیمت دلخواه', sub: 'کارت عبور + ماشین‌حساب قیمت', blocks: () => [['passcard', {}], ['calc', {}]] },
  ];
  const SHAB_SECTIONS = [
    { key: 'story', title: 'داستان تازه', sub: 'جلد، خلاصه و قسمت‌ها', blocks: () => [['story', { title: 'داستان تازه' }]] },
    { key: 'library', title: 'کتابخانه', sub: 'ادامهٔ خواندن + قفسه + قسمت‌های تازه', blocks: () => [['shab_continue', {}], ['shab_shelf', {}], ['shab_latest', { count: 3 }]] },
    { key: 'join', title: 'دعوت به کانال', sub: 'متن کوتاه + دکمهٔ عضویت', blocks: () => [
      ['text', { title: 'دربارهٔ کانال', body: 'هر شب یک قسمت تازه. هر جا بمانی، دفعهٔ بعد از همان‌جا ادامه می‌دهی.' }],
      ['button', { label: 'عضویت در کانال', url: '' }]] },
    { key: 'quote', title: 'جمله از داستان', sub: 'یک جملهٔ درشت و ماندگار', blocks: () => [['shab_quote', {}]] },
    { key: 'marks', title: 'نشان‌های خواننده', sub: 'قسمت‌هایی که هر کس نشان گذاشته', blocks: () => [['shab_marks', {}]] },
  ];
  const sectionsFor = () => (S.doc.kit === 'shab' ? SHAB_SECTIONS : SECTIONS);
  const presetBlocks = sec => sec.blocks().map(([type, props]) => defaultBlock(type, props));
  const presetLocked = sec => !S.plan.premium_blocks && sec.blocks().some(([type]) => S.schema.blocks[type] && S.schema.blocks[type].premium);

  function presetCard(sec, at, compact) {
    const blocks = presetBlocks(sec);
    const locked = presetLocked(sec);
    const card = h('div', 'ccard preset' + (locked ? ' locked' : '') + (compact ? ' compact' : ''));
    const pvb = h('button', 'ccard-pv');
    pvb.type = 'button';
    pvb.setAttribute('aria-label', 'افزودن ' + sec.title);
    pvb.appendChild(mini(h('div', 'ccard-mini'), blocks));
    const foot = h('div', 'ccard-f');
    const t = h('div', 'row-m');
    const tb = h('span', 'row-t', sec.title);
    if (locked) tb.appendChild(h('span', 'pro-i', 'PRO'));
    t.append(tb, h('span', 'row-s', sec.sub + ' · ' + blocks.length + ' کامپوننت'));
    const add = h('button', 'btn btn-s btn-sm');
    add.type = 'button';
    add.append(ico(locked ? 'lock' : 'plus'), document.createTextNode('افزودن'));
    const go = () => { haptic(); insertBlocks(presetBlocks(sec), at, false); };
    pvb.addEventListener('click', go);
    add.addEventListener('click', go);
    foot.append(t, add);
    card.append(pvb, foot);
    return card;
  }

  /* ---------- افزودن (شیت): بخش آماده یا کامپوننت تکی، هر دو با پیش‌نمایش واقعی ---------- */
  let addTab = 'ready', addCat = 'all';
  function addSheet(atIndex) {
    const pg = page();
    const at = typeof atIndex === 'number' ? Math.max(0, Math.min(pg.blocks.length, atIndex)) : pg.blocks.length;
    const prev = at > 0 ? specOf(pg.blocks[at - 1]).title : '';
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'plus', `افزودن به «${pg.title}»`,
        (prev ? `بعد از «${prev}»` : 'اول صفحه') + ` · ${totalBlocks()} از ${S.plan.max_blocks} کامپوننت`);
      const seg = h('div', 'seg add-seg');
      seg.setAttribute('role', 'tablist');
      const body = h('div', 'add-body');
      const tabs = [['ready', 'بخش‌های آماده'], ['single', 'کامپوننت تکی']];
      const draw = () => {
        seg.textContent = '';
        tabs.forEach(([k, label]) => {
          const b = h('button', k === addTab ? 'on' : '', label);
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-selected', k === addTab ? 'true' : 'false');
          b.addEventListener('click', () => { if (addTab === k) return; addTab = k; select(); draw(); sheet.scrollTop = 0; });
          seg.appendChild(b);
        });
        body.textContent = '';
        if (addTab === 'ready') drawReady(body, at); else drawSingle(body, at, () => { draw(); });
      };
      sheet.append(seg, body);
      draw();
    });
  }
  function drawReady(body, at) {
    body.appendChild(h('p', 'shint', 'چند کامپوننت که با هم یک بخش کامل می‌سازند. محتوا نمونه است و همه‌چیزش عوض می‌شود.'));
    sectionsFor().forEach(sec => body.appendChild(presetCard(sec, at)));
  }
  function drawSingle(body, at, redraw) {
    const cats = S.schema.categories || {};
    const kit = docKit();
    if (kit) {
      // قالب اختصاصی: اول کامپوننت‌های خودش، بعد عمومی‌هایی که به پوسته‌اش می‌آیند
      const own = (S.schema.order || []).filter(t => S.schema.blocks[t] && S.schema.blocks[t].kit === S.doc.kit);
      const label = (text, color) => { const l = h('div', 'clabel'); const d = h('i', 'dot'); d.style.background = color; l.append(d, document.createTextNode(text)); body.appendChild(l); };
      label('مخصوص ' + kit.title, CAT_DOT.story);
      own.forEach(t => body.appendChild(compCard(t, at)));
      label('عمومی', 'var(--ink-3)');
      (kit.generic || []).forEach(t => { if (S.schema.blocks[t]) body.appendChild(compCard(t, at)); });
      return;
    }
    const chips = h('div', 'fchips');
    [['all', 'همه']].concat(Object.keys(cats).filter(k => k !== 'story').map(k => [k, cats[k]])).forEach(([k, label]) => {
      const c = h('button', 'fchip' + (k === addCat ? ' on' : ''));
      c.type = 'button';
      if (k !== 'all') { const d = h('i', 'dot'); d.style.background = CAT_DOT[k]; c.appendChild(d); }
      c.appendChild(document.createTextNode(label));
      c.addEventListener('click', () => { addCat = k; select(); redraw(); });
      chips.appendChild(c);
    });
    body.appendChild(chips);
    const order = S.schema.order || Object.keys(S.schema.blocks);
    let last = null;
    order.forEach(type => {
      const spec = S.schema.blocks[type];
      if (!spec || spec.kit || (addCat !== 'all' && spec.cat !== addCat)) return;
      if (addCat === 'all' && spec.cat !== last) {
        last = spec.cat;
        const lbl = h('div', 'clabel');
        const d = h('i', 'dot');
        d.style.background = CAT_DOT[spec.cat];
        lbl.append(d, document.createTextNode(cats[spec.cat] || ''));
        body.appendChild(lbl);
      }
      body.appendChild(compCard(type, at));
    });
  }
  function compCard(type, at) {
    const spec = S.schema.blocks[type];
    const locked = spec.premium && !S.plan.premium_blocks;
    const card = h('div', 'ccard' + (locked ? ' locked' : ''));
    const pvb = h('button', 'ccard-pv');
    pvb.type = 'button';
    pvb.setAttribute('aria-label', 'افزودن ' + spec.title);
    pvb.appendChild(mini(h('div', 'ccard-mini'), [defaultBlock(type)]));
    const foot = h('div', 'ccard-f');
    const t = h('div', 'row-m');
    const tb = h('span', 'row-t', spec.title);
    if (spec.premium) tb.appendChild(h('span', 'pro-i', 'PRO'));
    t.append(tb, h('span', 'row-s', locked ? 'مخصوص پلن حرفه‌ای' : spec.desc));
    const add = h('button', 'btn btn-s btn-sm');
    add.type = 'button';
    add.append(ico(locked ? 'lock' : 'plus'), document.createTextNode('افزودن'));
    const go = () => { haptic(); insertBlocks([defaultBlock(type)], at, true); };
    pvb.addEventListener('click', go);
    add.addEventListener('click', go);
    foot.append(catTile(spec.cat, spec.icon), t, add);
    card.append(pvb, foot);
    return card;
  }
  function insertBlocks(blocks, at, openEdit) {
    const locked = blocks.find(b => specOf(b).premium && !S.plan.premium_blocks);
    if (locked) { upsellSheet(`«${specOf(locked).title}» مخصوص پلن‌های حرفه‌ای است.`); return; }
    if (totalBlocks() + blocks.length > S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
    const list = page().blocks;
    list.splice(Math.min(at, list.length), 0, ...blocks);
    notify('success');
    closeSheet();
    changed();
    if (openEdit && blocks.length === 1) setTimeout(() => editPage(blocks[0].id), 200);
    else { toast(blocks.length > 1 ? `بخش با ${blocks.length} کامپوننت اضافه شد` : 'اضافه شد'); flash(blocks[0].id); }
  }

  /* ---------- صفحه‌ها (زیرصفحه) ---------- */
  function addPage() {
    if (S.doc.pages.length >= S.plan.max_pages) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_pages} صفحه دارد.`); return null; }
    const used = S.doc.pages.map(p => p.icon);
    const icon = (S.schema.page_icons.find(([k]) => used.indexOf(k) < 0) || ['star'])[0];
    const id = 'p' + Math.random().toString(16).slice(2, 8);
    S.doc.pages.push({ id, title: 'صفحهٔ ' + (S.doc.pages.length + 1), icon, blocks: [] });
    if (S.doc.pages.length === 2) S.doc.tabbar.enabled = true;
    S.pageId = id;
    notify('success');
    changed();
    if (!S.stack.length) { renderPages(); window.scrollTo(0, 0); pagesPage(id); }
    return id;
  }
  function pagesPage(openId) {
    let open = openId || null;
    push((el, pg) => {
      const count = h('span', 'stop-n');
      subTop(el, S.app.name, 'صفحه‌ها', [count]);
      el.appendChild(h('p', 'shint', 'ترتیب همین‌جا همان ترتیب نوار پایین مینی‌اپ است. روی هر صفحه بزن تا اسم و آیکنش را عوض کنی.'));
      const list = h('div', 'plist');
      el.appendChild(list);
      const foot = h('div', 'sfoot');
      const add = h('button', 'btn btn-d grow');
      add.type = 'button';
      add.append(ico('plus'), document.createTextNode('صفحهٔ تازه'));
      add.addEventListener('click', () => { haptic(); const id = addPage(); if (id) { open = id; draw(); } });
      foot.appendChild(add);
      el.appendChild(foot);
      function draw() {
        count.textContent = `${S.doc.pages.length} از ${S.plan.max_pages}`;
        list.textContent = '';
        S.doc.pages.forEach((p, i) => {
          const card = h('div', 'dsec' + (p.id === open ? ' open' : ''));
          const row = h('div', 'prow');
          const tap = h('button', 'prow-m');
          tap.type = 'button';
          const t = h('span', 'grow');
          t.append(h('b', 'body-strong', p.title), h('span', 'caption', p.blocks.length + ' بخش' + (i === 0 ? ' · اولین صفحه' : '')));
          tap.append(catTile(p.id === page().id ? 'brand' : 'frame', p.icon), t, ico('chev', 'chev' + (p.id === open ? ' up' : '')));
          tap.addEventListener('click', () => { open = open === p.id ? null : p.id; select(); draw(); });
          const up = iconBtn('up', 'جلوتر', () => { S.doc.pages.splice(i - 1, 0, S.doc.pages.splice(i, 1)[0]); changed(); }, 'ob');
          const dn = iconBtn('down', 'عقب‌تر', () => { S.doc.pages.splice(i + 1, 0, S.doc.pages.splice(i, 1)[0]); changed(); }, 'ob');
          up.disabled = i === 0;
          dn.disabled = i === S.doc.pages.length - 1;
          const go = h('button', 'pe');
          go.type = 'button';
          go.textContent = 'باز کردن';
          go.addEventListener('click', () => { haptic(); S.pageId = p.id; pop(); });
          row.append(tap, up, dn, go);
          card.appendChild(row);
          if (p.id === open) card.appendChild(pageEditor(p, draw));
          list.appendChild(card);
        });
      }
      draw();
      pg.refresh = draw;
    });
  }
  function pageEditor(p, redraw) {
    const box = h('div', 'ped');
    const name = control({ type: 'text', label: 'اسم در نوار پایین', max: 24 }, p.title, v => {
      p.title = v;
      const b = box.parentNode && box.parentNode.querySelector('.prow-m b');
      if (b) b.textContent = v;
      changed(true);
    });
    box.appendChild(name);
    const iconWrap = h('div', 'field');
    iconWrap.appendChild(h('span', 'label', 'آیکن'));
    const grid = h('div', 'icons');
    S.schema.page_icons.forEach(([key, label]) => {
      const b = h('button', key === p.icon ? 'on' : '');
      b.type = 'button';
      b.append(ico(key), document.createTextNode(label));
      b.addEventListener('click', () => { p.icon = key; select(); changed(); });
      grid.appendChild(b);
    });
    iconWrap.appendChild(grid);
    box.appendChild(iconWrap);
    const tools = h('div', 'ped-tools');
    const dup = h('button', 'btn btn-s grow');
    dup.type = 'button';
    dup.append(ico('copy'), document.createTextNode('تکثیر صفحه'));
    dup.addEventListener('click', () => {
      if (S.doc.pages.length >= S.plan.max_pages) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_pages} صفحه دارد.`); return; }
      if (totalBlocks() + p.blocks.length > S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
      const copy = JSON.parse(JSON.stringify(p));
      copy.id = 'p' + Math.random().toString(16).slice(2, 8);
      copy.title = (p.title + ' ۲').slice(0, 24);
      copy.blocks.forEach(b => { b.id = newId(); });
      S.doc.pages.splice(S.doc.pages.indexOf(p) + 1, 0, copy);
      haptic('medium');
      changed();
      toast('صفحه تکثیر شد');
    });
    const del = h('button', 'btn danger grow');
    del.type = 'button';
    del.append(ico('trash'), document.createTextNode('حذف صفحه'));
    del.disabled = S.doc.pages.length < 2;
    del.addEventListener('click', () => confirmBox(`صفحهٔ «${p.title}» با ${p.blocks.length} بخشش حذف بشه؟`, () => {
      S.doc.pages.splice(S.doc.pages.indexOf(p), 1);
      if (!S.doc.pages.find(x => x.id === S.pageId)) S.pageId = S.doc.pages[0].id;
      changed();
      toast('صفحه حذف شد');
    }));
    tools.append(dup, del);
    box.appendChild(tools);
    return box;
  }

  /* ---------- ظاهر (زیرصفحه) ---------- */
  function themePage() {
    const theme = S.doc.theme;
    const set = (k, v) => { theme[k] = v; changed(); };
    push((el, pg) => {
      subTop(el, S.app.name, 'ظاهر', [savedMark()]);
      const redraw = livePv(el, box => pagePreview(box, 290), 'کل مینی‌اپ، زنده', true);
      const body = h('div', 'sbody');
      el.appendChild(body);
      const kit = docKit();
      secLabel(body, 'رنگ اصلی', kit ? `رنگ تأکید پوستهٔ «${kit.title}»` : 'بقیهٔ رنگ‌ها خودکار ساخته می‌شوند');
      const grid = h('div', 'swatches');
      const drawSw = () => {
        grid.textContent = '';
        const cur = (theme.accent || '').toLowerCase();
        let preset = false;
        ((docKit() || {}).accents || S.schema.swatches).forEach(([name, color]) => {
          const on = color.toLowerCase() === cur;
          preset = preset || on;
          const b = h('button', 'sw' + (on ? ' on' : ''));
          b.type = 'button';
          b.style.background = color;
          b.setAttribute('aria-label', name);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          b.appendChild(ico('check'));
          b.addEventListener('click', () => { set('accent', color); select(); drawSw(); });
          grid.appendChild(b);
        });
        const custom = h('label', 'sw custom' + (preset ? '' : ' on'));
        custom.setAttribute('aria-label', 'رنگ دلخواه');
        if (!preset) custom.style.background = theme.accent;
        custom.appendChild(ico(preset ? 'plus' : 'check'));
        const input = h('input');
        input.type = 'color';
        input.value = theme.accent;
        input.addEventListener('input', () => { set('accent', input.value); custom.style.background = input.value; });
        input.addEventListener('change', drawSw);
        custom.appendChild(input);
        grid.appendChild(custom);
      };
      drawSw();
      body.appendChild(grid);
      if (kit) {
        const note = h('div', 'look-note');
        note.append(ico('palette'), h('span', '', `زمینه، حروف و گوشه‌ها مال خود قالب «${kit.title}» است و ثابت می‌ماند تا همه‌چیز با هم جور باشد.`));
        body.appendChild(note);
        pg.refresh = redraw;
        return;
      }
      body.appendChild(selectControl({ label: 'حالت', options: [['light', 'روشن'], ['auto', 'مثل تلگرام'], ['dark', 'تیره']] }, theme.mode, v => set('mode', v)));
      body.appendChild(selectControl({ label: 'پس‌زمینهٔ صفحه', options: [['plain', 'ساده'], ['tint', 'با کمی رنگ']] }, theme.bg, v => set('bg', v)));
      const radiusBox = h('div');
      const drawRadius = () => {
        radiusBox.textContent = '';
        radiusBox.appendChild(selectControl({ label: 'گوشه‌ها', options: [['sharp', 'تیز'], ['soft', 'نرم'], ['round', 'گرد'], ['custom', 'دلخواه']] }, theme.radius, v => { set('radius', v); drawRadius(); }));
        if (theme.radius === 'custom') radiusBox.appendChild(intControl({ label: 'اندازهٔ گوشه', min: 0, max: 32, default: 18 }, theme.radius_px, v => set('radius_px', v)));
      };
      drawRadius();
      body.appendChild(radiusBox);
      pg.refresh = redraw;
    });
  }

  /* ---------- سربرگ و نوار پایین (زیرصفحه) ---------- */
  function groupFields(parent, fields, target) {
    fields.forEach(f => {
      parent.appendChild(control(f, target[f.key], v => { target[f.key] = v; changed(); }));
    });
  }
  function framePage() {
    push((el, pg) => {
      subTop(el, S.app.name, 'نوار بالا و نوار پایین', [savedMark()]);
      const redraw = livePv(el, box => pagePreview(box, 210), 'قاب مینی‌اپ، زنده', true);
      const body = h('div', 'sbody');
      el.appendChild(body);
      secLabel(body, 'نوار بالا', 'اسم و لوگو، بالای همهٔ صفحه‌ها');
      groupFields(body, S.schema.header.filter(f => !docKit() || (f.key !== 'style' && f.key !== 'align'))
        .map(f => f.key === 'enabled' ? Object.assign({}, f, { label: 'نمایش نوار بالا' }) : f), S.doc.header);
      body.appendChild(h('p', 'caption sw-note', 'اگر عنوان خالی بماند، اسم مینی‌اپ نشان داده می‌شود.'));
      secLabel(body, 'نوار پایین', 'برای رفتن بین صفحه‌ها');
      if (S.doc.pages.length < 2) {
        const note = h('div', 'warn-box');
        note.append(ico('warn'), h('span', 'caption', 'نوار پایین وقتی دیده می‌شود که مینی‌اپ حداقل دو صفحه داشته باشد.'));
        body.appendChild(note);
        const add = h('button', 'btn btn-s btn-block', 'افزودن صفحهٔ دوم');
        add.type = 'button';
        add.style.marginTop = '10px';
        add.addEventListener('click', () => { haptic(); if (addPage()) { pop(); pagesPage(S.pageId); } });
        body.appendChild(add);
      }
      groupFields(body, S.schema.tabbar, S.doc.tabbar);
      const pages = h('button', 'row go-row');
      pages.type = 'button';
      const g = h('span', 'grow');
      g.append(h('b', 'body-strong', 'اسم و آیکن دکمه‌ها'), h('span', 'caption', 'از خود صفحه‌ها می‌آید'));
      pages.append(catTile('frame', 'tabbar'), g, ico('arrow', 'chev'));
      pages.addEventListener('click', () => { haptic(); pagesPage(); });
      body.appendChild(pages);
      pg.refresh = redraw;
    });
  }

  /* ---------- پیش‌نمایش (زیرصفحهٔ تمام‌صفحه) ---------- */
  function previewPage() {
    let pid = page().id, mode = null;
    push((el, pg) => {
      el.classList.add('sub-preview');
      const bar = h('header', 'pvbar');
      const close = h('button', 'btn btn-d btn-sm');
      close.type = 'button';
      close.append(ico('x'), document.createTextNode('بستن'));
      close.addEventListener('click', () => { haptic(); pop(); });
      const t = h('div', 'pvbar-t');
      t.append(h('b', '', 'پیش‌نمایش'), h('span', '', 'دکمه‌ها کار می‌کنند؛ ویرایش خاموش است'));
      const seg = h('div', 'seg pvbar-seg');
      const drawSeg = () => {
        seg.textContent = '';
        const cur = mode || (ES.isDark(S.doc.theme.mode) ? 'dark' : 'light');
        [['light', 'sun', 'روشن'], ['dark', 'moon', 'تیره']].forEach(([k, icon, label]) => {
          const b = h('button', k === cur ? 'on' : '');
          b.type = 'button';
          b.setAttribute('aria-label', label);
          b.appendChild(ico(icon));
          b.addEventListener('click', () => { mode = k; select(); drawSeg(); draw(); });
          seg.appendChild(b);
        });
      };
      bar.append(close, t, seg);
      const view = h('div', 'pvw');
      el.append(bar, view);
      const draw = () => {
        const doc = mode ? Object.assign({}, S.doc, { theme: Object.assign({}, S.doc.theme, { mode }) }) : S.doc;
        ES.render(view, doc, {
          page: pid, appName: S.app.name,
          onNavigate: id => { pid = id; draw(); view.scrollTop = 0; },
          branding: S.plan && S.plan.branding ? { bot: S.me.bot } : null,
        });
      };
      drawSeg();
      draw();
      pg.refresh = draw;
    });
  }

  /* ---------- تنظیمات مینی‌اپ و ربات (زیرصفحه) ---------- */
  /* تنظیمات همین مینی‌اپ: هویت و لینک، قالب، اسم، ربات، پیام خوش‌آمد، کانال و مصرف پلن.
     آمار در داشبورد و فهرست مینی‌اپ‌ها در «حساب» است. */
  function settingsPage() {
    push((el) => {
      subTop(el, S.app.name, 'تنظیمات');
      const body = h('div', 'sbody');
      el.appendChild(body);
      const entry = storeOfKit(S.doc.kit);

      const card = tint(h('div', 'appcard'), entry);
      const logo = S.doc.header && ES.safeUrl(S.doc.header.logo, true);
      const tile = tq(entry, 'lg');
      if (logo) { const i = h('img'); i.alt = ''; i.src = logo; tile.replaceChildren(i); tile.classList.add('has-logo'); }
      const g = h('span', 'grow');
      g.append(h('b', 'title-2', S.app.name), h('span', 'caption ltr', S.app.url.replace(/^https?:\/\//, '')));
      const cp = h('button', 'btn btn-s btn-sm');
      cp.type = 'button';
      cp.append(ico('copy'), document.createTextNode('کپی لینک'));
      cp.addEventListener('click', () => copyText(S.app.url));
      card.append(tile, g, cp);
      body.appendChild(card);

      const kitRow = h('button', 'row go-row');
      kitRow.type = 'button';
      const kg = h('span', 'grow');
      kg.append(h('b', 'body-strong', entry ? 'قالب ' + entry.title : 'قالب پایه'),
        h('span', 'caption', entry ? 'دیدن در فروشگاه، نصب دوباره از اول' : 'یک قالب از فروشگاه نصب کن'));
      kitRow.append(tq(entry, 'sm'), kg, ico('arrow', 'chev'));
      kitRow.addEventListener('click', () => { haptic(); if (entry) templateDetail(entry); else { popAll(); tab('store'); } });
      body.appendChild(kitRow);

      body.appendChild(nameSection());
      const conn = h('div', 'sh-sec stack');
      conn.appendChild(h('span', 'label', 'ربات و لینک'));
      conn.append(botRow(), linkRow());
      body.appendChild(conn);
      body.appendChild(welcomeSection());
      if (S.doc.kit === 'shab') body.appendChild(channelSection());

      const planSec = h('div', 'sh-sec stack');
      planSec.appendChild(h('span', 'label', 'پلن ' + S.plan.title));
      const use = h('div', 'me-use');
      [[`${faN(totalBlocks())}/${faN(S.plan.max_blocks)}`, 'کامپوننت'], [`${faN(S.doc.pages.length)}/${faN(S.plan.max_pages)}`, 'صفحه'],
       [`${faN(S.me.apps.length)}/${faN(S.plan.max_apps)}`, 'مینی‌اپ']].forEach(([n, l]) => {
        const c = h('span');
        c.append(h('b', 'n', n), h('span', '', l));
        use.appendChild(c);
      });
      planSec.appendChild(use);
      if (!S.plan.premium_blocks) {
        const up = h('button', 'btn btn-p btn-block', 'ارتقا به حرفه‌ای');
        up.type = 'button';
        up.addEventListener('click', () => upsellSheet(''));
        planSec.appendChild(up);
      }
      body.appendChild(planSec);
    });
  }

  /* ---------- آمادهٔ انتشار (چک‌لیست کوتاه) ---------- */
  function emptyLinks() {
    const res = [];
    S.doc.pages.forEach(p => p.blocks.forEach(b => {
      const spec = specOf(b), pr = b.props || {};
      const open = () => { popAll(); goPage(p.id); editPage(b.id); };
      if (b.type === 'button' && emptyUrl(pr.url)) res.push({ path: `${p.title} ‹ ${spec.title} «${pr.label || ''}»`, fix: open });
      if ((b.type === 'passcard' || b.type === 'calc') && pr.cta && emptyUrl(pr.url)) res.push({ path: `${p.title} ‹ ${spec.title}`, fix: open });
      if (b.type === 'links' || b.type === 'apps') {
        (pr.items || []).forEach((it, i) => {
          if (emptyUrl(it.url)) res.push({ path: `${p.title} ‹ ${spec.title} ‹ ${it.label || it.name || 'آیتم ' + (i + 1)}`, fix: () => { open(); itemPage(b.id, 'items', i); } });
        });
      }
    }));
    return res;
  }
  function publishChecks() {
    const out = [];
    const hasHead = S.doc.header.enabled || S.doc.pages.some(p => p.blocks.some(b => b.type === 'hero'));
    out.push(hasHead ? { st: 'ok', t: 'اسم و سربرگ', s: S.doc.header.title || S.app.name }
      : { st: 'warn', t: 'سربرگ ندارد', s: 'مشتری اول باید بفهمد کجا آمده', fix: framePage, fixL: 'روشن کن' });
    out.push(S.app.bot_username ? { st: 'ok', t: 'ربات وصل است', s: '@' + S.app.bot_username, ltr: true }
      : { st: 'warn', t: 'ربات وصل نیست', s: 'بعد از اتصال، مینی‌اپ روی ربات خودت باز می‌شود', fix: () => openBot('connect'), fixL: 'اتصال' });
    const lockNoLink = S.app.channel ? [] : allBlocks().filter(({ block }) => block.type === 'story'
      && (block.props.chapters || []).some(c => c.lock && !c.draft));
    if (lockNoLink.length) {
      out.push({ st: 'warn', t: 'قسمت «فقط اعضا» بدون کانال', s: 'کانال را در تنظیمات ثبت کن تا عضوها بتوانند بخوانند',
        fix: () => { popAll(); settingsPage(); }, fixL: 'ثبت کانال' });
    }
    const links = emptyLinks();
    links.slice(0, 3).forEach(e => out.push({ st: 'warn', t: 'یک لینک خالی است', s: e.path, fix: e.fix, fixL: 'درست کن' }));
    if (links.length > 3) out.push({ st: 'warn', t: `${links.length - 3} لینک خالی دیگر`, s: 'بعد از درست کردن بالایی‌ها دوباره نگاه کن' });
    out.push(S.app.welcome ? { st: 'ok', t: 'پیام خوش‌آمد ربات', s: 'نوشته شده' }
      : { st: 'no', t: 'پیام خوش‌آمد ربات', s: 'اختیاری · هنوز نوشته نشده', fix: settingsPage, fixL: 'نوشتن' });
    return out;
  }
  function publishSheet() {
    if (!totalBlocks()) { toast('اول حداقل یک بخش اضافه کن', true); notify('warning'); return; }
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'send', 'آمادهٔ انتشار؟', 'یک نگاه سریع قبل از این‌که مشتری‌ها ببینند');
      const list = h('div', 'checks');
      const checks = publishChecks();
      checks.forEach(c => {
        const r = h('div', 'check ' + c.st);
        const mark = h('span', 'chk ' + c.st);
        mark.appendChild(ico(c.st === 'ok' ? 'check' : c.st === 'warn' ? 'warn' : 'minus'));
        const m = h('span', 'row-m');
        m.append(h('b', 'row-t', c.t), h('span', 'row-s' + (c.ltr ? ' ltr' : ''), c.s || ''));
        r.append(mark, m);
        if (c.fix) {
          const b = h('button', 'btn btn-s btn-sm', c.fixL);
          b.type = 'button';
          b.addEventListener('click', () => { haptic(); closeSheet(); c.fix(); });
          r.appendChild(b);
        }
        list.appendChild(r);
      });
      sheet.appendChild(list);
      if (checks.some(c => c.st === 'warn')) sheet.appendChild(h('p', 'caption sw-note', 'می‌تونی همین حالا هم منتشر کنی و بعداً درستشون کنی.'));
      const go = h('button', 'btn primary block pub-go');
      go.type = 'button';
      go.append(ico('send'), document.createTextNode('انتشار همین حالا'));
      go.addEventListener('click', () => { closeSheet(); publish(); });
      const later = h('button', 'btn block pub-later', 'بعداً');
      later.type = 'button';
      later.addEventListener('click', closeSheet);
      sheet.append(go, later);
    });
  }
  /* ---------- انتشار ---------- */
  async function publish() {
    if (!totalBlocks()) { toast('اول حداقل یک کامپوننت اضافه کن', true); notify('warning'); return; }
    const btn = $('bar-publish');
    btn.disabled = true;
    clearTimeout(S.saveTimer);
    try {
      const res = await api('app/publish', { id: S.app.id, doc: ensureIds(S.doc) });
      S.app = res.app;
      S.doc = ES.normalize(res.doc);
      H.base = JSON.stringify(S.doc);
      if (!S.doc.pages.find(p => p.id === S.pageId)) S.pageId = S.doc.pages[0].id;
      setSave('');
      renderAll();
      syncAppInList();
      if (S.screen === 'app') renderApp();
      notify('success');
      S.shabStats = null;
      publishedSheet(res.kit || {});
    } catch (err) {
      failed(err);
    } finally {
      btn.disabled = false;
    }
  }

  function copyText(text) {
    const done = () => { notify('success'); toast('لینک کپی شد'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => toast(text));
    else toast(text);
  }

  function linkRow() {
    const row = h('div', 'row');
    const g = h('span', 'grow');
    g.append(h('b', 'body-strong', 'لینک مینی‌اپ'), h('span', 'caption ltr', S.app.url.replace(/^https?:\/\//, '')));
    const c = h('button', 'btn secondary xs', 'کپی');
    c.addEventListener('click', () => copyText(S.app.url));
    row.append(catTile('brand', 'link'), g, c);
    return row;
  }

  function botRow() {
    const row = h('div', 'row');
    const g = h('span', 'grow');
    const connected = !!S.app.bot_username;
    if (connected) {
      g.append(h('b', 'body-strong ltr', '@' + S.app.bot_username),
        h('span', 'caption', S.app.mode === 'full' ? 'کنترل کامل · /start هم جواب می‌ده' : 'دکمه منو · مینی‌اپ روی ربات فعال است'));
    } else {
      g.append(h('b', 'body-strong', 'ربات وصل نیست'), h('span', 'caption', 'توکن رباتت رو در ایزی‌ساز بفرست'));
    }
    const btn = h('button', 'btn secondary xs', connected ? 'مدیریت' : 'اتصال');
    btn.addEventListener('click', () => openBot(connected ? 'myapp' : 'connect'));
    row.append(connected ? catTile('act', 'bot') : catTile('frame', 'bot'), g, btn);
    return row;
  }

  function publishedSheet(kit) {
    kit = kit || {};
    openSheet(sheet => {
      const fresh = kit.new_chapters || [];
      if (fresh.length && S.doc.kit === 'shab') sheet.appendChild(announceCard(fresh));
      const d = h('div', 'done');
      d.appendChild(catTile('success', 'check'));
      d.append(h('div', 'title-2', 'منتشر شد!'),
        h('p', 'body', S.app.bot_username ? `تغییرات روی @${S.app.bot_username} زنده است.` : 'حالا رباتت رو وصل کن تا مینی‌اپ روی اون باز بشه.'));
      sheet.appendChild(d);
      const st = h('div', 'stack sh-sec');
      st.appendChild(linkRow());
      if (S.app.bot_username) {
        const open = h('button', 'btn primary block', `باز کردن @${S.app.bot_username}`);
        open.addEventListener('click', () => { if (tg && !DEMO) tg.openTelegramLink('https://t.me/' + S.app.bot_username); else toast('در تلگرام باز می‌شه'); });
        st.appendChild(open);
      } else {
        const connect = h('button', 'btn primary block', 'اتصال ربات');
        connect.addEventListener('click', () => openBot('connect'));
        st.appendChild(connect);
      }
      if (DEMO) {
        const view = h('a', 'btn secondary block', 'دیدن صفحهٔ منتشرشده');
        view.href = window.EasySazDemo.pageUrl(BASE);
        view.target = '_blank';
        st.appendChild(view);
      }
      sheet.appendChild(st);
    });
  }

  /* ---------- پنجرهٔ ارتقا (PlanCard) ---------- */
  function upsellSheet(reason) {
    notify('warning');
    openSheet(sheet => {
      sheetHead(sheet, 'media', 'star', 'این کار مال پلن حرفه‌ایه', reason || '');
      const pro = (S.me.plans || []).find(p => p.key === 'pro') || { title: 'حرفه‌ای', price_stars: 250, features: [] };
      const card = h('div', 'upcard');
      const head = h('div', 'upcard-h');
      const price = h('span', 'upcard-p');
      price.append(h('b', 'n', faN(pro.price_stars)), h('span', '', 'ستاره در ماه'));
      head.append(h('b', '', pro.title), price);
      const ul = h('ul');
      (pro.features || []).forEach(t => {
        const li = h('li');
        li.append(ico('check'), h('span', '', t));
        ul.appendChild(li);
      });
      const buy = h('button', 'btn btn-p btn-block', 'دیدن پلن‌ها در ربات');
      buy.type = 'button';
      buy.addEventListener('click', () => openBot('plans'));
      card.append(head, ul, buy);
      sheet.appendChild(card);
      if (DEMO) {
        const tryPro = h('button', 'btn secondary block', 'امتحان پلن حرفه‌ای در نسخهٔ نمایشی');
        tryPro.style.marginTop = '10px';
        tryPro.addEventListener('click', async () => {
          await api('demo/plan', { key: 'pro' });
          closeSheet();
          await openApp(S.app.id);
          toast('نسخهٔ نمایشی روی پلن حرفه‌ای است');
        });
        sheet.appendChild(tryPro);
      }
    });
  }

  /* ---------- تنظیمات مینی‌اپ (StatStrip + BotLink + WelcomeEditor + PlanCard) ---------- */
  function decodeHtml(s) {
    const t = document.createElement('textarea');
    t.innerHTML = s || '';
    return t.value;
  }

  /* اسم مینی‌اپ و پیام خوش‌آمد: در تنظیمات ادیتور و از خانه */
  function nameSection() {
    const nameSec = h('div', 'sh-sec');
    nameSec.appendChild(h('span', 'label', 'اسم مینی‌اپ'));
    const row = h('div', 'row');
    const input = h('input');
    input.value = S.app.name;
    input.maxLength = 40;
    input.setAttribute('aria-label', 'اسم مینی‌اپ');
    const save = h('button', 'btn btn-s btn-sm', 'ذخیره');
    save.addEventListener('click', async () => {
      try {
        const res = await api('app/rename', { id: S.app.id, name: input.value });
        S.app = res.app;
        const inList = S.me.apps.find(a => a.id === S.app.id);
        if (inList) inList.name = S.app.name;
        if (S.screen === 'editor') renderAll(); else if (S.screen === 'home') renderHome(); else if (S.screen === 'app') renderApp();
        notify('success');
        toast('اسم عوض شد');
      } catch (err) { failed(err); }
    });
    row.append(input, save);
    nameSec.appendChild(row);
    return nameSec;
  }
  /* کانال قسمت: قفل «فقط اعضا» و پست قسمت تازه. ربات مینی‌اپ باید ادمین کانال باشد. */
  function channelSection() {
    const sec = h('div', 'sh-sec stack');
    sec.appendChild(h('span', 'label', 'کانال داستان‌ها'));
    const box = h('div', 'chn');
    sec.appendChild(box);
    const draw = () => {
      box.textContent = '';
      const ch = S.app.channel;
      if (!S.app.bot_username) {
        box.appendChild(h('p', 'caption', 'اول ربات مینی‌اپ را وصل کن؛ همان ربات باید ادمین کانال باشد تا عضویت خواننده‌ها را ببیند و قسمت تازه را پست کند.'));
        const c = h('button', 'btn btn-s btn-block', 'اتصال ربات');
        c.type = 'button';
        c.addEventListener('click', () => openBot('connect'));
        box.appendChild(c);
        return;
      }
      if (ch) {
        const row = h('div', 'row');
        const g = h('span', 'grow');
        g.append(h('b', 'body-strong', ch.title || 'کانال'), h('span', 'caption ltr', ch.username ? '@' + ch.username : String(ch.id)));
        const rm = h('button', 'btn btn-s btn-sm', 'برداشتن');
        rm.type = 'button';
        rm.addEventListener('click', () => confirmBox('کانال برداشته شود؟ قسمت‌های «فقط اعضا» تا کانال تازه ثبت نشود برای کسی باز نمی‌شوند.', async () => {
          try { await api('kit/shab/channel', { id: S.app.id, channel: '' }); S.app.channel = null; draw(); toast('کانال برداشته شد'); } catch (err) { failed(err); }
        }));
        row.append(catTile('act', 'send'), g, rm);
        box.appendChild(row);
        box.appendChild(h('p', 'caption', 'قسمت‌های «فقط اعضا» فقط برای عضوهای این کانال باز می‌شوند.'));
        return;
      }
      box.appendChild(h('p', 'caption', `@${S.app.bot_username} را ادمین کانالت کن، بعد آیدی کانال را این‌جا بنویس.`));
      const inp = h('input', 'ltr');
      inp.placeholder = '@my_channel';
      inp.setAttribute('aria-label', 'آیدی کانال');
      const f = h('div', 'field');
      f.appendChild(inp);
      box.appendChild(f);
      const save = h('button', 'btn btn-p btn-block', 'ثبت کانال');
      save.type = 'button';
      save.addEventListener('click', async () => {
        save.disabled = true;
        try {
          const res = await api('kit/shab/channel', { id: S.app.id, channel: inp.value.trim() });
          S.app.channel = res.channel;
          notify('success');
          toast('کانال ثبت شد');
          draw();
        } catch (err) { failed(err); save.disabled = false; }
      });
      box.appendChild(save);
    };
    draw();
    return sec;
  }

  function welcomeSection() {
    const wel = h('div', 'sh-sec');
    wel.appendChild(h('span', 'label', 'پیام خوش‌آمد ربات'));
    const full = S.app.mode === 'full';
    const note = h('div', 'warn-box');
    note.append(ico(full ? 'check' : 'warn'), h('span', 'caption', full
      ? 'رباتت در جواب /start همین پیام را با دکمهٔ ورود به مینی‌اپ می‌فرستد.'
      : 'این پیام فقط در حالت «کنترل کامل» ربات فرستاده می‌شود. حالت اتصال را در ربات ایزی‌ساز عوض کن.'));
    wel.appendChild(note);
    const ta = control({ type: 'textarea', label: 'متن پیام', max: 1000 }, decodeHtml(S.app.welcome), () => {});
    ta.querySelector('textarea').placeholder = `سلام! به «${S.app.name}» خوش اومدی. برای شروع روی دکمهٔ زیر بزن.`;
    wel.appendChild(ta);
    const wsave = h('button', 'btn btn-s btn-block', 'ذخیرهٔ پیام خوش‌آمد');
    wsave.style.marginTop = '10px';
    wsave.addEventListener('click', async () => {
      try {
        const res = await api('app/welcome', { id: S.app.id, text: ta.querySelector('textarea').value });
        S.app = res.app;
        const inList = S.me.apps.find(a => a.id === S.app.id);
        if (inList) inList.welcome = S.app.welcome;
        if (S.screen === 'app') renderApp();
        notify('success');
        toast(res.app.welcome ? 'پیام خوش‌آمد ذخیره شد' : 'پیام پیش‌فرض برگشت');
      } catch (err) { failed(err); }
    });
    wel.appendChild(wsave);
    return wel;
  }
  function renameSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'write', 'pencil', 'اسم مینی‌اپ', 'روی کارت، سربرگ و دکمهٔ ربات دیده می‌شود.');
      sheet.appendChild(nameSection());
    });
  }
  function welcomeSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'shop', 'chat', 'پیام خوش‌آمد', 'جواب ربات تو به /start');
      sheet.appendChild(welcomeSection());
    });
  }

  /* ===================== خانه (سبک عبور) ===================== */
  const fmt = n => (Number(n) || 0).toLocaleString('en-US');
  const num = v => h('span', 'n', String(v));

  /* ردیف گروه: کاشی آیکن، عنوان و زیرعنوان، و انتهای ردیف (دکمه یا فلش) */
  function grow(icCls, icon, title, sub, end, onTap) {
    const r = h(onTap && !end ? 'button' : 'div', 'grow-row');
    if (onTap && !end) r.type = 'button';
    const ic = h('span', 'ic ' + icCls);
    ic.appendChild(ico(icon));
    const m = h('span', 'row-m');
    m.appendChild(h('span', 'row-t', title));
    if (sub) m.appendChild(sub.nodeType ? sub : h('span', 'row-s', sub));
    r.append(ic, m);
    if (end) r.appendChild(end);
    else if (onTap) r.appendChild(ico('arrow', 'chev'));
    if (onTap) r.addEventListener('click', e => { if (end && end.contains(e.target)) return; haptic(); onTap(); });
    return r;
  }

  /* ===================== فروشگاه قالب (داده: /api/templates → store) =====================
     هر قالب رنگ امضای خودش را دارد (color، tint) و کارت‌ها، سربرگ داشبورد و
     آیکن مینی‌اپ با همان رنگ ساخته می‌شوند. رنگ‌ها از داده می‌آیند، نه از CSS. */
  const storeList = () => (S.templates && S.templates.store) || [];
  const domainList = () => (S.templates && S.templates.domains) || [];
  const domainTitle = id => (domainList().find(d => d.id === id) || {}).title || '';
  function storeOfKit(kit) {
    return storeList().find(e => e.template && (tplById(e.template) || {}).kit === kit) || null;
  }
  function tint(el, entry) {
    if (!entry) return el;
    el.style.setProperty('--tc', entry.color);
    el.style.setProperty('--tt', entry.tint);
    return el;
  }
  /* آیکن قالب: مربع گردگوشه به رنگ امضا (soft: زمینهٔ روشن و آیکن رنگی) */
  function tq(entry, cls) {
    const el = tint(h('span', 'tq' + (cls ? ' ' + cls : '') + (entry ? '' : ' base')), entry);
    el.appendChild(ico(entry ? entry.icon : 'layers'));
    return el;
  }
  const installed = e => !!(S.doc && e.template && (tplById(e.template) || {}).kit === S.doc.kit);
  /* پیش‌نمایش واقعی یک صفحهٔ قالب در قاب گوشی (کوچک‌شده، بدون تعامل) */
  const SAMPLE_NAME = 'قصه‌های شب';
  const sampleDocs = {};
  function sampleDoc(t) {
    if (!sampleDocs[t.id]) sampleDocs[t.id] = JSON.parse(JSON.stringify(t.doc).split('{name}').join(SAMPLE_NAME));
    return sampleDocs[t.id];
  }
  function phoneShot(entry, pageIndex, width) {
    const t = entry.template && tplById(entry.template);
    const frame = h('div', 'phone');
    frame.style.width = width + 'px';
    frame.style.height = Math.round(width * 2.05) + 'px';
    const screen = h('div', 'phone-s');
    frame.appendChild(screen);
    if (!t) return frame;
    const doc = sampleDoc(t);
    const p = doc.pages[Math.min(pageIndex, doc.pages.length - 1)];
    const inner = h('div', 'phone-in');
    inner.style.transform = `scale(${(width - 8) / 390})`;
    screen.appendChild(inner);
    ES.render(inner, doc, { page: p.id, appName: SAMPLE_NAME, editing: true });
    // زمینهٔ صفحهٔ قالب تا پایین قاب ادامه پیدا کند
    requestAnimationFrame(() => { const r = inner.firstElementChild; if (r) screen.style.background = getComputedStyle(r).backgroundColor; });
    frame.setAttribute('aria-hidden', 'true');
    return frame;
  }

  function renderStore() {
    const list = storeList();
    const q = ($('store-q').value || '').trim();
    const cats = $('store-cats');
    cats.textContent = '';
    [{ id: '', title: 'همه' }].concat(domainList().filter(d => list.some(e => e.domain === d.id))).forEach(d => {
      const n = list.filter(e => !d.id || e.domain === d.id).length;
      const b = h('button', 'cat' + ((S.storeCat || '') === d.id ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', (S.storeCat || '') === d.id ? 'true' : 'false');
      b.append(document.createTextNode(d.title), h('small', '', faN(n)));
      b.addEventListener('click', () => { select(); S.storeCat = d.id; renderStore(); });
      cats.appendChild(b);
    });
    const shown = list.filter(e => (!S.storeCat || e.domain === S.storeCat) && (!q || (e.title + ' ' + e.tagline).includes(q)));
    const feat = $('store-feat');
    feat.textContent = '';
    const star = !q && shown.find(e => e.status === 'ready');
    if (star) feat.appendChild(featCard(star));
    const grid = $('store-grid');
    grid.textContent = '';
    shown.filter(e => e !== star).forEach(e => grid.appendChild(tplCard(e)));
    if (!shown.length) {
      const empty = h('div', 'st-empty mx');
      empty.append(h('b', '', 'قالبی پیدا نشد'), h('p', '', 'اسم کار یا حوزهٔ دیگری را امتحان کن.'));
      feat.appendChild(empty);
    }
  }
  function featCard(e) {
    const card = tint(h('article', 'feat mx'), e);
    const tx = h('div', 'feat-tx');
    tx.append(h('span', 'feat-k', installed(e) ? 'نصب‌شده روی «' + S.app.name + '»' : 'انتخاب ایزی‌ساز'), h('b', 'feat-t', e.title), h('p', 'feat-s', e.desc || e.tagline));
    const go = h('button', 'feat-b', 'دیدن و نصب');
    go.type = 'button';
    go.addEventListener('click', () => { haptic(); templateDetail(e); });
    tx.appendChild(go);
    card.append(tx, phoneShot(e, 0, 96));
    return card;
  }
  function tplCard(e) {
    const b = tint(h('button', 'tcard'), e);
    b.type = 'button';
    const art = h('span', 'tcard-art');
    const tag = e.status !== 'ready' ? 'به‌زودی' : (installed(e) ? 'نصب‌شده' : 'آماده');
    art.append(h('span', 'tcard-tag', tag), ico(e.icon));
    const tx = h('span', 'tcard-tx');
    tx.append(h('b', '', e.title), h('span', '', e.tagline));
    b.append(art, tx);
    b.addEventListener('click', () => { haptic(); templateDetail(e); });
    return b;
  }

  /* جزئیات قالب: پیش‌نمایش صفحه‌ها، آنچه اضافه می‌کند، و نصب */
  function templateDetail(e) {
    const ready = e.status === 'ready';
    const t = e.template && tplById(e.template);
    push((el) => {
      el.classList.add('tdetail');
      tint(el, e);
      const hero = h('div', 'td-hero');
      const bar = h('div', 'td-bar');
      bar.appendChild(iconBtn('back', 'برگشت', pop, 'round'));
      hero.appendChild(bar);
      const shots = h('div', 'td-shots');
      if (t) {
        const order = t.doc.pages.length > 2 ? [1, 0, 2] : [0];
        order.forEach((i, k) => { const ph = phoneShot(e, i, k === 1 || order.length === 1 ? 112 : 88); if (order.length > 1 && k !== 1) ph.classList.add(k ? 'tilt-l' : 'tilt-r'); shots.appendChild(ph); });
      } else {
        const big = h('span', 'td-art');
        big.appendChild(ico(e.icon));
        shots.appendChild(big);
      }
      hero.appendChild(shots);
      const body = h('div', 'td-body');
      const id = h('div', 'td-id');
      const nm = h('div', 'grow');
      nm.append(h('h2', 'td-name', e.title),
        h('span', 'td-sub', domainTitle(e.domain) + ' · ' + (!ready ? 'به‌زودی' : (t && t.premium ? 'پلن حرفه‌ای' : 'رایگان در همهٔ پلن‌ها'))));
      id.append(tq(e, 'lg'), nm);
      body.appendChild(id);
      body.appendChild(h('p', 'td-desc', e.desc || e.tagline));
      if (e.features && e.features.length) {
        body.appendChild(h('b', 'td-h', 'چه چیزهایی اضافه می‌کند'));
        const fl = h('div', 'td-feats');
        e.features.forEach(([icon, ft, fs]) => {
          const r = h('div', 'td-feat');
          const tx = h('span', 'grow');
          tx.append(h('b', '', ft), h('span', '', fs));
          r.append(tq(e, 'soft sm'), tx);
          r.querySelector('.tq').replaceChildren(ico(icon));
          fl.appendChild(r);
        });
        body.appendChild(fl);
      }
      if (e.components && e.components.length) {
        body.appendChild(h('b', 'td-h', `${faN(e.components.length)} کامپوننت که اضافه می‌شود`));
        const cs = h('div', 'td-chips');
        e.components.forEach(c => cs.appendChild(h('span', 'chip', c)));
        body.appendChild(cs);
      }
      const foot = h('div', 'td-foot');
      const ft = h('span', 'grow');
      const act = h('button', 'btn btn-p');
      act.type = 'button';
      if (!ready) {
        ft.append(h('b', '', 'در راه است'), h('span', '', 'وقتی آماده شد همین‌جا نصب می‌شود'));
        act.textContent = 'به‌زودی';
        act.disabled = true;
      } else if (installed(e)) {
        ft.append(h('b', '', 'روی «' + S.app.name + '» نصب است'), h('span', '', 'مدیریت محتوا از داشبورد مینی‌اپ'));
        act.textContent = 'باز کردن';
        act.addEventListener('click', () => { haptic(); if (S.doc.kit === 'shab') showStories(); else showApp(); });
      } else {
        ft.append(h('b', '', 'روی کدام مینی‌اپ؟'), h('span', '', S.app ? 'مینی‌اپ تازه یا «' + S.app.name + '»' : 'یک مینی‌اپ تازه'));
        act.textContent = 'نصب';
        act.addEventListener('click', () => { haptic(); installSheet(e); });
      }
      foot.append(ft, act);
      el.append(hero, body, foot);
    });
  }
  function installSheet(e) {
    const t = tplById(e.template);
    openSheet(sh => {
      sheetHead(sh, 'brand', 'grid', `نصب «${e.title}»`, 'اسم و لوگوی مینی‌اپ می‌ماند');
      const list = h('div', 'mk-list');
      list.appendChild(mkOpt(tq(null), 'مینی‌اپ تازه', S.me.apps.length < S.me.plan.max_apps ? `با قالب ${e.title} شروع کن` : `پلن ${S.me.plan.title} فقط ${faN(S.me.plan.max_apps)} مینی‌اپ دارد`, () => { closeSheet(); newApp(e.template); }));
      if (S.app && !installed(e)) {
        list.appendChild(mkOpt(tq(storeOfKit(S.doc.kit)), `روی «${S.app.name}»`, 'جای صفحه‌های فعلی می‌نشیند', () => { closeSheet(); pickTemplate(t, false); }));
      }
      sh.appendChild(list);
    });
  }

  /* ===================== «ساختن»: شیت چه می‌سازی؟ ===================== */
  function mkOpt(icon, title, sub, fn) {
    const b = h('button', 'mk');
    b.type = 'button';
    const tx = h('span', 'grow');
    tx.append(h('b', '', title), h('span', '', sub));
    b.append(icon, tx, ico('arrow', 'chev'));
    b.addEventListener('click', () => { haptic(); fn(); });
    return b;
  }
  function newApp(tplId) {
    if (S.me.apps.length >= S.me.plan.max_apps) { upsellSheet(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد.`); return; }
    onboard(tplId);
  }
  function makeSheet() {
    openSheet(sh => {
      const head = h('div', 'mk-head');
      const t = h('div', 'grow');
      t.append(h('b', '', 'چه می‌سازی؟'), h('span', '', 'با یک قالب شروع کن یا به مینی‌اپت چیزی اضافه کن'));
      const x = h('button', 'round');
      x.type = 'button';
      x.setAttribute('aria-label', 'بستن');
      x.appendChild(ico('x'));
      x.addEventListener('click', closeSheet);
      head.append(t, x);
      sh.appendChild(head);
      const list = h('div', 'mk-list');
      const left = S.me.plan.max_apps - S.me.apps.length;
      const plus = h('span', 'tq brand');
      plus.appendChild(ico('plus'));
      list.appendChild(mkOpt(plus, 'مینی‌اپ تازه', left > 0 ? 'اسم، رنگ و اولین قالب' : `پلن ${S.me.plan.title} فقط ${faN(S.me.plan.max_apps)} مینی‌اپ دارد`, () => { closeSheet(); newApp(); }));
      if (S.app) {
        const g = h('span', 'tq soft-brand');
        g.appendChild(ico('grid'));
        list.appendChild(mkOpt(g, `نصب قالب روی «${S.app.name}»`, storeList().filter(e => e.status !== 'ready').slice(0, 3).map(e => e.title).join('، ') + ' و …', () => { closeSheet(); tab('store'); }));
        const pg = h('span', 'tq soft-act');
        pg.appendChild(ico('page'));
        list.appendChild(mkOpt(pg, 'صفحهٔ تازه', `در «${S.app.name}» · ${faN(S.doc.pages.length)} از ${faN(S.plan.max_pages)} صفحه`, () => {
          closeSheet();
          if (S.doc.pages.length >= S.plan.max_pages) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_pages} صفحه دارد.`); return; }
          openEditor();
          addPage();
        }));
      }
      sh.appendChild(list);
      const foot = h('div', 'mk-foot');
      const dots = h('span', 'mk-dots');
      storeList().slice(0, 4).forEach(e => dots.appendChild(tq(e, 'soft xs')));
      const all = h('button', 'mk-all');
      all.type = 'button';
      all.append(document.createTextNode('همهٔ قالب‌ها'), ico('arrow'));
      all.addEventListener('click', () => { closeSheet(); tab('store'); });
      foot.append(dots, h('span', 'grow', `${faN(storeList().length)} قالب در ${faN(new Set(storeList().map(e => e.domain)).size)} حوزه`), all);
      sh.appendChild(foot);
    });
  }

  /* ===================== خانه: ویترین =====================
     هر مینی‌اپ یک گوشی واقعی روی صحنه: همان صفحهٔ اولی که خواننده می‌بیند (از
     پیش‌نویس، با نوار تلگرام بالایش). بین مینی‌اپ‌ها ورق می‌زنی؛ آخر ردیف گوشی
     خالی «تازه» است. زیر گوشی وسط: اسم، روشن/خاموش، آدم‌های این هفته و فقط
     یک کار اصلی (به رنگ خود مینی‌اپ) + «مدیریت». */
  function appStatus(a) {
    if (a.status === 'paused') return ['خاموش', 'off'];
    if (!a.published_at) return ['پیش‌نویس', 'warn'];
    return a.dirty ? ['تغییر منتشرنشده', 'warn'] : ['منتشر شده', 'live'];
  }
  function statusPill(a) {
    const [t, c] = appStatus(a);
    const p = h('span', 'pill ' + c);
    p.append(h('i'), document.createTextNode(t));
    return p;
  }
  const isCur = a => !!(a && S.app && String(a.id) === String(S.app.id));
  /* مینی‌اپ a را مینی‌اپ فعلی پنل کن (پیش‌نویس فعلی اول ذخیره می‌شود) */
  async function use(a) {
    if (isCur(a)) return;
    await saveNow();
    await openApp(a.id, true);
  }
  function brandColor() { return getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4B2EE8'; }
  const accentOf = doc => (/^#[0-9a-f]{6}$/i.test((doc && doc.theme && doc.theme.accent) || '') ? doc.theme.accent : brandColor());
  function onColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255;
    return lum > 0.62 ? '#17142B' : '#FFFFFF';
  }

  /* پیش‌نمایش مینی‌اپ‌های دیگر (سبک، از /api/previews)؛ مینی‌اپ فعلی همیشه S.doc است */
  S.previews = {};
  let previewsAt = 0;
  function loadPreviews(done) {
    if (Date.now() - previewsAt < 60000) return;
    previewsAt = Date.now();
    api('previews').then(res => {
      Object.keys(res.docs || {}).forEach(id => { if (!S.app || String(S.app.id) !== id) S.previews[id] = ES.normalize(res.docs[id]); });
      done();
    }).catch(() => { previewsAt = 0; });
  }
  const previewOf = a => (isCur(a) ? S.doc : S.previews[a.id] || null);
  const isEmptyDoc = doc => !!doc && doc.kit !== 'shab' && !doc.pages.some(p => p.blocks.length);

  /* گوشی با صفحهٔ واقعی مینی‌اپ (۳۹۰ پیکسل، کوچک‌شده). w: پهنای کل گوشی */
  function phoneBox(w) {
    const bez = w > 150 ? 6 : 5;
    const s = (w - 2 * bez) / 390;
    const ph = h('div', 'vph');
    ph.style.setProperty('--w', w + 'px');
    ph.style.setProperty('--bz', bez + 'px');
    ph.style.height = Math.round(844 * s) + 2 * bez + 'px';
    const scr = h('div', 'vph-s');
    const inner = h('div', 'vph-in');
    inner.style.transform = `scale(${s.toFixed(4)})`;
    scr.appendChild(inner);
    ph.append(scr, h('i', 'vph-isl'));
    ph.setAttribute('aria-hidden', 'true');
    return { el: ph, scr, inner };
  }
  /* نوار ساعت و سربرگ تلگرام بالای مینی‌اپ (همان رنگ صفحه) */
  function tgChrome(name, bg, ink) {
    const c = h('div', 'vph-chrome');
    c.style.background = bg;
    c.style.color = ink;
    const sb = h('div', 'vph-sb');
    sb.append(h('b', '', '۹:۴۱'), h('i', 'vph-bat'));
    const bar = h('div', 'vph-tg');
    bar.append(h('span', 'vph-x', 'بستن'), h('b', 'grow', name), ico('more'));
    c.append(sb, bar);
    return c;
  }
  function drawPhone(box, a) {
    const { scr, inner } = box;
    inner.textContent = '';
    const doc = previewOf(a);
    scr.classList.toggle('loading', !doc);
    if (!doc) return;
    if (isEmptyDoc(doc)) {
      scr.style.background = '#FFFFFF';
      const e = h('div', 'vph-empty');
      const ic = h('span', 'vph-empty-ic');
      ic.appendChild(ico('layers'));
      e.append(ic, h('b', '', 'هنوز قالب ندارد'), h('span', '', 'یک قالب انتخاب کن'));
      inner.append(tgChrome(a.name, '#FFFFFF', '#17142B'), e);
      return;
    }
    const host = h('div', 'vph-page');
    inner.appendChild(host);
    ES.render(host, doc, { page: doc.pages[0].id, appName: a.name, editing: true });
    const r = host.firstElementChild;
    const cs = r ? getComputedStyle(r) : null;
    const bg = cs ? cs.backgroundColor : '#FFFFFF';
    scr.style.background = bg;
    inner.insertBefore(tgChrome(a.name, bg, cs ? cs.color : '#17142B'), host);
  }

  function vtBtn(icon, label, kind, fn, color) {
    const b = h('button', 'vt-btn ' + kind);
    b.type = 'button';
    if (color) { b.style.setProperty('--ac', color); b.style.setProperty('--on-ac', onColor(color)); }
    b.setAttribute('aria-label', label);
    b.append(ico(icon), h('span', 'vt-l', label));
    b.addEventListener('click', async () => {
      haptic();
      b.disabled = true;
      try { await fn(); } catch (err) { failed(err); } finally { b.disabled = false; }
    });
    return b;
  }
  /* داستان‌های خود کاربر (نه نمونه‌های قالب) */
  const ownStories = () => storyList().filter(({ block }) => !isSample(block));
  /* پیش‌نمایش‌های سبک متن قسمت ندارند؛ نمونه‌ها را از اسم و تعداد قسمت می‌شناسیم */
  function ownStoryCount(doc) {
    const t = shabTemplate();
    const samples = {};
    if (t) t.doc.pages.forEach(p => p.blocks.forEach(b => { if (b.type === 'story') samples[b.props.title] = (b.props.chapters || []).length; }));
    let n = 0;
    doc.pages.forEach(p => p.blocks.forEach(b => {
      if (b.type === 'story' && samples[b.props.title] !== (b.props.chapters || []).length) n++;
    }));
    return n;
  }
  /* کار اصلی هر مینی‌اپ، بسته به حالش: [آیکن، متن، کار، رنگ] */
  function mainAction(a) {
    const doc = previewOf(a);
    const kit = doc ? doc.kit : a.kit;
    if (a.status === 'paused') return ['power', 'روشن کن', async () => { await use(a); if (await setActive(true)) renderHome(); }, 'var(--success)'];
    if (isEmptyDoc(doc) || (!doc && kit !== 'shab')) return ['grid', 'انتخاب قالب', async () => { await use(a); tab('store'); }, brandColor()];
    const ac = accentOf(doc);
    if (kit === 'shab') {
      const own = isCur(a) ? ownStories().length : (doc ? ownStoryCount(doc) : 1);
      if (!own) return ['plus', 'اولین داستانت را بنویس', async () => { await use(a); showStories(); newStorySheet(); }, ac];
      return ['pencil', 'قسمت تازه بنویس', async () => { await use(a); showStories(); newEpisode(); }, ac];
    }
    return ['pencil', 'ویرایش صفحه‌ها', async () => { await use(a); openEditor(); }, ac];
  }
  function stateChip(a) {
    const [t, c] = a.status === 'paused' ? ['خاموش', 'off'] : !a.published_at ? ['منتشر نشده', 'warn'] : ['روشن', 'live'];
    const p = h('span', 'vt-chip ' + c);
    p.append(h('i'), document.createTextNode(t));
    return p;
  }
  function weekLine(a, st) {
    if (a.status === 'paused') return 'خواننده‌ها «فعلاً بسته است» می‌بینند';
    if (!a.published_at) return 'هنوز کسی آن را ندیده';
    const n = (st && st.people_week) || 0;
    return n ? `${faN(n)} نفر این هفته` : 'این هفته هنوز کسی سر نزده';
  }

  function renderHome() {
    const first = (S.me.user && S.me.user.first_name) || '';
    $('hello-s').textContent = first ? `سلام ${first}` : 'سلام';
    $('home-av').textContent = (first || 'م').trim().charAt(0);
    const vh = (tg && tg.viewportStableHeight) || window.innerHeight || 720;
    const phH = Math.max(260, Math.min(440, vh - 400));
    const w = Math.round((phH - 12) * 390 / 844) + 12;
    const rail = $('vt-rail');
    rail.style.setProperty('--pw', w + 'px');
    rail.textContent = '';
    const slides = S.me.apps.map(a => ({ app: a })).concat([{ ghost: true }]);
    S.vt = { slides, idx: -1 };
    slides.forEach((sl, i) => {
      const el = h('button', 'vt-slide');
      el.type = 'button';
      if (sl.ghost) {
        const full = S.me.apps.length >= S.me.plan.max_apps;
        el.classList.add('ghost');
        el.setAttribute('aria-label', 'مینی‌اپ تازه');
        const g = h('div', 'vt-ghost');
        g.style.height = Math.round(844 * (w - 12) / 390) + 12 + 'px';
        const plus = h('span', 'vt-ghost-p');
        plus.appendChild(ico(full ? 'lock' : 'plus'));
        g.append(plus, h('b', '', 'تازه'));
        el.appendChild(g);
      } else {
        el.setAttribute('aria-label', sl.app.name);
        sl.box = phoneBox(w);
        drawPhone(sl.box, sl.app);
        el.appendChild(sl.box.el);
      }
      el.addEventListener('click', () => {
        if (S.vt.idx !== i) { select(); centerSlide(i, true); return; }
        haptic();
        if (sl.ghost) newApp();
        else use(sl.app).then(showApp).catch(failed);
      });
      sl.el = el;
      rail.appendChild(el);
    });
    const dots = $('vt-dots');
    dots.textContent = '';
    slides.forEach(() => dots.appendChild(h('i')));
    dots.hidden = slides.length < 2;
    rail.onscroll = () => {
      if (S.vtRaf) return;
      S.vtRaf = requestAnimationFrame(() => { S.vtRaf = 0; setVt(nearestSlide()); });
    };
    const start = Math.max(0, S.me.apps.findIndex(isCur));
    requestAnimationFrame(() => { centerSlide(start, false); setVt(start); });
    if (S.me.apps.some(a => !isCur(a) && !S.previews[a.id])) {
      loadPreviews(() => {
        if (S.screen !== 'home' || !S.vt) return;
        S.vt.slides.forEach(sl => { if (sl.box && !isCur(sl.app)) drawPhone(sl.box, sl.app); });
        if (S.vt.idx >= 0) renderVtInfo(S.vt.idx);
      });
    }
  }
  function centerSlide(i, smooth) {
    const rail = $('vt-rail');
    const sl = S.vt.slides[i];
    if (!sl) return;
    const a = sl.el.getBoundingClientRect(), r = rail.getBoundingClientRect();
    const d = Math.round((a.left + a.width / 2) - (r.left + r.width / 2));
    // با scroll-snap حتی یک حرکت ریز (مثلاً ۰٫۰۰۰۰۱) به نقطهٔ بعدی می‌پرد
    if (Math.abs(d) >= 2) rail.scrollBy({ left: d, behavior: smooth ? 'smooth' : 'auto' });
  }
  function nearestSlide() {
    const r = $('vt-rail').getBoundingClientRect();
    const mid = r.left + r.width / 2;
    let best = 0, bd = Infinity;
    S.vt.slides.forEach((sl, i) => {
      const b = sl.el.getBoundingClientRect();
      const d = Math.abs(b.left + b.width / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function setVt(i) {
    if (!S.vt || i === S.vt.idx) return;
    S.vt.idx = i;
    S.vt.slides.forEach((sl, k) => sl.el.classList.toggle('on', k === i));
    Array.from($('vt-dots').children).forEach((d, k) => d.classList.toggle('on', k === i));
    renderVtInfo(i);
  }
  function renderVtInfo(i) {
    const sl = S.vt.slides[i];
    const box = $('vt-info');
    box.textContent = '';
    const meta = h('div', 'vt-meta');
    const acts = h('div', 'vt-acts');
    if (sl.ghost) {
      const left = S.me.plan.max_apps - S.me.apps.length;
      $('vt-glow').style.setProperty('--gc', brandColor());
      meta.appendChild(h('span', '', left > 0 ? `${faN(left)} جای خالی داری · اسم، رنگ و قالب` : `پلن ${S.me.plan.title} فقط ${faN(S.me.plan.max_apps)} مینی‌اپ دارد`));
      acts.appendChild(vtBtn(left > 0 ? 'plus' : 'star', left > 0 ? 'ساختن مینی‌اپ تازه' : 'جای بیشتر', 'main', () => newApp(), brandColor()));
      box.append(h('b', 'vt-name', 'مینی‌اپ تازه'), meta, acts);
      return;
    }
    const a = isCur(sl.app) ? S.app : sl.app;
    const st = isCur(sl.app) ? S.stats : sl.app.stats;
    $('vt-glow').style.setProperty('--gc', accentOf(previewOf(a)));
    meta.append(stateChip(a), h('span', '', weekLine(a, st)));
    const [icon, label, fn, color] = mainAction(a);
    acts.append(vtBtn(icon, label, 'main', fn, color), vtBtn('settings', 'مدیریت', 'sec', async () => { await use(a); showApp(); }));
    box.append(h('b', 'vt-name', a.name), meta, acts);
  }

  /* «قسمت تازه»: اگر یک داستان خودت داری همان؛ اگر چند تا، اول می‌پرسد کدام؛
     اگر هنوز فقط نمونه‌ها هست، «داستان تازه». */
  function newEpisode() {
    const own = ownStories();
    if (!own.length) { newStorySheet(); return; }
    if (own.length === 1) { addChapter(own[0].block.id); return; }
    openSheet(sh => {
      sheetHead(sh, 'story', 'pencil', 'قسمت تازه برای کدام داستان؟', 'قسمت به آخر همان داستان اضافه می‌شود');
      const list = h('div', 'mk-list');
      own.slice().reverse().forEach(({ block }) => {
        const n = chaps(block).length;
        list.appendChild(mkOpt(coverMini(block.props, 'xs'), block.props.title || 'داستان', `قسمت ${faN(n + 1)}`, () => { closeSheet(); addChapter(block.id); }));
      });
      sh.appendChild(list);
    });
  }

  /* ===================== داشبورد مینی‌اپ: کاشی‌ها (بنتو) =====================
     پیش‌نمایش زنده، کلید بزرگ روشن/خاموش، لینک با QR، آخرین قسمت، آمار هفته و
     سه کاشی کوچک (ربات، پیام خوش‌آمد، قالب). «انتشار» فقط وقتی لازم است. */
  function tile(cls, tag) {
    const t = h(tag || 'div', 'tile ' + (cls || ''));
    if (tag === 'button') t.type = 'button';
    return t;
  }
  function tLbl(icon, text) {
    const l = h('span', 't-lbl');
    l.append(ico(icon), document.createTextNode(text));
    return l;
  }
  function tBtn(icon, label, cls, fn) {
    const b = h('button', 't-btn ' + (cls || ''));
    b.type = 'button';
    if (icon) b.appendChild(ico(icon));
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', e => { e.stopPropagation(); haptic(); fn(); });
    return b;
  }
  function bdiAt(user) {
    const b = h('bdi', '', '@' + user);
    b.dir = 'ltr';
    return b;
  }
  /* نمودار خطی کوچک؛ راست‌به‌چپ: روز قدیمی سمت راست، امروز سمت چپ */
  let sparkN = 0;
  function sparkSvg(vals, w, hh, color) {
    const v = vals && vals.length > 1 ? vals : [0, 0];
    const mx = Math.max.apply(null, v), mn = Math.min.apply(null, v), pad = 5;
    const pts = v.map((x, i) => [w - pad - i * (w - 2 * pad) / (v.length - 1), mx === mn ? hh - pad - 2 : pad + (1 - (x - mn) / (mx - mn)) * (hh - 2 * pad)]);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 2)], p1 = pts[i - 1], p2 = pts[i], p3 = pts[Math.min(pts.length - 1, i + 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    const id = 'spk' + (++sparkN);
    const last = pts[pts.length - 1];
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${hh}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', hh);
    svg.setAttribute('class', 'spark');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`
      + `<path d="${d} L${last[0].toFixed(1)} ${hh} L${pts[0][0].toFixed(1)} ${hh} Z" fill="url(#${id})"/>`
      + `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`
      + `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2.5"/>`;
    return svg;
  }
  /* تغییر بازدید این هفته نسبت به هفتهٔ قبل */
  function weekChange(st) {
    const a = (st && st.views_week) || 0, b = (st && st.views_prev_week) || 0;
    if (!a && !b) return null;
    const c = h('span', 't-chg');
    if (!b) { c.textContent = 'هفتهٔ اول'; return c; }
    const pct = Math.round((a - b) / b * 100);
    c.classList.add(pct >= 0 ? 'up' : 'down');
    c.append(ico(pct >= 0 ? 'up' : 'down'), document.createTextNode(`${faN(Math.abs(pct))}٪`));
    return c;
  }
  /* آخرین قسمتِ آخرین داستان (اول داستان‌های خودت، اگر نبود نمونه‌ها) */
  function lastEpisode() {
    const own = ownStories();
    const pool = own.length ? own : storyList();
    for (let k = pool.length - 1; k >= 0; k--) {
      const b = pool[k].block, l = chaps(b);
      if (l.length) return { b, ch: l[l.length - 1], n: l.length, own: own.length > 0 };
    }
    return null;
  }

  function renderApp() {
    if (S.screen !== 'app' || !S.doc) return;
    const entry = storeOfKit(S.doc.kit);
    const shab = S.doc.kit === 'shab';
    const noKit = !shab && !totalBlocks();
    const connected = !!S.app.bot_username;
    const on = S.app.status !== 'paused';
    const live = !!S.app.published_at;
    $('ad-name').textContent = S.app.name;
    const sub = $('ad-sub');
    sub.textContent = noKit ? 'هنوز قالب ندارد' : `قالب «${entry ? entry.title : 'پایه'}»`;
    if (connected) sub.append(' · ', bdiAt(S.app.bot_username));
    renderBar();
    const g = $('ad-body');
    g.textContent = '';

    // انتشار: فقط وقتی چیزی منتشرنشده هست
    if (!noKit && (!live || S.app.dirty)) {
      const t = tile('wide t-pub');
      const ic = h('span', 't-ic');
      ic.appendChild(ico('send'));
      const tx = h('span', 't-tx grow');
      tx.append(h('b', '', live ? 'تغییرهایت هنوز منتشر نشده' : 'هنوز منتشر نشده'),
        h('span', '', live ? 'خواننده‌ها هنوز نسخهٔ قبلی را می‌بینند' : 'تا منتشر نکنی، خواننده‌ها چیزی نمی‌بینند'));
      t.append(ic, tx, tBtn('', 'انتشار', 'main', publishSheet));
      g.appendChild(t);
    }
    // بدون قالب: انتخاب قالب کار اصلی است
    if (noKit) {
      const t = tile('wide t-pick');
      const stack = h('span', 't-stack');
      storeList().slice(0, 4).forEach(e => stack.appendChild(tq(e, 'xs')));
      const tx = h('span', 't-tx grow');
      const ready = storeList().filter(e => e.status === 'ready');
      tx.append(h('b', '', 'این مینی‌اپ هنوز قالب ندارد'),
        h('span', '', ready.length ? `«${ready[0].title}» آماده است؛ بقیه به‌زودی` : 'یک قالب انتخاب کن'));
      const top = h('span', 't-row');
      top.append(stack, tx);
      t.append(top, tBtn('grid', 'انتخاب قالب', 'main', () => tab('store')));
      g.appendChild(t);
    }

    // پیش‌نمایش زنده (بلند، ستون راست)
    const pv = tile('tall t-prev');
    pv.appendChild(tLbl('eye', 'پیش‌نمایش'));
    // پهنای ستون: (پهنای شبکه − دو حاشیه − فاصله) ÷ ۲، منهای حاشیهٔ کاشی
    const colW = ((g.clientWidth || 390) - 2 * (parseFloat(getComputedStyle(g).paddingLeft) || 22) - 12) / 2;
    const box = phoneBox(Math.round(Math.max(104, Math.min(150, colW - 26))));
    box.el.classList.add('t-phone');
    drawPhone(box, S.app);
    const peek = h('button', 't-peek');
    peek.type = 'button';
    peek.setAttribute('aria-label', 'دیدن مثل خواننده');
    peek.appendChild(box.el);
    peek.addEventListener('click', () => { haptic(); S.pageId = S.doc.pages[0].id; previewPage(); });
    pv.append(peek, h('i', 't-fade'), tBtn('pencil', noKit ? 'صفحه‌ها' : 'ویرایش', 'ink t-edit', openEditor));
    g.appendChild(pv);

    // روشن / خاموش
    const pw = tile('t-power' + (on ? ' on' : ''), 'button');
    pw.setAttribute('role', 'switch');
    pw.setAttribute('aria-checked', on ? 'true' : 'false');
    const prow = h('span', 't-row');
    const pic = h('span', 't-ic');
    pic.appendChild(ico('power'));
    const sw = h('span', 'switch');
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    prow.append(pic, sw);
    const ptx = h('span', 't-tx');
    ptx.append(h('b', '', on ? 'روشن است' : 'خاموش است'), h('span', '', on ? 'همه می‌توانند ببینند' : 'خواننده‌ها «فعلاً بسته است» می‌بینند'));
    pw.append(prow, ptx);
    pw.addEventListener('click', () => {
      haptic();
      if (on) confirmBox('مینی‌اپ خاموش شود؟ تا دوباره روشنش کنی خواننده‌ها «فعلاً بسته است» می‌بینند؛ چیزی پاک نمی‌شود.', () => setActive(false), { yes: 'خاموش کن' });
      else setActive(true);
    });
    g.appendChild(pw);

    // لینک و QR
    const lk = tile('t-link');
    const lrow = h('span', 't-row');
    const qb = h('button', 't-qr');
    qb.type = 'button';
    qb.setAttribute('aria-label', 'QR بزرگ و فرستادن لینک');
    qb.appendChild(qrSvg(S.app.url));
    qb.addEventListener('click', () => { haptic(); linkSheet(); });
    lrow.append(qb, tLbl('link', 'لینک'));
    lk.append(lrow, tBtn('copy', 'کپی لینک', 'soft', () => copyText(S.app.url)));
    g.appendChild(lk);

    // محتوا: آخرین قسمت (قالب قسمت) یا صفحه‌ها (قالب پایه)
    if (shab) {
      const le = lastEpisode();
      const t = tile('wide t-ep');
      const head = h('span', 't-row t-head');
      const all = h('button', 't-link-btn');
      all.type = 'button';
      all.append(document.createTextNode('همهٔ داستان‌ها'), ico('arrow'));
      all.addEventListener('click', () => { haptic(); showStories(); });
      head.append(tLbl('book', le && le.own ? 'آخرین قسمت' : 'داستان‌ها'), all);
      const row = h('span', 't-row');
      if (le) {
        const cv = coverMini(le.b.props, 'ep');
        const tx = h('span', 't-tx grow');
        const rd = ((shabStats() || { chapters: {} }).chapters || {})[le.ch.id];
        const bits = [`قسمت ${faN(le.n)} از «${le.b.props.title || 'داستان'}»`];
        if (le.ch.draft) bits.push('پیش‌نویس');
        else if (rd && rd.readers) bits.push(`${faN(rd.readers)} نفر خواندند`);
        tx.append(h('b', '', le.own ? (le.ch.title || `قسمت ${faN(le.n)}`) : 'داستان‌های نمونه'),
          h('span', '', le.own ? bits.join(' · ') : 'حالا داستان خودت را بنویس'));
        row.append(cv, tx);
      } else {
        const tx = h('span', 't-tx grow');
        tx.append(h('b', '', 'هنوز داستانی نداری'), h('span', '', 'فقط یک اسم لازم است'));
        row.appendChild(tx);
      }
      const ac = accentOf(S.doc);
      const go = le && le.own ? tBtn('plus', 'قسمت تازه', 'accent', newEpisode) : tBtn('plus', 'داستان تازه', 'accent', newStorySheet);
      go.style.setProperty('--ac', ac);
      go.style.setProperty('--on-ac', onColor(ac));
      row.appendChild(go);
      t.append(head, row);
      g.appendChild(t);
    } else if (!noKit) {
      const t = tile('wide t-ep');
      const row = h('span', 't-row');
      const ic = h('span', 't-ic soft');
      ic.appendChild(ico('page'));
      const tx = h('span', 't-tx grow');
      tx.append(h('b', '', `${faN(S.doc.pages.length)} صفحه · ${faN(totalBlocks())} بخش`), h('span', '', 'چیدن، نوشتن و عکس‌ها'));
      row.append(ic, tx, tBtn('pencil', 'ویرایش', 'ink', openEditor));
      t.appendChild(row);
      g.appendChild(t);
    }

    // آمار این هفته (بی‌بازدید: یک قدم روشن به جای نمودار خالی)
    const st = S.stats || {};
    if (!st.views_week && !st.people_week) {
      const t = tile('wide t-stats zero');
      const ic = h('span', 't-ic soft');
      ic.appendChild(ico('users'));
      const tx = h('span', 't-tx grow');
      tx.append(h('b', '', 'هنوز کسی سر نزده'), h('span', '', live ? 'لینک را برای خواننده‌هایت بفرست' : 'بعد از انتشار، لینک را برای خواننده‌ها بفرست'));
      t.append(ic, tx, tBtn('send', 'فرستادن', 'soft', linkSheet));
      g.appendChild(t);
    } else {
      const sc = tile('wide t-stats', 'button');
      const sl = h('span', 't-st-l');
      const big = h('span', 't-big');
      big.append(h('b', '', faN(st.people_week || 0)), h('span', '', 'نفر'));
      const line = h('span', 't-st-sub');
      line.appendChild(document.createTextNode(`${faN(st.views_week || 0)} بار باز شد`));
      const chg = weekChange(st);
      if (chg) line.appendChild(chg);
      sl.append(tLbl('users', 'این هفته'), big, line);
      const sr = h('span', 't-st-r');
      const more = h('span', 't-more');
      more.append(document.createTextNode('آمار کامل'), ico('arrow'));
      sr.append(sparkSvg(st.days, 168, 52, brandColor()), more);
      sc.append(sl, sr);
      sc.addEventListener('click', () => { haptic(); tab('stats'); });
      g.appendChild(sc);
    }

    // سه کاشی کوچک
    const row3 = h('div', 't-row3');
    const small = (icon, cls, title, subEl, fn) => {
      const t = tile('t-small', 'button');
      const ic = h('span', 't-ic ' + cls);
      ic.appendChild(ico(icon));
      const tx = h('span', 't-tx');
      const s2 = h('span', '');
      if (typeof subEl === 'string') s2.textContent = subEl; else s2.appendChild(subEl);
      tx.append(h('b', '', title), s2);
      t.append(ic, tx);
      t.addEventListener('click', () => { haptic(); fn(); });
      return t;
    };
    const wl = decodeHtml(S.app.welcome).split('\n')[0];
    row3.append(
      small('bot', 'tg', 'ربات', connected ? bdiAt(S.app.bot_username) : 'وصل کن', () => openBot(connected ? 'myapp' : 'connect')),
      small('chat', 'media', 'پیام خوش‌آمد', wl || 'متن پیش‌فرض', welcomeSheet),
      small('layers', 'plain', 'قالب', noKit ? 'انتخاب' : 'عوض یا حذف', noKit ? () => tab('store') : templateSheet));
    g.appendChild(row3);
  }

  /* لینک مینی‌اپ: QR بزرگ (برای چاپ یا اسکرین‌شات)، کپی و فرستادن */
  function linkSheet() {
    openSheet(sh => {
      sheetHead(sh, 'brand', 'link', 'لینک مینی‌اپ', 'خواننده‌ها با این لینک یا QR به مینی‌اپ می‌رسند');
      const box = h('div', 'qr-big');
      box.appendChild(qrSvg(S.app.url));
      sh.append(box, h('div', 'qr-url ltr', S.app.url.replace(/^https?:\/\//, '')));
      const row = h('div', 'qr-acts');
      const cp = h('button', 'btn btn-s grow');
      cp.type = 'button';
      cp.append(ico('copy'), document.createTextNode('کپی لینک'));
      cp.addEventListener('click', () => copyText(S.app.url));
      const share = h('button', 'btn btn-p grow');
      share.type = 'button';
      share.append(ico('send'), document.createTextNode('فرستادن'));
      share.addEventListener('click', () => {
        haptic();
        const u = 'https://t.me/share/url?url=' + encodeURIComponent(S.app.url) + '&text=' + encodeURIComponent(S.app.name);
        if (DEMO || !tg) { toast('در تلگرام، فهرست گفت‌وگوها برای فرستادن باز می‌شود'); return; }
        tg.openTelegramLink(u);
      });
      row.append(cp, share);
      sh.appendChild(row);
    });
  }

  /* ---------- QR (بایت، سطح تصحیح M، نسخهٔ ۱ تا ۱۰) ----------
     پیاده‌سازی کوچک از روی استاندارد (همان روش qrcodegen): کدگذاری داده، رید-سالومون،
     الگوهای ثابت، چیدن زیگزاگ و انتخاب بهترین ماسک با امتیاز جریمه. */
  const QR_ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const QR_BLK = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  function qrRaw(v) {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rsDivisor(deg) {
    const r = new Array(deg).fill(0);
    r[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRem(data, div) {
    const r = div.map(() => 0);
    data.forEach(b => {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((c, i) => { r[i] ^= gfMul(c, f); });
    });
    return r;
  }
  function qrMatrix(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let v = 1;
    for (; v <= 10; v++) {
      const cap = (Math.floor(qrRaw(v) / 8) - QR_ECC[v] * QR_BLK[v]) * 8;
      if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap) break;
    }
    if (v > 10) return null;
    const dataCw = Math.floor(qrRaw(v) / 8) - QR_ECC[v] * QR_BLK[v];
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4);
    put(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, dataCw * 8 - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    const cw = [];
    for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0xEC; cw.length < dataCw; p ^= 0xEC ^ 0x11) cw.push(p);
    // بلوک‌ها و تصحیح خطا، درهم‌آمیخته
    const nb = QR_BLK[v], el = QR_ECC[v], raw = Math.floor(qrRaw(v) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(el);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const dat = cw.slice(k, k + shortLen - el + (i < nShort ? 0 : 1));
      k += dat.length;
      const ecc = rsRem(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const all = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) all.push(b[i]); });
    // ماتریس و الگوهای ثابت
    const size = v * 4 + 17;
    const m = [], fn = [];
    for (let y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    });
    const al = [];
    if (v > 1) {
      const na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2;
      al.push(6);
      for (let p = size - 7; al.length < na; p -= step) al.splice(1, 0, p);
    }
    al.forEach((ax, i) => al.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const drawFormat = mask => {
      const data = (0 << 3) | mask;          // سطح M = ۰۰
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const f = ((data << 10) | rem) ^ 0x5412, bit = i => ((f >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (v >= 7) {
      let rem = v;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const vb = (v << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const d = ((vb >>> i) & 1) === 1, a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, d); set(b, a, d);
      }
    }
    // چیدن داده به شکل زیگزاگ
    let bi = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && bi < all.length * 8) { m[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
        }
      }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const applyMask = k => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0;
      const line = get => {
        let run = 1;
        for (let i = 1; i <= size; i++) {
          if (i < size && get(i) === get(i - 1)) { run++; continue; }
          if (run >= 5) p += run - 2;
          run = 1;
        }
        const s = [];
        for (let i = 0; i < size; i++) s.push(get(i) ? 1 : 0);
        const str = s.join('');
        for (let i = str.indexOf('1011101'); i >= 0; i = str.indexOf('1011101', i + 1)) {
          if (str.slice(Math.max(0, i - 4), i) === '0000' || str.slice(i + 7, i + 11) === '0000') p += 40;
        }
      };
      for (let y = 0; y < size; y++) line(x => m[y][x]);
      for (let x = 0; x < size; x++) line(y => m[y][x]);
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
      }
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
      p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    };
    let best = 0, bestP = Infinity;
    for (let k = 0; k < 8; k++) {
      applyMask(k); drawFormat(k);
      const pp = penalty();
      if (pp < bestP) { bestP = pp; best = k; }
      applyMask(k);
    }
    applyMask(best); drawFormat(best);
    return m;
  }
  const qrCache = {};
  function qrSvg(text) {
    const m = qrCache[text] || (qrCache[text] = qrMatrix(text));
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'qr');
    svg.setAttribute('aria-hidden', 'true');
    if (!m) return svg;
    const n = m.length, q = 2;
    svg.setAttribute('viewBox', `${-q} ${-q} ${n + 2 * q} ${n + 2 * q}`);
    svg.setAttribute('shape-rendering', 'crispEdges');
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x} ${y}h1v1h-1z`;
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
    return svg;
  }

  /* ---------- روشن، خاموش و حذف قالب ----------
     خاموش: خواننده‌ها به‌جای مینی‌اپ «فعلاً بسته است» می‌بینند و هیچ چیز پاک
     نمی‌شود (همان «توقف» ربات). حذف: قالب با محتوایش پاک و مینی‌اپ خالی می‌شود. */
  function syncAppInList() {
    const i = S.me.apps.findIndex(a => String(a.id) === String(S.app.id));
    if (i >= 0) S.me.apps[i] = Object.assign({}, S.me.apps[i], S.app);
  }
  async function setActive(on) {
    try {
      const res = await api('app/status', { id: S.app.id, active: on });
      S.app = res.app;
      syncAppInList();
      notify('success');
      toast(on ? 'روشن شد؛ خواننده‌ها دوباره مینی‌اپ را می‌بینند' : 'خاموش شد؛ خواننده‌ها «فعلاً بسته است» می‌بینند');
      renderBar();
      renderApp();
      return true;
    } catch (err) { failed(err); return false; }
  }
  function templateSheet() {
    const entry = storeOfKit(S.doc.kit);
    const title = entry ? entry.title : 'قالب پایه';
    const l = S.doc.kit === 'shab' ? storyList() : [];
    const nCh = l.reduce((n, x) => n + chaps(x.block).length, 0);
    openSheet(sheet => {
      sheetHead(sheet, 'story', 'layers', `قالب «${title}»`, 'روشن، خاموش، عوض کردن یا حذف');
      const on = S.app.status !== 'paused';
      const card = h('div', 'tpl-power' + (on ? ' on' : ''));
      const ic = h('span', 'paused-ic');
      ic.appendChild(ico('power'));
      const tx = h('span', 'grow');
      tx.append(h('b', '', on ? 'روشن است' : 'خاموش است'),
        h('span', '', on ? 'خواننده‌ها مینی‌اپ را می‌بینند' : 'خواننده‌ها «فعلاً بسته است» می‌بینند'));
      const sw = h('button', 'switch' + (on ? ' on' : ''));
      sw.type = 'button';
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      sw.setAttribute('aria-label', 'روشن یا خاموش');
      sw.addEventListener('click', async () => { sw.disabled = true; if (await setActive(!on)) closeSheet(); else sw.disabled = false; });
      card.append(ic, tx, sw);
      sheet.appendChild(card);
      sheet.appendChild(h('p', 'caption tpl-note', 'برای مدتی که داستان را کامل می‌کنی یا تعطیلی، خاموشش کن. با روشن کردن همه‌چیز همان‌طور که بود برمی‌گردد.'));
      const acts = h('div', 'acts');
      const act = (icn, label, fn, danger) => {
        const x = h('button', 'act' + (danger ? ' danger' : ''));
        x.type = 'button';
        x.append(ico(icn), h('span', 'grow', label));
        x.addEventListener('click', () => { haptic(); fn(); });
        acts.appendChild(x);
      };
      act('layers', 'عوض کردن قالب', () => { closeSheet(); tab('store'); });
      act('trash', 'حذف قالب', () => {
        const what = S.doc.kit === 'shab'
          ? `${faN(l.length)} داستان، ${faN(nCh)} قسمت و آمار خواندنشان برای همیشه پاک می‌شود`
          : 'همهٔ صفحه‌ها و بخش‌ها پاک می‌شود';
        confirmBox(`قالب «${title}» حذف شود؟ ${what} و مینی‌اپ خالی می‌شود. اگر فقط می‌خواهی مدتی دیده نشود، «خاموش» کافی است.`, removeKit, { yes: 'حذف', danger: true });
      }, true);
      sheet.appendChild(acts);
    });
  }
  async function removeKit() {
    try {
      const res = await api('app/remove_kit', { id: S.app.id });
      S.doc = ES.normalize(res.doc);
      S.app = res.app;
      H.base = JSON.stringify(S.doc);
      S.pageId = S.doc.pages[0].id;
      S.selected = null;
      S.shabStats = null;
      syncAppInList();
      closeSheet();
      popAll();
      notify('warning');
      toast('قالب حذف شد؛ یک قالب تازه انتخاب کن');
      showApp();
    } catch (err) { failed(err); }
  }

  /* ===================== آمار ===================== */
  function renderStats() {
    if (S.screen !== 'stats') return;
    const chips = $('stats-apps');
    chips.textContent = '';
    chips.hidden = S.me.apps.length < 2;
    S.me.apps.forEach(a => {
      const on = S.app && String(a.id) === String(S.app.id);
      const b = h('button', 'cat' + (on ? ' on' : ''), a.name);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.addEventListener('click', async () => {
        if (on) return;
        select();
        try { await saveNow(); await openApp(a.id, true); renderStats(); } catch (err) { failed(err); }
      });
      chips.appendChild(b);
    });
    const body = $('stats-body');
    body.textContent = '';
    if (!S.app) return;
    const entry = storeOfKit(S.doc.kit);
    const head = tint(h('div', 'st-app mx'), entry);
    const ht = h('span', 'grow');
    ht.append(h('b', '', S.app.name), h('span', '', entry ? entry.title : 'قالب پایه'));
    head.append(tq(entry), ht, statusPill(S.app));
    body.appendChild(head);
    const big = h('div', 'card mx bigstat');
    big.append(h('span', 'caption', 'بازدیدکننده از داخل تلگرام'), h('b', 'n', fmt(S.stats && S.stats.visitors)));
    const row = h('div', 'bigstat-row');
    [['views_today', 'بازدید امروز'], ['views_week', 'هفت روز']].forEach(([k, l]) => {
      const c = h('span');
      c.append(h('b', 'n', fmt(S.stats && S.stats[k])), h('span', '', l));
      row.appendChild(c);
    });
    big.appendChild(row);
    const days = (S.stats && S.stats.days) || [];
    if (days.some(Boolean)) {
      const ch = h('div', 'bigstat-chart');
      ch.append(h('span', 'caption', 'بازدید ۱۴ روز اخیر'), sparkSvg(days, 320, 64, brandColor()));
      big.appendChild(ch);
    }
    body.appendChild(big);
    if (S.doc.kit === 'shab') {
      const st = shabStats();
      const sec = h('div', 'sec');
      sec.append(h('span', 'sec-t', 'خواندن'), h('span', 'sec-e', entry ? entry.title : ''));
      body.appendChild(sec);
      const kp = h('div', 'kpis mx');
      const l = storyList();
      const pubCh = l.reduce((n, x) => n + chaps(x.block).filter(c => !c.draft).length, 0);
      [['brand', st ? faN(st.readers) : '…', 'خواننده'], ['act', st ? faN(st.followers) : '…', 'منتظر قسمت تازه'], ['media', faN(pubCh), 'قسمت منتشر']].forEach(([c, n, lb]) => {
        const k = h('div', 'kpi-t ' + c);
        k.append(h('b', 'n', n), h('span', '', lb));
        kp.appendChild(k);
      });
      body.appendChild(kp);
      if (l.length) {
        const g = h('div', 'card mx dcard');
        l.forEach(({ block }) => {
          const r = h('div', 'drow');
          const tx = h('span', 'grow');
          const rd = st && st.stories && st.stories[block.id];
          tx.append(h('b', '', block.props.title || 'بی‌نام'), h('span', '', `${faN(chaps(block).length)} قسمت`));
          r.append(coverMini(block.props, 'xs'), tx, h('b', 'n', rd ? faN(rd.readers) + ' خواننده' : '۰ خواننده'));
          g.appendChild(r);
        });
        body.appendChild(g);
      }
    }
    body.appendChild(h('p', 'st-foot', 'آمار از باز شدن مینی‌اپ داخل تلگرام جمع می‌شود؛ هر کاربر یک بار در روز شمرده می‌شود.'));
  }

  /* ===================== حساب: کاشی‌ها =====================
     خودت، پلن فعلی، جای مینی‌اپ‌ها و ارتقای بعدی؛ کارهای ربات ایزی‌ساز در سه
     کاشی کوچک. فهرست کامل پلن‌ها در شیت «همهٔ پلن‌ها». */
  async function buyPlan(p) {
    if (DEMO && p.key === 'pro') {
      await api('demo/plan', { key: 'pro' });
      S.me = await api('me');
      if (S.app) await openApp(S.app.id, true);
      closeSheet();
      renderAccount();
      toast('نسخهٔ نمایشی روی پلن حرفه‌ای است');
      return;
    }
    openBot('plans');
  }
  function plansSheet() {
    openSheet(sh => {
      sheetHead(sh, 'brand', 'star', 'پلن‌ها', 'پرداخت با ستارهٔ تلگرام، داخل ربات');
      const box = h('div', 'plans in-sheet');
      (S.me.plans || [S.me.plan]).forEach(p => {
        const cur = p.key === S.me.plan.key;
        const card = h('article', 'plan plan-' + p.key + (cur ? ' cur' : ''));
        const vol = h('span', 'plan-v');
        vol.append(h('b', 'n', faN(p.max_apps)), h('span', '', 'مینی‌اپ'));
        const tx = h('span', 'grow');
        const nm = h('span', 'plan-n');
        nm.appendChild(h('b', '', p.title));
        if (cur) nm.appendChild(h('span', 'plan-tag', 'پلن فعلی'));
        tx.append(nm, h('span', 'plan-s', `${faN(p.max_pages)} صفحه · ${p.premium_blocks ? 'همهٔ قالب‌ها' : 'قالب‌های پایه'}${p.branding ? ' · با نشان ایزی‌ساز' : ''}`),
          h('b', 'plan-p', p.price_stars ? `${faN(p.price_stars)} ستاره در ماه` : 'رایگان'));
        card.append(vol, tx);
        if (!cur && p.price_stars) {
          const buy = h('button', 'plan-buy', 'خرید');
          buy.type = 'button';
          buy.addEventListener('click', () => { haptic(); buyPlan(p).catch(failed); });
          card.appendChild(buy);
        }
        box.appendChild(card);
      });
      sh.appendChild(box);
    });
  }

  /* ===================== ورود به سایت با QR (app/site) =====================
     اسکنر خود تلگرام ← کد ← صفحهٔ تأیید با اسم مرورگر، جا و زمان ← «بله» یا «نه».
     هیچ ورودی بدون همین تأیید انجام نمی‌شود؛ کسی که QR را از صفحهٔ دیگری آورده
     باشد، این‌جا اسم مرورگر غریبه دیده می‌شود. */
  const WL_RE = /wl_([A-Za-z0-9_-]{20,40})/;
  function agoFa(t) {
    const sec = Math.max(0, Date.now() / 1000 - t);
    if (sec < 120) return 'همین حالا';
    if (sec < 3600) return faN(Math.floor(sec / 60)) + ' دقیقه پیش';
    if (sec < 86400) return faN(Math.floor(sec / 3600)) + ' ساعت پیش';
    if (sec < 172800) return 'دیروز';
    return faN(Math.floor(sec / 86400)) + ' روز پیش';
  }
  function deviceName(d) {
    const b = h('b', '');
    b.appendChild(h('bdi', '', d.browser));
    if (d.os) b.append(document.createTextNode(' روی '), h('bdi', '', d.os));
    return b;
  }
  function scanLogin() {
    if (DEMO) { loginConfirm('demo_' + Date.now() + 'abcdefghijklmn'); return; }
    if (!tg || !tg.showScanQrPopup || !(tg.isVersionAtLeast && tg.isVersionAtLeast('6.4'))) {
      toast('برای اسکن، تلگرامت را به‌روز کن', true);
      return;
    }
    tg.showScanQrPopup({ text: 'QR صفحهٔ ورود سایت را داخل کادر بگیر' }, text => {
      const m = WL_RE.exec(text || '');
      if (!m) { notify('warning'); return false; }   // QR دیگری است؛ اسکنر باز می‌ماند
      notify('success');
      setTimeout(() => loginConfirm(m[1]), 200);
      return true;
    });
  }
  async function loginConfirm(code) {
    let info;
    try { info = await api('weblogin/inspect', { code }); } catch (err) { failed(err); return; }
    openSheet(sh => {
      const hero = h('div', 'wl-hero');
      const ic = h('span', 'wl-ic');
      ic.appendChild(ico(info.device.mobile ? 'mobile' : 'laptop'));
      hero.append(ic, h('div', 'title-1', 'ورود به ایزی‌ساز؟'), h('p', 'caption', 'کسی می‌خواهد با حساب تو وارد سایت ایزی‌ساز شود.'));
      const box = h('div', 'wl-info');
      const row = (k, v) => { const r = h('div', 'wl-row'); r.append(h('span', 'caption', k), v); box.appendChild(r); };
      row('مرورگر', deviceName(info.device));
      const where = h('b', '', info.place || 'نامشخص');
      if (info.ip) { const ip = h('bdi', 'wl-ip', info.ip); where.append(document.createTextNode(' '), ip); }
      row('جا', where);
      const when = h('b', '', agoFa(info.at));
      when.appendChild(h('span', 'wl-ip', new Date(info.at * 1000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })));
      row('زمان', when);
      const warn = h('div', 'warn-box wl-warn');
      warn.append(ico('info'), h('span', '', 'اگر خودت QR را اسکن نکردی، «نه» را بزن. ایزی‌ساز هیچ‌وقت کد یا رمز تلگرامت را نمی‌خواهد.'));
      const yes = h('button', 'btn btn-p btn-block');
      yes.type = 'button';
      yes.append(ico('check'), document.createTextNode('بله، وارد شو'));
      const no = h('button', 'btn btn-s btn-block', 'نه، من نبودم');
      no.type = 'button';
      const act = async approve => {
        yes.disabled = no.disabled = true;
        try {
          await api(approve ? 'weblogin/approve' : 'weblogin/deny', { code });
        } catch (err) { failed(err); closeSheet(); return; }
        if (!approve) { notify('warning'); toast('ورود رد شد'); closeSheet(); return; }
        notify('success');
        sh.textContent = '';
        sh.appendChild(h('div', 'grip'));
        const done = h('div', 'done');
        done.append(catTile('brand', 'check'), h('div', 'title-1', 'وارد شدی'),
          h('p', 'caption', 'حالا به سایت نگاه کن؛ خودش به حسابت می‌رود.'));
        const ok = h('button', 'btn btn-p btn-block', 'باشه');
        ok.type = 'button';
        ok.addEventListener('click', closeSheet);
        sh.append(done, ok);
        if (S.screen === 'account') renderAccount();
      };
      yes.addEventListener('click', () => { haptic('medium'); act(true); });
      no.addEventListener('click', () => { haptic(); act(false); });
      sh.append(hero, box, warn, yes, no);
    });
  }
  async function devicesSheet() {
    let list;
    try { list = (await api('weblogin/sessions')).sessions || []; } catch (err) { failed(err); return; }
    openSheet(sh => {
      sheetHead(sh, 'brand', 'laptop', 'دستگاه‌های واردشده', 'مرورگرهایی که با حساب تو در سایت هستند');
      const box = h('div', 'wl-devs');
      sh.appendChild(box);
      const foot = h('div', 'wl-foot');
      sh.appendChild(foot);
      const draw = () => {
        box.textContent = '';
        foot.textContent = '';
        if (!list.length) {
          const e = h('div', 'wl-empty');
          e.append(h('p', 'caption', 'هنوز با هیچ مرورگری وارد سایت نشده‌ای. در سایت «ورود با تلگرام» را بزن و QR را از همین‌جا اسکن کن.'));
          const go = h('button', 'btn btn-p btn-block');
          go.type = 'button';
          go.append(ico('scan'), document.createTextNode('ورود به سایت'));
          go.addEventListener('click', () => { closeSheet(); scanLogin(); });
          e.appendChild(go);
          box.appendChild(e);
          return;
        }
        list.forEach(s => {
          const r = h('div', 'wl-dev');
          const ic = h('span', 'wl-dev-ic');
          ic.appendChild(ico(s.device.mobile ? 'mobile' : 'laptop'));
          const tx = h('span', 't-tx');
          tx.append(deviceName(s.device), h('span', '', (s.place ? s.place + ' · ' : '') + agoFa(s.last_seen)));
          const out = h('button', 'wl-out', 'خروج');
          out.type = 'button';
          out.addEventListener('click', async () => {
            out.disabled = true;
            try {
              list = (await api('weblogin/revoke', { id: s.id })).sessions || [];
              notify('success');
              toast('آن مرورگر بیرون شد');
              draw();
              if (S.screen === 'account') renderAccount();
            } catch (err) { out.disabled = false; failed(err); }
          });
          r.append(ic, tx, out);
          box.appendChild(r);
        });
        const all = h('button', 'btn btn-block wl-all');
        all.type = 'button';
        all.append(ico('logout'), document.createTextNode('خروج از همهٔ دستگاه‌ها'));
        all.addEventListener('click', () => confirmBox('از همهٔ مرورگرهایی که با حسابت وارد سایت شده‌اند خارج می‌شوی. ادامه می‌دهی؟', async () => {
          try {
            list = (await api('weblogin/revoke', { all: true })).sessions || [];
            notify('success');
            toast('از همهٔ دستگاه‌ها خارج شدی');
            draw();
            if (S.screen === 'account') renderAccount();
          } catch (err) { failed(err); }
        }, { yes: 'خروج از همه', danger: true }));
        foot.append(all, h('p', 'caption wl-note', 'هر ورود ۳۰ روز می‌ماند. هر وقت خواستی از همین‌جا قطعش کن.'));
      };
      draw();
    });
  }
  /* کاشی‌های حساب: ورود به سایت (اسکن) و دستگاه‌ها */
  function webTiles(g) {
    const t = tile('wide t-web', 'button');
    const ic = h('span', 't-ic solid');
    ic.appendChild(ico('scan'));
    const tx = h('span', 't-tx grow');
    tx.append(h('b', '', 'ورود به سایت'), h('span', '', 'QR صفحهٔ ورود سایت را اسکن کن'));
    const chev = h('span', 't-chev');
    chev.appendChild(ico('arrow'));
    t.append(ic, tx, chev);
    t.addEventListener('click', () => { haptic(); scanLogin(); });
    g.appendChild(t);

    const d = tile('wide t-devs', 'button');
    const dic = h('span', 't-ic plain');
    dic.appendChild(ico('laptop'));
    const dtx = h('span', 't-tx grow');
    const cnt = h('span', 't-cnt', '');
    dtx.append(h('b', '', 'دستگاه‌های واردشده'), h('span', '', 'مرورگرهایی که با حسابت در سایت هستند'));
    d.append(dic, dtx, cnt);
    d.addEventListener('click', () => { haptic(); devicesSheet(); });
    g.appendChild(d);
    api('weblogin/sessions').then(r => { cnt.textContent = faN((r.sessions || []).length); }).catch(() => {});
  }
  function renderAccount() {
    const u = S.me.user || {};
    const g = $('acc-body');
    g.textContent = '';
    const plans = S.me.plans || [S.me.plan];
    const i = plans.findIndex(p => p.key === S.me.plan.key);
    const next = i >= 0 ? plans[i + 1] : null;
    const used = S.me.apps.length, max = S.me.plan.max_apps;

    const pf = tile('wide t-prof');
    const av = h('span', 'av');
    av.textContent = (u.first_name || '؟').trim().charAt(0);
    const ptx = h('span', 't-tx grow');
    ptx.append(h('b', '', u.first_name || 'کاربر'), h('span', '', `سازندهٔ ${faN(used)} مینی‌اپ`));
    pf.append(av, ptx);
    g.appendChild(pf);
    webTiles(g);

    const pl = tile('t-plan', 'button');
    const pic = h('span', 't-ic');
    pic.appendChild(ico('star'));
    const until = S.me.plan_until ? new Date(S.me.plan_until * 1000).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' }) : '';
    const pt = h('span', 't-tx');
    pt.append(h('span', '', 'پلن تو'), h('b', '', S.me.plan.title), h('span', '', until ? `تا ${until}` : 'رایگان، برای همیشه'));
    pl.append(pic, pt);
    pl.addEventListener('click', () => { haptic(); plansSheet(); });
    g.appendChild(pl);

    const us = tile('t-use', 'button');
    const glyphs = h('span', 't-glyphs');
    for (let k = 0; k < Math.min(max, 10); k++) glyphs.appendChild(h('i', k < used ? 'on' : ''));
    const big = h('span', 't-big');
    big.append(h('b', '', faN(used)), h('span', '', `از ${faN(max)}`));
    us.append(tLbl('layers', 'مینی‌اپ‌ها'), big, glyphs,
      h('span', 't-foot', used < max ? `${faN(max - used)} جای خالی داری` : 'جای خالی نداری'));
    us.addEventListener('click', () => { haptic(); tab('home'); });
    g.appendChild(us);

    if (next) {
      const up = tile('wide t-up');
      const ic = h('span', 't-ic gold');
      ic.appendChild(ico('crown'));
      const tx = h('span', 't-tx grow');
      tx.append(h('b', '', next.title),
        h('span', '', `${faN(next.max_apps)} مینی‌اپ${next.premium_blocks && !S.me.plan.premium_blocks ? '، همهٔ قالب‌ها' : ''}${!next.branding && S.me.plan.branding ? '، بدون نشان' : ''} · ${faN(next.price_stars)} ستاره در ماه`));
      up.append(ic, tx, tBtn('', 'ارتقا', 'ink', () => buyPlan(next).catch(failed)));
      g.appendChild(up);
    }

    const row3 = h('div', 't-row3');
    const small = (icon, title, fn) => {
      const t = tile('t-small', 'button');
      const ic = h('span', 't-ic plain');
      ic.appendChild(ico(icon));
      t.append(ic, h('b', 't-name', title));
      t.addEventListener('click', () => { haptic(); fn(); });
      return t;
    };
    row3.append(small('grid', 'همهٔ پلن‌ها', plansSheet), small('bot', 'ربات ایزی‌ساز', () => openBot('')), small('help', 'راهنما', () => openBot('help')));
    g.appendChild(row3);
  }

  const allBlocks = () => S.doc.pages.reduce((a, p) => a.concat(p.blocks.map(b => ({ page: p, block: b }))), []);

  /* ===================== داستان‌ها: پنل مدیریت =====================
     همهٔ داستان‌های مینی‌اپ (کامپوننت story در هر صفحه) یک‌جا. داستان تازه با
     اسم، جلد، عنوان کوتاه و توضیحات ساخته می‌شود و در صفحهٔ داستان‌ها
     می‌نشیند؛ قفسه، ادامهٔ خواندن و قسمت‌های تازه خودشان پر می‌شوند.
     هر قسمت ادیتور متن دارد با سبک‌های نوشتاری قسمت (render.js، storyText):
     متن ساده با چند نشانه که دکمه‌ها می‌گذارند؛ HTML در کار نیست. */
  const GENRES = ['وحشت', 'معمایی', 'عاشقانه', 'فانتزی', 'علمی‌تخیلی', 'درام', 'جنایی', 'طنز'];
  const storyList = () => allBlocks().filter(({ block }) => block.type === 'story');
  const chaps = b => (Array.isArray(b.props.chapters) ? b.props.chapters : (b.props.chapters = []));
  const faN = n => Number(n || 0).toLocaleString('fa-IR');
  const BODY_MAX = 12000;

  // داستان‌های نمونهٔ قالب از روی متن خود قالب شناخته می‌شوند، نه نشانه‌ای در سند
  function isSample(b) {
    const t = shabTemplate();
    const first = (chaps(b)[0] || {}).body;
    return !!t && t.doc.pages.some(p => p.blocks.some(x => x.type === 'story' && x.props.title === b.props.title
      && (x.props.chapters || []).some(c => c.body === first)));
  }
  /* داستان تازه کجا بنشیند: صفحه‌ای که داستان دارد، یا «داستان‌ها»، یا صفحهٔ دوم */
  function storyHome() {
    return S.doc.pages.find(p => p.blocks.some(b => b.type === 'story'))
      || S.doc.pages.find(p => p.id === 'stories') || S.doc.pages[S.doc.pages.length > 1 ? 1 : 0];
  }
  /* داستان‌های نمونهٔ مینی‌اپ‌هایی که پیش از آمدن جلدها ساخته شده‌اند: یک بار جلد قالب
     را می‌گیرند (اگر صاحبش بعداً جلد را پاک کند، دوباره گذاشته نمی‌شود). */
  function sampleCovers() {
    if (!S.doc || S.doc.kit !== 'shab') return;
    const key = 'es-covers-' + S.app.id;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { return; }
    const t = shabTemplate();
    if (!t) return;
    const src = {};
    t.doc.pages.forEach(p => p.blocks.forEach(b => { if (b.type === 'story' && b.props.cover) src[b.props.title] = b.props.cover; }));
    let n = 0;
    storyList().forEach(({ block }) => {
      if (!block.props.cover && src[block.props.title] && isSample(block)) { block.props.cover = src[block.props.title]; n++; }
    });
    if (n) scheduleSave();
  }
  function coverMini(p, cls) {
    const w = h('div', 'st-cover ' + (cls || ''));
    ES.applyTheme(w, S.doc.theme, 'shab');
    w.appendChild(ES.shabCover(p));
    return w;
  }
  function genreControl(value, onChange) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', 'ژانر'));
    const pills = h('div', 'pills st-genres');
    const inp = h('input');
    inp.maxLength = 20;
    inp.placeholder = 'یا خودت بنویس';
    inp.value = value || '';
    const draw = () => pills.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.textContent === inp.value));
    GENRES.forEach(g => {
      const b = h('button', '', g);
      b.type = 'button';
      b.addEventListener('click', () => { inp.value = g; select(); draw(); onChange(g); });
      pills.appendChild(b);
    });
    inp.addEventListener('input', () => { draw(); onChange(inp.value.trim()); });
    draw();
    wrap.append(pills, inp);
    return wrap;
  }

  /* ---------- صفحهٔ اصلی «داستان‌ها» ---------- */
  let storiesQueued = false;
  function renderStoriesQ() {
    if (storiesQueued) return;
    storiesQueued = true;
    requestAnimationFrame(() => { storiesQueued = false; renderStories(); });
  }
  /* آمار خواندن از سرور؛ ۳۰ ثانیه نگه داشته می‌شود */
  function shabStats() {
    const st = S.shabStats;
    if (st && (st.data || st.busy) && Date.now() - st.at < 30000) return st.data;
    if (!S.app || S.doc.kit !== 'shab') return null;
    S.shabStats = { at: Date.now(), busy: true, data: st && st.data };
    api('kit/shab/stats?id=' + S.app.id).then(data => {
      S.shabStats = { at: Date.now(), data };
      if (S.screen === 'stories') renderStoriesQ();
      else if (S.screen === 'stats') renderStats();
      const top = S.stack[S.stack.length - 1];
      if (top) queueRefresh(top);
    }).catch(() => { S.shabStats = { at: Date.now(), data: st && st.data }; });
    return st && st.data;
  }

  function renderStories() {
    if (!S.doc || S.screen !== 'stories') return;
    $('st-app').textContent = S.app.name;
    tint($('stories'), storeOfKit(S.doc.kit));
    renderBar();
    const body = $('st-body');
    body.textContent = '';
    if (S.doc.kit !== 'shab') {
      const card = h('div', 'st-empty');
      card.append(catTile('story', 'book'), h('b', '', 'این مینی‌اپ روی قالب «قسمت» نیست'),
        h('p', '', 'برای نوشتن و مدیریت داستان‌ها، قالب «قسمت» را نصب کن. اسم و لوگو می‌ماند.'));
      const go = h('button', 'btn btn-p btn-block', 'نصب قالب «قسمت»');
      go.type = 'button';
      go.addEventListener('click', () => { haptic(); installShab(); });
      card.appendChild(go);
      body.appendChild(card);
      return;
    }
    const list = storyList();

    const add = h('button', 'st-new');
    add.type = 'button';
    const plus = h('span', 'st-new-ic');
    plus.appendChild(ico('plus'));
    const t = h('span', 'grow');
    t.append(h('b', '', 'داستان تازه'), h('span', '', 'فقط یک اسم لازم است؛ بقیه را بعداً'));
    add.append(plus, t, ico('arrow', 'chev'));
    add.addEventListener('click', () => { haptic(); newStorySheet(); });
    body.appendChild(add);

    const samples = list.filter(({ block }) => isSample(block));
    if (samples.length) {
      const note = h('div', 'st-sample');
      const tx = h('div', 'grow');
      tx.append(h('b', '', samples.length > 1 ? `${faN(samples.length)} داستان نمونه` : 'یک داستان نمونه'),
        h('span', '', 'برای این‌اند که ببینی مینی‌اپت چه شکلی می‌شود. هر وقت خواستی برشان دار.'));
      const rm = h('button', 'btn btn-s btn-sm', 'برداشتن');
      rm.type = 'button';
      rm.addEventListener('click', () => confirmBox('داستان‌های نمونه با قسمت‌هایشان حذف بشوند؟', () => {
        samples.forEach(({ block }) => { const f = findBlock(block.id); if (f) f.page.blocks.splice(f.index, 1); });
        notify('success');
        changed();
        toast('نمونه‌ها برداشته شدند');
      }));
      note.append(tx, rm);
      body.appendChild(note);
    }

    if (!list.length) {
      const empty = h('div', 'st-empty');
      empty.append(catTile('story', 'book'), h('b', '', 'هنوز داستانی نداری'), h('p', '', 'با «داستان تازه» شروع کن؛ اسمش کافی است.'));
      body.appendChild(empty);
    }
    list.forEach(({ block }) => body.appendChild(storyCard(block)));
  }
  function storyCard(b) {
    const p = b.props;
    const list = chaps(b);
    const card = h('div', 'st-card');
    const main = h('button', 'st-card-m');
    main.type = 'button';
    main.setAttribute('aria-label', 'مدیریت ' + (p.title || 'داستان'));
    main.appendChild(coverMini(p));
    const info = h('span', 'st-card-i');
    info.appendChild(h('b', 'st-card-t', p.title || 'داستان'));
    const drafts = list.filter(c => c.draft).length;
    const sst = (shabStats() || { stories: {} }).stories[b.id];
    info.appendChild(h('span', 'st-card-s', [`${faN(list.length)} قسمت`, p.status === 'done' ? 'تمام شده' : 'ادامه دارد',
      sst ? `${faN(sst.readers)} خواننده` : ''].filter(Boolean).join(' · ')));
    const meta = h('span', 'st-meta');
    if (isSample(b)) meta.appendChild(h('span', 'st-badge sample', 'نمونه'));
    if (drafts) meta.appendChild(h('span', 'st-badge draft', `${faN(drafts)} پیش‌نویس`));
    if (meta.childElementCount) info.appendChild(meta);
    main.append(info, ico('arrow', 'chev'));
    main.addEventListener('click', () => { haptic(); storyPage(b.id); });
    const foot = h('div', 'st-card-f');
    const last = list[list.length - 1];
    foot.appendChild(h('span', 'grow caption', last ? `آخرین قسمت: «${last.title || 'بی‌نام'}»` : 'هنوز قسمتی ندارد'));
    const addc = h('button', 'btn btn-p btn-sm');
    addc.type = 'button';
    addc.append(ico('pencil'), document.createTextNode('قسمت تازه'));
    addc.addEventListener('click', () => { haptic(); addChapter(b.id); });
    foot.appendChild(addc);
    card.append(main, foot);
    return card;
  }

  /* ---------- داستان تازه (شیت): فقط اسم لازم است ---------- */
  function newStorySheet() {
    if (S.doc.kit !== 'shab') { installShab(); return; }
    if (totalBlocks() >= S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد؛ هر داستان یکی حساب می‌شود.`); return; }
    const spec = S.schema.blocks.story;
    const fld = k => spec.fields.find(x => x.key === k);
    const d = { title: '', subtitle: '', blurb: '', genre: 'وحشت', cover: '', tone: 'blood', status: 'ongoing', url: '' };
    openSheet(sheet => {
      sheetHead(sheet, 'story', 'book', 'داستان تازه', 'اسمش را بنویس؛ بقیه اختیاری است.');
      const pv = h('div', 'st-new-pv');
      const drawPv = () => {
        pv.textContent = '';
        pv.appendChild(coverMini(Object.assign({}, d, { title: d.title || 'اسم داستان' }), 'lg'));
        const tx = h('div', 'st-new-pvt');
        tx.append(h('span', 'st-new-g', d.genre || 'ژانر'), h('b', '', d.title || 'اسم داستان'),
          h('span', '', d.subtitle || ''), h('p', '', d.blurb || 'خواننده‌ها این را روی جلد و صفحهٔ داستان می‌بینند.'));
        pv.appendChild(tx);
      };
      drawPv();
      sheet.appendChild(pv);
      const go = h('button', 'btn btn-p btn-block st-create');
      go.type = 'button';
      go.append(ico('plus'), document.createTextNode('ساختن و نوشتن قسمت اول'));
      const sync = () => { go.disabled = !d.title.trim(); drawPv(); };
      sheet.appendChild(control(Object.assign({}, fld('title'), { label: 'اسم داستان' }), d.title, v => { d.title = v; sync(); }));
      sheet.appendChild(control(Object.assign({}, fld('cover'), { label: 'عکس جلد (اختیاری)' }), d.cover, v => { d.cover = v; sync(); }));
      sheet.appendChild(genreControl(d.genre, v => { d.genre = v; sync(); }));
      const more = h('details', 'more-sec');
      const sum = h('summary');
      sum.append(ico('plus'), h('span', 'grow', 'توضیح و عنوان کوتاه (اختیاری)'), ico('chev', 'more-chev'));
      const mb = h('div', 'more-body');
      mb.appendChild(control(fld('subtitle'), d.subtitle, v => { d.subtitle = v; sync(); }));
      mb.appendChild(control(Object.assign({}, fld('blurb'), { label: 'توضیحات' }), d.blurb, v => { d.blurb = v; sync(); }));
      mb.appendChild(selectControl(Object.assign({}, fld('tone'), { label: 'رنگ جلد (وقتی عکس نداری)' }), d.tone, v => { d.tone = v; sync(); }));
      more.append(sum, mb);
      sheet.append(more, go);
      sync();
      go.addEventListener('click', () => {
        if (!d.title.trim()) return;
        const first = { id: newChId(), title: 'قسمت اول', body: '', note: '', lock: false, url: '', draft: true };
        const b = defaultBlock('story', Object.assign({}, d, { title: d.title.trim(), chapters: [first] }));
        storyHome().blocks.push(b);
        notify('success');
        closeSheet();
        changed();
        storyPage(b.id);
        const made = findBlock(b.id);
        if (made && chaps(made.block)[0]) chapterPage(b.id, chaps(made.block)[0]);
      });
    });
  }

  function addChapter(id) {
    const f = findBlock(id);
    if (!f) return;
    const list = chaps(f.block);
    if (list.length >= 60) { toast('هر داستان حداکثر ۶۰ قسمت دارد', true); return; }
    const ch = { id: newChId(), title: `قسمت ${faN(list.length + 1)}`, body: '', note: '', lock: false, url: '', draft: true };
    list.push(ch);
    changed();
    chapterPage(id, ch);
  }

  /* ---------- یک داستان: جلد، قسمت‌ها، شخصیت‌ها، ظاهر خواندن ----------
     کار اصلی (نوشتن قسمت) بالای صفحه است؛ مشخصات داستان و ظاهر خواندن
     هر کدام یک شیت جدا دارند تا این صفحه کوتاه و روشن بماند. */
  function storyPage(id) {
    const f = findBlock(id);
    if (!f) return;
    const b = f.block;
    push((el, pg) => {
      const top = subTop(el, 'داستان‌ها', b.props.title || 'داستان', [savedMark()]);
      const titleEl = top.querySelector('.stop-t b');
      const body = h('div', 'sbody sp-body');
      el.appendChild(body);

      const hero = h('div', 'sp-hero');
      const drawHero = () => {
        hero.textContent = '';
        hero.appendChild(coverMini(b.props, 'lg'));
        const tx = h('div', 'sp-hero-t');
        tx.append(h('b', 'sp-title', b.props.title || 'داستان'),
          h('span', 'caption', [b.props.genre, `${faN(chaps(b).length)} قسمت`, b.props.status === 'done' ? 'تمام شده' : 'ادامه دارد'].filter(Boolean).join(' · ')));
        if (b.props.blurb) tx.appendChild(h('p', 'sp-blurb', b.props.blurb));
        const acts = h('div', 'sp-hero-a');
        const ed = h('button', 'btn btn-s btn-sm');
        ed.type = 'button';
        ed.append(ico('pencil'), document.createTextNode('اسم و جلد'));
        ed.addEventListener('click', () => { haptic(); storyInfoSheet(b, () => { titleEl.textContent = b.props.title || 'داستان'; drawHero(); }); });
        const see = h('button', 'btn btn-s btn-sm');
        see.type = 'button';
        see.append(ico('eye'), document.createTextNode('دیدن'));
        see.addEventListener('click', () => { haptic(); const cur = findBlock(id); if (cur) S.pageId = cur.page.id; previewPage(); });
        acts.append(ed, see);
        tx.appendChild(acts);
        hero.appendChild(tx);
      };
      drawHero();
      body.appendChild(hero);

      const write = h('button', 'btn btn-p btn-block sp-write');
      write.type = 'button';
      write.append(ico('pencil'), document.createTextNode('نوشتن قسمت تازه'));
      write.addEventListener('click', () => { haptic(); addChapter(id); });
      body.appendChild(write);

      secLabel(body, 'قسمت‌ها', 'بزن تا بازش کنی · با دستگیره جابه‌جا کن');
      const list = h('div', 'layers st-chs');
      body.appendChild(list);
      const drawList = () => {
        list.textContent = '';
        const cur = findBlock(id);
        if (!cur) return;
        const cst = (shabStats() || { chapters: {} }).chapters;
        chaps(cur.block).forEach((c, i) => {
          const row = h('div', 'layer st-ch');
          row.dataset.id = String(i);
          const txt = h('button', 'layer-txt');
          txt.type = 'button';
          const t = h('span', 'st-ch-t');
          const ls = c.body ? ES.parseLines(c.body) : [];
          t.append(h('b', 'body-strong', c.title || `قسمت ${faN(i + 1)}`),
            h('span', 'caption', (ls.length ? `${ls.some(l => l.who) ? 'گفت‌وگو' : 'روایت'} · ${faN(ls.length)} پیام` : 'هنوز خالی است')
              + (cst[c.id] ? ` · ${faN(cst[c.id].readers)} خواننده` : '')));
          const badges = h('span', 'st-badges');
          badges.appendChild(h('span', 'st-badge ' + (c.draft ? 'draft' : 'live'), c.draft ? 'پیش‌نویس' : 'منتشر شده'));
          if (c.lock) badges.appendChild(h('span', 'st-badge lock', 'فقط اعضا'));
          txt.append(h('span', 'st-ch-n', faN(i + 1)), t, badges);
          txt.addEventListener('click', () => { haptic(); chapterPage(id, c); });
          const handle = h('span', 'layer-handle');
          handle.setAttribute('aria-label', 'جابه‌جایی');
          handle.appendChild(ico('grip'));
          row.append(txt, handle);
          list.appendChild(row);
        });
        if (!chaps(cur.block).length) list.appendChild(h('p', 'caption empty-items', 'هنوز قسمتی ندارد؛ «نوشتن قسمت تازه» را بزن.'));
      };
      sortable(list, order => {
        const cur = findBlock(id);
        if (!cur) return;
        const arr = chaps(cur.block);
        const next = order.map(k => arr[Number(k)]);
        arr.splice(0, arr.length, ...next);
        changed();
      });
      drawList();

      secLabel(body, 'شخصیت‌ها', 'کسانی که در گفت‌وگو حرف می‌زنند');
      const drawCast = castSection(body, b, () => {});

      secLabel(body, 'ظاهر خواندن', 'خواننده هم می‌تواند عوضش کند');
      const look = h('button', 'sp-look');
      look.type = 'button';
      const drawLook = () => {
        look.textContent = '';
        const art = h('span', 'sp-look-art' + (b.props.chat_theme === 'dark' ? ' dark' : ''));
        art.append(h('i'), h('i'));
        const tx = h('span', 'grow');
        tx.append(h('b', 'body-strong', 'گفت‌وگو و حالت خواندن'),
          h('span', 'caption', [b.props.chat_theme === 'dark' ? 'تیره' : 'روشن', READ_MODES[b.props.read_mode || 'scroll'][0],
            b.props.avatars === false ? 'بی‌عکس' : 'با عکس شخصیت‌ها'].join(' · ')));
        look.append(art, tx, ico('arrow', 'chev'));
      };
      look.addEventListener('click', () => { haptic(); lookSheet(b, drawLook); });
      drawLook();
      body.appendChild(look);
      pg.refresh = () => { if (!findBlock(id)) return; drawHero(); drawList(); drawCast(); drawLook(); };
    });
  }

  /* مشخصات داستان (شیت): اسم، جلد، ژانر، وضعیت؛ بقیه در «بیشتر» */
  function storyInfoSheet(b, onDone) {
    const spec = S.schema.blocks.story;
    const fld = k => spec.fields.find(x => x.key === k);
    openSheet(sheet => {
      sheetHead(sheet, 'story', 'book', 'اسم و جلد', 'تغییرها همان لحظه ذخیره می‌شوند');
      sheet.appendChild(control(Object.assign({}, fld('title'), { label: 'اسم داستان' }), b.props.title, v => { b.props.title = v; changed(); }));
      sheet.appendChild(control(Object.assign({}, fld('cover'), { label: 'عکس جلد' }), b.props.cover, v => { b.props.cover = v; changed(); }));
      sheet.appendChild(control(Object.assign({}, fld('blurb'), { label: 'چند خط دربارهٔ داستان' }), b.props.blurb, v => { b.props.blurb = v; changed(); }));
      sheet.appendChild(genreControl(b.props.genre, v => { b.props.genre = v; changed(); }));
      sheet.appendChild(selectControl({ label: 'وضعیت داستان', options: [['ongoing', 'ادامه دارد'], ['done', 'تمام شده']] }, b.props.status || 'ongoing', v => { b.props.status = v; changed(); }));
      const more = h('details', 'more-sec');
      const sum = h('summary');
      sum.append(ico('sliders'), h('span', 'grow', 'بیشتر: عنوان کوتاه، رنگ جلد، لینک'), ico('chev', 'more-chev'));
      const mb = h('div', 'more-body');
      mb.appendChild(control(fld('subtitle'), b.props.subtitle, v => { b.props.subtitle = v; changed(); }));
      mb.appendChild(selectControl(Object.assign({}, fld('tone'), { label: 'رنگ جلد (وقتی عکس نداری)' }), b.props.tone, v => { b.props.tone = v; changed(); }));
      mb.appendChild(control(fld('url'), b.props.url, v => { b.props.url = v; changed(); }));
      more.append(sum, mb);
      sheet.appendChild(more);
      const done = h('button', 'btn btn-p btn-block', 'تمام');
      done.type = 'button';
      done.addEventListener('click', closeSheet);
      const del = h('button', 'btn danger btn-block qc-del');
      del.type = 'button';
      del.append(ico('trash'), document.createTextNode('حذف این داستان'));
      del.addEventListener('click', () => confirmBox(`«${b.props.title || 'این داستان'}» با همهٔ قسمت‌هایش حذف بشود؟`, () => {
        const cur = findBlock(b.id);
        if (cur) cur.page.blocks.splice(cur.index, 1);
        notify('warning');
        changed();
        closeSheet();
        pop();
        toast('داستان حذف شد');
      }));
      sheet.append(done, del);
    }, () => { if (findBlock(b.id)) onDone(); });
  }

  /* ظاهر خواندن (شیت): انتخاب با تصویر، نه با اسم */
  const READ_MODES = {
    scroll: ['اسکرول', 'با پایین رفتن، پیام‌ها یکی‌یکی می‌آیند'],
    tap: ['لمس', 'هر بار که خواننده بزند، پیام بعدی'],
    notif: ['اعلان', 'مثل پیام‌هایی که روی صفحهٔ قفل گوشی می‌آیند'],
  };
  function optCards(cls, opts, value, onPick) {
    const box = h('div', 'lk-opts ' + cls);
    const draw = () => {
      box.textContent = '';
      opts.forEach(([key, label, sub, art]) => {
        const b = h('button', 'lk-opt' + (key === value ? ' on' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', key === value ? 'true' : 'false');
        b.append(art(), h('b', '', label));
        if (sub) b.appendChild(h('span', '', sub));
        b.addEventListener('click', () => { value = key; select(); draw(); onPick(key); });
        box.appendChild(b);
      });
    };
    draw();
    return box;
  }
  function lookSheet(b, onDone) {
    const chat = dark => () => { const a = h('span', 'lk-art lk-chat' + (dark ? ' dark' : '')); a.append(h('i'), h('i'), h('i')); return a; };
    const mode = m => () => { const a = h('span', 'lk-art lk-mode lk-' + m); a.append(h('i'), h('i'), h('i')); return a; };
    openSheet(sheet => {
      sheetHead(sheet, 'story', 'eye', 'ظاهر خواندن', 'نمی‌دانی؟ همین پیش‌فرض‌ها برای بیشتر داستان‌ها خوب است');
      sheet.appendChild(h('span', 'label ql-l', 'رنگ صفحهٔ گفت‌وگو'));
      sheet.appendChild(optCards('two', [['light', 'روشن', '', chat(false)], ['dark', 'تیره', '', chat(true)]], b.props.chat_theme || 'light',
        v => { b.props.chat_theme = v; changed(); }));
      sheet.appendChild(h('span', 'label ql-l', 'خواننده چطور بخواند؟'));
      sheet.appendChild(optCards('three', Object.keys(READ_MODES).map(k => [k, READ_MODES[k][0], READ_MODES[k][1], mode(k)]), b.props.read_mode || 'scroll',
        v => { b.props.read_mode = v; changed(); }));
      sheet.appendChild(switchControl({ label: 'عکس شخصیت‌ها کنار پیام‌ها' }, b.props.avatars !== false, v => { b.props.avatars = v; changed(); }));
      const done = h('button', 'btn btn-p btn-block lk-done', 'تمام');
      done.type = 'button';
      done.addEventListener('click', closeSheet);
      sheet.appendChild(done);
    }, onDone);
  }

  /* ---------- شخصیت‌های یک داستان ----------
     هر شخصیت شناسهٔ پایدار دارد (مثل قسمت‌ها)؛ خط‌های قسمت با همین شناسه
     به او اشاره می‌کنند، پس عوض کردن اسم یا عکس همهٔ حباب‌ها را عوض می‌کند. */
  const castOf = story => (Array.isArray(story.props.cast) ? story.props.cast : (story.props.cast = []));
  const castColor = (story, c) => (/^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : ES.Q_COLORS[Math.max(0, castOf(story).indexOf(c)) % ES.Q_COLORS.length]);
  const castAvatar = (story, c) => ES.avatar(c, castColor(story, c));
  function castSheet(story, c, onDone) {
    const isNew = !c;
    const list = castOf(story);
    if (isNew && list.length >= 12) { toast('هر داستان حداکثر ۱۲ شخصیت دارد', true); return; }
    const d = c ? Object.assign({}, c, { color: castColor(story, c) }) : { id: newChId(), name: '', avatar: '', side: list.some(x => x.side === 'me') ? 'them' : 'me', color: '' };
    if (isNew && !d.color) d.color = ES.Q_COLORS[list.length % ES.Q_COLORS.length];
    openSheet(sheet => {
      sheetHead(sheet, 'story', 'user', isNew ? 'شخصیت تازه' : 'ویرایش شخصیت', 'مثل افزودن یک مخاطب: اسم و عکس');
      const top = h('div', 'qc-top');
      const av = h('span', 'qc-av');
      const drawAv = () => { av.textContent = ''; av.appendChild(castAvatar(story, Object.assign({}, d, { name: d.name || '؟' }))); };
      const acts = h('div', 'qc-acts');
      const up = h('button', 'btn btn-s btn-sm');
      up.type = 'button';
      up.append(ico('upload'), document.createTextNode('عکس پروفایل'));
      const rm = h('button', 'btn btn-s btn-sm', 'بی‌عکس');
      rm.type = 'button';
      const syncRm = () => { rm.hidden = !d.avatar; };
      up.addEventListener('click', async () => {
        up.disabled = true;
        try { const url = await uploadImage(); if (url) { d.avatar = url; drawAv(); syncRm(); notify('success'); } } catch (err) { failed(err); } finally { up.disabled = false; }
      });
      rm.addEventListener('click', () => { d.avatar = ''; drawAv(); syncRm(); });
      acts.append(up, rm);
      top.append(av, acts);
      sheet.appendChild(top);
      const name = h('input', 'qc-name');
      name.maxLength = 30;
      name.placeholder = 'اسم شخصیت (مثلاً «من»، «مادر»، «ناشناس»)';
      name.value = d.name;
      name.addEventListener('input', () => { d.name = name.value; drawAv(); sync(); });
      const nf = h('div', 'field');
      nf.append(h('span', 'label', 'اسم'), name);
      sheet.appendChild(nf);
      sheet.appendChild(h('span', 'label ql-l', 'این شخصیت کیست؟'));
      const side = w => () => { const a = h('span', 'lk-art qc-side-art ' + w); a.append(h('i'), h('i')); return a; };
      sheet.appendChild(optCards('two', [['me', 'خودِ «من»', 'راوی داستان؛ پیام‌هایش سمت چپ', side('me')],
        ['them', 'یک نفر دیگر', 'پیام‌هایش سمت راست، با اسمش', side('them')]], d.side, v => { d.side = v; }));
      const cf = h('div', 'field');
      cf.appendChild(h('span', 'label', 'رنگ'));
      const sw = h('div', 'colors');
      const drawSw = () => {
        sw.textContent = '';
        ES.Q_COLORS.forEach(col => {
          const b = h('button', col.toLowerCase() === (d.color || '').toLowerCase() ? 'on' : '');
          b.type = 'button';
          b.style.background = col;
          b.setAttribute('aria-label', col);
          b.appendChild(ico('check'));
          b.addEventListener('click', () => { d.color = col; select(); drawSw(); drawAv(); });
          sw.appendChild(b);
        });
      };
      drawSw();
      cf.appendChild(sw);
      sheet.appendChild(cf);
      const go = h('button', 'btn btn-p btn-block', isNew ? 'افزودن شخصیت' : 'ذخیره');
      go.type = 'button';
      const sync = () => { go.disabled = !d.name.trim(); };
      go.addEventListener('click', () => {
        if (!d.name.trim()) return;
        d.name = d.name.trim();
        if (isNew) list.push(d); else Object.assign(c, d);
        notify('success');
        closeSheet();
        changed();
        if (onDone) onDone(isNew ? d : c);
      });
      sheet.appendChild(go);
      if (!isNew) {
        const del = h('button', 'btn danger btn-block qc-del');
        del.type = 'button';
        del.append(ico('trash'), document.createTextNode('حذف شخصیت'));
        del.addEventListener('click', () => {
          const used = chaps(story).filter(x => (x.body || '').indexOf('@' + c.id + ':') >= 0).length;
          confirmBox(used ? `«${c.name}» در ${faN(used)} قسمت حرف زده؛ حباب‌هایش بی‌نام و خاکستری می‌شوند. حذف بشود؟` : `«${c.name}» حذف بشود؟`, () => {
            const i = list.indexOf(c);
            if (i >= 0) list.splice(i, 1);
            notify('warning');
            changed();
            if (onDone) onDone(null);
          });
        });
        sheet.appendChild(del);
      }
      drawAv();
      syncRm();
      sync();
    });
  }
  /* شخصیت‌ها در صفحهٔ داستان: ردیف عکس‌ها مثل مخاطب‌های تلگرام */
  function castSection(body, story, onChange) {
    const box = h('div', 'qc-strip');
    const draw = () => {
      box.textContent = '';
      castOf(story).forEach(c => {
        const b = h('button', 'qc-person');
        b.type = 'button';
        b.append(castAvatar(story, c), h('b', '', c.name || 'بی‌نام'), h('span', '', c.side === 'me' && c.name !== 'من' ? '«من»' : ''));
        b.addEventListener('click', () => { haptic(); castSheet(story, c, () => { draw(); onChange(); }); });
        box.appendChild(b);
      });
      const add = h('button', 'qc-person qc-add');
      add.type = 'button';
      const pl = h('span', 'qc-plus');
      pl.appendChild(ico('plus'));
      add.append(pl, h('b', '', 'افزودن'), h('span', '', castOf(story).length ? '' : 'اول «من»'));
      add.addEventListener('click', () => { haptic(); castSheet(story, null, () => { draw(); onChange(); }); });
      box.appendChild(add);
    };
    draw();
    body.appendChild(box);
    return draw;
  }

  /* ---------- ادیتور قسمت: خط‌به‌خط، مثل نوشتن در یک گفت‌وگو ----------
     متن قسمت چند «خط» است (render.js، parseLines): متن راوی، حباب یک شخصیت،
     یا تصویر (تنها یا داخل حباب). پایین صفحه گوینده را انتخاب می‌کنی و
     می‌نویسی؛ هر خط در فهرست همان‌طور دیده می‌شود که خواننده می‌بیند، با
     زدن ویرایش می‌شود و با دستگیره جابه‌جا. ذخیره همان متن ساده است
     (ES.joinLines) و هیچ HTML از ادیتور ذخیره نمی‌شود. */
  function chatPaper(el, story) {
    ES.applyTheme(el, S.doc.theme, 'shab');
    el.classList.toggle('q-dark', story.props.chat_theme === 'dark');
    return el;
  }
  function speakerName(story, who) {
    if (!who) return 'راوی';
    const c = castOf(story).find(x => x.id === who);
    return c ? c.name || 'بی‌نام' : 'شخصیت حذف‌شده';
  }
  /* ردیف انتخاب گوینده: راوی، شخصیت‌ها، «+ شخصیت» */
  function speakerRow(story, value, onPick, onAdd) {
    const row = h('div', 'ql-spk');
    const mk = (who, label, lead) => {
      const b = h('button', 'ql-sp' + (who === value ? ' on' : ''));
      b.type = 'button';
      b.appendChild(lead);
      b.appendChild(h('span', '', label));
      b.addEventListener('pointerdown', e => e.preventDefault());
      b.addEventListener('click', () => { select(); onPick(who); });
      row.appendChild(b);
    };
    const nar = h('span', 'ql-sp-ic');
    nar.appendChild(ico('book'));
    mk('', 'راوی', nar);
    castOf(story).forEach(c => mk(c.id, c.name || 'بی‌نام', castAvatar(story, c)));
    if (onAdd) {
      const add = h('button', 'ql-sp ql-sp-add');
      add.type = 'button';
      add.append(ico('plus'), h('span', '', 'شخصیت'));
      add.addEventListener('click', () => { haptic(); onAdd(); });
      row.appendChild(add);
    }
    return row;
  }

  function chapterPage(id, ch) {
    const f = findBlock(id);
    if (!f || chaps(f.block).indexOf(ch) < 0) return;
    const story = f.block;
    let mode = 'write';
    let lines = ES.parseLines(ch.body);
    let who = (castOf(story).find(c => c.side === 'me') || {}).id || '';
    if (!lines.some(l => l.who)) who = '';
    let img = '';        // تصویرِ پیوست خط بعد
    let at = -1;         // خط بعد کجا بنشیند (‎-1 یعنی آخر)
    const past = [], future = [];
    push((el, pg) => {
      el.classList.add('sub-ch');
      const num = () => chaps(story).indexOf(ch) + 1;
      const top = subTop(el, story.props.title || 'داستان', `قسمت ${faN(num())}`, [savedMark()]);
      const head = h('div', 'ch-head');
      el.insertBefore(head, top);
      head.appendChild(top);
      const seg = h('div', 'seg ch-mode');
      head.appendChild(seg);
      const body = h('div', 'sbody ch-body');
      el.appendChild(body);

      const write = h('div', 'ch-write');
      const title = h('input', 'ch-title');
      title.maxLength = 80;
      title.placeholder = 'اسم قسمت';
      title.value = ch.title || '';
      title.addEventListener('input', () => { ch.title = title.value; changed(true); });
      // وضعیت و انتشار در یک نوار: پیش‌نویس ← «منتشر کن»؛ منتشرشده ← «به‌روزرسانی»
      const status = h('div', 'ch-pub');
      const drawPub = () => {
        status.textContent = '';
        status.classList.toggle('live', !ch.draft);
        const dot = h('span', 'ch-pub-ic');
        dot.appendChild(ico(ch.draft ? 'pencil' : 'check'));
        const tx = h('span', 'grow');
        tx.append(h('b', '', ch.draft ? 'پیش‌نویس' : 'منتشر شده'),
          h('span', '', ch.draft ? 'فقط تو می‌بینی؛ هر وقت آماده شد منتشرش کن' : 'خواننده‌ها می‌بینند؛ تغییرها را با «به‌روزرسانی» بفرست'));
        const go = h('button', 'btn btn-sm ' + (ch.draft ? 'btn-p' : 'btn-s'));
        go.type = 'button';
        go.append(ico('send'), document.createTextNode(ch.draft ? 'منتشر کن' : 'به‌روزرسانی'));
        go.addEventListener('click', () => {
          if (!lines.length) { toast('اول چند پیام بنویس', true); notify('warning'); return; }
          haptic();
          ch.draft = false;
          changed(true);
          drawPub();
          publish();
        });
        status.append(dot, tx, go);
        if (!ch.draft) {
          const back = h('button', 'ch-pub-back', 'برگرداندن به پیش‌نویس');
          back.type = 'button';
          back.addEventListener('click', () => { ch.draft = true; changed(true); drawPub(); toast('بعد از «انتشار» از مینی‌اپ برداشته می‌شود'); });
          status.appendChild(back);
        }
      };
      const paper = chatPaper(h('div', 'ql-paper'), story);
      const list = h('div', 'q-body ql-list');
      paper.appendChild(list);
      const tools = h('div', 'ql-tools');
      const stats = h('div', 'ch-stats');
      write.append(title, status, tools, paper, stats);
      drawPub();

      const more = h('details', 'more-sec');
      const sum = h('summary');
      sum.append(ico('lock'), h('span', 'grow', 'فقط اعضا، برچسب و لینک'), ico('chev', 'more-chev'));
      const mb = h('div', 'more-body');
      const chSpec = S.schema.blocks.story.fields.find(x => x.key === 'chapters').fields;
      const cf = k => chSpec.find(x => x.key === k);
      mb.appendChild(control(cf('note'), ch.note, v => { ch.note = v; changed(true); }));
      mb.appendChild(switchControl(cf('lock'), ch.lock, v => { ch.lock = v; changed(true); }));
      mb.appendChild(control(cf('url'), ch.url, v => { ch.url = v; changed(true); }));
      more.append(sum, mb);
      write.appendChild(more);

      const read = chatPaper(h('div', 'ch-read ql-read'), story);
      const drawRead = () => {
        read.textContent = '';
        const art = h('article', 'sh-r-art');
        art.append(h('span', 'sh-r-k', `قسمت ${faN(num())}`), h('h1', 'sh-r-h', ch.title || ''));
        if ((ch.body || '').trim()) art.appendChild(ES.episodeView(ch.body, story.props));
        else art.appendChild(h('p', 'sh-r-p', 'هنوز چیزی ننوشته‌ای.'));
        read.appendChild(art);
      };
      body.append(write, read);

      // ---- نویسنده (پایین صفحه، همیشه پیدا) ----
      const comp = h('div', 'ql-comp');
      const spk = h('div', 'ql-spk-w');
      const where = h('div', 'ql-where');
      const att = h('div', 'ql-att');
      const row = h('div', 'ql-row');
      const pic = h('button', 'ql-ib');
      pic.type = 'button';
      pic.setAttribute('aria-label', 'تصویر');
      pic.appendChild(ico('image'));
      const ta = h('textarea', 'ql-ta');
      ta.rows = 1;
      ta.dir = 'rtl';
      const send = h('button', 'ql-send');
      send.type = 'button';
      send.setAttribute('aria-label', 'ارسال');
      send.appendChild(ico('send'));
      row.append(pic, ta, send);
      comp.append(spk, where, att, row);
      el.appendChild(comp);

      // ---- مدل ↔ ذخیره و «برگرد» محلی ----
      const snap = () => JSON.stringify(lines);
      const remember = () => { past.push(snap()); if (past.length > 80) past.shift(); future.length = 0; drawTools(); };
      const commit = () => {
        ch.body = ES.joinLines(lines);
        changed(true);
        drawStats();
      };
      const restore = s => { lines = JSON.parse(s); drawList(); commit(); drawTools(); };

      function drawList() {
        list.textContent = '';
        const nodes = ES.lineNodes(lines, story.props);
        nodes.forEach((n, i) => {
          const r = h('div', 'layer ql-line' + (at === i + 1 ? ' ql-at' : ''));
          r.dataset.id = String(i);
          const hd = h('span', 'layer-handle');
          hd.setAttribute('aria-label', 'جابه‌جایی');
          hd.appendChild(ico('grip'));
          const tap = h('button', 'ql-hit');
          tap.type = 'button';
          tap.setAttribute('aria-label', `پیام ${faN(i + 1)}، ${speakerName(story, lines[i].who)}`);
          tap.addEventListener('click', () => { haptic(); lineSheet(i); });
          r.append(n, tap, hd);
          list.appendChild(r);
        });
        if (!lines.length) {
          const e = h('div', 'ql-empty');
          e.appendChild(h('b', '', 'مثل چت کردن بنویس'));
          [['۱', 'پایین صفحه انتخاب کن چه کسی حرف می‌زند'], ['۲', 'بنویس و دکمهٔ ارسال را بزن'], ['۳', '«راوی» یعنی متن خود داستان، بدون حباب']].forEach(([n, t]) => {
            const r = h('span', 'ql-step');
            r.append(h('i', '', n), h('span', '', t));
            e.appendChild(r);
          });
          list.appendChild(e);
        }
      }
      sortable(list, order => {
        const next = order.map(k => lines[Number(k)]);
        if (next.every((l, i) => l === lines[i])) return;
        remember();
        lines = next;
        drawList();
        commit();
      });

      const drawSpk = () => {
        spk.textContent = '';
        spk.appendChild(h('span', 'ql-spk-l', 'چه کسی می‌گوید؟'));
        spk.appendChild(speakerRow(story, who, w => { who = w; drawSpk(); ta.focus(); },
          () => castSheet(story, null, c => { if (c) who = c.id; drawSpk(); drawList(); })));
        ta.placeholder = who ? `پیام ${speakerName(story, who)}…` : 'متن داستان (راوی)…';
      };
      const drawWhere = () => {
        where.textContent = '';
        where.hidden = at < 0;
        if (at < 0) return;
        where.append(ico('plus'), h('span', 'grow', `پیام تازه بعد از پیام ${faN(at)}`));
        const x = h('button', 'ql-x', 'آخر قسمت');
        x.type = 'button';
        x.addEventListener('click', () => { at = -1; drawWhere(); drawList(); });
        where.appendChild(x);
      };
      const drawAtt = () => {
        att.textContent = '';
        att.hidden = !img;
        if (!img) return;
        const th = h('span', 'ql-thumb');
        const i = h('img');
        i.alt = '';
        i.src = ES.safeUrl(img, true);
        th.appendChild(i);
        const x = h('button', 'ql-x');
        x.type = 'button';
        x.setAttribute('aria-label', 'برداشتن تصویر');
        x.appendChild(ico('x'));
        x.addEventListener('click', () => { img = ''; drawAtt(); syncSend(); });
        att.append(th, h('span', 'grow caption', who ? 'تصویر داخل حباب؛ متن زیرش اختیاری است' : 'تصویر تنها؛ متن زیرنویس اختیاری است'), x);
      };
      const syncSend = () => { send.disabled = !ta.value.trim() && !img; };
      const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
      pic.addEventListener('click', async () => {
        pic.disabled = true;
        try { const url = await uploadImage(); if (url) { img = url; drawAtt(); syncSend(); notify('success'); } } catch (err) { failed(err); } finally { pic.disabled = false; }
      });
      ta.addEventListener('input', () => { grow(); syncSend(); });
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addLine(); } });
      const addLine = () => {
        const text = ta.value.replace(/\r/g, '').trim();
        if (!text && !img) return;
        if (lines.length >= 400) { toast('هر قسمت حداکثر ۴۰۰ پیام دارد؛ بقیه را قسمت بعد بنویس', true); return; }
        remember();
        // چند پاراگراف چسبانده شده ← چند خط از همین گوینده
        const parts = text ? text.split(/\n[ \t]*\n/).map(x => x.trim()).filter(Boolean) : [''];
        const made = parts.map((t, k) => ({ who, img: k === 0 ? img : '', text: t }));
        const pos = at < 0 ? lines.length : at;
        lines.splice(pos, 0, ...made);
        if (at >= 0) at += made.length;
        ta.value = '';
        img = '';
        grow();
        drawAtt();
        drawWhere();
        syncSend();
        drawList();
        commit();
        haptic();
        const last = list.children[pos + made.length - 1];
        if (last) last.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (made.length > 1) toast(`${faN(made.length)} پیام اضافه شد`);
      };
      send.addEventListener('pointerdown', e => e.preventDefault()); // کیبورد بسته نشود
      send.addEventListener('click', addLine);

      // ---- یک خط (شیت) ----
      function lineSheet(i) {
        const l = lines[i];
        if (!l) return;
        const d = Object.assign({}, l);
        openSheet(sheet => {
          sheetHead(sheet, 'story', d.who ? 'chat' : 'book', 'ویرایش پیام', speakerName(story, d.who));
          const sp = h('div');
          const drawSp = () => { sp.textContent = ''; sp.appendChild(speakerRow(story, d.who, w => { d.who = w; drawSp(); })); };
          drawSp();
          sheet.appendChild(sp);
          const t = h('textarea', 'ql-ta ql-ta-lg');
          t.dir = 'rtl';
          t.rows = 4;
          t.value = d.text;
          t.placeholder = d.img ? 'زیرنویس تصویر (اختیاری)' : 'متن';
          t.addEventListener('input', () => { d.text = t.value; });
          sheet.appendChild(t);
          const imgRow = h('div', 'ql-img-row');
          const drawImg = () => {
            imgRow.textContent = '';
            const pick = h('button', 'btn btn-s btn-sm');
            pick.type = 'button';
            pick.append(ico('image'), document.createTextNode(d.img ? 'عوض کردن تصویر' : 'افزودن تصویر'));
            pick.addEventListener('click', async () => {
              pick.disabled = true;
              try { const url = await uploadImage(); if (url) { d.img = url; drawImg(); notify('success'); } } catch (err) { failed(err); } finally { pick.disabled = false; }
            });
            if (d.img) {
              const th = h('span', 'ql-thumb');
              const im = h('img');
              im.alt = '';
              im.src = ES.safeUrl(d.img, true);
              th.appendChild(im);
              const rm = h('button', 'btn btn-s btn-sm', 'برداشتن');
              rm.type = 'button';
              rm.addEventListener('click', () => { d.img = ''; drawImg(); });
              imgRow.append(th, pick, rm);
            } else imgRow.appendChild(pick);
          };
          drawImg();
          sheet.appendChild(imgRow);
          const ok = h('button', 'btn btn-p btn-block', 'ذخیره');
          ok.type = 'button';
          ok.addEventListener('click', () => {
            const text = String(d.text || '').replace(/\r/g, '').trim();
            if (!text && !d.img) { toast('پیام خالی ماند؛ برای برداشتن «حذف» را بزن', true); return; }
            remember();
            lines[i] = { who: d.who, img: d.img, text };
            closeSheet();
            drawList();
            commit();
          });
          sheet.appendChild(ok);
          const acts = h('div', 'ql-acts');
          const act = (icon, label, fn, opt) => {
            const x = h('button', 'ql-act' + (opt && opt.danger ? ' danger' : ''));
            x.type = 'button';
            x.append(ico(icon), h('span', '', label));
            x.disabled = !!(opt && opt.disabled);
            x.addEventListener('click', () => { haptic(); closeSheet(); fn(); });
            acts.appendChild(x);
          };
          act('plus', 'پیام بعدش', () => { at = i + 1; who = d.who; drawWhere(); drawSpk(); drawList(); ta.focus(); });
          act('up', 'بالاتر', () => moveLine(i, -1), { disabled: i === 0 });
          act('down', 'پایین‌تر', () => moveLine(i, 1), { disabled: i === lines.length - 1 });
          act('copy', 'تکثیر', () => { remember(); lines.splice(i + 1, 0, Object.assign({}, l)); drawList(); commit(); });
          act('trash', 'حذف', () => { remember(); lines.splice(i, 1); if (at > i) at -= 1; drawWhere(); drawList(); commit(); toast('پیام حذف شد · «برگرد» بالای متن'); }, { danger: true });
          sheet.appendChild(acts);
        });
      }
      function moveLine(i, dlt) {
        const j = i + dlt;
        if (j < 0 || j >= lines.length) return;
        remember();
        [lines[i], lines[j]] = [lines[j], lines[i]];
        drawList();
        commit();
      }

      // ---- ابزار بالای متن: برگرد و دوباره ----
      const undoB = h('button', 'ch-chip ch-ic');
      const redoB = h('button', 'ch-chip ch-ic');
      [undoB, redoB].forEach((b, k) => {
        b.type = 'button';
        b.setAttribute('aria-label', k ? 'دوباره' : 'برگرد');
        b.appendChild(ico(k ? 'redo' : 'undo'));
        b.addEventListener('click', () => {
          haptic();
          if (k) { if (!future.length) return; past.push(snap()); restore(future.pop()); }
          else { if (!past.length) return; future.push(snap()); restore(past.pop()); }
        });
      });
      function drawTools() {
        undoB.disabled = !past.length;
        redoB.disabled = !future.length;
      }
      tools.append(h('span', 'label grow', 'روی هر پیام بزن تا ویرایشش کنی'), undoB, redoB);

      const drawStats = () => {
        const v = ch.body || '';
        const max = BODY_MAX;
        stats.textContent = '';
        stats.append(h('span', '', `${faN(lines.length)} پیام · حدود ${faN(ES.minutes(v))} دقیقه خواندن`),
          h('span', v.length > max ? 'danger-t' : v.length > max * 0.9 ? 'warn-t' : '',
            v.length > max ? `${faN(v.length - max)} حرف بیشتر از سقف؛ بقیه را قسمت بعد بنویس` : `${faN(v.length)} از ${faN(max)} حرف`));
      };

      const drawSeg = () => {
        seg.textContent = '';
        [['write', 'نوشتن'], ['read', 'دیدن مثل خواننده']].forEach(([k, label]) => {
          const b = h('button', k === mode ? 'on' : '', label);
          b.type = 'button';
          b.addEventListener('click', () => { mode = k; select(); drawSeg(); showMode(); });
          seg.appendChild(b);
        });
      };
      const showMode = () => {
        write.hidden = mode !== 'write';
        comp.hidden = mode !== 'write';
        read.hidden = mode !== 'read';
        if (mode === 'read') drawRead();
        el.scrollTop = 0;
      };
      drawSeg();
      showMode();
      drawSpk();
      drawWhere();
      drawAtt();
      syncSend();
      drawTools();
      drawList();
      drawStats();
      pg.refresh = () => {
        chatPaper(paper, story);
        chatPaper(read, story);
        drawSpk();
        drawList();
        if (mode === 'read') drawRead();
      };
    });
  }

  /* ---------- اتصال رویدادها ---------- */
  function wire() {
    document.querySelectorAll('[data-icon]').forEach(el => el.appendChild(ico(el.dataset.icon)));
    document.querySelectorAll('.mark').forEach(el => el.appendChild(markSvg()));
    document.querySelectorAll('#nav .nav-i').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.tab === S.tab && !$(b.dataset.tab).hidden) return;
      haptic();
      tab(b.dataset.tab);
    }));
    $('nav-make').addEventListener('click', () => { haptic('medium'); makeSheet(); });
    $('home-av').addEventListener('click', () => { haptic(); tab('account'); });
    $('store-find').addEventListener('click', () => {
      haptic();
      const box = $('store-q-box');
      box.hidden = !box.hidden;
      if (!box.hidden) $('store-q').focus(); else { $('store-q').value = ''; renderStore(); }
    });
    $('store-q').addEventListener('input', debounce(renderStore, 150));
    $('ad-back').addEventListener('click', () => { haptic(); tab('home'); });
    $('ad-more').addEventListener('click', () => { haptic(); settingsPage(); });
    $('st-back').addEventListener('click', () => { haptic(); showApp(); });
    $('ed-back').addEventListener('click', () => { haptic(); leaveEditor(); });
    $('bar-undo').addEventListener('click', () => { haptic(); undo(); });
    $('bar-redo').addEventListener('click', () => { haptic(); redo(); });
    $('scrim').addEventListener('click', closeSheet);
    $('bar-app').addEventListener('click', () => { haptic(); settingsPage(); });
    $('bar-preview').addEventListener('click', () => { haptic(); previewPage(); });
    $('bar-publish').addEventListener('click', () => { haptic(); publishSheet(); });
    $('st-publish').addEventListener('click', () => { haptic(); publishSheet(); });
    $('st-preview').addEventListener('click', () => { haptic(); if (S.doc.kit === 'shab') S.pageId = storyHome().id; previewPage(); });
    $('demo-link').addEventListener('click', e => { e.preventDefault(); location.hash = '#demo'; location.reload(); });
    const tools = {
      theme: themePage,
      stories: () => { popAll(); showStories(); },
      add: () => addSheet(),
      order: orderPage,
      settings: settingsPage,
    };
    document.querySelectorAll('#toolbar button[data-act]').forEach(b => {
      b.addEventListener('click', () => { haptic(); tools[b.dataset.act](); });
    });
    if (tg) {
      tg.BackButton.onClick(() => {
        if ($('sheet').classList.contains('on')) closeSheet();
        else if (S.stack.length) pop();
        else if (S.screen === 'editor') leaveEditor();
        else if (S.screen === 'stories') showApp();
        else if (S.screen === 'app') tab('home');
        else if (S.screen === 'onboard' && S.me && S.me.apps.length) tab('home');
      });
      tg.onEvent('themeChanged', () => { applyChrome(); if (S.doc && S.screen === 'editor') renderAll(); });
      tg.onEvent('safeAreaChanged', applyChrome);
      tg.onEvent('contentSafeAreaChanged', applyChrome);
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyChrome(); if (S.doc && S.screen === 'editor') renderAll(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && S.app && S.saveState === 'busy') saveNow(); });
  }
  /* کد ورود سایت از لینک ربات (#weblogin=…) یا startapp=wl_… ؛ یک بار مصرف می‌شود */
  function pendingWebLogin() {
    const m = /weblogin=([A-Za-z0-9_-]{20,40})/.exec(location.hash)
      || WL_RE.exec((tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '');
    if (!m) return '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    return m[1];
  }
  /* ---------- شروع ---------- */
  async function boot() {
    applyChrome();
    wire();
    if (tg) {
      tg.ready();
      tg.expand();
      try { tg.disableVerticalSwipes(); } catch (e) {}
      try { tg.enableClosingConfirmation(); } catch (e) {}
    }
    if (!DEMO && !(tg && tg.initData)) { show('blocked'); return; }
    try {
      const [schema, templates, me] = await Promise.all([publicJson('schema'), publicJson('templates'), api('me')]);
      S.schema = schema;
      S.templates = templates;
      S.me = me;
      const wl = pendingWebLogin();
      if (wl) setTimeout(() => loginConfirm(wl), 450);   // شیت تأیید روی هر صفحه‌ای که باز شد
      if (!me.apps.length) { onboard(); return; }
      let last = 0;
      try { last = Number(localStorage.getItem('es-last-app')) || 0; } catch (e) {}
      const pick = me.apps.find(a => a.id === last) || me.apps[0];
      await openApp(pick.id, true);
      tab('home');
    } catch (err) {
      $('blocked-msg').textContent = err.message;
      $('demo-link').hidden = true;
      show('blocked');
    }
  }

  boot();
})();
