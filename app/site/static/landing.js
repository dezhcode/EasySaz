/* لندینگ ایزی‌ساز: ماکت‌های مینی‌اپ، ظاهرشدن با اسکرول، رنگ زنده و نقطه‌های داستان. */
(function () {
  'use strict';
  const root = document.documentElement;
  root.classList.remove('no-js');
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const fa = n => Number(n).toLocaleString('fa-IR');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- مینی‌اپ ساختگی؛ عمداً هیچ قالب خاصی نیست ---------- */
  const THUMBS = ['#FBE3DC', '#DDF3F6', '#FDF0D5'];
  function miniApp(stage, stagger) {
    const pop = i => stagger ? ` pop" style="--d:${700 + i * 220}ms` : '';
    const head = `<div class="ma-head${pop(0)}"><span class="ma-av"></span><span class="ma-lines"><i></i><i></i></span><span class="ma-pill">عضو شو</span></div>`;
    const hero = `<div class="ma-hero${pop(1)}"><b>شروع کن</b></div>`;
    const rows = THUMBS.map((c, i) => `<div class="ma-row${pop(2 + i)}"><span class="ma-lines"><i></i><i></i><i></i></span><u style="background:${c}"></u></div>`).join('');
    const slots = n => '<div class="ma-row slot" style="aspect-ratio:3.6"></div>'.repeat(n);
    let body;
    if (stage === 'empty') body = '<div class="ma-row slot" style="aspect-ratio:6"></div><div class="ma-row slot" style="aspect-ratio:2.05"></div>' + slots(3);
    else if (stage === 'half') body = head + hero + slots(3);
    else body = head + hero + rows + `<div class="ma-tab${pop(5)}"><i></i></div>`;
    return '<span class="notch"></span><div class="scr"><div class="ma">'
      + '<div class="ma-sb"><b class="num">۹:۴۱</b><i><span></span></i></div>'
      + '<div class="ma-tb"><span>بستن</span><b>مینی‌اپ تو</b><i></i></div>'
      + `<div class="ma-body">${body}</div></div></div>`;
  }
  $$('[data-app]').forEach(el => { el.innerHTML = miniApp(el.dataset.app, el.dataset.stagger === '1'); });

  /* ---------- ظاهرشدن صحنه‌ها با اسکرول ---------- */
  const secs = $$('.sec');
  const onIn = new Map([
    ['manage', sec => countUp(sec.querySelector('[data-count]'))],
  ]);
  const show = sec => {
    if (sec.classList.contains('in')) return;
    sec.classList.add('in');
    const fn = onIn.get(sec.id);
    if (fn) fn(sec);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }),
      { threshold: 0.22, rootMargin: '0px 0px -8% 0px' });
    secs.forEach(s => io.observe(s));
  } else secs.forEach(show);
  requestAnimationFrame(() => setTimeout(() => show(secs[0]), 60));

  function countUp(el) {
    if (!el) return;
    const to = +el.dataset.count;
    if (still) { el.textContent = fa(to); return; }
    const t0 = performance.now(), dur = 1400;
    const tick = t => {
      const k = Math.min(1, (t - t0 - 500) / dur);
      el.textContent = fa(Math.round(to * (k <= 0 ? 0 : 1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- رنگ زنده: در سایت عوض می‌شود، گوشی همان لحظه ---------- */
  const COLORS = ['#4B2EE8', '#0E8FAE', '#12A071', '#E0573E'];
  const hero = document.getElementById('top');
  const sw = document.getElementById('swatches');
  let ci = 0, heroOn = true;
  if (sw) {
    sw.innerHTML = COLORS.map((c, i) => `<b style="background:${c}"${i ? '' : ' class="on"'}></b>`).join('');
    const dots = $$('b', sw);
    const paint = i => {
      ci = i;
      hero.style.setProperty('--acc', COLORS[i]);
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    dots.forEach((d, i) => d.addEventListener('mouseenter', () => paint(i)));
    if (!still) setInterval(() => { if (heroOn && !document.hidden) paint((ci + 1) % COLORS.length); }, 2600);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { heroOn = es[0].isIntersecting; }).observe(hero);
    }
  }

  /* ---------- QR نمایشی ---------- */
  const pq = document.getElementById('pub-qr');
  if (pq && window.ESQR) pq.innerHTML = window.ESQR.svg('https://t.me/your_bot', { ecl: 'M', quiet: 0 });

  /* ---------- نوار بالا و نقطه‌های داستان ---------- */
  const nav = document.getElementById('nav');
  const rail = document.getElementById('rail');
  const railDots = rail ? $$('a', rail) : [];
  const soon = document.getElementById('soon');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, mid = window.innerHeight * 0.45;
    nav.classList.toggle('solid', y > 8);
    const dark = soon && soon.getBoundingClientRect().top < 60;
    nav.classList.toggle('dark', !!dark);
    let cur = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) cur = i; });
    railDots.forEach((d, i) => d.classList.toggle('on', i === cur));
    if (rail) rail.classList.toggle('light', soon && soon.getBoundingClientRect().top < window.innerHeight / 2);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
