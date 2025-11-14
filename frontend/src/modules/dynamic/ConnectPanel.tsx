import { useMemo, useState } from 'react';
import client from '../../api/client';
import type { DynamicSettings } from './types';
import { useTranslation } from 'react-i18next';
import { buildOmadaPayload, formatUsername } from './connectUtils';
import { saveCredentials } from './credentialStorage';

type ConnectMode = 'click' | 'permanent' | 'voucher';

interface ConnectPanelProps {
  settings?: DynamicSettings;
  dynamicKey?: string;
  omadaParams: Record<string, string | undefined>;
  connectVisible: boolean;
}

interface ConnectResult {
  status: 'accepted' | 'pending' | 'rejected';
  message: string;
  nextRedirect?: string;
  mac?: string;
}

const initialStatus = { type: 'idle' as const, message: '' };

export default function ConnectPanel({ settings, dynamicKey, omadaParams, connectVisible }: ConnectPanelProps) {
  const { t } = useTranslation();
  const [userForm, setUserForm] = useState({ username: '', password: '' });
  const [voucherCode, setVoucherCode] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>(initialStatus);

  const autoSuffix = settings?.auto_suffix_check && settings?.auto_suffix ? `@${settings.auto_suffix}` : '';
  const omadaPayload = useMemo(() => buildOmadaPayload(omadaParams), [omadaParams]);
  const isOmadaReady = Boolean(omadaPayload);

  const showUserForm = settings?.connect_only ? false : settings?.user_login_check !== false;
  const showVoucherForm = settings?.connect_only ? false : settings?.voucher_login_check !== false;
  const showClickBlock = settings?.click_to_connect?.connect_check ?? false;

  async function handleConnect(
    mode: ConnectMode,
    overrides?: Partial<{ username: string; password: string; voucherCode: string }>
  ) {
    if (!connectVisible) {
      setStatus({ type: 'error', message: t('dynamic.connect.waitMessage') });
      return;
    }
    if (!isOmadaReady) {
      setStatus({ type: 'error', message: t('dynamic.connect.missingOmada') });
      return;
    }
    if (!dynamicKey && mode === 'click') {
      setStatus({ type: 'error', message: t('dynamic.connect.missingKey') });
      return;
    }

    const payloadUsername =
      overrides?.username ??
      (mode === 'permanent' ? formatUsername(userForm.username, autoSuffix) : overrides?.voucherCode ?? voucherCode);
    const payloadPassword = overrides?.password ?? (mode === 'permanent' ? userForm.password : undefined);

    setStatus({ type: 'loading', message: t('dynamic.connect.loading') });
    try {
      const response = await client.post<{ success: boolean; data: ConnectResult }>(`/connect/${mode}`, {
        username: payloadUsername,
        password: payloadPassword,
        voucherCode: overrides?.voucherCode ?? voucherCode,
        dynamicKey,
        mac: omadaParams.clientMac,
        omada: omadaPayload,
      });
      const result = response.data.data;
      persistCredentials({
        username: payloadUsername,
        password: payloadPassword,
        mac: omadaParams.clientMac || result.mac,
        mode,
      });
      const redirectUrl = applyRedirectParams(result.nextRedirect || window.location.href, {
        username: payloadUsername,
        mac: omadaParams.clientMac || result.mac,
      });
      setStatus({ type: 'success', message: result.message || t('dynamic.connect.success') });
      window.location.assign(redirectUrl);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('dynamic.connect.error');
      setStatus({ type: 'error', message });
    }
  }

  return (
    <div>
      {!connectVisible && <p>{t('dynamic.connect.countdown', { seconds: settings?.show_screen_delay ?? 0 })}</p>}
      <div style={sectionStyle}>
        {showClickBlock && (
          <div style={cardStyle}>
            <h3>{t('dynamic.connect.clickTitle')}</h3>
            <p>{t('dynamic.connect.clickBody')}</p>
            <button
              type="button"
              onClick={() => handleConnect('click')}
              disabled={!connectVisible || !dynamicKey || !isOmadaReady}
            >
              {settings?.click_to_connect?.button_title || t('dynamic.connect.clickCta')}
            </button>
          </div>
        )}

        {showUserForm && (
          <form
            style={cardStyle}
            onSubmit={(event) => {
              event.preventDefault();
              handleConnect('permanent');
            }}
          >
            <h3>{t('dynamic.connect.userTitle')}</h3>
            <label style={labelStyle}>
              {t('dynamic.connect.username')}
              <input
                type="text"
                value={userForm.username}
                onChange={(event) => setUserForm((prev) => ({ ...prev, username: event.target.value }))}
                required
                disabled={!connectVisible}
              />
              {autoSuffix && <span style={suffixStyle}>{autoSuffix}</span>}
            </label>
            <label style={labelStyle}>
              {t('dynamic.connect.password')}
              <input
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                disabled={!connectVisible}
              />
            </label>
            <button type="submit" disabled={!connectVisible || !isOmadaReady}>
              {t('dynamic.connect.submit')}
            </button>
          </form>
        )}

        {showVoucherForm && (
          <form
            style={cardStyle}
            onSubmit={(event) => {
              event.preventDefault();
              handleConnect('voucher', { voucherCode });
            }}
          >
            <h3>{t('dynamic.connect.voucherTitle')}</h3>
            <label style={labelStyle}>
              {t('dynamic.connect.voucherCode')}
              <input
                type="text"
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value)}
                required
                disabled={!connectVisible}
              />
            </label>
            <button type="submit" disabled={!connectVisible || !isOmadaReady}>
              {t('dynamic.connect.submit')}
            </button>
          </form>
        )}
      </div>
      {status.type !== 'idle' && (
        <p role="status" style={{ color: status.type === 'error' ? '#e11d48' : '#059669' }}>
          {status.message}
        </p>
      )}
    </div>
  );
}

function persistCredentials({
  username,
  password,
  mac,
  mode,
}: {
  username?: string;
  password?: string;
  mac?: string;
  mode: ConnectMode;
}) {
  if (!username || !password) return;
  saveCredentials({ username, password, mac, mode });
}

function applyRedirectParams(nextRedirect: string, params: { username?: string; mac?: string | undefined }) {
  try {
    const url = new URL(nextRedirect);
    if (params.username) {
      url.searchParams.set('username', params.username);
    }
    if (params.mac) {
      url.searchParams.set('mac', params.mac);
    }
    return url.toString();
  } catch {
    return nextRedirect;
  }
}

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const suffixStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#6b7280',
};
