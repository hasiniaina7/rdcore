(function () {
  const {
    RD_BASE,
    parseOmadaParams,
    pickLang,
    buildStrings,
    buildDynamicParams,
    formatDuration,
    formatBytes,
  } = window.PortalUtils;

  const state = {
    context: {},
    dynamic: null,
    usage: null,
    lang: 'fr',
    texts: {},
  };

  document.addEventListener('DOMContentLoaded', () => {
    state.context = parseOmadaParams();
    state.lang = pickLang(state.context.lang);
    state.texts = buildStrings(state.lang);
    document.documentElement.lang = state.lang;
    hydrateStaticTexts();
    bootstrapEvents();
    fetchDynamicDetail();
    loadUsage();
  });

  function hydrateStaticTexts() {
    document.getElementById('brandName').textContent = state.texts.loadingTitle;
    document.getElementById('brandSubtitle').textContent = state.texts.loadingSubtitle;
    document.getElementById('footerText').textContent = state.texts.footer;
    document.getElementById('successTitle').textContent = state.texts.successTitle;
    document.getElementById('successSubtitle').textContent = state.texts.successSubtitle;
    document.getElementById('usageLabelTime').textContent = state.texts.usageTime;
    document.getElementById('usageLabelData').textContent = state.texts.usageData;
    document.getElementById('usageLabelRemaining').textContent = state.texts.usageRemain;
    document.getElementById('btnContinue').textContent = state.texts.goInternet;
    document.getElementById('btnRefreshUsage').textContent = state.texts.refreshUsage;
    document.getElementById('btnBackLogin').textContent = state.texts.backToLogin;
    updateContinueButton();
  }

  function bootstrapEvents() {
    document.getElementById('btnRefreshUsage').addEventListener('click', loadUsage);
    document.getElementById('btnContinue').addEventListener('click', continueToInternet);
    document.getElementById('btnBackLogin').addEventListener('click', backToLogin);
  }

  async function fetchDynamicDetail() {
    const params = buildDynamicParams(state.context);
    try {
      const resp = await fetch(
        `${RD_BASE}/cake4/rd_cake/dynamic-details/info-for.json?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      if (!payload.success) {
        throw new Error(payload.message || 'Dynamic detail unavailable');
      }
      state.dynamic = payload.data;
      applyDynamicDetail();
    } catch (error) {
      showWarn(`Impossible de charger la configuration dynamique (${error.message})`);
    }
  }

  function applyDynamicDetail() {
    if (!state.dynamic) return;
    const detail = state.dynamic.detail || {};
    const settings = state.dynamic.settings || {};
    const logo = detail.icon_file_name;
    const customLang = settings.language || detail.language;
    const hasOverride = settings.texts_override && Object.keys(settings.texts_override).length > 0;

    if (customLang || hasOverride) {
      if (customLang) {
        state.lang = pickLang(customLang);
      }
      state.texts = buildStrings(state.lang, settings.texts_override);
      document.documentElement.lang = state.lang;
      hydrateStaticTexts();
    }

    if (logo) {
      const logoImg = document.getElementById('logo');
      logoImg.src = logo.startsWith('http') ? logo : `${RD_BASE}${logo}`;
      logoImg.classList.remove('hidden');
    }

    const subtitle =
      detail.city || detail.country ? `${detail.city || ''} ${detail.country || ''}`.trim() : '';
    document.getElementById('brandName').textContent = detail.name || 'Hotspot';
    document.getElementById('brandSubtitle').textContent = subtitle;

    const footer = detail.email ? `Support : ${detail.email}` : state.texts.supportFallback;
    document.getElementById('footerText').textContent = footer;
    updateContinueButton();
  }

  async function loadUsage() {
    if (!state.context.username) {
      showWarn(state.texts.warnUsage);
      return;
    }

    try {
      hideWarn();
      const params = new URLSearchParams();
      params.append('username', state.context.username);
      if (state.context.clientMac) {
        params.append('mac', state.context.clientMac);
      }

      const resp = await fetch(
        `${RD_BASE}/cake4/rd_cake/radaccts/get-usage.json?${params.toString()}`,
        { credentials: 'include' }
      );
      const payload = await resp.json();
      if (!payload.success) {
        throw new Error(payload.message || 'Usage indisponible');
      }
      state.usage = payload.data;
      renderUsage();
    } catch (error) {
      showWarn(`Impossible de charger l’usage (${error.message})`);
    }
  }

  function renderUsage() {
    if (!state.usage) return;
    const usage = state.usage;
    document.getElementById('usageTime').textContent = formatDuration(usage.time_used || 0, state.lang);
    document.getElementById('usageData').textContent = formatBytes(usage.data_used || 0);
    const remaining = Math.max(
      0,
      (usage.cap || usage.data_cap || 0) - (usage.data_used || 0)
    );
    document.getElementById('usageRemaining').textContent = formatBytes(remaining);

    const details = [];
    if (state.context.username) {
      details.push(`ID : ${state.context.username}`);
    }
    if (state.context.clientMac) {
      details.push(`MAC : ${state.context.clientMac}`);
    }
    if (state.context.ssidName) {
      details.push(`SSID : ${state.context.ssidName}`);
    }
    document.getElementById('sessionDetails').textContent = details.join(' • ');
  }

  function continueToInternet() {
    const target = getContinueTarget();
    if (!target) {
      showWarn('Aucune URL de redirection configurée.');
      return;
    }
    window.location.href = target;
  }

  function backToLogin() {
    const loginUrl = new URL('index.html', window.location.href);
    const params = new URLSearchParams(state.context.raw || {});
    ['username', 'redirectUrl'].forEach((key) => params.delete(key));
    const query = params.toString();
    loginUrl.search = query ? `?${query}` : '';
    window.location.href = loginUrl.toString();
  }

  function showWarn(message) {
    const el = document.getElementById('alertWarn');
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideWarn() {
    document.getElementById('alertWarn').classList.add('hidden');
  }

  function getContinueTarget() {
    return (
      state.context.redirectUrl ||
      state.context.originUrl ||
      state.dynamic?.settings?.redirect_url ||
      ''
    );
  }

  function updateContinueButton() {
    const button = document.getElementById('btnContinue');
    if (getContinueTarget()) {
      button.disabled = false;
      button.classList.remove('hidden');
      return;
    }
    button.disabled = true;
    button.classList.add('hidden');
  }
})();
