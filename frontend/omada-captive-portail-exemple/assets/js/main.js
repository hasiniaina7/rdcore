(function () {
  const { parseOmadaParams, pickLang, buildStrings } = window.PortalUtils;
  const MODES = { USER: 'user', VOUCHER: 'voucher' };

  const state = {
    context: {},
    lang: 'fr',
    texts: {},
    mode: null,
    loading: false,
    credentials: null,
  };

  document.addEventListener('DOMContentLoaded', () => {
    state.context = parseOmadaParams();
    state.lang = pickLang(state.context.lang);
    state.texts = buildStrings(state.lang);
    document.documentElement.lang = state.lang;
    hydrateStaticTexts();
    bootstrapEvents();
    switchMode(MODES.USER);
  });

  function bootstrapEvents() {
    document.querySelectorAll('.login-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchMode(tab.dataset.mode === MODES.VOUCHER ? MODES.VOUCHER : MODES.USER));
    });
    document.getElementById('loginForm').addEventListener('submit', onSubmitLogin);
  }

  function hydrateStaticTexts() {
    document.getElementById('brandName').textContent = state.texts.loadingTitle;
    document.getElementById('brandSubtitle').textContent = state.texts.loadingSubtitle;
    document.getElementById('loginTitle').textContent = state.texts.loginTitle;
    document.getElementById('footerText').textContent = state.texts.footer;
    document.getElementById('btnConnect').textContent = state.texts.connectCta;

    const usernameLabel = document.querySelector('label[for="username"]');
    const passwordLabel = document.querySelector('label[for="password"]');
    const voucherLabel = document.querySelector('label[for="voucherCode"]');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const voucherField = document.getElementById('voucherCode');
    if (usernameLabel) usernameLabel.textContent = state.texts.usernameLabel;
    if (passwordLabel) passwordLabel.textContent = state.texts.passwordLabel;
    if (voucherLabel) voucherLabel.textContent = state.texts.voucherTab;
    usernameField.placeholder = state.texts.usernamePlaceholder;
    passwordField.placeholder = state.texts.passwordPlaceholder;
    voucherField.placeholder = state.texts.voucherPlaceholder;

    document.getElementById('tabUser').textContent = state.texts.userTab;
    document.getElementById('tabVoucher').textContent = state.texts.voucherTab;
    document.getElementById('consentText').textContent = state.texts.consentLabel;
  }

  function switchMode(nextMode) {
    const previousMode = state.mode;
    state.mode = nextMode;

    document.querySelectorAll('.login-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === state.mode);
    });
    document.querySelectorAll('.mode-panel').forEach((panel) => {
      const isActive = panel.getAttribute('data-mode') === state.mode;
      panel.classList.toggle('hidden', !isActive);
    });

    if (previousMode && previousMode !== state.mode) {
      document.querySelectorAll('.mode-panel input').forEach((input) => {
        input.value = '';
      });
    }

    if (state.mode === MODES.USER) {
      document.getElementById('voucherCode').value = '';
    } else {
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    }
  }

  async function onSubmitLogin(event) {
    event.preventDefault();
    if (state.loading) {
      return;
    }

    const mode = state.mode || MODES.USER;
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const voucherField = document.getElementById('voucherCode');

    let username = '';
    let password = '';
    let voucherCode = '';

    if (mode === MODES.VOUCHER) {
      voucherCode = voucherField.value.trim();
      username = voucherCode;
      password = voucherCode;
    } else {
      username = usernameField.value.trim();
      password = passwordField.value.trim();
    }

    if (!username || !password) {
      showWarn(state.texts.warnMissing);
      return;
    }

    hideWarn();
    setLoading(true);
    state.credentials = { username, password, voucherMode: mode === MODES.VOUCHER };

    try {
      const result = await submitToOmada({
        username,
        password,
        voucherMode: mode === MODES.VOUCHER,
        voucher: voucherCode,
      });
      if (result.success) {
        redirectAfterSuccess(result.redirectUrl);
      } else {
        showWarn(result.message || 'Authentification refusée');
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

  async function submitToOmada({ username, password, voucherMode, voucher }) {
    const url = buildLoginUrl();
    const payload = new URLSearchParams();
    payload.append('username', username);
    payload.append('password', password);
    if (voucherMode && voucher) {
      payload.append('voucher', voucher);
    }

    ['clientMac', 'clientIp', 'apMac', 'gatewayMac', 'ssidName', 'radioId', 'vid', 'site'].forEach((key) => {
      if (state.context[key]) {
        payload.append(key, state.context[key]);
      }
    });

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
          redirectUrl: json.result?.redirectUrl || state.context.originUrl || '',
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
    params.set('password', state.credentials.password);
    params.set('mode', state.mode || MODES.USER);
    params.set('fromOmada', '1');

    if (state.context.clientMac) {
      params.set('clientMac', state.context.clientMac);
    }
    if (state.context.ssidName) {
      params.set('ssidName', state.context.ssidName);
    }
    if (state.context.site) {
      params.set('site', state.context.site);
    }
    if (state.context.infoUrl) {
      params.set('infoUrl', state.context.infoUrl);
    }
    if (omadaRedirect) {
      params.set('redirectUrl', omadaRedirect);
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
