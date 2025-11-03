"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { CustomerAssignmentTeamRecord, CustomerAssignmentByTeamResponse } from "@/types/statistics";

const COLORS = [
  "var(--primary-20)",
  "var(--warning-20)",
  "var(--danger-20)",
  "var(--secondary-20)",
  "var(--secondary-10)",
  "var(--secondary-40)",
];

export default function AssignProgressList() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const { data, isLoading, isError, isFetching } = useQuery<CustomerAssignmentByTeamResponse>({
    queryKey: ["stats", "assignment", "team-overview", projectId],
    enabled: hasProject,
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

  if (waitingForProject) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-4 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-[12px] bg-neutral-10 px-4 py-3">
            <div className="flex items-center justify-between text-[14px]">
              <span className="h-4 w-20 animate-pulse rounded bg-neutral-20" />
              <span className="h-4 w-12 animate-pulse rounded bg-neutral-20" />
            </div>
            <div className="mt-2 h-3 rounded-full bg-neutral-20">
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-neutral-30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 px-4 text-[14px] text-danger-40">
        배정 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-6 flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-4 text-[14px] text-neutral-60">
        표시할 배정 통계가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {rows.map((row) => {
        const pct = Math.max(0, Math.min(100, (row.value / row.max) * 100));
        return (
          <div key={row.label} className="rounded-[12px] bg-neutral-10 px-4 py-3">
            <div className="flex items-center justify-between text-[14px] text-neutral-90">
              <span>{row.label}</span>
              <span>{row.value.toLocaleString()}건</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-neutral-20">
              <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: row.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

