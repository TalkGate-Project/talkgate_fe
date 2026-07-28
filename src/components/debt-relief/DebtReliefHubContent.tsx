"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebtReliefSummary, useDebtReliefList } from "@/hooks/useDebtReliefHub";
import { useAnalysisProcedureMaster } from "@/hooks/useAnalysisProcedureMaster";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import SummaryCards from "@/components/debt-relief/hub/SummaryCards";
import DiagnosisFilterTrigger from "@/components/debt-relief/hub/DiagnosisFilterTrigger";
import DiagnosisFilterAppliedChips from "@/components/debt-relief/hub/DiagnosisFilterAppliedChips";
import DiagnosisSearchInput from "@/components/debt-relief/hub/DiagnosisSearchInput";
import DiagnosisListActions from "@/components/debt-relief/hub/DiagnosisListActions";
import DiagnosisListTabs from "@/components/debt-relief/hub/DiagnosisListTabs";
import DiagnosisTable from "@/components/debt-relief/hub/DiagnosisTable";
import DiagnosisMobileCardList from "@/components/debt-relief/hub/DiagnosisMobileCardList";
import AnalysisShareModal from "@/components/debt-relief/hub/AnalysisShareModal";
import RelatedNewsButton from "@/components/debt-relief/hub/RelatedNewsButton";
import RelatedNewsDrawer from "@/components/debt-relief/hub/RelatedNewsDrawer";
import Pagination from "@/components/common/Pagination";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/lib/errorModalEvents";
import { DebtReliefService } from "@/services/debtRelief";
import { useProjectType } from "@/hooks/useProjectType";
import type { DiagnosisListItem } from "@/types/debtRelief";

const NEW_DIAGNOSIS_BUTTON_CLASS =
  "h-[34px] shrink-0 cursor-pointer whitespace-nowrap rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-20 transition-opacity hover:opacity-90";

export default function DebtReliefHubContent() {
  const router = useRouter();
  const [projectId] = useSelectedProjectId();
  const { isAnalysis, isLawyer, ready: projectTypeReady } = useProjectType();
  const { summary, loading: summaryLoading } = useDebtReliefSummary();
  const { stepTitlesByProcedure } = useAnalysisProcedureMaster(projectId);
  const {
    items,
    totalCount,
    loading: listLoading,
    listTab,
    selectListTab,
    procedure,
    selectProcedure,
    status,
    selectStatus,
    keyword,
    setKeyword,
    submitSearch,
    clearSearch,
    sortField,
    sortDirection,
    toggleSort,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    refetch,
  } = useDebtReliefList();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareTargetIds, setShareTargetIds] = useState<string[] | null>(null);
  // 과거에 공유한 적 있는 건(partnerId 보유)이면 재공유이므로 동일 프로젝트로 고정 —
  // AnalysisShareModal의 프로젝트 선택 스텝을 건너뛴다.
  const [shareLockedPartner, setShareLockedPartner] = useState<{ id: number; projectName: string } | null>(null);
  const [isNewsDrawerOpen, setIsNewsDrawerOpen] = useState(false);

  // 목록이 새로 로드될 때(필터·검색·정렬·페이지 변경)마다 선택 상태를 초기화한다.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items]);

  const allSelectedOnPage = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const hasSelection = selectedIds.size > 0;
  const hasActiveFilter = Boolean(procedure) || Boolean(status);
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const hasSharedSelected = selectedItems.some((item) => item.isShared);

  const handleResetFilters = () => {
    selectProcedure(undefined);
    selectStatus(undefined);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelectedOnPage ? new Set() : new Set(items.map((item) => item.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleShareSelected = () => {
    if (!hasSelection || hasSharedSelected) return;
    setShareTargetIds(Array.from(selectedIds));
    setShareLockedPartner(null);
  };

  const handleShareItem = (item: DiagnosisListItem) => {
    setShareTargetIds([item.id]);
    setShareLockedPartner(
      item.partnerId != null && item.lawyerProjectId != null
        ? { id: item.partnerId, projectName: item.lawyerProjectName || "프로젝트" }
        : null
    );
  };

  const handleCloseShareModal = () => {
    setShareTargetIds(null);
    setShareLockedPartner(null);
  };

  const handleDeleteSelected = () => {
    if (!projectId || !hasSelection) return;

    const deletable = selectedItems.filter((item) => !item.isShared);
    const skippedSharedCount = selectedItems.length - deletable.length;

    if (deletable.length === 0) {
      showErrorModal({
        title: "삭제 불가",
        headline: "공유받은 진단은 삭제할 수 없습니다.",
        description: "선택 항목을 확인한 뒤 다시 시도해주세요.",
        hideCancel: true,
      });
      return;
    }

    const sharedNote =
      skippedSharedCount > 0
        ? ` (공유받은 ${skippedSharedCount}건은 제외됩니다)`
        : "";

    showConfirmModal({
      title: "진단 삭제",
      headline: `선택한 ${deletable.length}건의 진단을 삭제하시겠습니까?${sharedNote}`,
      message: "삭제된 진단은 복구할 수 없습니다.",
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          const result = await DebtReliefService.bulkDeleteDiagnoses(
            projectId,
            deletable.map((item) => item.id)
          );
          if (result.failedCount > 0) {
            console.error("Some diagnosis deletions failed:", result.failedAnalysisIds);
            showErrorModal({
              title: "삭제 실패",
              headline:
                result.deletedCount > 0
                  ? "일부 진단을 삭제하지 못했습니다."
                  : "진단을 삭제하지 못했습니다.",
              description: "잠시 후 다시 시도해주세요.",
              hideCancel: true,
            });
            if (result.deletedCount > 0) {
              clearSelection();
              refetch();
            }
            return;
          }
          clearSelection();
          refetch();
        } catch (error) {
          console.error("Failed to delete diagnoses:", error);
          showErrorModal({
            title: "삭제 실패",
            headline: "진단을 삭제하지 못했습니다.",
            description: "잠시 후 다시 시도해주세요.",
            hideCancel: true,
          });
        }
      },
    });
  };

  const handleOpenResult = (id: string) => {
    router.push(`/debt-relief/${id}`);
  };

  return (
    <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-9 md:pb-12 flex flex-col gap-0 md:gap-9">
      {/* 상단 카드: 제목 + 요약 카드 */}
      <section className="surface md:rounded-[14px] px-6 md:px-7 py-3 md:py-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        {/* 모바일: 1행 제목+새진단 / 2행 관련뉴스(구분선 위). 데스크톱: 한 줄.
            새 진단 버튼은 반응형 위치 때문에 2곳에 두되, 스타일·동작은 상수로 통일한다. */}
        <div className="mb-3 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              <h1 className="truncate text-[18px] font-bold leading-[22px] text-foreground md:text-[24px] md:leading-7">
                회생·파산 진단 목록
              </h1>
              {/* 모바일에서는 총 건수를 아래 요약 카드로 대체하므로 인라인 요약 텍스트는 데스크톱에서만 노출 */}
              {summary && (
                <>
                  <span className="hidden h-4 w-px bg-neutral-60 md:block" />
                  <span className="hidden text-[18px] font-medium leading-[22px] text-neutral-60 md:inline">
                    총 {summary.totalAnalysisCount}건 · 이번 달 {summary.thisMonthCount}건 상담
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              className={`${NEW_DIAGNOSIS_BUTTON_CLASS} md:hidden`}
              onClick={() => router.push("/debt-relief/new")}
            >
              + 새 진단 시작
            </button>
          </div>

          <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
            <RelatedNewsButton onClick={() => setIsNewsDrawerOpen(true)} />
            <button
              type="button"
              className={`${NEW_DIAGNOSIS_BUTTON_CLASS} hidden md:inline-flex md:items-center`}
              onClick={() => router.push("/debt-relief/new")}
            >
              + 새 진단 시작
            </button>
          </div>
        </div>

        <div className="-mx-6 mb-6 border-t border-neutral-30 md:-mx-7" />

        <SummaryCards summary={summary} loading={summaryLoading} />
      </section>

      {/* 하단 카드: 검색 + 테이블 + 페이지네이션 */}
      <section className="surface md:rounded-[14px] px-4 md:px-7 pt-6 pb-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        {/* 모바일: 상단 요약 카드와 탭 사이 구분선 — 컨테이너 좌우 패딩(px-4) 무시하고 풀폭으로 확장.
            위: 이전 섹션의 pb-3(12px)+이 섹션의 pt-6(24px)=36px, 아래: mb-6(24px)+탭 래퍼 없음 →
            카드 하단~탭 상단 전체 48px 간격의 정중앙(24px/24px)에 오도록 -mt-3로 12px 끌어올림 */}
        <div className="-mx-4 md:hidden border-t border-neutral-30 -mt-3 mb-6" />

        {/* 모바일: 전체/반려 탭 — 검색·필터 행 위 풀폭 */}
        <div className="mb-3 md:hidden">
          <DiagnosisListTabs value={listTab} onChange={selectListTab} />
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {/* 1행: 필터·검색·(데스크톱)초기화/총건수 | 우측 끝: 액션 + 전체/반려 탭(데스크톱만) */}
          <div className="flex items-center gap-2">
            <DiagnosisFilterTrigger
              procedure={procedure}
              status={status}
              listTab={listTab}
              onChangeProcedure={selectProcedure}
              onChangeStatus={selectStatus}
            />
            <DiagnosisSearchInput
              value={keyword}
              onChange={setKeyword}
              onSearch={submitSearch}
              onClear={clearSearch}
              className="flex-1 min-w-0 max-w-none md:flex-none md:max-w-[188px]"
            />
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="hidden md:inline-flex items-center justify-center cursor-pointer shrink-0 h-[38px] px-3 rounded-[8px] border border-neutral-30 text-[14px] font-semibold text-foreground hover:bg-neutral-10 whitespace-nowrap"
              >
                초기화
              </button>
            )}
            <span className="hidden md:inline text-[14px] font-medium leading-5 text-neutral-50 whitespace-nowrap">
              총 {totalCount}건
              {selectedIds.size > 0 ? ` (${selectedIds.size}개 선택)` : ""}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <DiagnosisListActions
                hasSelection={hasSelection}
                selectedCount={selectedIds.size}
                limit={limit}
                onDelete={handleDeleteSelected}
                onShare={handleShareSelected}
                showShareAction={projectTypeReady && isAnalysis && listTab === "all"}
                shareDisabled={hasSharedSelected}
                onLimitChange={setLimit}
              />
              <div className="hidden md:block">
                <DiagnosisListTabs value={listTab} onChange={selectListTab} />
              </div>
            </div>
          </div>
          <DiagnosisFilterAppliedChips
            procedure={procedure}
            status={status}
            onChangeProcedure={selectProcedure}
            onChangeStatus={selectStatus}
          />
          <p className="md:hidden text-[14px] font-medium leading-5 text-neutral-50">
            총 {totalCount}건
            {selectedIds.size > 0 ? ` (${selectedIds.size}개 선택)` : ""}
          </p>
        </div>

        {/* 데스크톱: 표 (가로 스크롤). 모바일: 카드 리스트 — Figma 모바일 목업 기준 별도 컴포넌트 */}
        <div className="hidden md:block">
          <DiagnosisTable
            items={items}
            loading={listLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onToggleSort={toggleSort}
            onOpenResult={handleOpenResult}
            showShareColumn={projectTypeReady && isAnalysis}
            onShareItem={handleShareItem}
            showAssigneeColumn={projectTypeReady && isLawyer}
            selectedIds={selectedIds}
            allSelectedOnPage={allSelectedOnPage}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            stepTitlesByProcedure={stepTitlesByProcedure}
          />
        </div>
        <div className="md:hidden">
          <DiagnosisMobileCardList
            items={items}
            loading={listLoading}
            onOpenResult={handleOpenResult}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            stepTitlesByProcedure={stepTitlesByProcedure}
            showShareButton={projectTypeReady && isAnalysis}
            onShareItem={handleShareItem}
          />
        </div>

        <div className="flex items-center justify-center mt-6 min-h-[32px]">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={listLoading} />
        </div>
      </section>

      {projectId && (
        <AnalysisShareModal
          open={shareTargetIds !== null}
          onClose={handleCloseShareModal}
          onSuccess={refetch}
          projectId={projectId}
          analysisIds={shareTargetIds ?? []}
          lockedPartner={shareLockedPartner}
        />
      )}

      <RelatedNewsDrawer isOpen={isNewsDrawerOpen} onClose={() => setIsNewsDrawerOpen(false)} />
    </div>
  );
}
