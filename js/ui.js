// DOM user interface: HUD, panels, shop, army, campaign, battle HUD, results.
(function () {
  const U = G.UI = {};
  const B = G.BUILDINGS;
  const $ = (s, el) => (el || document).querySelector(s);
  const t = (k, p) => G.t(k, p);

  const IC = {
    scrap: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#ff8a1f" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.6"/><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.5 2.5M16.2 16.2l2.5 2.5M5.3 18.7l2.5-2.5M16.2 7.8l2.5-2.5"/></g></svg>',
    copper: '<svg viewBox="0 0 24 24"><path d="M3.5 15.5l4-7.5h9l4 7.5-3.5 3.5h-10z" fill="#d9783a" stroke="#ffb37a" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 12h8" stroke="#ffd2ad" stroke-width="1.4"/></svg>',
    chips: '<svg viewBox="0 0 24 24"><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" stroke="#19f0ff" stroke-width="2" stroke-linecap="round"/><rect x="6" y="6" width="12" height="12" rx="2" fill="#19f0ff"/><rect x="9.3" y="9.3" width="5.4" height="5.4" fill="#07060f"/></svg>',
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
    drone: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#ffe14d" stroke-width="1.8"><rect x="8" y="9" width="8" height="6" rx="2"/><path d="M8 10L4 7M16 10l4-3M8 14l-4 3M16 14l4 3"/></g><circle cx="12" cy="12" r="1.3" fill="#ff3355"/></svg>',
  };
  U.IC = IC;
  const resIc = (r) => '<i class="ri">' + IC[r] + '</i>';
  const escHtml = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  U.init = function () {
    const ui = $('#ui');
    ui.innerHTML = `
      <div id="hud-top">
        <div class="player pe" id="btn-profile"><div class="pl-name" id="pl-name"></div><div class="pl-tro">${IC.trophy}<span id="pl-tro">0</span></div></div>
        <div class="res-wrap">
          ${['scrap', 'copper', 'chips'].map((r) => `<div class="res" data-r="${r}"><i>${IC[r]}</i><div class="bar"><b></b></div><span class="v"></span><span class="cap"></span></div>`).join('')}
        </div>
        <button class="icon-btn pe" id="btn-set" aria-label="settings">${IC.gear}</button>
      </div>
      <div id="hud-builders" class="chip-info">${IC.drone}<span id="builders-v"></span></div>
      <div id="hud-bottom">
        <button class="btn-attack pe" id="btn-attack">${IC.sword}<span data-t="attack"></span></button>
        <div class="hb-right">
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
    $('#btn-attack').onclick = U.openAttack;
    $('#btn-set').onclick = U.openSettings;
    $('#btn-profile').onclick = U.openSettings;
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
    $('#battle-hud').classList.add('hidden'); $('#battle-hud').innerHTML = '';
    U.hideSel(); U.hidePlace(); U.closeModal();
    U.refreshHud();
  };
  U.refreshHud = function () {
    const s = G.state;
    $('#pl-name').textContent = s.name;
    $('#pl-tro').textContent = s.trophies;
    for (const r of ['scrap', 'copper', 'chips']) {
      const el = $('.res[data-r="' + r + '"]');
      const cap = G.capOf(r), v = s.res[r];
      $('.v', el).textContent = G.fmt(v);
      $('.cap', el).textContent = r === 'chips' ? '' : '/ ' + G.fmt(cap);
      $('.bar b', el).style.width = r === 'chips' ? '100%' : Math.min(100, v / cap * 100) + '%';
      el.classList.toggle('full', r !== 'chips' && v >= cap);
    }
    $('#builders-v').textContent = (G.BUILDERS - G.buildersBusy()) + '/' + G.BUILDERS;
  };

  // ---------- selection bar ----------
  U.showSel = function (b) {
    const el = $('#selbar'), d = B[b.type], now = Date.now();
    const busy = b.busyUntil > now;
    let status = '';
    if (busy) status = `<div class="sb-status">${t(b.level === 0 ? 'building' : 'upgrading')} · <b id="sb-time">${G.fmtTime((b.busyUntil - now) / 1000)}</b></div>`;
    else if (d.prod && b.level > 0) status = `<div class="sb-status">${t('stored')}: <b id="sb-acc">${Math.floor(b.acc)}</b> / ${d.cap[b.level - 1]}</div>`;
    const btn = (id, ic, label, extra) => `<button class="sb-btn" id="${id}"><span class="sb-ic">${ic}</span><span class="sb-l">${label}</span>${extra || ''}</button>`;
    let btns = btn('sb-info', IC.info, t('info'));
    if (!busy) {
      const u = G.upgradeInfo(b);
      if (!u.max) btns += btn('sb-up', IC.up, t('upgrade'), `<span class="sb-c">${resIc(u.res)}${G.fmt(u.cost)}</span>`);
    } else {
      btns += btn('sb-fin', IC.bolt, t('finish'), `<span class="sb-c">${resIc('chips')}<span id="sb-fc">${G.finishCost(b)}</span></span>`);
    }
    if (b.type !== 'core' || true) btns += btn('sb-move', IC.move, t('move'));
    if (d.prod && b.level > 0) btns += btn('sb-col', IC[d.prod], t('collect'));
    if ((b.type === 'factory' || b.type === 'squadhq') && b.level > 0) btns += btn('sb-army', IC.army, t('army'));
    el.innerHTML = `<div class="sb-title">${t('b_' + b.type)} <small>${b.level > 0 ? t('level') + ' ' + b.level : ''}</small></div>${status}<div class="sb-btns">${btns}</div>`;
    el.classList.remove('hidden');
    el.dataset.id = b.id;
    $('#sb-info').onclick = () => U.openInfo(b);
    if ($('#sb-up')) $('#sb-up').onclick = () => U.openUpgrade(b);
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
    $('#hud-bottom').classList.add('dim');
  };
  U.hideSel = function () { $('#selbar').classList.add('hidden'); $('#hud-bottom').classList.remove('dim'); };

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
    const v = (arr, l) => (arr && l > 0 ? arr[l - 1] : '-');
    row(t('hp'), v(d.hp, lv), nextLv && v(d.hp, nextLv));
    if (d.prod) { row(t('production'), v(d.rate, lv), nextLv && v(d.rate, nextLv)); row(t('storage'), v(d.cap, lv), nextLv && v(d.cap, nextLv)); }
    if (d.store) row(t('storage'), G.fmt(v(d.store, lv)), nextLv && G.fmt(v(d.store, nextLv)));
    if (d.housing) row(t('capacity'), v(d.housing, lv), nextLv && v(d.housing, nextLv));
    if (d.dmg) { row(t('damage'), v(d.dmg, lv), nextLv && v(d.dmg, nextLv)); row(t('range'), d.range, d.range); }
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
       ${u.blocked ? `<p class="warn">${t('needCore', { n: u.needCore })}</p>` : ''}</div></div>
       ${statRows(b.type, b.level, u.next)}
       <div class="row-btns"><button class="btn primary" id="u-go" ${u.blocked ? 'disabled' : ''}>${IC.up}${t('upgrade')}</button></div>`);
    $('#u-go').onclick = () => {
      const e = G.startUpgrade(b);
      if (e) { U.toast(e); return; }
      U.closeModal(); U.showSel(b); U.refreshHud();
    };
  };

  // ---------- shop ----------
  U.openShop = function () {
    const core = G.coreLevel();
    const cards = G.SHOP.map((type) => {
      const d = B[type], n = G.countType(type), lim = G.LIMITS[type][core - 1];
      const nextLim = G.LIMITS[type].findIndex((l) => l > n);
      const locked = n >= lim;
      return `<button class="card ${locked ? 'locked' : ''}" data-type="${type}">
        <img src="${G.Art.buildThumb(type, 1)}" alt="">
        <div class="c-name">${t('b_' + type)}</div>
        <div class="c-cnt">${n}/${lim}</div>
        ${locked ? `<div class="c-lock">${nextLim >= 0 ? t('needCore', { n: nextLim + 1 }) : t('maxLevel')}</div>` :
          `<div class="c-cost">${costHtml(d.res, d.cost[0], G.state.res[d.res] >= d.cost[0])}</div><div class="c-time">${d.time[0] ? G.fmtTime(d.time[0]) : t('instant')}</div>`}
      </button>`;
    }).join('');
    U.modal(t('shop'), `<div class="grid">${cards}</div>`, { cls: 'wide' });
    document.querySelectorAll('#modal .card').forEach((c) => {
      c.onclick = () => {
        const type = c.dataset.type;
        if (c.classList.contains('locked')) { U.toast(t('limit')); return; }
        U.closeModal();
        G.Village.startPlace(type);
      };
    });
  };

  // ---------- army ----------
  U.openArmy = function () {
    const draw = () => {
      const s = G.state, fl = G.factoryLevel(), cap = G.housing(), used = G.armySpace(), q = G.queueSpace();
      const now = Date.now();
      const units = G.UNIT_ORDER.map((u) => {
        const d = G.UNITS[u], locked = fl < d.unlock;
        return `<button class="card unit ${locked ? 'locked' : ''}" data-u="${u}">
          <img src="${G.Art.unitThumb(u)}" alt=""><div class="c-name">${t('u_' + u)}</div>
          ${locked ? `<div class="c-lock">${t('factoryAt', { n: d.unlock })}</div>` :
            `<div class="c-cost">${costHtml('copper', d.cost, s.res.copper >= d.cost)}</div><div class="c-time">${d.space} ${t('housing').toLowerCase()} · ${d.time}s</div>`}
          <div class="c-have">${s.army[u]}</div>
        </button>`;
      }).join('');
      let qhtml = '';
      if (s.queue.length) {
        const left = (s.qStart + G.UNITS[s.queue[0]].time * 1000 - now) / 1000;
        qhtml = `<div class="queue">${s.queue.map((u, i) => `<button class="q-item" data-i="${i}"><img src="${G.Art.unitThumb(u)}" alt="">${i === 0 ? `<span>${G.fmtTime(left)}</span>` : ''}</button>`).join('')}</div><p class="hint">${t('cancelTrain')}</p>`;
      }
      const heroes = G.HERO_ORDER.map((h) => {
        const ok = G.heroUnlocked(h);
        return `<div class="hero ${ok ? '' : 'locked'}"><img src="${G.Art.unitThumb(h)}" alt=""><div><div class="c-name">${t('h_' + h)}</div><p>${t('hd_' + h)}</p>
          <div class="${ok ? 'ok' : 'warn'}">${ok ? t('available') : t('unlockAt', { n: G.HEROES[h].unlock })}</div></div></div>`;
      }).join('');
      return `<div class="cap-row"><span>${t('capacity')}</span><div class="bar big"><b style="width:${cap ? Math.min(100, used / cap * 100) : 0}%"></b><i style="left:${cap ? Math.min(100, used / cap * 100) : 0}%;width:${cap ? Math.min(100 - used / cap * 100, q / cap * 100) : 0}%"></i></div><b>${used + q}/${cap}</b></div>
        ${fl < 1 ? `<p class="warn">${t('needFactory')}</p>` : ''}
        <div class="grid">${units}</div>${qhtml}
        <h3>${t('heroes')}</h3><div class="heroes">${heroes}</div>`;
    };
    const bind = () => {
      document.querySelectorAll('#modal .card.unit').forEach((c) => {
        c.onclick = () => {
          const e = G.trainUnit(c.dataset.u);
          if (e) U.toast(e);
          refresh(); U.refreshHud();
        };
      });
      document.querySelectorAll('#modal .q-item').forEach((c) => { c.onclick = () => { G.cancelTrain(+c.dataset.i); refresh(); U.refreshHud(); }; });
    };
    const refresh = () => { const b = $('#modal .panel-b'); if (!b) return; const st = b.scrollTop; b.innerHTML = draw(); b.scrollTop = st; bind(); };
    U.modal(t('army'), draw(), { cls: 'wide', refresh });
    bind();
  };

  // ---------- attack ----------
  U.openAttack = function () {
    const cost = 30 * G.coreLevel();
    U.modal(t('attack'), `<div class="two">
      <button class="mode-card" id="a-pve"><div class="mc-t">${t('campaign')}</div><p>${t('campaignDesc')}</p></button>
      <button class="mode-card mp" id="a-pvp"><div class="mc-t">${t('multiplayer')}</div><p>${t('mpDesc')}</p>
        <div class="mc-c">${t('findMatch')} · ${costHtml('copper', cost, G.state.res.copper >= cost)}</div></button></div>
      <div class="row-btns"><button class="btn" id="a-rank">${IC.trophy}${t('ranking')}</button><button class="btn" id="a-def">${t('defenseLog')}</button></div>
      <p class="hint">${t(G.Net.session ? 'pvpNote' : 'pvpNoteOffline')}</p>`, { cls: 'wide' });
    $('#a-pve').onclick = U.openCampaign;
    $('#a-rank').onclick = U.openRanking;
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
      G.state.res.copper -= cost; G.save();
      U.closeModal();
      if (opp) {
        const buildings = G.Battle.baseFromLayout(opp.layout);
        if (buildings.some((q) => q.type !== 'firewall')) {
          G.Battle.start({ mode: 'pvp', base: { buildings, loot: { scrap: opp.loot_scrap, copper: opp.loot_copper } }, name: opp.username, defender: opp.user_id, trophies: opp.trophies });
          return;
        }
      }
      if (G.Net.session) U.toast(t('noOpponents'));
      const bot = G.genBot(G.coreLevel(), (Date.now() & 0xffffff) ^ 0x5bd1e995);
      G.Battle.start({ mode: 'pvp', base: bot, name: bot.name });
    };
  };

  U.openRanking = async function () {
    U.modal(t('ranking'), `<div class="rank" id="rank-list"><div class="spin"></div></div>`, { cls: 'small' });
    let rows;
    try { rows = await G.Net.leaderboard(); } catch (e) { const el = $('#rank-list'); if (el) el.innerHTML = `<p class="center warn">${t('err_' + (e.code || 'server'))}</p>`; return; }
    const el = $('#rank-list');
    if (!el) return;
    const me = G.Net.profile && G.Net.profile.username;
    el.innerHTML = rows.length ? rows.map((r, i) => `<div class="rk ${r.username === me ? 'me' : ''}"><span class="rk-n">${i + 1}</span><span class="rk-u">${escHtml(r.username)}</span><span class="rk-t">${IC.trophy}${r.trophies}</span></div>`).join('')
      : `<p class="center hint">${t('noPlayersYet')}</p>`;
  };

  U.openDefenseLog = function (fresh) {
    const log = G.state.defLog || [];
    const ago = (iso) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
    const rows = log.map((a, i) => {
      const stars = [0, 1, 2].map((k) => `<span class="st ${k < a.stars ? 'on' : ''}">${IC.star}</span>`).join('');
      return `<div class="dl ${i < fresh ? 'new' : ''}"><div class="dl-h"><b>${escHtml(a.name)}</b><span class="l-s">${stars}</span><small>${a.pct}% · ${ago(a.at)}</small></div>
        <div class="dl-b">${a.stars > 0 ? `${t('stolen')}: ${costHtml('scrap', a.scrap)} ${costHtml('copper', a.copper)} · ${IC.trophy.replace('<svg', '<svg class="tro-ic"')} −${a.trophies}` : `<span class="ok">${t('defended')}</span> · ${IC.trophy.replace('<svg', '<svg class="tro-ic"')} +${-a.trophies}`}</div></div>`;
    }).join('');
    U.modal(fresh ? t('youWereAttacked') : t('defenseLog'), log.length ? `<div class="levels">${rows}</div>` : `<p class="center hint">${t('noDefenses')}</p>`, { cls: 'small' });
    U.refreshHud();
  };
  U.openCampaign = function () {
    const s = G.state;
    const rows = G.PVE.map((L, i) => {
      const n = i + 1, rec = s.pve[n] || { stars: 0, taken: { scrap: 0, copper: 0 } };
      const unlocked = n === 1 || (s.pve[n - 1] && s.pve[n - 1].stars > 0);
      const stars = [0, 1, 2].map((k) => `<span class="st ${k < rec.stars ? 'on' : ''}">${IC.star}</span>`).join('');
      return `<div class="lvl ${unlocked ? '' : 'locked'}"><div class="l-n">${n}</div><div class="l-b"><div class="c-name">${t('pve_' + n)}</div>
        <div class="l-s">${stars}</div><div class="l-loot">${t('remainingLoot')}: ${costHtml('scrap', L.loot.scrap - rec.taken.scrap)} ${costHtml('copper', L.loot.copper - rec.taken.copper)}</div></div>
        <button class="btn primary" data-l="${n}" ${unlocked ? '' : 'disabled'}>${unlocked ? IC.sword + t('attack') : t('locked')}</button></div>`;
    }).join('');
    U.modal(t('campaign'), `<div class="levels">${rows}</div>`, { cls: 'wide' });
    document.querySelectorAll('#modal .lvl .btn').forEach((b) => {
      b.onclick = () => {
        if (!G.Battle.hasAnything()) { U.toast(t('armyEmpty')); return; }
        const n = +b.dataset.l, L = G.PVE[n - 1];
        U.closeModal();
        G.Battle.start({ mode: 'pve', level: n, base: { buildings: G.genBase(L, L.seed), loot: L.loot }, name: t('pve_' + n) });
      };
    });
  };

  // ---------- settings ----------
  U.openSettings = function () {
    const esc = (v) => String(v || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    U.modal(t('settings'), `
      <div class="acct">${G.Net.session ? `<div><small>${t('loggedAs')}</small><b>${esc(G.state.name)}</b><small>${esc(G.Net.email())}</small></div>
        <button class="btn sm" id="s-logout">${t('logout')}</button>` : `<div><b>${t('offlineMode')}</b></div><button class="btn sm primary" id="s-login">${t('login')}</button>`}</div>
      <div class="fld">${t('language')}<div class="seg"><button data-l="pl" class="${G.lang === 'pl' ? 'on' : ''}">Polski</button><button data-l="en" class="${G.lang === 'en' ? 'on' : ''}">English</button></div></div>
      <div class="fld">${t('sounds')}<div class="seg" id="s-sfx"><button data-v="1" class="${G.state.settings.sfx ? 'on' : ''}">${t('on')}</button><button data-v="0" class="${G.state.settings.sfx ? '' : 'on'}">${t('off')}</button></div></div>
      <div class="fld">${t('music')}<div class="seg" id="s-mus"><button data-v="1" class="${G.state.settings.music ? 'on' : ''}">${t('on')}</button><button data-v="0" class="${G.state.settings.music ? '' : 'on'}">${t('off')}</button></div></div>
      <div class="row-btns"><button class="btn" id="s-tut">${t('tutAgain')}</button></div>
      <div class="row-btns"><button class="btn danger" id="s-reset">${t('reset')}</button>${G.Net.session ? `<button class="btn danger" id="s-del">${t('deleteAccount')}</button>` : ''}</div>
      <p class="hint"><a href="privacy.html" target="_blank" rel="noopener">${t('privacyPolicy')}</a> · CyberWar ${t('version')} ${G.VERSION}</p>`, { cls: 'small' });
    if ($('#s-logout')) $('#s-logout').onclick = async () => {
      try { await G.Net.pushSave(); } catch (_) {}
      await G.Net.signOut(); U.closeModal(); G.Auth.show('login');
    };
    if ($('#s-login')) $('#s-login').onclick = () => { U.closeModal(); G.Auth.show('login'); };
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
    $('#s-tut').onclick = () => { G.state.tut = 0; G.state.flags = {}; G.save(); U.closeModal(); };
    $('#s-reset').onclick = () => U.confirm(t('resetConfirm'), () => { G.resetGame(); G.Village.camInit = false; G.Village.enter(); });
  };

  // ---------- battle HUD ----------
  U.showBattle = function () {
    U.closeModal(); U.hideSel(); U.hidePlace();
    $('#hud-top').classList.add('hidden'); $('#hud-bottom').classList.add('hidden'); $('#hud-builders').classList.add('hidden');
    const b = G.Battle, el = $('#battle-hud');
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
        else {
          const h = c.dataset.h, hs = b.heroes[h];
          if (hs.state === 'ready') b.sel = h;
          else G.Battle.useAbility(h);
        }
        U.battleCards();
      };
    });
  };
  U.setResultTrophies = function (delta) {
    const el = $('#res-tro');
    if (el) el.textContent = delta == null ? t('err_server') : (delta >= 0 ? '+' : '') + delta;
  };
  U.showResult = function (r) {
    const stars = [0, 1, 2].map((k) => `<span class="st big ${k < r.stars ? 'on' : ''}">${IC.star}</span>`).join('');
    const win = r.stars > 0;
    U.modal(win ? t('victory') : t('defeat'), `
      <div class="res-stars">${stars}</div>
      <div class="res-pct">${t('destruction')}: <b>${Math.round(r.pct * 100)}%</b></div>
      <div class="res-loot">${t('loot')}: ${costHtml('scrap', r.gained.scrap)} ${costHtml('copper', r.gained.copper)} ${r.chips ? costHtml('chips', r.chips) : ''}</div>
      ${r.mode === 'pvp' ? (r.bot ? `<p class="hint">${t('botNoTrophies')}</p>` : `<div class="res-tro">${IC.trophy} <span id="res-tro">${r.trophies == null ? '…' : (r.trophies >= 0 ? '+' : '') + r.trophies}</span></div>`) : ''}
      <div class="row-btns"><button class="btn primary" id="r-home">${t('returnHome')}</button></div>`, { cls: 'small result ' + (win ? 'win' : 'lose'), noClose: true });
    $('#r-home').onclick = () => { U.closeModal(); G.Village.enter(); };
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
      const se = $('#bh-stars'); if (se && se.dataset.n !== String(r.stars)) { se.dataset.n = r.stars; se.innerHTML = [0, 1, 2].map((k) => `<span class="st ${k < r.stars ? 'on' : ''}">${IC.star}</span>`).join(''); }
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
    if (U.modalRefresh && G.state.queue.length) U.modalRefresh();
  };
})();
