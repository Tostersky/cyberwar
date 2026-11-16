// Chip purchases (Google Play Billing inside the Android app) and rewarded ads (Google H5 Games Ads).
// In a normal browser (and on iPhone) Play Billing doesn't exist: the shop then explains where to buy.
(function () {
  const PLAY = 'https://play.google.com/billing';
  const P = G.Pay = { ready: false, service: null, prices: {} };

  // Digital Goods API is only present in the Play Store build of the app (Trusted Web Activity with billing)
  P.available = () => typeof window.getDigitalGoodsService === 'function';

  P.init = async function () {
    if (!P.available() || P.ready) return P.ready;
    try {
      P.service = await window.getDigitalGoodsService(PLAY);
      if (!P.service) return false;
      const details = await P.service.getDetails(G.CHIP_PACKS.map((p) => p.id));
      for (const d of details || []) {
        const v = d.price;
        try { P.prices[d.itemId] = new Intl.NumberFormat(G.lang === 'en' ? 'en' : 'pl', { style: 'currency', currency: v.currency }).format(+v.value); }
        catch (_) { P.prices[d.itemId] = v.value + ' ' + v.currency; }
      }
      P.ready = true;
    } catch (_) { P.ready = false; }
    return P.ready;
  };
  P.priceOf = (pack) => P.prices[pack.id] || pack.price;

  // purchases paid but not yet credited (app closed mid-purchase, no internet...) are sent to the server again
  P.recover = async function () {
    if (!P.service || !G.Net.session) return;
    try {
      const list = await P.service.listPurchases();
      for (const p of list || []) {
        if (!G.packById(p.itemId)) continue;
        const r = await G.Net.callNow({ c: 'iap', product: p.itemId, token: p.purchaseToken });
        if (r.ok && r.chips > 0) G.UI.notify(G.t('iapThanks', { n: r.chips }));
      }
    } catch (_) {}
  };

  // returns {ok, chips} or {err}
  P.buy = async function (pack) {
    if (!G.Net.session) return { err: 'iapLogin' };
    if (!(await P.init())) return { err: 'iapNoApp' };
    let resp;
    try {
      const req = new PaymentRequest([{ supportedMethods: PLAY, data: { sku: pack.id } }],
        { total: { label: 'Total', amount: { currency: 'PLN', value: '0' } } });
      resp = await req.show();
    } catch (e) { return { err: 'iapCancel' }; }
    const token = resp.details && resp.details.purchaseToken;
    try { await resp.complete('success'); } catch (_) {}
    if (!token) return { err: 'iapBad' };
    // the server checks the token with Google, credits the chips once and consumes the purchase
    for (let i = 0; i < 3; i++) {
      try { const r = await G.Net.callNow({ c: 'iap', product: pack.id, token }); if (r.err !== 'server') return r; } catch (_) {}
      await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
    }
    return { err: 'iapLater' };
  };

  // ---------- rewarded ads ----------
  const A = G.Ads = { loaded: false };
  A.enabled = () => !!(G.ADS.on && G.ADS.client);
  A.load = function () {
    if (A.loaded || !A.enabled()) return;
    A.loaded = true;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    const sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(G.ADS.client);
    sc.crossOrigin = 'anonymous';
    sc.setAttribute('data-ad-frequency-hint', '30s');
    document.head.appendChild(sc);
    window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
  };
  // resolves true only if the player watched the whole ad
  A.showRewarded = function () {
    A.load();
    return new Promise((resolve) => {
      if (!window.adBreak) { resolve(false); return; }
      let done = false, shown = false;
      const fin = (v) => { if (!done) { done = true; G.Sfx.adPlaying = false; G.Sfx.updateMusic(); resolve(v); } };
      window.adBreak({
        type: 'reward', name: 'chips',
        beforeAd: () => { shown = true; G.Sfx.adPlaying = true; G.Sfx.updateMusic(); },
        afterAd: () => {},
        beforeReward: (showAdFn) => showAdFn(),
        adDismissed: () => fin(false),
        adViewed: () => fin(true),
        adBreakDone: () => fin(false), // always last: no-op if adViewed/adDismissed already decided
      });
      setTimeout(() => { if (!shown) fin(false); }, 8000);
    });
  };
  A.state = () => G.Econ.adState(G.state, Date.now());
})();
