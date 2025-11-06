import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { CustomerAssignmentByTeamResponse, CustomerAssignmentTeamRecord } from "@/types/statistics";

const ASSIGN_COLORS = [
  "var(--primary-20)",
  "var(--warning-20)",
  "var(--danger-20)",
  "var(--secondary-20)",
  "var(--secondary-10)",
  "var(--secondary-40)",
];

export function useStatsAssignment(projectId: string | null) {
  const teamQuery = useQuery<CustomerAssignmentByTeamResponse>({
    queryKey: ["stats", "assignment", "team-overview", projectId],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerAssignmentByTeam({ projectId });
      return res.data;
    },
  });

  const teams: CustomerAssignmentTeamRecord[] = teamQuery.data?.data.data === null ? [] : (teamQuery.data?.data.data ?? []);
  
  const topTeamsWithColors = useMemo(
    () =>
      [...teams]
        .sort((a, b) => b.totalAssignedCount - a.totalAssignedCount)
        .slice(0, 4)
        .map((team, index) => ({
          ...team,
          color: ASSIGN_COLORS[index % ASSIGN_COLORS.length],
        })),
    [teams]
  );

  return {
    teamQuery,
    teams,
    topTeamsWithColors,
    isLoading: teamQuery.isLoading && !teamQuery.data,
    isError: teamQuery.isError && !teamQuery.isFetching,
  };
}

