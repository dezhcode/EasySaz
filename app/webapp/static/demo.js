/* ایزی‌ساز — حالت نمایشی فرانت‌اند
   برای ساختن و دیدن رابط کاربری بدون تلگرام و بدون سرور:
     /panel#demo   پنل ساخت با دادهٔ نمونه (در localStorage همین مرورگر)
     /a/demo       صفحهٔ منتشرشدهٔ همان دادهٔ نمایشی
   سرور در این حالت صدا زده نمی‌شود. همان پاسخ‌هایی را برمی‌گرداند که
   app/webapp/api.py می‌دهد، تا کد پنل برای دو حالت یکی باشد. */
(function () {
  'use strict';

  const KEY = 'es-demo-v4';
  const PLANS = {
    free: { key: 'free', title: 'رایگان', max_apps: 1, max_blocks: 8, max_pages: 2, premium_blocks: false, branding: true },
    pro: { key: 'pro', title: 'حرفه‌ای', max_apps: 3, max_blocks: 40, max_pages: 6, premium_blocks: true, branding: false },
  };
  // همان /api/me → plans (app/plans.py)
  const PLAN_LIST = [
    Object.assign({}, PLANS.free, { price_stars: 0, features: ['۱ مینی‌اپ', 'تا ۸ کامپوننت در ۲ صفحه', 'کامپوننت‌های پایه', 'با نشان ایزی‌ساز'] }),
    Object.assign({}, PLANS.pro, { price_stars: 250, features: ['۳ مینی‌اپ', 'تا ۴۰ کامپوننت در ۶ صفحه', 'همهٔ کامپوننت‌ها و قالب‌ها', 'بدون نشان ایزی‌ساز'] }),
    { key: 'business', title: 'بیزینس', max_apps: 10, max_blocks: 100, max_pages: 12, premium_blocks: true, branding: false, price_stars: 750,
      features: ['۱۰ مینی‌اپ', 'تا ۱۰۰ کامپوننت در ۱۲ صفحه', 'همهٔ کامپوننت‌ها', 'بدون نشان ایزی‌ساز'] },
  ];
  // همان کامپوننت‌هایی که در app/blocks.py پریمیوم‌اند
  const PREMIUM = ['cards', 'pricing', 'gallery', 'features', 'passcard', 'calc'];

  /* مینی‌اپ تازه روی قالب قسمت (مثل app/blocks.py → empty_page) */
  function blank() {
    return { v: 2, kit: 'shab', theme: { accent: '#D0452B', mode: 'light', radius: 'soft', radius_px: 18, bg: 'tint' },
      header: { enabled: false, style: 'bar', title: '', subtitle: '', logo: '', align: 'start' },
      tabbar: { enabled: true, style: 'floating' },
      pages: [{ id: 'home', title: 'خانه', icon: 'home', blocks: [] }] };
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function db() {
    let d = load();
    if (!d) {
      d = { apps: [], plan: 'free' };
      save(d);
    }
    return d;
  }
  function plan(d) { return PLANS[d.plan] || PLANS.free; }
  function pageUrl(base) {
    return (base || document.documentElement.dataset.base || '/') + 'a/demo';
  }
  function appJson(a) {
    return {
      id: a.id, name: a.name, slug: 'demo', url: new URL(pageUrl(), location.href).href,
      bot_username: a.bot_username || null, mode: a.bot_username ? 'menu' : 'none', status: a.status || 'active',
      published_at: a.published ? a.published_at : null, updated_at: a.updated_at,
      dirty: JSON.stringify(a.draft) !== JSON.stringify(a.published),
      welcome: a.welcome || '',
      kit: (a.draft && a.draft.kit) || 'base',
    };
  }
  /* آمار نمایشی (همان شکل db.app_stats): مینی‌اپی که محتوا دارد عددهای ثابت و
     باورپذیر می‌گیرد، مینی‌اپ خالی صفر */
  function stats(a) {
    const has = ((a.draft && a.draft.pages) || []).some(p => (p.blocks || []).length);
    if (!has) return { visitors: 0, views_today: 0, views_week: 0, views_prev_week: 0, people_week: 0, days: new Array(14).fill(0) };
    const days = [21, 26, 23, 29, 27, 31, 30, 33, 29, 36, 34, 39, 37, 42];
    const sum = xs => xs.reduce((x, y) => x + y, 0);
    return { visitors: 1284, views_today: days[13], views_week: sum(days.slice(7)), views_prev_week: sum(days.slice(0, 7)), people_week: 128, days: days };
  }
  function fail(status, message) {
    const e = new Error(message);
    e.status = status;
    return Promise.reject(e);
  }
  function now() { return Math.floor(Date.now() / 1000); }
  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* همان قیدهای app/blocks.clean_page (نسخهٔ خلاصه) */
  function check(doc, p) {
    const pages = (doc && doc.pages) || [];
    if (pages.length > p.max_pages) return 'پلن ' + p.title + ' حداکثر ' + p.max_pages + ' صفحه دارد';
    let total = 0;
    for (const pg of pages) {
      for (const b of pg.blocks || []) {
        total++;
        if (!p.premium_blocks && PREMIUM.indexOf(b.type) >= 0) return 'این کامپوننت مخصوص پلن حرفه‌ای است';
      }
    }
    if (total > p.max_blocks) return 'پلن ' + p.title + ' حداکثر ' + p.max_blocks + ' کامپوننت دارد';
    return '';
  }

  /* همان شکل پاسخ‌های /api */
  function api(path, body) {
    const d = db();
    const P = plan(d);
    const find = id => d.apps.find(a => String(a.id) === String(id));
    if (path === 'bot' || path.indexOf('bot?') === 0 || path.indexOf('bot/') === 0) return botApi(path, body, d, find);
    if (path === 'me') {
      return Promise.resolve({ user: { id: 1, first_name: 'مهمان' }, plan: P, plan_until: d.plan === 'free' ? null : now() + 23 * 86400,
        apps: d.apps.map(a => Object.assign(appJson(a), { stats: stats(a) })), can_create: d.apps.length < P.max_apps, bot: 'EasySazBot', plans: PLAN_LIST });
    }
    if (path === 'previews') {
      const docs = {};
      d.apps.forEach(a => { docs[String(a.id)] = a.draft; });
      return Promise.resolve({ docs: docs });
    }
    if (path === 'demo/plan') {
      d.plan = PLANS[body && body.key] ? body.key : 'free'; save(d);
      return Promise.resolve({ plan: plan(d) });
    }
    if (path === 'upload') {
      // در نسخهٔ نمایشی تصویر همان data: URL می‌ماند (سرور واقعی فایل می‌سازد)
      const data = String((body && body.data) || '');
      if (!/^data:image\/(png|jpeg|webp);base64,/.test(data)) return fail(400, 'فقط تصویر PNG، JPG یا WEBP');
      if (data.length > 2000000) return fail(413, 'تصویر خیلی بزرگه');
      return Promise.resolve({ url: data });
    }
    if (path.indexOf('app?id=') === 0) {
      const a = find(decodeURIComponent(path.split('=')[1]));
      if (!a) return fail(404, 'مینی‌اپ پیدا نشد');
      return Promise.resolve({ app: appJson(a), doc: a.draft, stats: stats(a), plan: P });
    }
    if (path === 'app/create') {
      const name = String(body.name || '').trim();
      if (name.length < 2) return fail(400, 'اسم مینی‌اپ حداقل ۲ حرف باشد');
      if (d.apps.length >= P.max_apps) return fail(402, 'پلن ' + P.title + ' فقط ' + P.max_apps + ' مینی‌اپ دارد. برای بیشتر، پلن بگیر.');
      const a = { id: d.apps.length + 1, name: name, draft: blank(), published: null, updated_at: now() };
      d.apps.push(a); save(d);
      return Promise.resolve({ app: appJson(a), doc: a.draft });
    }
    // قسمت (app/kits/shab/api.py): در نسخهٔ نمایشی خواننده‌ای نیست
    if (path.indexOf('kit/shab/stats') === 0) return Promise.resolve({ readers: 0, followers: 0, stories: {}, chapters: {} });
    // ورود به سایت (app/site/miniapp.py): در نسخهٔ نمایشی یک مرورگر ساختگی
    if (path.indexOf('weblogin/') === 0) {
      const webs = d.webs || (d.webs = [{ id: 1, device: { browser: 'Safari', os: 'macOS', mobile: false, label: 'Safari روی macOS' }, place: 'ایران', ip: '', created_at: now() - 86400, last_seen: now() - 80000, current: false }]);
      const dev = { browser: 'Chrome', os: 'Windows', mobile: false, label: 'Chrome روی Windows' };
      if (path === 'weblogin/inspect') return Promise.resolve({ device: dev, ip: '5.120.34.18', place: 'ایران', at: now() - 8 });
      if (path === 'weblogin/deny') return Promise.resolve({ ok: true, status: 'denied' });
      if (path === 'weblogin/approve') {
        webs.unshift({ id: now(), device: dev, place: 'ایران', ip: '', created_at: now(), last_seen: now(), current: false }); save(d);
        return Promise.resolve({ ok: true, status: 'approved' });
      }
      if (path === 'weblogin/sessions') return Promise.resolve({ sessions: webs });
      if (path === 'weblogin/revoke') {
        d.webs = body && body.all ? [] : webs.filter(w => String(w.id) !== String(body && body.id)); save(d);
        return Promise.resolve({ revoked: 1, sessions: d.webs });
      }
      return fail(404, 'پیدا نشد');
    }
    const a = find(body && body.id);
    if (!a) return fail(404, 'مینی‌اپ پیدا نشد');
    if (path === 'kit/shab/channel') return fail(400, 'در نسخهٔ نمایشی کانال وصل نمی‌شود؛ در ربات واقعی ربات را ادمین کانال کن و آیدی‌اش را بنویس.');
    if (path === 'kit/shab/announce') {
      a.announced = (a.announced || []).concat(body.chapters || []); save(d);
      return Promise.resolve({ ok: true, readers: 0, channel: false, chapters: (body.chapters || []).length });
    }
    if (path === 'app/rename') {
      const name = String(body.name || '').trim();
      if (name.length < 2) return fail(400, 'اسم مینی‌اپ حداقل ۲ حرف باشد');
      a.name = name; a.updated_at = now(); save(d);
      return Promise.resolve({ app: appJson(a) });
    }
    if (path === 'app/status') {
      a.status = body.active ? 'active' : 'paused'; save(d);
      return Promise.resolve({ app: appJson(a) });
    }
    if (path === 'app/remove_kit') {
      const doc = Object.assign(blank(), { kit: 'base', theme: { accent: '#1D55F0', mode: 'light', radius: 'soft', radius_px: 18, bg: 'tint' } });
      doc.tabbar = { enabled: false, style: 'floating' };
      a.draft = doc; a.published = JSON.parse(JSON.stringify(doc)); a.published_at = now(); a.pubCh = []; a.announced = []; save(d);
      return Promise.resolve({ doc: doc, app: appJson(a) });
    }
    if (path === 'app/welcome') {
      const text = String(body.text || '').trim().slice(0, 1000);
      a.welcome = text ? escapeHtml(text) : ''; save(d);
      return Promise.resolve({ app: appJson(a) });
    }
    if (path === 'app/save' || path === 'app/publish') {
      const doc = JSON.parse(JSON.stringify(body.doc));
      const err = check(doc, P);
      if (err) return fail(402, err);
      a.draft = doc; a.updated_at = now();
      let kit = {};
      if (path === 'app/publish') {
        a.published = JSON.parse(JSON.stringify(doc)); a.published_at = now();
        // مثل kits.shab.on_publish: قسمت‌هایی که تا حالا منتشر نشده بودند
        const seen = new Set((a.pubCh || []).concat(a.announced || []));
        const fresh = [];
        (doc.pages || []).forEach(pg => (pg.blocks || []).forEach(b => {
          if (b.type !== 'story') return;
          (b.props.chapters || []).forEach(c => { if (!c.draft && c.id && !seen.has(c.id)) fresh.push({ id: c.id, story: b.props.title || '', title: c.title || '' }); });
        }));
        a.pubCh = (a.pubCh || []).concat(fresh.map(c => c.id));
        kit = { new_chapters: fresh };
      }
      save(d);
      return Promise.resolve({ doc: doc, app: appJson(a), kit: kit });
    }
    return fail(404, 'پیدا نشد');
  }

  /* ربات‌ساز (همان شکل app/botkit/api.py) — ربات نمایشی وصل و روی ایزی‌ساز است */
  function botDoc(name) {
    const m = (id, nm, text, extra) => Object.assign({ id: id, name: nm, text: text, media: null, kb: 'none', rows: [], keys: [],
      kbopt: { resize: true, once: false, persist: false, placeholder: '' },
      opts: { replace: true, typing: false, effect: '', preview: false, silent: false, protect: false, remove_kb: false },
      cmd: '', kw: [], then: '', wait: null, steps: [], group: '' }, extra || {});
    const b = (id, text, style, act) => ({ id: id, text: text, style: style || '', icon: '', act: act });
    return {
      v: 1, start: 'm_welcome', fallback: '', vars: [
        { name: 'امتیاز', type: 'number', scope: 'user', init: '0', formula: '' },
        { name: 'قیمت', type: 'number', scope: 'bot', init: '480000', formula: '' },
        { name: 'تعداد', type: 'number', scope: 'user', init: '2', formula: '' },
        { name: 'جمع سبد', type: 'number', scope: 'user', init: '', formula: '{قیمت} × {تعداد} − ۱۰٪' },
        { name: 'شماره', type: 'text', scope: 'user', init: '', formula: '' },
        { name: 'سن', type: 'number', scope: 'user', init: '', formula: '' },
      ], comps: [],
      msgs: [
        m('m_welcome', 'خوش‌آمد', 'سلام {نام} 👋\nبه ربات <b>' + escapeHtml(name) + '</b> خوش اومدی. چی دوست داری ببینی؟', { kb: 'inline', rows: [
          [b('b_courses', '📚 دوره‌ها', 'primary', { type: 'goto', to: 'm_courses' }), b('b_price', '💰 قیمت‌ها', '', { type: 'goto', to: 'm_price' })],
          [b('b_reg', '📝 ثبت‌نام در کلاس', 'success', { type: 'goto', to: 'm_reg' })],
        ] }),
        m('m_courses', 'دوره‌ها', '<b>دوره‌های این فصل</b>\nعکاسی پرتره · عکاسی با موبایل · نور و ترکیب‌بندی', { kb: 'inline', rows: [
          [b('b_app', '🎓 دیدن دوره‌ها', 'primary', { type: 'app', url: '' })], [b('b_back1', '↩️ برگشت', '', { type: 'goto', to: 'm_welcome' })],
        ] }),
        m('m_price', 'قیمت‌ها', 'هر دوره {قیمت} تومان.\nبرای دو دوره: <b>{جمع سبد}</b> تومان 🎁', { kb: 'inline', rows: [
          [b('b_code', '📋 کپی کد تخفیف', 'success', { type: 'copy', text: 'SARA-PAIZ-20' })], [b('b_back2', '↩️ برگشت', '', { type: 'goto', to: 'm_welcome' })],
        ] }),
        m('m_reg', 'ثبت‌نام', 'برای ثبت‌نام شماره‌ات رو با دکمهٔ پایین بفرست 👇', { kb: 'reply', keys: [
          [{ id: 'k_phone', text: '📱 فرستادن شماره', style: 'success', icon: '', act: { type: 'contact', var: 'شماره', to: 'm_age' } }],
          [{ id: 'k_back', text: '↩️ برگشت', style: '', icon: '', act: { type: 'text', to: 'm_welcome' } }],
        ], kbopt: { resize: true, once: true, persist: false, placeholder: 'شماره‌ات را بفرست' } }),
        m('m_age', 'پرسش سن', 'چند سالته؟ 🎂', { opts: { replace: true, typing: false, effect: '', preview: false, silent: false, protect: false, remove_kb: true },
          wait: { kind: 'var', var: 'سن', to: 'm_done', check: 'number', min: 7, max: 90, error: 'لطفاً سنت رو با عدد بفرست 🙂' } }),
        m('m_done', 'ثبت شد', 'ممنون {نام} 🌱 شماره‌ات ({شماره}) ثبت شد؛ به‌زودی تماس می‌گیریم.', { steps: [
          { type: 'calc', var: 'امتیاز', op: '+', value: '10' },
          { type: 'save', form: 'ثبت‌نام کلاس', vars: ['نام', 'سن', 'شماره'], notify: true },
          { type: 'if', rules: [{ k: 'var', a: 'امتیاز', op: '>=', b: '50' }], mode: 'and', yes: 'm_vip', no: '' },
        ], opts: { replace: true, typing: true, effect: '🎉', preview: false, silent: false, protect: false, remove_kb: true } }),
        m('m_vip', 'جایزهٔ ویژه', '🏆 تو جزو شاگردهای ویژه‌ای! کد تخفیف: <b>VIP-50</b>'),
      ],
    };
  }
  function demoRows() {
    const ppl = [['سارا', '22', '09123456789'], ['علی', '31', '09352221100'], ['مریم', '19', '09017774545'], ['رضا', '27', '09198081234'], ['نگار', '24', '09121112233'], ['امید', '35', '09367778899']];
    const t = now();
    return ppl.map((p, i) => ({ id: 100 - i, tg_id: 5000 + i, name: p[0], username: '', data: { 'نام': p[0], 'سن': p[1], 'شماره': p[2] }, test: false, at: t - i * 5400 - (i > 3 ? 86400 : 0) }));
  }
  function botApi(path, body, d, find) {
    const qs = path.indexOf('?') > 0 ? new URLSearchParams(path.slice(path.indexOf('?') + 1)) : null;
    const id = qs ? qs.get('id') : body && body.id;
    const a = find(id);
    if (!a) return fail(404, 'مینی‌اپ پیدا نشد');
    if (!a.bk) {
      a.bk = { doc: botDoc(a.name), pub: null, emoji: [{ id: '5100000000000000001', alt: '🔥', pack: '' }, { id: '5100000000000000002', alt: '📷', pack: '' }, { id: '5100000000000000003', alt: '⭐', pack: '' }],
        bot: { connected: true, username: 'sara_photo_bot', name: a.name, mode: 'full', live: false, published_at: null } };
      save(d);
    }
    const bk = a.bk;
    const copy = o => JSON.parse(JSON.stringify(o));
    if (path.indexOf('bot?id=') === 0) {
      return Promise.resolve({ app: { id: a.id, name: a.name, slug: 'demo', url: pageUrl() }, bot: bk.bot, doc: copy(bk.doc), published: bk.pub && copy(bk.pub),
        fresh: false, stats: { users: bk.pub ? 1240 : 0, today: bk.pub ? 86 : 0 }, emoji: bk.emoji, premium: true, main_bot: 'EasySazBot', limits: { msgs: 120, vars: 60 } });
    }
    if (path === 'bot/save') { bk.doc = copy(body.doc); save(d); return Promise.resolve({ doc: body.doc }); }
    if (path === 'bot/publish') {
      bk.doc = copy(body.doc); bk.pub = copy(body.doc); bk.bot.live = true; bk.bot.published_at = now(); save(d);
      return Promise.resolve({ doc: body.doc, published: body.doc, bot: bk.bot, stats: { users: 1240, today: 86 } });
    }
    if (path === 'bot/off') { bk.pub = null; bk.bot.live = false; save(d); return Promise.resolve({ bot: bk.bot, published: null }); }
    if (path === 'bot/takeover') { bk.bot.mode = 'full'; save(d); return Promise.resolve({ bot: bk.bot }); }
    if (path === 'bot/test') { if (body.doc) { bk.doc = copy(body.doc); save(d); } return Promise.resolve({ ok: true, link: 'https://t.me/' + bk.bot.username }); }
    if (path === 'bot/emoji_pack') {
      const add = [['🎓', '5200000000000000001'], ['💬', '5200000000000000002'], ['📍', '5200000000000000003'], ['🚀', '5200000000000000004']]
        .filter(([, i]) => !bk.emoji.some(e => e.id === i));
      add.forEach(([alt, i]) => bk.emoji.push({ id: i, alt: alt, pack: 'SaraIcons' }));
      save(d);
      return Promise.resolve({ added: add.length, emoji: bk.emoji });
    }
    if (path === 'bot/emoji_del') { bk.emoji = bk.emoji.filter(e => e.id !== body.emoji); save(d); return Promise.resolve({ emoji: bk.emoji }); }
    if (path.indexOf('bot/data?') === 0) {
      const rows = demoRows();
      const out = { forms: [{ form: 'ثبت‌نام کلاس', count: rows.length, last: rows[0].at, today: rows.filter(r => r.at > now() - 86400).length }] };
      if (qs.get('form')) { out.form = qs.get('form'); out.rows = qs.get('form') === 'ثبت‌نام کلاس' ? rows : []; }
      return Promise.resolve(out);
    }
    if (path === 'bot/data_export') return Promise.resolve({ ok: true, count: demoRows().length });
    if (path.indexOf('bot/ai') === 0) return aiDemo(path, body, qs, bk, d, copy);
    return fail(404, 'پیدا نشد');
  }

  /* دستیار ساخت ربات در نسخهٔ نمایشی: جواب‌های آماده با تایپ تدریجی، بدون سرویس هوش مصنوعی */
  function aiDemo(path, body, qs, bk, d, copy) {
    bk.ai = bk.ai || { turns: [], used: 0 };
    const A = bk.ai;
    const view = t => ({ id: t.id, ask: t.ask, say: t.status === 'done' ? t.say : t.say.slice(0, Math.max(0, Math.floor((Date.now() - t.t0 - 700) / 28))),
      status: t.status, error: t.error || '', result: t.result, created_at: Math.floor(t.t0 / 1000),
      can_undo: t.status === 'done' && !!(t.result.changes || []).length && !t.result.undone });
    if (path.indexOf('bot/ai?') === 0) return Promise.resolve({ enabled: true, turns: A.turns.map(view), quota: { used: A.used, limit: 20 }, max_ask: 800, insights: [] });
    if (path === 'bot/ai_send') {
      if (A.turns.some(t => t.status === 'running')) return fail(409, 'دستیار هنوز روی پیام قبلی کار می‌کند');
      const before = copy(body.doc || bk.doc);
      const plan = demoPlan(body.text, before);
      const t = { id: A.turns.length + 1, ask: (body.image ? '📷 ' : '') + body.text, say: plan.say, status: 'running', t0: Date.now(), result: {}, before, after: plan.doc, res: plan.res };
      A.turns.push(t); A.used++; save(d);
      return Promise.resolve({ turn: t.id, pos: 0, quota: { used: A.used, limit: 20 } });
    }
    if (path.indexOf('bot/ai_poll?') === 0) {
      const t = A.turns.find(x => x.id === Number(qs.get('turn')));
      if (!t) return fail(404, 'پیدا نشد');
      if (t.status === 'running' && Date.now() - t.t0 > 700 + t.say.length * 28 + 900) {
        t.status = 'done'; t.result = t.res;
        if (t.after) bk.doc = copy(t.after);
        save(d);
      }
      return Promise.resolve(Object.assign({ turn: view(t) }, t.status === 'done' ? { doc: copy(bk.doc) } : {}));
    }
    if (path === 'bot/ai_stop') {
      A.turns.forEach(t => { if (t.status !== 'done' && t.status !== 'error') { t.status = 'error'; t.error = 'متوقفش کردی؛ پیش‌نویس دست نخورد'; t.say = ''; } });
      save(d);
      return Promise.resolve({ turns: A.turns.map(view) });
    }
    if (path === 'bot/ai_undo') {
      const t = A.turns.find(x => x.id === body.turn);
      if (!t) return fail(404, 'پیدا نشد');
      bk.doc = copy(t.before);
      A.turns.filter(x => x.id >= t.id).forEach(x => { x.result = Object.assign({}, x.result, { undone: true }); });
      save(d);
      return Promise.resolve({ doc: copy(bk.doc), turns: A.turns.map(view) });
    }
    return fail(404, 'پیدا نشد');
  }
  function demoPlan(text, doc) {
    const copy = o => JSON.parse(JSON.stringify(o));
    const msg = (id, name, txt, extra) => Object.assign({ id, name, text: txt, media: null, kb: 'none', rows: [], keys: [],
      kbopt: { resize: true, once: false, persist: false, placeholder: '' },
      opts: { replace: true, typing: false, effect: '', preview: false, silent: false, protect: false, remove_kb: false }, cmd: '', kw: [], then: '', wait: null, group: '' }, extra || {});
    const btn = (id, t, style, to) => ({ id, text: t, style, icon: '', act: { type: 'goto', to } });
    const stats = x => ({ msgs: x.msgs.length, buttons: x.msgs.reduce((n, m) => n + m.rows.concat(m.keys).reduce((a, r) => a + r.length, 0), 0), vars: x.vars.length });
    const sig = m => JSON.stringify((m.kb === 'reply' ? m.keys : m.kb === 'inline' ? m.rows : []).map(r => r.map(k => [k.text, k.style, k.act])));
    const pvs = (o, x) => {
      const om = {};
      o.msgs.forEach(m => { om[m.id] = m; });
      const list = x.msgs.filter(m => !om[m.id] || om[m.id].text !== m.text || om[m.id].name !== m.name || sig(om[m.id]) !== sig(m)).map(m => {
        const a = om[m.id];
        const ob = a ? a.rows.concat(a.keys).reduce((l, r) => l.concat(r), []) : [];
        const hl = k => !!a && !ob.some(q => (q.id === k.id || q.text === k.text) && q.text === k.text && q.style === k.style && JSON.stringify(q.act) === JSON.stringify(k.act));
        const rows = (m.kb === 'reply' ? m.keys : m.kb === 'inline' ? m.rows : []).map(r => r.map(k => ({ text: k.text, style: k.style, hl: hl(k) })));
        const flags = rows.reduce((l, r) => l.concat(r.map(k => k.hl)), []);
        let kind = a ? 'mod' : 'add', tc = !!a && a.text !== m.text;
        if (a && (tc || !flags.length) && flags.every(Boolean)) { kind = 'new'; tc = false; rows.forEach(r => r.forEach(k => { k.hl = false; })); }
        return { id: m.id, name: m.name, kind, text: m.text, kb: m.kb, text_changed: tc, rows };
      });
      return { previews: list.slice(0, 3), previews_more: Math.max(0, list.length - 3) };
    };
    const pv = x => { const m = x.msgs.find(y => y.id === x.start); return m && { id: m.id, name: m.name, text: m.text, kb: m.kb, rows: (m.kb === 'reply' ? m.keys : m.rows).map(r => r.map(b => ({ text: b.text, style: b.style }))) }; };
    if (/سبز/.test(text) && doc.msgs.some(m => m.rows.some(r => r.some(b => /ثبت/.test(b.text))))) {
      const x = copy(doc);
      let name = '';
      x.msgs.forEach(m => m.rows.forEach(r => r.forEach(b => { if (/ثبت/.test(b.text)) { b.style = 'success'; name = b.text; } })));
      return { say: 'سبزش کردم ✅\nحالا دکمهٔ **' + name + '** بیشتر به چشم می‌آد و کاربر راحت‌تر ثبت‌نام می‌کنه.\n\n**پیشنهاد بعدی:** برای دورهٔ پیشرفته یه تخفیف ۱۰٪ بذار.', doc: x,
        res: { changes: [{ k: 'mod', t: `دکمهٔ «${name}» ← سبز` }], more: 0, chips: ['۱۰٪ تخفیف بذار', 'یه دکمهٔ اینستاگرام هم بذار'], stats: stats(x), preview: pv(x), ...pvs(doc, x), warnings: [] } };
    }
    if (/ربات|بساز|کلاس|فروشگاه|ثبت|دوره|نوبت|پشتیبانی/.test(text)) {
      const x = { v: 1, start: 'm_welcome', fallback: '', comps: [], vars: [{ name: 'شماره', type: 'text', scope: 'user', init: '', formula: '' }], msgs: [
        msg('m_welcome', 'خوش‌آمد', 'سلام {نام} 👋\nبه <b>کلاس عکاسی سارا</b> خوش اومدی. کدوم دوره رو می‌خوای ببینی؟', { kb: 'inline', rows: [[btn('b_1', '📚 دوره‌ها', 'primary', 'm_courses')], [btn('b_2', '📝 ثبت‌نام', '', 'm_reg'), btn('b_3', '❓ سؤال دارم', '', 'm_faq')]] }),
        msg('m_courses', 'دوره‌ها', '📷 <b>مقدماتی</b>: [قیمت]\n🎞 <b>پیشرفته</b>: [قیمت]', { kb: 'inline', rows: [[btn('b_4', '📝 ثبت‌نام', 'success', 'm_reg')], [btn('b_5', '↩️ برگشت', '', 'm_welcome')]] }),
        msg('m_reg', 'ثبت‌نام', 'برای ثبت‌نام، شماره‌ت رو با دکمهٔ پایین بفرست 👇', { kb: 'reply', keys: [[{ id: 'k_1', text: '📱 ارسال شماره', style: 'primary', icon: '', act: { type: 'contact', var: 'شماره', to: 'm_thanks' } }]] }),
        msg('m_thanks', 'ممنون', 'ثبت شد ✅ به‌زودی باهات تماس می‌گیریم.', { opts: { replace: true, typing: false, effect: '', preview: false, silent: false, protect: false, remove_kb: true } }),
        msg('m_faq', 'سؤالات', 'سؤالت رو بنویس؛ همین‌جا جواب می‌دیم 🙂', { kb: 'inline', rows: [[btn('b_6', '↩️ برگشت', '', 'm_welcome')]] }),
      ] };
      return { say: 'ساختمش ✅ ربات ثبت‌نام کلاس عکاسی آماده است.\n\n**چی ساختم**\n- پیام **خوش‌آمد** با اسم کاربر و سه دکمه\n- صفحهٔ **دوره‌ها** با قیمت هر دوره\n- **ثبت‌نام** با دکمهٔ «📱 ارسال شماره» و ذخیره در {شماره}\n- پیام **ممنون** بعد از ثبت شماره\n- صفحهٔ **سؤالات** با دکمهٔ برگشت\n\nجاهای «[قیمت]» رو با قیمت واقعی پر کن.\n\n**پیشنهاد بعدی:** دکمهٔ ثبت‌نام رو سبز کن تا بیشتر دیده بشه.', doc: x,
        res: { changes: [{ k: 'mod', t: 'متن «خوش‌آمد»' }, { k: 'add', t: 'پیام «دوره‌ها» با ۲ دکمه' }, { k: 'add', t: 'پیام «ثبت‌نام» با ۱ دکمه' }, { k: 'add', t: 'پیام «ممنون»' }, { k: 'add', t: 'پیام «سؤالات» با ۱ دکمه' }, { k: 'add', t: 'متغیر {شماره}' }],
          more: 0, chips: ['دکمهٔ «ثبت‌نام» رو سبز کن', 'قیمت‌ها رو بنویس', 'یه دکمهٔ اینستاگرام هم بذار'], stats: stats(x), preview: pv(x), ...pvs(doc, x), warnings: ['جاهای «[…]» را با اطلاعات خودت پر کن'] } };
    }
    return { say: 'این نسخهٔ نمایشی است 🙂 بگو «یه ربات برای کلاس عکاسیم بساز» تا ببینی دستیار چطور می‌سازد.', doc: null,
      res: { changes: [], more: 0, chips: ['یه ربات برای کلاس عکاسیم بساز'], stats: stats(doc), preview: null, warnings: [] } };
  }

  /* پاسخ /api/page/demo برای صفحهٔ منتشرشده */
  function page() {
    const d = db();
    const a = d.apps[0];
    const branding = plan(d).branding;
    if (a && a.status === 'paused') return { name: a.name, paused: true };
    if (a && a.published) {
      // مثل api.page → blocks.reader_view: قسمت‌های پیش‌نویس به خواننده نمی‌رسند
      const doc = JSON.parse(JSON.stringify(a.published));
      (doc.pages || []).forEach(pg => (pg.blocks || []).forEach(b => {
        if (b.type === 'story' && b.props) b.props.chapters = (b.props.chapters || []).filter(c => !c.draft);
      }));
      return { name: a.name, doc: doc, branding: branding, brand_bot: 'EasySazBot' };
    }
    return { name: 'قسمت', doc: blank(), branding: branding, brand_bot: 'EasySazBot' };
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  window.EasySazDemo = { api, page, pageUrl, reset };
})();
