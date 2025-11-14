import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const langs = ['fr', 'en', 'es'] as const;

const navItems = [
  { to: '/', label: 'nav.home' },
  { to: '/success', label: 'nav.success' },
  { to: '/support', label: 'nav.support' },
  { to: '/terms', label: 'nav.terms' },
  { to: '/privacy', label: 'nav.privacy' },
];

export default function Layout({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  return (
    <div className="cp-app">
      <div className="cp-frame">
        <header className="cp-frame__header">
          <div className="cp-frame__brand">
            <span className="cp-frame__eyebrow">{t('layout.eyebrow')}</span>
            <p className="cp-frame__title">{t('layout.title')}</p>
          </div>
          <label htmlFor="layout-language" className="sr-only">
            {t('layout.language')}
          </label>
          <select
            id="layout-language"
            className="cp-frame__language"
            value={i18n.language}
            onChange={(event) => i18n.changeLanguage(event.target.value)}
          >
            {langs.map((code) => (
              <option value={code} key={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
        </header>
        <main className="cp-frame__main">{children}</main>
        <div className="cp-frame__nav">
          <nav className="cp-nav" aria-label={t('layout.navLabel')}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
