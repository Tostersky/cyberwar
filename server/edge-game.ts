// AUTO-GENERATED bundle for the Supabase Edge Function "game" — built from js/data.js + js/econ.js + server/game-handler.js
import { createClient } from 'npm:@supabase/supabase-js@2';
// deno-lint-ignore-file
// @ts-nocheck
const G: any = {};
// Game data: buildings, units, heroes, campaign. All numbers are CyberWar's own.
G.TW = 64; G.TH = 32; G.MAP = 40; G.VERSION = '0.9.0';
G.BUILDERS = 2;

// every array has one value per level (1..8)
G.BUILDINGS = {
  core:       { size: 4, res: 'scrap',  cost: [0, 2000, 8000, 25000, 60000, 120000, 220000, 400000], time: [0, 30, 120, 600, 1800, 3600, 7200, 14400],
                hp: [1500, 1900, 2400, 3000, 3800, 4600, 5500, 6500], store: [1500, 3000, 6000, 10000, 15000, 22000, 30000, 40000] },
  scrapyard:  { size: 3, res: 'copper', cost: [150, 300, 700, 1400, 3000, 6000, 12000, 24000], time: [10, 30, 60, 180, 600, 1200, 2400, 3600],
                hp: [400, 450, 500, 550, 600, 650, 700, 750], prod: 'scrap', rate: [300, 500, 800, 1100, 1500, 1900, 2400, 3000], cap: [500, 1000, 2000, 3500, 5000, 7000, 9500, 12000] },
  coppermine: { size: 3, res: 'scrap',  cost: [150, 300, 700, 1400, 3000, 6000, 12000, 24000], time: [10, 30, 60, 180, 600, 1200, 2400, 3600],
                hp: [400, 450, 500, 550, 600, 650, 700, 750], prod: 'copper', rate: [300, 500, 800, 1100, 1500, 1900, 2400, 3000], cap: [500, 1000, 2000, 3500, 5000, 7000, 9500, 12000] },
  vault:      { size: 3, res: 'copper', cost: [300, 800, 2000, 5000, 12000, 25000, 50000, 90000], time: [15, 60, 180, 600, 1200, 2400, 3600, 7200],
                hp: [600, 700, 800, 900, 1000, 1100, 1200, 1300], store: [2000, 5000, 10000, 20000, 40000, 60000, 90000, 130000] },
  factory:    { size: 3, res: 'scrap',  cost: [200, 1000, 2500, 6000, 15000, 30000, 60000, 100000], time: [15, 60, 180, 600, 1200, 2400, 3600, 7200],
                hp: [500, 600, 700, 800, 900, 1000, 1100, 1200] },
  squadhq:    { size: 4, res: 'copper', cost: [250, 2000, 5000, 12000, 25000, 45000, 80000, 140000], time: [15, 90, 300, 900, 1800, 3600, 5400, 7200],
                hp: [500, 600, 700, 800, 900, 1000, 1100, 1200], housing: [20, 30, 40, 55, 70, 85, 100, 120] },
  // holds units donated by clan mates (housing = how much space they can fill)
  clanhub:    { size: 3, res: 'scrap',  cost: [3000, 8000, 20000, 40000, 70000, 110000, 160000, 220000], time: [120, 600, 1800, 3600, 5400, 7200, 10800, 14400],
                hp: [800, 950, 1100, 1250, 1400, 1550, 1700, 1850], housing: [10, 15, 20, 25, 30, 35, 40, 45], clan: true },
  lab:        { size: 3, res: 'copper', cost: [500, 2500, 6000, 12000, 25000, 45000, 75000, 110000], time: [60, 300, 900, 1800, 3600, 5400, 7200, 10800],
                hp: [500, 600, 700, 800, 900, 1000, 1100, 1200] },
  laser:      { size: 2, res: 'scrap',  cost: [500, 1500, 4000, 9000, 20000, 35000, 60000, 100000], time: [20, 90, 300, 900, 1800, 2400, 3600, 5400],
                hp: [500, 620, 750, 880, 1000, 1150, 1300, 1450], dmg: [12, 16, 21, 27, 34, 42, 51, 61], interval: 0.8, range: 7, defense: true, hits: 'both' },
  // slow plasma shells that hurt everything around the impact; can't hit air or anything too close
  mortar:     { size: 3, res: 'scrap',  cost: [5000, 9000, 15000, 24000, 36000, 52000, 75000, 100000], time: [300, 600, 1200, 1800, 3600, 5400, 7200, 10800],
                hp: [700, 800, 900, 1000, 1150, 1300, 1450, 1600], dmg: [25, 32, 40, 50, 62, 75, 90, 105], interval: 4, range: 9, minRange: 3, splash: 1.5, defense: true, hits: 'ground' },
  // anti-air missiles: big damage, flying targets only
  aa:         { size: 2, res: 'scrap',  cost: [8000, 14000, 22000, 32000, 46000, 64000, 88000, 120000], time: [600, 900, 1800, 3600, 5400, 7200, 9000, 10800],
                hp: [600, 700, 800, 900, 1000, 1100, 1250, 1400], dmg: [80, 100, 125, 150, 180, 210, 245, 280], interval: 1.2, range: 8, defense: true, hits: 'air' },
  // hidden trap: explodes once when a ground unit steps close
  mine:       { size: 1, res: 'scrap',  cost: [500, 800, 1200, 1800, 2600, 3600, 5000, 7000], time: [0, 0, 0, 0, 0, 0, 0, 0],
                hp: [1, 1, 1, 1, 1, 1, 1, 1], dmg: [60, 80, 105, 135, 170, 210, 255, 305], trap: true, splash: 1.5 },
  firewall:   { size: 1, res: 'scrap',  cost: [50, 200, 600, 1500, 4000, 8000, 15000, 25000], time: [0, 0, 0, 0, 0, 0, 0, 0],
                hp: [300, 600, 1000, 1600, 2500, 3500, 4800, 6500], wall: true },
};
G.MAXLV = 8;
// How many of each building per Core level (index = core level - 1)
G.LIMITS = {
  core: [1, 1, 1, 1, 1, 1, 1, 1], scrapyard: [2, 3, 4, 5, 6, 6, 7, 7], coppermine: [2, 3, 4, 5, 6, 6, 7, 7],
  vault: [1, 1, 2, 2, 3, 3, 4, 4], factory: [1, 1, 1, 1, 1, 1, 1, 1], squadhq: [1, 1, 1, 1, 1, 1, 1, 1],
  lab: [0, 1, 1, 1, 1, 1, 1, 1], clanhub: [0, 0, 1, 1, 1, 1, 1, 1], laser: [1, 2, 3, 4, 5, 5, 6, 6], mortar: [0, 0, 1, 1, 2, 2, 3, 3],
  aa: [0, 0, 0, 1, 1, 2, 2, 3], mine: [0, 0, 2, 3, 4, 5, 6, 8], firewall: [25, 50, 75, 100, 150, 175, 200, 225],
};
G.SHOP = ['laser', 'mortar', 'aa', 'mine', 'firewall', 'scrapyard', 'coppermine', 'vault', 'factory', 'squadhq', 'lab', 'clanhub'];

// laboratory research: unit level 2..5 (cost in copper, time in seconds); each level = +15% hitpoints and damage
G.RESEARCH = { cost: [0, 1500, 5000, 14000, 32000], time: [0, 120, 600, 1800, 3600], maxLv: 5, bonus: 0.15 };
G.unitMul = (lv) => 1 + G.RESEARCH.bonus * ((lv || 1) - 1);

G.UNITS = {
  runner: { cost: 25,  space: 1, hp: 60,  dmg: 10,  interval: 0.8, speed: 2.2, range: 0.6, time: 5,  unlock: 1, target: 'any' },
  gunner: { cost: 50,  space: 1, hp: 32,  dmg: 11,  interval: 1.0, speed: 1.6, range: 3.5, time: 6,  unlock: 2, target: 'any' },
  drone:  { cost: 120, space: 2, hp: 45,  dmg: 160, interval: 0,   speed: 2.8, range: 0.4, time: 10, unlock: 3, target: 'defense', fly: true, splash: 1.3 },
  mech:   { cost: 300, space: 5, hp: 520, dmg: 42,  interval: 1.6, speed: 0.9, range: 0.9, time: 20, unlock: 4, target: 'defense' },
};
G.UNIT_ORDER = ['runner', 'gunner', 'drone', 'mech'];

G.HEROES = {
  ronin: { hp: 950, dmg: 40, interval: 0.8, speed: 1.6, range: 0.7, unlock: 2, target: 'any' },
  nyx:   { hp: 520, dmg: 30, interval: 0.9, speed: 1.5, range: 4.0, unlock: 4, target: 'any' },
};
G.HERO_ORDER = ['ronin', 'nyx'];

G.BATTLE_TIME = 180;

// Seeded random (mulberry32)
G.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

// Builds an enemy base layout from parameters.
G.genBase = function (p, seed) {
  const r = G.rng(seed), M = G.MAP, occ = new Uint8Array(M * M), out = [];
  const blv = p.blv || p.core;
  const free = (x, y, s, gap) => {
    for (let j = y - gap; j < y + s + gap; j++) for (let i = x - gap; i < x + s + gap; i++) {
      if (i < 1 || j < 1 || i >= M - 1 || j >= M - 1 || occ[j * M + i]) return false;
    }
    return true;
  };
  const put = (type, level, x, y) => {
    const s = G.BUILDINGS[type].size;
    for (let j = y; j < y + s; j++) for (let i = x; i < x + s; i++) occ[j * M + i] = 1;
    out.push({ type, level, x, y });
  };
  put('core', p.core, 18, 18);
  const spots = [[15, 15], [23, 15], [15, 23], [23, 23], [19, 15], [15, 19], [23, 19], [19, 23]];
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  for (let i = 0; i < Math.min(p.lasers, spots.length); i++) put('laser', p.laserLv, spots[i][0], spots[i][1]);
  const ring = (x0, y0, x1, y1, lv) => {
    const w = (x, y) => { if (!occ[y * M + x]) put('firewall', lv, x, y); };
    for (let x = x0; x <= x1; x++) { w(x, y0); w(x, y1); }
    for (let y = y0 + 1; y < y1; y++) { w(x0, y); w(x1, y); }
  };
  if (p.rings >= 1) ring(14, 14, 25, 25, p.wallLv);
  if (p.rings >= 2) ring(10, 10, 29, 29, p.wallLv2 || p.wallLv);
  const rest = [];
  for (let i = 0; i < (p.scrap || 0); i++) rest.push('scrapyard');
  for (let i = 0; i < (p.copper || 0); i++) rest.push('coppermine');
  for (let i = 0; i < (p.vault || 0); i++) rest.push('vault');
  if (p.factory) rest.push('factory');
  if (p.hq) rest.push('squadhq');
  for (let i = 0; i < (p.mortar || 0); i++) rest.push('mortar');
  for (let i = 0; i < (p.aa || 0); i++) rest.push('aa');
  if (p.lab) rest.push('lab');
  for (const type of rest) {
    const s = G.BUILDINGS[type].size, def = G.BUILDINGS[type].defense;
    for (let tries = 0; tries < 400; tries++) {
      // defenses stay close to the core, economy buildings spread out
      const spread = (def ? 4 : 7) + Math.floor(tries / 40);
      const x = Math.floor(20 - s / 2 + (r() * 2 - 1) * spread), y = Math.floor(20 - s / 2 + (r() * 2 - 1) * spread);
      if (free(x, y, s, 1)) { put(type, Math.min(blv, G.MAXLV), x, y); break; }
    }
  }
  // hidden mines in the gaps around the core
  for (let i = 0; i < (p.mines || 0); i++) {
    for (let tries = 0; tries < 200; tries++) {
      const x = 12 + Math.floor(r() * 16), y = 12 + Math.floor(r() * 16);
      if (free(x, y, 1, 0)) { put('mine', Math.min(blv, G.MAXLV), x, y); break; }
    }
  }
  return out;
};

G.PVE = [
  { core: 1, lasers: 1, laserLv: 1, rings: 0, wallLv: 1, scrap: 1, copper: 1, vault: 0, loot: { scrap: 500, copper: 500 }, seed: 11 },
  { core: 1, lasers: 1, laserLv: 1, rings: 1, wallLv: 1, scrap: 2, copper: 1, vault: 1, loot: { scrap: 1000, copper: 1000 }, seed: 22 },
  { core: 2, lasers: 2, laserLv: 2, rings: 1, wallLv: 1, scrap: 2, copper: 2, vault: 1, factory: 1, loot: { scrap: 2000, copper: 2000 }, seed: 33 },
  { core: 3, lasers: 3, laserLv: 2, rings: 1, wallLv: 2, scrap: 2, copper: 2, vault: 2, factory: 1, hq: 1, loot: { scrap: 4000, copper: 4000 }, seed: 44 },
  { core: 4, lasers: 4, laserLv: 3, rings: 2, wallLv: 3, wallLv2: 2, scrap: 3, copper: 3, vault: 2, factory: 1, hq: 1, mortar: 1, mines: 2, loot: { scrap: 8000, copper: 8000 }, seed: 55 },
  { core: 5, lasers: 5, laserLv: 4, rings: 2, wallLv: 4, wallLv2: 3, scrap: 3, copper: 3, vault: 3, factory: 1, hq: 1, mortar: 2, aa: 1, mines: 3, loot: { scrap: 15000, copper: 15000 }, seed: 66 },
  { core: 6, lasers: 5, laserLv: 5, rings: 2, wallLv: 5, wallLv2: 4, scrap: 4, copper: 4, vault: 3, factory: 1, hq: 1, mortar: 2, aa: 2, mines: 5, lab: 1, loot: { scrap: 26000, copper: 26000 }, seed: 77 },
  { core: 7, lasers: 6, laserLv: 6, rings: 2, wallLv: 6, wallLv2: 5, scrap: 4, copper: 4, vault: 4, factory: 1, hq: 1, mortar: 3, aa: 2, mines: 6, lab: 1, loot: { scrap: 40000, copper: 40000 }, seed: 88 },
];

G.BOT_NAMES = ['Vex_77', 'NeonGhost', 'KiloByte', 'RustQueen', 'Zer0Day', 'GlitchRat', 'ChromeFox', 'NullPtr',
  'VoltaKid', 'SynthWolf', 'Hexa', 'D4rkM4tter', 'PixelMonk', 'IronLotus', 'ByteBandit', 'OverClock'];

G.genBot = function (coreLv, seed) {
  const r = G.rng(seed);
  let c = coreLv + (r() < 0.3 ? 1 : 0) - (r() < 0.3 ? 1 : 0);
  c = Math.max(1, Math.min(G.MAXLV, c));
  const p = {
    core: c, lasers: Math.max(1, G.LIMITS.laser[c - 1] - (r() < 0.5 ? 1 : 0)), laserLv: c,
    rings: c >= 4 ? 2 : (c >= 2 ? 1 : (r() < 0.5 ? 1 : 0)), wallLv: Math.max(1, c - 1), wallLv2: Math.max(1, c - 2),
    scrap: Math.min(6, 1 + c), copper: Math.min(6, 1 + c), vault: G.LIMITS.vault[c - 1], factory: 1, hq: 1, blv: c,
    mortar: G.LIMITS.mortar[c - 1], aa: G.LIMITS.aa[c - 1], mines: G.LIMITS.mine[c - 1], lab: G.LIMITS.lab[c - 1],
  };
  const loot = { scrap: Math.floor((300 + r() * 500) * c * c), copper: Math.floor((300 + r() * 500) * c * c) };
  const name = G.BOT_NAMES[Math.floor(r() * G.BOT_NAMES.length)];
  return { name, buildings: G.genBase(p, seed), loot, core: c };
};

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
      const stars = Math.max(0, Math.min(cmd.stars | 0, (pct >= 0.5 ? 1 : 0) + (pct >= 1 ? 1 : 0) + 1, 3));
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

// ===== Edge Function "game": the authoritative game server =====
// Receives a batch of player commands, replays them with the shared rules (econ.js), saves the result,
// publishes the PvP base snapshot, applies attacks made on the player, and returns the true state.
const SB_URL = Deno.env.get('SUPABASE_URL');
// service key: legacy name, or the new "secret" keys (JSON map or single value)
function serviceKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const many = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (many) { try { const o = JSON.parse(many); const v = o.default || Object.values(o)[0]; if (v) return v; } catch (_) { return many; } }
  return Deno.env.get('SUPABASE_SECRET_KEY');
}
const SB_KEY = serviceKey();
const admin = createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
// one unit from this player to a clan mate's open request
async function donate(uid, prof, s, cmd, now) {
  const u = cmd.u;
  if (!G.UNITS[u] || !(s.army[u] > 0)) return { err: 'noUnit' };
  const [meQ, msgQ] = await Promise.all([
    admin.from('clan_members').select('clan_id').eq('user_id', uid).maybeSingle(),
    admin.from('clan_messages').select('id,clan_id,user_id,kind,data').eq('id', cmd.msg).maybeSingle(),
  ]);
  const me = meQ.data, msg = msgQ.data;
  if (!me || !msg || msg.kind !== 'request' || msg.clan_id !== me.clan_id || msg.user_id === uid || (msg.data && msg.data.closed)) return { err: 'requestClosed' };
  const [rsQ, inQ] = await Promise.all([
    admin.from('saves').select('data').eq('user_id', msg.user_id).maybeSingle(),
    admin.from('clan_inbox').select('unit').eq('user_id', msg.user_id),
  ]);
  if (!rsQ.data || !rsQ.data.data) return { err: 'requestClosed' };
  const rs = G.Econ.norm(rsQ.data.data, now);
  const pending = (inQ.data || []).reduce((n, r) => n + (G.UNITS[r.unit] ? G.UNITS[r.unit].space : 0), 0);
  const cap = G.Econ.clanCap(rs), used = G.Econ.clanSpace(rs) + pending, sp = G.UNITS[u].space;
  const data = Object.assign({ got: 0, donors: {} }, msg.data || {});
  data.cap = cap;
  if (used + sp > cap) { data.closed = true; data.got = used; await admin.from('clan_messages').update({ data }).eq('id', msg.id); return { err: 'requestFull' }; }
  const r = G.Econ.apply(s, { c: 'donate_out', u }, now);
  if (r.err) return r;
  const name = (prof && prof.username) || '?';
  await admin.from('clan_inbox').insert({ user_id: msg.user_id, unit: u, from_name: name });
  data.got = used + sp; data.donors = data.donors || {}; data.donors[name] = (data.donors[name] || 0) + 1;
  if (data.got >= cap) data.closed = true;
  await admin.from('clan_messages').update({ data }).eq('id', msg.id);
  return { ok: true };
}

const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: ud, error: ue } = await admin.auth.getUser(token);
    if (ue || !ud || !ud.user) return json({ error: 'auth', message: 'invalid session' }, 401);
    const uid = ud.user.id;
    const body = await req.json().catch(() => ({}));
    const cmds = Array.isArray(body.cmds) ? body.cmds.slice(0, 200) : [];
    const now = Date.now();

    const [saveQ, profQ] = await Promise.all([
      admin.from('saves').select('data').eq('user_id', uid).maybeSingle(),
      admin.from('profiles').select('username,trophies').eq('id', uid).maybeSingle(),
    ]);
    const prof = profQ.data;
    const s = saveQ.data && saveQ.data.data ? G.Econ.norm(saveQ.data.data, now) : G.Econ.newGame(now, prof && prof.username);

    const results = [];
    for (const cmd of cmds) {
      if (!cmd || typeof cmd !== 'object') { results.push({ err: 'server' }); continue; }
      if (cmd.c === 'donate') { try { results.push(await donate(uid, prof, s, cmd, now)); } catch (e) { results.push({ err: 'server' }); } continue; }
      if (cmd.c === 'donate_out') { results.push({ err: 'server' }); continue; } // only via 'donate'
      if (cmd.c === 'battle' && cmd.mode === 'pvp') {
        // loot from a real player is credited once, from our own attack record
        cmd.loot = null;
        if (cmd.attack) {
          const { data: a } = await admin.from('attacks').select('id,loot_scrap,loot_copper,credited').eq('id', cmd.attack).eq('attacker', uid).maybeSingle();
          if (a && !a.credited) {
            cmd.loot = { scrap: a.loot_scrap, copper: a.loot_copper };
            await admin.from('attacks').update({ credited: true }).eq('id', a.id);
          }
        }
      }
      try { results.push(G.Econ.apply(s, cmd, now)); } catch (e) { results.push({ err: 'server' }); }
    }
    G.Econ.tick(s, now);

    // attacks made on this player since the last visit
    const { data: defs } = await admin.from('attacks')
      .select('id,attacker_name,stars,pct,loot_scrap,loot_copper,trophies,created_at')
      .eq('defender', uid).eq('seen', false).order('created_at');
    if (defs && defs.length) {
      G.Econ.applyDefenses(s, defs);
      await admin.from('attacks').update({ seen: true }).in('id', defs.map((d) => d.id));
    }
    // units donated by clan mates since the last sync
    const { data: inbox } = await admin.from('clan_inbox').select('id,unit,from_name').eq('user_id', uid);
    if (inbox && inbox.length) {
      G.Econ.receiveClan(s, inbox.map((r) => r.unit));
      await admin.from('clan_inbox').delete().in('id', inbox.map((r) => r.id));
    }
    if (prof) { s.name = prof.username; s.trophies = prof.trophies; }
    s.owner = uid; s.savedAt = now;

    const iso = new Date(now).toISOString();
    await admin.from('saves').upsert({ user_id: uid, data: s, updated_at: iso });
    if (prof) {
      const b = G.Econ.baseSnapshot(s);
      await admin.from('bases').upsert({ user_id: uid, username: prof.username, trophies: prof.trophies, core: b.core, layout: b.layout, loot_scrap: b.scrap, loot_copper: b.copper, updated_at: iso });
    }
    return json({ state: s, results, defenses: defs || [], received: (inbox || []).map((r) => ({ unit: r.unit, from: r.from_name })) });
  } catch (e) {
    return json({ error: 'server', message: String(e && e.message || e) }, 500);
  }
});
