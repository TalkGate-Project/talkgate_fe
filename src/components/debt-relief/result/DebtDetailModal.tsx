"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import ChevronLeftIcon from "@/components/common/icons/ChevronLeftIcon";
import AnalysisLoadingOverlayHost, {
  type AnalysisProgressHandle,
} from "@/components/debt-relief/form/AnalysisLoadingOverlayHost";
import DebtHistoryCard from "@/components/debt-relief/form/DebtHistoryCard";
import {
  getMissingDebtFieldLabels,
  getMissingDebtItemFieldLabels,
} from "@/components/debt-relief/form/validateDiagnosisForm";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import {
  DebtReliefService,
  fromAnalysisFormInput,
  wonToManwon,
} from "@/services/debtRelief";
import {
  canEditDiagnosisInfo,
  canSaveDiagnosisDebts,
  createEmptyDiagnosisForm,
  type DiagnosisDetail,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { useProjectType } from "@/hooks/useProjectType";
import DebtApplyChoiceModal from "./DebtApplyChoiceModal";
import styles from "./DebtDetailModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  detail: DiagnosisDetail;
  projectId: string;
  onApplied: () => void | Promise<void>;
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="text-neutral-50">
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

function computeTotalDebtManwon(form: DiagnosisFormState): number {
  if (form.debtInputMode === "detailed") {
    return wonToManwon(form.debts.reduce((sum, debt) => sum + (debt.currentBalanceWon || 0), 0));
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
  const { ready: projectTypeReady } = useProjectType();
  const [form, setForm] = useState<DiagnosisFormState>(createEmptyDiagnosisForm);
  const [submittingAction, setSubmittingAction] = useState<"save" | "reanalyze" | null>(null);
  const [choiceOpen, setChoiceOpen] = useState(false);
  // 적용하기 클릭 시 채무 항목의 대출일·만기일·금액·금리 중 비어있는 값이 발견된 적이 있으면
  // true로 래치. DebtHistoryCard가 최신 폼 상태로 매 렌더마다 재계산해 값이 채워진 셀만 즉시 해제한다.
  const [showDebtItemFieldErrors, setShowDebtItemFieldErrors] = useState(false);
  const submitting = submittingAction != null;
  // 재분석 대기 중 전체 화면 로딩으로 전환 — 진행률 상태는 오버레이 안에 가둬 잦은 갱신이
  // 이 모달 트리 전체를 리렌더하지 않게 한다(AnalysisLoadingOverlayHost 주석 참고).
  const analysisProgressRef = useRef<AnalysisProgressHandle | null>(null);

  // 값만 저장은 자체 소유 건이면 상태·공유 여부와 무관하게 가능하다. 재분석만 상태·공유 조건을 받는다.
  const canSaveDebts =
    projectTypeReady &&
    canSaveDiagnosisDebts({
      isReceivedShare: detail.isReceivedShare,
    });
  const canReanalyze =
    projectTypeReady &&
    canEditDiagnosisInfo({
      status: detail.status,
      isReceivedShare: detail.isReceivedShare,
      deliveryStatus: detail.deliveryStatus,
    });

  useEffect(() => {
    if (!open) return;
    setForm(fromAnalysisFormInput(detail.inputData));
    setSubmittingAction(null);
    setChoiceOpen(false);
    setShowDebtItemFieldErrors(false);
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
    if (!canSaveDebts || submitting) return;

    const missing = [...getMissingDebtFieldLabels(form), ...getMissingDebtItemFieldLabels(form)];
    if (missing.length > 0) {
      setShowDebtItemFieldErrors(true);
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
    const hasPermission = reanalyze ? canReanalyze : canSaveDebts;
    if (!hasPermission || submitting) return;

    setSubmittingAction(reanalyze ? "reanalyze" : "save");
    // 다시 분석은 전체 화면 로딩으로 넘어가므로 뒤에 겹쳐 있는 선택 모달은 먼저 닫는다.
    if (reanalyze) setChoiceOpen(false);
    try {
      await DebtReliefService.updateDiagnosisDebts(projectId, detail.id, form, reanalyze);
      // 진행률을 100%까지 채우고 여운을 준 뒤 화면을 되돌린다(신규/수정 폼 분석 흐름과 동일).
      if (reanalyze) await analysisProgressRef.current?.settle();
      await onApplied();
      setChoiceOpen(false);
      onClose();
    } catch (error) {
      console.error("Failed to update diagnosis debts:", error);
      if (reanalyze) analysisProgressRef.current?.abort();
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
      {/* ref가 항상 살아 있어야 하므로 조건부 렌더하지 않는다(active로만 제어). */}
      <AnalysisLoadingOverlayHost
        active={submittingAction === "reanalyze"}
        ref={analysisProgressRef}
      />

      <BaseModal
        onClose={handleClose}
        closeOnOverlayClick={!submitting && !choiceOpen}
        overlayClassName="bg-black/50 dark:bg-[#000000CC]"
        ariaLabel="채무 상세"
        fullScreenOnMobile
        disableAutoContainerSizing
        // 모바일: 바깥 여백 없이 화면 전체를 채우는 풀스크린 모달. md+: 기존처럼 중앙에 뜨는 카드형 모달.
        positionerClassName="h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4"
        containerClassName="relative w-full h-full rounded-none md:w-[92vw] md:max-w-[1100px] md:max-h-[90vh] md:rounded-[14px] bg-white dark:bg-neutral-10 shadow-[0px_13px_61px_rgba(169,169,169,0.366)] dark:shadow-none flex flex-col overflow-hidden"
      >
        {/* 모바일: 뒤로가기 화살표 + 타이틀 (풀스크린 페이지 헤더) */}
        <div className="flex md:hidden items-center gap-3 px-5 pt-5 pb-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="닫기"
            className="cursor-pointer grid h-6 w-6 place-items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon />
          </button>
          <h2 className="text-[18px] font-semibold text-ink dark:text-[#FDFDFD]">채무 상세</h2>
        </div>

        {/* md+: 타이틀 + X 닫기 */}
        <div className="hidden md:flex items-center justify-between px-6 md:px-7 pt-6 pb-4 shrink-0">
          <h2 className="text-[18px] font-semibold text-ink dark:text-[#FDFDFD]">채무 상세</h2>
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
          <div className={styles.darkModeDebtDetails}>
            <DebtHistoryCard
              form={form}
              update={update}
              totalDebtManwon={totalDebtManwon}
              disabled={submitting}
              areaBackgroundClassName="bg-neutral-10"
              showDebtItemFieldErrors={showDebtItemFieldErrors}
              scrollFadeColorClassName="[--debt-scroll-fade:#FFFFFF] dark:[--debt-scroll-fade:#111111]"
            />
          </div>
        </div>

        <div className="flex gap-3 px-5 md:px-7 py-4 border-t border-neutral-30 dark:border-[#4D4D4D] shrink-0 md:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="cursor-pointer inline-flex h-11 flex-1 items-center justify-center rounded-[5px] border border-neutral-30 bg-white px-4 text-[14px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4D4D4D] dark:bg-neutral-10 dark:text-[#FDFDFD] md:h-[34px] md:flex-none"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={!canSaveDebts || submitting}
            className="cursor-pointer inline-flex h-11 flex-1 items-center justify-center rounded-[5px] bg-neutral-90 px-4 text-[14px] font-semibold text-neutral-20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F5F5F5] dark:text-[#333333] md:h-[34px] md:flex-none"
          >
            적용하기
          </button>
        </div>
      </BaseModal>

      <DebtApplyChoiceModal
        open={choiceOpen}
        submittingAction={submittingAction}
        canSaveOnly={canSaveDebts}
        canReanalyze={canReanalyze}
        onClose={() => !submitting && setChoiceOpen(false)}
        onSaveOnly={() => submitDebts(false)}
        onReanalyze={() => submitDebts(true)}
      />
    </>
  );
}
