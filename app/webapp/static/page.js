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

  function state(iconName, title, text, theme, kit) {
    root.textContent = '';
    const pal = ES.applyTheme(root, theme || {}, kit);
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

  /* ---------- سرور قسمت: متن قسمت، جای خواندن، نشان‌ها ----------
     هویت خواننده initData ربات همین مینی‌اپ است (سرور امضا را می‌سنجد).
     بیرون از تلگرام فقط متن قسمت‌های آزاد گرفته می‌شود و بقیه در گوشی می‌ماند. */
  const initData = (!demo && tg && tg.initData) || '';
  function shabRemote() {
    if (demo) return null;
    const url = tail => BASE + 'api/page/' + encodeURIComponent(slug) + '/' + tail;
    const headers = extra => Object.assign({ 'X-Init-Data': initData }, extra || {});
    const post = (tail, body) => initData
      ? fetch(url(tail), { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(body), keepalive: true }).catch(() => {})
      : Promise.resolve();
    // جای خواندن هر چند ثانیه یک بار فرستاده می‌شود، نه با هر اسکرول
    let pending = null, timer = 0;
    const flush = () => { clearTimeout(timer); timer = 0; if (pending) { const b = pending; pending = null; post('progress', b); } };
    return {
      canSync: !!initData,
      async chapter(id, fresh) {
        const res = await fetch(url('chapter?id=' + encodeURIComponent(id) + (fresh ? '&fresh=1' : '')), { headers: headers(), cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'error');
        return data;
      },
      progress(s, k, p) {
        if (!initData) return;
        if (pending && pending.k !== k) flush();
        pending = { s, k, p: Math.round(p * 1000) / 1000 };
        if (!timer) timer = setTimeout(flush, 4000);
      },
      flush,
      mark(s, k, on) { post('mark', { s, k, on: !!on }); },
      notify(on) { post('notify', { on: !!on }); },
      async me() {
        if (!initData) return null;
        const res = await fetch(url('me'), { headers: headers(), cache: 'no-store' });
        return res.ok ? res.json() : null;
      },
    };
  }
  const remote = shabRemote();

  /* ---------- مجله: متن مطلب و فهرست‌ها (عمومی) ---------- */
  function magRemote() {
    if (demo) return null;
    const url = tail => BASE + 'api/page/' + encodeURIComponent(slug) + '/mag/' + tail;
    const get = async tail => {
      const res = await fetch(url(tail), { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      return data;
    };
    const seen = new Set();
    return {
      post: async id => {
        const first = !seen.has(id);
        seen.add(id);
        return (await get('post?id=' + encodeURIComponent(id) + (first ? '&v=1' : ''))).post;
      },
      list: q => get('list?' + Object.entries(q).filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&')),
    };
  }
  const magApi = magRemote();
  document.addEventListener('visibilitychange', () => { if (document.hidden && remote) remote.flush(); });

  async function load() {
    let r;
    try { r = await fetchPage(); } catch (e) {
      state('website', 'اتصال برقرار نشد', 'اینترنتت رو چک کن و دوباره باز کن.');
      return;
    }
    const data = r.data;
    if (!r.ok) { state('spark', 'پیدا نشد', data.error || 'این مینی‌اپ وجود ندارد.'); return; }
    if (data.paused) { state('clock', data.name, 'فعلاً بسته است؛ به‌زودی برمی‌گردد.'); return; }
    const doc = ES.normalize(data.doc);
    const empty = doc.pages.every(pg => !(pg.blocks || []).length);
    if (empty) { state('spark', data.name, 'به‌زودی اینجا چیزهای خوبی می‌بینی.', doc.theme, doc.kit); return; }
    // #read=<قسمت> یا startapp=c_<قسمت>: همان قسمت مستقیم باز می‌شود
    const hash = decodeURIComponent(location.hash.slice(1));
    const startParam = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
    let readId = /^read=/.test(hash) ? hash.slice(5) : (/^c_/.test(startParam) ? startParam.slice(2) : '');
    // مجله: #post=<مطلب> یا startapp=a_<مطلب>
    let postId = /^post=/.test(hash) ? hash.slice(5) : (/^a_/.test(startParam) ? startParam.slice(2) : '');
    let current = hash && !/^(read|post)=/.test(hash) ? hash : null;
    const draw = () => {
      const pal = ES.render(root, doc, {
        page: current,
        appName: data.name,
        appKey: slug,
        remote: doc.kit === 'shab' ? remote : null,
        mag: data.mag || null,
        magApi: doc.kit === 'mag' ? magApi : null,
        fixedChrome: true,
        branding: data.branding ? { bot: data.brand_bot } : null,
        onNavigate: id => {
          current = id;
          try { history.replaceState(null, '', '#' + id); } catch (e) {}
          draw();
          window.scrollTo(0, 0);
        },
      });
      insets();
      paint(pal.bg);
    };
    draw();
    if (doc.kit === 'shab' && remote && remote.canSync) {
      // وضعیت خواندن این خواننده از سرور؛ اگر لایهٔ خواندن باز نیست، صفحه تازه می‌شود
      remote.me().then(me => {
        if (!me) return;
        ES.shabSeed(slug, me);
        if (!(root.__shab && root.__shab.length)) draw();
      }).catch(() => {});
    }
    if (postId && doc.kit === 'mag') {
      ES.magOpen(root, postId);
      postId = '';
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
    if (readId) {
      const opened = ES.shabOpen && ES.shabOpen(root, readId);
      readId = '';
      if (opened) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
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
