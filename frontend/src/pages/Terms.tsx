import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();
  const sections = [
    { title: t('terms.scopeTitle'), body: t('terms.scopeBody') },
    { title: t('terms.usageTitle'), body: t('terms.usageBody') },
    { title: t('terms.responsibilityTitle'), body: t('terms.responsibilityBody') },
  ];

  return (
    <article className="cp-card">
      <div className="cp-card__header">
        <div>
          <p className="cp-eyebrow">{t('terms.eyebrow')}</p>
          <h1 className="cp-title">{t('nav.terms')}</h1>
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
