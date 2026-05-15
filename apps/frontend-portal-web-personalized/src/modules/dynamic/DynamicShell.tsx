import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import BrandingBanner from './BrandingBanner';
import GalleryCarousel from './GalleryCarousel';
import ConnectPanel from './ConnectPanel';
import SocialLoginPanel from './SocialLoginPanel';
import type { DynamicClientInfo, DynamicGalleryItem, DynamicPage, DynamicSettings } from './types';
import type { CacheStatus } from './useDynamicDetail';
import './dynamic-shell.css';

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
  cacheStatus?: CacheStatus;
  missingOmada?: string[];
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
  cacheStatus,
  missingOmada = [],
}: Props) {
  const { t, i18n } = useTranslation();
  const hasOmadaContext = Boolean(omadaParams.clientMac && omadaParams.radioId && omadaParams.ssidName);
  const [panel, setPanel] = useState<Panel>(() => (hasOmadaContext ? 'connect' : 'details'));
  const [isSideMenuOpen, setSideMenuOpen] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [connectVisible, setConnectVisible] = useState(false);

  // En mode Omada External Portal (contexte complet), on affiche le panneau de connexion immédiatement.
  const delaySeconds = hasOmadaContext ? 0 : clampDelay(settings?.show_screen_delay);

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
    { label: t('dynamic.settings.screenDelay'), value: `${delaySeconds}s` },
    { label: t('dynamic.settings.templateStyle'), value: formatValue(settings?.template_style) },
    {
      label: t('dynamic.settings.allowSocial'),
      value: localizedBoolean(settings?.social_login?.active, t),
    },
  ];

  const activePage = pages?.[activePageIndex];
  const statusBadges = useMemo(
    () => [
      {
        id: 'cache',
        label: cacheStatus ? t('dynamic.status.cache', { status: cacheStatus }) : t('dynamic.status.cacheNone'),
        tone: cacheStatus === 'HIT' ? 'success' : 'muted',
      },
      {
        id: 'key',
        label: dynamicKey ? t('dynamic.status.key', { key: dynamicKey }) : t('dynamic.status.keyMissing'),
        tone: dynamicKey ? 'info' : 'warning',
      },
      {
        id: 'omada',
        label: missingOmada.length
          ? t('dynamic.status.omadaMissingDetail', { fields: missingOmada.join(', ') })
          : t('dynamic.status.omadaReady'),
        tone: missingOmada.length ? 'warning' : 'success',
      },
    ],
    [cacheStatus, dynamicKey, missingOmada, t]
  );

  return (
    <article className="cp-card dynamic-shell">
      <div className="dynamic-shell__hero">
        <BrandingBanner detail={detail} settings={settings} />
        <GalleryCarousel gallery={gallery} photos={photos} />
        <div className="dynamic-shell__banners" role="status">
          {statusBadges.map((badge) => (
            <span key={badge.id} className={`cp-badge cp-badge--${badge.tone}`}>
              {badge.label}
            </span>
          ))}
        </div>
      </div>
      <header className="dynamic-shell__toolbar">
        <div className="dynamic-shell__tabs" role="tablist" aria-label={t('dynamic.toolbar.title')}>
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
        </div>
        <div className="dynamic-shell__controls">
          {languages.length > 0 && (
            <>
              <span id="dynamic-shell-language" className="sr-only">
                {t('dynamic.toolbar.language')}
              </span>
              <select
                aria-labelledby="dynamic-shell-language"
                className="dynamic-shell__language"
                value={i18n.language}
                onChange={(event) => i18n.changeLanguage(event.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.value}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="button"
            onClick={() => setSideMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isSideMenuOpen}
            className="dynamic-shell__menu-btn"
          >
            {t('dynamic.toolbar.menu')}
          </button>
        </div>
      </header>

      <section className="dynamic-shell__panel" aria-live="polite">
        {panel === 'details' && (
          <div>
            <h2>{formatValue(detail?.name) || t('dynamic.detail.defaultName')}</h2>
            {detailHtml && <div {...sanitize(detailHtml)} />}
            {detailBlocks.length > 0 && (
              <dl className="dynamic-shell__dl">
                {detailBlocks.map((entry) => (
                  <div key={entry.label}>
                    <dt>{entry.label}</dt>
                    <dd>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {clientInfo && (
              <details>
                <summary>{t('dynamic.detail.clientInfo')}</summary>
                <pre className="dynamic-shell__client-info">{JSON.stringify(clientInfo, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        {panel === 'settings' && (
          <div>
            <h2>{t('dynamic.settings.title')}</h2>
            <dl className="dynamic-shell__dl">
              {settingsList.map((entry) => (
                <div key={entry.label}>
                  <dt>{entry.label}</dt>
                  <dd>{entry.value ?? t('dynamic.settings.notSet')}</dd>
                </div>
              ))}
              {languages.length > 0 && (
                <div>
                  <dt>{t('dynamic.settings.languages')}</dt>
                  <dd>{languages.map((lang) => lang.value).join(', ')}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {panel === 'pages' && (
          <div className="dynamic-shell__pages">
            <h2>{t('dynamic.pages.title')}</h2>
            {hasPages ? (
              <>
                <div className="dynamic-shell__page-tabs" role="tablist">
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
                  <article role="tabpanel" className="dynamic-shell__page">
                    <h3>{activePage.title || t('dynamic.pages.untitled')}</h3>
                    {activePage.content ? <div {...sanitize(activePage.content)} /> : <p>{t('dynamic.pages.emptyContent')}</p>}
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
    </article>
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
    <button type="button" onClick={onClick} aria-pressed={active} disabled={disabled} className="dynamic-shell__tab">
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
    <aside role="dialog" aria-modal="true" className="dynamic-shell__side-menu">
      <div className="dynamic-shell__side-inner">
        <header className="dynamic-shell__side-header">
          <h3>{t('dynamic.menu.title')}</h3>
          <button type="button" onClick={onClose} className="dynamic-shell__menu-btn">
            {t('dynamic.menu.close')}
          </button>
        </header>
        <section className="dynamic-shell__side-section">
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
          <section className="dynamic-shell__side-section">
            <h4>{t('dynamic.menu.languages')}</h4>
            <ul>
              {languages.map((lang) => (
                <li key={lang.id}>
                  <button type="button" className="dynamic-shell__language-button" onClick={() => onSelectLanguage(lang.id)}>
                    <span className={`rdFlag rdFlag-${lang.id}`} aria-hidden="true" /> {lang.value}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}

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
