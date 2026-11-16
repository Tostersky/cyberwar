// Game data: buildings, units, heroes, campaign. All numbers are CyberWar's own.
G.TW = 64; G.TH = 32; G.MAP = 40; G.VERSION = '0.9.5';
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
