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
    // explosion: crack + deep thump + rolling rumble and a little debris crackle
    boom: () => { noise(0.08, 0.35, 5000); noise(0.5, 0.45, 700); tone(130, 0.45, 'sine', 0.32, 32); noise(1.2, 0.22, 220, 0.05, 0.7); for (let i = 0; i < 4; i++) noise(0.04, 0.06, 3500, 0.15 + i * 0.09 + Math.random() * 0.05, 3); },
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

  // ---- music: three original synthwave tracks played live (home city, battle, colony) ----
  // a small mixer: dry bus + tempo delay + generated reverb, and a "pump" bus ducked by the kick drum
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let mx = null;
  function impulse(sec) {
    const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }
  function mgraph() {
    if (mx) return mx;
    const out = ac.createBiquadFilter(); out.type = 'lowpass'; out.frequency.value = 12000; out.connect(musicBus);
    const inp = ac.createGain(); inp.connect(out);
    const pump = ac.createGain(); pump.connect(out);
    const send = ac.createGain(), dl = ac.createDelay(1.5), fb = ac.createGain(), dlf = ac.createBiquadFilter(), wet = ac.createGain();
    dl.delayTime.value = 0.375; fb.gain.value = 0.33; dlf.type = 'lowpass'; dlf.frequency.value = 2400; wet.gain.value = 0.32;
    send.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(wet); wet.connect(out);
    const rsend = ac.createGain(), rv = ac.createConvolver(), rvg = ac.createGain();
    rv.buffer = impulse(2.6); rvg.gain.value = 0.3; rsend.connect(rv); rv.connect(rvg); rvg.connect(out);
    mx = { out, inp, pump, send, rsend, dl };
    return mx;
  }
  function voice(t, f, dur, o) {
    const g = ac.createGain(), fl = ac.createBiquadFilter();
    fl.type = 'lowpass'; fl.Q.value = o.q || 0.8;
    fl.frequency.setValueAtTime(o.cut || 3000, t); if (o.cutEnd) fl.frequency.exponentialRampToValueAtTime(o.cutEnd, t + Math.max(0.02, dur));
    const a = o.att || 0.005, r = o.rel || 0.06, v = o.vol, end = t + Math.max(a, dur);
    for (const d of (o.det ? [-o.det, o.det] : [0])) {
      const s = ac.createOscillator(); s.type = o.type || 'sawtooth'; s.frequency.setValueAtTime(f, t); s.detune.value = d;
      s.connect(fl); s.start(t); s.stop(end + r + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, end); g.gain.exponentialRampToValueAtTime(0.0001, end + r);
    fl.connect(g); g.connect(o.pump ? mx.pump : mx.inp);
    if (o.send) { const s = ac.createGain(); s.gain.value = o.send; g.connect(s); s.connect(mx.send); }
    if (o.rs) { const s = ac.createGain(); s.gain.value = o.rs; g.connect(s); s.connect(mx.rsend); }
  }
  function nz(t, dur, v, type, freq, q, rs) {
    if (!noiseBuf) noise(0.001, 0.0001, 100); // builds the shared noise buffer
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(mx.inp);
    if (rs) { const r = ac.createGain(); r.gain.value = rs; g.connect(r); r.connect(mx.rsend); }
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function kick(t, v) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(mx.inp); o.start(t); o.stop(t + 0.42);
    mx.pump.gain.cancelScheduledValues(t); mx.pump.gain.setValueAtTime(0.3, t); mx.pump.gain.linearRampToValueAtTime(1, t + 0.24);
  }
  const snare = (t, v) => { nz(t, 0.2, v, 'bandpass', 1900, 0.7, 0.35); voice(t, 190, 0.05, { type: 'triangle', vol: v * 0.6, cut: 2000, rel: 0.06 }); };
  const hat = (t, v, open) => nz(t, open ? 0.16 : 0.035, v, 'highpass', 7500, 0.6);

  // chords as midi notes; roots for the bass; every track is 4 bars that repeat in sections
  const TRACKS = {
    // home: warm, mid-tempo synthwave (Am - F - C - G)
    home: { bpm: 96, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], root: [33, 29, 36, 31], pad: 1500, lead: [0, null, null, 2, null, null, 1, null, 0, null, 2, null, 3, null, 2, null] },
    // battle: fast and driving (Dm - Bb - C - A)
    battle: { bpm: 122, chords: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]], root: [26, 34, 36, 33], pad: 1100, lead: [0, null, 1, 0, null, 2, null, 1, 0, null, 1, null, 3, 2, 1, null] },
    // colony: slow desert ambient (Em - C - D - Bm)
    colony: { bpm: 76, chords: [[64, 67, 71], [60, 64, 67], [62, 66, 69], [59, 62, 66]], root: [28, 36, 38, 35], pad: 900, lead: [0, null, null, null, 2, null, null, null, 1, null, null, 3, null, null, null, null] },
  };
  const wantTrack = () => (G.scene && G.Battle && G.scene === G.Battle ? 'battle' : (G.World && G.World.city === 2 ? 'colony' : 'home'));
  let cur = 'home', step = 0, nextT = 0, timer = null;
  function playStep(T, s, bar, t, sp) {
    const ch = T.chords[bar % 4], root = T.root[bar % 4], sec = Math.floor(bar / 8) % 4; // 0 intro, 1 full, 2 full + lead, 3 breakdown
    const drums = sec === 1 || sec === 2, barLen = sp * 16;
    if (cur === 'battle') {
      if (s === 0) for (const n of ch) voice(t, mtof(n - 12), barLen, { type: 'sawtooth', det: 9, vol: 0.022, cut: T.pad, att: 0.08, rel: 0.3, pump: true, rs: 0.4 });
      if (sec !== 3 || s % 4 === 0) voice(t, mtof(root + (s % 4 === 2 ? 12 : 0)), sp * 0.9, { type: 'sawtooth', vol: 0.085, cut: 700, cutEnd: 180, q: 5, pump: true });
      voice(t, mtof(ch[[0, 1, 2, 1][s % 4]] + (s >= 8 ? 12 : 0)), sp * 0.7, { type: 'square', vol: sec === 0 ? 0.012 : 0.018, cut: 3200, send: 0.3 });
      if (sec !== 0 && s % 4 === 0) kick(t, 0.55);
      if (sec !== 0 && (s === 4 || s === 12)) snare(t, 0.16);
      if (sec === 3 && s === 14) snare(t, 0.08);
      hat(t, s % 2 ? 0.035 : 0.05, s % 4 === 2);
    } else if (cur === 'colony') {
      if (s === 0) for (const n of ch) voice(t, mtof(n - 12), barLen * 1.1, { type: 'sawtooth', det: 12, vol: 0.02, cut: T.pad, att: 0.9, rel: 1.4, rs: 0.8 });
      if (s === 0 || s === 10) voice(t, mtof(root), sp * 6, { type: 'sine', vol: 0.11, cut: 400, att: 0.05, rel: 0.4 });
      if (s % 4 === 0 && sec !== 0) voice(t, mtof(ch[(s / 4 + bar) % 3] + 12), sp * 2, { type: 'triangle', vol: 0.03, cut: 2600, send: 0.6, rs: 0.4 });
      if (drums && s === 12) nz(t, 0.08, 0.05, 'bandpass', 3200, 2, 0.6);
      if (drums && s % 4 === 2) hat(t, 0.012);
    } else {
      if (s === 0) for (const n of ch) voice(t, mtof(n - 12), barLen, { type: 'sawtooth', det: 10, vol: 0.024, cut: T.pad, att: 0.25, rel: 0.6, pump: true, rs: 0.5 });
      if (s % 2 === 0 && sec !== 0) voice(t, mtof(root + (s % 8 === 6 ? 12 : 0)), sp * 1.6, { type: 'sawtooth', vol: 0.08, cut: 600, cutEnd: 220, q: 4, pump: true });
      if (sec === 0 && s === 0) voice(t, mtof(root), barLen, { type: 'sine', vol: 0.09, cut: 300, att: 0.2, rel: 0.4 });
      if (s % 2 === 0) voice(t, mtof(ch[[0, 1, 2, 1, 2, 1, 0, 2][s / 2]] + 12), sp * 1.4, { type: 'square', vol: sec === 3 ? 0.012 : 0.02, cut: 2600, send: 0.45 });
      if (drums && s % 8 === 0) kick(t, 0.45);
      if (drums && (s === 4 || s === 12)) snare(t, 0.1);
      if ((drums || sec === 3) && s % 4 === 2) hat(t, 0.025);
    }
    // lead melody in the third section
    const ld = T.lead[s];
    if (sec === 2 && ld != null) {
      const note = ld === 3 ? ch[0] + 12 : ch[ld];
      voice(t, mtof(note + 12), sp * (cur === 'colony' ? 3 : 1.8), { type: cur === 'battle' ? 'sawtooth' : 'triangle', vol: cur === 'battle' ? 0.024 : 0.034, cut: cur === 'battle' ? 3000 : 4200, att: 0.01, rel: 0.25, send: 0.5, rs: 0.3 });
    }
  }
  function schedule() {
    mgraph();
    const w = wantTrack();
    if (w !== cur) { // new scene: start the other track from its first bar
      cur = w; step = 0; nextT = Math.max(nextT, ac.currentTime + 0.05);
      mx.dl.delayTime.setValueAtTime(60 / TRACKS[cur].bpm * 0.75, ac.currentTime);
    }
    const T = TRACKS[cur], sp = 60 / T.bpm / 4;
    if (nextT < ac.currentTime - 0.2) nextT = ac.currentTime + 0.05; // after a pause, don't try to catch up
    while (nextT < ac.currentTime + 0.3) {
      try { playStep(T, step % 16, Math.floor(step / 16), nextT, sp); } catch (_) {}
      step++; nextT += sp;
    }
  }
  S.meter = () => { if (!ac) return null; const an = ac.createAnalyser(); an.fftSize = 2048; master.connect(an); return an; }; // dev: level check
  S.updateMusic = function () {
    if (!ac || ac.state !== 'running') return;
    const on = settings().music && !document.hidden && !S.adPlaying;
    musicBus.gain.setTargetAtTime(on ? 0.8 : 0, ac.currentTime, 0.3);
    if (on && !timer) { nextT = ac.currentTime + 0.1; timer = setInterval(schedule, 90); }
    if (!on && timer) { clearInterval(timer); timer = null; }
  };
  document.addEventListener('visibilitychange', () => S.updateMusic());
  return S;
})();
