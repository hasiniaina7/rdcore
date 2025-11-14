import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import useOmadaParams from '../hooks/useOmadaParams';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import { readCredentials } from '../modules/dynamic/credentialStorage';

type UsageResponse = {
  username: string;
  mac: string;
  dataUsed?: number;
  dataCap?: number | null;
  timeUsed?: number;
  timeCap?: number | null;
  depleted: boolean;
  sessions: Array<Record<string, unknown>>;
};

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
  }, [form.username, form.mac, t]);

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

  return (
    <section>
      <header>
        <h1>{t('nav.success')}</h1>
        <p>{t('success.subtitle')}</p>
      </header>

      <form
        data-testid="usage-form"
        style={formStyle}
        onSubmit={(event) => {
          event.preventDefault();
          refreshUsage();
        }}
      >
        <label>
          {t('success.username')}
          <input
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('success.password')}
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('success.mac')}
          <input value={form.mac} onChange={(event) => setForm((prev) => ({ ...prev, mac: event.target.value }))} />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? t('success.loading') : t('success.refresh')}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: '#e11d48' }}>
          {error}
        </p>
      )}

      {usage && (
        <>
          <section style={cardsStyle}>
            <article style={cardStyle}>
              <h2>{t('success.statusTitle')}</h2>
              <p>
                {t(isOnline ? 'success.statusOnline' : 'success.statusOffline')}
                {ipAddress && (
                  <>
                    {' '}
                    — IP: <strong>{ipAddress as string}</strong>
                  </>
                )}
              </p>
              <p>{t('success.deviceInfo', { site: params.site || 'N/A', ssid: params.ssidName || 'N/A' })}</p>
            </article>
            <article style={cardStyle}>
              <h2>{t('success.quotaTitle')}</h2>
              <p>
                {t('success.dataUsed', { used: formatBytes(usage.dataUsed), cap: formatBytes(usage.dataCap) })}
              </p>
              <p>{t('success.timeUsed', { used: formatDuration(usage.timeUsed), cap: formatDuration(usage.timeCap) })}</p>
              {usage.depleted && <p style={{ color: '#b45309' }}>{t('success.depleted')}</p>}
            </article>
            <article style={cardStyle}>
              <h2>{t('success.supportTitle')}</h2>
              <p>{formatText(dynamicDetail?.detail?.email, t('success.supportFallback'))}</p>
              <p>{formatText(dynamicDetail?.detail?.phone)}</p>
            </article>
          </section>

          <section>
            <header style={sectionHeader}>
              <h2>{t('success.sessionsTitle')}</h2>
              <button type="button" onClick={refreshUsage}>
                {t('success.refresh')}
              </button>
            </header>
            {usage.sessions.length === 0 ? (
              <p>{t('success.noSessions')}</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th>{t('success.sessionStart')}</th>
                    <th>{t('success.sessionStop')}</th>
                    <th>{t('success.sessionDuration')}</th>
                    <th>{t('success.sessionIp')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {usage.sessions.map((session) => {
                    const id = String(session.radacctid ?? session.id ?? '');
                    const durationSeconds = session.acctsessiontime ? Number(session.acctsessiontime) : undefined;
                    return (
                      <tr key={id}>
                        <td>{formatDate(session.acctstarttime)}</td>
                        <td>{session.acctstoptime ? formatDate(session.acctstoptime) : t('success.sessionOngoing')}</td>
                        <td>{formatDuration(durationSeconds)}</td>
                        <td>{formatText(session.framedipaddress)}</td>
                        <td>
                          {id && (
                            <button type="button" onClick={() => disconnectSession(id)}>
                              {t('success.disconnect')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </section>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  marginBottom: '1rem',
};

const cardsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #dfe3eb',
  borderRadius: '8px',
  padding: '1rem',
  backgroundColor: '#fff',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

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
