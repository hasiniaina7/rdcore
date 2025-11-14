import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Success from '../Success';

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
});
