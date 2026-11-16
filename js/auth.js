// Login / registration / password-reset screens shown before the game.
G.Auth = (function () {
  const A = {};
  const t = (k, p) => G.t(k, p);
  const $ = (s) => document.querySelector(s);
  let mode = 'register', busy = false, notice = '';

  A.isOpen = () => !!$('#auth') && !$('#auth').classList.contains('hidden');

  // modes: 'login' | 'register' | 'forgot' | 'newpass'
  A.show = function (startMode, msg) {
    mode = startMode || (localStorage.getItem('cyberwar_had_account') ? 'login' : 'register');
    notice = msg || '';
    let el = $('#auth');
    if (!el) { el = document.createElement('div'); el.id = 'auth'; document.getElementById('ui').appendChild(el); }
    el.classList.remove('hidden');
    render();
  };
  A.hide = () => { const el = $('#auth'); if (el) el.classList.add('hidden'); };

  function fields() {
    if (mode === 'register') return `
      <label class="fld">${t('username')}<input id="a-user" autocomplete="username" maxlength="16" placeholder="${t('usernameHint')}" autocapitalize="off" spellcheck="false"><small id="a-user-st"></small></label>
      <label class="fld">E-mail<input id="a-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false"></label>
      <label class="fld">${t('password')}<input id="a-pass" type="password" autocomplete="new-password" placeholder="${t('passwordHint')}"></label>
      <label class="chk"><input type="checkbox" id="a-terms"><span>${t('termsText').replace('{link}', `<a href="privacy.html" target="_blank" rel="noopener">${t('privacyPolicy')}</a>`)}</span></label>`;
    if (mode === 'login') return `
      <label class="fld">${t('loginId')}<input id="a-login" autocomplete="username" autocapitalize="off" spellcheck="false"></label>
      <label class="fld">${t('password')}<input id="a-pass" type="password" autocomplete="current-password"></label>`;
    if (mode === 'forgot') return `
      <p class="hint">${t('forgotText')}</p>
      <label class="fld">E-mail<input id="a-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false"></label>`;
    return `
      <p class="hint">${t('newPassText')}</p>
      <label class="fld">${t('newPassword')}<input id="a-pass" type="password" autocomplete="new-password" placeholder="${t('passwordHint')}"></label>
      <label class="fld">${t('repeatPassword')}<input id="a-pass2" type="password" autocomplete="new-password"></label>`;
  }
  const submitLabel = () => ({ register: t('createAccount'), login: t('login'), forgot: t('sendResetLink'), newpass: t('savePassword') })[mode];

  function render() {
    const el = $('#auth');
    const tabs = mode === 'login' || mode === 'register';
    el.innerHTML = `
      <div class="auth-panel">
        <div class="auth-logo">CYBER<span>WAR</span></div>
        <div class="auth-lang"><button data-l="pl" class="${G.lang === 'pl' ? 'on' : ''}">PL</button><button data-l="en" class="${G.lang === 'en' ? 'on' : ''}">EN</button></div>
        ${tabs ? `<div class="seg auth-tabs"><button data-m="login" class="${mode === 'login' ? 'on' : ''}">${t('login')}</button><button data-m="register" class="${mode === 'register' ? 'on' : ''}">${t('register')}</button></div>`
          : `<h3 class="auth-h">${mode === 'forgot' ? t('resetPassword') : t('newPassword')}</h3>`}
        <form id="auth-form" novalidate>
          ${fields()}
          <div class="auth-ok" id="a-ok">${notice}</div>
          <div class="auth-err" id="a-err"></div>
          <button class="btn primary auth-go" type="submit">${submitLabel()}</button>
        </form>
        ${mode === 'login' ? `<p class="center"><button class="link-btn" id="a-forgot">${t('forgotPassword')}</button></p>` : ''}
        ${mode === 'forgot' ? `<p class="center"><button class="link-btn" id="a-back">← ${t('backToLogin')}</button></p>` : ''}
        <p class="hint"><a href="privacy.html" target="_blank" rel="noopener">${t('privacyPolicy')}</a></p>
      </div>`;
    el.querySelectorAll('.auth-tabs button').forEach((b) => { b.onclick = () => { mode = b.dataset.m; notice = ''; render(); }; });
    el.querySelectorAll('.auth-lang button').forEach((b) => {
      b.onclick = () => { G.lang = b.dataset.l; if (G.state) G.state.lang = G.lang; try { localStorage.setItem('cyberwar_lang', G.lang); } catch (_) {} G.UI.applyLang(); render(); };
    });
    if ($('#a-forgot')) $('#a-forgot').onclick = () => { mode = 'forgot'; notice = ''; render(); };
    if ($('#a-back')) $('#a-back').onclick = () => { mode = 'login'; notice = ''; render(); };
    $('#auth-form').onsubmit = (e) => { e.preventDefault(); submit(); };
    const u = $('#a-user');
    if (u) {
      let timer = null;
      u.oninput = () => {
        const v = u.value.trim(), st = $('#a-user-st');
        clearTimeout(timer);
        if (!v) { st.textContent = ''; return; }
        if (!/^[A-Za-z0-9_]{3,16}$/.test(v)) { st.textContent = t('usernameRules'); st.className = 'bad'; return; }
        st.textContent = '…'; st.className = '';
        timer = setTimeout(async () => {
          try { const ok = await G.Net.usernameAvailable(v); if (u.value.trim() === v) { st.textContent = ok ? t('usernameFree') : t('usernameTaken'); st.className = ok ? 'good' : 'bad'; } }
          catch (_) { st.textContent = ''; }
        }, 400);
      };
    }
  }

  function err(msg) { const e = $('#a-err'); if (e) e.textContent = msg; if (msg) G.Sfx.play('error'); }
  function ok(msg) { notice = msg; const e = $('#a-ok'); if (e) e.textContent = msg; }
  const val = (id) => ($(id) ? $(id).value : '');
  const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  async function submit() {
    if (busy) return;
    err(''); ok('');
    const pass = val('#a-pass');
    // validate before touching the network
    if (mode === 'register') {
      if (!/^[A-Za-z0-9_]{3,16}$/.test(val('#a-user').trim())) return err(t('usernameRules'));
      if (!emailOk(val('#a-email').trim())) return err(t('err_badEmail'));
      if (pass.length < 6) return err(t('err_weakPassword'));
      if (!$('#a-terms').checked) return err(t('mustAccept'));
    } else if (mode === 'login') {
      if (!val('#a-login').trim()) return err(t('loginIdMissing'));
      if (!pass) return err(t('err_badLogin'));
    } else if (mode === 'forgot') {
      if (!emailOk(val('#a-email').trim())) return err(t('err_badEmail'));
    } else {
      if (pass.length < 6) return err(t('err_weakPassword'));
      if (pass !== val('#a-pass2')) return err(t('passMismatch'));
    }
    busy = true;
    const btn = $('.auth-go'); btn.disabled = true; btn.textContent = '…';
    try {
      if (mode === 'register') {
        const user = val('#a-user').trim();
        if (!(await G.Net.usernameAvailable(user))) throw new G.Net.NetError('usernameTaken');
        await G.Net.signUp(val('#a-email').trim(), pass, user);
        await finishLogin();
      } else if (mode === 'login') {
        await G.Net.signIn(val('#a-login').trim(), pass);
        await finishLogin();
      } else if (mode === 'forgot') {
        await G.Net.requestReset(val('#a-email').trim());
        mode = 'login'; notice = t('resetSent'); render();
      } else {
        await G.Net.updatePassword(pass);
        await G.Net.loadProfile();
        await finishLogin();
        G.UI.toast(t('passwordChanged'));
      }
    } catch (e) {
      err(t('err_' + (e.code || 'server')));
    }
    busy = false;
    const b2 = $('.auth-go'); if (b2) { b2.disabled = false; b2.textContent = submitLabel(); }
  }

  async function finishLogin() {
    try { localStorage.setItem('cyberwar_had_account', '1'); } catch (_) {}
    await A.afterLogin();
  }

  // Loads the right save for this account, then starts the game.
  A.afterLogin = async function () {
    const s = await G.Net.resolveState(G.load());
    G.applyState(s);
    A.hide();
    G.Net.pushSave().catch(() => {}).then(() => G.Net.checkDefenses());
  };

  return A;
})();
