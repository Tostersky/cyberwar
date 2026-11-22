// DOM user interface: HUD, panels, shop, army, campaign, battle HUD, results.
(function () {
  const U = G.UI = {};
  const B = G.BUILDINGS;
  const $ = (s, el) => (el || document).querySelector(s);
  const t = (k, p) => G.t(k, p);

  const IC = {
    // glossy "3D" resource icons
    scrap: '<svg viewBox="0 0 24 24"><defs><radialGradient id="gs" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffe0a8"/><stop offset=".45" stop-color="#ff8a1f"/><stop offset="1" stop-color="#7a3200"/></radialGradient></defs><path d="M10.3 1.8h3.4l.6 2.7 2.1.9 2.4-1.5 2.4 2.4-1.5 2.4.9 2.1 2.7.6v3.4l-2.7.6-.9 2.1 1.5 2.4-2.4 2.4-2.4-1.5-2.1.9-.6 2.7h-3.4l-.6-2.7-2.1-.9-2.4 1.5-2.4-2.4 1.5-2.4-.9-2.1-2.7-.6v-3.4l2.7-.6.9-2.1-1.5-2.4 2.4-2.4 2.4 1.5 2.1-.9z" fill="url(#gs)" stroke="#5a2400" stroke-width=".8"/><circle cx="12" cy="12" r="3.6" fill="#2a1200" stroke="#ffb060" stroke-width=".8"/><ellipse cx="9" cy="6.5" rx="3" ry="1.4" fill="#fff" opacity=".45"/></svg>',
    copper: '<svg viewBox="0 0 24 24"><defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0a8"/><stop offset=".5" stop-color="#d9783a"/><stop offset="1" stop-color="#6a2e10"/></linearGradient><linearGradient id="gc2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a3e16"/><stop offset="1" stop-color="#c8662c"/></linearGradient></defs><path d="M3 15.5l4.2-7.8h9.6l4.2 7.8z" fill="url(#gc)" stroke="#5a2a10" stroke-width=".8" stroke-linejoin="round"/><path d="M3 15.5h18l-2.2 3.5H5.2z" fill="url(#gc2)" stroke="#5a2a10" stroke-width=".8" stroke-linejoin="round"/><path d="M8 9.2h6.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".6"/></svg>',
    chips: '<svg viewBox="0 0 24 24"><defs><linearGradient id="gh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8fbff"/><stop offset=".5" stop-color="#19f0ff"/><stop offset="1" stop-color="#05707a"/></linearGradient></defs><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" stroke="#5ff6ff" stroke-width="2" stroke-linecap="round"/><rect x="6" y="6" width="12" height="12" rx="2.2" fill="url(#gh)" stroke="#04545c" stroke-width=".8"/><rect x="9.2" y="9.2" width="5.6" height="5.6" rx=".8" fill="#06222a"/><path d="M10.4 12h3.2M12 10.4v3.2" stroke="#19f0ff" stroke-width=".9"/><path d="M7.2 7.6h6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".55"/></svg>',
    trophy: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5.2-3.5 9.2-8 11-4.5-1.8-8-5.8-8-11V5z" fill="#ffe14d"/><path d="M12 6l1.6 3.4 3.6.4-2.7 2.4.8 3.6L12 14l-3.3 1.8.8-3.6-2.7-2.4 3.6-.4z" fill="#7a5a00"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#e9e6ff" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></g></svg>',
    sword: '<svg viewBox="0 0 24 24"><g stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M4 20L16 8M14 4h6v6M6 14l4 4M3 21l2-2"/><path d="M20 20L8 8M4 4v6h0M18 14l-4 4M21 21l-2-2" stroke="#ffd0f5"/></g></svg>',
    army: '<svg viewBox="0 0 24 24"><g fill="#19f0ff"><circle cx="12" cy="7" r="3.2"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5z"/></g><circle cx="5" cy="9" r="2.2" fill="#7f6bff"/><circle cx="19" cy="9" r="2.2" fill="#7f6bff"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#ffe14d" stroke-width="2" stroke-linejoin="round"><path d="M3 5h3l2.2 10h10l2-7H7"/><circle cx="9.5" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></g></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#19f0ff" stroke-width="2"/><path d="M12 10.5v6M12 7.2v.1" stroke="#19f0ff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 4l7 8h-4.5v8h-5v-8H5z" fill="#39ff88"/></svg>',
    move: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#e9e6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></g></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#19f0ff"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#07060f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    clan: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="none" stroke="#ff2bd6" stroke-width="2" stroke-linejoin="round"/><path d="M8 13l2.5-5 1.5 3 1.5-3L16 13" fill="none" stroke="#ff2bd6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    drone: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#ffe14d" stroke-width="1.8"><rect x="8" y="9" width="8" height="6" rx="2"/><path d="M8 10L4 7M16 10l4-3M8 14l-4 3M16 14l4 3"/></g><circle cx="12" cy="12" r="1.3" fill="#ff3355"/></svg>',
    plasma: '<svg viewBox="0 0 24 24"><defs><radialGradient id="gp" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f3d6ff"/><stop offset=".45" stop-color="#b26bff"/><stop offset="1" stop-color="#3d0f7a"/></radialGradient></defs><path d="M12 2.5c3.6 4.6 6.5 8.2 6.5 11.7a6.5 6.5 0 0 1-13 0C5.5 10.7 8.4 7.1 12 2.5z" fill="url(#gp)" stroke="#2a0a55" stroke-width=".8"/><path d="M9 13.5c0 2 1.2 3.4 3 3.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6"/><circle cx="12" cy="14" r="1.6" fill="#ff7af0"/></svg>',
    bo_prod: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="3" fill="rgba(255,138,31,.2)" stroke="#ff8a1f" stroke-width="1.6"/><path d="M8 4V2.5h8V4" stroke="#ff8a1f" stroke-width="1.6" fill="none"/><path d="M9 15l3-6 3 6M10 13h4" stroke="#ffe14d" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    bo_train: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="3" fill="rgba(25,240,255,.2)" stroke="#19f0ff" stroke-width="1.6"/><path d="M8 4V2.5h8V4" stroke="#19f0ff" stroke-width="1.6" fill="none"/><circle cx="12" cy="10.5" r="2.4" fill="#19f0ff"/><path d="M8 18c0-2.6 1.8-4 4-4s4 1.4 4 4" fill="#19f0ff"/></svg>',
    bo_build: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="3" fill="rgba(57,255,136,.2)" stroke="#39ff88" stroke-width="1.6"/><path d="M8 4V2.5h8V4" stroke="#39ff88" stroke-width="1.6" fill="none"/><path d="M13 8l-4 6h3l-1 4 4-6h-3z" fill="#39ff88"/></svg>',
    pass: '<svg viewBox="0 0 24 24"><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z" fill="rgba(255,225,77,.2)" stroke="#ffe14d" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 9l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="#ffe14d"/></svg>',
    replay: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#19f0ff" stroke-width="1.8"/><path d="M10 8.5l6 3.5-6 3.5z" fill="#19f0ff"/></svg>',
    sp_heal: '<svg viewBox="0 0 24 24"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" fill="rgba(57,255,136,.18)" stroke="#39ff88" stroke-width="1.6"/><path d="M12 7.5v9M7.5 12h9" stroke="#39ff88" stroke-width="3" stroke-linecap="round"/></svg>',
    sp_rage: '<svg viewBox="0 0 24 24"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" fill="rgba(255,43,214,.18)" stroke="#ff2bd6" stroke-width="1.6"/><path d="M13.5 5L8 13h4l-1.5 6L16 11h-4z" fill="#ff2bd6"/></svg>',
    sp_jam: '<svg viewBox="0 0 24 24"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" fill="rgba(127,216,255,.18)" stroke="#7fd8ff" stroke-width="1.6"/><path d="M8 9.5c2.2-2 5.8-2 8 0M9.6 11.7c1.3-1.1 3.5-1.1 4.8 0" stroke="#7fd8ff" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="14.2" r="1.4" fill="#7fd8ff"/><path d="M6 18L18 6" stroke="#ff3355" stroke-width="2" stroke-linecap="round"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><g fill="none" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="9" width="17" height="11.5" rx="1.5" stroke="#ff2bd6"/><path d="M2.5 9h19v3.5h-19z" stroke="#ff2bd6"/><path d="M12 9v11.5" stroke="#ffe14d"/><path d="M12 9c-1.5-4-6-4.5-6-2s4.5 2 6 2c1.5 0 6 .5 6-2s-4.5-2-6 2z" stroke="#ffe14d"/></g></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5.2-3.5 9.2-8 11-4.5-1.8-8-5.8-8-11V5z" fill="rgba(25,240,255,.25)" stroke="#19f0ff" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="#19f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  U.IC = IC;
  const resIc = (r) => '<i class="ri">' + IC[r] + '</i>';
  const escHtml = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  U.init = function () {
    const ui = $('#ui');
    ui.innerHTML = `
      <div id="hud-top">
        <div class="player pe" id="btn-profile"><div class="pl-name" id="pl-name"></div><div class="pl-tro">${IC.trophy}<span id="pl-tro">0</span><small id="pl-league" class="pl-league"></small></div></div>
        <div class="res-wrap">
          ${['scrap', 'copper', 'plasma', 'chips'].map((r) => `<div class="res" data-r="${r}"><i>${IC[r]}</i><div class="bar"><b></b></div><span class="v"></span><span class="cap"></span></div>`).join('')}
        </div>
        <button class="icon-btn pe" id="btn-set" aria-label="settings">${IC.gear}</button>
      </div>
      <div id="hud-builders" class="chip-info pe">${IC.drone}<span id="builders-v"></span><b class="plus">+</b></div>
      <div id="hud-shield" class="chip-info hidden" title="">${IC.shield}<span id="shield-v"></span></div>
      <button id="btn-layout" class="chip-info pe">${IC.move}<span data-t="layout"></span></button>
      <button id="btn-quests" class="chip-info pe">${IC.gift}<span data-t="quests"></span><i class="dot hidden"></i></button>
      <button id="btn-pass" class="chip-info pe">${IC.pass}<span data-t="pass"></span><i class="dot hidden"></i></button>
      <div id="editbar" class="pe hidden"><span>${IC.move}</span><b data-t="layoutHint"></b><button class="btn primary sm" id="edit-done" data-t="done"></button></div>
      <div id="hud-bottom">
        <button class="btn-attack pe" id="btn-attack">${IC.sword}<span data-t="attack"></span></button>
        <div class="hb-right">
          <button class="sq-btn pe" id="btn-clan">${IC.clan}<span data-t="clan"></span></button>
          <button class="sq-btn pe" id="btn-army">${IC.army}<span data-t="army"></span></button>
          <button class="sq-btn pe" id="btn-shop">${IC.cart}<span data-t="shop"></span></button>
        </div>
      </div>
      <div id="selbar" class="pe hidden"></div>
      <div id="placebar" class="pe hidden"></div>
      <div id="battle-hud" class="hidden"></div>
      <div id="modal" class="hidden"></div>
      <div id="toast"></div>`;
    $('#btn-shop').onclick = U.openShop;
    $('#btn-army').onclick = U.openArmy;
    $('#btn-clan').onclick = () => G.Clan.open();
    $('#btn-layout').onclick = () => G.Village.setEditMode(true);
    $('#btn-quests').onclick = U.openQuests;
    $('#btn-pass').onclick = U.openPass;
    $('#hud-builders').onclick = () => { G.Sfx.play('click'); U.openBuilders(); };
    $('#edit-done').onclick = () => G.Village.setEditMode(false);
    $('#btn-attack').onclick = U.openAttack;
    $('#btn-set').onclick = U.openSettings;
    $('#btn-profile').onclick = U.openSettings;
    // tapping the chips counter opens the chip shop
    const chipRes = $('.res[data-r="chips"]'); chipRes.classList.add('pe'); chipRes.onclick = () => { G.Sfx.play('click'); U.openChips(); };
    ui.addEventListener('click', (e) => { if (e.target.closest('button')) G.Sfx.play('click'); }, true);
    U.applyLang();
  };
  U.applyLang = function () {
    document.documentElement.lang = G.lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  };

  U.loading = function (on) {
    let el = $('#loading');
    if (!el) { el = document.createElement('div'); el.id = 'loading'; el.innerHTML = '<div class="spin"></div>'; $('#ui').appendChild(el); }
    el.classList.toggle('hidden', !on);
  };

  // three stars filled in proportion to destruction: 33% = 1 star, 50% = 1.5, 100% = 3
  U.starBar = function (pct, big) {
    const fill = Math.max(0, Math.min(3, pct * 3));
    return [0, 1, 2].map((k) => {
      const f = Math.max(0, Math.min(1, fill - k));
      return `<span class="st part ${big ? 'big' : ''} ${f >= 0.99 ? 'on' : ''}">${IC.star}<i style="width:${Math.round(f * 100)}%">${IC.star}</i></span>`;
    }).join('');
  };
  // layout mode bar: hides the normal bottom HUD while you drag buildings around
  U.showEditBar = function (on) {
    $('#editbar').classList.toggle('hidden', !on);
    $('#hud-bottom').classList.toggle('hidden', on);
    $('#btn-layout').classList.toggle('hidden', on); $('#btn-quests').classList.toggle('hidden', on); $('#btn-pass').classList.toggle('hidden', on);
    if (on) U.hideSel();
  };
  // positive message (green) — toast() is for errors
  U.notify = function (msg) {
    const el = $('#toast');
    G.Sfx.play('star');
    el.textContent = msg; el.classList.add('show', 'good');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show', 'good'), 3000);
  };
  let toastT = null;
  U.toast = function (msg) {
    G.Sfx.play('error');
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  };

  // ---------- modal ----------
  U.modal = function (title, html, opts) {
    opts = opts || {};
    const m = $('#modal');
    m.innerHTML = `<div class="modal-bg"></div><div class="panel ${opts.cls || ''}"><div class="panel-h"><h2>${title}</h2>${opts.noClose ? '' : '<button class="x-btn" id="m-close">' + IC.x + '</button>'}</div><div class="panel-b">${html}</div></div>`;
    if (m.classList.contains('hidden')) G.Sfx.play('open');
    m.classList.remove('hidden');
    if (!opts.noClose) { $('#m-close').onclick = U.closeModal; $('.modal-bg', m).onclick = U.closeModal; }
    U.modalRefresh = opts.refresh || null;
    return m;
  };
  U.closeModal = function () { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; U.modalRefresh = null; };
  U.isModal = () => !$('#modal').classList.contains('hidden');

  const costHtml = (res, n, ok) => `<span class="cost ${ok === false ? 'bad' : ''}">${resIc(res)}${G.fmt(n)}</span>`;

  // ---------- village HUD ----------
  U.showVillage = function () {
    $('#hud-top').classList.remove('hidden'); $('#hud-bottom').classList.remove('hidden'); $('#hud-builders').classList.remove('hidden');
    $('#btn-layout').classList.remove('hidden'); $('#btn-quests').classList.remove('hidden'); $('#btn-pass').classList.remove('hidden'); $('#editbar').classList.add('hidden');
    $('#battle-hud').classList.add('hidden'); $('#battle-hud').innerHTML = '';
    U.hideSel(); U.hidePlace(); U.closeModal();
    U.refreshHud();
  };
  U.refreshHud = function () {
    const s = G.state;
    $('#pl-name').textContent = s.name;
    $('#btn-profile').classList.toggle('vip', G.isVip());
    $('#btn-quests .dot').classList.toggle('hidden', !G.Econ.questDot(s, Date.now()));
    // season pass: a dot when a tier can be claimed
    { const P = s.pass, tr = P ? G.Econ.passTier(s) : 0; let can = false; if (P) for (let i = 1; i <= tr && !can; i++) if (!P.free.includes(i) || (P.premium && !P.prem.includes(i))) can = true; $('#btn-pass .dot').classList.toggle('hidden', !can && !s.seasonReward); }
    $('#pl-league') && ($('#pl-league').textContent = t('lg_' + G.LEAGUES[G.leagueOf(s.trophies | 0)].id));
    // PvP shield (set by the server after someone attacks us)
    const sh = $('#hud-shield'), left = Math.ceil(((s.shieldUntil || 0) - Date.now()) / 1000);
    if (sh) { sh.classList.toggle('hidden', !(left > 0)); if (left > 0) $('#shield-v').textContent = G.fmtTime(left); }
    $('#pl-tro').textContent = s.trophies;
    // plasma shows up once it matters (Core 5+ or you already have some)
    $('.res[data-r="plasma"]').classList.remove('hidden'); // plasma is always shown (0 / 0 until the first tank)
    for (const r of ['scrap', 'copper', 'plasma', 'chips']) {
      const el = $('.res[data-r="' + r + '"]');
      const cap = G.capOf(r), v = s.res[r] || 0;
      $('.v', el).textContent = G.fmt(v);
      $('.cap', el).textContent = r === 'chips' ? '' : '/ ' + G.fmt(cap);
      $('.bar b', el).style.width = r === 'chips' ? '100%' : (cap ? Math.min(100, v / cap * 100) : 0) + '%';
      el.classList.toggle('full', r !== 'chips' && v >= cap);
      // little bump animation whenever a resource goes up
      if (lastRes[r] != null && v > lastRes[r]) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      lastRes[r] = v;
    }
    const total = G.Econ.builders(s), free = total - G.buildersBusy();
    $('#builders-v').textContent = free + '/' + total;
    $('#hud-builders').classList.toggle('free', free > 0);
    $('#btn-army').classList.toggle('busy', s.queue.length > 0);
  };
  const lastRes = {};

  // ---------- upgrading many at once (walls, traps: anything that upgrades instantly) ----------
  // the straight line of same-level pieces through b (the longer of horizontal / vertical), nearest first
  const rowOf = (b) => {
    const s = G.state, at = new Map();
    for (const q of s.buildings) if (q.type === b.type && q.level === b.level && !(q.busyUntil > Date.now())) at.set(q.x + ',' + q.y, q);
    const line = (dx, dy) => { const out = []; for (const k of [1, -1]) for (let i = 1; ; i++) { const q = at.get((b.x + dx * i * k) + ',' + (b.y + dy * i * k)); if (!q) break; out.push([i, q]); } return out; };
    const h = line(1, 0), v = line(0, 1), pick = h.length >= v.length ? h : v;
    return [b].concat(pick.sort((p, q) => p[0] - q[0]).map((p) => p[1]));
  };
  // every piece of this type at this level, nearest to b first
  const sameLevel = (b) => G.state.buildings.filter((q) => q.type === b.type && q.level === b.level && !(q.busyUntil > Date.now()))
    .sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y));
  const multiUp = (list, b) => {
    const u = G.upgradeInfo(b), have = G.state.res[u.res] || 0;
    const can = Math.min(list.length, Math.floor(have / u.cost));
    if (can <= 0) { U.toast(t('notEnough', { r: t(u.res) })); return; }
    U.confirm(t('multiUpQ', { n: can, m: list.length, lv: u.next, c: G.fmt(can * u.cost), r: t(u.res).toLowerCase() }), () => {
      let done = 0;
      for (const q of list.slice(0, can)) { const r = G.act({ c: 'upgrade', id: q.id }); if (r.err) break; done++; }
      if (done) { G.Sfx.play('build'); G.save(); U.notify(t('multiUpDone', { n: done, lv: u.next })); }
      U.showSel(b); U.refreshHud();
    });
  };

  // ---------- selection bar ----------
  U.showSel = function (b) {
    const el = $('#selbar'), d = B[b.type], now = Date.now();
    const busy = b.busyUntil > now;
    let status = '';
    if (busy) status = `<div class="sb-status">${t(b.level === 0 ? 'building' : 'upgrading')} · <b id="sb-time">${G.fmtTime((b.busyUntil - now) / 1000)}</b></div>`;
    else if (d.prod && b.level > 0) {
      const per5 = G.Econ.ratePer(b, 5), full = G.state.res[d.prod] >= G.capOf(d.prod);
      status = `<div class="sb-status">${t('mining')}: <b>+${per5.toLocaleString(G.lang, { maximumFractionDigits: 1 })} ${t(d.prod).toLowerCase()} / 5 s</b> (${G.grp(d.rate[b.level - 1])} / h)${full ? ` · <b class="warn">${t('storageFull')}</b>` : ''}</div>`;
    }
    const btn = (id, ic, label, extra) => `<button class="sb-btn" id="${id}"><span class="sb-ic">${ic}</span><span class="sb-l">${label}</span>${extra || ''}</button>`;
    let btns = btn('sb-info', IC.info, t('info'));
    if (!busy) {
      const u = G.upgradeInfo(b);
      // upgrade only when the Core allows it; otherwise say right away what's needed
      if (u.max) btns += `<div class="sb-btn sb-info-only"><span class="sb-l">${t('maxLevel')}</span></div>`;
      else if (u.coreNeeds && u.coreNeeds.length) btns += btn('sb-up', IC.up, t('coreNeedsBtn'), `<span class="sb-c warn">${u.coreNeeds.reduce((m, x) => m + x.n, 0)}</span>`);
      else if (u.blocked) btns += `<div class="sb-btn sb-info-only"><span class="sb-ic">${IC.up}</span><span class="sb-l">${t(u.city === 2 ? 'needXcore' : 'needCore', { n: u.needCore })}</span></div>`;
      else {
        btns += btn('sb-up', IC.up, t('upgrade'), `<span class="sb-c">${resIc(u.res)}${G.fmt(u.cost)}</span>`);
        // instant upgrades (walls, traps): a whole row, or every piece of this level, in one go
        if (!u.time && b.level > 0) {
          const row = d.wall ? rowOf(b) : [], all = sameLevel(b);
          if (row.length > 1) btns += btn('sb-uprow', IC.up, t('upRow') + ' ×' + row.length, `<span class="sb-c">${resIc(u.res)}${G.fmt(u.cost * row.length)}</span>`);
          if (all.length > 1 && all.length > row.length) btns += btn('sb-upall', IC.up, t('upAll') + ' ×' + all.length, `<span class="sb-c">${resIc(u.res)}${G.fmt(u.cost * all.length)}</span>`);
        }
      }
    } else {
      btns += btn('sb-fin', IC.bolt, t('finish'), `<span class="sb-c">${resIc('chips')}<span id="sb-fc">${G.finishCost(b)}</span></span>`);
    }
    if (b.type !== 'core' || true) btns += btn('sb-move', IC.move, t('move'));
    if (d.prod && b.level > 0 && b.acc >= 1) btns += btn('sb-col', IC[d.prod], t('collect'));
    if ((b.type === 'factory' || b.type === 'squadhq' || b.type === 'xhangar') && b.level > 0) btns += btn('sb-army', IC.army, t('army'));
    if (b.type === 'lab' && b.level > 0) btns += btn('sb-lab', IC.up, t('research'));
    el.innerHTML = `<div class="sb-title">${t('b_' + b.type)} <small>${b.level > 0 ? t('level') + ' ' + b.level : ''}</small></div>${status}<div class="sb-btns">${btns}</div>`;
    el.classList.remove('hidden');
    el.dataset.id = b.id;
    $('#sb-info').onclick = () => U.openInfo(b);
    if ($('#sb-up')) $('#sb-up').onclick = () => U.openUpgrade(b);
    if ($('#sb-uprow')) $('#sb-uprow').onclick = () => multiUp(rowOf(b), b);
    if ($('#sb-upall')) $('#sb-upall').onclick = () => multiUp(sameLevel(b), b);
    if ($('#sb-fin')) $('#sb-fin').onclick = () => {
      const c = G.finishCost(b);
      U.confirm(t('finishFor', { n: c }), () => { const e = G.finishNow(b); if (e) U.toast(e); U.showSel(b); U.refreshHud(); });
    };
    $('#sb-move').onclick = () => G.Village.startMove(b);
    if ($('#sb-col')) $('#sb-col').onclick = () => {
      const got = G.collect(b); G.save();
      if (got <= 0 && b.acc >= 1) U.toast(t('storageFull'));
      const [wx, wy] = G.tileToWorld(b.x + 1.5, b.y + 1.5);
      if (got > 0) G.Village.floats.push({ wx, wy: wy - 50, text: '+' + got, color: '#ff8a1f', life: 1.4 });
      U.showSel(b); U.refreshHud();
    };
    if ($('#sb-army')) $('#sb-army').onclick = U.openArmy;
    if ($('#sb-lab')) $('#sb-lab').onclick = U.openLab;
    $('#hud-bottom').classList.add('dim');
  };
  U.hideSel = function () { $('#selbar').classList.add('hidden'); $('#hud-bottom').classList.remove('dim'); };
  // obstacle selected: name + remove button with the cost
  U.showObsSel = function (o) {
    const el = $('#selbar'), d = G.OBSTACLES[o.type], cost = G.Econ.obsCost(G.state, o);
    el.innerHTML = `<div class="sb-title">${t('o_' + o.type)} <small>${t('obstacle')}</small></div>
      <div class="sb-status">${t('obsHint')}</div>
      <div class="sb-btns"><button class="sb-btn" id="sb-clear"><span class="sb-ic">${IC.x}</span><span class="sb-l">${t('remove')}</span><span class="sb-c">${resIc(d.res)}${G.fmt(cost)}</span></button></div>`;
    el.classList.remove('hidden'); el.dataset.id = '';
    $('#sb-clear').onclick = () => G.Village.clearObs(o);
    $('#hud-bottom').classList.add('dim');
  };

  U.showPlace = function () {
    U.hideSel();
    const g = G.Village.ghost, el = $('#placebar');
    const d = B[g.type];
    const cost = g.moveId ? '' : costHtml(d.res, d.cost[0], G.state.res[d.res] >= d.cost[0]);
    el.innerHTML = `<div class="pb-hint">${t('b_' + g.type)} ${cost}</div>
      <button class="round-btn bad" id="pb-no">${IC.x}</button><button class="round-btn good" id="pb-ok">${IC.check}</button>`;
    el.classList.remove('hidden');
    $('#pb-no').onclick = () => G.Village.cancelGhost();
    $('#pb-ok').onclick = () => { G.Village.confirmGhost(); U.refreshHud(); };
    $('#hud-bottom').classList.add('hidden');
  };
  U.hidePlace = function () { $('#placebar').classList.add('hidden'); if (G.scene === G.Village) $('#hud-bottom').classList.remove('hidden'); };

  U.confirm = function (msg, yes) {
    U.modal(t('settings') === msg ? '' : '⚠', `<p class="center">${msg}</p><div class="row-btns"><button class="btn" id="c-no">${t('no')}</button><button class="btn primary" id="c-yes">${t('yes')}</button></div>`, { cls: 'small' });
    $('#c-no').onclick = U.closeModal;
    $('#c-yes').onclick = () => { U.closeModal(); yes(); };
  };

  // ---------- info / upgrade ----------
  function statRows(type, lv, nextLv) {
    const d = B[type], rows = [];
    const row = (label, a, b) => rows.push(`<tr><td>${label}</td><td>${a}</td>${nextLv ? `<td class="nx">${b != null && b !== a ? '→ ' + b : ''}</td>` : ''}</tr>`);
    const v = (arr, l) => (arr && l > 0 ? G.grp(arr[l - 1]) : '-');
    row(t('hp'), v(d.hp, lv), nextLv && v(d.hp, nextLv));
    if (d.prod) { row(t('production'), v(d.rate, lv), nextLv && v(d.rate, nextLv)); row(t('storage'), v(d.cap, lv), nextLv && v(d.cap, nextLv)); }
    if (d.store) row(t('storage'), v(d.store, lv), nextLv && v(d.store, nextLv));
    if (d.housing) row(t('capacity'), v(d.housing, lv), nextLv && v(d.housing, nextLv));
    if (d.dmg) row(t('damage'), v(d.dmg, lv), nextLv && v(d.dmg, nextLv));
    if (d.range) row(t('range'), (d.minRange ? d.minRange + '–' : '') + d.range, (d.minRange ? d.minRange + '–' : '') + d.range);
    if (d.hits) row(t('targets'), t('hits_' + d.hits), t('hits_' + d.hits));
    if (d.splash) row(t('splash'), d.splash, d.splash);
    return `<table class="stats">${rows.join('')}</table>`;
  }
  U.openInfo = function (b) {
    const lv = b.level || 1;
    U.modal(t('b_' + b.type) + ' · ' + t('level') + ' ' + lv,
      `<div class="info-top"><img src="${G.Art.buildThumb(b.type, lv)}" alt=""><p>${t('d_' + b.type)}</p></div>${statRows(b.type, lv)}`);
  };
  U.openUpgrade = function (b) {
    const u = G.upgradeInfo(b);
    if (u.max) { U.toast(t('maxLevel')); return; }
    const ok = G.state.res[u.res] >= u.cost;
    U.modal(t('upgrade') + ': ' + t('b_' + b.type),
      `<div class="info-top"><img src="${G.Art.buildThumb(b.type, u.next)}" alt=""><div><p>${t('level')} ${b.level} → <b>${u.next}</b></p>
       <p>${t('cost')}: ${costHtml(u.res, u.cost, ok)} · ${t('time')}: <b>${u.time ? G.fmtTime(u.time) : t('instant')}</b></p>
       ${u.blocked && !(u.coreNeeds && u.coreNeeds.length) ? `<p class="warn">${t(u.city === 2 ? 'needXcore' : 'needCore', { n: u.needCore })}</p>` : ''}</div></div>
       ${u.coreNeeds && u.coreNeeds.length ? `<div class="core-needs"><p class="warn">${t('coreNeedsTitle', { n: u.next })}</p>
         <div class="cn-list">${u.coreNeeds.map((x) => `<button class="cn" data-cn="${x.type}"><img src="${G.Art.buildThumb(x.type, x.lv)}" alt=""><span>${t('b_' + x.type)}</span><b>${x.n > 1 ? x.n + '× ' : ''}→ ${t('level')} ${x.lv}</b><i class="cn-go">${IC.up}</i></button>`).join('')}</div>
         <p class="hint">${t('coreNeedsHint')}</p></div>` : ''}
       ${statRows(b.type, b.level, u.next)}
       <div class="row-btns"><button class="btn primary" id="u-go" ${u.blocked ? 'disabled' : ''}>${IC.up}${t('upgrade')}</button></div>`);
    // core: tap a missing building to start upgrading the lowest one of that type right away
    document.querySelectorAll('#modal [data-cn]').forEach((el) => {
      el.onclick = () => {
        const type = el.dataset.cn, L = G.Econ.cityCore(G.state, u.city);
        const list = G.state.buildings.filter((q) => q.type === type && q.level < L && !(q.busyUntil > Date.now())).sort((p, q) => p.level - q.level);
        if (!list.length) { U.toast(t('cnBusy')); return; }
        const e = G.startUpgrade(list[0]);
        if (e) { U.toast(e); return; }
        G.Sfx.play('build'); U.toast(t('cnStarted', { n: t('b_' + type) })); U.refreshHud(); U.openUpgrade(b);
      };
    });
    $('#u-go').onclick = () => {
      const e = G.startUpgrade(b);
      if (e) { U.toast(e); return; }
      U.closeModal(); U.showSel(b); U.refreshHud();
    };
  };

  // ---------- shop ----------
  U.openShop = function () {
    const c2 = G.Village.city === 2, core = G.Econ.cityCore(G.state, c2 ? 2 : 1);
    const cards = (c2 ? G.SHOP2 : G.SHOP).map((type) => {
      const d = B[type], n = G.countType(type), lim = G.LIMITS[type][core - 1];
      const nextLim = G.LIMITS[type].findIndex((l) => l > n);
      const locked = n >= lim;
      return `<button class="card ${locked ? 'locked' : ''}" data-type="${type}">
        <img src="${G.Art.buildThumb(type, 1)}" alt="">
        <div class="c-name">${t('b_' + type)}</div>
        <div class="c-desc">${t('ds_' + type)}</div>
        <div class="c-cnt">${n}/${lim}</div>
        ${locked ? `<div class="c-lock">${nextLim >= 0 ? t(c2 ? 'needXcore' : 'needCore', { n: nextLim + 1 }) : t('maxCount')}</div>` :
          `<div class="c-cost">${costHtml(d.res, d.cost[0], G.state.res[d.res] >= d.cost[0])}</div><div class="c-time">${d.time[0] ? G.fmtTime(d.time[0]) : t('instant')}</div>`}
      </button>`;
    }).join('');
    U.modal(t('shop'), `<button class="chip-banner" id="shop-chips">${IC.chips}<span><b>${t('chipShop')}</b><small>${t('chipShopSub')}</small></span></button><div class="grid">${cards}</div>`, { cls: 'wide' });
    $('#shop-chips').onclick = U.openChips;
    document.querySelectorAll('#modal .card').forEach((c) => {
      c.onclick = () => {
        const type = c.dataset.type;
        if (c.classList.contains('locked')) { U.toast(t('limit')); return; }
        U.closeModal();
        G.Village.startPlace(type);
      };
    });
  };

  // ---------- chip shop: packs (Google Play), rewarded ad, chips -> resources ----------
  U.openChips = function () {
    let busy = false;
    const draw = () => {
      const s = G.state, inApp = G.Pay.ready;
      const packs = G.CHIP_PACKS.map((p) => `<button class="card pack ${p.tag ? 'tag-' + p.tag : ''}" data-pack="${p.id}">
          ${p.tag ? `<div class="p-tag">${t('tag_' + p.tag)}</div>` : ''}
          <div class="p-ic">${IC.chips}</div><div class="p-n">${G.fmt(p.chips)}</div>
          <div class="p-price">${escHtml(G.Pay.priceOf(p))}</div></button>`).join('');
      // VIP: active -> claim button + manage link, otherwise the offer
      const vipOn = G.isVip(), vst = G.Ads.state();
      const vipHtml = vipOn
        ? `<div class="vip-box on"><div class="vip-l"><span class="vip-badge">VIP</span><div><b>${t('vipActive', { d: new Date(s.vipUntil).toLocaleDateString(G.lang === 'en' ? 'en-GB' : 'pl-PL') })}</b>
            <small>${t('adLeft', { n: vst.left, m: G.ADS.perDay })}</small></div></div>
            <div class="vip-r"><button class="btn primary sm" id="vip-claim" ${vst.left <= 0 ? 'disabled' : ''}>${t('vipClaim', { n: Math.round(G.ADS.resPct * 100) })}</button>
            ${inApp ? `<a class="link-btn" href="${G.Pay.manageVipUrl()}" target="_blank" rel="noopener">${t('vipManage')}</a>` : ''}</div></div>`
        : `<div class="vip-box"><div class="vip-l"><span class="vip-badge">VIP</span><div><b>${t('vipTitle')}</b>
            <ul><li>${t('vipB1', { n: G.ADS.perDay, p: Math.round(G.ADS.resPct * 100) })}</li><li>${t('vipB2')}</li><li>${t('vipB3')}</li></ul></div></div>
            <div class="vip-r"><button class="btn primary" id="vip-buy">${escHtml(G.Pay.priceOf({ id: G.VIP.id, price: G.VIP.price }))}</button><small>${t('vipCancel')}</small></div></div>`;
      let ad = '';
      if (G.Ads.enabled()) {
        const st = G.Ads.state();
        ad = `<div class="ad-row"><div><b>${t('adTitle', { n: Math.round(G.ADS.resPct * 100) })}</b><small>${t('adLeft', { n: st.left, m: G.ADS.perDay })}</small></div>
          <button class="btn primary sm" id="ch-ad" ${st.left <= 0 || st.wait > 0 ? 'disabled' : ''}>${st.wait > 0 ? G.fmtTime(st.wait) : '▶ ' + t('adWatch')}</button></div>`;
      }
      const ex = ['scrap', 'copper'].map((r) => {
        const btns = [['p10', '10%'], ['p50', '50%'], ['full', t('fillUp')]].map(([part, lbl]) => {
          const n = G.Econ.buyResAmount(s, r, part), cost = G.resChipCost(n);
          return `<button class="btn sm ex-btn" data-r="${r}" data-part="${part}" ${n <= 0 ? 'disabled' : ''}>
            <span>${lbl}</span><span class="ex-n">+${G.fmt(n)}</span>${costHtml('chips', cost, s.res.chips >= cost)}</button>`;
        }).join('');
        return `<div class="ex-row">${resIc(r)}<b>${t(r)}</b><div class="ex-btns">${btns}</div></div>`;
      }).join('');
      U.modal(t('chipShop'), `
        ${vipHtml}
        <div class="sec-h">${t('chipPacks')}</div>
        ${inApp ? '' : `<p class="hint iap-note">${t(G.Pay.available() ? 'iapLoading' : 'iapOnlyApp')}</p>`}
        <div class="grid packs">${packs}</div>
        ${ad ? `<div class="sec-h">${t('freeRes')}</div>${ad}` : ''}
        <div class="sec-h">${t('boosts')}</div>${U.boostsHtml()}
        <div class="sec-h">${t('exchange')}</div>${ex}`, { cls: 'wide' });
      U.bindBoosts(draw);
      document.querySelectorAll('#modal .pack').forEach((b) => {
        b.onclick = async () => {
          if (busy) return;
          if (!G.Pay.available()) { U.toast(t('iapOnlyAppShort')); return; }
          busy = true; U.loading(true);
          const r = await G.Pay.buy(G.packById(b.dataset.pack));
          U.loading(false); busy = false;
          if (r.ok) { G.Sfx.play('star'); U.notify(t('iapThanks', { n: r.chips || G.packById(b.dataset.pack).chips })); U.refreshHud(); draw(); }
          else if (r.err !== 'iapCancel') U.toast(t(r.err));
        };
      });
      if ($('#vip-buy')) $('#vip-buy').onclick = async () => {
        if (busy) return;
        if (!G.Pay.available()) { U.toast(t('iapOnlyAppShort')); return; }
        busy = true; U.loading(true);
        const r = await G.Pay.buyVip();
        U.loading(false); busy = false;
        if (r.ok) { G.Sfx.play('star'); U.notify(t('vipThanks')); U.refreshHud(); draw(); }
        else if (r.err !== 'iapCancel') U.toast(t(r.err));
      };
      if ($('#vip-claim')) $('#vip-claim').onclick = () => {
        const r = G.act({ c: 'vipReward' });
        if (r.err) U.toast(t(r.err, r.p)); else { G.Sfx.play('collect'); U.notify(t('adGot', { s: G.fmt(r.gained.scrap), c: G.fmt(r.gained.copper) })); U.refreshHud(); }
        draw();
      };
      if ($('#ch-ad')) $('#ch-ad').onclick = async () => {
        if (busy) return;
        busy = true;
        const watched = await G.Ads.showRewarded();
        busy = false;
        if (!watched) { U.toast(t('adNone')); draw(); return; }
        const r = G.act({ c: 'adReward' });
        if (r.err) U.toast(t(r.err, r.p)); else { U.notify(t('adGot', { s: G.fmt(r.gained.scrap), c: G.fmt(r.gained.copper) })); U.refreshHud(); }
        draw();
      };
      document.querySelectorAll('#modal .ex-btn').forEach((b) => {
        b.onclick = () => {
          const n = G.Econ.buyResAmount(G.state, b.dataset.r, b.dataset.part), cost = G.resChipCost(n);
          U.confirm(t('exchangeQ', { n: G.fmt(n), r: t(b.dataset.r), c: cost }), () => {
            const r = G.act({ c: 'buyRes', r: b.dataset.r, part: b.dataset.part });
            if (r.err) U.toast(t(r.err, r.p)); else { G.Sfx.play('collect'); U.refreshHud(); }
            U.openChips();
          });
        };
      });
    };
    draw();
    if (G.Pay.available() && !G.Pay.ready) G.Pay.init().then((ok) => { if (ok && U.isModal() && !busy) draw(); });
  };

  // ---------- army ----------
  // quick train: 3 saved army compositions
  const presetsHtml = (s) => {
    const slots = [0, 1, 2].map((i) => {
      const p = s.presets && s.presets[i], list = p ? G.UNIT_ORDER.filter((u) => p[u] > 0) : [];
      const sp = p ? G.UNIT_ORDER.reduce((m, u) => m + (p[u] || 0) * G.UNITS[u].space, 0) : 0;
      return `<div class="pre"><div class="pre-h"><b>#${i + 1}</b>${p ? `<small class="dim">${sp} ${t('housing').toLowerCase()}</small>` : ''}</div>
        <div class="pre-u">${list.length ? list.map((u) => `<span><img src="${G.Art.unitThumb(u)}" alt="">×${p[u]}</span>`).join('') : `<small class="dim">${t('presetEmpty')}</small>`}</div>
        <div class="pre-b"><button class="btn sm" data-ps="${i}">${t('presetSave')}</button><button class="btn sm primary" data-pt="${i}" ${list.length ? '' : 'disabled'}>${t('presetTrain')}</button></div></div>`;
    }).join('');
    return `<h3>${t('presets')}</h3><p class="hint">${t('presetsHint')}</p><div class="presets">${slots}</div>`;
  };
  // queue whatever the preset has more of than the army + queue already holds
  const trainPreset = (i) => {
    const s = G.state, p = s.presets && s.presets[i]; if (!p) return;
    let n = 0, err = null;
    for (const u of G.UNIT_ORDER) {
      let need = (p[u] || 0) - (s.army[u] || 0) - s.queue.filter((x) => x === u).length;
      while (need-- > 0) { const r = G.act({ c: 'train', u }); if (r.err) { err = r; break; } n++; }
      if (err) break;
    }
    if (n) { s.flags.trained = true; G.Sfx.play('train'); G.save(); U.notify(t('presetQueued', { n })); }
    if (err) U.toast(G.t(err.err, err.p && err.p.r ? { r: t(err.p.r) } : err.p));
    else if (!n) U.toast(t('presetReady'));
  };
  U.openArmy = function () {
    const draw = () => {
      const s = G.state, fl = G.factoryLevel(), cap = G.housing(), used = G.armySpace(), q = G.queueSpace();
      const now = Date.now();
      const units = G.UNIT_ORDER.map((u) => {
        const d = G.UNITS[u], locked = G.Econ.unitGate(s, u) < d.unlock;
        return `<button class="card unit ${locked ? 'locked' : ''}" data-u="${u}">
          <img src="${G.Art.unitThumb(u)}" alt=""><div class="c-name">${t('u_' + u)}</div>
          ${locked ? `<div class="c-lock">${t(d.colony ? 'hangarAt' : 'factoryAt', { n: d.unlock })}</div>` :
            `<div class="c-cost">${costHtml('copper', d.cost, s.res.copper >= d.cost)}</div><div class="c-time">${d.space} ${t('housing').toLowerCase()} · ${d.time}s</div>`}
          <div class="c-have">${s.army[u]}</div><div class="c-cnt">${t('level')} ${(s.unitLv && s.unitLv[u]) || 1}</div>
          <span class="c-info" data-info="${u}">i</span>
        </button>`;
      }).join('');
      let qhtml = '';
      if (s.queue.length) {
        // one card per unit type: how many are queued and when the last of them is ready; plus the whole army's time
        const left0 = Math.max(0, (s.qStart + G.UNITS[s.queue[0]].time * 1000 - now) / 1000);
        const groups = [];
        let tAcc = 0;
        s.queue.forEach((u, i) => {
          tAcc += i === 0 ? left0 : G.UNITS[u].time;
          let g = groups.find((x) => x.u === u);
          if (!g) { g = { u, n: 0, done: 0, active: i === 0 }; groups.push(g); }
          g.n++; g.done = tAcc;
        });
        qhtml = `<div class="q-total">${IC.army}<span>${t('armyReadyIn')}</span><b>${G.fmtTime(tAcc)}</b><small>(${s.queue.length} ${t('unitsShort')})</small></div>
          <div class="queue">${groups.map((g) => `<button class="q-item q-group ${g.active ? 'active' : ''}" data-u="${g.u}"><img src="${G.Art.unitThumb(g.u)}" alt="">
            <em>×${g.n}</em><span>${G.fmtTime(g.done)}</span></button>`).join('')}</div><p class="hint">${t('cancelTrain')}</p>`;
      }
      const heroes = G.HERO_ORDER.map((h) => {
        const ok = G.heroUnlocked(h), E = G.Econ, lv = E.heroLevel(s, h), hi = E.heroUpInfo(s, h);
        const up = s.heroUp && s.heroUp.h === h, rest = (s.heroRest && s.heroRest[h]) > now;
        let status, btn = '';
        if (!ok) status = `<div class="warn">${t('unlockAt', { n: G.HEROES[h].unlock })}</div>`;
        else if (up) {
          status = `<div class="warn">${t('heroUpgrading', { n: s.heroUp.to })} · ${G.fmtTime((s.heroUp.until - now) / 1000)}</div>`;
          btn = `<button class="btn sm primary" data-hf="${h}">${IC.bolt}${costHtml('chips', E.speedCost(s.heroUp.until - now), s.res.chips >= E.speedCost(s.heroUp.until - now))}</button>`;
        } else if (rest) status = `<div class="warn">${t('heroResting')} · ${G.fmtTime((s.heroRest[h] - now) / 1000)}</div>`;
        else status = `<div class="ok">${t('available')}</div>`;
        if (ok && !up) {
          if (hi.max) btn = `<small class="dim">${t('maxLevel')}</small>`;
          else if (hi.blocked) btn = `<small class="dim">${t('needHq', { n: hi.needHq })}</small>`;
          else btn = `<button class="btn sm" data-hu="${h}" ${s.heroUp ? 'disabled' : ''}>${IC.up}${t('upgrade')} ${costHtml('plasma', hi.cost, s.res.plasma >= hi.cost)} · ${G.fmtTime(hi.time)}</button>`;
        }
        return `<div class="hero ${ok ? '' : 'locked'}"><span class="c-info" data-info="${h}">i</span><img src="${G.Art.unitThumb(h)}" alt=""><div><div class="c-name">${t('h_' + h)} <small>${t('level')} ${lv}</small></div><p>${t('hd_' + h)}</p>
          ${status}<div class="hero-up">${btn}</div></div></div>`;
      }).join('');
      // battle programs (Program Forge)
      let spells = '';
      const fgl = G.Econ.forgeLevel(s);
      if (fgl > 0) {
        const scap = G.Econ.spellCap(s), sused = G.Econ.spellSpace(s);
        const cards = G.SPELL_ORDER.map((k) => {
          const d = G.SPELLS[k], locked = fgl < d.unlock;
          return `<button class="card spellc ${locked ? 'locked' : ''}" data-sp="${k}" style="--sc:${d.color}"><div class="sp-ic">${IC['sp_' + k]}</div><div class="c-name">${t('sp_' + k)}</div>
            ${locked ? `<div class="c-lock">${t('forgeAt', { n: d.unlock })}</div>` : `<div class="c-cost">${costHtml('copper', d.cost, s.res.copper >= d.cost)}</div><div class="c-time">${G.fmtTime(d.time)}</div>`}
            <div class="c-have">${(s.spells && s.spells[k]) || 0}</div></button>`;
        }).join('');
        let sq = '';
        if (s.sQueue && s.sQueue.length) {
          let tt = Math.max(0, (s.sqStart + G.SPELLS[s.sQueue[0]].time * 1000 - now) / 1000) + s.sQueue.slice(1).reduce((m, k) => m + G.SPELLS[k].time, 0);
          sq = `<div class="q-total">${IC.bolt}<span>${t('progsReadyIn')}</span><b>${G.fmtTime(tt)}</b></div><div class="queue">${s.sQueue.map((k, i) => `<button class="q-item sq-item" data-si="${i}" style="--sc:${G.SPELLS[k].color}">${IC['sp_' + k]}</button>`).join('')}</div>`;
        }
        spells = `<h3>${t('programs')} <small class="dim">${sused}/${scap}</small></h3><p class="hint">${t('programsHint')}</p><div class="grid">${cards}</div>${sq}`;
      } else if (G.LIMITS.forge[G.coreLevel() - 1] > 0 || G.coreLevel() >= 3) spells = `<h3>${t('programs')}</h3><p class="hint">${t('needForge')}</p>`;
      return `<div class="cap-row"><span>${t('capacity')}</span><div class="bar big"><b style="width:${cap ? Math.min(100, used / cap * 100) : 0}%"></b><i style="left:${cap ? Math.min(100, used / cap * 100) : 0}%;width:${cap ? Math.min(100 - used / cap * 100, q / cap * 100) : 0}%"></i></div><b>${used + q}/${cap}</b></div>
        ${fl < 1 ? `<p class="warn">${t('needFactory')}</p>` : ''}
        <div class="grid">${units}</div>${qhtml}
        ${fl >= 1 ? presetsHtml(s) : ''}
        ${spells}
        <h3>${t('heroes')}</h3><div class="heroes">${heroes}</div>`;
    };
    const bind = () => {
      document.querySelectorAll('#modal .hero .c-info').forEach((c) => { c.onclick = () => U.openUnitInfo(c.dataset.info, true); });
      const actR = (cmd) => { const r = G.act(cmd); if (r.err) U.toast(G.t(r.err, r.p && r.p.r ? { r: t(r.p.r) } : r.p)); else G.Sfx.play('build'); refresh(); U.refreshHud(); };
      document.querySelectorAll('#modal [data-hu]').forEach((c) => { c.onclick = () => actR({ c: 'heroUp', h: c.dataset.hu }); });
      document.querySelectorAll('#modal [data-hf]').forEach((c) => { c.onclick = () => actR({ c: 'heroFinish' }); });
      document.querySelectorAll('#modal .spellc').forEach((c) => { c.onclick = () => { if (!c.classList.contains('locked')) actR({ c: 'brew', sp: c.dataset.sp }); else U.toast(t('forgeAt', { n: G.SPELLS[c.dataset.sp].unlock })); }; });
      document.querySelectorAll('#modal .sq-item').forEach((c) => { c.onclick = () => actR({ c: 'unbrew', i: +c.dataset.si }); });
      document.querySelectorAll('#modal [data-ps]').forEach((c) => {
        c.onclick = () => {
          const s = G.state, units = {};
          for (const u of G.UNIT_ORDER) units[u] = (s.army[u] || 0) + s.queue.filter((x) => x === u).length;
          if (!G.UNIT_ORDER.some((u) => units[u] > 0)) { U.toast(t('presetNothing')); return; }
          G.act({ c: 'preset', i: +c.dataset.ps, units }); U.toast(t('presetSaved')); refresh();
        };
      });
      document.querySelectorAll('#modal [data-pt]').forEach((c) => { c.onclick = () => { trainPreset(+c.dataset.pt); refresh(); U.refreshHud(); }; });
      document.querySelectorAll('#modal .card.unit').forEach((c) => {
        c.onclick = (ev) => {
          if (ev.target.closest('.c-info')) { U.openUnitInfo(c.dataset.u, true); return; }
          const e = G.trainUnit(c.dataset.u);
          if (e) U.toast(e);
          refresh(); U.refreshHud();
        };
      });
      // tapping a card cancels the last queued unit of that type (refund)
      document.querySelectorAll('#modal .q-item').forEach((c) => { c.onclick = () => { G.cancelTrain(G.state.queue.lastIndexOf(c.dataset.u)); refresh(); U.refreshHud(); }; });
    };
    const refresh = () => { const b = $('#modal .panel-b'); if (!b) return; const st = b.scrollTop; b.innerHTML = draw(); b.scrollTop = st; bind(); };
    U.modal(t('army'), draw(), { cls: 'wide', refresh });
    bind();
  };

  // ---------- unit / hero stats ("i" on a card) ----------
  U.openUnitInfo = function (u, backToArmy) {
    const hero = !!G.HEROES[u], base = hero ? G.HEROES[u] : G.UNITS[u];
    const lv = hero ? 1 : ((G.state.unitLv && G.state.unitLv[u]) || 1), maxLv = G.RESEARCH.maxLv;
    const mul = hero ? 1 : G.unitMul(lv), nmul = !hero && lv < maxLv ? G.unitMul(lv + 1) : null;
    // whole numbers as 1,200; fractions keep the language's decimal mark (2,5 in Polish)
    const num = (v, d) => (d === 0 || Number.isInteger(+v) ? G.grp(Math.round(+v)) : (+v).toLocaleString(G.lang === 'en' ? 'en' : 'pl', { maximumFractionDigits: d == null ? 1 : d }));
    const rows = [];
    const row = (label, cur, next, hint) => rows.push(`<tr><td>${label}${hint ? `<small>${hint}</small>` : ''}</td><td>${cur}</td>${nmul ? `<td class="nx">${next != null && next !== cur ? '→ ' + next : ''}</td>` : ''}</tr>`);
    const hp = (m) => num(Math.round(base.hp * m), 0);
    row(t('st_hp'), hp(mul), nmul && hp(nmul));
    if (base.heal) {
      const hv = (m) => num(Math.round(base.heal * m), 0);
      row(t('st_heal'), hv(mul) + ' / ' + num(base.interval) + ' s', nmul && hv(nmul) + ' / ' + num(base.interval) + ' s');
      row(t('st_healR'), num(base.healR) + ' ' + t('tiles'));
    } else if (u === 'drone' || u === 'breacher') {
      const dm = (m) => num(Math.round(base.dmg * m), 0);
      row(t('st_blast'), dm(mul), nmul && dm(nmul), t('st_blastHint'));
      if (base.wallMul) row(t('st_wall'), dm(mul * base.wallMul), nmul && dm(nmul * base.wallMul), 'x' + base.wallMul);
      row(t('splash'), num(base.splash) + ' ' + t('tiles'));
    } else {
      const dm = (m) => num(Math.round(base.dmg * m), 0), aps = 1 / base.interval;
      const dps = (m) => num(Math.round(base.dmg * m) * aps);
      row(t('st_dmg'), dm(mul), nmul && dm(nmul));
      row(t('st_aps'), num(aps, 2) + ' / s');
      row(t('st_dps'), dps(mul), nmul && dps(nmul), t('st_dpsHint'));
    }
    row(t('st_speed'), num(base.speed) + ' ' + t('tilesPerS'));
    row(t('range'), base.range > 1.5 ? num(base.range) + ' ' + t('tiles') : t('st_melee'));
    row(t('targets'), t('tg_' + base.target));
    row(t('st_move'), base.fly ? t('st_fly') : t('st_ground'));
    if (!hero) {
      row(t('st_space'), base.space);
      row(t('st_train'), G.fmtTime(base.time));
      row(t('cost'), costHtml('copper', base.cost));
      row(t('st_unlock'), t(base.colony ? 'b_xhangar' : 'b_factory') + ' ' + t('level') + ' ' + base.unlock);
    } else row(t('st_unlock'), t('b_squadhq') + ' ' + t('level') + ' ' + base.unlock);
    const head = hero ? t('h_' + u) : t('u_' + u) + ' · ' + t('level') + ' ' + lv + (lv >= maxLv ? ' (max)' : '');
    U.modal(head, `<div class="info-top"><img src="${G.Art.unitThumb(u)}" alt=""><p>${t(hero ? 'hd_' + u : 'ud_' + u)}</p></div>
      <table class="stats">${nmul ? `<tr><th></th><th>${t('st_now')}</th><th>${t('st_lab', { n: lv + 1 })}</th></tr>` : ''}${rows.join('')}</table>
      ${backToArmy ? `<div class="row-btns"><button class="btn" id="ui-back">← ${t('army')}</button></div>` : ''}`, { cls: 'small' });
    if ($('#ui-back')) $('#ui-back').onclick = U.openArmy;
  };

  // ---------- laboratory ----------
  U.openLab = function () {
    const draw = () => {
      const s = G.state, now = Date.now(), R = s.research;
      let cur = '';
      if (R) {
        const left = Math.max(0, (R.until - now) / 1000), cost = G.Econ.speedCost(left * 1000);
        cur = `<div class="lab-cur"><img src="${G.Art.unitThumb(R.u)}" alt=""><div><b>${t('u_' + R.u)} → ${t('level')} ${R.to}</b>
          <div class="bar big"><b style="width:${Math.min(100, (now - R.start) / (R.until - R.start) * 100)}%"></b></div><small>${G.fmtTime(left)}</small></div>
          <button class="btn sm primary" id="lab-fin">${IC.bolt}${costHtml('chips', cost, s.res.chips >= cost)}</button></div>`;
      }
      const cards = G.UNIT_ORDER.map((u) => {
        const ri = G.Econ.researchInfo(s, u), lv = ri.cur, locked = G.Econ.unitGate(s, u) < G.UNITS[u].unlock;
        const pct = Math.round(G.RESEARCH.bonus * 100);
        let foot;
        if (locked) foot = `<div class="c-lock">${t(G.UNITS[u].colony ? 'hangarAt' : 'factoryAt', { n: G.UNITS[u].unlock })}</div>`;
        else if (ri.max) foot = `<div class="c-lock">${t('maxLevel')}</div>`;
        else if (ri.blocked) foot = `<div class="c-lock">${t('labAt', { n: ri.needLab })}</div>`;
        else foot = `<div class="c-cost">${costHtml('copper', ri.cost, s.res.copper >= ri.cost)}</div><div class="c-time">${G.fmtTime(ri.time)} · +${pct}%</div>`;
        return `<button class="card unit ${locked || ri.max || ri.blocked || R ? 'locked' : ''}" data-u="${u}">
          <img src="${G.Art.unitThumb(u)}" alt=""><div class="c-name">${t('u_' + u)}</div><div class="c-cnt">${t('level')} ${lv}</div>${foot}</button>`;
      }).join('');
      return `<p class="hint">${t('labHint', { p: Math.round(G.RESEARCH.bonus * 100) })}</p>${cur}<div class="grid">${cards}</div>`;
    };
    const bind = () => {
      document.querySelectorAll('#modal .card.unit').forEach((c) => {
        c.onclick = () => {
          const r = G.act({ c: 'research', u: c.dataset.u });
          if (r.err) U.toast(G.t(r.err, r.p && r.p.r ? { r: t(r.p.r) } : r.p)); else G.Sfx.play('build');
          refresh(); U.refreshHud();
        };
      });
      const f = $('#lab-fin');
      if (f) f.onclick = () => { const r = G.act({ c: 'finishResearch' }); if (r.err) U.toast(t(r.err)); refresh(); U.refreshHud(); };
    };
    const refresh = () => { const b = $('#modal .panel-b'); if (!b) return; b.innerHTML = draw(); bind(); };
    U.modal(t('b_lab'), draw(), { cls: 'wide', refresh });
    bind();
  };

  // ---------- attack ----------
  U.openAttack = function () {
    const cost = 30 * G.coreLevel();
    U.modal(t('attack'), `<div class="two">
      <button class="mode-card" id="a-pve"><div class="mc-t">${t('campaign')}</div><p>${t('campaignDesc')}</p></button>
      <button class="mode-card mp" id="a-pvp"><div class="mc-t">${t('multiplayer')}</div><p>${t('mpDesc')}</p>
        <div class="mc-c">${t('findMatch')} · ${costHtml('copper', cost, G.state.res.copper >= cost)}</div></button></div>
      <div class="row-btns"><button class="btn" id="a-rank">${IC.trophy}${t('ranking')}</button><button class="btn" id="a-league">${t('leagues')}</button><button class="btn" id="a-find">🔍 ${t('findPlayer')}</button><button class="btn" id="a-def">${t('defenseLog')}</button></div>
      ${(G.state.shieldUntil || 0) > Date.now() ? `<p class="hint shield-note">${IC.shield} ${t('shieldWarn', { t: G.fmtTime(Math.ceil((G.state.shieldUntil - Date.now()) / 1000)) })}</p>` : ''}
      <p class="hint">${t(G.Net.session ? 'pvpNote' : 'pvpNoteOffline')}</p>`, { cls: 'wide' });
    $('#a-pve').onclick = U.openCampaign;
    $('#a-rank').onclick = U.openRanking;
    $('#a-league').onclick = U.openLeague;
    $('#a-find').onclick = U.openPlayerSearch;
    $('#a-def').onclick = () => U.openDefenseLog(0);
    let searching = false;
    $('#a-pvp').onclick = async () => {
      if (searching) return;
      if (!G.Battle.hasAnything()) { U.toast(t('armyEmpty')); return; }
      if (G.state.res.copper < cost) { U.toast(t('notEnough', { r: t('copper') })); return; }
      searching = true;
      let opp = null;
      if (G.Net.session) {
        U.loading(true);
        try { opp = await G.Net.findOpponent(); } catch (_) { opp = null; }
        U.loading(false);
      }
      searching = false;
      const err = G.paySearch();
      if (err) { U.toast(err); return; }
      U.closeModal();
      if (opp) {
        const buildings = G.Battle.baseFromLayout(opp.layout);
        if (buildings.some((q) => q.type !== 'firewall')) {
          const lm = G.lootMul(G.coreLevel(), opp.core | 0 || 1);
          G.Battle.start({ mode: 'pvp', base: { buildings, loot: { scrap: Math.floor(opp.loot_scrap * lm), copper: Math.floor(opp.loot_copper * lm) } }, name: opp.username, defender: opp.user_id, trophies: opp.trophies });
          return;
        }
      }
      if (G.Net.session) U.toast(t('noOpponents'));
      const seed = ((Date.now() & 0xffffff) ^ 0x5bd1e995) | 0;
      const bot = G.genBot(G.coreLevel(), seed);
      G.Battle.start({ mode: 'pvp', base: bot, name: bot.name, seed });
    };
  };

  // find a player by nickname and look at their village
  U.openPlayerSearch = function () {
    if (!G.Net.session) { U.toast(t('fbLogin')); return; }
    U.modal(t('findPlayer'), `<div class="ps-row"><input id="ps-q" maxlength="16" placeholder="${t('psPlaceholder')}" autocapitalize="off" spellcheck="false"><button class="btn primary sm" id="ps-go">🔍</button></div>
      <div class="rank" id="ps-list"><p class="center hint">${t('psHint')}</p></div>`, { cls: 'small' });
    const q = $('#ps-q'); let timer = null, seq = 0;
    const run = async () => {
      const v = q.value.trim(), my = ++seq, el = $('#ps-list');
      if (!el) return;
      if (v.length < 2) { el.innerHTML = `<p class="center hint">${t('psHint')}</p>`; return; }
      el.innerHTML = '<div class="spin"></div>';
      let rows = [];
      try { rows = await G.Net.searchPlayers(v); } catch (e) { if (my === seq && $('#ps-list')) $('#ps-list').innerHTML = `<p class="center warn">${t('err_' + (e.code || 'server'))}</p>`; return; }
      if (my !== seq || !$('#ps-list')) return;
      const me = G.Net.uid();
      $('#ps-list').innerHTML = rows.length ? rows.map((r) => `<button class="rk ps-item ${r.user_id === me ? 'me' : ''}" data-id="${r.user_id}">
          <span class="rk-u">${escHtml(r.username)}${r.vip ? ' <span class="vip-badge sm">VIP</span>' : ''}<small>${t('b_core')} ${r.core}${r.clan ? ' · ' + escHtml(r.clan) : ''}</small></span>
          <span class="rk-t">${IC.trophy}${r.trophies}</span></button>`).join('') : `<p class="center hint">${t('psNone')}</p>`;
      document.querySelectorAll('#ps-list .ps-item').forEach((b) => {
        const r = rows.find((x) => x.user_id === b.dataset.id);
        b.onclick = () => U.scoutPlayer(r);
      });
    };
    q.oninput = () => { clearTimeout(timer); timer = setTimeout(run, 350); };
    q.onkeydown = (e) => { if (e.key === 'Enter') run(); };
    $('#ps-go').onclick = run;
    setTimeout(() => q.focus(), 100);
  };
  U.scoutPlayer = async function (r) {
    U.loading(true);
    let base = null;
    try { base = await G.Net.viewBase(r.user_id); } catch (_) { base = null; }
    U.loading(false);
    const buildings = base ? G.Battle.baseFromLayout(base.layout) : [];
    if (!buildings.length) { U.toast(t('psNoBase')); return; }
    U.closeModal();
    G.Battle.start({ mode: 'scout', base: { buildings, loot: { scrap: 0, copper: 0 } }, name: r.username, trophies: r.trophies, core: base.core, vip: r.vip, clan: r.clan });
  };

  U.openRanking = async function () {
    U.modal(t('ranking'), `<div class="rank" id="rank-list"><div class="spin"></div></div>`, { cls: 'small' });
    let rows;
    try { rows = await G.Net.leaderboard(); } catch (e) { const el = $('#rank-list'); if (el) el.innerHTML = `<p class="center warn">${t('err_' + (e.code || 'server'))}</p>`; return; }
    const el = $('#rank-list');
    if (!el) return;
    const me = G.Net.profile && G.Net.profile.username;
    el.innerHTML = rows.length ? rows.map((r, i) => `<div class="rk ${r.username === me ? 'me' : ''}"><span class="rk-n">${i + 1}</span><span class="rk-u">${escHtml(r.username)}${r.vip_until && Date.parse(r.vip_until) > Date.now() ? ' <span class="vip-badge sm">VIP</span>' : ''}</span><span class="rk-t">${IC.trophy}${r.trophies}</span></div>`).join('')
      : `<p class="center hint">${t('noPlayersYet')}</p>`;
  };

  U.openDefenseLog = function (fresh) {
    const log = G.state.defLog || [];
    const ago = (iso) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
    const rows = log.map((a, i) => {
      const stars = [0, 1, 2].map((k) => `<span class="st ${k < a.stars ? 'on' : ''}">${IC.star}</span>`).join('');
      return `<div class="dl ${i < fresh ? 'new' : ''}"><div class="dl-h"><b>${escHtml(a.name)}</b><span class="l-s">${stars}</span><small>${a.pct}% · ${ago(a.at)}</small></div>
        <div class="dl-b">${a.stars > 0 ? `${t('stolen')}: ${costHtml('scrap', a.scrap)} ${costHtml('copper', a.copper)} · ${IC.trophy.replace('<svg', '<svg class="tro-ic"')} −${a.trophies}` : `<span class="ok">${t('defended')}</span> · ${IC.trophy.replace('<svg', '<svg class="tro-ic"')} +${-a.trophies}`}</div>
        <div class="dl-btns">${a.aid && G.Net.session ? `<button class="btn sm rpl" data-aid="${a.aid}">${IC.replay}${t('replay')}</button>` : ''}${a.aid && !a.rev && G.Net.session && Date.now() - new Date(a.at).getTime() < 86400000 ? `<button class="btn sm primary rev" data-aid="${a.aid}">${IC.sword}${t('revenge')}</button>` : ''}</div></div>`;
    }).join('');
    const sh = Math.ceil(((G.state.shieldUntil || 0) - Date.now()) / 1000);
    U.modal(fresh ? t('youWereAttacked') : t('defenseLog'), (sh > 0 ? `<p class="hint shield-note">${IC.shield} ${t('shieldFor', { t: G.fmtTime(sh) })}</p>` : '')
      + (log.length ? `<div class="levels">${rows}</div>` : `<p class="center hint">${t('noDefenses')}</p>`), { cls: 'small' });
    document.querySelectorAll('#modal .rev').forEach((b) => { b.onclick = () => U.revenge(+b.dataset.aid); });
    document.querySelectorAll('#modal .rpl').forEach((b) => { b.onclick = () => U.watchReplay(+b.dataset.aid); });
    U.refreshHud();
  };
  // attack back whoever raided us (once per attack, within 24 h)
  U.revenge = async function (aid) {
    if (!G.Battle.hasAnything()) { U.toast(t('armyEmpty')); return; }
    U.loading(true);
    let opp = null, err = null;
    try { opp = await G.Net.revengeTarget(aid); } catch (e) { err = e; }
    U.loading(false);
    G.act({ c: 'revenged', aid });
    if (err || !opp) { U.toast(t(/expired/i.test(err && err.message) ? 'revengeExpired' : /used/i.test(err && err.message) ? 'revengeUsed' : 'revengeNone')); U.openDefenseLog(0); return; }
    const buildings = G.Battle.baseFromLayout(opp.layout);
    U.closeModal();
    G.Battle.start({ mode: 'pvp', base: { buildings, loot: { scrap: opp.loot_scrap, copper: opp.loot_copper } }, name: opp.username, defender: opp.user_id, trophies: opp.trophies, revenge: true });
  };
  U.openCampaign = function () {
    const s = G.state;
    const rows = G.PVE.map((L, i) => {
      const n = i + 1, rec = s.pve[n] || { stars: 0, taken: { scrap: 0, copper: 0 } };
      const unlocked = n === 1 || (s.pve[n - 1] && s.pve[n - 1].stars > 0);
      const stars = [0, 1, 2].map((k) => `<span class="st ${k < rec.stars ? 'on' : ''}">${IC.star}</span>`).join('');
      return `<div class="lvl ${unlocked ? '' : 'locked'} ${L.boss ? 'boss' : ''}"><div class="l-n">${n}</div><div class="l-b"><div class="c-name">${L.boss ? '<span class="boss-tag">BOSS</span> ' : ''}${t('pve_' + n)}</div>
        <div class="l-s">${stars}</div><div class="l-loot">${t('remainingLoot')}: ${costHtml('scrap', L.loot.scrap - rec.taken.scrap)} ${costHtml('copper', L.loot.copper - rec.taken.copper)}</div></div>
        <button class="btn primary" data-l="${n}" ${unlocked ? '' : 'disabled'}>${unlocked ? IC.sword + t('attack') : t('locked')}</button></div>`;
    }).join('');
    U.modal(t('campaign'), `<div class="levels">${rows}</div>`, { cls: 'wide' });
    document.querySelectorAll('#modal .lvl .btn').forEach((b) => {
      b.onclick = () => {
        if (!G.Battle.hasAnything()) { U.toast(t('armyEmpty')); return; }
        const n = +b.dataset.l, L = G.PVE[n - 1];
        U.closeModal();
        G.Battle.start({ mode: 'pve', level: n, base: { buildings: G.genBase(L, L.seed), loot: L.loot, hpMul: L.hpMul }, name: t('pve_' + n) });
      };
    });
  };

  // ---------- daily reward + daily missions ----------
  const rewardTxt = (g, units) => {
    const parts = [];
    if (g && g.scrap) parts.push(`+${G.fmt(g.scrap)} ${t('scrap').toLowerCase()}`);
    if (g && g.copper) parts.push(`+${G.fmt(g.copper)} ${t('copper').toLowerCase()}`);
    for (const u in units || {}) parts.push(`+${units[u]} ${t('u_' + u)}`);
    return parts.join(', ');
  };
  U.openQuests = function () {
    const draw = () => {
      const s = G.state, now = Date.now(), ds = G.Econ.dailyState(s, now);
      const capS = G.refCap(G.coreLevel()), capC = capS;
      const days = G.DAILY.map((D, i) => {
        const n = i + 1, past = ds.claimable ? n < ds.day : n <= ds.day, cur = ds.claimable && n === ds.day;
        const units = Object.keys(D.units || {}).map((u) => `<img src="${G.Art.unitThumb(u)}" alt="">×${D.units[u]}`).join('');
        return `<div class="dday ${past ? 'got' : ''} ${cur ? 'cur' : ''}"><div class="dd-n">${t('dayN', { n })}</div>
          <div class="dd-r">${resIc('scrap')}${G.fmt(Math.floor(capS * D.pct))}</div><div class="dd-r">${resIc('copper')}${G.fmt(Math.floor(capC * D.pct))}</div>
          ${units ? `<div class="dd-u">${units}</div>` : ''}${past ? `<div class="dd-ok">${IC.check}</div>` : ''}</div>`;
      }).join('');
      const ms = G.Econ.missions(s, now).map((m, i) => {
        const done = m.n >= m.goal, pct = Math.min(100, m.n / m.goal * 100);
        return `<div class="mis ${m.got ? 'got' : ''}"><div class="mis-b"><b>${t('mis_' + m.id, { n: G.fmt(m.goal) })}</b>
          <div class="mis-bar"><i style="width:${pct}%"></i><span>${G.fmt(m.n)} / ${G.fmt(m.goal)}</span></div></div>
          ${m.got ? `<span class="ok">${t('claimed')}</span>` : `<button class="btn sm ${done ? 'primary' : ''}" data-m="${i}" ${done ? '' : 'disabled'}>${t('claim')}</button>`}</div>`;
      }).join('');
      const resetIn = Math.ceil((Date.parse(G.Econ.today(now) + 'T00:00:00Z') + 86400000 - now) / 1000);
      // achievements: 3 tiers each, the next tier shows its progress
      const ach = G.ACH.map((a) => {
        const got = (s.ach && s.ach[a.id]) | 0, v = G.Econ.achValue(s, a.id), max = got >= a.tiers.length, goal = a.tiers[Math.min(got, a.tiers.length - 1)];
        const done = !max && v >= goal, pct = max ? 100 : Math.min(100, v / goal * 100);
        const st = [0, 1, 2].map((k) => `<span class="st ${k < got ? 'on' : ''}">${IC.star}</span>`).join('');
        return `<div class="mis ach ${max ? 'got' : ''}"><div class="mis-b"><b>${t('ach_' + a.id, { n: G.fmt(goal) })} <span class="l-s">${st}</span></b>
          <div class="mis-bar"><i style="width:${pct}%"></i><span>${G.fmt(Math.min(v, goal))} / ${G.fmt(goal)}</span></div></div>
          ${max ? `<span class="ok">MAX</span>` : `<div class="ach-r"><small>${rwHtml({ res: G.ACH_RW[got], plasma: got === 2 ? G.ACH_PLASMA : 0 })}</small><button class="btn sm ${done ? 'primary' : ''}" data-a="${a.id}" ${done ? '' : 'disabled'}>${t('claim')}</button></div>`}</div>`;
      }).join('');
      return `<div class="sec-h">${t('dailyReward')}</div>
        <div class="days">${days}</div>
        <div class="row-btns"><button class="btn primary" id="q-daily" ${ds.claimable ? '' : 'disabled'}>${ds.claimable ? t('claimDay', { n: ds.day }) : t('dailyCome')}</button></div>
        <div class="sec-h">${t('dailyMissions')} <small class="hint">· ${t('newIn', { t: G.fmtTime(resetIn) })}</small></div>
        <p class="hint mis-rw">${t('missionReward', { p: Math.round(G.MISSION_REWARD * 100) })}</p>${ms}
        <div class="sec-h">${t('achievements')}</div>${ach}`;
    };
    const bind = () => {
      const d = $('#q-daily');
      if (d) d.onclick = () => {
        const r = G.act({ c: 'daily' });
        if (r.err) { U.toast(t(r.err)); return; }
        G.Sfx.play('star'); U.notify(t('dayGot', { n: r.day }) + ' ' + rewardTxt(r.gained, r.units));
        refresh(); U.refreshHud();
      };
      document.querySelectorAll('#modal .mis .btn').forEach((b) => {
        b.onclick = () => {
          const r = G.act({ c: 'mission', i: +b.dataset.m });
          if (r.err) { U.toast(t(r.err)); return; }
          G.Sfx.play('collect'); U.notify(rewardTxt(r.gained));
          refresh(); U.refreshHud();
        };
      });
      document.querySelectorAll('#modal [data-a]').forEach((b) => {
        b.onclick = () => {
          const r = G.act({ c: 'achClaim', id: b.dataset.a });
          if (r.err) { U.toast(t(r.err)); return; }
          G.Sfx.play('star'); U.notify(claimNote(r));
          refresh(); U.refreshHud();
        };
      });
    };
    const refresh = () => { const b = $('#modal .panel-b'); if (!b) return; const st = b.scrollTop; b.innerHTML = draw(); b.scrollTop = st; bind(); };
    U.modal(t('quests'), draw(), { cls: 'wide' });
    bind();
  };
  // ---------- rewards described from their definition (pass tiers, leagues, achievements) ----------
  const rwHtml = (rw) => {
    const ref = G.refCap(G.coreLevel()), parts = [];
    if (rw.res) parts.push(`${resIc('scrap')}${resIc('copper')}${G.fmt(Math.floor(ref * rw.res))}`);
    if (rw.plasma) parts.push(`${resIc('plasma')}${G.fmt(rw.plasma)}`);
    if (rw.item) parts.push(`<span class="itm">${IC['bo_' + rw.item]}${rw.n > 1 ? '×' + rw.n : ''}</span>`);
    return parts.join(' ');
  };
  const claimNote = (r) => {
    const p = [];
    if (r.gained && (r.gained.scrap || r.gained.copper)) p.push(`+${G.fmt(r.gained.scrap)} / +${G.fmt(r.gained.copper)}`);
    if (r.plasma) p.push(`+${G.fmt(r.plasma)} ${t('plasma').toLowerCase()}`);
    if (r.item) p.push(t('bo_' + r.item));
    return p.join(', ');
  };

  // ---------- leagues & seasons ----------
  U.openLeague = function () {
    const s = G.state, now = Date.now(); G.Econ.season(s, now);
    const cur = G.leagueOf(s.trophies | 0), end = G.Econ.seasonEnd(now);
    const rows = G.LEAGUES.map((L, i) => `<div class="lg ${i === cur ? 'cur' : ''} lg-${L.id}"><span class="lg-badge">${IC.trophy}</span><div class="lg-b"><b>${t('lg_' + L.id)}</b><small>${IC.trophy.replace('<svg', '<svg class="tro-ic"')} ${L.min}+ · ${t('lgBonus', { p: Math.round(L.bonus * 100) })}</small></div><div class="lg-r">${rwHtml(L.reward)}</div></div>`).join('');
    const rw = s.seasonReward;
    U.modal(t('leagues'), `<p class="hint">${t('lgHint')}</p>
      ${rw ? `<div class="vip-box on"><div><b>${t('seasonEnded', { l: t('lg_' + G.LEAGUES[rw.league].id) })}</b><small>${rwHtml(G.LEAGUES[rw.league].reward)}</small></div><button class="btn primary sm" id="lg-claim">${t('claim')}</button></div>` : ''}
      <div class="sec-h">${t('seasonEnds', { t: G.fmtTime((end - now) / 1000) })}</div><div class="lg-list">${rows}</div>`, { cls: 'small' });
    if ($('#lg-claim')) $('#lg-claim').onclick = () => { const r = G.act({ c: 'seasonClaim' }); if (r.err) U.toast(t(r.err)); else { G.Sfx.play('star'); U.notify(claimNote(r)); } U.refreshHud(); U.openLeague(); };
  };

  // ---------- season pass ----------
  U.openPass = function () {
    const draw = () => {
      const s = G.state, now = Date.now(); G.Econ.season(s, now);
      const P = s.pass, tier = G.Econ.passTier(s), xpIn = P.xp % G.PASS.xpPer, end = G.Econ.seasonEnd(now);
      const rows = [];
      for (let i = 1; i <= G.PASS.tiers; i++) {
        const fr = G.PASS_FREE[i - 1], pr = G.PASS_PREM[i - 1], open = i <= tier;
        const fb = P.free.includes(i) ? `<span class="ok">✓</span>` : `<button class="btn sm ${open ? 'primary' : ''}" data-pc="${i}" ${open ? '' : 'disabled'}>${t('claim')}</button>`;
        const pb = P.prem.includes(i) ? `<span class="ok">✓</span>` : `<button class="btn sm ${open && P.premium ? 'primary' : ''}" data-pp="${i}" ${open && P.premium ? '' : 'disabled'}>${P.premium ? t('claim') : '🔒'}</button>`;
        rows.push(`<div class="ps ${open ? 'open' : ''}"><div class="ps-n">${i}</div><div class="ps-f">${rwHtml(fr)}${fb}</div><div class="ps-p">${rwHtml(pr)}${pb}</div></div>`);
      }
      return `<div class="ps-head"><div><b>${t('passTier', { n: tier, m: G.PASS.tiers })}</b><div class="mis-bar"><i style="width:${tier >= G.PASS.tiers ? 100 : xpIn / G.PASS.xpPer * 100}%"></i><span>${tier >= G.PASS.tiers ? 'MAX' : xpIn + ' / ' + G.PASS.xpPer + ' XP'}</span></div>
          <small class="hint">${t('passXpHint')} · ${t('seasonEnds', { t: G.fmtTime((end - now) / 1000) })}</small></div>
          ${P.premium ? `<span class="vip-badge">PREMIUM</span>` : `<button class="btn primary" id="ps-buy">${t('passBuy')} · ${escHtml(G.Pay.priceOf({ id: G.PASS.id, price: G.PASS.price }))}</button>`}</div>
        <div class="ps-cols"><span></span><span>${t('passFree')}</span><span>${t('passPrem')}</span></div><div class="ps-list">${rows.join('')}</div>`;
    };
    const bind = () => {
      const claim = (i, prem) => { const r = G.act({ c: 'passClaim', i, prem }); if (r.err) U.toast(t(r.err)); else { G.Sfx.play('collect'); U.notify(claimNote(r)); } refresh(); U.refreshHud(); };
      document.querySelectorAll('#modal [data-pc]').forEach((b) => { b.onclick = () => claim(+b.dataset.pc, false); });
      document.querySelectorAll('#modal [data-pp]').forEach((b) => { b.onclick = () => claim(+b.dataset.pp, true); });
      if ($('#ps-buy')) $('#ps-buy').onclick = async () => {
        if (!G.Pay.available()) { U.toast(t('iapOnlyAppShort')); return; }
        U.loading(true); const r = await G.Pay.buyPass(); U.loading(false);
        if (r.ok) { G.Sfx.play('star'); U.notify(t('passThanks')); } else if (r.err !== 'iapCancel') U.toast(t(r.err));
        refresh();
      };
    };
    const refresh = () => { const b = $('#modal .panel-b'); if (!b) return; const st = b.scrollTop; b.innerHTML = draw(); b.scrollTop = st; bind(); };
    U.modal(t('pass'), draw(), { cls: 'wide' });
    bind();
  };

  // ---------- boosts (in the chip shop) ----------
  U.boostsHtml = function () {
    const s = G.state, now = Date.now();
    return G.Econ && Object.keys(G.BOOSTS).map((k) => {
      const d = G.BOOSTS[k], on = G.Econ.boostOn(s, k, now), have = (s.items && s.items[k]) || 0;
      return `<div class="bo-card"><div class="bo-ic">${IC['bo_' + k]}</div><div class="bo-b"><b>${t('bo_' + k)}</b><small>${t('bod_' + k)}</small>
        ${on ? `<small class="ok">${t('boActive', { t: G.fmtTime((s.boost[k] - now) / 1000) })}</small>` : ''}</div>
        <div class="bo-btns">${have ? `<button class="btn sm primary" data-bi="${k}">${t('boUse')} (${have})</button>` : ''}<button class="btn sm" data-bc="${k}">${costHtml('chips', d.chips, s.res.chips >= d.chips)}</button></div></div>`;
    }).join('');
  };
  U.bindBoosts = function (after) {
    const go = (k, item) => {
      const fire = () => { const r = G.act({ c: 'boost', k, item }); if (r.err) U.toast(t(r.err)); else { G.Sfx.play('star'); U.notify(t('boOn', { n: t('bo_' + k) })); } U.refreshHud(); after(); };
      if (item) fire(); else U.confirm(t('boBuyQ', { n: t('bo_' + k), c: G.BOOSTS[k].chips }), fire);
    };
    document.querySelectorAll('#modal [data-bi]').forEach((b) => { b.onclick = () => go(b.dataset.bi, true); });
    document.querySelectorAll('#modal [data-bc]').forEach((b) => { b.onclick = () => go(b.dataset.bc, false); });
  };

  // after logging in: show the daily reward once if it's waiting (not during the tutorial)
  U.maybeDaily = function () {
    setTimeout(() => {
      if (G.scene !== G.Village || U.isModal() || (G.Tut && G.Tut.active && G.Tut.active())) return;
      G.Econ.season(G.state, Date.now());
      if (G.state.seasonReward) U.openLeague();
      else if (G.Econ.dailyState(G.state, Date.now()).claimable) U.openQuests();
    }, 1500);
  };

  // ---------- report a bug / idea ----------
  U.openFeedback = function () {
    if (!G.Net.session) { U.toast(t('fbLogin')); return; }
    let kind = 'bug';
    U.modal(t('fbTitle'), `
      <p class="hint">${t('fbHint')}</p>
      <div class="seg fb-kind"><button data-k="bug" class="on">🐞 ${t('fbBug')}</button><button data-k="idea">💡 ${t('fbIdea')}</button><button data-k="other">💬 ${t('fbOther')}</button></div>
      <textarea id="fb-text" class="fb-text" maxlength="1000" placeholder="${t('fbPlaceholder')}"></textarea>
      <div class="fb-cnt"><span id="fb-n">0</span>/1000</div>
      <div class="row-btns"><button class="btn primary" id="fb-send">${t('fbSend')}</button></div>`, { cls: 'small' });
    document.querySelectorAll('#modal .fb-kind button').forEach((b) => {
      b.onclick = () => { kind = b.dataset.k; document.querySelectorAll('#modal .fb-kind button').forEach((x) => x.classList.toggle('on', x === b)); };
    });
    const ta = $('#fb-text');
    ta.oninput = () => { $('#fb-n').textContent = ta.value.length; };
    let busy = false;
    $('#fb-send').onclick = async () => {
      const body = ta.value.trim();
      if (body.length < 3) { U.toast(t('fbShort')); return; }
      if (busy) return;
      busy = true; U.loading(true);
      try { await G.Net.sendFeedback(kind, body); U.closeModal(); U.notify(t('fbThanks')); }
      catch (e) { U.toast(/limit/i.test(e.message || '') ? t('fbLimit') : t('err_' + (e.code || 'server'))); }
      finally { U.loading(false); busy = false; }
    };
  };

  // ---------- builder drones: what they're doing + buy one more ----------
  U.openBuilders = function () {
    const s = G.state, now = Date.now(), total = G.Econ.builders(s);
    const busy = s.buildings.filter((b) => b.busyUntil > now).sort((a, b) => a.busyUntil - b.busyUntil);
    const slots = [];
    for (let i = 0; i < G.BUILDERS_MAX; i++) {
      const b = busy[i];
      if (i < total) slots.push(`<div class="bd-slot ${b ? 'busy' : 'free'}">${IC.drone}<div><b>${t('builderN', { n: i + 1 })}</b><small>${b ? t('b_' + b.type) + ' → ' + G.fmtTime((b.busyUntil - now) / 1000) : t('builderFree')}</small></div></div>`);
      else slots.push(`<div class="bd-slot locked">${IC.drone}<div><b>${t('builderN', { n: i + 1 })}</b><small>${costHtml('chips', G.BUILDER_PRICE[i], s.res.chips >= G.BUILDER_PRICE[i])}</small></div></div>`);
    }
    const next = total < G.BUILDERS_MAX ? G.BUILDER_PRICE[total] : 0;
    U.modal(t('builders'), `<p class="hint">${t('buildersHint')}</p><div class="bd-grid">${slots.join('')}</div>
      ${next ? `<div class="row-btns"><button class="btn primary" id="bd-buy">${IC.drone} ${t('buyBuilder')} · ${costHtml('chips', next, s.res.chips >= next)}</button></div>` : `<p class="center ok">${t('buildersMax')}</p>`}`, { cls: 'small' });
    if ($('#bd-buy')) $('#bd-buy').onclick = () => {
      if (G.state.res.chips < next) { U.toast(t('noChips')); U.openChips(); return; }
      U.confirm(t('buyBuilderQ', { n: next }), () => {
        const r = G.act({ c: 'buyBuilder' });
        if (r.err) U.toast(t(r.err)); else { G.Sfx.play('built'); U.notify(t('builderBought')); }
        U.refreshHud(); U.openBuilders();
      });
    };
  };

  // ---------- blocked players (unblock) ----------
  U.openBlocked = async function () {
    U.modal(t('blockedList'), '<div class="rank" id="bl-list"><div class="spin"></div></div>', { cls: 'small' });
    const draw = async () => {
      let rows = [];
      try { rows = await G.Net.blocks(); } catch (e) { U.toast(t('err_' + (e.code || 'server'))); }
      const el = $('#bl-list'); if (!el) return;
      el.innerHTML = rows.length ? rows.map((r) => `<div class="rk"><span class="rk-u">${escHtml(r.blocked_name || '?')}</span><button class="btn sm" data-ub="${r.blocked_id}">${t('unblock')}</button></div>`).join('')
        : `<p class="center hint">${t('blockedNone')}</p>`;
      el.querySelectorAll('[data-ub]').forEach((b) => { b.onclick = async () => { try { await G.Net.unblock(b.dataset.ub); } catch (_) {} draw(); }; });
    };
    draw();
  };

  // ---------- developer: sheet of player reports (admins only; the server enforces it) ----------
  U.openReports = async function () {
    let rows = [], fKind = 'all', fStatus = 'open';
    const STAT = ['new', 'doing', 'done', 'rejected'];
    const kindIc = { bug: '🐞', idea: '💡', other: '💬', report: '🚩' };
    const fmtD = (iso) => new Date(iso).toLocaleString(G.lang === 'en' ? 'en-GB' : 'pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const draw = () => {
      const list = rows.filter((r) => (fKind === 'all' || r.kind === fKind) && (fStatus === 'all' || (fStatus === 'open' ? r.status === 'new' || r.status === 'doing' : r.status === fStatus)));
      const cnt = (k) => rows.filter((r) => r.kind === k && (r.status === 'new' || r.status === 'doing')).length;
      const body = list.map((r) => `<tr class="st-${r.status}"><td>${fmtD(r.created_at)}</td><td>${escHtml(r.username || '?')}</td><td>${kindIc[r.kind] || ''}</td>
        <td class="rp-body">${escHtml(r.body)}${r.kind === 'report' ? `<div class="rp-mod">${r.target_msg ? `<button class="btn sm" data-del="${r.target_msg}">🗑 ${t('delMsg')}</button>` : ''}${r.target_user ? `<button class="btn sm danger" data-mute="${r.target_user}">🔇 ${t('mute7')}</button>` : ''}</div>` : ''}</td><td>${escHtml(r.version || '')}</td><td class="rp-dev" title="${escHtml(r.device || '')}">${escHtml((r.device || '').replace(/^.*?\(([^)]*)\).*\| /, '$1 | ').slice(0, 60))}</td>
        <td><select data-id="${r.id}">${STAT.map((s) => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${t('rs_' + s)}</option>`).join('')}</select></td></tr>`).join('');
      const b = $('#modal .panel-b'); if (!b) return;
      b.innerHTML = `<div class="rp-bar">
          <div class="seg rp-kind">${['all', 'bug', 'idea', 'other', 'report'].map((k) => `<button data-k="${k}" class="${fKind === k ? 'on' : ''}">${k === 'all' ? t('all') : kindIc[k] + ' ' + cnt(k)}</button>`).join('')}</div>
          <select id="rp-st">${['open', 'all'].concat(STAT).map((s) => `<option value="${s}" ${fStatus === s ? 'selected' : ''}>${s === 'open' ? t('rs_open') : s === 'all' ? t('all') : t('rs_' + s)}</option>`).join('')}</select>
          <button class="btn sm" id="rp-ref">↻</button><button class="btn sm" id="rp-csv">⬇ CSV</button></div>
        <div class="rp-wrap"><table class="rp"><thead><tr><th>${t('rp_date')}</th><th>${t('rp_player')}</th><th></th><th>${t('rp_text')}</th><th>${t('version')}</th><th>${t('rp_device')}</th><th>${t('rp_status')}</th></tr></thead>
        <tbody>${body || `<tr><td colspan="7" class="center hint">${t('rp_empty')}</td></tr>`}</tbody></table></div>`;
      document.querySelectorAll('#modal .rp-kind button').forEach((x) => { x.onclick = () => { fKind = x.dataset.k; draw(); }; });
      $('#rp-st').onchange = (e) => { fStatus = e.target.value; draw(); };
      $('#rp-ref').onclick = load;
      $('#rp-csv').onclick = () => {
        const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const csv = '﻿' + ['data;gracz;typ;tresc;wersja;urzadzenie;status'].concat(rows.map((r) => [r.created_at, r.username, r.kind, r.body, r.version, r.device, r.status].map(q).join(';'))).join('\r\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'cyberwar-zgloszenia-' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
      };
      document.querySelectorAll('#modal [data-del]').forEach((b) => {
        b.onclick = () => U.confirm(t('delMsgQ'), async () => { try { await G.Net.deleteMessage(+b.dataset.del); U.notify(t('done')); } catch (e) { U.toast(t('err_' + (e.code || 'server'))); } U.openReports(); });
      });
      document.querySelectorAll('#modal [data-mute]').forEach((b) => {
        b.onclick = () => U.confirm(t('muteQ'), async () => { try { await G.Net.mute(b.dataset.mute, 7); U.notify(t('done')); } catch (e) { U.toast(t('err_' + (e.code || 'server'))); } U.openReports(); });
      });
      document.querySelectorAll('#modal .rp select[data-id]').forEach((sel) => {
        sel.onchange = async () => {
          const id = +sel.dataset.id, r = rows.find((x) => x.id === id);
          try { await G.Net.feedbackUpdate(id, { status: sel.value }); r.status = sel.value; draw(); } catch (e) { U.toast(t('err_' + (e.code || 'server'))); }
        };
      });
    };
    const load = async () => {
      const b = $('#modal .panel-b'); if (b) b.innerHTML = '<div class="spin"></div>';
      try { rows = await G.Net.feedbackList() || []; } catch (e) { U.toast(t('err_' + (e.code || 'server'))); rows = []; }
      draw();
    };
    U.modal(t('reports'), '<div class="spin"></div>', { cls: 'wide' });
    load();
  };

  // ---------- settings ----------
  U.openSettings = function () {
    const esc = (v) => String(v || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    U.modal(t('settings'), `
      <div class="acct">${G.Net.session ? `<div><small>${t('loggedAs')}</small><b>${esc(G.state.name)}</b><small>${esc(G.Net.email())}</small></div>
        <button class="btn sm" id="s-logout">${t('logout')}</button>` : `<div><b>${t('offlineMode')}</b></div><button class="btn sm primary" id="s-login">${t('login')}</button>`}</div>
      <div class="fld">${t('language')}<div class="seg"><button data-l="pl" class="${G.lang === 'pl' ? 'on' : ''}">Polski</button><button data-l="en" class="${G.lang === 'en' ? 'on' : ''}">English</button></div></div>
      <div class="fld">${t('sounds')}<div class="seg" id="s-sfx"><button data-v="1" class="${G.state.settings.sfx ? 'on' : ''}">${t('on')}</button><button data-v="0" class="${G.state.settings.sfx ? '' : 'on'}">${t('off')}</button></div></div>
      ${G.Net.session ? `<div class="fld">${t('notifs')}<div class="seg" id="s-push"><button data-v="1" class="${G.Net.pushIsOn() ? 'on' : ''}">${t('on')}</button><button data-v="0" class="${G.Net.pushIsOn() ? '' : 'on'}">${t('off')}</button></div></div>` : ''}
      <div class="fld">${t('music')}<div class="seg" id="s-mus"><button data-v="1" class="${G.state.settings.music ? 'on' : ''}">${t('on')}</button><button data-v="0" class="${G.state.settings.music ? '' : 'on'}">${t('off')}</button></div></div>
      <div class="row-btns"><button class="btn primary" id="s-fb">✉ ${t('fbTitle')}</button><button class="btn" id="s-tut">${t('tutAgain')}</button>${G.Net.session ? `<button class="btn" id="s-blk">⛔ ${t('blockedList')}</button>` : ''}</div>
      <div class="row-btns"><button class="btn danger" id="s-reset">${t('reset')}</button>${G.Net.session ? `<button class="btn danger" id="s-del">${t('deleteAccount')}</button>` : ''}</div>
      <p class="hint"><a href="privacy.html" target="_blank" rel="noopener">${t('privacyPolicy')}</a> · CyberWar ${t('version')} ${G.VERSION}</p>`, { cls: 'small' });
    if ($('#s-logout')) $('#s-logout').onclick = async () => {
      try { await G.Net.flush(); } catch (_) {}
      await G.Net.signOut(); U.closeModal(); G.Auth.show('login');
    };
    if ($('#s-login')) $('#s-login').onclick = () => { U.closeModal(); G.Auth.show('login'); };
    $('#s-fb').onclick = U.openFeedback;
    document.querySelectorAll('#s-push button').forEach((b) => {
      b.onclick = async () => {
        U.loading(true);
        try {
          if (b.dataset.v === '1') { await G.Net.pushOn(); U.notify(t('notifsOn')); } else { await G.Net.pushOffNow(); }
        } catch (e) { U.toast(t(e.code === 'pushNo' ? 'pushNo' : e.code === 'pushDenied' ? 'pushDenied' : 'err_' + (e.code || 'server'))); }
        U.loading(false); U.openSettings();
      };
    });
    if ($('#s-blk')) $('#s-blk').onclick = U.openBlocked;
    // developer account: reports sheet
    G.Net.isAdmin().then((yes) => {
      const row = $('#s-fb') && $('#s-fb').parentElement;
      if (!yes || !row || $('#s-reports')) return;
      const b = document.createElement('button'); b.className = 'btn'; b.id = 's-reports'; b.textContent = '📋 ' + t('reports');
      b.onclick = U.openReports; row.appendChild(b);
    });
    if ($('#s-del')) $('#s-del').onclick = () => U.confirm(t('deleteConfirm'), async () => {
      try { await G.Net.deleteAccount(); } catch (e) { U.toast(t('err_' + (e.code || 'server'))); return; }
      try { localStorage.removeItem('cyberwar_save_v1'); localStorage.removeItem('cyberwar_had_account'); } catch (_) {}
      G.state = G.newGame(); G.state.lang = G.lang; G.save(true);
      G.Village.camInit = false; G.Village.enter(); G.Auth.show('register');
    });
    document.querySelectorAll('#modal .seg button[data-l]').forEach((b) => {
      b.onclick = () => { G.lang = b.dataset.l; G.state.lang = G.lang; G.save(); U.applyLang(); U.openSettings(); U.refreshHud(); };
    });
    const tog = (id, key) => document.querySelectorAll('#' + id + ' button').forEach((b) => {
      b.onclick = () => { G.state.settings[key] = b.dataset.v === '1'; G.save(); G.Sfx.updateMusic(); U.openSettings(); };
    });
    tog('s-sfx', 'sfx'); tog('s-mus', 'music');
    $('#s-tut').onclick = () => { G.state.tut = 0; G.Tut.replay = true; G.save(); U.closeModal(); };
    $('#s-reset').onclick = () => U.confirm(t('resetConfirm'), () => { G.resetGame(); G.Village.camInit = false; G.Village.enter(); });
  };

  // ---------- battle HUD ----------
  U.showBattle = function () {
    U.closeModal(); U.hideSel(); U.hidePlace();
    $('#hud-top').classList.add('hidden'); $('#hud-bottom').classList.add('hidden'); $('#hud-builders').classList.add('hidden');
    $('#btn-layout').classList.add('hidden'); $('#btn-quests').classList.add('hidden'); $('#btn-pass').classList.add('hidden'); $('#hud-shield').classList.add('hidden'); $('#editbar').classList.add('hidden');
    const b = G.Battle, el = $('#battle-hud');
    if (b.opts.mode === 'scout') {
      const o = b.opts;
      el.innerHTML = `<div class="bh-tl"><div class="bh-name">${escHtml(o.name)}${o.vip ? ' <span class="vip-badge sm">VIP</span>' : ''}</div>
        <div class="bh-loot">${IC.trophy.replace('<svg', '<svg class="tro-ic"')} ${o.trophies} · ${t('b_core')} ${t('level')} ${o.core}${o.clan ? ' · ' + IC.clan.replace('<svg', '<svg class="tro-ic"') + ' ' + escHtml(o.clan) : ''}</div>
        <button class="btn primary sm pe" id="bh-back">← ${t('backHome')}</button></div>
        <div class="bh-hint">${t('scoutHint')}</div>`;
      el.classList.remove('hidden');
      $('#bh-back').onclick = () => { G.Village.enter(); };
      return;
    }
    if (b.opts.mode === 'replay') {
      el.innerHTML = `<div class="bh-tl"><div class="bh-name">${IC.replay.replace('<svg', '<svg class="tro-ic"')} ${t('replay')}: ${escHtml(b.opts.name)}</div>
          <div class="row-btns pe"><button class="btn primary sm" id="bh-back">← ${t('backHome')}</button><button class="btn sm" id="bh-fast">x1</button></div></div>
        <div class="bh-tr"><div class="bh-time" id="bh-time">3:00</div><div class="bh-pct"><span id="bh-pct">0%</span><span class="bh-stars" id="bh-stars"></span></div></div>`;
      el.classList.remove('hidden');
      $('#bh-back').onclick = () => { G.Village.enter(); };
      $('#bh-fast').onclick = () => { b.rp.fast = !b.rp.fast; $('#bh-fast').textContent = b.rp.fast ? 'x2' : 'x1'; };
      return;
    }
    const loot = b.opts.mode === 'pve' ? (() => { const L = G.PVE[b.opts.level - 1], rec = G.state.pve[b.opts.level]; const tk = rec ? rec.taken : { scrap: 0, copper: 0 }; return { scrap: L.loot.scrap - tk.scrap, copper: L.loot.copper - tk.copper }; })() : b.opts.base.loot;
    el.innerHTML = `
      <div class="bh-tl"><div class="bh-name">${escHtml(b.opts.name)}${b.opts.mode === 'pvp' && !b.opts.defender ? ' <small>(bot)</small>' : ''}${b.opts.defender ? ` <small>${IC.trophy.replace('<svg', '<svg class="tro-ic"')} ${b.opts.trophies}</small>` : ''}</div>
        <div class="bh-loot">${t('loot')}: ${costHtml('scrap', loot.scrap)} ${costHtml('copper', loot.copper)}</div>
        <button class="btn danger sm pe" id="bh-end">${t('endBattle')}</button></div>
      <div class="bh-tr"><div class="bh-time" id="bh-time">3:00</div><div class="bh-pct"><span id="bh-pct">0%</span><span class="bh-stars" id="bh-stars"></span></div></div>
      <div class="bh-hint" id="bh-hint">${t('deployHint')}</div>
      <div class="bh-cards pe" id="bh-cards"></div>`;
    el.classList.remove('hidden');
    $('#bh-end').onclick = () => G.Battle.finish();
    U.battleCards();
  };
  U.battleCards = function () {
    const b = G.Battle, el = $('#bh-cards');
    if (!el) return;
    let html = '';
    for (const u of G.UNIT_ORDER) {
      if (!(G.state.army[u] > 0 || b.units.some((x) => x.type === u))) continue;
      html += `<button class="bc ${b.sel === u ? 'sel' : ''} ${b.avail[u] > 0 ? '' : 'empty'}" data-u="${u}"><img src="${G.Art.unitThumb(u)}" alt=""><span class="bc-n">x${b.avail[u]}</span></button>`;
    }
    // units donated by clan mates
    for (const u of G.UNIT_ORDER) {
      if (!((G.state.clanArmy && G.state.clanArmy[u] > 0) || b.usedClan[u] > 0)) continue;
      html += `<button class="bc clanu ${b.sel === 'c:' + u ? 'sel' : ''} ${b.availClan[u] > 0 ? '' : 'empty'}" data-cu="${u}"><img src="${G.Art.unitThumb(u)}" alt=""><span class="bc-n">x${b.availClan[u] || 0}</span></button>`;
    }
    // battle programs
    for (const k of G.SPELL_ORDER) {
      if (!((G.state.spells && G.state.spells[k] > 0) || (b.usedSpells && b.usedSpells[k] > 0))) continue;
      html += `<button class="bc spell ${b.sel === 's:' + k ? 'sel' : ''} ${b.availSpells[k] > 0 ? '' : 'empty'}" data-sp="${k}" style="--sc:${G.SPELLS[k].color}">${IC['sp_' + k]}<span class="bc-n">x${b.availSpells[k] || 0}</span></button>`;
    }
    for (const h of Object.keys(b.heroes)) {
      const hs = b.heroes[h];
      const ab = hs.state === 'deployed' && hs.unit && !hs.unit.dead;
      html += `<button class="bc hero ${b.sel === h ? 'sel' : ''} ${hs.state === 'ready' || ab ? '' : 'empty'} ${ab && hs.abil === 'ready' ? 'abil' : ''}" data-h="${h}"><img src="${G.Art.unitThumb(h)}" alt="">
        <span class="bc-n">${hs.state === 'ready' ? t('h_' + h) : (ab ? (hs.abil === 'ready' ? '⚡⚡⚡' : t('used')) : '✖')}</span></button>`;
    }
    el.innerHTML = html;
    el.querySelectorAll('.bc').forEach((c) => {
      c.onclick = () => {
        if (c.dataset.u) { if (b.avail[c.dataset.u] > 0) b.sel = c.dataset.u; }
        else if (c.dataset.cu) { if (b.availClan[c.dataset.cu] > 0) b.sel = 'c:' + c.dataset.cu; }
        else if (c.dataset.sp) { if (b.availSpells[c.dataset.sp] > 0) b.sel = 's:' + c.dataset.sp; }
        else {
          const h = c.dataset.h, hs = b.heroes[h];
          if (hs.state === 'ready') b.sel = h;
          else G.Battle.useAbility(h);
        }
        U.battleCards();
      };
    });
  };
  // end of a replay: the result, watch again or go home
  U.replayDone = function (r) {
    const o = G.Battle.opts;
    U.modal(t('replay'), `<div class="res-stars">${U.starBar(r.pct, true)}</div>
      <div class="res-pct">${escHtml(o.name)} · ${t('destruction')}: <b>${Math.round(r.pct * 100)}%</b></div>
      <div class="row-btns"><button class="btn" id="rp-again">${IC.replay}${t('replayAgain')}</button><button class="btn primary" id="r-home">${t('returnHome')}</button></div>`, { cls: 'small', noClose: true });
    $('#r-home').onclick = () => { U.closeModal(); G.Village.enter(); };
    $('#rp-again').onclick = () => { U.closeModal(); G.Battle.start(o); };
  };
  U.watchReplay = async function (aid) {
    U.loading(true);
    let rp = null;
    try { rp = await G.Net.replay(aid); } catch (_) {}
    U.loading(false);
    if (!rp || !Array.isArray(rp.ev) || !Array.isArray(rp.base)) { U.toast(t('replayNone')); return; }
    U.closeModal();
    G.Battle.start({ mode: 'replay', base: { buildings: G.Battle.baseFromLayout(rp.base), loot: { scrap: 0, copper: 0 } }, name: rp.name, replay: rp });
  };
  U.setResultTrophies = function (delta) {
    const el = $('#res-tro');
    if (el) el.textContent = delta == null ? t('err_server') : (delta >= 0 ? '+' : '') + delta;
  };
  U.showResult = function (r) {
    const stars = U.starBar(r.pct, true);
    const win = r.stars > 0;
    U.modal(win ? t('victory') : t('defeat'), `
      <div class="res-stars">${stars}</div>
      <div class="res-pct">${t('destruction')}: <b>${Math.round(r.pct * 100)}%</b></div>
      <div class="res-loot">${t('loot')}: <span class="cost">${resIc('scrap')}<b data-count="${r.gained.scrap}">0</b></span> <span class="cost">${resIc('copper')}<b data-count="${r.gained.copper}">0</b></span> ${r.chips ? `<span class="cost">${resIc('chips')}<b data-count="${r.chips}">0</b></span>` : ''}</div>
      ${r.mode === 'pvp' ? (r.bot ? `<p class="hint">${t('botNoTrophies')}</p>` : `<div class="res-tro">${IC.trophy} <span id="res-tro">${r.trophies == null ? '…' : (r.trophies >= 0 ? '+' : '') + r.trophies}</span></div>`) : ''}
      <div class="row-btns"><button class="btn primary" id="r-home">${t('returnHome')}</button></div>`, { cls: 'small result ' + (win ? 'win' : 'lose'), noClose: true });
    $('#r-home').onclick = () => { U.closeModal(); G.Village.enter(); };
    // stars pop in one by one with a chime, loot counts up
    for (let k = 0; k < r.stars; k++) setTimeout(() => G.Sfx.play('star'), 350 * k + 200);
    const t0 = performance.now();
    const els = [...document.querySelectorAll('#modal [data-count]')];
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1200), e = 1 - Math.pow(1 - p, 3);
      els.forEach((el) => { el.textContent = G.fmt(+el.dataset.count * e); });
      if (p < 1 && els.length && document.body.contains(els[0])) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---------- per-frame updates ----------
  let acc = 0;
  U.frame = function (dt) {
    acc += dt;
    if (G.scene === G.Battle) {
      const b = G.Battle;
      const tt = Math.max(0, Math.ceil(b.time));
      const te = $('#bh-time'); if (te) { te.textContent = Math.floor(tt / 60) + ':' + String(tt % 60).padStart(2, '0'); te.classList.toggle('low', tt <= 30); }
      const r = b.result();
      const pe = $('#bh-pct'); if (pe) pe.textContent = Math.round(r.pct * 100) + '%';
      const pk = String(Math.round(r.pct * 100));
      const se = $('#bh-stars'); if (se && se.dataset.n !== pk) { se.dataset.n = pk; se.innerHTML = U.starBar(r.pct, false); }
      const hint = $('#bh-hint'); if (hint && b.deployed > 0) hint.remove();
      if (acc > 0.5) { acc = 0; const heroDead = Object.values(b.heroes).some((h) => h.unit && h.unit.dead && !h.deadShown); if (heroDead) { Object.values(b.heroes).forEach((h) => { if (h.unit && h.unit.dead) h.deadShown = true; }); U.battleCards(); } }
      return;
    }
    if (acc < 0.25) return;
    acc = 0;
    U.refreshHud();
    const sel = G.Village.sel;
    if (sel && !$('#selbar').classList.contains('hidden')) {
      const tm = $('#sb-time');
      if (tm) {
        if (sel.busyUntil > Date.now()) { tm.textContent = G.fmtTime((sel.busyUntil - Date.now()) / 1000); const fc = $('#sb-fc'); if (fc) fc.textContent = G.finishCost(sel); }
        else U.showSel(sel);
      }
      const ac = $('#sb-acc'); if (ac) ac.textContent = Math.floor(sel.acc);
    }
    if (U.modalRefresh && (G.state.queue.length || G.state.research || (G.state.sQueue && G.state.sQueue.length) || G.state.heroUp)) U.modalRefresh();
  };
})();
