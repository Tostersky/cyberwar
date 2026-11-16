// Game data: buildings, units, heroes, campaign. All numbers are CyberWar's own.
G.TW = 64; G.TH = 32; G.MAP = 40; G.VERSION = '0.6.2';
G.BUILDERS = 2;

G.BUILDINGS = {
  core:       { size: 4, res: 'scrap',  cost: [0, 2000, 8000, 25000, 60000], time: [0, 30, 120, 600, 1800],
                hp: [1500, 1900, 2400, 3000, 3800], store: [1500, 3000, 6000, 10000, 15000] },
  scrapyard:  { size: 3, res: 'copper', cost: [150, 300, 700, 1400, 3000], time: [10, 30, 60, 180, 600],
                hp: [400, 450, 500, 550, 600], prod: 'scrap', rate: [300, 500, 800, 1100, 1500], cap: [500, 1000, 2000, 3500, 5000] },
  coppermine: { size: 3, res: 'scrap',  cost: [150, 300, 700, 1400, 3000], time: [10, 30, 60, 180, 600],
                hp: [400, 450, 500, 550, 600], prod: 'copper', rate: [300, 500, 800, 1100, 1500], cap: [500, 1000, 2000, 3500, 5000] },
  vault:      { size: 3, res: 'copper', cost: [300, 800, 2000, 5000, 12000], time: [15, 60, 180, 600, 1200],
                hp: [600, 700, 800, 900, 1000], store: [2000, 5000, 10000, 20000, 40000] },
  factory:    { size: 3, res: 'scrap',  cost: [200, 1000, 2500, 6000, 15000], time: [15, 60, 180, 600, 1200],
                hp: [500, 600, 700, 800, 900] },
  squadhq:    { size: 4, res: 'copper', cost: [250, 2000, 5000, 12000, 25000], time: [15, 90, 300, 900, 1800],
                hp: [500, 600, 700, 800, 900], housing: [20, 30, 40, 55, 70] },
  laser:      { size: 2, res: 'scrap',  cost: [500, 1500, 4000, 9000, 20000], time: [20, 90, 300, 900, 1800],
                hp: [500, 620, 750, 880, 1000], dmg: [12, 16, 21, 27, 34], interval: 0.8, range: 7, defense: true },
  firewall:   { size: 1, res: 'scrap',  cost: [50, 200, 600, 1500, 4000], time: [0, 0, 0, 0, 0],
                hp: [300, 600, 1000, 1600, 2500], wall: true },
};
G.MAXLV = 5;
// How many of each building per Core level (index = core level - 1)
G.LIMITS = {
  core: [1, 1, 1, 1, 1], scrapyard: [2, 3, 4, 5, 6], coppermine: [2, 3, 4, 5, 6], vault: [1, 1, 2, 2, 3],
  factory: [1, 1, 1, 1, 1], squadhq: [1, 1, 1, 1, 1], laser: [1, 2, 3, 4, 5], firewall: [25, 50, 75, 100, 150],
};
G.SHOP = ['laser', 'firewall', 'scrapyard', 'coppermine', 'vault', 'factory', 'squadhq'];

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
  for (const type of rest) {
    const s = G.BUILDINGS[type].size;
    for (let tries = 0; tries < 400; tries++) {
      const spread = 7 + Math.floor(tries / 40);
      const x = Math.floor(20 - s / 2 + (r() * 2 - 1) * spread), y = Math.floor(20 - s / 2 + (r() * 2 - 1) * spread);
      if (free(x, y, s, 1)) { put(type, Math.min(blv, G.MAXLV), x, y); break; }
    }
  }
  return out;
};

G.PVE = [
  { core: 1, lasers: 1, laserLv: 1, rings: 0, wallLv: 1, scrap: 1, copper: 1, vault: 0, loot: { scrap: 500, copper: 500 }, seed: 11 },
  { core: 1, lasers: 1, laserLv: 1, rings: 1, wallLv: 1, scrap: 2, copper: 1, vault: 1, loot: { scrap: 1000, copper: 1000 }, seed: 22 },
  { core: 2, lasers: 2, laserLv: 2, rings: 1, wallLv: 1, scrap: 2, copper: 2, vault: 1, factory: 1, loot: { scrap: 2000, copper: 2000 }, seed: 33 },
  { core: 3, lasers: 3, laserLv: 2, rings: 1, wallLv: 2, scrap: 2, copper: 2, vault: 2, factory: 1, hq: 1, loot: { scrap: 4000, copper: 4000 }, seed: 44 },
  { core: 4, lasers: 4, laserLv: 3, rings: 2, wallLv: 3, wallLv2: 2, scrap: 3, copper: 3, vault: 2, factory: 1, hq: 1, loot: { scrap: 8000, copper: 8000 }, seed: 55 },
  { core: 5, lasers: 5, laserLv: 4, rings: 2, wallLv: 4, wallLv2: 3, scrap: 3, copper: 3, vault: 3, factory: 1, hq: 1, loot: { scrap: 15000, copper: 15000 }, seed: 66 },
];

G.BOT_NAMES = ['Vex_77', 'NeonGhost', 'KiloByte', 'RustQueen', 'Zer0Day', 'GlitchRat', 'ChromeFox', 'NullPtr',
  'VoltaKid', 'SynthWolf', 'Hexa', 'D4rkM4tter', 'PixelMonk', 'IronLotus', 'ByteBandit', 'OverClock'];

G.genBot = function (coreLv, seed) {
  const r = G.rng(seed);
  let c = coreLv + (r() < 0.3 ? 1 : 0) - (r() < 0.3 ? 1 : 0);
  c = Math.max(1, Math.min(5, c));
  const p = {
    core: c, lasers: Math.max(1, G.LIMITS.laser[c - 1] - (r() < 0.5 ? 1 : 0)), laserLv: c,
    rings: c >= 4 ? 2 : (c >= 2 ? 1 : (r() < 0.5 ? 1 : 0)), wallLv: Math.max(1, c - 1), wallLv2: Math.max(1, c - 2),
    scrap: Math.min(6, 1 + c), copper: Math.min(6, 1 + c), vault: G.LIMITS.vault[c - 1], factory: 1, hq: 1, blv: c,
  };
  const loot = { scrap: Math.floor((300 + r() * 500) * c * c), copper: Math.floor((300 + r() * 500) * c * c) };
  const name = G.BOT_NAMES[Math.floor(r() * G.BOT_NAMES.length)];
  return { name, buildings: G.genBase(p, seed), loot, core: c };
};
