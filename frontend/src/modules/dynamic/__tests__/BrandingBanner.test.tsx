import { render, screen } from '@testing-library/react';
import BrandingBanner from '../BrandingBanner';

describe('BrandingBanner', () => {
  it('renders name when enabled', () => {
    render(
      <BrandingBanner
        detail={{ name: 'Test Portal' }}
        settings={{ show_name: true, show_logo: false }}
      />
    );
    expect(screen.getByRole('heading', { name: /test portal/i })).toBeInTheDocument();
  });

  it('hides when both logo and name are disabled', () => {
    const { container } = render(
      <BrandingBanner detail={{ name: 'Test' }} settings={{ show_logo: false, show_name: false }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
