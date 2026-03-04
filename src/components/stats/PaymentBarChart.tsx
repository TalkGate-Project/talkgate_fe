"use client";

import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useTeams } from "@/hooks/useMembersTree";
import { StatisticsService } from "@/services/statistics";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import type { CustomerPaymentTeamRecord, CustomerPaymentByTeamResponse } from "@/types/statistics";
import DateRangePicker from "@/components/common/DateRangePicker";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");
const MIN_CHART_WIDTH = 720;
const MIN_WIDTH_PER_BAR = 96;
const MAX_LABEL_WIDTH = 90;
const LABEL_FONT = "500 14px sans-serif";
let labelMeasureCanvas: HTMLCanvasElement | null = null;

function measureLabelWidth(label: string) {
  if (typeof document === "undefined") {
    return label.length * 8;
  }

  if (!labelMeasureCanvas) {
    labelMeasureCanvas = document.createElement("canvas");
  }

  const context = labelMeasureCanvas.getContext("2d");
  if (!context) {
    return label.length * 8;
  }

  context.font = LABEL_FONT;
  return context.measureText(label).width;
}

function truncateLabel(label: string, maxWidth: number) {
  if (measureLabelWidth(label) <= maxWidth) {
    return { text: label, truncated: false };
  }

  let left = 0;
  let right = label.length;
  let best = "...";

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const candidate = `${label.slice(0, middle)}...`;
    if (measureLabelWidth(candidate) <= maxWidth) {
      best = candidate;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return { text: best, truncated: true };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export default function PaymentBarChart() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  // Date range (Date objects for picker)
  const defaultRange = getDefaultRange();
  const [startDate, setStartDate] = useState<Date | null>(new Date(defaultRange.startDate));
  const [endDate, setEndDate] = useState<Date | null>(new Date(defaultRange.endDate));
  const formattedStart = startDate ? formatDate(startDate) : defaultRange.startDate;
  const formattedEnd = endDate ? formatDate(endDate) : defaultRange.endDate;
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [labelTooltip, setLabelTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const labelTooltipTimeoutRef = useRef<number | null>(null);
  const { data: teamsData } = useTeams(projectId);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data, isLoading, isError, isFetching } = useQuery<CustomerPaymentByTeamResponse>({
    queryKey: ["stats", "payment", "team", { projectId, startDate: formattedStart, endDate: formattedEnd }],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerPaymentByTeam({ projectId, startDate: formattedStart, endDate: formattedEnd });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const teamLeaderMap = useMemo(() => {
    const map = new Map<string, number>();
    if (teamsData) {
      teamsData.forEach((team) => {
        if (team.name && team.leaderMemberId) {
          map.set(team.name, team.leaderMemberId);
        }
      });
    }
    return map;
  }, [teamsData]);

  const chartData = useMemo(() => {
    const records = data?.data.data === null ? [] : (data?.data.data ?? []);
    return records
      .filter((record): record is CustomerPaymentTeamRecord => Boolean(record))
      .map((record) => ({
        team: record.teamName ?? "소속없음",
        amount: record.totalAmount ?? 0,
        count: record.paymentCount ?? 0,
      }));
  }, [data]);

  // 데이터가 많아지면 웹/모바일 모두 가로 스크롤 가능하도록 최소 너비 계산
  const minChartWidth = useMemo(() => {
    return Math.max(MIN_CHART_WIDTH, chartData.length * MIN_WIDTH_PER_BAR);
  }, [chartData.length]);

  const handleBarClick = (teamName: string) => {
    const leaderMemberId = teamLeaderMap.get(teamName);
    if (leaderMemberId) {
      setSelectedMemberId(leaderMemberId);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

  // X축 커스텀 렌더러: "팀명" + 아래 줄 "N건"
  const teamToCount = useMemo(
    () => Object.fromEntries(chartData.map((d) => [d.team, d.count])) as Record<string, number>,
    [chartData]
  );

  const clearLabelTooltipTimeout = () => {
    if (labelTooltipTimeoutRef.current !== null) {
      window.clearTimeout(labelTooltipTimeoutRef.current);
      labelTooltipTimeoutRef.current = null;
    }
  };

  const showLabelTooltip = (text: string, x: number, y: number) => {
    setLabelTooltip({ text, x, y: y - 8 });
  };

  const hideLabelTooltip = () => {
    clearLabelTooltipTimeout();
    setLabelTooltip(null);
  };

  const handleLabelTouch = (
    event: React.TouchEvent<SVGTextElement>,
    text: string,
    x: number,
    y: number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    clearLabelTooltipTimeout();
    showLabelTooltip(text, x, y);
    labelTooltipTimeoutRef.current = window.setTimeout(() => {
      setLabelTooltip(null);
      labelTooltipTimeoutRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      clearLabelTooltipTimeout();
    };
  }, []);

  useEffect(() => {
    const closeTooltip = () => setLabelTooltip(null);
    window.addEventListener("scroll", closeTooltip, true);
    window.addEventListener("resize", closeTooltip);

    return () => {
      window.removeEventListener("scroll", closeTooltip, true);
      window.removeEventListener("resize", closeTooltip);
    };
  }, []);

  const renderXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const label: string = payload?.value ?? "";
    const count = teamToCount[label] ?? 0;
    const { text: truncatedLabel, truncated } = truncateLabel(label, MAX_LABEL_WIDTH);

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize={14}
          fontWeight={500}
          style={{ cursor: truncated ? "help" : "default" }}
          onMouseEnter={() => {
            if (!truncated || isMobile) return;
            showLabelTooltip(label, x, y);
          }}
          onMouseLeave={() => {
            if (!truncated || isMobile) return;
            hideLabelTooltip();
          }}
          onTouchStart={(event) => {
            if (!truncated) return;
            handleLabelTouch(event, label, x, y);
          }}
        >
          {truncatedLabel}
        </text>
        <text
          x={0}
          y={0}
          dy={32}
          textAnchor="middle"
          fill="var(--neutral-60)"
          fontSize={14}
          fontWeight={500}
        >
          {NUMBER_FORMATTER.format(count)}건
        </text>
      </g>
    );
  };

  // Header (subtitle + 날짜 선택 영역) - 항상 표시
  const Header = (
    <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between">
      <h3 className="text-[16px] font-semibold text-foreground">팀별 매출 현황</h3>
      <div className="h-0 border-b border-neutral-30 md:hidden my-3"></div>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
        onReset={() => {
          const r = getDefaultRange();
          setStartDate(new Date(r.startDate));
          setEndDate(new Date(r.endDate));
        }}
        showInlineIcon
      />
    </div>
  );

  if (waitingForProject) {
    return (
      <div className="w-full">
        {Header}
        <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6">
          <LoadingSpinner size="2xl" />
        </div>
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="w-full">
        {Header}
        <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="w-full">
        {Header}
        <div className="flex h-[320px] items-center justify-center">
          <LoadingSpinner size="2xl" />
        </div>
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="w-full">
        {Header}
        <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 px-6 text-[14px] text-danger-40">
          결제 통계를 불러오는 중 문제가 발생했습니다.
        </div>
      </div>
    );
  }

  const rawRecords = data?.data.data;
  const hasRecords = Array.isArray(rawRecords) && rawRecords.length > 0;

  if (!hasRecords || !chartData.length) {
    return (
      <div className="w-full">
        {Header}
        <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
          {rawRecords === null || rawRecords === undefined ? "결제 통계 데이터가 없습니다." : "표시할 결제 통계가 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {Header}
      <div className="relative h-[320px] overflow-x-auto overflow-y-hidden">
        <div className="h-full" style={{ minWidth: `${minChartWidth}px` }}>
          {labelTooltip && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[6px] border border-border bg-card px-2 py-1 text-[12px] text-foreground shadow-lg whitespace-nowrap"
              style={{ left: `${labelTooltip.x}px`, top: `${Math.max(8, labelTooltip.y)}px` }}
            >
              {labelTooltip.text}
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: isMobile ? 0 : 16, left: 0, bottom: 56 }}>
          <defs>
            <linearGradient id="payGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-40)" stopOpacity={0.75} />
              <stop offset="100%" stopColor="var(--primary-20)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
          <XAxis
            dataKey="team"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={renderXAxisTick}
          />
          {/* 왼쪽 축 라벨 제거 */}
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(0,226,114,0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const record = payload[0].payload as { team: string; amount: number; count: number };
              return (
                <div className="rounded-[6px] bg-card border border-border px-3 py-1 text-[12px] text-foreground shadow-lg">
                  {NUMBER_FORMATTER.format(record.amount)}원 / {NUMBER_FORMATTER.format(record.count)}건
                </div>
              );
            }}
          />
          <Bar 
            dataKey="amount" 
            fill="url(#payGradient)" 
            radius={[8, 8, 0, 0]} 
            barSize={56}
            onClick={(data: any) => {
              if (data && data.team) {
                handleBarClick(data.team);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <LabelList
              dataKey="amount"
              position="top"
              formatter={(label: unknown) =>
                typeof label === "number" ? `${NUMBER_FORMATTER.format(label)}원` : String(label ?? "")
              }
              style={{ fill: "var(--neutral-60)", fontSize: 12 }}
            />
          </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      {selectedMemberId !== null && (
        <TeamMemberInfoModal
          open={isModalOpen}
          memberId={selectedMemberId}
          onClose={handleCloseModal}
          projectId={projectId}
        />
      )}
    </div>
  );
}

