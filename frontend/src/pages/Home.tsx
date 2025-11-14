import { useTranslation } from 'react-i18next';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import DynamicKeyHelp from '../modules/dynamic/DynamicKeyHelp';
import DynamicShell from '../modules/dynamic/DynamicShell';
import useOmadaParams from '../hooks/useOmadaParams';

export default function Home() {
  const { data, isLoading, error, supportHref } = useDynamicDetail();
  const params = useOmadaParams();
  const { t } = useTranslation();

  if (isLoading) {
    return <p>{t('loading')}</p>;
  }

  if (error && error.type === 'request') {
    return (
      <section role="alert">
        <p>{t('dynamic.requestError')}</p>
      </section>
    );
  }

  const detail = (data?.detail ?? {}) as Record<string, unknown>;
  const detailName = typeof detail.name === 'string' ? detail.name : undefined;
  const detailCity = typeof detail.city === 'string' ? detail.city : undefined;
  const showShell = !error || error.type !== 'invalid-key';

  return (
    <>
      <DynamicKeyHelp error={error} supportHref={supportHref} />
      {showShell && data ? (
        <>
          <DynamicShell
            detail={data.detail ?? undefined}
            settings={data.settings}
            pages={data.pages}
            clientInfo={data.client_info}
            photos={data.photos}
            gallery={data.gallery}
            omadaParams={params}
            dynamicKey={params.key}
          />
          <section aria-label="Omada context">
            <h3>{t('dynamic.detail.clientInfo')}</h3>
            <dl>
              {Object.entries(params).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : (
        <section aria-live="polite">
          <h1>{detailName || 'Captive Portal'}</h1>
          {detailCity && <p>{detailCity}</p>}
        </section>
      )}
    </>
  );
}
