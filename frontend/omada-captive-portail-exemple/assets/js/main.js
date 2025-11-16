(function () {
  const { RD_BASE, parseOmadaParams, pickLang, buildStrings, buildDynamicParams } = window.PortalUtils;
  const state = {
    context: {},
    dynamic: null,
    loading: false,
    lang: 'fr',
    texts: {},
    credentials: null,
  };

  document.addEventListener('DOMContentLoaded', () => {
    state.context = parseOmadaParams();
    state.lang = pickLang(state.context.lang);
    state.texts = buildStrings(state.lang);
    document.documentElement.lang = state.lang;
    hydrateStaticTexts();
    bootstrapEvents();
    fetchDynamicDetail();
  });

  function bootstrapEvents() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', onSubmitLogin);
  }

  function hydrateStaticTexts() {
    document.getElementById('brandName').textContent = state.texts.loadingTitle;
    document.getElementById('brandSubtitle').textContent = state.texts.loadingSubtitle;
    document.getElementById('loginTitle').textContent = state.texts.loginTitle;
    document.getElementById('footerText').textContent = state.texts.footer;
    document.getElementById('btnConnect').textContent = state.texts.connectCta;

    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    usernameField.placeholder = state.texts.usernamePlaceholder;
    passwordField.placeholder = state.texts.passwordPlaceholder;

    document.querySelector('label[for="username"]').textContent = state.texts.usernameLabel;
    document.querySelector('label[for="password"]').textContent = state.texts.passwordLabel;

    const voucherLabel = document.getElementById('voucherLabelText');
    voucherLabel.textContent = state.texts.voucherToggle;
    document.getElementById('consentText').textContent = state.texts.consentLabel;
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

    const logo = detail.icon_file_name;
    const brand = detail.name || 'Hotspot';
    const subtitle =
      detail.city || detail.country ? `${detail.city || ''} ${detail.country || ''}`.trim() : '';

    const logoImg = document.getElementById('logo');
    if (logo) {
      logoImg.src = logo.startsWith('http') ? logo : `${RD_BASE}${logo}`;
      logoImg.classList.remove('hidden');
    }
    document.getElementById('brandName').textContent = brand;
    document.getElementById('brandSubtitle').textContent = subtitle;

    if (settings.user_login_check === false && settings.voucher_login_check) {
      document.getElementById('loginTitle').textContent = state.texts.voucherOnlyTitle;
      document.getElementById('voucherMode').checked = true;
      document.getElementById('voucherMode').disabled = true;
    }

    if (settings.terms_text) {
      document.getElementById('consentText').textContent = settings.terms_text;
    }

    const footer = detail.email ? `Support : ${detail.email}` : state.texts.supportFallback;
    document.getElementById('footerText').textContent = footer;
  }

  async function onSubmitLogin(event) {
    event.preventDefault();
    if (state.loading) return;

    const username = document.getElementById('username').value.trim();
    const passwordField = document.getElementById('password');
    const voucherMode = document.getElementById('voucherMode').checked;
    const password = voucherMode ? username : passwordField.value.trim();

    if (!username || !password) {
      showWarn(state.texts.warnMissing);
      return;
    }

    hideWarn();
    setLoading(true);
    state.credentials = { username, voucherMode };

    try {
      const res = await submitToOmada({ username, password, voucherMode });
      if (res.success) {
        redirectAfterSuccess(res.redirectUrl);
      } else {
        showWarn(res.message || 'Authentification refusée');
      }
    } catch (error) {
      showWarn(error.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  }

  function buildLoginUrl() {
    if (state.context.linkLogin) {
      return state.context.linkLogin;
    }
    const host = state.context.targetHost || window.location.hostname;
    const port = state.context.targetPort || window.location.port || '8843';
    const scheme = state.context.scheme || window.location.protocol.replace(':', '') || 'https';
    return `${scheme}://${host}${port ? `:${port}` : ''}/portal/radius/browserauth`;
  }

  async function submitToOmada({ username, password, voucherMode }) {
    const url = buildLoginUrl();
    const payload = new URLSearchParams();
    payload.append('username', username);
    payload.append('password', password);
    if (voucherMode) {
      payload.append('voucher', username);
    }

    ['clientMac', 'clientIp', 'apMac', 'gatewayMac', 'ssidName', 'radioId', 'vid', 'site'].forEach(
      (key) => {
        if (state.context[key]) {
          payload.append(key, state.context[key]);
        }
      }
    );

    const authType = state.context.authType || state.context.raw.authType || '4';
    if (authType) {
      payload.append('authType', authType);
    }
    if (state.context.omadaTime) {
      payload.append('time', state.context.omadaTime);
    }
    if (state.context.originUrl) {
      payload.append('redirectUrl', state.context.originUrl);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: payload.toString(),
      credentials: 'include',
    });

    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = null;
    }

    if (json && typeof json === 'object') {
      if ((json.errorCode ?? 0) === 0) {
        return {
          success: true,
          redirectUrl:
            json.result?.redirectUrl ||
            state.context.originUrl ||
            state.dynamic?.settings?.redirect_url ||
            '',
        };
      }
      const reply = json.msg || json.message;
      if (reply) {
        showWarn(`${state.texts.replyMessagePrefix} : ${reply}`);
      }
      return { success: false, message: reply };
    }

    if (response.ok && response.redirected) {
      return { success: true, redirectUrl: response.url };
    }

    if (!response.ok) {
      throw new Error(`Erreur Omada ${response.status}`);
    }

    return { success: true, redirectUrl: state.context.originUrl || '' };
  }

  function redirectAfterSuccess(omadaRedirect) {
    const successUrl = new URL('success.html', window.location.href);
    const params = new URLSearchParams();
    params.set('username', state.credentials.username);
    params.set('dynamic_key', state.context.dynamicKey || 'omada');

    ['clientMac', 'ssidName', 'site', 'radioId', 'lang', 'nasid'].forEach((key) => {
      if (state.context[key]) {
        params.set(key, state.context[key]);
      }
    });

    if (state.context.originUrl) {
      params.set('originUrl', state.context.originUrl);
    }
    if (omadaRedirect) {
      params.set('redirectUrl', omadaRedirect);
    }
    if (state.context.sessionId) {
      params.set('sessionId', state.context.sessionId);
    }
    if (state.context.clientIp) {
      params.set('clientIp', state.context.clientIp);
    }

    successUrl.search = params.toString();
    window.location.assign(successUrl.toString());
  }

  function showWarn(message) {
    const el = document.getElementById('alertWarn');
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideWarn() {
    document.getElementById('alertWarn').classList.add('hidden');
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    document.getElementById('btnConnect').disabled = isLoading;
  }
})();
