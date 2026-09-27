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

  /* کارت عبورِ صاحب مینی‌اپ: نسخهٔ عمیق رنگ اصلی (آبی عبور → سرمه‌ای)،
     لایهٔ تیره‌ترش برای قرص و ریل، و «تونل» روشن برای نقش و نقطه.
     طیف آبی تونل فیروزه‌ای می‌گیرد (مثل عبور)، بقیه روشن‌ترِ همان رنگ. */
  function deepVars(h, s) {
    const sat = Math.min(88, Math.max(30, s));
    const deep = hslToHex(h, sat, 25);
    const blue = h >= 190 && h <= 262;
    return {
      '--pg-deep': deep,
      '--pg-deep-2': hslToHex(h, sat, 17),
      '--pg-glow': blue ? hslToHex(h - 37, 88, 62) : hslToHex(h, 92, 72),
      '--pg-on-deep': '#F1F6FF',
      '--pg-on-deep-2': hslToHex(h, 70, 82),
      '--pg-shadow': `0 18px 34px -18px ${alpha(deep, 0.6)}`,
    };
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
    // زمینه، سطح و متن عبور
    light: { bg: '#EDF1F8', surface: '#FFFFFF', sunk: '#E3E9F3', ink: '#0A1633', ink2: '#3E4B69', ink3: '#56637F', line: '#D5DDEA', nav: '#0A1633' },
    dark: { bg: '#080D1C', surface: '#111933', sunk: '#19223F', ink: '#EAF0FF', ink2: '#B3BFDD', ink3: '#8A97B8', line: '#243056', nav: '#1A2448' },
  };
  const RADIUS = { soft: 18, round: 26, sharp: 8 };

  function palette(theme) {
    theme = theme || {};
    const dark = isDark(theme.mode);
    let accent = /^#[0-9a-f]{6}$/i.test(theme.accent || '') ? theme.accent : '#1D55F0';
    let [h, s, l] = rgbToHsl(...hexToRgb(accent));
    if (dark && l < 52) accent = hslToHex(h, s, Math.min(64, l + 14));
    if (!dark && l > 62) accent = hslToHex(h, s, 52);
    [h, s, l] = rgbToHsl(...hexToRgb(accent));
    const base = dark ? BASE.dark : BASE.light;
    const bg = theme.bg === 'plain' ? base.bg : mix(base.bg, accent, dark ? 0.06 : 0.05);
    const onAccent = contrast(accent, '#FFFFFF') >= contrast(accent, '#0A1633') ? '#FFFFFF' : '#0A1633';
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
        '--pg-sunk': base.sunk,
        '--pg-radius': radius + 'px',
        // نوار پایین شناور مثل ناوبری عبور: زمینهٔ تیره، قرص روشن
        '--pg-tab-bg': base.nav,
        ...deepVars(h, s),
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
      '--pg-on-accent': contrast(accent, '#FFFFFF') >= contrast(accent, '#0A1633') ? '#FFFFFF' : '#0A1633',
      '--pg-accent-ink': dark ? hslToHex(h, Math.min(100, s), 76) : hslToHex(h, Math.min(100, s + 6), Math.max(26, l - 12)),
      '--pg-soft': alpha(accent, dark ? 0.16 : 0.10),
      ...deepVars(h, s),
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
    ticket: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM14 5v12',
    sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
    steps: 'M6 4v16M6 6h.01M6 12h.01M6 18h.01M10 6h9M10 12h9M10 18h6',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    android: 'M7 10h10v8H7zM7 10a5 5 0 0 1 10 0M8.5 6L7 4M15.5 6L17 4M10 8v.01M14 8v.01',
    ios: 'M15.5 3.5c-1 .1-2.2.8-2.8 1.6-.6.7-1 1.8-.9 2.8 1.1.1 2.2-.6 2.8-1.4.6-.8 1-1.9.9-3zM12 8.3c-.8 0-2.1-1-3.3-1C6.7 7.4 5 9 5 11.9c0 1.8.7 3.7 1.5 5 .7 1.1 1.4 2.1 2.4 2.1s1.3-.6 2.6-.6 1.5.6 2.6.6 1.7-1 2.3-1.9c.5-.7.8-1.5 1-2.1-2.3-.9-2.6-4.3-.2-5.6-.8-1-2-1.6-3.1-1.6-1.2 0-1.8.5-2.1.5z',
    windows: 'M4 5.5l7-1v7H4zM13 4.2l7-1.2v8.5h-7zM4 13h7v7l-7-1zM13 13h7v8l-7-1.2z',
    mac: 'M5 6h14v9H5zM3 18h18',
    linux: 'M4 5h16v14H4zM8 10l3 2-3 2M13 15h3',
    web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
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
  /* نقش تونل عبور: دو طاق، رنگ از currentColor یا --pg-glow */
  function tunnelArt(cls) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 190 190');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', cls || 'pg-tunnel');
    [['M20 190V95a75 75 0 0 1 150 0v95', 16], ['M55 190V95a40 40 0 0 1 80 0v95', 10]].forEach(([d, w]) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d); p.setAttribute('stroke-width', w); p.setAttribute('fill', 'none');
      s.appendChild(p);
    });
    return s;
  }
  function tileMotif(cls) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 132 132');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', cls || 'pg-motif');
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
    // کارت عبور: کارت رنگی با نقش کاشی بزرگ، برچسب و لوگو بالا، عنوان پایین
    if (style === 'pass') {
      e.appendChild(tunnelArt('pg-tunnel pg-tunnel--pass'));
      const top = h('div', 'pg-pass-top');
      if (safeUrl(p.image, true)) top.appendChild(imageEl(p.image, 'pg-pass-logo', ctx));
      else top.appendChild(h('span', 'pg-pass-mark', (p.title || '·').trim().charAt(0)));
      if (p.chip) { const c = h('span', 'pg-pass-chip'); c.append(h('i'), document.createTextNode(p.chip)); top.appendChild(c); }
      e.appendChild(top);
      const inner = h('div', 'pg-herobox-in');
      inner.appendChild(h('h1', 'pg-hero-title', p.title));
      if (p.subtitle) inner.appendChild(h('p', 'pg-hero-sub', p.subtitle));
      e.appendChild(inner);
      return e;
    }
    // تصویر زمینه: تصویر تمام‌قاب با لایهٔ تیرهٔ یکدست تا متن همیشه خوانا باشد
    if (style === 'cover') {
      const bg = imageEl(p.cover, 'pg-cover-img', ctx);
      if (!safeUrl(p.cover, true) && ctx.editing) {
        const hint = bg.querySelector('.pg-img-hint');
        if (hint) hint.textContent = 'تصویر زمینه رو آپلود کن';
      }
      e.appendChild(bg);
      if (safeUrl(p.cover, true)) e.appendChild(h('div', 'pg-cover-shade'));
    } else if (style === 'solid') {
      e.appendChild(tunnelArt());
    }
    const inner = h('div', 'pg-herobox-in');
    if (p.chip) inner.appendChild(h('span', 'pg-pass-chip', p.chip));
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
    const e = h('section', `pg-links pg-links--${p.layout || 'list'}`);
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
    const cards = p.layout === 'cards';
    const e = h('section', cards ? 'pg-faq pg-faq--cards' : 'pg-card pg-faq');
    if (p.title) e.appendChild(h('h2', cards ? 'pg-h2 pg-h2--out' : 'pg-h2', p.title));
    (p.items || []).forEach(it => {
      const d = h('details', cards ? 'pg-qa pg-card' : 'pg-qa');
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

  const SOCIAL_NAMES = { telegram: 'تلگرام', instagram: 'اینستاگرام', whatsapp: 'واتساپ', youtube: 'یوتیوب', x: 'ایکس', website: 'وب‌سایت', phone: 'تماس', email: 'ایمیل' };
  R.social = (p, ctx) => {
    const pills = p.layout === 'pills';
    const e = h('section', pills ? 'pg-social pg-social--pills' : 'pg-social');
    (p.items || []).forEach(it => {
      const a = linkEl('a', 'pg-soc', socialHref(it.kind, it.value), ctx);
      a.setAttribute('aria-label', SOCIAL_NAMES[it.kind] || it.kind);
      a.appendChild(icon(it.kind));
      if (pills) a.appendChild(h('span', '', SOCIAL_NAMES[it.kind] || it.kind));
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
    const list = h('div', `pg-plans pg-plans--${p.layout || 'stack'}`);
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
      // بلیت عبور: خط برش با دو نیم‌دایره، بالا مشخصات، پایین خرید
      c.appendChild(h('div', 'pg-plan-cut'));
      const b = linkEl('a', 'pg-btn ' + (it.badge ? 'pg-btn--primary' : 'pg-btn--soft'), it.url, ctx);
      b.appendChild(h('span', '', it.cta || 'خرید'));
      c.appendChild(b);
      list.appendChild(c);
    });
    e.appendChild(list);
    return e;
  };

  R.gallery = (p, ctx) => {
    const e = h('section', `pg-gallery pg-gallery--${p.layout || 'slider'}`);
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
    const grid = h('div', `pg-feats pg-feats--${p.layout || 'grid'}`);
    (p.items || []).forEach(it => {
      const c = h('div', 'pg-feat');
      c.appendChild(h('span', 'pg-feat-emo', it.emoji || '✨'));
      const txt = h('div', 'pg-feat-txt');
      txt.appendChild(h('b', '', it.title));
      if (it.desc) txt.appendChild(h('small', '', it.desc));
      c.appendChild(txt);
      grid.appendChild(c);
    });
    e.appendChild(grid);
    return e;
  };

  /* ---------- کامپوننت‌های کاربردی به سبک عبور ---------- */
  const fmtN = n => (Math.round(Number(n) || 0)).toLocaleString('en-US');
  const numSpan = (v, cls) => { const e = h('span', 'pg-n' + (cls ? ' ' + cls : '')); e.textContent = String(v); return e; };

  /* کارت عبور: مثل کارت سرویس عبور؛ عدد بزرگ، واحد، ریل پیشرفت و قرص دکمه */
  R.passcard = (p, ctx) => {
    const tone = p.tone || 'deep';
    const e = h('section', `pg-pass pg-pass--${tone}`);
    e.appendChild(tunnelArt());
    const head = h('div', 'pg-pass-head');
    head.appendChild(h('b', 'pg-pass-name', p.title));
    if (p.status) { const st = h('span', 'pg-pass-st'); st.append(h('i'), document.createTextNode(p.status)); head.appendChild(st); }
    e.appendChild(head);
    const big = h('div', 'pg-pass-big');
    big.append(numSpan(p.value || '—', 'pg-pass-num'), h('span', 'pg-pass-unit', p.unit));
    e.appendChild(big);
    const pr = Math.max(0, Math.min(100, Number(p.progress) || 0));
    if (pr) {
      const rail = h('div', 'pg-pass-rail');
      const fill = h('span');
      fill.style.width = pr + '%';
      rail.appendChild(fill);
      e.appendChild(rail);
    }
    const foot = h('div', 'pg-pass-foot');
    foot.appendChild(h('span', 'pg-pass-meta', p.meta));
    if (p.cta) {
      const b = linkEl('a', 'pg-pass-btn', p.url, ctx);
      b.append(h('span', '', p.cta), icon('arrow'));
      foot.appendChild(b);
    }
    e.appendChild(foot);
    return e;
  };

  /* ماشین‌حساب قیمت: مثل «سرویس دلخواه» عبور. قیمت = مقدار × قیمت واحد × درصد گزینه */
  R.calc = (p, ctx) => {
    const tone = p.tone || 'deep';
    const min = Math.max(1, Number(p.min) || 1);
    const max = Math.max(min, Number(p.max) || min);
    const step = Math.max(1, Number(p.step) || 1);
    const opts = (p.options || []).filter(o => o && o.label);
    let qty = Math.max(min, Math.min(max, Number(p.start) || min));
    let oi = 0;
    const e = h('section', `pg-calc pg-calc--${tone}`);
    const hero = h('div', 'pg-calc-hero');
    hero.appendChild(tunnelArt());
    hero.appendChild(h('span', 'pg-calc-t', p.title));
    const sum = h('div', 'pg-calc-sum');
    const qN = numSpan('', 'pg-calc-q');
    const qU = h('span', 'pg-calc-u', '');
    sum.append(qN, qU);
    const price = h('div', 'pg-calc-price');
    const pN = numSpan('', 'pg-calc-p');
    const per = h('span', 'pg-calc-per', '');
    const pw = h('div');
    pw.append(pN, h('small', '', ' ' + (p.currency || '')));
    price.append(pw, per);
    hero.append(sum, price);
    e.appendChild(hero);

    const ctl = h('div', 'pg-card pg-calc-ctl');
    const head = h('div', 'pg-calc-h');
    const cur = h('span', 'pg-calc-cur', '');
    head.append(h('b', '', p.label || ''), cur);
    const range = h('input', 'pg-range');
    range.type = 'range';
    range.min = min; range.max = max; range.step = step; range.value = qty;
    range.setAttribute('aria-label', p.label || 'مقدار');
    const ticks = h('div', 'pg-calc-ticks');
    const tickVals = [min, Math.round((min + (max - min) / 3) / step) * step, Math.round((min + 2 * (max - min) / 3) / step) * step, max]
      .filter((v, i, a) => a.indexOf(v) === i);
    const tickEls = tickVals.map(v => { const t = numSpan(v); ticks.appendChild(t); return [v, t]; });
    ctl.append(head, range, ticks);
    let optBtns = [];
    if (opts.length) {
      const ol = h('div', 'pg-calc-h pg-calc-h2');
      ol.appendChild(h('b', '', p.options_label || ''));
      const seg = h('div', 'pg-seg');
      optBtns = opts.map((o, i) => {
        const b = h('button', '', o.label);
        b.type = 'button';
        b.addEventListener('click', ev => {
          if (ctx.editing) return;
          ev.stopPropagation();
          oi = i;
          try { tg && tg.HapticFeedback.selectionChanged(); } catch (x) {}
          update();
        });
        seg.appendChild(b);
        return b;
      });
      ctl.append(ol, seg);
    }
    if (p.cta) {
      const b = linkEl('a', 'pg-btn pg-btn--primary', p.url, ctx);
      b.append(h('span', '', p.cta), icon('arrow'));
      ctl.appendChild(b);
    }
    e.appendChild(ctl);

    function update() {
      const pct = opts.length ? (Number(opts[oi].percent) || 100) : 100;
      const total = qty * (Number(p.rate) || 0) * pct / 100;
      const rounded = total >= 10000 ? Math.round(total / 100) * 100 : Math.round(total);
      qN.textContent = fmtN(qty);
      qU.textContent = (p.unit || '') + (opts.length ? ' · ' + opts[oi].label : '');
      pN.textContent = fmtN(rounded);
      per.textContent = qty ? `هر ${p.unit || 'واحد'}: ${fmtN(rounded / qty)}` : '';
      cur.textContent = `${fmtN(qty)} ${p.unit || ''}`;
      tickEls.forEach(([v, t]) => t.classList.toggle('on', v === qty));
      optBtns.forEach((b, i) => b.classList.toggle('on', i === oi));
      const pc = max > min ? (qty - min) / (max - min) * 100 : 100;
      range.style.setProperty('--pc', pc + '%');
    }
    range.addEventListener('input', () => {
      qty = Number(range.value);
      update();
      try { tg && tg.HapticFeedback.selectionChanged(); } catch (x) {}
    });
    update();
    return e;
  };

  /* راهنمای قدم‌به‌قدم: ریل تب برای هر دستگاه، خط زمان قدم‌ها و دکمهٔ دانلود */
  R.steps = (p, ctx) => {
    const items = (p.items || []).filter(it => it && (it.label || it.steps));
    const e = h('section', `pg-card pg-steps pg-steps--${p.layout || 'timeline'}`);
    if (p.title) e.appendChild(h('h2', 'pg-h2', p.title));
    const panels = [];
    if (items.length > 1) {
      const rail = h('div', 'pg-seg pg-steps-tabs');
      rail.setAttribute('role', 'tablist');
      const btns = items.map((it, i) => {
        const b = h('button', i === 0 ? 'on' : '', it.label);
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.addEventListener('click', ev => {
          if (!ctx.editing) ev.stopPropagation();
          btns.forEach((x, j) => x.classList.toggle('on', j === i));
          panels.forEach((x, j) => { x.hidden = j !== i; });
          try { tg && tg.HapticFeedback.selectionChanged(); } catch (x) {}
        });
        rail.appendChild(b);
        return b;
      });
      e.appendChild(rail);
    }
    items.forEach((it, i) => {
      const panel = h('div', 'pg-steps-panel');
      panel.hidden = i !== 0;
      const ol = h('ol', 'pg-steps-list');
      const lines = String(it.steps || '').split('\n').map(x => x.trim()).filter(Boolean);
      lines.forEach((line, k) => {
        const [t, d] = line.split('|').map(x => (x || '').trim());
        const li = h('li', k === lines.length - 1 && lines.length > 1 ? 'last' : '');
        const dot = h('span', 'pg-step-d');
        if (k === lines.length - 1 && lines.length > 1) dot.appendChild(icon('check'));
        else dot.textContent = String(k + 1);
        const tx = h('div', 'pg-step-t');
        tx.appendChild(h('b', '', t));
        if (d) tx.appendChild(h('p', '', d));
        li.append(dot, tx);
        ol.appendChild(li);
      });
      panel.appendChild(ol);
      if (safeUrl(it.url)) {
        const b = linkEl('a', 'pg-btn pg-btn--soft pg-steps-dl', it.url, ctx);
        b.append(icon('download'), h('span', '', it.app ? `دانلود ${it.app}` : 'دانلود'));
        panel.appendChild(b);
      }
      panels.push(panel);
      e.appendChild(panel);
    });
    if (p.note) {
      const w = h('div', 'pg-steps-note');
      w.append(icon('notice'), h('span', '', p.note));
      e.appendChild(w);
    }
    return e;
  };

  /* برنامه‌ها: دکمه‌های دانلود با آیکن دستگاه؛ «پیشنهادی» رنگ اصلی */
  const PLATFORM = { android: 'اندروید', ios: 'آیفون', windows: 'ویندوز', mac: 'مک', linux: 'لینوکس', web: 'وب' };
  R.apps = (p, ctx) => {
    const rows = p.layout === 'rows';
    const e = h('section', 'pg-group');
    if (p.title) e.appendChild(h('h2', 'pg-h2 pg-h2--out', p.title));
    const box = h('div', rows ? 'pg-card pg-apps pg-apps--rows' : 'pg-apps pg-apps--chips');
    (p.items || []).forEach(it => {
      const a = linkEl('a', 'pg-app' + (it.best ? ' pg-app--best' : ''), it.url, ctx);
      const ic = h('span', 'pg-app-ic');
      ic.appendChild(icon(it.platform || 'web'));
      const tx = h('span', 'pg-app-txt');
      tx.appendChild(h('b', '', it.name || PLATFORM[it.platform] || ''));
      if (it.note || rows) tx.appendChild(h('small', '', it.note || PLATFORM[it.platform] || ''));
      a.append(ic, tx);
      if (it.best) a.appendChild(h('span', 'pg-app-best', 'پیشنهادی'));
      if (rows) a.appendChild(icon('download', 'pg-app-go'));
      box.appendChild(a);
    });
    e.appendChild(box);
    return e;
  };

  /* آمار: چند عدد مهم؛ نوار (در یک کارت) یا کاشی */
  R.stats = p => {
    const items = (p.items || []).filter(it => it && (it.value || it.label));
    const tiles = p.layout === 'tiles';
    const e = h('section', tiles ? 'pg-stats pg-stats--tiles' : 'pg-card pg-stats pg-stats--strip');
    e.style.setProperty('--n', Math.max(1, items.length));
    items.forEach(it => {
      const c = h('div', tiles ? 'pg-card pg-stat' : 'pg-stat');
      c.append(numSpan(it.value, 'pg-stat-v'), h('span', 'pg-stat-l', it.label));
      e.appendChild(c);
    });
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
    const tb = h('b', '', hd.title || fallbackTitle || '');
    if (ctx.editing) tb.dataset.edit = 'title';
    txt.appendChild(tb);
    if (hd.subtitle) { const sb = h('small', '', hd.subtitle); if (ctx.editing) sb.dataset.edit = 'subtitle'; txt.appendChild(sb); }
    inner.appendChild(txt);
    e.appendChild(inner);
    return e;
  }

  /* ---------- ویرایش روی صفحه: مسیر فیلدِ هر متن ----------
     در ادیتور، متن‌های قابل‌تایپ data-edit می‌گیرند (مثلاً items.2.label) تا
     پنل همان‌جا contenteditable کند. [انتخاب‌گر، مسیر] یا برای فهرست‌ها
     {each: انتخاب‌گر هر آیتم، list: کلید فهرست، fields: [[انتخاب‌گر، کلید]]}. */
  const EDIT_MAP = {
    hero: [['.pg-hero-title', 'title'], ['.pg-hero-sub', 'subtitle']],
    text: [['.pg-h2', 'title'], ['.pg-body', 'body']],
    button: [['.pg-btn > span', 'label']],
    notice: [['.pg-notice > p', 'text']],
    image: [['figcaption', 'caption']],
    faq: [['.pg-faq > .pg-h2', 'title'], { each: '.pg-qa', list: 'items', fields: [['summary > span', 'q'], ['.pg-qa-a', 'a']] }],
    links: [{ each: '.pg-link', list: 'items', fields: [['.pg-link-txt b', 'label'], ['.pg-link-txt small', 'note']] }],
    cards: [['.pg-h2', 'title'], { each: '.pg-pcard', list: 'items', fields: [['h3', 'title'], ['.pg-pcard-b > p', 'desc'], ['.pg-price', 'price']] }],
    pricing: [['.pg-h2', 'title'], { each: '.pg-plan', list: 'items', fields: [['.pg-plan-name', 'name'], ['.pg-plan-price b', 'price'], ['.pg-plan-price span', 'period']] }],
    features: [['.pg-h2', 'title'], { each: '.pg-feat', list: 'items', fields: [['.pg-feat-txt b', 'title'], ['.pg-feat-txt small', 'desc']] }],
    passcard: [['.pg-pass-name', 'title'], ['.pg-pass-num', 'value'], ['.pg-pass-unit', 'unit'], ['.pg-pass-meta', 'meta'], ['.pg-pass-btn > span', 'cta']],
    calc: [['.pg-calc-t', 'title']],
    steps: [['.pg-steps > .pg-h2', 'title']],
    apps: [['.pg-h2', 'title']],
    stats: [{ each: '.pg-stat', list: 'items', fields: [['.pg-stat-v', 'value'], ['.pg-stat-l', 'label']] }],
  };
  function markEdits(node, type) {
    (EDIT_MAP[type] || []).forEach(rule => {
      if (Array.isArray(rule)) {
        const el = node.matches && node.matches(rule[0]) ? node : node.querySelector(rule[0]);
        if (el) el.dataset.edit = rule[1];
        return;
      }
      node.querySelectorAll(rule.each).forEach((item, i) => {
        rule.fields.forEach(([sel, key]) => {
          const el = item.querySelector(sel);
          if (el) el.dataset.edit = `${rule.list}.${i}.${key}`;
        });
      });
    });
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
        markEdits(node, b.type);
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
