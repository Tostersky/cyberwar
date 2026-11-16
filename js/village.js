// Home base scene: render, select, collect, place and move buildings.
(function () {
  const B = G.BUILDINGS;
  const V = G.Village = { cam: new G.Camera(), sel: null, ghost: null, floats: [], t: 0, camInit: false };

  V.enter = function () {
    G.scene = V;
    if (!V.camInit) { V.cam.center(); V.camInit = true; }
    V.sel = null; V.ghost = null; V.editMode = false; V.drag = null;
    G.UI.showVillage();
  };
  V.update = function (dt) {
    V.t += dt; V.lastDt = dt;
    G.World.update(dt, V.t);
    // every 5 s show how much each mine has delivered to storage
    V.flowT = (V.flowT || 0) + dt;
    if (V.flowT >= 5) {
      V.flowT = 0;
      for (const b of G.state.buildings) {
        const d = B[b.type];
        if (!d.prod || b.level <= 0) continue;
        const n = Math.floor(b.flow || 0);
        if (n <= 0) continue;
        b.flow -= n;
        const [wx, wy] = G.tileToWorld(b.x + d.size / 2, b.y + d.size / 2);
        V.floats.push({ wx, wy: wy - Math.min(G.Art.sprite(b.type, b.level).top, 70), text: '+' + n, color: d.prod === 'scrap' ? '#ffb060' : d.prod === 'plasma' ? '#d9a8ff' : '#ffc8a0', life: 1.8, icon: d.prod });
      }
    }
    for (const f of V.floats) { f.life -= dt; f.wy -= 30 * dt; }
    V.floats = V.floats.filter((f) => f.life > 0);
    while (G.events.length) {
      const e = G.events.shift();
      if (e.kind === 'researched') {
        G.Sfx.play('built');
        const lab = G.state.buildings.find((q) => q.type === 'lab');
        if (lab) { const [wx, wy] = G.tileToWorld(lab.x + 1.5, lab.y + 1.5); V.floats.push({ wx, wy: wy - 60, text: G.t('u_' + e.u) + ' ' + G.t('level') + ' ' + e.to + '!', color: '#19f0ff', life: 2.5 }); }
        continue;
      }
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
    const all = G.state.buildings;
    const front = (a, b) => (b.x + b.y + B[b.type].size) - (a.x + a.y + B[a.type].size);
    // 1) the standing body of small objects (firewall pillars, turrets) — they can stick out in front of big buildings
    for (const b of all.filter((q) => B[q.type].size <= 2).sort(front)) {
      const s = B[b.type].size;
      const sp = G.Art.sprite(b.type, Math.max(1, b.level || b.upTo));
      const [cx, cy] = G.tileToWorld(b.x + s / 2, b.y + s / 2);
      const half = s === 1 ? 13 : 24;
      if (wx > cx - half && wx < cx + half && wy > cy - sp.top + 6 && wy < cy + s * G.TH / 4 + 4) return b;
    }
    // 2) the tile you touched belongs to exactly one building
    for (const b of all) {
      const s = B[b.type].size;
      if (tx >= b.x && tx < b.x + s && ty >= b.y && ty < b.y + s) return b;
    }
    // 3) otherwise the tall part of a sprite, front-most first
    const list = all.slice().sort(front);
    for (const b of list) {
      const s = B[b.type].size;
      const sp = G.Art.sprite(b.type, Math.max(1, b.level || b.upTo));
      const [bx, by] = G.tileToWorld(b.x, b.y);
      const half = Math.max(14, s * G.TW / 2 * 0.65);
      const cy = by + s * G.TH / 2;
      if (wx > bx - half && wx < bx + half && wy > cy - sp.top - s * G.TH / 2 && wy < cy + 4) return b;
    }
    return null;
  }

  V.onTap = function (sx, sy) {
    if (V.editMode) return; // in layout mode buildings are dragged, not opened
    if (V.ghost) {
      const [tx, ty] = V.cam.toTile(sx, sy);
      const s = B[V.ghost.type].size;
      V.ghost.x = Math.round(tx - s / 2); V.ghost.y = Math.round(ty - s / 2);
      clampGhost();
      return;
    }
    // tapping a resource bubble only collects (no building panel)
    const bub = hitBubble(sx, sy);
    if (bub) { collectFrom(bub); return; }
    const b = hitBuilding(sx, sy);
    if (!b) { const o = hitObstacle(sx, sy); if (o) { V.selectObs(o); return; } V.select(null); return; }
    V.select(b);
  };
  // obstacles: the tile you touched, or the body of a tall one (synth trees)
  function hitObstacle(sx, sy) {
    const [wx, wy] = V.cam.toWorld(sx, sy);
    const [tx, ty] = G.worldToTile(wx, wy);
    const list = (G.state.obstacles || []).slice().sort((a, b) => (b.x + b.y) - (a.x + a.y));
    for (const o of list) {
      const s = G.OBSTACLES[o.type].size;
      if (tx >= o.x && tx < o.x + s && ty >= o.y && ty < o.y + s) return o;
    }
    for (const o of list) {
      const s = G.OBSTACLES[o.type].size, sp = G.Art.obsSprite(o.type, o.id % 3);
      const [cx, cy] = G.tileToWorld(o.x + s / 2, o.y + s / 2);
      if (Math.abs(wx - cx) < s * 14 && wy < cy + 4 && wy > cy - sp.top) return o;
    }
    return null;
  }
  V.selectObs = function (o) {
    V.sel = null; V.selObs = o;
    if (o) G.UI.showObsSel(o); else G.UI.hideSel();
  };
  V.clearObs = function (o) {
    const r = G.act({ c: 'clearObs', id: o.id });
    if (r.err) { G.UI.toast(G.t(r.err, r.p && r.p.r ? { r: G.t(r.p.r) } : r.p)); return false; }
    const s = G.OBSTACLES[o.type].size, [wx, wy] = G.tileToWorld(o.x + s / 2, o.y + s / 2);
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 60;
      G.World.emit({ k: 'debris', x: wx, y: wy - 8, vx: Math.cos(a) * sp, vy: -40 - Math.random() * 60, g: 220, r: 2 + Math.random() * 2, life: 0.8, max: 0.8, c: '#3a3640', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, floor: wy + 6 });
    }
    G.World.emit({ k: 'smoke', x: wx, y: wy - 6, vx: 0, vy: -14, r: 10, gr: 14, life: 1.6, max: 1.6, c: '60,56,70', a: 0.5 });
    V.floats.push({ wx, wy: wy - 30, text: G.t('cleared'), color: '#39ff88', life: 1.4 });
    G.Sfx.play('build'); V.selObs = null; G.UI.hideSel(); G.UI.refreshHud();
    return true;
  };
  // collector bubbles: visible when enough has piled up; returns the collector under the finger
  V.bubbleAt = function (b) {
    const d = B[b.type];
    // resources flow into storage by themselves; a bubble only appears when storage is full and the mine fills up
    if (!d.prod || b.level <= 0 || b.acc < Math.max(10, d.cap[b.level - 1] * 0.5)) return null;
    const s = d.size, [cx, cy] = G.tileToWorld(b.x + s / 2, b.y + s / 2);
    return [cx, cy - G.Art.sprite(b.type, b.level).top - 6];
  };
  function hitBubble(sx, sy) {
    let best = null, bd = 30;
    for (const b of G.state.buildings) {
      const p = V.bubbleAt(b);
      if (!p) continue;
      const [px, py] = V.cam.toScreen(p[0], p[1]);
      const d = Math.hypot(px - sx, py - sy);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  function collectFrom(b) {
    G.state.flags.collected = true;
    const got = G.collect(b);
    const p = V.bubbleAt(b) || G.tileToWorld(b.x + 1.5, b.y + 1.5);
    const res = B[b.type].prod;
    if (got > 0) V.floats.push({ wx: p[0], wy: p[1], text: '+' + got, color: res === 'scrap' ? '#ff8a1f' : '#e8955a', life: 1.4 });
    else G.UI.toast(G.t('storageFull'));
    G.save();
  }
  V.select = function (b) {
    V.sel = b; V.selObs = null;
    if (b && B[b.type].prod && G.state.flags && !G.state.flags.collected) { G.state.flags.collected = true; G.save(); }
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
      const err = G.moveBuilding(b, g.x, g.y);
      if (err) { G.UI.toast(err); return; }
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

  // ---- layout mode: drag any building straight to a new spot ----
  V.editMode = false;
  V.setEditMode = function (on) {
    V.editMode = !!on; V.drag = null;
    V.select(null); V.ghost = null;
    G.UI.showEditBar(V.editMode);
  };
  function startDrag(sx, sy) {
    const b = hitBuilding(sx, sy);
    if (!b) return false;
    const [tx, ty] = V.cam.toTile(sx, sy);
    V.drag = { b, x: b.x, y: b.y, off: [tx - b.x, ty - b.y] };
    G.Sfx.play('click');
    return true;
  }
  V.dragValid = () => V.drag && G.canPlace(V.drag.b.type, V.drag.x, V.drag.y, V.drag.b.id);

  V.onPointerDown = function (sx, sy) {
    if (V.editMode) return startDrag(sx, sy);
    if (!V.ghost) return false;
    const [tx, ty] = V.cam.toTile(sx, sy);
    const g = V.ghost, s = B[g.type].size;
    if (tx >= g.x - 1 && tx < g.x + s + 1 && ty >= g.y - 1 && ty < g.y + s + 1) { V.dragOff = [tx - g.x, ty - g.y]; return true; }
    return false;
  };
  V.onDragMove = function (sx, sy) {
    if (V.drag) {
      const [tx, ty] = V.cam.toTile(sx, sy), s = B[V.drag.b.type].size;
      V.drag.x = G.clamp(Math.round(tx - V.drag.off[0]), 2, G.MAP - 2 - s);
      V.drag.y = G.clamp(Math.round(ty - V.drag.off[1]), 2, G.MAP - 2 - s);
      return;
    }
    if (!V.ghost) return;
    const [tx, ty] = V.cam.toTile(sx, sy);
    V.ghost.x = Math.round(tx - V.dragOff[0]); V.ghost.y = Math.round(ty - V.dragOff[1]);
    clampGhost();
  };
  V.onPointerUp = function () {
    const d = V.drag;
    if (!d) return;
    V.drag = null;
    if (d.x === d.b.x && d.y === d.b.y) return;
    if (!G.canPlace(d.b.type, d.x, d.y, d.b.id)) { G.Sfx.play('error'); return; } // snaps back
    const err = G.moveBuilding(d.b, d.x, d.y);
    if (err) G.UI.toast(err); else G.Sfx.play('deploy');
  };

  // ---- render ----
  function drawBuilding(ctx, b, t, walls, alpha) {
    const d = B[b.type], s = d.size;
    const [wx, wy] = G.tileToWorld(b.x, b.y);
    const lv = b.level || b.upTo || 1;
    const sp = G.Art.sprite(b.type, lv);
    const constructing = b.level === 0;
    G.Art.drawSprite(ctx, sp, wx, wy, alpha != null ? alpha : (constructing ? 0.35 : 1));
    if (!constructing && alpha == null) G.Art.anim(ctx, b.type, lv, wx, wy, V.t, V.lastDt || 0.016, b.id);
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
    if (V.bubbleAt(b)) {
      const [cx, cy] = G.tileToWorld(b.x + s / 2, b.y + s / 2);
      const by = cy - sp.top - 6 + Math.sin(V.t * 3 + b.id) * 3;
      const col = d.prod === 'scrap' ? '#ff8a1f' : d.prod === 'plasma' ? '#b26bff' : '#e8955a';
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
    const dragId = V.drag && V.drag.b.id;
    const list = G.state.buildings.filter((b) => !(V.ghost && V.ghost.moveId === b.id) && b.id !== dragId);
    if (V.editMode) {
      // building grid so it's easy to line things up
      ctx.save(); ctx.strokeStyle = 'rgba(25,240,255,.12)'; ctx.lineWidth = 1;
      for (let i = 2; i <= G.MAP - 2; i++) {
        let a = G.tileToWorld(i, 2), b = G.tileToWorld(i, G.MAP - 2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        a = G.tileToWorld(2, i); b = G.tileToWorld(G.MAP - 2, i); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.restore();
    }
    list.sort((a, b) => (a.x + a.y + B[a.type].size) - (b.x + b.y + B[b.type].size));
    if (V.sel) {
      const s = B[V.sel.type].size, pulse = 0.5 + Math.sin(V.t * 5) * 0.3;
      ctx.save(); ctx.shadowColor = '#19f0ff'; ctx.shadowBlur = 12; ctx.globalAlpha = pulse + 0.2;
      G.R.diamond(ctx, V.sel.x, V.sel.y, s, 'rgba(25,240,255,.12)', '#19f0ff', 2); ctx.restore();
    }
    if (V.selObs) {
      const s = G.OBSTACLES[V.selObs.type].size, pulse = 0.5 + Math.sin(V.t * 5) * 0.3;
      ctx.save(); ctx.globalAlpha = pulse + 0.2; G.R.diamond(ctx, V.selObs.x, V.selObs.y, s, 'rgba(255,225,77,.12)', '#ffe14d', 2); ctx.restore();
    }
    const obs = (G.state.obstacles || []).map((o) => ({ d: o.x + o.y + G.OBSTACLES[o.type].size, o }));
    const items = list.map((b) => ({ d: b.x + b.y + B[b.type].size, b })).concat(obs, G.World.propItems());
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.b) drawBuilding(ctx, it.b, t, walls);
      else if (it.o) { const [wx, wy] = G.tileToWorld(it.o.x, it.o.y); G.Art.drawSprite(ctx, G.Art.obsSprite(it.o.type, it.o.id % 3), wx, wy); }
      else G.World.drawProp(ctx, it.prop);
    }
    if (V.drag) {
      // the building being dragged, lifted slightly, with a green/red footprint
      const d = V.drag, s = B[d.b.type].size, ok = V.dragValid();
      G.R.diamond(ctx, d.x, d.y, s, ok ? 'rgba(57,255,136,.28)' : 'rgba(255,51,85,.32)', ok ? '#39ff88' : '#ff3355', 2);
      const [wx, wy] = G.tileToWorld(d.x, d.y);
      G.Art.drawSprite(ctx, G.Art.sprite(d.b.type, Math.max(1, d.b.level || d.b.upTo)), wx, wy - 6, 0.85);
    }
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
    G.R.end(ctx, cam, V.lastDt || 0.016);
    for (const f of V.floats) { ctx.globalAlpha = Math.min(1, f.life * 2); G.R.text(ctx, f.text, f.wx, f.wy, f.color, 16); ctx.globalAlpha = 1; }
  };
})();
