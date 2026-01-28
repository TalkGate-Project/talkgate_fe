"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { useAuthSession } from "@/hooks/useAuthSession";

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
  const { status: authStatus, hasAuthTokenHint, setActive, setExpired } = useAuthSession();
  
  // auth 관련 경로에서는 API 호출하지 않음 (인증 토큰이 없어서 401 발생 가능)
  const isAuthRoute = pathname?.startsWith("/login") || 
                      pathname?.startsWith("/auth/callback") || 
                      pathname?.startsWith("/social-signup") || 
                      pathname?.startsWith("/project-signup") || 
                      pathname?.startsWith("/signup") ||
                      pathname?.startsWith("/invite") ||
                      false;
  
  const shouldFetch = !isAuthRoute && hasAuthTokenHint && authStatus !== "expired";
  
  const query = useQuery<MeUser, unknown>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await apiClient.get<MeResponse>("/v1/auth/user", {
        suppressAutoLogout: true, // 초기 로딩 API는 자동 로그아웃 방지 (프록시에서 refresh 처리)
      });
      return res.data.data;
    },
    enabled: shouldFetch, // auth 경로 또는 세션 힌트 없음/만료 시 쿼리 비활성화
    retry: false, // 401 에러는 재시도하지 않음 (프록시에서 refresh 처리)
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지 (중복 요청 방지) - 1분에서 5분으로 증가
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (5분에서 10분으로 증가)
    refetchOnMount: false, // 마운트 시 자동 refetch 방지 (캐시된 데이터 사용)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 방지
    refetchOnReconnect: false, // 네트워크 재연결 시 자동 refetch 방지
  });

  const user = (query.data ?? null) as MeUser | null;
  
  useEffect(() => {
    if (query.isSuccess) {
      setActive();
      return;
    }
    
    const error = query.error as any;
    if (query.isError && error?.status === 401) {
      setExpired("401");
    }
  }, [query.isSuccess, query.isError, query.error, setActive, setExpired]);
  
  return {
    user,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}


