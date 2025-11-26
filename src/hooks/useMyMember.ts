"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { getSelectedProjectId } from "@/lib/project";
import { MyMember, MyMemberResponse, MemberRole } from "@/types/members";

// 캐싱 설정 상수
const MY_MEMBER_STALE_TIME = 5 * 60 * 1000; // 5분 - 데이터 신선도 유지 시간
const MY_MEMBER_GC_TIME = 30 * 60 * 1000;   // 30분 - 가비지 컬렉션 시간

/**
 * Query Key 팩토리 - 일관된 캐시 키 관리
 */
export const myMemberKeys = {
  all: ["members", "my"] as const,
  byProject: (projectId: string | null) => [...myMemberKeys.all, projectId] as const,
};

async function fetchMyMember(projectId: string): Promise<MyMember> {
  const res = await apiClient.get<MyMemberResponse>("/v1/members/my", {
    headers: { "x-project-id": projectId },
  });
  return res.data.data;
}

/**
 * 현재 로그인한 사용자의 프로젝트 내 멤버 정보를 조회하는 훅
 * 
 * @description
 * - React Query를 사용하여 데이터를 캐싱합니다
 * - 동일한 projectId에 대해 5분간 네트워크 요청 없이 캐시된 데이터 반환
 * - 여러 컴포넌트에서 호출해도 중복 요청이 발생하지 않습니다
 * 
 * @example
 * ```tsx
 * const { member, loading, isAdmin } = useMyMember();
 * 
 * if (isAdmin) {
 *   // 관리자 전용 UI
 * }
 * ```
 */
export function useMyMember(projectId?: string | null) {
  const effectiveProjectId = projectId ?? getSelectedProjectId();

  const query = useQuery<MyMember>({
    queryKey: myMemberKeys.byProject(effectiveProjectId),
    queryFn: () => fetchMyMember(effectiveProjectId as string),
    enabled: Boolean(effectiveProjectId),
    // 명시적 캐싱 설정 (전역 설정 오버라이드 가능)
    staleTime: MY_MEMBER_STALE_TIME,
    gcTime: MY_MEMBER_GC_TIME,
  });

  const member = query.data ?? null;
  const role = member?.role;

  return {
    member,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
    // 편의 속성: 권한 관련
    role,
    isAdmin: role === "admin",
    isSubAdmin: role === "subAdmin",
    isAdminOrSubAdmin: role === "admin" || role === "subAdmin",
    isLeader: role === "leader",
    isMember: role === "member",
  } as const;
}

/**
 * MyMember 캐시를 무효화하는 유틸리티 훅
 * 
 * @description
 * 멤버 정보가 변경되었을 때 (예: 팀 이동, 역할 변경) 호출하여 캐시를 갱신합니다
 */
export function useInvalidateMyMember() {
  const queryClient = useQueryClient();
  
  return {
    invalidate: (projectId?: string | null) => {
      const effectiveProjectId = projectId ?? getSelectedProjectId();
      queryClient.invalidateQueries({
        queryKey: myMemberKeys.byProject(effectiveProjectId),
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: myMemberKeys.all,
      });
    },
  };
}
