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
      <div style={emptyStyle}>
        <p>{t('dynamic.gallery.empty')}</p>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div style={carouselStyle} aria-label={t('dynamic.gallery.title')}>
      <div style={imageFrameStyle}>
        <img
          src={String(activeImage.file_name)}
          alt={activeImage.layout || t('dynamic.gallery.slide')}
          style={imageStyle}
          onClick={() => setLightboxIndex(activeIndex)}
        />
      </div>
      <div style={controlsStyle}>
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
      <div style={thumbnailsStyle}>
        {images.map((img, index) => (
          <button
            key={`${img.file_name}-${index}`}
            style={{ ...thumbnailButtonStyle, borderColor: index === activeIndex ? '#0057ff' : 'transparent' }}
            onClick={() => setActiveIndex(index)}
            aria-label={t('dynamic.gallery.thumbnail', { index: index + 1 })}
          >
            <img src={String(img.file_name)} alt="" style={thumbnailImgStyle} />
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <div style={lightboxStyle} role="dialog" aria-modal="true">
          <button style={lightboxCloseStyle} onClick={() => setLightboxIndex(null)}>
            {t('dynamic.gallery.close')}
          </button>
          <img src={String(images[lightboxIndex].file_name)} alt="" style={lightboxImgStyle} />
        </div>
      )}
    </div>
  );
}

const carouselStyle: React.CSSProperties = {
  padding: '1rem',
  borderBottom: '1px solid #eef0f5',
};

const imageFrameStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '320px',
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: '#000',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '320px',
  objectFit: 'cover',
  cursor: 'pointer',
};

const controlsStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const thumbnailsStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
};

const thumbnailButtonStyle: React.CSSProperties = {
  padding: 0,
  border: '2px solid transparent',
  borderRadius: '4px',
  background: 'none',
  cursor: 'pointer',
};

const thumbnailImgStyle: React.CSSProperties = {
  width: '80px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: '4px',
};

const emptyStyle: React.CSSProperties = {
  padding: '1rem',
  borderBottom: '1px solid #eef0f5',
  fontStyle: 'italic',
};

const lightboxStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const lightboxImgStyle: React.CSSProperties = {
  maxWidth: '90%',
  maxHeight: '90%',
};

const lightboxCloseStyle: React.CSSProperties = {
  position: 'absolute',
  top: '2rem',
  right: '2rem',
  padding: '0.5rem 1rem',
};
