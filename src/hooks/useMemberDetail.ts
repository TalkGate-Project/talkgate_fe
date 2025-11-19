import { useQuery } from "@tanstack/react-query";
import { MembersService } from "@/services/members";
import type { MemberDetail } from "@/types/members";

export function useMemberDetail(memberId: number | null) {
  const query = useQuery({
    queryKey: ["members", "detail", memberId],
    queryFn: async () => {
      if (!memberId) throw new Error("Member ID is required");
      const res = await MembersService.detail(memberId);
      return res.data.data;
    },
    enabled: Boolean(memberId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    member: query.data as MemberDetail | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

