import { useEffect, useMemo, useState } from 'react';
import type { DynamicGalleryItem } from './types';
import { useTranslation } from 'react-i18next';

interface Props {
  gallery?: DynamicGalleryItem[];
  photos?: DynamicGalleryItem[];
  intervalMs?: number;
}

const DEFAULT_INTERVAL = 5000;

export default function GalleryCarousel({ gallery, photos, intervalMs = DEFAULT_INTERVAL }: Props) {
  const { t } = useTranslation();
  const images = useMemo(() => {
    const list = gallery?.length ? gallery : photos;
    return (list ?? []).filter((item) => typeof item.file_name === 'string');
  }, [gallery, photos]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!images.length) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, intervalMs]);

  if (!images.length) {
    return (
      <div className="dynamic-shell__gallery dynamic-shell__gallery-empty">
        <p>{t('dynamic.gallery.empty')}</p>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="dynamic-shell__gallery" aria-label={t('dynamic.gallery.title')}>
      <div className="dynamic-shell__gallery-frame">
        <img
          src={String(activeImage.file_name)}
          alt={activeImage.layout || t('dynamic.gallery.slide')}
          className="dynamic-shell__gallery-img"
          onClick={() => setLightboxIndex(activeIndex)}
        />
      </div>
      <div className="dynamic-shell__gallery-controls">
        <button type="button" onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}>
          {t('dynamic.gallery.prev')}
        </button>
        <span>
          {activeIndex + 1}/{images.length}
        </span>
        <button type="button" onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}>
          {t('dynamic.gallery.next')}
        </button>
      </div>
      <div className="dynamic-shell__gallery-thumbs">
        {images.map((img, index) => (
          <button
            key={`${img.file_name}-${index}`}
            className={`dynamic-shell__gallery-thumb${index === activeIndex ? ' dynamic-shell__gallery-thumb--active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={t('dynamic.gallery.thumbnail', { index: index + 1 })}
          >
            <img src={String(img.file_name)} alt="" />
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <div className="dynamic-shell__lightbox" role="dialog" aria-modal="true">
          <button className="dynamic-shell__lightbox-close" onClick={() => setLightboxIndex(null)}>
            {t('dynamic.gallery.close')}
          </button>
          <img src={String(images[lightboxIndex].file_name)} alt="" />
        </div>
      )}
    </div>
  );
}
