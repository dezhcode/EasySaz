/* ایزی‌ساز — پنل ساخت (داخل @EasySazBot)
   جزءها و قانون‌ها از سیستم طراحی «ایزی‌ساز — کاشی».

   جریان: بوت ← (اپ ندارد؟ اسم ← قالب) ← ادیتور.
   ادیتور: نوار بالا (اسم، پیش‌نمایش، انتشار) + نوار صفحه‌ها، بوم (صفحهٔ
   واقعی کاربر)، نوار ابزار پایین (لایه‌ها، قالب‌ها، افزودن، ظاهر، تنظیمات).
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
  });
  function ico(name) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'ico');
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
  const CAT_DOT = { write: 'var(--write)', act: 'var(--act)', media: 'var(--media)', shop: 'var(--shop)', frame: 'var(--ink-3)' };

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
    const dark = tg && tg.colorScheme ? tg.colorScheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
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
  function show(id) {
    ['onboard', 'templates', 'editor', 'blocked'].forEach(s => { $(s).hidden = s !== id; });
    const boot = $('boot');
    if (boot) { boot.classList.add('out'); setTimeout(() => boot.remove(), 350); }
    if (tg && tg.BackButton) {
      if ((id === 'onboard' || id === 'templates') && S.app) tg.BackButton.show(); else tg.BackButton.hide();
    }
    window.scrollTo(0, 0);
  }

  /* ===== شروع: اسم ===== */
  function onboard() {
    show('onboard');
    const input = $('ob-name'), go = $('ob-go'), chips = $('ob-chips');
    chips.textContent = '';
    ['فروشگاه من', 'کافه', 'استودیو', 'آموزشگاه', 'پورتفولیو'].forEach(name => {
      const c = h('button', 'chip', name);
      c.type = 'button';
      c.addEventListener('click', () => { input.value = name; input.oninput(); select(); });
      chips.appendChild(c);
    });
    input.value = '';
    go.disabled = true;
    input.oninput = () => { go.disabled = input.value.trim().length < 2; };
    input.onkeydown = e => { if (e.key === 'Enter' && !go.disabled) go.click(); };
    go.onclick = async () => {
      go.disabled = true;
      go.textContent = 'در حال ساخت…';
      try {
        const res = await api('app/create', { name: input.value.trim() });
        notify('success');
        S.me.apps.push(res.app);
        await openApp(res.app.id, true);
        templatesScreen(true);
      } catch (err) {
        failed(err);
      } finally {
        go.textContent = 'ادامه';
        input.oninput();
      }
    };
    setTimeout(() => input.focus(), 350);
  }

  /* ===== قالب‌ها (TemplatePicker) ===== */
  function fillName(doc) {
    const name = (S.app && S.app.name) || '';
    return JSON.parse(JSON.stringify(doc).split('{name}').join(name.replace(/["\\]/g, '')));
  }

  function templatesScreen(isNew) {
    show('templates');
    $('tpl-back').hidden = isNew;
    $('tpl-sub').textContent = isNew
      ? 'قدم ۲ از ۲ · همه‌چیزش قابل تغییره: متن، رنگ، صفحه‌ها و کامپوننت‌ها.'
      : 'قالب تازه جای صفحه‌های فعلی می‌نشیند.';
    const cats = S.templates.categories;
    let active = 'all';
    const bar = $('tpl-cats'), grid = $('tpl-grid');
    const drawCats = () => {
      bar.textContent = '';
      [['all', 'همه']].concat(Object.entries(cats)).forEach(([key, label]) => {
        const b = h('button', key === active ? 'on' : '', label);
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', key === active ? 'true' : 'false');
        b.addEventListener('click', () => { active = key; select(); drawCats(); drawGrid(); });
        bar.appendChild(b);
      });
    };
    const drawGrid = () => {
      grid.textContent = '';
      S.templates.templates.filter(t => active === 'all' || t.category === active).forEach(t => {
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
    $('tpl-blank').onclick = () => { show('editor'); renderAll(); };
    $('tpl-back').onclick = () => { show('editor'); renderAll(); };
  }

  function pickTemplate(t, isNew) {
    if (t.premium && !S.plan.premium_blocks) { upsellSheet(`قالب «${t.title}» کامپوننت‌های حرفه‌ای دارد.`); return; }
    const apply = async () => {
      const doc = fillName(t.doc);
      try {
        const res = await api('app/save', { id: S.app.id, doc });
        S.doc = res.doc;
        S.app = res.app;
        S.pageId = S.doc.pages[0].id;
        S.selected = null;
        notify('success');
        show('editor');
        renderAll();
        toast(`قالب «${t.title}» اعمال شد`);
        if (t.note) setTimeout(() => toast(t.note), 2400);
      } catch (err) { failed(err); }
    };
    if (!isNew && totalBlocks()) confirmBox('قالب تازه جای همهٔ صفحه‌های فعلی می‌نشیند. ادامه می‌دی؟', apply);
    else apply();
  }

  /* ===== ادیتور ===== */
  async function openApp(id, quiet) {
    const res = await api('app?id=' + encodeURIComponent(id));
    S.app = res.app;
    S.doc = ES.normalize(res.doc);
    S.stats = res.stats;
    S.plan = res.plan;
    S.pageId = S.doc.pages[0].id;
    S.selected = null;
    try { localStorage.setItem('es-last-app', String(id)); } catch (e) {}
    if (!quiet) { show('editor'); renderAll(); }
  }

  function renderAll() {
    renderBar();
    renderPages();
    renderCanvas();
  }

  function renderBar() {
    $('bar-name').textContent = S.app.name;
    $('bar-initial').textContent = (S.app.name || '؟').trim().charAt(0);
    const live = !!S.app.published_at;
    const st = $('bar-status');
    const pub = !live ? 'پیش‌نویس' : (S.app.dirty ? 'تغییرات منتشر نشده' : 'منتشر شده');
    const save = { busy: 'در حال ذخیره…', err: 'ذخیره نشد', '': 'ذخیره شد' }[S.saveState];
    st.querySelector('span').textContent = pub + ' · ' + save;
    st.className = 'caption status ' + (S.saveState || (live && !S.app.dirty ? 'live' : ''));
    $('bar-publish').classList.toggle('dirty', !!S.app.dirty || !live);
  }

  /* نوار صفحه‌ها: زدن = رفتن به صفحه؛ زدن دوباره روی صفحهٔ فعلی = تنظیمات صفحه */
  function renderPages() {
    const strip = $('pagestrip');
    strip.textContent = '';
    S.doc.pages.forEach(p => {
      const on = p.id === page().id;
      const b = h('button', 'pchip' + (on ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.append(ico(p.icon), h('span', '', p.title));
      if (on) { const e = h('span', 'pchip-edit'); e.appendChild(ico('brush')); b.appendChild(e); }
      b.addEventListener('click', () => { if (on) pageSheet(p.id); else goPage(p.id); });
      strip.appendChild(b);
    });
    const add = h('button', 'pchip add');
    add.type = 'button';
    add.append(ico('plus'), h('span', '', 'صفحه'));
    add.addEventListener('click', addPage);
    strip.appendChild(add);
  }

  function goPage(id) {
    S.pageId = id;
    S.selected = null;
    select();
    renderPages();
    renderCanvas();
    window.scrollTo(0, 0);
  }

  let renderQueued = false;
  function renderCanvas() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      ES.render($('canvas'), S.doc, {
        page: page().id,
        appName: S.app.name,
        editing: !S.previewing,
        selected: S.previewing ? null : S.selected,
        onPick: id => { if (!S.previewing) { haptic(); editBlock(id); } },
        onPickHeader: () => { if (!S.previewing) { haptic(); headerSheet(); } },
        onNavigate: id => goPage(id),
        branding: S.plan && S.plan.branding ? { bot: S.me.bot } : null,
      });
      $('empty').hidden = page().blocks.length > 0 || S.previewing;
    });
  }

  function changed() {
    S.app.dirty = true;
    renderBar();
    renderCanvas();
    scheduleSave();
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

  /* ---------- Sheet ---------- */
  let sheetClose = null;
  function openSheet(build, onClose, tool) {
    const sheet = $('sheet');
    if (sheet.classList.contains('on') && sheetClose) { const cb = sheetClose; sheetClose = null; cb(); }
    sheet.textContent = '';
    sheet.appendChild(h('div', 'grip'));
    build(sheet);
    sheet.scrollTop = 0;
    sheet.classList.add('on');
    $('scrim').classList.add('on');
    sheetClose = onClose || null;
    document.querySelectorAll('.toolbar button').forEach(b => b.classList.toggle('on', b.dataset.act === tool));
    if (tg && tg.BackButton) tg.BackButton.show();
  }
  function closeSheet() {
    $('sheet').classList.remove('on');
    $('scrim').classList.remove('on');
    document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('on'));
    if (tg && tg.BackButton) tg.BackButton.hide();
    const cb = sheetClose;
    sheetClose = null;
    if (cb) cb();
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
    if (field.type === 'int') return intControl(field, value, onChange);
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

  function listControl(field, items, onChange) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', 'label', field.label));
    const box = h('div', 'items');
    wrap.appendChild(box);
    const addBtn = h('button', 'add-item', '+ افزودن ' + (field.item_label || 'مورد'));
    addBtn.type = 'button';
    wrap.appendChild(addBtn);
    const titleOf = it => {
      const f = field.fields.find(x => x.type === 'text' || x.type === 'textarea' || x.type === 'select');
      if (!f) return field.item_label || 'مورد';
      if (f.type === 'select') {
        const opt = (f.options || []).find(o => (Array.isArray(o) ? o[0] : o) === it[f.key]);
        return opt ? (Array.isArray(opt) ? opt[1] : opt) : field.item_label;
      }
      return it[f.key] || field.item_label || 'مورد';
    };
    function draw(openIndex) {
      box.textContent = '';
      items.forEach((it, i) => {
        const card = h('div', 'item' + (i === openIndex ? ' open' : ''));
        const head = h('div', 'item-h');
        head.appendChild(h('span', 'item-n', String(i + 1)));
        const title = h('b', 'body-strong', titleOf(it));
        head.appendChild(title);
        const mk = (name, fn, label) => {
          const b = h('button');
          b.type = 'button';
          b.setAttribute('aria-label', label);
          b.appendChild(ico(name));
          b.addEventListener('click', e => { e.stopPropagation(); fn(); });
          return b;
        };
        if (i > 0) head.appendChild(mk('up', () => { items.splice(i - 1, 0, items.splice(i, 1)[0]); onChange(items); draw(i - 1); haptic(); }, 'بالا'));
        head.appendChild(mk('trash', () => { items.splice(i, 1); onChange(items); draw(-1); haptic('medium'); }, 'حذف'));
        const chev = ico('chev');
        chev.classList.add('chev');
        head.appendChild(chev);
        head.addEventListener('click', () => { card.classList.toggle('open'); haptic(); });
        card.appendChild(head);
        const body = h('div', 'item-b');
        field.fields.forEach(sub => {
          body.appendChild(control(sub, it[sub.key], v => { it[sub.key] = v; title.textContent = titleOf(it); onChange(items); }));
        });
        card.appendChild(body);
        box.appendChild(card);
      });
      addBtn.hidden = items.length >= (field.max_items || 10);
    }
    addBtn.addEventListener('click', () => {
      const blank = {};
      field.fields.forEach(sub => { blank[sub.key] = sub.type === 'select' ? sub.default : (sub.type === 'url' ? '' : (sub.default || '')); });
      items.push(blank);
      onChange(items);
      draw(items.length - 1);
      haptic();
    });
    draw(-1);
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

  function editBlock(id) {
    const found = findBlock(id);
    if (!found) return;
    const block = found.block;
    const spec = S.schema.blocks[block.type];
    S.selected = id;
    renderCanvas();
    scrollToBlock(id);

    openSheet(sheet => {
      sheetHead(sheet, spec.cat, spec.icon, spec.title, spec.desc);
      const tools = h('div', 'tools');
      const tool = (name, label, fn, cls) => {
        const b = h('button', cls || '');
        b.type = 'button';
        b.setAttribute('aria-label', label);
        b.title = label;
        b.appendChild(ico(name));
        b.addEventListener('click', fn);
        tools.appendChild(b);
        return b;
      };
      const where = () => findBlock(id);
      const move = d => {
        const f = where(), list = f.page.blocks, j = f.index + d;
        if (j < 0 || j >= list.length) return;
        list.splice(j, 0, list.splice(f.index, 1)[0]);
        haptic();
        changed();
        refreshMoves();
        scrollToBlock(id);
      };
      const upBtn = tool('up', 'بالا', () => move(-1));
      const downBtn = tool('down', 'پایین', () => move(1));
      const refreshMoves = () => {
        const f = where();
        upBtn.disabled = f.index <= 0;
        downBtn.disabled = f.index >= f.page.blocks.length - 1;
      };
      refreshMoves();
      tool('copy', 'تکثیر', () => {
        if (totalBlocks() >= S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
        const f = where();
        const copy = JSON.parse(JSON.stringify(f.block));
        copy.id = newId();
        f.page.blocks.splice(f.index + 1, 0, copy);
        haptic('medium');
        changed();
        toast('کامپوننت تکثیر شد');
        setTimeout(() => editBlock(copy.id), 280);
      });
      if (S.doc.pages.length > 1) tool('move', 'انتقال به صفحهٔ دیگر', () => moveToPageSheet(id));
      tool('trash', 'حذف', () => {
        confirmBox('این کامپوننت حذف بشه؟', () => {
          const f = where();
          f.page.blocks.splice(f.index, 1);
          S.selected = null;
          notify('warning');
          changed();
          closeSheet();
          toast('کامپوننت حذف شد');
        });
      }, 'del');
      sheet.appendChild(tools);

      spec.fields.forEach(f => {
        if (f.type === 'list') {
          if (!Array.isArray(block.props[f.key])) block.props[f.key] = [];
          sheet.appendChild(listControl(f, block.props[f.key], v => { block.props[f.key] = v; changed(); }));
        } else {
          sheet.appendChild(control(f, block.props[f.key], v => { block.props[f.key] = v; changed(); }));
        }
      });

      // ظاهر این کامپوننت (شخصی‌سازی)
      const allowed = spec.style || [];
      if (allowed.length) {
        const sec = h('div', 'style-sec');
        const lbl = h('div', 'label');
        lbl.append(ico('brush'), document.createTextNode('ظاهر این کامپوننت'));
        sec.appendChild(lbl);
        block.style = block.style || {};
        S.schema.style.filter(f => allowed.indexOf(f.key) >= 0).forEach(f => {
          const cur = block.style[f.key] != null ? block.style[f.key] : f.default;
          sec.appendChild(control(f, cur, v => {
            if (v === null || v === '' || v === f.default) delete block.style[f.key]; else block.style[f.key] = v;
            changed();
          }));
        });
        const reset = h('button', 'add-item', 'برگشت به ظاهر پیش‌فرض');
        reset.type = 'button';
        reset.addEventListener('click', () => { block.style = {}; changed(); editBlock(id); });
        sec.appendChild(reset);
        sheet.appendChild(sec);
      }
    }, () => {
      S.selected = null;
      renderCanvas();
      saveNow();
    });
  }

  function moveToPageSheet(id) {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'move', 'انتقال به صفحهٔ دیگر', 'کامپوننت آخر صفحهٔ مقصد قرار می‌گیرد.');
      const st = h('div', 'stack sh-sec');
      S.doc.pages.forEach(p => {
        const f = findBlock(id);
        if (p.id === f.page.id) return;
        const r = h('button', 'row');
        const g = h('span', 'grow');
        g.append(h('b', 'body-strong', p.title), h('span', 'caption', p.blocks.length + ' کامپوننت'));
        r.append(catTile('frame', p.icon), g);
        r.addEventListener('click', () => {
          const cur = findBlock(id);
          cur.page.blocks.splice(cur.index, 1);
          p.blocks.push(cur.block);
          S.selected = null;
          changed();
          closeSheet();
          goPage(p.id);
          toast(`به «${p.title}» منتقل شد`);
        });
        st.appendChild(r);
      });
      sheet.appendChild(st);
    });
  }

  function scrollToBlock(id) {
    requestAnimationFrame(() => {
      const el = document.querySelector(`.pg-block[data-id="${CSS.escape(id)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function newId() {
    return 'b' + Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  }

  /* ---------- افزودن کامپوننت (ComponentTile، گروه‌بندی بر اساس دسته) ---------- */
  function addSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'plus', 'افزودن کامپوننت',
        `به «${page().title}» · ${totalBlocks()} از ${S.plan.max_blocks} کامپوننت · پلن ${S.plan.title}`);
      const order = S.schema.order || Object.keys(S.schema.blocks);
      const cats = S.schema.categories || {};
      Object.keys(cats).forEach(cat => {
        const types = order.filter(t => S.schema.blocks[t] && S.schema.blocks[t].cat === cat);
        if (!types.length) return;
        const group = h('div', 'cat-group');
        const lbl = h('div', 'label');
        const dot = h('i', 'dot');
        dot.style.background = CAT_DOT[cat];
        lbl.append(dot, document.createTextNode(cats[cat]));
        group.appendChild(lbl);
        const grid = h('div', 'cat-grid');
        types.forEach(type => {
          const spec = S.schema.blocks[type];
          const locked = spec.premium && !S.plan.premium_blocks;
          const b = h('button', 'ctile' + (locked ? ' locked' : ''));
          b.type = 'button';
          b.appendChild(catTile(spec.cat, spec.icon));
          b.appendChild(h('span', 'body-strong', spec.title));
          const cap = h('span', 'caption');
          if (locked) { cap.appendChild(ico('lock')); cap.appendChild(document.createTextNode('پلن حرفه‌ای')); } else cap.textContent = spec.desc;
          b.appendChild(cap);
          if (spec.premium) b.appendChild(h('span', 'pro', 'PRO'));
          b.addEventListener('click', () => {
            if (locked) { upsellSheet(`«${spec.title}» مخصوص پلن‌های حرفه‌ای است.`); return; }
            if (totalBlocks() >= S.plan.max_blocks) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
            const props = {};
            spec.fields.forEach(f => { props[f.key] = JSON.parse(JSON.stringify(f.default === undefined ? '' : f.default)); });
            const block = { id: newId(), type, props };
            const list = page().blocks;
            const f = S.selected ? findBlock(S.selected) : null;
            const at = f && f.page === page() ? f.index + 1 : list.length;
            list.splice(at, 0, block);
            notify('success');
            changed();
            closeSheet();
            setTimeout(() => editBlock(block.id), 300);
          });
          grid.appendChild(b);
        });
        group.appendChild(grid);
        sheet.appendChild(group);
      });
    }, null, 'add');
  }

  /* ---------- لایه‌ها (LayerList: کشیدن برای جابه‌جایی) ---------- */
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

  function layerRow(cat, iconName, title, sub, onTap, extra) {
    const row = h('div', 'layer');
    const txt = h('button', 'layer-txt');
    txt.type = 'button';
    txt.style.textAlign = 'right';
    txt.append(h('b', 'body-strong', title), h('span', 'caption', sub || ''));
    txt.addEventListener('click', onTap);
    row.append(catTile(cat, iconName), txt);
    if (extra) row.appendChild(extra);
    return row;
  }

  function summary(block) {
    const p = block.props || {};
    const first = p.title || p.label || p.text || p.caption || p.name;
    if (first) return String(first).split('\n')[0];
    if (Array.isArray(p.items)) return p.items.length + ' مورد';
    return '';
  }

  function layersSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'layers', 'لایه‌های «' + page().title + '»', 'برای جابه‌جایی، دستگیره را بکش. برای ویرایش، روی هر لایه بزن.');
      // سربرگ
      const top = h('div', 'layers');
      const hd = S.doc.header;
      top.appendChild(layerRow('frame', 'header', 'سربرگ', hd.enabled ? (hd.title || S.app.name) : 'خاموش', headerSheet));
      sheet.appendChild(top);
      // کامپوننت‌ها
      const group = h('div', 'layers-group');
      group.appendChild(h('span', 'label', 'کامپوننت‌ها'));
      const list = h('div', 'layers');
      page().blocks.forEach(b => {
        const spec = S.schema.blocks[b.type];
        const handle = h('span', 'layer-handle');
        handle.setAttribute('aria-label', 'جابه‌جایی ' + spec.title);
        handle.appendChild(ico('grip'));
        const row = layerRow(spec.cat, spec.icon, spec.title, summary(b), () => editBlock(b.id), handle);
        row.dataset.id = b.id;
        list.appendChild(row);
      });
      if (!page().blocks.length) list.appendChild(h('p', 'caption', 'این صفحه هنوز کامپوننتی ندارد.'));
      sortable(list, ids => {
        const byId = {};
        page().blocks.forEach(b => { byId[b.id] = b; });
        page().blocks = ids.map(i => byId[i]);
        changed();
      });
      group.appendChild(list);
      const add = h('button', 'add-item', '+ افزودن کامپوننت');
      add.type = 'button';
      add.addEventListener('click', addSheet);
      group.appendChild(add);
      sheet.appendChild(group);
      // نوار پایین
      const bottom = h('div', 'layers layers-group');
      const tb = S.doc.tabbar;
      const tbSub = S.doc.pages.length < 2 ? 'با دو صفحه یا بیشتر نمایش داده می‌شود' : (tb.enabled ? 'روشن · ' + S.doc.pages.length + ' تب' : 'خاموش');
      bottom.appendChild(layerRow('frame', 'tabbar', 'نوار پایین', tbSub, tabbarSheet));
      sheet.appendChild(bottom);
    }, () => { renderCanvas(); saveNow(); }, 'layers');
  }

  /* ---------- سربرگ و نوار پایین ---------- */
  function groupFields(parent, fields, target) {
    fields.forEach(f => {
      parent.appendChild(control(f, target[f.key], v => { target[f.key] = v; changed(); }));
    });
  }

  function headerSheet() {
    S.selected = 'header';
    renderCanvas();
    openSheet(sheet => {
      sheetHead(sheet, 'frame', 'header', 'سربرگ', 'بالای همهٔ صفحه‌ها؛ اسم و لوگوی مینی‌اپ.');
      groupFields(sheet, S.schema.header, S.doc.header);
      sheet.appendChild(h('p', 'caption sw-note', 'اگر عنوان خالی بماند، اسم مینی‌اپ نشان داده می‌شود.'));
    }, () => { S.selected = null; renderCanvas(); saveNow(); });
  }

  function tabbarSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'frame', 'tabbar', 'نوار پایین', 'هر صفحه یک تب است؛ اسم و آیکن تب از تنظیمات همان صفحه می‌آید.');
      if (S.doc.pages.length < 2) {
        const note = h('div', 'warn-box sh-sec');
        note.append(ico('warn'), h('span', 'caption', 'نوار پایین وقتی دیده می‌شود که مینی‌اپ حداقل دو صفحه داشته باشد.'));
        sheet.appendChild(note);
        const add = h('button', 'btn secondary block', 'افزودن صفحهٔ دوم');
        add.style.marginTop = '10px';
        add.addEventListener('click', addPage);
        sheet.appendChild(add);
      }
      groupFields(sheet, S.schema.tabbar, S.doc.tabbar);
      const st = h('div', 'stack sh-sec');
      st.appendChild(h('span', 'label', 'تب‌ها'));
      S.doc.pages.forEach(p => {
        const r = h('button', 'row');
        const g = h('span', 'grow');
        g.append(h('b', 'body-strong', p.title), h('span', 'caption', 'زدن برای تغییر اسم و آیکن'));
        r.append(catTile('frame', p.icon), g);
        r.addEventListener('click', () => pageSheet(p.id));
        st.appendChild(r);
      });
      sheet.appendChild(st);
    }, saveNow);
  }

  /* ---------- صفحه‌ها ---------- */
  function addPage() {
    if (S.doc.pages.length >= S.plan.max_pages) { upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_pages} صفحه دارد.`); return; }
    const used = S.doc.pages.map(p => p.icon);
    const icon = (S.schema.page_icons.find(([k]) => used.indexOf(k) < 0) || ['star'])[0];
    const id = 'p' + Math.random().toString(16).slice(2, 8);
    S.doc.pages.push({ id, title: 'صفحهٔ ' + (S.doc.pages.length + 1), icon, blocks: [] });
    if (S.doc.pages.length === 2) S.doc.tabbar.enabled = true;
    changed();
    goPage(id);
    notify('success');
    setTimeout(() => pageSheet(id), 250);
  }

  function pageSheet(id) {
    const p = S.doc.pages.find(x => x.id === id);
    if (!p) return;
    openSheet(sheet => {
      sheetHead(sheet, 'frame', p.icon, 'تنظیمات صفحه', 'اسم و آیکن، روی تب نوار پایین هم دیده می‌شوند.');
      sheet.appendChild(control({ type: 'text', label: 'اسم صفحه', max: 24 }, p.title, v => { p.title = v; renderPages(); changed(); }));
      const iconWrap = h('div', 'field');
      iconWrap.appendChild(h('span', 'label', 'آیکن'));
      const grid = h('div', 'icons');
      const draw = () => {
        grid.textContent = '';
        S.schema.page_icons.forEach(([key, label]) => {
          const b = h('button', key === p.icon ? 'on' : '');
          b.type = 'button';
          b.append(ico(key), document.createTextNode(label));
          b.addEventListener('click', () => { p.icon = key; select(); draw(); renderPages(); changed(); });
          grid.appendChild(b);
        });
      };
      draw();
      iconWrap.appendChild(grid);
      sheet.appendChild(iconWrap);
      const tools = h('div', 'tools sh-sec');
      const i = S.doc.pages.indexOf(p);
      const mk = (name, label, fn, disabled, cls) => {
        const b = h('button', cls || '');
        b.type = 'button';
        b.title = label;
        b.setAttribute('aria-label', label);
        b.appendChild(ico(name));
        b.disabled = !!disabled;
        b.addEventListener('click', fn);
        tools.appendChild(b);
      };
      mk('back', 'جلوتر', () => { S.doc.pages.splice(i - 1, 0, S.doc.pages.splice(i, 1)[0]); changed(); renderPages(); pageSheet(id); }, i === 0);
      mk('arrow', 'عقب‌تر', () => { S.doc.pages.splice(i + 1, 0, S.doc.pages.splice(i, 1)[0]); changed(); renderPages(); pageSheet(id); }, i === S.doc.pages.length - 1);
      mk('trash', 'حذف صفحه', () => {
        confirmBox(`صفحهٔ «${p.title}» با ${p.blocks.length} کامپوننتش حذف بشه؟`, () => {
          S.doc.pages.splice(S.doc.pages.indexOf(p), 1);
          changed();
          closeSheet();
          goPage(S.doc.pages[0].id);
          toast('صفحه حذف شد');
        });
      }, S.doc.pages.length < 2, 'del');
      sheet.appendChild(tools);
    }, () => { renderPages(); saveNow(); });
  }

  /* ---------- ظاهر (SwatchPicker + Segmented + گوشهٔ دلخواه) ---------- */
  function themeSheet() {
    const theme = S.doc.theme;
    const set = (k, v) => { theme[k] = v; changed(); };
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'palette', 'ظاهر مینی‌اپ', 'رنگ اصلی رو انتخاب کن؛ بقیه خودکار ساخته می‌شن.');
      const sec = h('div', 'sh-sec');
      sec.appendChild(h('span', 'label', 'رنگ اصلی'));
      const grid = h('div', 'swatches');
      const draw = () => {
        grid.textContent = '';
        const cur = (theme.accent || '').toLowerCase();
        let preset = false;
        S.schema.swatches.forEach(([name, color]) => {
          const on = color.toLowerCase() === cur;
          preset = preset || on;
          const b = h('button', 'sw' + (on ? ' on' : ''));
          b.type = 'button';
          b.style.background = color;
          b.setAttribute('aria-label', name);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          b.appendChild(ico('check'));
          b.addEventListener('click', () => { set('accent', color); select(); draw(); });
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
        input.addEventListener('change', draw);
        custom.appendChild(input);
        grid.appendChild(custom);
      };
      draw();
      sec.appendChild(grid);
      sec.appendChild(h('p', 'caption sw-note', 'بقیهٔ رنگ‌ها خودکار ساخته می‌شن و همیشه خوانا می‌مونن.'));
      sheet.appendChild(sec);
      sheet.appendChild(selectControl({ label: 'حالت', options: [['auto', 'خودکار'], ['light', 'روشن'], ['dark', 'تیره']] }, theme.mode, v => set('mode', v)));
      sheet.appendChild(selectControl({ label: 'پس‌زمینه', options: [['tint', 'رنگی'], ['plain', 'ساده']] }, theme.bg, v => set('bg', v)));
      const radiusBox = h('div');
      const drawRadius = () => {
        radiusBox.textContent = '';
        radiusBox.appendChild(selectControl({ label: 'گوشه‌ها', options: [['soft', 'نرم'], ['round', 'گرد'], ['sharp', 'تیز'], ['custom', 'دلخواه']] }, theme.radius, v => { set('radius', v); drawRadius(); }));
        if (theme.radius === 'custom') {
          radiusBox.appendChild(intControl({ label: 'اندازهٔ گوشه', min: 0, max: 32, default: 18 }, theme.radius_px, v => set('radius_px', v)));
        }
      };
      drawRadius();
      sheet.appendChild(radiusBox);
    }, saveNow, 'theme');
  }

  /* ---------- پیش‌نمایش ---------- */
  function preview(on) {
    S.previewing = on;
    S.selected = null;
    $('editor').classList.toggle('previewing', on);
    $('exit-preview').hidden = !on;
    $('bar-preview').classList.toggle('on', on);
    if (tg && tg.BackButton) { if (on) tg.BackButton.show(); else tg.BackButton.hide(); }
    haptic();
    renderCanvas();
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

  function settingsSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'settings', S.app.name, S.app.bot_username ? '@' + S.app.bot_username : 'هنوز به رباتی وصل نشده');

      const stats = h('div', 'stats');
      [['visitors', 'بازدیدکننده'], ['views_today', 'بازدید امروز'], ['views_week', 'هفت روز']].forEach(([k, label]) => {
        const s = h('div', 'stat');
        s.append(h('div', 'num-lg', ((S.stats && S.stats[k]) || 0).toLocaleString('en-US')), h('div', 'label', label));
        stats.appendChild(s);
      });
      sheet.appendChild(stats);

      const nameSec = h('div', 'sh-sec');
      nameSec.appendChild(h('span', 'label', 'اسم مینی‌اپ'));
      const row = h('div', 'row');
      const input = h('input');
      input.value = S.app.name;
      input.maxLength = 40;
      input.setAttribute('aria-label', 'اسم مینی‌اپ');
      const save = h('button', 'btn secondary xs', 'ذخیره');
      save.addEventListener('click', async () => {
        try {
          const res = await api('app/rename', { id: S.app.id, name: input.value });
          S.app = res.app;
          const inList = S.me.apps.find(a => a.id === S.app.id);
          if (inList) inList.name = S.app.name;
          renderAll();
          notify('success');
          toast('اسم عوض شد');
        } catch (err) { failed(err); }
      });
      row.append(input, save);
      nameSec.appendChild(row);
      sheet.appendChild(nameSec);

      const conn = h('div', 'sh-sec stack');
      conn.appendChild(h('span', 'label', 'اتصال'));
      conn.append(linkRow(), botRow());
      sheet.appendChild(conn);

      // پیام خوش‌آمد (حالت کنترل کامل)
      const wel = h('div', 'sh-sec');
      wel.appendChild(h('span', 'label', 'پیام خوش‌آمد ربات'));
      const full = S.app.mode === 'full';
      const note = h('div', 'warn-box');
      note.style.marginTop = '8px';
      note.append(ico(full ? 'check' : 'warn'), h('span', 'caption', full
        ? 'رباتت در جواب /start همین پیام را با دکمهٔ ورود به مینی‌اپ می‌فرستد.'
        : 'این پیام فقط در حالت «کنترل کامل» ربات فرستاده می‌شود. حالت اتصال را در ربات ایزی‌ساز عوض کن.'));
      wel.appendChild(note);
      const ta = control({ type: 'textarea', label: 'متن پیام', max: 1000 }, decodeHtml(S.app.welcome), () => {});
      ta.querySelector('textarea').placeholder = `سلام! به «${S.app.name}» خوش اومدی. برای شروع روی دکمهٔ زیر بزن.`;
      wel.appendChild(ta);
      const wsave = h('button', 'btn secondary block', 'ذخیرهٔ پیام خوش‌آمد');
      wsave.style.marginTop = '10px';
      wsave.addEventListener('click', async () => {
        try {
          const res = await api('app/welcome', { id: S.app.id, text: ta.querySelector('textarea').value });
          S.app = res.app;
          notify('success');
          toast(res.app.welcome ? 'پیام خوش‌آمد ذخیره شد' : 'پیام پیش‌فرض برگشت');
        } catch (err) { failed(err); }
      });
      wel.appendChild(wsave);
      sheet.appendChild(wel);

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
      sheet.appendChild(planSec);

      const appsSec = h('div', 'sh-sec stack');
      appsSec.appendChild(h('span', 'label', 'مینی‌اپ‌های من'));
      S.me.apps.forEach(a => {
        const r = h('button', 'row');
        const t = h('span', 'appbar-tile', (a.name || '?').charAt(0));
        const g = h('span', 'grow');
        g.append(h('b', 'body-strong', a.name), h('span', 'caption', a.id === S.app.id ? 'در حال ویرایش' : (a.bot_username ? '@' + a.bot_username : 'بدون ربات')));
        r.append(t, g);
        if (a.id !== S.app.id) r.addEventListener('click', async () => { closeSheet(); await saveNow(); openApp(a.id).catch(failed); });
        appsSec.appendChild(r);
      });
      const more = h('button', 'add-item', '+ مینی‌اپ جدید');
      more.addEventListener('click', () => {
        if (S.me.apps.length >= S.me.plan.max_apps) { upsellSheet(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد.`); return; }
        closeSheet();
        onboard();
      });
      appsSec.appendChild(more);
      sheet.appendChild(appsSec);
    }, null, 'settings');
  }

  /* ---------- اتصال رویدادها ---------- */
  function wire() {
    document.querySelectorAll('[data-icon]').forEach(el => el.appendChild(ico(el.dataset.icon)));
    $('scrim').addEventListener('click', closeSheet);
    $('bar-app').addEventListener('click', () => { haptic(); settingsSheet(); });
    $('bar-preview').addEventListener('click', () => preview(!S.previewing));
    $('bar-publish').addEventListener('click', () => { haptic(); publish(); });
    $('empty-add').addEventListener('click', () => { haptic(); addSheet(); });
    $('empty-tpl').addEventListener('click', () => { haptic(); templatesScreen(false); });
    $('exit-preview').addEventListener('click', () => preview(false));
    $('demo-link').addEventListener('click', e => { e.preventDefault(); location.hash = '#demo'; location.reload(); });
    const tools = { layers: layersSheet, templates: () => templatesScreen(false), add: addSheet, theme: themeSheet, settings: settingsSheet };
    document.querySelectorAll('.toolbar button').forEach(b => {
      b.addEventListener('click', () => { haptic(); tools[b.dataset.act](); });
    });
    if (tg) {
      tg.BackButton.onClick(() => {
        if ($('sheet').classList.contains('on')) closeSheet();
        else if (S.previewing) preview(false);
        else if ((!$('onboard').hidden || !$('templates').hidden) && S.app) { show('editor'); renderAll(); }
      });
      tg.onEvent('themeChanged', () => { applyChrome(); if (S.doc) renderCanvas(); });
      tg.onEvent('safeAreaChanged', applyChrome);
      tg.onEvent('contentSafeAreaChanged', applyChrome);
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyChrome(); if (S.doc) renderCanvas(); });
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
      await openApp(pick.id);
    } catch (err) {
      $('blocked-msg').textContent = err.message;
      $('demo-link').hidden = true;
      show('blocked');
    }
  }

  boot();
})();
