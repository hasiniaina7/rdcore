import { useTranslation } from 'react-i18next';
import type { DashboardSession } from '../types';
import {
  bytesToHuman,
  getMacAddress,
  getRouterLabel,
  getSessionBytes,
  getSessionDurationSeconds,
  secondsToDuration,
} from '../utils';

interface Props {
  title: string;
  caption?: string;
  sessions: DashboardSession[];
  isLoading?: boolean;
  onDisconnect?: (radacctId: string) => void;
  pendingDisconnectId?: string | null;
  emptyLabel: string;
}

export default function SessionTable({ title, caption, sessions, isLoading, onDisconnect, emptyLabel, pendingDisconnectId }: Props) {
  const { t } = useTranslation();
  return (
    <section className="cp-card cp-table-card">
      <div className="cp-card__header">
        <div>
          <p className="cp-eyebrow">{t('success.sessionsEyebrow')}</p>
          <h2 className="cp-title">{title}</h2>
        </div>
        {isLoading && <span className="cp-badge cp-badge--muted">{t('success.loading')}</span>}
      </div>
      {caption && <p>{caption}</p>}
      <div className="cp-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t('success.table.status')}</th>
              <th>{t('success.table.start')}</th>
              <th>{t('success.table.duration')}</th>
              <th>{t('success.table.data')}</th>
              <th>{t('success.table.router')}</th>
              <th>{t('success.table.device')}</th>
              <th>{t('success.table.ip')}</th>
              {onDisconnect && <th>{t('success.table.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={onDisconnect ? 8 : 7} className="cp-table-empty">
                  {isLoading ? t('success.loading') : emptyLabel}
                </td>
              </tr>
            )}
            {sessions.map((session) => {
              const id = String(session.radacctid ?? session.id ?? '');
              const statusLabel =
                session.status === 'active' ? t('success.statusOnline') : t('success.statusOffline');
              const rowKey = `${session.status}-${id || session.acctstarttime || session.framedipaddress || cryptoRandom()}`;
              return (
                <tr key={rowKey}>
                  <td>
                    <span className={`cp-dot cp-dot--${session.status === 'active' ? 'success' : 'muted'}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td>{formatDate(session.acctstarttime)}</td>
                  <td>{secondsToDuration(getSessionDurationSeconds(session))}</td>
                  <td>{bytesToHuman(getSessionBytes(session))}</td>
                  <td>{getRouterLabel(session)}</td>
                  <td>{getMacAddress(session) ?? '—'}</td>
                  <td>{session.framedipaddress ? String(session.framedipaddress) : '—'}</td>
                  {onDisconnect && (
                    <td>
                      {session.status === 'active' && id ? (
                        <button
                          type="button"
                          className="cp-btn cp-btn--outline"
                          onClick={() => onDisconnect(id)}
                          disabled={pendingDisconnectId === id}
                        >
                          {t('success.disconnect')}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const cryptoRandom = () => {
  const { crypto } = globalThis as { crypto?: Crypto };
  if (crypto && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const formatDate = (value: unknown) => {
  if (!value) {
    return '—';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
};
