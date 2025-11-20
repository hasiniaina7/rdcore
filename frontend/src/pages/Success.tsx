import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Link } from 'react-router-dom';
import useOmadaParams from '../hooks/useOmadaParams';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import { useUsageData } from '../modules/usage/useUsageData';
import {
  aggregateByDay,
  bytesToHuman,
  calculateProgress,
  combineSessions,
  filterSessions,
  getMacOptions,
  getSessionBytes,
  secondsToDuration,
  summarizePeriod,
} from '../modules/usage/utils';
import UsageFilterBar from '../modules/usage/components/UsageFilterBar';
import SessionTable from '../modules/usage/components/SessionTable';
import type { DashboardSession, UsageFilters, UsageTimeseriesGranularity } from '../modules/usage/types';
import { disconnectUsageSessions } from '../modules/usage/api';
import { useAuth } from '../modules/auth/AuthProvider';

const MB = 1024 * 1024;

export default function Success() {
  const { t } = useTranslation();
  const params = useOmadaParams();
  const { data: dynamicDetail } = useDynamicDetail();
  const { session } = useAuth();
  const [macInput, setMacInput] = useState(session?.profile?.mac || params.mac || '');
  const [macOverride, setMacOverride] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<UsageFilters>({ status: 'all' });
  const [draftFilters, setDraftFilters] = useState<UsageFilters>({ status: 'all' });
  const [serverFilters, setServerFilters] = useState<{ startDate?: string; endDate?: string; status?: UsageFilters['status'] }>({
    status: 'all',
  });
  const [hasApplied, setHasApplied] = useState(false);
  const [refreshRate, setRefreshRate] = useState<'off' | '15' | '60'>('off');
  const [timeseriesMode, setTimeseriesMode] = useState<UsageTimeseriesGranularity>('day');
  const [banner, setBanner] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDisconnectId, setPendingDisconnectId] = useState<string | null>(null);

  useEffect(() => {
    setMacInput(session?.profile?.mac || '');
    setMacOverride(undefined);
  }, [session?.profile?.mac]);

  const activeMac = macOverride ?? session?.profile?.mac ?? undefined;

  const { usage, summary, activeSessions, inactiveSessions, errors, isLoading, lastUpdated, refresh } = useUsageData({
    enabled: Boolean(session) && hasApplied,
    mac: activeMac,
    filters: {
      startDate: serverFilters.startDate,
      endDate: serverFilters.endDate,
      status: serverFilters.status,
      granularity: timeseriesMode,
    },
  });

  const sessions = useMemo(() => combineSessions(activeSessions?.sessions, inactiveSessions?.sessions), [activeSessions, inactiveSessions]);
  const filteredSessions = useMemo(() => filterSessions(sessions, filters), [sessions, filters]);
  const macOptions = useMemo(() => getMacOptions(sessions), [sessions]);
  const dailySeries = useMemo(() => aggregateByDay(filteredSessions), [filteredSessions]);
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
  const clusterData = useMemo(
    () => buildClusterData(filteredSessions, timeseriesMode, filters.startDate, filters.endDate),
    [filteredSessions, filters.endDate, filters.startDate, timeseriesMode]
  );
  const selectedRangeLabel = useMemo(
    () => formatRangeLabel(filters.startDate, filters.endDate),
    [filters.endDate, filters.startDate]
  );

  const onlineCount = activeSessions?.sessions.length ?? 0;
  const inactiveCount = inactiveSessions?.sessions.length ?? 0;
  const isOnline = onlineCount > 0;
  const dataProgress = calculateProgress(usage?.dataUsed, usage?.dataCap);
  const timeProgress = calculateProgress(usage?.timeUsed, usage?.timeCap);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : '—';
  const isOmadaBridge = params.fromOmada === '1' || params.mode === 'omada';

  const handleMacSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setBanner(null);
      setMacOverride(macInput.trim() || undefined);
      if (hasApplied) {
        void refresh();
      }
    },
    [hasApplied, macInput, refresh]
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

  const handleApplyFilters = useCallback(() => {
    setFilters(draftFilters);
    setServerFilters({
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      status: draftFilters.status ?? 'all',
    });
    void refresh();
  }, [draftFilters, refresh]);

  const resetFilters = useCallback(() => {
    const base: UsageFilters = {
      status: 'all',
      startDate: undefined,
      endDate: undefined,
      router: undefined,
      deviceMac: undefined,
      minMegabytes: undefined,
    };
    setFilters(base);
    setDraftFilters(base);
    setServerFilters({ status: 'all' });
    setHasApplied(false);
  }, []);

  const autoRefreshLabel = (value: typeof refreshRate) => {
    switch (value) {
      case '15':
        return t('success.autoRefresh.fast');
      case '60':
        return t('success.autoRefresh.slow');
      default:
        return t('success.autoRefresh.default');
    }
  };

  const chartsVisible = hasApplied && usage;

  useEffect(() => {
    if (!session || hasApplied) {
      return;
    }
    const defaultRange = buildRangeForMode(timeseriesMode);
    const base: UsageFilters = {
      status: 'all',
      startDate: defaultRange.uiStart,
      endDate: defaultRange.uiEnd,
    };
    setFilters(base);
    setDraftFilters(base);
    setServerFilters({
      startDate: defaultRange.serverStart,
      endDate: defaultRange.serverEnd,
      status: 'all',
    });
    setHasApplied(true);
  }, [session, hasApplied, timeseriesMode]);

  useEffect(() => {
    if (!hasApplied) {
      return;
    }
    void refresh();
  }, [hasApplied, serverFilters, timeseriesMode, refresh]);

  useEffect(() => {
    if (!hasApplied) {
      return;
    }
    const intervalMs = refreshRate === '15' ? 15_000 : refreshRate === '60' ? 60_000 : 0;
    if (!intervalMs) {
      return;
    }
    const id = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [hasApplied, refreshRate, refresh]);

  return (
    <div className="cp-dashboard">
      <article className="cp-card cp-card--hero">
        <div className="cp-card__header">
          <div>
            <p className="cp-eyebrow">{t('success.eyebrow')}</p>
            <h1 className="cp-title">{t('nav.success')}</h1>
          </div>
          <span className="cp-badge cp-badge--success">{t('success.sessionReady')}</span>
        </div>
        <p>{t('success.authenticatedAs', { username: session?.profile?.username ?? '—' })}</p>
        <form className="cp-form cp-form--grid" onSubmit={handleMacSubmit}>
          <label className="cp-field" htmlFor="usage-mac">
            {t('success.mac')}
            <input
              id="usage-mac"
              className="cp-input"
              value={macInput}
              onChange={(event) => setMacInput(event.target.value)}
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

      <section className="cp-grid cp-grid--2">
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
          <p>{t('success.dataUsed', { used: bytesToHuman(usage?.dataUsed), cap: bytesToHuman(usage?.dataCap ?? undefined) })}</p>
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
          <p>{t('success.timeUsed', { used: secondsToDuration(usage?.timeUsed), cap: secondsToDuration(usage?.timeCap) })}</p>
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
            <label htmlFor="refresh-rate" className="sr-only">
              {t('success.autoRefresh.label')}
            </label>
            <select
              id="refresh-rate"
              className="cp-shell__language"
              value={refreshRate}
              onChange={(event) => setRefreshRate(event.target.value as typeof refreshRate)}
              disabled={!hasApplied}
            >
              {(['off', '15', '60'] as const).map((value) => (
                <option key={value} value={value}>
                  {autoRefreshLabel(value)}
                </option>
              ))}
            </select>
            <button type="button" className="cp-btn cp-btn--ghost" onClick={resetFilters}>
              {t('success.filters.reset')}
            </button>
          </div>
        </div>
        <UsageFilterBar
          filters={draftFilters}
          onChange={setDraftFilters}
          macOptions={macOptions}
          onApply={handleApplyFilters}
          isApplying={isLoading}
        />
      </article>

      {hasApplied && usage ? (
        <>

          <section className="cp-grid cp-grid--2">
            <article className="cp-card">
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('success.chart.dailyEyebrow')}</p>
                  <h2 className="cp-title">{t('success.chart.dailyTitle')}</h2>
                </div>
                <span className="cp-card__meta">
                  {t('success.chart.dailyMeta', { days: dailySeries.length })} {selectedRangeLabel}
                </span>
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
                  <p>
                    {t('success.chart.noData')} {selectedRangeLabel}
                  </p>
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
                <p className="cp-eyebrow">{t('success.chart.clusterEyebrow')}</p>
                <h2 className="cp-title">{t('success.chart.clusterTitle')}</h2>
                <p className="cp-card__meta">
                  {selectedRangeLabel ? t('success.chart.rangeSummary', { range: selectedRangeLabel }) : t('success.chart.rangeEmpty')}
                </p>
              </div>
              <div className="cp-pill-switch" role="group" aria-label={t('success.chart.modeSelector')}>
                {(['hour', 'day', 'month'] as UsageTimeseriesGranularity[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`cp-pill-switch__btn ${timeseriesMode === mode ? 'is-active' : ''}`}
                    onClick={() => setTimeseriesMode(mode)}
                  >
                    {t(`success.chart.modes.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="cp-chart cp-chart--cluster">
              {clusterData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusterData} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(value) => `${value} MB`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickFormatter={(value) => `${value}`} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === t('success.chart.megabytes')
                          ? [`${value} MB`, t('success.chart.megabytes')]
                          : [value, t('success.chart.sessions')]
                      }
                      labelFormatter={(label) => `${t('success.chart.bucketLabel')}: ${label}`}
                    />
                    <defs>
                      <linearGradient id="clusterMb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <Bar
                      yAxisId="left"
                      dataKey="mb"
                      fill="url(#clusterMb)"
                      name={t('success.chart.megabytes')}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="sessions"
                      fill="#f97316"
                      name={t('success.chart.sessions')}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>
                  {selectedRangeLabel
                    ? t('success.chart.noDataRange', { range: selectedRangeLabel })
                    : t('success.chart.noData')}
                </p>
              )}
            </div>
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
            <Link to="/support" className="cp-btn cp-btn--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              {t('support.eyebrow')}
            </Link>
          </article>
        </>
      ) : (
        <article className="cp-card">
          <p>{t('success.filters.subtitle')}</p>
          <p className="cp-card__meta">{t('success.chart.rangeEmpty')}</p>
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

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function buildRangeForMode(mode: UsageTimeseriesGranularity, startValue?: string) {
  const reference = startValue ? new Date(startValue) : new Date();
  if (Number.isNaN(reference.getTime())) {
    reference.setTime(Date.now());
  }
  if (mode === 'hour') {
    const start = startOfDay(reference);
    const end = endOfDay(reference);
    return formatRange(start, end);
  }
  if (mode === 'day') {
    const start = startOfWeek(reference);
    const end = endOfDay(addDays(start, 6));
    return formatRange(start, end);
  }
  const start = startOfMonth(reference);
  const end = endOfMonth(reference);
  return formatRange(start, end);
}

function formatRange(start: Date, end: Date) {
  return {
    uiStart: formatDateInput(start),
    uiEnd: formatDateInput(end),
    serverStart: start.toISOString(),
    serverEnd: end.toISOString(),
  };
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatRangeLabel(start?: string, end?: string) {
  if (!start && !end) {
    return '';
  }
  const format = (value?: string) => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString();
  };
  const startLabel = format(start);
  const endLabel = format(end);
  if (startLabel && endLabel) {
    return `${startLabel} → ${endLabel}`;
  }
  return startLabel || endLabel || '';
}

function startOfDay(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function endOfDay(date: Date) {
  const clone = new Date(date);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

function addDays(date: Date, days: number) {
  const clone = new Date(date);
  clone.setTime(clone.getTime() + days * DAY_IN_MS);
  return clone;
}

function startOfWeek(date: Date) {
  const clone = startOfDay(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  return clone;
}

function startOfMonth(date: Date) {
  const clone = startOfDay(date);
  clone.setDate(1);
  return clone;
}

function endOfMonth(date: Date) {
  const start = startOfMonth(date);
  const clone = new Date(start);
  clone.setMonth(clone.getMonth() + 1);
  clone.setDate(0);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

function buildClusterData(
  sessions: DashboardSession[],
  mode: UsageTimeseriesGranularity,
  startDate?: string,
  endDate?: string
) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : undefined;
  const buckets: Array<{ label: string; totalBytes: number; sessionCount: number }> = [];

  const inRange = (date: Date) => {
    if (Number.isNaN(date.getTime())) return false;
    if (startDate && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  if (mode === 'hour') {
    const dayStart = startOfDay(start);
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}h`;
      buckets.push({ label, totalBytes: 0, sessionCount: 0 });
    }
    sessions.forEach((session) => {
      const started = new Date(String(session.acctstarttime ?? session.acctstoptime ?? Date.now()));
      if (!inRange(started) || started.toDateString() !== dayStart.toDateString()) return;
      const hour = started.getHours();
      buckets[hour].totalBytes += getSessionBytes(session);
      buckets[hour].sessionCount += 1;
    });
    return buckets;
  }

  if (mode === 'day') {
    const weekStart = startOfWeek(start);
    for (let d = 0; d < 7; d++) {
      const current = addDays(weekStart, d);
      const label = current.toLocaleDateString(undefined, { weekday: 'short' });
      buckets.push({ label, totalBytes: 0, sessionCount: 0 });
    }
    sessions.forEach((session) => {
      const started = new Date(String(session.acctstarttime ?? session.acctstoptime ?? Date.now()));
      if (!inRange(started)) return;
      const dayDiff = Math.floor((startOfDay(started).getTime() - weekStart.getTime()) / DAY_IN_MS);
      if (dayDiff >= 0 && dayDiff < 7) {
        buckets[dayDiff].totalBytes += getSessionBytes(session);
        buckets[dayDiff].sessionCount += 1;
      }
    });
    return buckets;
  }

  const monthStart = startOfMonth(start);
  const monthEnd = endOfMonth(start);
  const daysInMonth = monthEnd.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    buckets.push({ label: `${String(d).padStart(2, '0')}`, totalBytes: 0, sessionCount: 0 });
  }
  sessions.forEach((session) => {
    const started = new Date(String(session.acctstarttime ?? session.acctstoptime ?? Date.now()));
    if (!inRange(started)) return;
    if (started.getMonth() === monthStart.getMonth() && started.getFullYear() === monthStart.getFullYear()) {
      const dayIndex = started.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < buckets.length) {
        buckets[dayIndex].totalBytes += getSessionBytes(session);
        buckets[dayIndex].sessionCount += 1;
      }
    }
  });
  return buckets;
}
