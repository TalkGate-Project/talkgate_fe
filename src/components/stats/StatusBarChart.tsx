"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { CustomerNoteStatusRecord, CustomerNoteStatusResponse } from "@/types/statistics";

const COLORS = [
  "var(--danger-40)",
  "var(--warning-40)",
  "var(--neutral-40)",
  "var(--secondary-20)",
  "var(--primary-60)",
  "var(--danger-20)",
  "var(--warning-20)",
  "var(--secondary-40)",
  "var(--primary-20)",
  "var(--danger-60)",
];

export default function StatusBarChart() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const { data, isLoading, isError, isFetching } = useQuery<CustomerNoteStatusResponse>({
    queryKey: ["stats", "note-status", projectId],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerNoteStatus({ projectId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    const records: CustomerNoteStatusRecord[] = data?.data.data ?? [];
    return records.map((item, index) => ({
      label: item.categoryName ?? "일반",
      value: item.totalCount ?? 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  if (waitingForProject) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 px-6 text-[14px] text-danger-40">
        처리 상태 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
        표시할 처리 상태 통계가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--neutral-60)" }} axisLine={false} tickLine={false} interval={0} angle={0} height={40} />
          <YAxis tick={{ fill: "var(--neutral-60)" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { label: string; value: number };
              return (
                <div className="rounded-[6px] bg-neutral-90 px-3 py-1 text-[12px] text-neutral-0">
                  {p.label}: {p.value.toLocaleString()}건
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={entry.label ?? index} fill={entry.color} />
            ))}
            <LabelList dataKey="value" position="top" style={{ fill: "var(--neutral-60)", fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

