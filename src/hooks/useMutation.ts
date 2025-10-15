"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { apiClient, RequestOptions } from "@/lib/apiClient";

export type MutationState<TData, TError = unknown> = {
  data: TData | null;
  error: TError | null;
  loading: boolean;
};

export type MutationOptions<TInput, TOutput> = {
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string | ((input: TInput) => string);
  request?: Omit<RequestOptions, "method" | "body">;
  select?: (raw: unknown) => TOutput;
};

export function useMutation<TInput = unknown, TOutput = unknown>(options: MutationOptions<TInput, TOutput>) {
  const { method = "POST", path, request, select } = options;
  const [state, setState] = useState<MutationState<TOutput>>({ data: null, error: null, loading: false });
  const abortRef = useRef<AbortController | null>(null);

  const mutate = useCallback(async (input: TInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const p = typeof path === "function" ? path(input) : path;
      const body = method === "DELETE" ? undefined : (input as unknown);
      const exec = method === "POST" ? apiClient.post : method === "PUT" ? apiClient.put : method === "PATCH" ? apiClient.patch : apiClient.delete;
      const res = await exec<unknown>(p, body, { ...(request ?? {}), signal: controller.signal });
      const mapped = (select ? select(res.data) : (res.data as TOutput));
      setState({ data: mapped, error: null, loading: false });
      return mapped;
    } catch (err) {
      if ((err as any)?.name === "AbortError") return undefined;
      setState({ data: null, error: err as any, loading: false });
      throw err;
    }
  }, [method, path, request, select]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return useMemo(() => ({ ...state, mutate, cancel }), [state, mutate, cancel]);
}


