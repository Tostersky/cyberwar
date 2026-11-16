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

  // each step: text key, done() → advance, target() → where the arrow points
  const STEPS = [
    { key: 'tut_welcome', button: true },
    { key: 'tut_collect', done: () => S().flags.collected,
      target: () => (inBattle() || modalOpen() ? null : worldPoint('scrapyard')) },
    { key: 'tut_build', done: () => G.countType('vault') > 0,
      target: () => {
        if (G.Village.ghost) return el('#pb-ok');
        if (modalOpen()) return el('#modal .card[data-type="vault"]');
        return el('#btn-shop');
      } },
    { key: 'tut_train', done: () => S().flags.trained,
      target: () => (modalOpen() ? el('#modal .card.unit[data-u="runner"]') : el('#btn-army')) },
    { key: 'tut_attack', done: () => S().flags.battled,
      target: () => {
        if (!modalOpen()) return el('#btn-attack');
        return el('#modal .lvl .btn') || el('#a-pve');
      } },
    { key: 'tut_deploy', done: () => S().flags.battleDone, target: () => null },
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
    let st = STEPS[S().tut];
    // skip steps already satisfied (e.g. player did it before the prompt)
    while (st && st.done && !st.button && st.done()) { S().tut++; G.save(); st = STEPS[S().tut]; }
    if (!st) { box.classList.add('hidden'); return; }
    // result screen: let the player read it, then continue
    if (st.key === 'tut_deploy' && !inBattle() && !S().flags.battled) { /* not started yet */ }
    box.classList.remove('hidden');
    if (lastStep !== S().tut) {
      lastStep = S().tut;
      $('.tut-t').textContent = G.t(st.key);
      $('#tut-skip').textContent = G.t('skip');
      $('#tut-next').textContent = G.t(S().tut === STEPS.length - 1 ? 'ok' : 'next');
      $('#tut-next').classList.toggle('hidden', !st.button);
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
