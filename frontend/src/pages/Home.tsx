import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useDynamicDetail from '../modules/dynamic/useDynamicDetail';
import DynamicKeyHelp from '../modules/dynamic/DynamicKeyHelp';
import DynamicShell from '../modules/dynamic/DynamicShell';
import useOmadaParams from '../hooks/useOmadaParams';

const IMPORTANT_PARAMS = ['clientMac', 'site', 'radioId', 'ssidName'];

export default function Home() {
  const { data, isLoading, error, supportHref, cacheStatus } = useDynamicDetail();
  const params = useOmadaParams();
  const { t } = useTranslation();

  const detail = (data?.detail ?? {}) as Record<string, unknown>;
  const detailName = typeof detail.name === 'string' ? detail.name : undefined;
  const detailCity = typeof detail.city === 'string' ? detail.city : undefined;
  const showShell = !error || error.type !== 'invalid-key';
  const paramEntries = useMemo(
    () => Object.entries(params).filter(([, value]) => Boolean(value)),
    [params]
  );
  const missingOmadaFields = IMPORTANT_PARAMS.filter((field) => !params[field as keyof typeof params]);

  return (
    <div className="cp-stack">
      <DynamicKeyHelp error={error} supportHref={supportHref} />
      {isLoading && (
        <article className="cp-card" aria-live="polite">
          <p className="cp-eyebrow">{t('loading')}</p>
          <p>{t('dynamic.loaderHint')}</p>
        </article>
      )}

      {error && error.type === 'request' && (
        <div role="alert" className="cp-alert cp-alert--danger">
          {t('dynamic.requestError')}
        </div>
      )}

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
            cacheStatus={cacheStatus}
            missingOmada={missingOmadaFields}
          />
          {paramEntries.length > 0 && (
            <article className="cp-card" aria-label={t('dynamic.omadaContext')}>
              <div className="cp-card__header">
                <div>
                  <p className="cp-eyebrow">{t('dynamic.omadaEyebrow')}</p>
                  <h2 className="cp-title">{t('dynamic.omadaContext')}</h2>
                </div>
                <span className={`cp-badge ${missingOmadaFields.length ? 'cp-badge--warning' : 'cp-badge--success'}`}>
                  {missingOmadaFields.length ? t('dynamic.status.omadaMissing') : t('dynamic.status.omadaReady')}
                </span>
              </div>
              <dl className="cp-description-list">
                {paramEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )}
        </>
      ) : (
        !isLoading && (
          <section className="cp-card" aria-live="polite">
            <p className="cp-eyebrow">{t('dynamic.detail.defaultName')}</p>
            <h1 className="cp-title">{detailName || 'Captive Portal'}</h1>
            {detailCity && <p>{detailCity}</p>}
          </section>
        )
      )}
    </div>
  );
}
