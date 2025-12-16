"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type MeUser = {
  // 필수 필드 (*)
  id: number;
  email: string;
  name: string;
  status: "active" | "inactive" | "suspended" | "pendingEmailVerification";
  isAllowTerms: boolean;
  isAllowPrivacy: boolean;
  isAllowChatNotification: boolean;
  isAllowNewNotification: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 선택 필드
  profileImageUrl?: string;
  phone?: string;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  
  // teamName은 API 응답에 없지만 기존 코드 호환성을 위해 유지
  teamName?: string;
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


