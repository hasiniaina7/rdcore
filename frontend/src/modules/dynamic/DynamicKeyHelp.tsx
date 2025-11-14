import type { DynamicLoaderError } from './useDynamicDetail';
import { useTranslation } from 'react-i18next';

interface Props {
  error?: DynamicLoaderError;
  supportHref: string;
}

export default function DynamicKeyHelp({ error, supportHref }: Props) {
  const { t } = useTranslation();

  if (!error || error.type !== 'invalid-key') {
    return null;
  }

  return (
    <div role="dialog" aria-live="assertive" className="cp-modal">
      <div className="cp-card cp-modal__card">
        <p className="cp-eyebrow">{t('dynamic.modal.title')}</p>
        <h2 className="cp-title">{t('dynamic.modal.subtitle')}</h2>
        {error.availableKeys.length > 0 ? (
          <dl className="cp-key-list">
            {error.availableKeys.map((pair) => (
              <div key={`${pair.label}-${pair.value}`} className="cp-key-row">
                <dt>{pair.label}</dt>
                <dd>{pair.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{t('dynamic.modal.emptyList')}</p>
        )}
        <a href={supportHref} className="cp-btn cp-btn--primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          {t('dynamic.modal.supportCta')}
        </a>
      </div>
    </div>
  );
}
