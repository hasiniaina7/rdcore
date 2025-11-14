import { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import type {
  DynamicDetail,
  DynamicDetailApiResponse,
  AvailableKeyPair,
} from './types';

export type CacheStatus = 'HIT' | 'MISS' | undefined;

export type DynamicLoaderError =
  | {
      type: 'invalid-key';
      message: string;
      availableKeys: AvailableKeyPair[];
    }
  | {
      type: 'request';
      message: string;
    };

export interface DynamicLoaderState {
  data?: DynamicDetail | null;
  isLoading: boolean;
  error?: DynamicLoaderError;
  cacheStatus?: CacheStatus;
  isBlocked: boolean;
}

const SUPPORT_ROUTE = '/support';

const toAvailablePairs = (payload: unknown): AvailableKeyPair[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload
      .map((entry) => {
        if (typeof entry === 'string') {
          return { label: entry, value: entry };
        }
        if (entry && typeof entry === 'object') {
          const typed = entry as Record<string, unknown>;
          const label =
            String(typed.title ?? typed.name ?? typed.key ?? typed.value ?? 'key') || 'key';
          const value = String(typed.value ?? typed.key ?? '');
          return { label, value };
        }
        return null;
      })
      .filter(Boolean) as AvailableKeyPair[];
  }

  if (typeof payload === 'object') {
    return Object.entries(payload as Record<string, unknown>).map(([label, value]) => ({
      label,
      value: String(value),
    }));
  }

  return [];
};

export default function useDynamicDetail(): DynamicLoaderState & { supportHref: string } {
  const [state, setState] = useState<DynamicLoaderState>({ isLoading: true, isBlocked: false });
  const search = useMemo(() => window.location.search, [window.location.search]);
  const supportHref = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    return key ? `${SUPPORT_ROUTE}?key=${encodeURIComponent(key)}` : SUPPORT_ROUTE;
  }, [window.location.search]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDetail() {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const pathname = '/dynamic/details';
        const url = search ? `${pathname}${search}` : pathname;
        const response = await client.get<DynamicDetailApiResponse>(url, {
          signal: controller.signal,
        });
        const payload = response.data;
        if (!payload.success) {
          setState({
            isLoading: false,
            error: {
              type: 'invalid-key',
              message: payload.message || 'dynamic.invalidKey',
              availableKeys: toAvailablePairs(payload.data),
            },
            isBlocked: true,
            data: payload.data,
            cacheStatus: response.headers['x-cache-status'] as CacheStatus,
          });
          return;
        }

        setState({
          isLoading: false,
          data: payload.data,
          cacheStatus: response.headers['x-cache-status'] as CacheStatus,
          isBlocked: false,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'dynamic.requestFailed';
        setState({
          isLoading: false,
          error: { type: 'request', message },
          isBlocked: true,
        });
      }
    }

    fetchDetail();
    return () => controller.abort();
  }, [search]);

  return { ...state, supportHref };
}
