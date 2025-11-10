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
    const records = data?.data.data === null ? [] : (data?.data.data ?? []);
    const total = records.reduce((sum, r) => sum + (r?.totalCount ?? 0), 0);
    return records.map((item, index) => {
      const value = item.totalCount ?? 0;
      const percent = total > 0 ? (value / total) * 100 : 0;
      return {
        label: item.categoryName ?? "일반",
        value,
        percent,
        color: COLORS[index % COLORS.length],
      };
    });
  }, [data]);

  // X축: 라벨 + 하단 퍼센트(소수 1자리, 예: 11.9%)
  const renderXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const label: string = payload?.value ?? "";
    // payload.payload has full datum
    const p = payload?.payload?.percent ?? 0;
    const percentText = `${(Math.round(p * 10) / 10).toFixed(1)}%`;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill="var(--neutral-100)"
          fontSize={14}
          fontWeight={500}
        >
          {label}
        </text>
        <text
          x={0}
          y={0}
          dy={42}
          textAnchor="middle"
          fill="var(--neutral-60)"
          fontSize={14}
          fontWeight={500}
        >
          {percentText}
        </text>
      </g>
    );
  };

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

  if (data?.data.data === null || !chartData.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
        {data?.data.data === null ? "처리 상태 통계 데이터가 없습니다." : "표시할 처리 상태 통계가 없습니다."}
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 56 }} barCategoryGap="20%">
          <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={renderXAxisTick}
          />
          {/* 왼쪽 축 라벨 제거 */}
          <YAxis hide />
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
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={42}>
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

