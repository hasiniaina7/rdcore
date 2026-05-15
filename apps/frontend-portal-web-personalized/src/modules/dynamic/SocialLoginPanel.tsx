import { useState } from 'react';
import client from '../../api/client';
import type { DynamicSettings } from './types';
import { useTranslation } from 'react-i18next';
import { buildOmadaPayload } from './connectUtils';
import { saveCredentials } from './credentialStorage';
import './dynamic-shell.css';

interface Props {
  settings?: DynamicSettings;
  omadaParams: Record<string, string | undefined>;
}

export default function SocialLoginPanel({ settings, omadaParams }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  });

  const providers = settings?.social_login?.items ?? [];
  const omadaPayload = buildOmadaPayload(omadaParams);

  if (!settings?.social_login?.active) {
    return <p>{t('dynamic.social.placeholder')}</p>;
  }

  if (!providers.length) {
    return <p>{t('dynamic.social.noProviders')}</p>;
  }

  async function startSocial(provider: string) {
    if (!settings?.social_login?.temp_username || !omadaPayload) {
      setStatus({ type: 'error', message: t('dynamic.social.noTempUser') });
      return;
    }
    const tempUsername = settings.social_login.temp_username;
    const tempPassword = settings.social_login.temp_password;
    setStatus({ type: 'loading', message: t('dynamic.connect.loading') });
    try {
      await client.get(`/social/${provider}/start`, { params: { state: crypto.randomUUID() } });
      const response = await client.post('/connect/social', {
        username: tempUsername,
        password: tempPassword,
        dynamicKey: omadaParams.key,
        mac: omadaParams.clientMac,
        omada: omadaPayload,
      });
      const redirect = response.data?.data?.nextRedirect;
      saveCredentials({
        username: tempUsername,
        password: tempPassword,
        mac: omadaParams.clientMac,
        mode: 'social',
      });
      setStatus({ type: 'success', message: t('dynamic.connect.success') });
      if (redirect) {
        window.location.assign(redirect);
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('dynamic.social.error');
      setStatus({ type: 'error', message });
    }
  }

  const badgeClass =
    status.type === 'error' ? 'cp-alert cp-alert--danger' : status.type === 'success' ? 'cp-alert cp-alert--success' : 'cp-alert cp-alert--warning';

  return (
    <div>
      <div className="social-panel__list">
        {providers.map((item) => (
          <button key={item.name} className="social-panel__button" onClick={() => startSocial(item.name)}>
            {item.display_name || item.name}
          </button>
        ))}
      </div>
      {status.type !== 'idle' && (
        <p role="status" className={`${badgeClass} connect-panel__message`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
