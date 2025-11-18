import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useOmadaParams from '../hooks/useOmadaParams';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import { readCredentials } from '../modules/dynamic/credentialStorage';
import { useUsageData } from '../modules/usage/useUsageData';
import {
  aggregateByDay,
  aggregateByRouter,
  bytesToHuman,
  calculateProgress,
  combineSessions,
  filterSessions,
  getMacOptions,
  getRouterOptions,
  secondsToDuration,
  summarizePeriod,
} from '../modules/usage/utils';
import UsageFilterBar from '../modules/usage/components/UsageFilterBar';
import SessionTable from '../modules/usage/components/SessionTable';
import type { UsageCredentials, UsageFilters } from '../modules/usage/types';
import { disconnectUsageSessions } from '../modules/usage/api';

const MB = 1024 * 1024;

export default function Success() {
  const { t } = useTranslation();
  const params = useOmadaParams();
  const { data: dynamicDetail } = useDynamicDetail();
  const stored = useMemo(() => readCredentials(), []);
  const initialUsername = stored?.username || params.username || '';
  const initialPassword = stored?.password || params.password || '';
  const initialMac = stored?.mac || params.mac || '';
  const [form, setForm] = useState({
    username: initialUsername,
    password: initialPassword,
    mac: initialMac,
  });
  const [filters, setFilters] = useState<UsageFilters>({ status: 'all' });
  const [localError, setLocalError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDisconnectId, setPendingDisconnectId] = useState<string | null>(null);

  const [credentials, setCredentials] = useState<UsageCredentials | null>(() => {
    if (initialUsername && initialPassword) {
      return { username: initialUsername, password: initialPassword, mac: initialMac || undefined };
    }
    return null;
  });

  const { usage, summary, activeSessions, inactiveSessions, errors, isLoading, lastUpdated, refresh } = useUsageData(credentials);

  const sessions = useMemo(() => combineSessions(activeSessions?.sessions, inactiveSessions?.sessions), [activeSessions, inactiveSessions]);
  const filteredSessions = useMemo(() => filterSessions(sessions, filters), [sessions, filters]);
  const routerOptions = useMemo(() => getRouterOptions(sessions), [sessions]);
  const macOptions = useMemo(() => getMacOptions(sessions), [sessions]);
  const dailySeries = useMemo(() => aggregateByDay(filteredSessions), [filteredSessions]);
  const routerStats = useMemo(() => aggregateByRouter(filteredSessions).slice(0, 5), [filteredSessions]);
  const dailySummary = useMemo(() => summarizePeriod(summary?.periods, 'daily'), [summary]);
  const weeklySummary = useMemo(() => summarizePeriod(summary?.periods, 'weekly'), [summary]);
  const monthlySummary = useMemo(() => summarizePeriod(summary?.periods, 'monthly'), [summary]);
  const dailyChartData = useMemo(
    () =>
      dailySeries.map((point) => ({
        date: point.date.slice(5),
        mb: Number((point.totalBytes / MB).toFixed(2)),
        sessions: point.sessionCount,
      })),
    [dailySeries]
  );
  const weeklyMonthlyBars = useMemo(
    () => [
      { label: t('success.chart.weeklyBar'), mb: Number((weeklySummary.totalBytes / MB).toFixed(2)), sessions: weeklySummary.sessionCount },
      { label: t('success.chart.monthlyBar'), mb: Number((monthlySummary.totalBytes / MB).toFixed(2)), sessions: monthlySummary.sessionCount },
    ],
    [monthlySummary, t, weeklySummary]
  );

  const onlineCount = activeSessions?.sessions.length ?? 0;
  const inactiveCount = inactiveSessions?.sessions.length ?? 0;
  const isOnline = onlineCount > 0;
  const dataProgress = calculateProgress(usage?.dataUsed, usage?.dataCap);
  const timeProgress = calculateProgress(usage?.timeUsed, usage?.timeCap);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : '—';
  const isOmadaBridge = params.fromOmada === '1' || params.mode === 'omada';

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.username || !form.password) {
        setLocalError(t('success.missingParams'));
        return;
      }
      setLocalError(null);
      setBanner(null);
      setCredentials({ username: form.username, password: form.password, mac: form.mac || undefined });
    },
    [form, t]
  );

  const handleDisconnect = useCallback(
    async (radacctId: string) => {
      try {
        setPendingDisconnectId(radacctId);
        setBanner(null);
        await disconnectUsageSessions([radacctId]);
        setBanner({ type: 'success', message: t('success.disconnectSuccess') });
        await refresh();
      } catch (error) {
        const message = (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message;
        setBanner({ type: 'danger', message: message || t('success.disconnectError') });
      } finally {
        setPendingDisconnectId(null);
      }
    },
    [refresh, t]
  );

  const resetFilters = () => setFilters({ status: 'all' });

  return (
    <div className="cp-dashboard">
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
        <form className="cp-form cp-form--grid" onSubmit={handleSubmit} data-testid="usage-form">
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
          <div className="cp-form__actions">
            <button type="submit" className="cp-btn cp-btn--primary" disabled={isLoading}>
              {isLoading ? t('success.loading') : t('success.refresh')}
            </button>
            <button type="button" className="cp-btn cp-btn--ghost" onClick={() => refresh()} disabled={isLoading}>
              {t('success.quickRefresh')}
            </button>
          </div>
        </form>
        {isOmadaBridge && <p className="cp-card__meta">{t('success.omadaBridgeHint')}</p>}
      </article>

      {localError && (
        <p role="alert" className="cp-alert cp-alert--danger">
          {localError}
        </p>
      )}

      {banner && (
        <p role="alert" className={`cp-alert ${banner.type === 'success' ? 'cp-alert--success' : 'cp-alert--danger'}`}>
          {banner.message}
        </p>
      )}

      {errors.map((message, index) => (
        <p key={`${message}-${index}`} role="alert" className="cp-alert cp-alert--danger">
          {message}
        </p>
      ))}

      {usage ? (
        <>
          <section className="cp-grid cp-grid--summary">
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.statusTitle')}</p>
                  <h2 className="cp-title">{t('success.deviceInfo', { site: params.site || 'N/A', ssid: params.ssidName || 'N/A' })}</h2>
                </div>
                <span className={`cp-badge ${isOnline ? 'cp-badge--success' : 'cp-badge--warning'}`}>
                  {t(isOnline ? 'success.statusOnline' : 'success.statusOffline')}
                </span>
              </div>
              <p>{t('success.sessionsSummary', { active: onlineCount, inactive: inactiveCount })}</p>
              <p className="cp-card__meta">{t('success.lastUpdated', { value: lastUpdatedLabel })}</p>
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.quotaTitle')}</p>
                  <h2 className="cp-title">{t('success.quotaSubtitle')}</h2>
                </div>
              </div>
              <p>{t('success.dataUsed', { used: bytesToHuman(usage.dataUsed), cap: bytesToHuman(usage.dataCap ?? undefined) })}</p>
              <div className="cp-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dataProgress ?? 0} role="progressbar">
                <div className="cp-progress__bar" style={{ width: `${dataProgress ?? 0}%` }} />
              </div>
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.timeTitle')}</p>
                  <h2 className="cp-title">{t('success.timeSubtitle')}</h2>
                </div>
              </div>
              <p>{t('success.timeUsed', { used: secondsToDuration(usage.timeUsed), cap: secondsToDuration(usage.timeCap) })}</p>
              <div className="cp-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={timeProgress ?? 0} role="progressbar">
                <div className="cp-progress__bar" style={{ width: `${timeProgress ?? 0}%` }} />
              </div>
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.aggregatesTitle')}</p>
                  <h2 className="cp-title">{t('success.aggregatesSubtitle')}</h2>
                </div>
              </div>
              <ul className="cp-router-list">
                <li className="cp-router-row">
                  <span>{t('success.dailyAggregate')}</span>
                  <strong>{bytesToHuman(dailySummary.totalBytes)}</strong>
                </li>
                <li className="cp-router-row">
                  <span>{t('success.weeklyAggregate')}</span>
                  <strong>{bytesToHuman(weeklySummary.totalBytes)}</strong>
                </li>
                <li className="cp-router-row">
                  <span>{t('success.monthlyAggregate')}</span>
                  <strong>{bytesToHuman(monthlySummary.totalBytes)}</strong>
                </li>
              </ul>
            </article>
          </section>

          <article className="cp-card">
            <div className="cp-card__header">
              <div>
                <p className="cp-eyebrow">{t('success.filters.title')}</p>
                <h2 className="cp-title">{t('success.filters.subtitle')}</h2>
              </div>
              <div className="cp-card__actions">
                <button type="button" className="cp-btn cp-btn--ghost" onClick={resetFilters}>
                  {t('success.filters.reset')}
                </button>
              </div>
            </div>
            <UsageFilterBar filters={filters} onChange={setFilters} routerOptions={routerOptions} macOptions={macOptions} />
          </article>

          <section className="cp-grid cp-grid--charts">
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.chart.dailyEyebrow')}</p>
                  <h2 className="cp-title">{t('success.chart.dailyTitle')}</h2>
                </div>
                <span className="cp-card__meta">{t('success.chart.dailyMeta', { days: dailySeries.length })}</span>
              </div>
              <div className="cp-chart">
                {dailyChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChartData} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={(value) => `${value} MB`} />
                      <Tooltip formatter={(value: number) => `${value} MB`} labelFormatter={(label) => `${t('success.chart.date')}: ${label}`} />
                      <Line type="monotone" dataKey="mb" stroke="#2563eb" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p>{t('success.chart.noData')}</p>
                )}
              </div>
            </article>
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.chart.weeklyEyebrow')}</p>
                  <h2 className="cp-title">{t('success.chart.weeklyTitle')}</h2>
                </div>
              </div>
              <div className="cp-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyMonthlyBars} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `${value} MB`} />
                    <Tooltip formatter={(value: number) => `${value} MB`} />
                    <Bar dataKey="mb" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <article className="cp-card">
            <div className="cp-card__header">
              <div>
                <p className="cp-eyebrow">{t('success.routerStatsTitle')}</p>
                <h2 className="cp-title">{t('success.routerStatsSubtitle')}</h2>
              </div>
            </div>
            {routerStats.length ? (
              <ul className="cp-router-list">
                {routerStats.map((stat) => (
                  <li key={stat.label} className="cp-router-row">
                    <span>{stat.label}</span>
                    <strong>
                      {bytesToHuman(stat.totalBytes)} · {t('success.sessionsCount', { count: stat.sessionCount })}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('success.routerStatsEmpty')}</p>
            )}
          </article>

          <SessionTable
            title={t('success.sessionsTitle')}
            caption={t('success.sessionsCaption', { count: filteredSessions.length })}
            sessions={filteredSessions}
            isLoading={isLoading}
            onDisconnect={handleDisconnect}
            pendingDisconnectId={pendingDisconnectId}
            emptyLabel={t('success.noSessions')}
          />

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
        </>
      ) : (
        <article className="cp-card">
          <p>{t('success.prompt')}</p>
        </article>
      )}
    </div>
  );
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
