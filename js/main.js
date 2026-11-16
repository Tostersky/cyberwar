// Boot + main loop.
(function () {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  function resize() {
    G.dpr = Math.min(window.devicePixelRatio || 1, 2);
    G.W = window.innerWidth; G.H = window.innerHeight;
    cv.width = Math.round(G.W * G.dpr); cv.height = Math.round(G.H * G.dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  // the local save (if any) runs in the background behind the login screen
  G.state = G.load() || G.newGame();
  let storedLang = null; try { storedLang = localStorage.getItem('cyberwar_lang'); } catch (_) {}
  G.lang = G.state.lang || storedLang || ((navigator.language || 'pl').toLowerCase().startsWith('pl') ? 'pl' : 'en');
  G.state.lang = G.lang;
  G.tick();
  G.UI.init();
  G.Tut.init();
  G.Input.init(cv);
  G.Village.enter();

  // loading screen fades out once the first scene and the login decision are ready (min 0.9 s)
  const bootStart = performance.now();
  const hideBoot = () => {
    const el = document.getElementById('boot');
    if (!el) return;
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, Math.max(0, 900 - (performance.now() - bootStart)));
  };

  // accounts: resume the saved session, otherwise ask to log in / register
  (async function () {
    // coming back from a password-reset email link?
    let back = null;
    try { back = await G.Net.consumeAuthHash(); } catch (_) { back = 'error'; }
    if (back === 'recovery') { G.Auth.show('newpass'); return; }
    if (back === 'error') { G.Auth.show('forgot', G.t('resetLinkExpired')); return; }
    if (back === 'login') setTimeout(() => G.UI.toast(G.t('emailConfirmed')), 1500);
    if (!G.Net.restore()) { G.Auth.show(); return; }
    G.UI.loading(true);
    try {
      await G.Net.loadProfile();
      await G.Auth.afterLogin();
    } catch (e) {
      if (e.code === 'offline' && G.state.owner === G.Net.uid()) { /* play offline, sync later */ }
      else { await G.Net.signOut(); G.Auth.show('login'); }
    }
    G.UI.loading(false);
  })().catch(() => {}).finally(hideBoot);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    G.Input.update();
    if (G.scene === G.Village) G.tick();
    G.scene.update(dt);
    G.scene.render(ctx);
    G.UI.frame(dt);
    G.Tut.frame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  setInterval(() => G.save(true), 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(true); });
  window.addEventListener('pagehide', () => G.save(true));

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
