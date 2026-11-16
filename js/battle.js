// Battle scene: deploy units, unit AI with A* pathing, defenses, abilities, scoring.
(function () {
  const BD = G.BUILDINGS, M = G.MAP, WALLCOST = 9;
  const Bt = G.Battle = { cam: new G.Camera() };

  Bt.start = function (opts) {
    const b = Bt;
    b.opts = opts; b.t = 0; b.time = G.BATTLE_TIME; b.ended = false; b.endDelay = 0;
    b.bs = opts.base.buildings.map((q, i) => {
      const d = BD[q.type];
      const hp = d.hp[q.level - 1];
      return { i, type: q.type, level: q.level, x: q.x, y: q.y, size: d.size, hp, maxHp: hp, dead: false, wall: !!d.wall,
        trap: !!d.trap, defense: !!d.defense, cd: 0, ang: Math.random() * 6, tu: null, dis: 0, fire: 0, hitT: 0 };
    });
    // traps are invisible, can't be targeted and don't count towards destruction
    b.total = b.bs.filter((q) => !q.wall && !q.trap).length;
    b.destroyed = 0; b.coreDown = false;
    b.grid = new Int16Array(M * M).fill(-1);
    for (const q of b.bs) if (!q.trap) for (let y = q.y; y < q.y + q.size; y++) for (let x = q.x; x < q.x + q.size; x++) b.grid[y * M + x] = q.i;
    b.noDeploy = new Uint8Array(M * M);
    for (const q of b.bs) if (!q.trap) for (let y = q.y - 1; y < q.y + q.size + 1; y++) for (let x = q.x - 1; x < q.x + q.size + 1; x++) {
      if (x >= 0 && y >= 0 && x < M && y < M) b.noDeploy[y * M + x] = 1;
    }
    b.showZone = 2.5;
    b.avail = Object.assign({}, G.state.army); b.used = {};
    b.heroes = {};
    for (const h of G.HERO_ORDER) if (G.heroUnlocked(h)) b.heroes[h] = { state: 'ready', unit: null, abil: 'ready' };
    b.units = []; b.fx = []; b.deployed = 0;
    b.sel = G.UNIT_ORDER.find((u) => b.avail[u] > 0) || Object.keys(b.heroes)[0] || null;
    b.holdAcc = 0;
    b.cam.center(); b.cam.z *= 1.05;
    G.state.flags.battled = true;
    G.Sfx.play('open');
    G.scene = b;
    G.UI.showBattle();
  };

  Bt.hasAnything = function () {
    for (const u in G.state.army) if (G.state.army[u] > 0) return true;
    return G.HERO_ORDER.some((h) => G.heroUnlocked(h));
  };

  // ---------- geometry helpers ----------
  const distRect = (px, py, q) => {
    const dx = Math.max(q.x - px, 0, px - (q.x + q.size)), dy = Math.max(q.y - py, 0, py - (q.y + q.size));
    return Math.hypot(dx, dy);
  };
  const closest = (px, py, q) => [G.clamp(px, q.x + 0.15, q.x + q.size - 0.15), G.clamp(py, q.y + 0.15, q.y + q.size - 0.15)];
  const centerW = (q, lift) => { const p = G.tileToWorld(q.x + q.size / 2, q.y + q.size / 2); return [p[0], p[1] - (lift == null ? q.size * 9 : lift)]; };
  const unitW = (u, lift) => { const p = G.tileToWorld(u.x, u.y); return [p[0], p[1] - (lift == null ? (u.fly ? 18 : 10) : lift)]; };

  // ---------- A* ----------
  function findPath(u, ti) {
    const b = Bt, tq = b.bs[ti];
    const sx = G.clamp(Math.floor(u.x), 0, M - 1), sy = G.clamp(Math.floor(u.y), 0, M - 1);
    const isGoal = (x, y) => x >= tq.x && x < tq.x + tq.size && y >= tq.y && y < tq.y + tq.size;
    const gx = tq.x + tq.size / 2, gy = tq.y + tq.size / 2;
    const N = M * M, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = [];
    const push = (f, n) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const blocked = (x, y) => { const c = b.grid[y * M + x]; return c >= 0 && !isGoal(x, y) && !b.bs[c].wall; };
    const h = (x, y) => Math.hypot(x + 0.5 - gx, y + 0.5 - gy);
    const s0 = sy * M + sx; g[s0] = 0; push(h(sx, sy), s0);
    let found = -1, iter = 0;
    while (heap.length && iter++ < 4000) {
      const [, n] = pop();
      if (closed[n]) continue; closed[n] = 1;
      const x = n % M, y = (n / M) | 0;
      if (isGoal(x, y)) { found = n; break; }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= M || ny >= M) continue;
        if (blocked(nx, ny)) continue;
        if (dx && dy) {
          if (blocked(x + dx, y) || blocked(x, y + dy)) continue;
          const c1 = b.grid[y * M + x + dx], c2 = b.grid[(y + dy) * M + x];
          if ((c1 >= 0 && b.bs[c1].wall) || (c2 >= 0 && b.bs[c2].wall)) continue;
        }
        const ni = ny * M + nx;
        let cost = dx && dy ? 1.414 : 1;
        const c = b.grid[ni];
        if (c >= 0 && b.bs[c].wall) cost += WALLCOST;
        const ng = g[n] + cost;
        if (ng < g[ni]) { g[ni] = ng; came[ni] = n; push(ng + h(nx, ny), ni); }
      }
    }
    if (found < 0) return { path: [], wall: null };
    const path = [];
    for (let n = found; n !== s0 && n >= 0; n = came[n]) path.push(n);
    path.reverse();
    let wall = null;
    const out = [];
    for (const n of path) {
      const c = b.grid[n];
      if (c >= 0 && b.bs[c].wall && !b.bs[c].dead) { wall = c; break; }
      out.push({ x: n % M + 0.5 + u.jx, y: ((n / M) | 0) + 0.5 + u.jy });
    }
    return { path: out, wall };
  }

  function pickTarget(u) {
    const pref = u.def.target === 'defense';
    let best = null, bd = 1e9;
    for (let pass = 0; pass < 2 && best == null; pass++) {
      for (const q of Bt.bs) {
        if (q.dead || q.wall || q.trap) continue;
        if (pass === 0 && pref && !q.defense) continue;
        const d = distRect(u.x, u.y, q);
        if (d < bd) { bd = d; best = q.i; }
      }
      if (!pref) break;
    }
    return best;
  }

  // fire, smoke and flying debris when a building is destroyed
  function explode(q) {
    const c = centerW(q, 10), n = 10 + q.size * 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 70;
      G.World.emit({ k: 'spark', x: c[0], y: c[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 60, g: 140, r: 2 + Math.random() * 2, life: 0.6 + Math.random() * 0.5, max: 1.1, c: Math.random() < 0.5 ? '#ffb040' : '#ff5a2a' });
    }
    for (let i = 0; i < 4 + q.size * 3; i++) {
      const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 60;
      G.World.emit({ k: 'debris', x: c[0], y: c[1] - 6, vx: Math.cos(a) * sp, vy: -50 - Math.random() * 70, g: 220, r: 2 + Math.random() * 3, life: 0.9, max: 0.9, c: '#1e1a28', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, floor: c[1] + 10 + Math.random() * 10 });
    }
    for (let i = 0; i < 3 + q.size * 2; i++) {
      G.World.emit({ k: 'smoke', x: c[0] + (Math.random() - 0.5) * q.size * 20, y: c[1] - Math.random() * 10, vx: (Math.random() - 0.5) * 14, vy: -12 - Math.random() * 12, r: 6 + q.size * 2, gr: 10, life: 2.4, max: 2.4, c: '30,26,36', a: 0.55 });
    }
    Bt.fx.push({ k: 'flash', x: c[0], y: c[1], r: 40 + q.size * 25, life: 0.35, max: 0.35, color: '#ffb050' });
  }

  function damageB(q, dmg) {
    if (q.dead) return;
    q.hp -= dmg; q.hitT = 0.08;
    // floating damage numbers (summed, at most ~3 per second per building)
    q.dmgAcc = (q.dmgAcc || 0) + dmg;
    if (!q.wall && Bt.t - (q.numAt || -1) > 0.33) {
      const c0 = centerW(q, Math.min(G.Art.sprite(q.type, q.level).top, 80) * 0.6);
      Bt.fx.push({ k: 'num', x: c0[0] + (Math.random() - 0.5) * 20, y: c0[1], text: '-' + Math.round(q.dmgAcc), color: '#ffe14d', life: 0.8, max: 0.8 });
      q.numAt = Bt.t; q.dmgAcc = 0;
    }
    if (q.hp <= 0) {
      q.dead = true; q.hp = 0; q.deadAt = Bt.t;
      if (!q.wall) { Bt.shake = Math.max(Bt.shake || 0, q.type === 'core' ? 0.6 : 0.35); explode(q); }
      for (let y = q.y; y < q.y + q.size; y++) for (let x = q.x; x < q.x + q.size; x++) Bt.grid[y * M + x] = -1;
      if (!q.wall) { Bt.destroyed++; if (q.type === 'core') Bt.coreDown = true; }
      const c = centerW(q, 8);
      Bt.fx.push({ k: 'boom', x: c[0], y: c[1], r: q.wall ? 12 : 16 + q.size * 8, life: 0.5, max: 0.5, color: '#ff8a1f' });
      G.Sfx.play(q.wall ? 'small' : 'boom');
      for (const u of Bt.units) if (u.wall === q.i) { u.wall = null; u.path = null; }
    }
  }

  function spawn(type, tx, ty, hero) {
    // laboratory levels make units tougher and stronger
    const base = hero ? G.HEROES[type] : G.UNITS[type];
    const mul = hero ? 1 : G.unitMul(G.state.unitLv && G.state.unitLv[type]);
    const def = Object.assign({}, base, { hp: Math.round(base.hp * mul), dmg: Math.round(base.dmg * mul) });
    const u = { type, hero, def, x: tx, y: ty, hp: def.hp, maxHp: def.hp, cd: 0.2, target: null, wall: null, path: null,
      dead: false, fly: !!def.fly, flip: false, anim: Math.random() * 5, jx: (Math.random() - 0.5) * 0.5, jy: (Math.random() - 0.5) * 0.5, storm: 0, hitT: 0 };
    Bt.units.push(u);
    Bt.deployed++;
    return u;
  }

  Bt.deployAt = function (sx, sy) {
    const b = Bt;
    if (b.ended || !b.sel) return;
    const [tx, ty] = b.cam.toTile(sx, sy);
    const ix = Math.floor(tx), iy = Math.floor(ty);
    if (ix < 0 || iy < 0 || ix >= M || iy >= M || b.noDeploy[iy * M + ix]) {
      b.showZone = 1.5;
      if (!b.zoneToastT || b.t - b.zoneToastT > 1.5) { G.UI.toast(G.t('noDeploy')); b.zoneToastT = b.t; }
      return false;
    }
    if (b.heroes[b.sel]) {
      const h = b.heroes[b.sel];
      if (h.state !== 'ready') return false;
      h.state = 'deployed'; h.unit = spawn(b.sel, tx, ty, true);
      b.sel = G.UNIT_ORDER.find((u) => b.avail[u] > 0) || null;
    } else {
      if (!(b.avail[b.sel] > 0)) return false;
      b.avail[b.sel]--; b.used[b.sel] = (b.used[b.sel] || 0) + 1;
      spawn(b.sel, tx, ty, false);
      if (b.avail[b.sel] <= 0) b.sel = G.UNIT_ORDER.find((u) => b.avail[u] > 0) || Object.keys(b.heroes).find((h) => b.heroes[h].state === 'ready') || null;
    }
    G.Sfx.play('deploy');
    G.UI.battleCards();
    return true;
  };

  Bt.useAbility = function (h) {
    const hs = Bt.heroes[h];
    if (!hs || !hs.unit || hs.unit.dead || hs.abil !== 'ready') return;
    hs.abil = 'used';
    const u = hs.unit, w = unitW(u, 6);
    if (h === 'ronin') {
      u.storm = 3; u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.35);
      G.Sfx.play('storm');
      Bt.fx.push({ k: 'ring', x: w[0], y: w[1], r: 40, life: 0.6, max: 0.6, color: '#ff4d4d' });
    } else if (h === 'nyx') {
      for (const q of Bt.bs) if (q.defense && !q.dead && distRect(u.x, u.y, q) <= 6) q.dis = 6;
      G.Sfx.play('zap');
      Bt.fx.push({ k: 'ring', x: w[0], y: w[1], r: 6 * G.TW * 0.7, life: 0.8, max: 0.8, color: '#19f0ff' });
    }
    G.UI.battleCards();
  };

  Bt.wantsHold = () => !!Bt.sel && !Bt.ended && !Bt.heroes[Bt.sel];
  Bt.onTap = function (sx, sy) { Bt.deployAt(sx, sy); };

  function stepUnit(u, dt) {
    const b = Bt;
    u.anim += dt; if (u.hitT > 0) u.hitT -= dt;
    if (u.atkT > 0) u.atkT -= dt;
    u.moving = false;
    if (u.storm > 0) {
      u.storm -= dt;
      for (const q of b.bs) if (!q.dead && distRect(u.x, u.y, q) <= 1.6) damageB(q, 70 * dt);
    }
    if (u.target == null || b.bs[u.target].dead) {
      u.target = pickTarget(u); u.wall = null; u.path = null;
      if (u.target == null) return;
    }
    const tq = b.bs[u.target];
    if (!u.fly && u.path == null) { const r = findPath(u, u.target); u.path = r.path; u.wall = r.wall; }
    let goal = null;
    if (distRect(u.x, u.y, tq) <= u.def.range) goal = tq;
    else if (u.wall != null && !b.bs[u.wall].dead && distRect(u.x, u.y, b.bs[u.wall]) <= u.def.range) goal = b.bs[u.wall];
    if (goal) {
      const [cx, cy] = closest(u.x, u.y, goal);
      u.flip = (cx - cy) < (u.x - u.y);
      if (u.type === 'drone') {
        const c = centerW(goal, 6);
        b.fx.push({ k: 'boom', x: c[0], y: c[1], r: 30, life: 0.45, max: 0.45, color: '#ff3355' });
        for (const q of b.bs) if (!q.dead && distRect(cx, cy, q) <= u.def.splash) damageB(q, u.def.dmg);
        u.dead = true; u.deadAt = b.t; u.exploded = true; return;
      }
      u.cd -= dt;
      if (u.cd <= 0) {
        u.cd = u.def.interval; u.atkT = 0.25;
        damageB(goal, u.def.dmg);
        const from = unitW(u), to = centerW(goal);
        G.Sfx.play(u.def.range > 1.5 ? 'shot' : 'hit');
        if (u.def.range > 1.5) b.fx.push({ k: 'bolt', x1: from[0] + (u.flip ? -14 : 14), y1: from[1] - 6, x2: to[0], y2: to[1], color: G.Art.UCOL[u.type], life: 0.16, max: 0.16 });
        else { const p = G.tileToWorld(cx, cy); b.fx.push({ k: 'spark', x: p[0], y: p[1] - 10, life: 0.2, max: 0.2, color: G.Art.UCOL[u.type] }); }
      }
      return;
    }
    let tx, ty;
    if (!u.fly && u.path && u.path.length) { tx = u.path[0].x; ty = u.path[0].y; }
    else if (!u.fly && u.wall != null) { [tx, ty] = closest(u.x, u.y, b.bs[u.wall]); }
    else { [tx, ty] = closest(u.x, u.y, tq); }
    const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy), stp = u.def.speed * dt;
    if (Math.abs(dx - dy) > 0.01) u.flip = (dx - dy) < 0;
    u.moving = true;
    if (d <= stp) { u.x = tx; u.y = ty; if (u.path && u.path.length) u.path.shift(); }
    else { u.x += dx / d * stp; u.y += dy / d * stp; }
  }

  function hurtUnit(u, dmg) {
    if (u.dead) return;
    u.hp -= dmg; u.hitT = 0.08;
    if (u.hp <= 0) {
      u.dead = true; u.deadAt = Bt.t;
      G.Sfx.play('small');
      const w = unitW(u);
      Bt.fx.push({ k: 'boom', x: w[0], y: w[1], r: 12, life: 0.35, max: 0.35, color: G.Art.UCOL[u.type] });
    }
  }
  // which units a defense can shoot at
  const canHit = (d, v) => (d.hits === 'air' ? v.fly : d.hits === 'ground' ? !v.fly : true);

  function stepDefense(q, dt) {
    const d = BD[q.type];
    if (q.fire > 0) q.fire -= dt;
    if (q.dis > 0) { q.dis -= dt; return; }
    q.cd -= dt;
    const cx = q.x + q.size / 2, cy = q.y + q.size / 2, minR = d.minRange || 0;
    const inReach = (v) => { const dd = Math.hypot(v.x - cx, v.y - cy); return dd <= d.range && dd >= minR; };
    let u = q.tu;
    if (!u || u.dead || !inReach(u) || !canHit(d, u)) {
      u = null; let bd = 1e9;
      for (const v of Bt.units) {
        if (v.dead || !canHit(d, v) || !inReach(v)) continue;
        const dd = Math.hypot(v.x - cx, v.y - cy); if (dd < bd) { bd = dd; u = v; }
      }
      q.tu = u;
    }
    if (!u) { q.ang += dt * 0.4; return; }
    const tw = unitW(u), cw = G.tileToWorld(cx, cy);
    q.ang = Math.atan2((tw[1] - cw[1] + 20) * 2, tw[0] - cw[0]);
    if (q.cd > 0) return;
    q.cd = d.interval; q.fire = 0.15;
    const dmg = d.dmg[q.level - 1], col = G.Art.TRIM[q.level - 1];
    if (q.type === 'mortar') {
      // lobbed plasma shell: lands where the unit was ~1 s ago, hurts every ground unit around
      const from = centerW(q, G.Art.laserHeight(q.level) + 26);
      const gw = G.tileToWorld(u.x, u.y);
      Bt.fx.push({ k: 'shell', x1: from[0], y1: from[1], x2: gw[0], y2: gw[1], tx: u.x, ty: u.y, dmg, splash: d.splash, color: col, life: 1.1, max: 1.1 });
      G.Sfx.play('deploy');
    } else if (q.type === 'aa') {
      const from = centerW(q, 26);
      hurtUnit(u, dmg);
      Bt.fx.push({ k: 'bolt', x1: from[0], y1: from[1], x2: tw[0], y2: tw[1], color: '#ff3355', life: 0.22, max: 0.22 });
      G.Sfx.play('shot');
    } else {
      hurtUnit(u, dmg);
      G.Sfx.play('laser');
      Bt.fx.push({ k: 'beam', x1: 0, y1: 0, from: q, x2: tw[0], y2: tw[1], color: col, life: 0.12, max: 0.12, w: 2.4 });
    }
  }

  // hidden mines go off when a ground unit comes close
  function stepTraps() {
    for (const q of Bt.bs) {
      if (!q.trap || q.dead) continue;
      const cx = q.x + 0.5, cy = q.y + 0.5, d = BD[q.type];
      if (!Bt.units.some((v) => !v.dead && !v.fly && Math.hypot(v.x - cx, v.y - cy) < 0.9)) continue;
      q.dead = true; q.deadAt = Bt.t;
      for (const v of Bt.units) if (!v.dead && !v.fly && Math.hypot(v.x - cx, v.y - cy) <= d.splash) hurtUnit(v, d.dmg[q.level - 1]);
      const w = G.tileToWorld(cx, cy);
      Bt.fx.push({ k: 'flash', x: w[0], y: w[1] - 4, r: 60, life: 0.45, max: 0.45, color: '#19f0ff' });
      Bt.fx.push({ k: 'ring', x: w[0], y: w[1], r: d.splash * G.TW * 0.8, life: 0.5, max: 0.5, color: '#19f0ff' });
      Bt.shake = Math.max(Bt.shake || 0, 0.25);
      G.Sfx.play('zap');
    }
  }

  Bt.update = function (dt) {
    const b = Bt;
    b.t += dt; b.lastDt = dt;
    G.World.update(dt, b.t);
    if (b.shake > 0) b.shake = Math.max(0, b.shake - dt * 1.6);
    // smouldering ruins
    for (const q of b.bs) if (q.dead && !q.wall && !q.trap && b.t - q.deadAt < 8 && Math.random() < dt * 2.5) {
      const c = centerW(q, 4);
      G.World.emit({ k: 'smoke', x: c[0] + (Math.random() - 0.5) * q.size * 18, y: c[1], vx: 6 + Math.random() * 6, vy: -14 - Math.random() * 8, r: 3 + q.size, gr: 7, life: 2.4, max: 2.4, c: '40,36,48', a: 0.4 });
      if (Math.random() < 0.3) G.World.emit({ k: 'spark', x: c[0] + (Math.random() - 0.5) * q.size * 14, y: c[1], vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 20, g: 0, r: 1.5, life: 0.8, max: 0.8, c: '#ff7a30' });
    }
    if (b.showZone > 0) b.showZone -= dt;
    for (const f of b.fx) {
      f.life -= dt;
      // mortar shell lands: splash damage to ground units
      if (f.k === 'shell' && f.life <= 0 && !f.done) {
        f.done = true;
        for (const v of b.units) if (!v.dead && !v.fly && Math.hypot(v.x - f.tx, v.y - f.ty) <= f.splash) hurtUnit(v, f.dmg);
        b.fx.push({ k: 'flash', x: f.x2, y: f.y2 - 4, r: 50, life: 0.35, max: 0.35, color: f.color });
        G.Sfx.play('small');
      }
    }
    b.fx = b.fx.filter((f) => f.life > 0);
    for (const q of b.bs) if (q.hitT > 0) q.hitT -= dt;
    if (b.ended) return;
    b.time -= dt;
    if (G.Input.mode() === 'hold' && G.Input.holdPos && Bt.wantsHold()) {
      b.holdAcc -= dt;
      if (b.holdAcc <= 0) { b.holdAcc = 0.12; b.deployAt(G.Input.holdPos[0], G.Input.holdPos[1]); }
    } else b.holdAcc = 0;
    const sub = Math.ceil(dt / 0.034), sdt = dt / sub;
    for (let k = 0; k < sub; k++) {
      for (const u of b.units) if (!u.dead) stepUnit(u, sdt);
      for (const q of b.bs) if (q.defense && !q.dead) stepDefense(q, sdt);
      stepTraps();
    }
    const anyAlive = b.units.some((u) => !u.dead);
    const leftToDeploy = G.UNIT_ORDER.some((u) => b.avail[u] > 0) || Object.values(b.heroes).some((h) => h.state === 'ready');
    if (b.destroyed >= b.total || b.time <= 0 || (!anyAlive && !leftToDeploy && b.deployed > 0)) {
      b.endDelay += dt;
      if (b.endDelay > (b.time <= 0 ? 0 : 1.2)) Bt.finish();
    }
  };

  Bt.result = function () {
    const pct = Bt.total ? Bt.destroyed / Bt.total : 0;
    let stars = 0;
    if (pct >= 0.5) stars++;
    if (Bt.coreDown) stars++;
    if (pct >= 1) stars++;
    return { pct, stars };
  };

  Bt.finish = function () {
    const b = Bt;
    if (b.ended) return;
    b.ended = true;
    const { pct, stars } = b.result();
    const s = G.state, o = b.opts;
    // only units that died are lost; survivors (and units never deployed) stay in the army
    const used = {};
    for (const u of b.units) if (!u.hero && u.dead) used[u.type] = (used[u.type] || 0) + 1;
    const real = o.mode === 'pvp' && o.defender;
    let r;
    // loot and chips are decided by the shared economy rules (again on the server)
    if (o.mode === 'pve') r = G.act({ c: 'battle', mode: 'pve', level: o.level, stars, pct, used });
    else if (!real) r = G.act({ c: 'battle', mode: 'bot', loot: o.base.loot, pct, used });
    else {
      // real player: show the loot now; the server credits it from the attack record it creates
      const want = { scrap: Math.floor(o.base.loot.scrap * pct), copper: Math.floor(o.base.loot.copper * pct) };
      r = G.Econ.apply(s, { c: 'battle', mode: 'pvp', loot: want, used }, Date.now());
    }
    const gained = (r && r.gained) || { scrap: 0, copper: 0 }, chips = (r && r.chips) || 0;
    s.flags.battleDone = true;
    G.Sfx.play(stars > 0 ? 'win' : 'lose');
    G.save();
    G.UI.showResult({ stars, pct, gained, trophies: real ? null : 0, chips, mode: o.mode, bot: o.mode === 'pvp' && !real });
    if (real) {
      // the server checks the loot, moves trophies, shields the defender and returns the attack id
      G.Net.submitAttack(o.defender, stars, Math.round(pct * 100), gained.scrap, gained.copper)
        .then((res) => {
          s.trophies = Math.max(0, s.trophies + res.delta); G.save(true); G.UI.setResultTrophies(res.delta);
          G.Net.queue({ c: 'battle', mode: 'pvp', attack: res.id, used, pct });
        })
        .catch(() => { G.UI.setResultTrophies(null); G.Net.queue({ c: 'battle', mode: 'pvp', used, pct }); });
    }
  };

  // Turns an untrusted layout from the server ([type, level, x, y] rows) into a safe base.
  Bt.baseFromLayout = function (layout) {
    const out = [], M = G.MAP, occ = new Uint8Array(M * M);
    if (!Array.isArray(layout)) return out;
    for (const row of layout.slice(0, 400)) {
      if (!Array.isArray(row)) continue;
      const [type, level, x, y] = row, d = BD[type];
      if (!d || !Number.isInteger(level) || !Number.isInteger(x) || !Number.isInteger(y)) continue;
      const lv = Math.max(1, Math.min(G.MAXLV, level)), sz = d.size;
      if (x < 0 || y < 0 || x + sz > M || y + sz > M) continue;
      let free = true;
      for (let j = y; j < y + sz && free; j++) for (let i = x; i < x + sz; i++) if (occ[j * M + i]) { free = false; break; }
      if (!free) continue;
      for (let j = y; j < y + sz; j++) for (let i = x; i < x + sz; i++) occ[j * M + i] = 1;
      out.push({ type, level: lv, x, y });
    }
    return out;
  };

  Bt.render = function (ctx) {
    const b = Bt;
    let shook = null;
    if (b.shake > 0) {
      shook = [b.cam.x, b.cam.y];
      const k = b.shake * 16 / b.cam.z;
      b.cam.x += (Math.random() - 0.5) * k; b.cam.y += (Math.random() - 0.5) * k;
    }
    G.R.begin(ctx, b.cam);
    if (b.showZone > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, b.showZone) * 0.5; ctx.fillStyle = '#ff3355';
      for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) if (b.noDeploy[y * M + x]) {
        const p = G.tileToWorld(x, y);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 32, p[1] + 16); ctx.lineTo(p[0], p[1] + 32); ctx.lineTo(p[0] - 32, p[1] + 16); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    const items = [];
    for (const q of b.bs) items.push({ d: q.x + q.y + q.size, q });
    for (const u of b.units) if (!u.dead || (!u.exploded && b.t - u.deadAt < 0.6)) items.push({ d: u.x + u.y + (u.fly ? 2 : 0), u });
    for (const pi of G.World.propItems()) items.push(pi);
    items.sort((a, c) => a.d - c.d);
    const walls = new Map();
    for (const q of b.bs) if (q.wall && !q.dead) walls.set(q.x * 100 + q.y, q);
    for (const it of items) {
      if (it.prop) { G.World.drawProp(ctx, it.prop); continue; }
      if (it.q) {
        const q = it.q, p = G.tileToWorld(q.x, q.y);
        if (q.trap) continue; // mines stay hidden (their blast is drawn as an effect)
        if (q.dead) { G.Art.drawSprite(ctx, G.Art.sprite('rubble', q.size), p[0], p[1]); continue; }
        G.Art.drawSprite(ctx, G.Art.sprite(q.type, q.level), p[0], p[1]);
        if (!q.wall) G.Art.anim(ctx, q.type, q.level, p[0], p[1], b.t, b.lastDt || 0.016, q.i);
        if (q.hitT > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25; G.Art.drawSprite(ctx, G.Art.sprite(q.type, q.level), p[0], p[1]); ctx.restore(); }
        if (q.type === 'laser') {
          const c = G.tileToWorld(q.x + 1, q.y + 1);
          q.muzzle = G.Art.drawLaserHead(ctx, c[0], c[1], q.level, q.ang, q.fire > 0, q.dis > 0);
          if (q.dis > 0 && Math.random() < 0.3) b.fx.push({ k: 'spark', x: c[0] + (Math.random() - 0.5) * 16, y: c[1] - 26, life: 0.15, max: 0.15, color: '#19f0ff' });
        }
        if (q.wall) {
          const r = walls.get((q.x + 1) * 100 + q.y), dn = walls.get(q.x * 100 + q.y + 1);
          if (r) G.R.wallBeams(ctx, q.x, q.y, q.x + 1, q.y, Math.min(q.level, r.level));
          if (dn) G.R.wallBeams(ctx, q.x, q.y, q.x, q.y + 1, Math.min(q.level, dn.level));
        }
      } else {
        const u = it.u, p = G.tileToWorld(u.x, u.y);
        G.Art.drawUnit(ctx, u.type, p[0], p[1], u.anim, u.flip, u.hitT > 0 && !u.dead,
          { moving: u.moving, atk: Math.max(0, (u.atkT || 0) / 0.25), dead: u.dead ? Math.min(1, (b.t - u.deadAt) / 0.6) : 0 });
        if (u.storm > 0) {
          ctx.save(); ctx.strokeStyle = '#ff4d4d'; ctx.shadowColor = '#ff4d4d'; ctx.shadowBlur = 10; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(p[0], p[1] - 6, 30, 15, 0, u.anim * 12, u.anim * 12 + 4.5); ctx.stroke(); ctx.restore();
        }
      }
    }
    // HP bars
    for (const q of b.bs) if (!q.dead && q.hp < q.maxHp) {
      const c = centerW(q, q.wall ? 26 : Math.min(G.Art.sprite(q.type, q.level).top, 80) + 4);
      G.R.bar(ctx, c[0], c[1], q.wall ? 18 : 34, q.hp / q.maxHp, q.hp / q.maxHp > 0.5 ? '#39ff88' : '#ffe14d');
    }
    for (const u of b.units) if (!u.dead && (u.hp < u.maxHp || u.hero)) {
      const p = unitW(u, (u.fly ? 36 : u.type === 'mech' ? 46 : u.hero ? 40 : 32));
      G.R.bar(ctx, p[0], p[1], u.hero ? 22 : 14, u.hp / u.maxHp, u.hero ? '#ffe14d' : '#ff2bd6');
    }
    // effects (additive 'bloom' instead of costly shadowBlur)
    ctx.save();
    ctx.lineCap = 'round';
    const L = (col, x, y, r, al) => G.World.light(ctx, col, x, y, r, r * 0.7, al);
    for (const f of b.fx) {
      const a = Math.max(0, f.life / f.max);
      ctx.globalCompositeOperation = 'lighter';
      if (f.k === 'beam') {
        let x1 = f.x1, y1 = f.y1;
        if (f.from) { const m = f.from.muzzle || centerW(f.from); x1 = m[0]; y1 = m[1]; }
        const seg = (w, col, al) => { ctx.globalAlpha = al * a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); };
        seg(f.w * 5, f.color, 0.18); seg(f.w * 2.2, f.color, 0.55); seg(f.w * 0.7, '#ffffff', 1);
        L(f.color, f.x2, f.y2, 14, 0.8 * a); L(f.color, x1, y1, 10, 0.7 * a);
      } else if (f.k === 'bolt') {
        const p = 1 - a, hx = f.x1 + (f.x2 - f.x1) * p, hy = f.y1 + (f.y2 - f.y1) * p;
        const tx = f.x1 + (f.x2 - f.x1) * Math.max(0, p - 0.3), ty = f.y1 + (f.y2 - f.y1) * Math.max(0, p - 0.3);
        ctx.globalAlpha = 0.6; ctx.strokeStyle = f.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        L(f.color, hx, hy, 8, 0.9);
        if (a < 0.15) L(f.color, f.x2, f.y2, 14, 0.8);
      } else if (f.k === 'shell') {
        // lobbed plasma ball on a high arc
        const p = 1 - a, hx = f.x1 + (f.x2 - f.x1) * p, hy = f.y1 + (f.y2 - f.y1) * p - Math.sin(Math.PI * p) * 140;
        const p0 = Math.max(0, p - 0.08), tx = f.x1 + (f.x2 - f.x1) * p0, ty = f.y1 + (f.y2 - f.y1) * p0 - Math.sin(Math.PI * p0) * 140;
        ctx.globalAlpha = 0.6; ctx.strokeStyle = f.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.globalAlpha = 1;
        L(f.color, hx, hy, 12, 1); L('#ffffff', hx, hy, 5, 1);
        // landing marker on the ground
        ctx.globalAlpha = 0.25 + p * 0.4; ctx.strokeStyle = f.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(f.x2, f.y2, f.splash * G.TW * 0.7, f.splash * G.TH * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (f.k === 'boom') {
        const r = f.r * (1.25 - a * 0.6);
        L('#ffffff', f.x, f.y, r * 0.5, a);
        L(f.color, f.x, f.y, r, a);
      } else if (f.k === 'flash') {
        L(f.color, f.x, f.y, f.r * (1.3 - a * 0.5), a * 0.9);
        L('#ffffff', f.x, f.y, f.r * 0.35, a);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#ffd080'; ctx.lineWidth = 2;
        const rr = f.r * (1.4 - a);
        ctx.beginPath(); ctx.ellipse(f.x, f.y + 8, rr, rr * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (f.k === 'ring') {
        const r = f.r * (1 - a * 0.8);
        ctx.globalAlpha = a; ctx.strokeStyle = f.color;
        ctx.lineWidth = 8; ctx.globalAlpha = a * 0.25; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r / 2, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2.5; ctx.globalAlpha = a; ctx.stroke();
      } else if (f.k === 'spark') {
        L(f.color, f.x, f.y, 6 * a + 3, 1);
      } else if (f.k === 'num') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.min(1, a * 2);
        G.R.text(ctx, f.text, f.x, f.y - (1 - a) * 22, f.color, 11);
      }
    }
    ctx.restore();
    G.R.end(ctx, b.cam, b.lastDt || 0.016);
    if (shook) { b.cam.x = shook[0]; b.cam.y = shook[1]; }
  };
})();
