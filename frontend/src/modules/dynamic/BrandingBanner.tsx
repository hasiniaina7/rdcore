import type { DynamicSettings } from './types';

interface Props {
  detail?: Record<string, unknown>;
  settings?: DynamicSettings;
}

export default function BrandingBanner({ detail, settings }: Props) {
  const showLogo = settings?.show_logo && typeof detail?.icon_file_name === 'string';
  const showName = settings?.show_name !== false;
  const name = typeof detail?.name === 'string' ? detail?.name : '';

  if (!showLogo && !showName) {
    return null;
  }

  return (
    <div style={wrapperStyle} aria-label="branding">
      {showLogo && (
        <img
          src={String(detail!.icon_file_name)}
          alt={name || 'Brand logo'}
          style={logoStyle}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
      {showName && (
        <span style={{ ...nameStyle, color: settings?.name_colour || '#0c1b33' }} role="heading" aria-level={2}>
          {name || 'Captive Portal'}
        </span>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  borderBottom: '1px solid #eef0f5',
};

const logoStyle: React.CSSProperties = {
  maxHeight: '56px',
  objectFit: 'contain',
};

const nameStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
};
