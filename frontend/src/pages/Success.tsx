import type { FormEvent } from 'react';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useOmadaParams from '../hooks/useOmadaParams';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import { useUsageData } from '../modules/usage/useUsageData';
import {
  bytesToHuman,
  calculateProgress,
  combineSessions,
  getSessionBytes,
  getSessionDurationSeconds,
  secondsToDuration,
} from '../modules/usage/utils';
import SessionTable from '../modules/usage/components/SessionTable';
import { disconnectUsageSessions } from '../modules/usage/api';
import { useAuth } from '../modules/auth/AuthProvider';
import type { DashboardSession } from '../modules/usage/types';

export default function Success() {
  const { t } = useTranslation();
  const params = useOmadaParams();
  const { data: dynamicDetail } = useDynamicDetail();
  const { session } = useAuth();
  const [macInput, setMacInput] = useState(session?.profile?.mac || params.mac || '');
  const [macOverride, setMacOverride] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDisconnectId, setPendingDisconnectId] = useState<string | null>(null);

  useEffect(() => {
    setMacInput(session?.profile?.mac || '');
    setMacOverride(undefined);
  }, [session?.profile?.mac]);

  const activeMac = macOverride ?? session?.profile?.mac ?? undefined;

  const { usage, activeSessions, inactiveSessions, errors, isLoading, lastUpdated, refresh } = useUsageData({
    enabled: Boolean(session),
    mac: activeMac,
  });

  const sessions = useMemo(() => combineSessions(activeSessions?.sessions, inactiveSessions?.sessions), [activeSessions, inactiveSessions]);
  const aggregates = useMemo(() => computeAggregatesFromSessions(sessions), [sessions]);

  const onlineCount = activeSessions?.sessions.length ?? 0;
  const inactiveCount = inactiveSessions?.sessions.length ?? 0;
  const isOnline = onlineCount > 0;
  const dataProgress = calculateProgress(usage?.dataUsed, usage?.dataCap);
  const effectiveTimeUsed = usage?.timeUsed ?? aggregates?.monthTime ?? 0;
  const effectiveTimeCap = usage?.timeCap ?? null;
  const derivedRemaining =
    effectiveTimeCap != null ? Math.max(0, effectiveTimeCap - effectiveTimeUsed) : undefined;
  const timeRemainingSeconds = usage?.timeRemainingSeconds ?? derivedRemaining;
  const timeProgress = calculateProgress(effectiveTimeUsed, effectiveTimeCap ?? undefined);
  const remainingLabel = secondsToDuration(timeRemainingSeconds);
  const expirationLabel = usage?.expiresAt ? new Date(usage.expiresAt).toLocaleString() : null;
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : '—';
  const isOmadaBridge = params.fromOmada === '1' || params.mode === 'omada';

  const handleMacSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setBanner(null);
      setMacOverride(macInput.trim() || undefined);
      void refresh();
    },
    [macInput, refresh]
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
          <p>{t('success.timeUsed', { used: secondsToDuration(effectiveTimeUsed), cap: secondsToDuration(effectiveTimeCap) })}</p>
          <div className="cp-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={timeProgress ?? 0} role="progressbar">
            <div className="cp-progress__bar" style={{ width: `${timeProgress ?? 0}%` }} />
          </div>
          {timeRemainingSeconds != null && (
            <p className="cp-card__meta">{t('success.timeRemaining', { value: remainingLabel })}</p>
          )}
          {expirationLabel && (
            <p className="cp-card__meta">{t('success.timeExpiration', { value: expirationLabel })}</p>
          )}
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
              <strong>{bytesToHuman(aggregates?.dayBytes)}</strong>
            </li>
            <li className="cp-router-row">
              <span>{t('success.weeklyAggregate')}</span>
              <strong>{bytesToHuman(aggregates?.weekBytes)}</strong>
            </li>
            <li className="cp-router-row">
              <span>{t('success.monthlyAggregate')}</span>
              <strong>{bytesToHuman(aggregates?.monthBytes)}</strong>
            </li>
          </ul>
        </article>
      </section>
      {usage ? (
        <>
          <SessionTable
            title={t('success.sessionsTitle')}
            caption={t('success.sessionsCaption', { count: sessions.length })}
            sessions={sessions}
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
          <p>{isLoading ? t('success.loading') : t('success.noSessions')}</p>
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

type SessionAggregateTotals = {
  dayBytes: number;
  weekBytes: number;
  monthBytes: number;
  dayTime: number;
  weekTime: number;
  monthTime: number;
} | null;

function computeAggregatesFromSessions(sessions: DashboardSession[]): SessionAggregateTotals {
  if (!sessions.length) {
    return null;
  }
  const latest = sessions.reduce<Date | null>((acc, session) => {
    const started = getSessionDate(session);
    if (!started) {
      return acc;
    }
    if (!acc || started > acc) {
      return started;
    }
    return acc;
  }, null);
  if (!latest) {
    return null;
  }
  const dayStart = startOfDay(latest);
  const dayEnd = endOfDay(dayStart);
  const weekStart = addDays(dayStart, -6);
  const monthStart = startOfMonth(dayStart);
  const totals = {
    dayBytes: 0,
    weekBytes: 0,
    monthBytes: 0,
    dayTime: 0,
    weekTime: 0,
    monthTime: 0,
  };
  sessions.forEach((session) => {
    const started = getSessionDate(session);
    if (!started) {
      return;
    }
    const bytes = getSessionBytes(session);
    const duration = getSessionDurationSeconds(session);
    if (started >= monthStart && started <= dayEnd) {
      totals.monthBytes += bytes;
      totals.monthTime += duration;
    }
    if (started >= weekStart && started <= dayEnd) {
      totals.weekBytes += bytes;
      totals.weekTime += duration;
    }
    if (started >= dayStart && started <= dayEnd) {
      totals.dayBytes += bytes;
      totals.dayTime += duration;
    }
  });
  return totals;
}

function getSessionDate(session: DashboardSession): Date | null {
  const raw = session.acctstarttime ?? session.acctstoptime;
  if (!raw) {
    return null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
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
  clone.setDate(clone.getDate() + days);
  return clone;
}

function startOfMonth(date: Date) {
  const clone = startOfDay(date);
  clone.setDate(1);
  return clone;
}
