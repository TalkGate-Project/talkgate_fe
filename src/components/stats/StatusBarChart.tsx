"use client";

import { forwardRef, useImperativeHandle, useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts";

import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMembersTreeWithoutParent, useTeams } from "@/hooks/useMembersTree";
import type { MemberTreeNode } from "@/types/membersTree";
import { StatisticsService } from "@/services/statistics";
import type { CustomerNoteStatusResponse } from "@/types/statistics";
import StatsFilterModal, { type StatsFilterValues } from "@/components/stats/StatsFilterModal";
import { readStatsFilter, writeStatsFilter } from "@/components/stats/statsFilterParams";
import type { Option } from "@/components/common/filterFields";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";

const FILTER_PREFIX = "st";

function findNodeById(nodes: MemberTreeNode[], id: number): MemberTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.descendants ?? [], id);
    if (found) return found;
  }
  return null;
}

function flattenMembers(node: MemberTreeNode): Option[] {
  const result: Option[] = [{ label: node.name, value: node.id }];
  (node.descendants ?? []).forEach((child) => {
    result.push(...flattenMembers(child));
  });
  return result;
}

export type StatusBarChartHandle = {
  openFilter: () => void;
};

const StatusBarChart = forwardRef<StatusBarChartHandle>(function StatusBarChart(_, ref) {
  const router = useRouter();
  const search = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const { categories } = useCustomerNoteCategories();
  const { data: teamsData } = useTeams(projectId);
  const { data: treeData } = useMembersTreeWithoutParent(projectId);
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const [isMobile, setIsMobile] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<StatsFilterValues>(() => readStatsFilter(search, FILTER_PREFIX));

  useImperativeHandle(ref, () => ({
    openFilter: () => setFilterOpen(true),
  }));

  useEffect(() => {
    const fromUrl = readStatsFilter(search, FILTER_PREFIX);
    setFilter((prev) => {
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(fromUrl);
      return prevStr === nextStr ? prev : fromUrl;
    });
  }, [search]);

  const teamOptions = useMemo<Option[]>(
    () => (teamsData ?? []).map((team) => ({ label: team.name, value: team.id })),
    [teamsData]
  );

  const getMemberOptions = useCallback(
    (teamId: number | null): Option[] => {
      if (!teamId || !teamsData || !treeData) return [];
      const team = teamsData.find((t) => t.id === teamId);
      if (!team) return [];
      const leaderNode = findNodeById(treeData, team.leaderMemberId);
      return leaderNode ? flattenMembers(leaderNode) : [];
    },
    [teamsData, treeData]
  );

  const handleApplyFilter = (values: StatsFilterValues) => {
    setFilter(values);
    const params = new URLSearchParams(search.toString());
    writeStatsFilter(params, FILTER_PREFIX, values);
    router.replace(`?${params.toString()}`);
    setFilterOpen(false);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data, isLoading, isError, isFetching } = useQuery<CustomerNoteStatusResponse>({
    queryKey: ["stats", "note-status", projectId, filter],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerNoteStatus({ projectId, ...filter });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    const records = data?.data.data === null ? [] : (data?.data.data ?? []);
    return records.map((item) => {
      const value = item.totalCount ?? 0;
      const percent = item.percentage ?? 0;
      const linkedCategory =
        item.categoryId === null
          ? null
          : categories.find((category) => category.id === item.categoryId);
      const badgeStyle = getBadgeStyle(
        item.categoryName ?? NO_CATEGORY_LABEL,
        item.categoryId ?? 0,
        item.colorCode ?? linkedCategory?.colorCode
      );

      return {
        label: item.categoryName ?? NO_CATEGORY_LABEL,
        value,
        percent,
        color: badgeStyle.backgroundColor,
      };
    });
  }, [categories, data]);

  // 모바일에서 데이터를 5개씩 청크로 나누기
  const chartChunks = useMemo(() => {
    if (!isMobile || chartData.length <= 5) {
      return [chartData];
    }
    const chunks: typeof chartData[] = [];
    for (let i = 0; i < chartData.length; i += 5) {
      chunks.push(chartData.slice(i, i + 5));
    }
    return chunks;
  }, [chartData, isMobile]);

  // Y축 도메인 계산 (최댓값에 14% 여유 추가)
  const getYDomain = useCallback((data: typeof chartData) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return [0, Math.ceil(maxValue * 1.14)];
  }, []);

  let statusContent: React.ReactNode = null;

  if (waitingForProject) {
    statusContent = (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6">
        <LoadingSpinner size="2xl" />
      </div>
    );
  } else if (missingProject) {
    statusContent = (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  } else if (isLoading && !data) {
    statusContent = (
      <div className="flex h-[320px] items-center justify-center">
        <LoadingSpinner size="2xl" />
      </div>
    );
  } else if (isError && !isFetching) {
    statusContent = (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 px-6 text-[14px] text-danger-40">
        카테고리 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  } else if (data?.data.data === null || !chartData.length) {
    statusContent = (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
        {data?.data.data === null ? "카테고리 통계 데이터가 없습니다." : "표시할 카테고리 통계가 없습니다."}
      </div>
    );
  }

  const renderChart = (data: typeof chartData, chunkIndex: number = 0) => {
    const chunkYDomain = getYDomain(data);
    
    // X축: 라벨 + 하단 퍼센트(소수 1자리, 예: 11.9%)
    const renderXAxisTick = (props: any) => {
      const { x, y, payload } = props;
      const label: string = payload?.value ?? "";
      const tickIndex = typeof payload?.index === "number" ? payload.index : -1;
      const datum = tickIndex >= 0 ? data[tickIndex] : data.find((d) => d.label === label);
      const p = datum?.percent ?? 0;
      const percentText = `${(Math.round(p * 10) / 10).toFixed(1)}%`;
      return (
        <g transform={`translate(${x},${y})`}>
          {/* 최대 110px 영역으로 제한하고, 초과 텍스트는 말줄임 처리 */}
          <foreignObject x={-60} y={4} width={120} height={20}>
            <div
              title={label}
              className="mx-auto w-[110px] overflow-hidden text-ellipsis whitespace-nowrap text-center text-[14px] font-medium text-foreground leading-[20px]"
            >
              {label}
            </div>
          </foreignObject>
          {/* SVG text 요소에도 title을 넣어 hover/touch 환경에서 풀네임 확인 가능 */}
          <text x={0} y={0} dy={14} textAnchor="middle" fill="transparent" fontSize={0}>
            <title>{label}</title>
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
    
    return (
      <div key={chunkIndex} className={`w-full ${isMobile && chartChunks.length > 1 ? 'h-[320px]' : 'h-[320px]'} ${isMobile && chunkIndex > 0 ? 'mt-8' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 30, right: isMobile ? 0 : 16, left: 0, bottom: 56 }} barCategoryGap="20%">
            <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={renderXAxisTick}
            />
            {/* 왼쪽 축 라벨 제거 */}
            <YAxis hide domain={chunkYDomain} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { label: string; value: number };
                return (
                  <div className="rounded-[6px] bg-card border border-border px-3 py-1 text-[12px] text-foreground shadow-lg">
                    {p.label}: {p.value.toLocaleString()}건
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={42}>
              {data.map((entry: any, index) => {
                return (
                  <Cell key={`${entry.label}-${index}`} fill={entry.color} />
                );
              })}
              <LabelList dataKey="value" position="top" style={{ fill: "var(--neutral-60)", fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      {statusContent ?? (
        <div className="w-full">
          {isMobile && chartChunks.length > 1 ? (
            chartChunks.map((chunk, index) => renderChart(chunk, index))
          ) : (
            renderChart(chartData)
          )}
        </div>
      )}
      <StatsFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilter}
        defaults={filter}
        projectId={projectId}
        showTeam
        showMember
        teamOptions={teamOptions}
        getMemberOptions={getMemberOptions}
      />
    </>
  );
});

export default StatusBarChart;

