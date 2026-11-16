// Online accounts + cloud saves via Supabase (plain fetch, no library).
// The publishable key is meant to be public; Row Level Security on the server protects player data.
G.Net = (function () {
  const URL_ = 'https://cpwfatmoztysettztnyo.supabase.co';
  const KEY = 'sb_publishable__NJv0uJyZVDGnHu5Jf8MzA_oEF3Cs3j';
  const SKEY = 'cyberwar_session';
  const N = { session: null, profile: null, dirty: false, lastPush: 0 };
  N.GAME_URL = 'https://tostersky.github.io/cyberwar/';

  function loadSession() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (_) { return null; } }
  function storeSession(s) { N.session = s; try { if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); } catch (_) {} }
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
    storeSession(null); N.profile = null;
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
  N.loadSave = async function () {
    await ensureFresh();
    const r = await req('/rest/v1/saves?select=data,updated_at&user_id=eq.' + N.uid(), { auth: true });
    return r && r[0] ? r[0].data : null;
  };
  N.pushSave = async function (keepalive) {
    if (!N.session || !G.state) return;
    await ensureFresh();
    G.state.owner = N.uid(); G.state.savedAt = Date.now();
    await req('/rest/v1/saves', { method: 'POST', auth: true, keepalive, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { user_id: N.uid(), data: G.state, updated_at: new Date().toISOString() } });
    await N.publishBase(keepalive);
    N.dirty = false; N.lastPush = Date.now();
  };

  // ---------- PvP ----------
  const rpc = (name, body, keepalive) => req('/rest/v1/rpc/' + name, { method: 'POST', auth: true, keepalive, body: body || {} });
  // what other players attack: finished buildings + 20% of stored resources as loot
  N.publishBase = async function (keepalive) {
    const s = G.state;
    const layout = s.buildings.filter((b) => b.level > 0).map((b) => [b.type, b.level, b.x, b.y]);
    await rpc('publish_base', { p_layout: layout, p_core: G.coreLevel(), p_scrap: Math.floor(s.res.scrap * 0.2), p_copper: Math.floor(s.res.copper * 0.2) }, keepalive);
  };
  N.findOpponent = async function () {
    await ensureFresh();
    const r = await rpc('find_opponent');
    return r && r[0] ? r[0] : null;
  };
  N.submitAttack = async function (defender, stars, pct, scrap, copper) {
    await ensureFresh();
    return await rpc('submit_attack', { p_defender: defender, p_stars: stars, p_pct: pct, p_scrap: scrap, p_copper: copper });
  };
  N.fetchDefenses = async function () {
    await ensureFresh();
    return await req('/rest/v1/attacks?select=attacker_name,stars,pct,loot_scrap,loot_copper,trophies,created_at&seen=is.false&order=created_at.asc&defender=eq.' + N.uid(), { auth: true });
  };
  N.markSeen = async function () { await ensureFresh(); await rpc('mark_attacks_seen'); };
  N.leaderboard = async function () {
    return await req('/rest/v1/profiles?select=username,trophies&order=trophies.desc,created_at.asc&limit=50', { auth: !!N.session });
  };

  // Applies attacks made on this player while away: lost loot, trophies, defense report.
  let checking = false;
  N.checkDefenses = async function () {
    if (!N.session || checking) return;
    checking = true;
    try {
      const list = await N.fetchDefenses();
      if (list && list.length) {
        const s = G.state;
        s.defLog = s.defLog || [];
        for (const a of list) {
          s.res.scrap = Math.max(0, s.res.scrap - a.loot_scrap);
          s.res.copper = Math.max(0, s.res.copper - a.loot_copper);
          s.defLog.unshift({ name: a.attacker_name, stars: a.stars, pct: a.pct, scrap: a.loot_scrap, copper: a.loot_copper, trophies: a.trophies, at: a.created_at });
        }
        s.defLog = s.defLog.slice(0, 20);
        await N.markSeen();
        await N.loadProfile();
        if (N.profile) s.trophies = N.profile.trophies;
        G.save();
        await N.pushSave();
        if (G.UI && G.scene === G.Village) G.UI.openDefenseLog(list.length);
      }
    } catch (_) {}
    checking = false;
  };
  setInterval(() => { if (G.scene === G.Village && !document.hidden) N.checkDefenses(); }, 60000);
  N.markDirty = () => { N.dirty = true; };
  // background sync: every 20 s if something changed, and right away when the app goes to background
  setInterval(() => { if (N.dirty && N.session) N.pushSave().catch(() => {}); }, 20000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && N.dirty && N.session) N.pushSave(true).catch(() => {}); });

  // Picks which save to play after login: cloud wins, unless this device has newer progress of the same account
  // (or progress made before accounts existed, which gets attached to the new account).
  N.resolveState = async function (local) {
    const cloud = await N.loadSave();
    let s;
    if (cloud && local && local.owner === N.uid() && (local.savedAt || 0) > (cloud.savedAt || 0)) s = local;
    else if (cloud) s = cloud;
    else if (local && (!local.owner || local.owner === N.uid())) s = local;
    else s = G.newGame();
    if (N.profile) { s.name = N.profile.username; s.trophies = N.profile.trophies; }
    s.owner = N.uid();
    return s;
  };

  N.restore = function () { N.session = loadSession(); return !!N.session; };
  N.ensureFresh = ensureFresh;
  return N;
})();
