import { useEffect, useMemo, useState } from 'react';
import type { DynamicClientInfo, DynamicGalleryItem, DynamicPage, DynamicSettings } from './types';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import BrandingBanner from './BrandingBanner';
import GalleryCarousel from './GalleryCarousel';
import type { TFunction } from 'i18next';
import ConnectPanel from './ConnectPanel';
import SocialLoginPanel from './SocialLoginPanel';

const PANELS = ['details', 'settings', 'pages', 'connect', 'social'] as const;
type Panel = (typeof PANELS)[number];

interface Props {
  detail?: Record<string, unknown>;
  settings?: DynamicSettings;
  pages?: DynamicPage[];
  clientInfo?: DynamicClientInfo;
  photos?: DynamicGalleryItem[];
  gallery?: DynamicGalleryItem[];
  omadaParams: Record<string, string | undefined>;
  dynamicKey?: string;
}

const clampDelay = (screenDelay?: number) => {
  const fallback = 10;
  if (typeof screenDelay !== 'number' || Number.isNaN(screenDelay)) {
    return fallback;
  }
  return Math.max(0, Math.min(30, screenDelay));
};

const sanitize = (html?: string) => ({
  dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(html ?? '') },
});

export default function DynamicShell({
  detail,
  settings,
  pages,
  clientInfo,
  photos,
  gallery,
  omadaParams,
  dynamicKey,
}: Props) {
  const { t, i18n } = useTranslation();
  const [panel, setPanel] = useState<Panel>('details');
  const [isSideMenuOpen, setSideMenuOpen] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [connectVisible, setConnectVisible] = useState(false);

  const delaySeconds = clampDelay(settings?.show_screen_delay);

  useEffect(() => {
    if (delaySeconds === 0) {
      setConnectVisible(true);
      return;
    }
    setConnectVisible(false);
    const timer = window.setTimeout(() => setConnectVisible(true), delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [delaySeconds]);

  const languages = useMemo(() => settings?.available_languages ?? [], [settings]);
  const hasPages = Boolean(pages?.length);

  const detailHtml = typeof detail?.html_content === 'string' ? detail.html_content : undefined;
  const detailBlocks: Array<{ label: string; value?: string }> = [
    { label: t('dynamic.detail.city'), value: formatValue(detail?.city) },
    { label: t('dynamic.detail.address'), value: formatValue(detail?.address) },
    { label: t('dynamic.detail.contact'), value: formatValue(detail?.contact_person) },
    { label: t('dynamic.detail.phone'), value: formatValue(detail?.phone) },
    { label: t('dynamic.detail.email'), value: formatValue(detail?.email) },
    { label: t('dynamic.detail.website'), value: formatValue(detail?.website) },
  ].filter((entry) => entry.value);

  const settingsList = [
    { label: t('dynamic.settings.showLogo'), value: localizedBoolean(settings?.show_logo, t) },
    { label: t('dynamic.settings.showName'), value: localizedBoolean(settings?.show_name, t) },
    { label: t('dynamic.settings.nameColour'), value: formatValue(settings?.name_colour) },
    {
      label: t('dynamic.settings.screenDelay'),
      value: `${delaySeconds}s`,
    },
    { label: t('dynamic.settings.templateStyle'), value: formatValue(settings?.template_style) },
    {
      label: t('dynamic.settings.allowSocial'),
      value: localizedBoolean(settings?.social_login?.active, t),
    },
  ];

  const activePage = pages?.[activePageIndex];

  return (
    <div style={shellStyle}>
      <BrandingBanner detail={detail} settings={settings} />
      <GalleryCarousel gallery={gallery} photos={photos} />
      <header style={toolbarStyle}>
        <nav aria-label={t('dynamic.toolbar.title')} style={toolbarButtonsStyle}>
          <ToolbarButton label={t('dynamic.toolbar.details')} active={panel === 'details'} onClick={() => setPanel('details')} />
          <ToolbarButton label={t('dynamic.toolbar.settings')} active={panel === 'settings'} onClick={() => setPanel('settings')} />
          <ToolbarButton
            label={t('dynamic.toolbar.pages')}
            disabled={!hasPages}
            active={panel === 'pages'}
            onClick={() => setPanel('pages')}
          />
          <ToolbarButton label={t('dynamic.toolbar.connect')} active={panel === 'connect'} onClick={() => setPanel('connect')} />
          <ToolbarButton label={t('dynamic.toolbar.social')} active={panel === 'social'} onClick={() => setPanel('social')} />
        </nav>
        <div style={toolbarExtrasStyle}>
          {languages.length > 0 && (
            <label style={languageSelectorStyle}>
              <span className="sr-only">{t('dynamic.toolbar.language')}</span>
              <select
                value={i18n.language}
                onChange={(event) => i18n.changeLanguage(event.target.value)}
                aria-label={t('dynamic.toolbar.language')}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.value}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" onClick={() => setSideMenuOpen(true)} aria-haspopup="dialog" aria-expanded={isSideMenuOpen}>
            {t('dynamic.toolbar.menu')}
          </button>
        </div>
      </header>

      <section style={panelStyle} aria-live="polite">
        {panel === 'details' && (
          <div>
            <h2>{formatValue(detail?.name) || t('dynamic.detail.defaultName')}</h2>
            {detailHtml && <div {...sanitize(detailHtml)} />}
            {detailBlocks.length > 0 && (
              <dl style={dlStyle}>
                {detailBlocks.map((entry) => (
                  <div key={entry.label} style={dlRowStyle}>
                    <dt>{entry.label}</dt>
                    <dd>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {clientInfo && (
              <details>
                <summary>{t('dynamic.detail.clientInfo')}</summary>
                <pre style={clientInfoStyle}>{JSON.stringify(clientInfo, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        {panel === 'settings' && (
          <div>
            <h2>{t('dynamic.settings.title')}</h2>
            <dl style={dlStyle}>
              {settingsList.map((entry) => (
                <div key={entry.label} style={dlRowStyle}>
                  <dt>{entry.label}</dt>
                  <dd>{entry.value ?? t('dynamic.settings.notSet')}</dd>
                </div>
              ))}
              {languages.length > 0 && (
                <div style={dlRowStyle}>
                  <dt>{t('dynamic.settings.languages')}</dt>
                  <dd>{languages.map((lang) => lang.value).join(', ')}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {panel === 'pages' && (
          <div>
            <h2>{t('dynamic.pages.title')}</h2>
            {hasPages ? (
              <>
                <div style={tabsStyle} role="tablist">
                  {pages!.map((page, index) => (
                    <button
                      key={`${page.title ?? 'page'}-${index}`}
                      role="tab"
                      aria-selected={activePageIndex === index}
                      onClick={() => setActivePageIndex(index)}
                    >
                      {page.title || t('dynamic.pages.untitled')}
                    </button>
                  ))}
                </div>
                {activePage && (
                  <article role="tabpanel" style={pageContentStyle}>
                    <h3>{activePage.title || t('dynamic.pages.untitled')}</h3>
                    {activePage.content ? (
                      <div {...sanitize(activePage.content)} />
                    ) : (
                      <p>{t('dynamic.pages.emptyContent')}</p>
                    )}
                  </article>
                )}
              </>
            ) : (
              <p>{t('dynamic.pages.empty')}</p>
            )}
          </div>
        )}

        {panel === 'connect' && (
          <div>
            <h2>{t('dynamic.connect.title')}</h2>
            <ConnectPanel
              settings={settings}
              connectVisible={connectVisible}
              dynamicKey={dynamicKey}
              omadaParams={omadaParams}
            />
          </div>
        )}

        {panel === 'social' && (
          <div>
            <h2>{t('dynamic.social.title')}</h2>
            <p>{t('dynamic.social.description')}</p>
            <SocialLoginPanel settings={settings} omadaParams={omadaParams} />
          </div>
        )}
      </section>

      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        languages={languages}
        onSelectLanguage={(lang) => i18n.changeLanguage(lang)}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ label, active, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} disabled={disabled}>
      {label}
    </button>
  );
}

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  languages: DynamicSettings['available_languages'];
  onSelectLanguage: (lang: string) => void;
}

function SideMenu({ isOpen, onClose, languages, onSelectLanguage }: SideMenuProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <aside role="dialog" aria-modal="true" style={sideMenuStyle}>
      <header style={sideMenuHeaderStyle}>
        <h3>{t('dynamic.menu.title')}</h3>
        <button type="button" onClick={onClose}>
          {t('dynamic.menu.close')}
        </button>
      </header>
      <section>
        <h4>{t('dynamic.menu.help')}</h4>
        <ul>
          <li>
            <a href="/support">{t('dynamic.menu.supportLink')}</a>
          </li>
          <li>
            <a href="/terms">{t('dynamic.menu.termsLink')}</a>
          </li>
        </ul>
      </section>
      {languages && languages.length > 0 && (
        <section>
          <h4>{t('dynamic.menu.languages')}</h4>
          <ul>
            {languages.map((lang) => (
              <li key={lang.id}>
                <button type="button" onClick={() => onSelectLanguage(lang.id)}>
                  <span className={`rdFlag rdFlag-${lang.id}`} aria-hidden="true" /> {lang.value}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

const shellStyle: React.CSSProperties = {
  border: '1px solid #e1e4eb',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#fff',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  borderBottom: '1px solid #eef0f5',
};

const toolbarButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const toolbarExtrasStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
};

const languageSelectorStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
};

const panelStyle: React.CSSProperties = {
  padding: '1rem',
};

const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  rowGap: '0.5rem',
};

const dlRowStyle: React.CSSProperties = {
  display: 'contents',
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const pageContentStyle: React.CSSProperties = {
  border: '1px solid #dfe3eb',
  borderRadius: '6px',
  padding: '1rem',
  minHeight: '150px',
};

const sideMenuStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '320px',
  height: '100%',
  backgroundColor: '#fff',
  boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
  padding: '1rem',
  zIndex: 1000,
  overflowY: 'auto',
};

const sideMenuHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const clientInfoStyle: React.CSSProperties = {
  maxHeight: '200px',
  overflow: 'auto',
  backgroundColor: '#f6f8fb',
  padding: '0.75rem',
  borderRadius: '4px',
};

function formatValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return undefined;
}

function localizedBoolean(value: unknown, t: TFunction): string {
  if (value === true) return t('dynamic.boolean.yes');
  if (value === false) return t('dynamic.boolean.no');
  return '-';
}
