// Online accounts + cloud saves via Supabase (plain fetch, no library).
// The publishable key is meant to be public; Row Level Security on the server protects player data.
G.Net = (function () {
  const URL_ = 'https://cpwfatmoztysettztnyo.supabase.co';
  const KEY = 'sb_publishable__NJv0uJyZVDGnHu5Jf8MzA_oEF3Cs3j';
  const SKEY = 'cyberwar_session';
  const N = { session: null, profile: null, dirty: false, lastPush: 0 };
  N.GAME_URL = 'https://tostersky.github.io/cyberwar/';

  function loadSession() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (_) { return null; } }
  function storeSession(s) { if (!s || !N.session || N.session.user.id !== s.user.id) N.admin = null; N.session = s; try { if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); } catch (_) {} }
  N.uid = () => (N.session && N.session.user ? N.session.user.id : null);
  N.email = () => (N.session && N.session.user ? N.session.user.email : '');

  class NetError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }
  N.NetError = NetError;

  function mapError(status, body) {
    const m = ((body && (body.msg || body.message || body.error_description || body.error)) || '') + '';
    const code = (body && (body.error_code || body.code)) || '';
    if (/already registered|already been registered|user_already_exists/i.test(m + code)) return new NetError('emailTaken', m);
    if (/invalid login credentials|invalid_credentials/i.test(m + code)) return new NetError('badLogin', m);
    if (/email not confirmed|email_not_confirmed/i.test(m + code)) return new NetError('notConfirmed', m);
    if (/password/i.test(m) && /least|weak|short/i.test(m)) return new NetError('weakPassword', m);
    if (/database error saving new user|unexpected_failure/i.test(m + code)) return new NetError('usernameTaken', m);
    if (/invalid.*email|email.*invalid|validation_failed/i.test(m + code)) return new NetError('badEmail', m);
    if (/rate limit|too many/i.test(m + code) || status === 429) return new NetError('rateLimit', m);
    if (status === 401 || /jwt/i.test(m)) return new NetError('auth', m);
    return new NetError('server', m || ('HTTP ' + status));
  }

  async function req(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ apikey: KEY, 'Content-Type': 'application/json' }, opts.headers || {});
    if (opts.auth && N.session) headers.Authorization = 'Bearer ' + N.session.access_token;
    let res;
    try {
      res = await fetch(URL_ + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined, keepalive: !!opts.keepalive });
    } catch (e) { throw new NetError('offline', String(e)); }
    const text = await res.text();
    let body = null; try { body = text ? JSON.parse(text) : null; } catch (_) { body = { message: text }; }
    if (!res.ok) throw mapError(res.status, body);
    return body;
  }

  function takeSession(b) {
    if (!b || !b.access_token) return false;
    storeSession({ access_token: b.access_token, refresh_token: b.refresh_token, expires_at: b.expires_at || (Math.floor(Date.now() / 1000) + (b.expires_in || 3600)), user: { id: b.user.id, email: b.user.email } });
    return true;
  }

  async function ensureFresh() {
    if (!N.session) throw new NetError('auth');
    if (N.session.expires_at - 90 > Date.now() / 1000) return;
    const b = await req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: N.session.refresh_token } });
    takeSession(b);
  }

  N.usernameAvailable = async function (name) {
    return !!(await req('/rest/v1/rpc/username_available', { method: 'POST', body: { name } }));
  };
  // Returns 'confirm' when the player must click the link in the confirmation email first.
  N.signUp = async function (email, password, username) {
    const b = await req('/auth/v1/signup?redirect_to=' + encodeURIComponent(N.GAME_URL), { method: 'POST', body: { email, password, data: { username } } });
    if (!takeSession(b)) return 'confirm';
    await N.loadProfile();
    return 'ok';
  };
  N.resendConfirm = async function (email) {
    await req('/auth/v1/resend?redirect_to=' + encodeURIComponent(N.GAME_URL), { method: 'POST', body: { type: 'signup', email } });
  };
  // login = email OR username. For a username the server returns the email only if the password is right.
  N.signIn = async function (login, password) {
    let email = login;
    if (!login.includes('@')) {
      email = await req('/rest/v1/rpc/email_for_login', { method: 'POST', body: { p_username: login, p_password: password } });
      if (!email) throw new NetError('badLogin');
    }
    const b = await req('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    takeSession(b);
    await N.loadProfile();
  };

  // ---------- password reset ----------
  N.requestReset = async function (email) {
    await req('/auth/v1/recover?redirect_to=' + encodeURIComponent(N.GAME_URL), { method: 'POST', body: { email } });
  };
  // The reset email link brings the player back with #access_token=...&type=recovery (or #error=...).
  // Returns 'recovery', 'error' or null.
  N.consumeAuthHash = async function () {
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.get('access_token') && !h.get('error') && !h.get('error_code')) return null;
    history.replaceState(null, '', location.pathname + location.search);
    if (h.get('error') || h.get('error_code')) return 'error';
    const access = h.get('access_token');
    const user = await req('/auth/v1/user', { headers: { Authorization: 'Bearer ' + access } });
    takeSession({ access_token: access, refresh_token: h.get('refresh_token'), expires_in: +h.get('expires_in') || 3600, user });
    return h.get('type') === 'recovery' ? 'recovery' : 'login';
  };
  N.updatePassword = async function (password) {
    await ensureFresh();
    await req('/auth/v1/user', { method: 'PUT', auth: true, body: { password } });
  };
  N.signOut = async function () {
    try { if (N.session) await req('/auth/v1/logout', { method: 'POST', auth: true }); } catch (_) {}
    storeSession(null); N.profile = null; N.admin = null;
  };
  N.deleteAccount = async function () {
    await ensureFresh();
    await req('/rest/v1/rpc/delete_my_account', { method: 'POST', auth: true, body: {} });
    storeSession(null); N.profile = null;
  };
  N.loadProfile = async function () {
    await ensureFresh();
    const r = await req('/rest/v1/profiles?select=username,trophies&id=eq.' + N.uid(), { auth: true });
    N.profile = r && r[0] ? r[0] : null;
    return N.profile;
  };
  // ---------- authoritative game server (Supabase Edge Function "game") ----------
  // Commands run instantly on the phone and are sent in small batches; the server replays them with the same
  // rules (econ.js), saves, publishes the PvP base, applies attacks on us, and returns the true state.
  N.pending = [];
  let inflight = null, flushTimer = null, retryMs = 2000;
  N.queue = function (cmd) {
    if (!N.session) return;
    N.pending.push(cmd);
    clearTimeout(flushTimer); flushTimer = setTimeout(() => N.flush().catch(() => {}), 700);
  };
  N.queueMeta = function () {
    if (!N.session || !G.state) return;
    const s = G.state, m = { c: 'meta', settings: s.settings, lang: s.lang, tut: s.tut, flags: s.flags };
    const i = N.pending.findIndex((c) => c.c === 'meta');
    if (i >= 0) N.pending[i] = m; else N.queue(m);
  };
  async function callGame(cmds, keepalive) {
    await ensureFresh();
    return await req('/functions/v1/game', { method: 'POST', auth: true, keepalive, body: { cmds } });
  }
  // send pending commands (or just ask for the latest state); resolves with the server reply
  N.flush = async function (keepalive) {
    if (!N.session) return null;
    if (inflight) { await inflight.catch(() => {}); if (!N.pending.length) return null; }
    const batch = N.pending.splice(0);
    inflight = (async () => {
      try {
        const r = await callGame(batch, keepalive);
        retryMs = 2000;
        N.adopt(r);
        return r;
      } catch (e) {
        N.pending.unshift(...batch);
        if (e.code === 'auth') { await N.signOut(); G.Auth.show('login', G.t('err_auth')); }
        else { clearTimeout(flushTimer); flushTimer = setTimeout(() => N.flush().catch(() => {}), retryMs); retryMs = Math.min(60000, retryMs * 2); }
        throw e;
      }
    })();
    try { return await inflight; } finally { inflight = null; }
  };
  // take the server's state, then re-apply anything queued meanwhile so the screen doesn't jump back
  N.adopt = function (r) {
    if (!r || !r.state) return;
    const s = G.Econ.norm(r.state, Date.now());
    for (const c of N.pending) G.Econ.apply(s, c, Date.now());
    const selId = G.Village.sel && G.Village.sel.id;
    G.state = s;
    if (N.profile) N.profile.trophies = s.trophies;
    G.save(true);
    if (selId != null) { const b = G.Econ.findB(s, selId); if (b && G.scene === G.Village) G.Village.select(b); else G.Village.select(null); }
    if (G.UI) G.UI.refreshHud();
    if (r.defenses && r.defenses.length && G.UI && G.scene === G.Village && !G.UI.isModal()) G.UI.openDefenseLog(r.defenses.length);
    if (r.received && r.received.length && G.UI) G.UI.notify(G.t('gotDonations', { n: r.received.length, who: [...new Set(r.received.map((x) => x.from))].join(', ') }));
  };
  // run one command on the server right now and return its result (used for paid actions)
  N.callNow = async function (cmd) {
    await N.flush().catch(() => {});
    const r = await callGame([cmd]);
    N.adopt(r);
    return (r.results && r.results[0]) || { err: 'server' };
  };
  // first contact after login: the server's save becomes the game
  N.sync = async function () {
    const r = await callGame([]);
    G.applyState(r.state);
    if (r.defenses && r.defenses.length) setTimeout(() => G.UI.openDefenseLog(r.defenses.length), 600);
    return r;
  };
  // every 90 s while playing: hear about attacks on our base
  setInterval(() => { if (N.session && !document.hidden && G.scene === G.Village && !N.pending.length) N.flush().catch(() => {}); }, 90000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && N.pending.length) N.flush(true).catch(() => {}); });

  // ---------- PvP ----------
  const rpc = (name, body, keepalive) => req('/rest/v1/rpc/' + name, { method: 'POST', auth: true, keepalive, body: body || {} });
  N.findOpponent = async function () {
    await ensureFresh();
    const r = await rpc('find_opponent');
    return r && r[0] ? r[0] : null;
  };
  N.submitAttack = async function (defender, stars, pct, scrap, copper) {
    await ensureFresh();
    return await rpc('submit_attack', { p_defender: defender, p_stars: stars, p_pct: pct, p_scrap: scrap, p_copper: copper });
  };
  // ---------- clans ----------
  const crpc = async (name, body) => { await ensureFresh(); return rpc(name, body); };
  N.clan = {
    mine: async () => {
      await ensureFresh();
      const m = await req('/rest/v1/clan_members?select=clan_id,role&user_id=eq.' + N.uid(), { auth: true });
      if (!m || !m[0]) return null;
      const c = await req('/rest/v1/clans?select=id,name,description,emblem,min_trophies&id=eq.' + m[0].clan_id, { auth: true });
      return c && c[0] ? Object.assign({ role: m[0].role }, c[0]) : null;
    },
    search: (q) => crpc('clan_search', { p_q: q || '' }),
    create: (name, desc, emblem, min) => crpc('clan_create', { p_name: name, p_desc: desc, p_emblem: emblem, p_min: min }),
    join: (id) => crpc('clan_join', { p_clan: id }),
    leave: () => crpc('clan_leave'),
    kick: (u) => crpc('clan_kick', { p_user: u }),
    promote: (u) => crpc('clan_promote', { p_user: u }),
    demote: (u) => crpc('clan_demote', { p_user: u }),
    send: (body) => crpc('clan_send', { p_body: body }),
    request: (body) => crpc('clan_request', { p_body: body }),
    roster: (id) => crpc('clan_roster', { p_clan: id }),
    // newest 60 messages, or only those after `after`
    messages: async (id, after) => {
      await ensureFresh();
      const q = after ? '&id=gt.' + after + '&order=id.asc' : '&order=id.desc&limit=60';
      const r = await req('/rest/v1/clan_messages?select=id,user_id,username,kind,body,data,created_at&clan_id=eq.' + id + q, { auth: true });
      return after ? r : (r || []).reverse();
    },
  };

  // "report a bug / idea" — goes to the feedback table (players can write, only the developer can read)
  N.sendFeedback = async function (kind, body) {
    await ensureFresh();
    const device = (navigator.userAgent || '').slice(0, 220) + ' | ' + window.innerWidth + 'x' + window.innerHeight;
    await req('/rest/v1/feedback', { method: 'POST', auth: true, headers: { Prefer: 'return=minimal' },
      body: { user_id: N.uid(), kind, body: String(body).slice(0, 1000), version: G.VERSION, device } });
  };
  // developer tools: is this account an admin? (RLS lets you see only your own admin row)
  N.isAdmin = async function () {
    if (!N.session) return false;
    if (N.admin != null) return N.admin;
    try { await ensureFresh(); const r = await req('/rest/v1/admins?select=user_id&user_id=eq.' + N.uid(), { auth: true }); N.admin = !!(r && r.length); }
    catch (_) { N.admin = false; }
    return N.admin;
  };
  N.feedbackList = async function () {
    await ensureFresh();
    return await req('/rest/v1/feedback?select=id,created_at,username,kind,body,version,device,status,note,target_user,target_msg&order=created_at.desc&limit=500', { auth: true });
  };
  N.feedbackUpdate = async function (id, fields) {
    await ensureFresh();
    await req('/rest/v1/feedback?id=eq.' + id, { method: 'PATCH', auth: true, headers: { Prefer: 'return=minimal' }, body: fields });
  };
  // ---------- push notifications ----------
  N.pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  N.pushOn = async function () {
    if (!N.pushSupported()) throw new NetError('pushNo');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new NetError('pushDenied');
    const reg = await navigator.serviceWorker.ready;
    const k = await N.callNow({ c: 'pushKey' });
    if (!k || !k.key) throw new NetError('server');
    const raw = atob(k.key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - k.key.length % 4) % 4));
    const appKey = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    const r = await N.callNow({ c: 'pushSub', sub: sub.toJSON(), lang: G.lang });
    if (r.err) throw new NetError(r.err);
    try { localStorage.setItem('cyberwar_push', '1'); } catch (_) {}
  };
  N.pushOffNow = async function () {
    try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } catch (_) {}
    try { localStorage.removeItem('cyberwar_push'); } catch (_) {}
    await N.callNow({ c: 'pushOff' });
  };
  N.pushIsOn = () => { try { return localStorage.getItem('cyberwar_push') === '1' && Notification.permission === 'granted'; } catch (_) { return false; } };

  // ---------- moderation: block / report / admin tools ----------
  N.blocks = async function () { await ensureFresh(); return (await req('/rest/v1/blocks?select=blocked_id,blocked_name&user_id=eq.' + N.uid(), { auth: true })) || []; };
  N.block = async function (id, name) { await ensureFresh(); await req('/rest/v1/blocks', { method: 'POST', auth: true, headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' }, body: { user_id: N.uid(), blocked_id: id, blocked_name: name } }); };
  N.unblock = async function (id) { await ensureFresh(); await req('/rest/v1/blocks?user_id=eq.' + N.uid() + '&blocked_id=eq.' + id, { method: 'DELETE', auth: true, headers: { Prefer: 'return=minimal' } }); };
  N.report = async function (id, name, msgId, text) {
    await ensureFresh();
    await req('/rest/v1/feedback', { method: 'POST', auth: true, headers: { Prefer: 'return=minimal' },
      body: { user_id: N.uid(), kind: 'report', body: ('🚩 ' + name + ': «' + String(text || '').slice(0, 300) + '»').slice(0, 1000), version: G.VERSION, device: '', target_user: id, target_msg: msgId || null } });
  };
  N.deleteMessage = async function (id) { await ensureFresh(); await req('/rest/v1/clan_messages?id=eq.' + id, { method: 'DELETE', auth: true, headers: { Prefer: 'return=minimal' } }); };
  N.mute = async function (id, days) { await ensureFresh(); await rpc('admin_mute', { p_user: id, p_days: days }); };
  // find players by nickname / look at someone's village
  N.searchPlayers = async function (q) { await ensureFresh(); return (await rpc('search_players', { p_q: q })) || []; };
  N.viewBase = async function (uid) { await ensureFresh(); const r = await rpc('view_base', { p_user: uid }); return r && r[0] ? r[0] : null; };
  // replay of an attack on us (kept with the attack row; RLS lets only the two players read it)
  N.replay = async function (attackId) {
    await ensureFresh();
    const r = await req('/rest/v1/attacks?select=replay,attacker_name,stars,pct&id=eq.' + (+attackId), { auth: true });
    return r && r[0] && r[0].replay ? Object.assign({ name: r[0].attacker_name }, r[0].replay) : null;
  };
  // revenge: the attacker's base (once per attack, within 24 h)
  N.revengeTarget = async function (attackId) {
    await ensureFresh();
    const r = await rpc('revenge_target', { p_attack: attackId });
    return r && r[0] ? r[0] : null;
  };
  N.leaderboard = async function () {
    return await req('/rest/v1/profiles?select=username,trophies,vip_until&order=trophies.desc,created_at.asc&limit=50', { auth: !!N.session });
  };

  N.restore = function () { N.session = loadSession(); return !!N.session; };
  N.ensureFresh = ensureFresh;
  return N;
})();
