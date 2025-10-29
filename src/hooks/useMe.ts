"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

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
  const query = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await apiClient.get<MeResponse>("/v1/auth/user");
      return res.data.data;
    },
  });

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}


