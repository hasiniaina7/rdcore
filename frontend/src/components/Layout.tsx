import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const langs = ['fr', 'en', 'es'] as const;

export default function Layout({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  return (
    <div>
      <nav>
        <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none' }}>
          <li>
            <NavLink to="/">{t('nav.home')}</NavLink>
          </li>
          <li>
            <NavLink to="/success">{t('nav.success')}</NavLink>
          </li>
          <li>
            <NavLink to="/support">{t('nav.support')}</NavLink>
          </li>
          <li>
            <NavLink to="/terms">{t('nav.terms')}</NavLink>
          </li>
          <li>
            <NavLink to="/privacy">{t('nav.privacy')}</NavLink>
          </li>
          <li>
            <select value={i18n.language} onChange={(event) => i18n.changeLanguage(event.target.value)}>
              {langs.map((code) => (
                <option value={code} key={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
}
