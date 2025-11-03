"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from "recharts";

import { getSelectedProjectId } from "@/lib/project";
import { StatisticsService } from "@/services/statistics";
import type { CustomerPaymentTeamRecord, CustomerPaymentByTeamResponse } from "@/types/statistics";

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
  const projectId = getSelectedProjectId();
  const { startDate, endDate } = getDefaultRange();

  const { data, isLoading, isError, isFetching } = useQuery<CustomerPaymentByTeamResponse>({
    queryKey: ["stats", "payment", "team", { projectId, startDate, endDate }],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerPaymentByTeam({ projectId, startDate, endDate });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    const records: Array<CustomerPaymentTeamRecord | null> = data?.data.data ?? [];
    return records
      .filter((record): record is CustomerPaymentTeamRecord => Boolean(record))
      .map((record) => ({
        team: record.teamName ?? "소속없음",
        amount: record.totalAmount ?? 0,
        count: record.paymentCount ?? 0,
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
        결제 통계를 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[12px] border border-dashed border-[#E2E2E2] bg-white px-6 text-[14px] text-[#808080]">
        표시할 결제 통계가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <defs>
            <linearGradient id="payGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#51F8A5" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EDEDED" vertical={false} />
          <XAxis dataKey="team" tick={{ fill: "#808080" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#808080" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            cursor={{ fill: "rgba(81,248,165,0.1)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const record = payload[0].payload as { team: string; amount: number; count: number };
              return (
                <div className="rounded-[6px] bg-black px-3 py-1 text-[12px] text-white">
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
              style={{ fill: "#808080", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-around text-[12px] text-[#808080]">
        {chartData.map((entry) => (
          <div key={entry.team} className="text-center">
            <div className="text-[#252525]">{entry.team}</div>
            <div>{NUMBER_FORMATTER.format(entry.count)}건</div>
          </div>
        ))}
      </div>
    </div>
  );
}

