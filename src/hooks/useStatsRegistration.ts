"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import { formatChartDay, formatChartMonth } from "@/utils/format";
import type { CustomerRegistrationResponse, CustomerRegistrationRecord } from "@/types/statistics";

const APPLY_TABLE_LIMIT_DESKTOP = 10;
const APPLY_TABLE_LIMIT_MOBILE = 7;

type DateRange = {
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
};

export function useStatsRegistration(
  projectId: string | null,
  page: number,
  dateRange?: DateRange
) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const limit = isMobile ? APPLY_TABLE_LIMIT_MOBILE : APPLY_TABLE_LIMIT_DESKTOP;

  // Only use date range if both dates are provided
  const hasDateFilter = Boolean(dateRange?.startDate && dateRange?.endDate);

  const tableQuery = useQuery<
    CustomerRegistrationResponse,
    Error,
    CustomerRegistrationResponse,
    ["stats", "registration", "table", { projectId: string | null; page: number; limit: number; startDate?: string; endDate?: string }]
  >({
    queryKey: [
      "stats",
      "registration",
      "table",
      {
        projectId,
        page,
        limit,
        ...(hasDateFilter && { startDate: dateRange!.startDate!, endDate: dateRange!.endDate! }),
      },
    ],
    enabled: Boolean(projectId),
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerRegistration({
        projectId,
        page,
        limit,
        ...(hasDateFilter && { startDate: dateRange!.startDate!, endDate: dateRange!.endDate! }),
      });
      return res.data;
    },
  });

  const chartQuery = useQuery<CustomerRegistrationResponse>({
    queryKey: [
      "stats",
      "registration",
      "chart",
      projectId,
      hasDateFilter ? dateRange!.startDate : null,
      hasDateFilter ? dateRange!.endDate : null,
    ],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerRegistration({
        projectId,
        page: 1,
        limit: 1000, // Get all data for chart when date range is specified
        ...(hasDateFilter && { startDate: dateRange!.startDate!, endDate: dateRange!.endDate! }),
      });
      return res.data;
    },
  });

  // 일간 모드: 현재 페이지의 테이블 데이터만 그래프에 표시
  const chartDailyData = useMemo(() => {
    const records = tableQuery.data?.data.data === null ? [] : (tableQuery.data?.data.data ?? []);
    const sorted = [...records].sort((a, b) => new Date(a.statisticsDate).getTime() - new Date(b.statisticsDate).getTime());
    return sorted.map((item) => ({ x: formatChartDay(item.statisticsDate), y: item.totalCount }));
  }, [tableQuery.data]);

  // 월간 모드: 전체 데이터를 월별로 집계
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
  const actualLimit = payload?.limit ?? limit;
  const totalPages = Math.max(1, Math.ceil(totalCount / actualLimit));

  return {
    tableQuery,
    chartQuery,
    chartDailyData,
    chartMonthlyData,
    rows,
    totalCount,
    totalPages,
    // 일간 모드용 스켈레톤 상태 (tableQuery 기반)
    showDailyChartSkeleton: tableQuery.isLoading && !tableQuery.data,
    showDailyChartError: tableQuery.isError && !tableQuery.isFetching,
    // 월간 모드용 스켈레톤 상태 (chartQuery 기반)
    showMonthlyChartSkeleton: chartQuery.isLoading && !chartQuery.data,
    showMonthlyChartError: chartQuery.isError && !chartQuery.isFetching,
    // 테이블용 스켈레톤 상태
    showTableSkeleton: tableQuery.isLoading && !tableQuery.data,
    showTableError: tableQuery.isError && !tableQuery.isFetching,
  };
}

