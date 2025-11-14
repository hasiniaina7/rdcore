import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Success from '../Success';
import client from '../../api/client';

vi.mock('../../hooks/useOmadaParams', () => ({
  __esModule: true,
  default: () => ({}),
}));

vi.mock('../../modules/dynamic/useDynamicDetail', () => ({
  __esModule: true,
  default: () => ({ isLoading: false, data: null }),
}));

vi.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Success page', () => {
  it('shows form and error when fields missing', async () => {
    render(<Success />);
    fireEvent.submit(screen.getByTestId('usage-form'));
    expect(await screen.findByText('success.missingParams')).toBeInTheDocument();
  });

  it('renders usage indicators after fetching data', async () => {
    const getMock = client.get as ReturnType<typeof vi.fn>;
    getMock.mockResolvedValueOnce({
      data: {
        data: {
          username: 'demo',
          mac: 'AA',
          dataUsed: 1024,
          dataCap: 4096,
          timeUsed: 120,
          timeCap: 3600,
          depleted: false,
          sessions: [],
        },
      },
    } as never);
    render(<Success />);
    fireEvent.change(screen.getByLabelText('success.username'), { target: { value: 'demo' } });
    fireEvent.change(screen.getByLabelText('success.password'), { target: { value: 'pass' } });
    fireEvent.change(screen.getByLabelText('success.mac'), { target: { value: 'AA' } });
    fireEvent.submit(screen.getByTestId('usage-form'));
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(screen.getByText('success.dataUsed')).toBeInTheDocument();
    expect(screen.getByText('success.sessionsTitle')).toBeInTheDocument();
  });
});
