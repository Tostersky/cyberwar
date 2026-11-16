// Player state: saving, economy, construction, training.
(function () {
  const KEY = 'cyberwar_save_v1';
  const B = G.BUILDINGS;
  const now = () => Date.now();

  G.newGame = function () {
    const t = now();
    const s = {
      v: 1, name: 'Runner' + Math.floor(1000 + Math.random() * 9000), lang: null,
      res: { scrap: 1000, copper: 1000, chips: 50 }, buildings: [],
      army: { runner: 8, gunner: 0, drone: 0, mech: 0 }, queue: [], qStart: 0,
      trophies: 0, pve: {}, nextId: 1, created: t,
      settings: { sfx: true, music: true }, flags: {}, tut: 0,
    };
    const add = (type, x, y) => s.buildings.push({ id: s.nextId++, type, level: 1, x, y, acc: B[type].prod ? 150 : 0, last: t, busyUntil: 0, busyStart: 0, upTo: 0 });
    add('core', 18, 18); add('scrapyard', 13, 18); add('coppermine', 23, 18); add('factory', 18, 13); add('squadhq', 18, 23);
    add('laser', 14, 14);
    return s;
  };
  G.load = function () {
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) { s.settings = s.settings || { sfx: true, music: true }; s.flags = s.flags || {}; if (s.tut == null) s.tut = 0; return s; } } } catch (_) {}
    return null;
  };
  // quiet = periodic local save only (does not trigger a cloud upload)
  G.save = function (quiet) {
    if (!G.state) return;
    if (quiet !== true) G.state.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(G.state)); } catch (_) {}
    if (G.Net && quiet !== true) G.Net.markDirty();
  };
  G.resetGame = function () {
    const owner = G.state && G.state.owner, name = G.state && G.state.name;
    try { localStorage.removeItem(KEY); } catch (_) {}
    G.state = G.newGame(); G.state.lang = G.lang; G.state.owner = owner; if (name) G.state.name = name;
    G.save();
  };
  // Swap in a whole save (after login) and restart the home scene.
  G.applyState = function (s) {
    s.settings = s.settings || { sfx: true, music: true }; s.flags = s.flags || {}; if (s.tut == null) s.tut = 0;
    G.state = s;
    G.lang = s.lang || G.lang; s.lang = G.lang;
    G.tick(); G.save();
    G.UI.applyLang();
    G.Village.camInit = false; G.Village.enter();
  };

  const S = () => G.state;
  G.coreLevel = () => { const c = S().buildings.find((b) => b.type === 'core'); return c ? Math.max(1, c.level) : 1; };
  G.countType = (type) => S().buildings.filter((b) => b.type === type).length;
  G.maxLevelOf = (type, kind) => S().buildings.filter((b) => b.type === type).reduce((m, b) => Math.max(m, b.level), 0);
  G.limitOf = (type) => G.LIMITS[type][G.coreLevel() - 1];
  G.capOf = function (res) {
    if (res === 'chips') return Infinity;
    let c = 0;
    for (const b of S().buildings) { const d = B[b.type]; if (d.store && b.level > 0) c += d.store[b.level - 1]; }
    return c;
  };
  G.addRes = function (res, n) {
    const r = S().res, cap = G.capOf(res);
    const before = r[res];
    r[res] = Math.max(0, Math.min(cap, r[res] + n));
    if (res === 'chips') r[res] = Math.max(0, before + n);
    return r[res] - before;
  };
  G.buildersBusy = (t) => S().buildings.filter((b) => b.busyUntil > (t || now())).length;

  // production
  G.updateCollector = function (b, t) {
    const d = B[b.type];
    if (!d.prod) return;
    t = t || now();
    if (b.level === 0) { b.last = t; return; }
    const cap = d.cap[b.level - 1];
    b.acc = Math.min(cap, (b.acc || 0) + d.rate[b.level - 1] * (t - b.last) / 3600000);
    b.last = t;
  };
  G.collect = function (b) {
    G.updateCollector(b);
    const d = B[b.type];
    const got = G.addRes(d.prod, Math.floor(b.acc));
    b.acc -= got;
    if (got > 0) { S().flags.collected = true; G.Sfx.play('collect'); }
    return got;
  };

  // per-frame/offline tick: finish constructions and training
  G.tick = function () {
    const t = now(), s = S();
    let changed = false;
    for (const b of s.buildings) {
      if (b.busyUntil && b.busyUntil <= t) {
        G.updateCollector(b, b.busyUntil);
        b.level = b.upTo; b.busyUntil = 0; b.upTo = 0; changed = true;
        G.events.push({ kind: 'built', b });
      }
      G.updateCollector(b, t);
    }
    while (s.queue.length) {
      const dur = G.UNITS[s.queue[0]].time * 1000;
      if (t >= s.qStart + dur) { s.army[s.queue[0]]++; s.queue.shift(); s.qStart += dur; changed = true; }
      else break;
    }
    if (!s.queue.length) s.qStart = 0;
    if (changed) G.save();
  };
  G.events = [];

  G.canPlace = function (type, x, y, ignoreId) {
    const s = B[type].size, M = G.MAP;
    if (x < 2 || y < 2 || x + s > M - 2 || y + s > M - 2) return false;
    for (const b of S().buildings) {
      if (b.id === ignoreId) continue;
      const bs = B[b.type].size;
      if (x < b.x + bs && x + s > b.x && y < b.y + bs && y + s > b.y) return false;
    }
    return true;
  };

  function pay(res, cost) {
    if (S().res[res] < cost) return G.t('notEnough', { r: G.t(res) });
    S().res[res] -= cost;
    return null;
  }

  G.startBuild = function (type, x, y) {
    const d = B[type];
    if (G.countType(type) >= G.limitOf(type)) return G.t('limit');
    if (!G.canPlace(type, x, y)) return G.t('badPlace');
    const dur = d.time[0];
    if (dur > 0 && G.buildersBusy() >= G.BUILDERS) return G.t('noBuilder');
    const err = pay(d.res, d.cost[0]);
    if (err) return err;
    const t = now();
    const b = { id: S().nextId++, type, level: dur > 0 ? 0 : 1, x, y, acc: 0, last: t, busyUntil: dur > 0 ? t + dur * 1000 : 0, busyStart: t, upTo: dur > 0 ? 1 : 0 };
    S().buildings.push(b);
    G.Sfx.play('build');
    G.save();
    return null;
  };

  G.upgradeInfo = function (b) {
    const d = B[b.type], next = b.level + 1;
    if (b.level >= G.MAXLV) return { max: true };
    const needCore = b.type === 'core' ? 0 : next;
    return { next, res: d.res, cost: d.cost[next - 1], time: d.time[next - 1], needCore, blocked: needCore > G.coreLevel() };
  };
  G.startUpgrade = function (b) {
    if (b.busyUntil > now()) return null;
    const u = G.upgradeInfo(b);
    if (u.max) return G.t('maxLevel');
    if (u.blocked) return G.t('needCore', { n: u.needCore });
    if (u.time > 0 && G.buildersBusy() >= G.BUILDERS) return G.t('noBuilder');
    const err = pay(u.res, u.cost);
    if (err) return err;
    G.updateCollector(b);
    const t = now();
    if (u.time > 0) { b.busyUntil = t + u.time * 1000; b.busyStart = t; b.upTo = u.next; }
    else b.level = u.next;
    G.Sfx.play('build');
    G.save();
    return null;
  };
  G.finishCost = (b) => Math.max(1, Math.ceil((b.busyUntil - now()) / 60000));
  G.finishNow = function (b) {
    if (!(b.busyUntil > now())) return null;
    const c = G.finishCost(b);
    if (S().res.chips < c) return G.t('noChips');
    S().res.chips -= c;
    b.busyUntil = now() - 1;
    G.tick();
    return null;
  };

  // army
  G.housing = function () {
    const hq = S().buildings.filter((b) => b.type === 'squadhq' && b.level > 0);
    return hq.reduce((m, b) => m + B.squadhq.housing[b.level - 1], 0);
  };
  G.armySpace = function () { let n = 0; for (const u in S().army) n += S().army[u] * G.UNITS[u].space; return n; };
  G.queueSpace = function () { return S().queue.reduce((m, u) => m + G.UNITS[u].space, 0); };
  G.factoryLevel = () => G.maxLevelOf('factory');
  G.hqLevel = () => G.maxLevelOf('squadhq');
  G.heroUnlocked = (h) => G.hqLevel() >= G.HEROES[h].unlock;
  G.trainUnit = function (u) {
    const d = G.UNITS[u];
    if (G.factoryLevel() < 1) return G.t('needFactory');
    if (G.factoryLevel() < d.unlock) return G.t('factoryAt', { n: d.unlock });
    if (G.armySpace() + G.queueSpace() + d.space > G.housing()) return G.t('squadFull');
    const err = pay('copper', d.cost);
    if (err) return err;
    const s = S();
    if (!s.queue.length) s.qStart = now();
    s.queue.push(u);
    s.flags.trained = true;
    G.Sfx.play('train');
    G.save();
    return null;
  };
  G.cancelTrain = function (i) {
    const s = S();
    const u = s.queue[i];
    if (!u) return;
    G.addRes('copper', G.UNITS[u].cost);
    s.queue.splice(i, 1);
    if (i === 0) s.qStart = s.queue.length ? now() : 0;
    G.save();
  };
})();
