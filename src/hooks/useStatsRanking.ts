import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { RankingTeamResponse, RankingTeamRecord, RankingMemberResponse, RankingMemberRecord } from "@/types/statistics";

export function useStatsTeamRanking(projectId: string | null, page = 1, limit = 5, month?: Date | null) {
  const year = month ? month.getFullYear() : undefined;
  const monthNum = month ? month.getMonth() + 1 : undefined;
  const query = useQuery<RankingTeamResponse>({
    queryKey: ["stats", "ranking", "team", projectId, page, limit, year, monthNum],
    enabled: Boolean(projectId) && Boolean(year) && Boolean(monthNum),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      if (!year || !monthNum) throw new Error("년도와 월을 선택해주세요.");
      const queryParams = { projectId, page, limit, year, month: monthNum };
      const res = await StatisticsService.rankingTeam(queryParams);
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

export function useStatsMemberRanking(projectId: string | null, page = 1, limit = 5, month?: Date | null) {
  const year = month ? month.getFullYear() : undefined;
  const monthNum = month ? month.getMonth() + 1 : undefined;
  const query = useQuery<RankingMemberResponse>({
    queryKey: ["stats", "ranking", "member", projectId, page, limit, year, monthNum],
    enabled: Boolean(projectId) && Boolean(year) && Boolean(monthNum),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      if (!year || !monthNum) throw new Error("년도와 월을 선택해주세요.");
      const queryParams = { projectId, page, limit, year, month: monthNum };
      const res = await StatisticsService.rankingMember(queryParams);
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

