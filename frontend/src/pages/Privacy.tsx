import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation();
  const sections = [
    { title: t('privacy.collectionTitle'), body: t('privacy.collectionBody') },
    { title: t('privacy.usageTitle'), body: t('privacy.usageBody') },
    { title: t('privacy.rightsTitle'), body: t('privacy.rightsBody') },
  ];

  return (
    <article className="cp-card">
      <div className="cp-card__header">
        <div>
          <p className="cp-eyebrow">{t('privacy.eyebrow')}</p>
          <h1 className="cp-title">{t('nav.privacy')}</h1>
        </div>
      </div>
      {sections.map((section) => (
        <section key={section.title} style={{ marginBottom: '1rem' }}>
          <h2 className="cp-title" style={{ fontSize: '1rem' }}>
            {section.title}
          </h2>
          <p>{section.body}</p>
        </section>
      ))}
    </article>
  );
}
