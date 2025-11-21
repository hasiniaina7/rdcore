import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../modules/auth/AuthProvider';
import { useTheme } from '../modules/theme/ThemeProvider';

const langs = ['fr', 'en', 'es'] as const;

const navItems = [
  { to: '/success', label: 'nav.success' },
  { to: '/support', label: 'nav.support' },
  { to: '/terms', label: 'nav.terms' },
  { to: '/privacy', label: 'nav.privacy' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { session, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const logoSrc = `${import.meta.env.BASE_URL || '/'}Logo-care-transparent.png`;
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="cp-shell" role="navigation" aria-label={t('layout.navLabel')}>
        <div className="cp-shell__brand" onClick={() => navigate('/success')}>
          <img src={logoSrc} alt="Techzone logo" className="cp-shell__logo" />
          <div>
            <p className="cp-shell__eyebrow">{t('layout.eyebrow')}</p>
            <p className="cp-shell__title">{t('layout.title')}</p>
          </div>
        </div>
        <button
          type="button"
          className="cp-shell__menu"
          aria-label={t('layout.navLabel')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          ☰
        </button>
        <nav className={`cp-shell__nav ${menuOpen ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className={`cp-shell__actions ${menuOpen ? 'is-open' : ''}`}>
          <button type="button" className="cp-shell__theme" onClick={toggleTheme} aria-label={t('layout.themeToggle')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <select
            aria-label={t('layout.language')}
            className="cp-shell__language"
            value={i18n.language}
            onChange={(event) => i18n.changeLanguage(event.target.value)}
          >
            {langs.map((code) => (
              <option value={code} key={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
          {session ? (
            <button type="button" className="cp-btn cp-btn--ghost" onClick={onLogout}>
              {t('layout.logout')}
            </button>
          ) : (
            <NavLink to="/" className="cp-btn cp-btn--outline">
              {t('nav.login')}
            </NavLink>
          )}
        </div>
      </header>
      <div className="cp-app">
        <div className="cp-frame">
          <main className="cp-frame__main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
