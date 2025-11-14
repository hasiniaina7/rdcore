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
      loading: 'Loading dynamic settings…',
      error: 'Unable to load the captive portal configuration.',
      lastUpdated: 'Last updated',
      dynamic: {
        boolean: {
          yes: 'Yes',
          no: 'No'
        },
        requestError: 'Unable to contact the captive portal. Please try again shortly.',
        modal: {
          title: 'Dynamic key required',
          subtitle: 'Please use one of the dynamic keys authorized for this hotspot.',
          emptyList: 'No dynamic keys were received from RadiusDesk.',
          supportCta: 'Contact support'
        },
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
        quotaTitle: 'Usage',
        dataUsed: '{{used}} used / {{cap}} cap',
        timeUsed: '{{used}} used / {{cap}} cap',
        depleted: 'Quota depleted',
        supportTitle: 'Support',
        supportFallback: 'Contact the operator for help.',
        sessionsTitle: 'Recent sessions',
        noSessions: 'No sessions recorded yet.',
        sessionStart: 'Start',
        sessionStop: 'Stop',
        sessionDuration: 'Duration',
        sessionIp: 'IP address',
        sessionOngoing: 'Ongoing',
        disconnect: 'Disconnect'
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
      loading: 'Chargement de la configuration dynamique…',
      error: 'Impossible de charger la configuration du portail.',
      lastUpdated: 'Dernière mise à jour',
      dynamic: {
        boolean: {
          yes: 'Oui',
          no: 'Non'
        },
        requestError: 'Impossible de joindre le portail captif. Réessayez dans quelques instants.',
        modal: {
          title: 'Clé dynamique requise',
          subtitle: 'Utilisez l’une des clés autorisées pour ce hotspot.',
          emptyList: 'Aucune clé dynamique n’a été fournie par RadiusDesk.',
          supportCta: 'Contacter le support'
        },
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
        quotaTitle: 'Consommation',
        dataUsed: '{{used}} utilisés / {{cap}} limite',
        timeUsed: '{{used}} utilisés / {{cap}} limite',
        depleted: 'Quota épuisé',
        supportTitle: 'Support',
        supportFallback: "Contactez l'exploitant pour obtenir de l’aide.",
        sessionsTitle: 'Sessions récentes',
        noSessions: 'Aucune session pour le moment.',
        sessionStart: 'Début',
        sessionStop: 'Fin',
        sessionDuration: 'Durée',
        sessionIp: 'Adresse IP',
        sessionOngoing: 'En cours',
        disconnect: 'Déconnecter'
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
      loading: 'Cargando configuración dinámica…',
      error: 'No se pudo cargar la configuración del portal.',
      lastUpdated: 'Última actualización',
      dynamic: {
        boolean: {
          yes: 'Sí',
          no: 'No'
        },
        requestError: 'No es posible contactar al portal cautivo. Inténtalo de nuevo más tarde.',
        modal: {
          title: 'Se requiere una clave dinámica',
          subtitle: 'Utiliza una de las claves autorizadas para este hotspot.',
          emptyList: 'RadiusDesk no devolvió claves dinámicas.',
          supportCta: 'Contactar soporte'
        },
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
        quotaTitle: 'Consumo',
        dataUsed: '{{used}} usados / {{cap}} límite',
        timeUsed: '{{used}} usados / {{cap}} límite',
        depleted: 'Cuota agotada',
        supportTitle: 'Soporte',
        supportFallback: 'Contacta al operador para recibir ayuda.',
        sessionsTitle: 'Sesiones recientes',
        noSessions: 'No hay sesiones registradas.',
        sessionStart: 'Inicio',
        sessionStop: 'Fin',
        sessionDuration: 'Duración',
        sessionIp: 'Dirección IP',
        sessionOngoing: 'En curso',
        disconnect: 'Desconectar'
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
