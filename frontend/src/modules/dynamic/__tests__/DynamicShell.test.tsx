import { fireEvent, render, screen } from '@testing-library/react';
import DynamicShell from '../DynamicShell';

describe('DynamicShell', () => {
  const baseProps = {
    detail: { name: 'Demo cafe', city: 'Paris' },
    settings: {
      show_logo: false,
      show_name: true,
      available_languages: [{ id: 'fr', value: 'Français' }],
      user_login_check: true,
    },
    pages: [{ title: 'Info', content: '<p>Bonjour</p>' }],
    clientInfo: { ap_mac: '11:22', ssid: 'Demo' },
    omadaParams: { clientMac: 'AA:BB' },
    dynamicKey: 'demo-key',
    cacheStatus: 'HIT' as const,
    missingOmada: [],
  };

  it('renders status badges and allows switching panels', () => {
    render(<DynamicShell {...baseProps} />);

    expect(screen.getByText('dynamic.status.cache')).toBeInTheDocument();
    expect(screen.getByText('dynamic.status.key')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dynamic.toolbar.settings' }));
    expect(screen.getByText('dynamic.settings.title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'dynamic.toolbar.pages' }));
    expect(screen.getByText('dynamic.pages.title')).toBeInTheDocument();
  });
});
