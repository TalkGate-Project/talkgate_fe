"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList, Cell } from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { CustomerAssignmentByTeamResponse } from "@/types/statistics";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

// 팀별 색상 (피그마 디자인)
const TEAM_COLORS = [
  "#D6FAE8", // 연한 녹색 (A팀)
  "#FFF5D5", // 연한 노란색 (B팀)
  "#FFEBEB", // 연한 빨간색 (C팀)
  "#D3E1FE", // 연한 파란색 (배정되지 않음)
  "#E2E2E2", // 회색 (기타)
];

export default function AssignBarChart() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const { data, isLoading, isError, isFetching } = useQuery<CustomerAssignmentByTeamResponse>({
    queryKey: ["stats", "assignment", "team-chart", projectId],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerAssignmentByTeam({ projectId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    const items = data?.data.data === null ? [] : (data?.data.data ?? []);
    return items.map((item, index) => ({
      name: item.teamName ?? "배정되지 않음",
      value: item.totalAssignedCount,
      color: TEAM_COLORS[index % TEAM_COLORS.length],
    }));
  }, [data]);

  // Y축 도메인 계산 (최댓값에 14% 여유 추가)
  const yDomain = useMemo(() => {
    const maxValue = Math.max(...chartData.map(d => d.value), 0);
    return [0, Math.ceil(maxValue * 1.14)];
  }, [chartData]);

  if (waitingForProject) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
        배정 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (data?.data.data === null || chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <>
      <h3 className="mt-5 mb-2 text-[16px] font-semibold text-neutral-90">팀별 배정 현황</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 30, right: 20, bottom: 10, left: 20 }} barCategoryGap="20%">
          <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--neutral-60)", fontSize: 12, fontFamily: "var(--font-montserrat)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide domain={yDomain} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              offset={10}
              style={{
                fill: "var(--neutral-90)",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "var(--font-montserrat)",
              }}
              formatter={(value: any) => {
                const numValue = typeof value === 'number' ? value : Number(value);
                return `${NUMBER_FORMATTER.format(numValue)}건`;
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  );
}

