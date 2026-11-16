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

  G.state = G.load() || G.newGame();
  G.lang = G.state.lang || ((navigator.language || 'pl').toLowerCase().startsWith('pl') ? 'pl' : 'en');
  G.state.lang = G.lang;
  G.tick();
  G.UI.init();
  G.Tut.init();
  G.Input.init(cv);
  G.Village.enter();

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

  setInterval(G.save, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });
  window.addEventListener('pagehide', G.save);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
