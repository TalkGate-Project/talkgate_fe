"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts";

import { getSelectedProjectId } from "@/lib/project";
import { StatisticsService } from "@/services/statistics";
import type { CustomerNoteStatusRecord, CustomerNoteStatusResponse } from "@/types/statistics";

const COLORS = [
  "#D9534F",
  "#F0AD4E",
  "#C0C0C0",
  "#93C5FD",
  "#34D399",
  "#F78DA7",
  "#FDE68A",
  "#C4B5FD",
  "#2DD4BF",
  "#FB7185",
];

export default function StatusBarChart() {
  const projectId = getSelectedProjectId();

  const { data, isLoading, isError, isFetching } = useQuery<CustomerNoteStatusResponse>({
    queryKey: ["stats", "note-status", projectId],
    enabled: Boolean(projectId),
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

  if (!projectId) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-[#E2E2E2] bg-white px-6 text-[14px] text-[#808080]">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E2E2E2] border-t-[#51F8A5]" />
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-[#FFB4B4] bg-[#FFF6F6] px-6 text-[14px] text-[#E35555]">
        처리 상태 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-[#E2E2E2] bg-white px-6 text-[14px] text-[#808080]">
        표시할 처리 상태 통계가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="#EDEDED" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#808080" }} axisLine={false} tickLine={false} interval={0} angle={0} height={40} />
          <YAxis tick={{ fill: "#808080" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { label: string; value: number };
              return (
                <div className="rounded-[6px] bg-black px-3 py-1 text-[12px] text-white">
                  {p.label}: {p.value.toLocaleString()}건
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={entry.label ?? index} fill={entry.color} />
            ))}
            <LabelList dataKey="value" position="top" style={{ fill: "#808080", fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

