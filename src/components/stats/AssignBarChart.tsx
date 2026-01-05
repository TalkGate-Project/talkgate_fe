"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList, Cell } from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import { MembersService } from "@/services/members";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import type { CustomerAssignmentByTeamResponse } from "@/types/statistics";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

// 팀별 색상 (피그마 디자인): 번갈아가며 반복 적용
const BAR_COLORS = ["#ADF6D2", "#FFDE81", "#FC9595", "#7EA5F8"];

export default function AssignBarChart() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingLeader, setIsLoadingLeader] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      color: BAR_COLORS[index % BAR_COLORS.length],
      teamId: item.teamId,
    }));
  }, [data]);

  const handleBarClick = async (teamId: number | null) => {
    if (!teamId || isLoadingLeader) return;
    
    try {
      setIsLoadingLeader(true);
      const response = await MembersService.getTeamLeaderMemberDetail(teamId);
      const leaderMemberId = response.data?.data?.id;
      if (leaderMemberId) {
        setSelectedMemberId(leaderMemberId);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch team leader:", error);
    } finally {
      setIsLoadingLeader(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

  // Y축 도메인 계산 (최댓값에 14% 여유 추가)
  const yDomain = useMemo(() => {
    const maxValue = Math.max(...chartData.map(d => d.value), 0);
    return [0, Math.ceil(maxValue * 1.14)];
  }, [chartData]);

  if (waitingForProject) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <LoadingSpinner size="xl" />
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
        <LoadingSpinner size="xl" />
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
      <h3 className="mt-5 mb-2 text-[16px] font-semibold text-foreground">팀별 배정 현황</h3>
      <div className="h-[310px] mt-[94px]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 30, right: isMobile ? 0 : 20, bottom: 30, left: isMobile ? 0 : 20 }} barCategoryGap="20%">
          <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tickMargin={30}
            tick={(props: any) => {
              const { x, y, payload, index } = props;
              const teamName = payload.value;
              const teamId = chartData[index]?.teamId ?? null;
              return (
                <g transform={`translate(${x},${y})`} focusable="false" style={{ outline: 'none' }}>
                  <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize={12}
                    fontFamily="var(--font-montserrat)"
                    fontWeight={500}
                    focusable="false"
                    style={{ cursor: teamId ? "pointer" : "default", outline: 'none' }}
                    onClick={() => handleBarClick(teamId)}
                  >
                    {teamName}
                  </text>
                </g>
              );
            }}
          />
          <YAxis hide domain={yDomain} />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]} 
            barSize={42}
            onClick={(data: any) => {
              if (data && data.teamId) {
                handleBarClick(data.teamId);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              offset={10}
              content={(props: any) => {
                const { x, y, value, payload } = props;
                if (!payload || value === undefined) return null;
                const numValue = typeof value === 'number' ? value : Number(value);
                const formattedValue = `${NUMBER_FORMATTER.format(numValue)}건`;
                const teamId = payload.teamId ?? null;
                
                return (
                  <g focusable="false" style={{ outline: 'none' }}>
                    <text
                      x={x}
                      y={y}
                      fill="var(--foreground)"
                      fontSize="12px"
                      fontWeight="500"
                      fontFamily="var(--font-montserrat)"
                      textAnchor="middle"
                      focusable="false"
                      style={{ cursor: teamId ? "pointer" : "default", outline: 'none' }}
                      onClick={() => handleBarClick(teamId)}
                    >
                      {formattedValue}
                    </text>
                  </g>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      {selectedMemberId !== null && (
        <TeamMemberInfoModal
          open={isModalOpen}
          memberId={selectedMemberId}
          onClose={handleCloseModal}
          projectId={projectId}
        />
      )}
    </>
  );
}

