"use client";

import { useEffect, useState, useCallback } from "react";
import { ProjectPartnersService } from "@/services/projectPartners";
import { CustomersService } from "@/services/customers";
import type { ProjectPartner } from "@/types/projectPartners";
import type { CopyToPartnerFilterConditions } from "@/types/customers";
import Pagination from "@/components/common/Pagination";
import Checkbox from "@/components/common/Checkbox";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

interface CustomerShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
  /** 선택된 고객 ID (copyType "ids"일 때 사용) */
  selectedIds: number[];
  /** "all"이면 필터 조건으로 복제, "page" 또는 null이면 selectedIds로 복제 */
  selectionMode: "page" | "all" | null;
  /** selectionMode === "all"일 때 사용할 필터 조건 */
  appliedFilters?: Record<string, unknown>;
  /** selectionMode === "all"일 때 예상 건수 */
  selectedCount: number;
}

function buildFilterConditions(
  appliedFilters?: Record<string, unknown>
): CopyToPartnerFilterConditions | undefined {
  if (!appliedFilters || Object.keys(appliedFilters).length === 0)
    return undefined;

  const f = appliedFilters as Record<string, unknown>;
  const conditions: CopyToPartnerFilterConditions = {};

  if (typeof f.name === "string") conditions.name = f.name;
  if (typeof f.contact1 === "string") conditions.contact1 = f.contact1;
  if (typeof f.contact2 === "string") conditions.contact2 = f.contact2;
  if (typeof f.noteContent === "string") conditions.noteContent = f.noteContent;
  if (f.assignType != null) conditions.assignType = String(f.assignType);
  if (typeof f.teamId === "number") conditions.teamId = f.teamId;
  if (typeof f.memberId === "number") conditions.memberId = f.memberId;
  if (typeof f.applicationRoute === "string")
    conditions.applicationRoute = f.applicationRoute;
  if (typeof f.mediaCompany === "string")
    conditions.mediaCompany = f.mediaCompany;
  if (typeof f.site === "string") conditions.site = f.site;
  if (Array.isArray(f.categoryIds))
    conditions.categoryIds = f.categoryIds as (number | string)[];
  if (typeof f.applicationDateFrom === "string")
    conditions.applicationDateFrom = f.applicationDateFrom;
  if (typeof f.applicationDateTo === "string")
    conditions.applicationDateTo = f.applicationDateTo;
  if (typeof f.assignedAtFrom === "string")
    conditions.assignedAtFrom = f.assignedAtFrom;
  if (typeof f.assignedAtTo === "string")
    conditions.assignedAtTo = f.assignedAtTo;

  return Object.keys(conditions).length > 0 ? conditions : undefined;
}

export default function CustomerShareModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  selectedIds,
  selectionMode,
  appliedFilters,
  selectedCount,
}: CustomerShareModalProps) {
  const [partners, setPartners] = useState<ProjectPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<number>>(
    new Set()
  );
  const [submitting, setSubmitting] = useState(false);

  const limit = 20;

  const fetchPartners = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const headers = { "x-project-id": projectId };
      const response = await ProjectPartnersService.list(
        { page, limit, status: "approved" },
        headers
      );

      if (response.data?.data) {
        setPartners(response.data.data.list);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch partners", err);
      showErrorModal({
        type: "error",
        headline: "협력업체 목록을 불러오는데 실패했습니다.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen, fetchPartners]);

  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setPartners([]);
      setSelectedPartnerIds(new Set());
    }
  }, [isOpen]);

  const togglePartner = (partnerId: number) => {
    setSelectedPartnerIds((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) {
        next.delete(partnerId);
      } else {
        next.add(partnerId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedPartnerIds.size === 0) {
      showErrorModal({
        type: "error",
        headline: "공유할 협력업체를 하나 이상 선택해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }

    setSubmitting(true);
    try {
      const partnerIds = Array.from(selectedPartnerIds);

      if (selectionMode === "all") {
        const filterConditions = buildFilterConditions(appliedFilters) ?? {};
        await CustomersService.copyToPartner({
          projectId,
          partnerIds,
          copyType: "filter",
          filterConditions,
          expectedCount: selectedCount,
        });
      } else {
        if (selectedIds.length === 0) {
          showErrorModal({
            type: "error",
            headline: "선택된 고객이 없습니다.",
            hideCancel: true,
            confirmText: "확인",
          });
          setSubmitting(false);
          return;
        }
        await CustomersService.copyToPartner({
          projectId,
          partnerIds,
          copyType: "ids",
          customerIds: selectedIds,
        });
      }

      showErrorModal({
        type: "success",
        headline: "고객 정보가 선택한 협력업체에 복제되었습니다.",
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          onSuccess?.();
          onClose();
        },
      });
    } catch (err) {
      console.error("Failed to copy customers to partner", err);
      showErrorModal({
        type: "error",
        headline: "고객 공유에 실패했습니다. 잠시 후 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-[500px] md:-translate-x-1/2 w-[calc(100%-2rem)] max-h-[90vh] bg-white dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col overflow-hidden"
        style={{
          filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-80 leading-[21px]">
            파트너 배정하기
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer w-6 h-6 flex items-center justify-center flex-shrink-0"
            aria-label="닫기"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p className="px-7 pb-4 text-[16px] font-medium text-center">
          배정할 파트너를 선택해주세요.
        </p>

        <div className="overflow-y-auto px-7 pb-4 max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[14px] text-neutral-60">로딩 중...</span>
            </div>
          ) : partners.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[14px] text-neutral-60">
                승인된 협력업체가 없습니다.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {partners.map((partner) => {
                const checked = selectedPartnerIds.has(partner.id);
                return (
                  <div
                    key={partner.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[8px] cursor-pointer transition-colors ${
                      checked
                        ? "bg-neutral-10 dark:bg-neutral-20"
                        : "bg-transparent hover:bg-neutral-10/50 dark:hover:bg-neutral-20/50"
                    }`}
                    onClick={() => togglePartner(partner.id)}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => togglePartner(partner.id)}
                        ariaLabel={`${partner.partnerProjectName} 선택`}
                        size={24}
                      />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-20 dark:bg-neutral-30 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <span className="text-[14px] font-semibold text-neutral-60 dark:text-neutral-50">
                        {partner.partnerProjectName.charAt(0).toUpperCase() ||
                          "?"}
                      </span>
                    </div>
                    <span className="text-[14px] font-medium text-foreground truncate flex-1 min-w-0">
                      {partner.partnerProjectName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="flex justify-center mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={loading}
                maxButtons={5}
              />
            </div>
          )}
        </div>

        <div className="w-full h-px border-t border-neutral-30 dark:border-neutral-30 flex-shrink-0" />

        <div className="flex justify-end items-center gap-[12px] px-7 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-3 py-[6px] rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ lineHeight: "17px" }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || selectedPartnerIds.size === 0}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-3 py-[6px] rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[14px] font-semibold text-[#EDEDED] dark:text-neutral-20 tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ lineHeight: "17px" }}
          >
            {submitting ? "처리 중..." : "확인"}
          </button>
        </div>
      </div>
    </>
  );
}
