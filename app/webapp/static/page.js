/* ایزی‌ساز — مینی‌اپ منتشرشده (داخل ربات مشتری) */
(function () {
  'use strict';
  const tg = window.Telegram && window.Telegram.WebApp;
  const ES = window.EasySaz;
  const BASE = document.documentElement.dataset.base || '/';
  const root = document.getElementById('root');
  const slug = (location.pathname.split('/a/')[1] || '').split('/')[0];
  const demo = slug === 'demo';

  function insets() {
    let top = 0, bottom = 0;
    if (tg) {
      const sa = tg.safeAreaInset || {}, ca = tg.contentSafeAreaInset || {};
      top = (sa.top || 0) + (ca.top || 0);
      bottom = (sa.bottom || 0) + (ca.bottom || 0);
    }
    root.style.setProperty('--pg-top', top + 'px');
    root.style.setProperty('--pg-bottom', bottom + 'px');
  }

  /* رنگ سربرگ و زمینهٔ تلگرام همان زمینهٔ صفحه می‌شود */
  function paint(bg) {
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    if (tg) { try { tg.setBackgroundColor(bg); tg.setHeaderColor(bg); tg.setBottomBarColor && tg.setBottomBarColor(bg); } catch (e) {} }
  }

  function state(iconName, title, text, theme) {
    root.textContent = '';
    const pal = ES.applyTheme(root, theme || {});
    const box = ES.h('div', 'state');
    const tile = ES.h('div', 'state-tile');
    tile.appendChild(ES.icon(iconName));
    box.append(tile, ES.h('h1', '', title), ES.h('p', '', text));
    root.appendChild(box);
    paint(pal.bg);
  }

  async function fetchPage() {
    if (demo) return { ok: true, data: window.EasySazDemo.page() };
    const res = await fetch(BASE + 'api/page/' + encodeURIComponent(slug), { cache: 'no-store' });
    return { ok: res.ok, data: await res.json() };
  }

  async function load() {
    let r;
    try { r = await fetchPage(); } catch (e) {
      state('website', 'اتصال برقرار نشد', 'اینترنتت رو چک کن و دوباره باز کن.');
      return;
    }
    const data = r.data;
    if (!r.ok) { state('spark', 'پیدا نشد', data.error || 'این مینی‌اپ وجود ندارد.'); return; }
    if (data.paused) { state('spark', data.name, 'این مینی‌اپ موقتاً در دسترس نیست.'); return; }
    const doc = data.doc || { blocks: [] };
    if (!doc.blocks || !doc.blocks.length) { state('spark', data.name, 'به‌زودی اینجا چیزهای خوبی می‌بینی.', doc.theme); return; }
    const pal = ES.render(root, doc, { branding: data.branding ? { bot: data.brand_bot } : null });
    insets();
    paint(pal.bg);
  }

  function view() {
    if (demo || !tg || !tg.initData) return;
    fetch(BASE + 'api/page/' + encodeURIComponent(slug) + '/view', { method: 'POST', headers: { 'X-Init-Data': tg.initData } }).catch(() => {});
  }

  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.disableVerticalSwipes(); } catch (e) {}
    tg.onEvent('safeAreaChanged', insets);
    tg.onEvent('contentSafeAreaChanged', insets);
    tg.onEvent('themeChanged', load);
  }
  insets();
  load();
  view();
})();
