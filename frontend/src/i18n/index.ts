import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Portal',
        success: 'Success',
        support: 'Support',
        terms: 'Terms',
        privacy: 'Privacy'
      },
      layout: {
        eyebrow: 'Omada hotspot',
        title: 'Dynamic login',
        language: 'Choose language',
        navLabel: 'Primary navigation'
      },
      loading: 'Loading dynamic settings…',
      error: 'Unable to load the captive portal configuration.',
      lastUpdated: 'Last updated',
      dynamic: {
        boolean: {
          yes: 'Yes',
          no: 'No'
        },
        requestError: 'Unable to contact the captive portal. Please try again shortly.',
        loaderHint: 'Fetching the dynamic pages and connection options from RadiusDesk…',
        modal: {
          title: 'Dynamic key required',
          subtitle: 'Please use one of the dynamic keys authorized for this hotspot.',
          emptyList: 'No dynamic keys were received from RadiusDesk.',
          supportCta: 'Contact support'
        },
        status: {
          cache: 'Cache {{status}} from RadiusDesk',
          cacheNone: 'No cache metadata',
          key: 'Key {{key}}',
          keyMissing: 'Dynamic key missing',
          omadaReady: 'Omada ready',
          omadaMissing: 'Omada incomplete',
          omadaMissingDetail: 'Missing: {{fields}}'
        },
        omadaContext: 'Omada context',
        omadaEyebrow: 'Network metadata',
        toolbar: {
          title: 'Dynamic toolbar',
          details: 'Details',
          settings: 'Settings',
          pages: 'Own Pages',
          connect: 'Click to Connect',
          social: 'Social Login',
          language: 'Languages',
          menu: 'Menu'
        },
        detail: {
          defaultName: 'Captive Portal',
          city: 'City',
          address: 'Address',
          contact: 'Contact',
          phone: 'Phone',
          email: 'Email',
          website: 'Website',
          clientInfo: 'Client info'
        },
        settings: {
          title: 'Settings overview',
          showLogo: 'Show logo',
          showName: 'Show name',
          nameColour: 'Name colour',
          screenDelay: 'Screen delay',
          templateStyle: 'Template style',
          allowSocial: 'Allow social login',
          languages: 'Available languages',
          notSet: 'Not provided'
        },
        pages: {
          title: 'Own pages',
          empty: 'No custom pages available.',
          emptyContent: 'No content was provided for this page.',
          untitled: 'Untitled page'
        },
        connect: {
          title: 'Click to Connect',
          placeholder: 'The connect panel will render here (G4.4).',
          countdown: 'Connect panel available in {{seconds}} seconds',
          waitMessage: 'Please wait for the connect panel to appear.',
          missingOmada: 'Missing Omada parameters in the URL.',
          missingKey: 'Dynamic key required for click-to-connect.',
          loading: 'Connecting…',
          success: 'Access granted. Redirecting…',
          error: 'Unable to complete the connection.',
          clickTitle: 'Click-to-Connect',
          clickBody: 'Quickly grant access using the captive portal defaults.',
          clickCta: 'Connect now',
          userTitle: 'Permanent user',
          username: 'Username',
          password: 'Password',
          submit: 'Connect',
          voucherTitle: 'Voucher',
          voucherCode: 'Voucher code'
        },
        social: {
          title: 'Social login',
          placeholder: 'No social login providers were configured.',
          description: 'Connect with the configured social providers handled by the operator.',
          error: 'Unable to start the social login flow.',
          noTempUser: 'Social login is not fully configured.',
          noProviders: 'No social login providers available.'
        },
        gallery: {
          title: 'Photo gallery',
          empty: 'No promotional photos are available.',
          slide: 'Gallery slide',
          prev: 'Previous',
          next: 'Next',
          thumbnail: 'Thumbnail {{index}}',
          close: 'Close viewer'
        },
        menu: {
          title: 'Quick menu',
          close: 'Close',
          help: 'Help & Support',
          supportLink: 'Support page',
          termsLink: 'Terms & Privacy',
          languages: 'Languages'
        }
      },
      success: {
        eyebrow: 'Connection summary',
        subtitle: 'Monitor your connection status and usage.',
        username: 'Username',
        password: 'Password',
        mac: 'MAC address',
        refresh: 'Refresh',
        loading: 'Loading…',
        missingParams: 'Specify the username and MAC to load usage.',
        fetchError: 'Unable to fetch usage.',
        disconnectError: 'Unable to disconnect the session.',
        statusTitle: 'Status',
        statusOnline: 'Online',
        statusOffline: 'Offline',
        deviceInfo: 'Site: {{site}} — SSID: {{ssid}}',
        messageHint: 'These details come directly from RadiusDesk and refresh automatically.',
        quotaTitle: 'Usage',
        quotaSubtitle: 'Data and time allowances',
        dataUsed: '{{used}} used / {{cap}} cap',
        timeUsed: '{{used}} used / {{cap}} cap',
        depleted: 'Quota depleted',
        supportTitle: 'Support',
        supportSubtitle: 'Need human assistance?',
        phoneLabel: 'Phone',
        supportFallback: 'Contact the operator for help.',
        sessionsTitle: 'Recent sessions',
        noSessions: 'No sessions recorded yet.',
        sessionStart: 'Start',
        sessionStop: 'Stop',
        sessionDuration: 'Duration',
        sessionIp: 'IP address',
        sessionOngoing: 'Ongoing',
        disconnect: 'Disconnect'
      },
      support: {
        eyebrow: 'Need help?',
        subtitle: 'Reach the operator team for vouchers, credentials or device support.',
        response: 'Avg. response <10min',
        email: 'Email',
        phone: 'Phone',
        hours: 'Hours',
        hoursValue: '24/7 hotline',
        address: 'Address',
        fallback: 'Contact operator'
      },
      terms: {
        eyebrow: 'Usage policy',
        scopeTitle: 'Scope',
        scopeBody: 'These terms govern access to the captive portal and the Omada hotspot managed by Techzone.',
        usageTitle: 'Acceptable use',
        usageBody: 'You agree not to disrupt the network, abuse bandwidth or share credentials with unauthorised users.',
        responsibilityTitle: 'Operator responsibility',
        responsibilityBody: 'The operator may suspend access in case of abuse or security risk and records sessions for auditing.'
      },
      privacy: {
        eyebrow: 'Privacy notice',
        collectionTitle: 'Data collection',
        collectionBody: 'We collect MAC address, username, usage metrics and Omada parameters to grant access.',
        usageTitle: 'Data usage',
        usageBody: 'Metrics are used to maintain sessions, display consumption and troubleshoot support tickets.',
        rightsTitle: 'Your rights',
        rightsBody: 'Contact support to request data export or deletion according to local regulations.'
      }
    }
  },
  fr: {
    translation: {
      nav: {
        home: 'Portail',
        success: 'Succès',
        support: 'Support',
        terms: 'Conditions',
        privacy: 'Confidentialité'
      },
      layout: {
        eyebrow: 'Portail Omada',
        title: 'Connexion dynamique',
        language: 'Changer de langue',
        navLabel: 'Navigation principale'
      },
      loading: 'Chargement de la configuration dynamique…',
      error: 'Impossible de charger la configuration du portail.',
      lastUpdated: 'Dernière mise à jour',
      dynamic: {
        boolean: {
          yes: 'Oui',
          no: 'Non'
        },
        requestError: 'Impossible de joindre le portail captif. Réessayez dans quelques instants.',
        loaderHint: 'Récupération des pages dynamiques et formulaires depuis RadiusDesk…',
        modal: {
          title: 'Clé dynamique requise',
          subtitle: 'Utilisez l’une des clés autorisées pour ce hotspot.',
          emptyList: 'Aucune clé dynamique n’a été fournie par RadiusDesk.',
          supportCta: 'Contacter le support'
        },
        status: {
          cache: 'Cache {{status}} depuis RadiusDesk',
          cacheNone: 'Pas de cache disponible',
          key: 'Clé {{key}}',
          keyMissing: 'Clé dynamique manquante',
          omadaReady: 'Paramètres Omada prêts',
          omadaMissing: 'Paramètres Omada incomplets',
          omadaMissingDetail: 'Champs manquants : {{fields}}'
        },
        omadaContext: 'Contexte Omada',
        omadaEyebrow: 'Métadonnées réseau',
        toolbar: {
          title: 'Barre dynamique',
          details: 'Détails',
          settings: 'Paramètres',
          pages: 'Pages dédiées',
          connect: 'Connexion rapide',
          social: 'Connexion sociale',
          language: 'Langues',
          menu: 'Menu'
        },
        detail: {
          defaultName: 'Portail captif',
          city: 'Ville',
          address: 'Adresse',
          contact: 'Contact',
          phone: 'Téléphone',
          email: 'Email',
          website: 'Site web',
          clientInfo: 'Informations client'
        },
        settings: {
          title: 'Aperçu des options',
          showLogo: 'Afficher le logo',
          showName: 'Afficher le nom',
          nameColour: 'Couleur du nom',
          screenDelay: 'Délai écran',
          templateStyle: 'Style du modèle',
          allowSocial: 'Autoriser le social login',
          languages: 'Langues disponibles',
          notSet: 'Non défini'
        },
        pages: {
          title: 'Pages personnalisées',
          empty: 'Aucune page personnalisée disponible.',
          emptyContent: 'Aucun contenu fourni pour cette page.',
          untitled: 'Page sans titre'
        },
        connect: {
          title: 'Connexion rapide',
          placeholder: 'Le panneau de connexion sera rendu ici (G4.4).',
          countdown: 'Panneau disponible dans {{seconds}} secondes',
          waitMessage: 'Merci de patienter pendant l’affichage du panneau.',
          missingOmada: 'Paramètres Omada manquants dans l’URL.',
          missingKey: 'La clé dynamique est requise pour la connexion rapide.',
          loading: 'Connexion en cours…',
          success: 'Accès accordé. Redirection…',
          error: 'Impossible de terminer la connexion.',
          clickTitle: 'Click-to-Connect',
          clickBody: 'Accordez un accès rapide en utilisant la configuration par défaut.',
          clickCta: 'Se connecter',
          userTitle: 'Utilisateur permanent',
          username: 'Nom d’utilisateur',
          password: 'Mot de passe',
          submit: 'Se connecter',
          voucherTitle: 'Bon',
          voucherCode: 'Code bon'
        },
        social: {
          title: 'Connexion sociale',
          placeholder: 'Aucun fournisseur social configuré.',
          description: 'Connectez-vous à l’aide des fournisseurs sociaux configurés.',
          error: 'Impossible de lancer le flux social.',
          noTempUser: 'Le social login n’est pas entièrement configuré.',
          noProviders: 'Aucun fournisseur social disponible.'
        },
        gallery: {
          title: 'Galerie photos',
          empty: 'Aucune photo promotionnelle disponible.',
          slide: 'Diapositive de galerie',
          prev: 'Précédent',
          next: 'Suivant',
          thumbnail: 'Miniature {{index}}',
          close: 'Fermer la visionneuse'
        },
        menu: {
          title: 'Menu rapide',
          close: 'Fermer',
          help: 'Aide & Support',
          supportLink: 'Page support',
          termsLink: 'Conditions & Confidentialité',
          languages: 'Langues'
        }
      },
      success: {
        eyebrow: 'Résumé de connexion',
        subtitle: 'Surveillez le statut de votre connexion et vos consommations.',
        username: "Nom d'utilisateur",
        password: 'Mot de passe',
        mac: 'Adresse MAC',
        refresh: 'Actualiser',
        loading: 'Chargement…',
        missingParams: "Indiquez le nom d'utilisateur et la MAC pour charger les usages.",
        fetchError: 'Impossible de récupérer les usages.',
        disconnectError: 'Impossible de déconnecter la session.',
        statusTitle: 'Statut',
        statusOnline: 'En ligne',
        statusOffline: 'Hors ligne',
        deviceInfo: 'Site : {{site}} — SSID : {{ssid}}',
        messageHint: 'Ces informations proviennent de RadiusDesk et se rafraîchissent automatiquement.',
        quotaTitle: 'Consommation',
        quotaSubtitle: 'Données et temps restants',
        dataUsed: '{{used}} utilisés / {{cap}} limite',
        timeUsed: '{{used}} utilisés / {{cap}} limite',
        depleted: 'Quota épuisé',
        supportTitle: 'Support',
        supportSubtitle: 'Besoin d’un opérateur ?',
        phoneLabel: 'Téléphone',
        supportFallback: "Contactez l'exploitant pour obtenir de l’aide.",
        sessionsTitle: 'Sessions récentes',
        noSessions: 'Aucune session pour le moment.',
        sessionStart: 'Début',
        sessionStop: 'Fin',
        sessionDuration: 'Durée',
        sessionIp: 'Adresse IP',
        sessionOngoing: 'En cours',
        disconnect: 'Déconnecter'
      },
      support: {
        eyebrow: 'Besoin d’aide ?',
        subtitle: 'Contactez l’équipe opérateur pour les identifiants ou tout souci de connexion.',
        response: 'Réponse <10 min',
        email: 'Email',
        phone: 'Téléphone',
        hours: 'Horaires',
        hoursValue: 'Hotline 24/7',
        address: 'Adresse',
        fallback: 'Voir opérateur'
      },
      terms: {
        eyebrow: 'Politique d’usage',
        scopeTitle: 'Champ',
        scopeBody: 'Ces conditions régissent l’accès au portail captif et au hotspot Omada opéré par Techzone.',
        usageTitle: 'Bon usage',
        usageBody: 'Vous vous engagez à ne pas perturber le réseau, partager vos identifiants ni saturer la bande passante.',
        responsibilityTitle: 'Responsabilité opérateur',
        responsibilityBody: 'L’opérateur peut suspendre l’accès en cas d’abus ou risque de sécurité et journalise les sessions.'
      },
      privacy: {
        eyebrow: 'Confidentialité',
        collectionTitle: 'Données collectées',
        collectionBody: 'MAC, identifiant, métriques de consommation et paramètres Omada sont collectés pour autoriser l’accès.',
        usageTitle: 'Utilisation des données',
        usageBody: 'Les métriques servent à maintenir les sessions, afficher la consommation et traiter les tickets support.',
        rightsTitle: 'Vos droits',
        rightsBody: 'Contactez le support pour toute exportation ou suppression selon la réglementation locale.'
      }
    }
  },
  es: {
    translation: {
      nav: {
        home: 'Portal',
        success: 'Éxito',
        support: 'Soporte',
        terms: 'Términos',
        privacy: 'Privacidad'
      },
      layout: {
        eyebrow: 'Portal Omada',
        title: 'Inicio dinámico',
        language: 'Cambiar idioma',
        navLabel: 'Navegación principal'
      },
      loading: 'Cargando configuración dinámica…',
      error: 'No se pudo cargar la configuración del portal.',
      lastUpdated: 'Última actualización',
      dynamic: {
        boolean: {
          yes: 'Sí',
          no: 'No'
        },
        requestError: 'No es posible contactar al portal cautivo. Inténtalo de nuevo más tarde.',
        loaderHint: 'Obteniendo páginas dinámicas y formularios desde RadiusDesk…',
        modal: {
          title: 'Se requiere una clave dinámica',
          subtitle: 'Utiliza una de las claves autorizadas para este hotspot.',
          emptyList: 'RadiusDesk no devolvió claves dinámicas.',
          supportCta: 'Contactar soporte'
        },
        status: {
          cache: 'Cache {{status}} desde RadiusDesk',
          cacheNone: 'Sin información de cache',
          key: 'Clave {{key}}',
          keyMissing: 'Falta la clave dinámica',
          omadaReady: 'Parámetros Omada listos',
          omadaMissing: 'Parámetros Omada incompletos',
          omadaMissingDetail: 'Faltan: {{fields}}'
        },
        omadaContext: 'Contexto Omada',
        omadaEyebrow: 'Metadatos de red',
        toolbar: {
          title: 'Barra dinámica',
          details: 'Detalles',
          settings: 'Ajustes',
          pages: 'Páginas propias',
          connect: 'Conectar',
          social: 'Inicio social',
          language: 'Idiomas',
          menu: 'Menú'
        },
        detail: {
          defaultName: 'Portal cautivo',
          city: 'Ciudad',
          address: 'Dirección',
          contact: 'Contacto',
          phone: 'Teléfono',
          email: 'Correo',
          website: 'Sitio web',
          clientInfo: 'Información del cliente'
        },
        settings: {
          title: 'Resumen de ajustes',
          showLogo: 'Mostrar logo',
          showName: 'Mostrar nombre',
          nameColour: 'Color del nombre',
          screenDelay: 'Retraso de pantalla',
          templateStyle: 'Estilo de plantilla',
          allowSocial: 'Permitir social login',
          languages: 'Idiomas disponibles',
          notSet: 'No proporcionado'
        },
        pages: {
          title: 'Páginas propias',
          empty: 'No hay páginas personalizadas.',
          emptyContent: 'No se proporcionó contenido para esta página.',
          untitled: 'Página sin título'
        },
        connect: {
          title: 'Haga clic para conectar',
          placeholder: 'El panel de conexión se mostrará aquí (G4.4).',
          countdown: 'Panel disponible en {{seconds}} segundos',
          waitMessage: 'Por favor espera a que aparezca el panel.',
          missingOmada: 'Faltan parámetros de Omada en la URL.',
          missingKey: 'Se requiere la clave dinámica para conectarse.',
          loading: 'Conectando…',
          success: 'Acceso concedido. Redirigiendo…',
          error: 'No se pudo completar la conexión.',
          clickTitle: 'Conectar con un clic',
          clickBody: 'Otorga acceso rápidamente usando la configuración por defecto.',
          clickCta: 'Conectar ahora',
          userTitle: 'Usuario permanente',
          username: 'Usuario',
          password: 'Contraseña',
          submit: 'Conectar',
          voucherTitle: 'Voucher',
          voucherCode: 'Código de voucher'
        },
        social: {
          title: 'Inicio de sesión social',
          placeholder: 'No hay proveedores sociales configurados.',
          description: 'Conéctate usando los proveedores sociales configurados.',
          error: 'No es posible iniciar el flujo social.',
          noTempUser: 'El social login no está completamente configurado.',
          noProviders: 'No hay proveedores sociales disponibles.'
        },
        gallery: {
          title: 'Galería de fotos',
          empty: 'No hay fotos promocionales disponibles.',
          slide: 'Diapositiva de galería',
          prev: 'Anterior',
          next: 'Siguiente',
          thumbnail: 'Miniatura {{index}}',
          close: 'Cerrar visor'
        },
        menu: {
          title: 'Menú rápido',
          close: 'Cerrar',
          help: 'Ayuda y soporte',
          supportLink: 'Página de soporte',
          termsLink: 'Términos y privacidad',
          languages: 'Idiomas'
        }
      },
      success: {
        eyebrow: 'Resumen de conexión',
        subtitle: 'Revisa el estado y consumo de tu conexión.',
        username: 'Usuario',
        password: 'Contraseña',
        mac: 'Dirección MAC',
        refresh: 'Actualizar',
        loading: 'Cargando…',
        missingParams: 'Indica el usuario y la MAC para cargar el uso.',
        fetchError: 'No se pudieron obtener los datos.',
        disconnectError: 'No se pudo desconectar la sesión.',
        statusTitle: 'Estado',
        statusOnline: 'En línea',
        statusOffline: 'Fuera de línea',
        deviceInfo: 'Sitio: {{site}} — SSID: {{ssid}}',
        messageHint: 'Estos datos vienen de RadiusDesk y se actualizan automáticamente.',
        quotaTitle: 'Consumo',
        quotaSubtitle: 'Datos y tiempo disponibles',
        dataUsed: '{{used}} usados / {{cap}} límite',
        timeUsed: '{{used}} usados / {{cap}} límite',
        depleted: 'Cuota agotada',
        supportTitle: 'Soporte',
        supportSubtitle: '¿Necesitas ayuda?',
        phoneLabel: 'Teléfono',
        supportFallback: 'Contacta al operador para recibir ayuda.',
        sessionsTitle: 'Sesiones recientes',
        noSessions: 'No hay sesiones registradas.',
        sessionStart: 'Inicio',
        sessionStop: 'Fin',
        sessionDuration: 'Duración',
        sessionIp: 'Dirección IP',
        sessionOngoing: 'En curso',
        disconnect: 'Desconectar'
      },
      support: {
        eyebrow: '¿Necesitas ayuda?',
        subtitle: 'Escribe al operador para vouchers, credenciales o soporte de dispositivos.',
        response: 'Respuesta <10 min',
        email: 'Correo',
        phone: 'Teléfono',
        hours: 'Horario',
        hoursValue: 'Hotline 24/7',
        address: 'Dirección',
        fallback: 'Contacta al operador'
      },
      terms: {
        eyebrow: 'Política de uso',
        scopeTitle: 'Alcance',
        scopeBody: 'Estos términos regulan el acceso al portal cautivo y al hotspot Omada operado por Techzone.',
        usageTitle: 'Uso aceptable',
        usageBody: 'Te comprometes a no interrumpir la red ni compartir credenciales o saturar el ancho de banda.',
        responsibilityTitle: 'Responsabilidad del operador',
        responsibilityBody: 'El operador puede suspender el acceso ante abuso o riesgo de seguridad y registra las sesiones.'
      },
      privacy: {
        eyebrow: 'Aviso de privacidad',
        collectionTitle: 'Datos recolectados',
        collectionBody: 'Se registran MAC, usuario, métricas de consumo y parámetros Omada para otorgar acceso.',
        usageTitle: 'Uso de los datos',
        usageBody: 'Las métricas se usan para mantener sesiones, mostrar consumo y resolver tickets de soporte.',
        rightsTitle: 'Tus derechos',
        rightsBody: 'Contacta soporte para exportar o eliminar datos según la normativa local.'
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: import.meta.env.VITE_DEFAULT_LANGUAGE || 'fr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
