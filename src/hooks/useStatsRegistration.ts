import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import { formatChartDay, formatChartMonth } from "@/utils/format";
import type { CustomerRegistrationResponse, CustomerRegistrationRecord } from "@/types/statistics";

const APPLY_TABLE_LIMIT = 10;

export function useStatsRegistration(projectId: string | null, page: number) {
  const tableQuery = useQuery<
    CustomerRegistrationResponse,
    Error,
    CustomerRegistrationResponse,
    ["stats", "registration", "table", { projectId: string | null; page: number; limit: number }]
  >({
    queryKey: ["stats", "registration", "table", { projectId, page, limit: APPLY_TABLE_LIMIT }],
    enabled: Boolean(projectId),
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerRegistration({
        projectId,
        page,
        limit: APPLY_TABLE_LIMIT,
      });
      return res.data;
    },
  });

  const chartQuery = useQuery<CustomerRegistrationResponse>({
    queryKey: ["stats", "registration", "chart", projectId],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerRegistration({
        projectId,
        page: 1,
        limit: 30,
      });
      return res.data;
    },
  });

  const chartDailyData = useMemo(() => {
    const records = chartQuery.data?.data.data === null ? [] : (chartQuery.data?.data.data ?? []);
    const sorted = [...records].sort((a, b) => new Date(a.statisticsDate).getTime() - new Date(b.statisticsDate).getTime());
    return sorted.map((item) => ({ x: formatChartDay(item.statisticsDate), y: item.totalCount }));
  }, [chartQuery.data]);

  const chartMonthlyData = useMemo(() => {
    const records = chartQuery.data?.data.data === null ? [] : (chartQuery.data?.data.data ?? []);
    const map = new Map<string, number>();
    records.forEach((item) => {
      const key = item.statisticsDate.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + item.totalCount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => ({ x: formatChartMonth(key), y: value }));
  }, [chartQuery.data]);

  const payload = tableQuery.data?.data;
  const rows: CustomerRegistrationRecord[] = payload?.data === null ? [] : (payload?.data ?? []);
  const totalCount = payload?.totalCount ?? 0;
  const limit = payload?.limit ?? APPLY_TABLE_LIMIT;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    tableQuery,
    chartQuery,
    chartDailyData,
    chartMonthlyData,
    rows,
    totalCount,
    totalPages,
    showChartSkeleton: chartQuery.isLoading && !chartQuery.data,
    showChartError: chartQuery.isError && !chartQuery.isFetching,
    showTableSkeleton: tableQuery.isLoading && !tableQuery.data,
    showTableError: tableQuery.isError && !tableQuery.isFetching,
  };
}

