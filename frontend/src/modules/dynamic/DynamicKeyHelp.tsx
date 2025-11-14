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
    <div role="dialog" aria-live="assertive" style={containerStyle}>
      <div style={cardStyle}>
        <h2>{t('dynamic.modal.title')}</h2>
        <p>{t('dynamic.modal.subtitle')}</p>
        {error.availableKeys.length > 0 ? (
          <dl style={listStyle}>
            {error.availableKeys.map((pair) => (
              <div key={`${pair.label}-${pair.value}`} style={rowStyle}>
                <dt>{pair.label}</dt>
                <dd>{pair.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{t('dynamic.modal.emptyList')}</p>
        )}
        <a href={supportHref} style={ctaStyle}>
          {t('dynamic.modal.supportCta')}
        </a>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.6)',
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '2rem',
  maxWidth: '480px',
  width: '90%',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};

const listStyle: React.CSSProperties = {
  margin: '1rem 0',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
};

const ctaStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#0057ff',
  color: '#fff',
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  textDecoration: 'none',
};
