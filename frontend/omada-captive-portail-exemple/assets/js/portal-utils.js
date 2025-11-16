(function (global) {
  const RD_BASE = 'https://rd.techzone.lat';
  const I18N = {
    fr: {
      loadingTitle: 'Chargement…',
      loadingSubtitle: 'Veuillez patienter',
      footer: 'Propulsé par RadiusDesk & Omada',
      loginTitle: 'Identifiez-vous',
      usernameLabel: 'Identifiant',
      passwordLabel: 'Mot de passe',
      usernamePlaceholder: 'Nom d’utilisateur / voucher',
      passwordPlaceholder: 'Mot de passe',
      voucherToggle: 'Mode voucher (identifiant = mot de passe)',
      connectCta: 'Connexion',
      voucherOnlyTitle: 'Utilisez votre voucher',
      warnMissing: 'Identifiants requis.',
      warnUsage: 'Authentifiez-vous avant de consulter l’usage.',
      infoLoading: 'Authentification réussie, récupération en cours…',
      usageTitle: 'Informations d’usage',
      usageTime: 'Temps utilisé',
      usageData: 'Données utilisées',
      usageRemain: 'Restant',
      reloadUsage: 'Mettre à jour',
      successTitle: 'Vous êtes connecté',
      successSubtitle: 'La session est active sur le hotspot.',
      goInternet: 'Continuer vers Internet',
      refreshUsage: 'Actualiser l’usage',
      backToLogin: 'Retour à la page de connexion',
      supportFallback: 'Support RadiusDesk',
      consentLabel: "En vous connectant vous acceptez les conditions d'utilisation.",
      replyMessagePrefix: 'Message',
    },
    en: {
      loadingTitle: 'Loading…',
      loadingSubtitle: 'Please wait',
      footer: 'Powered by RadiusDesk & Omada',
      loginTitle: 'Sign in',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      usernamePlaceholder: 'Username / voucher',
      passwordPlaceholder: 'Password',
      voucherToggle: 'Voucher mode (username = password)',
      connectCta: 'Connect',
      voucherOnlyTitle: 'Use your voucher',
      warnMissing: 'Credentials are required.',
      warnUsage: 'Authenticate before reading usage.',
      infoLoading: 'Login successful, retrieving session information…',
      usageTitle: 'Usage information',
      usageTime: 'Time used',
      usageData: 'Data used',
      usageRemain: 'Remaining',
      reloadUsage: 'Reload usage',
      successTitle: 'You are online',
      successSubtitle: 'Your session is active on the hotspot.',
      goInternet: 'Continue to the Internet',
      refreshUsage: 'Refresh usage',
      backToLogin: 'Back to login',
      supportFallback: 'RadiusDesk support',
      consentLabel: 'By connecting you accept the terms of service.',
      replyMessagePrefix: 'Message',
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
    };
  }

  function buildDynamicParams(context) {
    const params = new URLSearchParams({ dynamic_key: context.dynamicKey || 'omada' });
    ['clientMac', 'ssidName', 'site', 'nasid'].forEach((key) => {
      if (context[key]) {
        params.append(key, context[key]);
      }
    });
    return params;
  }

  function formatDuration(seconds, lang) {
    const locale = (lang || 'fr').startsWith('en') ? 'en' : 'fr';
    const sec = Number(seconds) || 0;
    if (sec < 60) {
      return `${sec}s`;
    }
    const minutes = Math.floor(sec / 60);
    if (minutes < 60) {
      return `${minutes}m ${sec % 60}s`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ${minutes % 60}m`;
    }
    const days = Math.floor(hours / 24);
    const dayUnit = locale === 'en' ? 'd' : 'j';
    return `${days}${dayUnit} ${hours % 24}h`;
  }

  function formatBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b < 1024) {
      return `${b} B`;
    }
    const kb = b / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }

  global.PortalUtils = {
    RD_BASE,
    pickLang,
    buildStrings,
    parseOmadaParams,
    buildDynamicParams,
    formatDuration,
    formatBytes,
  };
})(window);
