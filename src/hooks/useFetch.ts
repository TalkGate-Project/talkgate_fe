"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient, RequestOptions } from "@/lib/apiClient";

export type UseFetchState<T> = {
  data: T | null;
  error: unknown;
  loading: boolean;
};

export type UseFetchOptions<T> = {
  immediate?: boolean; // auto-run on mount
  request?: Omit<RequestOptions, "method">;
  select?: (raw: unknown) => T; // mapping function for response
  deps?: unknown[]; // dependencies for auto-run
};

export function useFetch<T = unknown>(path: string, opts: UseFetchOptions<T> = {}) {
  const { immediate = true, request, select, deps = [] } = opts;

  const [state, setState] = useState<UseFetchState<T>>({ data: null, error: null, loading: immediate });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await apiClient.get<unknown>(path, { ...(request ?? {}), signal: controller.signal });
      const mapped = (select ? select(res.data) : (res.data as T));
      setState({ data: mapped, error: null, loading: false });
      return mapped;
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      setState({ data: null, error: err, loading: false });
      throw err;
    }
  }, [path, select, request]);

  useEffect(() => {
    if (!immediate) return;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return useMemo(() => ({ ...state, refetch: run, cancel }), [state, run, cancel]);
}


