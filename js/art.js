// Procedural cyberpunk art: every building, unit and the ground is drawn with code.
(function () {
  const TW = G.TW, TH = G.TH, SS = 2, HEAD = 160, PADX = 14;
  const A = G.Art = {};
  const cache = new Map();
  const TRIM = ['#2be3ff', '#39ff88', '#ff2bd6', '#ffe14d', '#ff5a3c'];
  A.TRIM = TRIM;

  function mk(w, h, ss) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * ss); c.height = Math.ceil(h * ss);
    const x = c.getContext('2d'); x.scale(ss, ss); x.lineJoin = 'round'; x.lineCap = 'round';
    return [c, x];
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round((n >> 16 & 255) * f)), g = Math.min(255, Math.round((n >> 8 & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  A.shade = shade;
  const pal = (hex) => ({ top: shade(hex, 1.3), left: shade(hex, 0.7), right: shade(hex, 0.95), edge: shade(hex, 1.8) });
  const P = (ox, oy, tx, ty) => [ox + (tx - ty) * TW / 2, oy + (tx + ty) * TH / 2];
  const up = (p, z) => [p[0], p[1] - z];
  function poly(x, pts, fill, stroke, lw) {
    x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath();
    if (fill) { x.fillStyle = fill; x.fill(); }
    if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 0.7; x.stroke(); }
  }
  // isometric box over tile rect [tx0,ty0]-[tx1,ty1], heights z0..z1
  function box(x, ox, oy, tx0, ty0, tx1, ty1, z0, z1, c) {
    const a = P(ox, oy, tx0, ty0), b = P(ox, oy, tx1, ty0), cc = P(ox, oy, tx1, ty1), d = P(ox, oy, tx0, ty1);
    poly(x, [up(d, z0), up(cc, z0), up(cc, z1), up(d, z1)], c.left, c.edge, 0.6);
    poly(x, [up(cc, z0), up(b, z0), up(b, z1), up(cc, z1)], c.right, c.edge, 0.6);
    poly(x, [up(a, z1), up(b, z1), up(cc, z1), up(d, z1)], c.top, c.edge, 0.6);
    return { a, b, c: cc, d, z0, z1 };
  }
  function glow(x, c, b) { x.shadowColor = c; x.shadowBlur = b; }
  function noglow(x) { x.shadowBlur = 0; }
  function line(x, p1, p2, color, w, g) {
    if (g) glow(x, color, g);
    x.strokeStyle = color; x.lineWidth = w; x.beginPath(); x.moveTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.stroke();
    if (g) noglow(x);
  }
  function faceLines(x, f, z, color, w) {
    glow(x, color, 6);
    x.strokeStyle = color; x.lineWidth = w || 1.2;
    x.beginPath(); x.moveTo(f.d[0], f.d[1] - z); x.lineTo(f.c[0], f.c[1] - z); x.lineTo(f.b[0], f.b[1] - z); x.stroke();
    noglow(x);
  }
  function cyl(x, cx, cy, r, z0, z1, side, top) {
    const g = x.createLinearGradient(cx - r, 0, cx + r, 0);
    g.addColorStop(0, shade(side, 0.6)); g.addColorStop(0.45, shade(side, 1.15)); g.addColorStop(1, shade(side, 0.45));
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx + r, cy - z0); x.ellipse(cx, cy - z0, r, r / 2, 0, 0, Math.PI, false);
    x.lineTo(cx - r, cy - z1); x.lineTo(cx + r, cy - z1); x.closePath(); x.fill();
    x.fillStyle = top; x.beginPath(); x.ellipse(cx, cy - z1, r, r / 2, 0, 0, Math.PI * 2); x.fill();
  }
  function dot(x, cx, cy, r, color, g) { glow(x, color, g || 8); x.fillStyle = color; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); noglow(x); }
  function pad(x, ox, oy, s) { box(x, ox, oy, 0.06, 0.06, s - 0.06, s - 0.06, 0, 3, { top: '#1d1936', left: '#0d0b19', right: '#151229', edge: '#342c60' }); }

  const DRAW = {
    core(x, ox, oy, s, L) {
      const t = TRIM[L - 1];
      pad(x, ox, oy, s);
      box(x, ox, oy, 0.4, 0.4, s - 0.4, s - 0.4, 3, 11, pal('#2a2340'));
      const h = 52 + L * 12;
      const c = P(ox, oy, s / 2, s / 2);
      const rx = s * TW * 0.31, ry = rx / 2, rz = h * 0.55;
      // back half of holo ring
      glow(x, t, 10); x.strokeStyle = t; x.globalAlpha = 0.55; x.lineWidth = 2;
      x.beginPath(); x.ellipse(c[0], c[1] - rz, rx, ry, 0, Math.PI, Math.PI * 2); x.stroke(); x.globalAlpha = 1; noglow(x);
      const f = box(x, ox, oy, 0.95, 0.95, s - 0.95, s - 0.95, 11, h, { top: '#4a3a7a', left: '#1c1435', right: '#2b1f50', edge: '#6b52b8' });
      for (let z = 22; z < h - 4; z += 14) faceLines(x, f, z, t, 1.1);
      // windows
      x.fillStyle = 'rgba(255,225,77,.55)';
      for (let z = 16; z < h - 8; z += 14) for (let k = 0.2; k < 0.9; k += 0.2) {
        const p = [f.d[0] + (f.c[0] - f.d[0]) * k, f.d[1] + (f.c[1] - f.d[1]) * k - z - 6];
        x.fillRect(p[0] - 1.5, p[1], 3, 3);
      }
      box(x, ox, oy, 1.35, 1.35, s - 1.35, s - 1.35, h, h + 12, { top: '#5a46a0', left: '#251a48', right: '#352766', edge: t });
      const ty = c[1] - h - 12;
      line(x, [c[0], ty], [c[0], ty - 26 - L * 3], '#b9b4d8', 1.6);
      dot(x, c[0], ty - 26 - L * 3, 3, '#ff2bd6', 12);
      // emblem on top
      glow(x, t, 8); x.strokeStyle = t; x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(c[0], ty + 0, 9, 4.5, 0, 0, Math.PI * 2); x.stroke(); noglow(x);
      // front half of holo ring
      glow(x, t, 10); x.strokeStyle = t; x.globalAlpha = 0.85; x.lineWidth = 2;
      x.beginPath(); x.ellipse(c[0], c[1] - rz, rx, ry, 0, 0, Math.PI); x.stroke();
      if (L >= 3) { x.beginPath(); x.ellipse(c[0], c[1] - rz - 18, rx * 0.8, ry * 0.8, 0, 0, Math.PI); x.stroke(); }
      x.globalAlpha = 1; noglow(x);
      return h + 50 + L * 3;
    },
    scrapyard(x, ox, oy, s, L, r) {
      pad(x, ox, oy, s);
      const cols = ['#7a4b2a', '#5d5f66', '#8c3b2a', '#4a4d55', '#a0612f', '#6b6f7a'];
      const pieces = [];
      const n = 6 + L * 3;
      for (let i = 0; i < n; i++) {
        const w = 0.3 + r() * 0.5, d = 0.3 + r() * 0.5;
        const px = 0.3 + r() * (s - 0.9 - w), py = 0.5 + r() * (s - 0.8 - d);
        pieces.push({ px, py, w, d, h: 4 + r() * (8 + L * 2), c: cols[Math.floor(r() * cols.length)] });
      }
      pieces.sort((a, b) => (a.px + a.py) - (b.px + b.py));
      for (const p of pieces) box(x, ox, oy, p.px, p.py, p.px + p.w, p.py + p.d, 3, 3 + p.h, pal(p.c));
      // crane
      const base = P(ox, oy, s - 0.5, 0.5), H = 46 + L * 4;
      cyl(x, base[0], base[1], 3.5, 3, H, '#3a3f4a', '#5a606e');
      const tip = P(ox, oy, s * 0.42, s * 0.55);
      line(x, [base[0], base[1] - H], [tip[0], tip[1] - H + 8], '#ffb000', 2.5);
      line(x, [tip[0], tip[1] - H + 8], [tip[0], tip[1] - 28], '#888', 0.8);
      x.fillStyle = '#2b2b33'; x.beginPath(); x.ellipse(tip[0], tip[1] - 27, 6, 3, 0, 0, Math.PI * 2); x.fill();
      dot(x, base[0], base[1] - H - 3, 2.5, '#ff8a1f', 12);
      faceLines(x, box(x, ox, oy, 0.06, 0.06, s - 0.06, s - 0.06, 0, 3, { top: 'rgba(0,0,0,0)', left: 'rgba(0,0,0,0)', right: 'rgba(0,0,0,0)', edge: null }), 3, '#ff8a1f', 1);
      return H + 10;
    },
    coppermine(x, ox, oy, s, L) {
      pad(x, ox, oy, s);
      const t = TRIM[L - 1];
      const nT = 1 + Math.floor((L + 1) / 2);
      const tanks = [[0.85, 0.85], [0.85, s - 0.85], [s - 0.85, 0.85]].slice(0, nT);
      const tank = (p) => {
        const q = P(ox, oy, p[0], p[1]); const h = 20 + L * 2;
        cyl(x, q[0], q[1], 13, 3, h, '#b8632a', '#e8955a');
        glow(x, t, 6); x.strokeStyle = t; x.lineWidth = 1.2;
        x.beginPath(); x.ellipse(q[0], q[1] - h * 0.55, 13, 6.5, 0, 0, Math.PI); x.stroke(); noglow(x);
      };
      tanks.filter((p) => p[0] + p[1] < s).forEach(tank);
      // derrick
      box(x, ox, oy, s / 2 - 0.45, s / 2 - 0.45, s / 2 + 0.45, s / 2 + 0.45, 3, 14, pal('#3b2a22'));
      const H = 58 + L * 5, apex = P(ox, oy, s / 2, s / 2);
      const legs = [P(ox, oy, s / 2 - 0.4, s / 2 - 0.4), P(ox, oy, s / 2 + 0.4, s / 2 - 0.4), P(ox, oy, s / 2 + 0.4, s / 2 + 0.4), P(ox, oy, s / 2 - 0.4, s / 2 + 0.4)];
      for (const l of legs) line(x, [l[0], l[1] - 14], [apex[0], apex[1] - H], '#c8702f', 1.6);
      for (let k = 0.3; k < 0.9; k += 0.25) {
        const pts = legs.map((l) => [l[0] + (apex[0] - l[0]) * k, l[1] - 14 + (apex[1] - H - l[1] + 14) * k]);
        poly(x, pts, null, '#9a5424', 0.8);
      }
      dot(x, apex[0], apex[1] - H, 3.5, '#ff9a4a', 14);
      tanks.filter((p) => p[0] + p[1] >= s).forEach(tank);
      return H + 10;
    },
    vault(x, ox, oy, s, L) {
      pad(x, ox, oy, s);
      const h = 34 + L * 6, t = TRIM[L - 1];
      const f = box(x, ox, oy, 0.32, 0.32, s - 0.32, s - 0.32, 3, h, { top: '#56607e', left: '#272c3f', right: '#363d57', edge: '#8a96c0' });
      faceLines(x, f, h * 0.3, '#19f0ff', 1.3);
      faceLines(x, f, h * 0.78, t, 1.3);
      const m = [(f.c[0] + f.b[0]) / 2, (f.c[1] + f.b[1]) / 2 - h * 0.52];
      x.save(); x.translate(m[0], m[1]); x.transform(1, -0.5, 0, 1, 0, 0);
      x.fillStyle = '#1c2030'; x.beginPath(); x.arc(0, 0, 10, 0, Math.PI * 2); x.fill();
      glow(x, t, 8); x.strokeStyle = t; x.lineWidth = 1.6; x.stroke();
      for (let a = 0; a < 6; a++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); x.stroke(); }
      noglow(x); x.restore();
      box(x, ox, oy, s / 2 - 0.4, s / 2 - 0.4, s / 2 + 0.4, s / 2 + 0.4, h, h + 6, pal('#4a5470'));
      return h + 12;
    },
    factory(x, ox, oy, s, L) {
      pad(x, ox, oy, s);
      const h = 26 + L * 3;
      const f = box(x, ox, oy, 0.25, 0.25, s - 0.25, s - 0.25, 3, h, { top: '#4a4232', left: '#221e16', right: '#322c1f', edge: '#8a7a4a' });
      // garage door (left face)
      const lp = (k, z) => [f.d[0] + (f.c[0] - f.d[0]) * k, f.d[1] + (f.c[1] - f.d[1]) * k - z];
      poly(x, [lp(0.22, 3), lp(0.78, 3), lp(0.78, h * 0.65), lp(0.22, h * 0.65)], '#14120c', '#ffe14d', 1);
      for (let z = 6; z < h * 0.65; z += 4) line(x, lp(0.22, z), lp(0.78, z), 'rgba(255,225,77,.35)', 0.8);
      for (let i = 0; i < 3; i++) box(x, ox, oy, 0.45 + i * 0.75, 0.5, 0.45 + i * 0.75 + 0.5, s - 0.5, h, h + 9, pal('#5a5040'));
      faceLines(x, f, h - 3, '#ffe14d', 1.2);
      const cp = P(ox, oy, s - 0.75, 0.75), CH = h + 30 + L * 3;
      cyl(x, cp[0], cp[1], 6, h, CH, '#3d3a44', '#1a181f');
      glow(x, '#ffe14d', 8); x.strokeStyle = '#ffe14d'; x.lineWidth = 1.4;
      x.beginPath(); x.ellipse(cp[0], cp[1] - CH + 5, 6, 3, 0, 0, Math.PI); x.stroke(); noglow(x);
      return CH + 6;
    },
    squadhq(x, ox, oy, s, L) {
      pad(x, ox, oy, s);
      const h = 22 + L * 3, t = '#39ff88';
      if (L >= 3) {
        const tw = box(x, ox, oy, 0.5, 0.5, 1.4, 1.4, 3, h + 26, { top: '#2f5a3e', left: '#112017', right: '#183022', edge: t });
        faceLines(x, tw, h + 18, TRIM[L - 1], 1.2);
      }
      const f = box(x, ox, oy, 0.35, 0.35 + (L >= 3 ? 1.2 : 0), s - 0.35, s - 0.35, 3, h, { top: '#26402f', left: '#112017', right: '#183022', edge: '#3fbf73' });
      faceLines(x, f, h * 0.5, t, 1.2);
      x.fillStyle = 'rgba(57,255,136,.4)';
      for (let k = 0.15; k < 0.9; k += 0.14) { const p = [f.d[0] + (f.c[0] - f.d[0]) * k, f.d[1] + (f.c[1] - f.d[1]) * k - h * 0.8]; x.fillRect(p[0] - 2, p[1], 4, 4); }
      const c = P(ox, oy, s / 2 + 0.2, s / 2 + (L >= 3 ? 0.6 : 0)); const cy = c[1] - h;
      x.fillStyle = '#16251b'; x.beginPath(); x.ellipse(c[0], cy, 26, 13, 0, 0, Math.PI * 2); x.fill();
      glow(x, t, 10); x.strokeStyle = t; x.lineWidth = 1.8; x.stroke();
      x.save(); x.translate(c[0], cy); x.scale(1, 0.5); x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = t; x.fillText('S', 0, 1); x.restore(); noglow(x);
      const an = P(ox, oy, s - 0.6, s - 0.6);
      line(x, [an[0], an[1] - h], [an[0], an[1] - h - 24], '#9aa', 1.2);
      dot(x, an[0], an[1] - h - 24, 2.5, t, 10);
      return h + 40;
    },
    laser(x, ox, oy, s, L) {
      pad(x, ox, oy, s);
      const h = A.laserHeight(L);
      const f = box(x, ox, oy, 0.3, 0.3, s - 0.3, s - 0.3, 3, h, pal('#2a2f45'));
      faceLines(x, f, h - 4, TRIM[L - 1], 1.2);
      const c = P(ox, oy, s / 2, s / 2);
      x.strokeStyle = '#6a7090'; x.lineWidth = 1; x.beginPath(); x.ellipse(c[0], c[1] - h, 14, 7, 0, 0, Math.PI * 2); x.stroke();
      return h + 34;
    },
    firewall(x, ox, oy, s, L) {
      const h = 15 + L * 2;
      const cols = ['#3a2a3a', '#3a3046', '#2f3550', '#4a3a20', '#502828'];
      box(x, ox, oy, 0.32, 0.32, 0.68, 0.68, 0, h, pal(cols[L - 1]));
      const c = P(ox, oy, 0.5, 0.5);
      dot(x, c[0], c[1] - h - 1, 2.2, '#ff3355', 10);
      return h + 6;
    },
    rubble(x, ox, oy, s, _L, r) {
      box(x, ox, oy, 0.1, 0.1, s - 0.1, s - 0.1, 0, 2, { top: '#141221', left: '#0a0912', right: '#0f0d19', edge: '#221e38' });
      const n = 3 + s * 3, ps = [];
      for (let i = 0; i < n; i++) { const w = 0.2 + r() * 0.35; ps.push({ px: 0.2 + r() * (s - 0.6), py: 0.2 + r() * (s - 0.6), w, h: 2 + r() * 6 }); }
      ps.sort((a, b) => a.px + a.py - b.px - b.py);
      for (const p of ps) box(x, ox, oy, p.px, p.py, p.px + p.w, p.py + p.w, 2, 2 + p.h, pal(r() < 0.5 ? '#2a2633' : '#3a2a22'));
      return 14;
    },
  };

  A.laserHeight = (L) => 12 + L * 2;
  // returns cached sprite {c, ax, ay, w, h, top}
  A.sprite = function (type, level) {
    const key = type + level;
    let sp = cache.get(key);
    if (sp) return sp;
    const s = type === 'rubble' ? level : G.BUILDINGS[type].size;
    const w = s * TW + PADX * 2, h = s * TH + HEAD + 6;
    const [c, x] = mk(w, h, SS);
    const ox = s * TW / 2 + PADX, oy = HEAD;
    const top = DRAW[type](x, ox, oy, s, level, G.rng(hash(key)));
    sp = { c, ax: ox, ay: oy, w, h, top, s };
    cache.set(key, sp);
    return sp;
  };
  A.drawSprite = function (ctx, sp, wx, wy, alpha) {
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(sp.c, wx - sp.ax, wy - sp.ay, sp.w, sp.h);
    ctx.globalAlpha = 1;
  };

  A.drawLaserHead = function (ctx, cx, cy, L, ang, fire, dis) {
    const y = cy - A.laserHeight(L) - 7;
    const t = dis ? '#666' : TRIM[L - 1];
    ctx.save();
    ctx.fillStyle = '#20243a'; ctx.beginPath(); ctx.ellipse(cx, y + 3, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    const dx = Math.cos(ang), dy = Math.sin(ang) * 0.5;
    ctx.strokeStyle = '#11131f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + dx * 17, y + dy * 17); ctx.stroke();
    ctx.strokeStyle = t; ctx.lineWidth = 2; ctx.shadowColor = t; ctx.shadowBlur = fire ? 16 : 6;
    ctx.beginPath(); ctx.moveTo(cx + dx * 4, y + dy * 4); ctx.lineTo(cx + dx * 17, y + dy * 17); ctx.stroke();
    ctx.fillStyle = '#3a4160'; ctx.beginPath(); ctx.arc(cx, y - 1, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = t; ctx.beginPath(); ctx.arc(cx + dx * 3, y - 2 + dy * 3, 2.4, 0, Math.PI * 2); ctx.fill();
    if (fire) { ctx.beginPath(); ctx.arc(cx + dx * 18, y + dy * 18, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    return [cx + dx * 18, y + dy * 18];
  };

  // ---------- units ----------
  const UCOL = { runner: '#ff2bd6', gunner: '#19f0ff', drone: '#ff3355', mech: '#ffe14d', ronin: '#ff4d4d', nyx: '#b26bff' };
  A.UCOL = UCOL;
  A.drawUnit = function (ctx, type, wx, wy, t, flip, flash) {
    const c = UCOL[type];
    ctx.save(); ctx.translate(wx, wy);
    const big = type === 'mech' ? 1.5 : (type === 'ronin' || type === 'nyx') ? 1.3 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 0, 6 * big, 3 * big, 0, 0, Math.PI * 2); ctx.fill();
    if (type === 'ronin' || type === 'nyx') {
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (flip) ctx.scale(-1, 1);
    ctx.scale(big, big);
    const step = Math.sin(t * 14) * 2;
    const body = flash ? '#ffffff' : '#241a36';
    ctx.lineCap = 'round';
    if (type === 'drone') {
      const hy = -18 + Math.sin(t * 6) * 2;
      ctx.strokeStyle = '#555a70'; ctx.lineWidth = 1.5;
      for (const [ax, ay] of [[-7, -3], [7, -3], [-7, 3], [7, 3]]) {
        ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(ax, hy + ay * 0.5); ctx.stroke();
        ctx.fillStyle = 'rgba(200,220,255,.35)'; ctx.beginPath(); ctx.ellipse(ax, hy + ay * 0.5 - 1, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = flash ? '#fff' : '#2a2d3a'; ctx.beginPath(); ctx.ellipse(0, hy, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(2, hy, 1.8, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'mech') {
      ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-4 + step, 0); ctx.moveTo(3, -8); ctx.lineTo(4 - step, 0); ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : '#4a4230'; ctx.strokeStyle = c; ctx.lineWidth = 1;
      ctx.fillRect(-7, -19, 14, 11); ctx.strokeRect(-7, -19, 14, 11);
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(-9, -21, 5, 6); ctx.fillRect(4, -21, 5, 6);
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(8, -20, 7, 2.5);
      ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fillStyle = c; ctx.fillRect(-2, -16, 6, 2.5);
    } else {
      ctx.strokeStyle = '#1a1424'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-1.5, -7); ctx.lineTo(-1.5 + step, 0); ctx.moveTo(1.5, -7); ctx.lineTo(1.5 - step, 0); ctx.stroke();
      ctx.fillStyle = body; ctx.fillRect(-3.5, -14, 7, 8);
      ctx.fillStyle = c; ctx.fillRect(-3.5, -10, 7, 1.4);
      if (type === 'nyx') { ctx.fillStyle = '#5b2b8a'; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(-6, -8); ctx.lineTo(-1, -12); ctx.fill(); }
      ctx.fillStyle = type === 'ronin' ? '#ddd' : '#c9a98a'; ctx.beginPath(); ctx.arc(0, -16.5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.fillStyle = c; ctx.fillRect(0, -17.5, 3.5, 1.5);
      ctx.strokeStyle = c; ctx.lineWidth = 1.4;
      if (type === 'runner') { ctx.beginPath(); ctx.moveTo(3, -10); ctx.lineTo(8, -14); ctx.stroke(); }
      if (type === 'gunner') { ctx.shadowBlur = 0; ctx.fillStyle = '#556'; ctx.fillRect(1, -12, 9, 2.4); ctx.fillStyle = c; ctx.fillRect(9, -12, 2, 2.4); }
      if (type === 'ronin') { ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(2, -9); ctx.lineTo(13, -19); ctx.stroke(); }
      if (type === 'nyx') { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(8, -12, 3.5 + Math.sin(t * 5), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  };

  // ---------- thumbnails for UI ----------
  const thumbs = new Map();
  A.buildThumb = function (type, level) {
    const key = 'b' + type + level;
    if (thumbs.has(key)) return thumbs.get(key);
    const sp = A.sprite(type, level);
    const [c, x] = mk(96, 96, 1);
    const top = Math.min(sp.top, HEAD);
    const srcY = (HEAD - top) * SS, srcH = (top + sp.s * TH + 4) * SS;
    const k = Math.min(92 / sp.w, 92 / (srcH / SS));
    const dw = sp.w * k, dh = srcH / SS * k;
    x.drawImage(sp.c, 0, srcY, sp.c.width, srcH, (96 - dw) / 2, (96 - dh) / 2, dw, dh);
    const url = c.toDataURL();
    thumbs.set(key, url);
    return url;
  };
  A.unitThumb = function (type) {
    const key = 'u' + type;
    if (thumbs.has(key)) return thumbs.get(key);
    const [c, x] = mk(64, 64, 1);
    x.translate(32, 54); x.scale(2.2, 2.2);
    A.drawUnit(x, type, 0, 0, 0.3, false, false);
    const url = c.toDataURL();
    thumbs.set(key, url);
    return url;
  };

  // ---------- ground ----------
  let groundCache = null;
  A.ground = function () {
    if (groundCache) return groundCache;
    const M = G.MAP, w = M * TW, h = M * TH;
    const [c, x] = mk(w, h, 1);
    const ox = w / 2, oy = 0;
    const r = G.rng(1234);
    for (let ty = 0; ty < M; ty++) for (let tx = 0; tx < M; tx++) {
      const road = tx < 2 || ty < 2 || tx >= M - 2 || ty >= M - 2;
      const a = P(ox, oy, tx, ty), b = P(ox, oy, tx + 1, ty), cc = P(ox, oy, tx + 1, ty + 1), d = P(ox, oy, tx, ty + 1);
      const v = r() * 0.08;
      poly(x, [a, b, cc, d], road ? shade('#0c0b14', 1 + v) : shade(((tx + ty) & 1) ? '#16132b' : '#141127', 1 + v), road ? '#17142a' : '#211c3e', 0.6);
    }
    // lane markings on the outer road
    x.setLineDash([10, 10]); x.strokeStyle = 'rgba(255,225,77,.35)'; x.lineWidth = 1.2;
    const lane = (pts) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.stroke(); };
    lane([P(ox, oy, 1, 1), P(ox, oy, M - 1, 1), P(ox, oy, M - 1, M - 1), P(ox, oy, 1, M - 1)]);
    x.setLineDash([]);
    // neon puddles and cracks
    for (let i = 0; i < 40; i++) {
      const p = P(ox, oy, 3 + r() * (M - 6), 3 + r() * (M - 6));
      const col = r() < 0.5 ? 'rgba(255,43,214,' : 'rgba(25,240,255,';
      const g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 18 + r() * 20);
      g.addColorStop(0, col + '0.10)'); g.addColorStop(1, col + '0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(p[0], p[1], 40, 20, 0, 0, Math.PI * 2); x.fill();
    }
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      let p = P(ox, oy, 3 + r() * (M - 6), 3 + r() * (M - 6));
      x.beginPath(); x.moveTo(p[0], p[1]);
      for (let k = 0; k < 4; k++) { p = [p[0] + (r() - 0.5) * 24, p[1] + (r() - 0.5) * 12]; x.lineTo(p[0], p[1]); }
      x.stroke();
    }
    // neon border
    glow(x, '#19f0ff', 14); x.strokeStyle = '#19f0ff'; x.lineWidth = 2;
    poly(x, [P(ox, oy, 0, 0), P(ox, oy, M, 0), P(ox, oy, M, M), P(ox, oy, 0, M)], null, '#19f0ff', 2);
    noglow(x);
    groundCache = { c, ox, oy, w, h };
    return groundCache;
  };
})();
