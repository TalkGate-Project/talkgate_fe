"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { CustomersService } from "@/services/customers";
import type { BulkChangeCategoryFilterConditions } from "@/types/customers";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  /** API 성공 후(피드백 노출 여부와 무관) 목록 새로고침 및 선택 해제를 위해 호출 */
  onSuccess?: () => void;
  projectId: string;
  selectedIds: number[];
  /** "all"이면 필터 조건으로 변경, "page" 또는 null이면 selectedIds로 변경 */
  selectionMode: "page" | "all" | null;
  appliedFilters?: Record<string, unknown>;
  /** selectionMode === "all"일 때 예상 건수 */
  total: number;
};

function buildFilterConditions(
  appliedFilters?: Record<string, unknown>
): BulkChangeCategoryFilterConditions {
  if (!appliedFilters || Object.keys(appliedFilters).length === 0) return {};

  const f = appliedFilters;
  const conditions: BulkChangeCategoryFilterConditions = {};

  if (typeof f.name === "string") conditions.name = f.name;
  if (typeof f.contact1 === "string") conditions.contact1 = f.contact1;
  if (typeof f.contact2 === "string") conditions.contact2 = f.contact2;
  if (typeof f.noteContent === "string") conditions.noteContent = f.noteContent;
  if (f.assignType != null) conditions.assignType = String(f.assignType);
  if (typeof f.apiKeyId === "number") conditions.apiKeyId = f.apiKeyId;
  if (typeof f.teamId === "number") conditions.teamId = f.teamId;
  if (typeof f.memberId === "number") conditions.memberId = f.memberId;
  if (typeof f.applicationRoute === "string") conditions.applicationRoute = f.applicationRoute;
  if (typeof f.mediaCompany === "string") conditions.mediaCompany = f.mediaCompany;
  if (typeof f.site === "string") conditions.site = f.site;
  if (Array.isArray(f.categoryIds)) {
    conditions.categoryIds = f.categoryIds.map((id) => (id === null ? "null" : id)) as (
      | number
      | string
    )[];
  }
  if (typeof f.applicationDateFrom === "string") conditions.applicationDateFrom = f.applicationDateFrom;
  if (typeof f.applicationDateTo === "string") conditions.applicationDateTo = f.applicationDateTo;
  if (typeof f.assignedAtFrom === "string") conditions.assignedAtFrom = f.assignedAtFrom;
  if (typeof f.assignedAtTo === "string") conditions.assignedAtTo = f.assignedAtTo;
  if (typeof f.projectPartnerId === "number") conditions.projectPartnerId = f.projectPartnerId;
  if (typeof f.ipAddress === "string") conditions.ipAddress = f.ipAddress;
  if (typeof f.keyword === "string") conditions.keyword = f.keyword;
  if (typeof f.salesMemo === "string") conditions.salesMemo = f.salesMemo;

  return conditions;
}

export default function BulkCategoryChangeModal({
  open,
  onClose,
  onSuccess,
  projectId,
  selectedIds,
  selectionMode,
  appliedFilters,
  total,
}: Props) {
  const { categories, isLoading: categoriesLoading } = useCustomerNoteCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  // "없음"(null)도 유효한 선택이라 id만으로는 미선택 상태를 구분할 수 없다
  const [hasPickedCategory, setHasPickedCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedCategoryId(null);
    setHasPickedCategory(false);
    setSubmitting(false);
  }, [open]);

  const categoryOptions = useMemo(
    () => [
      { id: null as number | null, name: NO_CATEGORY_LABEL, colorCode: undefined as string | undefined },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        colorCode: category.colorCode,
      })),
    ],
    [categories]
  );

  if (!open) return null;

  const targetCount = selectionMode === "all" ? total : selectedIds.length;

  const applyCategoryChange = async () => {
    setSubmitting(true);
    try {
      const res =
        selectionMode === "all"
          ? await CustomersService.bulkChangeCategory({
              projectId,
              assignmentType: "filter",
              filterConditions: buildFilterConditions(appliedFilters),
              expectedCount: total,
              categoryId: selectedCategoryId,
            })
          : await CustomersService.bulkChangeCategory({
              projectId,
              assignmentType: "ids",
              customerIds: selectedIds,
              categoryId: selectedCategoryId,
            });

      const { successCount, failedCount } = res.data.data;

      onSuccess?.();
      onClose();

      if (failedCount === 0) {
        showErrorModal({
          type: "success",
          title: "카테고리 변경",
          headline: "카테고리가 변경되었습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      } else if (successCount === 0) {
        showErrorModal({
          type: "error",
          title: "카테고리 변경",
          headline: "카테고리 변경에 실패했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      } else {
        showErrorModal({
          type: "success",
          title: "카테고리 변경",
          headline: "카테고리가 일부 변경되었습니다.",
          description: `${successCount}건 성공, ${failedCount}건 실패했습니다.`,
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      }
    } catch (error: any) {
      console.error("Bulk category change failed:", error);

      // 전체 선택 후 목록이 바뀌면 서버가 expectedCount 불일치로 거절한다 → 새로고침을 유도
      if (error?.response?.data?.code === "CUSTOMER_COUNT_MISMATCH") {
        onSuccess?.();
        onClose();
        showErrorModal({
          type: "error",
          title: "카테고리 변경",
          headline: "고객 목록이 변경되어 적용하지 못했습니다.",
          description: "목록을 새로 불러왔습니다. 다시 선택 후 시도해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        return;
      }

      showErrorModal({
        type: "error",
        title: "오류 발생",
        headline: "카테고리 변경에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (submitting) return;

    if (targetCount === 0) {
      showErrorModal({
        title: "알림",
        headline: "카테고리를 변경할 고객을 선택하세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }

    if (!hasPickedCategory) {
      showErrorModal({
        title: "알림",
        headline: "변경할 카테고리를 선택하세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }

    void applyCategoryChange();
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="relative w-full h-full md:w-full md:max-w-[452px] md:h-auto rounded-[14px] bg-white dark:bg-neutral-10 flex flex-col md:max-h-[90vh]"
      ariaLabel="카테고리 일괄 변경"
    >
      {/* Header */}
      <div className="px-4 md:px-7 pt-4 md:pt-6">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[14px] md:text-[18px] font-semibold leading-[21px] text-ink dark:text-neutral-80">
            카테고리 변경
          </div>
          <button
            aria-label="close"
            onClick={() => !submitting && onClose()}
            className="cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" className="text-neutral-60 dark:text-neutral-60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="mb-4 md:mb-6 text-[13px] font-medium text-neutral-60 dark:text-neutral-60">
          선택한 {targetCount.toLocaleString()}명의 고객 카테고리를 일괄 변경합니다.
        </p>
      </div>

      {/* Body */}
      <div className="px-4 md:px-7 flex-1 overflow-y-auto">
        <div className="mb-3 text-[14px] font-medium tracking-[0.2px] text-neutral-60 dark:text-neutral-60">
          변경할 카테고리
        </div>
        {categoriesLoading ? (
          <div className="rounded-[12px] bg-neutral-10 dark:bg-neutral-25 px-4 py-4 text-[14px] text-neutral-60">
            카테고리를 불러오는 중입니다.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 pb-1">
            {categoryOptions.map((option) => {
              const isSelected = hasPickedCategory && option.id === selectedCategoryId;
              const badgeStyle = getBadgeStyle(option.name, option.id ?? 0, option.colorCode);

              return (
                <button
                  key={option.id ?? "none"}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedCategoryId(option.id);
                    setHasPickedCategory(true);
                  }}
                  disabled={submitting}
                  className={`cursor-pointer inline-flex max-w-full items-center rounded-[30px] px-3 py-2 text-[12px] font-medium disabled:opacity-60 ${
                    isSelected ? "ring-2 ring-ink dark:ring-neutral-80" : ""
                  }`}
                  style={badgeStyle}
                >
                  <span className="truncate">{option.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-4 mb-4 text-[13px] font-medium leading-[18px] text-neutral-60 dark:text-neutral-60">
          &ldquo;{NO_CATEGORY_LABEL}&rdquo;을 선택하면 기존 카테고리가 해제됩니다.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-30 dark:border-neutral-30" />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-4 md:px-7 py-3">
        <button
          onClick={() => !submitting && onClose()}
          disabled={submitting}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#EDEDED] dark:text-neutral-20 disabled:opacity-60"
        >
          {submitting ? "변경 중..." : "카테고리 변경"}
        </button>
      </div>
    </BaseModal>
  );
}
