"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import DebtHistoryCard from "@/components/debt-relief/form/DebtHistoryCard";
import { getMissingDebtFieldLabels } from "@/components/debt-relief/form/validateDiagnosisForm";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import {
  DebtReliefService,
  fromAnalysisFormInput,
  wonToManwon,
} from "@/services/debtRelief";
import {
  canEditDiagnosisInfo,
  createEmptyDiagnosisForm,
  type DiagnosisDetail,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { useProjectType } from "@/hooks/useProjectType";
import DebtApplyChoiceModal from "./DebtApplyChoiceModal";

type Props = {
  open: boolean;
  onClose: () => void;
  detail: DiagnosisDetail;
  projectId: string;
  onApplied: () => void | Promise<void>;
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function computeTotalDebtManwon(form: DiagnosisFormState): number {
  if (form.debtInputMode === "detailed") {
    return wonToManwon(form.debts.reduce((sum, debt) => sum + (debt.principalWon || 0), 0));
  }
  let total = 0;
  for (const type of form.debtTypes) {
    total += form.debtAmounts[type] ?? 0;
  }
  return total;
}

/**
 * 결과 화면 「채무 현황 → 자세히 보기」모달.
 * /debt-relief/new?step=3의 「채무내역」카드(DebtHistoryCard)를 재사용하고,
 * 적용 시 값만 저장(reanalyze:false) / 다시 분석(reanalyze:true)을 선택한다.
 */
export default function DebtDetailModal({
  open,
  onClose,
  detail,
  projectId,
  onApplied,
}: Props) {
  const { isAnalysis, ready: projectTypeReady } = useProjectType();
  const [form, setForm] = useState<DiagnosisFormState>(createEmptyDiagnosisForm);
  const [submittingAction, setSubmittingAction] = useState<"save" | "reanalyze" | null>(null);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const submitting = submittingAction != null;

  const canEdit =
    projectTypeReady &&
    canEditDiagnosisInfo({
      status: detail.status,
      isReceivedShare: detail.isReceivedShare,
      isAnalysisProject: isAnalysis,
    });

  useEffect(() => {
    if (!open) return;
    setForm(fromAnalysisFormInput(detail.inputData));
    setSubmittingAction(null);
    setChoiceOpen(false);
  }, [open, detail.inputData]);

  const update = useCallback(
    <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const totalDebtManwon = useMemo(() => computeTotalDebtManwon(form), [form]);

  if (!open) return null;

  const handleClose = () => {
    if (submitting) return;
    setChoiceOpen(false);
    onClose();
  };

  const handleApplyClick = () => {
    if (!canEdit || submitting) return;

    const missing = getMissingDebtFieldLabels(form);
    if (missing.length > 0) {
      showErrorModal({
        headline: "필수 항목을 확인해 주세요.",
        description: "채무 정보를 모두 입력한 뒤 다시 시도해주세요.",
        hideCancel: true,
      });
      return;
    }

    setChoiceOpen(true);
  };

  const submitDebts = async (reanalyze: boolean) => {
    setSubmittingAction(reanalyze ? "reanalyze" : "save");
    try {
      await DebtReliefService.updateDiagnosisDebts(projectId, detail.id, form, reanalyze);
      await onApplied();
      setChoiceOpen(false);
      onClose();
    } catch (error) {
      console.error("Failed to update diagnosis debts:", error);
      showErrorModal({
        headline: reanalyze
          ? "다시 분석에 실패했습니다."
          : "채무 정보 저장에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <>
      <BaseModal
        onClose={handleClose}
        closeOnOverlayClick={!submitting && !choiceOpen}
        overlayClassName="bg-black/50 dark:bg-[#000000CC]"
        containerClassName="relative w-[92vw] max-w-[1100px] max-h-[90vh] rounded-[14px] bg-white dark:bg-neutral-10 shadow-[0px_13px_61px_rgba(169,169,169,0.366)] dark:shadow-none flex flex-col overflow-hidden"
        ariaLabel="채무 상세"
      >
        <div className="flex items-center justify-between px-6 md:px-7 pt-6 pb-4 shrink-0">
          <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-90">채무 상세</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="닫기"
            className="cursor-pointer grid h-6 w-6 place-items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="border-t border-neutral-30 dark:border-[#4D4D4D] shrink-0" />

        <div className="min-w-0 flex-1 overflow-y-auto px-6 md:px-7 py-5">
          <DebtHistoryCard
            form={form}
            update={update}
            totalDebtManwon={totalDebtManwon}
            disabled={!canEdit || submitting}
          />
        </div>

        <div className="flex justify-end gap-3 px-6 md:px-7 py-4 border-t border-neutral-30 dark:border-[#4D4D4D] shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] bg-white dark:bg-neutral-10 text-[14px] font-semibold text-ink dark:text-neutral-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            닫기
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={submitting}
              className="cursor-pointer h-[34px] px-4 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              적용하기
            </button>
          )}
        </div>
      </BaseModal>

      <DebtApplyChoiceModal
        open={choiceOpen}
        submittingAction={submittingAction}
        onClose={() => !submitting && setChoiceOpen(false)}
        onSaveOnly={() => submitDebts(false)}
        onReanalyze={() => submitDebts(true)}
      />
    </>
  );
}
