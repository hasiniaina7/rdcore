import { useMemo } from 'react';

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
] as const;

type OmadaParams = Partial<Record<(typeof keys)[number], string>>;

export default function useOmadaParams(): OmadaParams {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return keys.reduce<OmadaParams>((acc, key) => {
      const value = params.get(key);
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }, []);
}
