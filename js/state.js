// Player state on this device. Every economy change is a command (G.act) that runs instantly here through
// G.Econ and is then sent to the server, which runs the same rules and has the final word.
(function () {
  const KEY = 'cyberwar_save_v1';
  const E = G.Econ;
  const now = () => Date.now();
  const S = () => G.state;
  const tr = (r) => (r && r.err ? G.t(r.err, r.p && r.p.r ? { r: G.t(r.p.r) } : r.p) : null);

  G.newGame = () => E.newGame(now());
  G.load = function () {
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return E.norm(s, now()); } } catch (_) {}
    return null;
  };
  // quiet = periodic local save only
  G.save = function (quiet) {
    if (!G.state) return;
    try { localStorage.setItem(KEY, JSON.stringify(G.state)); } catch (_) {}
    if (quiet !== true && G.Net) G.Net.queueMeta();
  };
  // Swap in a whole save (from the server) and restart the home scene.
  G.applyState = function (s) {
    G.state = E.norm(s, now());
    G.lang = s.lang || G.lang; G.state.lang = G.lang;
    G.tick(); G.save(true);
    G.UI.applyLang();
    G.Village.camInit = false; G.Village.enter();
  };

  // run a command locally and send it to the server; returns the result ({ok..} or {err,p})
  G.act = function (cmd) {
    const r = E.apply(S(), cmd, now());
    if (!r.err) { G.save(true); if (G.Net) G.Net.queue(cmd); }
    return r;
  };
  G.resetGame = function () { G.act({ c: 'reset' }); G.save(true); };

  // queries used by the UI
  G.coreLevel = () => E.coreLevel(S());
  G.countType = (type) => E.countType(S(), type);
  G.maxLevelOf = (type) => E.maxLevelOf(S(), type);
  G.limitOf = (type) => E.limitOf(S(), type);
  G.capOf = (res) => E.capOf(S(), res);
  G.buildersBusy = (t) => E.buildersBusy(S(), t || now());
  G.canPlace = (type, x, y, ignoreId) => E.canPlace(S(), type, x, y, ignoreId);
  G.upgradeInfo = (b) => E.upgradeInfo(S(), b);
  G.finishCost = (b) => E.finishCost(b, now());
  G.housing = () => E.housing(S());
  G.armySpace = () => E.armySpace(S());
  G.queueSpace = () => E.queueSpace(S());
  G.factoryLevel = () => E.factoryLevel(S());
  G.hqLevel = () => E.hqLevel(S());
  G.heroUnlocked = (h) => E.heroUnlocked(S(), h);
  G.updateCollector = (b, t) => E.updateCollector(b, t || now(), S());

  // per-frame tick: constructions / training finish on time
  G.events = [];
  G.tick = function () {
    for (const e of E.tick(S(), now())) {
      if (e.kind === 'built') G.events.push({ kind: 'built', b: E.findB(S(), e.id) });
      if (e.kind === 'researched') G.events.push(e);
    }
  };

  // actions (return an error message or null)
  G.startBuild = function (type, x, y) {
    const r = G.act({ c: 'build', type, x, y });
    if (!r.err) G.Sfx.play('build');
    return tr(r);
  };
  G.startUpgrade = function (b) {
    const r = G.act({ c: 'upgrade', id: b.id });
    if (!r.err) G.Sfx.play('build');
    return tr(r);
  };
  G.finishNow = (b) => tr(G.act({ c: 'finish', id: b.id }));
  G.moveBuilding = (b, x, y) => tr(G.act({ c: 'move', id: b.id, x, y }));
  G.collect = function (b) {
    const r = G.act({ c: 'collect', id: b.id });
    if (r.got > 0) { S().flags.collected = true; G.Sfx.play('collect'); G.save(); }
    return r.got || 0;
  };
  G.trainUnit = function (u) {
    const r = G.act({ c: 'train', u });
    if (!r.err) { S().flags.trained = true; G.Sfx.play('train'); G.save(); }
    return tr(r);
  };
  G.cancelTrain = (i) => { G.act({ c: 'cancel', i }); };
  G.paySearch = () => tr(G.act({ c: 'search' }));
})();
