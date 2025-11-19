import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../modules/auth/AuthProvider';

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
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="cp-shell" role="navigation" aria-label={t('layout.navLabel')}>
        <div className="cp-shell__brand" onClick={() => navigate('/success')}>
          <span className="cp-shell__logo">TZ</span>
          <div>
            <p className="cp-shell__eyebrow">{t('layout.eyebrow')}</p>
            <p className="cp-shell__title">{t('layout.title')}</p>
          </div>
        </div>
        <nav className="cp-shell__nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className="cp-shell__actions">
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
