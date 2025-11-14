import useDynamicDetail from '../hooks/useDynamicDetail';
import useOmadaParams from '../hooks/useOmadaParams';
import { useTranslation } from 'react-i18next';

type DynamicDetail = {
  detail?: {
    name?: string;
    city?: string;
  };
};

export default function Home() {
  const { data, isLoading, error } = useDynamicDetail<DynamicDetail>();
  const params = useOmadaParams();
  const { t } = useTranslation();

  if (isLoading) {
    return <p>{t('loading')}</p>;
  }

  if (error) {
    return <p role="alert">{t('error')}</p>;
  }

  return (
    <section>
      <h1>{data?.detail?.name || 'Captive Portal'}</h1>
      <p>{data?.detail?.city}</p>
      <dl>
        {Object.entries(params).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
