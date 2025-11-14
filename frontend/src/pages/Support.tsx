import { useTranslation } from 'react-i18next';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';

export default function Support() {
  const { t } = useTranslation();
  const { data, isLoading } = useDynamicDetail();
  const detail = data?.detail as Record<string, unknown> | undefined;

  return (
    <article className="cp-card">
      <div className="cp-card__header">
        <div>
          <p className="cp-eyebrow">{t('support.eyebrow')}</p>
          <h1 className="cp-title">{t('nav.support')}</h1>
        </div>
        <span className="cp-badge cp-badge--info">{t('support.response')}</span>
      </div>
      <p>{t('support.subtitle')}</p>
      {isLoading ? (
        <p>{t('loading')}</p>
      ) : (
        <dl className="cp-description-list">
          <div>
            <dt>{t('support.email')}</dt>
            <dd>{readText(detail?.email, t('support.fallback'))}</dd>
          </div>
          <div>
            <dt>{t('support.phone')}</dt>
            <dd>{readText(detail?.phone, t('support.fallback'))}</dd>
          </div>
          <div>
            <dt>{t('support.hours')}</dt>
            <dd>{t('support.hoursValue')}</dd>
          </div>
          <div>
            <dt>{t('support.address')}</dt>
            <dd>{readText(detail?.address, t('support.fallback'))}</dd>
          </div>
        </dl>
      )}
    </article>
  );
}

function readText(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return fallback;
}
