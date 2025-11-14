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
          countdown: 'Connect panel available in {{seconds}} seconds'
        },
        social: {
          title: 'Social login',
          placeholder: 'No social login providers were configured.'
        },
        menu: {
          title: 'Quick menu',
          close: 'Close',
          help: 'Help & Support',
          supportLink: 'Support page',
          termsLink: 'Terms & Privacy',
          languages: 'Languages'
        }
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
          countdown: 'Panneau disponible dans {{seconds}} secondes'
        },
        social: {
          title: 'Connexion sociale',
          placeholder: 'Aucun fournisseur social configuré.'
        },
        menu: {
          title: 'Menu rapide',
          close: 'Fermer',
          help: 'Aide & Support',
          supportLink: 'Page support',
          termsLink: 'Conditions & Confidentialité',
          languages: 'Langues'
        }
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
          countdown: 'Panel disponible en {{seconds}} segundos'
        },
        social: {
          title: 'Inicio de sesión social',
          placeholder: 'No hay proveedores sociales configurados.'
        },
        menu: {
          title: 'Menú rápido',
          close: 'Cerrar',
          help: 'Ayuda y soporte',
          supportLink: 'Página de soporte',
          termsLink: 'Términos y privacidad',
          languages: 'Idiomas'
        }
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
