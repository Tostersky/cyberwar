// The city around the base: night sky, parallax skyline, wet asphalt, street props, particles and rain.
(function () {
  const TW = G.TW, TH = G.TH, M = G.MAP;
  const Wd = G.World = {};
  const { mk, shade, pal, P, poly, box, cyl, line, dot } = G.Art.prim;
  const rnd = G.rng(4242);

  // ---------- cached soft-glow textures (cheap neon light, no shadowBlur per frame) ----------
  const glowTex = new Map();
  Wd.glow = function (color) {
    let c = glowTex.get(color);
    if (c) return c;
    const [cv, x] = mk(64, 64, 1);
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, color); g.addColorStop(0.25, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = 1; x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glowTex.set(color, cv);
    return cv;
  };
  // additive soft light, rx/ry radii in current transform units
  Wd.light = function (ctx, color, x, y, rx, ry, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(Wd.glow(color), x - rx, y - ry, rx * 2, ry * 2);
    ctx.globalAlpha = 1;
  };

  // ---------- sky + parallax skyline (screen space) ----------
  let sky = null;
  const NEON = ['#ff2bd6', '#19f0ff', '#ffe14d', '#39ff88', '#ff5a3c', '#b26bff'];
  const SIGNS = ['NEXUS', 'BAR', '24/7', 'NEO', 'DATA', 'RAMEN', 'HOTEL', 'SYNTH', 'VOLT', 'CLINIC'];
  function buildSky(w, h) {
    const d = G.dpr;
    const s = { w, h, d };
    // gradient + stars + moon
    const [bg, x] = mk(w, h, d);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#03020b'); g.addColorStop(0.45, '#120828'); g.addColorStop(0.75, '#2a0c3e'); g.addColorStop(1, '#3d1040');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = G.rng(77);
    for (let i = 0; i < 160; i++) {
      x.globalAlpha = 0.25 + r() * 0.6; x.fillStyle = r() < 0.15 ? '#ffd6f6' : '#ffffff';
      const sz = r() < 0.1 ? 1.6 : 0.9;
      x.fillRect(r() * w, r() * h * 0.55, sz, sz);
    }
    x.globalAlpha = 1;
    const mx = w * 0.78, my = h * 0.16, mr = Math.min(w, h) * 0.07;
    const mg = x.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 4);
    mg.addColorStop(0, 'rgba(255,120,220,.35)'); mg.addColorStop(1, 'rgba(255,120,220,0)');
    x.fillStyle = mg; x.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
    x.fillStyle = '#f6d3ef'; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(180,120,190,.35)'; x.beginPath(); x.arc(mx + mr * 0.3, my - mr * 0.2, mr * 0.25, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(mx - mr * 0.35, my + mr * 0.3, mr * 0.15, 0, Math.PI * 2); x.fill();
    s.bg = bg;
    // two skyline layers, wider than the screen so they can slide
    s.layers = [];
    s.blinks = [];
    s.ads = [];
    for (let li = 0; li < 2; li++) {
      const lw = w + 600, lh = h;
      const [c, y] = mk(lw, lh, d);
      const base = h * (li === 0 ? 0.62 : 0.72);
      const col = li === 0 ? '#1a0d30' : '#0c0716';
      const winA = li === 0 ? 0.35 : 0.6;
      let px = -20;
      while (px < lw) {
        const bw = (li === 0 ? 30 : 46) + r() * (li === 0 ? 50 : 80);
        const bh = (li === 0 ? 80 : 60) + r() * (li === 0 ? h * 0.35 : h * 0.3);
        const top = base - bh;
        y.fillStyle = col; y.fillRect(px, top, bw, lh - top);
        if (r() < 0.4) { y.fillRect(px + bw * 0.3, top - 18 - r() * 30, bw * 0.4, 30); }
        if (r() < 0.5) { y.fillRect(px + bw * 0.5, top - 50 - r() * 40, 2, 60); }
        // windows
        for (let wy = top + 8; wy < base + 40; wy += 9) for (let wx = px + 5; wx < px + bw - 6; wx += 8) {
          if (r() < 0.3) {
            const c2 = r() < 0.7 ? '255,214,140' : (r() < 0.5 ? '25,240,255' : '255,43,214');
            y.fillStyle = 'rgba(' + c2 + ',' + (winA * (0.4 + r() * 0.6)).toFixed(2) + ')';
            y.fillRect(wx, wy, 3, 4);
            if (li === 1 && r() < 0.03) s.blinks.push({ li, x: wx, y: wy, ph: r() * 6, sp: 0.5 + r() * 2 });
          }
        }
        // neon signs on the near layer
        if (li === 1 && r() < 0.55) {
          const nc = NEON[Math.floor(r() * NEON.length)];
          const text = SIGNS[Math.floor(r() * SIGNS.length)];
          const vertical = r() < 0.5;
          const sx = px + bw * (0.2 + r() * 0.4), sy = top + 20 + r() * Math.max(10, bh * 0.4);
          s.ads.push({ x: sx, y: sy, text, color: nc, vertical, ph: r() * 10, flick: r() < 0.3 });
        }
        px += bw + (li === 0 ? 2 : 6) + r() * 10;
      }
      // haze at the base of the far layer
      const hz = y.createLinearGradient(0, base - 120, 0, base + 60);
      hz.addColorStop(0, 'rgba(255,43,214,0)'); hz.addColorStop(1, li === 0 ? 'rgba(120,30,140,.35)' : 'rgba(40,10,60,.5)');
      y.fillStyle = hz; y.fillRect(0, base - 120, lw, lh);
      s.layers.push({ c, lw, lh });
    }
    return s;
  }
  Wd.drawSky = function (ctx, cam, t) {
    const w = G.W, h = G.H, d = G.dpr;
    if (!sky || sky.w !== w || sky.h !== h || sky.d !== d) sky = buildSky(w, h);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.drawImage(sky.bg, 0, 0, w, h);
    const factors = [0.04, 0.09];
    sky.layers.forEach((L, i) => {
      const ox = -300 - G.clamp(cam.x * factors[i] * cam.z, -280, 280);
      const oy = G.clamp((G.MAP * TH / 2 - cam.y) * factors[i] * 0.6, -80, 80);
      ctx.drawImage(L.c, ox, oy, L.lw, L.lh);
      if (i === 1) {
        // animated neon signs and blinking windows
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const a of sky.ads) {
          let on = 0.75 + Math.sin(t * 2 + a.ph) * 0.25;
          if (a.flick && Math.sin(t * 13 + a.ph * 7) > 0.85) on = 0.15;
          const ax = a.x + ox, ay = a.y + oy;
          if (ax < -80 || ax > w + 80) continue;
          Wd.light(ctx, a.color, ax + (a.vertical ? 4 : a.text.length * 4), ay + (a.vertical ? a.text.length * 5 : 0), a.vertical ? 20 : a.text.length * 7, a.vertical ? a.text.length * 8 : 14, 0.35 * on);
          ctx.globalAlpha = on; ctx.fillStyle = a.color; ctx.font = 'bold 9px "Segoe UI",sans-serif'; ctx.textBaseline = 'top';
          if (a.vertical) for (let k = 0; k < a.text.length; k++) ctx.fillText(a.text[k], ax, ay + k * 10);
          else ctx.fillText(a.text, ax, ay - 5);
        }
        for (const b of sky.blinks) {
          ctx.globalAlpha = Math.max(0, Math.sin(t * b.sp + b.ph)) * 0.8;
          ctx.fillStyle = '#ffd68c'; ctx.fillRect(b.x + ox, b.y + oy, 3, 4);
        }
        ctx.restore();
      }
    });
  };

  // ---------- street props on the outer road ring ----------
  const onRing = (x, y, s) => x < 2 || y < 2 || x + s > M - 2 || y + s > M - 2;
  Wd.props = [];
  (function placeProps() {
    const occ = new Uint8Array(M * M);
    const put = (kind, x, y, s, extra) => {
      for (let j = y; j < y + s; j++) for (let i = x; i < x + s; i++) { if (i < 0 || j < 0 || i >= M || j >= M || occ[j * M + i]) return false; }
      for (let j = y; j < y + s; j++) for (let i = x; i < x + s; i++) occ[j * M + i] = 1;
      Wd.props.push(Object.assign({ kind, x, y, s, seed: Math.floor(rnd() * 1e6) }, extra || {}));
      return true;
    };
    // lamps along the outer edge of the road
    const lampCols = ['#19f0ff', '#ff2bd6', '#ffe14d', '#b26bff'];
    for (let k = 3; k < M - 3; k += 6) {
      put('lamp', k, 0, 1, { color: lampCols[(k / 6 | 0) % 4] });
      put('lamp', 0, k + 3, 1, { color: lampCols[(k / 6 + 1 | 0) % 4] });
      put('lamp', k + 2, M - 1, 1, { color: lampCols[(k / 6 + 2 | 0) % 4] });
      put('lamp', M - 1, k, 1, { color: lampCols[(k / 6 + 3 | 0) % 4] });
    }
    const kinds = ['container', 'wreck', 'vent', 'barrier', 'crates', 'container', 'wreck', 'vent', 'crates', 'barrier'];
    let tries = 0, placed = 0;
    while (placed < 26 && tries++ < 600) {
      const kind = kinds[placed % kinds.length];
      const s = kind === 'container' || kind === 'wreck' ? 2 : 1;
      const side = Math.floor(rnd() * 4);
      const along = 2 + Math.floor(rnd() * (M - 4 - s));
      const across = Math.floor(rnd() * (2 - s + 1));
      let x, y;
      if (side === 0) { x = along; y = across; } else if (side === 1) { x = across; y = along; }
      else if (side === 2) { x = along; y = M - s - across; } else { x = M - s - across; y = along; }
      if (!onRing(x, y, s)) continue;
      if (put(kind, x, y, s)) placed++;
    }
  })();

  const propCache = new Map();
  const HEAD = 90, PADX = 10;
  const PROP_DRAW = {
    lamp(x, ox, oy, p) {
      const b = P(ox, oy, 0.5, 0.5);
      cyl(x, b[0], b[1], 2.2, 0, 46, '#3a3d4a', '#555a6a');
      line(x, [b[0], b[1] - 46], [b[0] + 10, b[1] - 50], '#3a3d4a', 2);
      x.fillStyle = '#1a1c24'; x.fillRect(b[0] + 6, b[1] - 53, 10, 4);
      dot(x, b[0] + 11, b[1] - 48, 2.6, p.color, 14);
      return 56;
    },
    container(x, ox, oy, p, r) {
      const cols = ['#7a2a26', '#1f5a66', '#5a4a1e', '#3a2f66'];
      const c = cols[Math.floor(r() * cols.length)];
      const long = r() < 0.5;
      const f = box(x, ox, oy, 0.15, 0.25, long ? 1.85 : 1.6, long ? 1.6 : 1.85, 0, 22, pal(c));
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1;
      for (let k = 0.1; k < 1; k += 0.12) {
        const a = [f.d[0] + (f.c[0] - f.d[0]) * k, f.d[1] + (f.c[1] - f.d[1]) * k];
        x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[0], a[1] - 22); x.stroke();
      }
      x.fillStyle = 'rgba(255,255,255,.55)'; x.font = 'bold 6px sans-serif';
      x.fillText(['NX-77', 'ZENITH', 'K-CORP', 'DATA'][Math.floor(r() * 4)], (f.c[0] + f.b[0]) / 2 - 10, (f.c[1] + f.b[1]) / 2 - 10);
      return 30;
    },
    wreck(x, ox, oy, p, r) {
      const c = ['#3a2222', '#22303a', '#2e2a20'][Math.floor(r() * 3)];
      box(x, ox, oy, 0.3, 0.55, 1.75, 1.45, 0, 7, pal(c));
      box(x, ox, oy, 0.75, 0.7, 1.4, 1.3, 7, 13, pal('#1c1c24'));
      const w1 = P(ox, oy, 0.55, 1.45), w2 = P(ox, oy, 1.5, 1.45);
      x.fillStyle = '#0b0b0f'; [w1, w2].forEach((w) => { x.beginPath(); x.ellipse(w[0], w[1] - 2, 3.5, 2.5, 0, 0, Math.PI * 2); x.fill(); });
      line(x, P(ox, oy, 0.4, 1.45).map((v, i) => v - (i ? 4 : 0)), P(ox, oy, 1.7, 1.45).map((v, i) => v - (i ? 4 : 0)), '#ff2bd6', 1, 6);
      return 22;
    },
    vent(x, ox, oy) {
      const f = box(x, ox, oy, 0.2, 0.2, 0.8, 0.8, 0, 8, pal('#3c4150'));
      x.strokeStyle = '#11131a'; x.lineWidth = 1;
      for (let k = 0.25; k < 0.8; k += 0.15) { const a = P(ox, oy, 0.25, k), b = P(ox, oy, 0.75, k); x.beginPath(); x.moveTo(a[0], a[1] - 8); x.lineTo(b[0], b[1] - 8); x.stroke(); }
      const pp = P(ox, oy, 0.8, 0.5);
      cyl(x, pp[0] + 4, pp[1], 3, 0, 4, '#555a66', '#6a7080');
      void f;
      return 14;
    },
    barrier(x, ox, oy) {
      box(x, ox, oy, 0.1, 0.35, 0.9, 0.65, 0, 9, pal('#6a6870'));
      const a = P(ox, oy, 0.1, 0.65), b = P(ox, oy, 0.9, 0.65);
      x.strokeStyle = '#ffe14d'; x.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const s0 = [a[0] + (b[0] - a[0]) * (k / 4), a[1] + (b[1] - a[1]) * (k / 4)];
        x.beginPath(); x.moveTo(s0[0], s0[1] - 2); x.lineTo(s0[0] + 4, s0[1] - 7); x.stroke();
      }
      return 14;
    },
    crates(x, ox, oy, p, r) {
      const n = 2 + Math.floor(r() * 3);
      const items = [];
      for (let i = 0; i < n; i++) items.push({ x: 0.1 + r() * 0.45, y: 0.1 + r() * 0.45, s: 0.3 + r() * 0.15, h: 6 + r() * 6 });
      items.sort((a, b) => a.x + a.y - b.x - b.y);
      for (const it of items) box(x, ox, oy, it.x, it.y, it.x + it.s, it.y + it.s, 0, it.h, pal(r() < 0.5 ? '#5a4128' : '#3e4a52'));
      return 20;
    },
  };
  function propSprite(p) {
    const key = p.kind + p.seed % 7 + (p.color || '');
    let sp = propCache.get(key);
    if (sp) return sp;
    const w = p.s * TW + PADX * 2, h = p.s * TH + HEAD;
    const [c, x] = mk(w, h, 2);
    const ox = p.s * TW / 2 + PADX, oy = HEAD;
    PROP_DRAW[p.kind](x, ox, oy, p, G.rng(p.seed % 7 + 11));
    sp = { c, ax: ox, ay: oy, w, h };
    propCache.set(key, sp);
    return sp;
  }
  // depth-sorted draw items for the props (merged with buildings/units by the scenes)
  Wd.propItems = function () {
    return Wd.props.map((p) => ({ d: p.x + p.y + p.s, prop: p }));
  };
  Wd.drawProp = function (ctx, p) {
    const sp = propSprite(p);
    const [wx, wy] = G.tileToWorld(p.x, p.y);
    ctx.drawImage(sp.c, wx - sp.ax, wy - sp.ay, sp.w, sp.h);
  };

  // ---------- world particles: steam, smoke, sparks, embers ----------
  Wd.parts = [];
  Wd.emit = function (p) { if (Wd.parts.length < 500) Wd.parts.push(p); };
  let steamAcc = 0;
  Wd.update = function (dt, t) {
    steamAcc += dt;
    if (steamAcc > 0.12) {
      steamAcc = 0;
      for (const p of Wd.props) if (p.kind === 'vent' && Math.random() < 0.6) {
        const [wx, wy] = G.tileToWorld(p.x + 0.8, p.y + 0.5);
        Wd.emit({ k: 'smoke', x: wx + 4, y: wy - 6, vx: (Math.random() - 0.3) * 6, vy: -14 - Math.random() * 8, r: 3, gr: 9, life: 2.2, max: 2.2, c: '200,210,230', a: 0.22 });
      }
    }
    for (const q of Wd.parts) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.g) q.vy += q.g * dt;
      if (q.gr) q.r += q.gr * dt;
      if (q.vr) q.rot += q.vr * dt;
      if (q.floor && q.y > q.floor) { q.y = q.floor; q.vy *= -0.3; q.vx *= 0.5; q.vr *= 0.5; }
    }
    Wd.parts = Wd.parts.filter((q) => q.life > 0);
    void t;
  };
  Wd.drawParts = function (ctx) {
    for (const q of Wd.parts) {
      const a = Math.max(0, q.life / q.max);
      if (q.k === 'smoke') {
        ctx.globalAlpha = q.a * a; ctx.fillStyle = 'rgb(' + q.c + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
      } else if (q.k === 'debris') {
        ctx.globalAlpha = Math.min(1, a * 2); ctx.fillStyle = q.c;
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-q.r / 2, -q.r / 2, q.r, q.r * 0.7);
        ctx.fillStyle = 'rgba(255,120,50,.6)'; ctx.fillRect(-q.r / 2, -q.r / 2, q.r * 0.4, q.r * 0.3); ctx.restore();
      } else {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a; ctx.fillStyle = q.c;
        ctx.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.globalAlpha = 1;
  };

  // light pools on the ground under lamps (drawn after the ground, before objects)
  Wd.drawLights = function (ctx, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of Wd.props) {
      if (p.kind !== 'lamp') continue;
      const [wx, wy] = G.tileToWorld(p.x + 0.5, p.y + 0.5);
      const fl = 0.85 + Math.sin(t * 3 + p.seed) * 0.05 + (Math.sin(t * 17 + p.seed) > 0.97 ? -0.4 : 0);
      Wd.light(ctx, p.color, wx + 10, wy + 4, 70, 36, 0.22 * fl);
      Wd.light(ctx, p.color, wx + 11, wy - 48, 14, 14, 0.8 * fl);
    }
    ctx.restore();
  };

  // ---------- rain + fog (screen space, after the world) ----------
  const drops = [];
  for (let i = 0; i < 120; i++) drops.push({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.6, l: 8 + Math.random() * 10 });
  const splashes = [];
  Wd.drawWeather = function (ctx, dt, t) {
    const w = G.W, h = G.H, d = G.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (Wd.rain) drawRain(ctx, dt, w, h);
    fog(ctx, t, w, h);
  };
  Wd.rain = false; // the player asked for no rain
  function drawRain(ctx, dt, w, h) {
    ctx.strokeStyle = 'rgba(180,220,255,.28)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const r of drops) {
      r.y += dt * 1.1 * r.s; r.x -= dt * 0.12 * r.s;
      if (r.y > 1) { r.y -= 1; r.x = Math.random() * 1.1; if (Math.random() < 0.5) splashes.push({ x: Math.random() * w, y: h * (0.35 + Math.random() * 0.65), life: 0.25 }); }
      if (r.x < -0.05) r.x += 1.1;
      const px = r.x * w, py = r.y * h;
      ctx.moveTo(px, py); ctx.lineTo(px - r.l * 0.15, py + r.l);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(180,220,255,.35)';
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i]; s.life -= dt;
      if (s.life <= 0) { splashes.splice(i, 1); continue; }
      const k = 1 - s.life / 0.25;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 2 + k * 5, 1 + k * 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function fog(ctx, t, w, h) {
    // low drifting fog
    ctx.globalCompositeOperation = 'lighter';
    const fx = (t * 12) % (w + 400) - 200;
    Wd.light(ctx, 'rgba(120,60,180,1)', fx, h * 0.92, 320, 90, 0.10);
    Wd.light(ctx, 'rgba(40,120,180,1)', w - fx * 0.7, h * 0.85, 280, 80, 0.08);
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  };

  // ---------- ground: wet asphalt, plaza plates, manholes, cables, puddles ----------
  let groundCache = null;
  Wd.ground = function () {
    if (groundCache) return groundCache;
    const w = M * TW, h = M * TH;
    const [c, x] = mk(w, h, 1);
    const ox = w / 2, oy = 0;
    const r = G.rng(1234);
    const isRoad = (tx, ty) => tx < 2 || ty < 2 || tx >= M - 2 || ty >= M - 2;
    // 0 = tech plates (centre), 1 = steel grating, 2 = cracked concrete — blobby districts from a few seeds
    const seeds = []; for (let i = 0; i < 14; i++) seeds.push([2 + r() * (M - 4), 2 + r() * (M - 4), i < 2 ? 0 : 1 + (i % 2)]);
    seeds.push([M / 2, M / 2, 0]);
    const zoneOf = (tx, ty) => {
      let best = 0, bd = 1e9;
      for (const s of seeds) { const d = Math.hypot(tx - s[0], ty - s[1]) * (s[2] === 0 ? 0.6 : 1); if (d < bd) { bd = d; best = s[2]; } }
      return best;
    };
    for (let ty = 0; ty < M; ty++) for (let tx = 0; tx < M; tx++) {
      const a = P(ox, oy, tx, ty), b = P(ox, oy, tx + 1, ty), cc = P(ox, oy, tx + 1, ty + 1), d = P(ox, oy, tx, ty + 1);
      const v = 0.9 + r() * 0.2;
      if (isRoad(tx, ty)) poly(x, [a, b, cc, d], shade('#0d0c15', v), null);
      else {
        // districts of different ground: tech plates, steel grating, cracked concrete
        const zone = zoneOf(tx, ty);
        if (zone === 0) {
          const base = ((tx >> 1) + (ty >> 1)) & 1 ? '#191532' : '#16122c';
          poly(x, [a, b, cc, d], shade(base, v), 'rgba(70,60,130,.4)', 0.7);
          if (((tx + ty) & 3) === 0) { x.fillStyle = 'rgba(140,130,200,.3)'; x.fillRect(a[0] - 1, a[1] + 3, 2, 1.5); }
        } else if (zone === 1) {
          poly(x, [a, b, cc, d], shade('#10161e', v), 'rgba(50,90,110,.35)', 0.7);
          x.strokeStyle = 'rgba(80,130,150,.16)'; x.lineWidth = 0.6;
          for (let k = 0.25; k < 1; k += 0.25) { const p1 = P(ox, oy, tx + k, ty), p2 = P(ox, oy, tx + k, ty + 1); x.beginPath(); x.moveTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.stroke(); }
        } else {
          poly(x, [a, b, cc, d], shade(r() < 0.5 ? '#1d1b24' : '#1a1820', v), 'rgba(40,38,52,.6)', 0.6);
        }
      }
    }
    // glowing circuit traces running along the tile seams, with solder nodes
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      let tx = 3 + Math.floor(r() * (M - 6)), ty = 3 + Math.floor(r() * (M - 6));
      const col = ['#19f0ff', '#ff2bd6', '#7f6bff', '#39ff88'][Math.floor(r() * 4)];
      x.strokeStyle = col; x.globalAlpha = 0.22; x.lineWidth = 1.4;
      x.shadowColor = col; x.shadowBlur = 6;
      let p = P(ox, oy, tx, ty); x.beginPath(); x.moveTo(p[0], p[1]);
      const nodes = [p];
      for (let k = 0; k < 5 + Math.floor(r() * 6); k++) {
        const len = 1 + Math.floor(r() * 4);
        if (r() < 0.5) tx = Math.max(2, Math.min(M - 2, tx + (r() < 0.5 ? -len : len))); else ty = Math.max(2, Math.min(M - 2, ty + (r() < 0.5 ? -len : len)));
        p = P(ox, oy, tx, ty); x.lineTo(p[0], p[1]); nodes.push(p);
      }
      x.stroke(); x.shadowBlur = 0;
      x.globalAlpha = 0.6; x.fillStyle = col;
      for (const n of nodes) { x.beginPath(); x.ellipse(n[0], n[1], 2.2, 1.2, 0, 0, Math.PI * 2); x.fill(); }
    }
    x.restore(); x.globalAlpha = 1;
    // bio-luminescent moss creeping out of the cracks
    for (let i = 0; i < 16; i++) {
      const c0 = P(ox, oy, 3 + r() * (M - 6), 3 + r() * (M - 6)), col = r() < 0.6 ? [57, 255, 160] : [25, 220, 255];
      for (let k = 0; k < 26; k++) {
        const px = c0[0] + (r() - 0.5) * 70, py = c0[1] + (r() - 0.5) * 32, rr = 2 + r() * 6;
        x.fillStyle = `rgba(${col[0] * 0.25 | 0},${col[1] * 0.35 | 0},${col[2] * 0.3 | 0},${0.45 + r() * 0.3})`;
        x.beginPath(); x.ellipse(px, py, rr, rr * 0.5, 0, 0, Math.PI * 2); x.fill();
        if (r() < 0.35) { x.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},.55)`; x.fillRect(px, py, 1.4, 1.4); }
      }
    }
    // gravel and dirt drifts
    for (let i = 0; i < 10; i++) {
      const c0 = P(ox, oy, 3 + r() * (M - 6), 3 + r() * (M - 6));
      x.fillStyle = 'rgba(70,58,50,.35)'; x.beginPath(); x.ellipse(c0[0], c0[1], 40 + r() * 30, 16 + r() * 10, 0, 0, Math.PI * 2); x.fill();
      for (let k = 0; k < 60; k++) { x.fillStyle = r() < 0.5 ? 'rgba(150,130,110,.35)' : 'rgba(20,16,14,.5)'; x.fillRect(c0[0] + (r() - 0.5) * 80, c0[1] + (r() - 0.5) * 30, 1.6, 1.2); }
    }
    // landing pad stencil
    {
      const c0 = P(ox, oy, 7, 31);
      x.strokeStyle = 'rgba(255,225,77,.35)'; x.lineWidth = 2;
      x.beginPath(); x.ellipse(c0[0], c0[1], 46, 23, 0, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.ellipse(c0[0], c0[1], 38, 19, 0, 0, Math.PI * 2); x.stroke();
      x.save(); x.translate(c0[0], c0[1]); x.transform(1, 0, 0, 0.5, 0, 0); x.rotate(Math.PI / 4);
      x.fillStyle = 'rgba(255,225,77,.3)'; x.fillRect(-14, -16, 6, 32); x.fillRect(8, -16, 6, 32); x.fillRect(-8, -3, 16, 6);
      x.restore();
    }
    // asphalt grain on the road
    for (let i = 0; i < 4000; i++) {
      const tx = r() * M, ty = r() < 0.5 ? r() * 2 : M - r() * 2;
      const p = r() < 0.5 ? P(ox, oy, tx, ty) : P(ox, oy, ty, tx);
      x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.25)';
      x.fillRect(p[0], p[1], 1.5, 1);
    }
    // lane markings + crosswalks
    x.setLineDash([12, 12]); x.strokeStyle = 'rgba(255,225,77,.45)'; x.lineWidth = 1.4;
    poly(x, [P(ox, oy, 1, 1), P(ox, oy, M - 1, 1), P(ox, oy, M - 1, M - 1), P(ox, oy, 1, M - 1)], null, 'rgba(255,225,77,.45)', 1.4);
    x.setLineDash([]);
    const cross = (tx0, ty0, horiz) => {
      for (let k = 0; k < 6; k++) {
        const s = horiz ? [tx0 + k * 0.33, ty0, tx0 + k * 0.33 + 0.18, ty0 + 2] : [tx0, ty0 + k * 0.33, tx0 + 2, ty0 + k * 0.33 + 0.18];
        poly(x, [P(ox, oy, s[0], s[1]), P(ox, oy, s[2], s[1]), P(ox, oy, s[2], s[3]), P(ox, oy, s[0], s[3])], 'rgba(230,230,240,.18)');
      }
    };
    cross(M / 2 - 1, 0, true); cross(0, M / 2 - 1, false); cross(M / 2 - 1, M - 2, true); cross(M - 2, M / 2 - 1, false);
    // hazard stripe around the base area
    x.setLineDash([6, 6]); x.lineWidth = 2.5;
    poly(x, [P(ox, oy, 2, 2), P(ox, oy, M - 2, 2), P(ox, oy, M - 2, M - 2), P(ox, oy, 2, M - 2)], null, 'rgba(255,200,40,.5)', 2.5);
    x.setLineDash([]);
    // cables snaking across the plaza
    for (let i = 0; i < 9; i++) {
      let p = P(ox, oy, 2 + r() * (M - 4), 2 + r() * (M - 4));
      x.strokeStyle = 'rgba(5,5,10,.8)'; x.lineWidth = 2.2;
      x.beginPath(); x.moveTo(p[0], p[1]);
      for (let k = 0; k < 3; k++) {
        const q = [p[0] + (r() - 0.5) * 260, p[1] + (r() - 0.5) * 130];
        x.quadraticCurveTo(p[0] + (r() - 0.5) * 200, p[1] + (r() - 0.5) * 100, q[0], q[1]); p = q;
      }
      x.stroke(); x.strokeStyle = 'rgba(120,110,170,.18)'; x.lineWidth = 0.6; x.stroke();
    }
    // manholes and drains
    for (let i = 0; i < 14; i++) {
      const onRoad = i < 8;
      let tx, ty;
      if (onRoad) { const along = 3 + r() * (M - 6), across = 0.5 + r(); [tx, ty] = [[along, across], [across, along], [along, M - across], [M - across, along]][i % 4]; }
      else { tx = 3 + r() * (M - 6); ty = 3 + r() * (M - 6); }
      const p = P(ox, oy, tx, ty);
      x.fillStyle = '#07060c'; x.beginPath(); x.ellipse(p[0], p[1], 11, 5.5, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(140,130,190,.35)'; x.lineWidth = 1; x.stroke();
      x.strokeStyle = 'rgba(140,130,190,.18)';
      for (let k = -6; k <= 6; k += 3) { x.beginPath(); x.moveTo(p[0] + k, p[1] - 3); x.lineTo(p[0] + k, p[1] + 3); x.stroke(); }
    }
    // oil stains and cracks
    for (let i = 0; i < 40; i++) {
      const p = P(ox, oy, r() * M, r() * M);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(p[0], p[1], 6 + r() * 14, 3 + r() * 6, 0, 0, Math.PI * 2); x.fill();
    }
    x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      let p = P(ox, oy, r() * M, r() * M);
      x.beginPath(); x.moveTo(p[0], p[1]);
      for (let k = 0; k < 5; k++) { p = [p[0] + (r() - 0.5) * 26, p[1] + (r() - 0.5) * 13]; x.lineTo(p[0], p[1]); }
      x.stroke();
    }
    // wet puddles with neon reflections
    for (let i = 0; i < 46; i++) {
      const p = P(ox, oy, r() * M, r() * M);
      const col = NEON[Math.floor(r() * NEON.length)];
      const rr = 14 + r() * 30;
      x.save(); x.globalAlpha = 0.5;
      x.fillStyle = 'rgba(30,30,60,.6)'; x.beginPath(); x.ellipse(p[0], p[1], rr, rr * 0.45, 0, 0, Math.PI * 2); x.fill();
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.18;
      const g = x.createLinearGradient(p[0], p[1] - rr * 0.4, p[0], p[1] + rr * 0.4);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(p[0] - rr * 0.15, p[1] - rr * 0.4, rr * 0.3, rr * 0.8);
      x.restore();
    }
    // big soft color washes (city light bouncing on wet ground)
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const p = P(ox, oy, r() * M, r() * M);
      const col = NEON[Math.floor(r() * 4)];
      x.globalAlpha = 0.06;
      x.drawImage(Wd.glow(col), p[0] - 160, p[1] - 80, 320, 160);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    // neon border with a soft glow
    x.shadowColor = '#19f0ff'; x.shadowBlur = 16;
    poly(x, [P(ox, oy, 0, 0), P(ox, oy, M, 0), P(ox, oy, M, M), P(ox, oy, 0, M)], null, '#19f0ff', 2);
    x.shadowBlur = 0;
    groundCache = { c, ox, oy, w, h };
    return groundCache;
  };
})();
