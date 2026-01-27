"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  
  // 2FA 플로우 중에는 API 호출하지 않음 (인증 토큰이 없어서 401 발생 가능)
  const isTwoFactorFlow = pathname?.startsWith("/login/two-factor") ?? false;
  
  const query = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await apiClient.get<MeResponse>("/v1/auth/user", {
        suppressAutoLogout: true, // 초기 로딩 API는 자동 로그아웃 방지 (프록시에서 refresh 처리)
      });
      return res.data.data;
    },
    enabled: !isTwoFactorFlow, // 2FA 플로우 중에는 쿼리 비활성화
    retry: false, // 401 에러는 재시도하지 않음 (프록시에서 refresh 처리)
  });

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}


