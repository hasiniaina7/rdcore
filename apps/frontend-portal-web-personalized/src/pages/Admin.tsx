import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ADMIN_MODES_LABELS,
  adminLogin,
  adminLogout,
  adminTokenStorage,
  fetchAdminAuthModes,
  fetchAdminSession,
  fetchAdminUserInsights,
} from '../modules/admin/api';
import type { AdminAuthMode, AdminSessionInfo, AdminUserInsights } from '../modules/admin/types';
import { bytesToHuman, secondsToDuration } from '../modules/usage/utils';

const DEFAULT_HISTORY_LIMIT = 120;

export default function AdminPage() {
  const { t } = useTranslation();
  const [authModes, setAuthModes] = useState<AdminAuthMode[]>([]);
  const [defaultMode, setDefaultMode] = useState<AdminAuthMode | null>(null);
  const [token, setToken] = useState<string | null>(() => adminTokenStorage.load());
  const [session, setSession] = useState<AdminSessionInfo | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', mode: '' as AdminAuthMode | '' });
  const [query, setQuery] = useState('');
  const [historyLimit, setHistoryLimit] = useState(DEFAULT_HISTORY_LIMIT);
  const [insights, setInsights] = useState<AdminUserInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchAdminAuthModes();
        setAuthModes(data.availableModes);
        setDefaultMode(data.defaultMode);
        if (data.defaultMode) {
          setLoginForm((prev) => ({ ...prev, mode: prev.mode || data.defaultMode! }));
        }
      } catch (err) {
        setError(extractMessage(err, t('admin.loadModesError')));
      }
    })();
  }, [t]);

  useEffect(() => {
    if (!token) {
      setSession(null);
      return;
    }
    setIsAuthLoading(true);
    void fetchAdminSession(token)
      .then((info) => {
        setSession(info);
        setError(null);
      })
      .catch((err) => {
        setError(extractMessage(err, t('admin.sessionExpired')));
        adminTokenStorage.clear();
        setSession(null);
        setToken(null);
      })
      .finally(() => setIsAuthLoading(false));
  }, [token, t]);

  const selectedMode = useMemo(() => {
    if (loginForm.mode) {
      return loginForm.mode;
    }
    return defaultMode ?? authModes[0];
  }, [authModes, defaultMode, loginForm.mode]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setError(t('admin.loginMissing'));
      return;
    }
    setIsAuthLoading(true);
    try {
      const result = await adminLogin({
        username: loginForm.username,
        password: loginForm.password,
        mode: selectedMode,
      });
      adminTokenStorage.save(result.token);
      setToken(result.token);
      setLoginForm((prev) => ({ ...prev, password: '' }));
      setError(null);
    } catch (err) {
      setError(extractMessage(err, t('admin.loginError')));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await adminLogout(token);
      } catch (err) {
        setError(extractMessage(err, t('admin.logoutError')));
      }
    }
    adminTokenStorage.clear();
    setToken(null);
    setSession(null);
    setInsights(null);
  };

  const handleInsightFetch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !query.trim()) {
      setError(t('admin.lookupMissing'));
      return;
    }
    setIsInsightsLoading(true);
    try {
      const data = await fetchAdminUserInsights(query.trim(), token, historyLimit || undefined);
      setInsights(data);
      setError(null);
    } catch (err) {
      setError(extractMessage(err, t('admin.lookupError')));
      setInsights(null);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  return (
    <div className="cp-stack">
      <article className="cp-card">
        <div className="cp-card__header">
          <div>
            <p className="cp-eyebrow">{t('admin.eyebrow')}</p>
            <h1 className="cp-title">{t('admin.title')}</h1>
          </div>
          {session ? (
            <button type="button" className="cp-btn cp-btn--ghost" onClick={handleLogout} disabled={isAuthLoading}>
              {t('admin.logout')}
            </button>
          ) : null}
        </div>
        <p>{t('admin.subtitle')}</p>
        {!session ? (
          <form className="cp-form cp-form--grid" onSubmit={handleLogin}>
            <label className="cp-field" htmlFor="admin-username">
              {t('admin.username')}
              <input
                id="admin-username"
                className="cp-input"
                value={loginForm.username}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                autoComplete="username"
              />
            </label>
            <label className="cp-field" htmlFor="admin-password">
              {t('admin.password')}
              <input
                id="admin-password"
                className="cp-input"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                autoComplete="current-password"
              />
            </label>
            {authModes.length > 1 && (
              <label className="cp-field" htmlFor="admin-mode">
                {t('admin.mode')}
                <select
                  id="admin-mode"
                  className="cp-input"
                  value={selectedMode ?? ''}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, mode: event.target.value as AdminAuthMode }))}
                >
                  {authModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {t(ADMIN_MODES_LABELS[mode])}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="cp-form__actions">
              <button type="submit" className="cp-btn cp-btn--primary" disabled={isAuthLoading}>
                {isAuthLoading ? t('admin.loading') : t('admin.login')}
              </button>
            </div>
          </form>
        ) : (
          <div className="cp-admin-session">
            <p>
              {t('admin.sessionActive', {
                username: session.username,
                mode: t(ADMIN_MODES_LABELS[session.mode]),
              })}
            </p>
            <small className="cp-card__meta">{t('admin.sessionHint')}</small>
          </div>
        )}
      </article>

      {error && (
        <p role="alert" className="cp-alert cp-alert--danger">
          {error}
        </p>
      )}

      {session && (
        <article className="cp-card">
          <div className="cp-card__header">
            <div>
              <p className="cp-eyebrow">{t('admin.lookupTitle')}</p>
              <h2 className="cp-title">{t('admin.lookupSubtitle')}</h2>
            </div>
            {insights && <span className="cp-card__meta">{t('admin.lastUpdated', { value: formatDate(insights.lastUpdated) })}</span>}
          </div>
          <form className="cp-form cp-form--grid" onSubmit={handleInsightFetch}>
            <label className="cp-field" htmlFor="admin-query">
              {t('admin.lookupUsername')}
              <input
                id="admin-query"
                className="cp-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="glaringboy"
              />
            </label>
            <label className="cp-field" htmlFor="admin-history">
              {t('admin.historyLimit')}
              <input
                id="admin-history"
                className="cp-input"
                type="number"
                min={50}
                max={500}
                step={10}
                value={historyLimit}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setHistoryLimit(Number.isFinite(next) ? next : DEFAULT_HISTORY_LIMIT);
                }}
              />
            </label>
            <div className="cp-form__actions">
              <button type="submit" className="cp-btn cp-btn--primary" disabled={isInsightsLoading}>
                {isInsightsLoading ? t('admin.loading') : t('admin.lookupCta')}
              </button>
            </div>
          </form>
        </article>
      )}

      {session && insights && (
        <div className="cp-dashboard">
          <section className="cp-grid cp-grid--summary">
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('admin.summaryTitle')}</p>
                  <h2 className="cp-title">{insights.username}</h2>
                </div>
              </div>
              <p>{t('admin.summaryCounts', { active: insights.activeCount, inactive: insights.inactiveCount })}</p>
              <p className="cp-card__meta">{t('admin.historyLabel', { value: insights.historyLimit })}</p>
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <p className="cp-eyebrow">{t('admin.macsTitle')}</p>
              </div>
              {insights.macs.length ? (
                <ul className="cp-pill-list">
                  {insights.macs.map((mac) => (
                    <li key={mac} className="cp-pill">
                      {mac}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t('admin.noMacs')}</p>
              )}
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <p className="cp-eyebrow">{t('admin.periodsTitle')}</p>
              </div>
              <div className="cp-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{t('admin.periodLabel')}</th>
                      <th>{t('admin.dataLabel')}</th>
                      <th>{t('admin.timeLabel')}</th>
                      <th>{t('admin.sessionsLabel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.periods.map((period) => (
                      <tr key={period.period}>
                        <td>{period.period}</td>
                        <td>{bytesToHuman(period.totalBytes)}</td>
                        <td>{secondsToDuration(period.totalTimeSeconds)}</td>
                        <td>{period.sessionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <p className="cp-eyebrow">{t('admin.routerTitle')}</p>
              </div>
              {insights.routerStats.length ? (
                <div className="cp-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('admin.routerName')}</th>
                        <th>{t('admin.dataLabel')}</th>
                        <th>{t('admin.sessionsLabel')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.routerStats.map((router) => (
                        <tr key={router.label}>
                          <td>{router.label}</td>
                          <td>{bytesToHuman(router.totalBytes)}</td>
                          <td>{router.sessionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>{t('admin.noRouters')}</p>
              )}
            </article>
          </section>

          <section className="cp-grid cp-grid--charts">
            <SessionDumpCard title={t('admin.activeSessions')} sessions={insights.activeSessions} emptyLabel={t('admin.noData')} />
            <SessionDumpCard
              title={t('admin.inactiveSessions')}
              sessions={insights.inactiveSessions}
              emptyLabel={t('admin.noData')}
            />
          </section>
        </div>
      )}
    </div>
  );
}

function SessionDumpCard({
  title,
  sessions,
  emptyLabel,
}: {
  title: string;
  sessions: Array<Record<string, unknown>>;
  emptyLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <article className="cp-card">
      <div className="cp-card__header">
        <h3 className="cp-title">{title}</h3>
        <span className="cp-card__meta">{t('admin.sessionsLabel')}: {sessions.length}</span>
      </div>
      <div className="cp-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t('success.table.start')}</th>
              <th>{t('success.table.duration')}</th>
              <th>{t('success.table.data')}</th>
              <th>{t('success.table.router')}</th>
              <th>{t('success.table.device')}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="cp-table-empty">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {sessions.map((entry, index) => (
              <tr key={`${entry.radacctid ?? index}-${entry.acctstarttime ?? index}`}>
                <td>{formatDate(entry.acctstarttime)}</td>
                <td>{secondsToDuration(Number(entry.acctsessiontime) || 0)}</td>
                <td>
                  {bytesToHuman(Number(entry.acctinputoctets ?? 0) + Number(entry.acctoutputoctets ?? 0))}
                </td>
                <td>{String(entry.nasidentifier ?? entry.router ?? entry.site ?? '—')}</td>
                <td>{String(entry.callingstationid ?? entry.mac ?? entry.device_mac ?? '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function extractMessage(error: unknown, fallback: string) {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const record = error as { response?: { data?: { message?: string } }; message?: string };
    return record.response?.data?.message || record.message || fallback;
  }
  return fallback;
}
