import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (options && typeof options.defaultValue === 'string') {
          return options.defaultValue;
        }
        return key;
      },
      i18n: {
        language: 'en',
        changeLanguage: () => Promise.resolve(),
      },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: () => undefined,
    },
  };
});
