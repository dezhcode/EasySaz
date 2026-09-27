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
  /* نقش تونل عبور (دو طاق) و نشان ایزی‌ساز (کاشی ۲×۲ که یکی‌اش روشن است) */
  function tunnelArt(size) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 190 190');
    s.setAttribute('class', 'tunnel-art');
    s.setAttribute('aria-hidden', 'true');
    if (size) { s.setAttribute('width', size); s.setAttribute('height', size); }
    [['M20 190V95a75 75 0 0 1 150 0v95', 16], ['M55 190V95a40 40 0 0 1 80 0v95', 10]].forEach(([d, w]) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d); p.setAttribute('stroke-width', w); p.setAttribute('fill', 'none');
      s.appendChild(p);
    });
    return s;
  }
  function markSvg() {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 40 40');
    s.setAttribute('aria-hidden', 'true');
    [[9, 9, 0], [21, 9, 0], [9, 21, 0], [21, 21, 1]].forEach(([x, y, on]) => {
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', 10); r.setAttribute('height', 10); r.setAttribute('rx', 3);
      r.setAttribute('class', on ? 'mark-on' : 'mark-off');
      s.appendChild(r);
    });
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
  function confirmBox(message, cb) {
    if (tg && tg.showConfirm && tg.initData) { tg.showConfirm(message, ok => ok && cb()); return; }
    const wrap = h('div', 'confirm');
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    const box = h('div', 'confirm-box');
    const row = h('div', 'confirm-row');
    const no = h('button', 'btn secondary', 'انصراف');
    const yes = h('button', 'btn primary', 'تأیید');
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
  const TABS = ['home', 'templates', 'account'];
  function show(id, asTab) {
    ['home', 'account', 'onboard', 'templates', 'editor', 'easy', 'blocked'].forEach(s => { $(s).hidden = s !== id; });
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

  /* ===== ناوبری شناور: قرص روشن زیر تب فعال می‌لغزد (مثل عبور) ===== */
  function renderNav() {
    document.querySelectorAll('#nav .nav-i').forEach(b => {
      const on = b.dataset.tab === S.tab;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    requestAnimationFrame(placeNav);
  }
  function placeNav() {
    const nav = $('nav'), ind = $('nav-ind'), on = nav.querySelector('.nav-i.on');
    if (!on || nav.hidden) return;
    const n = nav.getBoundingClientRect(), r = on.getBoundingClientRect();
    if (!r.width) return;
    ind.style.left = (r.left - n.left) + 'px';
    ind.style.width = r.width + 'px';
    if (ind.classList.contains('still')) requestAnimationFrame(() => requestAnimationFrame(() => ind.classList.remove('still')));
  }
  function tab(name) {
    if (name === 'home') { show('home', true); renderHome(); }
    else if (name === 'templates') templatesScreen(false, true);
    else if (name === 'account') { show('account', true); renderAccount(); }
  }

  /* ===== شروع: اسم ===== */
  /* ===== ساخت مینی‌اپ تازه: جادوی سه‌قدمی =====
     ۱. برای چیه؟ (کاشی نوع ← قالب مناسب)  ۲. اسم و لوگو، روی کارت عبور زنده
     ۳. حال‌وهوا: همین مینی‌اپ در چند رنگ. آخرش مینی‌اپ کامل در ادیتور. */
  const KINDS = [
    { key: 'cafe', tpl: 'cafe', cat: 'shop', icon: 'cup', title: 'کافه و رستوران', sub: 'منو، ساعت کاری، سفارش', names: ['کافه نارنج', 'رستوران باغ', 'شیرینی‌سرا'] },
    { key: 'shop', tpl: 'shop', cat: 'write', icon: 'shop', title: 'فروشگاه', sub: 'محصول، قیمت و سفارش', names: ['فروشگاه من', 'گالری لباس', 'دست‌سازه'] },
    { key: 'vpn', tpl: 'vpn', cat: 'navy', icon: 'bolt', title: 'فروش سرویس', sub: 'پلن‌ها و راهنمای اتصال، مثل عبور', names: ['عبور', 'تونل', 'مسیر آزاد'] },
    { key: 'story', tpl: 'shab', cat: 'story', icon: 'book', title: 'کانال داستان و رمان', sub: 'قالب «شب‌نوشت»: قفسه، فصل‌ها و صفحهٔ خواندن', names: ['کابوس‌های کوتاه', 'قصه‌های شب', 'رمان من'] },
    { key: 'personal', tpl: 'portfolio', cat: 'act', icon: 'user', title: 'شخصی و نمونه‌کار', sub: 'معرفی، نمونه‌کار، همکاری', names: ['استودیو من', 'نمونه‌کارهای سارا', 'طراح آزاد'] },
    { key: 'edu', tpl: 'academy', cat: 'media', icon: 'book', title: 'آموزش', sub: 'دوره‌ها، ثبت‌نام، سوالات', names: ['آموزشگاه', 'کلاس زبان', 'آکادمی کد'] },
    { key: 'other', tpl: 'linkbio', cat: '', icon: 'sparkle', title: 'چیز دیگه', sub: 'یک صفحهٔ ساده با لینک‌ها', names: ['صفحهٔ من', 'لینک‌های من'] },
  ];
  const MOODS = [
    ['آبی عبور', '#1D55F0'], ['سرمه‌ای', '#0A2572'], ['مرجانی', '#E0573E'], ['سبز', '#12A071'], ['بنفش', '#6A55E0'], ['فیروزه‌ای', '#0E8FAE'],
  ];
  const W = { step: 1, kind: null, name: '', logo: '', accent: '' };

  function onboard() {
    Object.assign(W, { step: 1, kind: null, name: '', logo: '', accent: '' });
    show('onboard');
    const input = $('ob-name');
    input.value = '';
    input.oninput = () => { W.name = input.value.trim(); drawPass(); wizardFoot(); };
    input.onkeydown = e => { if (e.key === 'Enter' && W.name.length >= 2) $('wz-next').click(); };
    $('wz-back').onclick = () => {
      haptic();
      if (W.step > 1) wizardStep(W.step - 1);
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
    drawKinds();
    wizardStep(1);
  }

  function wizardStep(n) {
    W.step = n;
    [1, 2, 3].forEach(i => { $('wz-' + i).hidden = i !== n; });
    document.querySelectorAll('.wz-dots i').forEach((d, i) => d.classList.toggle('on', i < n));
    const titles = {
      1: ['مینی‌اپت برای چیه؟', 'قدم ۱ از ۳ · یکی رو انتخاب کن، بقیه‌ش با ما'],
      2: ['اسم و لوگو', 'قدم ۲ از ۳ · روی کارت، سربرگ و ربات دیده می‌شه'],
      3: ['کدوم حال‌وهوا؟', 'قدم ۳ از ۳ · این مینی‌اپ خودته، فقط رنگش رو انتخاب کن'],
    };
    $('wz-title').textContent = titles[n][0];
    $('wz-sub').textContent = titles[n][1];
    $('wz-back').style.visibility = n === 1 && !(S.me && S.me.apps.length) ? 'hidden' : '';
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

  function kindTemplate() {
    const k = KINDS.find(x => x.key === W.kind);
    return k && S.templates.templates.find(t => t.id === k.tpl);
  }

  function drawKinds() {
    const box = $('wz-kinds');
    box.textContent = '';
    KINDS.forEach(k => {
      const t = S.templates.templates.find(x => x.id === k.tpl);
      const b = h('button', 'kind' + (W.kind === k.key ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', W.kind === k.key ? 'true' : 'false');
      const ic = h('span', 'ic ' + k.cat);
      ic.appendChild(ico(k.icon));
      const tx = h('span');
      tx.append(h('span', 'kind-t', k.title), h('span', 'kind-s', k.sub));
      const ok = h('span', 'kind-ok');
      ok.appendChild(ico('check'));
      b.append(ic, tx, ok);
      if (t && t.premium && !S.me.plan.premium_blocks) b.appendChild(h('span', 'kind-pro', 'نسخهٔ کاملش PRO'));
      b.addEventListener('click', () => {
        W.kind = k.key;
        W.accent = '';
        select();
        drawKinds();
        wizardFoot();
        // انتخاب = رفتن به قدم بعد، مثل انتخاب در عبور
        setTimeout(() => wizardStep(2), 220);
      });
      box.appendChild(b);
    });
  }

  function drawChips() {
    const k = KINDS.find(x => x.key === W.kind) || KINDS[0];
    const chips = $('ob-chips');
    chips.textContent = '';
    k.names.forEach(name => {
      const c = h('button', 'chip' + (W.name === name ? ' on' : ''), name);
      c.type = 'button';
      c.addEventListener('click', () => { $('ob-name').value = name; $('ob-name').oninput(); select(); drawChips(); });
      chips.appendChild(c);
    });
  }

  function drawPass() {
    $('ob-pass-name').textContent = W.name || 'اسم مینی‌اپت';
    const ini = $('ob-pass-initial');
    ini.textContent = '';
    if (W.logo) {
      const img = h('img');
      img.src = W.logo;
      img.alt = '';
      ini.appendChild(img);
    } else ini.textContent = W.name ? W.name.charAt(0) : '؟';
    const k = KINDS.find(x => x.key === W.kind);
    $('ob-pass-kind').textContent = k ? k.title : 'ساخته شده با ایزی‌ساز';
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
      openEditor();
      showCoach();
      if (cut) setTimeout(() => toast('نسخهٔ رایگانِ قالب ساخته شد؛ با پلن حرفه‌ای کامل می‌شه'), 2600);
    } catch (err) {
      failed(err);
      next.disabled = false;
      wizardFoot();
    }
  }

  /* ===== قالب‌ها (TemplatePicker) =====
     دو جور: «قالب اختصاصی» (کیت: پوسته، سربرگ و کامپوننت‌های خودش، مثل
     شب‌نوشت) که نصب می‌شود، و قالب‌های شروع سریع روی پوستهٔ پایه. */
  const kitOf = k => (k && k !== 'base' && S.schema.kits && S.schema.kits[k]) || null;
  const docKit = () => kitOf(S.doc && S.doc.kit);
  function fillName(doc) {
    const name = (S.app && S.app.name) || '';
    return JSON.parse(JSON.stringify(doc).split('{name}').join(name.replace(/["\\]/g, '')));
  }

  function templatesScreen(isNew, asTab) {
    show('templates', asTab);
    $('tpl-back').hidden = isNew || asTab;
    $('tpl-foot').hidden = !isNew;
    $('tpl-sub').textContent = isNew
      ? 'قدم ۲ از ۲ · همه‌چیزش قابل تغییره: متن، رنگ، صفحه‌ها و کامپوننت‌ها.'
      : `برای «${S.app ? S.app.name : ''}» · قالب تازه جای صفحه‌های فعلی می‌نشیند.`;
    const cats = S.templates.categories;
    let active = 'all';
    const bar = $('tpl-cats'), grid = $('tpl-grid');
    let kits = $('tpl-kits');
    if (!kits) { kits = h('div', 'tpl-kits'); kits.id = 'tpl-kits'; bar.parentNode.insertBefore(kits, bar); }
    kits.textContent = '';
    const special = S.templates.templates.filter(t => t.kit && t.kit !== 'base');
    if (special.length) {
      const lbl = h('div', 'tpl-kits-h');
      lbl.append(h('b', '', 'قالب‌های اختصاصی'), h('span', '', 'پوسته، سربرگ و کامپوننت‌های مخصوص خودشان'));
      kits.appendChild(lbl);
      special.forEach(t => kits.appendChild(kitCard(t, isNew)));
    }
    const drawCats = () => {
      bar.textContent = '';
      [['all', 'همه']].concat(Object.entries(cats)).forEach(([key, label]) => {
        const b = h('button', 'tab' + (key === active ? ' on' : ''), label);
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', key === active ? 'true' : 'false');
        b.addEventListener('click', () => { active = key; select(); drawCats(); drawGrid(); });
        bar.appendChild(b);
      });
    };
    const drawGrid = () => {
      grid.textContent = '';
      S.templates.templates.filter(t => (!t.kit || t.kit === 'base') && (active === 'all' || t.category === active)).forEach(t => {
        const locked = t.premium && !S.plan.premium_blocks;
        const card = h('button', 'tpl-card' + (locked ? ' locked' : ''));
        card.type = 'button';
        const thumb = h('div', 'tpl-thumb');
        const mini = h('div');
        thumb.appendChild(mini);
        ES.render(mini, fillName(t.doc), { appName: S.app.name });
        const info = h('div', 'tpl-info');
        info.append(h('b', 'body-strong', t.title), h('span', 'caption', t.desc));
        const meta = h('span', 'tpl-meta label');
        meta.textContent = `${t.pages} صفحه · ${t.blocks} کامپوننت · ${cats[t.category]}`;
        info.appendChild(meta);
        if (t.premium) thumb.appendChild(h('span', 'pro', 'PRO'));
        card.append(thumb, info);
        card.addEventListener('click', () => pickTemplate(t, isNew));
        grid.appendChild(card);
      });
    };
    drawCats();
    drawGrid();
    $('tpl-blank').onclick = () => openEditor();
    $('tpl-back').onclick = () => openEditor();
  }

  /* کارت قالب اختصاصی: پیش‌نمایش زنده، کامپوننت‌های خودش و «نصب» */
  const KIT_PARTS = { shab: ['قفسهٔ کتاب', 'ادامهٔ خواندن', 'فصل‌ها', 'صفحهٔ خواندن', 'نشان‌ها', 'باران و شمع'] };
  function kitCard(t, isNew) {
    const kit = kitOf(t.kit) || {};
    const on = S.doc && S.doc.kit === t.kit;
    const card = h('div', 'kit-card kit-' + t.kit);
    const thumb = h('button', 'kit-thumb');
    thumb.type = 'button';
    thumb.setAttribute('aria-label', 'نصب ' + t.title);
    const mini = h('div');
    thumb.appendChild(mini);
    ES.render(mini, fillName(t.doc), { appName: S.app ? S.app.name : t.title });
    const info = h('div', 'kit-info');
    info.append(h('span', 'kit-k', on ? 'نصب شده روی همین مینی‌اپ' : 'قالب اختصاصی'), h('b', 'kit-t', t.title), h('p', 'kit-d', t.desc));
    const parts = h('div', 'kit-parts');
    (KIT_PARTS[t.kit] || []).forEach(x => parts.appendChild(h('span', '', x)));
    info.appendChild(parts);
    if (kit.tagline) info.appendChild(h('p', 'kit-tag', kit.tagline));
    const btn = h('button', 'btn btn-block kit-go' + (on ? ' btn-s' : ' btn-p'));
    btn.type = 'button';
    btn.append(ico(on ? 'undo' : 'download'), document.createTextNode(on ? 'نصب دوباره (از اول)' : 'نصب روی ' + (S.app ? `«${S.app.name}»` : 'مینی‌اپ')));
    const go = () => { haptic(); pickTemplate(t, isNew); };
    btn.addEventListener('click', go);
    thumb.addEventListener('click', go);
    info.appendChild(btn);
    card.append(thumb, info);
    return card;
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
        openEditor();
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
  async function openApp(id, quiet) {
    const res = await api('app?id=' + encodeURIComponent(id));
    S.app = res.app;
    S.doc = ES.normalize(res.doc);
    resetHistory();
    S.stats = res.stats;
    S.plan = res.plan;
    S.pageId = S.doc.pages[0].id;
    S.selected = null;
    try { localStorage.setItem('es-last-app', String(id)); } catch (e) {}
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
    show(S.mode === 'pro' ? 'editor' : 'easy');
    renderAll();
  }
  async function leaveEditor() {
    if ($('sheet').classList.contains('on')) closeSheet();
    popAll();
    await saveNow();
    tab('home');
  }

  function renderAll() {
    if (S.screen === 'easy') { renderEasy(); return; }
    renderBar();
    renderPages();
    renderSecs();
  }

  function renderBar() {
    $('bar-name').textContent = S.app.name;
    const live = !!S.app.published_at;
    const st = $('bar-status');
    // یک خط کوتاه: وضعیت ذخیره وقتی در جریان است، وگرنه وضعیت انتشار
    const pub = !live ? 'پیش‌نویس' : (S.app.dirty ? 'منتشر نشده' : 'منتشر شده');
    const save = { busy: 'ذخیره…', err: 'ذخیره نشد', '': '' }[S.saveState];
    st.querySelector('span').textContent = save || pub;
    st.title = pub + (save ? ' · ' + save : ' · ذخیره شد');
    st.className = 'caption status ' + (S.saveState || (live && !S.app.dirty ? 'live' : ''));
    $('bar-publish').classList.toggle('dirty', !!S.app.dirty || !live);
    const es = $('easy-status');
    if (es) { es.querySelector('span').textContent = save || pub; es.className = st.className; es.title = st.title; }
    document.querySelectorAll('.saved').forEach(drawSaved);
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
    else if (S.screen === 'easy') renderEasyQ();
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
      const res = await api('app/save', { id: S.app.id, doc: S.doc });
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
  // پیش‌فرض ادیتور بخش‌ها (طرح د) است؛ حالت ساده (سؤال‌محور) از تنظیمات روشن می‌شود
  S.mode = (() => { try { return localStorage.getItem('es-editor-mode') === 'simple' ? 'simple' : 'pro'; } catch (e) { return 'pro'; } })();
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
    if ((S.screen === 'editor' || S.screen === 'easy') && S.doc) renderAll();
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
    const need = $('sheet').classList.contains('on') || (S.stack && S.stack.length) || S.screen === 'editor' || S.screen === 'easy'
      || (!S.asTab && (S.screen === 'onboard' || S.screen === 'templates') && S.app);
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
    { key: 'story', title: 'داستان تازه', sub: 'جلد، خلاصه و فصل‌ها', blocks: () => [['story', { title: 'داستان تازه' }]] },
    { key: 'library', title: 'کتابخانه', sub: 'ادامهٔ خواندن + قفسه + فصل‌های تازه', blocks: () => [['shab_continue', {}], ['shab_shelf', {}], ['shab_latest', { count: 3 }]] },
    { key: 'join', title: 'دعوت به کانال', sub: 'متن کوتاه + دکمهٔ عضویت', blocks: () => [
      ['text', { title: 'دربارهٔ کانال', body: 'هر شب یک فصل تازه. هر جا بمانی، دفعهٔ بعد از همان‌جا ادامه می‌دهی.' }],
      ['button', { label: 'عضویت در کانال', url: '' }]] },
    { key: 'quote', title: 'جمله از داستان', sub: 'یک جملهٔ درشت و ماندگار', blocks: () => [['shab_quote', {}]] },
    { key: 'marks', title: 'نشان‌های خواننده', sub: 'فصل‌هایی که هر کس نشان گذاشته', blocks: () => [['shab_marks', {}]] },
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
  function settingsPage() {
    push((el, pg) => {
      subTop(el, S.app.name, 'تنظیمات');
      const body = h('div', 'sbody');
      el.appendChild(body);
      const kitRow = h('button', 'row go-row');
      kitRow.type = 'button';
      const kg = h('span', 'grow');
      const kit = docKit();
      kg.append(h('b', 'body-strong', 'قالب: ' + (kit ? kit.title : 'کاشی (پایه)')), h('span', 'caption', kit ? 'پوسته و کامپوننت‌های اختصاصی' : 'قالب‌های اختصاصی مثل «شب‌نوشت» را ببین'));
      kitRow.append(catTile(kit ? 'story' : 'brand', kit ? 'book' : 'template'), kg, ico('arrow', 'chev'));
      kitRow.addEventListener('click', () => { haptic(); popAll(); templatesScreen(false); });
      body.appendChild(kitRow);
      const mode = selectControl({ label: 'حالت ادیتور', options: [['pro', 'بخش‌ها (همهٔ ابزارها)'], ['simple', 'ساده (سؤال‌محور)']] }, S.mode, v => { setMode(v); });
      body.appendChild(mode);
      const card = h('div', 'appcard');
      const logo = S.doc.header && ES.safeUrl(S.doc.header.logo, true);
      const tile = h('span', 'appbar-tile');
      if (logo) { const i = h('img'); i.alt = ''; i.src = logo; tile.appendChild(i); } else tile.textContent = (S.app.name || '?').charAt(0);
      const g = h('span', 'grow');
      g.append(h('b', 'title-2', S.app.name), h('span', 'caption ltr', S.app.url.replace(/^https?:\/\//, '')));
      const cp = h('button', 'btn btn-s btn-sm');
      cp.type = 'button';
      cp.append(ico('copy'), document.createTextNode('کپی لینک'));
      cp.addEventListener('click', () => copyText(S.app.url));
      card.append(tile, g, cp);
      body.appendChild(card);

      const stats = h('div', 'stats card');
      [['visitors', 'بازدیدکننده'], ['views_today', 'بازدید امروز'], ['views_week', 'هفت روز']].forEach(([k, label]) => {
        const s = h('div', 'stat');
        s.append(h('div', 'num-lg', ((S.stats && S.stats[k]) || 0).toLocaleString('en-US')), h('div', 'label', label));
        stats.appendChild(s);
      });
      body.appendChild(stats);

      body.appendChild(nameSection());
      const conn = h('div', 'sh-sec stack');
      conn.appendChild(h('span', 'label', 'ربات و لینک'));
      conn.append(botRow(), linkRow());
      body.appendChild(conn);
      body.appendChild(welcomeSection());

      const planSec = h('div', 'sh-sec');
      const plan = h('div', 'plan current');
      const head = h('div', 'plan-head');
      head.append(h('b', 'title-2', 'پلن ' + S.plan.title), h('span', 'pill label', 'پلن فعلی تو'));
      const ul = h('ul', 'body');
      [`${totalBlocks()} از ${S.plan.max_blocks} کامپوننت`, `${S.doc.pages.length} از ${S.plan.max_pages} صفحه`, `${S.me.apps.length} از ${S.plan.max_apps} مینی‌اپ`].forEach(t => {
        const li = h('li'); li.append(ico('check'), document.createTextNode(t)); ul.appendChild(li);
      });
      plan.append(head, ul);
      if (!S.plan.premium_blocks) {
        const up = h('button', 'btn primary block', 'ارتقا');
        up.addEventListener('click', () => upsellSheet(''));
        plan.appendChild(up);
      }
      planSec.appendChild(plan);
      body.appendChild(planSec);

      const appsSec = h('div', 'sh-sec stack');
      appsSec.appendChild(h('span', 'label', 'مینی‌اپ‌های من'));
      S.me.apps.forEach(a => {
        const r = h('button', 'row');
        r.type = 'button';
        const t = h('span', 'appbar-tile', (a.name || '?').charAt(0));
        const gg = h('span', 'grow');
        gg.append(h('b', 'body-strong', a.name), h('span', 'caption', a.id === S.app.id ? 'در حال ویرایش' : (a.bot_username ? '@' + a.bot_username : 'بدون ربات')));
        r.append(t, gg);
        if (a.id !== S.app.id) r.addEventListener('click', async () => { popAll(); await saveNow(); openApp(a.id).catch(failed); });
        appsSec.appendChild(r);
      });
      const more = h('button', 'add-item', '+ مینی‌اپ جدید');
      more.type = 'button';
      more.addEventListener('click', () => {
        if (S.me.apps.length >= S.me.plan.max_apps) { upsellSheet(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد.`); return; }
        popAll();
        onboard();
      });
      appsSec.appendChild(more);
      body.appendChild(appsSec);
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
    const lockNoLink = allBlocks().filter(({ block }) => block.type === 'story' && emptyUrl(block.props.url)
      && (block.props.chapters || []).some(c => c.lock && emptyUrl(c.url)));
    if (lockNoLink.length) {
      const f = lockNoLink[0];
      out.push({ st: 'warn', t: 'فصل قفل بدون لینک کانال', s: `«${f.block.props.title || 'داستان'}»: خواننده باید بداند کجا بخواند`,
        fix: () => { popAll(); goPage(f.page.id); editPage(f.block.id); }, fixL: 'درست کن' });
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
      const res = await api('app/publish', { id: S.app.id, doc: S.doc });
      S.app = res.app;
      S.doc = ES.normalize(res.doc);
      H.base = JSON.stringify(S.doc);
      if (!S.doc.pages.find(p => p.id === S.pageId)) S.pageId = S.doc.pages[0].id;
      setSave('');
      renderAll();
      notify('success');
      publishedSheet();
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

  function publishedSheet() {
    openSheet(sheet => {
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
      const card = h('div', 'plan sh-sec');
      const head = h('div', 'plan-head');
      const price = h('span', 'plan-price');
      price.append(ico('star'), h('b', 'num-lg', '250'), h('span', 'caption', 'ستاره در ماه'));
      head.append(h('b', 'title-2', 'حرفه‌ای'), price);
      const ul = h('ul', 'body');
      ['۳ مینی‌اپ، تا ۴۰ کامپوننت در ۶ صفحه', 'کارت محصول، پلن‌ها، گالری و ویژگی‌ها', 'قالب‌های حرفه‌ای', 'بدون نشان «ساخته شده با ایزی‌ساز»'].forEach(t => {
        const li = h('li');
        li.append(ico('check'), document.createTextNode(t));
        ul.appendChild(li);
      });
      const buy = h('button', 'btn primary block', 'دیدن پلن‌ها در ربات');
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
        if (S.screen === 'editor') renderAll(); else if (S.screen === 'home') renderHome();
        notify('success');
        toast('اسم عوض شد');
      } catch (err) { failed(err); }
    });
    row.append(input, save);
    nameSec.appendChild(row);
    return nameSec;
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
        if (S.screen === 'home') renderHome();
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

  function passCard(a) {
    const current = S.app && a.id === S.app.id;
    if (current) a = S.app;  // وضعیت انتشار و اسم تازه
    const card = h('article', 'pass');
    card.appendChild(tunnelArt());
    const head = h('div', 'pass-head');
    head.appendChild(h('span', 'pass-name', a.name));
    const live = !!a.published_at;
    const st = h('span', 'pass-st' + (live ? (a.dirty ? ' warn' : '') : ' warn'));
    st.append(h('i'), document.createTextNode(!live ? 'پیش‌نویس' : (a.dirty ? 'تغییر منتشرنشده' : 'منتشر شده')));
    head.appendChild(st);
    const big = h('div', 'pass-big');
    big.append(h('span', 'pass-num n', current && S.stats ? fmt(S.stats.visitors) : '—'), h('span', 'pass-unit', 'بازدیدکننده'));
    const rail = h('div', 'pass-rail');
    const fill = h('span');
    rail.appendChild(fill);
    const used = current ? totalBlocks() : 0;
    requestAnimationFrame(() => { fill.style.width = current ? Math.min(100, used / S.plan.max_blocks * 100) + '%' : '0%'; });
    const foot = h('div', 'pass-foot');
    const meta = h('span', 'pass-meta');
    if (current) meta.append(num(used), document.createTextNode(' از '), num(S.plan.max_blocks), document.createTextNode(' کامپوننت · '), num(S.doc.pages.length), document.createTextNode(' صفحه'));
    else meta.textContent = a.bot_username ? '@' + a.bot_username : 'بزن تا باز بشه';
    const btn = h('button', 'pass-btn');
    btn.type = 'button';
    btn.append(ico('pencil'), document.createTextNode('ویرایش'));
    btn.addEventListener('click', async () => {
      haptic();
      try { if (!current) await openApp(a.id); else openEditor(); } catch (err) { failed(err); }
    });
    foot.append(meta, btn);
    card.append(head, big, rail, foot);
    return card;
  }

  function newPassCard() {
    const b = h('button', 'newpass');
    b.type = 'button';
    const ic = h('span', 'ic navy lg');
    ic.appendChild(ico('plus'));
    const left = S.me.plan.max_apps - S.me.apps.length;
    b.append(ic, h('b', 'empty-t', 'مینی‌اپ تازه'),
      h('span', 'empty-s', left > 0 ? `پلن ${S.me.plan.title}: ${left} مینی‌اپ دیگر می‌تونی بسازی` : `پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد`));
    b.addEventListener('click', () => {
      haptic();
      if (S.me.apps.length >= S.me.plan.max_apps) { upsellSheet(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد.`); return; }
      onboard();
    });
    return b;
  }

  /* اسلایدر کارت‌ها: scroll-snap بومی؛ کارت‌های کناری کمی عقب‌تر و کم‌رنگ‌تر */
  function sliderFx(track, dots, onSettle) {
    let t = 0;
    const fx = () => {
      const r = track.getBoundingClientRect(), mid = r.left + r.width / 2;
      let best = 0, bestD = 1e9;
      [...track.children].forEach((sl, i) => {
        const b = sl.getBoundingClientRect();
        const d = (b.left + b.width / 2 - mid) / b.width;
        const a = Math.min(1, Math.abs(d));
        sl.style.transform = `scale(${1 - a * 0.06}) translateY(${a * 8}px)`;
        sl.style.opacity = String(1 - a * 0.35);
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
      });
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === best));
      return best;
    };
    track.onscroll = () => { fx(); clearTimeout(t); t = setTimeout(() => onSettle(fx()), 160); };
    requestAnimationFrame(fx);
  }

  function renderHome() {
    const first = (S.me.user && S.me.user.first_name) || '';
    $('hello-s').textContent = first ? `سلام ${first}` : 'سلام';

    // کارت‌ها
    const track = $('home-passes'), dots = $('home-dots');
    const keep = track.scrollLeft;
    track.textContent = '';
    dots.textContent = '';
    const slides = S.me.apps.map(a => { const sl = h('div', 'slide'); sl.appendChild(passCard(a)); sl.dataset.id = a.id; return sl; });
    const add = h('div', 'slide');
    add.appendChild(newPassCard());
    slides.concat([add]).forEach(sl => { track.appendChild(sl); dots.appendChild(h('i', 'dot-i')); });
    const idx = Math.max(0, S.me.apps.findIndex(a => S.app && a.id === S.app.id));
    requestAnimationFrame(() => {
      if (keep) track.scrollLeft = keep;
      else if (slides[idx]) slides[idx].scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    sliderFx(track, dots, async i => {
      const id = slides[i] && slides[i].dataset.id;
      if (!id || String(id) === String(S.app.id)) return;
      try { await saveNow(); await openApp(Number(id), true); select(); renderHome(); } catch (err) { failed(err); }
    });

    // کارهای سریع (کاشی‌های رنگی)
    const tiles = $('home-tiles');
    tiles.textContent = '';
    const connected = !!S.app.bot_username;
    [
      ['write', 'brush', 'ویرایش صفحه‌ها', 'سبک، رنگ و کامپوننت‌ها', () => openEditor()],
      ['shop', 'eye', 'پیش‌نمایش', 'همونی که کاربرها می‌بینن', () => { openEditor(); previewPage(); }],
      ['media', 'template', 'قالب‌ها', 'شروع دوباره با یک قالب', () => tab('templates')],
      ['act', 'bot', connected ? 'ربات تو' : 'اتصال ربات', connected ? '@' + S.app.bot_username : 'توکن رو در ربات بفرست', () => openBot(connected ? 'myapp' : 'connect')],
    ].forEach(([cat, icon, t, sub, fn]) => {
      const b = h('button', 'tile ' + cat);
      b.type = 'button';
      b.appendChild(ico(icon));
      const tx = h('span');
      tx.append(h('span', 'tile-t', t), h('span', 'tile-s', sub));
      b.appendChild(tx);
      b.addEventListener('click', () => { haptic(); fn(); });
      tiles.appendChild(b);
    });

    // اتصال و تنظیمات
    const conn = $('home-conn');
    conn.textContent = '';
    $('home-conn-e').textContent = S.app.name;
    const copy = h('button', 'btn btn-s btn-sm', 'کپی');
    copy.addEventListener('click', () => copyText(S.app.url));
    const url = h('span', 'row-s ltr', S.app.url.replace(/^https?:\/\//, ''));
    conn.appendChild(grow('brand', 'link', 'لینک مینی‌اپ', url, copy));
    conn.appendChild(grow(connected ? 'act' : '', 'bot', connected ? '@' + S.app.bot_username : 'ربات وصل نیست',
      connected ? (S.app.mode === 'full' ? 'کنترل کامل · /start هم جواب می‌ده' : 'دکمهٔ منو · مینی‌اپ روی ربات فعال است') : 'توکن رباتت رو در ایزی‌ساز بفرست',
      null, () => openBot(connected ? 'myapp' : 'connect')));
    const wl = decodeHtml(S.app.welcome).split('\n')[0];
    conn.appendChild(grow('shop', 'chat', 'پیام خوش‌آمد ربات', wl || 'متن پیش‌فرض', null, welcomeSheet));
    conn.appendChild(grow('write', 'pencil', 'اسم مینی‌اپ', S.app.name, null, renameSheet));

    // آمار
    const stats = $('home-stats');
    stats.textContent = '';
    [['visitors', 'بازدیدکننده'], ['views_today', 'بازدید امروز'], ['views_week', 'هفت روز']].forEach(([k, label]) => {
      const st = h('div', 'stat');
      st.append(h('b', 'n', fmt(S.stats && S.stats[k])), h('span', 'lbl', label));
      stats.appendChild(st);
    });
  }

  /* ===================== حساب ===================== */
  function renderAccount() {
    const u = S.me.user || {};
    const av = $('me-av');
    av.textContent = (u.first_name || '؟').trim().charAt(0);
    $('me-name').textContent = u.first_name || 'کاربر';
    const line = $('me-line');
    line.textContent = '';
    const planSpan = h('span');
    planSpan.append(ico('star'), document.createTextNode('پلن ' + S.me.plan.title));
    const appsSpan = h('span');
    appsSpan.append(ico('layers'), num(S.me.apps.length), document.createTextNode(' از '), num(S.me.plan.max_apps), document.createTextNode(' مینی‌اپ'));
    line.append(planSpan, appsSpan);

    // بلیت‌های پلن
    const box = $('acc-plans');
    box.textContent = '';
    (S.me.plans || [S.me.plan]).forEach(p => {
      const cur = p.key === S.me.plan.key;
      const best = p.key === 'pro';
      const tk = h('article', 'tk' + (best ? ' best' : ''));
      if (cur || best) {
        const tag = h('span', 'tk-tag ' + (cur ? 'plain' : 'best'));
        tag.append(ico(cur ? 'check' : 'star'), document.createTextNode(cur ? 'پلن فعلی تو' : 'پیشنهادی'));
        tk.appendChild(tag);
      }
      const top = h('div', 'tk-top');
      top.appendChild(h('span', 'tk-name', p.title));
      const vol = h('div', 'tk-vol');
      vol.append(num(p.max_blocks), h('small', '', 'کامپوننت'));
      top.append(vol, h('span', 'tk-s', `${p.max_apps} مینی‌اپ · ${p.max_pages} صفحه`), h('span', 'tk-s', p.premium_blocks ? 'همهٔ کامپوننت‌ها و قالب‌ها' : 'کامپوننت‌های پایه'));
      const bot = h('div', 'tk-bot');
      const price = h('div', 'tk-p');
      if (p.price_stars) price.append(num(p.price_stars), h('small', '', '⭐ در ماه'));
      else price.appendChild(h('b', '', 'رایگان'));
      const buy = h('button', 'tk-buy' + (cur ? ' short' : ''));
      buy.type = 'button';
      buy.textContent = cur ? 'فعال است' : (p.price_stars ? 'خرید در ربات' : 'پلن پایه');
      buy.disabled = cur || !p.price_stars;
      buy.addEventListener('click', async () => {
        haptic();
        if (DEMO && p.key === 'pro') {
          await api('demo/plan', { key: 'pro' });
          S.me = await api('me');
          if (S.app) await openApp(S.app.id, true);
          renderAccount();
          toast('نسخهٔ نمایشی روی پلن حرفه‌ای است');
          return;
        }
        openBot('plans');
      });
      bot.append(price, buy);
      tk.append(top, h('div', 'tk-cut'), bot);
      box.appendChild(tk);
    });

    // مینی‌اپ‌ها
    const apps = $('acc-apps');
    apps.textContent = '';
    $('acc-apps-e').textContent = `${S.me.apps.length} از ${S.me.plan.max_apps}`;
    S.me.apps.forEach(a => {
      const sub = a.bot_username ? '@' + a.bot_username : (a.published_at ? 'منتشر شده · بدون ربات' : 'پیش‌نویس');
      const r = grow('navy', 'sparkle', a.name, sub, null, async () => { try { await openApp(a.id); } catch (err) { failed(err); } });
      const ic = r.querySelector('.ic');
      ic.textContent = (a.name || '?').trim().charAt(0);
      apps.appendChild(r);
    });
    apps.appendChild(grow('brand', 'plus', 'مینی‌اپ تازه', 'اسم، قالب، و تمام', null, () => {
      if (S.me.apps.length >= S.me.plan.max_apps) { upsellSheet(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد.`); return; }
      onboard();
    }));

    const botG = $('acc-bot');
    botG.textContent = '';
    const botName = S.me.bot || 'EasySazBot';
    botG.appendChild(grow('act', 'bot', '@' + botName, 'اتصال ربات، پرداخت و پشتیبانی', null, () => openBot('')));
    botG.appendChild(grow('media', 'star', 'پلن‌ها و پرداخت', 'با ستارهٔ تلگرام، بدون درگاه', null, () => openBot('plans')));
  }

  /* ===================== حالت ساده (سؤال‌محور) =====================
     برای کاربر مبتدی: صفحهٔ اول ادیتور چک‌لیست «کارهای مانده» است. هر کار یک
     سؤال ساده با یک فیلد بزرگ است (easyAsk). «دیدن مینی‌اپ» خود مینی‌اپ را
     نشان می‌دهد و زدن روی هر قسمت یک کارت کوچک با سه کار باز می‌کند: متن،
     شکل، بیشتر (easyCard). افزودن با زبان کاربر است (easyAdd). نوار پایین فقط
     سه دکمه دارد. ادیتور کامل همان «حالت حرفه‌ای» است. */
  const EASY_NAMES = {
    hero: 'معرفی بالای صفحه', text: 'متن', notice: 'خبر یا تخفیف', faq: 'سؤال‌های مشتری', steps: 'راهنما',
    stats: 'عددهای مهم', button: 'دکمه', links: 'دکمه‌های لینک', social: 'راه‌های تماس', apps: 'دانلود برنامه',
    image: 'عکس', gallery: 'گالری عکس', cards: 'محصولات', pricing: 'قیمت‌ها', features: 'ویژگی‌ها',
    passcard: 'کارت اشتراک', calc: 'محاسبهٔ قیمت', divider: 'فاصله',
    story: 'داستان', shab_continue: 'ادامهٔ خواندن', shab_shelf: 'قفسهٔ داستان‌ها', shab_latest: 'فصل‌های تازه',
    shab_marks: 'نشان‌های خواننده', shab_quote: 'جمله از داستان',
  };
  const easyName = b => b === 'header' ? 'نوار بالا' : (EASY_NAMES[b.type] || specOf(b).title);
  const SOCIAL_NAMES = { telegram: 'تلگرام', instagram: 'اینستاگرام', whatsapp: 'واتساپ', youtube: 'یوتیوب', x: 'ایکس', website: 'سایت', phone: 'تلفن', email: 'ایمیل' };
  const allBlocks = () => S.doc.pages.reduce((a, p) => a.concat(p.blocks.map(b => ({ page: p, block: b }))), []);
  const skipKey = () => 'es-skip-' + (S.app ? S.app.id : '');
  function skipped() { try { return JSON.parse(localStorage.getItem(skipKey())) || []; } catch (e) { return []; } }
  function setSkipped(key, on) {
    const s = skipped().filter(k => k !== key);
    if (on) s.push(key);
    try { localStorage.setItem(skipKey(), JSON.stringify(s)); } catch (e) {}
  }

  /* مقصد یک دکمه یا لینک: از جواب ساده (آیدی یا شماره) لینک کامل ساخته می‌شود */
  const DESTS = [
    { key: 'telegram', title: 'تلگرام', icon: 'telegram', cat: 'act', label: 'آیدی تلگرامت', ph: 'naranj_cafe', pre: '@',
      url: v => 'https://t.me/' + v.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, ''), read: u => (u.match(/t\.me\/(.+)$/) || [])[1] },
    { key: 'instagram', title: 'اینستاگرام', icon: 'instagram', cat: 'shop', label: 'آیدی اینستاگرامت', ph: 'naranj.cafe', pre: '@',
      url: v => 'https://instagram.com/' + v.replace(/^@/, ''), read: u => (u.match(/instagram\.com\/(.+)$/) || [])[1] },
    { key: 'whatsapp', title: 'واتساپ', icon: 'whatsapp', cat: 'write', label: 'شمارهٔ واتساپت', ph: '0912 345 6789', tel: true,
      url: v => { let d = faDigits(v).replace(/\D/g, ''); if (d.startsWith('0')) d = '98' + d.slice(1); return d ? 'https://wa.me/' + d : ''; },
      read: u => { const m = u.match(/wa\.me\/(\d+)/); return m ? '0' + m[1].replace(/^98/, '') : ''; } },
    { key: 'site', title: 'سایت خودم', icon: 'website', cat: 'media', label: 'آدرس سایتت', ph: 'example.com',
      url: v => v ? (/^https?:\/\//i.test(v) ? v : 'https://' + v) : '', read: u => u.replace(/^https?:\/\//, '') },
  ];
  const faDigits = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  function destOf(url) {
    url = url || '';
    if (emptyUrl(url)) return { dest: DESTS[0], value: '' };
    const d = /t\.me\//.test(url) ? DESTS[0] : /instagram\.com/.test(url) ? DESTS[1] : /wa\.me\//.test(url) ? DESTS[2] : DESTS[3];
    return { dest: d, value: d.read(url) || '' };
  }

  /* ---------- کارها: از خود مینی‌اپ ساخته می‌شوند ---------- */
  function easyTasks() {
    const T = [];
    const skips = skipped();
    const hd = S.doc.header;
    const blocks = allBlocks();
    const add = t => { t.skipped = !t.done && skips.indexOf(t.key) >= 0; T.push(t); };

    const shab = S.doc.kit === 'shab';
    add({ key: 'logo', kind: 'image', cat: 'media', icon: 'image', title: 'لوگو را بگذار', q: shab ? 'عکس یا لوگوی کانالت را بگذار' : 'لوگوی کسب‌وکارت را بگذار',
      sub: shab ? 'کنار اسم کانال، بالای مینی‌اپ دیده می‌شود' : 'بالای مینی‌اپ و روی ربات دیده می‌شود', done: !!hd.logo, doneSub: 'گذاشته شد',
      value: () => hd.logo || '',
      apply: v => {
        hd.logo = v;
        if (v) hd.enabled = true;
        blocks.forEach(({ block }) => { if (block.type === 'hero' && !block.props.image) block.props.image = v; });
      },
      preview: box => mini(box, [], { header: Object.assign({}, hd, { enabled: true }) }) });

    blocks.filter(({ block }) => block.type === 'text' && /بنویس/.test(block.props.body || '')).slice(0, 1).forEach(({ block }) => {
      add({ key: 'text:' + block.id, kind: 'textarea', cat: 'write', icon: 'text', title: `«${block.props.title || 'متن'}» را بنویس`,
        q: `«${block.props.title || 'متن'}» را بنویس`, sub: 'چند خط کوتاه کافی است؛ همان‌طور که با مشتری حرف می‌زنی.',
        done: false, ph: block.props.body, value: () => '', apply: v => { block.props.body = v; },
        preview: box => mini(box, [block]) });
    });

    if (shab) shabTasks(add, blocks);

    const social = !shab && blocks.find(({ block }) => block.type === 'social');
    const phoneItem = social && (social.block.props.items || []).find(it => it.kind === 'phone');
    if (!shab) add({ key: 'phone', kind: 'phone', cat: 'act', icon: 'phone', title: 'شمارهٔ تماست چیه؟', q: 'شمارهٔ تماست چیه؟',
      sub: 'مشتری‌ها با یک لمس زنگ می‌زنند.', done: !!(phoneItem && phoneItem.value), doneSub: phoneItem ? phoneItem.value : '',
      value: () => { const s = allBlocks().find(({ block }) => block.type === 'social'); const it = s && s.block.props.items.find(x => x.kind === 'phone'); return it ? it.value : ''; },
      apply: v => {
        let s = allBlocks().find(({ block }) => block.type === 'social');
        if (!s) {
          if (!v) return;
          const b = defaultBlock('social', { items: [] });
          S.doc.pages[0].blocks.push(b);
          s = { page: S.doc.pages[0], block: b };
        }
        const items = s.block.props.items;
        let it = items.find(x => x.kind === 'phone');
        if (!it) { it = { kind: 'phone', value: '' }; items.push(it); }
        it.value = v;
      },
      preview: box => {
        const s = allBlocks().find(({ block }) => block.type === 'social');
        mini(box, [s ? s.block : defaultBlock('social', { items: [{ kind: 'telegram', value: '' }, { kind: 'phone', value: '' }] })]);
      } });

    const ids = social ? (social.block.props.items || []).filter(it => it.kind !== 'phone') : [];
    if (ids.length) {
      const names = ids.map(it => SOCIAL_NAMES[it.kind] || it.kind);
      add({ key: 'socials:' + social.block.id, kind: 'socials', items: ids, cat: 'act', icon: ids[0].kind,
        title: `آیدی ${names.join(' و ')}ت`, q: `آیدی ${names.join(' و ')}ت چیه؟`,
        sub: 'فقط آیدی را بنویس؛ لینک کامل را خودمان می‌سازیم. هر کدام را نداری خالی بگذار.',
        done: ids.every(it => it.value), doneSub: ids.filter(it => it.value).map(it => it.value).join(' · '),
        preview: box => mini(box, [social.block]) });
    }

    blocks.filter(({ block }) => block.type === 'button').slice(0, 1).forEach(({ block }) => {
      add({ key: 'btn:' + block.id, kind: 'dest', cat: 'shop', icon: 'button', title: `دکمهٔ «${block.props.label || 'دکمه'}» کجا برود؟`,
        q: `با زدن «${block.props.label || 'دکمه'}» ${shab ? 'خواننده' : 'مشتری'} کجا برود؟`,
        sub: shab ? 'آیدی کانالت را بنویس؛ فصل‌های قفل هم به همین کانال می‌روند.' : 'مثلاً جایی که سفارش‌ها را می‌گیری.',
        done: !emptyUrl(block.props.url), doneSub: destOf(block.props.url).dest.title + ' · ' + destOf(block.props.url).value,
        value: () => block.props.url,
        apply: v => {
          const old = block.props.url;
          block.props.url = v;
          // کانال داستان: لینک فصل‌های قفل هم همین باشد، مگر خودش چیز دیگری گذاشته
          if (shab) allBlocks().forEach(({ block: b }) => { if (b.type === 'story' && (emptyUrl(b.props.url) || b.props.url === old)) b.props.url = v; });
        },
        preview: box => mini(box, [block]) });
    });

    blocks.filter(({ block }) => block.type === 'image' && !block.props.src).slice(0, 1).forEach(({ block }) => {
      add({ key: 'img:' + block.id, kind: 'image', cat: 'media', icon: 'image', title: `عکس «${block.props.caption || 'تصویر'}» را بگذار`,
        q: 'یک عکس بگذار', sub: block.props.caption || 'عکس خوب، مشتری را زودتر راضی می‌کند.', done: false,
        value: () => block.props.src || '', apply: v => { block.props.src = v; }, preview: box => mini(box, [block]) });
    });

    add({ key: 'bot', kind: 'bot', cat: 'brand', icon: 'bot', title: 'رباتت را وصل کن', q: 'رباتت را وصل کن',
      sub: 'تا مینی‌اپ با دکمهٔ منوی ربات خودت باز شود. توکن ربات را در @EasySazBot می‌فرستی.',
      done: !!S.app.bot_username, doneSub: S.app.bot_username ? '@' + S.app.bot_username : '' });
    return T;
  }

  /* شب‌نوشت: داستان‌های نمونهٔ قالب را با داستان خود کاربر عوض می‌کنیم.
     نمونه بودن از روی متن خود قالب شناخته می‌شود (نه چیزی در سند). */
  function shabSamples() {
    const titles = new Set(), bodies = new Set(), blurbs = new Set();
    S.templates.templates.filter(t => t.kit === 'shab').forEach(t => t.doc.pages.forEach(p => p.blocks.forEach(b => {
      if (b.type !== 'story') return;
      titles.add(b.props.title);
      blurbs.add(b.props.blurb);
      (b.props.chapters || []).forEach(c => bodies.add(c.body));
    })));
    titles.add('داستان تازه');
    bodies.add('اولین جملهٔ داستانت را این‌جا بنویس.');
    return { titles, bodies, blurbs };
  }
  function shabTasks(add, blocks) {
    const smp = shabSamples();
    const stories = blocks.filter(({ block }) => block.type === 'story');
    const nth = ['اول', 'دوم', 'سوم'];
    stories.slice(0, 3).forEach(({ block }, k) => {
      const pr = block.props;
      const sampleTitle = smp.titles.has(pr.title);
      const chs = () => block.props.chapters || [];
      const sampleBody = () => !chs().length || chs().some(c => smp.bodies.has(c.body));
      if (!sampleTitle && !sampleBody()) return;
      const which = stories.length > 1 ? ` ${nth[k] || ''}` : '';
      const extra = k > 0 ? { label: `داستان${which} ندارم؛ برش دار`, run: () => {
        const f = findBlock(block.id);
        if (f) f.page.blocks.splice(f.index, 1);
        undoToast('داستان نمونه برداشته شد');
      } } : null;
      add({ key: 'stname:' + block.id, kind: 'text', cat: 'story', icon: 'book', title: `اسم داستان${which}ت`,
        q: `اسم داستان${which}ت چیه؟`, sub: 'همان اسمی که در کانال می‌گذاری؛ روی جلد و قفسه می‌نشیند.',
        done: !sampleTitle, doneSub: pr.title, ph: 'مثلاً: خانهٔ شمارهٔ ۱۳',
        value: () => (smp.titles.has(block.props.title) ? '' : block.props.title),
        apply: v => {
          block.props.title = v || 'داستان تازه';
          if (smp.blurbs.has(block.props.blurb)) block.props.blurb = ''; // خلاصهٔ نمونه مال داستان دیگری است
        }, extra,
        preview: box => mini(box, [block]) });
      add({ key: 'stch:' + block.id, kind: 'textarea', cat: 'story', icon: 'text', title: `فصل اول داستان${which}`,
        q: `فصل اول «${smp.titles.has(block.props.title) ? 'داستانت' : block.props.title}» را بگذار`,
        sub: 'متن را از کانالت کپی کن و این‌جا بچسبان؛ پاراگراف‌ها را با یک خط خالی جدا کن. فصل‌های بعد را از «دیدن مینی‌اپ» اضافه می‌کنی.',
        done: !sampleBody(), doneSub: `${chs().length} فصل`, ph: 'اولین جملهٔ داستانت…', extra,
        value: () => (sampleBody() ? '' : (chs()[0] || {}).body || ''),
        apply: v => {
          if (sampleBody()) block.props.chapters = [{ title: 'فصل اول', body: '', note: '', lock: false, url: '' }];
          block.props.chapters[0].body = v;
        },
        preview: box => mini(box, [block]) });
    });
  }

  let easyQueued = false;
  function renderEasyQ() {
    if (easyQueued) return;
    easyQueued = true;
    requestAnimationFrame(() => { easyQueued = false; renderEasy(); });
  }
  /* ---------- صفحهٔ اول: چک‌لیست ---------- */
  function renderEasy() {
    if (!S.doc || S.screen !== 'easy') return;
    $('easy-name').textContent = S.app.name;
    renderBar();
    const body = $('easy-body');
    body.textContent = '';
    const tasks = easyTasks();
    const todo = tasks.filter(t => !t.done && !t.skipped);
    const finished = tasks.filter(t => t.done || t.skipped);
    const total = tasks.length + 2;
    const pct = Math.round((finished.length + 2) / total * 100);

    const card = h('div', 'g-ready');
    const m = h('div', 'g-ready-m');
    m.append(h('span', 'g-ready-k', S.app.name),
      h('span', 'g-ready-t', todo.length ? `مینی‌اپت ${pct}٪ آماده است` : 'همه‌چیز آماده است!'));
    const rail = h('div', 'g-rail');
    const fill = h('i');
    fill.style.width = pct + '%';
    rail.appendChild(fill);
    m.append(rail, h('span', 'g-ready-k', todo.length ? `${todo.length} کار کوچک مانده · هر کدام یک سؤال` : (S.app.published_at && !S.app.dirty ? 'منتشر شده؛ هر وقت خواستی عوضش کن' : 'فقط مانده که منتشرش کنی')));
    const thumbBtn = h('button', 'g-thumb');
    thumbBtn.type = 'button';
    thumbBtn.setAttribute('aria-label', 'دیدن مینی‌اپ');
    const th = h('div', 'g-thumb-in');
    ES.render(th, S.doc, { page: S.doc.pages[0].id, appName: S.app.name });
    thumbBtn.appendChild(th);
    thumbBtn.addEventListener('click', () => { haptic(); tapView(); });
    card.append(m, thumbBtn);
    body.appendChild(card);

    const row = (t, isDone) => {
      const r = h('button', 'todo' + (isDone ? ' todo-ok' : '') + (t.skipped ? ' todo-skip' : ''));
      r.type = 'button';
      const c = h('span', 'todo-c');
      if (isDone) c.appendChild(ico(t.skipped ? 'minus' : 'check'));
      const txt = h('span', 'row-m');
      txt.append(h('b', 'row-t', isDone && t.doneTitle ? t.doneTitle : t.title),
        h('span', 'row-s' + (t.ltr || t.kind === 'phone' ? ' ltr' : ''), isDone ? (t.skipped ? 'فعلاً رد شد · بزن تا جواب بدی' : (t.doneSub || 'انجام شد')) : t.sub));
      r.append(c);
      if (!isDone) r.appendChild(catTile(t.cat, t.icon));
      r.append(txt, ico('arrow', 'chev'));
      r.addEventListener('click', () => { haptic(); if (t.onTap) t.onTap(); else easyAsk(isDone ? [t.key] : todo.map(x => x.key), t.key); });
      return r;
    };
    if (todo.length) {
      const sec = h('div', 'g-sec');
      sec.append(h('b', '', 'کارهای مانده'), h('span', '', 'بزن تا جواب بدی'));
      body.appendChild(sec);
      const g = h('div', 'grp mx');
      todo.forEach(t => g.appendChild(row(t)));
      body.appendChild(g);
      const go = h('button', 'btn btn-d btn-block g-start');
      go.type = 'button';
      go.append(ico('bolt'), document.createTextNode(`شروع جواب‌دادن (${todo.length} سؤال)`));
      go.addEventListener('click', () => { haptic(); easyAsk(todo.map(x => x.key)); });
      body.appendChild(go);
    }
    const sec2 = h('div', 'g-sec');
    sec2.append(h('b', '', todo.length ? 'انجام شد' : 'همه انجام شد'), h('span', '', 'هر وقت خواستی عوضشان کن'));
    body.appendChild(sec2);
    const g2 = h('div', 'grp mx');
    g2.appendChild(row({ key: 'name', doneTitle: 'اسم مینی‌اپ', doneSub: S.app.name, onTap: renameSheet }, true));
    const sw = (S.schema.swatches.find(([, c]) => c.toLowerCase() === (S.doc.theme.accent || '').toLowerCase()) || ['رنگ دلخواه'])[0];
    g2.appendChild(row({ key: 'color', doneTitle: 'رنگ و حال‌وهوا', doneSub: sw, onTap: themePage }, true));
    finished.forEach(t => g2.appendChild(row(Object.assign({ doneTitle: t.title.replace(/ چیه؟$| را بگذار$| را وصل کن$/, '') }, t), true)));
    body.appendChild(g2);

    const see = h('button', 'btn btn-s btn-block g-see');
    see.type = 'button';
    see.append(ico('eye'), document.createTextNode('دیدن مینی‌اپ و عوض کردن هر چیز'));
    see.addEventListener('click', () => { haptic(); tapView(); });
    body.appendChild(see);
    if (!todo.length) {
      const pub = h('button', 'btn btn-p btn-block g-pub');
      pub.type = 'button';
      pub.append(ico('send'), document.createTextNode('انتشار و گرفتن لینک مینی‌اپ'));
      pub.addEventListener('click', () => { haptic(); publishSheet(); });
      body.appendChild(pub);
    }
  }

  /* ---------- یک سؤال در هر صفحه ---------- */
  function easyAsk(queue, startKey) {
    let i = Math.max(0, startKey ? queue.indexOf(startKey) : 0);
    push((el, pg) => {
      el.classList.add('sub-ask');
      const top = h('header', 'q-top');
      const close = iconBtn('x', 'بستن', pop, 'icon-btn sm');
      const dots = h('div', 'q-dots');
      const skip = h('button', 'q-skip', 'رد شو');
      skip.type = 'button';
      top.append(close, dots, skip);
      const body = h('div', 'q-body');
      const foot = h('div', 'q-foot');
      const next = h('button', 'q-next');
      next.type = 'button';
      foot.appendChild(next);
      el.append(top, body, foot);
      let redrawPv = null;
      const task = () => easyTasks().find(t => t.key === queue[i]);
      const move = () => {
        if (i >= queue.length - 1) {
          pop();
          const left = easyTasks().filter(t => !t.done && !t.skipped).length;
          notify('success');
          toast(left ? `عالی! ${left} کار دیگر مانده` : 'همه‌چیز آماده است!');
          return;
        }
        i++;
        draw();
      };
      skip.addEventListener('click', () => { haptic(); const t = task(); if (t && !t.done) setSkipped(t.key, true); move(); });
      next.addEventListener('click', () => { haptic(); const t = task(); if (t) setSkipped(t.key, false); move(); });
      function draw() {
        const t = task();
        if (!t) { move(); return; }
        dots.textContent = '';
        queue.forEach((k, j) => dots.appendChild(h('i', j < i ? 'ok' : j === i ? 'on' : '')));
        skip.hidden = queue.length === 1 && t.done;
        body.textContent = '';
        body.append(h('span', 'q-k', queue.length > 1 ? `سؤال ${i + 1} از ${queue.length}` + (i === queue.length - 1 ? ' · آخری' : '') : 'ویرایش'),
          h('div', 'q-t', t.q || t.title), h('div', 'q-s', t.sub || ''));
        redrawPv = null;
        if (t.preview) {
          const pv = h('div', 'q-pv');
          const tag = h('div', 'q-pv-t');
          tag.append(h('i', 'dot'), document.createTextNode('در مینی‌اپ این‌جا می‌آید'));
          const box = h('div', 'q-pv-box');
          pv.append(tag, box);
          body.appendChild(pv);
          redrawPv = () => t.preview(box);
          redrawPv();
        }
        body.appendChild(askInput(t));
        if (t.extra) {
          const x = h('button', 'q-extra', t.extra.label);
          x.type = 'button';
          x.addEventListener('click', () => { haptic(); t.extra.run(); changed(); move(); });
          body.appendChild(x);
        }
        const last = i >= queue.length - 1;
        const nt = !last && easyTasks().find(x => x.key === queue[i + 1]);
        next.textContent = '';
        if (last) next.append(ico('check'), document.createTextNode(queue.length > 1 ? 'تمام شد' : 'ذخیره'));
        else next.append(document.createTextNode('بعدی' + (nt ? ': ' + nt.title : '')), ico('arrow'));
        el.scrollTop = 0;
      }
      pg.refresh = () => { if (redrawPv) redrawPv(); };
      pg.safeUndo = true;
      draw();
    });
  }
  /* ورودی هر نوع سؤال؛ هر تغییر همان لحظه در مینی‌اپ ذخیره می‌شود */
  function askInput(t) {
    const wrap = h('div', 'q-in-wrap');
    const set = v => { t.apply(v); changed(); };
    const bigInput = (opts) => {
      const box = h('label', 'q-in' + (opts.ltr ? ' ltr' : ''));
      if (opts.icon) box.appendChild(ico(opts.icon));
      if (opts.pre) box.appendChild(h('span', 'q-pre', opts.pre));
      const inp = h('input');
      inp.value = opts.value || '';
      inp.placeholder = opts.ph || '';
      if (opts.tel) { inp.inputMode = 'tel'; inp.autocomplete = 'tel'; }
      inp.addEventListener('input', () => opts.onInput(inp.value.trim()));
      box.appendChild(inp);
      if (!opts.nofocus) setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 320);
      return box;
    };
    if (t.kind === 'text' || t.kind === 'phone') {
      wrap.appendChild(bigInput({ value: t.value(), ph: t.kind === 'phone' ? '0912 345 6789' : t.ph, ltr: t.ltr || t.kind === 'phone',
        tel: t.kind === 'phone', icon: t.kind === 'phone' ? 'phone' : null, pre: t.pre, onInput: v => set(t.kind === 'phone' ? faDigits(v) : v) }));
    } else if (t.kind === 'socials') {
      t.items.forEach((it, k) => {
        const f = h('div', 'q-dest');
        f.appendChild(h('span', 'lbl', SOCIAL_NAMES[it.kind] || it.kind));
        f.appendChild(bigInput({ value: it.value, ph: it.kind === 'website' ? 'example.com' : 'naranj_cafe', ltr: true,
          pre: it.kind === 'website' || it.kind === 'email' ? '' : '@', nofocus: k > 0, onInput: v => { it.value = v.replace(/^@/, ''); changed(); } }));
        wrap.appendChild(f);
      });
    } else if (t.kind === 'textarea') {
      const ta = h('textarea', 'q-ta' + (t.cat === 'story' ? ' q-ta--long' : ''));
      ta.rows = t.cat === 'story' ? 9 : 5;
      ta.value = t.value();
      ta.placeholder = t.ph || '';
      ta.addEventListener('input', () => set(ta.value));
      wrap.appendChild(ta);
      setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) {} }, 320);
    } else if (t.kind === 'image') {
      const pick = h('button', 'q-img');
      pick.type = 'button';
      const draw = () => {
        pick.textContent = '';
        const src = ES.safeUrl(t.value(), true);
        if (src) { const im = h('img'); im.alt = ''; im.src = src; pick.appendChild(im); pick.appendChild(h('span', 'q-img-t', 'عوض کردن عکس')); }
        else pick.append(ico('upload'), h('b', '', 'انتخاب عکس از گوشی'), h('span', '', 'PNG، JPG یا WEBP'));
      };
      pick.addEventListener('click', async () => {
        pick.classList.add('busy');
        try {
          const url = await uploadImage();
          if (url) { set(url); notify('success'); draw(); }
        } catch (err) { failed(err); } finally { pick.classList.remove('busy'); }
      });
      draw();
      wrap.appendChild(pick);
    } else if (t.kind === 'dest') {
      let { dest, value } = destOf(t.value());
      const grid = h('div', 'choice');
      const field = h('div', 'q-dest');
      const drawField = () => {
        field.textContent = '';
        field.appendChild(h('span', 'lbl', dest.label));
        field.appendChild(bigInput({ value, ph: dest.ph, ltr: true, tel: dest.tel, pre: dest.pre,
          onInput: v => { value = v; set(v ? dest.url(v) : ''); } }));
      };
      DESTS.forEach(d => {
        const c = h('button', 'ch' + (d === dest ? ' on' : ''));
        c.type = 'button';
        c.append(catTile(d.cat, d.icon), document.createTextNode(d.title));
        c.addEventListener('click', () => {
          dest = d;
          grid.querySelectorAll('.ch').forEach(x => x.classList.toggle('on', x === c));
          select();
          drawField();
          if (value) set(dest.url(value));
        });
        grid.appendChild(c);
      });
      drawField();
      wrap.append(grid, field);
    } else if (t.kind === 'bot') {
      const b = h('button', 'btn btn-s btn-block q-bot');
      b.type = 'button';
      b.append(ico('bot'), document.createTextNode(t.done ? `وصل است: ${t.doneSub}` : 'اتصال در ربات ایزی‌ساز'));
      b.addEventListener('click', () => openBot('connect'));
      wrap.appendChild(b);
      wrap.appendChild(h('p', 'q-note', 'بعد از اتصال، این مورد خودش تیک می‌خورد. اگر الان وقت نداری «رد شو» را بزن.'));
    }
    return wrap;
  }

  /* ---------- «ببین و بزن»: خود مینی‌اپ؛ زدن روی هر قسمت = کارت کوچک ---------- */
  function tapView(focusId) {
    push((el, pg) => {
      el.classList.add('sub-tap');
      const hint = h('div', 'tap-hint');
      const x = iconBtn('x', 'بستن', pop, 'tap-x');
      const left = h('button', 'tap-left');
      left.type = 'button';
      left.addEventListener('click', () => { haptic(); pop(); });
      hint.append(x, ico('hand'), h('span', 'grow', 'روی هر چیزی بزن تا عوضش کنی'), left);
      const view = h('div', 'tapw');
      el.append(hint, view, easyBar());
      const draw = () => {
        const n = easyTasks().filter(t => !t.done && !t.skipped).length;
        left.textContent = '';
        left.append(ico(n ? 'layers' : 'check'), document.createTextNode(n ? `${n} کار مانده` : 'چک‌لیست'));
        ES.render(view, S.doc, {
          page: page().id, appName: S.app.name, editing: true, selected: S.tapSel || null,
          onPick: id => { haptic(); easyCard(id); },
          onPickHeader: () => { haptic(); easyCard('header'); },
          onNavigate: id => { S.pageId = id; S.tapSel = null; draw(); view.scrollTop = 0; },
        });
        view.classList.toggle('focusing', !!S.tapSel);
      };
      pg.refresh = draw;
      pg.view = view;
      pg.safeUndo = true;
      pg.onPop = () => { S.tapSel = null; };
      draw();
      if (focusId) setTimeout(() => easyCard(focusId), 250);
    });
  }
  function tapTop() { const t = S.stack[S.stack.length - 1]; return t && t.view ? t : null; }
  /* کارت پایین را طوری باز کن که قسمت انتخاب‌شده بالای آن دیده شود */
  function scrollTapTo(id) {
    const t = tapTop();
    if (!t) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = id === 'header' ? t.view.querySelector('.pg-header') : t.view.querySelector(`.pg-block[data-id="${CSS.escape(id)}"]`);
      if (!el) return;
      const hd = id === 'header' ? null : t.view.querySelector('.pg-header');
      const top = el.getBoundingClientRect().top - t.view.getBoundingClientRect().top + t.view.scrollTop;
      t.view.scrollTo({ top: Math.max(0, top - (hd ? hd.offsetHeight : 0) - 20), behavior: 'smooth' });
    }));
  }
  function easyBar() {
    const bar = h('nav', 'bar3');
    bar.setAttribute('aria-label', 'ابزارها');
    const mk = (cls, icon, label, fn) => {
      const b = h('button', cls);
      b.type = 'button';
      b.append(ico(icon), h('span', '', label));
      b.addEventListener('click', () => { haptic(); fn(); });
      bar.appendChild(b);
    };
    mk('add', 'plus', 'افزودن', easyAdd);
    mk('', 'palette', 'رنگ', themePage);
    mk('pub', 'send', 'انتشار', publishSheet);
    return bar;
  }

  /* پیام «برگرد» چند ثانیه بعد از هر کار روی کارت */
  function undoToast(text) {
    let u = $('undo');
    if (!u) {
      u = h('div', 'undo');
      u.id = 'undo';
      u.setAttribute('role', 'status');
      document.body.appendChild(u);
    }
    u.textContent = '';
    const b = h('button', '');
    b.type = 'button';
    b.append(ico('undo'), document.createTextNode('برگرد'));
    b.addEventListener('click', () => { u.classList.remove('on'); undo(); });
    u.append(h('span', '', text), b);
    u.classList.add('on');
    clearTimeout(undoToast.t);
    undoToast.t = setTimeout(() => u.classList.remove('on'), 4200);
  }

  let cardTab = 'text';
  function easyCard(id) {
    const isHeader = id === 'header';
    const f = isHeader ? null : findBlock(id);
    if (!isHeader && !f) return;
    const block = f && f.block;
    const spec = isHeader ? { cat: 'frame', icon: 'header', desc: 'اسم و لوگو، بالای همهٔ صفحه‌ها' } : specOf(block);
    S.tapSel = id;
    const t = tapTop();
    if (t) t.refresh();
    scrollTapTo(id);
    document.body.classList.add('carding');
    openSheet(sheet => {
      sheet.classList.add('card3');
      const head = h('div', 'sh-head');
      const tt = h('div', 'sh-title');
      tt.append(h('div', 'title-2', easyName(isHeader ? 'header' : block)), h('div', 'caption', spec.desc || ''));
      const ok = h('button', 'sh-x ok');
      ok.type = 'button';
      ok.setAttribute('aria-label', 'تمام');
      ok.appendChild(ico('check'));
      ok.addEventListener('click', closeSheet);
      head.append(catTile(spec.cat, spec.icon), tt, ok);
      const tabs = h('div', 'tabs3');
      const body = h('div', 'card3-b');
      const TABS3 = [['text', 'text', 'متن'], ['look', 'palette', 'شکل'], ['more', 'more', 'بیشتر']];
      const draw = () => {
        tabs.textContent = '';
        TABS3.forEach(([k, icon, label]) => {
          const b = h('button', k === cardTab ? 'on' : '');
          b.type = 'button';
          b.append(ico(icon), document.createTextNode(label));
          b.addEventListener('click', () => { cardTab = k; select(); draw(); });
          tabs.appendChild(b);
        });
        body.textContent = '';
        if (cardTab === 'text') cardText(body, id, block);
        else if (cardTab === 'look') cardLook(body, id, block);
        else cardMore(body, id, block);
      };
      sheet.append(head, tabs, body);
      draw();
    }, () => {
      $('sheet').classList.remove('card3');
      document.body.classList.remove('carding');
      S.tapSel = null;
      const tp = tapTop();
      if (tp) tp.refresh();
    });
  }
  /* متن: فقط فیلدهای اصلی؛ فهرست‌ها با یک خط برای هر آیتم */
  function cardText(body, id, block) {
    if (id === 'header') {
      S.schema.header.filter(f => ['title', 'subtitle', 'logo'].indexOf(f.key) >= 0).forEach(f => {
        body.appendChild(control(f, S.doc.header[f.key], v => { S.doc.header[f.key] = v; if (v) S.doc.header.enabled = true; changed(); }));
      });
      return;
    }
    const spec = specOf(block);
    const ok = f => !f.when || Object.keys(f.when).every(k => f.when[k].indexOf(block.props[k]) >= 0);
    const fields = spec.fields.filter(f => !f.look && ok(f) && ['text', 'textarea', 'url', 'image', 'list'].indexOf(f.type) >= 0);
    if (!fields.length) { body.appendChild(h('p', 'q-note', 'این قسمت متنی ندارد؛ از «شکل» ظاهرش را عوض کن.')); return; }
    fields.forEach(f => {
      if (f.type === 'list') { body.appendChild(simpleList(block, f)); return; }
      if (f.type === 'url') {
        body.appendChild(destField(f.label, () => block.props[f.key], v => { block.props[f.key] = v; changed(); }));
        return;
      }
      body.appendChild(control(f, block.props[f.key], v => { block.props[f.key] = v; changed(); }));
    });
  }
  /* «کجا برود؟» جمع‌وجور: انتخاب مقصد + آیدی */
  function destField(label, get, setUrl) {
    let { dest, value } = destOf(get());
    const wrap = h('div', 'field dest-f');
    wrap.appendChild(h('span', 'label', label === 'لینک' ? 'با زدن، کجا برود؟' : label));
    const pills = h('div', 'seg dest-seg');
    const inp = h('input');
    inp.className = 'ltr';
    const drawInp = () => { inp.placeholder = dest.ph; inp.inputMode = dest.tel ? 'tel' : 'text'; };
    DESTS.forEach(d => {
      const b = h('button', d === dest ? 'on' : '', d.title.replace(' خودم', ''));
      b.type = 'button';
      b.addEventListener('click', () => {
        dest = d;
        pills.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        drawInp();
        if (value) setUrl(dest.url(value));
        select();
      });
      pills.appendChild(b);
    });
    inp.value = value;
    drawInp();
    inp.addEventListener('input', () => { value = inp.value.trim(); setUrl(value ? dest.url(value) : ''); });
    wrap.append(pills, inp);
    return wrap;
  }
  function simpleList(block, fd) {
    const wrap = h('div', 'field slist');
    wrap.appendChild(h('span', 'label', fd.label));
    const box = h('div', 'slist-b');
    wrap.appendChild(box);
    const main = fd.fields.find(x => x.type === 'text' || x.type === 'textarea' || x.type === 'select');
    const url = fd.fields.find(x => x.type === 'url');
    const long = fd.fields.find(x => x.type === 'textarea' && (x.max || 0) >= 1000);
    const second = long || (!url && fd.fields.filter(x => (x.type === 'text' || x.type === 'textarea') && x !== main)[0]);
    const add = h('button', 'add-item', '+ افزودن ' + (fd.item_label || 'مورد'));
    add.type = 'button';
    const draw = () => {
      box.textContent = '';
      const items = block.props[fd.key] || [];
      items.forEach((it, i) => {
        const card = h('div', 'slist-i');
        const top = h('div', 'slist-h');
        top.appendChild(h('span', 'item-n', String(i + 1)));
        const del = h('button', 'slist-x');
        del.type = 'button';
        del.setAttribute('aria-label', 'حذف');
        del.appendChild(ico('trash'));
        del.addEventListener('click', () => { items.splice(i, 1); changed(); draw(); undoToast('حذف شد'); });
        top.appendChild(h('span', 'grow'));
        top.appendChild(del);
        card.appendChild(top);
        const one = f => {
          if (!f) return;
          if (f.type === 'select') card.appendChild(selectControl(f, it[f.key], v => { it[f.key] = v; changed(); }));
          else if (f.type === 'url') card.appendChild(destField(f.label, () => it[f.key], v => { it[f.key] = v; changed(); }));
          else card.appendChild(control(f, it[f.key], v => { it[f.key] = v; changed(); }));
        };
        one(main);
        if (main && main.type === 'select') one(fd.fields.find(x => x.type === 'text'));
        one(long || url || second);
        box.appendChild(card);
      });
      add.hidden = items.length >= (fd.max_items || 10);
    };
    add.addEventListener('click', () => { block.props[fd.key] = block.props[fd.key] || []; block.props[fd.key].push(blankItem(fd)); changed(); draw(); haptic(); });
    draw();
    wrap.appendChild(add);
    return wrap;
  }
  function cardLook(body, id, block) {
    if (id === 'header' && docKit()) {
      body.appendChild(h('p', 'q-note', `نوار بالای «${docKit().title}» شکل مخصوص خودش را دارد؛ فقط اسم و عکسش را عوض کن.`));
    } else if (id === 'header') {
      const f = S.schema.header.find(x => x.key === 'style');
      body.appendChild(selectControl(f, S.doc.header.style, v => { S.doc.header.style = v; changed(); undoToast('شکل عوض شد'); }));
    } else {
      const variants = (S.schema.variants || {})[block.type] || [];
      if (variants.length) {
        const strip = variantStrip(block, variants, () => { changed(); undoToast('شکل عوض شد'); });
        strip.querySelector('.label').textContent = 'یکی را بزن';
        body.appendChild(strip);
      } else body.appendChild(h('p', 'q-note', 'این قسمت فقط یک شکل دارد.'));
    }
    const note = h('div', 'look-note');
    note.append(ico('palette'), h('span', '', 'رنگ همه‌چیز از دکمهٔ «رنگ» پایین صفحه می‌آید؛ این‌جا فقط شکل همین قسمت است.'));
    body.appendChild(note);
  }
  function cardMore(body, id, block) {
    const list = h('div', 'acts');
    const act = (icon, label, fn, opt) => {
      opt = opt || {};
      const b = h('button', 'act' + (opt.danger ? ' danger' : ''));
      b.type = 'button';
      b.append(ico(icon), h('span', 'grow', label));
      b.disabled = !!opt.disabled;
      b.addEventListener('click', () => { haptic(); fn(); });
      list.appendChild(b);
    };
    if (id === 'header') {
      act('eye', S.doc.header.enabled ? 'پنهان کردن نوار بالا' : 'نشان دادن نوار بالا', () => {
        S.doc.header.enabled = !S.doc.header.enabled; changed(); closeSheet(); undoToast(S.doc.header.enabled ? 'نوار بالا روشن شد' : 'نوار بالا پنهان شد');
      });
      act('settings', 'همهٔ تنظیمات (حالت حرفه‌ای)', () => { closeSheet(); framePage(); });
      body.appendChild(list);
      return;
    }
    const f = findBlock(id);
    act('up', 'یکی بالاتر', () => { moveBlock(id, -1); scrollTapTo(id); undoToast('جابه‌جا شد'); cardMore(body, id, block); body.firstChild && body.removeChild(body.firstChild); }, { disabled: f.index <= 0 });
    act('down', 'یکی پایین‌تر', () => { moveBlock(id, 1); scrollTapTo(id); undoToast('جابه‌جا شد'); cardMore(body, id, block); body.firstChild && body.removeChild(body.firstChild); }, { disabled: f.index >= f.page.blocks.length - 1 });
    act('copy', 'یکی دیگر مثل همین', () => { const c = copyBlock(id); if (c) { closeSheet(); undoToast('تکثیر شد'); } });
    act('trash', 'حذف', () => {
      const cur = findBlock(id);
      if (!cur) return;
      cur.page.blocks.splice(cur.index, 1);
      notify('warning');
      closeSheet();
      changed();
      undoToast('حذف شد');
    }, { danger: true });
    act('settings', 'همهٔ تنظیمات این قسمت (حرفه‌ای)', () => { closeSheet(); editPage(id); });
    body.appendChild(list);
  }

  /* ---------- افزودن با زبان کاربر ---------- */
  const INTENTS = [
    { key: 'contact', cat: 'act', icon: 'phone', title: 'راه تماس', sub: 'تلفن، تلگرام، اینستاگرام',
      block: () => defaultBlock('social', { items: [{ kind: 'phone', value: '' }, { kind: 'telegram', value: '' }, { kind: 'instagram', value: '' }] }) },
    { key: 'menu', cat: 'shop', icon: 'shop', title: 'منو یا محصولات', sub: 'فهرست با قیمت یا توضیح',
      block: () => defaultBlock('links', { items: [
        { label: 'دستهٔ اول', note: 'قیمت یا توضیح کوتاه', url: '' },
        { label: 'دستهٔ دوم', note: 'قیمت یا توضیح کوتاه', url: '' },
        { label: 'دستهٔ سوم', note: 'قیمت یا توضیح کوتاه', url: '' }] }) },
    { key: 'news', cat: 'write', icon: 'notice', title: 'خبر یا تخفیف', sub: 'یک خط مهم با رنگ',
      block: () => defaultBlock('notice', { text: '۲۰٪ تخفیف ویژه تا آخر هفته' }) },
    { key: 'faq', cat: 'write', icon: 'faq', title: 'سؤال‌های مشتری', sub: 'ساعت کاری، ارسال، پرداخت',
      block: () => defaultBlock('faq', { title: 'سؤال‌های پرتکرار', items: [
        { q: 'ساعت کاری‌تون چیه؟', a: 'هر روز از ۹ صبح تا ۹ شب.' },
        { q: 'ارسال دارید؟', a: 'بله، به همهٔ شهرها.' },
        { q: 'چطور پرداخت کنم؟', a: 'کارت‌به‌کارت یا درگاه آنلاین.' }] }) },
    { key: 'photo', cat: 'media', icon: 'image', title: 'عکس', sub: 'یک عکس با زیرنویس',
      block: () => defaultBlock('image', { caption: '' }) },
    { key: 'order', cat: 'brand', icon: 'button', title: 'دکمهٔ سفارش', sub: 'مشتری را به سفارش می‌برد',
      block: () => defaultBlock('button', { label: 'سفارش آنلاین', url: '' }) },
  ];
  const SHAB_INTENTS = [
    { key: 'story', cat: 'story', icon: 'book', title: 'داستان تازه', sub: 'جلد، خلاصه و فصل‌ها',
      block: () => defaultBlock('story', { title: 'داستان تازه' }) },
    { key: 'quote', cat: 'story', icon: 'quote', title: 'جمله از داستان', sub: 'یک جملهٔ درشت و ماندگار',
      block: () => defaultBlock('shab_quote') },
    { key: 'news', cat: 'write', icon: 'notice', title: 'خبر کانال', sub: 'مثلاً «فصل تازه جمعه شب»',
      block: () => defaultBlock('notice', { text: 'فصل تازه جمعه شب ساعت ۱۱' }) },
    { key: 'join', cat: 'act', icon: 'send', title: 'دکمهٔ عضویت', sub: 'خواننده را به کانال می‌برد',
      block: () => defaultBlock('button', { label: 'عضویت در کانال', url: '' }) },
    { key: 'text', cat: 'write', icon: 'text', title: 'متن', sub: 'دربارهٔ کانال یا نویسنده',
      block: () => defaultBlock('text', { title: 'دربارهٔ نویسنده', body: 'چند خط دربارهٔ خودت و داستان‌هایت.' }) },
    { key: 'photo', cat: 'media', icon: 'image', title: 'عکس', sub: 'یک عکس با زیرنویس',
      block: () => defaultBlock('image', { caption: '' }) },
  ];
  function easyAdd() {
    const shab = S.doc.kit === 'shab';
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'plus', shab ? 'می‌خوای چی به خواننده‌ها نشون بدی؟' : 'می‌خوای چی به مشتری نشون بدی؟', 'یکی را بزن؛ با محتوای نمونه اضافه می‌شود و بعد عوضش می‌کنی.');
      const grid = h('div', 'intents');
      (shab ? SHAB_INTENTS : INTENTS).forEach(it => {
        const b = h('button', 'intent');
        b.type = 'button';
        const t = h('span', 'intent-t');
        t.append(h('b', '', it.title), h('span', '', it.sub));
        b.append(catTile(it.cat, it.icon), t);
        b.addEventListener('click', () => {
          haptic();
          const block = it.block();
          if (totalBlocks() >= S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
          page().blocks.push(block);
          notify('success');
          closeSheet();
          changed();
          if (tapTop()) { tapTop().refresh(); setTimeout(() => easyCard(block.id), 200); }
          else tapView(block.id);
        });
        grid.appendChild(b);
      });
      sheet.appendChild(grid);
      const pro = h('button', 'intent-pro');
      pro.type = 'button';
      pro.append(document.createTextNode('همهٔ امکانات و بخش‌های آماده در '), h('b', '', 'حالت حرفه‌ای'));
      pro.addEventListener('click', () => { closeSheet(); addSheet(); });
      sheet.appendChild(pro);
    });
  }

  /* منوی «⋯» حالت ساده: بقیهٔ ابزارها یک‌جا */
  function easyMore() {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'settings', S.app.name, 'ابزارهای بیشتر');
      const list = h('div', 'acts');
      const act = (icon, label, fn, note) => {
        const b = h('button', 'act');
        b.type = 'button';
        b.append(ico(icon), h('span', 'grow', label));
        if (note) b.appendChild(h('small', '', note));
        b.addEventListener('click', () => { haptic(); closeSheet(); fn(); });
        list.appendChild(b);
      };
      act('eye', 'پیش‌نمایش', previewPage, 'همان که مشتری می‌بیند');
      act('layers', 'صفحه‌ها', () => pagesPage(), S.doc.pages.length + ' صفحه');
      act('template', 'قالب‌ها', () => templatesScreen(false));
      act('settings', 'تنظیمات و ربات', settingsPage);
      act('brush', 'حالت حرفه‌ای', () => setMode('pro'), 'همهٔ ابزارها');
      sheet.appendChild(list);
    });
  }
  function setMode(mode) {
    S.mode = mode;
    try { localStorage.setItem('es-editor-mode', mode); } catch (e) {}
    openEditor();
    toast(mode === 'pro' ? 'حالت حرفه‌ای: همهٔ ابزارها' : 'حالت ساده');
  }

  /* ---------- اتصال رویدادها ---------- */
  function wire() {
    document.querySelectorAll('[data-icon]').forEach(el => el.appendChild(ico(el.dataset.icon)));
    document.querySelectorAll('[data-art]').forEach(el => el.appendChild(tunnelArt()));
    document.querySelectorAll('.mark').forEach(el => el.appendChild(markSvg()));
    document.querySelectorAll('#nav .nav-i').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.tab === S.tab && !$(b.dataset.tab).hidden) return;
      haptic();
      tab(b.dataset.tab);
    }));
    window.addEventListener('resize', () => { placeNav(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeNav);
    $('ed-back').addEventListener('click', () => { haptic(); leaveEditor(); });
    $('easy-back').addEventListener('click', () => { haptic(); leaveEditor(); });
    $('easy-more').addEventListener('click', () => { haptic(); easyMore(); });
    $('easy-app').addEventListener('click', () => { haptic(); settingsPage(); });
    $('easy').appendChild(easyBar());
    $('bar-undo').addEventListener('click', () => { haptic(); undo(); });
    $('bar-redo').addEventListener('click', () => { haptic(); redo(); });
    $('scrim').addEventListener('click', closeSheet);
    $('bar-app').addEventListener('click', () => { haptic(); settingsPage(); });
    $('bar-preview').addEventListener('click', () => { haptic(); previewPage(); });
    $('bar-publish').addEventListener('click', () => { haptic(); publishSheet(); });
    $('demo-link').addEventListener('click', e => { e.preventDefault(); location.hash = '#demo'; location.reload(); });
    const tools = {
      theme: themePage,
      templates: () => { popAll(); templatesScreen(false); },
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
        else if (S.screen === 'editor' || S.screen === 'easy') leaveEditor();
        else if (S.screen === 'templates' && !S.asTab && S.app) openEditor();
        else if (S.screen === 'onboard' && S.me && S.me.apps.length) tab('home');
      });
      tg.onEvent('themeChanged', () => { applyChrome(); if (S.doc && (S.screen === 'editor' || S.screen === 'easy')) renderAll(); });
      tg.onEvent('safeAreaChanged', applyChrome);
      tg.onEvent('contentSafeAreaChanged', applyChrome);
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyChrome(); if (S.doc && S.screen === 'editor') renderAll(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && S.app && S.saveState === 'busy') saveNow(); });
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
