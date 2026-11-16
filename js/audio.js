// Sound effects and music, synthesized live with Web Audio (no sound files needed).
G.Sfx = (function () {
  let ac = null, master = null, sfxBus = null, musicBus = null;
  const last = {};
  const S = { musicOn: false };

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
      musicBus = ac.createGain(); musicBus.gain.value = 0.0; musicBus.connect(master);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  const settings = () => (G.state && G.state.settings) || { sfx: true, music: true };

  // iOS only allows audio after a user gesture
  function unlock() {
    if (!ensure()) return;
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
    s.buffer = b; s.connect(ac.destination); s.start(0);
    S.updateMusic();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

  function tone(f, dur, type, vol, f2, delay, bus) {
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(dur, vol, freq, delay, q) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + (delay || 0);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = 'lowpass'; f.frequency.setValueAtTime(freq || 2000, t); f.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    click: () => tone(1100, 0.045, 'square', 0.05, 1500),
    open: () => { tone(420, 0.09, 'triangle', 0.12, 840); },
    collect: () => { tone(988, 0.07, 'square', 0.07); tone(1480, 0.12, 'square', 0.07, null, 0.06); },
    build: () => { noise(0.18, 0.25, 500); tone(160, 0.2, 'sawtooth', 0.08, 320, 0.05); },
    built: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.12, null, i * 0.07)); },
    train: () => { tone(500, 0.08, 'triangle', 0.1, 900); tone(900, 0.08, 'triangle', 0.08, 1300, 0.07); },
    deploy: () => tone(330, 0.09, 'square', 0.06, 160),
    laser: () => tone(2200, 0.13, 'sawtooth', 0.035, 260),
    shot: () => { noise(0.05, 0.12, 4000); tone(1400, 0.05, 'square', 0.03, 600); },
    hit: () => noise(0.05, 0.12, 1400),
    boom: () => { noise(0.5, 0.45, 700); tone(130, 0.45, 'sine', 0.3, 35); },
    small: () => { noise(0.2, 0.2, 1200); tone(220, 0.18, 'sine', 0.12, 60); },
    zap: () => { tone(80, 0.6, 'sawtooth', 0.12, 1200); noise(0.6, 0.15, 6000); },
    storm: () => { for (let i = 0; i < 5; i++) noise(0.12, 0.12, 3000 + i * 400, i * 0.08, 6); },
    error: () => { tone(180, 0.12, 'square', 0.08); tone(140, 0.16, 'square', 0.08, null, 0.1); },
    win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i === 4 ? 0.6 : 0.16, 'square', 0.08, null, i * 0.12)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, null, i * 0.2)); },
    star: () => { tone(1568, 0.25, 'triangle', 0.12); tone(2093, 0.3, 'triangle', 0.08, null, 0.08); },
  };
  const MIN_GAP = { laser: 0.07, shot: 0.06, hit: 0.07, small: 0.08, boom: 0.06, deploy: 0.05, click: 0.04 };

  S.play = function (name) {
    if (!settings().sfx) return;
    if (!ensure() || ac.state !== 'running') return;
    const now = ac.currentTime, gap = MIN_GAP[name] || 0;
    if (gap && last[name] && now - last[name] < gap) return;
    last[name] = now;
    try { SOUNDS[name] && SOUNDS[name](); } catch (_) {}
  };

  // ---- music: a small synthwave loop scheduled ahead of time ----
  const BPM = 96, STEP = 60 / BPM / 2; // 8th notes
  const CHORDS = [[45, 52, 57, 60], [41, 48, 53, 57], [36, 43, 48, 55], [43, 50, 55, 59]]; // Am F C G (midi)
  const ARP = [0, 2, 3, 2, 1, 2, 3, 2];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let step = 0, nextT = 0, timer = null;
  function schedule() {
    while (nextT < ac.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % CHORDS.length, ch = CHORDS[bar], i = step % 8;
      tone(mtof(ch[0] - 12), STEP * 0.9, 'sawtooth', 0.1, null, nextT - ac.currentTime, musicBus);
      tone(mtof(ch[ARP[i]] + 12), STEP * 0.7, 'square', 0.035, null, nextT - ac.currentTime, musicBus);
      if (i === 0) for (let k = 1; k < 4; k++) tone(mtof(ch[k]), STEP * 7.5, 'triangle', 0.025, null, nextT - ac.currentTime, musicBus);
      step++; nextT += STEP;
    }
  }
  S.updateMusic = function () {
    if (!ac || ac.state !== 'running') return;
    const on = settings().music && !document.hidden;
    musicBus.gain.setTargetAtTime(on ? 0.55 : 0, ac.currentTime, 0.3);
    if (on && !timer) { nextT = ac.currentTime + 0.1; timer = setInterval(schedule, 100); }
    if (!on && timer) { clearInterval(timer); timer = null; }
  };
  document.addEventListener('visibilitychange', () => S.updateMusic());
  return S;
})();
