"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
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
import AssignmentCards from "@/components/stats/AssignmentCards";
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

function StatsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();

  useEffect(() => {
    document.title = "TalkGate - 통계";
  }, []);

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

  const active: TabKey = useMemo(() => {
    const q = (search.get("tab") || "apply").toLowerCase();
    return (TAB_ITEMS.find((t) => t.key === (q as TabKey))?.key ??
      "apply") as TabKey;
  }, [search]);

  // Query params handlers
  const setTab = (key: TabKey) => {
    const params = new URLSearchParams(search.toString());
    if (key === "apply") params.delete("tab");
    else params.set("tab", key);
    router.replace(`?${params.toString()}`);
  };

  const setApplyModeQS = (mode: "daily" | "monthly") => {
    const params = new URLSearchParams(search.toString());
    if (mode === "daily") params.delete("mode");
    else params.set("mode", mode);
    params.delete("applyPage");
    router.replace(`?${params.toString()}`);
    setApplyMode(mode);
    setApplyPage(1);
  };

  const setAssignModeQS = (mode: "team" | "member") => {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("assign");
    else params.set("assign", mode);
    router.replace(`?${params.toString()}`);
    setAssignMode(mode);
  };

  const setPaymentModeQS = (mode: "team" | "member") => {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("pay");
    else params.set("pay", mode);
    router.replace(`?${params.toString()}`);
    setPaymentMode(mode);
  };

  const setRankingModeQS = (mode: "team" | "member") => {
    const params = new URLSearchParams(search.toString());
    if (mode === "team") params.delete("rank");
    else params.set("rank", mode);
    router.replace(`?${params.toString()}`);
    setRankingMode(mode);
  };

  const setApplyPageQS = (page: number) => {
    const params = new URLSearchParams(search.toString());
    if (page <= 1) params.delete("applyPage");
    else params.set("applyPage", String(page));
    router.replace(`?${params.toString()}`);
    setApplyPage(page);
  };

  // Project state
  const hasProject = projectReady && Boolean(projectId);

  // Data hooks
  const registration = useStatsRegistration(projectId, applyPage);
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
          className="rounded-[14px] mb-4"
          title={
            <div className="flex items-end gap-3">
              <h1 className="text-[24px] leading-[20px] font-bold text-neutral-90">
                통계
              </h1>
              <span className="w-px h-4 bg-neutral-60 opacity-60" />
              <p className="text-[18px] leading-[20px] font-medium text-neutral-60">
                고객 신청, 배정, 처리상태, 결제, 랭킹 통계를 한눈에 확인하세요
              </p>
            </div>
          }
          bodyClassName="px-7 py-7 border-t border-neutral-30"
        >
          <div className="h-[48px] bg-neutral-20 rounded-[12px] px-3 flex items-center">
            <div className="flex items-center gap-2">
              {TAB_ITEMS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-[31px] rounded-[5px] px-8 text-[16px] cursor-pointer ${
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
            {/* 신청통계 그래프 카드 */}
            <section className="surface rounded-[14px] px-6 py-4 border border-border shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-neutral-90">
                  신청통계
                </h2>
                <div className="w-[240px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2">
                  <button
                    className={`min-h-[31px] rounded-[6px] text-[14px] ${
                      applyMode === "daily"
                        ? "bg-card font-semibold text-foreground"
                        : "text-neutral-60"
                    }`}
                    onClick={() => setApplyModeQS("daily")}
                  >
                    일간
                  </button>
                  <button
                    className={`min-h-[31px] rounded-[6px] text-[14px] ${
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
                  isLoading={registration.showChartSkeleton}
                  isError={registration.showChartError}
                  hasProject={hasProject}
                />
              </div>
            </section>

            {/* 상세 데이터 테이블 카드 */}
            <section className="mt-6 surface rounded-[14px] p-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
              <RegistrationDetailTable
                rows={registration.rows}
                isLoading={registration.showTableSkeleton}
                isError={registration.showTableError}
                hasProject={hasProject}
                currentPage={applyPage}
                totalPages={registration.totalPages}
                onPageChange={setApplyPageQS}
              />
            </section>
          </>
        )}

        {/* Assign Tab: 배정통계 */}
        {active === "assign" && (
          <section className="surface rounded-[14px] p-6 border border-border shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-90">
                배정통계
              </h2>
              <div className="w-[180px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2">
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
                  className={`min-h-[31px]rounded-[6px] text-[14px] ${
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
            {assignMode === "team" ? <AssignBarChart /> : <AssignMemberTable />}
          </section>
        )}

        {/* Payment Tab: 결제통계 */}
        {active === "payment" && (
          <section className="surface rounded-[14px] p-6 border border-border shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-neutral-90">
                결제통계
              </h2>
              <div className="w-[180px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2">
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
          <section className="surface rounded-[14px] p-6 border border-border shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
            <h2 className="text-[18px] font-semibold text-neutral-90">
              처리상태통계
            </h2>
            <div className="mt-2 text-[16px] text-neutral-90 font-semibold tracking-[0.02em]">
              상태별 분포
            </div>
            <div className="mt-4">
              <StatusBarChart />
            </div>
          </section>
        )}

        {/* Ranking Tab: 전체랭킹 */}
        {active === "ranking" && (
          <section className="surface rounded-[14px] p-6 border border-border shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-neutral-90">
                  전체랭킹
                </h2>
                <p className="mt-3 text-[14px] leading-[20px] font-medium text-neutral-60">
                  지난달 데이터를 집계하여 랭킹을 산정합니다.
                </p>
              </div>
              <div className="w-[180px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2">
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

            {/* 나의 랭킹 */}
            <div className="mt-[30px]">
              <h3 className="text-[16px] font-semibold text-neutral-90">나의 랭킹</h3>
            </div>
            <MyRankingCard projectId={projectId} mode={rankingMode} />

            {/* 팀별 / 팀원별 랭킹 리스트 */}
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

export default function StatsPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-neutral-60">불러오는 중...</div>
        </main>
      }
    >
      <StatsPage />
    </Suspense>
  );
}
