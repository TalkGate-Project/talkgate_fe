"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DateRangePicker from "@/components/common/DateRangePicker";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useProjectType } from "@/hooks/useProjectType";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { AnalysisService } from "@/services/analysis";
import { AnalysisPartnersService } from "@/services/analysisPartners";
import { ProjectsService } from "@/services/projects";
import { setProjectType, setSelectedProjectId, setUseAttendanceMenu } from "@/lib/project";
import { getProjectSubdomainUrl } from "@/lib/subdomain";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { FeeStatisticsInstallmentItem } from "@/types/analysisFeeStatistics";
import { getCurrentRankingMonthStart } from "@/utils/datetime";
import FeeSummaryCards from "./FeeSummaryCards";
import FeeInstallmentsTable from "./FeeInstallmentsTable";
import FeeMonthSelector from "./FeeMonthSelector";
import { getMonthDateRange, toApiDate } from "./feeFormat";

const PAGE_LIMIT = 20;
const PARTNER_LIMIT = 100;

type DateMode = "monthly" | "custom";

export default function FeePaymentStatusPanel() {
  const router = useRouter();
  const [projectId, projectReady] = useSelectedProjectId();
  const { isLawyer, ready: projectTypeReady } = useProjectType();
  const { project: currentProject } = useCurrentProjectDetail();
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

  // GET /v1/analysis-partners/requests: 법무법인(lawyer) 프로젝트 시점에서 연결된 영업점 목록 조회
  // (projectId/projectName = 영업 프로젝트 ID/명, partnerProjectId = 이 법무법인 프로젝트 ID).
  // 변호사 시점에 연결된 영업점을 조회할 수 있는 엔드포인트는 이것뿐이라 승인된 건(status=approved)만
  // 걸러 필터 옵션으로 쓴다. 원래 Admin/SubAdmin 전용이라 일반 직원은 403으로 목록이 비었으나,
  // 일반 직원도 영업점별 필터링이 가능해야 해 백엔드에서 권한 제한을 푸는 것으로 확정
  // (docs/ANALYSIS_API_QA_CHECKLIST.md §2 이슈 12).
  // ⚠️ GET /v1/analysis-partners(.list)는 영업점(analysis) 프로젝트 시점 전용이라 법무법인에서 호출하면
  // 항상 403(INVALID_PROJECT_TYPE) — 잘못된 엔드포인트였다. /v1/project-partners("협력업체")도 시도했으나
  // 이건 쿠폰/제휴 관리용 별개 도메인이라 이 관계와 무관(테스트 데이터에서 항상 빈 목록으로 확인됨).
  const partnersQuery = useQuery({
    queryKey: ["analysis-partners-requests-fee-filter", projectId],
    enabled: hasProject && projectTypeReady && isLawyer,
    queryFn: async () => {
      const res = await AnalysisPartnersService.listRequests(
        { status: "approved", page: 1, limit: PARTNER_LIMIT },
        { "x-project-id": projectId! }
      );
      return res.data.data.partners;
    },
  });

  const branchOptions = useMemo(() => {
    const partners = partnersQuery.data ?? [];
    // 변호사 시점: projectId = 영업 프로젝트 ID, projectName = 영업점명
    const partnerOptions = partners
      .filter((p) => p.projectId != null)
      .map((p) => ({
        value: p.projectId,
        label: p.projectName || `영업점 #${p.projectId}`,
      }));
    // 법무법인 프로젝트 자체(현재 프로젝트)도 필터 대상에 포함
    if (currentProject) {
      return [
        { value: currentProject.id, label: currentProject.name },
        ...partnerOptions,
      ];
    }
    return partnerOptions;
  }, [partnersQuery.data, currentProject]);

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
    if (mode === "custom" && !customStart && !customEnd) {
      const now = new Date();
      setCustomStart(new Date(now.getFullYear(), now.getMonth(), 1));
      setCustomEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
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

  const handleInstallmentClick = async (item: FeeStatisticsInstallmentItem) => {
    const detailPath = `/debt-relief/${item.analysisId}`;

    try {
      const sourceProject = currentProject?.id === item.sourceProjectId
        ? currentProject
        : (await ProjectsService.detailById({
            "x-project-id": String(item.sourceProjectId),
          })).data.data;

      setSelectedProjectId(item.sourceProjectId);
      setProjectType(sourceProject.type);
      setUseAttendanceMenu(sourceProject.useAttendanceMenu);

      const subdomainUrl = sourceProject.subDomain
        ? getProjectSubdomainUrl(sourceProject.subDomain, detailPath)
        : "";

      if (subdomainUrl) {
        window.location.href = subdomainUrl;
        return;
      }

      router.push(detailPath);
    } catch (error) {
      console.error("Failed to open fee installment analysis detail:", error);
      showErrorModal({
        headline: "분석 상세 페이지로 이동하지 못했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  // 영업점 필터는 법무법인 프로젝트에서만 노출 (영업점 프로젝트에는 하위 영업점 개념이 없음)
  const branchSelect = isLawyer ? (
    <div className="flex items-center gap-2.5">
      <span className="whitespace-nowrap text-[16px] font-medium leading-[19px] text-[#808080]">
        영업점
      </span>
      <div className="relative h-[34px] min-w-[127px]">
        <select
          value={filterProjectId != null ? String(filterProjectId) : ""}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="h-full w-full min-w-[127px] cursor-pointer appearance-none rounded-[5px] border border-[#E2E2E2] bg-white py-2 pl-3 pr-7 text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-black dark:border-neutral-30 dark:bg-neutral-20 dark:text-neutral-90"
          aria-label="영업점 필터"
        >
          <option value="">전체</option>
          {branchOptions.map((opt) => (
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
  ) : null;

  return (
    // 모바일·태블릿: 흰 섹션을 붙여 body bg가 비치지 않도록. PC(lg+): 카드 간격 유지.
    <div className="space-y-0 lg:space-y-9">
      {/* 결제 현황 요약 — 피그마: 흰 카드 안 #F8F8F8 메트릭 4열 */}
      <section className="surface rounded-none md:rounded-t-[14px] md:rounded-b-none lg:rounded-[14px] px-6 md:px-6 lg:px-[24px] pt-6 md:pt-[27px] pb-6 md:pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        <h2 className="mb-5 md:mb-6 text-[18px] font-semibold leading-[21px] text-foreground">
          결제 현황
        </h2>
        <FeeSummaryCards
          summary={summaryQuery.data}
          isLoading={!hasProject || summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </section>

      {/* 결제 내역 — 토글 중앙 / 월 네비 중앙 / 영업점 우측.
          모바일·태블릿: 영업점 선택이 "결제 내역" 제목과 같은 줄(우측).
          PC(lg+): 날짜 네비와 같은 줄 우측. */}
      <section className="surface rounded-none md:rounded-b-[14px] md:rounded-t-none lg:rounded-[14px] px-6 md:px-7 pt-6 pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        <div className="mb-5 flex items-center justify-between gap-3 lg:block">
          <h2 className="text-[18px] font-semibold leading-[21px] text-foreground">
            결제 내역
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
                // w-full은 모바일 전용(375px 카드 폭을 꽉 채우는 의도). lg:w-auto였을 때는
                // 태블릿 구간까지 full width가 적용돼, DateRangePicker 내부에 justify-center가
                // 없어 컨텐츠가 왼쪽으로 붙어 보였다 — md부터 content 폭으로 되돌려 부모의
                // justify-center가 실제로 중앙 정렬을 담당하게 한다.
                className="w-full md:w-auto"
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
          onRowClick={(item) => void handleInstallmentClick(item)}
          showAssigneeColumn={isLawyer}
        />
      </section>
    </div>
  );
}
