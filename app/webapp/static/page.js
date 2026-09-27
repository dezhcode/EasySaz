/* EasySaz — مینی اپ عمومی (داخل ربات مشتری) */
(function () {
  'use strict';
  const tg = window.Telegram && window.Telegram.WebApp;
  const ES = window.EasySaz;
  const BASE = document.documentElement.dataset.base || '/';
  const root = document.getElementById('root');
  const slug = (location.pathname.split('/a/')[1] || '').split('/')[0];

  function insets() {
    let top = 0, bottom = 0;
    if (tg) {
      const sa = tg.safeAreaInset || {}, ca = tg.contentSafeAreaInset || {};
      top = (sa.top || 0) + (ca.top || 0);
      bottom = (sa.bottom || 0) + (ca.bottom || 0);
    }
    root.style.setProperty('--es-top', top + 'px');
    root.style.setProperty('--es-bottom', bottom + 'px');
  }

  function paint() {
    const bg = getComputedStyle(root).getPropertyValue('--es-bg').trim();
    if (tg && bg) {
      try { tg.setBackgroundColor(bg); tg.setHeaderColor(bg); tg.setBottomBarColor && tg.setBottomBarColor(bg); } catch (e) {}
    }
    document.documentElement.style.background = bg;
  }

  function state(iconName, title, text, theme) {
    root.textContent = '';
    ES.applyTheme(root, theme || {});
    const box = ES.h('div', 'pg-state');
    const ic = ES.h('div', 'pg-state-ico');
    ic.appendChild(ES.icon(iconName));
    box.append(ic, ES.h('h1', '', title), ES.h('p', '', text));
    root.appendChild(box);
    paint();
  }

  async function load() {
    let res, data;
    try {
      res = await fetch(BASE + 'api/page/' + encodeURIComponent(slug), { cache: 'no-store' });
      data = await res.json();
    } catch (e) {
      state('website', 'اتصال برقرار نشد', 'اینترنتت رو چک کن و دوباره باز کن.');
      return;
    }
    if (!res.ok) { state('spark', 'پیدا نشد', data.error || 'این مینی اپ وجود ندارد.'); return; }
    if (data.paused) { state('spark', data.name, 'این مینی اپ موقتاً در دسترس نیست.'); return; }

    const doc = data.doc || { blocks: [] };
    if (!doc.blocks || !doc.blocks.length) {
      state('spark', data.name, 'به‌زودی اینجا چیزهای جذابی می‌بینی ✨', doc.theme);
      return;
    }
    ES.render(root, doc, { branding: data.branding ? { bot: data.brand_bot } : null });
    insets();
    paint();
  }

  function view() {
    if (!tg || !tg.initData) return;
    fetch(BASE + 'api/page/' + encodeURIComponent(slug) + '/view', {
      method: 'POST',
      headers: { 'X-Init-Data': tg.initData },
    }).catch(() => {});
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
