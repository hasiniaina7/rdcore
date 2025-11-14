import { useTranslation } from 'react-i18next';

export default function Success() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t('nav.success')}</h1>
      <p>Usage insights will appear here once the backend usage endpoint is wired.</p>
    </section>
  );
}
