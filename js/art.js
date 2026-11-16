// Procedural cyberpunk art: every building and unit is drawn with code.
// Static parts are baked once into sprite caches; animated parts are drawn each frame by A.anim().
(function () {
  const TW = G.TW, TH = G.TH, SS = 2, HEAD = 190, PADX = 22;
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
  // isometric box over tile rect [tx0,ty0]-[tx1,ty1], heights z0..z1; side faces get a depth gradient
  function box(x, ox, oy, tx0, ty0, tx1, ty1, z0, z1, c, flat) {
    const a = P(ox, oy, tx0, ty0), b = P(ox, oy, tx1, ty0), cc = P(ox, oy, tx1, ty1), d = P(ox, oy, tx0, ty1);
    const L = [up(d, z0), up(cc, z0), up(cc, z1), up(d, z1)], R = [up(cc, z0), up(b, z0), up(b, z1), up(cc, z1)];
    poly(x, L, c.left); poly(x, R, c.right);
    if (!flat && z1 - z0 > 4) {
      const g = x.createLinearGradient(0, cc[1] - z1, 0, cc[1] - z0);
      g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      poly(x, L, g); poly(x, R, g);
    }
    if (c.edge) { poly(x, L, null, c.edge, 0.6); poly(x, R, null, c.edge, 0.6); }
    poly(x, [up(a, z1), up(b, z1), up(cc, z1), up(d, z1)], c.top, c.edge, 0.6);
    // bright rim on the front-top edges
    x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(...up(d, z1)); x.lineTo(...up(cc, z1)); x.lineTo(...up(b, z1)); x.stroke();
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
  function pad(x, ox, oy, s) {
    box(x, ox, oy, 0.06, 0.06, s - 0.06, s - 0.06, 0, 3, { top: '#1d1936', left: '#0d0b19', right: '#151229', edge: '#342c60' }, true);
    // edge lights on the pad
    const a = P(ox, oy, 0.06, s - 0.06), c = P(ox, oy, s - 0.06, s - 0.06), b = P(ox, oy, s - 0.06, 0.06);
    x.fillStyle = 'rgba(255,225,77,.7)';
    for (let k = 0.1; k < 1; k += 0.2) {
      x.fillRect(a[0] + (c[0] - a[0]) * k - 0.8, a[1] + (c[1] - a[1]) * k - 2, 1.6, 1.2);
      x.fillRect(c[0] + (b[0] - c[0]) * k - 0.8, c[1] + (b[1] - c[1]) * k - 2, 1.6, 1.2);
    }
  }
  // soft shadow cast toward the bottom-left
  function shadow(x, ox, oy, s, h) {
    const k = Math.min(1.2, h / 60);
    const off = [-10 * k, 6 * k];
    x.save();
    x.fillStyle = 'rgba(0,0,0,.45)'; glow(x, 'rgba(0,0,0,.8)', 10);
    poly(x, [P(ox, oy, 0.2, 0.2), P(ox, oy, s - 0.2, 0.2), P(ox, oy, s - 0.2, s - 0.2), P(ox, oy, 0.2, s - 0.2)].map((p, i) => (i === 3 || i === 2 ? [p[0] + off[0], p[1] + off[1]] : p)), 'rgba(0,0,0,.4)');
    x.restore();
  }
  // point on a face: face 'L' runs d→c, 'R' runs c→b; k = 0..1 along, z = height
  const fp = (f, face, k, z) => face === 'L'
    ? [f.d[0] + (f.c[0] - f.d[0]) * k, f.d[1] + (f.c[1] - f.d[1]) * k - z]
    : [f.c[0] + (f.b[0] - f.c[0]) * k, f.c[1] + (f.b[1] - f.c[1]) * k - z];
  // lit windows on a face
  function windows(x, f, face, z0, z1, rows, cols, r, warm) {
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const k = (j + 0.5) / cols, z = z0 + (z1 - z0) * (i + 0.5) / rows;
      const p = fp(f, face, k, z);
      const on = r() < 0.7;
      x.fillStyle = on ? (warm || (r() < 0.75 ? 'rgba(255,205,120,.9)' : 'rgba(120,230,255,.85)')) : 'rgba(20,18,40,.9)';
      const sk = face === 'L' ? 0.5 : -0.5;
      x.save(); x.translate(p[0], p[1]); x.transform(1, sk, 0, 1, 0, 0);
      x.fillRect(-2.2, -2.5, 4.4, 4);
      if (on) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-2.2, -2.5, 4.4, 1); }
      x.restore();
    }
  }
  // neon text painted along a face
  function sign(x, f, face, k, z, text, color, size) {
    const p = fp(f, face, k, z);
    x.save(); x.translate(p[0], p[1]); x.transform(1, face === 'L' ? 0.5 : -0.5, 0, 1, 0, 0);
    x.font = 'bold ' + (size || 8) + 'px "Segoe UI",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const w = x.measureText(text).width + 6;
    x.fillStyle = 'rgba(5,4,12,.85)'; x.fillRect(-w / 2, -(size || 8) * 0.75, w, (size || 8) * 1.5);
    glow(x, color, 8); x.fillStyle = color; x.fillText(text, 0, 0.5); noglow(x);
    x.strokeStyle = color; x.lineWidth = 0.6; x.strokeRect(-w / 2, -(size || 8) * 0.75, w, (size || 8) * 1.5);
    x.restore();
  }
  function vent(x, f, face, k, z, sz) {
    const p = fp(f, face, k, z);
    x.save(); x.translate(p[0], p[1]); x.transform(1, face === 'L' ? 0.5 : -0.5, 0, 1, 0, 0);
    x.fillStyle = '#11101c'; x.fillRect(-sz, -sz * 0.7, sz * 2, sz * 1.4);
    x.strokeStyle = 'rgba(160,150,210,.35)'; x.lineWidth = 0.6;
    for (let i = -sz + 1.5; i < sz; i += 2) { x.beginPath(); x.moveTo(-sz + 1, -sz * 0.7 + 1 + (i + sz) * 0.6); x.lineTo(sz - 1, -sz * 0.7 + 1 + (i + sz) * 0.6); x.stroke(); }
    x.restore();
  }
  A.prim = { mk, hash, shade, pal, P, up, poly, box, glow, noglow, line, faceLines, cyl, dot, pad };

  // heights shared by sprites and per-frame animation
  const HGT = {
    core: (L) => 52 + L * 12, scrapyard: (L) => 46 + L * 4, coppermine: (L) => 58 + L * 5, vault: (L) => 34 + L * 6,
    factory: (L) => 26 + L * 3, squadhq: (L) => 22 + L * 3, laser: (L) => 12 + L * 2, firewall: (L) => 15 + L * 2,
  };
  A.laserHeight = HGT.laser;

  const DRAW = {
    core(x, ox, oy, s, L, r) {
      const t = TRIM[L - 1], h = HGT.core(L);
      shadow(x, ox, oy, s, h); pad(x, ox, oy, s);
      box(x, ox, oy, 0.4, 0.4, s - 0.4, s - 0.4, 3, 11, pal('#2a2340'));
      const c = P(ox, oy, s / 2, s / 2);
      // back half of the holo ring (front half is animated)
      x.globalAlpha = 0.35; glow(x, t, 10); x.strokeStyle = t; x.lineWidth = 2;
      x.beginPath(); x.ellipse(c[0], c[1] - h * 0.55, s * TW * 0.31, s * TW * 0.155, 0, Math.PI, Math.PI * 2); x.stroke(); noglow(x); x.globalAlpha = 1;
      // side pylons from level 2
      if (L >= 2) for (const [px, py] of [[0.55, s - 0.55], [s - 0.55, 0.55]]) {
        const q = P(ox, oy, px, py); cyl(x, q[0], q[1], 4, 11, 30 + L * 6, '#2a2148', '#3d3070');
        dot(x, q[0], q[1] - 32 - L * 6, 2, t, 10);
      }
      const f = box(x, ox, oy, 0.95, 0.95, s - 0.95, s - 0.95, 11, h, { top: '#4a3a7a', left: '#1c1435', right: '#2b1f50', edge: '#6b52b8' });
      windows(x, f, 'L', 16, h - 8, Math.floor((h - 20) / 12), 4, r);
      windows(x, f, 'R', 16, h - 8, Math.floor((h - 20) / 12), 4, r);
      for (let z = 22; z < h - 4; z += 24) faceLines(x, f, z, t, 1);
      sign(x, f, 'R', 0.5, h - 10, 'CORE', t, 7);
      const f2 = box(x, ox, oy, 1.35, 1.35, s - 1.35, s - 1.35, h, h + 12, { top: '#5a46a0', left: '#251a48', right: '#352766', edge: t });
      faceLines(x, f2, h + 6, t, 1);
      const ty = c[1] - h - 12;
      // roof dish from level 3
      if (L >= 3) {
        const dp = P(ox, oy, s / 2 - 0.3, s / 2 + 0.3);
        x.fillStyle = '#9aa0c0'; x.beginPath(); x.ellipse(dp[0], dp[1] - h - 18, 7, 4, -0.4, 0, Math.PI * 2); x.fill();
        line(x, [dp[0], dp[1] - h - 12], [dp[0], dp[1] - h - 18], '#666', 1.2);
      }
      const mast = 26 + L * 3 + (L >= 5 ? 14 : 0);
      line(x, [c[0], ty], [c[0], ty - mast], L >= 5 ? '#ffe9a0' : '#b9b4d8', 1.6);
      for (let k = 6; k < mast; k += 8) line(x, [c[0] - 3, ty - k], [c[0] + 3, ty - k], '#8a86a8', 0.8);
      return h + 12 + mast + 10;
    },
    scrapyard(x, ox, oy, s, L, r) {
      const H = HGT.scrapyard(L);
      shadow(x, ox, oy, s, 20); pad(x, ox, oy, s);
      // fence posts along the back edges
      for (let k = 0.2; k < s; k += 0.45) {
        for (const p of [P(ox, oy, k, 0.12), P(ox, oy, 0.12, k)]) line(x, [p[0], p[1] - 3], [p[0], p[1] - 12], '#4a4f5c', 1.2);
      }
      x.strokeStyle = 'rgba(120,130,150,.5)'; x.lineWidth = 0.6;
      for (const z of [6, 10]) {
        let p = P(ox, oy, 0.12, s - 0.1); x.beginPath(); x.moveTo(p[0], p[1] - z);
        p = P(ox, oy, 0.12, 0.12); x.lineTo(p[0], p[1] - z); p = P(ox, oy, s - 0.1, 0.12); x.lineTo(p[0], p[1] - z); x.stroke();
      }
      const cols = ['#7a4b2a', '#5d5f66', '#8c3b2a', '#4a4d55', '#a0612f', '#6b6f7a', '#3b6a6a'];
      const pieces = [];
      const n = 7 + L * 4;
      for (let i = 0; i < n; i++) {
        const w = 0.25 + r() * 0.5, d = 0.25 + r() * 0.5;
        const px = 0.3 + r() * (s - 0.9 - w), py = 0.5 + r() * (s - 0.8 - d);
        pieces.push({ px, py, w, d, z: r() < 0.3 ? 4 + r() * 6 : 3, h: 3 + r() * (7 + L * 2), c: cols[Math.floor(r() * cols.length)] });
      }
      pieces.sort((a, b) => (a.px + a.py) - (b.px + b.py));
      for (const p of pieces) box(x, ox, oy, p.px, p.py, p.px + p.w, p.py + p.d, p.z, p.z + p.h, pal(p.c));
      // tyres and barrels
      for (let i = 0; i < 2 + L; i++) {
        const q = P(ox, oy, 0.5 + r() * (s - 1), 0.6 + r() * (s - 1.2));
        if (r() < 0.5) { x.fillStyle = '#121216'; x.beginPath(); x.ellipse(q[0], q[1] - 4, 5, 2.5, 0, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#2a2a33'; x.lineWidth = 2; x.stroke(); }
        else cyl(x, q[0], q[1], 3, 2, 10, r() < 0.5 ? '#b0402a' : '#2a6a4a', '#3a3a40');
      }
      // compactor from level 3
      if (L >= 3) {
        const f = box(x, ox, oy, 0.25, s - 1.15, 1.15, s - 0.25, 3, 20, pal('#3e4452'));
        sign(x, f, 'L', 0.5, 13, 'SCRAP', '#ff8a1f', 6);
      }
      // crane
      const base = P(ox, oy, s - 0.5, 0.5);
      cyl(x, base[0], base[1], 4, 3, H, '#3a3f4a', '#5a606e');
      for (let z = 8; z < H; z += 6) line(x, [base[0] - 4, base[1] - z], [base[0] + 4, base[1] - z - 3], '#ffb000', 0.7);
      const tip = P(ox, oy, s * 0.42, s * 0.55);
      line(x, [base[0], base[1] - H], [tip[0], tip[1] - H + 8], '#ffb000', 3);
      line(x, [base[0], base[1] - H - 6], [tip[0], tip[1] - H + 8], '#a37400', 1);
      line(x, [tip[0], tip[1] - H + 8], [tip[0], tip[1] - 30], '#888', 0.8);
      x.fillStyle = '#2b2b33'; x.beginPath(); x.ellipse(tip[0], tip[1] - 29, 7, 3.5, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#4a4a55'; x.beginPath(); x.ellipse(tip[0], tip[1] - 31, 7, 3.5, 0, 0, Math.PI * 2); x.fill();
      return H + 14;
    },
    coppermine(x, ox, oy, s, L, r) {
      const t = TRIM[L - 1], H = HGT.coppermine(L);
      shadow(x, ox, oy, s, 30); pad(x, ox, oy, s);
      const nT = 1 + Math.floor((L + 1) / 2);
      const tanks = [[0.85, 0.85], [0.85, s - 0.85], [s - 0.85, 0.85]].slice(0, nT);
      const tank = (p) => {
        const q = P(ox, oy, p[0], p[1]); const h = 20 + L * 2;
        cyl(x, q[0], q[1], 13, 3, h, '#b8632a', '#e8955a');
        x.strokeStyle = 'rgba(80,30,10,.6)'; x.lineWidth = 0.8;
        for (let z = 8; z < h; z += 6) { x.beginPath(); x.ellipse(q[0], q[1] - z, 13, 6.5, 0, 0, Math.PI); x.stroke(); }
        glow(x, t, 6); x.strokeStyle = t; x.lineWidth = 1.2;
        x.beginPath(); x.ellipse(q[0], q[1] - h * 0.55, 13, 6.5, 0, 0, Math.PI); x.stroke(); noglow(x);
        // gauge
        x.fillStyle = '#111'; x.beginPath(); x.arc(q[0] + 6, q[1] - h * 0.35, 2.6, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#39ff88'; x.fillRect(q[0] + 5.5, q[1] - h * 0.35 - 2, 1, 2);
      };
      tanks.filter((p) => p[0] + p[1] < s).forEach(tank);
      // pipes from level 4
      if (L >= 4) {
        const a = P(ox, oy, 0.85, 0.85), b = P(ox, oy, s / 2, s / 2);
        line(x, [a[0], a[1] - 8], [b[0], b[1] - 8], '#7a4a2a', 3); line(x, [a[0], a[1] - 9], [b[0], b[1] - 9], '#c8804a', 1);
      }
      const fb = box(x, ox, oy, s / 2 - 0.5, s / 2 - 0.5, s / 2 + 0.5, s / 2 + 0.5, 3, 16, pal('#3b2a22'));
      sign(x, fb, 'R', 0.5, 9, 'Cu', '#ff9a4a', 7);
      const apex = P(ox, oy, s / 2, s / 2);
      const legs = [P(ox, oy, s / 2 - 0.4, s / 2 - 0.4), P(ox, oy, s / 2 + 0.4, s / 2 - 0.4), P(ox, oy, s / 2 + 0.4, s / 2 + 0.4), P(ox, oy, s / 2 - 0.4, s / 2 + 0.4)];
      for (const l of legs) line(x, [l[0], l[1] - 16], [apex[0], apex[1] - H], '#c8702f', 1.7);
      for (let k = 0.2; k < 0.9; k += 0.17) {
        const pts = legs.map((l) => [l[0] + (apex[0] - l[0]) * k, l[1] - 16 + (apex[1] - H - l[1] + 16) * k]);
        poly(x, pts, null, '#9a5424', 0.8);
        line(x, pts[0], pts[2], 'rgba(154,84,36,.6)', 0.6);
      }
      tanks.filter((p) => p[0] + p[1] >= s).forEach(tank);
      return H + 12;
    },
    vault(x, ox, oy, s, L, r) {
      const h = HGT.vault(L), t = TRIM[L - 1];
      shadow(x, ox, oy, s, h); pad(x, ox, oy, s);
      const f = box(x, ox, oy, 0.32, 0.32, s - 0.32, s - 0.32, 3, h, { top: '#56607e', left: '#272c3f', right: '#363d57', edge: '#8a96c0' });
      // armour plates with rivets
      x.fillStyle = 'rgba(200,210,240,.35)';
      for (const face of ['L', 'R']) for (let k = 0.08; k < 1; k += 0.14) for (const z of [6, h - 6]) { const p = fp(f, face, k, z); x.fillRect(p[0] - 0.7, p[1] - 0.7, 1.4, 1.4); }
      faceLines(x, f, h * 0.3, '#19f0ff', 1.3);
      faceLines(x, f, h * 0.78, t, 1.3);
      windows(x, f, 'L', h * 0.42, h * 0.66, 1, 5, r, 'rgba(25,240,255,.7)');
      const m = fp(f, 'R', 0.5, h * 0.52);
      x.save(); x.translate(m[0], m[1]); x.transform(1, -0.5, 0, 1, 0, 0);
      x.fillStyle = '#1c2030'; x.beginPath(); x.arc(0, 0, 11, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#8a96c0'; x.lineWidth = 2; x.stroke();
      x.restore();
      const tf = box(x, ox, oy, s / 2 - 0.4, s / 2 - 0.4, s / 2 + 0.4, s / 2 + 0.4, h, h + 7, pal('#4a5470'));
      if (L >= 3) { const a = P(ox, oy, s - 0.6, s - 0.6); line(x, [a[0], a[1] - h], [a[0], a[1] - h - 20], '#9aa0c0', 1.2); dot(x, a[0], a[1] - h - 20, 2, t, 8); }
      void tf;
      return h + 30;
    },
    factory(x, ox, oy, s, L, r) {
      const h = HGT.factory(L);
      shadow(x, ox, oy, s, h + 20); pad(x, ox, oy, s);
      const f = box(x, ox, oy, 0.25, 0.25, s - 0.25, s - 0.25, 3, h, { top: '#4a4232', left: '#221e16', right: '#322c1f', edge: '#8a7a4a' });
      // hazard-striped garage door (left face)
      const D = [fp(f, 'L', 0.2, 3), fp(f, 'L', 0.62, 3), fp(f, 'L', 0.62, h * 0.7), fp(f, 'L', 0.2, h * 0.7)];
      poly(x, D, '#14120c', '#ffe14d', 1);
      for (let z = 6; z < h * 0.7; z += 3.5) line(x, fp(f, 'L', 0.2, z), fp(f, 'L', 0.62, z), 'rgba(255,225,77,.3)', 0.7);
      x.save(); x.beginPath(); D.forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.clip();
      for (let k = 0; k < 1; k += 0.08) line(x, fp(f, 'L', 0.2 + k * 0.42, 3), fp(f, 'L', 0.2 + k * 0.42 + 0.04, 9), '#ffe14d', 1.6);
      x.restore();
      windows(x, f, 'L', h * 0.55, h * 0.85, 1, 2, r, 'rgba(255,190,90,.9)');
      windows(x, f, 'R', h * 0.45, h * 0.85, 2, 4, r);
      sign(x, f, 'R', 0.5, h * 0.2, 'FABRYKA', '#ffe14d', 6);
      for (let i = 0; i < 3; i++) {
        const sx = 0.45 + i * 0.75;
        box(x, ox, oy, sx, 0.5, sx + 0.5, s - 0.5, h, h + 9, pal('#5a5040'));
        // skylights on the sawtooth roof
        const a = P(ox, oy, sx + 0.5, 0.6), b = P(ox, oy, sx + 0.5, s - 0.6);
        line(x, [a[0], a[1] - h - 5], [b[0], b[1] - h - 5], 'rgba(120,230,255,.6)', 2);
      }
      faceLines(x, f, h - 3, '#ffe14d', 1.2);
      // fan housing (blades animated)
      const fn = P(ox, oy, 0.9, s - 0.9);
      x.fillStyle = '#1a1820'; x.beginPath(); x.ellipse(fn[0], fn[1] - h - 10, 8, 4, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#6a6070'; x.lineWidth = 1; x.stroke();
      const chimneys = L >= 3 ? [[s - 0.75, 0.75], [s - 1.4, 0.7]] : [[s - 0.75, 0.75]];
      for (const [cx2, cy2] of chimneys) {
        const cp = P(ox, oy, cx2, cy2), CH = h + 30 + L * 3;
        cyl(x, cp[0], cp[1], 6, h, CH, '#3d3a44', '#1a181f');
        for (let z = h + 6; z < CH; z += 7) { x.strokeStyle = 'rgba(255,90,60,.5)'; x.lineWidth = 1; x.beginPath(); x.ellipse(cp[0], cp[1] - z, 6, 3, 0, 0, Math.PI); x.stroke(); }
        glow(x, '#ffe14d', 8); x.strokeStyle = '#ffe14d'; x.lineWidth = 1.4;
        x.beginPath(); x.ellipse(cp[0], cp[1] - CH + 5, 6, 3, 0, 0, Math.PI); x.stroke(); noglow(x);
      }
      return h + 30 + L * 3 + 8;
    },
    squadhq(x, ox, oy, s, L, r) {
      const h = HGT.squadhq(L), t = '#39ff88';
      shadow(x, ox, oy, s, h + 10); pad(x, ox, oy, s);
      if (L >= 3) {
        const tw = box(x, ox, oy, 0.5, 0.5, 1.4, 1.4, 3, h + 26, { top: '#2f5a3e', left: '#112017', right: '#183022', edge: t });
        faceLines(x, tw, h + 18, TRIM[L - 1], 1.2);
        windows(x, tw, 'R', h, h + 14, 2, 2, r, 'rgba(57,255,136,.8)');
      }
      const f = box(x, ox, oy, 0.35, 0.35 + (L >= 3 ? 1.2 : 0), s - 0.35, s - 0.35, 3, h, { top: '#26402f', left: '#112017', right: '#183022', edge: '#3fbf73' });
      faceLines(x, f, h * 0.35, t, 1.2);
      windows(x, f, 'L', h * 0.55, h * 0.9, 1, 7, r, 'rgba(57,255,136,.55)');
      windows(x, f, 'R', h * 0.55, h * 0.9, 1, 6, r);
      sign(x, f, 'R', 0.3, h * 0.2, 'SQUAD', t, 6);
      // sandbags + crates
      for (let k = 0.1; k < 0.9; k += 0.12) { const p = fp(f, 'L', k, 0); x.fillStyle = '#4a4630'; x.beginPath(); x.ellipse(p[0], p[1] + 6, 4, 2, 0, 0, Math.PI * 2); x.fill(); }
      const c = P(ox, oy, s / 2 + 0.2, s / 2 + (L >= 3 ? 0.6 : 0)); const cy = c[1] - h;
      x.fillStyle = '#16251b'; x.beginPath(); x.ellipse(c[0], cy, 26, 13, 0, 0, Math.PI * 2); x.fill();
      glow(x, t, 10); x.strokeStyle = t; x.lineWidth = 1.8; x.stroke();
      x.save(); x.translate(c[0], cy); x.scale(1, 0.5); x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = t; x.fillText('S', 0, 1); x.restore(); noglow(x);
      // parked drone from level 4
      if (L >= 4) {
        x.fillStyle = '#2a2d3a'; x.beginPath(); x.ellipse(c[0] + 10, cy - 4, 6, 3, 0, 0, Math.PI * 2); x.fill();
        for (const [ax, ay] of [[-6, -2], [6, -2], [-6, 2], [6, 2]]) { x.strokeStyle = '#555a70'; x.lineWidth = 1; x.beginPath(); x.moveTo(c[0] + 10, cy - 4); x.lineTo(c[0] + 10 + ax, cy - 4 + ay); x.stroke(); }
      }
      // flag
      const an = P(ox, oy, s - 0.6, s - 0.6);
      line(x, [an[0], an[1] - h], [an[0], an[1] - h - 30], '#9aa', 1.2);
      poly(x, [[an[0], an[1] - h - 30], [an[0] + 14, an[1] - h - 26], [an[0], an[1] - h - 21]], t);
      return h + 46;
    },
    laser(x, ox, oy, s, L) {
      const h = HGT.laser(L);
      shadow(x, ox, oy, s, h + 10); pad(x, ox, oy, s);
      const f = box(x, ox, oy, 0.3, 0.3, s - 0.3, s - 0.3, 3, h, pal('#2a2f45'));
      faceLines(x, f, h - 4, TRIM[L - 1], 1.2);
      // hazard chevrons + level pips
      for (let k = 0.15; k < 0.9; k += 0.18) line(x, fp(f, 'L', k, 4), fp(f, 'L', k + 0.06, 8), '#ffe14d', 1.4);
      for (let i = 0; i < L; i++) { const p = fp(f, 'R', 0.2 + i * 0.13, h * 0.5); dot(x, p[0], p[1], 1.2, TRIM[L - 1], 4); }
      const c = P(ox, oy, s / 2, s / 2);
      x.strokeStyle = '#6a7090'; x.lineWidth = 1; x.beginPath(); x.ellipse(c[0], c[1] - h, 14, 7, 0, 0, Math.PI * 2); x.stroke();
      return h + 34;
    },
    firewall(x, ox, oy, s, L) {
      const h = HGT.firewall(L);
      const cols = ['#3a2a3a', '#3a3046', '#2f3550', '#4a3a20', '#502828'];
      const f = box(x, ox, oy, 0.3, 0.3, 0.7, 0.7, 0, h, pal(cols[L - 1]));
      line(x, fp(f, 'L', 0.5, 2), fp(f, 'L', 0.5, h - 2), 'rgba(255,51,85,.6)', 1);
      const c = P(ox, oy, 0.5, 0.5);
      dot(x, c[0], c[1] - h - 1, 2.2, '#ff3355', 10);
      return h + 6;
    },
    rubble(x, ox, oy, s, _L, r) {
      box(x, ox, oy, 0.1, 0.1, s - 0.1, s - 0.1, 0, 2, { top: '#141221', left: '#0a0912', right: '#0f0d19', edge: '#221e38' }, true);
      // scorch mark
      const c = P(ox, oy, s / 2, s / 2);
      const g = x.createRadialGradient(c[0], c[1], 2, c[0], c[1], s * 24);
      g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(c[0], c[1], s * 26, s * 13, 0, 0, Math.PI * 2); x.fill();
      const n = 4 + s * 4, ps = [];
      for (let i = 0; i < n; i++) { const w = 0.15 + r() * 0.35; ps.push({ px: 0.2 + r() * (s - 0.6), py: 0.2 + r() * (s - 0.6), w, h: 2 + r() * 7 }); }
      ps.sort((a, b) => a.px + a.py - b.px - b.py);
      for (const p of ps) box(x, ox, oy, p.px, p.py, p.px + p.w, p.py + p.w * (0.5 + r()), 2, 2 + p.h, pal(r() < 0.5 ? '#2a2633' : '#3a2a22'));
      // glowing embers
      for (let i = 0; i < s * 3; i++) { const q = P(ox, oy, 0.3 + r() * (s - 0.6), 0.3 + r() * (s - 0.6)); dot(x, q[0], q[1] - 2, 1, '#ff6a2a', 6); }
      return 16;
    },
  };

  // returns cached sprite {c, ax, ay, w, h, top}
  A.sprite = function (type, level) {
    const key = type + level;
    let sp = cache.get(key);
    if (sp) return sp;
    const s = type === 'rubble' ? level : G.BUILDINGS[type].size;
    const w = s * TW + PADX * 2, h = s * TH + HEAD + 10;
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

  // ---------- per-frame building animation (wx, wy = world position of the footprint's top corner) ----------
  const light = (ctx, col, x, y, r, a) => G.World.light(ctx, col, x, y, r, r, a);
  A.anim = function (ctx, type, L, wx, wy, t, dt, seed) {
    const s = G.BUILDINGS[type].size, Pw = (tx, ty) => P(wx, wy, tx, ty);
    const tr = TRIM[L - 1];
    ctx.save();
    if (type === 'core') {
      const h = HGT.core(L), c = Pw(s / 2, s / 2), rx = s * TW * 0.31, ry = rx / 2;
      const pulse = 0.65 + Math.sin(t * 2.2) * 0.25;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = tr; ctx.lineWidth = 2; ctx.globalAlpha = pulse;
      ctx.setLineDash([14, 8]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.ellipse(c[0], c[1] - h * 0.55, rx, ry, 0, 0, Math.PI); ctx.stroke();
      if (L >= 3) { ctx.lineDashOffset = t * 40; ctx.beginPath(); ctx.ellipse(c[0], c[1] - h * 0.55 - 18, rx * 0.8, ry * 0.8, 0, 0, Math.PI); ctx.stroke(); }
      ctx.setLineDash([]);
      // hologram emblem spinning above the roof
      const ty = c[1] - h - 30, sp = Math.cos(t * 1.6);
      ctx.globalAlpha = 0.55 + pulse * 0.3;
      ctx.beginPath(); ctx.moveTo(c[0], ty - 10); ctx.lineTo(c[0] + 9 * sp, ty); ctx.lineTo(c[0], ty + 10); ctx.lineTo(c[0] - 9 * sp, ty); ctx.closePath(); ctx.stroke();
      light(ctx, tr, c[0], ty, 22, 0.35 * pulse);
      const mast = 26 + L * 3 + (L >= 5 ? 14 : 0);
      light(ctx, '#ff2bd6', c[0], c[1] - h - 12 - mast, 10, Math.sin(t * 4) > 0 ? 0.9 : 0.25);
      light(ctx, tr, c[0], c[1] - h * 0.55, rx * 0.9, 0.08 * pulse);
    } else if (type === 'scrapyard') {
      const H = HGT.scrapyard(L), base = Pw(s - 0.5, 0.5);
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, '#ff8a1f', base[0], base[1] - H - 3, 9, Math.sin(t * 5 + seed) > 0 ? 0.95 : 0.3);
      if (Math.random() < dt * 3) {
        const p = Pw(0.6 + Math.random() * (s - 1.2), 0.8 + Math.random() * (s - 1.4));
        for (let i = 0; i < 6; i++) G.World.emit({ k: 'spark', x: p[0], y: p[1] - 10, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 40, g: 160, r: 1.6, life: 0.5, max: 0.5, c: '#ffcc55' });
      }
    } else if (type === 'coppermine') {
      const H = HGT.coppermine(L), a = Pw(s / 2, s / 2);
      ctx.globalCompositeOperation = 'lighter';
      const p = 0.5 + Math.sin(t * 3 + seed) * 0.5;
      light(ctx, '#ff9a4a', a[0], a[1] - H, 14, 0.4 + p * 0.5);
      const bob = (Math.sin(t * 6) + 1) * 3;
      ctx.strokeStyle = '#ffb070'; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(a[0], a[1] - 22 - bob); ctx.lineTo(a[0], a[1] - H + 6); ctx.stroke();
    } else if (type === 'vault') {
      const h = HGT.vault(L), b0 = Pw(s - 0.32, 0.32), c0 = Pw(s - 0.32, s - 0.32);
      const m = [(b0[0] + c0[0]) / 2, (b0[1] + c0[1]) / 2 - h * 0.52];
      ctx.translate(m[0], m[1]); ctx.transform(1, -0.5, 0, 1, 0, 0);
      ctx.strokeStyle = tr; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.9;
      ctx.rotate(t * 0.8);
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k) * 8, Math.sin(k) * 8); ctx.stroke(); }
    } else if (type === 'factory') {
      const h = HGT.factory(L);
      const chimneys = L >= 3 ? [[s - 0.75, 0.75], [s - 1.4, 0.7]] : [[s - 0.75, 0.75]];
      for (const [cx2, cy2] of chimneys) {
        if (Math.random() < dt * 6) {
          const cp = Pw(cx2, cy2), CH = h + 30 + L * 3;
          G.World.emit({ k: 'smoke', x: cp[0] + (Math.random() - 0.5) * 4, y: cp[1] - CH, vx: 8 + Math.random() * 6, vy: -18 - Math.random() * 8, r: 4, gr: 8, life: 2.6, max: 2.6, c: '90,85,100', a: 0.45 });
        }
      }
      // spinning roof fan
      const fn = Pw(0.9, s - 0.9);
      ctx.translate(fn[0], fn[1] - h - 10); ctx.scale(1, 0.5); ctx.rotate(t * 8);
      ctx.fillStyle = '#8a8098';
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-1.2, 0, 2.4, 7); }
    } else if (type === 'squadhq') {
      const h = HGT.squadhq(L), c = Pw(s / 2 + 0.2, s / 2 + (L >= 3 ? 0.6 : 0)), cy = c[1] - h;
      ctx.globalCompositeOperation = 'lighter';
      const n = 8, on = Math.floor(t * 8) % n;
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2;
        light(ctx, '#39ff88', c[0] + Math.cos(a) * 26, cy + Math.sin(a) * 13, k === on ? 7 : 3, k === on ? 0.95 : 0.35);
      }
    }
    ctx.restore();
  };

  A.drawLaserHead = function (ctx, cx, cy, L, ang, fire, dis) {
    const y = cy - A.laserHeight(L) - 7;
    const t = dis ? '#666' : TRIM[L - 1];
    ctx.save();
    ctx.fillStyle = '#20243a'; ctx.beginPath(); ctx.ellipse(cx, y + 3, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    const dx = Math.cos(ang), dy = Math.sin(ang) * 0.5;
    ctx.strokeStyle = '#11131f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + dx * 17, y + dy * 17); ctx.stroke();
    ctx.strokeStyle = t; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + dx * 4, y + dy * 4); ctx.lineTo(cx + dx * 17, y + dy * 17); ctx.stroke();
    ctx.fillStyle = '#3a4160'; ctx.beginPath(); ctx.arc(cx, y - 1, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(cx - 2, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = t; ctx.beginPath(); ctx.arc(cx + dx * 3, y - 2 + dy * 3, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    G.World.light(ctx, t, cx + dx * 18, y + dy * 18, fire ? 16 : 6, fire ? 16 : 6, fire ? 1 : 0.5);
    ctx.restore();
    return [cx + dx * 18, y + dy * 18];
  };

  // ---------- units ----------
  const UCOL = { runner: '#ff2bd6', gunner: '#19f0ff', drone: '#ff3355', mech: '#ffe14d', ronin: '#ff4d4d', nyx: '#b26bff' };
  A.UCOL = UCOL;
  // st (optional): { moving, atk 0..1 (1 = just struck), dead 0..1 (death animation progress) }
  A.drawUnit = function (ctx, type, wx, wy, t, flip, flash, st) {
    st = st || { moving: true, atk: 0, dead: 0 };
    const c = UCOL[type];
    const hero = type === 'ronin' || type === 'nyx';
    const big = type === 'mech' ? 1.75 : hero ? 1.6 : 1.35;
    const dead = st.dead || 0;
    ctx.save(); ctx.translate(wx, wy);
    if (dead) ctx.globalAlpha = 1 - dead;
    // shadow + hero ring
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0, 0, 6 * big, 3 * big, 0, 0, Math.PI * 2); ctx.fill();
    if (hero && !dead) {
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -t * 20;
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 5.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (flip) ctx.scale(-1, 1);
    ctx.scale(big, big);
    if (dead) { ctx.translate(0, -2); ctx.rotate(-dead * 1.4); ctx.translate(0, 2 + dead * 3); }
    const mv = st.moving && !dead ? 1 : 0;
    const ph = t * (type === 'mech' ? 8 : 13);
    const swing = Math.sin(ph) * 3 * mv, bob = Math.abs(Math.cos(ph)) * 1.2 * mv;
    const atk = st.atk || 0;
    const skin = flash ? '#ffffff' : null;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const visor = (x0, y0, w, h) => {
      ctx.fillStyle = c; ctx.fillRect(x0, y0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.World.light(ctx, c, x0 + w / 2, y0 + h / 2, 3.5, 2.5, 0.55); ctx.restore();
    };
    const legs = (hipY, len, col, w) => {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(-1.5, hipY); ctx.lineTo(-1.5 + swing, hipY + len * 0.55); ctx.lineTo(-1.5 + swing * 0.6, 0);
      ctx.moveTo(1.5, hipY); ctx.lineTo(1.5 - swing, hipY + len * 0.55); ctx.lineTo(1.5 - swing * 0.6, 0); ctx.stroke();
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(-3 + swing * 0.6, -1, 3, 1.5); ctx.fillRect(0 - swing * 0.6, -1, 3, 1.5);
    };
    const cape = (x0, y0, len, col) => {
      const wave = Math.sin(t * 9) * 1.5 + (mv ? 2 : 0);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - 5 - wave, y0 + len * 0.5, x0 - 6 - wave * 1.5, y0 + len);
      ctx.lineTo(x0 - 1, y0 + len - 1); ctx.quadraticCurveTo(x0 - 2, y0 + len * 0.5, x0 + 2, y0); ctx.closePath(); ctx.fill();
    };
    if (type === 'drone') {
      const hy = -20 + Math.sin(t * 6) * 1.5 - dead * -16;
      ctx.strokeStyle = '#4a4f62'; ctx.lineWidth = 1.4;
      const arms = [[-7, -3], [7, -3], [-7, 3], [7, 3]];
      for (const [ax, ay] of arms) { ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(ax, hy + ay * 0.5); ctx.stroke(); }
      for (const [ax, ay] of arms) {
        const rx = ax, ry = hy + ay * 0.5 - 1.2;
        ctx.fillStyle = 'rgba(190,210,255,.18)'; ctx.beginPath(); ctx.ellipse(rx, ry, 4.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        const a = t * 40 + ax;
        ctx.strokeStyle = 'rgba(220,230,255,.7)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(rx - Math.cos(a) * 4.5, ry - Math.sin(a) * 1.6); ctx.lineTo(rx + Math.cos(a) * 4.5, ry + Math.sin(a) * 1.6); ctx.stroke();
      }
      ctx.fillStyle = skin || '#262a38'; ctx.beginPath(); ctx.ellipse(0, hy, 5.5, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a4054'; ctx.beginPath(); ctx.ellipse(-1, hy - 1.2, 3.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff9a20'; ctx.fillRect(-2.5, hy + 2.2, 5, 1.4);
      visor(1.5, hy - 1, 2.6, 2);
      const blink = Math.sin(t * 6) > 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      G.World.light(ctx, blink ? '#39ff88' : '#ff3355', blink ? -7 : 7, hy - 2, 3, 3, 0.9);
      ctx.restore();
    } else if (type === 'mech') {
      const by = -bob;
      // legs with knees
      ctx.strokeStyle = '#2c2c36'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(-3.5, -9 + by); ctx.lineTo(-5 + swing, -4.5); ctx.lineTo(-4 + swing * 0.5, 0);
      ctx.moveTo(3.5, -9 + by); ctx.lineTo(5 - swing, -4.5); ctx.lineTo(4 - swing * 0.5, 0); ctx.stroke();
      ctx.fillStyle = '#16161c'; ctx.fillRect(-6.5 + swing * 0.5, -1.2, 5, 1.8); ctx.fillRect(1.5 - swing * 0.5, -1.2, 5, 1.8);
      // torso
      ctx.fillStyle = skin || '#4a4230'; ctx.fillRect(-7.5, -21 + by, 15, 12);
      ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(-7.5, -21 + by, 15, 3);
      ctx.strokeStyle = c; ctx.lineWidth = 0.8; ctx.strokeRect(-7.5, -21 + by, 15, 12);
      ctx.fillStyle = '#1c1a14'; ctx.fillRect(-5, -13 + by, 10, 3);
      // shoulder pods
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(-10, -24 + by, 5, 7); ctx.fillRect(5, -24 + by, 5, 7);
      ctx.fillStyle = '#ff5a3c'; for (let i = 0; i < 3; i++) { ctx.fillRect(-9.2 + i * 1.4, -23.4 + by, 0.8, 0.8); ctx.fillRect(5.8 + i * 1.4, -23.4 + by, 0.8, 0.8); }
      // arm cannon (recoils on attack)
      const rc = atk * 2.5;
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(7 - rc, -19 + by, 9, 3);
      ctx.fillStyle = c; ctx.fillRect(15 - rc, -19 + by, 1.5, 3);
      visor(-3, -18 + by, 7, 2.2);
      ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-6, -21 + by); ctx.lineTo(-7, -28 + by); ctx.stroke();
    } else {
      const by = -bob;
      const coat = { runner: '#2a1838', gunner: '#16303a', ronin: '#e8e4ec', nyx: '#2c1640' }[type];
      const trim = c;
      // capes / scarves behind the body
      if (type === 'runner') cape(-1, -14 + by, 9, 'rgba(255,43,214,.75)');
      if (type === 'ronin') cape(-1, -15 + by, 13, '#b8162a');
      if (type === 'nyx') { ctx.fillStyle = '#4a1f72'; ctx.beginPath(); ctx.moveTo(-2, -19 + by); ctx.quadraticCurveTo(-7 - Math.sin(t * 5), -12 + by, -5, -6 + by); ctx.lineTo(-1, -12 + by); ctx.fill(); }
      legs(-7 + by, 7, type === 'ronin' ? '#3a3640' : '#15121c', type === 'gunner' ? 2.6 : 2.2);
      // torso
      ctx.fillStyle = skin || coat; ctx.beginPath(); ctx.moveTo(-3.8, -15 + by); ctx.lineTo(3.8, -15 + by); ctx.lineTo(3.2, -6.5 + by); ctx.lineTo(-3.2, -6.5 + by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = trim; ctx.fillRect(-3.4, -9.5 + by, 6.8, 1.2);
      if (type === 'gunner') { ctx.fillStyle = '#2a4a56'; ctx.fillRect(-3.8, -14.5 + by, 7.6, 4); }
      if (type === 'ronin') { ctx.fillStyle = '#c21a30'; ctx.fillRect(-3.8, -14.5 + by, 2, 8); ctx.fillStyle = '#9a9aa8'; ctx.fillRect(-4.5, -15.5 + by, 3, 2.5); ctx.fillRect(1.5, -15.5 + by, 3, 2.5); }
      if (type === 'nyx') { ctx.fillStyle = '#7a3ac0'; ctx.fillRect(-3.8, -11 + by, 7.6, 1); }
      // head
      const hx = 0, hy = -17.6 + by;
      if (type === 'nyx') { ctx.fillStyle = '#6a2fa8'; ctx.beginPath(); ctx.arc(hx - 0.5, hy - 0.5, 3.4, Math.PI * 0.8, Math.PI * 2.1); ctx.lineTo(hx - 5, hy + 6); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = skin || (type === 'gunner' ? '#2f3e48' : type === 'ronin' ? '#d8d4e0' : type === 'runner' ? '#1f1428' : '#c9a98a');
      ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
      if (type === 'runner') { ctx.fillStyle = '#2a1838'; ctx.beginPath(); ctx.arc(hx - 0.6, hy - 0.6, 3.3, Math.PI, Math.PI * 2.2); ctx.fill(); }
      if (type === 'ronin') { ctx.fillStyle = '#b8162a'; ctx.fillRect(hx - 3.2, hy - 1.6, 6.4, 1); }
      visor(hx - 0.2, hy - 0.8, 3.4, 1.4);
      // weapons + attack animation
      const sw = atk;
      if (type === 'runner') {
        ctx.save(); ctx.translate(2.5, -10.5 + by); ctx.rotate(-0.9 + sw * 1.6);
        ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, 0); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; G.World.light(ctx, c, 4, 0, 6, 3, 0.6); ctx.restore();
      } else if (type === 'gunner') {
        const rc = sw * 2;
        ctx.fillStyle = '#4a5560'; ctx.fillRect(0 - rc, -12 + by, 11, 2.6);
        ctx.fillStyle = '#20262c'; ctx.fillRect(2 - rc, -10 + by, 2, 2.5);
        ctx.fillStyle = c; ctx.fillRect(10 - rc, -12 + by, 2, 2.6);
        if (sw > 0.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.World.light(ctx, '#ffffff', 13, -10.7 + by, 6, 4, sw); G.World.light(ctx, c, 14, -10.7 + by, 10, 6, sw); ctx.restore(); }
      } else if (type === 'ronin') {
        const a0 = -1.1 + sw * 2.2;
        ctx.save(); ctx.translate(2.5, -11 + by);
        if (sw > 0.05) {
          // katana slash trail
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,60,80,' + (0.7 * sw).toFixed(2) + ')'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, 13, a0 - 1.6, a0); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,220,230,' + (0.6 * sw).toFixed(2) + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, 0, 13, a0 - 1.2, a0); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.rotate(a0);
        ctx.strokeStyle = '#ffd0d6'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(14, 0); ctx.stroke();
        ctx.strokeStyle = '#ff2a40'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(3, 0.6); ctx.lineTo(14, 0.6); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.fillRect(-1, -1, 3, 2);
        ctx.globalCompositeOperation = 'lighter'; G.World.light(ctx, '#ff3048', 9, 0, 9, 3, 0.55);
        ctx.restore();
      } else if (type === 'nyx') {
        // holographic interface around the hand
        ctx.save(); ctx.translate(7, -11 + by);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = c; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]); ctx.lineDashOffset = t * 10;
        ctx.beginPath(); ctx.ellipse(0, 0, 4.5 + sw * 2, 2.6 + sw, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(178,107,255,.6)';
        for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; ctx.fillRect(Math.cos(a) * 6 - 1, Math.sin(a) * 3 - 4 - k, 2.4, 1.6); }
        G.World.light(ctx, c, 0, 0, 7 + sw * 4, 5 + sw * 3, 0.7);
        ctx.restore();
        ctx.fillStyle = '#c9a98a'; ctx.beginPath(); ctx.arc(4.5, -10.5 + by, 1.2, 0, Math.PI * 2); ctx.fill();
      }
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
    const k = type === 'mech' ? 1.15 : (type === 'ronin' || type === 'nyx') ? 1.3 : 1.6;
    x.translate(30, 58); x.scale(k, k);
    A.drawUnit(x, type, 0, 0, 0.3, false, false, { moving: false, atk: 0, dead: 0 });
    const url = c.toDataURL();
    thumbs.set(key, url);
    return url;
  };
})();
