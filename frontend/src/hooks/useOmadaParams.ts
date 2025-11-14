import { useMemo } from 'react';

const DEFAULT_KEY = import.meta.env.VITE_DEFAULT_DYNAMIC_KEY || 'test_dynamic_keys';

const keys = [
  'clientMac',
  'apMac',
  'gatewayMac',
  'site',
  'radioId',
  'ssidName',
  'vid',
  'redirectUrl',
  't',
  'key',
  'lang',
  'username',
  'mac',
] as const;

type OmadaParams = Partial<Record<(typeof keys)[number], string>>;

export default function useOmadaParams(): OmadaParams {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const result = keys.reduce<OmadaParams>((acc, key) => {
      const value = params.get(key);
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    if (!result.key && DEFAULT_KEY) {
      result.key = DEFAULT_KEY;
    }
    return result;
  }, []);
}
