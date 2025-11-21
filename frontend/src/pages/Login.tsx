import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestLogin } from '../modules/auth/api';
import { useAuth } from '../modules/auth/AuthProvider';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', mac: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/success', { replace: true });
    }
  }, [navigate, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedUsername = form.username.trim();
    if (!normalizedUsername || !form.password.includes(normalizedUsername)) {
      setError(t('login.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestLogin({
        username: normalizedUsername,
        password: form.password,
        mac: form.mac || undefined,
      });
      login(result);
      navigate('/success', { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
        (err as { message?: string }).message ||
        t('login.error');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cp-auth">
      <section className="cp-auth__intro">
        <p className="cp-eyebrow">{t('login.eyebrow')}</p>
        <h1>{t('login.title')}</h1>
        <p>{t('login.subtitle')}</p>
        <ul>
          <li>Hotspot Omada + Mikrotik orchestration</li>
          <li>Usage dashboard en temps réel</li>
          <li>Sessions protégées par jeton temporaire</li>
        </ul>
      </section>
      <section className="cp-auth__card">
        <form className="cp-form" onSubmit={handleSubmit}>
          <label className="cp-field" htmlFor="login-username">
            {t('login.username')}
            <input
              id="login-username"
              className="cp-input"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder={t('login.usernamePlaceholder')}
              required
            />
          </label>
          <label className="cp-field" htmlFor="login-password">
            {t('login.password')}
            <input
              id="login-password"
              className="cp-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="••••••••"
              required
            />
          </label>
          <label className="cp-field" htmlFor="login-mac">
            {t('login.mac')}
            <input
              id="login-mac"
              className="cp-input"
              value={form.mac}
              onChange={(event) => setForm((prev) => ({ ...prev, mac: event.target.value }))}
              placeholder="AA:BB:CC:DD:EE:FF"
            />
          </label>
          <button type="submit" className="cp-btn cp-btn--primary" disabled={isLoading}>
            {isLoading ? t('login.loading') : t('login.submit')}
          </button>
        </form>
        {error && (
          <p role="alert" className="cp-alert cp-alert--danger" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        )}
        <p className="cp-card__meta" style={{ marginTop: '1rem' }}>
          {t('login.help')}
        </p>
      </section>
    </div>
  );
}
