// Isometric math, camera, touch/mouse input, shared render helpers.
G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.tileToWorld = (tx, ty) => [(tx - ty) * G.TW / 2, (tx + ty) * G.TH / 2];
G.worldToTile = (wx, wy) => { const a = wy / (G.TH / 2), b = wx / (G.TW / 2); return [(a + b) / 2, (a - b) / 2]; };
G.W = 800; G.H = 600; G.dpr = 1;

G.Camera = class {
  constructor() { this.x = 0; this.y = G.MAP * G.TH / 2; this.z = 1; }
  center(tx, ty) {
    const [wx, wy] = G.tileToWorld(tx == null ? G.MAP / 2 : tx, ty == null ? G.MAP / 2 : ty);
    this.x = wx; this.y = wy;
    this.z = G.clamp(Math.min(G.W / 900, G.H / 560) * 1.1, 0.45, 1.25);
  }
  toWorld(sx, sy) { return [(sx - G.W / 2) / this.z + this.x, (sy - G.H / 2) / this.z + this.y]; }
  toScreen(wx, wy) { return [(wx - this.x) * this.z + G.W / 2, (wy - this.y) * this.z + G.H / 2]; }
  toTile(sx, sy) { const w = this.toWorld(sx, sy); return G.worldToTile(w[0], w[1]); }
  pan(dx, dy) { this.x -= dx / this.z; this.y -= dy / this.z; this.clampPos(); }
  zoomAt(f, sx, sy) {
    const a = this.toWorld(sx, sy);
    this.z = G.clamp(this.z * f, 0.35, 2.2);
    const b = this.toWorld(sx, sy);
    this.x += a[0] - b[0]; this.y += a[1] - b[1]; this.clampPos();
  }
  clampPos() {
    const M = G.MAP;
    this.x = G.clamp(this.x, -M * G.TW / 2, M * G.TW / 2);
    this.y = G.clamp(this.y, 0, M * G.TH);
  }
  apply(ctx) {
    const d = G.dpr, z = this.z;
    ctx.setTransform(z * d, 0, 0, z * d, (G.W / 2 - this.x * z) * d, (G.H / 2 - this.y * z) * d);
  }
};

// ---------- Input: tap, pan, pinch-zoom, hold, custom drag ----------
G.Input = (function () {
  const ptrs = new Map();
  let mode = null, downT = 0, downX = 0, downY = 0, pinchD = 1, lastMid = null;
  const I = { holdPos: null };
  I.mode = () => mode;
  const sc = () => G.scene;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) || 1;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  I.init = function (cv) {
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        downT = performance.now(); downX = e.clientX; downY = e.clientY;
        mode = (sc().onPointerDown && sc().onPointerDown(e.clientX, e.clientY)) ? 'custom' : 'pending';
      } else if (ptrs.size === 2) {
        if (mode === 'custom' && sc().onPointerUp) sc().onPointerUp();
        mode = 'pinch';
        const [a, b] = [...ptrs.values()];
        pinchD = dist(a, b); lastMid = mid(a, b);
      }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (mode === 'pending' && Math.hypot(e.clientX - downX, e.clientY - downY) > 9) mode = 'pan';
      if (mode === 'pan') sc().cam.pan(dx, dy);
      else if (mode === 'custom') sc().onDragMove && sc().onDragMove(e.clientX, e.clientY);
      else if (mode === 'hold') I.holdPos = [e.clientX, e.clientY];
      else if (mode === 'pinch' && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const d = dist(a, b), m = mid(a, b);
        sc().cam.zoomAt(d / pinchD, m.x, m.y);
        sc().cam.pan(m.x - lastMid.x, m.y - lastMid.y);
        pinchD = d; lastMid = m;
      }
    });
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (mode === 'pending' && e.type === 'pointerup' && performance.now() - downT < 600) sc().onTap && sc().onTap(e.clientX, e.clientY);
      if (mode === 'custom' && sc().onPointerUp) sc().onPointerUp();
      if (ptrs.size === 0) { mode = null; I.holdPos = null; }
      else if (mode === 'pinch') mode = 'pan';
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); sc().cam.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  };
  I.update = function () {
    if (mode === 'pending' && sc().wantsHold && sc().wantsHold() && performance.now() - downT > 260) {
      mode = 'hold'; I.holdPos = [downX, downY];
    }
  };
  return I;
})();

// ---------- Shared rendering ----------
G.R = {
  begin(ctx, cam) {
    const d = G.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (!G.R.bg || G.R.bgH !== G.H) {
      const g = ctx.createLinearGradient(0, 0, 0, G.H);
      g.addColorStop(0, '#0b0820'); g.addColorStop(0.6, '#140a2a'); g.addColorStop(1, '#1d0a2c');
      G.R.bg = g; G.R.bgH = G.H;
    }
    ctx.fillStyle = G.R.bg; ctx.fillRect(0, 0, G.W, G.H);
    cam.apply(ctx);
    const gr = G.Art.ground();
    ctx.drawImage(gr.c, -gr.ox, -gr.oy, gr.w, gr.h);
  },
  diamond(ctx, x, y, s, fill, stroke, lw) {
    const a = G.tileToWorld(x, y), b = G.tileToWorld(x + s, y), c = G.tileToWorld(x + s, y + s), d = G.tileToWorld(x, y + s);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  },
  bar(ctx, cx, y, w, frac, color) {
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(cx - w / 2 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = color; ctx.fillRect(cx - w / 2, y, w * G.clamp(frac, 0, 1), 4);
  },
  text(ctx, str, x, y, color, size) {
    ctx.font = 'bold ' + (size || 14) + 'px "Segoe UI",system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(str, x, y);
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  },
  // draws a firewall laser fence between two neighbouring pillars
  wallBeams(ctx, x1, y1, x2, y2, level, color) {
    const a = G.tileToWorld(x1 + 0.5, y1 + 0.5), b = G.tileToWorld(x2 + 0.5, y2 + 0.5);
    const n = level >= 4 ? 3 : level >= 2 ? 2 : 1;
    ctx.save();
    ctx.strokeStyle = color || '#ff3355'; ctx.lineWidth = 1.6;
    ctx.shadowColor = color || '#ff3355'; ctx.shadowBlur = 6;
    for (let i = 0; i < n; i++) {
      const h = 5 + i * 5;
      ctx.beginPath(); ctx.moveTo(a[0], a[1] - h); ctx.lineTo(b[0], b[1] - h); ctx.stroke();
    }
    ctx.restore();
  },
};
