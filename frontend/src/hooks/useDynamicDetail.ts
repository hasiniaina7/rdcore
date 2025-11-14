import { useEffect, useState } from 'react';
import client from '../api/client';

export interface DynamicDetailState<T> {
  data?: T;
  isLoading: boolean;
  error?: string;
}

export default function useDynamicDetail<T = unknown>(): DynamicDetailState<T> {
  const [state, setState] = useState<DynamicDetailState<T>>({ isLoading: true });

  useEffect(() => {
    const controller = new AbortController();
    const fetchDetail = async () => {
      try {
        const search = window.location.search;
        const { data } = await client.get(`/dynamic/details${search}`, {
          signal: controller.signal,
        });
        setState({ data: data.data, isLoading: false });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'fetch_failed';
        setState({ isLoading: false, error: message });
      }
    };
    fetchDetail();
    return () => controller.abort();
  }, []);

  return state;
}
