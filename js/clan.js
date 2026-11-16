// Clan screen: browse/create/join, chat with unit requests and donations, member list.
G.Clan = (function () {
  const C = {};
  const t = (k, p) => G.t(k, p);
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const EMBLEMS = ['#ff2bd6', '#19f0ff', '#ffe14d', '#39ff88', '#ff5a3c', '#b26bff', '#ffffff', '#ff8a1f'];
  const emblem = (i, size) => `<span class="emb" style="--c:${EMBLEMS[i | 0] || EMBLEMS[0]};width:${size || 34}px;height:${size || 34}px"><i></i></span>`;
  let my = null, tab = 'chat', msgs = [], lastId = 0, pollT = null, roster = [];

  // friendly text for errors raised by the clan functions
  function errText(e) {
    const m = ((e && e.message) || '') + '';
    const map = [['already in a clan', 'clanErrIn'], ['clan name taken', 'clanErrTaken'], ['bad clan name', 'clanErrName'], ['clan full', 'clanErrFull'],
      ['not enough trophies', 'clanErrTrophies'], ['too fast', 'err_rateLimit'], ['not allowed', 'clanErrPerm'], ['not in a clan', 'clanErrNotIn']];
    for (const [k, v] of map) if (m.includes(k)) return t(v);
    return t('err_' + ((e && e.code) || 'server'));
  }
  const fail = (e) => G.UI.toast(errText(e));

  C.open = async function () {
    if (!G.Net.session) { G.UI.toast(t('clanLogin')); return; }
    stopPoll();
    G.UI.modal(t('clan'), '<div class="spin center-spin"></div>', { cls: 'wide clan-modal', onClose: stopPoll });
    try { my = await G.Net.clan.mine(); } catch (e) { fail(e); G.UI.closeModal(); return; }
    if (my) { tab = 'chat'; msgs = []; lastId = 0; renderClan(); } else renderBrowser('');
  };
  function stopPoll() { clearInterval(pollT); pollT = null; }

  // ---------- no clan: search + create ----------
  async function renderBrowser(q) {
    const body = $('#modal .panel-b'); if (!body) return;
    body.innerHTML = `<div class="clan-search"><input id="cl-q" placeholder="${t('clanSearch')}" value="${esc(q)}" maxlength="20"><button class="btn sm" id="cl-go">${t('search')}</button></div>
      <div id="cl-list" class="levels"><div class="spin center-spin"></div></div>
      <h3>${t('clanCreate')}</h3>
      <div class="clan-create">
        <label class="fld">${t('clanName')}<input id="cl-name" maxlength="20" placeholder="3–20"></label>
        <label class="fld">${t('clanDesc')}<input id="cl-desc" maxlength="120"></label>
        <label class="fld">${t('clanMin')}<input id="cl-min" type="number" min="0" max="5000" value="0" inputmode="numeric"></label>
        <div class="fld">${t('clanEmblem')}<div class="emb-pick">${EMBLEMS.map((_, i) => `<button data-e="${i}" class="${i === 0 ? 'on' : ''}">${emblem(i, 28)}</button>`).join('')}</div></div>
        <p class="hint">${t('clanPrice', { n: G.CLAN_PRICE })}</p>
        <div class="row-btns"><button class="btn primary" id="cl-create">${t('clanCreate')} · ${G.UI.IC.chips.replace('<svg', '<svg class="tro-ic"')} ${G.CLAN_PRICE}</button></div>
      </div>`;
    let pickE = 0;
    body.querySelectorAll('.emb-pick button').forEach((b) => { b.onclick = () => { pickE = +b.dataset.e; body.querySelectorAll('.emb-pick button').forEach((x) => x.classList.toggle('on', x === b)); }; });
    $('#cl-go').onclick = () => renderBrowser($('#cl-q').value.trim());
    $('#cl-q').onkeydown = (e) => { if (e.key === 'Enter') renderBrowser($('#cl-q').value.trim()); };
    $('#cl-create').onclick = async () => {
      const name = $('#cl-name').value.trim();
      if (!/^[A-Za-z0-9 _-]{3,20}$/.test(name)) { G.UI.toast(t('clanErrName')); return; }
      if (G.state.res.chips < G.CLAN_PRICE) { G.UI.toast(t('clanNeedChips', { n: G.CLAN_PRICE })); return; }
      // read the form now: the confirm dialog replaces it
      const desc = $('#cl-desc').value.trim(), min = Math.max(0, Math.min(5000, +$('#cl-min').value || 0)), emb = pickE;
      const go = async () => {
        try {
          const r = await G.Net.callNow({ c: 'createClan', name, desc, emblem: emb, min });
          if (r.err) { if (r.err === 'clan') fail({ message: r.message }); else G.UI.toast(t(r.err)); return; }
          G.Sfx.play('built'); C.open();
        } catch (e) { fail(e); }
      };
      G.UI.confirm(t('clanBuyQ', { n: G.CLAN_PRICE }), go);
    };
    let list = [];
    try { list = await G.Net.clan.search(q); } catch (e) { fail(e); }
    const el = $('#cl-list'); if (!el) return;
    const tro = G.state.trophies;
    el.innerHTML = list.length ? list.map((c) => `<div class="lvl clan-row">${emblem(c.emblem)}<div class="l-b"><div class="c-name">${esc(c.name)}</div>
        <small class="dim">${esc(c.description)}</small><div class="l-loot">👥 ${c.members}/30 · ${G.UI.IC.trophy.replace('<svg', '<svg class="tro-ic"')} ${c.trophies} · min ${c.min_trophies}</div></div>
        <button class="btn sm primary" data-j="${c.id}" ${c.members >= 30 || tro < c.min_trophies ? 'disabled' : ''}>${t('clanJoin')}</button></div>`).join('')
      : `<p class="hint">${t('clanNone')}</p>`;
    el.querySelectorAll('[data-j]').forEach((b) => {
      b.onclick = async () => { try { await G.Net.clan.join(+b.dataset.j); G.Sfx.play('built'); C.open(); } catch (e) { fail(e); } };
    });
  }

  // ---------- in a clan ----------
  function renderClan() {
    const body = $('#modal .panel-b'); if (!body) return;
    const h = $('#modal .panel-h h2'); if (h) h.innerHTML = `${emblem(my.emblem, 26)} ${esc(my.name)}`;
    body.innerHTML = `<div class="seg clan-tabs"><button data-t="chat" class="${tab === 'chat' ? 'on' : ''}">${t('clanChat')}</button><button data-t="members" class="${tab === 'members' ? 'on' : ''}">${t('clanMembers')}</button></div>
      <div id="cl-body"></div>`;
    body.querySelectorAll('.clan-tabs button').forEach((b) => { b.onclick = () => { tab = b.dataset.t; renderClan(); }; });
    if (tab === 'chat') renderChat(); else renderMembers();
  }

  async function renderChat() {
    stopPoll();
    const box = $('#cl-body'); if (!box) return;
    const cap = G.Econ.clanCap(G.state), have = G.Econ.clanSpace(G.state);
    box.innerHTML = `<div class="chat" id="cl-chat"><div class="spin center-spin"></div></div>
      <div class="chat-in"><input id="cl-msg" maxlength="200" placeholder="${t('clanSay')}"><button class="btn sm primary" id="cl-send">${t('send')}</button></div>
      <div class="row-btns"><button class="btn sm" id="cl-req" ${cap ? '' : 'disabled'}>${G.UI.IC.army.replace('<svg', '<svg class="tro-ic"')} ${t('clanAsk')} (${have}/${cap})</button></div>
      ${cap ? '' : `<p class="hint">${t('clanNeedHub')}</p>`}`;
    const send = async () => {
      const v = $('#cl-msg').value.trim(); if (!v) return;
      $('#cl-msg').value = '';
      try { await G.Net.clan.send(v); await poll(); } catch (e) { fail(e); }
    };
    $('#cl-send').onclick = send;
    $('#cl-msg').onkeydown = (e) => { if (e.key === 'Enter') send(); };
    $('#cl-req').onclick = async () => { try { await G.Net.clan.request(t('clanAskText')); G.Sfx.play('train'); await poll(); } catch (e) { fail(e); } };
    try { msgs = await G.Net.clan.messages(my.id); lastId = msgs.length ? msgs[msgs.length - 1].id : 0; } catch (e) { fail(e); }
    drawMsgs(true);
    pollT = setInterval(() => { if (!document.hidden) poll().catch(() => {}); }, 3500);
  }
  async function poll() {
    if (!$('#cl-chat')) { stopPoll(); return; }
    const more = await G.Net.clan.messages(my.id, lastId);
    // requests change (donations) without new ids: refresh them by reloading the recent window
    const fresh = await G.Net.clan.messages(my.id);
    msgs = fresh; lastId = msgs.length ? msgs[msgs.length - 1].id : lastId;
    drawMsgs(more && more.length > 0);
  }
  function drawMsgs(scroll) {
    const el = $('#cl-chat'); if (!el) return;
    const me = G.Net.uid();
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
    el.innerHTML = msgs.length ? msgs.map((m) => {
      const time = new Date(m.created_at).toLocaleTimeString(G.lang, { hour: '2-digit', minute: '2-digit' });
      if (m.kind === 'system') return `<div class="msg sys">${esc(m.body)}</div>`;
      if (m.kind === 'request') {
        const d = m.data || {}, mine = m.user_id === me, open = !d.closed;
        const donors = Object.entries(d.donors || {}).map(([n, c]) => esc(n) + ' ×' + c).join(', ');
        const btns = !mine && open ? G.UNIT_ORDER.filter((u) => G.state.army[u] > 0).map((u) =>
          `<button class="don" data-m="${m.id}" data-u="${u}"><img src="${G.Art.unitThumb(u)}" alt=""><span>${G.state.army[u]}</span></button>`).join('') : '';
        return `<div class="msg req ${mine ? 'me' : ''}"><b>${esc(m.username)}</b> <small>${time}</small>
          <div>${t('clanReqTitle')} ${d.cap ? `<b>${d.got || 0}/${d.cap}</b>` : ''} ${open ? '' : `· <span class="ok">${t('clanReqDone')}</span>`}</div>
          ${donors ? `<small class="dim">${t('clanDonors')}: ${donors}</small>` : ''}
          ${btns ? `<div class="don-row">${btns}</div>` : (!mine && open ? `<small class="dim">${t('clanNoUnits')}</small>` : '')}</div>`;
      }
      return `<div class="msg ${m.user_id === me ? 'me' : ''}"><b>${esc(m.username)}</b> <small>${time}</small><div>${esc(m.body)}</div></div>`;
    }).join('') : `<p class="hint">${t('clanEmpty')}</p>`;
    if (scroll || atBottom) el.scrollTop = el.scrollHeight;
    el.querySelectorAll('.don').forEach((b) => {
      b.onclick = () => {
        const u = b.dataset.u;
        if (!(G.state.army[u] > 0)) return;
        // optimistic: unit leaves our army now; the server confirms (or returns it on the next sync)
        G.state.army[u]--; G.save(true);
        G.Net.pending.push({ c: 'donate', msg: +b.dataset.m, u });
        G.Net.flush().then(() => poll()).catch(() => {});
        G.Sfx.play('deploy');
        drawMsgs(false);
      };
    });
  }

  async function renderMembers() {
    stopPoll();
    const box = $('#cl-body'); if (!box) return;
    box.innerHTML = '<div class="spin center-spin"></div>';
    try { roster = await G.Net.clan.roster(my.id); } catch (e) { fail(e); roster = []; }
    const me = G.Net.uid(), myRole = (roster.find((r) => r.user_id === me) || {}).role || my.role;
    const roleTxt = (r) => t('role_' + r);
    box.innerHTML = `<p class="hint">${esc(my.description)} · ${t('clanMin')}: ${my.min_trophies} · 👥 ${roster.length}/30</p>
      <div class="rank">${roster.map((r, i) => {
        const canKick = r.user_id !== me && (myRole === 'leader' || (myRole === 'elder' && r.role === 'member'));
        const canPro = myRole === 'leader' && r.user_id !== me;
        return `<div class="rk ${r.user_id === me ? 'me' : ''}"><span class="rk-n">${i + 1}</span><span class="rk-u">${esc(r.username)}${r.vip ? ' <span class="vip-badge sm">VIP</span>' : ''} <small class="role ${r.role}">${roleTxt(r.role)}</small></span>
          <span class="rk-t">${G.UI.IC.trophy}${r.trophies}</span>
          ${canPro ? `<button class="btn sm" data-p="${r.user_id}">▲</button>` : ''}${canPro && r.role === 'elder' ? `<button class="btn sm" data-d="${r.user_id}">▼</button>` : ''}
          ${canKick ? `<button class="btn sm danger" data-k="${r.user_id}">✖</button>` : ''}</div>`;
      }).join('')}</div>
      <div class="row-btns"><button class="btn danger" id="cl-leave">${t('clanLeave')}</button></div>`;
    const act = (sel, fn, confirmKey) => box.querySelectorAll(sel).forEach((b) => {
      b.onclick = () => {
        const go = async () => { try { await fn(b.getAttribute(sel.slice(1, -1))); } catch (e) { fail(e); } C.open().then(() => { tab = 'members'; renderClan(); }); };
        if (confirmKey) G.UI.confirm(t(confirmKey), go); else go();
      };
    });
    act('[data-k]', G.Net.clan.kick, 'clanKickQ');
    act('[data-p]', G.Net.clan.promote);
    act('[data-d]', G.Net.clan.demote);
    $('#cl-leave').onclick = () => G.UI.confirm(t('clanLeaveQ'), async () => { try { await G.Net.clan.leave(); } catch (e) { fail(e); } C.open(); });
  }

  return C;
})();
