(function (global) {
  const I18N = {
    fr: {
      loadingTitle: 'Chargement…',
      loadingSubtitle: 'Veuillez patienter',
      footer: 'Hotspot Omada • RadiusDesk',
      loginTitle: 'Portail captif',
      usernameLabel: 'Identifiant utilisateur',
      passwordLabel: 'Mot de passe',
      usernamePlaceholder: "Nom d'utilisateur",
      passwordPlaceholder: 'Mot de passe RadiusDesk',
      voucherPlaceholder: 'Code voucher',
      connectCta: 'Connexion Omada',
      userTab: 'Utilisateur',
      voucherTab: 'Voucher',
      warnMissing: 'Identifiants requis.',
      consentLabel: "En vous connectant vous acceptez les conditions d'utilisation.",
      replyMessagePrefix: 'Message',
      countdownTitle: 'Connexion validée',
      countdownBody: 'Veuillez patienter avant d’ouvrir la page Info Conso.',
      countdownLabel: 'Secondes restantes',
      infoReady: 'Info consommation disponible',
      infoButton: 'Ouvrir l’info conso',
      infoLink: 'Consultation dans un nouvel onglet',
    },
    en: {
      loadingTitle: 'Loading…',
      loadingSubtitle: 'Please wait',
      footer: 'Omada Hotspot • RadiusDesk',
      loginTitle: 'Captive portal',
      usernameLabel: 'Account username',
      passwordLabel: 'Password',
      usernamePlaceholder: 'Account username',
      passwordPlaceholder: 'Password',
      voucherPlaceholder: 'Voucher code',
      connectCta: 'Connect',
      userTab: 'Account',
      voucherTab: 'Voucher',
      warnMissing: 'Credentials are required.',
      consentLabel: 'By connecting you accept the terms of service.',
      replyMessagePrefix: 'Message',
      countdownTitle: 'Login successful',
      countdownBody: 'Please wait before opening the usage page.',
      countdownLabel: 'Seconds remaining',
      infoReady: 'Usage dashboard is ready',
      infoButton: 'Open usage dashboard',
      infoLink: 'Open in new tab',
    },
  };

  function pickLang(raw) {
    const input = (raw || navigator.language || 'fr').toLowerCase();
    if (input.startsWith('en')) {
      return 'en';
    }
    return 'fr';
  }

  function buildStrings(lang, overrides) {
    return Object.assign({}, I18N.fr, I18N[lang] || {}, overrides || {});
  }

  function parseOmadaParams() {
    const search = new URLSearchParams(window.location.search);
    const raw = Object.fromEntries(search.entries());
    const normalize = (value) => (value === undefined ? '' : value);
    const scheme = (normalize(raw.scheme) || window.location.protocol || 'https').replace(':', '');
    const target = normalize(raw.target) || normalize(raw.controllerHost) || normalize(raw.hostname);
    const targetPort = normalize(raw.targetPort) || normalize(raw.serverPort) || '8843';
    const linkLogin = normalize(raw.link_login_only);
    const origin = normalize(raw.originUrl) || normalize(raw.redirectUrl) || normalize(raw.url);

    return {
      raw,
      scheme,
      targetHost: target,
      targetPort,
      linkLogin,
      clientMac: normalize(raw.clientMac),
      clientIp: normalize(raw.clientIp),
      apMac: normalize(raw.apMac),
      gatewayMac: normalize(raw.gatewayMac),
      ssidName: normalize(raw.ssidName),
      radioId: normalize(raw.radioId),
      vid: normalize(raw.vid),
      site: normalize(raw.site),
      originUrl: origin,
      dynamicKey: normalize(raw.dynamic_key) || normalize(raw.key) || 'omada',
      nasid: normalize(raw.nasid) || normalize(raw.nasId),
      omadaTime: normalize(raw.time) || normalize(raw.t),
      authType: normalize(raw.authType),
      lang: normalize(raw.lang) || normalize(raw.locale),
      username: normalize(raw.username),
      voucher: normalize(raw.voucher),
      redirectUrl: normalize(raw.redirectUrl) || normalize(raw.continueUrl),
      sessionId: normalize(raw.sessionId) || normalize(raw.session_id),
      infoUrl: normalize(raw.infoUrl),
      mode: normalize(raw.mode),
    };
  }

  global.PortalUtils = {
    pickLang,
    buildStrings,
    parseOmadaParams,
  };
})(window);
