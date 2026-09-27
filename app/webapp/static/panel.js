/* EasySaz — پنل ساخت (ادیتور) داخل @EasySazBot
   جریان: بوت ← (اپ ندارد؟ صفحه خالی + انتخاب اسم) ← ادیتور.
   هر تغییر فورا روی بوم رندر می شود و با تاخیر کوتاه به عنوان پیش نویس
   ذخیره می شود. «انتشار» پیش نویس را برای بازدیدکننده ها زنده می کند. */
(function () {
  'use strict';

  const tg = window.Telegram && window.Telegram.WebApp;
  const ES = window.EasySaz;
  const BASE = document.documentElement.dataset.base || '/';
  const $ = id => document.getElementById(id);
  const h = ES.h;

  /* ---------- آیکون های پوسته ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const UI = {
    add: 'M12 5v14M5 12h14',
    theme: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-4.9-4-8.8-9-8.8zM7.5 11.5v.01M10 7.5v.01M14.5 7.5v.01',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    x: 'M6 6l12 12M18 6L6 18',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    chev: 'M6 9l6 6 6-6',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    bot: 'M5 9h14v10H5zM12 5v4M9 13v.01M15 13v.01M9 16h6M12 3.5v.01',
    plus: 'M12 5v14M5 12h14',
    // کامپوننت ها
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
    text: 'M5 6h14M5 11h14M5 16h9',
    button: 'M4 8h16v8H4zM9 12h6',
    links: 'M4 6h16M4 12h16M4 18h16M8 6v.01',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5',
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

  /* ---------- وضعیت ---------- */
  const S = {
    schema: null,
    me: null,
    app: null,       // متادیتای اپ فعلی
    doc: null,       // سند پیش نویس
    stats: null,
    plan: null,
    selected: null,
    previewing: false,
    saveTimer: 0,
    saving: false,
    pendingSave: false,
  };

  /* ---------- تلگرام ---------- */
  const haptic = (k) => { try { tg.HapticFeedback.impactOccurred(k || 'light'); } catch (e) {} };
  const notify = (k) => { try { tg.HapticFeedback.notificationOccurred(k); } catch (e) {} };

  function applyChrome() {
    const dark = tg ? tg.colorScheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--ui-bg').trim();
    if (tg) { try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); tg.setBottomBarColor && tg.setBottomBarColor(bg); } catch (e) {} }
    if (tg) {
      const sa = tg.safeAreaInset || {}, ca = tg.contentSafeAreaInset || {};
      document.documentElement.style.setProperty('--safe-t', ((sa.top || 0) + (ca.top || 0)) + 'px');
    }
  }

  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 2200);
  }

  function botLink(start) {
    const bot = (S.me && S.me.bot) || 'EasySazBot';
    return 'https://t.me/' + bot + (start ? '?start=' + start : '');
  }

  function upsell(message) {
    notify('warning');
    if (tg && tg.showPopup) {
      tg.showPopup({
        title: 'پلن حرفه‌ای',
        message: message,
        buttons: [{ id: 'plans', type: 'default', text: 'دیدن پلن‌ها' }, { type: 'cancel' }],
      }, id => { if (id === 'plans') tg.openTelegramLink(botLink('plans')); });
    } else {
      toast(message);
    }
  }

  function confirmBox(message, cb) {
    if (tg && tg.showConfirm) tg.showConfirm(message, ok => ok && cb());
    else if (window.confirm(message)) cb();
  }

  /* ---------- API ---------- */
  async function api(path, body) {
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
    if (err.status === 402) { upsell(err.message); return; }
    notify('error');
    toast(err.message);
  }

  /* ---------- صفحه ها ---------- */
  function show(id) {
    ['onboard', 'editor', 'blocked'].forEach(s => { $(s).hidden = s !== id; });
    const boot = $('boot');
    if (boot) {
      boot.classList.add('out');
      setTimeout(() => boot.remove(), 400);
    }
    if (tg && tg.BackButton) {
      // از صفحه ساخت اپ دوم می شود به ادیتور برگشت
      if (id === 'onboard' && S.app) tg.BackButton.show(); else tg.BackButton.hide();
    }
  }

  /* ===== شروع: صفحه خالی و اسم ===== */
  function onboard() {
    show('onboard');
    const input = $('ob-name'), go = $('ob-go');
    const chips = $('ob-chips');
    chips.textContent = '';
    ['فروشگاه من', 'کافه', 'استودیو', 'آموزشگاه', 'پورتفولیو'].forEach(name => {
      const c = h('button', 'chip', name);
      c.addEventListener('click', () => { input.value = name; input.dispatchEvent(new Event('input')); haptic(); });
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
        go.disabled = false;
        go.textContent = 'شروع ساخت';
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
    $('bar-ava').textContent = (S.app.name || '?').trim().charAt(0);
    const st = $('bar-status');
    const live = !!S.app.published_at;
    st.textContent = !live ? 'پیش‌نویس · منتشر نشده' : (S.app.dirty ? 'تغییرات منتشر نشده' : 'منتشر شده');
    st.classList.toggle('live', live && !S.app.dirty);
    document.querySelector('.dock .pub').classList.toggle('dirty', !!S.app.dirty || !live);
  }

  let renderQueued = false;
  function renderCanvas() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      const canvas = $('canvas');
      ES.render(canvas, S.doc, {
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
    el.className = 'save ' + state;
    el.querySelector('span').textContent = { busy: 'در حال ذخیره…', err: 'ذخیره نشد', '': 'ذخیره شد' }[state];
  }

  function scheduleSave() {
    clearTimeout(S.saveTimer);
    setSave('busy');
    S.saveTimer = setTimeout(saveNow, 900);
  }

  async function saveNow() {
    clearTimeout(S.saveTimer);
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

  /* ---------- شیت ---------- */
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

  function sheetHead(parent, iconName, title, sub) {
    const head = h('div', 'sh-head');
    const i = h('div', 'sh-ico');
    i.appendChild(ico(iconName));
    const t = h('div', 'sh-title');
    t.appendChild(h('h3', '', title));
    if (sub) t.appendChild(h('p', '', sub));
    const x = h('button', 'sh-x');
    x.setAttribute('aria-label', 'بستن');
    x.appendChild(ico('x'));
    x.addEventListener('click', closeSheet);
    head.append(i, t, x);
    parent.appendChild(head);
  }

  /* ---------- فرم ساز (از روی اسکیما) ---------- */
  function control(field, value, onChange) {
    const opts = (field.options || []).map(o => Array.isArray(o) ? o : [o, o]);
    if (field.type === 'select') {
      const wrap = h('div', 'field');
      wrap.appendChild(h('span', '', field.label));
      const box = h('div', opts.length <= 4 ? 'seg' : 'pills');
      opts.forEach(([key, label]) => {
        const b = h('button', key === value ? 'on' : '', label);
        b.type = 'button';
        b.addEventListener('click', () => {
          box.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          try { tg.HapticFeedback.selectionChanged(); } catch (e) {}
          onChange(key);
        });
        box.appendChild(b);
      });
      wrap.appendChild(box);
      return wrap;
    }
    const wrap = h('label', 'field');
    wrap.appendChild(h('span', '', field.label));
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
    if (field.max) input.maxLength = field.max;
    input.value = value == null ? '' : value;
    input.addEventListener('input', () => onChange(input.value));
    wrap.appendChild(input);
    return wrap;
  }

  function listControl(field, items, onChange) {
    const wrap = h('div', 'field');
    wrap.appendChild(h('span', '', field.label));
    const box = h('div', 'items');
    wrap.appendChild(box);
    const addBtn = h('button', 'add-item', '+ افزودن ' + (field.item_label || 'مورد'));
    addBtn.type = 'button';
    wrap.appendChild(addBtn);

    const titleOf = it => {
      const f = field.fields.find(x => x.type === 'text' || x.type === 'textarea');
      return (f && it[f.key]) || field.item_label || 'مورد';
    };

    function draw(openIndex) {
      box.textContent = '';
      items.forEach((it, i) => {
        const card = h('div', 'item' + (i === openIndex ? ' open' : ''));
        const head = h('div', 'item-h');
        head.appendChild(h('span', 'n', String(i + 1)));
        const title = h('b', '', titleOf(it));
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
        chev.classList.add('open-ico');
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
    const idx = S.doc.blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const block = S.doc.blocks[idx];
    const spec = S.schema.blocks[block.type];
    S.selected = id;
    renderCanvas();
    scrollToBlock(id);

    openSheet(sheet => {
      sheetHead(sheet, spec.icon, spec.title, spec.desc);

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
      const move = d => {
        const i = S.doc.blocks.findIndex(b => b.id === id);
        const j = i + d;
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
        const i = S.doc.blocks.findIndex(b => b.id === id);
        upBtn.disabled = i <= 0;
        downBtn.disabled = i >= S.doc.blocks.length - 1;
      };
      refreshMoves();
      tool('copy', 'تکثیر', () => {
        if (S.doc.blocks.length >= S.plan.max_blocks) { upsell(`پلن فعلی تو حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
        const i = S.doc.blocks.findIndex(b => b.id === id);
        const copy = JSON.parse(JSON.stringify(S.doc.blocks[i]));
        copy.id = newId();
        S.doc.blocks.splice(i + 1, 0, copy);
        haptic('medium');
        changed();
        closeSheet();
        setTimeout(() => editBlock(copy.id), 280);
      });
      tool('trash', 'حذف', () => {
        confirmBox('این کامپوننت حذف بشه؟', () => {
          S.doc.blocks = S.doc.blocks.filter(b => b.id !== id);
          S.selected = null;
          notify('warning');
          changed();
          closeSheet();
        });
      }, 'del');
      sheet.appendChild(tools);

      const form = h('div');
      spec.fields.forEach(f => {
        if (f.type === 'list') {
          if (!Array.isArray(block.props[f.key])) block.props[f.key] = [];
          form.appendChild(listControl(f, block.props[f.key], v => { block.props[f.key] = v; changed(); }));
        } else {
          form.appendChild(control(f, block.props[f.key], v => { block.props[f.key] = v; changed(); }));
        }
      });
      sheet.appendChild(form);
    }, () => {
      S.selected = null;
      renderCanvas();
      saveNow();
    });
  }

  function scrollToBlock(id) {
    requestAnimationFrame(() => {
      const el = document.querySelector(`.es-block[data-id="${CSS.escape(id)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function newId() {
    return 'b' + Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  }

  /* ---------- افزودن کامپوننت ---------- */
  function addSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'add', 'افزودن کامپوننت', `${S.doc.blocks.length} از ${S.plan.max_blocks} کامپوننت`);
      const grid = h('div', 'cat');
      Object.entries(S.schema.blocks).forEach(([type, spec]) => {
        const locked = spec.premium && !S.plan.premium_blocks;
        const b = h('button', locked ? 'locked' : '');
        b.type = 'button';
        const ci = h('span', 'ci');
        ci.appendChild(ico(spec.icon));
        b.append(ci, h('b', '', spec.title), h('small', '', spec.desc));
        if (spec.premium) b.appendChild(h('span', 'pro', 'PRO'));
        b.addEventListener('click', () => {
          if (locked) { upsell(`«${spec.title}» مخصوص پلن‌های حرفه‌ای است.`); return; }
          if (S.doc.blocks.length >= S.plan.max_blocks) { upsell(`پلن فعلی تو حداکثر ${S.plan.max_blocks} کامپوننت دارد.`); return; }
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
      sheet.appendChild(grid);
    });
  }

  /* ---------- ظاهر ---------- */
  function themeSheet() {
    const theme = S.doc.theme;
    const set = (k, v) => { theme[k] = v; changed(); };
    openSheet(sheet => {
      sheetHead(sheet, 'theme', 'ظاهر مینی‌اپ', 'رنگ اصلی رو انتخاب کن؛ بقیه رنگ‌ها خودکار ساخته می‌شن.');

      const sec = h('div', 'sh-sec');
      sec.appendChild(h('h4', '', 'رنگ اصلی'));
      const sw = h('div', 'swatches');
      const draw = () => {
        sw.textContent = '';
        S.schema.swatches.forEach(c => {
          const b = h('button', 'sw' + (c.toLowerCase() === theme.accent.toLowerCase() ? ' on' : ''));
          b.type = 'button';
          b.style.background = c;
          b.style.color = c;
          b.setAttribute('aria-label', c);
          b.addEventListener('click', () => { set('accent', c); try { tg.HapticFeedback.selectionChanged(); } catch (e) {} draw(); });
          sw.appendChild(b);
        });
        const custom = h('label', 'sw custom' + (S.schema.swatches.some(c => c.toLowerCase() === theme.accent.toLowerCase()) ? '' : ' on'));
        custom.style.color = theme.accent;
        const input = h('input');
        input.type = 'color';
        input.value = theme.accent;
        input.addEventListener('input', () => { set('accent', input.value); });
        input.addEventListener('change', draw);
        custom.appendChild(input);
        sw.appendChild(custom);
      };
      draw();
      sec.appendChild(sw);
      sheet.appendChild(sec);

      const segs = [
        ['mode', 'حالت', [['auto', 'خودکار'], ['light', 'روشن'], ['dark', 'تیره']]],
        ['bg', 'پس‌زمینه', [['tint', 'رنگی'], ['plain', 'ساده'], ['glow', 'درخشان']]],
        ['radius', 'گوشه‌ها', [['soft', 'نرم'], ['round', 'گرد'], ['sharp', 'تیز']]],
      ];
      segs.forEach(([key, label, options]) => {
        sheet.appendChild(control({ type: 'select', label, options }, theme[key], v => set(key, v)));
      });
    }, saveNow);
  }

  /* ---------- پیش نمایش ---------- */
  function preview(on) {
    S.previewing = on;
    S.selected = null;
    $('editor').classList.toggle('previewing', on);
    $('exit-preview').hidden = !on;
    haptic();
    renderCanvas();
  }

  /* ---------- انتشار ---------- */
  async function publish() {
    if (!S.doc.blocks.length) { toast('اول حداقل یک کامپوننت اضافه کن'); notify('warning'); return; }
    const btn = document.querySelector('.dock .pub');
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
    const done = () => { notify('success'); toast('کپی شد'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => toast(text));
    else toast(text);
  }

  function linkRow(parent) {
    const row = h('div', 'row');
    const i = h('div', 'sh-ico');
    i.appendChild(ico('link'));
    const g = h('div', 'grow');
    g.appendChild(h('b', '', 'لینک مینی‌اپ'));
    const small = h('small', 'ltr', S.app.url);
    g.appendChild(small);
    const c = h('button', 'btn soft sm', 'کپی');
    c.addEventListener('click', () => copyText(S.app.url));
    row.append(i, g, c);
    parent.appendChild(row);
  }

  function publishedSheet() {
    openSheet(sheet => {
      const d = h('div', 'done');
      const di = h('div', 'done-ico');
      di.appendChild(ico('check'));
      d.append(di, h('h3', '', 'منتشر شد!'), h('p', '', S.app.bot_username ? `تغییرات روی @${S.app.bot_username} زنده است.` : 'حالا رباتت رو وصل کن تا مینی‌اپ روی اون باز بشه.'));
      sheet.appendChild(d);
      const st = h('div', 'stack');
      linkRow(st);
      if (S.app.bot_username) {
        const open = h('button', 'btn primary block', `باز کردن @${S.app.bot_username}`);
        open.addEventListener('click', () => tg && tg.openTelegramLink('https://t.me/' + S.app.bot_username));
        st.appendChild(open);
      } else {
        const connect = h('button', 'btn primary block', 'اتصال ربات');
        connect.addEventListener('click', () => { tg && tg.openTelegramLink(botLink('connect')); });
        st.appendChild(connect);
      }
      sheet.appendChild(st);
    });
  }

  /* ---------- برگه اپ ---------- */
  function appSheet() {
    openSheet(sheet => {
      sheetHead(sheet, 'sparkle', S.app.name, S.app.bot_username ? '@' + S.app.bot_username : 'هنوز به رباتی وصل نشده');

      const stats = h('div', 'stats sh-sec');
      [['visitors', 'بازدیدکننده'], ['views_today', 'بازدید امروز'], ['views_week', 'هفت روز']].forEach(([k, label]) => {
        const s = h('div', 'stat');
        s.append(h('b', '', String((S.stats && S.stats[k]) || 0)), h('small', '', label));
        stats.appendChild(s);
      });
      sheet.appendChild(stats);

      // تغییر اسم
      const nameSec = h('div', 'sh-sec');
      nameSec.appendChild(h('h4', '', 'اسم مینی‌اپ'));
      const row = h('div', 'row');
      const input = h('input');
      input.value = S.app.name;
      input.maxLength = 40;
      input.style.cssText = 'flex:1;min-width:0;border:0;outline:0;background:none;font-weight:700';
      const save = h('button', 'btn soft sm', 'ذخیره');
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

      // لینک و ربات
      const linkSec = h('div', 'sh-sec');
      linkSec.appendChild(h('h4', '', 'اتصال'));
      linkRow(linkSec);
      const botRow = h('div', 'row');
      const bi = h('div', 'sh-ico');
      bi.appendChild(ico('bot'));
      const bg = h('div', 'grow');
      bg.appendChild(h('b', '', S.app.bot_username ? '@' + S.app.bot_username : 'ربات وصل نیست'));
      bg.appendChild(h('small', '', { none: 'توکن رباتت رو در EasySaz بفرست', menu: 'حالت دکمه منو', full: 'حالت کنترل کامل' }[S.app.mode] || ''));
      const bb = h('button', 'btn soft sm', S.app.bot_username ? 'مدیریت' : 'اتصال');
      bb.addEventListener('click', () => tg && tg.openTelegramLink(botLink(S.app.bot_username ? 'myapp' : 'connect')));
      botRow.append(bi, bg, bb);
      linkSec.appendChild(botRow);
      sheet.appendChild(linkSec);

      // پلن
      const planSec = h('div', 'sh-sec');
      const card = h('div', 'plan-card');
      const g = h('div', 'grow');
      g.append(h('small', '', 'پلن فعلی'), h('b', '', S.plan.title));
      card.appendChild(g);
      const up = h('button', '', S.plan.key === 'free' ? 'ارتقا ✨' : 'پلن‌ها');
      up.addEventListener('click', () => tg && tg.openTelegramLink(botLink('plans')));
      card.appendChild(up);
      planSec.appendChild(card);
      sheet.appendChild(planSec);

      // مینی اپ های دیگر
      const appsSec = h('div', 'sh-sec');
      appsSec.appendChild(h('h4', '', 'مینی‌اپ‌های من'));
      S.me.apps.forEach(a => {
        const r = h('button', 'row');
        r.style.width = '100%';
        const ai = h('span', 'bar-ava', (a.name || '?').charAt(0));
        const ag = h('div', 'grow');
        ag.style.textAlign = 'right';
        ag.append(h('b', '', a.name), h('small', '', a.id === S.app.id ? 'در حال ویرایش' : (a.bot_username ? '@' + a.bot_username : 'بدون ربات')));
        r.append(ai, ag);
        if (a.id !== S.app.id) r.addEventListener('click', async () => { closeSheet(); await saveNow(); openApp(a.id).catch(failed); });
        appsSec.appendChild(r);
      });
      const more = h('button', 'add-item', '+ مینی‌اپ جدید');
      more.addEventListener('click', () => {
        if (S.me.apps.length >= S.me.plan.max_apps) {
          upsell(`پلن ${S.me.plan.title} فقط ${S.me.plan.max_apps} مینی‌اپ دارد. برای ساخت مینی‌اپ بیشتر، پلن بگیر.`);
          return;
        }
        closeSheet();
        onboard();
      });
      appsSec.appendChild(more);
      sheet.appendChild(appsSec);
    });
  }

  /* ---------- اتصال رویدادها ---------- */
  function wire() {
    $('scrim').addEventListener('click', closeSheet);
    $('bar-app').addEventListener('click', () => { haptic(); appSheet(); });
    $('empty-add').addEventListener('click', () => { haptic(); addSheet(); });
    $('exit-preview').addEventListener('click', () => preview(false));
    document.querySelectorAll('.dock button').forEach(b => {
      const i = b.querySelector('.di');
      if (i) i.replaceWith(ico(b.dataset.act === 'preview' ? 'eye' : b.dataset.act));
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
    // ذخیره فوری قبل از بسته شدن
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
    if (!tg || !tg.initData) { show('blocked'); return; }
    try {
      const [schema, me] = await Promise.all([api('schema'), api('me')]);
      S.schema = schema;
      S.me = me;
      if (!me.apps.length) { onboard(); return; }
      let last = 0;
      try { last = Number(localStorage.getItem('es-last-app')) || 0; } catch (e) {}
      const pick = me.apps.find(a => a.id === last) || me.apps[0];
      await openApp(pick.id);
    } catch (err) {
      $('blocked-msg').textContent = err.message;
      show('blocked');
    }
  }

  boot();
})();
