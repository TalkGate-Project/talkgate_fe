import { useQuery } from "@tanstack/react-query";
import { getSelectedProjectId } from "@/lib/project";
import { MembersService } from "@/services/members";
import type { MemberDetail } from "@/types/members";

export const memberDetailQueryKey = (
  projectId: string | number | null | undefined,
  memberId: number | null
) => ["members", "detail", projectId ?? null, memberId] as const;

export function useMemberDetail(memberId: number | null, projectId?: string | number | null) {
  const effectiveProjectId = projectId ?? getSelectedProjectId();
  const query = useQuery({
    queryKey: memberDetailQueryKey(effectiveProjectId, memberId),
    queryFn: async () => {
      if (!memberId) throw new Error("Member ID is required");
      const res = await MembersService.detail(
        memberId,
        effectiveProjectId ? { "x-project-id": String(effectiveProjectId) } : undefined
      );
      return res.data.data;
    },
    enabled: Boolean(memberId && effectiveProjectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // 직원정보는 조직 권한과 팀 조작 버튼을 결정하므로, 탭 복귀·모달 재열기 시 서버값을 확인한다.
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
  });

  return {
    member: query.data as MemberDetail | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

