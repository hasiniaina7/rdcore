import { render, screen } from '@testing-library/react';
import GalleryCarousel from '../GalleryCarousel';

describe('GalleryCarousel', () => {
  it('shows fallback when no images provided', () => {
    render(<GalleryCarousel />);
    expect(screen.getByText('dynamic.gallery.empty')).toBeInTheDocument();
  });

  it('renders images when provided', () => {
    render(
      <GalleryCarousel
        photos={[
          { file_name: '/img/one.jpg', layout: 'landscape' },
          { file_name: '/img/two.jpg', layout: 'portrait' },
        ]}
      />
    );
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });
});
