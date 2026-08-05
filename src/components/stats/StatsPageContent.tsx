"use client";

import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Panel from "@/components/common/Panel";
import AssignMemberTable, { type AssignMemberTableHandle } from "@/components/stats/AssignMemberTable";
import AssignBarChart, { type AssignBarChartHandle } from "@/components/stats/AssignBarChart";
import PaymentDetailTable from "@/components/stats/PaymentDetailTable";
import PaymentMemberTable from "@/components/stats/PaymentMemberTable";
import PaymentBarChart from "@/components/stats/PaymentBarChart";
import StatusBarChart, { type StatusBarChartHandle } from "@/components/stats/StatusBarChart";
import RegistrationChart from "@/components/stats/RegistrationChart";
import RegistrationDetailTable from "@/components/stats/RegistrationDetailTable";
import TeamRankingList from "@/components/stats/TeamRankingList";
import TeamMemberRankingList from "@/components/stats/TeamMemberRankingList";
import MyRankingCard from "@/components/stats/MyRankingCard";
import MonthSelector from "@/components/common/MonthSelector";
import CurrentProjectBadge from "@/components/common/CurrentProjectBadge";
import FeePaymentStatusPanel from "@/components/stats/fee/FeePaymentStatusPanel";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { useStatsRegistration } from "@/hooks/useStatsRegistration";
import { useDebtReliefMenu } from "@/hooks/useDebtReliefMenu";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { useMembersTreeWithoutParent, useTeams } from "@/hooks/useMembersTree";
import { getCurrentRankingMonthStart } from "@/utils/datetime";
import StatsChartFilterButton from "@/components/stats/StatsChartFilterButton";
import StatsFilterChips from "@/components/stats/StatsFilterChips";
import type { StatsFilterValues } from "@/components/stats/StatsFilterModal";
import { readStatsFilter, writeStatsFilter } from "@/components/stats/statsFilterParams";
import type { Option } from "@/components/common/filterFields";
import type { MemberTreeNode } from "@/types/membersTree";

type TabKey = "apply" | "assign" | "payment" | "status" | "ranking" | "fee";

const BASE_TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: "apply", label: "신청통계" },
  { key: "assign", label: "배정통계" },
  { key: "payment", label: "매출통계" },
  { key: "status", label: "카테고리" },
  { key: "ranking", label: "전체랭킹" },
];

const FEE_TAB_ITEM: { key: TabKey; label: string } = {
  key: "fee",
  label: "채무조정",
};

function findNodeById(nodes: MemberTreeNode[], id: number): MemberTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.descendants ?? [], id);
    if (found) return found;
  }
  return null;
}

function flattenMembers(node: MemberTreeNode): Option[] {
  const result: Option[] = [{ label: node.name, value: node.id }];
  (node.descendants ?? []).forEach((child) => {
    result.push(...flattenMembers(child));
  });
  return result;
}

function getStatsFilterPrefix(active: TabKey, assignMode: "team" | "member"): string | null {
  if (active === "assign") return assignMode === "member" ? "am" : "at";
  if (active === "status") return "st";
  return null;
}

function StatsPageContentInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const { project, isLoading: isProjectLoading } = useCurrentProjectDetail();
  const [showFeeTab, feeTabReady] = useDebtReliefMenu();

  const tabItems = useMemo(() => {
    if (feeTabReady && showFeeTab) {
      return [...BASE_TAB_ITEMS, FEE_TAB_ITEM];
    }
    return BASE_TAB_ITEMS;
  }, [feeTabReady, showFeeTab]);

  // State from query params
  const [applyMode, setApplyMode] = useState<"daily" | "monthly">(
    (search.get("mode") as any) === "monthly" ? "monthly" : "daily"
  );
  const [assignMode, setAssignMode] = useState<"team" | "member">(
    (search.get("assign") as any) === "member" ? "member" : "team"
  );
  const [paymentMode, setPaymentMode] = useState<"team" | "member" | "detail">(
    (() => {
      const paymentQuery = search.get("pay");
      if (paymentQuery === "member") return "member";
      if (paymentQuery === "detail") return "detail";
      return "team";
    })()
  );
  const [rankingMode, setRankingMode] = useState<"team" | "member">(
    (search.get("rank") as any) === "member" ? "member" : "team"
  );
  const [rankingMonth, setRankingMonth] = useState<Date | null>(() => {
    const monthParam = search.get("month");
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      if (year && month && month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }

    return getCurrentRankingMonthStart();
  });
  const [applyPage, setApplyPage] = useState(() => {
    const initial = Number.parseInt(search.get("applyPage") ?? "1", 10);
    return Number.isFinite(initial) && initial > 0 ? initial : 1;
  });
  const [applyStartDate, setApplyStartDate] = useState<Date | null>(null);
  const [applyEndDate, setApplyEndDate] = useState<Date | null>(null);
  const assignMemberTableRef = useRef<AssignMemberTableHandle>(null);
  const assignBarChartRef = useRef<AssignBarChartHandle>(null);
  const statusChartRef = useRef<StatusBarChartHandle>(null);
  const { data: teamsData } = useTeams(projectId);
  const { data: treeData } = useMembersTreeWithoutParent(projectId);
  // 탭 개수가 늘면서 태블릿 폭에서 탭 줄이 잘려 눌리지도 않던 문제 — 드래그로도 스크롤되게 한다.
  // 스크롤바 자체가 scrollbar-hide로 안 보여서 드래그가 아니면 마우스로는 스크롤할 방법이 없다.
  const { containerRef: tabScrollRef, dragScrollHandlers: tabDragScrollHandlers } =
    useHorizontalDragScroll<HTMLDivElement>();
  const tabButtonRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});

  const handleAssignFilterClick = () => {
    if (assignMode === "member") {
      assignMemberTableRef.current?.openFilter();
      return;
    }
    assignBarChartRef.current?.openFilter();
  };

  const handleStatusFilterClick = () => {
    statusChartRef.current?.openFilter();
  };

  const active: TabKey = useMemo(() => {
    const q = (search.get("tab") || "apply").toLowerCase();
    const matched = tabItems.find((t) => t.key === (q as TabKey))?.key;
    // 회생·파산 미대상 프로젝트에서 ?tab=fee 접근 시 신청통계로 폴백
    if (q === "fee" && (!feeTabReady || !showFeeTab)) {
      return "apply";
    }
    return (matched ?? "apply") as TabKey;
  }, [search, tabItems, feeTabReady, showFeeTab]);

  // URL 직접 진입·뒤로가기 등으로 active가 바뀌었을 때 탭 줄이 그 탭을 가리고 있으면 스크롤을
  // 맞춰 보이게 한다. scrollIntoView 대신 컨테이너 scrollLeft만 직접 계산·조정해서 페이지
  // 자체가 세로로 스크롤되는(scrollIntoView의 부수효과) 일이 없게 했다. useLayoutEffect로 페인트
  // 전에 맞춰서 잘못된 스크롤 위치가 한 프레임이라도 보이지 않게 한다.
  useLayoutEffect(() => {
    const container = tabScrollRef.current;
    const activeButton = tabButtonRefs.current[active];
    if (!container || !activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    if (buttonRect.left < containerRect.left) {
      container.scrollLeft += buttonRect.left - containerRect.left;
    } else if (buttonRect.right > containerRect.right) {
      container.scrollLeft += buttonRect.right - containerRect.right;
    }
  }, [active, tabScrollRef]);

  const statsFilterPrefix = getStatsFilterPrefix(active, assignMode);
  const appliedStatsFilter = useMemo(
    () => (statsFilterPrefix ? readStatsFilter(search, statsFilterPrefix) : {}),
    [search, statsFilterPrefix]
  );

  const teamOptions = useMemo<Option[]>(
    () => (teamsData ?? []).map((team) => ({ label: team.name, value: team.id })),
    [teamsData]
  );

  const memberOptions = useMemo<Option[]>(() => {
    if (!appliedStatsFilter.teamId || !teamsData || !treeData) return [];
    const team = teamsData.find((item) => item.id === appliedStatsFilter.teamId);
    if (!team) return [];
    const leaderNode = findNodeById(treeData, team.leaderMemberId);
    return leaderNode ? flattenMembers(leaderNode) : [];
  }, [appliedStatsFilter.teamId, teamsData, treeData]);

  const updateStatsFilter = useCallback(
    (nextFilter: StatsFilterValues) => {
      if (!statsFilterPrefix) return;
      const params = new URLSearchParams(search.toString());
      writeStatsFilter(params, statsFilterPrefix, nextFilter);
      if (active === "assign" && assignMode === "member") {
        params.delete("assignPage");
      }
      router.replace(`?${params.toString()}`);
    },
    [active, assignMode, router, search, statsFilterPrefix]
  );

  const removeStatsFilter = useCallback(
    (key: keyof StatsFilterValues) => {
      const nextFilter = { ...appliedStatsFilter, [key]: undefined };
      if (key === "teamId") nextFilter.memberId = undefined;
      updateStatsFilter(nextFilter);
    },
    [appliedStatsFilter, updateStatsFilter]
  );

  const removeStatsDateRange = useCallback(
    (type: "application" | "assigned") => {
      const nextFilter =
        type === "application"
          ? {
              ...appliedStatsFilter,
              applicationDateStart: undefined,
              applicationDateEnd: undefined,
            }
          : {
              ...appliedStatsFilter,
              assignedAtStart: undefined,
              assignedAtEnd: undefined,
            };
      updateStatsFilter(nextFilter);
    },
    [appliedStatsFilter, updateStatsFilter]
  );

  const resetStatsFilters = useCallback(() => {
    updateStatsFilter({});
  }, [updateStatsFilter]);

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

  const setPaymentModeQS = (mode: "team" | "member" | "detail") => {
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

  const navigateRankingMonth = (direction: "prev" | "next") => {
    if (!rankingMonth) return;
    const newMonth = new Date(rankingMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setRankingMonth(newMonth);
    updateSearch((params) => {
      const monthStr = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, "0")}`;
      params.set("month", monthStr);
    });
  };

  const handleRankingMonthChange = (date: Date) => {
    setRankingMonth(date);
    updateSearch((params) => {
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      params.set("month", monthStr);
    });
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

  const chartData =
    applyMode === "daily"
      ? registration.chartDailyData
      : registration.chartMonthlyData;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-9 md:pb-12">
        {/* Top panel with tabs */}
        <Panel
          className="rounded-none md:rounded-[14px] md:mb-9"
          title={
            <div className="flex w-full min-w-0 items-center justify-between gap-3 md:items-start">
              <div className="flex min-w-0 items-end gap-4">
                <h1 className="translate-y-[3px] text-[18px] md:text-[24px] md:leading-[20px] font-bold text-neutral-90">
                  통계
                </h1>
                <span className="hidden md:block w-px h-4 bg-neutral-60 opacity-60" />
                {/* 태블릿(md~lg, 예: 797px)에서는 제목+구분선+설명+프로젝트 배지가 한 줄에 다
                    안 들어가 개행되던 문제 — 이 구간만 설명 글자 크기를 줄여 폭을 확보한다. */}
                <p className="hidden md:block translate-y-[3px] text-[13px] md:leading-4 lg:text-[18px] lg:leading-5 font-medium text-neutral-60">
                  고객 신청, 배정, 카테고리, 결제, 랭킹 통계를 한눈에 확인하세요
                </p>
              </div>
              <CurrentProjectBadge
                projectName={project?.name}
                projectLogoUrl={project?.logoUrl}
                loading={isProjectLoading}
                className="max-w-[60%] justify-end md:max-w-[240px]"
              />
            </div>
          }
          bodyClassName="px-7 py-[30px] border-t border-neutral-30"
        >
          <div
            ref={tabScrollRef}
            className="md:h-[48px] md:bg-neutral-20 md:rounded-[8px] md:px-3 md:flex md:items-center overflow-x-auto scrollbar-hide px-0 md:px-3 relative"
            {...tabDragScrollHandlers}
          >
            {/* min-w-0로 md 이상에서 이 줄을 눌러서 맞추면(shrink) 탭이 잘려 보이던 문제 —
                min-w-max를 항상 유지해 넘칠 때 줄이지 않고 그대로 overflow-x-auto로 넘긴다. */}
            <div className="flex items-center gap-6 md:gap-2 min-w-max relative">
              {/* 전체 연속된 기본 border - 탭 전체 너비를 커버하도록 내부 컨테이너에 적용 */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0F0F0] dark:bg-neutral-30 md:hidden" />
              {tabItems.map((t) => (
                <button
                  key={t.key}
                  ref={(el) => {
                    tabButtonRefs.current[t.key] = el;
                  }}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-col items-start gap-3 h-[33px] md:h-[30px] md:flex-row md:items-center md:rounded-[5px] md:px-8 text-[16px] leading-[19px] tracking-[0.2px] cursor-pointer whitespace-nowrap relative ${
                    active === t.key
                      ? "text-ink md:bg-card md:text-foreground font-semibold md:font-bold"
                      : "text-neutral-60 font-medium md:font-normal"
                  }`}
                >
                  <span>{t.label}</span>
                  {/* 활성 탭 border (검은색, 기본 border 위에 표시) */}
                  {active === t.key && (
                    <div className="h-[2px] w-full md:hidden bg-neutral-100 dark:bg-neutral-80 absolute bottom-0 left-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* Apply Tab: 신청통계 */}
        {active === "apply" && (
          <>
            <section className="surface md:rounded-[14px] px-6 md:px-7 pt-[17px] pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="hidden md:block text-[18px] font-semibold text-neutral-90">
                  신청통계
                </h2>
                <div className="w-full md:max-w-[248px] h-[48px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
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

            <section className="md:mt-9 surface md:rounded-[14px] pt-6 px-6 md:px-7 pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
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
          <section className="surface md:rounded-[14px] px-6 md:px-7 pt-[17px] pb-[55px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex items-center justify-between h-[48px]">
              <div className="flex flex-1 min-w-0 items-center gap-3">
                <h2 className="hidden md:block shrink-0 text-[18px] font-semibold text-neutral-90">
                  배정통계
                </h2>
                <StatsChartFilterButton onClick={handleAssignFilterClick} />
                <StatsFilterChips
                  filters={appliedStatsFilter}
                  onRemove={removeStatsFilter}
                  onRemoveDateRange={removeStatsDateRange}
                  onResetAll={resetStatsFilters}
                  teamOptions={teamOptions}
                  showTeam={assignMode === "member"}
                />
              </div>
              <div className="w-full md:max-w-[248px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
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
              <AssignBarChart ref={assignBarChartRef} />
            ) : (
              <AssignMemberTable ref={assignMemberTableRef} />
            )}
          </section>
        )}

        {/* Payment Tab: 매출통계 */}
        {active === "payment" && (
          <section className="surface md:rounded-[14px] px-6 md:px-7 pt-[17px] pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="hidden md:block text-[18px] font-semibold text-neutral-90">
                매출통계
              </h2>
              <div className="w-full md:max-w-[372px] h-[48px] bg-neutral-20 rounded-[8px] grid grid-cols-3 px-3 py-2 gap-3">
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
                <button
                  className={`min-h-[31px] rounded-[6px] text-[14px] ${
                    paymentMode === "detail"
                      ? "bg-card font-semibold text-foreground"
                      : "text-neutral-60"
                  } cursor-pointer`}
                  onClick={() => setPaymentModeQS("detail")}
                >
                  건별
                </button>
              </div>
            </div>
            <div className="mt-3" />
            {paymentMode === "team" ? (
              <PaymentBarChart />
            ) : paymentMode === "member" ? (
              <PaymentMemberTable />
            ) : (
              <PaymentDetailTable />
            )}
          </section>
        )}

        {/* Status Tab: 카테고리 */}
        {active === "status" && (
          <section className="surface md:rounded-[14px] px-6 md:px-7 md:py-[30px] md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="hidden md:block shrink-0 text-[18px] font-semibold text-neutral-90">
                카테고리 통계
              </h2>
              <StatsChartFilterButton onClick={handleStatusFilterClick} />
              <StatsFilterChips
                filters={appliedStatsFilter}
                onRemove={removeStatsFilter}
                onRemoveDateRange={removeStatsDateRange}
                onResetAll={resetStatsFilters}
                teamOptions={teamOptions}
                memberOptions={memberOptions}
                showTeam
                showMember
              />
            </div>
            <div className="md:mt-4 md:mt-[30px] text-[16px] text-neutral-90 font-semibold tracking-[0.02em]">
              상태별 분포
            </div>
            <div className="mt-6 md:mt-[96px]">
              <StatusBarChart ref={statusChartRef} />
            </div>
          </section>
        )}

        {/* Ranking Tab: 전체랭킹 */}
        {active === "ranking" && (
          <section className="surface md:rounded-[14px] px-4 md:px-7 md:pt-[17px] pb-4 md:pb-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
            <div className="flex items-start justify-between">
              <div className="pt-[11px]">
                <h2 className="hidden md:block text-[18px] font-semibold text-neutral-90">
                  전체랭킹
                </h2>
                <p className="hidden md:block mt-3 text-[14px] leading-[20px] font-medium text-neutral-60">
                  월단위로 랭킹을 확인할 수 있습니다. 이번달 랭킹은 실시간으로 집계하여 반영됩니다.
                </p>
              </div>
              <div className="w-full md:max-w-[248px] h-[48px] bg-neutral-20 rounded-[8px] grid grid-cols-2 px-3 py-2 gap-3">
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

            {/* Month selector */}
            <div className="mt-4 md:mt-6">
              <MonthSelector
                selectedMonth={rankingMonth}
                onNavigateMonth={navigateRankingMonth}
                onMonthChange={handleRankingMonthChange}
              />
            </div>

            <MyRankingCard projectId={projectId} mode={rankingMode} month={rankingMonth} />

            <div className="mt-4 md:mt-6">
              <div className="text-[16px] font-semibold text-neutral-90 mb-3">
                {rankingMode === "team" ? "팀별 랭킹" : "팀원별 랭킹"}
              </div>
              {rankingMode === "team" ? (
                <TeamRankingList projectId={projectId} month={rankingMonth} />
              ) : (
                <TeamMemberRankingList projectId={projectId} month={rankingMonth} />
              )}
            </div>
          </section>
        )}

        {/* Fee Tab: 회생·파산 — debt-relief 프로젝트에서만 렌더 */}
        {active === "fee" && feeTabReady && showFeeTab && (
          <FeePaymentStatusPanel />
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



