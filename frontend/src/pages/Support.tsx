import { useTranslation } from 'react-i18next';

export default function Support() {
  const { t } = useTranslation();

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
      <dl className="cp-description-list">
        <div>
          <dt>{t('support.address')}</dt>
          <dd>Anjoma CENTER BOX 12</dd>
        </div>
        <div>
          <dt>Informaticien</dt>
          <dd>038 66 707 66</dd>
        </div>
        <div>
          <dt>Techniciens</dt>
          <dd>038 63 707 66</dd>
        </div>
        <div>
          <dt>Commercial 1</dt>
          <dd>038 64 707 66</dd>
        </div>
        <div>
          <dt>Commercial 2</dt>
          <dd>034 73 777 66</dd>
        </div>
        <div>
          <dt>Mobile Money</dt>
          <dd>034 73 777 66 – 033 78 609 66 – 032 79 203 48</dd>
        </div>
        <div>
          <dt>{t('support.hours')}</dt>
          <dd>08h00–12h00 · 14h00–17h30</dd>
        </div>
        <div>
          <dt>{t('support.email')}</dt>
          <dd>contact@techzone.lat</dd>
        </div>
      </dl>
    </article>
  );
}
