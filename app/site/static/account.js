/* حساب سایت: مینی‌اپ‌ها، پلن و دستگاه‌ها (همه از /site/api/me با کوکی نشست). */
(function () {
  'use strict';
  const BASE = document.body.dataset.base || '/';
  const $ = id => document.getElementById(id);
  const fa = n => Number(n).toLocaleString('fa-IR');
  const SVG = 'http://www.w3.org/2000/svg';
  const COLORS = ['#4B2EE8', '#0E8FAE', '#12A071', '#E0573E', '#E09A1F', '#E0457B'];

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function icon(name) {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('class', 'ic');
    const u = document.createElementNS(SVG, 'use');
    u.setAttribute('href', '#i-' + name);
    s.appendChild(u);
    return s;
  }
  function sep() { return el('i', 'sep'); }
  function ago(t) {
    const s = Math.max(0, Date.now() / 1000 - t);
    if (s < 120) return 'همین حالا';
    if (s < 3600) return fa(Math.floor(s / 60)) + ' دقیقه پیش';
    if (s < 86400) return fa(Math.floor(s / 3600)) + ' ساعت پیش';
    if (s < 172800) return 'دیروز';
    return fa(Math.floor(s / 86400)) + ' روز پیش';
  }

  async function api(path, body) {
    const opt = { credentials: 'same-origin', headers: { 'X-ES': '1' } };
    if (body) { opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    const r = await fetch(BASE + 'site/api/' + path, opt);
    let data = {};
    try { data = await r.json(); } catch (e) { /* خالی */ }
    if (r.status === 401) { location.href = BASE + 'login'; throw new Error('out'); }
    if (!r.ok) throw new Error(data.error || 'خطا');
    return data;
  }

  function appStatus(a) {
    if (a.status === 'paused') return ['tag tag-mute', 'خاموش'];
    if (!a.published_at) return ['tag tag-warn', 'منتشر نشده'];
    if (a.dirty) return ['tag tag-brand', 'تغییر منتشرنشده'];
    return ['tag tag-ok', 'منتشر شده'];
  }

  function renderApps(me) {
    const box = $('apps');
    box.textContent = '';
    $('apps-count').textContent = me.apps.length ? fa(me.apps.length) + ' از ' + fa(me.plan.max_apps) : '';
    if (!me.apps.length) {
      const e = el('div', 'ac-empty');
      e.append(el('p', 'cap', 'هنوز مینی‌اپی نساختی. اولی را در چند دقیقه از مینی‌اپ ایزی‌ساز در تلگرام بساز.'));
      const b = el('a', 'btn btn-primary btn-sm');
      b.href = 'https://t.me/' + me.bot; b.target = '_blank'; b.rel = 'noopener';
      b.append(icon('plus'), 'ساختن اولین مینی‌اپ');
      e.appendChild(b);
      box.appendChild(e);
      return;
    }
    me.apps.forEach((a, i) => {
      const row = el('div', 'ac-row');
      const sq = el('span', 'ac-sq', (a.name || '؟').trim().charAt(0));
      sq.style.background = COLORS[(a.id || i) % COLORS.length];
      const tx = el('span', 'col');
      const meta = el('span', 'cap');
      const [cls, label] = appStatus(a);
      meta.append(el('span', cls, label));
      if (a.bot_username) { const b = el('bdi', 'ltr', '@' + a.bot_username); meta.append(b); }
      const week = a.stats ? a.stats.people_week || 0 : 0;
      meta.append(sep(), el('span', '', fa(week) + ' نفر این هفته'));
      tx.append(el('b', '', a.name), meta);
      const open = el('a', 'btn btn-ghost btn-sm');
      open.href = a.bot_username ? 'https://t.me/' + a.bot_username : 'https://t.me/' + me.bot + '?start=myapp';
      open.target = '_blank'; open.rel = 'noopener';
      open.append(icon('open'), a.bot_username ? 'باز کردن' : 'مدیریت');
      row.append(sq, tx, open);
      box.appendChild(row);
    });
  }

  function renderDevices(list) {
    const box = $('devices');
    box.textContent = '';
    list.forEach(s => {
      const row = el('div', 'ac-row');
      const ic = el('span', 'ac-dev');
      ic.appendChild(icon(s.device.mobile ? 'phone' : 'desk'));
      const tx = el('span', 'col');
      const meta = el('span', 'cap');
      if (s.place) meta.append(el('span', '', s.place), sep());
      meta.append(el('span', '', s.current ? 'همین حالا' : ago(s.last_seen)));
      const name = el('b', '');
      name.append(el('bdi', '', s.device.browser), s.device.os ? ' روی ' : '', s.device.os ? el('bdi', '', s.device.os) : '');
      tx.append(name, meta);
      row.append(ic, tx);
      if (s.current) row.append(el('span', 'tag tag-ok', 'همین دستگاه'));
      else {
        const out = el('button', 'btn btn-text btn-sm', 'خروج');
        out.type = 'button';
        out.addEventListener('click', async () => {
          out.disabled = true;
          try {
            const r = await api('revoke', { id: s.id });
            row.classList.add('gone');
            setTimeout(() => renderDevices(r.sessions || []), 320);
          } catch (e) { out.disabled = false; $('err').textContent = e.message; }
        });
        row.append(out);
      }
      box.appendChild(row);
    });
    $('out-all').hidden = list.length < 2;
  }

  function render(me) {
    const u = me.user, first = (u.first_name || '').trim();
    $('me-name').textContent = first || 'حساب تو';
    $('me-av').textContent = (first || '؟').charAt(0);
    $('hello').textContent = first ? 'سلام ' + first : 'سلام';
    const sub = $('hello-sub');
    if (u.username) {
      sub.textContent = 'حساب تلگرام ';
      sub.append(el('bdi', 'ltr', '@' + u.username), ' به این مرورگر وصل است.');
    }
    $('plan-name').textContent = 'پلن ' + me.plan.title;
    $('plan-title').textContent = 'پلن ' + me.plan.title;
    $('use-n').textContent = fa(me.apps.length);
    $('use-of').textContent = 'از ' + fa(me.plan.max_apps) + ' مینی‌اپ';
    requestAnimationFrame(() => { $('use-bar').style.width = Math.min(100, me.apps.length / Math.max(1, me.plan.max_apps) * 100) + '%'; });
    $('plans').href = 'https://t.me/' + me.bot + '?start=plans';
    $('open-bot').href = 'https://t.me/' + me.bot;
    renderApps(me);
    renderDevices(me.sessions);
    $('ac').dataset.state = 'ready';
  }

  $('logout').addEventListener('click', async () => {
    try { await api('logout', {}); } catch (e) { /* در هر حال */ }
    location.href = BASE;
  });
  $('out-all').addEventListener('click', async () => {
    if (!confirm('از همهٔ دستگاه‌ها، از جمله همین مرورگر، خارج می‌شوی. ادامه می‌دهی؟')) return;
    try { await api('revoke', { all: true }); } catch (e) { /* بیرون رفت */ }
    location.href = BASE + 'login';
  });

  api('me').then(render).catch(e => { if (e.message !== 'out') $('err').textContent = e.message; });
})();
