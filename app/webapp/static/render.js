/* EasySaz — رندرر صفحه
   یک موتور برای دو جا: مینی اپ عمومی (page.js) و پیش نمایش زنده ادیتور (panel.js).

   اصل امنیتی: هیچ رشته ای از کاربر وارد innerHTML نمی شود. همه چیز با
   createElement و textContent ساخته می شود و لینک ها دوباره از safeUrl
   رد می شوند (سرور هم قبلا پاکشان کرده). SVG ها ثابت و مال خودمان است. */
(function () {
  'use strict';

  const tg = window.Telegram && window.Telegram.WebApp;

  /* ---------- رنگ ---------- */
  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return [47, 107, 255];
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

  /* از یک رنگ اصلی، کل پالت ساخته می شود. کاربر هر رنگی بدهد، کنتراست
     متن روی دکمه و خوانایی در حالت تیره تضمین است. */
  function palette(theme) {
    theme = theme || {};
    const dark = isDark(theme.mode);
    let accent = /^#[0-9a-f]{6}$/i.test(theme.accent || '') ? theme.accent : '#2F6BFF';
    let [h, s, l] = rgbToHsl(...hexToRgb(accent));
    if (dark && l < 52) accent = hslToHex(h, s, Math.min(64, l + 14));
    if (!dark && l > 62) accent = hslToHex(h, s, 52);
    [h, s, l] = rgbToHsl(...hexToRgb(accent));
    const onAccent = contrast(accent, '#FFFFFF') >= contrast(accent, '#0E1525') ? '#FFFFFF' : '#0E1525';
    const accent2 = hslToHex(h + 28, Math.min(100, s + 6), Math.min(70, l + 6));
    const deep = hslToHex(h - 8, Math.min(100, s + 4), Math.max(14, l - 22));

    const base = dark
      ? { bg: '#0A0E16', surface: '#141A25', raised: '#1B2230', ink: '#F2F5FA', ink2: '#B0B9C9', ink3: '#7D879A', line: 'rgba(255,255,255,.08)', shadow: 'rgba(0,0,0,.45)' }
      : { bg: '#F4F6FA', surface: '#FFFFFF', raised: '#FFFFFF', ink: '#0E1525', ink2: '#4A5468', ink3: '#7A8397', line: 'rgba(14,21,37,.08)', shadow: 'rgba(14,21,37,.10)' };
    let bg = base.bg;
    if (theme.bg === 'tint' || theme.bg === 'glow') bg = mix(base.bg, accent, dark ? 0.06 : 0.05);

    const radius = { soft: 18, round: 26, sharp: 8 }[theme.radius] || 18;
    return {
      dark,
      vars: {
        '--es-accent': accent,
        '--es-accent-2': accent2,
        '--es-accent-deep': deep,
        '--es-on-accent': onAccent,
        '--es-soft': alpha(accent, dark ? 0.16 : 0.10),
        '--es-soft-2': alpha(accent, dark ? 0.26 : 0.18),
        '--es-accent-ink': dark ? hslToHex(h, Math.min(100, s), 76) : hslToHex(h, Math.min(100, s + 6), Math.max(26, l - 12)),
        '--es-bg': bg,
        '--es-surface': base.surface,
        '--es-raised': base.raised,
        '--es-ink': base.ink,
        '--es-ink-2': base.ink2,
        '--es-ink-3': base.ink3,
        '--es-line': base.line,
        '--es-shadow': base.shadow,
        '--es-glow': theme.bg === 'glow' ? alpha(accent, dark ? 0.30 : 0.22) : 'transparent',
        '--es-r': radius + 'px',
        '--es-r-sm': Math.max(6, Math.round(radius * 0.62)) + 'px',
      },
    };
  }

  function applyTheme(el, theme) {
    const p = palette(theme);
    for (const [k, v] of Object.entries(p.vars)) el.style.setProperty(k, v);
    el.classList.toggle('es-dark', p.dark);
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
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15.5 9.5a1.5 1.5 0 1 0 0-.01',
    telegram: 'M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l9-6-7 8',
    instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17.3 6.7v.01',
    whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20zM9 9c0 3 2 5 5 6l1.3-1.3L13.5 12.5 12.6 13.4c-.9-.4-1.6-1.1-2-2l.9-.9L10.3 8.7 9 9z',
    youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8zM10 9l5 3-5 3V9z',
    x: 'M4 4l16 16M20 4L4 20',
    website: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    email: 'M3 6h18v12H3zM3 7l9 6 9-6',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
  };
  function icon(name, cls) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'es-ico ' + (cls || ''));
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', ICONS[name] || ICONS.spark);
    s.appendChild(p);
    return s;
  }

  function safeUrl(url, images) {
    if (typeof url !== 'string') return '';
    url = url.trim();
    const low = url.toLowerCase();
    if (low.startsWith('https://')) return url;
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

  /* لینک ها داخل تلگرام باید با API خودش باز شوند، وگرنه مینی اپ بسته
     می شود یا لینک t.me داخل وب ویو گیر می کند. */
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
        if (ctx.editing) return; // در ادیتور کلیک یعنی انتخاب کامپوننت
        ev.preventDefault();
        openUrl(href);
      });
    } else {
      e.classList.add('es-nolink');
    }
    return e;
  }

  function imageEl(src, cls, ctx) {
    const url = safeUrl(src, true);
    const wrap = h('div', 'es-img ' + (cls || ''));
    if (url) {
      const img = h('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', () => wrap.classList.add('es-loaded'));
      img.addEventListener('error', () => { wrap.classList.add('es-broken'); img.remove(); wrap.appendChild(icon('image')); });
      img.src = url;
      wrap.appendChild(img);
    } else {
      wrap.classList.add('es-empty');
      wrap.appendChild(icon('image'));
      if (ctx.editing) wrap.appendChild(h('span', 'es-img-hint', 'آدرس تصویر رو اضافه کن'));
    }
    return wrap;
  }

  /* ---------- کامپوننت ها ---------- */
  const R = {};

  R.hero = (p, ctx) => {
    const e = h('section', `es-hero es-hero--${p.style || 'gradient'} es-align-${p.align || 'center'}`);
    if (p.style === 'gradient') { e.appendChild(h('i', 'es-orb es-orb-1')); e.appendChild(h('i', 'es-orb es-orb-2')); }
    const inner = h('div', 'es-hero-in');
    if (safeUrl(p.image, true)) inner.appendChild(imageEl(p.image, 'es-avatar', ctx));
    inner.appendChild(h('h1', 'es-hero-title', p.title));
    if (p.subtitle) inner.appendChild(h('p', 'es-hero-sub', p.subtitle));
    e.appendChild(inner);
    return e;
  };

  R.text = p => {
    const e = h('section', `es-card es-text es-align-${p.align || 'start'}`);
    if (p.title) e.appendChild(h('h2', 'es-h2', p.title));
    if (p.body) e.appendChild(h('p', 'es-body', p.body));
    return e;
  };

  R.button = (p, ctx) => {
    const e = linkEl('a', `es-btn es-btn--${p.style || 'primary'}`, p.url, ctx);
    e.appendChild(h('span', '', p.label || '…'));
    e.appendChild(icon('arrow', 'es-btn-ico'));
    return e;
  };

  R.links = (p, ctx) => {
    const e = h('section', 'es-links');
    (p.items || []).forEach((it, i) => {
      const row = linkEl('a', 'es-link', it.url, ctx);
      row.style.setProperty('--i', i);
      const dot = h('span', 'es-link-dot');
      dot.appendChild(icon(/t\.me\//.test(it.url || '') ? 'telegram' : 'website'));
      const txt = h('span', 'es-link-txt');
      txt.appendChild(h('b', '', it.label));
      if (it.note) txt.appendChild(h('small', '', it.note));
      row.append(dot, txt, icon('arrow', 'es-link-go'));
      e.appendChild(row);
    });
    return e;
  };

  R.image = (p, ctx) => {
    const e = h('figure', 'es-figure');
    const img = imageEl(p.src, 'es-ratio', ctx);
    img.dataset.ratio = p.ratio || '16:9';
    e.appendChild(img);
    if (p.caption) e.appendChild(h('figcaption', '', p.caption));
    return e;
  };

  R.faq = p => {
    const e = h('section', 'es-card es-faq');
    if (p.title) e.appendChild(h('h2', 'es-h2', p.title));
    (p.items || []).forEach(it => {
      const d = h('details', 'es-qa');
      const s = h('summary');
      s.appendChild(h('span', '', it.q));
      s.appendChild(icon('chev', 'es-qa-ico'));
      d.appendChild(s);
      if (it.a) d.appendChild(h('p', 'es-body', it.a));
      d.addEventListener('toggle', () => { try { tg && tg.HapticFeedback.selectionChanged(); } catch (x) {} });
      e.appendChild(d);
    });
    return e;
  };

  R.social = (p, ctx) => {
    const e = h('section', 'es-social');
    (p.items || []).forEach(it => {
      const a = linkEl('a', 'es-soc', socialHref(it.kind, it.value), ctx);
      a.setAttribute('aria-label', it.kind);
      a.appendChild(icon(it.kind));
      e.appendChild(a);
    });
    return e;
  };

  R.notice = p => {
    const e = h('section', `es-notice es-notice--${p.tone || 'accent'}`);
    e.appendChild(icon('spark'));
    e.appendChild(h('p', '', p.text));
    return e;
  };

  R.divider = p => h('hr', `es-div es-div--${p.style || 'line'}`);

  R.cards = (p, ctx) => {
    const e = h('section', 'es-cards-wrap');
    if (p.title) e.appendChild(h('h2', 'es-h2 es-h2--out', p.title));
    const grid = h('div', `es-cards es-cards--${p.layout || 'grid'}`);
    (p.items || []).forEach(it => {
      const c = h('article', 'es-pcard');
      c.appendChild(imageEl(it.image, 'es-pcard-img', ctx));
      const body = h('div', 'es-pcard-b');
      body.appendChild(h('h3', '', it.title));
      if (it.desc) body.appendChild(h('p', '', it.desc));
      const foot = h('div', 'es-pcard-f');
      if (it.price) foot.appendChild(h('span', 'es-price', it.price));
      if (safeUrl(it.url)) {
        const b = linkEl('a', 'es-mini-btn', it.url, ctx);
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

  R.gallery = (p, ctx) => {
    const e = h('section', 'es-gallery');
    const track = h('div', 'es-gal-track');
    (p.items || []).forEach(it => {
      const f = h('figure', 'es-gal-item');
      f.appendChild(imageEl(it.src, '', ctx));
      if (it.caption) f.appendChild(h('figcaption', '', it.caption));
      track.appendChild(f);
    });
    e.appendChild(track);
    return e;
  };

  R.features = p => {
    const e = h('section', 'es-feat-wrap');
    if (p.title) e.appendChild(h('h2', 'es-h2 es-h2--out', p.title));
    const grid = h('div', 'es-feats');
    (p.items || []).forEach(it => {
      const c = h('div', 'es-feat');
      c.appendChild(h('span', 'es-feat-emo', it.emoji || '✨'));
      c.appendChild(h('b', '', it.title));
      if (it.desc) c.appendChild(h('small', '', it.desc));
      grid.appendChild(c);
    });
    e.appendChild(grid);
    return e;
  };

  /* رندر کل صفحه.
     opts.editing   : حالت ادیتور (کلیک = انتخاب، لینک ها باز نمی شوند)
     opts.onPick(id): کلیک روی یک کامپوننت در ادیتور
     opts.selected  : آیدی کامپوننت انتخاب شده
     opts.branding  : {bot} برای نشان «ساخته شده با EasySaz» */
  function render(root, doc, opts) {
    opts = opts || {};
    const ctx = { editing: !!opts.editing };
    doc = doc || { blocks: [] };
    root.textContent = '';
    root.classList.add('es-page');
    applyTheme(root, doc.theme);

    const list = h('div', 'es-blocks');
    (doc.blocks || []).forEach((b, i) => {
      const fn = R[b.type];
      if (!fn) return;
      let node;
      try { node = fn(b.props || {}, ctx); } catch (e) { return; }
      const wrap = h('div', 'es-block');
      wrap.dataset.id = b.id;
      wrap.dataset.type = b.type;
      wrap.style.setProperty('--i', i);
      wrap.appendChild(node);
      if (ctx.editing) {
        wrap.classList.add('es-editable');
        if (opts.selected === b.id) wrap.classList.add('es-selected');
        wrap.addEventListener('click', ev => { ev.preventDefault(); opts.onPick && opts.onPick(b.id); });
      }
      list.appendChild(wrap);
    });
    root.appendChild(list);

    if (opts.branding && list.childElementCount) {
      const bot = opts.branding.bot || 'EasySazBot';
      const badge = linkEl('a', 'es-brand', 'https://t.me/' + bot, ctx);
      badge.appendChild(icon('spark'));
      badge.appendChild(h('span', '', 'ساخته شده با EasySaz'));
      root.appendChild(badge);
    }
    return list;
  }

  window.EasySaz = { render, applyTheme, palette, icon, h, openUrl, safeUrl, isDark };
})();
