import { createClient } from 'npm:@supabase/supabase-js@2';
// deno-lint-ignore-file
// @ts-nocheck
const G: any = {};
// Game data: buildings, units, heroes, campaign. All numbers are CyberWar's own.
G.TW = 64; G.TH = 32; G.MAP = 40; G.VERSION = '0.10.0';
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
  // EMP pylon: every few seconds a shock wave hurts and slows every unit around it (ground and air)
  emp:        { size: 2, res: 'scrap',  cost: [6000, 11000, 18000, 28000, 40000, 56000, 78000, 105000], time: [600, 900, 1800, 3600, 5400, 7200, 9000, 10800],
                hp: [650, 750, 860, 980, 1100, 1240, 1380, 1530], dmg: [14, 18, 23, 29, 36, 44, 53, 63], interval: 5, range: 4.5, slow: 2.5, defense: true, hits: 'both', pulse: true },
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
  aa: [0, 0, 0, 1, 1, 2, 2, 3], emp: [0, 0, 0, 0, 1, 1, 2, 2], mine: [0, 0, 2, 3, 4, 5, 6, 8], firewall: [25, 50, 75, 100, 150, 175, 200, 225],
};
G.SHOP = ['laser', 'mortar', 'aa', 'emp', 'mine', 'firewall', 'scrapyard', 'coppermine', 'vault', 'factory', 'squadhq', 'lab', 'clanhub'];

// laboratory research: unit level 2..5 (cost in copper, time in seconds); each level = +15% hitpoints and damage
G.RESEARCH = { cost: [0, 1500, 5000, 14000, 32000], time: [0, 120, 600, 1800, 3600], maxLv: 5, bonus: 0.15 };
G.unitMul = (lv) => 1 + G.RESEARCH.bonus * ((lv || 1) - 1);

G.UNITS = {
  runner: { cost: 25,  space: 1, hp: 60,  dmg: 10,  interval: 0.8, speed: 2.2, range: 0.6, time: 5,  unlock: 1, target: 'any' },
  gunner: { cost: 50,  space: 1, hp: 32,  dmg: 11,  interval: 1.0, speed: 1.6, range: 3.5, time: 6,  unlock: 2, target: 'any' },
  drone:  { cost: 120, space: 2, hp: 45,  dmg: 160, interval: 0,   speed: 2.8, range: 0.4, time: 10, unlock: 3, target: 'defense', fly: true, splash: 1.3 },
  mech:   { cost: 300, space: 5, hp: 520, dmg: 42,  interval: 1.6, speed: 0.9, range: 0.9, time: 20, unlock: 4, target: 'defense' },
  // field medic: doesn't attack; follows the squad and heals ground units and heroes around it
  medic:  { cost: 150, space: 3, hp: 180, dmg: 0, heal: 18, healR: 2.6, interval: 1.0, speed: 1.5, range: 1.4, time: 15, unlock: 5, target: 'heal' },
};
G.UNIT_ORDER = ['runner', 'gunner', 'drone', 'mech', 'medic'];

G.HEROES = {
  ronin: { hp: 950, dmg: 40, interval: 0.8, speed: 1.6, range: 0.7, unlock: 2, target: 'any' },
  nyx:   { hp: 520, dmg: 30, interval: 0.9, speed: 1.5, range: 4.0, unlock: 4, target: 'any' },
};
G.HERO_ORDER = ['ronin', 'nyx'];

G.BATTLE_TIME = 180;
// creating a clan costs premium chips (500 chips = the 14,99 zł chip pack in the shop)
G.CLAN_PRICE = 500;

// chip packs sold through Google Play (ids = product ids in Play Console; prices shown from Play when available)
G.CHIP_PACKS = [
  { id: 'chips_120', chips: 120, price: '4,99 zł' },
  { id: 'chips_500', chips: 500, price: '14,99 zł', tag: 'clan' },
  { id: 'chips_1200', chips: 1200, price: '29,99 zł' },
  { id: 'chips_2800', chips: 2800, price: '59,99 zł', tag: 'popular' },
  { id: 'chips_7500', chips: 7500, price: '129,99 zł', tag: 'best' },
];
G.packById = (id) => G.CHIP_PACKS.find((p) => p.id === id);
// rewarded ads: off until an ad account (AdSense / H5 Games Ads) is set up — then on:true + client id
// chips come ONLY from purchases and the campaign: an ad gives resources (share of storage), never chips
G.ADS = { on: false, client: '', resPct: 0.1, perDay: 5, cooldown: 90 };
// daily login reward, 7-day streak (share of storage + bonus units). Never chips.
G.DAILY = [
  { pct: 0.05 }, { pct: 0.08 }, { pct: 0.10, units: { runner: 5 } }, { pct: 0.12 },
  { pct: 0.15 }, { pct: 0.18, units: { gunner: 4 } }, { pct: 0.25, units: { mech: 2 } },
];
// daily missions: 3 a day picked from this pool; goal = fixed number or share of storage (cap)
G.MISSIONS = {
  collect_scrap: { cap: 0.3 }, collect_copper: { cap: 0.3 }, win: { goal: 2 }, stars: { goal: 5 },
  build: { goal: 2 }, train: { goal: 15 }, raid: { goal: 1 },
};
G.MISSION_REWARD = 0.12; // share of storage, scrap + copper
// VIP: monthly Google Play subscription — ad rewards without watching ads, no ads, gold badge (no chips!)
G.VIP = { id: 'vip_monthly', price: '47 zł / mies.' };
// chips -> resources exchange (fill 10% / 50% / to the top of storage)
G.resChipCost = (n) => (n > 0 ? Math.ceil(n / 200) + 1 : 0);
// full stars earned for a destruction share 0..1 (every third = one star; 33% counts as 1)
G.starsFor = (pct) => Math.max(0, Math.min(3, Math.floor(pct * 3 + 0.02)));

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
  for (let i = 0; i < (p.emp || 0); i++) rest.push('emp');
  // defenses are placed first so they always fit near the core
  rest.sort((a, b) => (G.BUILDINGS[b].defense ? 1 : 0) - (G.BUILDINGS[a].defense ? 1 : 0));
  for (const type of rest) {
    const s = G.BUILDINGS[type].size, def = G.BUILDINGS[type].defense;
    for (let tries = 0; tries < 900; tries++) {
      // defenses stay close to the core, economy buildings spread out
      const spread = Math.min(17, (def ? 4 : 7) + Math.floor(tries / 40));
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

// campaign 9..20: max-level bases that keep getting tougher (hpMul = building hitpoints); 10, 15, 20 are bosses
for (let n = 9; n <= 20; n++) {
  const k = n - 8, boss = n % 5 === 0;
  G.PVE.push({
    core: 8, blv: 8, lasers: 6, laserLv: Math.min(8, 6 + Math.ceil(k / 3)), rings: 2,
    wallLv: Math.min(8, 6 + Math.floor(k / 4)), wallLv2: Math.min(8, 5 + Math.floor(k / 4)),
    scrap: 5, copper: 5, vault: 4, factory: 1, hq: 1, lab: 1,
    mortar: 3, aa: Math.min(3, 2 + Math.floor(k / 6)), mines: Math.min(8, 6 + Math.floor(k / 3)), emp: k >= 7 ? 2 : k >= 2 ? 1 : 0,
    loot: { scrap: 45000 + k * 12000, copper: 45000 + k * 12000 }, seed: 90 + k * 11,
    hpMul: Math.round((1 + k * 0.06 + (boss ? 0.25 : 0)) * 100) / 100, boss,
  });
}

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
    mortar: G.LIMITS.mortar[c - 1], aa: G.LIMITS.aa[c - 1], emp: G.LIMITS.emp[c - 1], mines: G.LIMITS.mine[c - 1], lab: G.LIMITS.lab[c - 1],
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
    s.daily = s.daily && typeof s.daily.last === 'string' ? { last: s.daily.last, streak: Math.max(1, Math.min(7, s.daily.streak | 0)) } : null;
    if (!(s.mis && typeof s.mis.day === 'string' && Array.isArray(s.mis.list) && s.mis.list.every((m) => m && G.MISSIONS[m.id]))) s.mis = null;
    s.vipUntil = Math.max(0, +s.vipUntil || 0); s.shieldUntil = Math.max(0, +s.shieldUntil || 0); if (typeof s.vipToken !== 'string') delete s.vipToken;
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
      if (moved > 0) { b.flow = (b.flow || 0) + moved; E.progress(s, now, 'collect_' + d.prod, moved); }
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
      if (now >= s.qStart + dur) { s.army[s.queue[0]]++; s.queue.shift(); s.qStart += dur; ev.push({ kind: 'trained' }); E.progress(s, now, 'train', 1); }
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
  E.isVip = (s, now) => s.vipUntil > now;

  // ---------- daily login reward & daily missions (UTC days) ----------
  E.today = (now) => new Date(now).toISOString().slice(0, 10);
  E.dailyState = function (s, now) {
    const today = E.today(now), yest = E.today(now - 86400000), d = s.daily || {};
    if (d.last === today) return { claimable: false, day: d.streak || 1 };
    return { claimable: true, day: d.last === yest ? (d.streak % 7) + 1 : 1 };
  };
  // gives resources (share of storage) and units that fit in the squad
  function grant(s, pct, units) {
    const gained = { scrap: 0, copper: 0 }, got = {};
    for (const r of ['scrap', 'copper']) gained[r] = E.addRes(s, r, Math.floor(E.capOf(s, r) * pct));
    for (const u in units || {}) {
      for (let i = 0; i < units[u]; i++) {
        if (E.armySpace(s) + E.queueSpace(s) + G.UNITS[u].space > E.housing(s)) break;
        s.army[u] = (s.army[u] || 0) + 1; got[u] = (got[u] || 0) + 1;
      }
    }
    return { gained, units: got };
  }
  const hashStr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // today's 3 missions (the same on the phone and the server: seeded by the date and the save)
  E.missions = function (s, now) {
    const day = E.today(now);
    if (s.mis && s.mis.day === day) return s.mis.list;
    const ids = Object.keys(G.MISSIONS), r = G.rng(hashStr(day + ':' + (s.created || 0)));
    const pick = [];
    while (pick.length < 3) { const id = ids[Math.floor(r() * ids.length)]; if (!pick.includes(id)) pick.push(id); }
    const list = pick.map((id) => {
      const m = G.MISSIONS[id], res = id === 'collect_copper' ? 'copper' : 'scrap';
      const goal = m.cap ? Math.max(500, Math.round(E.capOf(s, res) * m.cap / 100) * 100) : m.goal;
      return { id, goal, n: 0, got: false };
    });
    s.mis = { day, list };
    return list;
  };
  E.progress = function (s, now, id, n) {
    if (!(n > 0)) return;
    for (const m of E.missions(s, now)) if (m.id === id && !m.got) m.n = Math.min(m.goal, m.n + n);
  };
  // red dot on the Missions button
  E.questDot = (s, now) => E.dailyState(s, now).claimable || E.missions(s, now).some((m) => m.n >= m.goal && !m.got);
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
      E.progress(s, now, 'build', 1);
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
      E.progress(s, now, 'build', 1);
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
    if (c === 'daily') { // daily login reward
      const st = E.dailyState(s, now);
      if (!st.claimable) return ERR('dailyDone');
      const D = G.DAILY[st.day - 1];
      const g = grant(s, D.pct, D.units);
      s.daily = { last: E.today(now), streak: st.day };
      return { ok: true, day: st.day, gained: g.gained, units: g.units };
    }
    if (c === 'mission') { // claim a finished daily mission
      const m = E.missions(s, now)[cmd.i | 0];
      if (!m || m.got) return ERR('missionDone');
      if (m.n < m.goal) return ERR('missionNotDone');
      m.got = true;
      const g = grant(s, G.MISSION_REWARD);
      return { ok: true, gained: g.gained };
    }
    if (c === 'revenged') { // revenge used for this attack (the server-side check is in revenge_target)
      const e = s.defLog.find((a) => a.aid === cmd.aid); if (e) e.rev = true;
      return { ok: true };
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
    if (c === 'adReward' || c === 'vipReward') { // watched a rewarded ad — or VIP: the same reward without the ad
      const vip = c === 'vipReward';
      if (vip && !E.isVip(s, now)) return ERR('vipOnly');
      if (!vip && !G.ADS.on) return ERR('adsOff');
      const st = E.adState(s, now);
      if (st.left <= 0) return ERR('adLimit');
      if (!vip && st.wait > 0) return ERR('adWait', { n: st.wait });
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
      const keep = { name: s.name, owner: s.owner, trophies: s.trophies, lang: s.lang, settings: s.settings, defLog: s.defLog, vipUntil: s.vipUntil, vipToken: s.vipToken, vipCheck: s.vipCheck, ads: s.ads, daily: s.daily };
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
    // daily missions: victories, stars, raids
    const st = Math.max(0, Math.min(3, cmd.stars | 0, G.starsFor(pct)));
    if (st > 0) E.progress(s, now, 'win', 1);
    E.progress(s, now, 'stars', st);
    if (cmd.mode !== 'pve') E.progress(s, now, 'raid', 1);
    return { ok: true, gained, chips };
  }

  // attacks made on this player while away (records from the server)
  E.applyDefenses = function (s, list) {
    for (const a of list) {
      s.res.scrap = Math.max(0, s.res.scrap - (a.loot_scrap | 0));
      s.res.copper = Math.max(0, s.res.copper - (a.loot_copper | 0));
      s.defLog.unshift({ aid: a.id, name: a.attacker_name, stars: a.stars, pct: a.pct, scrap: a.loot_scrap, copper: a.loot_copper, trophies: a.trophies, at: a.created_at });
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

// ---------- Google Play purchases ----------
// Needs the Supabase function secret PLAY_SERVICE_ACCOUNT = the JSON key of a Google Cloud service account
// that has access to the app in Play Console (Users and permissions -> financial data / manage orders).
const PLAY_PACKAGE = 'io.github.tostersky.cyberwar';
let playTok = null;
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = (s) => b64url(new TextEncoder().encode(s));
async function playAccessToken() {
  if (playTok && playTok.exp > Date.now() + 60000) return playTok.v;
  const raw = Deno.env.get('PLAY_SERVICE_ACCOUNT');
  if (!raw) return null;
  const sa = JSON.parse(raw), iat = Math.floor(Date.now() / 1000);
  const head = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64urlStr(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim));
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + head + '.' + claim + '.' + b64url(sig) });
  const j = await res.json();
  if (!j.access_token) throw new Error('play auth: ' + (j.error_description || j.error || res.status));
  playTok = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return playTok.v;
}
// verify a purchase token with Google, credit the chips once, then consume it so it can be bought again
async function playPurchase(uid, s, cmd) {
  const pack = G.packById(String(cmd.product || '')), token = String(cmd.token || '');
  if (!pack || !token || token.length > 4096) return { err: 'iapBad' };
  const at = await playAccessToken();
  if (!at) return { err: 'iapOff' };
  const base = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' + PLAY_PACKAGE + '/purchases/products/' + pack.id + '/tokens/' + encodeURIComponent(token);
  const r = await fetch(base, { headers: { Authorization: 'Bearer ' + at } });
  if (!r.ok) return { err: 'iapBad' };
  const p = await r.json();
  if (p.purchaseState === 2) return { err: 'iapPending' };
  if (p.purchaseState !== 0) return { err: 'iapBad' };
  // the token is the primary key: a second credit attempt fails here
  const { error } = await admin.from('purchases').insert({ token, user_id: uid, product: pack.id, chips: pack.chips, order_id: p.orderId || null });
  let credited = 0;
  if (!error) { G.Econ.addRes(s, 'chips', pack.chips); credited = pack.chips; }
  else if (!/duplicate|unique/i.test(error.message || '')) return { err: 'server' };
  if (p.consumptionState === 0) await fetch(base + ':consume', { method: 'POST', headers: { Authorization: 'Bearer ' + at } }).catch(() => {});
  return { ok: true, chips: credited, product: pack.id };
}

// VIP subscription: verify with Google, remember the expiry, acknowledge it (Google refunds unacknowledged ones)
const VIP_OK = ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED'];
async function playVip(uid, s, token, now) {
  token = String(token || '');
  if (!token || token.length > 4096) return { err: 'iapBad' };
  const at = await playAccessToken();
  if (!at) return { err: 'iapOff' };
  const api = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' + PLAY_PACKAGE + '/purchases/';
  const r = await fetch(api + 'subscriptionsv2/tokens/' + encodeURIComponent(token), { headers: { Authorization: 'Bearer ' + at } });
  if (!r.ok) return { err: 'iapBad' };
  const p = await r.json();
  const item = (p.lineItems || []).find((li) => li.productId === G.VIP.id);
  if (!item) return { err: 'iapBad' };
  if (p.subscriptionState === 'SUBSCRIPTION_STATE_PENDING') return { err: 'iapPending' };
  // a canceled subscription stays valid until its expiry time
  const expiry = Date.parse(item.expiryTime || '') || 0;
  const active = VIP_OK.includes(p.subscriptionState) && expiry > now;
  // one subscription = one player account
  const { data: row } = await admin.from('subscriptions').select('user_id').eq('token', token).maybeSingle();
  if (row && row.user_id && row.user_id !== uid) return { err: 'iapOwned' };
  await admin.from('subscriptions').upsert({ token, user_id: uid, product: G.VIP.id, expiry: expiry ? new Date(expiry).toISOString() : null, updated_at: new Date(now).toISOString() });
  s.vipToken = token; s.vipCheck = now; s.vipUntil = active ? expiry : 0;
  await admin.from('profiles').update({ vip_until: active ? new Date(expiry).toISOString() : null }).eq('id', uid);
  if (p.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
    await fetch(api + 'subscriptions/' + G.VIP.id + '/tokens/' + encodeURIComponent(token) + ':acknowledge', { method: 'POST', headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
  }
  return active ? { ok: true, vipUntil: expiry } : { err: 'vipExpired' };
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
      if (cmd.c === 'vip') { try { results.push(await playVip(uid, s, cmd.token, now)); } catch (e) { results.push({ err: 'server', message: String(e && e.message || e) }); } continue; }
      if (cmd.c === 'iap') { try { results.push(await playPurchase(uid, s, cmd)); } catch (e) { results.push({ err: 'server', message: String(e && e.message || e) }); } continue; }
      if (cmd.c === 'createClan') {
        // paid: charge the chips only if the clan was really created
        if (s.res.chips < G.CLAN_PRICE) { results.push({ err: 'noChips' }); continue; }
        const { data: cid, error } = await admin.rpc('clan_create_for', { p_user: uid, p_name: String(cmd.name || ''), p_desc: String(cmd.desc || ''), p_emblem: cmd.emblem | 0, p_min: cmd.min | 0 });
        if (error) { results.push({ err: 'clan', message: error.message }); continue; }
        s.res.chips -= G.CLAN_PRICE;
        results.push({ ok: true, clanId: cid });
        continue;
      }
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
    // VIP renews monthly: after the stored expiry ask Google again (at most once an hour)
    if (s.vipToken && !(s.vipUntil > now) && !(now - (s.vipCheck || 0) < 3600000)) {
      try { await playVip(uid, s, s.vipToken, now); } catch (_) { s.vipCheck = now; }
    }

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
      // PvP shield after being attacked (shown on the HUD)
      const { data: bs } = await admin.from('bases').select('shield_until').eq('user_id', uid).maybeSingle();
      s.shieldUntil = bs && bs.shield_until ? Date.parse(bs.shield_until) || 0 : 0;
    }
    return json({ state: s, results, defenses: defs || [], received: (inbox || []).map((r) => ({ unit: r.unit, from: r.from_name })) });
  } catch (e) {
    return json({ error: 'server', message: String(e && e.message || e) }, 500);
  }
});
