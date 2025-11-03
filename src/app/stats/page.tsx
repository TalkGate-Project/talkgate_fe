"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, BarChart, Bar, LabelList, Cell } from "recharts";
import AssignMemberTable from "@/components/stats/AssignMemberTable";
import AssignProgressList from "@/components/stats/AssignProgressList";
import PaymentMemberTable from "@/components/stats/PaymentMemberTable";
import PaymentBarChart from "@/components/stats/PaymentBarChart";
import StatusBarChart from "@/components/stats/StatusBarChart";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type {
  CustomerRegistrationRecord,
  CustomerRegistrationResponse,
  CustomerAssignmentTeamRecord,
  CustomerAssignmentByTeamResponse,
  RankingTeamRecord,
  RankingTeamResponse,
  RankingMemberRecord,
  RankingMemberResponse,
} from "@/types/statistics";

type TabKey = "apply" | "assign" | "payment" | "status" | "ranking";
const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: "apply", label: "신청통계" },
  { key: "assign", label: "배정통계" },
  { key: "payment", label: "결제통계" },
  { key: "status", label: "처리상태" },
  { key: "ranking", label: "전체랭킹" },
];

const APPLY_TABLE_LIMIT = 10;
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");
const ASSIGN_COLORS = [
  "var(--primary-20)",
  "var(--warning-20)",
  "var(--danger-20)",
  "var(--secondary-20)",
  "var(--secondary-10)",
  "var(--secondary-40)",
];

function formatChartDay(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}.${day}`;
}

function formatChartMonth(input: string) {
  const [year, month] = input.split("-");
  if (!year || !month) return input;
  return `${year.slice(-2)}.${month}`;
}

function formatTableDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function StatsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();

  useEffect(() => {
    document.title = "TalkGate - 통계";
  }, []);
  const [applyMode, setApplyMode] = useState<"daily" | "monthly">((search.get("mode") as any) === "monthly" ? "monthly" : "daily");
  const [assignMode, setAssignMode] = useState<"team" | "member">((search.get("assign") as any) === "member" ? "member" : "team");
  const [paymentMode, setPaymentMode] = useState<"team" | "member">((search.get("pay") as any) === "member" ? "member" : "team");
  const [rankingMode, setRankingMode] = useState<"team" | "member">((search.get("rank") as any) === "member" ? "member" : "team");
  const [applyPage, setApplyPage] = useState(() => {
    const initial = Number.parseInt(search.get("applyPage") ?? "1", 10);
    return Number.isFinite(initial) && initial > 0 ? initial : 1;
  });
  const active: TabKey = useMemo(() => {
    const q = (search.get("tab") || "apply").toLowerCase();
    return (TAB_ITEMS.find((t) => t.key === (q as TabKey))?.key ?? "apply") as TabKey;
  }, [search]);

  function setTab(key: TabKey) {
    const params = new URLSearchParams(search.toString());
    if (key === "apply") params.delete("tab"); else params.set("tab", key);
    router.replace(`?${params.toString()}`);
  }

  function setApplyModeQS(mode: "daily" | "monthly") {
    const params = new URLSearchParams(search.toString());
    if (mode === "daily") params.delete("mode"); else params.set("mode", mode);
    params.delete("applyPage");
    router.replace(`?${params.toString()}`);
    setApplyMode(mode);
    setApplyPage(1);
  }

  function setAssignModeQS(mode: "team" | "member") {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("assign"); else params.set("assign", mode);
    router.replace(`?${params.toString()}`);
    setAssignMode(mode);
  }

  function setPaymentModeQS(mode: "team" | "member") {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("pay"); else params.set("pay", mode);
    router.replace(`?${params.toString()}`);
    setPaymentMode(mode);
  }

  function setRankingModeQS(mode: "team" | "member") {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("rank"); else params.set("rank", mode);
    router.replace(`?${params.toString()}`);
    setRankingMode(mode);
  }

  function setApplyPageQS(page: number) {
    const params = new URLSearchParams(search.toString());
    if (page <= 1) params.delete("applyPage"); else params.set("applyPage", String(page));
    router.replace(`?${params.toString()}`);
    setApplyPage(page);
  }

  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const registrationTableQuery = useQuery<
    CustomerRegistrationResponse,
    Error,
    CustomerRegistrationResponse,
    ["stats", "registration", "table", { projectId: string | null; page: number; limit: number }]
  >({
    queryKey: ["stats", "registration", "table", { projectId, page: applyPage, limit: APPLY_TABLE_LIMIT }],
    enabled: hasProject,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerRegistration({
        projectId,
        page: applyPage,
        limit: APPLY_TABLE_LIMIT,
      });
      return res.data;
    },
  });

  const registrationChartQuery = useQuery<
    CustomerRegistrationResponse
  >({
    queryKey: ["stats", "registration", "chart", projectId],
    enabled: hasProject,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerRegistration({
        projectId,
        page: 1,
        limit: 30,
      });
      return res.data;
    },
  });

  const chartDailyData = useMemo(() => {
    const records: CustomerRegistrationRecord[] = registrationChartQuery.data?.data.data ?? [];
    const sorted = [...records].sort((a, b) => new Date(a.statisticsDate).getTime() - new Date(b.statisticsDate).getTime());
    return sorted.map((item) => ({ x: formatChartDay(item.statisticsDate), y: item.totalCount }));
  }, [registrationChartQuery.data]);

  const chartMonthlyData = useMemo(() => {
    const records: CustomerRegistrationRecord[] = registrationChartQuery.data?.data.data ?? [];
    const map = new Map<string, number>();
    records.forEach((item) => {
      const key = item.statisticsDate.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + item.totalCount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => ({ x: formatChartMonth(key), y: value }));
  }, [registrationChartQuery.data]);

  const registrationPayload = registrationTableQuery.data?.data;
  const registrationRows: CustomerRegistrationRecord[] = registrationPayload?.data ?? [];
  const registrationTotalCount = registrationPayload?.totalCount ?? 0;
  const registrationLimit = registrationPayload?.limit ?? APPLY_TABLE_LIMIT;
  const registrationTotalPages = Math.max(1, Math.ceil(registrationTotalCount / registrationLimit));
  const registrationPageNumbers = useMemo(
    () => Array.from({ length: registrationTotalPages }, (_, idx) => idx + 1),
    [registrationTotalPages]
  );

  const showChartSkeleton = registrationChartQuery.isLoading && !registrationChartQuery.data;
  const showChartError = registrationChartQuery.isError && !registrationChartQuery.isFetching;
  const showTableSkeleton = registrationTableQuery.isLoading && !registrationTableQuery.data;
  const showTableError = registrationTableQuery.isError && !registrationTableQuery.isFetching;

  const assignmentTeamQuery = useQuery<
    CustomerAssignmentByTeamResponse
  >({
    queryKey: ["stats", "assignment", "team-overview", projectId],
    enabled: hasProject,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerAssignmentByTeam({ projectId });
      return res.data;
    },
  });

  const chartData = applyMode === "daily" ? chartDailyData : chartMonthlyData;
  const chartHasData = chartData.length > 0;

  const assignmentTeams: CustomerAssignmentTeamRecord[] = assignmentTeamQuery.data?.data.data ?? [];
  const assignmentCards = useMemo(
    () =>
      [...assignmentTeams]
        .sort((a, b) => b.totalAssignedCount - a.totalAssignedCount)
        .slice(0, 4)
        .map((team, index) => ({
          ...team,
          color: ASSIGN_COLORS[index % ASSIGN_COLORS.length],
        })),
    [assignmentTeams]
  );
  const assignCardsLoading = assignmentTeamQuery.isLoading && !assignmentTeamQuery.data;
  const assignCardsError = assignmentTeamQuery.isError && !assignmentTeamQuery.isFetching;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-6 pb-12">
        {/* Top card with tabs */}
        <section className="surface rounded-[14px] p-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-bold text-neutral-90">통계</h1>
            <span className="w-px h-4 bg-neutral-60 opacity-60" />
            <p className="text-[18px] text-neutral-60">고객 신청, 배정, 처리상태, 결제, 랭킹 통계를 한눈에 확인하세요</p>
          </div>
          <div className="mt-5 h-[48px] bg-neutral-20 rounded-[12px] px-3 flex items-center">
            <div className="flex items-center gap-2">
              {TAB_ITEMS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-[31px] rounded-[5px] px-8 text-[16px] cursor-pointer ${active===t.key? 'bg-card text-foreground font-bold' : 'text-neutral-60'} `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic containers per tab */}
        {active === "apply" && (
          <>
            {/* 신청통계 그래프 카드 */}
            <section className="mt-6 surface rounded-[14px] p-6 border border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-neutral-90">신청통계</h2>
                <div className="h-[36px] w-[240px] bg-neutral-20 rounded-[8px] grid grid-cols-2 p-1">
                  <button className={`rounded-[6px] text-[14px] ${applyMode==='daily'?'bg-card font-semibold text-foreground':'text-neutral-60'}`} onClick={()=> setApplyModeQS('daily')}>일간</button>
                  <button className={`rounded-[6px] text-[14px] ${applyMode==='monthly'?'bg-card font-semibold text-foreground':'text-neutral-60'}`} onClick={()=> setApplyModeQS('monthly')}>월간</button>
                </div>
              </div>
              <div className="mt-4 h-[300px]">
                {waitingForProject ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
                  </div>
                ) : missingProject ? (
                  <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
                    프로젝트를 먼저 선택해주세요.
                  </div>
                ) : showChartSkeleton ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
                  </div>
                ) : showChartError ? (
                  <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
                    신청 통계를 불러오는 중 문제가 발생했습니다.
                  </div>
                ) : !chartHasData ? (
                  <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
                    표시할 데이터가 없습니다.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="applyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary-40)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--primary-40)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--neutral-20)" vertical={false} />
                      <XAxis dataKey="x" tick={{ fill: "var(--neutral-60)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--neutral-60)" }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip
                        cursor={{ stroke: "var(--primary-40)", strokeWidth: 1, opacity: 0.25 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const v = payload[0].value as number;
                          return (
                            <div className="rounded-[6px] bg-neutral-90 px-3 py-1 text-[12px] text-neutral-0">
                              {NUMBER_FORMATTER.format(v)}건
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="y" stroke="none" fill="url(#applyGradient)" />
                      <Line type="monotone" dataKey="y" stroke="var(--primary-40)" strokeWidth={2} dot={{ r: 5, fill: "var(--primary-60)", stroke: "var(--primary-40)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
            {/* 상세 데이터 테이블 카드 */}
            <section className="mt-6 surface rounded-[14px] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-neutral-90">상세 데이터</h3>
                <div className="flex items-center gap-3">
                  <div className="w-[175px] h-[34px] border border-border rounded-[5px] px-2 grid grid-cols-[1fr_auto] items-center text-[14px]"><span className="opacity-90">연도 . 월 . 일</span><span className="w-5 h-5 border-2 border-neutral-40 rounded" /></div>
                  <span className="mx-1 text-neutral-60">-</span>
                  <div className="w-[175px] h-[34px] border border-border rounded-[5px] px-2 grid grid-cols-[1fr_auto] items-center text-[14px]"><span className="opacity-90">연도 . 월 . 일</span><span className="w-5 h-5 border-2 border-neutral-40 rounded" /></div>
                </div>
              </div>
              <div className="mt-4 h-px bg-neutral-30" />
              <div className="mt-4">
                <div className="grid grid-cols-5 text-[16px] text-neutral-60 font-semibold">
                  <div className="px-4 py-2">날짜</div>
                  <div className="px-4 py-2">신청 건수</div>
                  <div className="px-4 py-2">직접입력</div>
                  <div className="px-4 py-2">엑셀 업로드</div>
                  <div className="px-4 py-2">API</div>
                </div>
                <div className="divide-y divide-neutral-30 min-h-[240px]">
                  {waitingForProject ? (
                    <div className="flex h-[160px] items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
                    </div>
                  ) : missingProject ? (
                    <div className="flex h-[160px] items-center justify-center text-[14px] text-neutral-60">
                      프로젝트를 먼저 선택해주세요.
                    </div>
                  ) : showTableSkeleton ? (
                    <ApplyTableSkeleton rows={APPLY_TABLE_LIMIT} />
                  ) : showTableError ? (
                    <div className="flex h-[160px] items-center justify-center text-[14px] text-danger-40">
                      데이터를 불러오는 중 오류가 발생했습니다.
                    </div>
                  ) : registrationRows.length === 0 ? (
                    <div className="flex h-[160px] items-center justify-center text-[14px] text-neutral-60">
                      표시할 데이터가 없습니다.
                    </div>
                  ) : (
                    registrationRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-5 text-[14px] text-neutral-90 opacity-80">
                        <div className="px-4 py-3">{formatTableDate(row.statisticsDate)}</div>
                        <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.totalCount)}건</div>
                        <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.directInputCount)}건</div>
                        <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.excelUploadCount)}건</div>
                        <div className="px-4 py-3">{NUMBER_FORMATTER.format(row.apiCount)}건</div>
                      </div>
                    ))
                  )}
                </div>
                {hasProject && registrationRows.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      className="w-8 h-8 rounded-full grid place-items-center border-2 border-neutral-40 rotate-90 disabled:border-neutral-30 disabled:text-neutral-40"
                      onClick={() => setApplyPageQS(Math.max(1, applyPage - 1))}
                      disabled={applyPage <= 1}
                    />
                    {registrationPageNumbers.map((num) => (
                      <button
                        key={num}
                        className={`w-8 h-8 rounded-full grid place-items-center ${num===applyPage? 'bg-neutral-90 text-neutral-0' : 'text-neutral-60'}`}
                        onClick={() => setApplyPageQS(num)}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      className="w-8 h-8 rounded-full grid place-items-center border-2 border-neutral-40 -rotate-90 disabled:border-neutral-30 disabled:text-neutral-40"
                      onClick={() => setApplyPageQS(Math.min(registrationTotalPages, applyPage + 1))}
                      disabled={applyPage >= registrationTotalPages}
                    />
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {active === "assign" && (
          <section className="mt-6 surface rounded-[14px] p-6 border border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-90">배정통계</h2>
              <div className="h-[36px] w-[180px] bg-neutral-20 rounded-[8px] grid grid-cols-2 p-1">
                <button className={`rounded-[6px] text-[14px] ${assignMode==='team'?'bg-card font-semibold text-foreground':'text-neutral-60'} cursor-pointer`} onClick={()=> setAssignModeQS('team')}>팀별</button>
                <button className={`rounded-[6px] text-[14px] ${assignMode==='member'?'bg-card font-semibold text-foreground':'text-neutral-60'} cursor-pointer`} onClick={()=> setAssignModeQS('member')}>팀원별</button>
              </div>
            </div>
            {assignMode === 'team' ? (
              <>
                {/* 팀별 배정 현황 카드들 */}
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {waitingForProject ? (
                    <div className="col-span-full flex h-[70px] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
                    </div>
                  ) : missingProject ? (
                    <div className="col-span-full flex h-[70px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
                      프로젝트를 먼저 선택해주세요.
                    </div>
                  ) : assignCardsLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-[70px] rounded-[12px] bg-neutral-10 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-pulse rounded-full bg-neutral-20" />
                          <span className="h-4 w-20 animate-pulse rounded bg-neutral-20" />
                        </div>
                        <span className="h-4 w-10 animate-pulse rounded bg-neutral-20" />
                      </div>
                    ))
                  ) : assignCardsError ? (
                    <div className="col-span-full flex h-[70px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
                      팀별 배정 데이터를 불러오는 중 문제가 발생했습니다.
                    </div>
                  ) : !assignmentCards.length ? (
                    <div className="col-span-full flex h-[70px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
                      표시할 팀별 배정 데이터가 없습니다.
                    </div>
                  ) : (
                    assignmentCards.map((item) => (
                      <div key={`${item.teamId ?? 'none'}-${item.teamName ?? 'unknown'}`} className="h-[70px] bg-neutral-10 rounded-[12px] px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full" style={{ background: item.color }} />
                          <span className="text-[18px] font-bold text-neutral-90">{item.teamName ?? "소속없음"}</span>
                        </div>
                        <span className="text-[14px] text-neutral-90">{NUMBER_FORMATTER.format(item.totalAssignedCount)}건</span>
                      </div>
                    ))
                  )}
                </div>
                {/* 진행바 목록 */}
                <AssignProgressList />
              </>
            ) : (
              <AssignMemberTable />
            )}
          </section>
        )}

        {active === "payment" && (
          <section className="mt-6 surface rounded-[14px] p-6 border border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-90">결제통계</h2>
              <div className="h-[36px] w-[180px] bg-neutral-20 rounded-[8px] grid grid-cols-2 p-1">
                <button className={`rounded-[6px] text-[14px] ${paymentMode==='team'?'bg-card font-semibold text-foreground':'text-neutral-60'} cursor-pointer`} onClick={()=> setPaymentModeQS('team')}>팀별</button>
                <button className={`rounded-[6px] text-[14px] ${paymentMode==='member'?'bg-card font-semibold text-foreground':'text-neutral-60'} cursor-pointer`} onClick={()=> setPaymentModeQS('member')}>팀원별</button>
              </div>
            </div>
            <div className="mt-6" />
            {paymentMode === 'team' ? <PaymentBarChart /> : <PaymentMemberTable />}
          </section>
        )}

        {active === "status" && (
          <section className="mt-6 surface rounded-[14px] p-6 border border-border">
            <h2 className="text-[18px] font-semibold text-neutral-90">처리상태통계</h2>
            <div className="mt-2 text-[16px] text-neutral-90 opacity-80">상태별 분포</div>
            <div className="mt-4">
              <StatusBarChart />
            </div>
          </section>
        )}

        {active === "ranking" && (
          <section className="mt-6 surface rounded-[14px] p-6 border border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-90">전체랭킹</h2>
              <div className="h-[36px] w-[180px] bg-neutral-20 rounded-[8px] grid grid-cols-2 p-1">
                <button className={`rounded-[6px] text-[14px] ${rankingMode==='team'?'bg-card font-semibold text-foreground':'text-neutral-60'} cursor-pointer`} onClick={()=> setRankingModeQS('team')}>팀별</button>
                <button className={`rounded-[6px] text-[14px] ${rankingMode==='member'?'bg-card font-semibold text-foreground':'text-neutral-60'} cursor-pointer`} onClick={()=> setRankingModeQS('member')}>팀원별</button>
              </div>
            </div>

            {rankingMode === 'team' ? <TeamRankingList projectId={projectId} /> : <TeamMemberRankingList projectId={projectId} />}
          </section>
        )}
      </div>
    </main>
  );
}

// components moved out to '@/components/stats/*'

// inlined modal removed; using '@/components/MemberStatsFilterModal'

function TeamRankingList({ projectId }: { projectId: string | null }) {
  const { data, isLoading, isError, isFetching } = useQuery<RankingTeamResponse>({
    queryKey: ["stats", "ranking", "team", projectId],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.rankingTeam({ projectId, page: 1, limit: 5 });
      return res.data;
    },
  });

  const payload = data?.data;
  const rows: RankingTeamRecord[] = payload?.data ?? [];

  if (!projectId) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
        팀 랭킹을 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        표시할 팀 랭킹 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-6 bg-neutral-10 rounded-[12px] p-5">
      <div className="space-y-3">
        {rows.map((row) => {
          const change = row.rankChange ?? 0;
          const changeLabel = change > 0 ? `+${change}` : change < 0 ? `${change}` : "-";
          const badgeColor = change > 0 ? "bg-primary-10 text-primary-100" : change < 0 ? "bg-danger-10 text-danger-60" : "bg-neutral-20 text-neutral-70";
          return (
            <div key={`${row.teamId}-${row.teamName}-${row.rank}`} className="surface rounded-[12px] h-[88px] flex items-center px-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[60px] h-[60px] rounded-[12px] bg-secondary-10 grid place-items-center text-[18px] font-bold text-neutral-60">
                  #{row.rank}
                </div>
                <div>
                  <div className="text-[18px] font-bold text-neutral-90">{row.teamName ?? "소속없음"}</div>
                  <div className="mt-1 text-[14px] text-neutral-90">₩ {NUMBER_FORMATTER.format(row.totalAmount)}원 / {NUMBER_FORMATTER.format(row.totalCount)}건</div>
                </div>
              </div>
              <div className={`px-3 h-[25px] rounded-full grid place-items-center text-[14px] font-bold ${badgeColor}`}>
                {changeLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamMemberRankingList({ projectId }: { projectId: string | null }) {
  const { data, isLoading, isError, isFetching } = useQuery<RankingMemberResponse>({
    queryKey: ["stats", "ranking", "member", projectId],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.rankingMember({ projectId, page: 1, limit: 5 });
      return res.data;
    },
  });

  const payload = data?.data;
  const rows: RankingMemberRecord[] = payload?.data ?? [];

  if (!projectId) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        프로젝트를 먼저 선택해주세요.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
      </div>
    );
  }

  if (isError && !isFetching) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
        팀원 랭킹을 불러오는 중 문제가 발생했습니다.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
        표시할 팀원 랭킹 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="mt-6 bg-neutral-10 rounded-[12px] p-5">
      <div className="space-y-3">
        {rows.map((row) => {
          const changeRate = row.amountChangeRate ?? "0";
          const rateValue = Number.parseFloat(changeRate);
          const badgeColor = Number.isNaN(rateValue)
            ? "bg-neutral-20 text-neutral-70"
            : rateValue >= 0
              ? "bg-primary-10 text-primary-100"
              : "bg-danger-10 text-danger-60";
          const badgeLabel = Number.isNaN(rateValue) ? "-" : `${rateValue > 0 ? "+" : ""}${rateValue}%`;
          return (
            <div key={`${row.memberId}-${row.memberName}`} className="surface rounded-[12px] h-[88px] flex items-center px-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-[60px] h-[60px] rounded-[12px] bg-secondary-10 grid place-items-center text-[18px] font-bold text-neutral-60">
                  #{row.rank}
                </div>
                <div>
                  <div className="text-[18px] font-bold text-neutral-90 flex items-center gap-2">
                    {row.memberName}
                    <span className="text-[14px] font-medium text-neutral-60">
                      {typeof row.previousRank === "number" ? `전 순위 ${row.previousRank}` : "전 순위 정보 없음"}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] text-neutral-90">₩ {NUMBER_FORMATTER.format(row.totalAmount)}원</div>
                </div>
              </div>
              <div className={`px-3 h-[25px] rounded-full grid place-items-center text-[14px] font-bold ${badgeColor}`}>
                {badgeLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApplyTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-5 px-4 py-3">
          {Array.from({ length: 5 }).map((__, colIdx) => (
            <div key={colIdx} className="h-4 w-full rounded bg-neutral-20 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function StatsPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-60">불러오는 중...</div>
      </main>
    }>
      <StatsPage />
    </Suspense>
  );
}
