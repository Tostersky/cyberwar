// Home base scene: render, select, collect, place and move buildings.
(function () {
  const B = G.BUILDINGS;
  const V = G.Village = { cam: new G.Camera(), sel: null, ghost: null, floats: [], t: 0, camInit: false };

  V.enter = function () {
    G.scene = V;
    if (!V.camInit) { V.cam.center(); V.camInit = true; }
    V.sel = null; V.ghost = null;
    G.UI.showVillage();
  };
  V.update = function (dt) {
    V.t += dt;
    for (const f of V.floats) { f.life -= dt; f.wy -= 30 * dt; }
    V.floats = V.floats.filter((f) => f.life > 0);
    while (G.events.length) {
      const e = G.events.shift();
      if (e.kind === 'built') {
        G.Sfx.play('built');
        const [wx, wy] = G.tileToWorld(e.b.x + B[e.b.type].size / 2, e.b.y + B[e.b.type].size / 2);
        V.floats.push({ wx, wy: wy - 50, text: G.t('b_' + e.b.type) + ' ' + G.t('built'), color: '#39ff88', life: 2 });
        if (V.sel === e.b) G.UI.showSel(e.b);
      }
    }
  };

  function hitBuilding(sx, sy) {
    const [wx, wy] = V.cam.toWorld(sx, sy);
    const [tx, ty] = G.worldToTile(wx, wy);
    const list = G.state.buildings.slice().sort((a, b) => (b.x + b.y + B[b.type].size) - (a.x + a.y + B[a.type].size));
    for (const b of list) {
      const s = B[b.type].size;
      if (tx >= b.x && tx < b.x + s && ty >= b.y && ty < b.y + s) return b;
      const sp = G.Art.sprite(b.type, Math.max(1, b.level || b.upTo));
      const [bx, by] = G.tileToWorld(b.x, b.y);
      const half = s * G.TW / 2 * 0.65;
      if (wx > bx - half && wx < bx + half && wy > by - sp.top && wy < by + s * G.TH / 2) return b;
    }
    return null;
  }

  V.onTap = function (sx, sy) {
    if (V.ghost) {
      const [tx, ty] = V.cam.toTile(sx, sy);
      const s = B[V.ghost.type].size;
      V.ghost.x = Math.round(tx - s / 2); V.ghost.y = Math.round(ty - s / 2);
      clampGhost();
      return;
    }
    const b = hitBuilding(sx, sy);
    if (!b) { V.select(null); return; }
    if (B[b.type].prod && b.level > 0) {
      G.updateCollector(b);
      G.state.flags.collected = true;
      if (b.acc >= 1) {
        const got = G.collect(b);
        const [wx, wy] = G.tileToWorld(b.x + 1.5, b.y + 1.5);
        const res = B[b.type].prod;
        if (got > 0) V.floats.push({ wx, wy: wy - 50, text: '+' + got, color: res === 'scrap' ? '#ff8a1f' : '#e8955a', life: 1.4 });
        else G.UI.toast(G.t('storageFull'));
        G.save();
      }
    }
    V.select(b);
  };
  V.select = function (b) {
    V.sel = b;
    if (b) G.UI.showSel(b); else G.UI.hideSel();
  };

  // ---- ghost (placement / moving) ----
  function clampGhost() {
    const g = V.ghost, s = B[g.type].size;
    g.x = G.clamp(g.x, 2, G.MAP - 2 - s); g.y = G.clamp(g.y, 2, G.MAP - 2 - s);
  }
  function findFree(type, nearX, nearY) {
    const s = B[type].size;
    for (let r = 0; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = Math.round(nearX - s / 2) + dx, y = Math.round(nearY - s / 2) + dy;
      if (G.canPlace(type, x, y)) return [x, y];
    }
    return [Math.round(nearX), Math.round(nearY)];
  }
  V.startPlace = function (type, at) {
    V.select(null);
    let pos = at;
    if (!pos) { const c = V.cam.toTile(G.W / 2, G.H / 2); pos = findFree(type, c[0], c[1]); }
    V.ghost = { type, x: pos[0], y: pos[1], moveId: null };
    clampGhost();
    G.UI.showPlace();
  };
  V.startMove = function (b) {
    V.select(null);
    V.ghost = { type: b.type, x: b.x, y: b.y, moveId: b.id, level: b.level };
    G.UI.showPlace();
  };
  V.ghostValid = () => V.ghost && G.canPlace(V.ghost.type, V.ghost.x, V.ghost.y, V.ghost.moveId);
  V.confirmGhost = function () {
    const g = V.ghost;
    if (!g) return;
    if (!V.ghostValid()) { G.UI.toast(G.t('badPlace')); return; }
    if (g.moveId) {
      const b = G.state.buildings.find((q) => q.id === g.moveId);
      b.x = g.x; b.y = g.y; G.save();
      V.ghost = null; G.UI.hidePlace(); V.select(b);
      return;
    }
    const err = G.startBuild(g.type, g.x, g.y);
    if (err) { G.UI.toast(err); return; }
    const placed = G.state.buildings[G.state.buildings.length - 1];
    V.ghost = null; G.UI.hidePlace();
    if (g.type === 'firewall' && G.countType('firewall') < G.limitOf('firewall') && G.state.res.scrap >= B.firewall.cost[0]) {
      // keep placing firewalls in a row
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      const lx = g.lastDir || [1, 0];
      const order = [lx].concat(dirs.filter((d) => d[0] !== lx[0] || d[1] !== lx[1]));
      for (const d of order) {
        if (G.canPlace('firewall', g.x + d[0], g.y + d[1])) {
          V.startPlace('firewall', [g.x + d[0], g.y + d[1]]); V.ghost.lastDir = d; return;
        }
      }
    }
    V.select(placed);
  };
  V.cancelGhost = function () { V.ghost = null; G.UI.hidePlace(); };

  V.onPointerDown = function (sx, sy) {
    if (!V.ghost) return false;
    const [tx, ty] = V.cam.toTile(sx, sy);
    const g = V.ghost, s = B[g.type].size;
    if (tx >= g.x - 1 && tx < g.x + s + 1 && ty >= g.y - 1 && ty < g.y + s + 1) { V.dragOff = [tx - g.x, ty - g.y]; return true; }
    return false;
  };
  V.onDragMove = function (sx, sy) {
    if (!V.ghost) return;
    const [tx, ty] = V.cam.toTile(sx, sy);
    V.ghost.x = Math.round(tx - V.dragOff[0]); V.ghost.y = Math.round(ty - V.dragOff[1]);
    clampGhost();
  };
  V.onPointerUp = function () {};

  // ---- render ----
  function drawBuilding(ctx, b, t, walls, alpha) {
    const d = B[b.type], s = d.size;
    const [wx, wy] = G.tileToWorld(b.x, b.y);
    const lv = b.level || b.upTo || 1;
    const sp = G.Art.sprite(b.type, lv);
    const constructing = b.level === 0;
    G.Art.drawSprite(ctx, sp, wx, wy, alpha != null ? alpha : (constructing ? 0.35 : 1));
    if (b.type === 'laser' && !constructing) {
      const [cx, cy] = G.tileToWorld(b.x + 1, b.y + 1);
      G.Art.drawLaserHead(ctx, cx, cy, lv, V.t * 0.5 + b.id, false, false);
    }
    if (b.type === 'firewall' && walls) {
      const r = walls.get((b.x + 1) * 100 + b.y), dn = walls.get(b.x * 100 + b.y + 1);
      if (r && r.level > 0 && b.level > 0) G.R.wallBeams(ctx, b.x, b.y, b.x + 1, b.y, Math.min(b.level, r.level));
      if (dn && dn.level > 0 && b.level > 0) G.R.wallBeams(ctx, b.x, b.y, b.x, b.y + 1, Math.min(b.level, dn.level));
    }
    if (b.busyUntil > t) {
      // scaffold + progress
      ctx.save(); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
      G.R.diamond(ctx, b.x + 0.1, b.y + 0.1, s - 0.2, null, '#ffe14d', 1.4);
      ctx.restore();
      const [cx, cy] = G.tileToWorld(b.x + s / 2, b.y + s / 2);
      const frac = (t - b.busyStart) / Math.max(1, b.busyUntil - b.busyStart);
      G.R.bar(ctx, cx, cy - Math.min(sp.top, 90) - 8, 46, frac, '#ffe14d');
      G.R.text(ctx, G.fmtTime((b.busyUntil - t) / 1000), cx, cy - Math.min(sp.top, 90) - 18, '#fff', 11);
    }
    if (d.prod && b.level > 0 && b.acc >= Math.max(10, d.cap[b.level - 1] * 0.08)) {
      const [cx, cy] = G.tileToWorld(b.x + s / 2, b.y + s / 2);
      const by = cy - sp.top - 6 + Math.sin(V.t * 3 + b.id) * 3;
      const col = d.prod === 'scrap' ? '#ff8a1f' : '#e8955a';
      ctx.save(); ctx.fillStyle = 'rgba(10,8,22,.9)'; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(cx, by, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      if (d.prod === 'scrap') { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(cx, by, 4, 0, Math.PI * 2); ctx.stroke();
        for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 5, by + Math.sin(a) * 5); ctx.lineTo(cx + Math.cos(a) * 7.5, by + Math.sin(a) * 7.5); ctx.stroke(); } ctx.restore(); }
      else { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 6, by + 3); ctx.lineTo(cx - 3, by - 3); ctx.lineTo(cx + 3, by - 3); ctx.lineTo(cx + 6, by + 3); ctx.closePath(); ctx.fill(); }
    }
  }
  V.drawBuilding = drawBuilding;

  V.render = function (ctx) {
    const cam = V.cam, t = Date.now();
    G.R.begin(ctx, cam);
    const walls = new Map();
    for (const b of G.state.buildings) if (b.type === 'firewall') walls.set(b.x * 100 + b.y, b);
    if (V.ghost && V.ghost.moveId) walls.delete(G.state.buildings.find((b) => b.id === V.ghost.moveId).x * 100 + G.state.buildings.find((b) => b.id === V.ghost.moveId).y);
    const list = G.state.buildings.filter((b) => !(V.ghost && V.ghost.moveId === b.id));
    list.sort((a, b) => (a.x + a.y + B[a.type].size) - (b.x + b.y + B[b.type].size));
    if (V.sel) {
      const s = B[V.sel.type].size, pulse = 0.5 + Math.sin(V.t * 5) * 0.3;
      ctx.save(); ctx.shadowColor = '#19f0ff'; ctx.shadowBlur = 12; ctx.globalAlpha = pulse + 0.2;
      G.R.diamond(ctx, V.sel.x, V.sel.y, s, 'rgba(25,240,255,.12)', '#19f0ff', 2); ctx.restore();
    }
    for (const b of list) drawBuilding(ctx, b, t, walls);
    if (V.ghost) {
      const g = V.ghost, s = B[g.type].size, ok = V.ghostValid();
      G.R.diamond(ctx, g.x, g.y, s, ok ? 'rgba(57,255,136,.25)' : 'rgba(255,51,85,.3)', ok ? '#39ff88' : '#ff3355', 2);
      const [wx, wy] = G.tileToWorld(g.x, g.y);
      G.Art.drawSprite(ctx, G.Art.sprite(g.type, g.level || 1), wx, wy, 0.75);
      const [cx, cy] = G.tileToWorld(g.x + s / 2, g.y + s / 2);
      ctx.save(); ctx.fillStyle = ok ? '#39ff88' : '#ff3355'; ctx.globalAlpha = 0.85;
      const arrow = (dx, dy) => { const [ax, ay] = G.tileToWorld(g.x + s / 2 + dx * (s / 2 + 0.8), g.y + s / 2 + dy * (s / 2 + 0.8)); ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill(); };
      arrow(1, 0); arrow(-1, 0); arrow(0, 1); arrow(0, -1); ctx.restore();
      void cx; void cy;
    }
    for (const f of V.floats) { ctx.globalAlpha = Math.min(1, f.life * 2); G.R.text(ctx, f.text, f.wx, f.wy, f.color, 16); ctx.globalAlpha = 1; }
  };
})();
