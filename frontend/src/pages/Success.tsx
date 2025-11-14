import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import useOmadaParams from '../hooks/useOmadaParams';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import { readCredentials } from '../modules/dynamic/credentialStorage';

interface UsageResponse {
  username: string;
  mac: string;
  dataUsed?: number;
  dataCap?: number | null;
  timeUsed?: number;
  timeCap?: number | null;
  depleted: boolean;
  sessions: Array<Record<string, unknown>>;
}

export default function Success() {
  const { t } = useTranslation();
  const params = useOmadaParams();
  const { data: dynamicDetail } = useDynamicDetail();
  const stored = useMemo(() => readCredentials(), []);
  const [form, setForm] = useState({
    username: stored?.username || params.username || '',
    mac: stored?.mac || params.mac || params.clientMac || '',
    password: stored?.password || '',
  });
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnline = useMemo(() => usage?.sessions?.some((session) => session.acctstoptime == null) ?? false, [usage]);
  const ipAddress = useMemo(() => {
    const entry = usage?.sessions?.find((session) => session.framedipaddress);
    return entry ? String(entry.framedipaddress) : null;
  }, [usage]);

  const refreshUsage = useCallback(async () => {
    if (!form.username || !form.password) {
      setError(t('success.missingParams'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get<{ success: boolean; data: UsageResponse }>('/usage', {
        params: { username: form.username, password: form.password, mac: form.mac },
      });
      setUsage(response.data.data);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || t('success.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [form.username, form.password, form.mac, t]);

  const disconnectSession = async (radacctId: string) => {
    try {
      await client.post('/usage/disconnect', { radacctIds: [radacctId] });
      refreshUsage();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || t('success.disconnectError'));
    }
  };

  useEffect(() => {
    if (form.username && form.password) {
      refreshUsage();
      const interval = window.setInterval(refreshUsage, 30000);
      return () => window.clearInterval(interval);
    }
    return undefined;
  }, [form.username, form.password, refreshUsage]);

  const dataProgress = usage?.dataCap ? Math.min(100, Math.round(((usage.dataUsed ?? 0) / usage.dataCap) * 100)) : null;
  const timeProgress = usage?.timeCap ? Math.min(100, Math.round(((usage.timeUsed ?? 0) / usage.timeCap) * 100)) : null;

  return (
    <div className="cp-stack">
      <article className="cp-card">
        <div className="cp-card__header">
          <div>
            <p className="cp-eyebrow">{t('success.eyebrow')}</p>
            <h1 className="cp-title">{t('nav.success')}</h1>
          </div>
          <span className={`cp-badge ${isOnline ? 'cp-badge--success' : 'cp-badge--warning'}`}>
            {t(isOnline ? 'success.statusOnline' : 'success.statusOffline')}
          </span>
        </div>
        <p>{t('success.subtitle')}</p>
        <form
          data-testid="usage-form"
          className="cp-form"
          onSubmit={(event) => {
            event.preventDefault();
            refreshUsage();
          }}
        >
          <label className="cp-field" htmlFor="usage-username">
            {t('success.username')}
            <input
              id="usage-username"
              className="cp-input"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
          </label>
          <label className="cp-field" htmlFor="usage-password">
            {t('success.password')}
            <input
              id="usage-password"
              className="cp-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <label className="cp-field" htmlFor="usage-mac">
            {t('success.mac')}
            <input
              id="usage-mac"
              className="cp-input"
              value={form.mac}
              onChange={(event) => setForm((prev) => ({ ...prev, mac: event.target.value }))}
            />
          </label>
          <button type="submit" className="cp-btn cp-btn--primary" disabled={isLoading}>
            {isLoading ? t('success.loading') : t('success.refresh')}
          </button>
        </form>
      </article>

      {error && (
        <p role="alert" className="cp-alert cp-alert--danger">
          {error}
        </p>
      )}

      {usage && (
        <>
          <article className="cp-card">
            <div className="cp-card__header">
              <div>
                <p className="cp-eyebrow">{t('success.statusTitle')}</p>
                <h2 className="cp-title">{t('success.deviceInfo', { site: params.site || 'N/A', ssid: params.ssidName || 'N/A' })}</h2>
              </div>
              {ipAddress && <span className="cp-badge cp-badge--info">IP {ipAddress}</span>}
            </div>
            <p>{t('success.messageHint')}</p>
            {usage.depleted && <p className="cp-alert cp-alert--warning">{t('success.depleted')}</p>}
          </article>

          <article className="cp-card">
            <div className="cp-card__header">
              <div>
                <p className="cp-eyebrow">{t('success.quotaTitle')}</p>
                <h2 className="cp-title">{t('success.quotaSubtitle')}</h2>
              </div>
            </div>
            <div>
              <p>{t('success.dataUsed', { used: formatBytes(usage.dataUsed), cap: formatBytes(usage.dataCap) })}</p>
              <div className="cp-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dataProgress ?? 0} role="progressbar">
                <div className="cp-progress__bar" style={{ width: `${dataProgress ?? 0}%` }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p>{t('success.timeUsed', { used: formatDuration(usage.timeUsed), cap: formatDuration(usage.timeCap) })}</p>
              <div className="cp-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={timeProgress ?? 0} role="progressbar">
                <div className="cp-progress__bar" style={{ width: `${timeProgress ?? 0}%` }} />
              </div>
            </div>
          </article>

          <article className="cp-card">
            <div className="cp-card__header">
              <div>
                <p className="cp-eyebrow">{t('success.supportTitle')}</p>
                <h2 className="cp-title">{t('success.supportSubtitle')}</h2>
              </div>
            </div>
            <dl className="cp-description-list">
              <div>
                <dt>Email</dt>
                <dd>{formatText(dynamicDetail?.detail?.email, t('success.supportFallback'))}</dd>
              </div>
              <div>
                <dt>{t('success.phoneLabel')}</dt>
                <dd>{formatText(dynamicDetail?.detail?.phone, t('success.supportFallback'))}</dd>
              </div>
            </dl>
          </article>

          <article className="cp-card">
            <div className="cp-card__header">
              <h2 className="cp-title">{t('success.sessionsTitle')}</h2>
              <button type="button" className="cp-btn cp-btn--ghost" onClick={refreshUsage}>
                {t('success.refresh')}
              </button>
            </div>
            {usage.sessions.length === 0 ? (
              <p>{t('success.noSessions')}</p>
            ) : (
              <ul className="cp-list">
                {usage.sessions.map((session) => {
                  const id = String(session.radacctid ?? session.id ?? '');
                  const durationSeconds = session.acctsessiontime ? Number(session.acctsessiontime) : undefined;
                  return (
                    <li key={id} className="cp-list__item">
                      <p className="cp-list__title">{formatDate(session.acctstarttime)}</p>
                      <p>{session.acctstoptime ? formatDate(session.acctstoptime) : t('success.sessionOngoing')}</p>
                      <p>{formatDuration(durationSeconds)}</p>
                      <p>{formatText(session.framedipaddress)}</p>
                      {id && (
                        <button type="button" className="cp-btn cp-btn--outline" onClick={() => disconnectSession(id)}>
                          {t('success.disconnect')}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </>
      )}
    </div>
  );
}

function formatBytes(bytes?: number | null) {
  if (bytes == null) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) {
    return '—';
  }
  const mins = Math.floor(Number(seconds) / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  return `${hours} h ${mins % 60} min`;
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatText(value: unknown, fallback = '—') {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return fallback;
}
