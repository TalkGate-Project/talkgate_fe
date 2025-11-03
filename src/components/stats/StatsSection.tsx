"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Panel from "@/components/common/Panel";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { CustomerPaymentWeeklyRecord, CustomerPaymentWeeklyResponse } from "@/types/statistics";

const WEEKS = 6;

export default function StatsSection() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const { data, isLoading, isError, isFetching } = useQuery<CustomerPaymentWeeklyResponse>({
    queryKey: ["dashboard", "weekly-payments", projectId, { weeks: WEEKS }],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerPaymentWeekly({ projectId, weeks: WEEKS });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const chartData = useMemo(() => {
    const records = data?.data.data === null ? [] : (data?.data.data ?? []);
    return records
      .map((item) => ({
        label: `${formatDate(item.weekStartDate)}~${formatDate(item.weekEndDate)}`,
        amount: item.totalAmount,
        count: item.paymentCount,
      }))
      .reverse();
  }, [data]);

  const loading = isLoading && !data;
  const error = isError && !isFetching;
  const showEmpty = !loading && !error && (data?.data.data === null || chartData.length === 0);

  return (
    <Panel
      title={<span className="typo-title-2">주간 매출 통계</span>}
      action={<button className="h-[34px] px-3 rounded-[5px] border border-border bg-card text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10">더보기</button>}
      className="rounded-[14px]"
      style={{ height: 420 }}
      bodyClassName="px-6 pb-6 pt-4"
    >
      <div className="h-[320px]">
        {waitingForProject ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
          </div>
        ) : missingProject ? (
          <EmptyState message="프로젝트를 먼저 선택해주세요." />
        ) : loading ? (
          <ChartSkeleton />
        ) : error ? (
          <EmptyState message="주간 매출 통계를 불러오는 중 문제가 발생했습니다." error />
        ) : showEmpty ? (
          <EmptyState message={data?.data.data === null ? "주간 매출 통계 데이터가 없습니다." : "표시할 데이터가 없습니다."} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <defs>
                <linearGradient id="dashboardWeekly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-60)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary-60)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
              <XAxis dataKey="label" tickMargin={8} stroke="var(--neutral-50)" tick={{ fill: "var(--neutral-60)", fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="var(--neutral-50)" tick={{ fill: "var(--neutral-60)" }} />
              <Tooltip
                cursor={{ stroke: "var(--primary-60)" }}
                formatter={(value, _name, payload) => {
                  const entry = (payload?.payload as { count?: number }) ?? {};
                  const count = entry.count ?? 0;
                  return [`${formatCurrency(Number(value ?? 0))}원`, `결제액 (${count.toLocaleString()}건)`];
                }}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  borderRadius: 8,
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  color: "var(--foreground)",
                }}
              />
              <Area type="monotone" dataKey="amount" stroke="var(--primary-60)" strokeWidth={3} fill="url(#dashboardWeekly)" dot={{ r: 4, fill: "var(--primary-60)" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}.${day}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR");
}

function EmptyState({ message, error }: { message: string; error?: boolean }) {
  return (
    <div className={`flex h-full items-center justify-center text-[14px] ${error ? "text-danger-40" : "text-neutral-60"}`}>
      {message}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="mx-6 h-8 animate-pulse rounded bg-neutral-20" />
      ))}
    </div>
  );
}


