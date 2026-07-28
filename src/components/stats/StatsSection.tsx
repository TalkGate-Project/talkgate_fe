"use client";

import { useMemo, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Panel from "@/components/common/Panel";
import ChartSkeleton from "@/components/common/ChartSkeleton";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
  const firstOccurrence =
    firstDayOfWeek <= weekDay
      ? 1 + (weekDay - firstDayOfWeek)
      : 1 + (7 - firstDayOfWeek + weekDay);

  // 첫 번째 발생일부터 현재 날짜까지 몇 주가 지났는지 계산
  if (dayOfMonth < firstOccurrence) {
    // 현재 날짜가 이번 달의 첫 번째 해당 요일보다 이전이면 이전 달 주차
    // 이 경우 이전 달로 표시해야 하지만, 간단하게 처리
    const prevMonth = month === 1 ? 12 : month - 1;
    return `${prevMonth}월 마지막주`;
  }

  const weekNumber = Math.floor((dayOfMonth - firstOccurrence) / 7) + 1;
  return `${month}월 ${weekNumber}주`;
}

// 모바일용: 날짜로부터 "N월N주" 형식의 레이블을 생성하는 함수
function getWeekLabelMobile(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const month = date.getMonth() + 1; // 1-12
  const dayOfMonth = date.getDate(); // 1-31
  const weekDay = date.getDay(); // 0(일) ~ 6(토)

  // 해당 월의 첫날
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)

  // 해당 월에서 현재 주의 시작 요일(weekDay)과 같은 요일이 처음 나오는 날짜를 찾기
  const firstOccurrence =
    firstDayOfWeek <= weekDay
      ? 1 + (weekDay - firstDayOfWeek)
      : 1 + (7 - firstDayOfWeek + weekDay);

  // 첫 번째 발생일부터 현재 날짜까지 몇 주가 지났는지 계산
  if (dayOfMonth < firstOccurrence) {
    // 현재 날짜가 이번 달의 첫 번째 해당 요일보다 이전이면 이전 달 주차
    // 이 경우 이전 달로 표시해야 하지만, 간단하게 처리
    const prevMonth = month === 1 ? 12 : month - 1;
    return `${prevMonth}월 마지막주`;
  }

  const weekNumber = Math.floor((dayOfMonth - firstOccurrence) / 7) + 1;
  return `${month}월 ${weekNumber}주`;
}

export default function StatsSection() {
  const router = useRouter();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const isMobile = useIsMobile();
  const [canRenderChart, setCanRenderChart] = useState(false);
  const montserratStyle = {
    fontFamily:
      'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui',
  };

  useEffect(() => {
    setCanRenderChart(true);
  }, []);

  const { data, isLoading, isError, isFetching } =
    useQuery<CustomerPaymentWeeklyResponse>({
      queryKey: ["dashboard", "weekly-payments", projectId, { weeks: WEEKS }],
      enabled: hasProject,
      queryFn: async () => {
        if (!projectId) throw new Error("프로젝트를 선택해주세요.");
        const res = await StatisticsService.customerPaymentWeekly({
          projectId,
          weeks: WEEKS,
        });
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
      placeholderData: (previous) => previous,
    });

  const chartData = useMemo(() => {
    const records = data?.data.data === null ? [] : data?.data.data ?? [];
    return records
      .map((item) => ({
        label: isMobile
          ? getWeekLabelMobile(item.weekStartDate)
          : getWeekLabel(item.weekStartDate),
        amount: item.totalAmount,
        count: item.paymentCount,
      }))
      .reverse();
  }, [data, isMobile]);

  // Compute dynamic domain and max value for labeling/highlighting
  const { domainMin, domainMax, maxAmount, maxIndex } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { domainMin: 0, domainMax: 0, maxAmount: 0, maxIndex: -1 };
    }
    const values = chartData.map((d) => d.amount);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const padding =
      span === 0 ? Math.max(1, Math.round(max * 0.1)) : Math.round(span * 0.15);
    const domainMin = Math.max(0, min - padding);
    const domainMax = max + padding;
    const maxIndex = values.findIndex((v) => v === max);
    return { domainMin, domainMax, maxAmount: max, maxIndex };
  }, [chartData]);

  const loading = isLoading && !data;
  const error = isError && !isFetching;
  const showEmpty =
    !loading && !error && (data?.data.data === null || chartData.length === 0);

  return (
    <Panel
      title={
        <div className="flex gap-2 text-[14px] md:typo-title-4 font-semibold relative">
          <span>주간 매출 통계</span>
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="cursor-pointer"
            >
              <path
                d="M10 13.3333V10M10 6.66667H10.0083M17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5C14.1421 17.5 17.5 14.1421 17.5 10Z"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  top: "150%",
                  left: "100%",
                  transform: "translateX(-17%)",
                  marginBottom: "8px",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "209px",
                    minHeight: "120px",
                    background: "#00000099",
                    borderRadius: "5px",
                    padding: "12px",
                    fontFamily: "'Nunito Sans', sans-serif",
                    fontSize: "12px",
                    lineHeight: "16px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  {/* Pointer */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      left: "20px",
                      width: 0,
                      height: 0,
                      borderLeft: "9px solid transparent",
                      borderRight: "9px solid transparent",
                      borderBottom: "8px solid #00000099",
                    }}
                  />
                  <div style={{ marginBottom: "8px", fontWeight: 600 }}>
                    주간 매출 통계란?
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    결제 데이터를 주간 단위로 집계하여 최근 n주의 매출 변화를
                    확인할 수 있는 통계입니다.
                  </div>
                  <div>
                    본인 또는 본인이 관리하는 하위 멤버의 결제 건만 합산되어
                    표시됩니다.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      }
      action={
        <button
          onClick={() => router.push("/stats?tab=payment")}
          className="cursor-pointer h-[24px] md:h-[34px] w-[42px] md:w-auto md:px-3 rounded-[5px] border border-border bg-card text-[11px] md:text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10"
        >
          더보기
        </button>
      }
      className="rounded-[14px]"
      style={{ height: 420, boxShadow: "6px 6px 54px 0px rgba(0, 0, 0, 0.05)" }}
      headerClassName="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-[22px]"
      bodyClassName="px-4 md:px-6 pb-4 md:pb-6 pt-4 md:pt-4"
    >
      <div className="h-[320px] min-h-[320px] min-w-0">
        {waitingForProject ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="2xl" />
          </div>
        ) : missingProject ? (
          <EmptyState message="프로젝트를 먼저 선택해주세요." />
        ) : loading ? (
          <ChartSkeleton />
        ) : error ? (
          <EmptyState
            message="주간 매출 통계를 불러오는 중 문제가 발생했습니다."
            error
          />
        ) : showEmpty ? (
          <EmptyState
            message={
              data?.data.data === null
                ? "주간 매출 통계 데이터가 없습니다."
                : "표시할 데이터가 없습니다."
            }
          />
        ) : !canRenderChart ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={320} minWidth={0}>
            <AreaChart
              data={chartData}
              margin={{ left: isMobile ? 12 : 46, right: isMobile ? 28 : 60, top: 42, bottom: 12 }}
              onMouseMove={(state) => {
                if (state && state.isTooltipActive) {
                  const idx = state.activeTooltipIndex;
                  setActiveIndex(typeof idx === "number" ? idx : null);
                } else {
                  setActiveIndex(null);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                <linearGradient
                  id="dashboardWeekly"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary-60)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary-60)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
              <XAxis
                dataKey="label"
                tickMargin={8}
                stroke="var(--neutral-50)"
                tick={{ fill: "var(--neutral-60)", fontSize: 12 }}
              />
              {/** Hide Y axis ticks/lines per request, but keep domain to improve contrast */}
              <YAxis hide domain={[domainMin, domainMax]} />
              <Tooltip
                cursor={{ stroke: "var(--primary-60)" }}
                offset={-40}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const value = payload[0]?.value;
                  const formatted = formatCurrencyKR(Number(value ?? 0));
                  return (
                    <div
                      style={{
                        position: "relative",
                        background: "#E2E2E2",
                        borderRadius: 5,
                        padding: "5px 10px",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#474747",
                        textAlign: "center",
                        minWidth: 60,
                        transform: "translateY(-20px)",
                      }}
                    >
                      {formatted}원{/* pointer */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: -6,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 0,
                          height: 0,
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderTop: "6px solid #E2E2E2",
                        }}
                      />
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--primary-60)"
                strokeWidth={3}
                fill="url(#dashboardWeekly)"
                dot={{
                  r: 5,
                  fill: "var(--primary-60)",
                  stroke: "var(--primary-60)",
                  strokeWidth: 0,
                  opacity: 0.9,
                }}
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
                        <text
                          x={x}
                          y={rectY + 15}
                          textAnchor={"middle"}
                          fill={"var(--foreground)"}
                          fontSize={12}
                          fontWeight={600}
                        >
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
                                    points={`${cx - 5},${
                                      badgeY + badgeHeight
                                    } ${cx + 5},${badgeY + badgeHeight} ${cx},${
                                      badgeY + badgeHeight + 6
                                    }`}
                                    fill={"var(--foreground)"}
                                  />
                                  <text
                                    x={x}
                                    y={badgeY + 15}
                                    textAnchor="middle"
                                    fill={"var(--card)"}
                                    fontSize={12}
                                    fontWeight={700}
                                  >
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
