"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { DiagnosisFormState } from "@/types/debtRelief";
import { useDiagnosisForm } from "./useDiagnosisForm";
import {
  getMissingRequiredFieldLabels,
  isDiagnosisFormComplete,
  isDiagnosisFormDirty,
  isDiagnosisStepComplete,
} from "./validateDiagnosisForm";
import { FORM_STEPS } from "./steps";
import FormSidebar from "./FormSidebar";
import MobileFormSummaryDrawer from "./MobileFormSummaryDrawer";
import FormMobileActionBar from "./FormMobileActionBar";
import AnalysisLoadingOverlay from "./AnalysisLoadingOverlay";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2Assets from "./Step2Assets";
import Step3Debts from "./Step3Debts";
import Step4IncomeExpense from "./Step4IncomeExpense";
import Step5Others from "./Step5Others";

export default function DiagnosisFormContent({ diagnosisId }: { diagnosisId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projectId, ready] = useSelectedProjectId();
  const { form, setForm, update, derived } = useDiagnosisForm();
  const [analyzing, setAnalyzing] = useState(false);

  const isEdit = Boolean(diagnosisId);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  // 수정 모드: 불러온 원본 스냅샷. dirty 비교용. 생성 모드에서는 null.
  const [baselineForm, setBaselineForm] = useState<DiagnosisFormState | null>(null);

  // 현재 단계는 ?step= 쿼리스트링을 단일 진실 공급원으로 삼는다(1-indexed).
  // 브라우저 뒤로/앞으로 가기로 쿼리가 바뀌면 currentIndex도 함께 갱신된다.
  const stepParam = Number(searchParams.get("step"));
  const currentIndex =
    Number.isInteger(stepParam) && stepParam >= 1 && stepParam <= FORM_STEPS.length
      ? stepParam - 1
      : 0;

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), FORM_STEPS.length - 1);
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(clamped + 1));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // 편집 모드: 기존 진단의 원본 입력값을 불러와 폼을 채운다.
  useEffect(() => {
    if (!isEdit || !ready || !projectId || !diagnosisId) return;

    let cancelled = false;
    setLoadingForm(true);
    DebtReliefService.getDiagnosisForm(projectId, diagnosisId)
      .then((data) => {
        if (cancelled) return;
        setForm(data);
        setBaselineForm(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load diagnosis form:", error);
        showErrorModal({
          headline: "정보를 불러오지 못했습니다.",
          description: "잠시 후 다시 시도해주세요.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingForm(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, ready, projectId, diagnosisId, setForm]);

  // 생성: 필수값 전부 채워졌을 때만. 수정: 원본 대비 변경 + 필수값 유지일 때만.
  const canAnalyze = useMemo(() => {
    if (!isDiagnosisFormComplete(form)) return false;
    if (isEdit) return isDiagnosisFormDirty(form, baselineForm);
    return true;
  }, [form, isEdit, baselineForm]);

  // 생성 플로우만: 현재 스텝 필수값이 채워져야 "다음" 활성. 수정은 자유롭게 이동.
  const canGoNext = useMemo(() => {
    if (isEdit) return true;
    return isDiagnosisStepComplete(form, FORM_STEPS[currentIndex].key);
  }, [form, isEdit, currentIndex]);

  const step = FORM_STEPS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === FORM_STEPS.length - 1;

  const goBack = () => {
    if (isFirst) {
      router.push(isEdit ? `/debt-relief/${diagnosisId}` : "/debt-relief");
      return;
    }
    goToStep(currentIndex - 1);
  };

  const goNext = () => {
    if (!isLast && canGoNext) goToStep(currentIndex + 1);
  };

  // 모바일 폼 카드 우측 상단 X: 스텝과 무관하게 항상 이전 페이지(허브 또는 상세)로 나간다.
  // goBack의 isFirst 분기와 동일한 목적지를 재사용한다.
  const handleClose = () => {
    router.push(isEdit ? `/debt-relief/${diagnosisId}` : "/debt-relief");
  };

  const handleAnalyze = async () => {
    if (analyzing || !canAnalyze) return;

    const missingFields = getMissingRequiredFieldLabels(form);
    if (missingFields.length > 0) {
      showErrorModal({
        headline: "필수 항목을 모두 입력해주세요.",
        description: `${missingFields.join(", ")} 항목이 비어있습니다.`,
      });
      return;
    }

    setAnalyzing(true);
    try {
      const result = isEdit
        ? await DebtReliefService.updateDiagnosis(projectId ?? "", diagnosisId!, form)
        : await DebtReliefService.createDiagnosis(projectId ?? "", form);
      router.push(`/debt-relief/${result.id}`);
    } catch (error) {
      console.error("Failed to submit diagnosis:", error);
      showErrorModal({
        headline: "분석 요청에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
      setAnalyzing(false);
    }
  };

  if (loadingForm) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }

  const renderStep = () => {
    switch (step.key) {
      case "basic":
        return <Step1BasicInfo form={form} update={update} />;
      case "assets":
        return <Step2Assets form={form} update={update} />;
      case "debts":
        return <Step3Debts form={form} update={update} derived={derived} />;
      case "income":
        return <Step4IncomeExpense form={form} update={update} derived={derived} />;
      case "others":
        return <Step5Others form={form} update={update} />;
    }
  };

  return (
    <>
      {analyzing && <AnalysisLoadingOverlay />}

      <MobileFormSummaryDrawer
        form={form}
        derived={derived}
        steps={FORM_STEPS}
        currentIndex={currentIndex}
        onSelectStep={goToStep}
        onAnalyze={handleAnalyze}
        analyzing={analyzing}
        analyzeDisabled={!canAnalyze}
      />

      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-9 pb-[88px] md:pb-12 flex flex-col md:flex-row gap-5 md:gap-[30px] items-start">
        <FormSidebar
          form={form}
          derived={derived}
          steps={FORM_STEPS}
          currentIndex={currentIndex}
          onSelectStep={goToStep}
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
          analyzeDisabled={!canAnalyze}
        />

        <section className="flex-1 w-full surface md:rounded-[14px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none flex flex-col min-h-[560px] md:min-h-[780px]">
          {/* Figma 모바일: X는 sticky 바가 아니라 폼 카드 우측 상단 */}
          <div className="md:hidden flex justify-end px-4 pt-3">
            <button
              type="button"
              onClick={handleClose}
              aria-label="닫기"
              className="cursor-pointer w-9 h-9 grid place-items-center text-neutral-50 hover:text-neutral-70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 18L18 6M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* 헤더 — 모바일에서는 MobileFormSummaryDrawer가 대신하므로 숨김 */}
          {/* Figma: title 24/700, desc 18/500, gap 16, 패딩 28, 구분선은 카드 풀폭 */}
          <div className="hidden md:flex items-center gap-4 px-7 py-[26px]">
            <button
              type="button"
              onClick={goBack}
              aria-label="이전"
              className="cursor-pointer w-6 h-6 grid place-items-center text-foreground hover:opacity-70 shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-[24px] font-bold leading-5 text-neutral-90 shrink-0">{step.title}</h2>
            <span className="w-px h-4 bg-neutral-60 shrink-0" />
            <p className="text-[18px] font-medium leading-5 text-neutral-60 min-w-0 truncate">{step.description}</p>
          </div>
          <div role="separator" className="hidden md:block h-px bg-neutral-30 opacity-50" />

          {/* 본문 — 모바일은 위 X 행이 있으므로 상단 패딩을 줄임. Figma content inset 28px */}
          <div className="flex-1 px-6 md:px-7 pt-2 md:pt-8 pb-7">{renderStep()}</div>

          {/* 푸터 — 데스크톱 전용, 모바일은 FormMobileActionBar(fixed)가 대신함 */}
          {/* Figma: 풀폭 Divider → 다음 버튼 72×34 radius 5 */}
          <div role="separator" className="hidden md:block h-px bg-neutral-30 opacity-50" />
          <div className="hidden md:flex items-center justify-end gap-2 px-7 pt-[13px] pb-3">
            {!isFirst && (
              <button
                type="button"
                onClick={goBack}
                className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10"
              >
                이전
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="cursor-pointer disabled:cursor-not-allowed h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em] hover:opacity-90 disabled:opacity-40"
              >
                다음
              </button>
            )}
          </div>
        </section>
      </div>

      <FormMobileActionBar
        isFirst={isFirst}
        isLast={isLast}
        onBack={goBack}
        onNext={goNext}
        nextDisabled={!canGoNext}
      />
    </>
  );
}
