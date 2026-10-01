/* QR کوچک برای سایت ایزی‌ساز (بایت، سطح M یا H، نسخهٔ ۱ تا ۱۰).
   همان پیاده‌سازی پنل (روش qrcodegen) با سطح H برای وقتی نشان وسط QR می‌نشیند.
   ESQR.svg(text, {ecl:'H', holeRatio:.24}) ← رشتهٔ SVG؛ hole/holeRatio خانه‌های وسط را برای نشان خالی می‌گذارد. */
(function () {
  'use strict';
  const TABLE = {
    M: { ecc: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26], blk: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5], bits: 0 },
    H: { ecc: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28], blk: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8], bits: 2 },
  };
  function rawModules(v) {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rsDivisor(deg) {
    const r = new Array(deg).fill(0);
    r[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRem(data, div) {
    const r = div.map(() => 0);
    data.forEach(b => {
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((c, i) => { r[i] ^= gfMul(c, f); });
    });
    return r;
  }

  function matrix(text, ecl) {
    const T = TABLE[ecl] || TABLE.M;
    const bytes = Array.from(new TextEncoder().encode(text));
    let v = 1;
    for (; v <= 10; v++) {
      const cap = (Math.floor(rawModules(v) / 8) - T.ecc[v] * T.blk[v]) * 8;
      if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap) break;
    }
    if (v > 10) return null;
    const dataCw = Math.floor(rawModules(v) / 8) - T.ecc[v] * T.blk[v];
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4);
    put(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, dataCw * 8 - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    const cw = [];
    for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0xEC; cw.length < dataCw; p ^= 0xEC ^ 0x11) cw.push(p);

    const nb = T.blk[v], el = T.ecc[v], raw = Math.floor(rawModules(v) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(el);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const dat = cw.slice(k, k + shortLen - el + (i < nShort ? 0 : 1));
      k += dat.length;
      const ecc = rsRem(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const all = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) all.push(b[i]); });

    const size = v * 4 + 17;
    const m = [], fn = [];
    for (let y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    });
    const al = [];
    if (v > 1) {
      const na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2;
      al.push(6);
      for (let p = size - 7; al.length < na; p -= step) al.splice(1, 0, p);
    }
    al.forEach((ax, i) => al.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const drawFormat = mask => {
      const data = (T.bits << 3) | mask;
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const f = ((data << 10) | rem) ^ 0x5412, bit = i => ((f >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (v >= 7) {
      let rem = v;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const vb = (v << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const d = ((vb >>> i) & 1) === 1, a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, d); set(b, a, d);
      }
    }
    let bi = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && bi < all.length * 8) { m[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
        }
      }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const applyMask = k => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0;
      const line = get => {
        let run = 1;
        for (let i = 1; i <= size; i++) {
          if (i < size && get(i) === get(i - 1)) { run++; continue; }
          if (run >= 5) p += run - 2;
          run = 1;
        }
        let str = '';
        for (let i = 0; i < size; i++) str += get(i) ? '1' : '0';
        for (let i = str.indexOf('1011101'); i >= 0; i = str.indexOf('1011101', i + 1)) {
          if (str.slice(Math.max(0, i - 4), i) === '0000' || str.slice(i + 7, i + 11) === '0000') p += 40;
        }
      };
      for (let y = 0; y < size; y++) line(x => m[y][x]);
      for (let x = 0; x < size; x++) line(y => m[y][x]);
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
      }
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
      p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    };
    let best = 0, bestP = Infinity;
    for (let k = 0; k < 8; k++) {
      applyMask(k); drawFormat(k);
      const pp = penalty();
      if (pp < bestP) { bestP = pp; best = k; }
      applyMask(k);
    }
    applyMask(best); drawFormat(best);
    return m;
  }

  /* SVG با چشم‌های کمی نرم (گردتر از این را بعضی اسکنرها نمی‌شناسند)؛ hole (فرد) خانه‌های وسط را برای نشان خالی می‌کند. */
  function svg(text, opts) {
    const o = opts || {};
    const m = matrix(text, o.ecl || 'M');
    if (!m) return '';
    const n = m.length, q = o.quiet == null ? 1 : o.quiet, color = o.color || '#17142B';
    const hole = o.hole || (o.holeRatio ? (Math.round(n * o.holeRatio) | 1) : 0), h0 = Math.floor((n - hole) / 2), h1 = h0 + hole;
    const inEye = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!m[y][x] || inEye(x, y)) continue;
      if (hole && x >= h0 && x < h1 && y >= h0 && y < h1) continue;
      d += `M${x + q} ${y + q}h1v1h-1z`;
    }
    const eye = (x, y) => `<rect x="${x + q + .5}" y="${y + q + .5}" width="6" height="6" rx=".5" fill="none" stroke="${color}"/>`
      + `<rect x="${x + q + 2}" y="${y + q + 2}" width="3" height="3" rx=".25" fill="${color}"/>`;
    const s = n + q * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="QR">`
      + `<path d="${d}" fill="${color}"/>`
      + `<g shape-rendering="geometricPrecision">${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}</g></svg>`;
  }

  window.ESQR = { matrix, svg };
})();
