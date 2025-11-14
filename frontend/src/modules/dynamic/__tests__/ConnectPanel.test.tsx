import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectPanel from '../ConnectPanel';

vi.mock('../../../api/client', () => ({
  __esModule: true,
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import client from '../../../api/client';

const mockedClient = client as { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

describe('ConnectPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks connection when Omada params missing', async () => {
    render(
      <ConnectPanel
        settings={{ user_login_check: true }}
        dynamicKey="abc"
        omadaParams={{}}
        connectVisible={true}
      />
    );
    const submitBtn = screen.getAllByRole('button', { name: 'dynamic.connect.submit' })[0];
    fireEvent.submit(submitBtn.closest('form')!);
    expect(mockedClient.post).not.toHaveBeenCalled();
    expect(await screen.findByText('dynamic.connect.missingOmada')).toBeInTheDocument();
  });

  it('disables click-to-connect when panel hidden', () => {
    render(
      <ConnectPanel
        settings={{ click_to_connect: { connect_check: true } }}
        dynamicKey="abc"
        omadaParams={{ clientMac: 'AA-BB', site: '1', radioId: '1' }}
        connectVisible={false}
      />
    );
    expect(screen.getByRole('button', { name: 'dynamic.connect.clickCta' })).toBeDisabled();
  });
});
