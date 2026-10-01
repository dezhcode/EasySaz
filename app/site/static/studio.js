/* استودیوی ایزی‌ساز (سایت): ساختن مینی‌اپ، طراحی (فقط این‌جا) و مطلب‌ها.
   مسیرها: /studio میز کار · /studio/<شناسه>/<تب>  (design | content | write | taxonomy | settings)
   پیش‌نمایش همان موتور مینی‌اپ است (static/render.js) با دادهٔ واقعی مجله. */
(function () {
  'use strict';
  const BASE = document.body.dataset.base || '/';
  const ES = window.EasySaz;
  const $ = id => document.getElementById(id);
  const fa = n => Number(n || 0).toLocaleString('fa-IR');
  const SVG = 'http://www.w3.org/2000/svg';
  const P = {
    back: 'M9 6l6 6-6 6', fwd: 'M15 6l-6 6 6 6', plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', check: 'M5 12.5l4.5 4.5L19 7.5',
    pal: 'M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.6 0-1.2-1-1.4-1-2.4 0-.8.7-1.5 1.5-1.5H16a5 5 0 005-5c0-4-4-7.5-9-7.5zM7.5 11h.01M10 7.5h.01M15 7.5h.01',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', folder: 'M3 6h7l2 2h9v11H3z', sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
    send: 'M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l8-6', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13', copy: 'M8 8h12v12H8zM4 16V4h12',
    text: 'M5 6h14M5 11h14M5 16h9', h2: 'M4 6v12M11 6v12M4 12h7M15 10a2.5 2.5 0 015 0c0 2.5-5 3.5-5 7h5', image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5h.01',
    audio: 'M4 15v-3a8 8 0 0116 0v3M4 15h3v5H4zM17 15h3v5h-3z', video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3', link: 'M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1',
    btn: 'M4 8h16v8H4zM9 12h6', quote: 'M10 7H6a2 2 0 00-2 2v3h5v5H4M20 7h-4a2 2 0 00-2 2v3h5v5h-5', hr: 'M4 12h16',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1', tg: 'M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l8-6',
    lock: 'M6 11h12v9H6zM9 11V8a3 3 0 016 0v3', search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4', grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
    undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3', star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z',
    home: 'M3 10.5 12 3l9 7.5V21H3z', bookmark: 'M6 3h12v18l-6-4-6 4z', chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2', desk: 'M3 5h18v11H3zM8 20h8M12 16v4', phone: 'M7 3h10v18H7zM11 18h2',
    more: 'M5 12h.01M12 12h.01M19 12h.01', upload: 'M12 16V4M7 9l5-5 5 5M5 20h14', out: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
    tag: 'M3 12V4h8l9 9-8 8zM7.5 7.5h.01', pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', play: 'M8 5v14l11-7z', redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
    eyeoff: 'M3 3l18 18M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9M6.6 6.6A17 17 0 002 12s3.5 6 10 6a9.7 9.7 0 004.4-1',
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', bot: 'M5 9h14v10H5zM12 5v4M9 13h.01M15 13h.01M9 16h6',
  };
  function ic(name, cls) {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', P[name] || P.spark);
    s.appendChild(p);
    return s;
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== '') e.textContent = text;
    return e;
  }
  function btn(cls, label, icon, fn) {
    const b = el('button', 'btn ' + cls);
    b.type = 'button';
    if (icon) b.appendChild(ic(icon));
    if (label) b.appendChild(document.createTextNode(label));
    if (fn) b.addEventListener('click', fn);
    return b;
  }
  function iconBtn(icon, label, fn, cls) {
    const b = el('button', 'st-ib' + (cls ? ' ' + cls : ''));
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.appendChild(ic(icon));
    if (fn) b.addEventListener('click', ev => { ev.stopPropagation(); fn(ev); });
    return b;
  }
  function toast(msg, bad) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'st-toast on' + (bad ? ' bad' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.className = 'st-toast'; }, 2600);
  }
  function ago(t) {
    if (!t) return '';
    const s = Date.now() / 1000 - t;
    if (s < 0) return new Date(t * 1000).toLocaleString('fa-IR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (s < 120) return 'همین حالا';
    if (s < 3600) return fa(Math.floor(s / 60)) + ' دقیقه پیش';
    if (s < 86400) return fa(Math.floor(s / 3600)) + ' ساعت پیش';
    if (s < 172800) return 'دیروز';
    return fa(Math.floor(s / 86400)) + ' روز پیش';
  }
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ---------- API ---------- */
  async function api(path, body) {
    const opt = { credentials: 'same-origin', headers: { 'X-ES': '1' }, cache: 'no-store' };
    if (body !== undefined) { opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    let r, data = {};
    try { r = await fetch(BASE + 'site/api/' + path, opt); } catch (e) { throw new Error('اتصال برقرار نشد'); }
    try { data = await r.json(); } catch (e) { /* خالی */ }
    if (r.status === 401) { location.href = BASE + 'login'; throw new Error('out'); }
    if (!r.ok) { const e = new Error(data.error || 'خطا'); e.status = r.status; throw e; }
    return data;
  }
  function failed(e) { if (e && e.message !== 'out') toast(e.message || 'خطا', true); }
  async function uploadImage(file) {
    if (!/^image\//.test(file.type)) throw new Error('فقط تصویر');
    // FileReader به‌جای blob: (CSP سایت blob: را نمی‌پذیرد)
    const src = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('این فایل تصویر نیست')); i.src = src; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.86);
    return (await api('upload', { data })).url;
  }
  async function uploadMedia(file) {
    let r, data = {};
    r = await fetch(BASE + 'site/api/upload_media', { method: 'POST', credentials: 'same-origin', headers: { 'X-ES': '1', 'Content-Type': file.type || 'application/octet-stream' }, body: file });
    try { data = await r.json(); } catch (e) { /* خالی */ }
    if (!r.ok) throw new Error(data.error || 'آپلود نشد');
    return data.url;
  }
  function pickFile(accept, fn) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = accept;
    inp.addEventListener('change', () => { if (inp.files && inp.files[0]) fn(inp.files[0]); });
    inp.click();
  }

  /* ---------- پنجره ---------- */
  function modal(build, cls) {
    const wrap = el('div', 'st-modal');
    const box = el('div', 'st-mbox ' + (cls || ''));
    wrap.appendChild(box);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
    build(box, close);
    document.body.appendChild(wrap);
    return close;
  }
  function confirmBox(msg, yes, danger) {
    return new Promise(res => {
      modal((box, close) => {
        box.append(el('p', 'st-confirm', msg));
        const row = el('div', 'st-row st-end');
        row.append(btn('btn-ghost btn-sm', 'انصراف', null, () => { close(); res(false); }),
          btn((danger ? 'btn-danger' : 'btn-primary') + ' btn-sm', yes || 'تأیید', null, () => { close(); res(true); }));
        box.appendChild(row);
      }, 'st-mbox--s');
    });
  }

  /* ---------- وضعیت ---------- */
  const S = { apps: null, schema: null, app: null, doc: null, mag: null, home: null, tab: 'design', page: 'home', sel: null, panel: 'theme',
    hist: [], saveT: 0, saving: false, pending: false, post: null, postDirty: false, filter: 'all', q: '', catf: '' };
  const root = $('app');

  async function schema() {
    if (!S.schema) S.schema = await (await fetch(BASE + 'api/schema', { cache: 'no-store' })).json();
    return S.schema;
  }

  /* ---------- مسیر ---------- */
  function go(path, replace) {
    if (S.postDirty && !confirm('تغییرهای این مطلب ذخیره نشده. بیرون می‌روی؟')) return;
    S.postDirty = false;
    const url = BASE + 'studio' + path;
    if (replace) history.replaceState(null, '', url); else history.pushState(null, '', url);
    route();
  }
  window.addEventListener('popstate', () => route());
  window.addEventListener('beforeunload', e => { if (S.postDirty || S.pending) { e.preventDefault(); e.returnValue = ''; } });
  async function route() {
    const rest = location.pathname.slice((BASE + 'studio').length).replace(/^\/+/, '');
    const [id, tab] = rest.split('/');
    try {
      if (!id) return await dashboard();
      if (id === 'templates') return await templatesPage();
      if (!S.app || String(S.app.id) !== id) await loadApp(id);
      S.tab = tab || 'design';
      workspace();
    } catch (e) { failed(e); if (e.status === 404) go('', true); }
  }

  /* ===================== میز کار ===================== */
  function topbar(inner) {
    const bar = el('header', 'st-top');
    const logo = el('a', 'logo');
    logo.href = BASE + 'studio';
    logo.addEventListener('click', e => { e.preventDefault(); go(''); });
    const mk = el('span', 'mark');
    mk.innerHTML = '<svg><use href="#i-mark"/></svg>';
    logo.append(mk, document.createTextNode('ایزی‌ساز'));
    bar.appendChild(logo);
    (inner || []).forEach(x => bar.appendChild(x));
    return bar;
  }
  async function dashboard() {
    S.app = null;
    const d = await api('apps');
    S.apps = d;
    root.textContent = '';
    const acc = el('a', 'btn btn-ghost btn-sm', 'حساب و دستگاه‌ها');
    acc.href = BASE + 'account';
    root.appendChild(topbar([siteNav(''), el('span', 'st-gap'), acc]));
    const main = el('main', 'st-dash wrap');
    const head = el('div', 'st-dash-head');
    const t = el('div', 'col');
    t.append(el('span', 'kicker', 'میز کار'), el('h1', 'h1', 'مینی‌اپ‌های تو'));
    head.append(t, el('span', 'cap', `پلن ${d.plan.title} · ${fa(d.apps.length)} از ${fa(d.plan.max_apps)} مینی‌اپ`));
    main.appendChild(head);
    const grid = el('div', 'st-apps');
    d.apps.forEach(a => {
      const card = el('button', 'st-app card');
      card.type = 'button';
      const sq = el('span', 'st-app-sq', (a.name || '؟').charAt(0));
      sq.style.background = a.kit === 'mag' ? '#1D55F0' : a.kit === 'shab' ? '#D0452B' : '#4B2EE8';
      const tx = el('span', 'st-app-tx');
      const kit = { mag: 'مجله', shab: 'قسمت' }[a.kit] || 'پایه';
      tx.append(el('b', '', a.name), el('span', 'cap', `قالب ${kit} · ${a.status === 'paused' ? 'خاموش' : a.published_at ? 'منتشر شده' : 'منتشر نشده'}`));
      const st = el('span', 'st-app-st');
      st.append(el('b', '', fa(a.stats ? a.stats.people_week : 0)), el('small', '', 'نفر این هفته'));
      card.append(sq, tx, st);
      card.addEventListener('click', () => go('/' + a.id));
      grid.appendChild(card);
    });
    const add = el('button', 'st-app st-app--new');
    add.type = 'button';
    add.append(ic('plus'), el('b', '', 'مینی‌اپ تازه'), el('span', 'cap', d.can_create ? 'یک قالب انتخاب کن' : 'پلنت پر است؛ در ربات ارتقا بده'));
    add.disabled = !d.can_create;
    add.addEventListener('click', () => go('/templates'));
    grid.appendChild(add);
    main.appendChild(grid);
    root.appendChild(main);
  }

  /* ===================== قالب‌ها: امتحان زنده و نصب ===================== */
  function siteNav(on) {
    const nav = el('nav', 'st-tabs');
    [['', 'grid', 'مینی‌اپ‌های من'], ['/templates', 'layers', 'قالب‌ها']].forEach(([path, i, label]) => {
      const b = el('button', 'st-tab' + (on === path ? ' on' : ''));
      b.type = 'button';
      b.append(ic(i), document.createTextNode(label));
      b.addEventListener('click', () => go(path));
      nav.appendChild(b);
    });
    return nav;
  }
  /* گوشی کوچک با همان موتور خواننده؛ interactive=true یعنی می‌شود زد و پیمایش کرد */
  function tplPhone(doc, width, interactive, name) {
    const ph = el('div', 'tp-phone');
    const s = (width - 16) / 390;
    ph.style.width = width + 'px';
    ph.style.height = Math.round(844 * s + 16) + 'px';
    const scr = el('div', 'tp-scr');
    const inner = el('div', 'tp-in');
    inner.style.transform = `scale(${s.toFixed(4)})`;
    const pg = el('div', '');
    inner.appendChild(pg);
    scr.appendChild(inner);
    ph.appendChild(scr);
    let page = null;
    const draw = () => ES.render(pg, doc, {
      editing: !interactive, appName: name || 'مینی‌اپ تو', page, appKey: 'tpl-' + doc.kit,
      mag: doc.kit === 'mag' ? (S.apps.demo || {}).mag : null,
      magApi: doc.kit === 'mag' && interactive ? { post: async id => ((S.apps.demo || {}).mag.latest || []).find(p => p.id === id), list: async () => ({ posts: (S.apps.demo || {}).mag.latest || [], more: false, offset: 0 }) } : null,
      onNavigate: id => { page = id; draw(); pg.scrollTop = 0; },
    });
    draw();
    if (!interactive) ph.classList.add('still');
    return ph;
  }
  async function templatesPage() {
    S.app = null;
    if (!S.apps) S.apps = await api('apps');
    await schema();
    const d = S.apps;
    root.textContent = '';
    const acc = el('a', 'btn btn-ghost btn-sm', 'حساب و دستگاه‌ها');
    acc.href = BASE + 'account';
    root.appendChild(topbar([siteNav('/templates'), el('span', 'st-gap'), acc]));
    const main = el('main', 'st-dash wrap tp-main');
    const head = el('div', 'st-dash-head');
    const t = el('div', 'col');
    t.append(el('h1', 'h1', 'یک قالب انتخاب کن'), el('span', 'cap', 'هر قالب اجزای خودش را دارد. قبل از نصب، زنده امتحانش کن.'));
    head.appendChild(t);
    main.appendChild(head);
    const grid = el('div', 'tp-grid');
    d.templates.forEach(tp => {
      const st = tp.store || {};
      const card = el('div', 'card tp-card');
      const stage = el('div', 'tp-stage');
      stage.style.background = `linear-gradient(170deg, ${st.tint || '#ECE8FF'}, #F4F3FA)`;
      stage.appendChild(tplPhone(tp.doc, 230, false, tp.title));
      const meta = el('div', 'tp-meta');
      const top = el('div', 'st-row st-between');
      top.append(el('b', 'tp-name', tp.title), el('span', 'cap', fa(tp.parts) + ' جزء · ' + fa(tp.pages) + ' صفحه'));
      meta.append(top, el('p', 'cap tp-desc', st.tagline || tp.desc || ''));
      if ((st.components || []).length) {
        const ch = el('div', 'tp-chips');
        st.components.slice(0, 5).forEach(c => ch.appendChild(el('span', 'tag tag-mute', c)));
        meta.appendChild(ch);
      }
      const row = el('div', 'st-row');
      row.append(btn('btn-ghost btn-sm grow', 'امتحان زنده', 'play', () => tryLive(tp)), btn('btn-primary btn-sm grow', 'نصب', 'down', () => install(tp)));
      meta.appendChild(row);
      card.append(stage, meta);
      grid.appendChild(card);
    });
    (d.store || []).filter(s => s.status === 'soon').slice(0, 4).forEach(s => {
      const card = el('div', 'card tp-card tp-soon');
      const stage = el('div', 'tp-stage');
      stage.style.background = `linear-gradient(170deg, ${s.tint || '#ECE8FF'}, #F4F3FA)`;
      const ico = el('span', 'tp-soon-ic');
      ico.style.color = s.color || '#4B2EE8';
      ico.appendChild(ES.icon(ES.ICONS[s.icon] ? s.icon : 'star'));
      stage.appendChild(ico);
      const meta = el('div', 'tp-meta');
      const top = el('div', 'st-row st-between');
      top.append(el('b', 'tp-name', s.title), el('span', 'tag tag-warn', 'به‌زودی'));
      meta.append(top, el('p', 'cap tp-desc', s.tagline || ''));
      card.append(stage, meta);
      grid.appendChild(card);
    });
    main.appendChild(grid);
    root.appendChild(main);
  }
  function tryLive(tp) {
    modal((box, close) => {
      box.classList.add('tp-live');
      const left = el('div', 'tp-live-p');
      left.appendChild(tplPhone(tp.doc, 340, true, tp.title));
      const right = el('div', 'col tp-live-i');
      right.append(el('span', 'tag tag-brand', 'امتحان زنده'), el('b', 'h2', tp.title), el('p', 'cap', (tp.store || {}).desc || tp.desc || ''));
      const comps = el('div', 'tp-chips');
      const types = [...new Set(blocksOf(tp.doc).map(b => b.type))];
      types.forEach(ty => { const c = el('span', 'tag tag-mute'); c.append(ES.icon(ES.ICONS[spec(ty).icon] ? spec(ty).icon : 'list'), document.createTextNode(spec(ty).title)); comps.appendChild(c); });
      right.append(el('span', 'st-lbl', 'اجزای این قالب'), comps,
        el('p', 'cap', 'این پیش‌نمایش زنده است: بزن، پیمایش کن، از نوار پایین صفحه عوض کن. محتوا نمونه است.'));
      const row = el('div', 'st-row');
      row.append(btn('btn-ghost', 'بستن', null, close), btn('btn-primary grow', 'نصب روی مینی‌اپ…', 'down', () => { close(); install(tp); }));
      right.appendChild(row);
      box.append(left, right);
    }, 'st-mbox--l');
  }
  function blocksOf(doc) { return (doc.pages || []).flatMap(p => p.blocks || []); }
  function install(tp) {
    const d = S.apps;
    const kitName = k => ({ mag: 'مجله', shab: 'قسمت' }[k] || 'پایه');
    let pick = d.apps.length ? String(d.apps[0].id) : 'new';
    modal((box, close) => {
      box.append(el('b', 'h2', `«${tp.title}» روی کدام مینی‌اپ نصب شود؟`), el('p', 'cap', 'هر مینی‌اپ یک ربات تلگرام توست.'));
      const list = el('div', 'tp-opts');
      const draw = () => {
        list.textContent = '';
        d.apps.forEach(a => {
          const o = el('button', 'tp-opt' + (pick === String(a.id) ? ' on' : ''));
          o.type = 'button';
          const sq = el('span', 'st-app-sq st-app-sq--s', (a.name || '؟').charAt(0));
          sq.style.background = a.kit === 'mag' ? '#1D55F0' : a.kit === 'shab' ? '#D0452B' : '#4B2EE8';
          const tx = el('span', 'col grow');
          tx.append(el('b', '', a.name), el('span', 'cap', 'قالب فعلی: ' + kitName(a.kit)));
          if (a.kit === tp.kit) tx.appendChild(el('span', 'tp-warn ok', 'همین قالب را دارد؛ نصب دوباره ظاهر را به حالت اول برمی‌گرداند'));
          else if (a.kit && a.kit !== 'base') tx.appendChild(el('span', 'tp-warn', `اجزا، تنظیمات و محتوای قالب «${kitName(a.kit)}» برداشته می‌شوند`));
          o.append(sq, tx, el('i', 'tp-radio'));
          o.addEventListener('click', () => { pick = String(a.id); draw(); });
          list.appendChild(o);
        });
        const n = el('button', 'tp-opt' + (pick === 'new' ? ' on' : ''));
        n.type = 'button';
        n.disabled = !d.can_create;
        const sq = el('span', 'st-app-sq st-app-sq--s tp-new');
        sq.appendChild(ic('plus'));
        const tx = el('span', 'col grow');
        tx.append(el('b', '', 'مینی‌اپ تازه'), el('span', 'cap', d.can_create ? 'با همین قالب ساخته می‌شود' : 'پلنت پر است؛ در ربات ارتقا بده'));
        n.append(sq, tx, el('i', 'tp-radio'));
        n.addEventListener('click', () => { pick = 'new'; draw(); });
        list.appendChild(n);
        name.style.display = pick === 'new' ? '' : 'none';
      };
      const name = el('input', 'st-in');
      name.placeholder = 'اسم مینی‌اپ (مثلاً اسم کانالت)';
      name.maxLength = 40;
      draw();
      box.append(list, name);
      const go2 = btn('btn-primary grow', 'نصب و باز کردن استودیو', 'down', async () => {
        go2.disabled = true;
        try {
          if (pick === 'new') {
            if (name.value.trim().length < 2) { name.focus(); toast('اسم حداقل ۲ حرف', true); go2.disabled = false; return; }
            const r = await api('app/create', { name: name.value.trim(), template: tp.id });
            close(); S.apps = null; go('/' + r.app.id);
          } else {
            const a = d.apps.find(x => String(x.id) === pick);
            if (a.kit && a.kit !== 'base' && a.kit !== tp.kit && !await confirmBox(`مطمئنی؟ محتوای قالب «${kitName(a.kit)}» در «${a.name}» برای همیشه پاک می‌شود.`, 'بله، نصب کن', true)) { go2.disabled = false; return; }
            await api('app/template', { id: a.id, template: tp.id });
            close(); S.apps = null; S.app = null; go('/' + a.id);
          }
        } catch (e) { go2.disabled = false; failed(e); }
      });
      const row = el('div', 'st-row');
      row.append(btn('btn-ghost', 'انصراف', null, close), go2);
      box.appendChild(row);
    }, 'st-mbox--m');
  }

  /* ===================== محیط کار یک مینی‌اپ ===================== */
  async function loadApp(id) {
    const d = await api('app?id=' + encodeURIComponent(id));
    S.app = d.app; S.doc = d.doc; S.home = d.mag_home || null; S.stats = d.stats; S.kits = d.schema.kits;
    S.pub = d.published || null; S.plan = d.plan; S.demoMag = d.demo_mag || null;
    S.hist = []; S.fut = []; S.sel = null; S.page = (d.doc.pages[0] || {}).id || 'home'; S.post = null; S.mode = 'edit';
    await schema();
    if (S.doc.kit === 'mag') await loadMag();
  }
  async function loadMag() {
    S.mag = await api('mag/data?app=' + S.app.id);
  }
  const TABS = [['design', 'pal', 'طراحی'], ['content', 'list', 'مطالب'], ['taxonomy', 'folder', 'دسته‌ها'], ['settings', 'sliders', 'تنظیمات']];
  function workspace() {
    root.textContent = '';
    document.body.classList.toggle('in-ed', S.tab === 'design');
    const mag = S.doc.kit === 'mag';
    const back = iconBtn('back', 'میز کار', () => go(''));
    const sq = el('span', 'st-app-sq st-app-sq--s', (S.app.name || '؟').charAt(0));
    sq.style.background = mag ? '#1D55F0' : '#4B2EE8';
    const name = el('span', 'st-ws-name');
    name.append(el('b', '', S.app.name), el('span', 'cap', `${S.app.status === 'paused' ? 'خاموش' : 'روشن'} · قالب «${{ mag: 'مجله', shab: 'قسمت' }[S.doc.kit] || 'پایه'}»`));
    const nav = el('nav', 'st-tabs');
    TABS.filter(t => mag || t[0] === 'settings' || t[0] === 'design').forEach(([id, i, label]) => {
      const b = el('button', 'st-tab' + ((S.tab === id || (S.tab === 'write' && id === 'content')) ? ' on' : ''));
      b.type = 'button';
      b.append(ic(i), document.createTextNode(label));
      b.addEventListener('click', () => go('/' + S.app.id + '/' + id));
      nav.appendChild(b);
    });
    const end = el('div', 'st-ws-end');
    end.id = 'ws-end';
    root.appendChild(topbar([back, sq, name, el('span', 'st-gap'), nav, el('span', 'st-gap'), end]));
    const main = el('main', 'st-main');
    main.id = 'main';
    root.appendChild(main);
    if (!mag && !['settings', 'design'].includes(S.tab)) S.tab = 'design';
    ({ design, content, write: writer, taxonomy, settings }[S.tab] || design)(main);
  }


  /* ===================== طراحی: استودیوی مینی‌اپ =====================
     وسط: خود مینی‌اپ با همان موتور خواننده (render.js)، داخل قاب تلگرام.
     کنار هر بخش یک دستگیره؛ بگیر و بکش تا جابه‌جا شود. از پنل «اجزا» بکش
     داخل گوشی تا اضافه شود. با انتخاب هر چیز، تنظیم همان در ستون راست. */
  const PAGE_LABELS = { home: 'خانه', cats: 'دسته‌ها', saved: 'ذخیره‌ها', authors: 'نویسنده‌ها' };
  const VIRTUAL = [['@post', 'text', 'صفحهٔ مطلب'], ['@cat', 'folder', 'صفحهٔ دسته'], ['@author', 'user', 'صفحهٔ نویسنده']];
  const spec = t => (S.schema.blocks[t] || { title: t, fields: [], icon: 'spark', style: [] });
  const curPage = () => S.doc.pages.find(p => p.id === S.page) || null;
  const curBlock = () => { const p = curPage(); return p && S.sel ? p.blocks.find(b => b.id === S.sel) || null : null; };
  const J = o => JSON.stringify(o === undefined ? null : o);
  const SIZES = { s: 360, m: 390, l: 430 };
  function newId() { return 'b' + Math.random().toString(36).slice(2, 9).replace(/[^a-z0-9]/g, 'x'); }
  function defaults(type) {
    const out = {};
    (spec(type).fields || []).forEach(f => { out[f.key] = clone(f.default === undefined ? '' : f.default); });
    return out;
  }
  function blkIcon(type) {
    const n = spec(type).icon;
    return ES.icon(ES.ICONS[n] ? n : 'list');
  }

  /* ---------- تاریخچه و ذخیره ---------- */
  // keepPanel: تایپ در فیلدهای پنل؛ فقط گوشی تازه می‌شود تا فوکوس نپرد
  function change(fn, keepPanel) {
    S.hist.push(JSON.stringify(S.doc));
    if (S.hist.length > 80) S.hist.shift();
    S.fut = [];
    fn();
    S.app.dirty = true;
    if (keepPanel) { renderPhone(); renderBar(); } else renderEditor();
    scheduleSave();
  }
  function scheduleSave() {
    S.pending = true;
    saveState('busy');
    clearTimeout(S.saveT);
    S.saveT = setTimeout(saveNow, 700);
  }
  async function saveNow() {
    clearTimeout(S.saveT);
    if (S.saving) { S.saveT = setTimeout(saveNow, 400); return; }
    S.saving = true;
    try {
      const r = await api('app/save', { id: S.app.id, doc: S.doc });
      S.app = r.app;
      S.pending = false;
      saveState('ok');
    } catch (e) { failed(e); saveState('bad'); } finally { S.saving = false; }
  }
  function saveState(st) {
    const s = $('save-st');
    if (!s) return;
    s.className = 'st-save st-save--' + st;
    s.textContent = { busy: 'در حال ذخیره…', ok: 'ذخیره شد', bad: 'ذخیره نشد' }[st] || '';
  }
  function undo() {
    if (!S.hist.length) return;
    S.fut.push(JSON.stringify(S.doc));
    S.doc = JSON.parse(S.hist.pop());
    if (S.sel && S.sel !== 'header' && S.sel !== 'tabbar' && !curBlock()) S.sel = null;
    renderEditor();
    scheduleSave();
  }
  function redo() {
    if (!S.fut.length) return;
    S.hist.push(JSON.stringify(S.doc));
    S.doc = JSON.parse(S.fut.pop());
    renderEditor();
    scheduleSave();
  }

  /* ---------- پوسته ---------- */
  function design(main) {
    S.fut = S.fut || [];
    S.mode = S.mode || 'edit';
    S.ptab = S.ptab || 'parts';
    S.btab = 'content';
    S.size = S.size || 'm';
    S.tg = S.tg || 'light';
    main.classList.add('st-ed');
    main.innerHTML = '<aside class="ed-panel" id="ed-panel"></aside>'
      + '<section class="ed-canvas" id="ed-canvas"><div class="ed-ctop" id="ed-ctop"></div>'
      + '<div class="ed-stage" id="ed-stage"><div class="ed-phone" id="ed-phone"><div class="ed-tgbar" id="ed-tgbar"></div>'
      + '<div class="ed-screen" id="ed-screen"><div id="ed-page"></div></div></div></div>'
      + '<div class="ed-ov" id="ed-ov"></div><div class="ed-tip" id="ed-tip"></div></section>';
    $('ed-page').addEventListener('scroll', () => requestAnimationFrame(placeOverlay), { passive: true });
    $('ed-page').addEventListener('click', inlineClick, true);
    $('ed-page').addEventListener('mouseover', e => {
      if (S.mode !== 'edit') return;
      const w = e.target.closest('.pg-block');
      hoverId(w ? w.dataset.id : null);
    });
    $('ed-page').addEventListener('mouseleave', () => hoverId(null));
    window.onresize = () => { fitPhone(); placeOverlay(); };
    document.onkeydown = keys;
    renderEditor();
  }
  function keys(e) {
    if (S.tab !== 'design') return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
    if (typing || document.querySelector('.st-modal')) return;
    const b = curBlock();
    if (e.key === 'Escape') { select(null); return; }
    if (b && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); removeBlock(b.id); return; }
    if (b && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveBlock(b.id, e.key === 'ArrowUp' ? -1 : 1); }
  }
  function renderEditor() {
    if (S.tab !== 'design' || !$('ed-panel')) return;
    renderBar();
    renderCanvasTop();
    renderPhone();
    renderPanel();
  }
  function select(id) {
    if (S.sel !== id) S.btab = 'content';
    S.sel = id;
    renderPhone();
    renderPanel();
  }

  /* ---------- نوار بالا: حالت، برگشت، تغییرها، انتشار ---------- */
  function renderBar() {
    const end = $('ws-end');
    if (!end || S.tab !== 'design') return;
    end.textContent = '';
    const modes = el('div', 'ed-modes');
    [['edit', 'pen', 'ویرایش'], ['test', 'play', 'تست زنده']].forEach(([id, i, label]) => {
      const b = el('button', S.mode === id ? 'on' : '');
      b.type = 'button';
      b.append(ic(i), document.createTextNode(label));
      b.addEventListener('click', () => { S.mode = id; S.sel = id === 'test' ? null : S.sel; renderEditor(); });
      modes.appendChild(b);
    });
    const st = el('span', 'st-save st-save--' + (S.pending ? 'busy' : 'ok'), S.pending ? 'در حال ذخیره…' : 'ذخیره شد');
    st.id = 'save-st';
    const u = iconBtn('undo', 'برگرداندن (Ctrl+Z)', undo);
    u.disabled = !S.hist.length;
    const r = iconBtn('redo', 'دوباره (Ctrl+Shift+Z)', redo);
    r.disabled = !(S.fut && S.fut.length);
    const list = diffs();
    const n = list.length;
    const chip = el('button', 'ed-changes' + (n ? '' : ' none'));
    chip.type = 'button';
    chip.textContent = n ? (S.pub ? fa(n) + ' تغییر منتشرنشده' : 'هنوز منتشر نشده') : 'همه منتشر شده';
    chip.disabled = !n;
    chip.addEventListener('click', publishBox);
    const pub = btn('btn-primary btn-sm', 'منتشر کن', 'send', publishBox);
    pub.disabled = !n;
    end.append(modes, el('span', 'st-gap'), st, u, r, chip, pub);
  }

  /* ---------- بالای گوشی: صفحه‌ها ---------- */
  function renderCanvasTop() {
    const t = $('ed-ctop');
    t.textContent = '';
    const seg = el('div', 'ed-pages');
    const pages = S.doc.pages.map(p => [p.id, p.title || PAGE_LABELS[p.id] || p.id]);
    if (S.doc.kit === 'mag' && S.mode === 'edit') VIRTUAL.forEach(([id, , label]) => pages.push([id, label]));
    pages.forEach(([id, label]) => {
      const b = el('button', (S.page === id ? 'on' : '') + (id[0] === '@' ? ' v' : ''), label);
      b.type = 'button';
      b.addEventListener('click', () => { S.page = id; if (S.sel !== 'header' && S.sel !== 'tabbar') S.sel = null; renderEditor(); });
      seg.appendChild(b);
    });
    t.appendChild(seg);
    if (S.page[0] === '@') t.appendChild(el('span', 'ed-vnote', 'این صفحه خودکار از روی تم ساخته می‌شود'));
  }

  /* ---------- گوشی ---------- */
  function previewDoc() {
    if (S.mode !== 'test' || S.doc.theme.mode !== 'auto') return S.doc;
    const d = clone(S.doc);
    d.theme.mode = S.tg;   // «مثل تلگرام»: تم تلگرام امتحانی
    return d;
  }
  function magData() {
    const h = S.home;
    return h && (h.latest || []).length ? h : (S.demoMag || h || { cats: [], authors: [], latest: [], popular: [] });
  }
  function testMagApi() {
    const data = () => magData();
    return {
      post: async id => {
        try { return (await api('mag/get?app=' + S.app.id + '&id=' + encodeURIComponent(id))).post; } catch (e) { return (data().latest || []).find(p => p.id === id) || null; }
      },
      list: async q => {
        let posts = (data().latest || []).slice();
        if (q.cat) posts = posts.filter(p => p.cat === q.cat);
        if (q.author) posts = posts.filter(p => p.author === q.author);
        if (q.tag) posts = posts.filter(p => (p.tags || []).includes(q.tag));
        if (q.q) posts = posts.filter(p => (p.title + ' ' + (p.lead || '')).includes(q.q));
        return { posts, more: false, offset: 0 };
      },
    };
  }
  async function firstPost() {
    const pub = (S.mag && S.mag.posts || []).find(p => p.state === 'pub');
    if (!pub) return null;
    if (S._pv && S._pv.id === pub.id) return S._pv;
    try { S._pv = (await api('mag/get?app=' + S.app.id + '&id=' + pub.id)).post; } catch (e) { S._pv = null; }
    return S._pv;
  }
  async function renderPhone() {
    const pg = $('ed-page'), scr = $('ed-screen');
    if (!pg) return;
    const top = pg.scrollTop;
    const edit = S.mode === 'edit';
    const phone = $('ed-phone');
    phone.style.setProperty('--w', SIZES[S.size] + 'px');
    const pal = ES.palette(previewDoc().theme, S.doc.kit, S.doc.opts);
    phone.classList.toggle('dark', pal.dark);
    tgBar();
    const opts = { editing: edit, appName: S.app.name, mag: magData(), appKey: 'studio-' + S.app.id, page: curPage() ? S.page : 'home' };
    if (edit) {
      Object.assign(opts, {
        selected: S.sel,
        onPick: id => select(id),
        onPickHeader: () => select('header'),
        onPickTabbar: pid => { if (pid && pid !== S.page && S.doc.pages.some(p => p.id === pid)) S.page = pid; S.sel = 'tabbar'; renderEditor(); },
      });
    } else {
      Object.assign(opts, { magApi: testMagApi(), onNavigate: id => { S.page = id; renderCanvasTop(); renderPhone(); pg.scrollTop = 0; } });
    }
    if (S.page === '@post') { const p = await firstPost(); opts.magView = p ? { post: p } : null; }
    else if (S.page === '@cat') { const c = magData().cats[0]; opts.magView = c ? { list: { cat: c.id, title: c.name, color: c.color } } : null; }
    else if (S.page === '@author') { const a = magData().authors[0]; opts.magView = a ? { list: { author: a.id, title: a.name, who: a } } : null; }
    ES.render(pg, previewDoc(), opts);
    pg.style.setProperty('--pg-top', '0px');
    scr.style.background = pal.bg;
    pg.scrollTop = top;
    if (edit && S.sel && S.sel !== 'header' && S.sel !== 'tabbar' && S._scrollTo === S.sel) {
      const n = pg.querySelector(`[data-id="${S.sel}"]`);
      if (n) pg.scrollTop = Math.max(0, n.offsetTop - 90);
      S._scrollTo = null;
    }
    fitPhone();
    placeOverlay();
    tip();
  }
  function tgBar() {
    const b = $('ed-tgbar');
    b.textContent = '';
    const sb = el('div', 'ed-sbar');
    sb.append(el('b', '', '۹:۴۱'), el('span', 'ed-bat'));
    const head = el('div', 'ed-tghead');
    head.append(el('span', 'ed-tgx', 'بستن'), el('b', '', S.app.name), el('span', 'ed-tgm', '⋯'));
    b.append(sb, head);
  }
  function fitPhone() {
    const st = $('ed-stage'), ph = $('ed-phone');
    if (!st || !ph) return;
    const w = SIZES[S.size] + 24, hgt = 868;
    const s = Math.min(1, (st.clientHeight - 8) / hgt, (st.clientWidth - 150) / w);
    ph.style.transform = `scale(${s.toFixed(4)})`;
    ph.style.marginBottom = (hgt * (s - 1)).toFixed(0) + 'px';
  }
  function tip() {
    const t = $('ed-tip');
    if (!t) return;
    t.textContent = '';
    if (S.mode === 'test') { t.append(ic('play'), document.createTextNode('تست زنده: بزن، پیمایش کن، صفحه عوض کن؛ همین را خواننده می‌بیند.')); return; }
    if (S.page[0] === '@') return;
    const b = curBlock();
    t.append(ic(b ? 'pen' : 'grip'), document.createTextNode(b
      ? 'روی متن‌های بخش انتخاب‌شده بزن و همان‌جا تایپ کن · Alt+↑↓ جابه‌جایی · Delete حذف'
      : 'روی هر بخش بزن تا تنظیمش باز شود · با دستگیرهٔ کنار هر بخش جابه‌جا کن'));
  }

  /* ---------- دستگیره‌ها و ابزار کنار بخش ---------- */
  function hoverId(id) {
    if (S._hover === id) return;
    S._hover = id;
    document.querySelectorAll('.ed-h').forEach(h => h.classList.toggle('hot', h.dataset.id === id));
    document.querySelectorAll('#ed-page .pg-block').forEach(w => w.classList.toggle('ed-hot', w.dataset.id === id && id !== S.sel));
  }
  function blockNodes() { return Array.from(document.querySelectorAll('#ed-page > .pg-blocks > .pg-block')); }
  function placeOverlay() {
    const ov = $('ed-ov'), cv = $('ed-canvas'), scr = $('ed-screen');
    if (!ov || !cv) return;
    ov.textContent = '';
    if (S.mode !== 'edit' || S.page[0] === '@' || S.drag) return;
    const cr = cv.getBoundingClientRect(), sr = scr.getBoundingClientRect();
    const sx = sr.right - cr.left + 16;
    blockNodes().forEach(node => {
      const r = node.getBoundingClientRect();
      const top = Math.max(r.top, sr.top), bot = Math.min(r.bottom, sr.bottom);
      if (bot - top < 22) return;
      const id = node.dataset.id;
      const h = el('button', 'ed-h' + (id === S.sel ? ' on' : '') + (id === S._hover ? ' hot' : ''));
      h.type = 'button';
      h.dataset.id = id;
      h.title = 'بگیر و بکش تا جابه‌جا شود';
      h.setAttribute('aria-label', 'جابه‌جایی ' + spec(node.dataset.type).title);
      h.style.cssText = `top:${(top - cr.top + 4).toFixed(0)}px; left:${sx.toFixed(0)}px; height:${(bot - top - 8).toFixed(0)}px`;
      h.appendChild(ic('grip'));
      h.addEventListener('mouseenter', () => hoverId(id));
      h.addEventListener('pointerdown', ev => startDrag(ev, { kind: 'move', id, node }));
      ov.appendChild(h);
      if (id === S.sel) sideTools(ov, id, top - cr.top, sr.left - cr.left);
    });
  }
  function sideTools(ov, id, top, left) {
    const p = curPage(), i = p.blocks.findIndex(b => b.id === id), b = p.blocks[i];
    const box = el('div', 'ed-side');
    box.style.cssText = `top:${Math.max(8, top + 4).toFixed(0)}px; left:${(left - 62).toFixed(0)}px`;
    const up = iconBtn('up', 'بالا (Alt+↑)', () => moveBlock(id, -1));
    up.disabled = i === 0;
    const dn = iconBtn('down', 'پایین (Alt+↓)', () => moveBlock(id, 1));
    dn.disabled = i === p.blocks.length - 1;
    box.append(up, dn, iconBtn('copy', 'تکرار', () => dupBlock(id)),
      iconBtn(b.hidden ? 'eye' : 'eyeoff', b.hidden ? 'نمایش در مینی‌اپ' : 'پنهان از خواننده‌ها', () => hideBlock(id)),
      iconBtn('trash', 'حذف (Delete)', () => removeBlock(id), 'danger'));
    ov.appendChild(box);
  }

  /* ---------- کارهای روی بخش ---------- */
  function moveBlock(id, d) {
    const p = curPage(), i = p.blocks.findIndex(b => b.id === id), j = i + d;
    if (i < 0 || j < 0 || j >= p.blocks.length) return;
    change(() => { const [x] = p.blocks.splice(i, 1); p.blocks.splice(j, 0, x); S._scrollTo = id; });
  }
  function dupBlock(id) {
    const p = curPage(), i = p.blocks.findIndex(b => b.id === id);
    const copy = clone(p.blocks[i]);
    copy.id = newId();
    change(() => { p.blocks.splice(i + 1, 0, copy); S.sel = copy.id; S._scrollTo = copy.id; });
    toast('تکرار شد');
  }
  function hideBlock(id) {
    const b = curPage().blocks.find(x => x.id === id);
    change(() => { if (b.hidden) delete b.hidden; else b.hidden = true; });
    toast(b.hidden ? 'پنهان شد؛ خواننده‌ها نمی‌بینند' : 'دوباره نمایش داده می‌شود');
  }
  function removeBlock(id) {
    const p = curPage(), i = p.blocks.findIndex(b => b.id === id);
    if (i < 0) return;
    const title = spec(p.blocks[i].type).title;
    change(() => { p.blocks.splice(i, 1); if (S.sel === id) S.sel = null; });
    toast(`«${title}» برداشته شد · Ctrl+Z برای برگرداندن`);
  }
  function addBlock(type, at) {
    const p = curPage();
    if (!p) { toast('اول یکی از صفحه‌ها را انتخاب کن', true); return; }
    const sp = spec(type);
    if (sp.premium && S.plan && !S.plan.premium_blocks) { toast(`«${sp.title}» مخصوص پلن‌های حرفه‌ای است`, true); return; }
    const blk = { id: newId(), type, props: defaults(type) };
    if (at == null) { const si = S.sel ? p.blocks.findIndex(b => b.id === S.sel) : -1; at = si >= 0 ? si + 1 : p.blocks.length; }
    change(() => { p.blocks.splice(at, 0, blk); S.sel = blk.id; S.btab = 'content'; S._scrollTo = blk.id; });
    toast(`«${sp.title}» اضافه شد`);
  }

  /* ---------- کشیدن و رها کردن ---------- */
  function ghostOf(info) {
    const g = el('div', 'ed-ghost');
    const inner = el('div', $('ed-page').className);
    inner.setAttribute('style', $('ed-page').getAttribute('style') || '');
    inner.style.width = '390px';
    if (info.kind === 'move') inner.appendChild(info.node.cloneNode(true));
    else {
      const t = el('div', '');
      ES.render(t, miniDoc(info.type), { editing: true, mag: magData(), appName: S.app.name });
      inner.appendChild(t);
    }
    g.appendChild(inner);
    const lab = el('span', 'ed-ghost-l');
    lab.append(blkIcon(info.kind === 'move' ? info.node.dataset.type : info.type), document.createTextNode(spec(info.kind === 'move' ? info.node.dataset.type : info.type).title));
    g.appendChild(lab);
    return g;
  }
  function dropIndex(x, y, info) {
    const sr = $('ed-screen').getBoundingClientRect();
    const inside = x >= sr.left - 40 && x <= sr.right + 90 && y >= sr.top - 30 && y <= sr.bottom + 30;
    if (!inside && info.kind === 'add') return null;
    const nodes = blockNodes().filter(n => !(info.kind === 'move' && n.dataset.id === info.id));
    let idx = 0;
    nodes.forEach(n => { const r = n.getBoundingClientRect(); if (y > r.top + r.height / 2) idx += 1; });
    return idx;
  }
  function dropLine(idx, info) {
    const ov = $('ed-ov'), cv = $('ed-canvas'), scr = $('ed-screen');
    let line = $('ed-line');
    if (idx == null) { if (line) line.remove(); return; }
    if (!line) { line = el('div', 'ed-line'); line.id = 'ed-line'; line.appendChild(el('span', '', 'اینجا رها کن')); ov.appendChild(line); }
    const cr = cv.getBoundingClientRect(), sr = scr.getBoundingClientRect();
    const nodes = blockNodes().filter(n => !(info.kind === 'move' && n.dataset.id === info.id));
    let y;
    if (!nodes.length) y = sr.top + 60;
    else if (idx === 0) y = nodes[0].getBoundingClientRect().top - 7;
    else if (idx >= nodes.length) y = nodes[nodes.length - 1].getBoundingClientRect().bottom + 7;
    else y = (nodes[idx - 1].getBoundingClientRect().bottom + nodes[idx].getBoundingClientRect().top) / 2;
    y = Math.max(sr.top + 4, Math.min(sr.bottom - 4, y));
    line.style.cssText = `top:${(y - cr.top - 2).toFixed(0)}px; left:${(sr.left - cr.left + 8).toFixed(0)}px; width:${(sr.width - 16).toFixed(0)}px`;
  }
  function startDrag(ev, info) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const sx = ev.clientX, sy = ev.clientY;
    let started = false, ghost = null, idx = null, lastY = sy, lastX = sx, timer = 0;
    const scr = $('ed-screen'), pgEl = $('ed-page');
    const move = e => {
      lastY = e.clientY;
      lastX = e.clientX;
      if (!started) {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) < 5) return;
        started = true;
        S.drag = info;
        ghost = ghostOf(info);
        document.body.appendChild(ghost);
        document.body.classList.add('ed-dragging');
        $('ed-ov').querySelectorAll('.ed-h, .ed-side').forEach(n => n.remove());
        if (info.kind === 'move') info.node.classList.add('ed-lift');
        timer = setInterval(() => {
          const sr = scr.getBoundingClientRect();
          if (lastX < sr.left - 40 || lastX > sr.right + 90) return;   // فقط وقتی روی گوشی است
          if (lastY < sr.top + 56) pgEl.scrollTop -= 14;
          else if (lastY > sr.bottom - 56) pgEl.scrollTop += 14;
          else return;
          dropLine(idx = dropIndex(lastX, lastY, info), info);
        }, 30);
      }
      ghost.style.transform = `translate(${(e.clientX - 150).toFixed(0)}px, ${(e.clientY - 26).toFixed(0)}px) rotate(-2.5deg)`;
      idx = dropIndex(e.clientX, e.clientY, info);
      dropLine(idx, info);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      clearInterval(timer);
      if (!started) { if (info.onClick) info.onClick(); else if (info.kind === 'move') select(info.id); return; }
      ghost.remove();
      document.body.classList.remove('ed-dragging');
      S.drag = null;
      dropLine(null);
      if (info.kind === 'move') info.node.classList.remove('ed-lift');
      if (idx == null) { placeOverlay(); return; }
      if (info.kind === 'add') { addBlock(info.type, idx); return; }
      const p = curPage(), from = p.blocks.findIndex(b => b.id === info.id);
      const rest = p.blocks.filter(b => b.id !== info.id);
      if (idx === from) { select(info.id); return; }
      change(() => { rest.splice(idx, 0, p.blocks[from]); p.blocks = rest; S.sel = info.id; });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /* ---------- نوشتن روی خود گوشی ---------- */
  function setPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) { o = o[/^\d+$/.test(keys[i]) ? Number(keys[i]) : keys[i]]; if (!o) return; }
    o[keys[keys.length - 1]] = value;
  }
  function inlineClick(e) {
    if (S.mode !== 'edit') return;
    const t = e.target.closest('[data-edit]');
    if (!t || t.isContentEditable) return;
    const wrap = t.closest('.pg-block');
    const inHeader = !!t.closest('.pg-header');
    const owner = wrap ? wrap.dataset.id : (inHeader ? 'header' : null);
    if (!owner || owner !== S.sel) return;   // اول انتخاب، بعد تایپ
    e.stopPropagation();
    e.preventDefault();
    const before = t.textContent;
    t.contentEditable = 'true';
    t.classList.add('ed-typing');
    t.focus();
    const range = document.createRange();
    range.selectNodeContents(t);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const multi = /body|desc|subtitle|text|\.a$/.test(t.dataset.edit);
    const done = keep => {
      t.removeEventListener('blur', onBlur);
      t.removeEventListener('keydown', onKey);
      t.contentEditable = 'false';
      t.classList.remove('ed-typing');
      const v = t.innerText.replace(/ /g, ' ').trim();
      if (!keep || v === before.trim()) { t.textContent = before; return; }
      change(() => {
        if (owner === 'header') S.doc.header[t.dataset.edit] = v;
        else { const b = curPage().blocks.find(x => x.id === owner); if (b) setPath(b.props, t.dataset.edit, v); }
      });
    };
    const onBlur = () => done(true);
    const onKey = k => {
      if (k.key === 'Escape') { k.preventDefault(); done(false); }
      else if (k.key === 'Enter' && (!multi || k.ctrlKey)) { k.preventDefault(); t.blur(); }
    };
    t.addEventListener('blur', onBlur);
    t.addEventListener('keydown', onKey);
  }

  /* ===================== ستون راست ===================== */
  function renderPanel() {
    const p = $('ed-panel');
    if (!p) return;
    const keepScroll = p.scrollTop;
    p.textContent = '';
    if (S.mode === 'test') { testPanel(p); return; }
    if (S.sel === 'header') headerPanel(p);
    else if (S.sel === 'tabbar') tabbarPanel(p);
    else if (curBlock()) blockPanel(p, curBlock());
    else homePanel(p);
    if (S._keepPanelScroll) p.scrollTop = keepScroll;
    S._keepPanelScroll = false;
  }
  function ptabs(p) {
    const t = el('div', 'ed-ptabs');
    [['parts', 'plus', 'اجزا'], ['tree', 'layers', 'ساختار'], ['look', 'pal', 'تم و ظاهر']].forEach(([id, i, label]) => {
      const b = el('button', S.ptab === id ? 'on' : '');
      b.type = 'button';
      b.append(ic(i), document.createTextNode(label));
      b.addEventListener('click', () => { S.ptab = id; renderPanel(); });
      t.appendChild(b);
    });
    p.appendChild(t);
  }
  function homePanel(p) {
    ptabs(p);
    const body = el('div', 'ed-pbody');
    p.appendChild(body);
    ({ parts: partsTab, tree: treeTab, look: lookTab }[S.ptab] || partsTab)(body);
  }
  function crumb(p, title, sub, iconNode, menu) {
    const c = el('div', 'ed-crumb');
    const back = el('button', 'ed-back');
    back.type = 'button';
    back.append(ic('fwd'), document.createTextNode('همهٔ اجزا'));
    back.addEventListener('click', () => select(null));
    const head = el('div', 'ed-bh');
    const i = el('span', 'ed-bi');
    i.appendChild(iconNode);
    const tx = el('div', 'ed-bt');
    tx.append(el('b', '', title), el('span', 'cap', sub || ''));
    head.append(i, tx);
    if (menu) head.appendChild(menu);
    c.append(back, head);
    p.appendChild(c);
  }
  function group(p, title, open, build, hint) {
    const g = el('section', 'ed-grp' + (open === false ? ' shut' : ''));
    const h = el('button', 'ed-grp-h');
    h.type = 'button';
    h.append(el('b', '', title), ic('down'));
    h.addEventListener('click', () => g.classList.toggle('shut'));
    const b = el('div', 'ed-grp-b');
    build(b);
    if (hint) b.appendChild(el('p', 'cap ed-hint', hint));
    g.append(h, b);
    p.appendChild(g);
    return g;
  }

  /* ---------- پیش‌نمایش کوچک (همان موتور) ---------- */
  function miniDoc(type, props, style, base) {
    const d = base || S.doc;
    return { v: 2, kit: d.kit, theme: d.theme, opts: d.opts, header: { enabled: false }, tabbar: { enabled: false },
      pages: [{ id: 'p', title: '', icon: 'home', blocks: [{ id: 'bprev', type, props: props || defaults(type), style: style || {} }] }] };
  }
  function mini(doc, width, maxH, opts) {
    const box = el('div', 'ed-mini');
    const s = width / 390;
    const inner = el('div', 'ed-mini-in');
    inner.style.transform = `scale(${s.toFixed(4)})`;
    const r = el('div', '');
    inner.appendChild(r);
    box.appendChild(inner);
    try { ES.render(r, doc, Object.assign({ editing: true, mag: magData(), appName: S.app.name }, opts || {})); } catch (e) { /* پیش‌نمایش اختیاری است */ }
    box.style.width = width + 'px';
    requestAnimationFrame(() => {
      const hh = inner.offsetHeight * s;
      box.style.height = Math.min(maxH, Math.max(36, hh)).toFixed(0) + 'px';
      if (hh > maxH) box.classList.add('cut');
    });
    box.style.height = Math.min(maxH, 120) + 'px';
    return box;
  }

  /* ---------- زبانهٔ «اجزا» ---------- */
  function kitTypes() {
    const kit = S.doc.kit || 'base';
    const all = Object.keys(S.schema.blocks);
    const own = (S.schema.order || all).filter(t => (S.schema.blocks[t] || {}).kit === kit);
    const gen = kit === 'base'
      ? (S.schema.order || all).filter(t => !(S.schema.blocks[t] || {}).kit)
      : ((S.kits[kit] || {}).generic || []);
    return { own: kit === 'base' ? [] : own, gen };
  }
  function partsTab(b) {
    const q = el('input', 'st-in ed-search');
    q.placeholder = 'جستجوی جزء…';
    q.value = S.q2 || '';
    b.appendChild(q);
    const list = el('div', 'ed-parts');
    b.appendChild(list);
    const kitName = (S.kits[S.doc.kit] || {}).title || 'پایه';
    const draw = () => {
      list.textContent = '';
      const term = (S.q2 || '').trim();
      const { own, gen } = kitTypes();
      const match = t => !term || (spec(t).title + ' ' + (spec(t).desc || '')).includes(term);
      const sec = (title, sub, types) => {
        const tt = types.filter(match);
        if (!tt.length) return;
        const h = el('div', 'ed-parts-h');
        h.append(el('b', '', title), el('span', 'cap', sub));
        list.appendChild(h);
        tt.forEach(t => list.appendChild(partCard(t)));
      };
      if (own.length) sec('اجزای قالب «' + kitName + '»', fa(own.length) + ' جزء', own);
      sec(own.length ? 'اجزای عمومی' : 'اجزا', own.length ? 'در همهٔ قالب‌ها' : fa(gen.length) + ' جزء', gen);
      if (!list.childElementCount) list.appendChild(el('p', 'cap ed-hint', 'چیزی پیدا نشد.'));
    };
    q.addEventListener('input', () => { S.q2 = q.value; draw(); });
    draw();
    b.appendChild(el('p', 'cap ed-hint', 'کارت را بگیر و داخل گوشی رها کن، یا + بزن تا زیر بخش انتخاب‌شده (یا آخر صفحه) بنشیند.'));
  }
  function partCard(t) {
    const sp = spec(t);
    const c = el('div', 'ed-part');
    const locked = sp.premium && S.plan && !S.plan.premium_blocks;
    const pv = mini(miniDoc(t), 312, 150);
    pv.classList.add('ed-part-pv');
    const row = el('div', 'ed-part-r');
    const tx = el('div', 'ed-part-t');
    tx.append(el('b', '', sp.title), el('span', 'cap', sp.desc || ''));
    const add = iconBtn(locked ? 'lock' : 'plus', locked ? 'مخصوص پلن حرفه‌ای' : 'افزودن', () => addBlock(t), 'ed-add');
    row.append(ic('grip', 'ed-part-g'), tx, add);
    c.append(pv, row);
    c.addEventListener('pointerdown', ev => { if (ev.target.closest('.ed-add')) return; startDrag(ev, { kind: 'add', type: t, onClick: () => {} }); });
    return c;
  }

  /* ---------- زبانهٔ «ساختار» ---------- */
  function treeTab(b) {
    const p = curPage();
    if (!p) { b.appendChild(el('p', 'cap ed-hint', 'این صفحه خودکار ساخته می‌شود؛ بخش ندارد.')); return; }
    b.appendChild(el('p', 'cap ed-hint', 'ساختار صفحهٔ «' + (p.title || '') + '»؛ این‌جا هم با دستگیره جابه‌جا می‌شود.'));
    const list = el('div', 'ed-tree');
    const fixed = (icon, label, id, on) => {
      const r = el('button', 'ed-tr fixed' + (S.sel === id ? ' on' : ''));
      r.type = 'button';
      r.append(el('span', 'ed-tr-g'), ic(icon), el('b', '', label), el('span', 'cap', on ? 'همهٔ صفحه‌ها' : 'خاموش'));
      r.addEventListener('click', () => select(id));
      return r;
    };
    list.appendChild(fixed('home', 'سربرگ', 'header', S.doc.header.enabled));
    p.blocks.forEach((blk, i) => {
      const r = el('div', 'ed-tr' + (blk.hidden ? ' hid' : ''));
      r.draggable = true;
      const g = el('span', 'ed-tr-g');
      g.appendChild(ic('grip'));
      const name = el('b', '', spec(blk.type).title);
      r.append(g, blkIcon(blk.type), name, iconBtn(blk.hidden ? 'eyeoff' : 'eye', blk.hidden ? 'پنهان' : 'نمایش', () => hideBlock(blk.id), 'ed-tr-e'));
      r.addEventListener('click', () => { S._scrollTo = blk.id; select(blk.id); });
      r.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(i)); r.classList.add('drag'); });
      r.addEventListener('dragend', () => r.classList.remove('drag'));
      r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('over'); });
      r.addEventListener('dragleave', () => r.classList.remove('over'));
      r.addEventListener('drop', e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (from === i || isNaN(from)) return;
        change(() => { const [x] = p.blocks.splice(from, 1); p.blocks.splice(i, 0, x); });
      });
      list.appendChild(r);
    });
    list.appendChild(fixed('grid', 'نوار پایین', 'tabbar', S.doc.tabbar.enabled && S.doc.pages.length > 1));
    b.appendChild(list);
    const add = btn('btn-ghost btn-sm ed-wide', 'افزودن بخش', 'plus', () => { S.ptab = 'parts'; renderPanel(); });
    b.appendChild(add);
  }

  /* ---------- زبانهٔ «تم و ظاهر» ---------- */
  const PRESETS = {
    mag: [['روزنامه', { accent: '#1D55F0', bg: 'plain', mode: 'light', bg_color: '' }, { mood: 'news' }],
      ['کلاسیک', { accent: '#8A6A3B', bg: 'plain', mode: 'light', bg_color: '' }, { mood: 'classic' }],
      ['گرم', { accent: '#E0573E', bg: 'gradient', mode: 'light', bg_color: '' }, { mood: 'warm' }],
      ['شب', { accent: '#7C8CFF', bg: 'plain', mode: 'dark', bg_color: '' }, { mood: 'news' }]],
    shab: [['شفق', { accent: '#D0452B', mode: 'light', bg: 'plain', bg_color: '' }], ['جوهر', { accent: '#2C4BC0', mode: 'light', bg: 'plain', bg_color: '' }],
      ['زیتون', { accent: '#4F7A3A', mode: 'light', bg: 'pattern', bg_color: '' }], ['شب', { accent: '#D0452B', mode: 'dark', bg: 'plain', bg_color: '' }]],
    base: [['عبور', { accent: '#1D55F0', mode: 'light', bg: 'tint', bg_color: '' }], ['جنگل', { accent: '#12A071', mode: 'light', bg: 'gradient', bg_color: '' }],
      ['مرجان', { accent: '#E0573E', mode: 'light', bg: 'pattern', bg_color: '' }], ['شب', { accent: '#6A55E0', mode: 'dark', bg: 'tint', bg_color: '' }]],
  };
  function presetOn(pr) {
    const t = S.doc.theme;
    return Object.entries(pr[1]).every(([k, v]) => (t[k] || '') === v) && Object.entries(pr[2] || {}).every(([k, v]) => ((S.doc.opts || {})[k] || '') === v);
  }
  function lookTab(b) {
    const d = S.doc, t = d.theme;
    const set = fn => change(fn);
    group(b, 'تم‌های آماده', true, g => {
      const grid = el('div', 'ed-presets');
      (PRESETS[d.kit] || PRESETS.base).forEach(pr => {
        const base = clone(d);
        Object.assign(base.theme, pr[1]);
        if (pr[2]) base.opts = Object.assign({}, base.opts, pr[2]);
        const card = el('button', 'ed-preset' + (presetOn(pr) ? ' on' : ''));
        card.type = 'button';
        const pv = el('div', 'ed-preset-pv');
        const pal = ES.palette(base.theme, d.kit, base.opts);
        pv.style.background = `${pal.vars['--pg-bg']} ${pal.vars['--pg-bg-img']} center / ${pal.vars['--pg-bg-size']}`;
        const a = el('i', 'a'); a.style.background = pal.vars['--pg-accent'];
        const l1 = el('i', 'l1'); l1.style.background = pal.vars['--pg-ink'];
        const l2 = el('i', 'l2'); l2.style.background = pal.vars['--pg-ink-3'];
        const s1 = el('i', 's1'); s1.style.background = pal.vars['--pg-surface'];
        pv.append(s1, a, l1, l2);
        card.append(pv, el('b', '', pr[0]));
        card.addEventListener('click', () => set(() => { Object.assign(d.theme, pr[1]); if (pr[2]) d.opts = Object.assign({}, d.opts, pr[2]); }));
        grid.appendChild(card);
      });
      g.appendChild(grid);
    });
    group(b, 'رنگ‌ها', true, g => {
      const sws = el('div', 'st-sws');
      ((S.kits[d.kit] || {}).accents || S.schema.swatches || []).forEach(([name, c]) => {
        const s = el('button', 'st-swatch' + ((t.accent || '').toLowerCase() === c.toLowerCase() ? ' on' : ''));
        s.type = 'button'; s.title = name; s.style.background = c;
        s.addEventListener('click', () => set(() => { t.accent = c; }));
        sws.appendChild(s);
      });
      const custom = el('input', 'st-color');
      custom.type = 'color'; custom.value = t.accent || '#1D55F0'; custom.title = 'رنگ دلخواه';
      custom.addEventListener('change', () => set(() => { t.accent = custom.value.toUpperCase(); }));
      sws.appendChild(custom);
      g.appendChild(field('رنگ اصلی (دکمه‌ها و برچسب‌ها)', sws));
      const bgs = el('div', 'st-sws');
      [['', 'مثل قالب'], ['#FFFFFF', 'سفید'], ['#F4F3FA', 'یاسی'], ['#FFF4EC', 'هلویی'], ['#F1F7F2', 'نعنایی'], ['#F2EDE4', 'کاغذی']].forEach(([c, name]) => {
        const s = el('button', 'st-swatch' + ((t.bg_color || '') === c ? ' on' : '') + (c ? '' : ' auto'));
        s.type = 'button'; s.title = name;
        if (c) s.style.background = c; else s.appendChild(ic('x'));
        s.addEventListener('click', () => set(() => { t.bg_color = c; }));
        bgs.appendChild(s);
      });
      const cbg = el('input', 'st-color');
      cbg.type = 'color'; cbg.value = t.bg_color || '#FFFFFF'; cbg.title = 'رنگ دلخواه';
      cbg.addEventListener('change', () => set(() => { t.bg_color = cbg.value.toUpperCase(); }));
      bgs.appendChild(cbg);
      g.appendChild(field('رنگ زمینه', bgs, t.mode === 'dark' ? 'در حالت تیره زمینهٔ تیرهٔ قالب می‌ماند' : ''));
    });
    group(b, 'پس‌زمینه', true, g => {
      const row = el('div', 'ed-tiles ed-tiles--5');
      [['tint', 'ته‌رنگ'], ['plain', 'ساده'], ['gradient', 'گرادیان'], ['pattern', 'الگو'], ['image', 'تصویر']].forEach(([k, label]) => {
        const pal = ES.palette(Object.assign({}, t, { bg: k }), d.kit, d.opts);
        const sw = el('i', 'ed-bgsw');
        sw.style.background = `${pal.vars['--pg-bg']} ${k === 'image' && !t.bg_image ? 'linear-gradient(135deg,#C9C5DA,#E8E6F2)' : pal.vars['--pg-bg-img']} center / ${k === 'pattern' ? '9px 9px' : 'cover'}`;
        row.appendChild(tileBtn(label, sw, (t.bg || 'tint') === k, () => set(() => { t.bg = k; })));
      });
      g.appendChild(row);
      if (t.bg === 'image') g.appendChild(field('تصویر پس‌زمینه', imageIn(t.bg_image, v => set(() => { t.bg_image = v; }))));
    });
    group(b, 'گوشه‌ها و روشنایی', true, g => {
      const row = el('div', 'ed-tiles');
      [['sharp', 'تیز', 4], ['soft', 'نرم', 12], ['round', 'گرد', 20]].forEach(([k, label, r]) => {
        const sw = el('i', 'ed-rad');
        sw.style.borderRadius = r + 'px';
        row.appendChild(tileBtn(label, sw, (t.radius === 'custom' ? 'soft' : t.radius) === k, () => set(() => { t.radius = k; })));
      });
      g.appendChild(field('گوشه‌ها', row));
      g.appendChild(field('حالت شب', segmented([['auto', 'مثل تلگرام'], ['light', 'همیشه روشن'], ['dark', 'همیشه تیره']], t.mode, v => set(() => { t.mode = v; }))));
    });
    const opts = (S.kits[d.kit] || {}).opts;
    if (opts && opts.length) {
      group(b, 'تنظیم‌های قالب «' + (S.kits[d.kit].title || '') + '»', true, g => {
        d.opts = d.opts || {};
        opts.forEach(f => g.appendChild(fieldFor(f, d.opts[f.key] === undefined ? f.default : d.opts[f.key], nv => change(() => { d.opts[f.key] = nv; }, f.type === 'text'))));
      });
    }
  }
  function tileBtn(label, pic, on, fn) {
    const b = el('button', 'ed-tile' + (on ? ' on' : ''));
    b.type = 'button';
    const p = el('span', 'ed-tile-p');
    p.appendChild(pic);
    b.append(p, el('b', '', label));
    b.addEventListener('click', fn);
    return b;
  }

  /* ---------- تنظیم یک بخش: محتوا · ظاهر · رفتار ---------- */
  const LOOK_KEYS = ['layout', 'style', 'align', 'ratio', 'tone'];
  function fieldTab(f) {
    if (f.look || LOOK_KEYS.includes(f.key)) return 'look';
    if (f.type === 'bool' || f.type === 'int') return 'behave';
    return 'content';
  }
  function visible(f, props) {
    if (!f.when) return true;
    return Object.entries(f.when).every(([k, vals]) => vals.includes(props[k]));
  }
  function blockPanel(p, blk) {
    const sp = spec(blk.type);
    const menu = el('div', 'ed-bmenu');
    menu.append(iconBtn('copy', 'تکرار', () => dupBlock(blk.id)),
      iconBtn(blk.hidden ? 'eye' : 'eyeoff', blk.hidden ? 'نمایش' : 'پنهان', () => hideBlock(blk.id)));
    crumb(p, sp.title, (blk.hidden ? 'پنهان از خواننده‌ها · ' : '') + (sp.desc || ''), blkIcon(blk.type), menu);
    const fields = (sp.fields || []).filter(f => f.type !== 'id');
    const variants = (S.schema.variants || {})[blk.type] || [];
    const styleKeys = sp.style || [];
    const tabs = { content: fields.filter(f => fieldTab(f) === 'content'), look: fields.filter(f => fieldTab(f) === 'look'), behave: fields.filter(f => fieldTab(f) === 'behave') };
    const has = { content: tabs.content.length > 0, look: tabs.look.length + variants.length + styleKeys.length > 0, behave: true };
    if (!has[S.btab]) S.btab = has.content ? 'content' : 'look';
    const seg = el('div', 'ed-btabs');
    [['content', 'محتوا'], ['look', 'ظاهر'], ['behave', 'رفتار']].forEach(([id, label]) => {
      if (!has[id]) return;
      const b = el('button', S.btab === id ? 'on' : '', label);
      b.type = 'button';
      b.addEventListener('click', () => { S.btab = id; renderPanel(); });
      seg.appendChild(b);
    });
    p.appendChild(seg);
    const body = el('div', 'ed-pbody');
    p.appendChild(body);
    const put = (f, nv, rebuild) => change(() => { blk.props[f.key] = nv; }, !rebuild && ['text', 'textarea', 'url', 'list'].includes(f.type));
    const fieldEl = f => {
      if (blk.type === 'mag_featured' && f.key === 'post') {
        const posts = (S.mag ? S.mag.posts : []).filter(x => x.state === 'pub');
        return field(f.label, selectIn([['', 'تازه‌ترین مطلب (خودکار)']].concat(posts.map(x => [x.id, x.title])), blk.props[f.key], v => put(f, v)));
      }
      if (blk.type === 'mag_latest' && f.key === 'cat') {
        return field(f.label, selectIn([['', 'همهٔ دسته‌ها']].concat((S.mag ? S.mag.cats : []).map(c => [c.id, c.name])), blk.props[f.key], v => put(f, v)));
      }
      return fieldFor(f, blk.props[f.key], (v, r) => put(f, v, r));
    };
    if (S.btab === 'content') {
      body.appendChild(el('p', 'cap ed-hint ed-hint--pen', 'متن‌ها را روی خود گوشی هم می‌توانی بنویسی: روی متن بخش انتخاب‌شده بزن.'));
      tabs.content.filter(f => visible(f, blk.props)).forEach(f => body.appendChild(fieldEl(f)));
    } else if (S.btab === 'look') {
      if (variants.length) {
        group(body, 'سبک آماده', true, g => {
          const grid = el('div', 'ed-vars');
          variants.forEach(v => {
            const props = Object.assign({}, blk.props, v.props);
            const style = Object.assign({}, blk.style || {}, v.style);
            const on = Object.entries(v.props).every(([k, x]) => blk.props[k] === x) && Object.entries(v.style).every(([k, x]) => (blk.style || {})[k] === x);
            const card = el('button', 'ed-var' + (on ? ' on' : ''));
            card.type = 'button';
            card.append(mini(miniDoc(blk.type, props, style), 150, 96), el('b', '', v.title));
            card.addEventListener('click', () => change(() => {
              Object.assign(blk.props, v.props);
              blk.style = Object.assign({}, blk.style || {});
              ['box', 'pad', 'radius'].forEach(k => { delete blk.style[k]; });
              Object.assign(blk.style, v.style);
            }));
            grid.appendChild(card);
          });
          g.appendChild(grid);
        });
      }
      const look = tabs.look.filter(f => visible(f, blk.props));
      if (look.length) group(body, 'شکل', true, g => look.forEach(f => g.appendChild(fieldEl(f))));
      if (styleKeys.length) {
        group(body, 'قاب و رنگ', true, g => {
          blk.style = blk.style || {};
          (S.schema.style || []).filter(f => styleKeys.includes(f.key)).forEach(f => {
            const cur = blk.style[f.key];
            const putS = nv => change(() => { blk.style = blk.style || {}; if (nv === '' || nv === null || nv === f.default) delete blk.style[f.key]; else blk.style[f.key] = nv; });
            if (f.key === 'accent') {
              const row = el('div', 'st-sws');
              const auto = el('button', 'st-swatch auto' + (!cur ? ' on' : ''));
              auto.type = 'button'; auto.title = 'مثل تم'; auto.appendChild(ic('x'));
              auto.addEventListener('click', () => putS(''));
              row.appendChild(auto);
              ((S.kits[S.doc.kit] || {}).accents || S.schema.swatches || []).slice(0, 6).forEach(([name, c]) => {
                const s = el('button', 'st-swatch' + ((cur || '').toLowerCase() === c.toLowerCase() ? ' on' : ''));
                s.type = 'button'; s.title = name; s.style.background = c;
                s.addEventListener('click', () => putS(c));
                row.appendChild(s);
              });
              g.appendChild(field('رنگ این بخش', row, cur ? '' : 'مثل رنگ اصلی تم'));
            } else if (f.key === 'radius') {
              g.appendChild(fieldFor(Object.assign({}, f, { min: 0, max: 40 }), cur == null ? 18 : cur, putS));
            } else g.appendChild(fieldFor(f, cur == null ? f.default : cur, putS));
          });
        });
      }
    } else {
      group(body, 'نمایش', true, g => {
        const r = el('div', 'st-row st-between');
        r.append(el('span', 'st-lbl', 'نمایش به خواننده‌ها'), toggle(!blk.hidden, () => hideBlock(blk.id)));
        g.appendChild(r);
        g.appendChild(el('p', 'cap ed-hint', 'بخش پنهان فقط این‌جا دیده می‌شود؛ برای آماده کردن قبل از نمایش.'));
      });
      const beh = tabs.behave.filter(f => visible(f, blk.props));
      if (beh.length) group(body, 'تنظیم‌ها', true, g => beh.forEach(f => g.appendChild(fieldEl(f))));
    }
    const del = btn('btn-text btn-sm ed-del', 'حذف این بخش', 'trash', () => removeBlock(blk.id));
    p.appendChild(del);
  }

  /* ---------- سربرگ ---------- */
  function headerPanel(p) {
    const d = S.doc, hd = d.header;
    crumb(p, 'سربرگ', 'برای همهٔ صفحه‌ها یکی است', ic('home'));
    const body = el('div', 'ed-pbody');
    p.appendChild(body);
    const set = (fn, keep) => change(fn, keep);
    const styles = d.kit === 'mag' ? [['bar', 'ساده'], ['search', 'با جستجو'], ['cover', 'با کاور']]
      : d.kit === 'shab' ? [] : [['bar', 'نوار'], ['solid', 'توپر'], ['plain', 'ساده'], ['cover', 'با کاور']];
    group(body, 'شکل', true, g => {
      const grid = el('div', 'ed-vars');
      const off = el('button', 'ed-var' + (!hd.enabled ? ' on' : ''));
      off.type = 'button';
      const o = el('div', 'ed-mini ed-mini--off');
      o.textContent = 'بدون سربرگ';
      off.append(o, el('b', '', 'بدون سربرگ'));
      off.addEventListener('click', () => set(() => { hd.enabled = false; }));
      const opts = styles.length ? styles : [['bar', 'سربرگ قالب']];
      opts.forEach(([k, label]) => {
        const doc = clone(d);
        doc.header = Object.assign({}, hd, { enabled: true, style: k });
        doc.tabbar = { enabled: false };
        doc.pages = [{ id: 'p', title: '', icon: 'home', blocks: [] }];
        const on = hd.enabled && (styles.length ? (hd.style || 'bar') === k : true);
        const card = el('button', 'ed-var' + (on ? ' on' : ''));
        card.type = 'button';
        card.append(mini(doc, 150, 70), el('b', '', label));
        card.addEventListener('click', () => set(() => { hd.enabled = true; hd.style = k; }));
        grid.appendChild(card);
      });
      grid.appendChild(off);
      g.appendChild(grid);
    });
    if (!hd.enabled) return;
    group(body, 'محتوا', true, g => {
      g.appendChild(field('اسم', textIn(hd.title, v => set(() => { hd.title = v; }, true), { max: 40, ph: S.app.name })));
      g.appendChild(field('یک خط معرفی', textIn(hd.subtitle, v => set(() => { hd.subtitle = v; }, true), { max: 60 })));
      g.appendChild(field('لوگو', imageIn(hd.logo, v => set(() => { hd.logo = v; }))));
      if (hd.style === 'cover') g.appendChild(field('تصویر کاور', imageIn(hd.cover, v => set(() => { hd.cover = v; })), 'خالی = رنگ اصلی'));
      if (d.kit === 'mag' && hd.style !== 'search') {
        const r = el('div', 'st-row st-between');
        r.append(el('span', 'st-lbl', 'دکمهٔ جستجو'), toggle(hd.search !== false, v => set(() => { hd.search = v; })));
        g.appendChild(r);
      }
      if (d.kit === 'base') g.appendChild(field('چینش', segmented([['start', 'راست'], ['center', 'وسط']], hd.align, v => set(() => { hd.align = v; }))));
    });
    group(body, 'رفتار', true, g => {
      const r = el('div', 'st-row st-between');
      r.append(el('span', 'st-lbl', 'چسبیده هنگام پیمایش'), toggle(hd.sticky !== false, v => set(() => { hd.sticky = v; })));
      g.appendChild(r);
      g.appendChild(el('p', 'cap ed-hint', 'روشن: با پایین رفتن صفحه، سربرگ بالا می‌ماند.'));
    });
  }

  /* ---------- نوار پایین ---------- */
  function tabbarPanel(p) {
    const d = S.doc, tb = d.tabbar;
    crumb(p, 'نوار پایین', 'برای همهٔ صفحه‌ها یکی است؛ هر دکمه یک صفحه', ic('grid'));
    const body = el('div', 'ed-pbody');
    p.appendChild(body);
    const set = (fn, keep) => change(fn, keep);
    if (d.pages.length < 2) body.appendChild(el('p', 'cap ed-hint', 'نوار پایین وقتی دیده می‌شود که مینی‌اپ بیشتر از یک صفحه داشته باشد.'));
    group(body, 'شکل', true, g => {
      const grid = el('div', 'ed-vars ed-vars--3');
      [['floating', 'شناور'], ['docked', 'چسبیده'], ['minimal', 'فقط آیکن']].forEach(([k, label]) => {
        const doc = clone(d);
        doc.tabbar = Object.assign({}, tb, { enabled: true, style: k });
        doc.header = { enabled: false };
        doc.pages = d.pages.map(x => ({ id: x.id, title: x.title, icon: x.icon, blocks: [] }));
        const card = el('button', 'ed-var' + (tb.enabled && tb.style === k ? ' on' : ''));
        card.type = 'button';
        const m = mini(doc, 96, 60);
        m.classList.add('ed-mini--bottom');
        card.append(m, el('b', '', label));
        card.addEventListener('click', () => set(() => { tb.enabled = true; tb.style = k; }));
        grid.appendChild(card);
      });
      g.appendChild(grid);
      const r = el('div', 'st-row st-between');
      r.append(el('span', 'st-lbl', 'نمایش نوار پایین'), toggle(tb.enabled, v => set(() => { tb.enabled = v; })));
      g.appendChild(r);
    });
    group(body, 'دکمه‌ها (صفحه‌ها)', true, g => {
      const list = el('div', 'ed-tabs');
      d.pages.forEach((pg, i) => {
        const r = el('div', 'ed-tabrow' + (S.page === pg.id ? ' on' : ''));
        r.draggable = true;
        const grip = el('span', 'ed-tr-g');
        grip.appendChild(ic('grip'));
        const icn = el('select', 'st-in ed-icsel');
        (S.schema.page_icons || []).forEach(([k, label]) => { const o = el('option', '', label); o.value = k; if (k === pg.icon) o.selected = true; icn.appendChild(o); });
        icn.addEventListener('change', () => set(() => { pg.icon = icn.value; }));
        const ib = el('span', 'ed-tabic');
        ib.appendChild(ES.icon(ES.ICONS[pg.icon] ? pg.icon : 'star'));
        const name = textIn(pg.title, v => set(() => { pg.title = v; }, true), { max: 24 });
        const go2 = iconBtn('back', 'رفتن به این صفحه', () => { S.page = pg.id; renderEditor(); });
        r.append(grip, ib, icn, name, go2);
        r.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(i)); r.classList.add('drag'); });
        r.addEventListener('dragend', () => r.classList.remove('drag'));
        r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('over'); });
        r.addEventListener('dragleave', () => r.classList.remove('over'));
        r.addEventListener('drop', e => {
          e.preventDefault();
          const from = Number(e.dataTransfer.getData('text/plain'));
          if (from === i || isNaN(from)) return;
          change(() => { const [x] = d.pages.splice(from, 1); d.pages.splice(i, 0, x); });
        });
        list.appendChild(r);
      });
      g.appendChild(list);
    }, 'ترتیب دکمه‌ها با دستگیره عوض می‌شود. صفحه‌ها را قالب آورده است.');
    group(body, 'نمایش', true, g => {
      const r = el('div', 'st-row st-between');
      r.append(el('span', 'st-lbl', 'نام زیر آیکن'), toggle(tb.labels !== false, v => set(() => { tb.labels = v; })));
      g.appendChild(r);
    });
  }

  /* ---------- تست زنده ---------- */
  function testPanel(p) {
    const body = el('div', 'ed-pbody');
    p.appendChild(body);
    const box = el('div', 'ed-testn');
    box.append(el('b', '', 'تست زنده'), el('p', '', 'همه‌چیز مثل تلگرام کار می‌کند: بزن، پیمایش کن، صفحه عوض کن. همین را خواننده می‌بیند.'));
    body.appendChild(box);
    body.appendChild(field('تم تلگرام', segmented([['light', 'روشن'], ['dark', 'تیره']], S.tg, v => { S.tg = v; renderPhone(); renderPanel(); }),
      S.doc.theme.mode === 'auto' ? 'مینی‌اپ تو «مثل تلگرام» است؛ با این دکمه هر دو را امتحان کن.' : 'حالت شب مینی‌اپ ثابت است (از «تم و ظاهر» عوضش کن).'));
    body.appendChild(field('اندازهٔ گوشی', segmented([['s', 'کوچک'], ['m', 'معمولی'], ['l', 'بزرگ']], S.size, v => { S.size = v; renderPhone(); renderPanel(); })));
    const url = S.app.url;
    if (url) {
      const r = el('div', 'ed-testlink');
      r.append(ic('tg'), el('span', 'cap', S.app.dirty ? 'تغییرهای منتشرنشده فقط این‌جا دیده می‌شوند. بعد از «منتشر کن» در تلگرام هم.' : 'همین نسخه در تلگرام منتشر شده است.'));
      body.appendChild(r);
    }
    body.appendChild(btn('btn-ghost btn-sm ed-wide', 'برگشت به ویرایش', 'pen', () => { S.mode = 'edit'; renderEditor(); }));
  }

  /* ---------- تغییرهای منتشرنشده و انتشار ---------- */
  function diffs() {
    const d = S.doc, P = S.pub;
    if (!P) return [{ key: 'first', icon: 'send', title: 'اولین انتشار', sub: 'مینی‌اپ هنوز منتشر نشده' }];
    const out = [];
    if (J(d.theme) !== J(P.theme) || J(d.opts || {}) !== J(P.opts || {})) {
      out.push({ key: 'theme', icon: 'pal', title: 'تم و ظاهر', sub: 'رنگ، پس‌زمینه، گوشه‌ها یا حالت شب', revert: () => { d.theme = clone(P.theme); d.opts = clone(P.opts || {}); } });
    }
    if (J(d.header) !== J(P.header)) out.push({ key: 'header', icon: 'home', title: 'سربرگ', sub: 'شکل یا محتوای سربرگ', revert: () => { d.header = clone(P.header); } });
    const meta = doc => doc.pages.map(p => [p.id, p.title, p.icon]);
    if (J(d.tabbar) !== J(P.tabbar) || J(meta(d)) !== J(meta(P))) {
      out.push({ key: 'tabbar', icon: 'grid', title: 'نوار پایین', sub: 'شکل، ترتیب یا نام دکمه‌ها', revert: () => {
        d.tabbar = clone(P.tabbar);
        const order = P.pages.map(p => p.id);
        d.pages.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        d.pages.forEach(p => { const q = P.pages.find(x => x.id === p.id); if (q) { p.title = q.title; p.icon = q.icon; } });
      } });
    }
    d.pages.forEach(pg => {
      const pp = P.pages.find(x => x.id === pg.id);
      const before = pp ? pp.blocks : [];
      const ids = pg.blocks.map(b => b.id), old = before.map(b => b.id);
      const added = ids.filter(id => !old.includes(id)).length;
      const removed = old.filter(id => !ids.includes(id)).length;
      const edited = pg.blocks.filter(b => { const o = before.find(x => x.id === b.id); return o && J(o) !== J(b); }).length;
      const common = ids.filter(id => old.includes(id));
      const moved = J(common) !== J(old.filter(id => ids.includes(id)));
      const parts = [];
      if (added) parts.push(fa(added) + ' بخش تازه');
      if (removed) parts.push(fa(removed) + ' حذف');
      if (edited) parts.push(fa(edited) + ' تغییر');
      if (moved) parts.push('جابه‌جایی');
      if (parts.length) out.push({ key: 'p:' + pg.id, icon: 'layers', title: 'بخش‌های «' + (pg.title || pg.id) + '»', sub: parts.join('، '), revert: () => { pg.blocks = clone(before); } });
    });
    return out;
  }
  function publishBox() {
    const list = diffs();
    if (!list.length) return;
    modal((box, close) => {
      box.classList.add('ed-pub');
      box.appendChild(el('b', 'h2', S.pub ? fa(list.length) + ' تغییر منتشر شود؟' : 'منتشر شود؟'));
      box.appendChild(el('p', 'cap', 'بعد از انتشار، همهٔ خواننده‌ها نسخهٔ تازه را می‌بینند. هر بخش را می‌توانی تکی برگردانی.'));
      const rows = el('div', 'ed-pub-l');
      list.forEach(it => {
        const r = el('div', 'ed-pub-r');
        const i = el('span', 'ed-bi');
        i.appendChild(ic(it.icon));
        const tx = el('div', 'ed-bt');
        tx.append(el('b', '', it.title), el('span', 'cap', it.sub));
        r.append(i, tx);
        if (it.revert) r.appendChild(btn('btn-text btn-sm', 'برگردان', 'undo', () => {
          change(() => it.revert());
          close();
          if (diffs().length) publishBox(); else toast('همه به نسخهٔ منتشرشده برگشت');
        }));
        rows.appendChild(r);
      });
      box.appendChild(rows);
      const foot = el('div', 'st-row st-end');
      const test = btn('btn-ghost', 'اول تست زنده', 'play', () => { close(); S.mode = 'test'; renderEditor(); });
      const go2 = btn('btn-primary', 'منتشر کن', 'send', async () => {
        go2.disabled = true;
        try {
          if (S.pending) await saveNow();
          const r = await api('app/publish', { id: S.app.id, doc: S.doc });
          S.app = r.app;
          S.doc = r.doc;
          S.pub = clone(r.doc);
          close();
          toast('منتشر شد؛ خواننده‌ها همین الان می‌بینند');
          renderEditor();
        } catch (e) { go2.disabled = false; failed(e); }
      });
      foot.append(test, go2);
      box.appendChild(foot);
    }, 'st-mbox--m');
  }

  /* ---------- فیلدها ---------- */
  function field(label, ctrl, hint) {
    const f = el('div', 'st-f');
    f.appendChild(el('span', 'st-lbl', label));
    f.appendChild(ctrl);
    if (hint) f.appendChild(el('span', 'cap', hint));
    return f;
  }
  function segmented(options, value, onChange) {
    const s = el('div', 'st-seg st-seg--f');
    options.forEach(([v, label]) => {
      const b = el('button', v === value ? 'on' : '', label);
      b.type = 'button';
      b.addEventListener('click', () => onChange(v));
      s.appendChild(b);
    });
    return s;
  }
  function toggle(on, onChange) {
    const t = el('button', 'st-sw' + (on ? ' on' : ''));
    t.type = 'button';
    t.setAttribute('role', 'switch');
    t.setAttribute('aria-checked', on ? 'true' : 'false');
    t.appendChild(el('i'));
    t.addEventListener('click', () => onChange(!on));
    return t;
  }
  function textIn(value, onChange, opt) {
    opt = opt || {};
    const i = el(opt.multi ? 'textarea' : 'input', 'st-in');
    i.value = value || '';
    if (opt.max) i.maxLength = opt.max;
    if (opt.ltr) i.dir = 'ltr';
    if (opt.ph) i.placeholder = opt.ph;
    if (opt.type) i.type = opt.type;
    let t = 0;
    i.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => onChange(i.value), 300); });
    return i;
  }
  function imageIn(value, onChange) {
    const box = el('div', 'st-img');
    if (value) { const im = el('img'); im.src = value; im.alt = ''; box.appendChild(im); }
    const up = btn('btn-ghost btn-sm', value ? 'عوض کردن' : 'بارگذاری تصویر', 'upload', () => pickFile('image/*', async f => {
      up.disabled = true;
      try { onChange(await uploadImage(f)); } catch (e) { failed(e); } finally { up.disabled = false; }
    }));
    box.appendChild(up);
    if (value) box.appendChild(btn('btn-text btn-sm', 'حذف', null, () => onChange('')));
    return box;
  }
  function selectIn(options, value, onChange) {
    const s = el('select', 'st-in');
    options.forEach(([v, label]) => { const o = el('option', '', label); o.value = v; if (v === (value || '')) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => onChange(s.value));
    return s;
  }
  function fieldFor(f, v, put) {
    const opts = (f.options || []).map(o => Array.isArray(o) ? o : [o, o]);
    if (f.type === 'text') return field(f.label, textIn(v, put, { max: f.max }));
    if (f.type === 'textarea') return field(f.label, textIn(v, put, { max: f.max, multi: true }));
    if (f.type === 'url') return field(f.label, textIn(v, put, { ltr: true, ph: 'https://' }));
    if (f.type === 'image') return field(f.label, imageIn(v, put));
    if (f.type === 'bool') { const r = el('div', 'st-row st-between'); r.append(el('span', 'st-lbl', f.label), toggle(!!v, put)); return r; }
    if (f.type === 'select') return field(f.label, opts.length <= 4 ? segmented(opts, v, put) : selectIn(opts, v, put));
    if (f.type === 'int') {
      const box = el('div', 'st-row');
      const r = el('input', 'st-range');
      r.type = 'range'; r.min = f.min; r.max = f.max; r.value = v == null ? (f.default == null ? f.min : f.default) : v;
      const n = el('b', 'st-num', fa(r.value));
      r.addEventListener('input', () => { n.textContent = fa(r.value); });
      r.addEventListener('change', () => put(Number(r.value)));
      box.append(r, n);
      return field(f.label + (f.unit ? ' (پیکسل)' : ''), box);
    }
    if (f.type === 'color') { const c = el('input', 'st-color'); c.type = 'color'; c.value = v || '#1D55F0'; c.addEventListener('change', () => put(c.value.toUpperCase())); return field(f.label, c); }
    if (f.type === 'list') {
      const box = el('div', 'st-list');
      let items = Array.isArray(v) ? v : [];
      items.forEach((it, i) => {
        const card = el('div', 'st-li');
        const top = el('div', 'st-row st-between');
        top.append(el('b', 'st-lbl', (f.item_label || 'مورد') + ' ' + fa(i + 1)), iconBtn('trash', 'حذف', () => put(items.filter((_, k) => k !== i), true)));
        card.appendChild(top);
        (f.fields || []).forEach(sf => { if (sf.type !== 'id') card.appendChild(fieldFor(sf, it[sf.key], nv => { const copy = clone(items); copy[i][sf.key] = nv; items = copy; put(copy); })); });
        box.appendChild(card);
      });
      if (items.length < (f.max_items || 10)) {
        box.appendChild(btn('btn-ghost btn-sm', 'افزودن ' + (f.item_label || 'مورد'), 'plus', () => {
          const it = {};
          (f.fields || []).forEach(sf => { it[sf.key] = clone(sf.default === undefined ? '' : sf.default); });
          put(items.concat([it]), true);
        }));
      }
      return field(f.label, box);
    }
    return el('span');
  }

  /* ===================== مطالب ===================== */
  const STATE = { pub: ['منتشر شده', 'tag-ok'], draft: ['پیش‌نویس', 'tag-mute'], sched: ['زمان‌بندی‌شده', 'tag-warn'] };
  function catOf(id) { return (S.mag.cats || []).find(c => c.id === id); }
  function authorOf(id) { return (S.mag.authors || []).find(a => a.id === id); }
  function catChip(id) {
    const c = catOf(id);
    if (!c) return el('span', 'cap', '—');
    const s = el('span', 'st-cchip', c.name);
    s.style.setProperty('--c', c.color);
    return s;
  }
  function thumb(p) {
    const t = el('span', 'st-thumb');
    const c = catOf(p.cat);
    t.style.background = c ? `linear-gradient(140deg, ${c.color}, #0A0F24)` : 'linear-gradient(140deg,#4B2EE8,#2A1D8F)';
    if (p.cover) { const im = el('img'); im.src = p.cover; im.alt = ''; im.loading = 'lazy'; t.appendChild(im); }
    return t;
  }
  async function content(main) {
    const end = $('ws-end');
    end.textContent = '';
    end.appendChild(btn('btn-primary btn-sm', 'مطلب تازه', 'plus', () => go('/' + S.app.id + '/write')));
    await loadMag();
    const m = S.mag;
    main.classList.add('st-content', 'wrap');
    const stats = el('div', 'st-stats');
    [['text', fa(m.counts.all), 'مطلب', '#4B2EE8'], ['eye', fa(m.views), 'بازدید', '#0E8FAE'], ['tg', fa(m.from_tg), 'از تلگرام اضافه شده', '#2A8BD6'], ['user', fa(m.authors.length), 'نویسنده', '#E0457B']]
      .forEach(([i, n, t, c]) => {
        const s = el('div', 'st-stat card');
        const sic = el('span', 'st-stat-ic');
        sic.style.setProperty('--c', c);
        sic.appendChild(ic(i));
        const tx = el('div', 'col');
        tx.append(el('b', '', n), el('span', 'cap', t));
        s.append(sic, tx);
        stats.appendChild(s);
      });
    main.appendChild(stats);
    const tools = el('div', 'st-tools');
    [['all', 'همه', m.counts.all], ['pub', 'منتشر شده', m.counts.pub], ['draft', 'پیش‌نویس', m.counts.draft], ['sched', 'زمان‌بندی‌شده', m.counts.sched]].forEach(([id, label, n]) => {
      const b = el('button', 'st-filter' + (S.filter === id ? ' on' : ''));
      b.type = 'button';
      b.append(document.createTextNode(label), el('b', '', fa(n)));
      b.addEventListener('click', () => { S.filter = id; content(clear(main)); });
      tools.appendChild(b);
    });
    tools.appendChild(el('span', 'st-gap'));
    const q = el('input', 'st-in st-search');
    q.type = 'search';
    q.placeholder = 'جستجو در مطالب…';
    q.value = S.q;
    q.addEventListener('input', () => { S.q = q.value; drawRows(); });
    tools.append(q, selectIn([['', 'همهٔ دسته‌ها']].concat(m.cats.map(c => [c.id, c.name])), S.catf, v => { S.catf = v; drawRows(); }));
    main.appendChild(tools);
    const table = el('div', 'st-table card');
    const head = el('div', 'st-tr st-th');
    ['مطلب', 'دسته', 'نویسنده', 'وضعیت', 'بازدید', 'منبع', ''].forEach(t => head.appendChild(el('span', '', t)));
    table.appendChild(head);
    const body = el('div', '');
    table.appendChild(body);
    main.appendChild(table);
    function drawRows() {
      body.textContent = '';
      const rows = m.posts.filter(p => (S.filter === 'all' || p.state === S.filter) && (!S.catf || p.cat === S.catf)
        && (!S.q || (p.title + ' ' + p.lead).includes(S.q.trim())));
      if (!rows.length) { body.appendChild(el('p', 'st-none', m.posts.length ? 'مطلبی با این فیلتر نیست.' : 'هنوز مطلبی ننوشتی. «مطلب تازه» را بزن.')); return; }
      rows.forEach(p => {
        const tr = el('div', 'st-tr');
        const t = el('span', 'st-ptitle');
        const tx = el('span', 'col');
        tx.append(el('b', '', p.title), el('span', 'cap', p.state === 'sched' ? 'انتشار ' + ago(p.at) : ago(p.at || p.updated_at)));
        t.append(thumb(p), tx);
        const a = authorOf(p.author);
        const au = el('span', 'st-au');
        au.append(el('i', '', a ? a.name.charAt(0) : '؟'), document.createTextNode(a ? a.name : '—'));
        const [label, cls] = STATE[p.state];
        const src = el('span', 'tag ' + (p.source === 'tg' ? 'st-src-tg' : 'tag-mute'));
        src.append(ic(p.source === 'tg' ? 'tg' : 'desk'), document.createTextNode(p.source === 'tg' ? 'از تلگرام' : 'از سایت'));
        const more = iconBtn('more', 'کارها', ev => rowMenu(ev, p));
        tr.append(t, catChip(p.cat), au, el('span', 'tag ' + cls, label), el('b', 'st-views', p.state === 'pub' ? fa(p.views) : '—'), src, more);
        tr.addEventListener('click', () => go('/' + S.app.id + '/write?post=' + p.id));
        body.appendChild(tr);
      });
    }
    drawRows();
  }
  function clear(main) { main.textContent = ''; return main; }
  function rowMenu(ev, p) {
    document.querySelectorAll('.st-menu').forEach(x => x.remove());
    const menu = el('div', 'st-menu');
    const item = (icon, label, fn, danger) => {
      const b = el('button', danger ? 'danger' : '');
      b.type = 'button';
      b.append(ic(icon), document.createTextNode(label));
      b.addEventListener('click', e => { e.stopPropagation(); menu.remove(); fn(); });
      menu.appendChild(b);
    };
    item('text', 'ویرایش', () => go('/' + S.app.id + '/write?post=' + p.id));
    if (p.link) item('copy', 'کپی لینک مطلب', () => copy(p.link));
    if (p.state === 'pub') item('send', 'پست کانال', () => channelPost(p));
    item('trash', 'حذف', async () => {
      if (!await confirmBox('«' + p.title + '» برای همیشه پاک شود؟', 'پاک کن', true)) return;
      try { await api('mag/delete', { app: S.app.id, id: p.id }); toast('مطلب پاک شد'); content(clear($('main'))); } catch (e) { failed(e); }
    }, true);
    const r = ev.currentTarget.getBoundingClientRect();
    menu.style.top = (r.bottom + window.scrollY + 4) + 'px';
    menu.style.left = (r.left + window.scrollX) + 'px';
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('کپی شد')).catch(() => { prompt('لینک:', text); });
  }

  /* ===================== نوشتن مطلب ===================== */
  const BLOCKS = [['p', 'text', 'متن'], ['h', 'h2', 'تیتر'], ['img', 'image', 'تصویر'], ['audio', 'audio', 'صوت'], ['video', 'video', 'ویدیو'],
    ['link', 'link', 'لینک'], ['btn', 'btn', 'دکمه'], ['quote', 'quote', 'نقل‌قول'], ['hr', 'hr', 'جداکننده']];
  async function writer(main) {
    await loadMag();
    const pid = new URLSearchParams(location.search).get('post');
    if (pid) {
      try { S.post = (await api('mag/get?app=' + S.app.id + '&id=' + encodeURIComponent(pid))).post; } catch (e) { failed(e); go('/' + S.app.id + '/content', true); return; }
    } else {
      S.post = { id: '', title: '', lead: '', cover: '', body: [{ t: 'p', text: '' }], cat: (S.mag.cats[0] || {}).id || '', tags: [], author: '', state: 'draft', source: 'site' };
    }
    S.postDirty = false;
    const p = S.post;
    const end = $('ws-end');
    end.textContent = '';
    const st = el('span', 'cap st-wsrc');
    if (p.id) st.append(ic(p.source === 'tg' ? 'tg' : 'desk'), document.createTextNode(p.source === 'tg' ? 'این مطلب از تلگرام شروع شد' : 'نوشته‌شده در سایت'));
    end.append(st, btn('btn-ghost btn-sm', 'پیش‌نمایش در گوشی', 'phone', previewPost));
    main.classList.add('st-write');
    const doc = el('section', 'st-doc');
    const side = el('aside', 'st-wside');
    main.append(doc, side);
    const dirty = () => { S.postDirty = true; };
    // کاور
    const cov = el('div', 'st-cover');
    const drawCover = () => {
      cov.textContent = '';
      cov.classList.toggle('has', !!p.cover);
      if (p.cover) { const im = el('img'); im.src = p.cover; im.alt = ''; cov.appendChild(im); }
      const b = btn('btn-white btn-sm', p.cover ? 'عوض کردن کاور' : 'کاور مطلب', 'image', () => pickFile('image/*', async f => {
        try { p.cover = await uploadImage(f); dirty(); drawCover(); } catch (e) { failed(e); }
      }));
      cov.appendChild(b);
      if (p.cover) cov.appendChild(btn('btn-white btn-sm', 'حذف', 'trash', () => { p.cover = ''; dirty(); drawCover(); }));
    };
    drawCover();
    const title = el('textarea', 'st-wtitle');
    title.placeholder = 'تیتر مطلب';
    title.rows = 1;
    title.maxLength = 140;
    title.value = p.title;
    const lead = el('textarea', 'st-wlead');
    lead.placeholder = 'یک جملهٔ کوتاه برای کارت و پست کانال (اختیاری)';
    lead.rows = 1;
    lead.maxLength = 300;
    lead.value = p.lead;
    [title, lead].forEach(t => { t.addEventListener('input', () => { autosize(t); dirty(); p[t === title ? 'title' : 'lead'] = t.value; }); });
    requestAnimationFrame(() => { autosize(title); autosize(lead); });
    const meta = el('div', 'st-wmeta');
    const blocksBox = el('div', 'st-blocks');
    doc.append(cov, meta, title, lead, blocksBox);
    const drawMeta = () => {
      meta.textContent = '';
      meta.appendChild(catChip(p.cat));
      const words = [p.title, p.lead].concat(p.body.map(b => b.text || '')).join(' ').split(/\s+/).filter(Boolean).length;
      meta.appendChild(el('span', 'cap', `${fa(Math.max(1, Math.round(words / 200)))} دقیقه خواندن · ${fa(words)} کلمه`));
    };
    drawMeta();
    const drawBlocks = () => {
      blocksBox.textContent = '';
      p.body.forEach((b, i) => blocksBox.appendChild(blockEditor(b, i)));
      blocksBox.appendChild(inserter(p.body.length));
    };
    function inserter(at) {
      const row = el('div', 'st-ins');
      const plus = el('button', 'st-ins-btn');
      plus.type = 'button';
      plus.appendChild(ic('plus'));
      row.append(plus, el('span', 'cap', 'بنویس، یا «+» بزن تا تصویر، صوت، ویدیو، لینک یا دکمه اضافه شود'));
      plus.addEventListener('click', ev => {
        ev.stopPropagation();
        document.querySelectorAll('.st-bmenu').forEach(x => x.remove());
        const menu = el('div', 'st-bmenu card');
        BLOCKS.forEach(([t, i, label]) => {
          const b = el('button', '');
          b.type = 'button';
          b.append(ic(i), el('b', '', label));
          b.addEventListener('click', e => {
            e.stopPropagation();
            menu.remove();
            p.body.splice(at, 0, t === 'hr' ? { t } : { t, text: '', src: '', cap: '', title: '', url: '', label: '', note: '', by: '' });
            dirty();
            drawBlocks();
            const fresh = blocksBox.children[at];
            const f = fresh && fresh.querySelector('textarea,input');
            if (f) f.focus();
          });
          menu.appendChild(b);
        });
        row.appendChild(menu);
        setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
      });
      return row;
    }
    function blockEditor(b, i) {
      const box = el('div', 'st-blk st-blk--' + b.t);
      const tools = el('div', 'st-blk-tools');
      const label = (BLOCKS.find(x => x[0] === b.t) || [])[2] || '';
      tools.append(el('span', 'st-blk-t', label),
        iconBtn('up', 'بالا', () => { if (i > 0) { p.body.splice(i - 1, 0, p.body.splice(i, 1)[0]); dirty(); drawBlocks(); } }),
        iconBtn('down', 'پایین', () => { if (i < p.body.length - 1) { p.body.splice(i + 1, 0, p.body.splice(i, 1)[0]); dirty(); drawBlocks(); } }),
        iconBtn('trash', 'حذف', () => { p.body.splice(i, 1); dirty(); drawBlocks(); }));
      box.appendChild(tools);
      const inp = (key, ph, opt) => {
        opt = opt || {};
        const t = el(opt.multi ? 'textarea' : 'input', 'st-bi' + (opt.cls ? ' ' + opt.cls : ''));
        t.value = b[key] || '';
        t.placeholder = ph;
        if (opt.ltr) t.dir = 'ltr';
        if (opt.multi) { t.rows = 1; setTimeout(() => autosize(t), 0); }
        t.addEventListener('input', () => { b[key] = t.value; dirty(); if (opt.multi) autosize(t); if (key === 'text') drawMeta(); });
        return t;
      };
      if (b.t === 'p') {
        const t = inp('text', 'متن… (برای پررنگ: **کلمه**)', { multi: true, cls: 'st-bp' });
        t.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey && t.selectionStart === t.value.length && t.value.endsWith('\n')) {
            e.preventDefault();
            b.text = t.value.replace(/\n+$/, '');
            p.body.splice(i + 1, 0, { t: 'p', text: '' });
            dirty(); drawBlocks();
            const n = blocksBox.children[i + 1].querySelector('textarea');
            if (n) n.focus();
          }
        });
        box.appendChild(t);
      } else if (b.t === 'h') box.appendChild(inp('text', 'تیتر بخش', { cls: 'st-bh' }));
      else if (b.t === 'img') {
        const media = el('div', 'st-bmedia');
        const draw = () => {
          media.textContent = '';
          if (b.src) { const im = el('img'); im.src = b.src; im.alt = ''; media.appendChild(im); }
          media.appendChild(btn('btn-ghost btn-sm', b.src ? 'عوض کردن تصویر' : 'بارگذاری تصویر', 'upload', () => pickFile('image/*', async f => {
            try { b.src = await uploadImage(f); dirty(); draw(); } catch (e) { failed(e); }
          })));
        };
        draw();
        box.append(media, inp('cap', 'زیرنویس (اختیاری)'));
      } else if (b.t === 'audio' || b.t === 'video') {
        const media = el('div', 'st-bmedia');
        const draw = () => {
          media.textContent = '';
          if (b.src) {
            const m = document.createElement(b.t === 'audio' ? 'audio' : 'video');
            m.controls = true; m.preload = 'metadata'; m.src = b.src;
            if (/\/u\/[a-f0-9]{24}\./.test(b.src)) media.appendChild(m);
            else media.appendChild(el('span', 'cap', 'لینک بیرونی: ' + b.src));
          }
          const up = btn('btn-ghost btn-sm', b.src ? 'فایل دیگر' : (b.t === 'audio' ? 'بارگذاری صوت (تا ۲۰ مگ)' : 'بارگذاری ویدیو (تا ۴۰ مگ)'), 'upload', () => pickFile(b.t === 'audio' ? 'audio/*' : 'video/*', async f => {
            up.disabled = true; up.lastChild.textContent = 'در حال بارگذاری…';
            try { b.src = await uploadMedia(f); dirty(); draw(); } catch (e) { failed(e); draw(); }
          }));
          media.appendChild(up);
        };
        draw();
        box.append(media, inp('src', b.t === 'video' ? 'یا لینک ویدیو (آپارات، یوتیوب…)' : 'یا لینک فایل صوتی', { ltr: true }),
          inp(b.t === 'audio' ? 'title' : 'cap', b.t === 'audio' ? 'عنوان (مثلاً «نسخهٔ صوتی»)' : 'زیرنویس (اختیاری)'));
      } else if (b.t === 'link') box.append(inp('url', 'https://…', { ltr: true }), inp('title', 'عنوان کارت'), inp('note', 'توضیح کوتاه (اختیاری)'));
      else if (b.t === 'btn') box.append(inp('label', 'متن دکمه'), inp('url', 'https://… یا t.me/…', { ltr: true }));
      else if (b.t === 'quote') box.append(inp('text', 'جمله', { multi: true, cls: 'st-bq' }), inp('by', 'از کیست (اختیاری)'));
      else box.appendChild(el('hr', 'st-hr'));
      return box;
    }
    drawBlocks();
    sideWriter(side, p, drawMeta);
    setTimeout(() => (p.title ? null : title.focus()), 30);
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  function sideWriter(side, p, drawMeta) {
    side.textContent = '';
    const dirty = () => { S.postDirty = true; };
    const acts = el('div', 'st-row');
    const save = async status => {
      if (!p.title.trim()) { toast('تیتر مطلب را بنویس', true); return; }
      const body = { app: S.app.id, id: p.id || undefined, title: p.title, lead: p.lead, cover: p.cover, body: p.body.filter(b => b.t === 'hr' || b.text || b.src || b.url),
        cat: p.cat, tags: p.tags, author: p.author, status };
      if (status === 'sched') body.pub_at = sched.value ? Math.floor(new Date(sched.value).getTime() / 1000) : 0;
      try {
        const r = await api('mag/save', body);
        const wasNew = !p.id;
        Object.assign(p, r.post);
        S.postDirty = false;
        toast(status === 'draft' ? 'پیش‌نویس ذخیره شد' : r.post.state === 'sched' ? 'زمان‌بندی شد' : 'منتشر شد');
        if (wasNew) history.replaceState(null, '', BASE + 'studio/' + S.app.id + '/write?post=' + p.id);
        sideWriter(side, p, drawMeta);
        loadMag();
      } catch (e) { failed(e); }
    };
    const pubLabel = p.state === 'pub' ? 'به‌روزرسانی' : 'انتشار مطلب';
    acts.append(btn('btn-ghost btn-sm grow', p.state === 'pub' ? 'برگرداندن به پیش‌نویس' : 'ذخیرهٔ پیش‌نویس', null, () => save('draft')),
      btn('btn-primary btn-sm grow', pubLabel, 'send', () => save('pub')));
    side.appendChild(acts);
    const sbox = el('div', 'st-wcard');
    const sched = el('input', 'st-in');
    sched.type = 'datetime-local';
    if (p.state === 'sched' && p.at) { const d = new Date(p.at * 1000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); sched.value = d.toISOString().slice(0, 16); }
    const sb = btn('btn-ghost btn-sm', 'زمان‌بندی', 'clock', () => { if (!sched.value) { sched.focus(); return; } save('sched'); });
    const srow = el('div', 'st-row st-wrapr');
    srow.append(sched, sb);
    sbox.append(el('b', '', 'انتشار در زمان دیگر'), srow);
    if (p.state !== 'draft') sbox.appendChild(el('span', 'cap', p.state === 'sched' ? 'انتشار: ' + ago(p.at) : 'منتشر شده ' + ago(p.at)));
    const card = (t, inner) => { const c = el('div', 'st-wcard'); c.appendChild(el('b', '', t)); inner.forEach(x => c.appendChild(x)); return c; };
    const catSel = selectIn([['', 'بی‌دسته']].concat(S.mag.cats.map(c => [c.id, c.name])), p.cat, v => { p.cat = v; dirty(); drawMeta(); });
    const tagsBox = el('div', 'st-tags');
    const drawTags = () => {
      tagsBox.textContent = '';
      p.tags.forEach((t, i) => {
        const chip = el('span', 'st-tagchip', '#' + t);
        const x = el('button', '');
        x.type = 'button';
        x.appendChild(ic('x'));
        x.addEventListener('click', () => { p.tags.splice(i, 1); dirty(); drawTags(); });
        chip.appendChild(x);
        tagsBox.appendChild(chip);
      });
      if (p.tags.length < 8) {
        const inp = el('input', 'st-taginput');
        inp.placeholder = '+ برچسب';
        inp.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.key === ',' || e.key === '،') && inp.value.trim()) {
            e.preventDefault();
            const t = inp.value.trim().replace(/^#/, '').replace(/\s+/g, '_').slice(0, 24);
            if (!p.tags.includes(t)) p.tags.push(t);
            dirty(); drawTags();
            tagsBox.querySelector('input').focus();
          }
        });
        tagsBox.appendChild(inp);
      }
    };
    drawTags();
    const auSel = selectIn([['', 'خودم']].concat(S.mag.authors.map(a => [a.id, a.name])), p.author, v => { p.author = v; dirty(); });
    side.append(sbox, card('دسته', [catSel]), card('برچسب‌ها', [tagsBox]), card('نویسنده', [auSel]));
    const lk = el('div', 'st-wcard');
    lk.appendChild(el('b', '', 'لینک این مطلب برای کانال'));
    if (p.link) {
      const row = el('div', 'st-linkbox');
      row.append(el('span', 'ltr', p.link.replace('https://', '')), iconBtn('copy', 'کپی', () => copy(p.link)));
      lk.appendChild(row);
      const cp = btn('btn-soft btn-sm', 'ساختن پست کانال', 'tg', () => channelPost(p));
      cp.disabled = p.state !== 'pub';
      lk.append(cp, el('span', 'cap', p.state === 'pub' ? 'دکمهٔ پست، همین مطلب را مستقیم در مینی‌اپ باز می‌کند.' : 'بعد از انتشار، پست کانال ساخته می‌شود.'));
    } else {
      lk.appendChild(el('span', 'cap', p.id ? 'برای لینک مستقیم، ربات مینی‌اپ را در @EasySazBot وصل کن.' : 'بعد از اولین ذخیره، لینک ساخته می‌شود.'));
    }
    side.appendChild(lk);
    if (p.id) {
      const del = btn('btn-text btn-sm st-del', 'حذف مطلب', 'trash', async () => {
        if (!await confirmBox('این مطلب برای همیشه پاک شود؟', 'پاک کن', true)) return;
        try { await api('mag/delete', { app: S.app.id, id: p.id }); S.postDirty = false; toast('پاک شد'); go('/' + S.app.id + '/content'); } catch (e) { failed(e); }
      });
      side.appendChild(del);
    }
  }
  function previewPost() {
    const p = S.post;
    modal((box, close) => {
      const head = el('div', 'st-row st-between');
      head.append(el('b', 'h2', 'پیش‌نمایش در گوشی'), iconBtn('x', 'بستن', close));
      const phone = el('div', 'st-phone st-phone--m');
      const scr = el('div', 'st-phone-scr');
      const pg = el('div', '');
      scr.appendChild(pg);
      phone.appendChild(scr);
      box.append(head, phone);
      const home = Object.assign({}, S.home || { latest: [], popular: [] }, { cats: S.mag.cats, authors: S.mag.authors });
      ES.render(pg, S.doc, { editing: true, appName: S.app.name, mag: home, magView: { post: Object.assign({ id: p.id || 'preview', mins: 1 }, p) } });
    }, 'st-mbox--phone');
  }

  /* ---------- پست کانال ---------- */
  function channelPost(p) {
    modal((box, close) => {
      box.classList.add('st-cp');
      const left = el('div', 'st-cp-l');
      const head = el('div', 'st-row');
      const hi = el('span', 'st-stat-ic');
      hi.style.setProperty('--c', '#2A8BD6');
      hi.appendChild(ic('tg'));
      const ht = el('div', 'col grow');
      ht.append(el('b', 'h2', 'پست کانال'), el('span', 'cap', 'از «' + p.title + '»'));
      head.append(hi, ht, iconBtn('x', 'بستن', close));
      const flow = el('div', 'st-flow');
      flow.append(ic('send'), document.createTextNode('پست کانال'), ic('fwd'), document.createTextNode('دکمهٔ «ادامه در مینی‌اپ»'), ic('fwd'), ic('text'), document.createTextNode('همین مطلب، کامل'));
      const text = el('textarea', 'st-in');
      text.rows = 4;
      text.maxLength = 700;
      text.value = p.lead || '';
      const cta = el('input', 'st-in');
      cta.maxLength = 30;
      cta.value = (S.doc.opts && S.doc.opts.post_cta) || 'ادامه در مینی‌اپ';
      const ch = S.mag.channel;
      const info = el('div', 'st-cp-info');
      if (!S.mag.bot) info.append(ic('bot'), el('span', 'cap', 'اول ربات مینی‌اپ را در @EasySazBot وصل کن (حالت «کنترل کامل»).'));
      else if (S.mag.mode !== 'full') info.append(ic('bot'), el('span', 'cap', 'برای این‌که دکمهٔ پست همان مطلب را باز کند، ربات @' + S.mag.bot + ' را در «کنترل کامل» بگذار.'));
      else if (!ch) info.append(ic('tg'), el('span', 'cap', 'کانالی ثبت نشده؛ در تنظیمات کانال را ثبت کن، یا لینک را کپی کن و خودت پست بگذار.'));
      else info.append(ic('check'), el('span', 'cap', 'به ' + (ch.title || '@' + ch.username) + ' فرستاده می‌شود؛ ربات ادمین کانال است.'));
      const send = btn('btn-primary', 'فرستادن به کانال', 'send', async () => {
        send.disabled = true;
        try {
          await api('mag/channel_post', { app: S.app.id, id: p.id, text: text.value, button: cta.value });
          toast('پست در کانال گذاشته شد');
          close();
        } catch (e) { failed(e); send.disabled = false; }
      });
      send.disabled = !(S.mag.bot && S.mag.mode === 'full' && ch);
      const copyB = btn('btn-ghost', 'فقط لینک را کپی کن', 'copy', () => copy(p.link));
      copyB.disabled = !p.link;
      const acts = el('div', 'st-row');
      acts.append(copyB, send);
      left.append(head, flow, field('متن پست', text), field('متن دکمه', cta), info, el('span', 'st-gap'), acts);
      const right = el('div', 'st-cp-r');
      const post = el('div', 'st-tgpost');
      const draw = () => {
        post.textContent = '';
        const bub = el('div', 'st-tgbub');
        const who = el('div', 'st-row');
        who.append(el('i', 'st-tgav', (S.app.name || '؟').charAt(0)), el('b', '', ch ? (ch.title || ch.username) : S.app.name));
        bub.appendChild(who);
        if (p.cover) { const im = el('img'); im.src = p.cover; im.alt = ''; bub.appendChild(im); }
        bub.append(el('b', 'st-tgt', p.title), el('p', '', text.value));
        post.appendChild(bub);
        const b = el('div', 'st-tgbtn');
        b.append(ic('bookmark'), document.createTextNode(cta.value || 'ادامه در مینی‌اپ'));
        post.appendChild(b);
      };
      draw();
      text.addEventListener('input', draw);
      cta.addEventListener('input', draw);
      right.appendChild(post);
      box.append(left, right);
    }, 'st-mbox--cp');
  }

  /* ===================== دسته‌ها، برچسب‌ها، نویسنده‌ها ===================== */
  const CAT_COLORS = ['#1D55F0', '#0E8FAE', '#12A071', '#E09A1F', '#E0573E', '#E0457B', '#6A55E0', '#0A2572'];
  const CAT_ICONS = [['cap', 'آموزش'], ['spark', 'تازه'], ['chat', 'گفت‌وگو'], ['globe', 'جهان'], ['cup', 'غذا'], ['star', 'ویژه'], ['book', 'کتاب'], ['image', 'تصویر'], ['music', 'موسیقی'], ['heart', 'زندگی'], ['shop', 'خرید'], ['list', 'فهرست']];
  async function taxonomy(main) {
    $('ws-end').textContent = '';
    await loadMag();
    const m = S.mag;
    main.classList.add('st-tax', 'wrap');
    const col = (title, sub, addLabel, onAdd) => {
      const c = el('section', 'st-taxcol card');
      const h = el('div', 'st-row');
      const t = el('div', 'col grow');
      t.append(el('b', 'h2', title), el('span', 'cap', sub));
      h.appendChild(t);
      if (addLabel) h.appendChild(btn('btn-soft btn-sm', addLabel, 'plus', onAdd));
      c.appendChild(h);
      main.appendChild(c);
      return c;
    };
    const cats = col('دسته‌ها', 'ترتیب همین‌جا = ترتیب نوار دسته‌ها', 'دسته', () => catForm({}));
    m.cats.forEach((c, i) => {
      const row = el('div', 'st-catrow');
      const ci = el('span', 'st-catic');
      ci.style.setProperty('--c', c.color);
      ci.appendChild(ES.icon(ES.ICONS[c.icon] ? c.icon : 'list'));
      const tools = el('span', 'st-sec-tools');
      tools.append(iconBtn('up', 'بالا', () => reorder(i, -1)), iconBtn('down', 'پایین', () => reorder(i, 1)), iconBtn('trash', 'حذف', () => delCat(c)));
      row.append(ci, el('b', 'grow', c.name), el('span', 'cap', fa(c.count) + ' مطلب'), tools);
      row.addEventListener('click', () => catForm(c));
      cats.appendChild(row);
    });
    if (!m.cats.length) cats.appendChild(el('p', 'cap', 'هنوز دسته‌ای نیست.'));
    async function reorder(i, d) {
      const ids = m.cats.map(c => c.id);
      const j = i + d;
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      try { await api('mag/cat_order', { app: S.app.id, ids }); await refreshHome(); taxonomy(clear(main)); } catch (e) { failed(e); }
    }
    async function delCat(c) {
      if (!await confirmBox(`دستهٔ «${c.name}» پاک شود؟ ${fa(c.count)} مطلبش بی‌دسته می‌شوند.`, 'پاک کن', true)) return;
      try { await api('mag/cat_delete', { app: S.app.id, id: c.id }); await refreshHome(); taxonomy(clear(main)); } catch (e) { failed(e); }
    }
    const tags = col('برچسب‌ها', 'بزرگ‌تر = پرکاربردتر؛ موقع نوشتن مطلب ساخته می‌شوند');
    const cloud = el('div', 'st-cloud');
    const max = Math.max(1, ...m.tags.map(t => t[1]));
    m.tags.forEach(([t, n]) => {
      const s = el('span', 'st-ctag');
      s.style.fontSize = (12 + Math.round(n / max * 6)) + 'px';
      s.append(document.createTextNode('#' + t.replace(/_/g, ' ')), el('b', '', fa(n)));
      s.addEventListener('click', () => { S.q = t.replace(/_/g, ' '); go('/' + S.app.id + '/content'); });
      cloud.appendChild(s);
    });
    if (!m.tags.length) cloud.appendChild(el('p', 'cap', 'هنوز برچسبی نیست.'));
    tags.appendChild(cloud);
    const au = col('نویسنده‌ها', 'هر مطلب یک نویسنده دارد؛ صفحهٔ نویسنده خودکار ساخته می‌شود', 'نویسنده', () => authorForm({}));
    m.authors.forEach(a => {
      const row = el('div', 'st-catrow');
      const av = el('span', 'st-auav');
      if (a.avatar) av.style.backgroundImage = `url("${a.avatar.replace(/"/g, '')}")`; else av.textContent = a.name.charAt(0);
      const tx = el('div', 'col grow');
      tx.append(el('b', '', a.name), el('span', 'cap', a.bio || ''));
      row.append(av, tx, el('span', 'cap', fa(a.count) + ' مطلب'));
      if (a.tg) row.appendChild(el('span', 'tag st-src-tg', 'از تلگرام می‌نویسد'));
      const tools = el('span', 'st-sec-tools');
      tools.appendChild(iconBtn('trash', 'حذف', async () => {
        if (!await confirmBox(`نویسندهٔ «${a.name}» پاک شود؟`, 'پاک کن', true)) return;
        try { await api('mag/author_delete', { app: S.app.id, id: a.id }); taxonomy(clear(main)); } catch (e) { failed(e); }
      }));
      row.appendChild(tools);
      row.addEventListener('click', () => authorForm(a));
      au.appendChild(row);
    });
    function catForm(c) {
      const v = { name: c.name || '', color: c.color || CAT_COLORS[0], icon: c.icon || 'list' };
      modal((box, close) => {
        box.appendChild(el('b', 'h2', c.id ? 'ویرایش دسته' : 'دستهٔ تازه'));
        const name = el('input', 'st-in');
        name.value = v.name;
        name.maxLength = 30;
        name.placeholder = 'مثلاً آموزش';
        const sws = el('div', 'st-sws');
        const drawSw = () => {
          sws.textContent = '';
          CAT_COLORS.forEach(col2 => { const b = el('button', 'st-swatch' + (v.color === col2 ? ' on' : '')); b.type = 'button'; b.style.background = col2; b.addEventListener('click', () => { v.color = col2; drawSw(); drawIc(); }); sws.appendChild(b); });
        };
        const ics = el('div', 'st-icgrid');
        const drawIc = () => {
          ics.textContent = '';
          CAT_ICONS.forEach(([k, label]) => { const b = el('button', 'st-icpick' + (v.icon === k ? ' on' : '')); b.type = 'button'; b.title = label; b.style.setProperty('--c', v.color); b.appendChild(ES.icon(k)); b.addEventListener('click', () => { v.icon = k; drawIc(); }); ics.appendChild(b); });
        };
        drawSw(); drawIc();
        const ok = btn('btn-primary', 'ذخیره', 'check', async () => {
          try { await api('mag/cat_save', { app: S.app.id, id: c.id, name: name.value, color: v.color, icon: v.icon }); close(); await refreshHome(); taxonomy(clear(main)); } catch (e) { failed(e); }
        });
        box.append(field('اسم', name), field('رنگ', sws), field('آیکن', ics), ok);
        setTimeout(() => name.focus(), 30);
      }, 'st-mbox--s');
    }
    function authorForm(a) {
      const v = { name: a.name || '', bio: a.bio || '', avatar: a.avatar || '' };
      modal((box, close) => {
        box.appendChild(el('b', 'h2', a.id ? 'ویرایش نویسنده' : 'نویسندهٔ تازه'));
        const name = el('input', 'st-in'); name.value = v.name; name.maxLength = 40;
        const bio = el('input', 'st-in'); bio.value = v.bio; bio.maxLength = 120; bio.placeholder = 'مثلاً عکاس و مدرس';
        const avBox = el('div', '');
        const drawAv = () => { avBox.textContent = ''; avBox.appendChild(imageIn(v.avatar, url => { v.avatar = url; drawAv(); })); };
        drawAv();
        const ok = btn('btn-primary', 'ذخیره', 'check', async () => {
          try { await api('mag/author_save', { app: S.app.id, id: a.id, name: name.value, bio: bio.value, avatar: v.avatar }); close(); await refreshHome(); taxonomy(clear(main)); } catch (e) { failed(e); }
        });
        box.append(field('اسم', name), field('معرفی کوتاه', bio), field('عکس', avBox), ok);
      }, 'st-mbox--s');
    }
  }
  async function refreshHome() {
    try { const d = await api('app?id=' + S.app.id); S.home = d.mag_home || S.home; } catch (e) { /* بعداً */ }
  }

  /* ===================== تنظیمات ===================== */
  function settings(main) {
    $('ws-end').textContent = '';
    main.classList.add('st-set', 'wrap');
    const card = (title, sub) => { const c = el('section', 'card st-setc'); const h = el('div', 'col'); h.append(el('b', 'h2', title)); if (sub) h.appendChild(el('span', 'cap', sub)); c.appendChild(h); main.appendChild(c); return c; };
    const nm = card('اسم مینی‌اپ', 'روی دکمهٔ منوی ربات هم همین دیده می‌شود');
    const name = el('input', 'st-in'); name.value = S.app.name; name.maxLength = 40;
    const row = el('div', 'st-row'); row.append(name, btn('btn-primary btn-sm', 'ذخیره', 'check', async () => {
      try { const r = await api('app/rename', { id: S.app.id, name: name.value }); S.app = r.app; toast('ذخیره شد'); workspace(); } catch (e) { failed(e); }
    }));
    nm.appendChild(row);
    const bot = card('ربات و کانال', 'ربات مینی‌اپ را در @EasySazBot وصل کن؛ برای پست مطلب‌ها در کانال، ربات باید ادمین کانال باشد');
    const binfo = el('div', 'st-cp-info');
    if (S.app.bot_username) binfo.append(ic('bot'), el('span', '', '@' + S.app.bot_username + ' · ' + ({ full: 'کنترل کامل', menu: 'دکمهٔ منو' }[S.app.mode] || 'وصل نیست')));
    else binfo.append(ic('bot'), el('span', 'cap', 'هنوز رباتی وصل نشده'));
    bot.appendChild(binfo);
    const chIn = el('input', 'st-in'); chIn.dir = 'ltr'; chIn.placeholder = '@my_channel';
    chIn.value = S.app.channel ? (S.app.channel.username ? '@' + S.app.channel.username : String(S.app.channel.id)) : '';
    const chRow = el('div', 'st-row');
    chRow.append(chIn, btn('btn-ghost btn-sm', 'ثبت کانال', 'tg', async () => {
      try { const r = await api('app/channel', { id: S.app.id, channel: chIn.value }); S.app.channel = r.channel; toast(r.channel ? 'کانال ثبت شد: ' + (r.channel.title || r.channel.username) : 'کانال برداشته شد'); } catch (e) { failed(e); }
    }));
    bot.appendChild(field('کانال', chRow));
    if (S.app.url) {
      const open = el('a', 'btn btn-soft btn-sm', 'باز کردن صفحهٔ مینی‌اپ');
      open.href = S.app.url; open.target = '_blank'; open.rel = 'noopener';
      bot.appendChild(open);
    }
    const st = card('آمار', 'بازدیدکننده‌های مینی‌اپ (هر نفر یک بار در روز)');
    const s = S.stats || {};
    const g = el('div', 'st-stats');
    [['امروز', s.views_today], ['این هفته', s.views_week], ['نفر این هفته', s.people_week], ['همهٔ بازدیدکننده‌ها', s.visitors]].forEach(([t, n]) => {
      const c = el('div', 'st-stat'); const tx = el('div', 'col'); tx.append(el('b', '', fa(n)), el('span', 'cap', t)); c.appendChild(tx); g.appendChild(c);
    });
    st.appendChild(g);
    const tp = card('قالب', 'قالب فعلی: «' + ({ mag: 'مجله', shab: 'قسمت' }[S.doc.kit] || 'پایه') + '». عوض کردن قالب از صفحهٔ قالب‌ها؛ قبلش زنده امتحانش کن.');
    tp.appendChild(btn('btn-ghost btn-sm', 'رفتن به قالب‌ها', 'layers', () => go('/templates')));
    S.app_id_cache = S.app.id;
  }

  route();
})();
