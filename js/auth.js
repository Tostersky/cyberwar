// Login / registration screen shown before the game.
G.Auth = (function () {
  const A = {};
  const t = (k, p) => G.t(k, p);
  const $ = (s) => document.querySelector(s);
  let mode = 'register', busy = false;

  A.isOpen = () => !!$('#auth') && !$('#auth').classList.contains('hidden');

  A.show = function (startMode) {
    mode = startMode || (localStorage.getItem('cyberwar_had_account') ? 'login' : 'register');
    let el = $('#auth');
    if (!el) { el = document.createElement('div'); el.id = 'auth'; document.getElementById('ui').appendChild(el); }
    el.classList.remove('hidden');
    render();
  };
  A.hide = () => { const el = $('#auth'); if (el) el.classList.add('hidden'); };

  function render() {
    const el = $('#auth');
    const reg = mode === 'register';
    el.innerHTML = `
      <div class="auth-panel">
        <div class="auth-logo">CYBER<span>WAR</span></div>
        <div class="auth-lang"><button data-l="pl" class="${G.lang === 'pl' ? 'on' : ''}">PL</button><button data-l="en" class="${G.lang === 'en' ? 'on' : ''}">EN</button></div>
        <div class="seg auth-tabs"><button data-m="login" class="${reg ? '' : 'on'}">${t('login')}</button><button data-m="register" class="${reg ? 'on' : ''}">${t('register')}</button></div>
        <form id="auth-form" novalidate>
          ${reg ? `<label class="fld">${t('username')}<input id="a-user" autocomplete="username" maxlength="16" placeholder="${t('usernameHint')}" autocapitalize="off" spellcheck="false"><small id="a-user-st"></small></label>` : ''}
          <label class="fld">E-mail<input id="a-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false"></label>
          <label class="fld">${t('password')}<input id="a-pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? t('passwordHint') : ''}"></label>
          ${reg ? `<label class="chk"><input type="checkbox" id="a-terms"><span>${t('termsText').replace('{link}', `<a href="privacy.html" target="_blank" rel="noopener">${t('privacyPolicy')}</a>`)}</span></label>` : ''}
          <div class="auth-err" id="a-err"></div>
          <button class="btn primary auth-go" type="submit">${reg ? t('createAccount') : t('login')}</button>
        </form>
        ${reg ? '' : `<p class="hint">${t('forgotHint')}</p>`}
        <p class="hint"><a href="privacy.html" target="_blank" rel="noopener">${t('privacyPolicy')}</a></p>
      </div>`;
    el.querySelectorAll('.auth-tabs button').forEach((b) => { b.onclick = () => { mode = b.dataset.m; render(); }; });
    el.querySelectorAll('.auth-lang button').forEach((b) => {
      b.onclick = () => { G.lang = b.dataset.l; if (G.state) G.state.lang = G.lang; try { localStorage.setItem('cyberwar_lang', G.lang); } catch (_) {} G.UI.applyLang(); render(); };
    });
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

  async function submit() {
    if (busy) return;
    const reg = mode === 'register';
    const email = ($('#a-email').value || '').trim(), pass = $('#a-pass').value || '';
    const user = reg ? ($('#a-user').value || '').trim() : '';
    if (reg && !/^[A-Za-z0-9_]{3,16}$/.test(user)) return err(t('usernameRules'));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err(t('err_badEmail'));
    if (pass.length < 6) return err(t('err_weakPassword'));
    if (reg && !$('#a-terms').checked) return err(t('mustAccept'));
    busy = true; err('');
    const btn = $('.auth-go'); btn.disabled = true; btn.textContent = '…';
    try {
      if (reg) {
        if (!(await G.Net.usernameAvailable(user))) throw new G.Net.NetError('usernameTaken');
        await G.Net.signUp(email, pass, user);
      } else {
        await G.Net.signIn(email, pass);
      }
      try { localStorage.setItem('cyberwar_had_account', '1'); } catch (_) {}
      await A.afterLogin();
    } catch (e) {
      err(t('err_' + (e.code || 'server')));
      btn.disabled = false; btn.textContent = reg ? t('createAccount') : t('login');
    }
    busy = false;
  }

  // Loads the right save for this account, then starts the game.
  A.afterLogin = async function () {
    const s = await G.Net.resolveState(G.load());
    G.applyState(s);
    A.hide();
    G.Net.pushSave().catch(() => {});
  };

  return A;
})();
