/* ایزی‌ساز — حالت نمایشی فرانت‌اند
   برای ساختن و دیدن رابط کاربری بدون تلگرام و بدون سرور:
     /panel#demo   پنل ساخت با دادهٔ نمونه (در localStorage همین مرورگر)
     /a/demo       صفحهٔ منتشرشدهٔ همان دادهٔ نمایشی
   سرور در این حالت صدا زده نمی‌شود. همان پاسخ‌هایی را برمی‌گرداند که
   app/webapp/api.py می‌دهد، تا کد پنل برای دو حالت یکی باشد. */
(function () {
  'use strict';

  const KEY = 'es-demo-v1';
  const PLAN = { key: 'free', title: 'رایگان', max_apps: 1, max_blocks: 8, premium_blocks: false, branding: true };

  function sample() {
    return {
      v: 1,
      theme: { accent: '#2A63F5', mode: 'auto', radius: 'soft', bg: 'tint' },
      blocks: [
        { id: 'bhero0001', type: 'hero', props: { title: 'کافه نارنج', subtitle: 'قهوهٔ تازه‌برشت و کیک خانگی، هر روز از ۸ صبح.', image: '', style: 'solid', align: 'center' } },
        { id: 'bnote0001', type: 'notice', props: { text: '۲۰٪ تخفیف همهٔ نوشیدنی‌ها تا آخر هفته', tone: 'accent' } },
        { id: 'blink0001', type: 'links', props: { items: [
          { label: 'منوی کامل', note: 'نوشیدنی‌ها و کیک‌ها', url: 'https://example.com/menu' },
          { label: 'کانال تلگرام', note: 'منوی روز و تخفیف‌ها', url: 'https://t.me/durov' }] } },
        { id: 'btext0001', type: 'text', props: { title: 'درباره ما', body: 'نارنج از ۱۳۹۸ یک گوشهٔ کوچک در خیابان ولیعصر است. دانه‌ها را خودمان برشته می‌کنیم و منو هر فصل عوض می‌شود.', align: 'start' } },
        { id: 'bbtn00001', type: 'button', props: { label: 'سفارش آنلاین', url: 'https://example.com/order', style: 'primary' } },
        { id: 'bfaq00001', type: 'faq', props: { title: 'سوالات متداول', items: [
          { q: 'ساعت کاری کافه چیه؟', a: 'هر روز از ۸ صبح تا ۱۱ شب. جمعه‌ها از ۱۰.' },
          { q: 'پیک دارید؟', a: 'تا ۳ کیلومتری کافه، رایگان.' }] } },
        { id: 'bsoc00001', type: 'social', props: { items: [
          { kind: 'telegram', value: 'durov' }, { kind: 'instagram', value: 'naranj.cafe' }, { kind: 'phone', value: '+982100000000' }] } },
      ],
    };
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
      d = { apps: [] };
      save(d);
    }
    return d;
  }
  function appJson(a) {
    return {
      id: a.id, name: a.name, slug: 'demo', url: location.origin + (document.documentElement.dataset.base || '/') + 'a/demo',
      bot_username: a.bot_username || null, mode: a.bot_username ? 'menu' : 'none', status: 'active',
      published_at: a.published ? a.published_at : null, updated_at: a.updated_at,
      dirty: JSON.stringify(a.draft) !== JSON.stringify(a.published),
    };
  }
  function fail(status, message) {
    const e = new Error(message);
    e.status = status;
    return Promise.reject(e);
  }
  function now() { return Math.floor(Date.now() / 1000); }

  /* همان شکل پاسخ‌های /api */
  function api(path, body) {
    const d = db();
    const find = id => d.apps.find(a => String(a.id) === String(id));
    if (path === 'me') {
      return Promise.resolve({ user: { id: 1, first_name: 'مهمان' }, plan: PLAN, apps: d.apps.map(appJson), can_create: d.apps.length < PLAN.max_apps, bot: 'EasySazBot' });
    }
    if (path.indexOf('app?id=') === 0) {
      const a = find(decodeURIComponent(path.split('=')[1]));
      if (!a) return fail(404, 'مینی‌اپ پیدا نشد');
      return Promise.resolve({ app: appJson(a), doc: a.draft, stats: { visitors: 1284, views_today: 96, views_week: 702 }, plan: PLAN });
    }
    if (path === 'app/create') {
      const name = String(body.name || '').trim();
      if (name.length < 2) return fail(400, 'اسم مینی‌اپ حداقل ۲ حرف باشد');
      if (d.apps.length >= PLAN.max_apps) return fail(402, 'پلن رایگان فقط ۱ مینی‌اپ دارد. برای بیشتر، پلن بگیر.');
      const empty = { v: 1, theme: sample().theme, blocks: [] };
      const a = { id: d.apps.length + 1, name: name, draft: empty, published: null, updated_at: now() };
      d.apps.push(a); save(d);
      return Promise.resolve({ app: appJson(a), doc: a.draft });
    }
    const a = find(body && body.id);
    if (!a) return fail(404, 'مینی‌اپ پیدا نشد');
    if (path === 'app/rename') {
      const name = String(body.name || '').trim();
      if (name.length < 2) return fail(400, 'اسم مینی‌اپ حداقل ۲ حرف باشد');
      a.name = name; a.updated_at = now(); save(d);
      return Promise.resolve({ app: appJson(a) });
    }
    if (path === 'app/save' || path === 'app/publish') {
      const doc = JSON.parse(JSON.stringify(body.doc));
      if (doc.blocks.length > PLAN.max_blocks) return fail(402, 'پلن فعلی تو حداکثر ' + PLAN.max_blocks + ' کامپوننت دارد');
      a.draft = doc; a.updated_at = now();
      if (path === 'app/publish') { a.published = JSON.parse(JSON.stringify(doc)); a.published_at = now(); }
      save(d);
      return Promise.resolve({ doc: doc, app: appJson(a) });
    }
    return fail(404, 'پیدا نشد');
  }

  /* پاسخ /api/page/demo برای صفحهٔ منتشرشده */
  function page() {
    const a = db().apps[0];
    if (a && a.published) return { name: a.name, doc: a.published, branding: true, brand_bot: 'EasySazBot' };
    return { name: 'کافه نارنج', doc: sample(), branding: true, brand_bot: 'EasySazBot' };
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  window.EasySazDemo = { api, page, sample, reset };
})();
