/* ایزی‌ساز — پنل ساخت (داخل @EasySazBot)
   جزءها و قانون‌ها از سیستم طراحی «ایزی‌ساز — کاشی».
   جریان: بوت ← (اپ ندارد؟ صفحهٔ خالی و انتخاب اسم) ← ادیتور.
   هر تغییر فوراً روی بوم رندر می‌شود و با تأخیر کوتاه پیش‌نویس ذخیره
   می‌شود. «انتشار» پیش‌نویس را برای بازدیدکننده‌ها زنده می‌کند.

   حالت نمایشی: بیرون از تلگرام با #demo، همه چیز با demo.js و
   localStorage کار می‌کند (بدون سرور) تا فرانت‌اند جدا ساخته و دیده شود. */
(function () {
  'use strict';

  const tg = window.Telegram && window.Telegram.WebApp;
  const ES = window.EasySaz;
  const BASE = document.documentElement.dataset.base || '/';
  const DEMO = location.hash === '#demo' && !(tg && tg.initData);
  const $ = id => document.getElementById(id);
  const h = ES.h;

  /* ---------- آیکن‌ها (خطی ۱.۸، همان مجموعهٔ سیستم طراحی) ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const UI = {
    plus: 'M12 5v14M5 12h14',
    palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-4.9-4-8.8-9-8.8zM7.5 11.5v.01M10 7.5v.01M14.5 7.5v.01',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    x: 'M6 6l12 12M18 6L6 18',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    chev: 'M6 9l6 6 6-6',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    bot: 'M5 9h14v10H5zM12 5v4M9 13v.01M15 13v.01M9 16h6',
    lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z',
    warn: 'M4 10v4h3l5 4V6L7 10H4zM16 9a4 4 0 0 1 0 6',
    // کامپوننت‌ها (نام آیکن در اسکیمای سرور)
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    text: 'M5 6h14M5 11h14M5 16h9',
    button: 'M4 8h16v8H4zM9 12h6',
    links: 'M8 6h12M8 12h12M8 18h12M4 6v.01M4 12v.01M4 18v.01',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5v.01',
    faq: 'M12 21a9 9 0 1 0-9-9c0 1.6.4 3.1 1.2 4.4L3 21l4.6-1.2A9 9 0 0 0 12 21zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 16.5v.01',
    social: 'M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM22 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM22 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM7.7 10.6l8.6-3.3M7.7 13.4l8.6 3.3',
    notice: 'M4 10v4h3l5 4V6L7 10H4zM16 9a4 4 0 0 1 0 6',
    divider: 'M4 12h16M8 7h8M8 17h8',
    cards: 'M4 4h7v9H4zM13 4h7v9h-7zM4 16h7M13 16h7M4 19h5M13 19h5',
    gallery: 'M3 7h13v11H3zM6 4h15v11',
    features: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  };
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
    schema: null, me: null, app: null, doc: null, stats: null, plan: null,
    selected: null, previewing: false,
    saveTimer: 0, saving: false, pendingSave: false,
  };

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

  function confirmBox(message, cb) {
    if (tg && tg.showConfirm && tg.initData) tg.showConfirm(message, ok => ok && cb());
    else if (window.confirm(message)) cb();
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

  function failed(err) {
    if (err.status === 402) { upsellSheet(err.message); return; }
    notify('error');
    toast(err.message, true);
  }

  /* ---------- صفحه‌ها ---------- */
  function show(id) {
    ['onboard', 'editor', 'blocked'].forEach(s => { $(s).hidden = s !== id; });
    const boot = $('boot');
    if (boot) { boot.classList.add('out'); setTimeout(() => boot.remove(), 350); }
    if (tg && tg.BackButton) {
      if (id === 'onboard' && S.app) tg.BackButton.show(); else tg.BackButton.hide();
    }
  }

  /* ===== شروع: صفحهٔ خالی و اسم ===== */
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
        await openApp(res.app.id);
      } catch (err) {
        failed(err);
      } finally {
        go.textContent = 'شروع ساخت';
        input.oninput();
      }
    };
    setTimeout(() => input.focus(), 350);
  }

  /* ===== ادیتور ===== */
  async function openApp(id) {
    const res = await api('app?id=' + encodeURIComponent(id));
    S.app = res.app;
    S.doc = res.doc;
    S.stats = res.stats;
    S.plan = res.plan;
    S.selected = null;
    show('editor');
    renderBar();
    renderCanvas();
    try { localStorage.setItem('es-last-app', String(id)); } catch (e) {}
  }

  function renderBar() {
    $('bar-name').textContent = S.app.name;
    $('bar-initial').textContent = (S.app.name || '؟').trim().charAt(0);
    const live = !!S.app.published_at;
    const st = $('bar-status');
    st.querySelector('span').textContent = !live ? 'پیش‌نویس · منتشر نشده' : (S.app.dirty ? 'تغییرات منتشر نشده' : 'منتشر شده');
    st.classList.toggle('live', live && !S.app.dirty);
    document.querySelector('.dock-publish').classList.toggle('dirty', !!S.app.dirty || !live);
  }

  let renderQueued = false;
  function renderCanvas() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      ES.render($('canvas'), S.doc, {
        editing: !S.previewing,
        selected: S.previewing ? null : S.selected,
        onPick: id => { if (!S.previewing) { haptic(); editBlock(id); } },
        branding: S.plan && S.plan.branding ? { bot: S.me.bot } : null,
      });
      $('empty').hidden = S.doc.blocks.length > 0 || S.previewing;
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
    const el = $('save');
    el.className = 'caption save ' + state;
    el.querySelector('span').textContent = { busy: 'در حال ذخیره…', err: 'ذخیره نشد', '': 'ذخیره شد' }[state];
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
      renderBar();
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
  function openSheet(build, onClose) {
    const sheet = $('sheet');
    sheet.textContent = '';
    sheet.appendChild(h('div', 'grip'));
    build(sheet);
    sheet.scrollTop = 0;
    sheet.classList.add('on');
    $('scrim').classList.add('on');
    sheetClose = onClose || null;
    if (tg && tg.BackButton) tg.BackButton.show();
  }
  function closeSheet() {
    $('sheet').classList.remove('on');
    $('scrim').classList.remove('on');
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

  /* ---------- فرم‌ساز (Field / Segmented / ItemList) از روی اسکیما ---------- */
  let fieldSeq = 0;
  function control(field, value, onChange) {
    const opts = (field.options || []).map(o => Array.isArray(o) ? o : [o, o]);
    if (field.type === 'select') {
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
      input.type = (field.type === 'url' || field.type === 'image') ? 'url' : 'text';
      if (input.type === 'url') { input.classList.add('ltr'); input.placeholder = 'https://'; input.inputMode = 'url'; }
    }
    input.id = id;
    if (field.max) input.maxLength = field.max;
    input.value = value == null ? '' : value;
    wrap.appendChild(input);
    // شمارنده فقط وقتی به ۸۰٪ سقف رسید
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
          body.appendChild(control(sub, it[sub.key], v => {
            it[sub.key] = v;
            title.textContent = titleOf(it);
            onChange(items);
          }));
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
  function editBlock(id) {
    const block = S.doc.blocks.find(b => b.id === id);
    if (!block) return;
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
        b.appendChild(ico(name));
        b.addEventListener('click', fn);
        tools.appendChild(b);
        return b;
      };
      const indexOf = () => S.doc.blocks.findIndex(b => b.id === id);
      const move = d => {
        const i = indexOf(), j = i + d;
        if (j < 0 || j >= S.doc.blocks.length) return;
        S.doc.blocks.splice(j, 0, S.doc.blocks.splice(i, 1)[0]);
        haptic();
        changed();
        refreshMoves();
        scrollToBlock(id);
      };
      const upBtn = tool('up', 'بالا', () => move(-1));
      const downBtn = tool('down', 'پایین', () => move(1));
      const refreshMoves = () => {
        const i = indexOf();
        upBtn.disabled = i <= 0;
        downBtn.disabled = i >= S.doc.blocks.length - 1;
      };
      refreshMoves();
      tool('copy', 'تکثیر', () => {
        if (S.doc.blocks.length >= S.plan.max_blocks) { closeSheet(); upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
        const copy = JSON.parse(JSON.stringify(S.doc.blocks[indexOf()]));
        copy.id = newId();
        S.doc.blocks.splice(indexOf() + 1, 0, copy);
        haptic('medium');
        changed();
        closeSheet();
        toast('کامپوننت تکثیر شد');
        setTimeout(() => editBlock(copy.id), 280);
      });
      tool('trash', 'حذف', () => {
        confirmBox('این کامپوننت حذف بشه؟', () => {
          S.doc.blocks = S.doc.blocks.filter(b => b.id !== id);
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
    }, () => {
      S.selected = null;
      renderCanvas();
      saveNow();
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
        `${S.doc.blocks.length} از ${S.plan.max_blocks} کامپوننت · پلن ${S.plan.title}`);
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
          if (locked) { cap.appendChild(ico('lock')); cap.appendChild(document.createTextNode('پلن حرفه‌ای')); }
          else cap.textContent = spec.desc;
          b.appendChild(cap);
          if (spec.premium) b.appendChild(h('span', 'pro', 'PRO'));
          b.addEventListener('click', () => {
            if (locked) { closeSheet(); upsellSheet(`«${spec.title}» مخصوص پلن‌های حرفه‌ای است.`); return; }
            if (S.doc.blocks.length >= S.plan.max_blocks) { closeSheet(); upsellSheet(`پلن ${S.plan.title} حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
            const props = {};
            spec.fields.forEach(f => { props[f.key] = JSON.parse(JSON.stringify(f.default === undefined ? '' : f.default)); });
            const block = { id: newId(), type, props };
            const at = S.selected ? S.doc.blocks.findIndex(x => x.id === S.selected) + 1 : S.doc.blocks.length;
            S.doc.blocks.splice(at, 0, block);
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
    });
  }

  /* ---------- ظاهر (SwatchPicker + Segmented) ---------- */
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
        if (!preset) { custom.style.background = theme.accent; }
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
      [
        ['mode', 'حالت', [['auto', 'خودکار'], ['light', 'روشن'], ['dark', 'تیره']]],
        ['bg', 'پس‌زمینه', [['tint', 'رنگی'], ['plain', 'ساده']]],
        ['radius', 'گوشه‌ها', [['soft', 'نرم'], ['round', 'گرد'], ['sharp', 'تیز']]],
      ].forEach(([key, label, options]) => {
        sheet.appendChild(control({ type: 'select', label, options }, theme[key], v => set(key, v)));
      });
    }, saveNow);
  }

  /* ---------- پیش‌نمایش ---------- */
  function preview(on) {
    S.previewing = on;
    S.selected = null;
    $('editor').classList.toggle('previewing', on);
    $('exit-preview').hidden = !on;
    if (tg && tg.BackButton) { if (on) tg.BackButton.show(); else tg.BackButton.hide(); }
    haptic();
    renderCanvas();
  }

  /* ---------- انتشار ---------- */
  async function publish() {
    if (!S.doc.blocks.length) { toast('اول حداقل یک کامپوننت اضافه کن', true); notify('warning'); return; }
    const btn = document.querySelector('.dock-publish');
    btn.disabled = true;
    clearTimeout(S.saveTimer);
    try {
      const res = await api('app/publish', { id: S.app.id, doc: S.doc });
      S.app = res.app;
      S.doc = res.doc;
      renderBar();
      renderCanvas();
      setSave('');
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
      const b = h('b', 'body-strong ltr', '@' + S.app.bot_username);
      g.append(b, h('span', 'caption', S.app.mode === 'full' ? 'کنترل کامل · /start هم جواب می‌ده' : 'دکمه منو · مینی‌اپ روی ربات فعال است'));
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
        view.href = BASE + 'a/demo';
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
      ['۳ مینی‌اپ، تا ۴۰ کامپوننت', 'کارت محصول، گالری و ویژگی‌ها', 'بدون نشان «ساخته شده با ایزی‌ساز»'].forEach(t => {
        const li = h('li');
        li.append(ico('check'), document.createTextNode(t));
        ul.appendChild(li);
      });
      const buy = h('button', 'btn primary block', 'دیدن پلن‌ها در ربات');
      buy.addEventListener('click', () => openBot('plans'));
      card.append(head, ul, buy);
      sheet.appendChild(card);
    });
  }

  /* ---------- برگهٔ اپ (StatStrip + BotLink + PlanCard) ---------- */
  function appSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'brand', 'sparkle', S.app.name, S.app.bot_username ? '@' + S.app.bot_username : 'هنوز به رباتی وصل نشده');

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
          renderBar();
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

      const planSec = h('div', 'sh-sec');
      const plan = h('div', 'plan current');
      const head = h('div', 'plan-head');
      head.append(h('b', 'title-2', 'پلن ' + S.plan.title), h('span', 'pill label', 'پلن فعلی تو'));
      const ul = h('ul', 'body');
      [`${S.doc.blocks.length} از ${S.plan.max_blocks} کامپوننت`, `${S.me.apps.length} از ${S.plan.max_apps} مینی‌اپ`].forEach(t => {
        const li = h('li'); li.append(ico('check'), document.createTextNode(t)); ul.appendChild(li);
      });
      plan.append(head, ul);
      if (S.plan.key === 'free') {
        const up = h('button', 'btn primary block', 'ارتقا');
        up.addEventListener('click', () => { closeSheet(); upsellSheet(''); });
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
        closeSheet();
        if (S.me.apps.length >= S.me.plan.max_apps) {
          upsellSheet(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد.`);
          return;
        }
        onboard();
      });
      appsSec.appendChild(more);
      sheet.appendChild(appsSec);
    });
  }

  /* ---------- اتصال رویدادها ---------- */
  function wire() {
    document.querySelectorAll('[data-icon]').forEach(el => el.appendChild(ico(el.dataset.icon)));
    $('scrim').addEventListener('click', closeSheet);
    $('bar-app').addEventListener('click', () => { haptic(); appSheet(); });
    $('empty-add').addEventListener('click', () => { haptic(); addSheet(); });
    $('exit-preview').addEventListener('click', () => preview(false));
    $('demo-link').addEventListener('click', e => { e.preventDefault(); location.hash = '#demo'; location.reload(); });
    document.querySelectorAll('.dock button').forEach(b => {
      b.addEventListener('click', () => {
        haptic();
        ({ add: addSheet, theme: themeSheet, preview: () => preview(true), publish })[b.dataset.act]();
      });
    });
    if (tg) {
      tg.BackButton.onClick(() => {
        if ($('sheet').classList.contains('on')) closeSheet();
        else if (S.previewing) preview(false);
        else if (!$('onboard').hidden && S.app) show('editor');
      });
      tg.onEvent('themeChanged', () => { applyChrome(); if (S.doc) renderCanvas(); });
      tg.onEvent('safeAreaChanged', applyChrome);
      tg.onEvent('contentSafeAreaChanged', applyChrome);
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyChrome(); if (S.doc) renderCanvas(); });
    // ذخیرهٔ فوری قبل از بسته شدن
    document.addEventListener('visibilitychange', () => { if (document.hidden && S.app && $('save').classList.contains('busy')) saveNow(); });
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
      const [schema, me] = await Promise.all([
        DEMO ? fetch(BASE + 'api/schema').then(r => r.json()) : api('schema'),
        api('me'),
      ]);
      S.schema = schema;
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
