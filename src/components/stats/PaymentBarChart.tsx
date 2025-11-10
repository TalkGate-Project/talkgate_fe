"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { CustomerPaymentTeamRecord, CustomerPaymentByTeamResponse } from "@/types/statistics";
import DateRangePicker from "@/components/common/DateRangePicker";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

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

  // X축 커스텀 렌더러: "팀명" + 아래 줄 "N건"
  const teamToCount = useMemo(
    () => Object.fromEntries(chartData.map((d) => [d.team, d.count])) as Record<string, number>,
    [chartData]
  );

  const renderXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const label: string = payload?.value ?? "";
    const count = teamToCount[label] ?? 0;
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
        결제 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (data?.data.data === null || !chartData.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
        {data?.data.data === null ? "결제 통계 데이터가 없습니다." : "표시할 결제 통계가 없습니다."}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-neutral-90">팀별 결제 현황</h3>
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
        />
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 56 }}>
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
                <div className="rounded-[6px] bg-neutral-90 px-3 py-1 text-[12px] text-neutral-0">
                  {NUMBER_FORMATTER.format(record.amount)}원 / {NUMBER_FORMATTER.format(record.count)}건
                </div>
              );
            }}
          />
          <Bar dataKey="amount" fill="url(#payGradient)" radius={[8, 8, 0, 0]} barSize={56}>
            <LabelList
              dataKey="amount"
              position="top"
              formatter={(label: unknown): ReactNode =>
                typeof label === "number" ? `${NUMBER_FORMATTER.format(label)}원` : (label as ReactNode)
              }
              style={{ fill: "var(--neutral-60)", fontSize: 12 }}
            />
          </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

