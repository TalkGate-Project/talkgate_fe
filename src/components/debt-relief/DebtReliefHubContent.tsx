"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebtReliefSummary, useDebtReliefList } from "@/hooks/useDebtReliefHub";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import SummaryCards from "@/components/debt-relief/hub/SummaryCards";
import DiagnosisFilterTabs from "@/components/debt-relief/hub/DiagnosisFilterTabs";
import DiagnosisSearchInput from "@/components/debt-relief/hub/DiagnosisSearchInput";
import DiagnosisListActions from "@/components/debt-relief/hub/DiagnosisListActions";
import DiagnosisTable from "@/components/debt-relief/hub/DiagnosisTable";
import DiagnosisMobileCardList from "@/components/debt-relief/hub/DiagnosisMobileCardList";
import AnalysisShareModal from "@/components/debt-relief/hub/AnalysisShareModal";
import Pagination from "@/components/common/Pagination";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/lib/errorModalEvents";
import { DebtReliefService } from "@/services/debtRelief";
import { useProjectType } from "@/hooks/useProjectType";

export default function DebtReliefHubContent() {
  const router = useRouter();
  const [projectId] = useSelectedProjectId();
  const { isAnalysis, isLawyer, ready: projectTypeReady } = useProjectType();
  const { summary, loading: summaryLoading } = useDebtReliefSummary();
  const {
    items,
    totalCount,
    loading: listLoading,
    procedure,
    selectProcedure,
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

  // 목록이 새로 로드될 때(필터·검색·정렬·페이지 변경)마다 선택 상태를 초기화한다.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items]);

  const allSelectedOnPage = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const hasSelection = selectedIds.size > 0;

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
    if (!hasSelection) return;
    setShareTargetIds(Array.from(selectedIds));
  };

  const handleShareItem = (id: string) => {
    setShareTargetIds([id]);
  };

  const handleShareSuccess = () => {
    if (shareTargetIds && shareTargetIds.length > 1) clearSelection();
  };

  const handleDeleteSelected = () => {
    if (!projectId || !hasSelection) return;

    const selectedItems = items.filter((item) => selectedIds.has(item.id));
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
    <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-9 md:pb-12 flex flex-col gap-9">
      {/* 상단 카드: 제목 + 요약 카드 */}
      <section className="surface md:rounded-[14px] px-6 md:px-7 py-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap min-w-0">
            <h1 className="text-[18px] md:text-[24px] font-bold text-foreground leading-[22px] md:leading-7 truncate">
              회생·파산 진단 목록
            </h1>
            {/* 모바일에서는 총 건수를 아래 요약 카드로 대체하므로 인라인 요약 텍스트는 데스크톱에서만 노출 */}
            {summary && (
              <>
                <span className="hidden md:block w-px h-4 bg-neutral-60" />
                <span className="hidden md:inline text-[18px] font-medium leading-[22px] text-neutral-60">
                  총 {summary.totalAnalysisCount}건 · 이번 달 {summary.thisMonthCount}건 상담
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            className="cursor-pointer shrink-0 h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] hover:opacity-90 transition-opacity whitespace-nowrap"
            onClick={() => router.push("/debt-relief/new")}
          >
            + 새 진단 시작
          </button>
        </div>

        <div className="-mx-6 md:-mx-7 border-t border-neutral-30 mb-6" />

        <SummaryCards summary={summary} loading={summaryLoading} />
      </section>

      {/* 하단 카드: 탭 + 검색 + 테이블 + 페이지네이션 */}
      <section className="surface md:rounded-[14px] px-4 md:px-7 pt-6 pb-6 shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
        <div className="flex flex-col gap-3 mb-5">
          {/* 모바일 피그마: 필터 탭 → 검색+액션 → 총 건수. 데스크톱: 탭 왼쪽 / 검색·액션 오른쪽 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <DiagnosisFilterTabs
                summary={summary}
                active={procedure}
                onChange={selectProcedure}
                totalCount={totalCount}
                selectedCount={selectedIds.size}
              />
            </div>
            <div className="flex items-center gap-3">
              <DiagnosisSearchInput
                value={keyword}
                onChange={setKeyword}
                onSearch={submitSearch}
                onClear={clearSearch}
                className="flex-1 max-w-none md:flex-none md:max-w-[188px]"
              />
              <DiagnosisListActions
                hasSelection={hasSelection}
                selectedCount={selectedIds.size}
                limit={limit}
                onDelete={handleDeleteSelected}
                onShare={handleShareSelected}
                showShareAction={projectTypeReady && isAnalysis}
                onLimitChange={setLimit}
              />
            </div>
          </div>
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
          />
        </div>
        <div className="md:hidden">
          <DiagnosisMobileCardList
            items={items}
            loading={listLoading}
            onOpenResult={handleOpenResult}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </div>

        <div className="flex items-center justify-center mt-6 min-h-[32px]">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={listLoading} />
        </div>
      </section>

      {projectId && (
        <AnalysisShareModal
          open={shareTargetIds !== null}
          onClose={() => setShareTargetIds(null)}
          onSuccess={handleShareSuccess}
          projectId={projectId}
          analysisIds={shareTargetIds ?? []}
        />
      )}
    </div>
  );
}
