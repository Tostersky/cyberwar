// Online accounts + cloud saves via Supabase (plain fetch, no library).
// The publishable key is meant to be public; Row Level Security on the server protects player data.
G.Net = (function () {
  const URL_ = 'https://cpwfatmoztysettztnyo.supabase.co';
  const KEY = 'sb_publishable__NJv0uJyZVDGnHu5Jf8MzA_oEF3Cs3j';
  const SKEY = 'cyberwar_session';
  const N = { session: null, profile: null, dirty: false, lastPush: 0 };

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
  N.signUp = async function (email, password, username) {
    const b = await req('/auth/v1/signup', { method: 'POST', body: { email, password, data: { username } } });
    if (!takeSession(b)) throw new NetError('notConfirmed');
    await N.loadProfile();
  };
  N.signIn = async function (email, password) {
    const b = await req('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    takeSession(b);
    await N.loadProfile();
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
    if (N.profile && N.profile.trophies !== G.state.trophies) {
      await req('/rest/v1/profiles?id=eq.' + N.uid(), { method: 'PATCH', auth: true, keepalive, headers: { Prefer: 'return=minimal' }, body: { trophies: G.state.trophies } });
      N.profile.trophies = G.state.trophies;
    }
    N.dirty = false; N.lastPush = Date.now();
  };
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
    if (N.profile) s.name = N.profile.username;
    s.owner = N.uid();
    return s;
  };

  N.restore = function () { N.session = loadSession(); return !!N.session; };
  N.ensureFresh = ensureFresh;
  return N;
})();
