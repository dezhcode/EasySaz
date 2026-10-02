/* ایزی‌ساز — ربات‌ساز (بخشی جدا داخل مینی‌اپ ایزی‌ساز)

   ربات = چند «پیام» که با «دکمه» به هم وصل‌اند. ساختن داخل خود چت انجام
   می‌شود: پیام و دکمه‌ها همان‌طور که کاربر می‌بیند؛ روی هر چیز بزنی برگه‌اش
   از پایین باز می‌شود. «تست» پیش‌نویس را در چت واقعی صاحب ربات می‌فرستد؛
   کاربرها تا «انتشار» نسخهٔ قبلی را دارند.

   سند همان app/botkit/schema.py است. پنل (panel.js) فقط ورودی‌ها را می‌دهد:
   window.EasySazPanel = { api, toast, failed, haptic, openBot, openDash, … } */
(function () {
  'use strict';

  const ES = window.EasySaz;
  const h = ES.h;
  const P = () => window.EasySazPanel;
  const tg = window.Telegram && window.Telegram.WebApp;
  const $ = id => document.getElementById(id);
  const faN = n => Number(n || 0).toLocaleString('fa-IR');
  const haptic = k => { try { tg.HapticFeedback.impactOccurred(k || 'light'); } catch (e) {} };
  const toast = (t, w) => P().toast(t, w);

  /* ---------------------------------------------------------------- آیکن‌ها */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const IC = {
    stop: 'M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z', back: 'M9 6l6 6-6 6', chl: 'M15 6l-6 6 6 6', x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', play: 'M8 5v14l11-7z',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12z', keyb: 'M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M7 14h10',
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5', var: 'M8 4c-2 0-2 2-2 4s-2 4-2 4 2 2 2 4 0 4 2 4M16 4c2 0 2 2 2 4s2 4 2 4-2 2-2 4 0 4-2 4',
    smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01', bot: 'M5 9h14v10H5zM12 5v4M9 13v.01M15 13v.01M9 16h6',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5v.01', btn: 'M4 8h16v8H4zM9 12h6', sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
    copy: 'M9 9h10v10H9zM5 15V5h10', move: 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    phone: 'M7 3h10v18H7zM11 18h2', share: 'M12 3v13M7 8l5-5 5 5M5 14v6h14v-6', star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z',
    bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', flow: 'M6 4h4v4H6zM14 16h4v4h-4zM8 8v4a2 2 0 0 0 2 2h6', ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
    check: 'M5 12l5 5 9-10', tg: 'M21 3L3 11l7 3 3 7 8-18zM10 14l4-4', key: 'M14 10a5 5 0 1 0-1.4 3.5L21 21M17 17l2-2M15 19l2-2',
    pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-3.5 3.6-6 7-6s6.2 2.5 7 6M16 3.5a4 4 0 0 1 0 7.5M18 15c2 .8 3.4 2.9 4 6', poll: 'M5 20V10M12 20V4M19 20v-7',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 0 1 5 .5c0 1.7-2.5 2-2.5 3.5M12 17v.01', inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
    undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', left: 'M19 12H5M11 6l-6 6 6 6', right: 'M5 12h14M13 6l6 6-6 6',
    pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', quote: 'M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6', code: 'M8 8l-4 4 4 4M16 8l4 4-4 4',
    calc: 'M6 3h12v18H6zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01', sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01', warn: 'M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1', list: 'M8 6h12M8 12h12M8 18h12M4 6v.01M4 12v.01M4 18v.01',
    send: 'M21 3L3 11l7 3 3 7 8-18zM10 14l4-4', power: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0', eyeoff: 'M3 3l18 18M6.6 6.6C3.9 8.3 2 12 2 12s3.6 6 10 6c1.9 0 3.5-.5 4.9-1.3M10.6 6.1A9.6 9.6 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.8M9.9 9.9a3 3 0 0 0 4.2 4.2',
    slash: 'M15 4L9 20', rocket: 'M5 15c-1 1-1.5 3.5-1.5 5.5 2 0 4.5-.5 5.5-1.5M9 15l-3-3c1.5-4 5-8 12-8 0 7-4 10.5-8 12l-3-3zM15 9v.01', tap: 'M9 11V5a2 2 0 0 1 4 0v5M13 10a2 2 0 0 1 4 0v1M17 11a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L5 14a2 2 0 0 1 3.3-2.2L9 13',
    split: 'M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6M18 3v4M6 17v4',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', dice: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
    form: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3', tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01', globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9z',
    cart: 'M3 4h2l2.5 11h11L21 7H6.2M9 20h.01M17 20h.01', bag: 'M5 8h14l-1 12H6zM9 8V7a3 3 0 0 1 6 0v1', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', refresh: 'M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4',
  };
  function ic(name, cls) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'ico' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', IC[name] || IC.sparkle);
    s.appendChild(p);
    return s;
  }
  function bt(cls, parts, fn, label) {
    const b = h('button', cls);
    b.type = 'button';
    (Array.isArray(parts) ? parts : [parts]).forEach(x => { if (x == null) return; b.append(typeof x === 'string' ? document.createTextNode(x) : x); });
    if (label) b.setAttribute('aria-label', label);
    if (fn) b.addEventListener('click', e => { haptic(); fn(e); });
    return b;
  }
  const txt = (tag, cls, t) => h(tag, cls, t);
  const uid = p => p + Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, 'x').padEnd(6, '0');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ---------------------------------------------------------------- ثابت‌ها */
  const STYLES = [['', 'پیش‌فرض'], ['primary', 'آبی'], ['success', 'سبز'], ['danger', 'قرمز']];
  const ACTS = [
    ['goto', 'chat', 'رفتن به پیام', 'پیام دیگری از ربات', 'brand'],
    ['url', 'link', 'باز کردن لینک', 'سایت، کانال، هر نشانی', 'tg'],
    ['copy', 'copy', 'کپی متن', 'کد تخفیف، شماره کارت', 'teal'],
    ['app', 'phone', 'باز کردن مینی‌اپ', 'مینی‌اپ خودت یا هر نشانی', 'rose'],
    ['share', 'share', 'فرستادن برای دوست', 'معرفی ربات در چت‌های دیگر', 'green'],
    ['pay', 'star', 'پرداخت با ستاره', 'فروش با Telegram Stars', 'gold'],
    ['alert', 'bell', 'پیام کوتاه بالای چت', 'اعلان یا پنجرهٔ هشدار', 'amber'],
    ['shop', 'bag', 'نمایش محصولات', 'کارت محصول، ورق‌زدن، سبد', 'green'],
    ['cart', 'cart', 'سبد خرید', 'سبد، کد تخفیف، ثبت سفارش', 'gold'],
    ['none', 'ban', 'غیرفعال', 'دیده می‌شود، کاری نمی‌کند', 'mute'],
  ];
  const KEY_ACTS = [
    ['text', 'type', 'فرستادن همین متن', 'و رفتن به یک پیام'],
    ['contact', 'phone', 'فرستادن شماره', 'شمارهٔ خود کاربر، با تأیید او'],
    ['location', 'pin', 'فرستادن موقعیت', 'موقعیت لحظه‌ای کاربر'],
    ['user', 'user', 'انتخاب کاربر', 'از مخاطب‌های کاربر'],
    ['chat', 'users', 'انتخاب گروه', 'گروه‌هایی که کاربر در آن است'],
    ['poll', 'poll', 'ساخت نظرسنجی', 'کاربر نظرسنجی می‌سازد'],
    ['app', 'layers', 'باز کردن مینی‌اپ', ''],
  ];
  IC.type = 'M5 6V5h14v1M12 5v14M9 19h6';
  const EFFECTS = ['🎉', '❤️', '👍', '🔥', '👎', '💩'];
  const BUILTINS = ['نام', 'نام کامل', 'یوزرنیم', 'شناسه', 'تاریخ امروز', 'ساعت'];
  const COMMON_EMOJI = '😀😂😍🥰😎🤩🙏👍👏🔥✨⭐💎🎉🎁❤️💙💚💛🧡💜✅❌⚠️📌📍📞📱💬📢📚📝📷🎓🛍💰💳⏰📅🚀🌱🌸☕🍕🎵🏆👋👇👉'.match(/\p{Extended_Pictographic}️?/gu) || [];

  /* ---------------------------------------------------------------- وضعیت */
  const R = {
    on: false, appId: null, d: null, doc: null, pub: null, emoji: [], tab: 'msgs',
    edit: null, saveT: 0, saving: false, again: false, sheets: [], sel: null,
  };
  const msgs = () => R.doc.msgs;
  const find = id => R.doc.msgs.find(m => m.id === id) || null;
  const varNames = () => R.doc.vars.map(v => v.name);

  function newMsg(name, extra) {
    return Object.assign({
      id: uid('m'), name: name || 'پیام تازه', text: '', media: null, kb: 'none', rows: [], keys: [],
      kbopt: { resize: true, once: false, persist: false, placeholder: '' },
      opts: { replace: true, typing: false, effect: '', preview: false, silent: false, protect: false, remove_kb: false },
      cmd: '', kw: [], then: '', wait: null, steps: [], group: '',
    }, extra || {});
  }
  function newBtn(text, act) { return { id: uid('b'), text: text || 'دکمه', style: '', icon: '', act: act || { type: 'goto', to: '' } }; }
  function newKey(text) { return { id: uid('k'), text: text || 'دکمه', style: '', icon: '', act: { type: 'text', to: '' } }; }
  function freshName(base) {
    let n = 1, name = base;
    while (msgs().some(m => m.name === name)) name = base + ' ' + faN(++n);
    return name;
  }

  /* ---------------------------------------------------------------- ذخیره */
  function changed(redraw) {
    clearTimeout(R.saveT);
    R.saveT = setTimeout(save, 700);
    drawPill();
    if (redraw) redraw();
  }
  async function save() {
    clearTimeout(R.saveT);
    if (!R.doc) return;
    if (R.saving) { R.again = true; return; }
    R.saving = true;
    try { await P().api('bot/save', { id: R.appId, doc: R.doc }); } catch (err) { P().failed(err); }
    R.saving = false;
    if (R.again) { R.again = false; save(); }
  }

  /* ---------------------------------------------------------------- تفاوت با نسخهٔ منتشرشده */
  function diffs() {
    const out = [];
    if (!R.pub) {
      // اولین انتشار: فهرست تک‌تک پیام‌ها لازم نیست
      const n = R.doc.msgs.length;
      return n ? [{ icon: 'rocket', title: 'اولین انتشار ربات', sub: `${faN(n)} پیام · ${faN(R.doc.vars.length)} متغیر · ${faN(R.doc.comps.length)} جزء`, revert: null }] : [];
    }
    const pub = R.pub;
    const pm = new Map(pub.msgs.map(m => [m.id, m]));
    R.doc.msgs.forEach(m => {
      const old = pm.get(m.id);
      if (!old) out.push({ icon: 'chat', title: `پیام «${m.name}»`, sub: 'تازه', revert: () => removeMsg(m.id) });
      else if (JSON.stringify(old) !== JSON.stringify(m)) out.push({ icon: 'chat', title: `پیام «${m.name}»`, sub: 'تغییر کرده', revert: () => { const i = R.doc.msgs.indexOf(m); R.doc.msgs[i] = clone(old); } });
    });
    pub.msgs.forEach(m => { if (!find(m.id)) out.push({ icon: 'trash', title: `پیام «${m.name}»`, sub: 'حذف شده', revert: () => R.doc.msgs.push(clone(m)) }); });
    if (JSON.stringify(pub.vars) !== JSON.stringify(R.doc.vars)) out.push({ icon: 'var', title: 'متغیرها', sub: `${faN(R.doc.vars.length)} متغیر`, revert: () => { R.doc.vars = clone(pub.vars); } });
    if (JSON.stringify(pub.comps) !== JSON.stringify(R.doc.comps)) out.push({ icon: 'layers', title: 'اجزای آماده', sub: `${faN(R.doc.comps.length)} جزء`, revert: null });
    if (pub.start !== R.doc.start || pub.fallback !== R.doc.fallback) out.push({ icon: 'play', title: 'شروع و «هر چیز دیگر»', sub: 'تغییر کرده', revert: () => { R.doc.start = pub.start || R.doc.start; R.doc.fallback = pub.fallback; } });
    return out;
  }

  /* ---------------------------------------------------------------- پیمایش مسیر */
  function targets(m) {
    const t = [];
    const add = id => { if (id && !t.includes(id) && find(id)) t.push(id); };
    (m.kb === 'inline' ? m.rows : []).forEach(r => r.forEach(b => { if (b.act.to) add(b.act.to); }));
    (m.kb === 'reply' ? m.keys : []).forEach(r => r.forEach(b => { if (b.act.to) add(b.act.to); }));
    add(m.then);
    if (m.wait) add(m.wait.to);
    stepTargets(m).forEach(add);
    return t;
  }
  /* اولین جایی که به این پیام می‌رسیم (برای «وقتی: …» بالای چت) */
  function incoming(id) {
    if (R.doc.start === id) return { icon: 'play', text: 'وقتی: /start' };
    const m0 = find(id);
    if (m0 && m0.cmd) return { icon: 'slash', text: 'وقتی: ' + m0.cmd };
    for (const m of msgs()) {
      for (const r of (m.kb === 'inline' ? m.rows : [])) for (const b of r) if (b.act.to === id) return { icon: 'btn', text: `دکمهٔ «${b.text}» در «${m.name}»` };
      for (const r of (m.kb === 'reply' ? m.keys : [])) for (const b of r) if (b.act.to === id) return { icon: 'keyb', text: `کیبورد «${b.text}» در «${m.name}»` };
      if (m.then === id) return { icon: 'chat', text: `بعد از «${m.name}»` };
      if (m.wait && m.wait.to === id) return { icon: 'chat', text: `بعد از جواب در «${m.name}»` };
      if (stepTargets(m).includes(id)) return { icon: 'split', text: `از کار «${m.name}»` };
    }
    if (R.doc.fallback === id) return { icon: 'help', text: 'وقتی: هر پیام نامفهوم' };
    if (m0 && m0.kw && m0.kw.length) return { icon: 'chat', text: 'وقتی: ' + m0.kw.join('، ') };
    return null;
  }
  function msgSummary(m) {
    const parts = [];
    if (m.media) parts.push(m.media.type === 'photo' ? 'عکس' : 'ویدیو');
    const nb = (m.kb === 'inline' ? m.rows : m.kb === 'reply' ? m.keys : []).reduce((n, r) => n + r.length, 0);
    if (nb) parts.push(`${faN(nb)} ${m.kb === 'reply' ? 'دکمهٔ کیبورد' : 'دکمه'}`);
    if (m.wait) parts.push(m.wait.kind === 'support' ? 'پشتیبانی' : `جواب ← {${m.wait.var}}`);
    if (m.cmd) parts.push(m.cmd);
    if ((m.steps || []).length) parts.push(`${faN(m.steps.length)} کار`);
    if (!parts.length) parts.push(plain(m.text).slice(0, 34) || 'خالی');
    return parts.join(' · ');
  }
  function plain(html) {
    const d = document.createElement('div');
    d.innerHTML = String(html || '').replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, '$1');
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* ================================================================ پوسته */
  function root() { return $('bot'); }

  async function open(appId, tab, opts) {
    const panel = P();
    R.appId = Number(appId);
    const wantAI = tab === 'ai';
    R.tab = wantAI ? 'msgs' : (tab || 'msgs');
    R.edit = null;
    R.ai = null;
    R.sheets = [];
    panel.show('bot');
    R.on = true;
    const el = root();
    el.textContent = '';
    el.appendChild(h('div', 'bk-load'));
    try {
      const d = await panel.api('bot?id=' + encodeURIComponent(R.appId));
      R.d = d;
      R.doc = d.doc;
      R.pub = d.published ? clone(d.published) : null;
      R.emoji = d.emoji || [];
      if (d.fresh) save();
      draw();
      if (wantAI) openAI(opts);
    } catch (err) {
      panel.failed(err);
      if (opts && opts.fromHome) { R.on = false; panel.home(); } else panel.openDash(R.appId);
    }
  }
  async function reload() {
    if (!R.on) return;
    try {
      const d = await P().api('bot?id=' + encodeURIComponent(R.appId));
      R.d = d;
      R.emoji = d.emoji || [];
      R.pub = d.published ? clone(d.published) : null;
      if (!R.edit && !R.sheets.length) draw();
    } catch (e) {}
  }
  async function leave(toHome) {
    await save();
    if (R.ai) { clearTimeout(R.ai.pollT); R.ai.on = false; }
    R.on = false;
    R.edit = null;
    closeAllSheets();
    if (toHome === true) P().home(); else P().openDash(R.appId);
  }
  /* برگشت تلگرام: برگه، ویرایشگر، بعد داشبورد مینی‌اپ */
  function back() {
    if (R.sheets.length) { popSheet(); return true; }
    if (R.ai && R.ai.on) { closeAI(); return true; }
    if (R.edit) { closeEditor(); return true; }
    leave();
    return true;
  }
  function needBack() { return R.on; }

  function draw() {
    const el = root();
    el.textContent = '';
    el.appendChild(topBar());
    if (!R.d.bot.connected) el.appendChild(connectBanner());
    const body = h('main', 'bk-body');
    el.appendChild(body);
    ({ msgs: drawMsgs, parts: drawParts, data: drawData, vars: drawVars, emoji: drawEmoji, bot: drawBot })[R.tab](body);
    el.appendChild(navBar());
    if (R.edit) drawEditor();
  }

  function avatar(size) {
    const a = h('span', 'bk-av');
    a.textContent = ((R.d.bot.name || R.d.app.name || 'ر').trim()[0] || 'ر');
    if (size) a.style.setProperty('--s', size + 'px');
    return a;
  }
  function pubPill() {
    const n = R.doc ? diffs().length : 0;
    const p = bt('bk-pub' + (n ? ' on' : ''), [h('i', 'dot'), n ? `انتشار ${faN(n)}` : (R.d.bot.live ? 'منتشر شده' : 'انتشار')], publishSheet);
    p.id = 'bk-pub';
    return p;
  }
  function drawPill() {
    const old = $('bk-pub');
    if (old) old.replaceWith(pubPill());
    const old2 = $('bk-pub-ed');
    if (old2) { const n = pubPill(); n.id = 'bk-pub-ed'; old2.replaceWith(n); }
  }
  function testBtn(from) {
    return bt('bk-test', [ic('play'), 'تست'], () => testSheet(from));
  }
  function topBar() {
    const top = h('header', 'bk-top');
    top.appendChild(bt('bk-round', ic('back'), leave, 'برگشت'));
    const id = h('div', 'bk-id');
    const t = h('span', 'bk-id-t');
    t.append(h('b', '', R.d.bot.name || R.d.app.name));
    const sub = h('span', 'bk-id-s');
    if (R.d.bot.username) { const b = h('bdi', '', '@' + R.d.bot.username); b.dir = 'ltr'; sub.appendChild(b); } else sub.textContent = 'ربات وصل نیست';
    t.appendChild(sub);
    id.append(avatar(38), t);
    top.append(id, pubPill(), testBtn(''));
    return top;
  }
  function connectBanner() {
    const b = bt('bk-banner', [ic('bot'), h('span', 'grow', 'ربات هنوز وصل نیست؛ بساز یا وصل کن تا تست کنی'), ic('chl')], () => { R.tab = 'bot'; draw(); });
    return b;
  }
  const TABS = [['msgs', 'chat', 'پیام‌ها'], ['parts', 'layers', 'اجزا'], ['data', 'grid', 'داده‌ها'], ['vars', 'var', 'متغیرها'], ['bot', 'bot', 'ربات']];
  function navBar() {
    const n = h('nav', 'bk-nav');
    TABS.forEach(([k, i, t]) => {
      const b = bt('bk-nav-i' + (R.tab === k || (k === 'bot' && R.tab === 'emoji') ? ' on' : ''), [h('span', 'bk-nav-ic'), t], () => { R.tab = k; draw(); window.scrollTo(0, 0); });
      b.querySelector('.bk-nav-ic').appendChild(ic(i));
      n.appendChild(b);
    });
    return n;
  }
  function secT(parent, t, end) {
    const s = h('div', 'bk-sec');
    s.appendChild(h('b', 'grow', t));
    if (end) s.appendChild(end);
    parent.appendChild(s);
    return s;
  }
  function fab(label, fn) {
    return bt('bk-fab', [ic('plus'), label], fn);
  }

  /* ================================================================ تب پیام‌ها: مسیر ربات */
  function drawMsgs(body) {
    body.appendChild(aiTile());
    const st = h('div', 'bk-stats');
    [[R.d.stats.users, 'کاربر'], [R.d.stats.today, 'امروز'], [msgs().length, 'پیام']].forEach(([v, t]) => {
      const c = h('div', 'bk-stat');
      c.append(h('b', '', faN(v)), h('span', '', t));
      st.appendChild(c);
    });
    body.appendChild(st);
    secT(body, 'مسیر ربات');
    const list = h('div', 'bk-tree');
    const seen = new Set();
    const seenComp = new Set();
    const walk = (id, lv) => {
      const m = find(id);
      if (!m || seen.has(id)) return;
      seen.add(id);
      if (m.group) {
        if (seenComp.has(m.group)) return;
        seenComp.add(m.group);
        const comp = R.doc.comps.find(c => c.id === m.group);
        list.appendChild(groupRow(comp, lv));
        msgs().filter(x => x.group === m.group).forEach(x => seen.add(x.id));
        msgs().filter(x => x.group === m.group).forEach(x => targets(x).forEach(t => { if (!find(t).group || find(t).group !== m.group) walk(t, lv + 1); }));
        return;
      }
      list.appendChild(treeRow(m, lv));
      targets(m).forEach(t => walk(t, lv + 1));
    };
    walk(R.doc.start, 0);
    msgs().filter(m => m.cmd || m.kw.length || R.doc.fallback === m.id).forEach(m => walk(m.id, 0));
    body.appendChild(list);
    const orphans = msgs().filter(m => !seen.has(m.id));
    if (orphans.length) {
      secT(body, 'بدون مسیر', h('span', 'bk-sec-s', 'هیچ دکمه‌ای به این‌ها نمی‌رسد'));
      const ol = h('div', 'bk-tree');
      const doneG = new Set();
      orphans.forEach(m => {
        if (m.group) { if (doneG.has(m.group)) return; doneG.add(m.group); ol.appendChild(groupRow(R.doc.comps.find(c => c.id === m.group), 0)); return; }
        ol.appendChild(treeRow(m, 0));
      });
      body.appendChild(ol);
    }
    body.appendChild(fab('پیام تازه', () => {
      const m = newMsg(freshName('پیام تازه'));
      R.doc.msgs.push(m);
      changed();
      openEditor(m.id);
    }));
  }
  function kindIcon(m) {
    if (m.wait && m.wait.kind === 'support') return ['inbox', 'teal'];
    if (m.wait) return ['help', 'teal'];
    if (m.kb === 'reply') return ['keyb', 'amber'];
    if (m.media) return ['image', 'brand'];
    return ['chat', 'brand'];
  }
  function treeRow(m, lv) {
    const [i, c] = kindIcon(m);
    const row = bt('bk-row' + (R.doc.start === m.id ? ' start' : ''), [], () => openEditor(m.id));
    row.style.setProperty('--lv', Math.min(lv, 5));
    const tile = h('span', 'bk-tile ' + c);
    tile.appendChild(ic(i));
    const tx = h('span', 'bk-row-t');
    tx.append(h('b', '', m.name), h('span', '', msgSummary(m)));
    row.append(tile, tx);
    if (R.doc.start === m.id) row.appendChild(h('span', 'bk-chip brand', 'شروع'));
    else if (R.doc.fallback === m.id) row.appendChild(h('span', 'bk-chip', 'هر چیز دیگر'));
    row.appendChild(ic('chl', 'bk-row-go'));
    return row;
  }
  function groupRow(comp, lv) {
    const g = h('div', 'bk-group');
    g.style.setProperty('--lv', Math.min(lv, 5));
    if (!comp) return g;
    const meta = COMPS[comp.type];
    const head = h('div', 'bk-group-h');
    const tile = h('span', 'bk-tile teal');
    tile.appendChild(ic(meta.icon));
    const tx = h('span', 'bk-row-t');
    const items = msgs().filter(m => m.group === comp.id);
    tx.append(h('b', '', comp.title || meta.title), h('span', '', `جزء آماده · ${faN(items.length)} پیام`));
    head.append(tile, tx);
    g.appendChild(head);
    const sub = h('div', 'bk-group-l');
    items.slice(0, 6).forEach(m => sub.appendChild(bt('bk-group-m', [ic('chat'), m.name], () => openEditor(m.id))));
    g.appendChild(sub);
    const acts = h('div', 'bk-group-a');
    acts.append(bt('bk-mini', [ic('sliders'), 'تنظیمات جزء'], () => compSheet(comp)), bt('bk-mini', [ic('split'), 'باز کردن'], () => unpackComp(comp)));
    g.appendChild(acts);
    return g;
  }

  /* ================================================================ ویرایشگر چتی */
  function openEditor(id) {
    if (!find(id)) return;
    R.edit = id;
    closeAllSheets();
    drawEditor();
  }
  function closeEditor() {
    R.edit = null;
    const ed = document.querySelector('#bot .bk-ed');
    if (ed) { ed.classList.add('out'); setTimeout(() => ed.remove(), 220); }
    detachVV();
    const body = document.querySelector('#bot .bk-body');
    if (body) { const b2 = h('main', 'bk-body'); body.replaceWith(b2); ({ msgs: drawMsgs, parts: drawParts, data: drawData, vars: drawVars, emoji: drawEmoji, bot: drawBot })[R.tab](b2); }
    drawPill();
  }
  function drawEditor() {
    const m = find(R.edit);
    if (!m) { closeEditor(); return; }
    let ed = document.querySelector('#bot .bk-ed');
    const keepScroll = ed ? ed.querySelector('.bk-chat').scrollTop : 0;
    const fresh = !ed;
    if (!ed) { ed = h('section', 'bk-ed'); root().appendChild(ed); }
    ed.textContent = '';
    // نوار بالا
    const top = h('header', 'bk-top');
    top.appendChild(bt('bk-round', ic('back'), closeEditor, 'برگشت'));
    const id = bt('bk-id ed', [], () => renameSheet(m));
    const t = h('span', 'bk-id-t');
    const inc = incoming(m.id);
    t.append(h('b', '', m.name), h('span', 'bk-id-s', inc ? inc.text : 'هنوز به این پیام نمی‌رسیم'));
    id.appendChild(t);
    const pp = pubPill();
    pp.id = 'bk-pub-ed';
    top.append(id, pp, testBtn(m.id));
    ed.appendChild(top);

    const chat = h('div', 'bk-chat');
    ed.appendChild(chat);
    if (inc) { const c = h('span', 'bk-trig'); c.append(ic(inc.icon), document.createTextNode(inc.text)); chat.appendChild(c); }
    if ((m.steps || []).length) chat.appendChild(stepsRail(m));
    chat.appendChild(bubble(m));
    if (m.kb === 'inline') chat.appendChild(inlineRows(m));
    if (m.wait && m.wait.kind === 'var') chat.appendChild(askCard(m));
    else if (m.wait) {
      const w = bt('bk-wait', [ic(m.wait.kind === 'support' ? 'inbox' : 'help'),
        m.wait.kind === 'support' ? 'پیام بعدی کاربر به پشتیبانی (تو) می‌رسد' : `جواب کاربر در {${m.wait.var}} ذخیره می‌شود`], () => msgSheet(m));
      chat.appendChild(w);
    }
    // پیام بعدی همان مرحله
    if (m.then && find(m.then)) {
      const n = find(m.then);
      const nx = bt('bk-next', [h('span', 'bk-next-k', 'بعدش'), h('b', '', n.name), h('span', 'bk-next-s', msgSummary(n)), ic('chl')], () => openEditor(n.id));
      chat.appendChild(nx);
    } else {
      chat.appendChild(bt('bk-more-msg', [ic('plus'), 'پیام دوم در همین مرحله'], () => {
        const n = newMsg(freshName(m.name + ' (ادامه)'));
        R.doc.msgs.push(n);
        m.then = n.id;
        changed();
        openEditor(n.id);
      }));
    }
    if (m.kb === 'reply') ed.appendChild(replyPanel(m));
    ed.appendChild(dock(m));
    ed.appendChild(fmtBar());
    if (fresh) ed.classList.add('in');
    chat.scrollTop = keepScroll;
    attachVV();
  }

  /* ---------- حباب پیام و متن قابل‌ویرایش ---------- */
  function bubble(m) {
    const b = h('div', 'bk-bub');
    if (m.media) {
      const md = bt('bk-media', [], () => mediaSheet(m));
      if (m.media.type === 'photo') { const im = h('img'); im.src = m.media.url; im.alt = ''; md.appendChild(im); }
      else { md.append(ic('play'), h('span', '', 'ویدیو')); md.classList.add('vid'); }
      b.appendChild(md);
    }
    const t = h('div', 'bk-text');
    t.contentEditable = 'true';
    t.dir = 'auto';
    t.dataset.ph = m.media ? 'زیرنویس عکس…' : 'متن پیام را بنویس…';
    fillEditable(t, m.text);
    t.addEventListener('input', e => {
      if (e.inputType === 'insertText' && e.data === '{') { removeTypedBrace(); saveSel(); varPicker(name => insertVar(name)); }
      m.text = serialize(t);
      changed();
    });
    t.addEventListener('focus', syncTyping);
    t.addEventListener('blur', () => { saveSel(); setTimeout(syncTyping, 120); });
    t.addEventListener('keyup', saveSel);
    t.addEventListener('mouseup', saveSel);
    t.addEventListener('paste', e => {
      e.preventDefault();
      const s = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, s);
    });
    b.appendChild(t);
    const time = h('span', 'bk-time', '۹:۴۱');
    b.appendChild(time);
    return b;
  }
  function removeTypedBrace() {
    const sel = getSelection();
    if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    const n = r.startContainer;
    if (n.nodeType === 3 && r.startOffset > 0 && n.data[r.startOffset - 1] === '{') {
      n.deleteData(r.startOffset - 1, 1);
    }
  }
  function curText() { return document.querySelector('#bot .bk-ed .bk-text'); }
  /* نوار قالب‌بندی فقط وقتی دیده می‌شود که مکان‌نما داخل متن پیام است */
  function syncTyping() {
    const ed = document.querySelector('#bot .bk-ed');
    if (!ed) return;
    const t = curText();
    const sel = getSelection();
    const on = !!(t && document.activeElement === t && sel.rangeCount && t.contains(sel.anchorNode));
    ed.classList.toggle('typing', on && !R.sheets.length);
  }
  document.addEventListener('selectionchange', () => { if (R.edit) syncTyping(); });
  function saveSel() {
    const t = curText();
    const sel = getSelection();
    if (t && sel.rangeCount && t.contains(sel.getRangeAt(0).commonAncestorContainer)) R.sel = sel.getRangeAt(0).cloneRange();
  }
  function restoreSel() {
    const t = curText();
    if (!t) return null;
    t.focus();
    const sel = getSelection();
    sel.removeAllRanges();
    let r = R.sel;
    if (!r || !t.contains(r.commonAncestorContainer)) { r = document.createRange(); r.selectNodeContents(t); r.collapse(false); }
    sel.addRange(r);
    return r;
  }
  function chipVar(name) {
    const c = h('span', 'bk-var', '{' + name + '}');
    c.contentEditable = 'false';
    c.dataset.var = name;
    return c;
  }
  function chipEmoji(id, alt) {
    const c = h('span', 'bk-pe', alt || '⭐');
    c.contentEditable = 'false';
    c.dataset.eid = id;
    return c;
  }
  function insertNodeAtCaret(node) {
    const r = restoreSel();
    if (!r) return;
    r.deleteContents();
    r.insertNode(node);
    const sp = document.createTextNode('‌');
    node.after(sp);
    const nr = document.createRange();
    nr.setStartAfter(sp);
    nr.collapse(true);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(nr);
    R.sel = nr.cloneRange();
    const t = curText();
    const m = find(R.edit);
    if (t && m) { m.text = serialize(t); changed(); }
  }
  function insertVar(name) { insertNodeAtCaret(chipVar(name)); }
  function insertEmoji(e) { insertNodeAtCaret(e.id ? chipEmoji(e.id, e.alt) : document.createTextNode(e.alt)); }

  /* HTML تلگرام ↔ DOM ویرایشگر */
  function fillEditable(el, html) {
    el.textContent = '';
    const doc = new DOMParser().parseFromString('<body>' + String(html || '').replace(/\n/g, '<br>') + '</body>', 'text/html');
    const conv = (src, dst) => {
      src.childNodes.forEach(n => {
        if (n.nodeType === 3) {
          // {متغیر} داخل متن ← تراشه
          const parts = n.data.split(/(\{[^{}<>\n]{1,24}\})/);
          parts.forEach(p => {
            const mm = /^\{([^{}]+)\}$/.exec(p);
            if (mm) dst.appendChild(chipVar(mm[1].trim()));
            else if (p) dst.appendChild(document.createTextNode(p));
          });
          return;
        }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        let out = null;
        if (tag === 'br') { dst.appendChild(h('br')); return; }
        if (tag === 'tg-emoji') { dst.appendChild(chipEmoji(n.getAttribute('emoji-id'), n.textContent)); return; }
        if (['b', 'i', 'u', 's', 'code', 'blockquote'].includes(tag)) out = h(tag);
        else if (tag === 'tg-spoiler') out = h('span', 'sp');
        else if (tag === 'a') { out = h('a'); const href = n.getAttribute('href') || ''; if (/^(https?|tg):/.test(href)) out.setAttribute('href', href); }
        if (!out) { conv(n, dst); return; }
        conv(n, out);
        dst.appendChild(out);
      });
    };
    conv(doc.body, el);
  }
  function serialize(el) {
    const walk = node => {
      let s = '';
      node.childNodes.forEach((n, i) => {
        if (n.nodeType === 3) { s += esc(n.data.replace(/‌/g, '')); return; }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        if (n.dataset && n.dataset.var) { s += '{' + n.dataset.var + '}'; return; }
        if (n.dataset && n.dataset.eid) { s += `<tg-emoji emoji-id="${esc(n.dataset.eid)}">${esc(n.textContent)}</tg-emoji>`; return; }
        if (tag === 'br') { s += '\n'; return; }
        const inner = walk(n);
        if (tag === 'div' || tag === 'p') { s += (s && !s.endsWith('\n') ? '\n' : '') + inner; return; }
        const map = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 's', strike: 's', del: 's', code: 'code', blockquote: 'blockquote' };
        if (map[tag]) { s += inner ? `<${map[tag]}>${inner}</${map[tag]}>` : ''; return; }
        if (tag === 'span' && n.classList.contains('sp')) { s += inner ? `<tg-spoiler>${inner}</tg-spoiler>` : ''; return; }
        if (tag === 'a' && n.getAttribute('href')) { s += `<a href="${esc(n.getAttribute('href'))}">${inner}</a>`; return; }
        if (tag === 'span' && n.style && /bold|[6-9]00/.test(n.style.fontWeight)) { s += `<b>${inner}</b>`; return; }
        s += inner;
      });
      return s;
    };
    return walk(el).replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  }

  /* ---------- نوار قالب‌بندی (وقتی متن در حال نوشتن است) ---------- */
  function fmtBar() {
    const bar = h('div', 'bk-fmt');
    const cmd = (label, fn, cls) => {
      const b = bt('bk-fmt-b' + (cls ? ' ' + cls : ''), label, null);
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => { haptic(); fn(); const t = curText(); const m = find(R.edit); if (t && m) { m.text = serialize(t); changed(); } });
      return b;
    };
    const exec = c => () => { try { document.execCommand('styleWithCSS', false, false); } catch (e) {} document.execCommand(c, false, null); };
    bar.append(
      cmd(h('b', '', 'B'), exec('bold')), cmd(h('i', 'it', 'I'), exec('italic')), cmd(h('u', '', 'U'), exec('underline')),
      cmd(h('s', '', 'S'), exec('strikeThrough')), cmd(ic('eyeoff'), () => wrapSel('span', 'sp')), cmd(ic('quote'), () => wrapSel('blockquote')),
      cmd(ic('code'), () => wrapSel('code')), cmd(ic('link'), () => { saveSel(); linkSheet(); }),
      cmd(h('span', 'br', '{ }'), () => { saveSel(); varPicker(insertVar); }, 'brand'), cmd(ic('smile'), () => { saveSel(); emojiPicker(insertEmoji); }),
    );
    return bar;
  }
  function wrapSel(tag, cls) {
    const t = curText();
    const sel = getSelection();
    if (!t || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if (r.collapsed || !t.contains(r.commonAncestorContainer)) { toast('اول بخشی از متن را انتخاب کن', true); return; }
    const w = h(tag, cls);
    w.appendChild(r.extractContents());
    r.insertNode(w);
    sel.removeAllRanges();
    const nr = document.createRange();
    nr.selectNodeContents(w);
    sel.addRange(nr);
  }
  /* نوار قالب‌بندی بالای کیبورد گوشی */
  let vvOn = false;
  function onVV() {
    const vv = window.visualViewport;
    const ed = document.querySelector('#bot .bk-ed');
    if (!vv || !ed) return;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    ed.style.setProperty('--kb', kb + 'px');
  }
  function attachVV() { if (vvOn || !window.visualViewport) return; vvOn = true; visualViewport.addEventListener('resize', onVV); visualViewport.addEventListener('scroll', onVV); onVV(); }
  function detachVV() { if (!vvOn) return; vvOn = false; visualViewport.removeEventListener('resize', onVV); visualViewport.removeEventListener('scroll', onVV); }

  /* ---------- دکمه‌های شیشه‌ای زیر پیام ---------- */
  function keyEl(b, cls, onTap) {
    const k = bt('bk-key ' + (b.style || 'def') + (cls ? ' ' + cls : ''), [], onTap);
    const ico = b.icon && R.emoji.find(e => e.id === b.icon);
    if (ico) k.appendChild(h('span', 'bk-key-ic', ico.alt));
    k.appendChild(h('span', 'bk-key-t', b.text));
    const a = b.act || {};
    const mark = { url: 'link', copy: 'copy', app: 'phone', share: 'share', pay: 'star', alert: 'bell', none: 'ban', contact: 'phone', location: 'pin', user: 'user', chat: 'users', poll: 'poll', shop: 'bag', cart: 'cart' }[a.type];
    if (mark) k.appendChild(ic(mark, 'bk-key-m'));
    return k;
  }
  function inlineRows(m) {
    const wrap = h('div', 'bk-keys');
    m.rows.forEach((row, ri) => {
      const r = h('div', 'bk-krow');
      row.forEach(b => r.appendChild(keyEl(b, '', () => buttonSheet(m, b))));
      if (row.length < 8) r.appendChild(bt('bk-slot', ic('plus'), () => { const nb = newBtn('دکمه'); row.push(nb); changed(); drawEditor(); buttonSheet(m, nb); }, 'دکمه در همین ردیف'));
      wrap.appendChild(r);
    });
    if (m.rows.length < 12) wrap.appendChild(bt('bk-slot wide', [ic('plus'), 'ردیف دکمه'], () => { const nb = newBtn('دکمه'); m.rows.push([nb]); changed(); drawEditor(); buttonSheet(m, nb); }));
    return wrap;
  }
  function replyPanel(m) {
    const p = h('div', 'bk-reply');
    const head = h('div', 'bk-reply-h');
    head.append(h('span', 'bk-reply-tag', 'کیبورد ربات'), h('span', 'grow', m.kbopt.placeholder ? `راهنمای کادر: «${m.kbopt.placeholder}»` : ''),
      bt('bk-mini flat', [ic('sliders'), 'تنظیمات'], () => kbOptsSheet(m)));
    p.appendChild(head);
    m.keys.forEach(row => {
      const r = h('div', 'bk-krow');
      row.forEach(b => r.appendChild(keyEl(b, 'rk', () => keySheet(m, b))));
      if (row.length < 8) r.appendChild(bt('bk-slot dark', ic('plus'), () => { const nb = newKey('دکمه'); row.push(nb); changed(); drawEditor(); keySheet(m, nb); }));
      p.appendChild(r);
    });
    if (m.keys.length < 12) p.appendChild(bt('bk-slot dark wide', [ic('plus'), 'ردیف تازه'], () => { const nb = newKey('دکمه'); m.keys.push([nb]); changed(); drawEditor(); keySheet(m, nb); }));
    return p;
  }
  function dock(m) {
    const d = h('nav', 'bk-dock');
    const tool = (i, t, fn) => { const b = bt('bk-dock-b', [h('span', 'bk-dock-ic'), t], fn); b.querySelector('.bk-dock-ic').appendChild(ic(i)); return b; };
    d.append(
      tool('type', 'متن', () => { const t = curText(); if (t) { t.focus(); const r = document.createRange(); r.selectNodeContents(t); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }),
      tool('btn', 'دکمه', () => addButton(m)),
      tool('keyb', 'کیبورد', () => kindSheet(m, true)),
      tool('flow', 'کار', () => stepsGrid(m)),
      tool('sliders', 'بیشتر', () => msgSheet(m)),
    );
    return d;
  }
  function addButton(m) {
    if (m.kb === 'none') { kindSheet(m, false); return; }
    if (m.kb === 'inline') { const nb = newBtn('دکمه'); m.rows.push([nb]); changed(); drawEditor(); buttonSheet(m, nb); return; }
    const nb = newKey('دکمه');
    m.keys.push([nb]);
    changed();
    drawEditor();
    keySheet(m, nb);
  }

  /* ================================================================ برگه‌ها (پشته) */
  function sheetHost() {
    let s = $('bk-sheets');
    if (!s) {
      s = h('div', 'bk-sheets');
      s.id = 'bk-sheets';
      const scrim = h('div', 'bk-scrim');
      scrim.addEventListener('click', popSheet);
      s.appendChild(scrim);
      document.body.appendChild(s);
    }
    return s;
  }
  /* build(el, ctx) — ctx.redraw() برگه را از نو می‌سازد */
  function sheet(title, sub, build, opts) {
    opts = opts || {};
    const host = sheetHost();
    const el = h('div', 'bk-sheet' + (opts.tall ? ' tall' : ''));
    el.setAttribute('role', 'dialog');
    const ctx = { el, redraw: null, onClose: opts.onClose || null };
    const render = () => {
      const sc = el.querySelector('.bk-sh-body');
      const keep = sc ? sc.scrollTop : 0;
      el.textContent = '';
      el.appendChild(h('i', 'bk-grip'));
      const hd = h('div', 'bk-sh-h');
      if (R.sheets.length && !opts.root) hd.appendChild(bt('bk-round sm', ic('back'), popSheet, 'برگشت'));
      const tt = h('div', 'grow');
      tt.appendChild(h('b', '', typeof title === 'function' ? title() : title));
      if (sub) tt.appendChild(h('span', '', typeof sub === 'function' ? sub() : sub));
      hd.appendChild(tt);
      if (opts.end) hd.appendChild(opts.end());
      hd.appendChild(bt('bk-round sm', ic('x'), closeAllSheets, 'بستن'));
      el.appendChild(hd);
      const body = h('div', 'bk-sh-body');
      el.appendChild(body);
      build(body, ctx);
      body.scrollTop = keep;
    };
    ctx.redraw = render;
    render();
    R.sheets.forEach(s => s.el.classList.add('under'));
    host.appendChild(el);
    host.classList.add('on');
    R.sheets.push(ctx);
    requestAnimationFrame(() => el.classList.add('on'));
    if (tg && tg.BackButton) try { tg.BackButton.show(); } catch (e) {}
    return ctx;
  }
  function popSheet() {
    const ctx = R.sheets.pop();
    if (!ctx) return;
    ctx.el.classList.remove('on');
    setTimeout(() => ctx.el.remove(), 230);
    if (ctx.onClose) ctx.onClose();
    const top = R.sheets[R.sheets.length - 1];
    if (top) { top.el.classList.remove('under'); top.redraw(); } else sheetHost().classList.remove('on');
    if (!R.sheets.length && R.edit) drawEditor();
  }
  function closeAllSheets() {
    const had = R.sheets.length;
    while (R.sheets.length) {
      const ctx = R.sheets.pop();
      ctx.el.remove();
      if (ctx.onClose) ctx.onClose();
    }
    const host = $('bk-sheets');
    if (host) host.classList.remove('on');
    if (had && R.edit) drawEditor();
  }

  /* ---------- اجزای فرم برگه ---------- */
  function field(parent, label, input, hint) {
    const f = h('label', 'bk-f');
    if (label) f.appendChild(h('span', 'bk-f-l', label));
    f.appendChild(input);
    if (hint) f.appendChild(h('span', 'bk-f-h', hint));
    parent.appendChild(f);
    return f;
  }
  function input(value, onInput, opts) {
    opts = opts || {};
    const i = h(opts.area ? 'textarea' : 'input', 'bk-in' + (opts.ltr ? ' ltr' : ''));
    if (!opts.area) i.type = opts.type || 'text';
    i.value = value == null ? '' : value;
    if (opts.ph) i.placeholder = opts.ph;
    if (opts.max) i.maxLength = opts.max;
    if (opts.ltr) i.dir = 'ltr';
    if (opts.mode) i.inputMode = opts.mode;
    i.addEventListener('input', () => onInput(i.value));
    return i;
  }
  function seg(items, on, onPick) {
    const s = h('div', 'bk-seg');
    items.forEach(([k, t]) => s.appendChild(bt('bk-seg-b' + (k === on ? ' on' : ''), t, () => onPick(k))));
    return s;
  }
  function toggle(parent, title, sub, on, onChange) {
    const row = h('div', 'bk-tg');
    const tx = h('span', 'grow');
    tx.appendChild(h('b', '', title));
    if (sub) tx.appendChild(h('span', '', sub));
    const sw = bt('bk-sw' + (on ? ' on' : ''), h('i'), () => { const v = !sw.classList.contains('on'); sw.classList.toggle('on', v); onChange(v); });
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    row.append(tx, sw);
    parent.appendChild(row);
    return row;
  }
  function optRow(parent, icon, title, sub, end, fn, cls) {
    const r = bt('bk-opt' + (cls ? ' ' + cls : ''), [], fn);
    const tl = h('span', 'bk-tile ' + ((cls || '').includes('danger') ? 'red' : 'brand'));
    tl.appendChild(ic(icon));
    const tx = h('span', 'grow');
    tx.appendChild(h('b', '', title));
    if (sub) tx.appendChild(h('span', '', sub));
    r.append(tl, tx);
    if (end) r.appendChild(typeof end === 'string' ? h('span', 'bk-opt-e', end) : end);
    parent.appendChild(r);
    return r;
  }
  function primary(parent, label, fn, cls, icon) {
    const b = bt('bk-btn ' + (cls || 'p'), [icon ? ic(icon) : null, label], fn);
    parent.appendChild(b);
    return b;
  }
  function label(parent, t, end) {
    const l = h('div', 'bk-lbl');
    l.appendChild(h('b', 'grow', t));
    if (end) l.appendChild(typeof end === 'string' ? h('span', '', end) : end);
    parent.appendChild(l);
    return l;
  }
  function note(parent, t, kind) {
    const n = h('div', 'bk-note ' + (kind || ''));
    n.append(ic(kind === 'ok' ? 'check' : kind === 'warn' ? 'warn' : 'info'), h('span', '', t));
    parent.appendChild(n);
    return n;
  }

  /* ---------- انتخاب پیام ---------- */
  function msgPick(title, current, onPick, opts) {
    opts = opts || {};
    sheet(title, opts.sub || 'به کدام پیام برود؟', body => {
      if (opts.allowNone) optRow(body, 'ban', 'هیچ', '', current ? null : ic('check'), () => { onPick(''); popSheet(); });
      msgs().forEach(m => {
        if (opts.exclude === m.id) return;
        const [i] = kindIcon(m);
        optRow(body, i, m.name, msgSummary(m), m.id === current ? ic('check') : null, () => { onPick(m.id); popSheet(); }, m.id === current ? 'on' : '');
      });
      primary(body, 'پیام تازه بساز', () => {
        const n = newMsg(freshName(opts.newName || 'پیام تازه'));
        R.doc.msgs.push(n);
        onPick(n.id);
        changed();
        popSheet();
        toast(`«${n.name}» ساخته شد؛ بعداً متنش را بنویس`);
      }, 's', 'plus');
    });
  }
  function varPick(title, current, onPick, opts) {
    opts = opts || {};
    sheet(title, opts.sub || '', body => {
      const list = R.doc.vars.filter(v => !v.formula && (!opts.type || v.type === opts.type));
      if (opts.allowNone) optRow(body, 'ban', 'ذخیره نکن', '', current ? null : ic('check'), () => { onPick(''); popSheet(); });
      list.forEach(v => optRow(body, 'var', '{' + v.name + '}', varSub(v), v.name === current ? ic('check') : null, () => { onPick(v.name); popSheet(); }, v.name === current ? 'on' : ''));
      primary(body, 'متغیر تازه', () => varSheet(null, v => { onPick(v.name); popSheet(); }), 's', 'plus');
    });
  }

  /* ---------- انتخاب متغیر برای متن ---------- */
  function sampleOf(name) {
    const me = (P().me && P().me()) || {};
    const fn = (me.user && me.user.first_name) || 'سارا';
    if (name === 'نام' || name === 'نام کامل') return fn;
    if (name === 'یوزرنیم') return '@…';
    if (name === 'شناسه') return me.user ? String(me.user.id) : '۱۲۳';
    if (name === 'تاریخ امروز') return new Date().toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });
    if (name === 'ساعت') return new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const v = R.doc.vars.find(x => x.name === name);
    if (!v) return '';
    if (v.formula) { try { return fmtNum(evalFormula(v.formula, sampleNum)); } catch (e) { return '…'; } }
    if (v.type === 'number') return fmtNum(toNum(v.init));
    return v.init || '—';
  }
  function sampleNum(name) {
    const v = R.doc.vars.find(x => x.name === name);
    if (v && v.formula) return evalFormula(v.formula, sampleNum);
    return toNum(v ? v.init : 0);
  }
  function varPicker(onPick) {
    sheet('درج متغیر', 'مقدار برای خودت', body => {
      R.doc.vars.forEach(v => optRow(body, 'var', '{' + v.name + '}', varSub(v), h('span', 'bk-opt-e', sampleOf(v.name)), () => { closeAllSheets(); setTimeout(() => onPick(v.name), 30); }));
      label(body, 'آماده از تلگرام');
      const g = h('div', 'bk-chips');
      BUILTINS.forEach(n => g.appendChild(bt('bk-chip lg', '{' + n + '}', () => { closeAllSheets(); setTimeout(() => onPick(n), 30); })));
      body.appendChild(g);
      primary(body, 'متغیر تازه', () => varSheet(null, v => { closeAllSheets(); setTimeout(() => onPick(v.name), 30); }), 's', 'plus');
    });
  }

  /* ---------- لینک در متن ---------- */
  function linkSheet() {
    let url = 'https://';
    sheet('لینک روی متن', 'اول بخشی از متن را انتخاب کرده باش', body => {
      field(body, 'نشانی', input(url, v => { url = v; }, { ltr: true, ph: 'https://…' }));
      primary(body, 'بگذار', () => {
        if (!/^(https?:\/\/|tg:\/\/)\S+\.\S+|^tg:\/\/\S+/.test(url)) { toast('نشانی درست نیست', true); return; }
        closeAllSheets();
        setTimeout(() => {
          const r = restoreSel();
          if (!r || r.collapsed) { toast('اول بخشی از متن را انتخاب کن', true); return; }
          const a = h('a');
          a.setAttribute('href', url);
          a.appendChild(r.extractContents());
          r.insertNode(a);
          const t = curText(), m = find(R.edit);
          if (t && m) { m.text = serialize(t); changed(); }
        }, 40);
      });
    });
  }

  /* ---------- ایموجی (پریمیوم من و معمولی) ---------- */
  function emojiPicker(onPick, opts) {
    opts = opts || {};
    let tab = R.emoji.length && !opts.normalFirst ? 'pe' : 'std';
    sheet(opts.title || 'ایموجی', opts.sub || '', (body, ctx) => {
      body.appendChild(seg([['pe', 'پریمیوم من'], ['std', 'همهٔ ایموجی‌ها']], tab, k => { tab = k; ctx.redraw(); }));
      const g = h('div', 'bk-egrid');
      if (tab === 'pe') {
        if (!R.emoji.length) { note(body, 'هنوز ایموجی پریمیومی نداری. از تب «ایموجی» اضافه کن.'); }
        R.emoji.forEach(e => g.appendChild(bt('bk-etile pe' + (opts.current === e.id ? ' on' : ''), e.alt, () => { onPick(e); })));
        if (!R.d.premium && R.emoji.length) note(body, 'حساب تو پریمیوم نیست؛ کاربرها جای این‌ها ایموجی معمولی‌شان را می‌بینند.', 'warn');
      } else {
        COMMON_EMOJI.forEach(ch => g.appendChild(bt('bk-etile', ch, () => onPick({ id: '', alt: ch }))));
      }
      body.appendChild(g);
      if (opts.allowNone) primary(body, 'بدون آیکن', () => onPick(null), 's', 'ban');
    });
  }

  /* ================================================================ برگهٔ دکمهٔ شیشه‌ای */
  function actSummary(a) {
    const t = a.type;
    if (t === 'goto') { const m = find(a.to); return m ? `رفتن به «${m.name}»` : 'پیام انتخاب نشده'; }
    if (t === 'url') return a.url ? 'لینک: ' + a.url.replace(/^https?:\/\//, '').slice(0, 26) : 'لینک وارد نشده';
    if (t === 'copy') return a.text ? `کپی «${a.text.slice(0, 20)}»` : 'متن کپی وارد نشده';
    if (t === 'app') return a.url ? 'مینی‌اپ: ' + a.url.replace(/^https?:\/\//, '').slice(0, 22) : 'مینی‌اپ خودت';
    if (t === 'share') return 'فرستادن ربات برای دوست';
    if (t === 'pay') return `پرداخت ${faN(a.stars || 0)} ستاره`;
    if (t === 'alert') return a.text ? `پیام کوتاه: «${a.text.slice(0, 18)}»` : 'پیام کوتاه';
    if (t === 'shop') return a.cat ? `محصولات «${a.cat}»` : 'نمایش محصولات';
    if (t === 'cart') return 'سبد خرید';
    return 'غیرفعال';
  }
  function findRow(list, b) {
    for (let r = 0; r < list.length; r++) { const c = list[r].indexOf(b); if (c >= 0) return [r, c]; }
    return [-1, -1];
  }
  function btnPreview(b, key) {
    const p = h('div', 'bk-bpv' + (key ? ' rk' : ''));
    p.appendChild(keyEl(b, key ? 'rk' : '', null));
    return p;
  }
  function buttonSheet(m, b) {
    sheet('دکمه', () => { const [r, c] = findRow(m.rows, b); return `ردیف ${faN(r + 1)} · دکمهٔ ${faN(c + 1)}`; }, (body, ctx) => {
      const pv = btnPreview(b);
      body.appendChild(pv);
      const refresh = () => { pv.replaceWith(btnPreview(b)); changed(); };
      const ti = input(b.text, v => { b.text = v.slice(0, 64); const n = btnPreview(b); body.querySelector('.bk-bpv').replaceWith(n); changed(); }, { max: 64, ph: 'متن دکمه' });
      const icoB = bt('bk-in-end', [], () => emojiPicker(e => { b.icon = e && e.id ? e.id : ''; if (e && !e.id) { b.text = e.alt + ' ' + b.text.replace(/^\p{Extended_Pictographic}️?\s*/u, ''); } changed(); popSheet(); ctx.redraw(); },
        { title: 'آیکن دکمه', sub: 'ایموجی پریمیوم کنار متن دکمه می‌نشیند', current: b.icon, allowNone: true }));
      const cur = b.icon && R.emoji.find(e => e.id === b.icon);
      icoB.append(cur ? h('span', 'bk-pe', cur.alt) : ic('smile'), cur ? 'آیکن' : 'آیکن');
      const tf = field(body, 'متن دکمه', ti);
      tf.classList.add('with-end');
      tf.appendChild(icoB);
      label(body, 'رنگ', 'رنگ‌هایی که تلگرام می‌دهد');
      body.appendChild(swatches(b.style, s => { b.style = s; changed(); ctx.redraw(); }));
      label(body, 'با زدن چه شود؟');
      const a = b.act;
      const meta = ACTS.find(x => x[0] === a.type) || ACTS[0];
      optRow(body, meta[1], meta[2], actSummary(a), h('span', 'bk-opt-e brand', 'عوض کن'), () => actsSheet(m, b, ctx));
      if (a.type === 'goto') {
        const s = a.set;
        optRow(body, 'var', s ? `و {${s.var}} ${s.op === '+' ? '+' : s.op === '-' ? '−' : '='} ${s.value || '…'}` : 'تغییر یک متغیر (اختیاری)', s ? 'با هر بار زدن' : 'مثلاً امتیاز +۱۰ یا انتخاب کاربر', null, () => setVarSheet(a, ctx));
      }
      const tools = h('div', 'bk-tools');
      tools.append(
        bt('bk-tool', [ic('copy'), 'تکثیر'], () => { const [r] = findRow(m.rows, b); const nb = clone(b); nb.id = uid('b'); if (m.rows[r].length < 8) m.rows[r].push(nb); else m.rows.splice(r + 1, 0, [nb]); changed(); popSheet(); drawEditor(); }),
        bt('bk-tool', [ic('move'), 'جابه‌جایی'], () => moveSheet(m.rows, b)),
        bt('bk-tool red', [ic('trash'), 'حذف'], () => { const [r, c] = findRow(m.rows, b); m.rows[r].splice(c, 1); if (!m.rows[r].length) m.rows.splice(r, 1); changed(); closeAllSheets(); }),
      );
      body.appendChild(tools);
    }, { onClose: () => drawEditor() });
  }
  function swatches(cur, onPick) {
    const w = h('div', 'bk-sw4');
    STYLES.forEach(([k, t]) => {
      const s = bt('bk-swatch' + (k === cur ? ' on' : ''), [h('span', 'bk-swatch-c ' + (k || 'def')), t], () => onPick(k));
      if (k === cur) s.querySelector('.bk-swatch-c').appendChild(ic('check'));
      w.appendChild(s);
    });
    return w;
  }
  function moveSheet(list, b) {
    sheet('جابه‌جایی', 'با دکمه‌ها جای دکمه را عوض کن', (body, ctx) => {
      const pv = h('div', 'bk-mvpv');
      list.forEach(row => { const r = h('div', 'bk-krow'); row.forEach(x => r.appendChild(keyEl(x, x === b ? 'sel' : '', null))); pv.appendChild(r); });
      body.appendChild(pv);
      const pad = h('div', 'bk-arrows');
      const mv = dir => {
        const [r, c] = findRow(list, b);
        if (dir === 'right' && c > 0) { list[r].splice(c, 1); list[r].splice(c - 1, 0, b); }
        else if (dir === 'left' && c < list[r].length - 1) { list[r].splice(c, 1); list[r].splice(c + 1, 0, b); }
        else if (dir === 'up') { list[r].splice(c, 1); if (r > 0 && list[r - 1].length < 8) list[r - 1].push(b); else list.splice(r, 0, [b]); }
        else if (dir === 'down') { list[r].splice(c, 1); if (r < list.length - 1 && list[r + 1].length < 8) list[r + 1].unshift(b); else list.splice(r + 1, 0, [b]); }
        for (let i = list.length - 1; i >= 0; i--) if (!list[i].length) list.splice(i, 1);
        changed();
        ctx.redraw();
      };
      [['up', 'بالا'], ['right', 'راست'], ['left', 'چپ'], ['down', 'پایین']].forEach(([d, t]) => pad.appendChild(bt('bk-arrow ' + d, [ic(d), t], () => mv(d))));
      body.appendChild(pad);
    });
  }
  function actsSheet(m, b, parent) {
    sheet('با زدن دکمه چه شود؟', 'همهٔ کارهایی که تلگرام اجازه می‌دهد', body => {
      const g = h('div', 'bk-acts');
      ACTS.forEach(([k, i, t, d, c]) => {
        const card = bt('bk-act ' + c + (b.act.type === k ? ' on' : ''), [], () => {
          if (b.act.type !== k) b.act = defaultAct(k);
          changed();
          popSheet();
          if (k !== 'none' && k !== 'share' && k !== 'cart') actDetail(m, b);
          parent.redraw();
        });
        const tl = h('span', 'bk-act-ic');
        tl.appendChild(ic(i));
        card.append(tl, h('b', '', t), h('span', '', d));
        g.appendChild(card);
      });
      body.appendChild(g);
    }, { tall: true });
  }
  function defaultAct(k) {
    return ({ goto: { type: 'goto', to: '' }, url: { type: 'url', url: '' }, copy: { type: 'copy', text: '' }, app: { type: 'app', url: '' },
      share: { type: 'share', text: 'این ربات رو ببین 👇' }, pay: { type: 'pay', stars: 50, title: 'خرید', to: '' }, alert: { type: 'alert', text: '', popup: false }, shop: { type: 'shop', cat: '' }, cart: { type: 'cart' }, none: { type: 'none' } })[k];
  }
  function actDetail(m, b) {
    const a = b.act;
    const titles = { shop: 'نمایش محصولات', goto: 'رفتن به پیام', url: 'باز کردن لینک', copy: 'کپی متن', app: 'باز کردن مینی‌اپ', share: 'فرستادن برای دوست', pay: 'پرداخت با ستاره', alert: 'پیام کوتاه بالای چت' };
    if (a.type === 'goto') { msgPick('رفتن به پیام', a.to, id => { a.to = id; changed(); }, { exclude: m.id, newName: b.text.replace(/^\p{Extended_Pictographic}️?\s*/u, '') }); return; }
    sheet(titles[a.type], `دکمهٔ «${b.text}»`, (body, ctx) => {
      if (a.type === 'url') {
        field(body, 'نشانی', input(a.url, v => { a.url = v.trim(); changed(); }, { ltr: true, ph: 'https://…' }), 'سایت، کانال (https://t.me/…) یا هر نشانی');
      } else if (a.type === 'copy') {
        const ta = input(a.text, v => { a.text = v.slice(0, 256); changed(); }, { area: true, ph: 'SARA-PAIZ-20' });
        field(body, 'متنی که کپی می‌شود', ta, 'متغیر هم می‌شود: هر کاربر مقدار خودش را کپی می‌کند');
        const chips = h('div', 'bk-chips');
        varNames().concat(BUILTINS).slice(0, 10).forEach(n => chips.appendChild(bt('bk-chip', '{' + n + '}', () => { ta.value += '{' + n + '}'; a.text = ta.value; changed(); })));
        body.appendChild(chips);
        label(body, 'کاربر این را می‌بیند');
        const pv = h('div', 'bk-bpv col');
        pv.append(keyEl(b, '', null), h('span', 'bk-toastpv', '✓ کپی شد'));
        body.appendChild(pv);
      } else if (a.type === 'app') {
        const own = !a.url;
        body.appendChild(seg([['own', 'مینی‌اپ خودم'], ['url', 'نشانی دیگر']], own ? 'own' : 'url', k => { a.url = k === 'own' ? '' : 'https://'; changed(); ctx.redraw(); }));
        if (!own) field(body, 'نشانی (https)', input(a.url, v => { a.url = v.trim(); changed(); }, { ltr: true }));
        else note(body, `«${R.d.app.name}» داخل تلگرام باز می‌شود.`);
      } else if (a.type === 'share') {
        field(body, 'متن پیشنهادی', input(a.text, v => { a.text = v; changed(); }, { max: 200 }), 'کاربر یک چت انتخاب می‌کند و لینک ربات با این متن فرستاده می‌شود');
      } else if (a.type === 'pay') {
        field(body, 'قیمت (ستاره)', input(String(a.stars), v => { a.stars = Math.max(1, Math.min(10000, parseInt(v.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10) || 1)); changed(); }, { type: 'text', mode: 'numeric', ltr: true }));
        field(body, 'نام محصول', input(a.title, v => { a.title = v.slice(0, 32); changed(); }, { max: 32 }));
        const to = find(a.to);
        optRow(body, 'chat', 'بعد از پرداخت', to ? `پیام «${to.name}»` : 'فقط «پرداخت انجام شد»', h('span', 'bk-opt-e brand', 'انتخاب'),
          () => msgPick('بعد از پرداخت', a.to, id => { a.to = id; changed(); ctx.redraw(); }, { allowNone: true, newName: 'بعد از خرید' }));
        note(body, 'پول با Telegram Stars پرداخت و در حساب ربات‌ات جمع می‌شود.');
      } else if (a.type === 'shop') {
        const cats = (R.shop && R.shop.cats) || [];
        label(body, 'کدام محصولات؟');
        const g = h('div', 'bk-chips');
        [''].concat(cats).forEach(c => g.appendChild(bt('bk-chip lg' + ((a.cat || '') === c ? ' on' : ''), c || 'همه', () => { a.cat = c; changed(); ctx.redraw(); })));
        body.appendChild(g);
        if (!cats.length) { if (!R.shop) loadShop().then(() => ctx.redraw()).catch(() => {}); }
        note(body, 'کاربر کارت محصول را با عکس، قیمت و «افزودن به سبد» می‌بیند و ورق می‌زند. محصولات را در «داده‌ها ← محصولات» وارد کن.');
        primary(body, 'رفتن به محصولات', () => { closeAllSheets(); closeEditor(); R.tab = 'data'; R.dseg = 'products'; draw(); }, 's', 'bag');
      } else if (a.type === 'alert') {
        field(body, 'متن', input(a.text, v => { a.text = v.slice(0, 190); changed(); }, { area: true, max: 190 }), 'تا ۱۹۰ حرف؛ متغیر هم می‌شود');
        toggle(body, 'پنجرهٔ هشدار', 'به‌جای اعلان کوتاه بالای چت، پنجره‌ای با «باشه»', a.popup, v => { a.popup = v; changed(); });
      }
      primary(body, 'ذخیره', popSheet);
    });
  }
  function setVarSheet(a, parent) {
    const s = a.set || { var: '', op: '=', value: '' };
    sheet('تغییر متغیر', 'با هر بار زدن دکمه', (body, ctx) => {
      const v = R.doc.vars.find(x => x.name === s.var);
      optRow(body, 'var', v ? '{' + v.name + '}' : 'کدام متغیر؟', v ? varSub(v) : '', h('span', 'bk-opt-e brand', 'انتخاب'),
        () => varPick('کدام متغیر؟', s.var, n => { s.var = n; ctx.redraw(); }));
      const isNum = v && v.type === 'number';
      body.appendChild(seg(isNum ? [['=', 'برابر'], ['+', 'اضافه کن'], ['-', 'کم کن']] : [['=', 'برابر']], s.op, k => { s.op = k; ctx.redraw(); }));
      field(body, 'مقدار', input(s.value, val => { s.value = val; }, { ph: isNum ? '۱۰' : 'متن' }));
      const row = h('div', 'bk-row2');
      row.appendChild(bt('bk-btn s', 'بدون تغییر', () => { delete a.set; changed(); popSheet(); parent.redraw(); }));
      row.appendChild(bt('bk-btn p', 'ذخیره', () => { if (!s.var) { toast('متغیر را انتخاب کن', true); return; } a.set = s; changed(); popSheet(); parent.redraw(); }));
      body.appendChild(row);
    });
  }

  /* ================================================================ نوع دکمه: شیشه‌ای یا کیبوردی */
  function kindSheet(m, switching) {
    sheet(switching ? 'دکمه‌های این پیام' : 'دکمه از چه نوعی؟', 'بعداً هم می‌شود عوضش کرد', body => {
      const card = (k, title, sub, pts) => {
        const c = bt('bk-kind' + (m.kb === k ? ' on' : ''), [], () => {
          m.kb = k;
          if (k === 'inline' && !m.rows.length) m.rows.push([newBtn('دکمه')]);
          if (k === 'reply' && !m.keys.length) m.keys.push([newKey('دکمه')]);
          changed();
          closeAllSheets();
          drawEditor();
          if (!switching) { if (k === 'inline') buttonSheet(m, m.rows[m.rows.length - 1][0]); else if (k === 'reply') keySheet(m, m.keys[m.keys.length - 1][0]); }
        });
        const il = h('span', 'bk-kind-il ' + k);
        if (k === 'inline') { il.append(h('i', 'bub'), h('i', 'k b'), h('i', 'k'), h('i', 'k g w')); }
        else if (k === 'reply') { il.append(h('i', 'pad'), h('i', 'k'), h('i', 'k'), h('i', 'k g w')); }
        else il.appendChild(h('i', 'bub'));
        const tx = h('span', 'grow');
        tx.append(h('b', '', title), h('span', 'bk-kind-s', sub));
        pts.forEach(p => { const l = h('span', 'bk-kind-p'); l.append(ic('check'), document.createTextNode(p)); tx.appendChild(l); });
        c.append(il, tx);
        body.appendChild(c);
      };
      card('inline', 'شیشه‌ای', 'زیر همان پیام', ['لینک، کپی، مینی‌اپ، پرداخت', 'رفتن به پیام بدون پیام اضافه', 'رنگ و آیکن']);
      card('reply', 'کیبوردی', 'جای کیبورد گوشی', ['منوی همیشگی ربات', 'فرستادن شماره و موقعیت', 'انتخاب کاربر، گروه، نظرسنجی']);
      if (switching) card('none', 'بدون دکمه', 'فقط متن', []);
    });
  }

  /* ================================================================ دکمهٔ کیبورد */
  function keySheet(m, b) {
    sheet('دکمهٔ کیبورد', () => { const [r] = findRow(m.keys, b); return `ردیف ${faN(r + 1)}`; }, (body, ctx) => {
      body.appendChild(btnPreview(b, true));
      field(body, 'متن دکمه', input(b.text, v => { b.text = v.slice(0, 64); body.querySelector('.bk-bpv').replaceWith(btnPreview(b, true)); changed(); }, { max: 64 }));
      label(body, 'رنگ');
      body.appendChild(swatches(b.style, s => { b.style = s; changed(); ctx.redraw(); }));
      label(body, 'کار دکمه');
      KEY_ACTS.forEach(([k, i, t, d]) => {
        const on = b.act.type === k;
        const r = bt('bk-radio' + (on ? ' on' : ''), [h('i', 'bk-radio-c'), ic(i), h('span', 'grow')], () => {
          if (!on) b.act = k === 'app' ? { type: 'app', url: '' } : { type: k, to: '', var: '' };
          changed();
          ctx.redraw();
        });
        r.querySelector('.grow').append(h('b', '', t), d ? h('span', '', d) : '');
        body.appendChild(r);
      });
      const a = b.act;
      if (['contact', 'location', 'user', 'chat'].includes(a.type)) {
        const v = R.doc.vars.find(x => x.name === a.var);
        optRow(body, 'var', v ? `ذخیره در {${v.name}}` : 'ذخیره در متغیر', 'اختیاری', h('span', 'bk-opt-e brand', 'انتخاب'),
          () => varPick('ذخیره در متغیر', a.var, n => { a.var = n; changed(); ctx.redraw(); }, { allowNone: true }));
      }
      if (a.type !== 'app') {
        const to = find(a.to);
        optRow(body, 'chat', to ? `بعدش: «${to.name}»` : 'بعدش به کدام پیام؟', to ? msgSummary(to) : 'اختیاری', h('span', 'bk-opt-e brand', 'انتخاب'),
          () => msgPick('بعد از زدن دکمه', a.to, id => { a.to = id; changed(); ctx.redraw(); }, { allowNone: true, exclude: '', newName: b.text }));
      } else {
        field(body, 'نشانی (خالی = مینی‌اپ خودت)', input(a.url, v => { a.url = v.trim(); changed(); }, { ltr: true, ph: 'https://…' }));
      }
      const tools = h('div', 'bk-tools');
      tools.append(
        bt('bk-tool', [ic('move'), 'جابه‌جایی'], () => moveSheet(m.keys, b)),
        bt('bk-tool', [ic('sliders'), 'تنظیمات کیبورد'], () => kbOptsSheet(m)),
        bt('bk-tool red', [ic('trash'), 'حذف'], () => { const [r, c] = findRow(m.keys, b); m.keys[r].splice(c, 1); if (!m.keys[r].length) m.keys.splice(r, 1); changed(); closeAllSheets(); }),
      );
      body.appendChild(tools);
    }, { tall: true, onClose: () => drawEditor() });
  }
  function kbOptsSheet(m) {
    sheet('رفتار کیبورد', `در پیام «${m.name}»`, body => {
      toggle(body, 'کیبورد جمع‌وجور', 'دکمه‌ها کوتاه‌تر', m.kbopt.resize, v => { m.kbopt.resize = v; changed(); });
      toggle(body, 'بعد از زدن پنهان شود', '', m.kbopt.once, v => { m.kbopt.once = v; changed(); });
      toggle(body, 'همیشه نمایش', 'کاربر نمی‌تواند پنهانش کند', m.kbopt.persist, v => { m.kbopt.persist = v; changed(); });
      field(body, 'متن راهنمای کادر', input(m.kbopt.placeholder, v => { m.kbopt.placeholder = v.slice(0, 64); changed(); }, { ph: 'یکی را انتخاب کن…', max: 64 }));
    });
  }

  /* ================================================================ تنظیمات پیام («بیشتر») */
  function msgSheet(m) {
    sheet('تنظیمات پیام', `«${m.name}»`, (body, ctx) => {
      field(body, 'نام پیام (فقط برای تو)', input(m.name, v => { m.name = v.slice(0, 40) || 'پیام'; changed(); }, { max: 40 }));
      optRow(body, 'image', m.media ? (m.media.type === 'photo' ? 'عکس بالای پیام' : 'ویدیو بالای پیام') : 'عکس یا ویدیو', 'متن پیام زیرنویسش می‌شود', h('span', 'bk-opt-e brand', m.media ? 'عوض کن' : 'افزودن'), () => mediaSheet(m));
      optRow(body, 'flow', (m.steps || []).length ? `${faN(m.steps.length)} کار پیش از این پیام` : 'کار پیش از پیام', 'شرط، حساب، مکث، عضویت کانال، ثبت…', h('span', 'bk-opt-e brand', 'افزودن'), () => stepsGrid(m));
      label(body, 'وقتی با یک دکمه باز شد');
      body.appendChild(seg([['r', 'جای پیام قبلی بنشیند'], ['n', 'پیام تازه بفرستد']], m.opts.replace ? 'r' : 'n', k => { m.opts.replace = k === 'r'; changed(); ctx.redraw(); }));
      body.appendChild(h('span', 'bk-hint', m.opts.replace ? 'چت شلوغ نمی‌شود و حس «صفحه» دارد.' : 'هر بار پیام تازه‌ای زیر پیام‌های قبلی می‌آید.'));
      label(body, 'بعد از این پیام');
      const w = m.wait;
      body.appendChild(seg([['', 'هیچ'], ['var', 'منتظر جواب'], ['support', 'پشتیبانی']], w ? w.kind : '', k => {
        m.wait = k ? { kind: k, var: k === 'var' ? (R.doc.vars.find(v => !v.formula) || {}).name || '' : '', to: (w && w.to) || '' } : null;
        changed();
        ctx.redraw();
      }));
      if (m.wait) {
        if (m.wait.kind === 'var') {
          optRow(body, 'var', m.wait.var ? `جواب در {${m.wait.var}}` : 'جواب در کدام متغیر؟', 'متن، شماره یا زیرنویس عکس', h('span', 'bk-opt-e brand', 'انتخاب'),
            () => varPick('جواب در کدام متغیر؟', m.wait.var, n => { m.wait.var = n; changed(); ctx.redraw(); }));
          optRow(body, 'form', 'نوع جواب: ' + (CHECKS.find(x => x[0] === (m.wait.check || 'text')) || CHECKS[0])[1], 'عدد با بازه، شماره، ایمیل، تاریخ، عکس، گزینه', h('span', 'bk-opt-e brand', 'تنظیم'), () => askSheet(m));
        } else note(body, 'پیام بعدی کاربر برای خودت در همین ربات فرستاده می‌شود؛ با «پاسخ» روی آن جواب بده.');
        const to = find(m.wait.to);
        optRow(body, 'chat', to ? `بعد از جواب: «${to.name}»` : 'بعد از جواب به کدام پیام؟', 'مثلاً «ممنون، رسید»', h('span', 'bk-opt-e brand', 'انتخاب'),
          () => msgPick('بعد از جواب', m.wait.to, id => { m.wait.to = id; changed(); ctx.redraw(); }, { allowNone: true, exclude: m.id, newName: 'رسید' }));
      }
      label(body, 'قبل از فرستادن');
      toggle(body, '«در حال نوشتن…» نشان بده', 'یک ثانیه، طبیعی‌تر', m.opts.typing, v => { m.opts.typing = v; changed(); });
      label(body, 'افکت پیام', 'فقط پیام تازه');
      const ef = h('div', 'bk-effects');
      [''].concat(EFFECTS).forEach(e => ef.appendChild(bt('bk-eff' + (m.opts.effect === e ? ' on' : ''), e || ic('ban'), () => { m.opts.effect = e; changed(); ctx.redraw(); })));
      body.appendChild(ef);
      label(body, 'شروع با');
      field(body, 'دستور', input(m.cmd, v => { m.cmd = v.trim().toLowerCase(); changed(); }, { ltr: true, ph: '/help', max: 33 }), 'با / شروع شود؛ کاربر بفرستد، همین پیام می‌آید');
      field(body, 'کلمه‌ها', input(m.kw.join('، '), v => { m.kw = v.split(/[،,]/).map(x => x.trim()).filter(Boolean).slice(0, 12); changed(); }, { ph: 'قیمت، هزینه' }), 'پیامی که این کلمه‌ها را داشته باشد');
      label(body, 'بیشتر');
      toggle(body, 'پیام شروع ربات', 'با /start همین پیام می‌آید', R.doc.start === m.id, v => { if (v) R.doc.start = m.id; else if (R.doc.start === m.id) toast('یک پیام دیگر را پیام شروع کن', true); changed(); ctx.redraw(); });
      toggle(body, 'جواب هر پیام نامفهوم', 'وقتی ربات منظور کاربر را نفهمید', R.doc.fallback === m.id, v => { R.doc.fallback = v ? m.id : (R.doc.fallback === m.id ? '' : R.doc.fallback); changed(); });
      toggle(body, 'پیش‌نمایش لینک', '', m.opts.preview, v => { m.opts.preview = v; changed(); });
      toggle(body, 'بی‌صدا بفرست', '', m.opts.silent, v => { m.opts.silent = v; changed(); });
      toggle(body, 'جلوگیری از فوروارد و ذخیره', 'برای محتوای فروشی', m.opts.protect, v => { m.opts.protect = v; changed(); });
      if (m.kb !== 'reply') toggle(body, 'برداشتن کیبورد قبلی', 'کیبورد پایین صفحه بسته شود', m.opts.remove_kb, v => { m.opts.remove_kb = v; changed(); });
      const tools = h('div', 'bk-tools');
      tools.append(
        bt('bk-tool', [ic('copy'), 'تکثیر پیام'], () => { const n = clone(m); n.id = uid('m'); n.name = freshName(m.name); n.group = ''; reId(n); R.doc.msgs.push(n); changed(); closeAllSheets(); openEditor(n.id); }),
        bt('bk-tool red', [ic('trash'), 'حذف پیام'], () => {
          if (R.doc.start === m.id) { toast('پیام شروع حذف نمی‌شود؛ اول پیام دیگری را شروع کن', true); return; }
          P().confirm(`پیام «${m.name}» حذف شود؟ دکمه‌هایی که به آن می‌رسند بی‌مقصد می‌شوند.`, () => { removeMsg(m.id); changed(); closeAllSheets(); closeEditor(); }, { danger: true, yes: 'حذف' });
        }),
      );
      body.appendChild(tools);
    }, { tall: true, onClose: () => drawEditor() });
  }
  function reId(m) {
    m.rows.forEach(r => r.forEach(b => { b.id = uid('b'); }));
    m.keys.forEach(r => r.forEach(b => { b.id = uid('k'); }));
  }
  function removeMsg(id) {
    R.doc.msgs = R.doc.msgs.filter(m => m.id !== id);
    R.doc.msgs.forEach(m => {
      if (m.then === id) m.then = '';
      if (m.wait && m.wait.to === id) m.wait.to = '';
      (m.steps || []).forEach(st => { if (st.yes === id) st.yes = ''; if (st.no === id) st.no = ''; if (st.to) st.to = st.to.filter(x => x !== id); });
      m.steps = (m.steps || []).filter(st => st.type !== 'random' || st.to.length);
      m.rows.concat(m.keys).forEach(r => r.forEach(b => { if (b.act.to === id) b.act.to = ''; }));
    });
    if (R.doc.fallback === id) R.doc.fallback = '';
    if (R.doc.start === id) R.doc.start = R.doc.msgs[0] ? R.doc.msgs[0].id : '';
  }
  function renameSheet(m) {
    sheet('نام پیام', 'فقط برای خودت؛ کاربر نمی‌بیند', body => {
      const i = input(m.name, v => { m.name = v.slice(0, 40) || 'پیام'; changed(); }, { max: 40 });
      field(body, '', i);
      primary(body, 'ذخیره', () => { closeAllSheets(); drawEditor(); });
      setTimeout(() => i.focus(), 250);
    });
  }

  /* ---------- رسانه ---------- */
  function mediaSheet(m) {
    sheet('رسانهٔ پیام', 'عکس بالای پیام؛ متن زیرنویسش می‌شود', (body, ctx) => {
      if (m.media) {
        const pv = h('div', 'bk-mpv');
        if (m.media.type === 'photo') { const im = h('img'); im.src = m.media.url; im.alt = ''; pv.appendChild(im); }
        else pv.append(ic('play'), h('span', 'ltr', m.media.url));
        body.appendChild(pv);
      }
      primary(body, m.media && m.media.type === 'photo' ? 'عوض کردن عکس' : 'عکس از گالری', () => pickImage(url => { m.media = { type: 'photo', url }; changed(); ctx.redraw(); }), 'p', 'image');
      let vurl = m.media && m.media.type === 'video' ? m.media.url : '';
      field(body, 'یا ویدیو با لینک', input(vurl, v => { vurl = v.trim(); }, { ltr: true, ph: 'https://…/video.mp4' }), 'لینک مستقیم فایل mp4');
      primary(body, 'گذاشتن ویدیو', () => { if (!/^https:\/\/\S+$/.test(vurl)) { toast('لینک باید با https شروع شود', true); return; } m.media = { type: 'video', url: vurl }; changed(); ctx.redraw(); }, 's', 'play');
      if (m.media) primary(body, 'برداشتن رسانه', () => { m.media = null; changed(); ctx.redraw(); }, 'd', 'trash');
      if (m.media) note(body, 'با رسانه، متن پیام زیرنویس است و حداکثر ۱۰۰۰ حرف.');
    });
  }
  function pickImage(done) {
    const inp = h('input');
    inp.type = 'file';
    inp.accept = 'image/png,image/jpeg,image/webp';
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        const data = await resize(f, 1600);
        const res = await P().api('upload', { data });
        done(res.url);
      } catch (err) { P().failed(err); }
    });
    inp.click();
  }
  function resize(file, max) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => reject(new Error('این عکس خوانده نشد'));
      img.src = URL.createObjectURL(file);
    });
  }

  /* ================================================================ کارها (منطق پیش از پیام) */
  const STEP_META = {
    if: ['split', 'شرط', 'اگر/وگرنه با متغیر، عضویت، ساعت', 'brand'],
    calc: ['calc', 'حساب', 'تغییر متغیر با فرمول', 'teal'],
    random: ['dice', 'تصادفی', 'یکی از چند مسیر', 'amber'],
    delay: ['clock', 'مکث', 'چند ثانیه تا چند روز بعد', 'brand'],
    ask: ['form', 'پرسش', 'جواب کاربر با اعتبارسنجی', 'teal'],
    member: ['tg', 'عضویت کانال', 'قبل از ادامه', 'tg'],
    notify: ['bell', 'به ادمین', 'خبر فوری برای تو', 'rose'],
    tag: ['tag', 'برچسب', 'دسته‌بندی کاربرها', 'amber'],
    save: ['inbox', 'ثبت در داده‌ها', 'جواب‌ها در تب «داده‌ها»', 'teal'],
  };
  const STEP_SOON = [['sparkle', 'پاسخ هوشمند', 'جواب از دانسته‌های تو'], ['globe', 'وب‌سرویس', 'دریافت/ارسال داده'], ['cart', 'سبد خرید', 'افزودن، جمع، پرداخت'], ['gift', 'امتیاز', 'دعوت و جایزه']];
  const CHECKS = [['text', 'متن'], ['number', 'عدد'], ['phone', 'شماره'], ['email', 'ایمیل'], ['date', 'تاریخ'], ['photo', 'عکس'], ['choice', 'گزینه']];
  const RULE_KINDS = [['var', 'متغیر'], ['tag', 'برچسب'], ['member', 'عضویت'], ['hour', 'ساعت'], ['day', 'روز']];
  const VAR_OPS = [['=', '='], ['!=', '≠'], ['>', '>'], ['<', '<'], ['>=', '≥'], ['<=', '≤'], ['has', 'دارد'], ['empty', 'خالی'], ['filled', 'پر']];
  const WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  const UNITS = [[1, 'ثانیه'], [60, 'دقیقه'], [3600, 'ساعت'], [86400, 'روز']];
  const CHAT_RE = /^(@[A-Za-z][A-Za-z0-9_]{3,31}|-100\d{6,14})$/;
  const allVarNames = () => R.doc.vars.map(v => v.name).concat(BUILTINS);
  const mName = id => { const x = find(id); return x ? x.name : ''; };
  const faDigits = s => String(s).replace(/\d/g, d => FA_D[d]);

  function stepTargets(m) {
    const out = [];
    (m.steps || []).forEach(st => { [st.yes, st.no].concat(st.to || []).forEach(x => { if (x) out.push(x); }); });
    return out;
  }
  function delayText(sec) {
    const u = UNITS.slice().reverse().find(([k]) => sec >= k && sec % k === 0) || UNITS[0];
    return `${faN(sec / u[0])} ${u[1]}`;
  }
  function ruleText(r) {
    if (r.k === 'member') return `${r.op === 'not' ? 'عضو نیست' : 'عضو'} ${r.a}`;
    if (r.k === 'tag') return `برچسب #${r.b} ${r.op === 'not' ? 'ندارد' : 'دارد'}`;
    if (r.k === 'hour') return `${r.op === 'not' ? 'بیرون از' : 'ساعت'} ${faDigits(r.b || '')}`;
    if (r.k === 'day') return `${r.op === 'not' ? 'غیر از' : 'روز'} ${r.b || ''}`;
    const op = (VAR_OPS.find(x => x[0] === r.op) || VAR_OPS[0])[1];
    if (r.op === 'empty' || r.op === 'filled') return `{${r.a}} ${op} است`;
    return `{${r.a}} ${op} ${faDigits(r.b)}`;
  }
  function stepSummary(st) {
    if (st.type === 'if') return 'اگر ' + st.rules.map(ruleText).join(st.mode === 'or' ? ' یا ' : ' و ');
    if (st.type === 'calc') {
      const v = R.doc.vars.find(x => x.name === st.var);
      const val = faDigits(st.value || '—');
      if (v && v.type === 'number' && st.op === '+') return `${val} به {${st.var}} اضافه می‌شود`;
      if (v && v.type === 'number' && st.op === '-') return `${val} از {${st.var}} کم می‌شود`;
      return `{${st.var}} می‌شود ${val}`;
    }
    if (st.type === 'random') return 'یکی از: ' + st.to.map(id => `«${mName(id)}»`).join('، ');
    if (st.type === 'delay') return `${delayText(st.sec)} بعد ادامه می‌دهد` + (st.sec <= 8 ? ' (با «در حال نوشتن…»)' : '');
    if (st.type === 'member') return `فقط عضوهای ${st.chat}` + (st.no ? ` · وگرنه «${mName(st.no)}»` : ' · وگرنه پیام عضویت');
    if (st.type === 'notify') return '«' + plain(st.text).slice(0, 60) + '»';
    if (st.type === 'tag') return `${st.op === 'remove' ? 'برداشتن' : 'زدن'} برچسب #${st.tag}`;
    if (st.type === 'save') return `فرم «${st.form}» · ${st.vars.map(v => '{' + v + '}').join(' ')}` + (st.notify ? ' · خبر فوری' : '');
    return '';
  }
  function stepsRail(m) {
    const wrap = h('div', 'bk-steps');
    (m.steps || []).forEach((st, i) => {
      const [icon, title, , tone] = STEP_META[st.type] || STEP_META.if;
      const c = bt('bk-step' + (st.type === 'if' ? ' cond' : ''), [], () => stepSheet(m, i));
      const hd = h('span', 'bk-step-h');
      const tl = h('span', 'bk-tile sm ' + tone);
      tl.appendChild(ic(icon));
      hd.append(tl, h('b', 'grow', title), h('span', 'bk-step-n', faN(i + 1)));
      c.append(hd, h('span', 'bk-step-s', stepSummary(st)));
      if (st.type === 'if') {
        const br = h('span', 'bk-branches');
        br.append(h('span', 'bk-br yes', 'بله › ' + (st.yes ? `«${mName(st.yes)}»` : 'همین پیام')), h('span', 'bk-br no', 'نه › ' + (st.no ? `«${mName(st.no)}»` : 'همین پیام')));
        c.appendChild(br);
      }
      wrap.appendChild(c);
    });
    return wrap;
  }
  function askCard(m) {
    const w = m.wait;
    const c = bt('bk-ask', [], () => askSheet(m));
    const hd = h('span', 'bk-step-h');
    const tl = h('span', 'bk-tile sm teal');
    tl.appendChild(ic('form'));
    hd.append(tl, h('b', 'grow', 'پرسش'));
    const to = find(w.to);
    if (to) hd.appendChild(h('span', 'bk-step-n', '← ' + to.name));
    const ck = w.check || 'text';
    let kind = (CHECKS.find(x => x[0] === ck) || CHECKS[0])[1];
    if (ck === 'number' && (w.min != null || w.max != null)) kind = `عدد ${w.min != null ? 'از ' + faN(w.min) : ''} ${w.max != null ? 'تا ' + faN(w.max) : ''}`.trim();
    if (ck === 'choice' && (w.choices || []).length) kind = 'یکی از: ' + w.choices.join('، ');
    const line = h('span', 'bk-step-s');
    line.append('جواب در ', h('span', 'bk-var static', '{' + (w.var || '؟') + '}'), ' · نوع: ', h('b', '', kind));
    c.append(hd, line);
    if (ck !== 'text' || w.error) c.appendChild(h('span', 'bk-step-e', 'اگر اشتباه بود: «' + (w.error || checkError(w)) + '»'));
    const chips = h('span', 'bk-ask-c');
    CHECKS.slice(0, 6).forEach(([k, t]) => chips.appendChild(h('span', 'bk-ask-chip' + (k === ck ? ' on' : ''), t)));
    c.appendChild(chips);
    return c;
  }
  function checkError(w) {
    const ck = w.check || 'text';
    if (ck === 'number' && (w.min != null || w.max != null)) {
      if (w.min != null && w.max != null) return `لطفاً یک عدد بین ${faN(w.min)} تا ${faN(w.max)} بفرست 🙂`;
      return w.min != null ? `لطفاً یک عدد از ${faN(w.min)} به بالا بفرست 🙂` : `لطفاً یک عدد تا ${faN(w.max)} بفرست 🙂`;
    }
    return { number: 'لطفاً یک عدد بفرست 🙂', phone: 'شماره را درست بفرست (مثل ۰۹۱۲۳۴۵۶۷۸۹) یا دکمهٔ «ارسال شماره» را بزن 🙂', email: 'ایمیل درست نیست؛ مثل name@example.com بفرست 🙂',
      date: 'تاریخ را مثل ۱۴۰۵/۰۷/۱۰ بفرست 🙂', photo: 'لطفاً یک عکس بفرست 📷', choice: 'لطفاً یکی از گزینه‌ها را بفرست 🙂', text: 'لطفاً جوابت را به صورت متن بفرست 🙂' }[ck];
  }

  /* ---------- «کار تازه» ---------- */
  function stepsGrid(m) {
    sheet('کار تازه', 'پیش از این پیام اجرا می‌شود', body => {
      const g = h('div', 'bk-sgrid');
      Object.keys(STEP_META).forEach(k => {
        const [icon, title, sub, tone] = STEP_META[k];
        const t = bt('bk-stile', [], () => {
          popSheet();
          if (k === 'ask') { askSheet(m); return; }
          if ((m.steps || []).length >= 12) { toast('هر پیام حداکثر ۱۲ کار دارد', true); return; }
          stepSheet(m, -1, newStep(k));
        });
        const tl = h('span', 'bk-tile ' + tone);
        tl.appendChild(ic(icon));
        t.append(tl, h('b', '', title), h('span', '', sub));
        g.appendChild(t);
      });
      STEP_SOON.forEach(([icon, title, sub]) => {
        const t = h('div', 'bk-stile soon');
        const tl = h('span', 'bk-tile mute');
        tl.appendChild(ic(icon));
        t.append(tl, h('b', '', title), h('span', '', sub), h('i', 'bk-soon', 'به‌زودی'));
        g.appendChild(t);
      });
      body.appendChild(g);
      note(body, 'کارها به ترتیب، قبل از فرستادن پیام انجام می‌شوند. «شرط» و «تصادفی» می‌توانند کاربر را به پیام دیگری ببرند. دستیار هوش مصنوعی هم همین کارها را می‌سازد.');
    }, { tall: true });
  }
  function newStep(k) {
    const numVar = R.doc.vars.find(v => !v.formula && v.type === 'number');
    const anyVar = R.doc.vars.find(v => !v.formula);
    return {
      if: { type: 'if', rules: [{ k: 'var', a: (anyVar || {}).name || 'نام', op: '=', b: '' }], mode: 'and', yes: '', no: '' },
      calc: { type: 'calc', var: (numVar || anyVar || {}).name || '', op: numVar ? '+' : '=', value: numVar ? '1' : '' },
      random: { type: 'random', to: [] },
      delay: { type: 'delay', sec: 3600 },
      member: { type: 'member', chat: '@', no: '' },
      notify: { type: 'notify', text: 'کاربر {نام} به «' + (find(R.edit) || {}).name + '» رسید' },
      tag: { type: 'tag', tag: '', op: 'add' },
      save: { type: 'save', form: 'فرم ' + faN(1 + new Set(msgs().flatMap(x => (x.steps || []).filter(s => s.type === 'save').map(s => s.form))).size), vars: anyVar ? [anyVar.name] : ['نام'], notify: true },
    }[k];
  }
  function stepProblem(st) {
    if (st.type === 'if' && !st.rules.length) return 'دست‌کم یک قاعده لازم است';
    if (st.type === 'if') {
      for (const r of st.rules) {
        if (r.k === 'var' && !r.a) return 'متغیر قاعده را انتخاب کن';
        if (r.k === 'member' && !CHAT_RE.test(r.a)) return 'نشانی کانال باید مثل ‎@channel باشد';
        if ((r.k === 'tag' || r.k === 'day') && !r.b) return r.k === 'tag' ? 'نام برچسب را بنویس' : 'دست‌کم یک روز را انتخاب کن';
        if (r.k === 'hour' && !/^\d{1,2}-\d{1,2}$/.test(normDigits(r.b))) return 'بازهٔ ساعت را کامل کن';
      }
    }
    if (st.type === 'calc' && !st.var) return 'متغیر را انتخاب کن';
    if (st.type === 'random' && !st.to.length) return 'دست‌کم یک پیام اضافه کن';
    if (st.type === 'delay' && !(st.sec >= 1 && st.sec <= 30 * 86400)) return 'مکث بین ۱ ثانیه تا ۳۰ روز است';
    if (st.type === 'member' && !CHAT_RE.test(st.chat)) return 'نشانی کانال باید مثل ‎@channel باشد';
    if (st.type === 'notify' && !st.text.trim()) return 'متن خبر را بنویس';
    if (st.type === 'tag' && !st.tag) return 'نام برچسب را بنویس';
    if (st.type === 'save' && (!st.form.trim() || !st.vars.length)) return 'نام فرم و دست‌کم یک متغیر لازم است';
    return '';
  }
  function anyVarPick(title, current, onPick) {
    sheet(title, '', body => {
      R.doc.vars.forEach(v => optRow(body, 'var', '{' + v.name + '}', varSub(v), v.name === current ? ic('check') : null, () => { onPick(v.name); popSheet(); }, v.name === current ? 'on' : ''));
      label(body, 'آماده از تلگرام');
      const g = h('div', 'bk-chips');
      BUILTINS.forEach(n => g.appendChild(bt('bk-chip lg' + (n === current ? ' on' : ''), '{' + n + '}', () => { onPick(n); popSheet(); })));
      body.appendChild(g);
      primary(body, 'متغیر تازه', () => varSheet(null, v => { onPick(v.name); popSheet(); }), 's', 'plus');
    });
  }
  function targetRow(body, title, cur, noneText, onPick, ctx) {
    const t = find(cur);
    optRow(body, 'chat', t ? `«${t.name}»` : noneText, title, h('span', 'bk-opt-e brand', 'انتخاب'),
      () => msgPick(title, cur, id => { onPick(id); ctx.redraw(); }, { allowNone: true, exclude: R.edit }));
  }

  /* ---------- برگهٔ یک کار ---------- */
  function stepSheet(m, idx, fresh) {
    const isNew = idx < 0;
    const w = clone(isNew ? fresh : m.steps[idx]);
    const [, title, sub] = STEP_META[w.type];
    sheet(title, sub, (body, ctx) => {
      const T = w.type;
      if (T === 'if') {
        label(body, 'اگر');
        w.rules.forEach((r, ri) => {
          const row = bt('bk-rule', [h('span', 'grow', ruleText(r)), ic('pen')], () => ruleSheet(r, () => ctx.redraw()));
          if (w.rules.length > 1) row.appendChild(bt('bk-round sm', ic('x'), e => { e.stopPropagation(); w.rules.splice(ri, 1); ctx.redraw(); }, 'حذف قاعده'));
          body.appendChild(row);
          if (ri < w.rules.length - 1) body.appendChild(h('span', 'bk-andor', w.mode === 'or' ? 'یا' : 'و'));
        });
        const tools = h('div', 'bk-row2');
        if (w.rules.length < 6) tools.appendChild(bt('bk-mini', [ic('plus'), 'قاعدهٔ دیگر'], () => { const r = { k: 'var', a: (R.doc.vars[0] || {}).name || 'نام', op: '=', b: '' }; w.rules.push(r); ruleSheet(r, () => ctx.redraw()); }));
        if (w.rules.length > 1) tools.appendChild(seg([['and', 'همه (و)'], ['or', 'یکی (یا)']], w.mode, k => { w.mode = k; ctx.redraw(); }));
        body.appendChild(tools);
        label(body, 'بله، برو به');
        targetRow(body, 'اگر درست بود', w.yes, 'همین پیام فرستاده شود', id => { w.yes = id; }, ctx);
        label(body, 'وگرنه');
        targetRow(body, 'اگر درست نبود', w.no, 'همین پیام فرستاده شود', id => { w.no = id; }, ctx);
      }
      if (T === 'calc') {
        const v = R.doc.vars.find(x => x.name === w.var);
        optRow(body, 'var', w.var ? `{${w.var}}` : 'کدام متغیر؟', v ? varSub(v) : '', h('span', 'bk-opt-e brand', 'انتخاب'),
          () => varPick('کدام متغیر عوض شود؟', w.var, n => { w.var = n; const nv = R.doc.vars.find(x => x.name === n); if (!nv || nv.type !== 'number') w.op = '='; ctx.redraw(); }));
        if (v && v.type === 'number') body.appendChild(seg([['=', 'بشود'], ['+', 'اضافه شود'], ['-', 'کم شود']], w.op, k => { w.op = k; ctx.redraw(); }));
        field(body, 'مقدار', input(w.value, val => { w.value = val; }, { max: 300, ph: v && v.type === 'number' ? '۱۰ یا {امتیاز} × ۲' : 'متن، با {متغیر}' }),
          v && v.type === 'number' ? 'عدد یا فرمول؛ مثل {پاسخ درست} × ۱۰' : 'می‌توانی {متغیر} بگذاری');
      }
      if (T === 'random') {
        label(body, 'یکی از این پیام‌ها، شانسی');
        w.to.forEach((id, i) => {
          const row = h('div', 'bk-rule');
          row.append(h('span', 'grow', `«${mName(id) || '؟'}»`), bt('bk-round sm', ic('x'), () => { w.to.splice(i, 1); ctx.redraw(); }, 'حذف'));
          body.appendChild(row);
        });
        if (w.to.length < 8) primary(body, 'افزودن پیام', () => msgPick('کدام پیام؟', '', id => { if (id && !w.to.includes(id)) w.to.push(id); ctx.redraw(); }, { exclude: m.id }), 's', 'plus');
      }
      if (T === 'delay') {
        const u = UNITS.slice().reverse().find(([k]) => w.sec >= k && w.sec % k === 0) || UNITS[0];
        let unit = w._u || u[0];
        const val = Math.max(1, Math.round(w.sec / unit));
        field(body, 'چقدر صبر کند؟', input(faN(val).replace(/٬/g, ''), x => { w.sec = Math.round(toNum(x) * unit); }, { mode: 'numeric', ph: '۱' }));
        body.appendChild(seg(UNITS.map(([k, t]) => [String(k), t]), String(unit), k => { const n = Math.max(1, Math.round(w.sec / unit)); w._u = Number(k); w.sec = n * Number(k); ctx.redraw(); }));
        note(body, w.sec <= 8 ? 'مکث کوتاه: کاربر «در حال نوشتن…» می‌بیند و بعد پیام می‌رسد.' : 'پیام بعد از این مدت خودکار برای همان کاربر فرستاده می‌شود؛ مثلاً یادآوری فردا.');
      }
      if (T === 'member') {
        field(body, 'کانال یا گروه', input(w.chat, x => { w.chat = x.trim(); }, { ltr: true, ph: '@channel', max: 40 }), 'ربات تو باید ادمین همین کانال باشد');
        label(body, 'اگر عضو نبود');
        targetRow(body, 'برای کسی که عضو نیست', w.no, 'پیام «عضو شو» با دکمهٔ «✅ عضو شدم»', id => { w.no = id; }, ctx);
        note(body, 'کاربر بعد از عضویت «عضو شدم» را می‌زند و همین پیام برایش می‌آید. اگر ربات ادمین نباشد، کسی پشت در نمی‌ماند.');
      }
      if (T === 'notify') {
        field(body, 'متن خبر برای تو', input(w.text, x => { w.text = x; }, { area: true, max: 800 }), 'از همین ربات برایت می‌آید؛ می‌توانی {متغیر} بگذاری');
        const g = h('div', 'bk-chips');
        allVarNames().slice(0, 10).forEach(n => g.appendChild(bt('bk-chip lg', '{' + n + '}', () => { w.text += ' {' + n + '}'; ctx.redraw(); })));
        body.appendChild(g);
      }
      if (T === 'tag') {
        body.appendChild(seg([['add', 'برچسب بزن'], ['remove', 'بردار']], w.op, k => { w.op = k; ctx.redraw(); }));
        field(body, 'برچسب', input(w.tag, x => { w.tag = x.replace(/[#\s]/g, '').slice(0, 24); }, { ph: 'مثلاً vip یا خریدار', max: 24 }), 'بعداً با «شرط» می‌توانی کاربرهای این برچسب را جدا کنی');
      }
      if (T === 'save') {
        field(body, 'نام فرم', input(w.form, x => { w.form = x.slice(0, 40); }, { max: 40, ph: 'ثبت‌نام کلاس' }), 'جواب‌ها در تب «داده‌ها» زیر همین نام جمع می‌شوند');
        label(body, 'چه چیزهایی ثبت شود؟', faN(w.vars.length));
        const g = h('div', 'bk-chips');
        allVarNames().forEach(n => g.appendChild(bt('bk-chip lg' + (w.vars.includes(n) ? ' on' : ''), '{' + n + '}', () => {
          w.vars = w.vars.includes(n) ? w.vars.filter(x => x !== n) : w.vars.concat(n).slice(0, 20);
          ctx.redraw();
        })));
        body.appendChild(g);
        toggle(body, 'هر جواب تازه را برایم بفرست', 'در چت خودت با همین ربات', w.notify, v => { w.notify = v; });
      }
      const err = h('div', 'bk-err');
      primary(body, isNew ? 'افزودن کار' : 'ذخیره', () => {
        delete w._u;
        const p = stepProblem(w);
        if (p) { err.textContent = p; toast(p, true); return; }
        if (!m.steps) m.steps = [];
        if (isNew) m.steps.push(w); else m.steps[idx] = w;
        changed();
        popSheet();
      });
      body.appendChild(err);
      if (!isNew) {
        const tools = h('div', 'bk-tools');
        if (idx > 0) tools.appendChild(bt('bk-tool', [ic('up'), 'زودتر'], () => { const [x] = m.steps.splice(idx, 1); m.steps.splice(idx - 1, 0, x); changed(); popSheet(); }));
        if (idx < m.steps.length - 1) tools.appendChild(bt('bk-tool', [ic('down'), 'دیرتر'], () => { const [x] = m.steps.splice(idx, 1); m.steps.splice(idx + 1, 0, x); changed(); popSheet(); }));
        tools.appendChild(bt('bk-tool red', [ic('trash'), 'حذف کار'], () => { m.steps.splice(idx, 1); changed(); popSheet(); }));
        body.appendChild(tools);
      }
    }, { tall: T_TALL[w.type], onClose: () => drawEditor() });
  }
  const T_TALL = { if: true, save: true, notify: true };

  function ruleSheet(r, done) {
    sheet('قاعده', 'متغیر، برچسب، عضویت کانال، ساعت یا روز', (body, ctx) => {
      body.appendChild(seg(RULE_KINDS, r.k, k => {
        r.k = k;
        r.op = { var: '=', tag: 'has', member: 'in', hour: 'in', day: 'in' }[k];
        r.a = k === 'var' ? ((R.doc.vars[0] || {}).name || 'نام') : k === 'member' ? '@' : '';
        r.b = k === 'hour' ? '9-18' : '';
        ctx.redraw();
      }));
      if (r.k === 'var') {
        optRow(body, 'var', `{${r.a}}`, 'کدام متغیر؟', h('span', 'bk-opt-e brand', 'انتخاب'), () => anyVarPick('کدام متغیر؟', r.a, n => { r.a = n; ctx.redraw(); }));
        const ops = h('div', 'bk-ops');
        VAR_OPS.forEach(([k, t]) => ops.appendChild(bt('bk-op' + (r.op === k ? ' on' : ''), t, () => { r.op = k; ctx.redraw(); })));
        body.appendChild(ops);
        if (r.op !== 'empty' && r.op !== 'filled') field(body, 'مقدار', input(r.b, x => { r.b = x; }, { max: 120, ph: 'مثلاً ۵۰ یا تهران' }), 'عدد، متن یا {متغیر}');
      } else if (r.k === 'tag') {
        body.appendChild(seg([['has', 'دارد'], ['not', 'ندارد']], r.op, k => { r.op = k; ctx.redraw(); }));
        field(body, 'برچسب', input(r.b, x => { r.b = x.replace(/[#\s]/g, ''); }, { ph: 'vip', max: 24 }));
      } else if (r.k === 'member') {
        body.appendChild(seg([['in', 'عضو است'], ['not', 'عضو نیست']], r.op, k => { r.op = k; ctx.redraw(); }));
        field(body, 'کانال', input(r.a, x => { r.a = x.trim(); }, { ltr: true, ph: '@channel', max: 40 }), 'ربات باید ادمین کانال باشد');
      } else if (r.k === 'hour') {
        body.appendChild(seg([['in', 'بین'], ['not', 'بیرون از']], r.op, k => { r.op = k; ctx.redraw(); }));
        const [a, b] = (normDigits(r.b || '9-18').split('-').concat(['', ''])).map(x => x.trim());
        const row = h('div', 'bk-row2');
        const set = (x, y) => { r.b = `${parseInt(normDigits(x), 10) || 0}-${parseInt(normDigits(y), 10) || 0}`; };
        let A = a, B = b;
        row.append(field(h('div'), 'از ساعت', input(faDigits(A), x => { A = x; set(A, B); }, { mode: 'numeric', max: 2 })), field(h('div'), 'تا ساعت', input(faDigits(B), x => { B = x; set(A, B); }, { mode: 'numeric', max: 2 })));
        body.appendChild(row);
        note(body, 'به وقت ایران؛ مثلاً از ۲۲ تا ۸ یعنی شب.');
      } else if (r.k === 'day') {
        body.appendChild(seg([['in', 'این روزها'], ['not', 'غیر از این‌ها']], r.op, k => { r.op = k; ctx.redraw(); }));
        const on = (r.b || '').split(/[،,]/).map(x => x.trim()).filter(Boolean);
        const g = h('div', 'bk-chips');
        WEEK.forEach(d => g.appendChild(bt('bk-chip lg' + (on.includes(d) ? ' on' : ''), d, () => {
          const nx = on.includes(d) ? on.filter(x => x !== d) : on.concat(d);
          r.b = WEEK.filter(x => nx.includes(x)).join('،');
          ctx.redraw();
        })));
        body.appendChild(g);
      }
      primary(body, 'تأیید', () => { popSheet(); done(); });
    });
  }

  /* ---------- پرسش با اعتبارسنجی ---------- */
  function askSheet(m) {
    if (!m.wait || m.wait.kind !== 'var') {
      const v = R.doc.vars.find(x => !x.formula);
      m.wait = { kind: 'var', var: v ? v.name : '', to: (m.wait && m.wait.to) || '' };
      changed();
    }
    const w = m.wait;
    sheet('پرسش', 'جواب کاربر را می‌گیرد و نوعش را چک می‌کند', (body, ctx) => {
      optRow(body, 'var', w.var ? `جواب در {${w.var}}` : 'جواب در کدام متغیر؟', 'جوابِ درست اینجا ذخیره می‌شود', h('span', 'bk-opt-e brand', 'انتخاب'),
        () => varPick('جواب در کدام متغیر؟', w.var, n => { w.var = n; changed(); ctx.redraw(); }));
      label(body, 'نوع جواب');
      const g = h('div', 'bk-chips');
      CHECKS.forEach(([k, t]) => g.appendChild(bt('bk-chip lg' + ((w.check || 'text') === k ? ' on' : ''), t, () => {
        if (k === 'text') delete w.check; else w.check = k;
        if (k !== 'number') { delete w.min; delete w.max; }
        if (k !== 'choice') delete w.choices;
        changed();
        ctx.redraw();
      })));
      body.appendChild(g);
      if (w.check === 'number') {
        const row = h('div', 'bk-row2');
        const num = x => { const s = normDigits(x).trim(); return s === '' || isNaN(Number(s)) ? null : Number(s); };
        row.append(
          field(h('div'), 'کمترین', input(w.min != null ? faN(w.min).replace(/٬/g, '') : '', x => { const n = num(x); if (n == null) delete w.min; else w.min = n; changed(); }, { mode: 'decimal', ph: 'مثلاً ۷' })),
          field(h('div'), 'بیشترین', input(w.max != null ? faN(w.max).replace(/٬/g, '') : '', x => { const n = num(x); if (n == null) delete w.max; else w.max = n; changed(); }, { mode: 'decimal', ph: 'مثلاً ۹۰' })));
        body.appendChild(row);
      }
      if (w.check === 'choice') field(body, 'گزینه‌ها', input((w.choices || []).join('، '), x => { w.choices = x.split(/[،,]/).map(s => s.trim()).filter(Boolean).slice(0, 12); changed(); }, { ph: 'صبح، عصر، شب' }), 'با ، جدا کن؛ جواب باید یکی از این‌ها باشد');
      if (w.check === 'phone') note(body, 'راحت‌ترش: در همین پیام یک دکمهٔ کیبورد «📱 ارسال شماره» هم بگذار.');
      field(body, 'اگر جواب اشتباه بود', input(w.error || '', x => { w.error = x.slice(0, 200); changed(); }, { ph: checkError(w) }), 'خالی بگذاری، همین پیام پیش‌فرض می‌رود؛ ربات منتظر جواب درست می‌ماند');
      const to = find(w.to);
      optRow(body, 'chat', to ? `بعد از جواب: «${to.name}»` : 'بعد از جواب به کدام پیام؟', 'پرسش بعدی یا «ممنون»', h('span', 'bk-opt-e brand', 'انتخاب'),
        () => msgPick('بعد از جواب', w.to, id => { w.to = id; changed(); ctx.redraw(); }, { allowNone: true, exclude: m.id, newName: 'پرسش بعدی' }));
      note(body, 'چند پرسش پشت هم = یک فرم. در پیام آخر کار «ثبت در داده‌ها» بگذار تا جواب‌ها در تب «داده‌ها» جمع شوند.');
      primary(body, 'برداشتن پرسش', () => { m.wait = null; changed(); popSheet(); }, 'd', 'trash');
    }, { tall: true, onClose: () => drawEditor() });
  }

  /* ================================================================ تب داده‌ها */
  function when(t) {
    const d = new Date(t * 1000), now = new Date();
    const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(now) - day(d)) / 86400000);
    if (diff === 0) return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'دیروز';
    return d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });
  }
  function saveSteps(form) { return msgs().flatMap(m => (m.steps || []).filter(s => s.type === 'save' && (!form || s.form === form))); }
  function rowLine(r, short) {
    const vals = Object.entries(r.data).filter(([k]) => k !== 'نام');
    const row = h('div', 'bk-drow');
    const nm = r.data['نام'] || r.name || 'کاربر';
    row.appendChild(h('span', 'bk-dav', nm.trim()[0] || '؟'));
    const tx = h('span', 'grow');
    const t1 = h('b', '', nm);
    if (vals[0] && !short) t1.append(h('i', 'bk-dsep', '|'), document.createTextNode(faDigits(vals[0][1])));
    tx.appendChild(t1);
    if (vals.length > 1 && !short) tx.appendChild(h('span', '', vals.slice(1, 3).map(x => faDigits(x[1])).join(' · ')));
    row.append(tx, h('span', 'bk-dtime', when(r.at)));
    if (r.test) row.appendChild(h('span', 'bk-chip', 'تست'));
    return row;
  }
  async function exportForm(form) {
    try {
      const r = await P().api('bot/data_export', { id: R.appId, form });
      toast(`فایل اکسل (${faN(r.count)} ردیف) در چت ایزی‌ساز فرستاده شد`);
    } catch (err) { P().failed(err); }
  }
  function drawData(body) {
    const seg0 = h('div', 'bk-dtabs');
    const cur = R.dseg || 'forms';
    [['forms', 'فرم‌ها'], ['products', 'محصولات'], ['orders', 'سفارش‌ها']].forEach(([k, t]) => seg0.appendChild(bt('bk-dtab' + (k === cur ? ' on' : ''), t, () => { R.dseg = k; draw(); })));
    body.appendChild(seg0);
    const box = h('div', 'bk-dbox');
    box.appendChild(h('div', 'bk-load sm'));
    body.appendChild(box);
    if (cur === 'products') { drawProducts(box); return; }
    if (cur === 'orders') { drawOrders(box); return; }
    P().api('bot/data?id=' + encodeURIComponent(R.appId)).then(async d => {
      box.textContent = '';
      const forms = d.forms || [];
      const planned = [...new Set(saveSteps().map(s => s.form))].filter(f => !forms.some(x => x.form === f));
      if (!forms.length && !planned.length) {
        const e = h('div', 'bk-dempty');
        const tl = h('span', 'bk-tile teal lg');
        tl.appendChild(ic('inbox'));
        e.append(tl, h('b', '', 'هنوز فرمی نداری'), h('span', '', 'چند «پرسش» پشت هم بساز و در پیام آخر کار «ثبت در داده‌ها» بگذار؛ هر جواب اینجا می‌آید و خروجی اکسل دارد.'));
        e.appendChild(bt('bk-btn s', [ic('sparkle'), 'ساخت فرم ثبت‌نام با دستیار'], () => openAI({ text: 'یک فرم ثبت‌نام بساز: اسم، سن (عدد ۷ تا ۹۰) و شماره تماس بپرس، جواب‌ها را در داده‌ها ثبت کن و به من خبر بده', focus: true })));
        box.appendChild(e);
        return;
      }
      for (const f of forms) {
        const c = h('div', 'bk-dcard');
        const hd = h('div', 'bk-dhead');
        const tx = h('div', 'grow');
        tx.append(h('b', '', f.form), h('span', '', `${faN(f.count)} جواب · امروز ${faN(f.today)}`));
        hd.append(tx, bt('bk-mini', [ic('down'), 'خروجی اکسل'], () => exportForm(f.form)));
        c.appendChild(hd);
        const rows = h('div', 'bk-drows');
        rows.appendChild(h('div', 'bk-load sm'));
        c.appendChild(rows);
        if (f.count > 4) c.appendChild(bt('bk-dmore', ['همهٔ جواب‌ها', ic('chl')], () => formSheet(f)));
        const steps = saveSteps(f.form);
        if (steps.length) toggle(c, 'هر جواب تازه را برایم بفرست', 'در چت خودت با ربات؛ بعد از انتشار', steps.every(s => s.notify), v => { steps.forEach(s => { s.notify = v; }); changed(); });
        box.appendChild(c);
        P().api('bot/data?id=' + encodeURIComponent(R.appId) + '&form=' + encodeURIComponent(f.form)).then(x => {
          rows.textContent = '';
          x.rows.slice(0, 4).forEach(r => rows.appendChild(rowLine(r)));
        }).catch(() => { rows.textContent = ''; });
      }
      planned.forEach(f => {
        const c = h('div', 'bk-dcard ghost');
        const hd = h('div', 'bk-dhead');
        const tx = h('div', 'grow');
        tx.append(h('b', '', f), h('span', '', 'هنوز جوابی نرسیده؛ بعد از انتشار، جواب‌ها اینجا می‌آیند'));
        hd.appendChild(tx);
        c.appendChild(hd);
        box.appendChild(c);
      });
    }).catch(err => { box.textContent = ''; P().failed(err); });
  }
  function formSheet(f) {
    sheet(f.form, `${faN(f.count)} جواب`, async body => {
      body.appendChild(h('div', 'bk-load sm'));
      try {
        const x = await P().api('bot/data?id=' + encodeURIComponent(R.appId) + '&form=' + encodeURIComponent(f.form));
        body.textContent = '';
        primary(body, 'خروجی اکسل در چت ایزی‌ساز', () => exportForm(f.form), 's', 'down');
        x.rows.forEach(r => {
          const c = h('div', 'bk-dfull');
          c.appendChild(rowLine(r, true));
          const dl = h('dl', '');
          Object.entries(r.data).forEach(([k, v]) => { dl.append(h('dt', '', k), h('dd', '', faDigits(v || '—'))); });
          c.appendChild(dl);
          body.appendChild(c);
        });
      } catch (err) { P().failed(err); }
    }, { tall: true });
  }

  /* ================================================================ فروشگاه: محصولات، سفارش‌ها، تنظیمات */
  const ORDER_ST = [['', 'همه'], ['new', 'تازه'], ['pending', 'منتظر پرداخت'], ['paid', 'پرداخت‌شده'], ['sent', 'ارسال‌شده'], ['done', 'تحویل‌شده'], ['canceled', 'لغوشده']];
  const ST_TONE = { new: 'brand', pending: 'amber', paid: 'ok', sent: 'tg', done: 'ok', canceled: 'red' };
  const PAY_NAME = { card: 'کارت‌به‌کارت', cod: 'در محل', stars: 'ستاره' };
  function shopCfg() {
    if (!R.doc.shop) R.doc.shop = { pay: ['card', 'cod'], card: '', card_name: '', stars_rate: 0, ship: 0, coupons: [], ask_info: true, info_text: '', after: '', unit: 'تومان' };
    return R.doc.shop;
  }
  const money = n => `${faN(n)} ${shopCfg().unit || 'تومان'}`;
  const numIn = v => Math.max(0, Math.round(toNum(v)));
  function hasShopButton() { return msgs().some(m => m.rows.some(r => r.some(b => b.act.type === 'shop'))); }
  async function loadShop() {
    R.shop = await P().api('bot/shop?id=' + encodeURIComponent(R.appId));
    return R.shop;
  }
  function thumb(p, size) {
    const t = h('span', 'bk-pth');
    if (size) t.style.setProperty('--s', size + 'px');
    if (p && p.photo) { const im = h('img'); im.src = p.photo; im.alt = ''; im.loading = 'lazy'; t.appendChild(im); } else t.appendChild(ic('bag'));
    return t;
  }
  function stockText(p) {
    if (!p.active) return ['پنهان', 'mute'];
    if (p.stock === 0) return ['تمام شد', 'red'];
    if (p.stock < 0) return ['نامحدود', ''];
    return [`${faN(p.stock)} عدد`, ''];
  }

  function drawProducts(box) {
    loadShop().then(d => {
      box.textContent = '';
      if (!hasShopButton()) {
        const n = h('div', 'bk-dcard tip');
        const tx = h('div', 'grow');
        tx.append(h('b', '', 'فروشگاه هنوز در ربات دیده نمی‌شود'), h('span', '', 'دکمه‌های «🛍 محصولات» و «🧺 سبد خرید» را زیر پیام شروع بگذار.'));
        n.append(tx, bt('bk-mini', [ic('plus'), 'بگذار'], () => {
          const m = find(R.doc.start);
          if (!m) return;
          if (m.kb === 'reply') { toast('پیام شروع کیبورد پایین دارد؛ دکمه را دستی روی پیامی دیگر بگذار', true); return; }
          m.kb = 'inline';
          m.rows.push([newBtn('🛍 محصولات', { type: 'shop', cat: '' }), newBtn('🧺 سبد خرید', { type: 'cart' })]);
          m.rows[m.rows.length - 1][0].style = 'primary';
          changed();
          toast('دکمه‌های فروشگاه زیر پیام شروع آمد؛ بعد از «انتشار» در ربات دیده می‌شود');
          drawProducts(box);
        }));
        box.appendChild(n);
      }
      if (!d.products.length) {
        const e = h('div', 'bk-dempty');
        const tl = h('span', 'bk-tile green lg');
        tl.appendChild(ic('bag'));
        e.append(tl, h('b', '', 'اولین محصولت را اضافه کن'), h('span', '', 'عکس، قیمت، موجودی و دسته را یک بار این‌جا وارد کن؛ ربات خودش کارت محصول، ورق‌زدن، سبد خرید و سفارش را می‌سازد.'));
        e.appendChild(bt('bk-btn p', [ic('plus'), 'محصول تازه'], () => productSheet(null, box)));
        box.appendChild(e);
      } else {
        const c = h('div', 'bk-dcard flush');
        d.products.forEach(p => {
          const [stx, tone] = stockText(p);
          const r = bt('bk-prow' + (p.active ? '' : ' off'), [], () => productSheet(p, box));
          const tx = h('span', 'grow');
          const sub = h('span', '');
          sub.append(document.createTextNode(money(p.price)), h('i', 'bk-dsep', '|'), h('em', tone, stx));
          if (p.cat) sub.append(h('i', 'bk-dsep', '|'), document.createTextNode(p.cat));
          tx.append(h('b', '', p.title), sub);
          r.append(thumb(p, 54), tx, ic('chl', 'bk-row-go'));
          c.appendChild(r);
        });
        box.appendChild(c);
      }
      const s = shopCfg();
      const chips = h('div', 'bk-chips pad');
      const pays = s.pay.filter(x => (x !== 'card' || s.card) && (x !== 'stars' || s.stars_rate > 0)).map(x => PAY_NAME[x]);
      [['دسته‌ها: ' + faN(d.cats.length)], ['ارسال: ' + (s.ship ? money(s.ship) : 'رایگان')], ['پرداخت: ' + (pays.join(' و ') || 'تنظیم نشده')], s.coupons.length ? ['کد تخفیف: ' + faN(s.coupons.length)] : null]
        .filter(Boolean).forEach(([t]) => chips.appendChild(bt('bk-chip lg', t, () => shopSettings(box))));
      chips.appendChild(bt('bk-chip lg brand', [ic('sliders'), 'تنظیمات فروشگاه'], () => shopSettings(box)));
      box.appendChild(chips);
      if (s.pay.includes('card') && !s.card) note(box, 'کارت‌به‌کارت روشن است ولی شمارهٔ کارت وارد نشده؛ از «تنظیمات فروشگاه» واردش کن.', 'warn');
      if (d.products.length) box.appendChild(fab('محصول تازه', () => productSheet(null, box)));
    }).catch(err => { box.textContent = ''; P().failed(err); });
  }

  function productSheet(p, box) {
    const w = p ? clone(p) : { title: '', descr: '', price: 0, stock: -1, cat: '', photo: '', active: true };
    sheet(p ? 'محصول' : 'محصول تازه', p ? p.title : 'یک بار وارد کن؛ ربات کارتش را می‌سازد', (body, ctx) => {
      const ph = bt('bk-pphoto', [], () => pickImage(url => { w.photo = url; ctx.redraw(); }));
      if (w.photo) { const im = h('img'); im.src = w.photo; im.alt = ''; ph.appendChild(im); ph.appendChild(h('span', 'bk-pphoto-c', 'عوض کردن عکس')); }
      else ph.append(ic('image'), h('span', '', 'عکس محصول'));
      body.appendChild(ph);
      field(body, 'نام', input(w.title, v => { w.title = v.slice(0, 60); }, { max: 60, ph: 'کیک شکلاتی' }));
      field(body, 'توضیح', input(plain(w.descr), v => { w.descr = esc(v).slice(0, 700); }, { area: true, ph: 'اسفنج کاکائو، گاناش تلخ، ۱٫۵ کیلو' }));
      const pr = input(w.price ? faN(w.price).replace(/٬/g, '') : '', v => { w.price = numIn(v); hint.textContent = w.price ? money(w.price) : ''; }, { mode: 'numeric', ph: '۴۵۰۰۰۰' });
      const f = field(body, `قیمت (${shopCfg().unit || 'تومان'})`, pr);
      const hint = h('span', 'bk-f-h', w.price ? money(w.price) : '');
      f.appendChild(hint);
      label(body, 'موجودی');
      body.appendChild(seg([['inf', 'نامحدود'], ['n', 'تعداد مشخص']], w.stock < 0 ? 'inf' : 'n', k => { w.stock = k === 'inf' ? -1 : Math.max(0, w.stock); ctx.redraw(); }));
      if (w.stock >= 0) field(body, '', input(faN(w.stock).replace(/٬/g, ''), v => { w.stock = numIn(v); }, { mode: 'numeric', ph: '۸' }), 'با هر سفارش کم می‌شود؛ صفر = «تمام شد»');
      const ci = input(w.cat, v => { w.cat = v.slice(0, 30); }, { max: 30, ph: 'مثلاً کیک' });
      field(body, 'دسته (اختیاری)', ci, 'برای دکمه‌ای که فقط یک دسته را نشان می‌دهد');
      const cats = (R.shop && R.shop.cats) || [];
      if (cats.length) {
        const g = h('div', 'bk-chips');
        cats.forEach(c => g.appendChild(bt('bk-chip lg' + (w.cat === c ? ' on' : ''), c, () => { w.cat = w.cat === c ? '' : c; ctx.redraw(); })));
        body.appendChild(g);
      }
      toggle(body, 'نمایش در ربات', 'خاموش = پنهان، بی‌آنکه پاک شود', w.active, v => { w.active = v; });
      primary(body, p ? 'ذخیره' : 'افزودن محصول', async () => {
        if (!w.title.trim()) { toast('نام محصول را بنویس', true); return; }
        try {
          const r = await P().api('bot/product_save', { id: R.appId, product: w });
          R.shop = r;
          toast(p ? 'ذخیره شد' : `«${r.product.title}» اضافه شد`);
          closeAllSheets();
          drawProducts(box);
        } catch (err) { P().failed(err); }
      });
      if (p) {
        primary(body, 'حذف محصول', () => P().confirm(`«${p.title}» حذف شود؟ سفارش‌های قبلی دست نمی‌خورند.`, async () => {
          try { R.shop = await P().api('bot/product_del', { id: R.appId, product: p.id }); closeAllSheets(); drawProducts(box); } catch (err) { P().failed(err); }
        }, { danger: true, yes: 'حذف' }), 'd', 'trash');
      }
    }, { tall: true });
  }

  function shopSettings(box) {
    const s = shopCfg();
    const on = k => s.pay.includes(k);
    const setPay = (k, v) => { s.pay = v ? [...new Set(s.pay.concat(k))] : s.pay.filter(x => x !== k); changed(); };
    sheet('تنظیمات فروشگاه', 'بعد از «انتشار» در ربات اعمال می‌شود', (body, ctx) => {
      label(body, 'روش‌های پرداخت');
      toggle(body, '💳 کارت‌به‌کارت', 'مشتری عکس رسید را می‌فرستد و برای تو می‌آید', on('card'), v => { setPay('card', v); ctx.redraw(); });
      if (on('card')) {
        field(body, 'شمارهٔ کارت', input(s.card, v => { s.card = v; changed(); }, { ltr: true, mode: 'numeric', ph: '6037 9911 2233 4455', max: 24 }));
        field(body, 'به نام', input(s.card_name, v => { s.card_name = v.slice(0, 40); changed(); }, { ph: 'سارا محمدی', max: 40 }));
      }
      toggle(body, '🚚 پرداخت در محل', 'سفارش بی‌پرداخت ثبت می‌شود', on('cod'), v => setPay('cod', v));
      toggle(body, '⭐ ستارهٔ تلگرام', 'برای کالا و خدمات دیجیتال', on('stars'), v => { setPay('stars', v); ctx.redraw(); });
      if (on('stars')) field(body, 'هر ستاره چند تومان؟', input(s.stars_rate ? faN(s.stars_rate).replace(/٬/g, '') : '', v => { s.stars_rate = numIn(v); changed(); }, { mode: 'numeric', ph: '۵۰۰۰' }), 'مبلغ سفارش به ستاره تبدیل و گرد به بالا می‌شود');
      label(body, 'ارسال');
      field(body, `هزینهٔ ارسال (${s.unit || 'تومان'})`, input(s.ship ? faN(s.ship).replace(/٬/g, '') : '', v => { s.ship = numIn(v); changed(); }, { mode: 'numeric', ph: '۰ = رایگان' }));
      toggle(body, 'پرسیدن نام، شماره و نشانی', 'قبل از انتخاب پرداخت', s.ask_info, v => { s.ask_info = v; changed(); ctx.redraw(); });
      if (s.ask_info) field(body, 'متن پرسش (اختیاری)', input(s.info_text, v => { s.info_text = v.slice(0, 200); changed(); }, { ph: '📝 نام، شماره و نشانی‌ات را بفرست' }));
      label(body, 'کدهای تخفیف', faN(s.coupons.length));
      s.coupons.forEach((c, i) => {
        const row = h('div', 'bk-rule');
        row.append(h('b', 'grow ltr', c.code), h('span', 'bk-opt-e', c.pct ? `${faN(c.pct)}٪` : money(c.amount)), bt('bk-round sm', ic('x'), () => { s.coupons.splice(i, 1); changed(); ctx.redraw(); }, 'حذف'));
        body.appendChild(row);
      });
      if (s.coupons.length < 20) primary(body, 'کد تخفیف تازه', () => couponSheet(c => { s.coupons.push(c); changed(); ctx.redraw(); }), 's', 'plus');
      label(body, 'بعد از ثبت سفارش');
      const af = find(s.after);
      optRow(body, 'chat', af ? `«${af.name}»` : 'فقط پیام «سفارش ثبت شد»', 'مثلاً انتخاب زمان تحویل', h('span', 'bk-opt-e brand', 'انتخاب'),
        () => msgPick('بعد از ثبت سفارش', s.after, id => { s.after = id; changed(); ctx.redraw(); }, { allowNone: true, newName: 'زمان تحویل' }));
    }, { tall: true, onClose: () => { if (box && R.dseg === 'products') drawProducts(box); } });
  }
  function couponSheet(done) {
    const c = { code: '', pct: 10, amount: 0 };
    let kind = 'pct';
    sheet('کد تخفیف تازه', 'مشتری در سبد خرید واردش می‌کند', (body, ctx) => {
      field(body, 'کد', input(c.code, v => { c.code = v.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20); }, { ltr: true, ph: 'NAR10', max: 20 }), 'حروف انگلیسی و عدد');
      body.appendChild(seg([['pct', 'درصد'], ['amount', 'مبلغ ثابت']], kind, k => { kind = k; ctx.redraw(); }));
      if (kind === 'pct') field(body, 'چند درصد؟', input(faN(c.pct), v => { c.pct = Math.min(100, numIn(v)); }, { mode: 'numeric' }));
      else field(body, 'چقدر کم شود؟', input(c.amount ? faN(c.amount).replace(/٬/g, '') : '', v => { c.amount = numIn(v); }, { mode: 'numeric', ph: '۵۰۰۰۰' }));
      primary(body, 'افزودن', () => {
        if (c.code.length < 2) { toast('کد دست‌کم ۲ حرف', true); return; }
        const out = kind === 'pct' ? { code: c.code, pct: c.pct, amount: 0 } : { code: c.code, pct: 0, amount: c.amount };
        if (!out.pct && !out.amount) { toast('مقدار تخفیف را بنویس', true); return; }
        if (shopCfg().coupons.some(x => x.code === out.code)) { toast('این کد را قبلاً ساخته‌ای', true); return; }
        popSheet();
        done(out);
      });
    });
  }

  function drawOrders(box) {
    const flt = R.ofilter || '';
    P().api('bot/orders?id=' + encodeURIComponent(R.appId) + (flt ? '&status=' + flt : '')).then(d => {
      box.textContent = '';
      const cn = d.counts;
      const top = h('div', 'bk-stats');
      [[cn.today, 'سفارش امروز'], [cn.new + cn.pending, 'منتظر کار تو'], [cn.today_total, 'فروش امروز', true]].forEach(([v, t, m]) => {
        const c = h('div', 'bk-stat');
        const big = v >= 1e6 ? (Math.round(v / 1e5) / 10).toLocaleString('fa-IR') + ' میلیون' : v >= 1e3 ? faN(Math.round(v / 1e3)) + ' هزار' : faN(v);
        c.append(h('b', '', m ? big : faN(v)), h('span', '', t));
        top.appendChild(c);
      });
      box.appendChild(top);
      const chips = h('div', 'bk-chips pad scroll');
      ORDER_ST.forEach(([k, t]) => {
        const n = k ? cn[k] : null;
        if (k && !n && k !== flt) return;
        chips.appendChild(bt('bk-chip lg' + (k === flt ? ' on' : ''), t + (n ? ' ' + faN(n) : ''), () => { R.ofilter = k; drawOrders(box); }));
      });
      box.appendChild(chips);
      if (!d.orders.length) {
        const e = h('div', 'bk-dempty');
        const tl = h('span', 'bk-tile brand lg');
        tl.appendChild(ic('cart'));
        e.append(tl, h('b', '', flt ? 'سفارشی با این وضعیت نیست' : 'هنوز سفارشی نرسیده'), h('span', '', 'هر سفارش شماره دارد و این‌جا با وضعیتش می‌آید؛ همان لحظه هم در چت ربات برایت خبر می‌آید.'));
        box.appendChild(e);
        return;
      }
      const c = h('div', 'bk-dcard flush');
      d.orders.forEach(o => {
        const r = bt('bk-orow', [], () => orderSheet(o, box));
        const tx = h('span', 'grow');
        tx.append(h('b', '', `#${faDigits(o.num)} · ${o.name || 'مشتری'}`), h('span', '', `${money(o.total)} · ${PAY_NAME[o.pay]} · ${o.items.length > 1 ? faN(o.items.length) + ' قلم' : (o.items[0] || {}).title || ''}`));
        r.append(tx, h('span', 'bk-st ' + (ST_TONE[o.status] || ''), (ORDER_ST.find(x => x[0] === o.status) || ['', o.status])[1]), h('span', 'bk-dtime', when(o.at)));
        if (o.test) r.appendChild(h('span', 'bk-chip', 'تست'));
        c.appendChild(r);
      });
      box.appendChild(c);
    }).catch(err => { box.textContent = ''; P().failed(err); });
  }
  function orderSheet(o, box) {
    sheet(`سفارش #${faDigits(o.num)}`, `${o.name || 'مشتری'}${o.username ? ' · @' + o.username : ''} · ${when(o.at)}`, body => {
      const c = h('div', 'bk-dfull');
      const dl = h('dl', '');
      o.items.forEach(x => dl.append(h('dt', '', `${faN(x.qty)}× ${x.title}`), h('dd', '', money(x.price * x.qty))));
      if (o.discount) dl.append(h('dt', '', `تخفیف ${o.coupon}`), h('dd', '', '−' + money(o.discount)));
      if (o.ship) dl.append(h('dt', '', 'ارسال'), h('dd', '', money(o.ship)));
      dl.append(h('dt', '', 'جمع'), h('dd', 'b', money(o.total)));
      dl.append(h('dt', '', 'پرداخت'), h('dd', '', PAY_NAME[o.pay] + (o.pay === 'stars' ? ` (${faN(o.stars)} ستاره)` : '')));
      c.appendChild(dl);
      body.appendChild(c);
      if (o.info) { label(body, 'نام، شماره و نشانی'); body.appendChild(h('div', 'bk-dinfo', o.info)); }
      if (o.pay === 'card') note(body, o.receipt ? 'عکس رسید را همان لحظه در چت ربات برایت فرستادیم؛ بعد از دیدنش «پرداخت تأیید شد» را بزن.' : 'هنوز رسیدی نرسیده.', o.receipt ? '' : 'warn');
      label(body, 'وضعیت', (ORDER_ST.find(x => x[0] === o.status) || ['', ''])[1]);
      if (o.status === 'canceled') { note(body, 'این سفارش لغو شده و موجودی‌اش برگشته.'); return; }
      const set = st => async () => {
        try {
          const r = await P().api('bot/order_status', { id: R.appId, order: o.id, status: st });
          toast('وضعیت: ' + (ORDER_ST.find(x => x[0] === st) || ['', st])[1] + ' · به مشتری خبر دادیم');
          Object.assign(o, r.order);
          closeAllSheets();
          drawOrders(box);
        } catch (err) { P().failed(err); }
      };
      const g = h('div', 'bk-ostates');
      [['paid', 'check', 'پرداخت تأیید شد'], ['sent', 'send', 'ارسال شد'], ['done', 'inbox', 'تحویل شد']].forEach(([k, i, t]) => {
        g.appendChild(bt('bk-ost' + (o.status === k ? ' on' : ''), [ic(i), t], o.status === k ? null : set(k)));
      });
      body.appendChild(g);
      primary(body, 'لغو سفارش', () => P().confirm(`سفارش #${faDigits(o.num)} لغو شود؟ موجودی برمی‌گردد و به مشتری خبر می‌دهیم.`, set('canceled'), { danger: true, yes: 'لغو' }), 'd', 'ban');
    }, { tall: true });
  }

  /* ================================================================ متغیرها و فرمول */
  const TYPES = [['text', 'متن'], ['number', 'عدد'], ['date', 'تاریخ'], ['bool', 'بله/خیر']];
  const TYPE_IC = { text: 'type', number: 'calc', date: 'pin', bool: 'check' };
  function varSub(v) {
    const t = (TYPES.find(x => x[0] === v.type) || TYPES[0])[1];
    if (v.formula) return 'فرمول · ' + v.formula;
    return `${t} · ${v.scope === 'bot' ? 'کل ربات' : 'هر کاربر'}` + (v.init ? ` · از ${v.type === 'number' ? fmtNum(toNum(v.init)) : v.init}` : '');
  }
  function drawVars(body) {
    const user = R.doc.vars.filter(v => v.scope !== 'bot' || v.formula);
    const bot = R.doc.vars.filter(v => v.scope === 'bot' && !v.formula);
    const add = bt('bk-link', '+ متغیر تازه', () => varSheet(null, () => draw()));
    secT(body, 'هر کاربر، مقدار خودش', add);
    const card = list => {
      const c = h('div', 'bk-card');
      if (!list.length) c.appendChild(h('p', 'bk-empty-s', 'هنوز چیزی نیست'));
      list.forEach(v => {
        const r = bt('bk-vrow', [], () => varSheet(v, () => draw()));
        const tl = h('span', 'bk-tile ' + (v.formula ? 'rose' : 'brand'));
        tl.appendChild(ic(v.formula ? 'var' : TYPE_IC[v.type]));
        const tx = h('span', 'grow');
        tx.append(h('span', 'bk-var static', '{' + v.name + '}'), h('span', 'bk-vrow-s', varSub(v)));
        r.append(tl, tx, h('b', 'bk-vrow-v', sampleOf(v.name)));
        c.appendChild(r);
      });
      return c;
    };
    body.appendChild(card(user));
    secT(body, 'یکی برای کل ربات', h('span', 'bk-sec-s', 'مثل شمارندهٔ ثبت‌نام'));
    body.appendChild(card(bot));
    secT(body, 'آماده از تلگرام');
    const chips = h('div', 'bk-chips pad');
    BUILTINS.forEach(n => chips.appendChild(h('span', 'bk-chip lg', '{' + n + '}')));
    body.appendChild(chips);
    note(body, 'هر جای متن پیام یا دکمه «{» بزن تا متغیر بگذاری. مقدار متغیرها با دکمه‌ها، کیبورد (شماره، موقعیت) یا «منتظر جواب» عوض می‌شود.');
  }
  function varSheet(v, after) {
    const isNew = !v;
    const w = v ? clone(v) : { name: '', type: 'text', scope: 'user', init: '', formula: '' };
    let src = w.formula ? 'f' : 'c';
    sheet(isNew ? 'متغیر تازه' : 'متغیر', isNew ? 'چیزی که ربات یادش می‌ماند' : '{' + v.name + '}', (body, ctx) => {
      const ni = input(w.name, val => { w.name = val.replace(/[{}]/g, '').slice(0, 24); }, { ph: 'مثلاً: امتیاز', max: 24 });
      field(body, 'نام', ni);
      label(body, 'نوع');
      body.appendChild(seg(TYPES, w.type, k => { w.type = k; if (k !== 'number') src = 'c'; ctx.redraw(); }));
      if (src === 'c') {
        label(body, 'برای');
        body.appendChild(seg([['user', 'هر کاربر'], ['bot', 'کل ربات']], w.scope, k => { w.scope = k; ctx.redraw(); }));
      }
      label(body, 'مقدار از کجا؟');
      body.appendChild(seg(w.type === 'number' ? [['c', 'مقدار اول'], ['f', 'فرمول']] : [['c', 'مقدار اول']], src, k => { src = k; ctx.redraw(); }));
      if (src === 'c') {
        field(body, 'مقدار اول', input(w.init, val => { w.init = val; }, { ph: w.type === 'number' ? '۰' : '', mode: w.type === 'number' ? 'decimal' : '' }),
          'بعداً با دکمه، کیبورد یا «منتظر جواب» عوض می‌شود');
      } else formulaBuilder(body, w, v ? v.name : '');
      const row = h('div', 'bk-row2');
      if (!isNew) row.appendChild(bt('bk-btn d', [ic('trash'), 'حذف'], () => {
        R.doc.vars = R.doc.vars.filter(x => x.name !== v.name);
        changed();
        popSheet();
        if (after) after();
      }));
      row.appendChild(bt('bk-btn p', 'ذخیره', () => {
        const name = w.name.trim();
        if (!name) { toast('نام متغیر را بنویس', true); return; }
        if (BUILTINS.includes(name) || R.doc.vars.some(x => x.name === name && (!v || x.name !== v.name))) { toast('این نام قبلاً هست', true); return; }
        if (src === 'f') {
          const err = checkFormula(w.formula, name);
          if (err) { toast(err, true); return; }
        } else w.formula = '';
        if (w.formula) w.scope = 'user';
        const out = { name, type: w.type, scope: w.scope, init: w.init, formula: src === 'f' ? w.formula : '' };
        if (isNew) R.doc.vars.push(out);
        else {
          const i = R.doc.vars.findIndex(x => x.name === v.name);
          R.doc.vars[i] = out;
          if (v.name !== name) renameVar(v.name, name);
        }
        changed();
        popSheet();
        if (after) after(out);
      }));
      body.appendChild(row);
    }, { tall: src === 'f' });
  }
  function renameVar(a, b) {
    const re = new RegExp('\\{' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
    R.doc.msgs.forEach(m => {
      m.text = m.text.replace(re, '{' + b + '}');
      m.rows.concat(m.keys).forEach(r => r.forEach(x => {
        x.text = x.text.replace(re, '{' + b + '}');
        if (x.act.text) x.act.text = x.act.text.replace(re, '{' + b + '}');
        if (x.act.var === a) x.act.var = b;
        if (x.act.set && x.act.set.var === a) x.act.set.var = b;
      }));
      if (m.wait && m.wait.var === a) m.wait.var = b;
    });
    R.doc.vars.forEach(v => { if (v.formula) v.formula = v.formula.replace(re, '{' + b + '}'); });
  }
  function formulaBuilder(body, w, self) {
    const box = h('div', 'bk-fx');
    const ta = h('textarea', 'bk-fx-in');
    ta.value = w.formula;
    ta.rows = 2;
    ta.placeholder = '{قیمت} × {تعداد} − ۱۰٪';
    const res = h('div', 'bk-fx-res');
    const upd = () => {
      w.formula = ta.value;
      res.textContent = '';
      const err = ta.value.trim() ? checkFormula(ta.value, self || w.name) : '';
      if (!ta.value.trim()) { res.append(h('span', '', 'برای من'), h('b', '', '—')); return; }
      if (err) { res.classList.add('err'); res.append(h('span', '', err)); return; }
      res.classList.remove('err');
      let val = '…';
      try { val = fmtNum(evalFormula(ta.value, sampleNum)); } catch (e) { val = e.message; }
      res.append(h('span', '', 'با مقدارهای اول'), h('b', '', val));
    };
    ta.addEventListener('input', upd);
    const ins = s => {
      const a = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
      const b2 = ta.selectionEnd == null ? a : ta.selectionEnd;
      ta.value = ta.value.slice(0, a) + s + ta.value.slice(b2);
      ta.selectionStart = ta.selectionEnd = a + s.length;
      upd();
    };
    box.append(ta, res);
    body.appendChild(box);
    const vchips = h('div', 'bk-chips');
    R.doc.vars.filter(v => v.type === 'number' && v.name !== self).forEach(v => vchips.appendChild(bt('bk-chip', '{' + v.name + '}', () => ins('{' + v.name + '}'))));
    if (!vchips.childNodes.length) vchips.appendChild(h('span', 'bk-hint', 'اول متغیر عددی بساز تا این‌جا بیاید'));
    body.appendChild(vchips);
    const fns = h('div', 'bk-chips');
    [['٪', '٪'], ['گرد', 'گرد()'], ['کمینه', 'کمینه(، )'], ['بیشینه', 'بیشینه(، )'], ['تصادفی', 'تصادفی(۱، ۱۰)'], ['قدرمطلق', 'قدرمطلق()']].forEach(([t, s]) => fns.appendChild(bt('bk-chip', t, () => ins(s))));
    body.appendChild(fns);
    const pad = h('div', 'bk-pad');
    ['۷', '۸', '۹', '÷', '۴', '۵', '۶', '×', '۱', '۲', '۳', '−', '(', '۰', ')', '+'].forEach(k => {
      const b = bt('bk-padk' + ('÷×−+'.includes(k) ? ' op' : ''), k, () => ins('÷×−+'.includes(k) ? ` ${k} ` : k));
      b.addEventListener('mousedown', e => e.preventDefault());
      pad.appendChild(b);
    });
    body.appendChild(pad);
    upd();
  }

  /* فرمول — همان قاعدهٔ app/botkit/schema.py (برای نتیجهٔ زنده) */
  const FA_D = '۰۱۲۳۴۵۶۷۸۹';
  function normDigits(s) { return String(s).replace(/[۰-۹]/g, d => FA_D.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').replace(/[−–]/g, '-').replace(/٪/g, '%').replace(/٬/g, ''); }
  function toNum(v) { const n = parseFloat(normDigits(v || '0').replace(/,/g, '')); return isNaN(n) ? 0 : n; }
  function fmtNum(v) {
    const r = Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : Math.round(v * 100) / 100;
    return r.toLocaleString('fa-IR', { maximumFractionDigits: 2 });
  }
  const FNS = {
    'گرد': a => a.length > 1 ? Math.round(a[0] * 10 ** a[1]) / 10 ** a[1] : Math.round(a[0]), 'کمینه': a => Math.min(...a), 'بیشینه': a => Math.max(...a),
    'تصادفی': a => a.length > 1 ? Math.floor(Math.min(a[0], a[1]) + Math.random() * (Math.abs(a[1] - a[0]) + 1)) : Math.random(),
    'قدرمطلق': a => Math.abs(a[0]), 'پایین': a => Math.floor(a[0]), 'بالا': a => Math.ceil(a[0]),
  };
  function tokens(src) {
    const s = normDigits(src);
    const re = /\s*(?:(\d+(?:\.\d+)?)|\{([^{}]{1,24})\}|([+\-*/×÷()%,،^])|([^\s\d{}()+\-*/×÷%,،^]+))/y;
    const out = [];
    let pos = 0;
    while (pos < s.length) {
      if (!s.slice(pos).trim()) break;
      re.lastIndex = pos;
      const m = re.exec(s);
      if (!m || re.lastIndex === pos) throw new Error('فرمول درست نیست');
      if (m[1] != null) out.push(['num', parseFloat(m[1])]);
      else if (m[2] != null) out.push(['var', m[2].trim()]);
      else if (m[3] != null) out.push(['op', { '×': '*', '÷': '/', '،': ',' }[m[3]] || m[3]]);
      else out.push(['fn', m[4]]);
      pos = re.lastIndex;
    }
    return out;
  }
  function evalFormula(src, get) {
    const t = tokens(src);
    if (!t.length) throw new Error('فرمول خالی است');
    let i = 0;
    const peek = () => t[i] || [null, null];
    const is = (k, v) => peek()[0] === k && peek()[1] === v;
    const eat = (k, v) => { if (peek()[0] === k && (v == null || peek()[1] === v)) return t[i++][1]; throw new Error('فرمول ناقص است'); };
    const bare = start => {
      const part = t.slice(start, i);
      if (!part.length || !(part[part.length - 1][0] === 'op' && part[part.length - 1][1] === '%')) return false;
      let d = 0;
      for (const [k, v] of part) { if (k === 'op' && v === '(') d++; else if (k === 'op' && v === ')') d--; else if (!d && k === 'op' && '*/^'.includes(v)) return false; }
      return true;
    };
    const expr = () => {
      let v = term();
      while (is('op', '+') || is('op', '-')) {
        const op = eat('op');
        const st = i;
        let r = term();
        if (bare(st)) r = v * r;
        v = op === '+' ? v + r : v - r;
      }
      return v;
    };
    const term = () => {
      let v = power();
      while (is('op', '*') || is('op', '/')) { const op = eat('op'); const r = power(); if (op === '/' && r === 0) throw new Error('تقسیم بر صفر'); v = op === '*' ? v * r : v / r; }
      return v;
    };
    const power = () => { let v = unary(); if (is('op', '^')) { eat('op'); v = v ** unary(); } return v; };
    const unary = () => { if (is('op', '-')) { eat('op'); return -unary(); } if (is('op', '+')) { eat('op'); return unary(); } return post(); };
    const post = () => { let v = atom(); while (is('op', '%')) { eat('op'); v /= 100; } return v; };
    const atom = () => {
      const [k, v] = peek();
      if (k === 'num') { i++; return v; }
      if (k === 'var') { i++; return get(v); }
      if (k === 'op' && v === '(') { i++; const r = expr(); eat('op', ')'); return r; }
      if (k === 'fn') {
        i++;
        const fn = FNS[v];
        if (!fn) throw new Error(`تابع «${v}» را نمی‌شناسم`);
        eat('op', '(');
        const args = [expr()];
        while (is('op', ',')) { eat('op'); args.push(expr()); }
        eat('op', ')');
        return fn(args);
      }
      throw new Error('فرمول ناقص است');
    };
    const v = expr();
    if (i !== t.length) throw new Error('فرمول درست نیست');
    if (!isFinite(v)) throw new Error('نتیجه عدد نیست');
    return v;
  }
  function checkFormula(src, self) {
    let t;
    try { t = tokens(src); } catch (e) { return e.message; }
    const names = new Set(varNames().concat(BUILTINS));
    for (const [k, v] of t) {
      if (k === 'var' && !names.has(v)) return `متغیر «${v}» تعریف نشده`;
      if (k === 'var' && v === self) return 'فرمول نمی‌تواند به خودش برگردد';
    }
    try { evalFormula(src, () => 1); } catch (e) { if (!/صفر/.test(e.message)) return e.message; }
    return '';
  }

  /* ================================================================ ایموجی پریمیوم */
  function drawEmoji(body) {
    secT(body, `ایموجی‌های پریمیوم من · ${faN(R.emoji.length)}`);
    const g = h('div', 'bk-egrid big');
    R.emoji.forEach(e => g.appendChild(bt('bk-etile pe', e.alt, () => emojiInfo(e))));
    g.appendChild(bt('bk-etile add', ic('plus'), addFromTelegram, 'افزودن'));
    body.appendChild(g);
    if (R.d.premium) note(body, 'نمایش داده می‌شود: حساب تو پریمیوم دارد. اگر پریمیوم تمام شود، ایموجی معمولی جایش دیده می‌شود.', 'ok');
    else note(body, 'حساب تو پریمیوم نیست. تلگرام ایموجی پریمیوم ربات را فقط وقتی نشان می‌دهد که سازندهٔ ربات پریمیوم باشد؛ تا آن موقع کاربرها ایموجی معمولی می‌بینند.', 'warn');
    const acts = h('div', 'bk-stack');
    primary(acts, 'افزودن از تلگرام', addFromTelegram, 't', 'tg');
    primary(acts, 'افزودن یک بسته با لینک', packSheet, 'o', 'link');
    body.appendChild(acts);
    note(body, 'ایموجی‌ها را در چت ایزی‌ساز می‌فرستی؛ «برگشت به ربات‌ساز» تو را همین‌جا برمی‌گرداند.');
  }
  function addFromTelegram() { P().openBot('emoji_' + R.appId); }
  function packSheet() {
    let link = '';
    sheet('افزودن بسته', 'لینک بستهٔ ایموجی را بچسبان', body => {
      field(body, 'لینک بسته', input('', v => { link = v; }, { ltr: true, ph: 't.me/addemoji/…' }));
      primary(body, 'افزودن', async () => {
        try {
          const res = await P().api('bot/emoji_pack', { id: R.appId, link });
          R.emoji = res.emoji;
          toast(res.added ? `${faN(res.added)} ایموجی اضافه شد` : 'همه از قبل بودند');
          closeAllSheets();
          draw();
        } catch (err) { P().failed(err); }
      });
    });
  }
  function emojiInfo(e) {
    sheet('ایموجی پریمیوم', e.pack ? `از بستهٔ ${e.pack}` : 'از چت', body => {
      const big = h('div', 'bk-ebig', e.alt);
      body.appendChild(big);
      note(body, 'در ربات، تصویر متحرک خود ایموجی پریمیوم دیده می‌شود؛ این‌جا ایموجی معمولی‌اش را نشان می‌دهیم.');
      primary(body, 'حذف از کتابخانه', async () => {
        try {
          const res = await P().api('bot/emoji_del', { id: R.appId, emoji: e.id });
          R.emoji = res.emoji;
          closeAllSheets();
          draw();
        } catch (err) { P().failed(err); }
      }, 'd', 'trash');
    });
  }

  /* ================================================================ اجزای آماده */
  const COMPS = {
    menu: { icon: 'list', title: 'منوی اصلی', sub: 'کیبورد همیشگی با چند بخش', color: 'brand' },
    faq: { icon: 'help', title: 'سؤالات متداول', sub: 'هر پرسش یک دکمه', color: 'teal' },
    coupon: { icon: 'gift', title: 'کد تخفیف', sub: 'کپی کد با یک دکمه', color: 'gold' },
    support: { icon: 'inbox', title: 'پشتیبانی', sub: 'پیام کاربر به تو، جواب تو به او', color: 'tg' },
  };
  const SOON = [['tg', 'عضویت اجباری'], ['phone', 'کاتالوگ محصول'], ['users', 'دعوت دوستان'], ['poll', 'نظرسنجی']];
  function compDefaults(type) {
    return ({
      menu: { text: 'از منوی پایین انتخاب کن 👇', items: ['📚 دوره‌ها', '💰 قیمت‌ها', '📞 تماس با ما', 'ℹ️ درباره ما'], after_start: true },
      faq: { intro: 'سؤالت کدومه؟ 👇', items: [{ q: 'ساعت کاری؟', a: 'هر روز ۹ تا ۱۸' }, { q: 'چطور سفارش بدم؟', a: 'از دکمهٔ سفارش در منو' }], style: 'buttons', support: true, label: '❓ سؤالات متداول' },
      coupon: { text: '🎁 کد تخفیف ویژه برای تو:', code: 'OFF20', note: 'تا آخر ماه', label: '🎁 کد تخفیف' },
      support: { ask: 'پیامت رو بنویس؛ همین‌جا جواب می‌دیم 💬', done: 'پیامت رسید ✅ به‌زودی جواب می‌دیم.', label: '💬 پشتیبانی' },
    })[type];
  }
  /* پیام‌های هر جزء با شناسهٔ ثابت (<جزء>_<شماره>) تا لینک‌های بیرونی نشکنند */
  function compMsgs(c) {
    const s = c.settings;
    const id = i => `${c.id}_${i}`;
    const prev = new Map(msgs().filter(m => m.group === c.id).map(m => [m.id, m]));
    const mk = (i, name, extra) => {
      const old = prev.get(id(i));
      const m = newMsg(name, Object.assign({ id: id(i), group: c.id }, extra));
      if (old) m.opts = clone(old.opts);   // تنظیمات دستی پیام (افکت، در حال نوشتن…) با تغییر جزء نمی‌پرد
      return m;
    };
    const back = (to, n) => [{ id: `${c.id}r${n}`, text: '↩️ برگشت', style: '', icon: '', act: { type: 'goto', to: id(to) } }];
    if (c.type === 'menu') {
      const items = (s.items || []).filter(Boolean).slice(0, 10);
      const keys = [];
      items.forEach((t, i) => { const k = { id: `${c.id}k${i}`, text: t, style: '', icon: '', act: { type: 'text', to: id(i + 1) } }; if (i % 2 === 0) keys.push([k]); else keys[keys.length - 1].push(k); });
      const out = [mk(0, c.title || 'منوی اصلی', { text: esc(s.text || ''), kb: 'reply', keys, kbopt: { resize: true, once: false, persist: true, placeholder: '' } })];
      items.forEach((t, i) => {
        const old = prev.get(id(i + 1));
        out.push(old ? Object.assign(clone(old), { name: t.replace(/^\p{Extended_Pictographic}️?\s*/u, '') || t }) : mk(i + 1, t.replace(/^\p{Extended_Pictographic}️?\s*/u, '') || t, { text: `دربارهٔ «${esc(t)}» این‌جا بنویس.` }));
      });
      return out;
    }
    if (c.type === 'faq') {
      const items = (s.items || []).filter(x => x.q).slice(0, 20);
      const rows = items.map((x, i) => [{ id: `${c.id}q${i}`, text: x.q, style: '', icon: '', act: { type: 'goto', to: id(i + 1) } }]);
      if (s.support && R.doc.comps.some(x => x.type === 'support')) {
        const sup = R.doc.comps.find(x => x.type === 'support');
        rows.push([{ id: `${c.id}sp`, text: 'جوابم را نگرفتم 💬', style: 'primary', icon: '', act: { type: 'goto', to: `${sup.id}_0` } }]);
      }
      const out = [mk(0, c.title || 'سؤالات متداول', { text: esc(s.intro || ''), kb: 'inline', rows })];
      items.forEach((x, i) => out.push(mk(i + 1, x.q.slice(0, 40), { text: `<b>${esc(x.q)}</b>\n${esc(x.a || '')}`, kb: 'inline', rows: [back(0, i)] })));
      return out;
    }
    if (c.type === 'coupon') {
      return [mk(0, c.title || 'کد تخفیف', {
        text: `${esc(s.text || '')}\n<code>${esc(s.code || '')}</code>` + (s.note ? `\n${esc(s.note)}` : ''), kb: 'inline',
        rows: [[{ id: `${c.id}cp`, text: '📋 کپی کد', style: 'success', icon: '', act: { type: 'copy', text: s.code || '' } }]],
      })];
    }
    return [
      mk(0, c.title || 'پشتیبانی', { text: esc(s.ask || ''), wait: { kind: 'support', to: id(1) } }),
      mk(1, 'رسید پشتیبانی', { text: esc(s.done || '') }),
    ];
  }
  function applyComp(c) {
    const fresh = compMsgs(c);
    const ids = new Set(fresh.map(m => m.id));
    // پیام‌های قدیمی جزء که دیگر نیستند حذف، بقیه جایگزین
    msgs().filter(m => m.group === c.id && !ids.has(m.id)).forEach(m => removeMsg(m.id));
    fresh.forEach(m => {
      const i = R.doc.msgs.findIndex(x => x.id === m.id);
      if (i >= 0) R.doc.msgs[i] = m; else R.doc.msgs.push(m);
    });
  }
  function linkFromStart(c, labelText) {
    const st = find(R.doc.start);
    if (!st || st.group) return;
    const entry = `${c.id}_0`;
    if (c.type === 'menu') { if (!st.then) st.then = entry; return; }
    if (st.kb === 'reply') return;
    if (st.rows.some(r => r.some(b => b.act.to === entry))) return;
    st.kb = 'inline';
    st.rows.push([newBtn(labelText || c.title, { type: 'goto', to: entry })]);
  }
  function installComp(type) {
    const meta = COMPS[type];
    const c = { id: uid('c').slice(0, 7), type, title: meta.title, settings: compDefaults(type) };
    R.doc.comps.push(c);
    applyComp(c);
    if (c.settings.after_start !== false) linkFromStart(c, c.settings.label);
    changed();
    return c;
  }
  function unpackComp(c) {
    P().confirm(`«${c.title}» به پیام‌های معمولی تبدیل شود؟ بعد هر چیزش را دستی عوض می‌کنی ولی دیگر برگهٔ تنظیمات جزء را ندارد.`, () => {
      msgs().forEach(m => { if (m.group === c.id) m.group = ''; });
      R.doc.comps = R.doc.comps.filter(x => x.id !== c.id);
      changed();
      closeAllSheets();
      draw();
    }, { yes: 'باز کن' });
  }
  function removeComp(c) {
    P().confirm(`جزء «${c.title}» و پیام‌هایش حذف شود؟`, () => {
      msgs().filter(m => m.group === c.id).forEach(m => removeMsg(m.id));
      R.doc.comps = R.doc.comps.filter(x => x.id !== c.id);
      changed();
      closeAllSheets();
      draw();
    }, { danger: true, yes: 'حذف' });
  }
  function drawParts(body) {
    if (R.doc.comps.length) {
      secT(body, 'در همین ربات');
      R.doc.comps.forEach(c => body.appendChild(groupRow(c, 0)));
    }
    secT(body, 'اجزای آماده', h('span', 'bk-sec-s', 'به هر رباتی اضافه می‌شوند'));
    const g = h('div', 'bk-parts');
    Object.keys(COMPS).forEach(k => {
      const meta = COMPS[k];
      const card = bt('bk-part', [], () => {
        const c = installComp(k);
        toast(`«${meta.title}» اضافه شد`);
        compSheet(c, true);
      });
      const tl = h('span', 'bk-tile ' + meta.color);
      tl.appendChild(ic(meta.icon));
      const add = h('span', 'bk-part-add');
      add.appendChild(ic('plus'));
      card.append(tl, h('b', '', meta.title), h('span', '', meta.sub), add);
      g.appendChild(card);
    });
    SOON.forEach(([i, t]) => {
      const card = h('div', 'bk-part soon');
      const tl = h('span', 'bk-tile mute');
      tl.appendChild(ic(i));
      card.append(tl, h('b', '', t), h('span', 'bk-soon', 'به‌زودی'));
      g.appendChild(card);
    });
    body.appendChild(g);
  }
  function compSheet(c, isNew) {
    const s = c.settings;
    const meta = COMPS[c.type];
    sheet(c.title || meta.title, isNew ? 'اضافه شد؛ تنظیمش کن' : 'جزء آماده', (body, ctx) => {
      const apply = () => { applyComp(c); changed(); };
      field(body, 'نام جزء', input(c.title, v => { c.title = v.slice(0, 40); apply(); }, { max: 40 }));
      if (c.type === 'menu') {
        field(body, 'متن بالای منو', input(s.text, v => { s.text = v; apply(); }, { area: true }));
        label(body, 'دکمه‌های منو', 'هر کدام یک پیام');
        (s.items || []).forEach((t, i) => {
          const row = h('div', 'bk-li');
          row.append(input(t, v => { s.items[i] = v.slice(0, 40); apply(); }, { max: 40 }),
            bt('bk-round sm', ic('trash'), () => { s.items.splice(i, 1); apply(); ctx.redraw(); }, 'حذف'));
          body.appendChild(row);
        });
        if ((s.items || []).length < 10) primary(body, 'دکمهٔ تازه', () => { s.items.push('بخش تازه'); apply(); ctx.redraw(); }, 's', 'plus');
        toggle(body, 'بعد از پیام شروع بیاید', 'منو زیر خوش‌آمد باز می‌شود', !!find(R.doc.start) && find(R.doc.start).then === `${c.id}_0`, v => {
          const st = find(R.doc.start);
          if (st) st.then = v ? `${c.id}_0` : (st.then === `${c.id}_0` ? '' : st.then);
          changed();
        });
      } else if (c.type === 'faq') {
        field(body, 'متن بالای پرسش‌ها', input(s.intro, v => { s.intro = v; apply(); }, { area: true }));
        label(body, 'پرسش‌ها');
        (s.items || []).forEach((x, i) => {
          const card = h('div', 'bk-qa');
          card.append(input(x.q, v => { x.q = v.slice(0, 60); apply(); }, { ph: 'پرسش', max: 60 }), input(x.a, v => { x.a = v; apply(); }, { area: true, ph: 'پاسخ' }),
            bt('bk-link red', 'حذف این پرسش', () => { s.items.splice(i, 1); apply(); ctx.redraw(); }));
          body.appendChild(card);
        });
        if ((s.items || []).length < 20) primary(body, 'پرسش تازه', () => { s.items.push({ q: 'پرسش تازه', a: '' }); apply(); ctx.redraw(); }, 's', 'plus');
        toggle(body, 'آخرش «جوابم را نگرفتم»', R.doc.comps.some(x => x.type === 'support') ? 'کاربر را به پشتیبانی می‌برد' : 'اول جزء «پشتیبانی» را اضافه کن', s.support, v => { s.support = v; apply(); });
      } else if (c.type === 'coupon') {
        field(body, 'متن', input(s.text, v => { s.text = v; apply(); }, { area: true }));
        field(body, 'کد', input(s.code, v => { s.code = v.slice(0, 64); apply(); }, { ltr: true, max: 64 }), 'با یک دکمه کپی می‌شود؛ متغیر هم می‌شود');
        field(body, 'توضیح', input(s.note, v => { s.note = v; apply(); }, { ph: 'تا آخر ماه' }));
      } else if (c.type === 'support') {
        field(body, 'پیام درخواست', input(s.ask, v => { s.ask = v; apply(); }, { area: true }));
        field(body, 'پیام رسید', input(s.done, v => { s.done = v; apply(); }, { area: true }));
        note(body, 'پیام کاربر در همین ربات برای خودت فرستاده می‌شود؛ روی آن «پاسخ» بزن تا جوابت به کاربر برسد. یک بار ربات را استارت کرده باش.');
      }
      const entry = `${c.id}_0`;
      const from = msgs().find(m => m.rows.some(r => r.some(b => b.act.to === entry)) || m.keys.some(r => r.some(b => b.act.to === entry)) || m.then === entry);
      optRow(body, 'btn', 'از کجا باز شود؟', from ? `از «${from.name}»` : 'هنوز هیچ دکمه‌ای به آن نمی‌رسد', from ? null : h('span', 'bk-opt-e brand', 'دکمه در شروع'), () => {
        if (!from) { linkFromStart(c, s.label); changed(); ctx.redraw(); return; }
        closeAllSheets();
        openEditor(from.id);
      });
      const tools = h('div', 'bk-tools');
      tools.append(
        bt('bk-tool', [ic('chat'), 'دیدن پیام‌ها'], () => { closeAllSheets(); openEditor(entry); }),
        bt('bk-tool', [ic('split'), 'باز کردن'], () => unpackComp(c)),
        bt('bk-tool red', [ic('trash'), 'حذف'], () => removeComp(c)),
      );
      body.appendChild(tools);
    }, { tall: true, onClose: () => { if (!R.edit) draw(); } });
  }

  /* ================================================================ تب ربات */
  function drawBot(body) {
    const b = R.d.bot;
    const card = h('div', 'bk-botcard');
    const tx = h('div', 'grow');
    tx.append(h('b', '', b.name || R.d.app.name));
    const s = h('span', '');
    if (b.username) { const x = h('bdi', '', '@' + b.username); x.dir = 'ltr'; s.appendChild(x); } else s.textContent = 'ربات وصل نیست';
    tx.appendChild(s);
    const st = !b.connected ? ['وصل نیست', 'off'] : b.mode !== 'full' ? ['روی ایزی‌ساز اجرا نمی‌شود', 'warn'] : b.live ? ['روشن', 'live'] : ['منتشر نشده', 'warn'];
    const pill = h('span', 'bk-state ' + st[1]);
    pill.append(h('i'), document.createTextNode(st[0]));
    card.append(avatar(54), tx, pill);
    body.appendChild(card);

    if (!b.connected) {
      secT(body, 'ربات از کجا بیاید؟');
      const opt = (icon, title, sub, rec, fn) => {
        const o = bt('bk-src' + (rec ? ' rec' : ''), [], fn);
        const tl = h('span', 'bk-tile ' + (rec ? 'tg' : 'mute'));
        tl.appendChild(ic(icon));
        const t2 = h('span', 'grow');
        t2.append(h('b', '', title), h('span', '', sub));
        o.append(tl, t2);
        if (rec) o.appendChild(h('span', 'bk-chip ok', 'پیشنهادی'));
        body.appendChild(o);
      };
      opt('tg', 'ساخت ربات با یک دکمه', 'تلگرام خودش ربات را می‌سازد و به ایزی‌ساز می‌دهد؛ بی BotFather و کپی توکن.', true, () => P().openBot('newbot_' + R.appId));
      opt('key', 'اتصال ربات موجود', 'توکن ربات‌ات را از BotFather بیاور و در چت ایزی‌ساز بفرست.', false, () => P().openBot('connect'));
      note(body, 'بعد از ساختن یا وصل کردن، «برگشت به ربات‌ساز» تو را همین‌جا برمی‌گرداند.');
      return;
    }
    if (b.mode !== 'full') {
      note(body, 'ربات الان فقط دکمهٔ منوی مینی‌اپ دارد. برای اینکه پیام‌ها و دکمه‌های ربات‌ساز کار کنند، ربات باید روی ایزی‌ساز اجرا شود.', 'warn');
      primary(body, 'اجرا روی ایزی‌ساز', takeover, 't', 'power');
    }
    secT(body, 'رفتار ربات');
    const card2 = h('div', 'bk-card');
    const startM = find(R.doc.start);
    optRow(card2, 'play', 'پیام شروع', startM ? `«${startM.name}» با /start` : 'انتخاب نشده', h('span', 'bk-opt-e brand', 'عوض کن'),
      () => msgPick('پیام شروع', R.doc.start, id => { if (id) R.doc.start = id; changed(); draw(); }));
    const fb = find(R.doc.fallback);
    optRow(card2, 'help', 'هر پیام نامفهوم', fb ? `جواب: «${fb.name}»` : 'جوابی نمی‌دهد', h('span', 'bk-opt-e brand', 'عوض کن'),
      () => msgPick('جواب پیام نامفهوم', R.doc.fallback, id => { R.doc.fallback = id; changed(); draw(); }, { allowNone: true, newName: 'نفهمیدم' }));
    body.appendChild(card2);
    secT(body, 'کاربرها');
    const sts = h('div', 'bk-stats');
    [[R.d.stats.users, 'کاربر ربات'], [R.d.stats.today, 'امروز فعال']].forEach(([v, t]) => { const c = h('div', 'bk-stat'); c.append(h('b', '', faN(v)), h('span', '', t)); sts.appendChild(c); });
    body.appendChild(sts);
    secT(body, 'بیشتر');
    const card3 = h('div', 'bk-card');
    optRow(card3, 'smile', 'ایموجی‌های پریمیوم', `${faN(R.emoji.length)} ایموجی برای متن و دکمه‌ها`, null, () => { R.tab = 'emoji'; draw(); window.scrollTo(0, 0); });
    optRow(card3, 'refresh', 'عوض کردن ربات', 'ساخت ربات تازه یا وصل کردن ربات دیگر', null, () => sheet('ربات دیگر', 'پیام‌ها و تنظیمات همین‌جا می‌مانند', bb => {
      optRow(bb, 'tg', 'ساخت ربات با یک دکمه', 'بی BotFather', null, () => P().openBot('newbot_' + R.appId));
      optRow(bb, 'key', 'اتصال با توکن', 'از BotFather', null, () => P().openBot('connect'));
    }));
    if (b.live) optRow(card3, 'power', 'خاموش کردن ربات‌ساز', 'ربات به خوش‌آمد ساده و دکمهٔ مینی‌اپ برمی‌گردد', null, () => P().confirm('ربات‌ساز خاموش شود؟ پیام‌ها پاک نمی‌شوند.', async () => {
      try { const r = await P().api('bot/off', { id: R.appId }); R.d.bot = r.bot; R.pub = null; toast('ربات‌ساز خاموش شد'); draw(); } catch (err) { P().failed(err); }
    }, { danger: true, yes: 'خاموش' }), 'danger');
    body.appendChild(card3);
  }
  function takeover(after) {
    P().confirm('ربات روی ایزی‌ساز اجرا شود؟ اگر الان برنامهٔ دیگری این ربات را اجرا می‌کند، از کار می‌افتد.', async () => {
      try {
        const r = await P().api('bot/takeover', { id: R.appId });
        R.d.bot = r.bot;
        toast('ربات حالا روی ایزی‌ساز اجرا می‌شود');
        if (typeof after === 'function') after(); else draw();
      } catch (err) { P().failed(err); }
    }, { yes: 'اجرا کن' });
  }

  /* ================================================================ تست در تلگرام */
  function testSheet(from) {
    const b = R.d.bot;
    if (!b.connected) {
      sheet('اول ربات را وصل کن', 'تست در چت واقعی ربات خودت انجام می‌شود', body => {
        optRow(body, 'tg', 'ساخت ربات با یک دکمه', 'پیشنهادی', null, () => P().openBot('newbot_' + R.appId));
        optRow(body, 'key', 'اتصال ربات موجود', 'با توکن BotFather', null, () => P().openBot('connect'));
      });
      return;
    }
    runTest(from && find(from) ? from : '');
  }
  /* تست از خود ربات واقعی: پیش‌نویس ذخیره می‌شود، مینی‌اپ جمع می‌شود و چت ربات با لینک
     استارت (?start=test یا t_<پیام>) باز می‌شود؛ ربات پیش‌نویس را جلوی چشم صاحبش می‌فرستد. */
  async function runTest(from) {
    await save();
    toast('در حال باز کردن ربات…');
    try {
      const res = await P().api('bot/test', { id: R.appId, doc: R.doc, from });
      closeAllSheets();
      openTestChat(res.link);
    } catch (err) {
      if (err.status === 409) { takeover(() => runTest(from)); return; }
      P().failed(err);
    }
  }
  function openTestChat(link) {
    // وقتی کاربر دوباره مینی‌اپ را باز کند، همین‌جا برمی‌گردد
    try { localStorage.setItem('es-resume', JSON.stringify({ id: R.appId, tab: R.ai && R.ai.on ? 'ai' : R.tab, t: Date.now() })); } catch (e) {}
    if (tg && tg.initData && tg.openTelegramLink) {
      tg.openTelegramLink(link);
      setTimeout(() => {
        try { tg.disableClosingConfirmation(); } catch (e) {}
        try { tg.close(); } catch (e) {}
      }, 350);
    } else toast('در تلگرام باز می‌شود: ' + link.replace('https://', ''));
  }
  /* ================================================================ انتشار */
  function publishSheet() {
    sheet('انتشار', 'کاربرها از همین لحظه نسخهٔ تازه را می‌بینند', (body, ctx) => {
      const list = diffs();
      if (!R.d.bot.connected) note(body, 'برای انتشار اول ربات را وصل کن (تب «ربات»).', 'warn');
      if (!list.length) note(body, R.d.bot.live ? 'همه چیز منتشر شده است.' : 'ربات هنوز منتشر نشده.', 'ok');
      if (list.length) label(body, `${faN(list.length)} تغییر`);
      list.forEach(d => {
        const end = d.revert ? bt('bk-link', [ic('undo'), 'برگردان'], () => { d.revert(); changed(); ctx.redraw(); if (R.edit) drawEditor(); }) : null;
        optRow(body, d.icon, d.title, d.sub, end, null);
      });
      primary(body, R.d.stats.users ? `انتشار برای ${faN(R.d.stats.users)} کاربر` : 'انتشار', async () => {
        await save();
        try {
          const res = await P().api('bot/publish', { id: R.appId, doc: R.doc });
          R.pub = clone(res.published);
          R.d.bot = res.bot;
          R.d.stats = res.stats || R.d.stats;
          closeAllSheets();
          toast('منتشر شد؛ ربات حالا همین را جواب می‌دهد');
          drawPill();
          if (!R.edit) draw();
        } catch (err) {
          if (err.status === 409) { takeover(); return; }
          P().failed(err);
        }
      }, 'p', 'send');
    });
  }

  /* ================================================================ دستیار ساخت ربات با گفتگو
     کاربر می‌گوید چه می‌خواهد؛ سرور (app/botkit/agent.py) با سرویس هوش مصنوعی پیش‌نویس را
     می‌سازد یا عوض می‌کند. متن دستیار تمام‌عرض و بدون حباب است (فقط پیام کاربر حباب دارد)،
     Markdown دارد و خط‌به‌خط با محو شدن از راست به چپ ظاهر می‌شود. انتشار با خود کاربر است. */
  const AI_IDEAS = [
    ['🛍', 'فروشگاه و سفارش', 'محصولات، سبد و ثبت سفارش', 'یه ربات فروشگاه می‌خوام که محصولاتم رو نشون بده و مشتری بتونه سفارش بده'],
    ['📝', 'ثبت‌نام کلاس', 'معرفی دوره و گرفتن شماره', 'یه ربات برای ثبت‌نام کلاس می‌خوام که دوره‌ها رو با قیمت نشون بده و شماره تماس بگیره'],
    ['🎧', 'پشتیبانی مشتری', 'سؤالات پرتکرار و پیام به تو', 'یه ربات پشتیبانی می‌خوام با سؤالات پرتکرار و دکمه‌ای که پیام کاربر رو برای من بفرسته'],
    ['📅', 'نوبت‌دهی', 'روز و ساعت از کاربر', 'یه ربات نوبت‌دهی می‌خوام که روز و ساعت و شماره رو از کاربر بپرسه'],
    ['📣', 'معرفی کانال', 'خوش‌آمد و مینی‌اپ', 'یه ربات برای کانالم می‌خوام که خوش‌آمد بگه و مینی‌اپم رو باز کنه'],
    ['🎁', 'کد تخفیف', 'هدیه بعد از عضویت', 'یه ربات می‌خوام که بعد از گرفتن شماره، به کاربر کد تخفیف بده'],
  ];
  function aiTile() {
    const has = R.ai && R.ai.turns && R.ai.turns.length;
    const t = bt('bk-ai-tile', [], () => openAI());
    t.append(h('span', 'bk-ai-tile-i'), h('b', '', 'ربات رو با گفتگو بساز'),
      h('span', 'bk-ai-tile-s', 'بگو چه رباتی می‌خوای؛ پیام‌ها، دکمه‌ها و متغیرها را می‌سازم. بعد خودت تست کن.'),
      h('span', 'bk-ai-tile-b', has ? 'ادامهٔ گفتگو' : 'شروع گفتگو'));
    t.querySelector('.bk-ai-tile-i').appendChild(ic('sparkle'));
    t.querySelector('.bk-ai-tile-b').appendChild(ic('chl'));
    return t;
  }
  function aiOrb(cls) { const a = h('span', 'ai-orb' + (cls ? ' ' + cls : '')); a.appendChild(ic('sparkle')); return a; }

  /* ---------- Markdown امن (فقط آنچه دستیار لازم دارد) ---------- */
  function mdInline(s) {
    let t = esc(s);
    const codes = [];
    t = t.replace(/`([^`\n]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/__([^_\n]+)__/g, '<b>$1</b>');
    t = t.replace(/(^|[\s(«])\*([^*\n]+)\*(?=[\s).,،؛:!?»]|$)/g, '$1<i>$2</i>').replace(/(^|[\s(«])_([^_\n]+)_(?=[\s).,،؛:!?»]|$)/g, '$1<i>$2</i>');
    t = t.replace(/\[([^\]\n]{1,80})\]\((https?:\/\/[^\s)]+)\)/g, (m, x, u) => `<a href="${u}" target="_blank" rel="noopener">${x}</a>`);
    t = t.replace(/\{([^{}<>\n]{1,24})\}/g, '<span class="ai-var">{$1}</span>');
    t = t.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codes[+i]}</code>`);
    return t;
  }
  /* متن را به بلوک‌های کامل می‌شکند؛ در حین تایپ خط آخر (و بلوک کد باز) نگه داشته می‌شود */
  function mdBlocks(text, final) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    if (!final) lines.pop();
    const out = [];
    let gap = false;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (/^\s*```/.test(ln)) {
        const body = [];
        let j = i + 1;
        while (j < lines.length && !/^\s*```/.test(lines[j])) body.push(lines[j++]);
        if (j >= lines.length && !final) break;
        out.push({ k: 'code', src: body.join('\n'), gap });
        gap = false; i = j; continue;
      }
      if (!ln.trim()) { gap = out.length > 0; continue; }
      let m;
      if ((m = /^\s*#{1,6}\s+(.*)$/.exec(ln))) out.push({ k: 'h', src: m[1], gap: true });
      else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(ln)) out.push({ k: 'hr', src: '', gap });
      else if ((m = /^\s*[-*•]\s+(.*)$/.exec(ln))) out.push({ k: 'li', src: m[1], gap });
      else if ((m = /^\s*([0-9۰-۹]{1,2})[.)]\s+(.*)$/.exec(ln))) out.push({ k: 'ol', n: m[1], src: m[2], gap });
      else if ((m = /^\s*>\s?(.*)$/.exec(ln))) out.push({ k: 'q', src: m[1], gap });
      else out.push({ k: 'p', src: ln.trim(), gap });
      gap = false;
    }
    return out;
  }
  function mdEl(b) {
    let e;
    if (b.k === 'code') { e = h('pre', 'ai-l ai-code'); e.appendChild(h('code', '', b.src)); }
    else if (b.k === 'hr') e = h('hr', 'ai-l ai-hr');
    else {
      e = h(b.k === 'h' ? 'h4' : 'div', 'ai-l ai-' + b.k);
      if (b.k === 'ol') e.dataset.n = b.n;
      e.innerHTML = mdInline(b.src);
    }
    if (b.gap) e.classList.add('gap');
    return e;
  }
  const keyOf = b => b.k + '|' + (b.n || '') + '|' + b.src;

  /* ---------- نمایش خط‌به‌خط ---------- */
  function streamState(id) {
    const A = R.ai;
    if (!A.sv[id]) A.sv[id] = { el: h('div', 'ai-md'), keys: [], q: [], timer: 0 };
    return A.sv[id];
  }
  function feed(id, text, final, animate) {
    const st = streamState(id);
    const blocks = mdBlocks(text, final);
    const keys = blocks.map(keyOf);
    // اگر متن نهایی با آنچه نشان داده شده فرق کرد (مثلاً بعد از تعمیر)، از همان‌جا دوباره
    let same = 0;
    while (same < st.keys.length && same < keys.length && st.keys[same] === keys[same]) same++;
    if (same < st.keys.length) {
      st.q = [];
      Array.from(st.el.children).slice(same).forEach(n => n.remove());
      st.keys = st.keys.slice(0, same);
    }
    const queued = st.keys.length + st.q.length;
    for (let i = Math.max(same, queued); i < blocks.length; i++) st.q.push(blocks[i]);
    if (!animate) { while (st.q.length) { const b = st.q.shift(); st.el.appendChild(mdEl(b)); st.keys.push(keyOf(b)); } return st; }
    if (!st.timer && st.q.length) pump(st);
    return st;
  }
  function pump(st) {
    const step = () => {
      const b = st.q.shift();
      if (!b) { st.timer = 0; return; }
      const e = mdEl(b);
      e.classList.add('ln');
      st.el.appendChild(e);
      st.keys.push(keyOf(b));
      aiStick();
      st.timer = setTimeout(step, b.k === 'code' ? 220 : 130);
    };
    step();
  }
  function aiStick() {
    const sc = document.querySelector('#bot .ai-scroll');
    if (sc && R.ai && R.ai.stick) sc.scrollTop = sc.scrollHeight;
  }

  /* ---------- باز و بسته ---------- */
  async function openAI(opts) {
    opts = opts || {};
    if (!R.ai) R.ai = { turns: [], quota: { used: 0, limit: 0 }, enabled: true, max: 800, busy: 0, pos: 0, draft: '', sv: {}, insights: [], img: null, stick: true, open: {} };
    R.ai.on = true;
    R.ai.fromHome = !!opts.fromHome;
    if (opts.text) R.ai.draft = opts.text;
    closeAllSheets();
    drawAI(true);
    try {
      const d = await P().api('bot/ai?id=' + encodeURIComponent(R.appId));
      const known = new Set(R.ai.turns.map(t => t.id));
      Object.assign(R.ai, { turns: d.turns, quota: d.quota, enabled: d.enabled, max: d.max_ask || 800, insights: d.insights || [] });
      d.turns.forEach(t => { if (!known.has(t.id) && t.say) feed(t.id, t.say, t.status !== 'running', false); });
      const run = d.turns.find(t => t.status === 'queued' || t.status === 'running');
      if (run) { R.ai.busy = run.id; aiPoll(); }
      if (R.ai.on) drawAI();
      if (opts.send && !run) aiSend(opts.send);
      else if (opts.focus) setTimeout(() => { const ta = document.querySelector('#bot .ai-comp textarea'); if (ta) ta.focus(); }, 300);
    } catch (err) { P().failed(err); }
  }
  function closeAI() {
    if (!R.ai) return;
    R.ai.on = false;
    const el = document.querySelector('#bot .bk-ai');
    if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 220); }
    if (R.ai.fromHome) { leave(true); return; }
    draw();
  }
  function switchApp() {
    const apps = (P().me() && P().me().apps) || [];
    if (apps.length < 2) return;
    sheet('روی کدام ربات کار کنیم؟', 'دستیار پیش‌نویس همان را می‌سازد', body => {
      apps.forEach(a => optRow(body, 'bot', a.name, Number(a.id) === R.appId ? 'همین الان' : 'باز کردن', null, async () => {
        closeAllSheets();
        if (Number(a.id) === R.appId) return;
        await save();
        const fh = R.ai && R.ai.fromHome;
        open(a.id, 'ai', { fromHome: fh });
      }, Number(a.id) === R.appId ? 'on' : ''));
    });
  }

  /* ---------- صفحه ---------- */
  function drawAI(fresh) {
    if (!R.ai || !R.ai.on) return;
    const A = R.ai;
    let el = document.querySelector('#bot .bk-ai');
    const oldTa = el && el.querySelector('.ai-comp textarea');
    if (oldTa) A.draft = oldTa.value;
    const oldSc = el && el.querySelector('.ai-scroll');
    if (oldSc) A.stick = oldSc.scrollHeight - oldSc.scrollTop - oldSc.clientHeight < 120;
    if (!el) { el = h('section', 'bk-ai'); root().appendChild(el); if (fresh) el.classList.add('in'); }
    el.textContent = '';

    // نوار بالا
    const top = h('header', 'ai-top');
    top.appendChild(bt('bk-round', ic('back'), closeAI, 'برگشت'));
    const id = h('div', 'ai-id');
    const many = ((P().me() && P().me().apps) || []).length > 1;
    const tgt = bt('ai-target' + (many ? ' sw' : ''), [h('span', 'ai-target-t', `روی «${R.d.bot.name || R.d.app.name}»`)], many ? switchApp : null);
    if (many) tgt.appendChild(ic('down'));
    id.append(aiOrb('sm'), h('span', 'ai-id-t'));
    id.querySelector('.ai-id-t').append(h('b', '', 'دستیار ایزی‌ساز'), tgt);
    top.append(id, testBtn(''));
    el.appendChild(top);

    const sc = h('div', 'ai-scroll');
    const col = h('div', 'ai-col');
    sc.appendChild(col);
    el.appendChild(sc);
    sc.addEventListener('scroll', () => { A.stick = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 120; }, { passive: true });

    if (!A.enabled) col.appendChild(aiNote('warn', 'دستیار هنوز روشن نشده', 'مدیر سرور باید کلید دستیار هوش مصنوعی را در تنظیمات بگذارد. تا آن موقع ربات را دستی بساز.'));
    if (!A.turns.length) col.appendChild(aiEmpty());
    const lastDone = [...A.turns].reverse().find(x => x.status === 'done');
    A.turns.forEach(turn => col.appendChild(aiTurn(turn, turn === lastDone)));
    if (A.quota.limit && A.quota.used >= A.quota.limit && !A.busy) {
      col.appendChild(aiNote('brand', 'سهم امروزت تمام شد', `امروز ${faN(A.quota.limit)} پیام به دستیار دادی. فردا دوباره می‌توانی؛ ویرایش دستی همیشه باز است.`,
        [['پلن‌ها', 'star', 'p', () => P().openBot('plans')], ['ادامهٔ دستی', 'pen', 's', () => { A.fromHome = false; closeAI(); }]]));
    }
    el.appendChild(aiComposer());
    requestAnimationFrame(() => { if (A.stick || fresh) sc.scrollTop = sc.scrollHeight; });
  }

  function aiEmpty() {
    const w = h('div', 'ai-empty');
    w.append(aiOrb('lg'), h('h2', '', 'امروز چی بسازیم؟'),
      h('p', '', 'بگو رباتت چه کاری بکنه، یا عکس یه ربات نمونه بفرست. همه‌چیز اول در پیش‌نویس است و تا «انتشار» نزنی کاربرها چیزی نمی‌بینند.'));
    const ins = R.ai.insights || [];
    if (ins.length) {
      const box = h('div', 'ai-ins');
      box.appendChild(h('span', 'ai-cap', `پیشنهاد برای «${R.d.bot.name || R.d.app.name}»`));
      ins.forEach(x => { const r = bt('ai-ins-r', [ic('warn'), h('span', 'grow', x.t), ic('chl')], () => aiSend(x.ask)); box.appendChild(r); });
      w.appendChild(box);
    }
    w.appendChild(h('span', 'ai-cap', 'یا از یکی از این‌ها شروع کن'));
    const g = h('div', 'ai-ideas');
    AI_IDEAS.forEach(([e, t, d, ask]) => {
      const c = bt('ai-idea', [h('span', 'ai-idea-e', e), h('b', '', t), h('span', 'ai-idea-d', d)], () => aiSend(ask));
      g.appendChild(c);
    });
    w.appendChild(g);
    return w;
  }

  function aiTurn(turn, last) {
    const A = R.ai;
    const w = h('div', 'ai-turn');
    const u = h('div', 'ai-u');
    if (turn.img) { const im = h('img', 'ai-u-img'); im.src = turn.img; im.alt = ''; u.appendChild(im); }
    u.appendChild(h('span', '', turn.ask.replace(/^📷 /, '')));
    if (!turn.img && /^📷 /.test(turn.ask)) u.prepend(h('span', 'ai-u-tag', '📷 عکس'));
    w.appendChild(u);
    const a = h('div', 'ai-a');
    const head = h('div', 'ai-a-h');
    head.append(aiOrb('xs'), h('b', '', 'دستیار'));
    const running = turn.status === 'queued' || turn.status === 'running';
    const st = A.sv[turn.id];
    const shown = st && (st.keys.length || st.q.length);
    if (running && !shown) head.appendChild(h('span', 'ai-think', turn.status === 'queued' && A.pos > 0 ? `در صف · نفر ${faN(A.pos + 1)}` : 'دارم فکر می‌کنم…'));
    else if (running) head.appendChild(h('span', 'ai-think', 'دارم می‌سازم…'));
    a.appendChild(head);
    if (turn.status === 'error') {
      if (st && st.keys.length) a.appendChild(st.el);
      a.appendChild(aiNote('warn', turn.error || 'دستیار جواب نداد', 'چیزی در پیش‌نویست عوض نشد.', last || turn === A.turns[A.turns.length - 1] ? [['دوباره بفرست', 'refresh', 'p', () => aiSend(turn.ask.replace(/^📷 /, ''))]] : null));
      w.appendChild(a);
      return w;
    }
    if (turn.say || st) {
      const s2 = streamState(turn.id);
      if (!st) feed(turn.id, turn.say, !running, false);
      a.appendChild(s2.el);
    }
    if (running) { a.appendChild(h('i', 'ai-pulse')); w.appendChild(a); return w; }
    const res = turn.result || {};
    if (res.changes && res.changes.length) a.appendChild(aiArtifact(turn, last));
    if (last && res.chips && res.chips.length && !A.busy) {
      const c = h('div', 'ai-chips');
      res.chips.forEach(x => c.appendChild(bt('ai-chip', [x], () => aiSend(x))));
      a.appendChild(c);
    }
    if (last && !A.busy) {
      const tools = h('div', 'ai-tools');
      tools.appendChild(bt('ai-tool', ic('copy'), () => { try { navigator.clipboard.writeText(turn.say || ''); toast('کپی شد'); } catch (e) {} }, 'کپی'));
      tools.appendChild(bt('ai-tool', ic('refresh'), () => aiRedo(turn), 'دوباره بساز'));
      a.appendChild(tools);
    }
    w.appendChild(a);
    return w;
  }

  function aiNote(tone, title, text, actions) {
    const c = h('div', 'ai-note ' + (tone || ''));
    const hd = h('div', 'ai-note-h');
    const i = h('span', 'ai-note-i'); i.appendChild(ic(tone === 'warn' ? 'warn' : 'info')); hd.append(i, h('b', 'grow', title));
    c.appendChild(hd);
    if (text) c.appendChild(h('p', '', text));
    if (actions) {
      const a = h('div', 'ai-acts');
      actions.forEach(([t, ico, k, fn]) => a.appendChild(bt('ai-act ' + k, [ic(ico), t], fn)));
      c.appendChild(a);
    }
    return c;
  }
  function aiChanged(list, more) {
    const wrap = h('div', 'ai-pvs');
    list.forEach(pv => {
      const lab = h('div', 'ai-pv-l ' + pv.kind);
      lab.append(h('span', 'ai-pv-k', { add: 'تازه', new: 'بازنویسی شد' }[pv.kind] || 'تغییر کرد'), h('b', 'grow', pv.name),
        bt('ai-pv-go', [ic('pen')], () => aiOpenMsg(pv.id), 'باز کردن در ربات‌ساز'));
      wrap.append(lab, aiPreview(pv));
    });
    if (more) wrap.appendChild(h('div', 'ai-pv-more', `و ${faN(more)} پیام دیگر`));
    return wrap;
  }
  function aiOpenMsg(id) {
    const A = R.ai;
    A.on = false; A.fromHome = false;
    const e2 = document.querySelector('#bot .bk-ai'); if (e2) e2.remove();
    R.tab = 'msgs'; draw();
    if (id && find(id)) openEditor(id);
  }
  function aiPreview(pv) {
    const box = h('div', 'ai-pv');
    const b = h('div', 'bk-bub');
    const t = h('div', 'bk-text');
    fillEditable(t, pv.text);
    b.append(t, h('span', 'bk-time', '۹:۴۱'));
    if (pv.text_changed) b.classList.add('hl');
    box.appendChild(b);
    if (pv.rows && pv.rows.length) {
      const k = h('div', 'bk-keys');
      pv.rows.forEach(r => { const rr = h('div', 'bk-krow'); r.forEach(x => rr.appendChild(keyEl(x, (pv.kb === 'reply' ? 'rk' : '') + (x.hl ? ' hl' : ''), null))); k.appendChild(rr); });
      box.appendChild(k);
    }
    return box;
  }
  function aiArtifact(turn, last) {
    const A = R.ai;
    const res = turn.result;
    const first = A.turns.filter(x => x.status === 'done' && x.result && x.result.changes && x.result.changes.length)[0] === turn;
    const c = h('div', 'ai-art' + (res.undone ? ' undone' : ''));
    const hd = h('div', 'ai-art-h');
    const i = h('span', 'ai-art-i'); i.appendChild(ic(res.undone ? 'undo' : 'bot'));
    const tt = h('span', 'grow ai-art-t');
    tt.append(h('b', '', res.undone ? 'برگردانده شد' : (first ? 'پیش‌نویس ربات آماده شد' : 'پیش‌نویس به‌روز شد')),
      h('span', '', res.stats ? `${faN(res.stats.msgs)} پیام · ${faN(res.stats.buttons)} دکمه · ${faN(res.stats.vars)} متغیر` : ''));
    hd.append(i, tt);
    c.appendChild(hd);
    if (last && !res.undone) {
      if (res.previews && res.previews.length) c.appendChild(aiChanged(res.previews, res.previews_more));
      else if (res.preview) c.appendChild(aiPreview(res.preview));
    }
    const n = res.changes.length + (res.more || 0);
    const openK = A.open[turn.id] != null ? A.open[turn.id] : (last && n <= 4);
    const tg2 = bt('ai-art-sum', [h('span', 'grow', `${faN(n)} تغییر در پیش‌نویس`), ic(openK ? 'up' : 'down')], () => { A.open[turn.id] = !openK; drawAI(); });
    c.appendChild(tg2);
    if (openK) {
      const list = h('div', 'ai-diff');
      res.changes.forEach(d => {
        const r = h('div', 'ai-d ' + d.k);
        r.append(h('span', 'ai-dk', { add: '+', mod: '~', del: '−' }[d.k] || '·'), h('span', 'grow', d.t));
        list.appendChild(r);
      });
      if (res.more) list.appendChild(h('div', 'ai-d more', `و ${faN(res.more)} تغییر دیگر`));
      c.appendChild(list);
    }
    (res.warnings || []).forEach(x => c.appendChild(h('div', 'ai-w', x)));
    if (!res.undone) {
      const a = h('div', 'ai-acts');
      if (last) {
        a.appendChild(bt('ai-act t', [ic('play'), 'تست در تلگرام'], () => testSheet('')));
        a.appendChild(bt('ai-act s', [ic('pen'), 'باز کردن در ربات‌ساز'], () => aiOpenMsg((res.previews && res.previews[0] && res.previews[0].id) || (res.preview && res.preview.id) || R.doc.start)));
      }
      if (turn.can_undo) a.appendChild(bt('ai-act o', [ic('undo'), last ? 'برگردان' : 'برگرد به پیش از این'], () => aiUndo(turn)));
      if (a.childNodes.length) c.appendChild(a);
    }
    return c;
  }

  function aiComposer() {
    const A = R.ai;
    const box = h('div', 'ai-comp-w');
    const comp = h('div', 'ai-comp');
    if (A.img) {
      const th = h('div', 'ai-att');
      const im = h('img'); im.src = A.img; im.alt = '';
      th.append(im, bt('ai-att-x', ic('x'), () => { A.img = null; drawAI(); }, 'حذف عکس'));
      comp.appendChild(th);
    }
    const ta = h('textarea');
    ta.rows = 1;
    ta.maxLength = A.max;
    ta.placeholder = A.busy ? 'دستیار دارد می‌سازد…' : (A.turns.length ? 'بگو چی عوض بشه…' : 'بگو چه رباتی می‌خوای…');
    ta.value = A.draft || '';
    ta.dir = 'auto';
    const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 150) + 'px'; A.draft = ta.value; };
    ta.addEventListener('input', grow);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); go(); } });
    comp.appendChild(ta);
    const row = h('div', 'ai-comp-r');
    const full = A.quota.limit && A.quota.used >= A.quota.limit;
    // ارسال سمت راست (اول ردیف در راست‌به‌چپ)، پیوست عکس سمت چپ
    let send;
    if (A.busy) send = bt('ai-send stop', ic('stop'), aiStop, 'توقف');
    else send = bt('ai-send' + (!A.enabled || full ? ' off' : ''), ic('up'), () => go(), 'بفرست');
    row.appendChild(send);
    const left = A.quota.limit ? Math.max(0, A.quota.limit - A.quota.used) : 0;
    row.appendChild(h('span', 'ai-hint grow', A.quota.limit && left <= 5 ? `${faN(left)} پیام دیگر برای امروز` : 'دستیار فقط پیش‌نویس را عوض می‌کند'));
    row.appendChild(bt('ai-att-b', ic('image'), () => pickFile(async f => {
      try { A.img = await resize(f, 1280); drawAI(); } catch (err) { toast(err.message); }
    }), 'پیوست عکس'));
    comp.appendChild(row);
    box.appendChild(comp);
    const go = () => {
      const v = ta.value.trim();
      if ((!v && !A.img) || A.busy || !A.enabled || full) return;
      ta.value = ''; A.draft = '';
      aiSend(v || 'از روی این عکس بساز');
    };
    setTimeout(grow, 0);
    return box;
  }
  function pickFile(done) {
    const inp = h('input');
    inp.type = 'file';
    inp.accept = 'image/png,image/jpeg,image/webp';
    inp.addEventListener('change', () => { if (inp.files && inp.files[0]) done(inp.files[0]); });
    inp.click();
  }

  /* ---------- رفت و برگشت با سرور ---------- */
  async function aiSend(text) {
    const A = R.ai;
    if (!A || A.busy || !text) return;
    clearTimeout(R.saveT);
    haptic();
    const img = A.img;
    const tmp = { id: -Date.now(), ask: (img ? '📷 ' : '') + text, img, say: '', status: 'queued', result: {} };
    A.turns.push(tmp);
    A.busy = -1;
    A.pos = 0;
    A.img = null;
    A.stick = true;
    drawAI();
    try {
      const res = await P().api('bot/ai_send', Object.assign({ id: R.appId, text, doc: R.doc }, img ? { image: img } : {}));
      tmp.id = res.turn;
      A.busy = res.turn;
      A.pos = res.pos || 0;
      A.quota = res.quota || A.quota;
      drawAI();
      aiPoll();
    } catch (err) {
      A.turns.pop();
      A.busy = 0;
      A.img = img;
      if (err.status === 429 && /سهم/.test(err.message)) A.quota.used = A.quota.limit;
      A.draft = text;
      drawAI();
      P().failed(err);
    }
  }
  function aiPoll() {
    const A = R.ai;
    clearTimeout(A.pollT);
    if (!A.busy || A.busy < 0) return;
    A.pollT = setTimeout(async () => {
      try {
        const res = await P().api(`bot/ai_poll?id=${encodeURIComponent(R.appId)}&turn=${A.busy}`);
        const t = res.turn;
        const i = A.turns.findIndex(x => x.id === t.id);
        if (i >= 0) { t.img = A.turns[i].img; A.turns[i] = t; } else A.turns.push(t);
        A.pos = res.pos || 0;
        const done = t.status === 'done' || t.status === 'error';
        const before = A.sv[t.id] ? A.sv[t.id].keys.length + A.sv[t.id].q.length : 0;
        if (t.say) feed(t.id, t.say, done, true);
        const first = !before && A.sv[t.id] && A.sv[t.id].q.length;
        if (done) {
          A.busy = 0;
          if (t.status === 'error') A.quota.used = Math.max(0, A.quota.used - 1);  // نوبت خطادار از سهم کم نمی‌شود
          if (res.doc) {
            R.doc = res.doc;
            drawPill();
            if (t.result && t.result.changes && t.result.changes.length) haptic('medium');
            if (!A.on) draw();
          }
          // کارت نتیجه بعد از آخرین خط متن می‌آید
          const st = A.sv[t.id];
          const wait = st ? st.q.length * 130 + 250 : 0;
          setTimeout(drawAI, wait);
        } else if (first || !A.sv[t.id] || A.sv[t.id].keys.length === 0) drawAI();
        else {
          const th = document.querySelector('#bot .ai-turn:last-child .ai-think');
          if (th && th.textContent !== 'دارم می‌سازم…') th.textContent = 'دارم می‌سازم…';
        }
      } catch (e) {}
      if (A.busy) aiPoll();
    }, A.turns.some(x => x.status === 'running') ? 380 : 800);
  }
  async function aiStop() {
    const A = R.ai;
    if (!A.busy || A.busy < 0) return;
    try {
      const res = await P().api('bot/ai_stop', { id: R.appId, turn: A.busy });
      clearTimeout(A.pollT);
      A.busy = 0;
      const keep = new Map(A.turns.map(t => [t.id, t.img]));
      A.turns = res.turns.map(t => Object.assign(t, { img: keep.get(t.id) }));
      A.quota.used = Math.max(0, A.quota.used - 1);
      drawAI();
    } catch (err) { P().failed(err); }
  }
  function aiUndo(turn) {
    P().confirm('پیش‌نویس به حالت پیش از این پیام برگردد؟ نسخهٔ منتشرشده دست نمی‌خورد.', () => aiUndoNow(turn));
  }
  async function aiUndoNow(turn, quiet) {
    try {
      const res = await P().api('bot/ai_undo', { id: R.appId, turn: turn.id });
      R.doc = res.doc;
      const keep = new Map(R.ai.turns.map(t => [t.id, t.img]));
      R.ai.turns = res.turns.map(t => Object.assign(t, { img: keep.get(t.id) }));
      drawPill();
      if (!quiet) toast('پیش‌نویس برگشت');
      drawAI();
      return true;
    } catch (err) { P().failed(err); return false; }
  }
  async function aiRedo(turn) {
    if (turn.can_undo && !(await aiUndoNow(turn, true))) return;
    aiSend(turn.ask.replace(/^📷 /, ''));
  }


  /* وقتی از چت تلگرام برمی‌گردد (مثلاً بعد از افزودن ایموجی یا ساخت ربات) */
  document.addEventListener('visibilitychange', () => { if (!document.hidden && R.on) reload(); });

  window.EasySazBot = { open, back, needBack, reload, _evalFormula: evalFormula, _serialize: serialize };
})();
