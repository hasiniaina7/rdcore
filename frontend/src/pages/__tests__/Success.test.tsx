import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Success from '../Success';
import { useUsageData } from '../../modules/usage/useUsageData';
import { readCredentials } from '../../modules/dynamic/credentialStorage';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  };
});

vi.mock('../../hooks/useOmadaParams', () => ({
  __esModule: true,
  default: () => ({}),
}));

vi.mock('../../modules/dynamic/useDynamicDetail', () => ({
  __esModule: true,
  default: () => ({ isLoading: false, data: { detail: {} } }),
}));

vi.mock('../../modules/usage/useUsageData', () => ({
  __esModule: true,
  useUsageData: vi.fn(),
}));

vi.mock('../../modules/dynamic/credentialStorage', () => ({
  __esModule: true,
  readCredentials: vi.fn(),
}));

const mockedUseUsageData = vi.mocked(useUsageData);
const mockedReadCredentials = vi.mocked(readCredentials);

const baseHookValue = {
  usage: null,
  summary: null,
  activeSessions: null,
  inactiveSessions: null,
  errors: [] as string[],
  isLoading: false,
  lastUpdated: null,
  refresh: vi.fn(),
};

describe('Success page', () => {
  beforeEach(() => {
    mockedUseUsageData.mockReturnValue(baseHookValue);
    mockedReadCredentials.mockReturnValue(null);
  });

  it('shows form and error when fields missing', async () => {
    render(<Success />);
    fireEvent.submit(screen.getByTestId('usage-form'));
    expect(await screen.findByText('success.missingParams')).toBeInTheDocument();
  });

  it('renders dashboard data when usage is available', () => {
    mockedReadCredentials.mockReturnValue({ username: 'demo', password: 'pass' });
    mockedUseUsageData.mockReturnValue({
      usage: {
        username: 'demo',
        dataUsed: 2048,
        dataCap: 4096,
        timeUsed: 600,
        timeCap: 3600,
        depleted: false,
        sessions: [],
      },
      summary: {
        username: 'demo',
        historyLimit: 50,
        macs: [],
        periods: [
          { period: 'daily', totalBytes: 1024, totalTimeSeconds: 120, sessionCount: 1 },
          { period: 'weekly', totalBytes: 2048, totalTimeSeconds: 240, sessionCount: 2 },
          { period: 'monthly', totalBytes: 8192, totalTimeSeconds: 900, sessionCount: 6 },
        ],
      },
      activeSessions: {
        username: 'demo',
        totalCount: 1,
        sessions: [
          {
            radacctid: '1',
            acctstarttime: '2024-01-01T00:00:00Z',
            acctsessiontime: 120,
            nasidentifier: 'AP-1',
            callingstationid: 'AA:BB:CC',
            framedipaddress: '10.0.0.1',
          },
        ],
      },
      inactiveSessions: {
        username: 'demo',
        totalCount: 1,
        sessions: [
          {
            radacctid: '2',
            acctstarttime: '2023-12-25T12:00:00Z',
            acctstoptime: '2023-12-25T13:00:00Z',
            acctsessiontime: 3600,
            nasidentifier: 'AP-2',
            callingstationid: 'DD:EE:FF',
            framedipaddress: '10.0.0.2',
          },
        ],
      },
      errors: [],
      isLoading: false,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<Success />);

    expect(screen.getByText('success.sessionsTitle')).toBeInTheDocument();
    expect(screen.getByText('success.routerStatsSubtitle')).toBeInTheDocument();
    expect(screen.getAllByText('AP-1').length).toBeGreaterThan(0);
    expect(screen.getByText('success.lastUpdated')).toBeInTheDocument();
  });
});
