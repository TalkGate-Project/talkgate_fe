"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Panel from "@/components/common/Panel";
import ChartSkeleton from "@/components/common/ChartSkeleton";
import EmptyState from "@/components/common/EmptyState";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";

import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { CustomerPaymentWeeklyResponse } from "@/types/statistics";
import { formatMonthDay } from "@/utils/datetime";
import { formatCurrencyKR } from "@/utils/format";

const WEEKS = 6;

// 날짜로부터 "N월 N째주" 형식의 레이블을 생성하는 함수
function getWeekLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  
  const month = date.getMonth() + 1; // 1-12
  const dayOfMonth = date.getDate(); // 1-31
  const weekDay = date.getDay(); // 0(일) ~ 6(토)
  
  // 해당 월의 첫날
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
  
  // 해당 월에서 현재 주의 시작 요일(weekDay)과 같은 요일이 처음 나오는 날짜를 찾기
  let firstOccurrence = 1;
  if (firstDayOfWeek <= weekDay) {
    firstOccurrence = 1 + (weekDay - firstDayOfWeek);
  } else {
    firstOccurrence = 1 + (7 - firstDayOfWeek + weekDay);
  }
  
  // 첫 번째 발생일부터 현재 날짜까지 몇 주가 지났는지 계산
  let weekNumber;
  if (dayOfMonth < firstOccurrence) {
    // 현재 날짜가 이번 달의 첫 번째 해당 요일보다 이전이면 이전 달 주차
    // 이 경우 이전 달로 표시해야 하지만, 간단하게 처리
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthName = `${prevMonth}월`;
    return `${prevMonthName} 마지막주`;
  } else {
    weekNumber = Math.floor((dayOfMonth - firstOccurrence) / 7) + 1;
  }
  
  const weekNames = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];
  const weekName = weekNames[weekNumber - 1] || `${weekNumber}째주`;
  
  return `${month}월 ${weekName}`;
}

export default function StatsSection() {
  const router = useRouter();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const montserratStyle = { fontFamily: 'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui' };

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
        label: getWeekLabel(item.weekStartDate),
        amount: item.totalAmount,
        count: item.paymentCount,
      }))
      .reverse();
  }, [data]);

  // Compute dynamic domain and max value for labeling/highlighting
  const { domainMin, domainMax, maxAmount, maxIndex } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { domainMin: 0, domainMax: 0, maxAmount: 0, maxIndex: -1 };
    }
    const values = chartData.map((d) => d.amount);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const padding = span === 0 ? Math.max(1, Math.round(max * 0.1)) : Math.round(span * 0.15);
    const domainMin = Math.max(0, min - padding);
    const domainMax = max + padding;
    const maxIndex = values.findIndex((v) => v === max);
    return { domainMin, domainMax, maxAmount: max, maxIndex };
  }, [chartData]);

  const loading = isLoading && !data;
  const error = isError && !isFetching;
  const showEmpty = !loading && !error && (data?.data.data === null || chartData.length === 0);

  return (
    <Panel
      title={<span className="typo-title-4">주간 매출 통계</span>}
      action={<button onClick={() => router.push("/stats?tab=payment")} className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-border bg-card text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10">더보기</button>}
      className="rounded-[14px]"
      style={{ height: 420 }}
      headerClassName="flex items-center justify-between px-7 pt-[22px]"
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
            <AreaChart 
              data={chartData} 
              margin={{ left: 46, right: 12, top: 42, bottom: 12 }}
              onMouseMove={(state) => {
                if (state && state.isTooltipActive) {
                  const idx = state.activeTooltipIndex;
                  setActiveIndex(typeof idx === 'number' ? idx : null);
                } else {
                  setActiveIndex(null);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                <linearGradient id="dashboardWeekly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-60)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary-60)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
              <XAxis dataKey="label" tickMargin={8} stroke="var(--neutral-50)" tick={{ fill: "var(--neutral-60)", fontSize: 12 }} />
              {/** Hide Y axis ticks/lines per request, but keep domain to improve contrast */}
              <YAxis hide domain={[domainMin, domainMax]} />
              <Tooltip
                cursor={{ stroke: "var(--primary-60)" }}
                formatter={(value, _name, payload) => {
                  const entry = (payload?.payload as { count?: number }) ?? {};
                  const count = entry.count ?? 0;
                  return [`${formatCurrencyKR(Number(value ?? 0))}원`, `결제액 (${count.toLocaleString()}건)`];
                }}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  borderRadius: 8,
                  backgroundColor: "var(--card)",
                  border: `1px solid var(--border)`,
                  color: "var(--foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--primary-60)"
                strokeWidth={3}
                fill="url(#dashboardWeekly)"
                dot={{ r: 5, fill: "var(--primary-60)" }}
                activeDot={{ r: 7 }}
              >
                {/** Labels shown only on hover or for max value. Max point adds a separate black '최고점수' bubble above */}
                <LabelList
                  dataKey="amount"
                  position="top"
                  content={(props: any) => {
                    const { x, y, value, index } = props;
                    if (x == null || y == null) return null;
                    const isMax = index === maxIndex;
                    const isActive = index === activeIndex;
                    
                    // Show label only if it's the max or currently hovered
                    if (!isMax && !isActive) return null;
                    
                    const numeric = formatCurrencyKR(Number(value ?? 0));
                    const unit = "원";
                    const label = `${numeric}${unit}`;
                    const textY = y - 12; // place above the point
                    // Price bubble (always gray)
                    const rectWidth = Math.max(34, label.length * 8);
                    const rectX = x - rectWidth / 2;
                    const rectY = textY - 18;
                    return (
                      <g>
                        {/* gray price bubble */}
                        <rect
                          x={rectX}
                          y={rectY}
                          rx={6}
                          ry={6}
                          width={rectWidth}
                          height={22}
                          fill={"var(--neutral-20)"}
                          stroke={"var(--neutral-20)"}
                        />
                        <text x={x} y={rectY + 15} textAnchor={"middle"} fill={"var(--foreground)"} fontSize={12} fontWeight={600}>
                          <tspan style={montserratStyle}>{numeric}</tspan>
                          <tspan>{unit}</tspan>
                        </text>
                        {isMax ? (
                          <g>
                            {/* black '최고점수' bubble above with pointer */}
                            {(() => {
                              const badgeWidth = 64; // fixed width for 4 chars comfortably
                              const badgeHeight = 22;
                              const badgeX = x - badgeWidth / 2;
                              const badgeY = rectY - 28; // above price bubble
                              const cx = x;
                              return (
                                <g>
                                  <rect
                                    x={badgeX}
                                    y={badgeY}
                                    rx={6}
                                    ry={6}
                                    width={badgeWidth}
                                    height={badgeHeight}
                                    fill={"var(--foreground)"}
                                  />
                                  {/* pointer */}
                                  <polygon
                                    points={`${cx - 5},${badgeY + badgeHeight} ${cx + 5},${badgeY + badgeHeight} ${cx},${badgeY + badgeHeight + 6}`}
                                    fill={"var(--foreground)"}
                                  />
                                  <text x={x} y={badgeY + 15} textAnchor="middle" fill={"var(--card)"} fontSize={12} fontWeight={700}>
                                    최고점수
                                  </text>
                                </g>
                              );
                            })()}
                          </g>
                        ) : null}
                      </g>
                    );
                  }}
                />
              </Area>
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


