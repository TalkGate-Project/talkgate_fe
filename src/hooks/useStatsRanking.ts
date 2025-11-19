import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { RankingTeamResponse, RankingTeamRecord, RankingMemberResponse, RankingMemberRecord } from "@/types/statistics";

export function useStatsTeamRanking(projectId: string | null, page = 1, limit = 5) {
  const query = useQuery<RankingTeamResponse>({
    queryKey: ["stats", "ranking", "team", projectId, page, limit],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.rankingTeam({ projectId, page, limit });
      return res.data;
    },
  });

  const rows: RankingTeamRecord[] = query.data?.data?.data ?? [];

  return {
    query,
    rows,
    totalCount: query.data?.data?.totalCount ?? 0,
    isLoading: query.isLoading && !query.data,
    isError: query.isError && !query.isFetching,
  };
}

export function useStatsMemberRanking(projectId: string | null, page = 1, limit = 5) {
  const query = useQuery<RankingMemberResponse>({
    queryKey: ["stats", "ranking", "member", projectId, page, limit],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.rankingMember({ projectId, page, limit });
      return res.data;
    },
  });

  const rows: RankingMemberRecord[] = query.data?.data?.data ?? [];

  return {
    query,
    rows,
    totalCount: query.data?.data?.totalCount ?? 0,
    isLoading: query.isLoading && !query.data,
    isError: query.isError && !query.isFetching,
  };
}

