// CyberWar economy rules — pure functions over a save object.
// The SAME file runs in the browser (instant, optimistic) and on the server (authoritative, Supabase Edge Function).
// Nothing here touches the DOM, sound or the clock: callers pass `now` (ms).
(function () {
  const E = G.Econ = {};
  const BD = () => G.BUILDINGS;
  const ERR = (err, p) => ({ err, p });

  E.newGame = function (now, name) {
    const s = {
      v: 1, name: name || 'Runner' + Math.floor(1000 + Math.random() * 9000), lang: null,
      res: { scrap: 1000, copper: 1000, chips: 50 }, buildings: [],
      army: { runner: 8, gunner: 0, drone: 0, mech: 0 }, queue: [], qStart: 0,
      trophies: 0, pve: {}, nextId: 1, created: now, unitLv: { runner: 1, gunner: 1, drone: 1, mech: 1 }, research: null, clanArmy: { runner: 0, gunner: 0, drone: 0, mech: 0 },
      settings: { sfx: true, music: true }, flags: {}, tut: 0, defLog: [],
    };
    const add = (type, x, y) => s.buildings.push({ id: s.nextId++, type, level: 1, x, y, acc: BD()[type].prod ? 150 : 0, last: now, busyUntil: 0, busyStart: 0, upTo: 0 });
    add('core', 18, 18); add('scrapyard', 13, 18); add('coppermine', 23, 18); add('factory', 18, 13); add('squadhq', 18, 23);
    add('laser', 14, 14);
    return s;
  };
  // repair / fill missing fields of an old or untrusted save
  E.norm = function (s, now) {
    s.v = 1;
    s.res = s.res || {}; for (const r of ['scrap', 'copper', 'chips']) s.res[r] = Math.max(0, Math.floor(+s.res[r] || 0));
    s.army = s.army || {}; for (const u of G.UNIT_ORDER) s.army[u] = Math.max(0, Math.floor(+s.army[u] || 0));
    s.queue = Array.isArray(s.queue) ? s.queue.filter((u) => G.UNITS[u]) : [];
    s.buildings = Array.isArray(s.buildings) ? s.buildings.filter((b) => b && BD()[b.type]) : [];
    s.pve = s.pve || {}; s.settings = s.settings || { sfx: true, music: true }; s.flags = s.flags || {};
    if (s.tut == null) s.tut = 0; s.defLog = Array.isArray(s.defLog) ? s.defLog.slice(0, 20) : [];
    s.clanArmy = s.clanArmy || {}; for (const u of G.UNIT_ORDER) s.clanArmy[u] = Math.max(0, Math.floor(+s.clanArmy[u] || 0));
    s.unitLv = s.unitLv || {}; for (const u of G.UNIT_ORDER) s.unitLv[u] = Math.max(1, Math.min(G.RESEARCH.maxLv, s.unitLv[u] | 0 || 1));
    if (s.research && !G.UNITS[s.research.u]) s.research = null;
    s.trophies = Math.max(0, Math.floor(+s.trophies || 0));
    s.ads = s.ads && typeof s.ads.day === 'string' ? { day: s.ads.day, n: Math.max(0, s.ads.n | 0), last: +s.ads.last || 0 } : { day: '', n: 0, last: 0 };
    s.nextId = Math.max(s.nextId || 1, ...s.buildings.map((b) => b.id + 1), 1);
    for (const b of s.buildings) { if (b.last == null) b.last = now; if (b.acc == null) b.acc = 0; }
    return s;
  };

  // ---------- queries ----------
  E.coreLevel = (s) => { const c = s.buildings.find((b) => b.type === 'core'); return c ? Math.max(1, c.level) : 1; };
  E.countType = (s, type) => s.buildings.filter((b) => b.type === type).length;
  E.maxLevelOf = (s, type) => s.buildings.filter((b) => b.type === type).reduce((m, b) => Math.max(m, b.level), 0);
  E.limitOf = (s, type) => G.LIMITS[type][E.coreLevel(s) - 1];
  E.capOf = function (s, res) {
    if (res === 'chips') return Infinity;
    let c = 0;
    for (const b of s.buildings) { const d = BD()[b.type]; if (d.store && b.level > 0) c += d.store[b.level - 1]; }
    return c;
  };
  E.addRes = function (s, res, n) {
    const before = s.res[res];
    if (res === 'chips') s.res[res] = Math.max(0, before + n);
    else s.res[res] = Math.max(0, Math.min(Math.max(E.capOf(s, res), before), before + n));
    return s.res[res] - before;
  };
  E.buildersBusy = (s, now) => s.buildings.filter((b) => b.busyUntil > now).length;
  E.housing = (s) => s.buildings.filter((b) => b.type === 'squadhq' && b.level > 0).reduce((m, b) => m + BD().squadhq.housing[b.level - 1], 0);
  E.armySpace = (s) => G.UNIT_ORDER.reduce((n, u) => n + (s.army[u] || 0) * G.UNITS[u].space, 0);
  E.queueSpace = (s) => s.queue.reduce((m, u) => m + G.UNITS[u].space, 0);
  E.factoryLevel = (s) => E.maxLevelOf(s, 'factory');
  E.hqLevel = (s) => E.maxLevelOf(s, 'squadhq');
  E.heroUnlocked = (s, h) => E.hqLevel(s) >= G.HEROES[h].unlock;
  E.findB = (s, id) => s.buildings.find((b) => b.id === id);
  E.canPlace = function (s, type, x, y, ignoreId) {
    const sz = BD()[type].size, M = G.MAP;
    if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (x < 2 || y < 2 || x + sz > M - 2 || y + sz > M - 2) return false;
    for (const b of s.buildings) {
      if (b.id === ignoreId) continue;
      const bs = BD()[b.type].size;
      if (x < b.x + bs && x + sz > b.x && y < b.y + bs && y + sz > b.y) return false;
    }
    return true;
  };
  E.upgradeInfo = function (s, b) {
    const d = BD()[b.type], next = b.level + 1;
    if (b.level >= G.MAXLV) return { max: true };
    const needCore = b.type === 'core' ? 0 : next;
    return { next, res: d.res, cost: d.cost[next - 1], time: d.time[next - 1], needCore, blocked: needCore > E.coreLevel(s) };
  };
  E.finishCost = (b, now) => Math.max(1, Math.ceil((b.busyUntil - now) / 60000));

  // ---------- time ----------
  // production flows straight into storage; only what doesn't fit waits inside the building (up to its cap)
  E.updateCollector = function (b, now, s) {
    const d = BD()[b.type];
    if (!d.prod) return;
    if (b.level === 0) { b.last = now; return; }
    const dt = Math.max(0, now - (b.last || now));
    b.acc = Math.min(d.cap[b.level - 1], (b.acc || 0) + d.rate[b.level - 1] * dt / 3600000);
    b.last = now;
    if (s) {
      const moved = E.addRes(s, d.prod, Math.floor(b.acc));
      b.acc -= moved;
      if (moved > 0) b.flow = (b.flow || 0) + moved;
    }
  };
  E.ratePer = (b, sec) => (b.level > 0 && BD()[b.type].prod ? BD()[b.type].rate[b.level - 1] * sec / 3600 : 0);
  // finishes constructions and training up to `now`; returns events [{kind:'built', id}]
  E.tick = function (s, now) {
    const ev = [];
    for (const b of s.buildings) {
      if (b.busyUntil && b.busyUntil <= now) {
        E.updateCollector(b, b.busyUntil, s);
        b.level = b.upTo; b.busyUntil = 0; b.upTo = 0;
        ev.push({ kind: 'built', id: b.id });
      }
      E.updateCollector(b, now, s);
    }
    while (s.queue.length) {
      const dur = G.UNITS[s.queue[0]].time * 1000;
      if (now >= s.qStart + dur) { s.army[s.queue[0]]++; s.queue.shift(); s.qStart += dur; ev.push({ kind: 'trained' }); }
      else break;
    }
    if (!s.queue.length) s.qStart = 0;
    if (s.research && s.research.until <= now) {
      s.unitLv[s.research.u] = s.research.to;
      ev.push({ kind: 'researched', u: s.research.u, to: s.research.to });
      s.research = null;
    }
    return ev;
  };
  E.labLevel = (s) => E.maxLevelOf(s, 'lab');
  // clan hub: space for donated units
  E.clanCap = (s) => s.buildings.filter((b) => b.type === 'clanhub' && b.level > 0).reduce((m, b) => m + BD().clanhub.housing[b.level - 1], 0);
  E.clanSpace = (s) => G.UNIT_ORDER.reduce((n, u) => n + ((s.clanArmy && s.clanArmy[u]) || 0) * G.UNITS[u].space, 0);
  // units arriving from clan mates (server side); whatever doesn't fit is lost
  E.receiveClan = function (s, units) {
    for (const u of units) {
      if (!G.UNITS[u]) continue;
      if (E.clanSpace(s) + G.UNITS[u].space <= E.clanCap(s)) s.clanArmy[u] = (s.clanArmy[u] || 0) + 1;
    }
  };
  // what researching unit u next would need
  E.researchInfo = function (s, u) {
    const cur = (s.unitLv && s.unitLv[u]) || 1, next = cur + 1, R = G.RESEARCH;
    if (cur >= R.maxLv) return { max: true, cur };
    return { cur, next, cost: R.cost[next - 1], time: R.time[next - 1], needLab: next - 1, blocked: E.labLevel(s) < next - 1 };
  };

  // how much a chip exchange adds: part 'p10' | 'p50' | 'full'
  E.buyResAmount = function (s, r, part) {
    const cap = E.capOf(s, r), room = Math.max(0, cap - s.res[r]);
    const want = part === 'full' ? room : Math.floor(cap * (part === 'p50' ? 0.5 : 0.1));
    return Math.max(0, Math.min(room, want));
  };
  // rewarded ads today: {left, wait (seconds)}; the counter resets every UTC day
  E.adState = function (s, now) {
    const day = new Date(now).toISOString().slice(0, 10);
    if (!s.ads || s.ads.day !== day) s.ads = { day, n: 0, last: (s.ads && s.ads.last) || 0 };
    return { left: Math.max(0, G.ADS.perDay - s.ads.n), wait: Math.max(0, Math.ceil((s.ads.last + G.ADS.cooldown * 1000 - now) / 1000)) };
  };

  function pay(s, res, cost) {
    if (s.res[res] < cost) return ERR('notEnough', { r: res });
    s.res[res] -= cost;
    return null;
  }
  const FLAG_KEYS = ['collected', 'trained', 'battled', 'battleDone'];

  // ---------- commands: every change to the economy goes through here ----------
  // returns {ok:true, ...} or {err, p}
  E.apply = function (s, cmd, now) {
    E.tick(s, now);
    const c = cmd && cmd.c;
    if (c === 'build') {
      const d = BD()[cmd.type];
      if (!d || cmd.type === 'core') return ERR('badPlace');
      if (E.countType(s, cmd.type) >= E.limitOf(s, cmd.type)) return ERR('limit');
      if (!E.canPlace(s, cmd.type, cmd.x, cmd.y)) return ERR('badPlace');
      const dur = d.time[0];
      if (dur > 0 && E.buildersBusy(s, now) >= G.BUILDERS) return ERR('noBuilder');
      const e = pay(s, d.res, d.cost[0]); if (e) return e;
      const b = { id: s.nextId++, type: cmd.type, level: dur > 0 ? 0 : 1, x: cmd.x, y: cmd.y, acc: 0, last: now, busyUntil: dur > 0 ? now + dur * 1000 : 0, busyStart: now, upTo: dur > 0 ? 1 : 0 };
      s.buildings.push(b);
      return { ok: true, id: b.id };
    }
    if (c === 'upgrade') {
      const b = E.findB(s, cmd.id); if (!b) return ERR('badPlace');
      if (b.busyUntil > now) return ERR('noBuilder');
      const u = E.upgradeInfo(s, b);
      if (u.max) return ERR('maxLevel');
      if (u.blocked) return ERR('needCore', { n: u.needCore });
      if (u.time > 0 && E.buildersBusy(s, now) >= G.BUILDERS) return ERR('noBuilder');
      const e = pay(s, u.res, u.cost); if (e) return e;
      E.updateCollector(b, now, s);
      if (u.time > 0) { b.busyUntil = now + u.time * 1000; b.busyStart = now; b.upTo = u.next; }
      else b.level = u.next;
      return { ok: true };
    }
    if (c === 'finish') {
      const b = E.findB(s, cmd.id); if (!b || !(b.busyUntil > now)) return { ok: true };
      const cost = E.finishCost(b, now);
      if (s.res.chips < cost) return ERR('noChips');
      s.res.chips -= cost;
      b.busyUntil = now;
      E.tick(s, now);
      return { ok: true };
    }
    if (c === 'collect') {
      const b = E.findB(s, cmd.id); if (!b || !BD()[b.type].prod) return { ok: true, got: 0 };
      E.updateCollector(b, now, s);
      const got = E.addRes(s, BD()[b.type].prod, Math.floor(b.acc));
      b.acc -= got;
      return { ok: true, got };
    }
    if (c === 'move') {
      const b = E.findB(s, cmd.id); if (!b) return ERR('badPlace');
      if (!E.canPlace(s, b.type, cmd.x, cmd.y, b.id)) return ERR('badPlace');
      b.x = cmd.x; b.y = cmd.y;
      return { ok: true };
    }
    if (c === 'train') {
      const d = G.UNITS[cmd.u]; if (!d) return ERR('needFactory');
      if (E.factoryLevel(s) < 1) return ERR('needFactory');
      if (E.factoryLevel(s) < d.unlock) return ERR('factoryAt', { n: d.unlock });
      if (E.armySpace(s) + E.queueSpace(s) + d.space > E.housing(s)) return ERR('squadFull');
      const e = pay(s, 'copper', d.cost); if (e) return e;
      if (!s.queue.length) s.qStart = now;
      s.queue.push(cmd.u);
      return { ok: true };
    }
    if (c === 'cancel') {
      const i = cmd.i | 0, u = s.queue[i];
      if (!u) return { ok: true };
      E.addRes(s, 'copper', G.UNITS[u].cost);
      s.queue.splice(i, 1);
      if (i === 0) s.qStart = s.queue.length ? now : 0;
      return { ok: true };
    }
    if (c === 'research') {
      const d = G.UNITS[cmd.u]; if (!d) return ERR('server');
      if (E.labLevel(s) < 1) return ERR('needLab');
      if (s.research) return ERR('labBusy');
      if (E.factoryLevel(s) < d.unlock) return ERR('factoryAt', { n: d.unlock });
      const ri = E.researchInfo(s, cmd.u);
      if (ri.max) return ERR('maxLevel');
      if (ri.blocked) return ERR('labAt', { n: ri.needLab });
      const e = pay(s, 'copper', ri.cost); if (e) return e;
      s.research = { u: cmd.u, to: ri.next, start: now, until: now + ri.time * 1000 };
      return { ok: true };
    }
    if (c === 'finishResearch') {
      if (!s.research || s.research.until <= now) return { ok: true };
      const cost = Math.max(1, Math.ceil((s.research.until - now) / 60000));
      if (s.res.chips < cost) return ERR('noChips');
      s.res.chips -= cost; s.research.until = now;
      E.tick(s, now);
      return { ok: true };
    }
    if (c === 'donate_out') { // giving one unit to a clan mate (the server checks the request first)
      if (!G.UNITS[cmd.u] || !(s.army[cmd.u] > 0)) return ERR('noUnit');
      s.army[cmd.u]--;
      return { ok: true };
    }
    if (c === 'search') { // looking for a PvP opponent costs copper
      const cost = 30 * E.coreLevel(s);
      return pay(s, 'copper', cost) || { ok: true };
    }
    if (c === 'buyRes') { // chips -> scrap/copper: 10%, 50% of storage, or fill it up
      const r = cmd.r;
      if (r !== 'scrap' && r !== 'copper') return ERR('server');
      const n = E.buyResAmount(s, r, cmd.part);
      if (n <= 0) return ERR('storageFull');
      const cost = G.resChipCost(n);
      if (s.res.chips < cost) return ERR('noChips');
      s.res.chips -= cost; E.addRes(s, r, n);
      return { ok: true, n, cost };
    }
    if (c === 'adReward') { // watched a rewarded ad (capped per day, with a cooldown)
      if (!G.ADS.on) return ERR('adsOff');
      const st = E.adState(s, now);
      if (st.left <= 0) return ERR('adLimit');
      if (st.wait > 0) return ERR('adWait', { n: st.wait });
      s.ads.n++; s.ads.last = now;
      const gained = {};
      for (const r of ['scrap', 'copper']) gained[r] = E.addRes(s, r, Math.floor(E.capOf(s, r) * G.ADS.resPct));
      return { ok: true, gained };
    }
    if (c === 'battle') return battle(s, cmd, now);
    if (c === 'meta') { // harmless, non-economic preferences
      if (cmd.settings) s.settings = { sfx: !!cmd.settings.sfx, music: !!cmd.settings.music };
      if (cmd.lang === 'pl' || cmd.lang === 'en') s.lang = cmd.lang;
      if (Number.isInteger(cmd.tut) && cmd.tut >= 0 && cmd.tut <= 50) s.tut = cmd.tut;
      if (cmd.flags) { s.flags = {}; for (const k of FLAG_KEYS) if (cmd.flags[k]) s.flags[k] = true; }
      return { ok: true };
    }
    if (c === 'reset') {
      const keep = { name: s.name, owner: s.owner, trophies: s.trophies, lang: s.lang, settings: s.settings, defLog: s.defLog };
      const n = E.newGame(now, s.name);
      for (const k of Object.keys(s)) delete s[k];
      Object.assign(s, n, keep, { tut: 99 });
      return { ok: true };
    }
    return ERR('server');
  };

  // battle results: loot is decided here, never taken from the client as-is
  function battle(s, cmd, now) {
    const pct = Math.max(0, Math.min(1, +cmd.pct || 0));
    // units sent into battle are gone (heroes are free)
    if (cmd.used) for (const u of G.UNIT_ORDER) s.army[u] = Math.max(0, (s.army[u] || 0) - Math.max(0, cmd.used[u] | 0));
    // donated clan units are used up once deployed
    if (cmd.usedClan) for (const u of G.UNIT_ORDER) s.clanArmy[u] = Math.max(0, (s.clanArmy[u] || 0) - Math.max(0, cmd.usedClan[u] | 0));
    const gained = { scrap: 0, copper: 0 };
    let chips = 0;
    if (cmd.mode === 'pve') {
      const L = G.PVE[(cmd.level | 0) - 1]; if (!L) return ERR('server');
      if (cmd.level > 1 && !(s.pve[cmd.level - 1] && s.pve[cmd.level - 1].stars > 0)) return ERR('beatPrev');
      // stars can't exceed what the destruction allows (+1 for a destroyed core)
      const stars = Math.max(0, Math.min(cmd.stars | 0, G.starsFor(pct)));
      const rec = s.pve[cmd.level] || { stars: 0, taken: { scrap: 0, copper: 0 } };
      for (const r of ['scrap', 'copper']) {
        const want = Math.min(L.loot[r], Math.floor(L.loot[r] * pct)) - rec.taken[r];
        gained[r] = E.addRes(s, r, Math.max(0, want)); rec.taken[r] += gained[r];
      }
      if (stars > rec.stars) { chips = (stars - rec.stars) * 5; E.addRes(s, 'chips', chips); rec.stars = stars; }
      s.pve[cmd.level] = rec;
    } else if (cmd.mode === 'bot') {
      // training fight against a bot: loot is capped by what the strongest possible bot could hold
      const c = Math.min(G.MAXLV, E.coreLevel(s) + 1), max = 800 * c * c;
      for (const r of ['scrap', 'copper']) gained[r] = E.addRes(s, r, Math.floor(Math.min(max, Math.max(0, cmd.loot && cmd.loot[r] | 0)) * pct));
    } else if (cmd.mode === 'pvp') {
      // the server fills cmd.loot from the attack record (submit_attack already capped it)
      if (cmd.loot) for (const r of ['scrap', 'copper']) gained[r] = E.addRes(s, r, Math.max(0, cmd.loot[r] | 0));
    }
    return { ok: true, gained, chips };
  }

  // attacks made on this player while away (records from the server)
  E.applyDefenses = function (s, list) {
    for (const a of list) {
      s.res.scrap = Math.max(0, s.res.scrap - (a.loot_scrap | 0));
      s.res.copper = Math.max(0, s.res.copper - (a.loot_copper | 0));
      s.defLog.unshift({ name: a.attacker_name, stars: a.stars, pct: a.pct, scrap: a.loot_scrap, copper: a.loot_copper, trophies: a.trophies, at: a.created_at });
    }
    s.defLog = s.defLog.slice(0, 20);
  };
  // what other players see and can steal
  E.baseSnapshot = (s) => ({
    layout: s.buildings.filter((b) => b.level > 0).map((b) => [b.type, b.level, b.x, b.y]),
    core: E.coreLevel(s), scrap: Math.floor(s.res.scrap * 0.2), copper: Math.floor(s.res.copper * 0.2),
  });
})();
