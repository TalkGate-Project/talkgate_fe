"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Panel from "@/components/common/Panel";
import AssignMemberTable from "@/components/stats/AssignMemberTable";
import AssignBarChart from "@/components/stats/AssignBarChart";
import PaymentMemberTable from "@/components/stats/PaymentMemberTable";
import PaymentBarChart from "@/components/stats/PaymentBarChart";
import StatusBarChart from "@/components/stats/StatusBarChart";
import RegistrationChart from "@/components/stats/RegistrationChart";
import RegistrationDetailTable from "@/components/stats/RegistrationDetailTable";
import TeamRankingList from "@/components/stats/TeamRankingList";
import TeamMemberRankingList from "@/components/stats/TeamMemberRankingList";
import MyRankingCard from "@/components/stats/MyRankingCard";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useStatsRegistration } from "@/hooks/useStatsRegistration";
import { useStatsAssignment } from "@/hooks/useStatsAssignment";

type TabKey = "apply" | "assign" | "payment" | "status" | "ranking";

const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: "apply", label: "신청통계" },
  { key: "assign", label: "배정통계" },
  { key: "payment", label: "결제통계" },
  { key: "status", label: "처리상태" },
  { key: "ranking", label: "전체랭킹" },
];

function StatsPageContentInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();

  // State from query params
  const [applyMode, setApplyMode] = useState<"daily" | "monthly">(
    (search.get("mode") as any) === "monthly" ? "monthly" : "daily"
  );
  const [assignMode, setAssignMode] = useState<"team" | "member">(
    (search.get("assign") as any) === "member" ? "member" : "team"
  );
  const [paymentMode, setPaymentMode] = useState<"team" | "member">(
    (search.get("pay") as any) === "member" ? "member" : "team"
  );
  const [rankingMode, setRankingMode] = useState<"team" | "member">(
    (search.get("rank") as any) === "member" ? "member" : "team"
  );
  const [applyPage, setApplyPage] = useState(() => {
    const initial = Number.parseInt(search.get("applyPage") ?? "1", 10);
    return Number.isFinite(initial) && initial > 0 ? initial : 1;
  });
  const [applyStartDate, setApplyStartDate] = useState<Date | null>(null);
  const [applyEndDate, setApplyEndDate] = useState<Date | null>(null);

  const active: TabKey = useMemo(() => {
    const q = (search.get("tab") || "apply").toLowerCase();
    return (TAB_ITEMS.find((t) => t.key === (q as TabKey))?.key ??
      "apply") as TabKey;
  }, [search]);

  // Query param helpers
  const updateSearch = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(search.toString());
    updater(params);
    router.replace(`?${params.toString()}`);
  };

  const setTab = (key: TabKey) => {
    updateSearch((params) => {
      if (key === "apply") params.delete("tab");
      else params.set("tab", key);
    });
  };

  const setApplyModeQS = (mode: "daily" | "monthly") => {
    updateSearch((params) => {
      if (mode === "daily") params.delete("mode");
      else params.set("mode", mode);
      params.delete("applyPage");
    });
    setApplyMode(mode);
    setApplyPage(1);
  };

  const setAssignModeQS = (mode: "team" | "member") => {
    updateSearch((params) => {
      if (mode === "team") params.delete("assign");
      else params.set("assign", mode);
    });
    setAssignMode(mode);
  };

  const setPaymentModeQS = (mode: "team" | "member") => {
    updateSearch((params) => {
      if (mode === "team") params.delete("pay");
      else params.set("pay", mode);
    });
    setPaymentMode(mode);
  };

  const setRankingModeQS = (mode: "team" | "member") => {
    updateSearch((params) => {
      if (mode === "team") params.delete("rank");
      else params.set("rank", mode);
    });
    setRankingMode(mode);
  };

  const setApplyPageQS = (page: number) => {
    updateSearch((params) => {
      if (page <= 1) params.delete("applyPage");
      else params.set("applyPage", String(page));
    });
    setApplyPage(page);
  };

  // Project state
  const hasProject = projectReady && Boolean(projectId);

  // Date range helper for API
  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyDateRange = {
    startDate: formatDateForAPI(applyStartDate),
    endDate: formatDateForAPI(applyEndDate),
  };

  // Data hooks
  const registration = useStatsRegistration(projectId, applyPage, applyDateRange);
  const assignment = useStatsAssignment(projectId);

  const chartData =
    applyMode === "daily"
      ? registration.chartDailyData
      : registration.chartMonthlyData;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-12">
        {/* Top panel with tabs */}
        <Panel
          className="rounded-[14px] mb-9"
          title={
            <div className="flex items-end gap-4">
              <h1 className="text-[24px] leading-[20px] font-bold text-neutral-90">
                통계
              </h1>
              <span className="w-px h-4 bg-neutral-60 opacity-60" />
              <p className="text-[18px] leading-[20px] font-medium text-neutral-60">
                고객 신청, 배정, 처리상태, 결제, 랭킹 통계를 한눈에 확인하세요
              </p>
            </div>
          }
          bodyClassName="px-7 py-[30px] border-t border-neutral-30"
        >
          <div className="h-[48px] bg-neutral-20 rounded-[8px] px-3 flex items-center">
            <div className="flex items-center gap-2">
              {TAB_ITEMS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-[30px] rounded-[5px] px-8 text-[16px] cursor-pointer ${
                    active === t.key
                      ? "bg-card text-foreground font-bold"
                      : "text-neutral-60"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* Apply Tab: 신청통계 */}
        {active === "apply" && (
          <>
            <section className="surface rounded-[14px] px-7 pt-[17px] pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-neutral-90">
                  신청통계
                </h2>
                <div className="w-[248px] h-[48px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
                  <button
                    className={`cursor-pointer min-h-[31px] rounded-[6px] text-[14px] ${
                      applyMode === "daily"
                        ? "bg-card font-semibold text-foreground"
                        : "text-neutral-60"
                    }`}
                    onClick={() => setApplyModeQS("daily")}
                  >
                    일간
                  </button>
                  <button
                    className={`cursor-pointer min-h-[31px] rounded-[6px] text-[14px] ${
                      applyMode === "monthly"
                        ? "bg-card font-semibold text-foreground"
                        : "text-neutral-60"
                    }`}
                    onClick={() => setApplyModeQS("monthly")}
                  >
                    월간
                  </button>
                </div>
              </div>
              <div className="mt-4 h-[300px]">
                <RegistrationChart
                  data={chartData}
                  isLoading={
                    applyMode === "daily"
                      ? registration.showDailyChartSkeleton
                      : registration.showMonthlyChartSkeleton
                  }
                  isError={
                    applyMode === "daily"
                      ? registration.showDailyChartError
                      : registration.showMonthlyChartError
                  }
                  hasProject={hasProject}
                />
              </div>
            </section>

            <section className="mt-9 surface rounded-[14px] pt-6 px-7 pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
              <RegistrationDetailTable
                rows={registration.rows}
                isLoading={registration.showTableSkeleton}
                isError={registration.showTableError}
                hasProject={hasProject}
                currentPage={applyPage}
                totalPages={registration.totalPages}
                onPageChange={setApplyPageQS}
                startDate={applyStartDate}
                endDate={applyEndDate}
                onStartDateChange={(date) => {
                  setApplyStartDate(date);
                  setApplyPage(1);
                }}
                onEndDateChange={(date) => {
                  setApplyEndDate(date);
                  setApplyPage(1);
                }}
                onDateReset={() => {
                  setApplyStartDate(null);
                  setApplyEndDate(null);
                  setApplyPage(1);
                }}
              />
            </section>
          </>
        )}

        {/* Assign Tab: 배정통계 */}
        {active === "assign" && (
          <section className="surface rounded-[14px] px-7 pt-[17px] pb-[55px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex items-center justify-between h-[48px]">
              <h2 className="text-[18px] font-semibold text-neutral-90">
                배정통계
              </h2>
              <div className="w-[248px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    assignMode === "team"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setAssignModeQS("team")}
                >
                  팀별
                </button>
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    assignMode === "member"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setAssignModeQS("member")}
                >
                  팀원별
                </button>
              </div>
            </div>
            {assignMode === "team" ? (
              <AssignBarChart />
            ) : (
              <AssignMemberTable />
            )}
          </section>
        )}

        {/* Payment Tab: 결제통계 */}
        {active === "payment" && (
          <section className="surface rounded-[14px] px-7 pt-[17px] pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-90">
                결제통계
              </h2>
              <div className="w-[248px] h-[48px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    paymentMode === "team"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setPaymentModeQS("team")}
                >
                  팀별
                </button>
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    paymentMode === "member"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setPaymentModeQS("member")}
                >
                  팀원별
                </button>
              </div>
            </div>
            <div className="mt-3" />
            {paymentMode === "team" ? (
              <PaymentBarChart />
            ) : (
              <PaymentMemberTable />
            )}
          </section>
        )}

        {/* Status Tab: 처리상태 */}
        {active === "status" && (
          <section className="surface rounded-[14px] px-7 py-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <h2 className="text-[18px] font-semibold text-neutral-90">
              처리상태통계
            </h2>
            <div className="mt-[30px] text-[16px] text-neutral-90 font-semibold tracking-[0.02em]">
              상태별 분포
            </div>
            <div className="mt-[96px]">
              <StatusBarChart />
            </div>
          </section>
        )}

        {/* Ranking Tab: 전체랭킹 */}
        {active === "ranking" && (
          <section className="surface rounded-[14px] px-7 pt-[17px] pb-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex items-start justify-between">
              <div className="pt-[11px]">
                <h2 className="text-[18px] font-semibold text-neutral-90">
                  전체랭킹
                </h2>
                <p className="mt-3 text-[14px] leading-[20px] font-medium text-neutral-60">
                  지난달 데이터를 집계하여 랭킹을 산정합니다.
                </p>
              </div>
              <div className="w-[248px] h-[48px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    rankingMode === "team"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setRankingModeQS("team")}
                >
                  팀별
                </button>
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    rankingMode === "member"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setRankingModeQS("member")}
                >
                  팀원별
                </button>
              </div>
            </div>

            <MyRankingCard projectId={projectId} mode={rankingMode} />

            <div className="mt-6">
              <div className="text-[16px] font-semibold text-neutral-90 mb-3">
                {rankingMode === "team" ? "팀별 랭킹" : "팀원별 랭킹"}
              </div>
              {rankingMode === "team" ? (
                <TeamRankingList projectId={projectId} />
              ) : (
                <TeamMemberRankingList projectId={projectId} />
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function StatsPageContent() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-neutral-60">불러오는 중...</div>
        </main>
      }
    >
      <StatsPageContentInner />
    </Suspense>
  );
}



