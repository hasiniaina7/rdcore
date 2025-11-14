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
      lastUpdated: 'Last updated'
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
      lastUpdated: 'Dernière mise à jour'
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
      lastUpdated: 'Última actualización'
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
