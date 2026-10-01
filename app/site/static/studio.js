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
    tag: 'M3 12V4h8l9 9-8 8zM7.5 7.5h.01', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', bot: 'M5 9h14v10H5zM12 5v4M9 13h.01M15 13h.01M9 16h6',
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
      if (!S.app || String(S.app.id) !== id) await loadApp(id);
      S.tab = tab || (S.doc.kit === 'mag' ? 'design' : 'settings');
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
    root.appendChild(topbar([el('span', 'st-gap'), acc]));
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
    add.addEventListener('click', newApp);
    grid.appendChild(add);
    main.appendChild(grid);
    root.appendChild(main);
  }

  function newApp() {
    const d = S.apps;
    let pick = 'mag';
    modal((box, close) => {
      box.classList.add('st-new');
      const head = el('div', 'st-row');
      const ht = el('div', 'col grow');
      ht.append(el('span', 'cap', 'مینی‌اپ تازه'), el('b', 'h2', 'یک قالب انتخاب کن'));
      head.append(ht, iconBtn('x', 'بستن', close));
      box.appendChild(head);
      const body = el('div', 'st-new-b');
      const big = el('div', 'st-tpl-big');
      const bt = el('div', 'col');
      bt.append(el('span', 'tag tag-brand', 'قالب پیشنهادی'), el('b', 'st-tpl-name', 'مجله'),
        el('p', 'cap', 'برای کانال‌هایی که مطلب می‌نویسند: پست کوتاه در کانال، نسخهٔ کامل با عکس، صوت و ویدیو در مینی‌اپ.'));
      const feats = el('ul', 'st-feats');
      [['text', 'متن، تصویر، صوت، ویدیو، لینک و دکمه'], ['folder', 'دسته، برچسب و نویسنده'], ['tg', 'لینک هر مطلب برای پست کانال'], ['bookmark', 'ذخیره و ادامهٔ خواندن']]
        .forEach(([i, t]) => { const li = el('li'); li.append(ic(i), document.createTextNode(t)); feats.appendChild(li); });
      bt.appendChild(feats);
      big.appendChild(bt);
      const others = el('div', 'st-tpl-others');
      const opt = (id, title, sub, ready) => {
        const o = el('button', 'st-tpl' + (id === pick ? ' on' : ''));
        o.type = 'button';
        o.disabled = !ready;
        o.append(el('b', '', title), el('span', 'cap', sub));
        if (!ready) o.appendChild(el('span', 'tag tag-warn', 'به‌زودی'));
        o.addEventListener('click', () => { pick = id; others.querySelectorAll('.st-tpl').forEach(x => x.classList.toggle('on', x === o)); });
        return o;
      };
      others.append(opt('mag', 'مجله', 'مطلب، دسته، نویسنده', true), opt('shab', 'قسمت', 'داستان قسمت‌به‌قسمت', true));
      (d.store || []).filter(s => s.status === 'soon').slice(0, 3).forEach(s => others.appendChild(opt(s.id, s.title, s.tagline, false)));
      body.append(big, others);
      box.appendChild(body);
      const name = el('input', 'st-in');
      name.placeholder = 'اسم مینی‌اپ (مثلاً اسم کانالت)';
      name.maxLength = 40;
      const go2 = btn('btn-primary', 'ساختن', 'plus', async () => {
        if (name.value.trim().length < 2) { name.focus(); toast('اسم حداقل ۲ حرف', true); return; }
        go2.disabled = true;
        try {
          const r = await api('app/create', { name: name.value.trim(), template: pick });
          close();
          go('/' + r.app.id);
        } catch (e) { go2.disabled = false; failed(e); }
      });
      const foot = el('div', 'st-row st-new-f');
      foot.append(name, go2);
      box.append(foot, el('p', 'cap st-note', 'قالب و ظاهر فقط از همین سایت عوض می‌شود؛ مطلب را از سایت یا داخل تلگرام اضافه کن.'));
      setTimeout(() => name.focus(), 50);
    }, 'st-mbox--l');
  }

  /* ===================== محیط کار یک مینی‌اپ ===================== */
  async function loadApp(id) {
    const d = await api('app?id=' + encodeURIComponent(id));
    S.app = d.app; S.doc = d.doc; S.home = d.mag_home || null; S.stats = d.stats; S.kits = d.schema.kits;
    S.hist = []; S.sel = null; S.page = 'home'; S.post = null;
    await schema();
    if (S.doc.kit === 'mag') await loadMag();
  }
  async function loadMag() {
    S.mag = await api('mag/data?app=' + S.app.id);
  }
  const TABS = [['design', 'pal', 'طراحی'], ['content', 'list', 'مطالب'], ['taxonomy', 'folder', 'دسته‌ها و نویسنده‌ها'], ['settings', 'sliders', 'تنظیمات']];
  function workspace() {
    root.textContent = '';
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
    if (!mag && S.tab !== 'settings') return notMag(main);
    ({ design, content, write: writer, taxonomy, settings }[S.tab] || design)(main);
  }
  function notMag(main) {
    const box = el('div', 'st-empty card');
    box.append(ic('lock'), el('b', 'h2', 'این قالب فعلاً از مینی‌اپ ویرایش می‌شود'),
      el('p', 'cap', 'ویرایشگر سایت اول برای قالب «مجله» ساخته شده. این مینی‌اپ را از مینی‌اپ ایزی‌ساز در تلگرام ویرایش کن، یا در تنظیمات قالبش را به «مجله» عوض کن.'));
    const b = btn('btn-soft btn-sm', 'تنظیمات', 'sliders', () => go('/' + S.app.id + '/settings'));
    box.appendChild(b);
    main.appendChild(box);
  }

  /* ===================== طراحی ===================== */
  const PAGE_LABELS = { home: 'خانه', cats: 'دسته‌ها', saved: 'ذخیره‌ها', authors: 'نویسنده‌ها' };
  const VIRTUAL = [['@post', 'text', 'صفحهٔ مطلب'], ['@cat', 'folder', 'صفحهٔ دسته'], ['@author', 'user', 'صفحهٔ نویسنده']];
  const spec = t => (S.schema.blocks[t] || { title: t, fields: [], icon: 'spark' });
  const curPage = () => S.doc.pages.find(p => p.id === S.page) || null;
  function newId() { return 'b' + Math.random().toString(36).slice(2, 9).replace(/[^a-z0-9]/g, 'x'); }
  function defaults(type) {
    const out = {};
    (spec(type).fields || []).forEach(f => { out[f.key] = clone(f.default === undefined ? '' : f.default); });
    return out;
  }

  function change(fn, label) {
    S.hist.push(JSON.stringify(S.doc));
    if (S.hist.length > 60) S.hist.shift();
    fn();
    S.app.dirty = true;
    renderDesign();
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
    S.doc = JSON.parse(S.hist.pop());
    renderDesign();
    scheduleSave();
  }

  function design(main) {
    const end = $('ws-end');
    end.textContent = '';
    const st = el('span', 'st-save st-save--ok', 'ذخیره شد');
    st.id = 'save-st';
    const pub = btn('btn-primary btn-sm', 'انتشار ظاهر', 'send', async () => {
      if (S.pending) await saveNow();
      pub.disabled = true;
      try {
        const r = await api('app/publish', { id: S.app.id, doc: S.doc });
        S.app = r.app;
        toast('ظاهر منتشر شد؛ خواننده‌ها همین الان می‌بینند');
        renderDesign();
      } catch (e) { failed(e); } finally { pub.disabled = false; }
    });
    end.append(st, iconBtn('undo', 'برگرداندن', undo), pub);
    main.classList.add('st-design');
    main.innerHTML = '<aside class="st-col st-col--r" id="d-r"></aside><section class="st-canvas" id="d-c"></section><aside class="st-col st-col--l" id="d-l"></aside>';
    document.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'z' && S.tab === 'design' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); undo(); } };
    renderDesign();
  }
  function renderDesign() {
    if (S.tab !== 'design' || !$('d-r')) return;
    renderSections();
    renderPreview();
    renderInspector();
  }

  function renderSections() {
    const r = $('d-r');
    r.textContent = '';
    r.appendChild(el('span', 'st-lbl', 'صفحه‌های قالب'));
    const pages = el('div', 'st-pages');
    S.doc.pages.forEach(p => {
      const b = el('button', 'st-pg' + (S.page === p.id ? ' on' : ''));
      b.type = 'button';
      b.append(ic({ home: 'home', cats: 'folder', saved: 'bookmark', authors: 'user' }[p.id] || 'list'), document.createTextNode(p.title || PAGE_LABELS[p.id] || p.id));
      b.addEventListener('click', () => { S.page = p.id; S.sel = null; renderDesign(); });
      pages.appendChild(b);
    });
    VIRTUAL.forEach(([id, i, label]) => {
      const b = el('button', 'st-pg st-pg--v' + (S.page === id ? ' on' : ''));
      b.type = 'button';
      b.append(ic(i), document.createTextNode(label), el('span', 'st-pv', 'پیش‌نمایش'));
      b.addEventListener('click', () => { S.page = id; S.sel = null; renderDesign(); });
      pages.appendChild(b);
    });
    r.appendChild(pages);
    const page = curPage();
    if (!page) {
      r.appendChild(el('p', 'cap st-hint', 'این صفحه خودکار از روی ظاهر کل ساخته می‌شود؛ رنگ، حال‌وهوا و گوشه‌ها را از ستون چپ عوض کن.'));
      return;
    }
    const head = el('div', 'st-row st-sec-h');
    head.append(el('b', '', 'بخش‌های ' + (page.title || '')), el('span', 'cap', fa(page.blocks.length) + ' بخش'));
    r.appendChild(head);
    const list = el('div', 'st-secs');
    page.blocks.forEach((b, i) => {
      const sp = spec(b.type);
      const row = el('div', 'st-sec' + (S.sel === b.id ? ' on' : ''));
      row.draggable = true;
      row.dataset.i = i;
      const icon = el('span', 'st-sec-ic');
      icon.appendChild(ES.icon(ES.ICONS[sp.icon] ? sp.icon : 'list'));
      const tx = el('span', 'st-sec-tx');
      tx.append(el('b', '', sp.title), el('span', 'cap', secSub(b)));
      const tools = el('span', 'st-sec-tools');
      tools.append(iconBtn('up', 'بالا', () => move(i, -1)), iconBtn('down', 'پایین', () => move(i, 1)), iconBtn('trash', 'حذف', () => remove(i)));
      row.append(ic('grip', 'st-grip'), icon, tx, tools);
      row.addEventListener('click', () => { S.sel = b.id; S.panel = 'block'; renderDesign(); });
      row.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(i)); row.classList.add('drag'); });
      row.addEventListener('dragend', () => row.classList.remove('drag'));
      row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('over'); });
      row.addEventListener('dragleave', () => row.classList.remove('over'));
      row.addEventListener('drop', e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (from === i || isNaN(from)) return;
        change(() => { const [x] = page.blocks.splice(from, 1); page.blocks.splice(i, 0, x); });
      });
      list.appendChild(row);
    });
    r.appendChild(list);
    r.appendChild(btn('btn-ghost btn-sm st-add', 'افزودن بخش', 'plus', addSection));
  }
  function secSub(b) {
    const p = b.props || {};
    if (b.type === 'mag_latest') return ({ list: 'فهرست', grid: 'شبکه', big: 'کارت بزرگ' }[p.layout] || '') + ' · ' + fa(p.count) + ' مطلب';
    if (b.type === 'mag_popular') return 'شماره‌دار · ' + fa(p.count) + ' مطلب';
    if (b.type === 'mag_featured') return p.post ? 'مطلب انتخاب‌شده' : 'تازه‌ترین مطلب';
    if (b.type === 'mag_cats') return p.style === 'tiles' ? 'کاشی' : 'برچسبی';
    return p.title || p.text || spec(b.type).desc || '';
  }
  function move(i, d) {
    const page = curPage();
    const j = i + d;
    if (j < 0 || j >= page.blocks.length) return;
    change(() => { const [x] = page.blocks.splice(i, 1); page.blocks.splice(j, 0, x); });
  }
  async function remove(i) {
    const page = curPage();
    if (!await confirmBox('این بخش از صفحه برداشته شود؟ (مطلب‌ها پاک نمی‌شوند)', 'بردار', true)) return;
    change(() => { const [x] = page.blocks.splice(i, 1); if (S.sel === x.id) S.sel = null; });
  }
  function addSection() {
    const page = curPage();
    const kit = S.kits.mag || {};
    const types = Object.keys(S.schema.blocks).filter(t => t.startsWith('mag_')).concat(kit.generic || []);
    modal((box, close) => {
      box.append(el('b', 'h2', 'افزودن بخش'), el('p', 'cap', 'بخش زیر بخش انتخاب‌شده (یا آخر صفحه) می‌نشیند.'));
      const g = el('div', 'st-addgrid');
      types.forEach(t => {
        const sp = spec(t);
        const b = el('button', 'st-addit' + (t.startsWith('mag_') ? ' mag' : ''));
        b.type = 'button';
        const icon = el('span', 'st-sec-ic');
        icon.appendChild(ES.icon(ES.ICONS[sp.icon] ? sp.icon : 'list'));
        b.append(icon, el('b', '', sp.title), el('span', 'cap', sp.desc || ''));
        b.addEventListener('click', () => {
          close();
          const blk = { id: newId(), type: t, props: defaults(t) };
          const at = S.sel ? page.blocks.findIndex(x => x.id === S.sel) + 1 : page.blocks.length;
          change(() => { page.blocks.splice(at || page.blocks.length, 0, blk); S.sel = blk.id; S.panel = 'block'; });
        });
        g.appendChild(b);
      });
      box.appendChild(g);
    }, 'st-mbox--l');
  }

  async function firstPost() {
    const pub = (S.mag && S.mag.posts || []).find(p => p.state === 'pub');
    if (!pub) return null;
    if (S._pv && S._pv.id === pub.id) return S._pv;
    try { S._pv = (await api('mag/get?app=' + S.app.id + '&id=' + pub.id)).post; } catch (e) { S._pv = null; }
    return S._pv;
  }
  async function renderPreview() {
    const c = $('d-c');
    c.textContent = '';
    const bar = el('div', 'st-cbar');
    const dirty = S.app.dirty ? el('span', 'tag tag-warn', 'تغییر منتشرنشده') : el('span', 'tag tag-ok', 'همان چیزی که خواننده‌ها می‌بینند');
    bar.append(dirty);
    c.appendChild(bar);
    const phone = el('div', 'st-phone');
    const scr = el('div', 'st-phone-scr');
    const pg = el('div', '');
    scr.appendChild(pg);
    phone.appendChild(scr);
    c.appendChild(phone);
    const home = S.home || { cats: [], authors: [], latest: [], popular: [] };
    const opts = { editing: true, appName: S.app.name, mag: home, selected: S.sel, page: curPage() ? S.page : 'home',
      onPick: id => { S.sel = id; S.panel = 'block'; renderDesign(); }, onPickHeader: () => { S.panel = 'theme'; renderInspector(); } };
    if (S.page === '@post') {
      const p = await firstPost();
      opts.magView = p ? { post: p } : null;
    } else if (S.page === '@cat') {
      const cat = home.cats[0];
      opts.magView = cat ? { list: { cat: cat.id, title: cat.name, color: cat.color } } : null;
    } else if (S.page === '@author') {
      const a = home.authors[0];
      opts.magView = a ? { list: { author: a.id, title: a.name, who: a } } : null;
    }
    ES.render(pg, S.doc, opts);
    // فقط صفحهٔ گوشی اسکرول شود، نه کل ستون
    if (S.sel) { const n = pg.querySelector(`[data-id="${S.sel}"]`); if (n) scr.scrollTop = Math.max(0, n.offsetTop - 140); }
  }

  /* ---------- ستون چپ: ظاهر کل یا بخش انتخاب‌شده ---------- */
  function renderInspector() {
    const l = $('d-l');
    if (!l) return;
    l.textContent = '';
    const blk = curPage() && S.sel ? curPage().blocks.find(b => b.id === S.sel) : null;
    if (!blk && S.panel === 'block') S.panel = 'theme';
    const seg = el('div', 'st-seg');
    [['theme', 'ظاهر کل مینی‌اپ'], ['block', blk ? '«' + spec(blk.type).title + '»' : 'بخش']].forEach(([id, label]) => {
      const b = el('button', S.panel === id ? 'on' : '', label);
      b.type = 'button';
      b.disabled = id === 'block' && !blk;
      b.addEventListener('click', () => { S.panel = id; renderInspector(); });
      seg.appendChild(b);
    });
    l.appendChild(seg);
    if (S.panel === 'block' && blk) blockForm(l, blk); else themeForm(l);
    const lock = el('div', 'st-lockn');
    lock.append(ic('lock'), el('span', 'cap', 'طراحی فقط از سایت. در تلگرام فقط مطلب اضافه می‌شود.'));
    l.appendChild(lock);
  }
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
    i.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => onChange(i.value), 350); });
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
  function themeForm(l) {
    const d = S.doc, kit = S.kits.mag || {};
    d.opts = d.opts || {};
    const set = fn => change(fn);
    const moods = el('div', 'st-moods');
    [['news', 'روزنامه', ['#1D55F0', '#0F1424', '#F3F5F9']], ['classic', 'کلاسیک', ['#C9A66B', '#1E1A14', '#F4EFE6']], ['warm', 'گرم', ['#E0573E', '#2A1D3F', '#FFF4EC']]].forEach(([id, label, cols]) => {
      const b = el('button', 'st-mood' + ((d.opts.mood || 'news') === id ? ' on' : ''));
      b.type = 'button';
      const sw = el('span', 'st-mood-sw');
      cols.forEach(c => { const i = el('i'); i.style.background = c; sw.appendChild(i); });
      b.append(sw, el('b', '', label));
      b.addEventListener('click', () => set(() => { d.opts.mood = id; }));
      moods.appendChild(b);
    });
    l.appendChild(field('حال‌وهوا', moods));
    const sws = el('div', 'st-sws');
    (kit.accents || []).forEach(([name, c]) => {
      const b = el('button', 'st-swatch' + (d.theme.accent.toLowerCase() === c.toLowerCase() ? ' on' : ''));
      b.type = 'button';
      b.title = name;
      b.style.background = c;
      b.addEventListener('click', () => set(() => { d.theme.accent = c; }));
      sws.appendChild(b);
    });
    const custom = el('input', 'st-color');
    custom.type = 'color';
    custom.value = d.theme.accent;
    custom.title = 'رنگ دلخواه';
    custom.addEventListener('change', () => set(() => { d.theme.accent = custom.value.toUpperCase(); }));
    sws.appendChild(custom);
    l.appendChild(field('رنگ اصلی', sws));
    l.appendChild(field('روشنایی', segmented([['light', 'روشن'], ['auto', 'خودکار'], ['dark', 'تیره']], d.theme.mode, v => set(() => { d.theme.mode = v; }))));
    l.appendChild(field('گوشه‌ها', segmented([['sharp', 'تیز'], ['soft', 'نرم'], ['round', 'گرد']], d.theme.radius === 'custom' ? 'soft' : d.theme.radius, v => set(() => { d.theme.radius = v; }))));
    l.appendChild(el('hr', 'st-hr'));
    l.appendChild(field('اسم بالای مینی‌اپ', textIn(d.header.title, v => set(() => { d.header.title = v; }), { max: 40 })));
    l.appendChild(field('زیرعنوان', textIn(d.header.subtitle, v => set(() => { d.header.subtitle = v; }), { max: 60 })));
    l.appendChild(field('لوگو', imageIn(d.header.logo, v => set(() => { d.header.logo = v; }))));
    l.appendChild(el('hr', 'st-hr'));
    const row = (label, ctrl) => { const r = el('div', 'st-row st-between'); r.append(el('span', 'st-lbl', label), ctrl); return r; };
    l.appendChild(row('نوار پایین', toggle(d.tabbar.enabled, v => set(() => { d.tabbar.enabled = v; }))));
    if (d.tabbar.enabled) l.appendChild(field('سبک نوار پایین', segmented([['floating', 'شناور'], ['docked', 'چسبیده'], ['minimal', 'فقط آیکن']], d.tabbar.style, v => set(() => { d.tabbar.style = v; }))));
    l.appendChild(row('زمان خواندن روی کارت‌ها', toggle(d.opts.readtime !== false, v => set(() => { d.opts.readtime = v; }))));
    l.appendChild(field('متن دکمهٔ پست کانال', textIn(d.opts.post_cta || 'ادامه در مینی‌اپ', v => set(() => { d.opts.post_cta = v; }), { max: 30 })));
  }
  function blockForm(l, blk) {
    const sp = spec(blk.type);
    const set = fn => change(fn);
    const head = el('div', 'st-bhead');
    const icon = el('span', 'st-sec-ic');
    icon.appendChild(ES.icon(ES.ICONS[sp.icon] ? sp.icon : 'list'));
    const tx = el('div', 'col');
    tx.append(el('b', '', sp.title), el('span', 'cap', sp.desc || ''));
    head.append(icon, tx);
    l.appendChild(head);
    (sp.fields || []).forEach(f => {
      if (f.type === 'id') return;
      const v = blk.props[f.key];
      const put = nv => set(() => { blk.props[f.key] = nv; });
      if (blk.type === 'mag_featured' && f.key === 'post') {
        const posts = (S.mag ? S.mag.posts : []).filter(p => p.state === 'pub');
        l.appendChild(field(f.label, selectIn([['', 'تازه‌ترین مطلب (خودکار)']].concat(posts.map(p => [p.id, p.title])), v, put)));
        return;
      }
      if (blk.type === 'mag_latest' && f.key === 'cat') {
        l.appendChild(field(f.label, selectIn([['', 'همهٔ دسته‌ها']].concat((S.mag ? S.mag.cats : []).map(c => [c.id, c.name])), v, put)));
        return;
      }
      l.appendChild(fieldFor(f, v, put));
    });
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
      r.type = 'range'; r.min = f.min; r.max = f.max; r.value = v;
      const n = el('b', 'st-num', fa(v));
      r.addEventListener('input', () => { n.textContent = fa(r.value); });
      r.addEventListener('change', () => put(Number(r.value)));
      box.append(r, n);
      return field(f.label, box);
    }
    if (f.type === 'color') { const c = el('input', 'st-color'); c.type = 'color'; c.value = v || '#1D55F0'; c.addEventListener('change', () => put(c.value.toUpperCase())); return field(f.label, c); }
    if (f.type === 'list') {
      const box = el('div', 'st-list');
      const items = Array.isArray(v) ? v : [];
      items.forEach((it, i) => {
        const card = el('div', 'st-li');
        const top = el('div', 'st-row st-between');
        top.append(el('b', 'st-lbl', (f.item_label || 'مورد') + ' ' + fa(i + 1)), iconBtn('trash', 'حذف', () => put(items.filter((_, k) => k !== i))));
        card.appendChild(top);
        (f.fields || []).forEach(sf => { if (sf.type !== 'id') card.appendChild(fieldFor(sf, it[sf.key], nv => { const copy = clone(items); copy[i][sf.key] = nv; put(copy); })); });
        box.appendChild(card);
      });
      if (items.length < (f.max_items || 10)) {
        box.appendChild(btn('btn-ghost btn-sm', 'افزودن ' + (f.item_label || 'مورد'), 'plus', () => {
          const it = {};
          (f.fields || []).forEach(sf => { it[sf.key] = clone(sf.default === undefined ? '' : sf.default); });
          put(items.concat([it]));
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
    const tp = card('قالب', 'عوض کردن قالب، طراحی فعلی را برمی‌دارد؛ اگر قالب عوض شود، محتوای قالب قبلی هم پاک می‌شود');
    const tr = el('div', 'st-row');
    [['mag', 'مجله'], ['shab', 'قسمت']].forEach(([id, label]) => {
      const cur = S.doc.kit === id;
      const b = btn(cur ? 'btn-soft btn-sm' : 'btn-ghost btn-sm', cur ? label + ' (فعلی)' : 'نصب ' + label, null, async () => {
        const msg = cur ? `قالب «${label}» دوباره نصب شود؟ طراحی به حالت اول برمی‌گردد (مطلب‌ها می‌مانند).` : `قالب به «${label}» عوض شود؟ محتوای قالب فعلی پاک می‌شود.`;
        if (!await confirmBox(msg, 'بله', !cur)) return;
        try { await api('app/template', { id: S.app.id, template: id }); S.app = null; go('/' + S.app_id_cache + '/' + (id === 'mag' ? 'design' : 'settings'), true); } catch (e) { failed(e); }
      });
      tr.appendChild(b);
    });
    tp.appendChild(tr);
    S.app_id_cache = S.app.id;
  }

  route();
})();
