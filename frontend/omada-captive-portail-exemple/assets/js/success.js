(function () {
  const { parseOmadaParams, pickLang, buildStrings } = window.PortalUtils;
  const INFO_PORTAL_DEFAULT = 'https://hotspot.techzone.lat/portal/';
  const COUNTDOWN_SECONDS = 15;

  const state = {
    context: {},
    lang: 'fr',
    texts: {},
    countdown: COUNTDOWN_SECONDS,
    infoUrl: null,
    timer: null,
  };
  let btnOpenInfo = null;
  let linkInfo = null;
  let waitingCard = null;
  let ctaCard = null;

  document.addEventListener('DOMContentLoaded', () => {
    state.context = parseOmadaParams();
    state.lang = pickLang(state.context.lang);
    state.texts = buildStrings(state.lang);
    document.documentElement.lang = state.lang;
    btnOpenInfo = document.getElementById('btnOpenInfo');
    linkInfo = document.getElementById('infoLink');
    waitingCard = document.getElementById('waitingCard');
    ctaCard = document.getElementById('ctaCard');
    hydrateStaticTexts();
    prepareFlow();
  });

  function hydrateStaticTexts() {
    document.getElementById('brandName').textContent = state.texts.loadingTitle;
    document.getElementById('brandSubtitle').textContent = state.texts.loadingSubtitle;
    document.getElementById('footerText').textContent = state.texts.footer;
    document.getElementById('successTitle').textContent = state.texts.countdownTitle;
    document.getElementById('successSubtitle').textContent = state.texts.countdownBody;
    document.getElementById('countdownHint').textContent = state.texts.countdownLabel;
    document.getElementById('infoReadyTitle').textContent = state.texts.infoReady;
    document.getElementById('infoReadySubtitle').textContent = state.texts.countdownBody;
    btnOpenInfo.textContent = state.texts.infoButton;
    linkInfo.textContent = state.texts.infoLink;
  }

  function prepareFlow() {
    const username = (state.context.username || '').trim();
    const password = (state.context.password || '').trim();
    if (!username || !password) {
      showWarn('Identifiants absents. Merci de revenir au portail.');
      return;
    }

    state.infoUrl = buildInfoUrl(username, password);
    setCtaVisibility(false);
    document.getElementById('btnOpenInfo').addEventListener('click', () => openInfo(false));
    document.getElementById('infoLink').addEventListener('click', (event) => {
      event.preventDefault();
      openInfo(true);
    });
    startCountdown();
  }

  function buildInfoUrl(username, password) {
    const base = state.context.infoUrl || INFO_PORTAL_DEFAULT;
    let entry;
    try {
      const normalized = base.endsWith('/') ? base : `${base}/`;
      entry = new URL(normalized);
    } catch {
      entry = new URL(INFO_PORTAL_DEFAULT);
    }
    const target = new URL('./success', entry);
    target.searchParams.set('fromOmada', '1');
    target.searchParams.set('username', username);
    target.searchParams.set('password', password);
    if (state.context.clientMac) {
      target.searchParams.set('mac', state.context.clientMac);
    }
    if (state.context.ssidName) {
      target.searchParams.set('ssidName', state.context.ssidName);
    }
    if (state.context.site) {
      target.searchParams.set('site', state.context.site);
    }
    target.searchParams.set('mode', state.context.mode || 'omada');
    return target.toString();
  }

  function startCountdown() {
    updateCountdown();
    state.timer = window.setInterval(() => {
      state.countdown -= 1;
      if (state.countdown <= 0) {
        window.clearInterval(state.timer);
        revealCta();
        return;
      }
      updateCountdown();
    }, 1000);
  }

  function updateCountdown() {
    document.getElementById('countdownValue').textContent = String(state.countdown);
  }

  function revealCta() {
    setCtaVisibility(true);
    linkInfo.setAttribute('href', state.infoUrl);
  }

  function setCtaVisibility(isVisible) {
    if (!waitingCard || !ctaCard) return;
    if (isVisible) {
      waitingCard.classList.add('hidden');
      ctaCard.classList.remove('hidden');
      btnOpenInfo.removeAttribute('disabled');
      linkInfo.classList.remove('disabled');
    } else {
      waitingCard.classList.remove('hidden');
      ctaCard.classList.add('hidden');
      btnOpenInfo.setAttribute('disabled', 'disabled');
      linkInfo.classList.add('disabled');
    }
  }

  function openInfo(openInNewTab) {
    if (!state.infoUrl) return;
    if (openInNewTab) {
      window.open(state.infoUrl, '_blank', 'noopener');
      return;
    }
    window.location.href = state.infoUrl;
  }

  function showWarn(message) {
    const el = document.getElementById('alertWarn');
    el.textContent = message;
    el.classList.remove('hidden');
  }
})();
