"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getSelectedProjectId } from "@/lib/project";
import { StatisticsService } from "@/services/statistics";
import type { CustomerAssignmentTeamRecord, CustomerAssignmentByTeamResponse } from "@/types/statistics";

const COLORS = ["#ADF6D2", "#FFDE81", "#FC9595", "#7EA5F8", "#BAE6FD", "#F9A8D4"];

export default function AssignProgressList() {
  const projectId = getSelectedProjectId();

  const { data, isLoading, isError, isFetching } = useQuery<CustomerAssignmentByTeamResponse>({
    queryKey: ["stats", "assignment", "team-overview", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerAssignmentByTeam({ projectId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    const items: CustomerAssignmentTeamRecord[] = data?.data.data ?? [];
    const max = Math.max(1, ...items.map((item) => item.totalAssignedCount));
    return items.map((item, index) => ({
      label: item.teamName ?? "소속없음",
      value: item.totalAssignedCount,
      max,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  if (!projectId) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#E2E2E2] bg-white px-4 text-[14px] text-[#808080]">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-[12px] bg-[#F8F8F8] px-4 py-3">
            <div className="flex items-center justify-between text-[14px]">
              <span className="h-4 w-20 animate-pulse rounded bg-[#E2E2E2]" />
              <span className="h-4 w-12 animate-pulse rounded bg-[#E2E2E2]" />
            </div>
            <div className="mt-2 h-3 rounded-full bg-[#E2E2E2]">
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#D1D5DB]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#FFB4B4] bg-[#FFF6F6] px-4 text-[14px] text-[#E35555]">
        배정 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#E2E2E2] bg-white px-4 text-[14px] text-[#808080]">
        표시할 배정 통계가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {rows.map((row) => {
        const pct = Math.max(0, Math.min(100, (row.value / row.max) * 100));
        return (
          <div key={row.label} className="rounded-[12px] bg-[#F8F8F8] px-4 py-3">
            <div className="flex items-center justify-between text-[14px]">
              <span className="text-[#000]">{row.label}</span>
              <span className="text-[#252525]">{row.value.toLocaleString()}건</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-[#E2E2E2]">
              <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: row.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

