"use client";

import { useMemo } from "react";
import { useFetch } from "@/hooks/useFetch";

export type MeUser = {
  id: number;
  email?: string;
  name?: string;
  profileImageUrl?: string;
};

type MeResponse = {
  result: true;
  data: MeUser;
};

export function useMe() {
  const select = useMemo(() => (raw: unknown) => {
    const res = raw as MeResponse;
    return res?.data as MeUser;
  }, []);

  const { data, loading, error, refetch, cancel } = useFetch<MeUser>("/v1/auth/user", { select });
  return { user: data, loading, error, refetch, cancel } as const;
}


