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
