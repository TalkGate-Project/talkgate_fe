"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalysisService } from "@/services/analysis";
import { AnalysisPartnersService } from "@/services/analysisPartners";
import type { AnalysisPartner } from "@/types/analysisPartners";
import Pagination from "@/components/common/Pagination";
import Checkbox from "@/components/common/Checkbox";
import { showErrorModal } from "@/lib/errorModalEvents";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
  /** 공유할 진단(분석) ID 목록. 목록에서 다건 선택 또는 행 단건 공유 모두 지원. */
  analysisIds: string[];
};

const PAGE_LIMIT = 5;

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AnalysisShareModal({
  open,
  onClose,
  onSuccess,
  projectId,
  analysisIds,
}: Props) {
  const [partners, setPartners] = useState<AnalysisPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const fetchPartners = useCallback(() => {
    if (!open || !projectId) return;

    setLoading(true);
    AnalysisPartnersService.list(
      { page, limit: PAGE_LIMIT, status: "approved" },
      { "x-project-id": projectId }
    )
      .then((response) => {
        const data = response.data.data;
        setPartners(data.partners);
        setTotal(data.total);
      })
      .catch((error) => {
        console.error("Failed to fetch analysis partners:", error);
        showErrorModal({
          headline: "공유 가능한 프로젝트를 불러오지 못했습니다.",
          description: "잠시 후 다시 시도해주세요.",
        });
      })
      .finally(() => setLoading(false));
  }, [open, projectId, page]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // 닫힐 때 상태 초기화 (다음에 열 때 깨끗하게 시작)
  useEffect(() => {
    if (!open) {
      setPage(1);
      setPartners([]);
      setSelectedPartnerIds(new Set());
    }
  }, [open]);

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
    if (selectedPartnerIds.size === 0 || analysisIds.length === 0) {
      showErrorModal({
        headline: "공유할 프로젝트를 하나 이상 선택해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }

    setSubmitting(true);
    try {
      const partnerIds = Array.from(selectedPartnerIds);
      // 백엔드가 건별 단일 파트너 전달(POST /v1/analysis/{id}/deliver)만 지원하므로
      // 선택한 진단 × 선택한 파트너 조합을 모두 개별 호출한다.
      // ⚠️ DeliverAnalysisInput.partnerId가 AnalysisPartner.id(파트너십 레코드 id)인지
      // partnerProjectId(대상 프로젝트 id)인지 swagger 예시로 확정 불가 — CustomerShareModal의
      // copyToPartner(partnerIds)가 ProjectPartner.id를 쓰는 것과 동일하게 AnalysisPartner.id로
      // 가정. 실 연동 시 400/404 응답이면 partnerProjectId로 교체 필요.
      const results = await Promise.allSettled(
        analysisIds.flatMap((analysisId) =>
          partnerIds.map((partnerId) =>
            AnalysisService.deliver(Number(analysisId), { projectId, partnerId })
          )
        )
      );

      const failedCount = results.filter((result) => result.status === "rejected").length;
      if (failedCount > 0) {
        console.error(
          "Some analysis deliveries failed:",
          results.filter((result) => result.status === "rejected")
        );
      }

      if (failedCount === results.length) {
        showErrorModal({
          headline: "분석결과 공유에 실패했습니다.",
          description: "잠시 후 다시 시도해주세요.",
        });
        return;
      }

      showErrorModal({
        type: "success",
        headline:
          failedCount > 0
            ? "일부 공유에 실패했습니다. 잠시 후 다시 시도해주세요."
            : `선택한 ${analysisIds.length}건의 분석결과 공유가 완료되었습니다.`,
        hideCancel: true,
        confirmText: "확인",
        onConfirm: () => {
          onSuccess?.();
          onClose();
        },
      });
    } catch (error) {
      console.error("Failed to deliver analysis:", error);
      showErrorModal({
        headline: "분석결과 공유에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-[480px] md:-translate-x-1/2 w-[calc(100%-2rem)] max-h-[90vh] bg-card dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col overflow-hidden"
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-4 shrink-0">
          <h2 className="text-[18px] font-semibold text-foreground">
            분석결과 공유하기 ({analysisIds.length}건)
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="px-7 pb-[22px] text-[14px] text-neutral-60">
          선택한 고객의 분석결과를 다른 프로젝트로 전달합니다.
        </p>

        <div className="overflow-y-auto px-7 pb-4 flex-1 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
              불러오는 중...
            </div>
          ) : partners.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[14px] text-neutral-60">
              공유 가능한 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {partners.map((partner) => {
                const checked = selectedPartnerIds.has(partner.id);
                const name = partner.partnerProjectName || "프로젝트";
                return (
                  <div
                    key={partner.id}
                    className="flex items-center gap-3 h-[48px] px-4 rounded-[8px] bg-neutral-10 cursor-pointer transition-colors"
                    onClick={() => togglePartner(partner.id)}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => togglePartner(partner.id)}
                        ariaLabel={`${name} 선택`}
                        size={22}
                      />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-neutral-20 dark:bg-neutral-30 shrink-0 grid place-items-center text-[13px] font-semibold text-neutral-60">
                      {name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-[14px] font-medium text-foreground truncate min-w-0">
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="flex justify-center mt-6">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={loading} maxButtons={5} />
            </div>
          )}
        </div>

        <div className="w-full h-px border-t border-neutral-30 shrink-0" />

        <div className="flex justify-end items-center gap-3 px-7 py-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || selectedPartnerIds.size === 0}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "공유 중..." : "공유하기"}
          </button>
        </div>
      </div>
    </>
  );
}
