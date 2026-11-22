// Guided first-time tutorial: a text box plus a pulsing arrow pointing at what to tap next.
G.Tut = (function () {
  const T = {};
  const $ = (s) => document.querySelector(s);
  const S = () => G.state;
  const modalOpen = () => G.UI.isModal();
  const inBattle = () => G.scene === G.Battle;

  function worldPoint(type) {
    const b = S().buildings.find((q) => q.type === type);
    if (!b) return null;
    const s = G.BUILDINGS[type].size, cam = G.Village.cam;
    const w = G.tileToWorld(b.x + s / 2, b.y + s / 2);
    const p = cam.toScreen(w[0], w[1] - 40);
    return { x: p[0], y: p[1] };
  }
  function el(sel) {
    const e = $(sel);
    if (!e || e.offsetParent === null) return null;
    const r = e.getBoundingClientRect();
    if (!r.width) return null;
    return { x: r.left + r.width / 2, y: r.top, el: e };
  }

  // what the player has really done so far (read from the save, so it survives reloads and logins)
  const st = (k) => (S().stats && S().stats[k]) | 0;
  const fl = (k) => !!(S().flags && S().flags[k]);
  const pveDone = () => Object.keys(S().pve || {}).length > 0;
  // each step: text key, done() → advance, target() → where the arrow points
  const STEPS = [
    { key: 'tut_welcome', button: true },
    // resources flow into storage by themselves, so anything mined counts
    { key: 'tut_collect', done: () => fl('collected') || st('mined') > 0,
      target: () => (inBattle() || modalOpen() ? null : worldPoint('scrapyard')) },
    { key: 'tut_build', done: () => G.countType('vault') > 0 || G.countType('silo') > 0 || st('builds') > 0,
      target: () => {
        if (G.Village.ghost) return el('#pb-ok');
        if (modalOpen()) return el('#modal .card[data-type="vault"]');
        return el('#btn-shop');
      } },
    { key: 'tut_train', done: () => fl('trained') || st('trained') > 0,
      target: () => (modalOpen() ? el('#modal .card.unit[data-u="runner"]') : el('#btn-army')) },
    { key: 'tut_attack', done: () => fl('battled') || pveDone() || st('wins') > 0,
      target: () => {
        if (!modalOpen()) return el('#btn-attack');
        return el('#modal .lvl .btn') || el('#a-pve');
      } },
    { key: 'tut_deploy', done: () => fl('battleDone') || pveDone() || st('wins') > 0, target: () => null },
    { key: 'tut_done', button: true, done: () => false },
  ];

  T.active = () => S() && S().tut < STEPS.length;

  T.init = function () {
    const box = document.createElement('div');
    box.id = 'tut';
    box.innerHTML = '<div class="tut-box"><div class="tut-bot"></div><p class="tut-t"></p><div class="tut-btns"><button class="btn sm" id="tut-skip"></button><button class="btn primary sm" id="tut-next"></button></div></div><div class="tut-arrow"></div>';
    document.getElementById('ui').appendChild(box);
    $('#tut-skip').onclick = () => { S().tut = STEPS.length; G.save(); };
    $('#tut-next').onclick = () => { S().tut++; G.save(); };
  };

  let lastStep = -1;
  T.frame = function () {
    const box = $('#tut');
    if (!box) return;
    if (!T.active() || G.Auth.isOpen()) { box.classList.add('hidden'); return; }
    // jump straight to the first task the player hasn't done yet (the welcome too, once anything is done)
    // (mining starts on its own within seconds, so it doesn't count as "already playing")
    // after "Show the tutorial again" (T.replay) every hint is shown in order
    const from = S().tut;
    let i = from;
    if (!T.replay) {
      const playing = STEPS.slice(2).some((x) => x.done && !x.button && x.done());
      if (i === 0 && playing) i = 1;
      while (STEPS[i] && STEPS[i].done && !STEPS[i].button && STEPS[i].done()) i++;
    }
    if (i !== from) { S().tut = i; G.save(); }
    const st = STEPS[S().tut];
    if (!st) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    if (lastStep !== S().tut) {
      lastStep = S().tut;
      $('.tut-t').textContent = G.t(st.key);
      $('#tut-skip').textContent = G.t('skip');
      $('#tut-next').textContent = G.t(S().tut === STEPS.length - 1 ? 'ok' : 'next');
      // every hint can be passed over with "Next" — you don't have to finish one task to see the next
      $('#tut-next').classList.remove('hidden');
      $('#tut-skip').classList.toggle('hidden', !!st.button && S().tut === STEPS.length - 1);
      if (S().tut > 0) G.Sfx.play('star');
    }
    box.classList.toggle('bottom', modalOpen());
    box.classList.toggle('battle', inBattle() && !modalOpen());
    const hint = $('#bh-hint'); if (hint) hint.remove();
    const arrow = $('.tut-arrow');
    const tg = st.target ? st.target() : null;
    if (!tg) { arrow.style.display = 'none'; return; }
    arrow.style.display = 'block';
    const bob = Math.sin(performance.now() / 160) * 6;
    const below = tg.y < 120;
    arrow.classList.toggle('up', below);
    const h = tg.el ? tg.el.getBoundingClientRect().height : 0;
    arrow.style.left = (tg.x - 18) + 'px';
    arrow.style.top = (below ? tg.y + h + 4 + bob : tg.y - 44 - bob) + 'px';
  };
  return T;
})();
