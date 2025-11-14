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
    <div className="dynamic-shell__branding" aria-label="branding">
      {showLogo && (
        <img
          src={String(detail!.icon_file_name)}
          alt={name || 'Brand logo'}
          className="dynamic-shell__logo"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
      {showName && (
        <span
          className="dynamic-shell__brand-name"
          role="heading"
          aria-level={2}
          style={{ color: settings?.name_colour || '#0c1b33' }}
        >
          {name || 'Captive Portal'}
        </span>
      )}
    </div>
  );
}
