/* ایزی‌ساز — رندرر صفحهٔ مینی‌اپ
   یک موتور برای دو جا: مینی‌اپ منتشرشده (page.js) و بوم ادیتور (panel.js).
   مشخصات هر کامپوننت از سیستم طراحی «ایزی‌ساز — کاشی» است (گروه «صفحهٔ مینی‌اپ»).

   رنگ: فقط توکن‌های --pg-*. پیش‌فرض‌ها در tokens.css هستند و palette()
   آن‌ها را از رنگ اصلی صاحب مینی‌اپ روی ریشهٔ صفحه بازنویسی می‌کند.

   امنیت: هیچ رشته‌ای از کاربر وارد innerHTML نمی‌شود. همه چیز با
   createElement و textContent ساخته می‌شود و لینک‌ها دوباره از safeUrl
   رد می‌شوند (سرور هم قبلاً پاکشان کرده). SVG ها ثابت و مال خودمان است. */
(function () {
  'use strict';

  const tg = window.Telegram && window.Telegram.WebApp;

  /* ---------- رنگ ---------- */
  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return [42, 99, 245];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }
  function luminance(hex) {
    const c = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function mix(a, b, t) {
    const x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }
  function alpha(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  function isDark(mode) {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    if (tg && tg.colorScheme) return tg.colorScheme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* قانون رنگ صفحهٔ کاربر (README سیستم طراحی، «رنگ صفحهٔ کاربر»):
     از یک pg-accent همهٔ رنگ‌ها ساخته می‌شوند و خوانایی تضمین است. */
  const BASE = {
    light: { bg: '#F4F6FA', surface: '#FFFFFF', ink: '#0E1525', ink2: '#4A5468', ink3: '#667085', line: 'rgba(14,21,37,0.10)' },
    dark: { bg: '#0A0E16', surface: '#141A25', ink: '#F2F5FA', ink2: '#B0B9C9', ink3: '#8A94A7', line: 'rgba(255,255,255,0.09)' },
  };
  const RADIUS = { soft: 18, round: 26, sharp: 8 };

  function palette(theme) {
    theme = theme || {};
    const dark = isDark(theme.mode);
    let accent = /^#[0-9a-f]{6}$/i.test(theme.accent || '') ? theme.accent : '#2A63F5';
    let [h, s, l] = rgbToHsl(...hexToRgb(accent));
    if (dark && l < 52) accent = hslToHex(h, s, Math.min(64, l + 14));
    if (!dark && l > 62) accent = hslToHex(h, s, 52);
    [h, s, l] = rgbToHsl(...hexToRgb(accent));
    const base = dark ? BASE.dark : BASE.light;
    const bg = theme.bg === 'plain' ? base.bg : mix(base.bg, accent, dark ? 0.06 : 0.05);
    // تب فعال نوار شناور روی زمینهٔ تیره؛ رنگ اصلی خیلی تیره آنجا گم می‌شود
    const tabBg = dark ? '#1B2230' : '#0E1525';
    const onAccent = contrast(accent, '#FFFFFF') >= contrast(accent, '#0E1525') ? '#FFFFFF' : '#0E1525';
    const tabLost = contrast(accent, tabBg) < 2;
    const radius = theme.radius === 'custom'
      ? Math.max(0, Math.min(32, Number(theme.radius_px) || 0))
      : (RADIUS[theme.radius] || RADIUS.soft);
    return {
      dark,
      bg,
      vars: {
        '--pg-accent': accent,
        '--pg-on-accent': onAccent,
        '--pg-accent-ink': dark ? hslToHex(h, Math.min(100, s), 76) : hslToHex(h, Math.min(100, s + 6), Math.max(26, l - 12)),
        '--pg-soft': alpha(accent, dark ? 0.16 : 0.10),
        '--pg-bg': bg,
        '--pg-surface': base.surface,
        '--pg-ink': base.ink,
        '--pg-ink-2': base.ink2,
        '--pg-ink-3': base.ink3,
        '--pg-line': base.line,
        '--pg-radius': radius + 'px',
        '--pg-tab-bg': tabBg,
        '--pg-tab-on': tabLost ? '#FFFFFF' : accent,
        '--pg-tab-on-ink': tabLost ? accent : onAccent,
      },
    };
  }

  /* رنگ اختصاصی یک کامپوننت: همان قانون، فقط برای متغیرهای رنگ اصلی */
  function accentVars(accent, dark) {
    if (!/^#[0-9a-f]{6}$/i.test(accent || '')) return null;
    let [h, s, l] = rgbToHsl(...hexToRgb(accent));
    if (dark && l < 52) accent = hslToHex(h, s, Math.min(64, l + 14));
    if (!dark && l > 62) accent = hslToHex(h, s, 52);
    [h, s, l] = rgbToHsl(...hexToRgb(accent));
    return {
      '--pg-accent': accent,
      '--pg-on-accent': contrast(accent, '#FFFFFF') >= contrast(accent, '#0E1525') ? '#FFFFFF' : '#0E1525',
      '--pg-accent-ink': dark ? hslToHex(h, Math.min(100, s), 76) : hslToHex(h, Math.min(100, s + 6), Math.max(26, l - 12)),
      '--pg-soft': alpha(accent, dark ? 0.16 : 0.10),
    };
  }

  function applyTheme(el, theme) {
    const p = palette(theme);
    for (const [k, v] of Object.entries(p.vars)) el.style.setProperty(k, v);
    el.classList.toggle('pg-dark', p.dark);
    return p;
  }

  /* ---------- ابزار DOM ---------- */
  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== '') e.textContent = text;
    return e;
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICONS = {
    arrow: 'M15 6l-6 6 6 6',
    chev: 'M6 9l6 6 6-6',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5v.01',
    notice: 'M4 10v4h3l5 4V6L7 10H4zM16 9a4 4 0 0 1 0 6',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    telegram: 'M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l9-6-7 8',
    instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17.3 6.7v.01',
    whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20zM9 9c0 3 2 5 5 6l1.3-1.3L13.5 12.5 12.6 13.4c-.9-.4-1.6-1.1-2-2l.9-.9L10.3 8.7 9 9z',
    youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8zM10 9l5 3-5 3V9z',
    x: 'M4 4l16 16M20 4L4 20',
    website: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    email: 'M3 6h18v12H3zM3 7l9 6 9-6',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    // آیکن صفحه‌ها (نوار پایین)
    home: 'M3 10.5 12 3l9 7.5V21H3z',
    menu: 'M4 6h16M4 12h16M4 18h10',
    shop: 'M3 9h18l-1.5 11H4.5zM8 9V6a4 4 0 0 1 8 0v3',
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.01',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12z',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  };
  function icon(name, cls, size) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'pg-ico ' + (cls || ''));
    if (size) { s.setAttribute('width', size); s.setAttribute('height', size); }
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', ICONS[name] || ICONS.spark);
    s.appendChild(p);
    return s;
  }

  /* نقش کاشی سربرگ: چهار مربع گرد ۲×۲ */
  function tileMotif() {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 132 132');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'pg-motif');
    [[0, 0], [72, 0], [0, 72], [72, 72]].forEach(([x, y]) => {
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y);
      r.setAttribute('width', 60); r.setAttribute('height', 60); r.setAttribute('rx', 16);
      s.appendChild(r);
    });
    return s;
  }

  function safeUrl(url, images) {
    if (typeof url !== 'string') return '';
    url = url.trim();
    const low = url.toLowerCase();
    if (low.startsWith('https://')) return url;
    if (images && /^data:image\/(png|jpeg|webp);base64,/.test(low)) return url;
    if (!images && (low.startsWith('http://') || low.startsWith('tel:') || low.startsWith('mailto:'))) return url;
    return '';
  }

  function socialHref(kind, value) {
    const v = (value || '').trim();
    if (!v) return '';
    if (kind === 'phone') { const d = v.replace(/[^\d+]/g, ''); return d ? 'tel:' + d : ''; }
    if (kind === 'email') return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? 'mailto:' + v : '';
    if (/^https?:\/\//i.test(v)) return safeUrl(v);
    let handle = v.replace(/^@/, '');
    const base = { telegram: 'https://t.me/', instagram: 'https://instagram.com/', youtube: 'https://youtube.com/@', x: 'https://x.com/', whatsapp: 'https://wa.me/' }[kind];
    if (kind === 'whatsapp') handle = handle.replace(/[^\d]/g, '');
    if (base && /^[A-Za-z0-9_.]{1,64}$/.test(handle)) return base + handle;
    if (kind === 'website') return 'https://' + v;
    return '';
  }

  /* لینک‌ها داخل تلگرام باید با API خودش باز شوند، وگرنه مینی‌اپ بسته
     می‌شود یا لینک t.me داخل وب‌ویو گیر می‌کند. */
  function openUrl(url) {
    if (!url) return;
    try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
    if (tg && /^https:\/\/(t|telegram)\.me\//i.test(url)) { tg.openTelegramLink(url); return; }
    if (tg && /^https?:\/\//i.test(url)) { tg.openLink(url); return; }
    window.location.href = url;
  }

  function linkEl(tag, cls, url, ctx) {
    const e = h(tag, cls);
    const href = safeUrl(url);
    if (href) {
      e.setAttribute('role', 'link');
      e.tabIndex = 0;
      e.addEventListener('click', ev => {
        if (ctx.editing) return; // در ادیتور زدن یعنی انتخاب کامپوننت
        ev.preventDefault();
        openUrl(href);
      });
    } else {
      e.classList.add('pg-nolink');
    }
    return e;
  }

  function imageEl(src, cls, ctx) {
    const url = safeUrl(src, true);
    const wrap = h('div', 'pg-img ' + (cls || ''));
    if (url) {
      const img = h('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', () => wrap.classList.add('pg-loaded'));
      img.addEventListener('error', () => { wrap.classList.add('pg-empty'); img.remove(); wrap.appendChild(icon('image')); });
      img.src = url;
      wrap.appendChild(img);
    } else {
      wrap.classList.add('pg-empty');
      wrap.appendChild(icon('image'));
      if (ctx.editing) wrap.appendChild(h('span', 'pg-img-hint', 'یک تصویر آپلود کن'));
    }
    return wrap;
  }

  /* ---------- کامپوننت‌ها (مشخصات: سیستم طراحی، گروه «صفحهٔ مینی‌اپ») ---------- */
  const R = {};

  R.hero = (p, ctx) => {
    const style = p.style === 'gradient' ? 'solid' : (p.style || 'solid');
    const e = h('section', `pg-herobox pg-herobox--${style} pg-align-${p.align || 'center'}`);
    if (style === 'solid') e.appendChild(tileMotif());
    const inner = h('div', 'pg-herobox-in');
    if (safeUrl(p.image, true)) inner.appendChild(imageEl(p.image, 'pg-logo', ctx));
    inner.appendChild(h('h1', 'pg-hero-title', p.title));
    if (p.subtitle) inner.appendChild(h('p', 'pg-hero-sub', p.subtitle));
    e.appendChild(inner);
    return e;
  };

  R.text = p => {
    const e = h('section', `pg-card pg-text pg-align-${p.align || 'start'}`);
    if (p.title) e.appendChild(h('h2', 'pg-h2', p.title));
    if (p.body) e.appendChild(h('p', 'pg-body', p.body));
    return e;
  };

  R.button = (p, ctx) => {
    const style = p.style || 'primary';
    const e = linkEl('a', `pg-btn pg-btn--${style}`, p.url, ctx);
    e.appendChild(h('span', '', p.label || '…'));
    e.appendChild(icon('arrow'));
    return e;
  };

  R.links = (p, ctx) => {
    const e = h('section', 'pg-links');
    (p.items || []).forEach(it => {
      const row = linkEl('a', 'pg-link', it.url, ctx);
      const tile = h('span', 'pg-link-tile');
      tile.appendChild(icon(/^https:\/\/(t|telegram)\.me\//i.test(it.url || '') ? 'telegram' : 'website'));
      const txt = h('span', 'pg-link-txt');
      txt.appendChild(h('b', '', it.label));
      if (it.note) txt.appendChild(h('small', '', it.note));
      row.append(tile, txt, icon('arrow', 'pg-link-go'));
      e.appendChild(row);
    });
    return e;
  };

  R.image = (p, ctx) => {
    const e = h('figure', 'pg-figure');
    const img = imageEl(p.src, 'pg-ratio', ctx);
    img.dataset.ratio = p.ratio || '16:9';
    e.appendChild(img);
    if (p.caption) e.appendChild(h('figcaption', '', p.caption));
    return e;
  };

  R.faq = p => {
    const e = h('section', 'pg-card pg-faq');
    if (p.title) e.appendChild(h('h2', 'pg-h2', p.title));
    (p.items || []).forEach(it => {
      const d = h('details', 'pg-qa');
      const s = h('summary');
      s.appendChild(h('span', '', it.q));
      s.appendChild(icon('chev', 'pg-qa-ico'));
      d.appendChild(s);
      if (it.a) d.appendChild(h('p', 'pg-qa-a', it.a));
      d.addEventListener('toggle', () => { try { tg && tg.HapticFeedback.selectionChanged(); } catch (x) {} });
      e.appendChild(d);
    });
    return e;
  };

  R.social = (p, ctx) => {
    const e = h('section', 'pg-social');
    (p.items || []).forEach(it => {
      const a = linkEl('a', 'pg-soc', socialHref(it.kind, it.value), ctx);
      a.setAttribute('aria-label', it.kind);
      a.appendChild(icon(it.kind));
      e.appendChild(a);
    });
    return e;
  };

  R.notice = p => {
    const e = h('section', `pg-notice pg-notice--${p.tone || 'accent'}`);
    e.appendChild(icon('notice'));
    e.appendChild(h('p', '', p.text));
    return e;
  };

  R.divider = p => h('hr', `pg-div pg-div--${p.style || 'line'}`);

  R.cards = (p, ctx) => {
    const e = h('section', 'pg-group');
    if (p.title) e.appendChild(h('h2', 'pg-h2 pg-h2--out', p.title));
    const grid = h('div', `pg-cards pg-cards--${p.layout || 'grid'}`);
    (p.items || []).forEach(it => {
      const c = h('article', 'pg-pcard');
      c.appendChild(imageEl(it.image, 'pg-pcard-img', ctx));
      const body = h('div', 'pg-pcard-b');
      body.appendChild(h('h3', '', it.title));
      if (it.desc) body.appendChild(h('p', '', it.desc));
      const foot = h('div', 'pg-pcard-f');
      if (it.price) foot.appendChild(h('span', 'pg-price', it.price));
      if (safeUrl(it.url)) {
        const b = linkEl('a', 'pg-mini-btn', it.url, ctx);
        b.textContent = it.cta || 'سفارش';
        foot.appendChild(b);
      }
      body.appendChild(foot);
      c.appendChild(body);
      grid.appendChild(c);
    });
    e.appendChild(grid);
    return e;
  };

  R.pricing = (p, ctx) => {
    const e = h('section', 'pg-group');
    if (p.title) e.appendChild(h('h2', 'pg-h2 pg-h2--out', p.title));
    const list = h('div', 'pg-plans');
    (p.items || []).forEach(it => {
      const c = h('article', 'pg-plan' + (it.badge ? ' pg-plan--hot' : ''));
      const head = h('div', 'pg-plan-h');
      head.appendChild(h('b', 'pg-plan-name', it.name));
      if (it.badge) head.appendChild(h('span', 'pg-plan-badge', it.badge));
      c.appendChild(head);
      const price = h('div', 'pg-plan-price');
      price.appendChild(h('b', '', it.price));
      if (it.period) price.appendChild(h('span', '', it.period));
      c.appendChild(price);
      const lines = String(it.features || '').split('\n').map(x => x.trim()).filter(Boolean);
      if (lines.length) {
        const ul = h('ul', 'pg-plan-feats');
        lines.forEach(t => { const li = h('li'); li.append(icon('check'), h('span', '', t)); ul.appendChild(li); });
        c.appendChild(ul);
      }
      const b = linkEl('a', 'pg-btn ' + (it.badge ? 'pg-btn--primary' : 'pg-btn--soft'), it.url, ctx);
      b.appendChild(h('span', '', it.cta || 'خرید'));
      c.appendChild(b);
      list.appendChild(c);
    });
    e.appendChild(list);
    return e;
  };

  R.gallery = (p, ctx) => {
    const e = h('section', 'pg-gallery');
    const track = h('div', 'pg-gal-track');
    (p.items || []).forEach(it => {
      const f = h('figure', 'pg-gal-item');
      f.appendChild(imageEl(it.src, '', ctx));
      if (it.caption) f.appendChild(h('figcaption', '', it.caption));
      track.appendChild(f);
    });
    e.appendChild(track);
    return e;
  };

  R.features = p => {
    const e = h('section', 'pg-group');
    if (p.title) e.appendChild(h('h2', 'pg-h2 pg-h2--out', p.title));
    const grid = h('div', 'pg-feats');
    (p.items || []).forEach(it => {
      const c = h('div', 'pg-feat');
      c.appendChild(h('span', 'pg-feat-emo', it.emoji || '✨'));
      c.appendChild(h('b', '', it.title));
      if (it.desc) c.appendChild(h('small', '', it.desc));
      grid.appendChild(c);
    });
    e.appendChild(grid);
    return e;
  };

  /* سند نسخهٔ ۱ ({blocks}) را به شکل نسخهٔ ۲ درمی‌آورد */
  function normalize(doc) {
    doc = doc || {};
    if (Array.isArray(doc.pages) && doc.pages.length) return doc;
    return Object.assign({}, doc, {
      header: doc.header || { enabled: false },
      tabbar: doc.tabbar || { enabled: false },
      pages: [{ id: 'home', title: 'خانه', icon: 'home', blocks: doc.blocks || [] }],
    });
  }

  /* ---------- سربرگ مینی‌اپ ---------- */
  function renderHeader(hd, ctx, fallbackTitle) {
    const e = h('header', `pg-header pg-header--${hd.style || 'bar'} pg-align-${hd.align || 'start'}`);
    const inner = h('div', 'pg-header-in');
    if (safeUrl(hd.logo, true)) inner.appendChild(imageEl(hd.logo, 'pg-header-logo', ctx));
    const txt = h('div', 'pg-header-txt');
    txt.appendChild(h('b', '', hd.title || fallbackTitle || ''));
    if (hd.subtitle) txt.appendChild(h('small', '', hd.subtitle));
    inner.appendChild(txt);
    e.appendChild(inner);
    return e;
  }

  /* ---------- نوار پایین (تب‌ها = صفحه‌ها) ---------- */
  function renderTabbar(doc, current, onNavigate) {
    const style = (doc.tabbar && doc.tabbar.style) || 'floating';
    const nav = h('nav', `pg-tabbar pg-tabbar--${style}`);
    nav.setAttribute('aria-label', 'صفحه‌ها');
    doc.pages.forEach(pg => {
      const on = pg.id === current;
      const b = h('button', 'pg-tab' + (on ? ' pg-tab--on' : ''));
      b.type = 'button';
      b.setAttribute('aria-label', pg.title);
      if (on) b.setAttribute('aria-current', 'page');
      b.appendChild(icon(pg.icon || 'star'));
      b.appendChild(h('span', 'pg-tab-label', pg.title));
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        try { tg && tg.HapticFeedback.selectionChanged(); } catch (e) {}
        onNavigate && onNavigate(pg.id);
      });
      nav.appendChild(b);
    });
    return nav;
  }

  function applyBlockStyle(wrap, st, dark) {
    st = st || {};
    wrap.classList.add('pg-box--' + (st.box || 'auto'), 'pg-pad--' + (st.pad || 'md'));
    if (st.radius != null && st.radius !== '') wrap.style.setProperty('--pg-radius', Number(st.radius) + 'px');
    const av = accentVars(st.accent, dark);
    if (av) for (const [k, v] of Object.entries(av)) wrap.style.setProperty(k, v);
  }

  /* رندر کل مینی‌اپ (یک صفحه از آن).
     opts.page         : آیدی صفحهٔ فعلی (پیش‌فرض صفحهٔ اول)
     opts.onNavigate(id): زدن روی تب نوار پایین
     opts.editing      : حالت ادیتور (زدن = انتخاب، لینک‌ها باز نمی‌شوند)
     opts.onPick(id)   : زدن روی یک کامپوننت در ادیتور
     opts.onPickHeader : زدن روی سربرگ در ادیتور
     opts.selected     : آیدی کامپوننت انتخاب‌شده (قاب BlockFrame) یا 'header'
     opts.appName      : عنوان پیش‌فرض سربرگ
     opts.branding     : {bot} برای نشان «ساخته شده با ایزی‌ساز»
     opts.fixedChrome  : سربرگ و نوار پایین به پنجره بچسبند (صفحهٔ منتشرشده) */
  function render(root, rawDoc, opts) {
    opts = opts || {};
    const ctx = { editing: !!opts.editing };
    const doc = normalize(rawDoc);
    root.textContent = '';
    root.classList.add('pg-page');
    const pal = applyTheme(root, doc.theme);
    const page = doc.pages.find(p => p.id === opts.page) || doc.pages[0];
    const hasTabs = !!(doc.tabbar && doc.tabbar.enabled && doc.pages.length > 1);
    root.classList.toggle('pg-has-tabs', hasTabs);
    root.classList.toggle('pg-fixed', !!opts.fixedChrome);

    if (doc.header && doc.header.enabled) {
      const hd = renderHeader(doc.header, ctx, opts.appName);
      if (ctx.editing) {
        hd.classList.add('pg-editable');
        if (opts.selected === 'header') { hd.classList.add('pg-selected'); hd.appendChild(h('span', 'pg-selected-tag', 'ویرایش')); }
        hd.addEventListener('click', ev => { ev.preventDefault(); opts.onPickHeader && opts.onPickHeader(); });
      }
      root.appendChild(hd);
    }

    const list = h('div', 'pg-blocks');
    (page.blocks || []).forEach((b, i) => {
      const fn = R[b.type];
      if (!fn) return;
      let node;
      try { node = fn(b.props || {}, ctx); } catch (e) { return; }
      const wrap = h('div', 'pg-block pg-t-' + b.type);
      wrap.dataset.id = b.id;
      wrap.dataset.type = b.type;
      wrap.style.setProperty('--i', i);
      applyBlockStyle(wrap, b.style, pal.dark);
      wrap.appendChild(node);
      if (ctx.editing) {
        wrap.classList.add('pg-editable');
        if (opts.selected === b.id) {
          wrap.classList.add('pg-selected');
          wrap.appendChild(h('span', 'pg-selected-tag', 'ویرایش'));
        }
        wrap.addEventListener('click', ev => { ev.preventDefault(); opts.onPick && opts.onPick(b.id); });
      }
      list.appendChild(wrap);
    });
    root.appendChild(list);

    if (opts.branding && list.childElementCount) {
      const bot = opts.branding.bot || 'EasySazBot';
      const badge = linkEl('a', 'pg-brand', 'https://t.me/' + bot, ctx);
      badge.appendChild(icon('spark'));
      badge.appendChild(h('span', '', 'ساخته شده با ایزی‌ساز'));
      root.appendChild(badge);
    }
    if (hasTabs) root.appendChild(renderTabbar(doc, page.id, opts.onNavigate));
    pal.page = page;
    pal.doc = doc;
    return pal;
  }

  window.EasySaz = { render, normalize, applyTheme, palette, accentVars, icon, h, openUrl, safeUrl, isDark, ICONS };
})();
