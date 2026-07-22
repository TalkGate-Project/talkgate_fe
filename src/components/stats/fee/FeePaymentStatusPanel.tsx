"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DateRangePicker from "@/components/common/DateRangePicker";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useProjectType } from "@/hooks/useProjectType";
import { AnalysisService } from "@/services/analysis";
import { AnalysisPartnersService } from "@/services/analysisPartners";
import { getCurrentRankingMonthStart } from "@/utils/datetime";
import FeeSummaryCards from "./FeeSummaryCards";
import FeeInstallmentsTable from "./FeeInstallmentsTable";
import FeeMonthSelector from "./FeeMonthSelector";
import { getMonthDateRange, toApiDate } from "./feeFormat";

const PAGE_LIMIT = 20;
const PARTNER_LIMIT = 100;

type DateMode = "monthly" | "custom";

export default function FeePaymentStatusPanel() {
  const [projectId, projectReady] = useSelectedProjectId();
  const { isLawyer, ready: projectTypeReady } = useProjectType();
  const hasProject = projectReady && Boolean(projectId);

  const [dateMode, setDateMode] = useState<DateMode>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    () => getCurrentRankingMonthStart()
  );
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const dateRange = useMemo(() => {
    if (dateMode === "monthly") {
      return getMonthDateRange(selectedMonth);
    }
    return {
      startDate: customStart ? toApiDate(customStart) : undefined,
      endDate: customEnd ? toApiDate(customEnd) : undefined,
    };
  }, [dateMode, selectedMonth, customStart, customEnd]);

  const sharedQuery = useMemo(
    () => ({
      projectId: projectId ?? "",
      filterProjectId: filterProjectId ?? undefined,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
    [projectId, filterProjectId, dateRange.startDate, dateRange.endDate]
  );

  const partnersQuery = useQuery({
    queryKey: ["analysis-partners-fee-filter", projectId],
    enabled: hasProject && projectTypeReady && isLawyer,
    queryFn: async () => {
      const res = await AnalysisPartnersService.list(
        { status: "approved", page: 1, limit: PARTNER_LIMIT },
        { "x-project-id": projectId! }
      );
      return res.data.data.partners;
    },
  });

  const branchOptions = useMemo(() => {
    const partners = partnersQuery.data ?? [];
    // 변호사: projectId = 영업 프로젝트 ID, projectName = 영업점명
    return partners
      .filter((p) => p.projectId != null)
      .map((p) => ({
        value: p.projectId,
        label: p.projectName || `영업점 #${p.projectId}`,
      }));
  }, [partnersQuery.data]);

  const summaryQuery = useQuery({
    queryKey: ["fee-statistics-summary", sharedQuery],
    enabled: hasProject,
    queryFn: async () => {
      const res = await AnalysisService.feeStatisticsSummary(sharedQuery);
      return res.data.data;
    },
  });

  const installmentsQuery = useQuery({
    queryKey: ["fee-statistics-installments", sharedQuery, page],
    enabled: hasProject,
    queryFn: async () => {
      const res = await AnalysisService.feeStatisticsInstallments({
        ...sharedQuery,
        page,
        limit: PAGE_LIMIT,
      });
      return res.data.data;
    },
  });

  useEffect(() => {
    if (summaryQuery.isError) {
      console.error("Fee statistics summary failed:", summaryQuery.error);
    }
  }, [summaryQuery.isError, summaryQuery.error]);

  useEffect(() => {
    if (installmentsQuery.isError) {
      console.error("Fee statistics installments failed:", installmentsQuery.error);
    }
  }, [installmentsQuery.isError, installmentsQuery.error]);

  useEffect(() => {
    if (partnersQuery.isError) {
      console.error("Analysis partners for fee filter failed:", partnersQuery.error);
    }
  }, [partnersQuery.isError, partnersQuery.error]);

  const total = installmentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + (direction === "prev" ? -1 : 1));
      return next;
    });
    setPage(1);
  };

  const handleMonthChange = (date: Date) => {
    setSelectedMonth(date);
    setPage(1);
  };

  const handleDateModeChange = (mode: DateMode) => {
    setDateMode(mode);
    setPage(1);
  };

  const handleBranchChange = (value: string) => {
    if (!value) {
      setFilterProjectId(null);
    } else {
      const parsed = Number.parseInt(value, 10);
      setFilterProjectId(Number.isFinite(parsed) ? parsed : null);
    }
    setPage(1);
  };

  const branchSelect = (
    <div className="flex items-center gap-2.5">
      <span className="whitespace-nowrap text-[16px] font-medium leading-[19px] text-[#808080]">
        영업점
      </span>
      <div className="relative h-[34px] min-w-[127px]">
        <select
          value={filterProjectId != null ? String(filterProjectId) : ""}
          onChange={(e) => handleBranchChange(e.target.value)}
          disabled={!isLawyer}
          className="h-full w-full min-w-[127px] cursor-pointer appearance-none rounded-[5px] border border-[#E2E2E2] bg-white py-2 pl-3 pr-7 text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-black disabled:cursor-not-allowed disabled:bg-neutral-10 disabled:text-neutral-60 dark:border-neutral-30 dark:bg-neutral-20 dark:text-neutral-90"
          aria-label="영업점 필터"
        >
          <option value="">전체 영업점</option>
          {isLawyer &&
            branchOptions.map((opt) => (
              <option key={opt.value} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
            <path d="M5 8L0.669873 0.5H9.33013L5 8Z" fill="#000000" className="dark:fill-neutral-80" />
          </svg>
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-9">
      {/* 납부 현황 요약 — 피그마: 흰 카드 안 #F8F8F8 메트릭 4열 */}
      <section className="surface md:rounded-[14px] px-6 md:px-6 lg:px-[24px] pt-6 md:pt-[27px] pb-6 md:pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        <h2 className="mb-5 md:mb-6 text-[18px] font-semibold leading-[21px] text-foreground">
          납부 현황
        </h2>
        <FeeSummaryCards
          summary={summaryQuery.data}
          isLoading={!hasProject || summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </section>

      {/* 납부 내역 — 토글 중앙 / 월 네비 중앙 / 영업점 우측.
          모바일·태블릿: 영업점 선택이 "납부 내역" 제목과 같은 줄(우측).
          PC(lg+): 날짜 네비와 같은 줄 우측. */}
      <section className="surface md:rounded-[14px] px-6 md:px-7 pt-6 pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        <div className="mb-5 flex items-center justify-between gap-3 lg:block">
          <h2 className="text-[18px] font-semibold leading-[21px] text-foreground">
            납부 내역
          </h2>
          <div className="lg:hidden">{branchSelect}</div>
        </div>

        {/* 피그마 Toogle: 132×32, #F8F8F8, active #000 */}
        <div className="mb-5 flex justify-center md:mb-4">
          <div
            className="relative inline-flex h-8 w-[132px] items-center rounded-[30px] bg-[#F8F8F8] p-0.5 dark:bg-neutral-20"
            role="tablist"
            aria-label="날짜 조회 방식"
          >
            <button
              type="button"
              role="tab"
              aria-selected={dateMode === "monthly"}
              className={`flex h-7 w-16 cursor-pointer items-center justify-center rounded-[30px] text-[12px] leading-[150%] tracking-[-0.02em] transition-colors ${
                dateMode === "monthly"
                  ? "bg-black font-semibold text-white dark:bg-neutral-90 dark:text-neutral-0"
                  : "bg-transparent font-medium text-[#808080]"
              }`}
              onClick={() => handleDateModeChange("monthly")}
            >
              월별
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dateMode === "custom"}
              className={`flex h-7 w-16 cursor-pointer items-center justify-center rounded-[30px] text-[12px] leading-[150%] tracking-[-0.02em] transition-colors ${
                dateMode === "custom"
                  ? "bg-black font-semibold text-white dark:bg-neutral-90 dark:text-neutral-0"
                  : "bg-transparent font-medium text-[#808080]"
              }`}
              onClick={() => handleDateModeChange("custom")}
            >
              직접입력
            </button>
          </div>
        </div>

        {/* 날짜(중앙) + 영업점(우측, PC만) — 피그마 top 654 정렬.
            모바일에서 직접입력 날짜 범위는 375px 기준 카드 폭을 거의 꽉 채우므로 full width. */}
        <div className="relative mb-6 flex flex-col items-center gap-3 lg:block lg:min-h-[34px]">
          <div className="flex w-full justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2">
            {dateMode === "monthly" ? (
              <FeeMonthSelector
                selectedMonth={selectedMonth}
                onNavigateMonth={navigateMonth}
                onMonthChange={handleMonthChange}
              />
            ) : (
              <DateRangePicker
                startDate={customStart}
                endDate={customEnd}
                onStartChange={(date) => {
                  setCustomStart(date);
                  setPage(1);
                }}
                onEndChange={(date) => {
                  setCustomEnd(date);
                  setPage(1);
                }}
                onReset={() => {
                  setCustomStart(null);
                  setCustomEnd(null);
                  setPage(1);
                }}
                showInlineIcon
                // TODO: 지금은 미사용 — 추후 다시 노출 요청 예정
                showReset={false}
                className="w-full lg:w-auto"
              />
            )}
          </div>
          <div className="hidden lg:flex lg:absolute lg:right-0 lg:top-1/2 lg:w-auto lg:-translate-y-1/2">
            {branchSelect}
          </div>
        </div>

        <FeeInstallmentsTable
          items={installmentsQuery.data?.items ?? []}
          isLoading={!hasProject || installmentsQuery.isLoading}
          isError={installmentsQuery.isError}
          hasProject={hasProject}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
