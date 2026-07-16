"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisService } from "@/services/analysis";
import { AnalysisPartnersService } from "@/services/analysisPartners";
import { CustomersService } from "@/services/customers";
import type { AnalysisPartner } from "@/types/analysisPartners";
import type { BulkDeliverAnalysisItem } from "@/types/analysis";
import Pagination from "@/components/common/Pagination";
import RadioButton from "@/components/customers/sms/RadioButton";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/lib/errorModalEvents";
import { formatPhoneInput } from "@/utils/format";
import AnalysisShareContactStep from "./AnalysisShareContactStep";

type ShareStep = "partners" | "contact";

type ContactDraft = {
  contact: string;
  referenceNote?: string;
};

type ContactMeta = {
  customerName: string;
  initialContact: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
  /** 공유할 진단(분석) ID 목록. 목록에서 다건 선택 또는 행 단건 공유 모두 지원. */
  analysisIds: string[];
  /** 상세 페이지에서 전달 시 fetch 생략 */
  customerName?: string;
  /** 고객 매칭된 경우 프리필 연락처 */
  initialContact?: string;
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

async function loadContactMetaForId(
  analysisId: string,
  projectId: string
): Promise<ContactMeta> {
  try {
    const detailRes = await AnalysisService.detail(Number(analysisId), projectId);
    const analysis = detailRes.data.data;
    const name = analysis.inputData?.customerName ?? "";

    let phone = "";
    if (analysis.customerId != null) {
      try {
        const customerRes = await CustomersService.detail(String(analysis.customerId)).withProject(
          projectId
        );
        phone = customerRes.data?.data?.contact1 ?? "";
      } catch (error) {
        console.error("Failed to load matched customer contact for share:", error);
      }
    }

    return {
      customerName: name,
      initialContact: phone ? formatPhoneInput(phone) : "",
    };
  } catch (error) {
    console.error("Failed to load analysis detail for share contact step:", error);
    return { customerName: "", initialContact: "" };
  }
}

export default function AnalysisShareModal({
  open,
  onClose,
  onSuccess,
  projectId,
  analysisIds,
  customerName: customerNameProp,
  initialContact: initialContactProp,
}: Props) {
  const [step, setStep] = useState<ShareStep>("partners");
  const [partners, setPartners] = useState<AnalysisPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [contactIndex, setContactIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, ContactDraft>>({});
  const [metaById, setMetaById] = useState<Record<string, ContactMeta>>({});
  const [prefillLoading, setPrefillLoading] = useState(false);

  const loadSessionRef = useRef(0);
  const hasPrefillProps = customerNameProp != null || initialContactProp != null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const currentAnalysisId = analysisIds[contactIndex] ?? "";
  const isLastContact = contactIndex >= analysisIds.length - 1;
  const currentMeta = metaById[currentAnalysisId];
  const currentDraft = drafts[currentAnalysisId];

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

  // 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      loadSessionRef.current += 1;
      setStep("partners");
      setPage(1);
      setPartners([]);
      setSelectedPartnerId(null);
      setSubmitting(false);
      setContactIndex(0);
      setDrafts({});
      setMetaById({});
      setPrefillLoading(false);
    }
  }, [open]);

  const ensureMetaLoaded = useCallback(
    async (ids: string[]) => {
      if (!projectId || ids.length === 0) return;

      const session = ++loadSessionRef.current;
      setPrefillLoading(true);

      try {
        const nextMeta: Record<string, ContactMeta> = {};

        // 상세 단건 prop이 있으면 첫 ID에 우선 적용
        if (hasPrefillProps && ids[0]) {
          nextMeta[ids[0]] = {
            customerName: customerNameProp ?? "",
            initialContact: initialContactProp
              ? formatPhoneInput(initialContactProp)
              : "",
          };
        }

        const idsToFetch = ids.filter((id) => !nextMeta[id]);
        const results = await Promise.all(
          idsToFetch.map(async (id) => {
            const meta = await loadContactMetaForId(id, projectId);
            return [id, meta] as const;
          })
        );

        if (session !== loadSessionRef.current) return;

        for (const [id, meta] of results) {
          nextMeta[id] = meta;
        }

        setMetaById((prev) => ({ ...prev, ...nextMeta }));
      } finally {
        if (session === loadSessionRef.current) {
          setPrefillLoading(false);
        }
      }
    },
    [projectId, hasPrefillProps, customerNameProp, initialContactProp]
  );

  const requestClose = useCallback(() => {
    if (submitting) return;

    const needsConfirm = step === "contact" || Object.keys(drafts).length > 0;
    if (!needsConfirm) {
      onClose();
      return;
    }

    showConfirmModal({
      title: "공유 취소",
      headline: "입력한 정보가 저장되지 않습니다.",
      message: "정말로 닫으시겠습니까?",
      type: "warning",
      confirmText: "닫기",
      cancelText: "계속 작성",
      onConfirm: () => {
        onClose();
      },
    });
  }, [submitting, step, drafts, onClose]);

  const handleGoToContactStep = () => {
    if (selectedPartnerId == null || analysisIds.length === 0) {
      showErrorModal({
        headline: "공유할 프로젝트를 선택해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    setContactIndex(0);
    setStep("contact");
    void ensureMetaLoaded(analysisIds);
  };

  const saveDraftForCurrent = (
    payload: { contact: string; referenceNote?: string },
    options?: { force?: boolean }
  ) => {
    if (!currentAnalysisId) return drafts;

    const hasContent = Boolean(payload.contact || payload.referenceNote);
    const hadDraft = Boolean(drafts[currentAnalysisId]);
    // 빈 입력으로 draft를 만들면 연동 고객 prefill을 가리므로, 강제/기존 draft/내용 있을 때만 저장
    if (!options?.force && !hasContent && !hadDraft) {
      return drafts;
    }

    const nextDrafts: Record<string, ContactDraft> = {
      ...drafts,
      [currentAnalysisId]: {
        contact: payload.contact,
        ...(payload.referenceNote ? { referenceNote: payload.referenceNote } : {}),
      },
    };
    setDrafts(nextDrafts);
    return nextDrafts;
  };

  const handleContactBack = (payload: { contact: string; referenceNote?: string }) => {
    if (submitting) return;
    saveDraftForCurrent(payload);
    if (contactIndex > 0) {
      setContactIndex((prev) => prev - 1);
      return;
    }
    setStep("partners");
  };

  const handleContactSubmit = (payload: { contact: string; referenceNote?: string }) => {
    if (!currentAnalysisId) return;

    const nextDrafts = saveDraftForCurrent(payload, { force: true });

    if (!isLastContact) {
      setContactIndex((prev) => prev + 1);
      return;
    }

    void submitDeliver(nextDrafts);
  };

  const submitDeliver = async (finalDrafts: Record<string, ContactDraft>) => {
    if (selectedPartnerId == null || analysisIds.length === 0) {
      showErrorModal({
        headline: "공유할 프로젝트를 선택해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }

    const deliveryItems: BulkDeliverAnalysisItem[] = [];
    for (const id of analysisIds) {
      const draft = finalDrafts[id];
      if (!draft?.contact) {
        showErrorModal({
          headline: "필수 정보를 입력해주세요.",
          description: "모든 건의 연락처를 입력한 뒤 다시 시도해주세요.",
          hideCancel: true,
          confirmText: "확인",
        });
        return;
      }
      deliveryItems.push({
        analysisId: Number(id),
        contact: draft.contact,
        ...(draft.referenceNote ? { referenceNote: draft.referenceNote } : {}),
      });
    }

    if (deliveryItems.length !== analysisIds.length) {
      showErrorModal({
        headline: "필수 정보를 입력해주세요.",
        description: "모든 건의 연락처를 입력한 뒤 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await AnalysisService.bulkDeliver({
        projectId,
        selectionType: "ids",
        analysisIds: analysisIds.map(Number),
        expectedCount: analysisIds.length,
        partnerId: selectedPartnerId,
        deliveryItems,
      });
      const result = response.data.data;
      const failedCount = result.failedCount ?? 0;
      const successCount = result.successCount ?? 0;

      if (failedCount > 0 && result.failedAnalysisIds?.length) {
        console.error("Some analysis deliveries failed:", result.failedAnalysisIds);
      }

      if (successCount === 0) {
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
    } catch (error: unknown) {
      console.error("Failed to deliver analysis:", error);
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code === "ANALYSIS_ALREADY_DELIVERED" || code === "ANALYSIS_ALREADY_SHARED_TO_OTHER_PROJECT") {
        showErrorModal({
          headline: "이미 공유된 진단이 포함되어 있습니다.",
          description: "선택 항목을 확인한 뒤 다시 시도해주세요.",
        });
      } else if (code === "ANALYSIS_PARTNER_NOT_APPROVED") {
        showErrorModal({
          headline: "공유할 수 없는 파트너입니다.",
          description: "승인된 파트너만 선택할 수 있습니다.",
        });
      } else {
        showErrorModal({
          headline: "분석결과 공유에 실패했습니다.",
          description: "잠시 후 다시 시도해주세요.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const customerNameTitle = `${currentMeta?.customerName || "고객"}님 고객 정보 입력`;

  // draft가 있으면 draft 우선(뒤로가기·미완료 입력 복원), 없으면 meta prefill
  const stepInitialContact =
    currentDraft != null
      ? currentDraft.contact
        ? formatPhoneInput(currentDraft.contact)
        : ""
      : (currentMeta?.initialContact ?? "");
  const stepInitialReferenceNote = currentDraft?.referenceNote ?? "";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40"
        onClick={() => !submitting && requestClose()}
        aria-hidden
      />

      {step === "contact" ? (
        <AnalysisShareContactStep
          key={currentAnalysisId}
          customerNameTitle={customerNameTitle}
          initialContact={stepInitialContact}
          initialReferenceNote={stepInitialReferenceNote}
          prefillLoading={prefillLoading && !currentMeta}
          submitting={submitting}
          submitLabel={isLastContact ? "공유하기" : "다음으로"}
          onBack={handleContactBack}
          onClose={requestClose}
          onSubmit={handleContactSubmit}
        />
      ) : (
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
              onClick={requestClose}
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
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="공유 대상 프로젝트">
                {partners.map((partner) => {
                  const selected = selectedPartnerId === partner.id;
                  const name = partner.partnerProjectName || "프로젝트";
                  return (
                    <button
                      key={partner.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedPartnerId(partner.id)}
                      className="cursor-pointer flex items-center gap-3 h-[48px] px-4 rounded-[8px] bg-neutral-10 dark:bg-neutral-25 text-left transition-colors hover:bg-neutral-20 dark:hover:bg-neutral-30"
                    >
                      <span className="shrink-0 flex items-center justify-center" aria-hidden>
                        <RadioButton checked={selected} />
                      </span>
                      <div className="w-6 h-6 rounded-full bg-neutral-20 dark:bg-neutral-30 shrink-0 grid place-items-center text-[13px] font-semibold text-neutral-60">
                        {name.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="text-[14px] font-medium text-foreground truncate min-w-0">
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && !loading && (
              <div className="flex justify-center mt-6">
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

          <div className="w-full h-px border-t border-neutral-30 shrink-0" />

          <div className="flex justify-end items-center gap-3 px-7 py-3 shrink-0">
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleGoToContactStep}
              disabled={submitting || selectedPartnerId == null}
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              공유하기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
