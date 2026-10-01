/* ورود با تلگرام: QR یک‌بارمصرف که هر ۳۰ ثانیه عوض می‌شود، پرسش هر ۲ ثانیه،
   سه قدم متحرک، و «وصل شدی» بعد از تأیید روی گوشی. */
(function () {
  'use strict';
  const BASE = document.body.dataset.base || '/';
  const $ = id => document.getElementById(id);
  const lg = $('lg'), qrEl = $('qr'), ring = $('ring'), secsEl = $('secs'), errEl = $('err');
  const steps = Array.from(document.querySelectorAll('#steps li'));
  const scene = document.querySelector('.scene');
  const fa = n => Number(n).toLocaleString('fa-IR');
  const touch = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/.test(navigator.userAgent);
  if (touch) lg.classList.add('touch');

  const S = { code: '', poll: '', refreshAt: 0, ttl: 30, fresh: 0, busy: false, state: 'loading', demoStep: 0 };
  const MAX_FRESH = 10; // حدود ۵ دقیقه؛ بعدش تا کاربر نخواهد QR تازه نمی‌سازیم

  async function api(path, body) {
    const r = await fetch(BASE + 'site/api/' + path, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-ES': '1' },
      body: JSON.stringify(body || {}),
    });
    let data = {};
    try { data = await r.json(); } catch (e) { /* خالی */ }
    if (!r.ok) { const e = new Error(data.error || 'خطا'); e.status = r.status; throw e; }
    return data;
  }

  function setState(st) {
    S.state = st;
    lg.dataset.state = st;
    if (st === 'scanned') markSteps(3);
    else if (st === 'done') markSteps(4);
    else if (st === 'pending') markSteps(S.demoStep || 1);
  }

  /* قدم‌ها: در انتظار اسکن، راهنما خودش قدم به قدم جلو می‌رود؛ بعد از اسکن واقعی می‌شود */
  function markSteps(cur) {
    steps.forEach((li, i) => {
      const n = i + 1, real = S.state === 'scanned' || S.state === 'done';
      li.classList.toggle('on', n === cur);
      li.classList.toggle('ok', real ? n < cur : false);
    });
    scene.className = 'scene s' + Math.min(cur, 3);
  }
  setInterval(() => {
    if (S.state !== 'pending' || document.hidden) return;
    S.demoStep = S.demoStep % 3 + 1;
    markSteps(S.demoStep);
  }, 3200);

  function drawQr(text) {
    const svg = window.ESQR.svg(text, { ecl: 'H', holeRatio: 0.25, quiet: 0 });
    qrEl.classList.add('swap');
    setTimeout(() => { qrEl.innerHTML = svg; qrEl.classList.remove('swap'); }, S.fresh > 1 ? 220 : 0);
    const mini = $('sc-qr');
    if (mini && !mini.firstChild) mini.innerHTML = window.ESQR.svg('https://t.me/EasySazBot', { quiet: 0 });
  }
  function restartRing() {
    ring.classList.remove('run');
    ring.style.setProperty('--ttl', S.ttl + 's');
    void ring.getBoundingClientRect();
    ring.classList.add('run');
  }

  async function fresh(manual) {
    if (S.busy) return;
    S.busy = true;
    errEl.textContent = '';
    if (manual) S.fresh = 0;
    try {
      const r = await api('login/start');
      S.code = r.code; S.poll = r.poll; S.ttl = r.refresh || 30; S.fresh++;
      S.refreshAt = Date.now() + S.ttl * 1000;
      drawQr(r.qr);
      $('same').href = r.link;
      const hint = $('bot-hint');
      if (hint && r.bot) hint.innerHTML = 'از منوی ربات <bdi class="ltr">@' + r.bot.replace(/[^\w]/g, '') + '</bdi>';
      setState('pending');
      restartRing();
    } catch (e) {
      errEl.textContent = e.status === 429 ? 'چند بار پشت سر هم QR ساختی؛ کمی صبر کن.' : 'اتصال برقرار نشد؛ دوباره امتحان می‌کنیم…';
      S.refreshAt = Date.now() + (e.status === 429 ? 30000 : 5000);
      if (S.state === 'loading') setState('idle');
    } finally {
      S.busy = false;
    }
  }

  async function poll() {
    if (!S.code || S.busy || document.hidden || !['pending', 'scanned'].includes(S.state)) return;
    try {
      const r = await api('login/poll', { code: S.code, poll: S.poll });
      errEl.textContent = '';
      if (r.status === 'scanned' && S.state !== 'scanned') setState('scanned');
      else if (r.status === 'approved') done(r.user || {});
      else if (r.status === 'denied') { S.code = ''; setState('denied'); }
      else if (r.status === 'used') location.href = BASE + 'account';
      else if (r.status === 'expired') { S.code = ''; fresh(); }
    } catch (e) {
      if (e.status === 404 || e.status === 400) { S.code = ''; fresh(); }
    }
  }

  function done(user) {
    S.code = '';
    const name = (user.first_name || '').trim();
    const av = $('av-l');
    if (user.photo_url) { av.style.backgroundImage = 'url("' + user.photo_url.replace(/["\\]/g, '') + '")'; av.textContent = ''; }
    else av.textContent = (name || '؟').charAt(0);
    $('hi').textContent = name ? 'سلام ' + name + '، وصل شدی' : 'وصل شدی';
    if (user.username) {
      const sub = $('hi-sub');
      sub.textContent = 'حساب تلگرام ';
      const b = document.createElement('bdi');
      b.className = 'ltr';
      b.textContent = '@' + user.username;
      sub.append(b, ' به این مرورگر وصل شد.');
    }
    setState('done');
    setTimeout(() => { location.href = BASE + 'account'; }, 2400);
  }

  /* شمارش معکوس و QR تازه */
  setInterval(() => {
    if (S.state === 'pending' || S.state === 'loading' || (S.state === 'idle' && !S.code && S.fresh === 0)) {
      const left = Math.max(0, Math.ceil((S.refreshAt - Date.now()) / 1000));
      secsEl.textContent = fa(left);
      if (left <= 0 && !document.hidden) {
        if (S.fresh >= MAX_FRESH) { S.code = ''; setState('idle'); } else fresh();
      }
    }
  }, 500);
  setInterval(poll, 2000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.state === 'pending' && Date.now() > S.refreshAt) fresh();
  });
  document.querySelectorAll('[data-fresh]').forEach(b => b.addEventListener('click', () => fresh(true)));
  $('same').addEventListener('click', e => { if ($('same').getAttribute('href') === '#') e.preventDefault(); });

  fresh();
})();
