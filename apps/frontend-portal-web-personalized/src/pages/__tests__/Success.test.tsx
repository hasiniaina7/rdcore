import type { ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Success from '../Success';
import { useUsageData } from '../../modules/usage/useUsageData';
import { useAuth } from '../../modules/auth/AuthProvider';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Link: ({ children, ...props }: { children: ReactNode }) => (
      <a {...props}>
        {children}
      </a>
    ),
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

vi.mock('../../modules/auth/AuthProvider', () => ({
  __esModule: true,
  useAuth: vi.fn(),
}));

const mockedUseUsageData = vi.mocked(useUsageData);
const mockedUseAuth = vi.mocked(useAuth);

const baseHookValue = {
  usage: null,
  summary: null,
  activeSessions: null,
  inactiveSessions: null,
  timeseries: null,
  errors: [] as string[],
  isLoading: false,
  lastUpdated: null,
  refresh: vi.fn(),
};

describe('Success page', () => {
  beforeEach(() => {
    mockedUseUsageData.mockReturnValue(baseHookValue);
    mockedUseAuth.mockReturnValue({
      session: { token: 'abc', profile: { username: 'demo', mac: 'AA:BB' } },
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders mac override form and refreshes on submit', () => {
    const refresh = vi.fn();
    mockedUseUsageData.mockReturnValue({ ...baseHookValue, refresh });

    render(<Success />);
    const macInput = screen.getByLabelText('success.mac');
    fireEvent.change(macInput, { target: { value: '11:22' } });
    fireEvent.submit(macInput.closest('form') as HTMLFormElement);

    expect(refresh).toHaveBeenCalled();
  });

  it('renders dashboard data when usage is available', () => {
    mockedUseUsageData.mockReturnValue({
      usage: {
        username: 'demo',
        accountType: 'voucher',
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
      timeseries: {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-07T23:59:59Z',
        granularity: 'day',
        buckets: [],
      },
      errors: [],
      isLoading: false,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<Success />);

    expect(screen.getByText('success.sessionsTitle')).toBeInTheDocument();
    expect(screen.getByText('success.sessionsCaption')).toBeInTheDocument();
    expect(screen.getByText('success.lastUpdated')).toBeInTheDocument();
  });

  it('uses the monthly total for permanent accounts', () => {
    mockedUseAuth.mockReturnValue({
      session: {
        token: 'abc',
        profile: { username: 'demo', mac: 'AA:BB', accountType: 'permanent' },
      },
      login: vi.fn(),
      logout: vi.fn(),
    });
    mockedUseUsageData.mockReturnValue({
      usage: {
        username: 'demo',
        accountType: 'permanent',
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
      activeSessions: null,
      inactiveSessions: null,
      errors: [],
      isLoading: false,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<Success />);

    expect(screen.getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '100');
  });
});
