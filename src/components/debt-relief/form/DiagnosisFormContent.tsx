"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useProjectType } from "@/hooks/useProjectType";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { canEditDiagnosisInfo, type DiagnosisFormState } from "@/types/debtRelief";
import { useDiagnosisForm } from "./useDiagnosisForm";
import {
  getMissingRequiredFieldLabels,
  isDiagnosisFormComplete,
  isDiagnosisFormDirty,
  isDiagnosisStepComplete,
  isRecentAndSecuredDebtOverTotal,
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
  const { isAnalysis, ready: projectTypeReady } = useProjectType();
  const { form, setForm, update, derived } = useDiagnosisForm();
  const [analyzing, setAnalyzing] = useState(false);
  // 분석하기 클릭 시 담보부채무·최근 3개월/1년 내 채무액 합이 총 채무 합계를 초과한 적이 있으면
  // true로 래치. Step3Debts가 이 값과 최신 폼 상태를 함께 계산해 여전히 초과 상태일 때만 필드
  // 테두리를 빨갛게 표시하고, 값이 다시 유효해지는 즉시(재계산 결과 false) 자동으로 해제된다.
  const [debtSumOverLimitChecked, setDebtSumOverLimitChecked] = useState(false);

  const isEdit = Boolean(diagnosisId);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  // 수정 모드: 불러온 원본 스냅샷. dirty 비교용. 생성 모드에서는 null.
  const [baselineForm, setBaselineForm] = useState<DiagnosisFormState | null>(null);
  // 수정 모드: 불러온 진단이 실제 고객 레코드와 매칭되어 있는지. 생성 모드에서는 아래
  // linkedCustomerId(고객 상세 「추가하기」 진입)로 대체 판단한다.
  const [existingCustomerId, setExistingCustomerId] = useState<number | null>(null);

  // 고객 상세 「추가하기」에서 진입한 경우: customerId를 분석 생성 시 함께 보내 자동 연결한다.
  // 수정 모드에는 적용하지 않는다(고객 매칭은 별도 UI로 이미 처리된 상태).
  const customerIdParam = searchParams.get("customerId");
  const linkedCustomerId =
    !isEdit && customerIdParam && Number.isFinite(Number(customerIdParam))
      ? Number(customerIdParam)
      : undefined;
  const customerNameParam = searchParams.get("customerName");

  // 실제 고객 레코드와 연동된 데이터인지 — 생성: URL로 넘어온 연결 대상, 수정: 이미 매칭된 고객.
  const isCustomerConnected = isEdit ? existingCustomerId !== null : Boolean(linkedCustomerId);

  // 진입 시 1회, 고객명 입력값이 비어있을 때만 쿼리스트링의 고객명으로 채운다.
  useEffect(() => {
    if (isEdit || !customerNameParam) return;
    setForm((prev) => (prev.customerName ? prev : { ...prev, customerName: customerNameParam }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, customerNameParam]);

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
  // 정보수정(재분석)은 상담중/반려된 건만 가능 — ResultHeader.handleEdit이 진입 버튼 클릭 시
  // 동일하게 막지만, 그 가드는 버튼에만 걸려 있어 이 라우트에 URL로 직접 들어오면 우회된다.
  // 여기서도 같은 기준으로 막고, 막히는 동안은 폼을 채우지 않고 로딩 상태를 유지해 빈 폼이
  // 잠깐이라도 보이지 않게 한다.
  useEffect(() => {
    if (!isEdit || !ready || !projectTypeReady || !projectId || !diagnosisId) return;

    let cancelled = false;
    let redirecting = false;
    setLoadingForm(true);
    DebtReliefService.getDiagnosisForm(projectId, diagnosisId)
      .then(({ form: data, customerId, status, isReceivedShare }) => {
        if (cancelled) return;
        // 공유(납품)받은 건은 자체 소유 데이터가 아니므로 편집(재분석) 불가 — 반려 상태로 status 게이트를
        // 통과하더라도 여기서 막는다(원본 영업 데이터를 변호사 프로젝트가 되돌려 재분석하면 안 된다).
        if (isReceivedShare) {
          redirecting = true;
          showErrorModal({
            type: "info",
            title: "정보수정 불가",
            headline: "공유받은 분석 건은 정보를 수정할 수 없습니다.",
            hideCancel: true,
          });
          router.replace(`/debt-relief/${diagnosisId}`);
          return;
        }
        // 편집 가능 상태 판정은 canEditDiagnosisInfo로 통일(버튼 게이트와 동일). 영업점은 상담중/반려,
        // 변호사 자체 생성건은 계약대기중까지 허용. status만 검사하던 URL 우회 구멍을 막는다.
        if (!canEditDiagnosisInfo({ status, isReceivedShare, isAnalysisProject: isAnalysis })) {
          redirecting = true;
          showErrorModal({
            type: "info",
            title: "정보수정 불가",
            headline: "지금은 정보수정이 불가능한 상태입니다.",
            hideCancel: true,
          });
          router.replace(`/debt-relief/${diagnosisId}`);
          return;
        }
        setForm(data);
        setBaselineForm(data);
        setExistingCustomerId(customerId);
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
        if (!cancelled && !redirecting) setLoadingForm(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, ready, projectTypeReady, isAnalysis, projectId, diagnosisId, setForm, router]);

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

    if (!Number.isFinite(derived.totalDebtManwon) || derived.totalDebtManwon <= 0) {
      showErrorModal({
        type: "info",
        title: "알림",
        headline: "채무 현황을 파악해주세요.",
        description: "분석을 진행하려면 채무 종류와 금액을 입력해주세요.",
        confirmText: "채무 현황 입력",
        hideCancel: true,
        onConfirm: () => goToStep(2),
      });
      return;
    }

    const missingFields = getMissingRequiredFieldLabels(form);
    if (missingFields.length > 0) {
      showErrorModal({
        headline: "필수 항목을 모두 입력해주세요.",
        description: `${missingFields.join(", ")} 항목이 비어있습니다.`,
      });
      return;
    }

    if (isRecentAndSecuredDebtOverTotal(form, derived.totalDebtManwon)) {
      setDebtSumOverLimitChecked(true);
      showErrorModal({
        type: "info",
        title: "알림",
        headline: "채무 금액을 다시 확인해주세요.",
        description: "담보부채무·최근 3개월/1년 내 채무액의 합이 총 채무 합계를 초과할 수 없습니다.",
        confirmText: "채무 현황 입력",
        hideCancel: true,
        onConfirm: () => goToStep(2),
      });
      return;
    }

    // 재분석(수정 모드)은 성공 시 상태/절차/현재단계가 초기화되고 AI 채팅 이력이 삭제되는
    // 되돌릴 수 없는 부수효과가 있어 확인을 먼저 받는다. 신규 생성은 잃을 기존 상태가 없어 대상 아님.
    if (isEdit) {
      showConfirmModal({
        headline: "다시 분석할까요?",
        message: "다시 분석하면 진행 상태·절차가 1단계로 초기화되고 AI 상담 채팅 이력이 삭제됩니다.",
        type: "warning",
        confirmText: "다시 분석",
        onConfirm: submitAnalyze,
      });
      return;
    }

    await submitAnalyze();
  };

  const submitAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = isEdit
        ? await DebtReliefService.updateDiagnosis(projectId ?? "", diagnosisId!, form)
        : await DebtReliefService.createDiagnosis(projectId ?? "", form, linkedCustomerId);
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
        return (
          <Step3Debts
            form={form}
            update={update}
            derived={derived}
            debtSumOverLimitChecked={debtSumOverLimitChecked}
          />
        );
      case "income":
        return <Step4IncomeExpense form={form} update={update} derived={derived} />;
      case "others":
        return <Step5Others form={form} update={update} onClose={handleClose} />;
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
        isCustomerConnected={isCustomerConnected}
      />

      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-9 pb-[90px] md:pb-12 flex flex-col md:flex-row gap-5 md:gap-[30px] items-start">
        <FormSidebar
          form={form}
          derived={derived}
          steps={FORM_STEPS}
          currentIndex={currentIndex}
          onSelectStep={goToStep}
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
          analyzeDisabled={!canAnalyze}
          isCustomerConnected={isCustomerConnected}
        />

        <section className="relative flex-1 w-full surface md:rounded-[14px] shadow-none md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none flex flex-col min-h-0 md:min-h-[780px]">
          {/* Figma 모바일: X는 폼 카드 우측 상단 — stroke는 foreground 토큰(라이트=#000급 / 다크 반전).
              "기타사항" 스텝은 본문이 토글로 바로 시작해 이 절대배치 X가 어색하게 떠 보여서,
              그 스텝에서는 숨기고 Step5Others가 자체 타이틀 행에 동일 기능의 X를 대신 렌더링한다. */}
          {step.key !== "others" && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="닫기"
              className="md:hidden absolute top-[8px] right-6 z-10 cursor-pointer w-6 h-6 grid place-items-center text-foreground hover:opacity-70"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path
                  d="M6 18L18 6M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* 헤더 — 모바일에서는 MobileFormSummaryDrawer가 대신하므로 숨김 */}
          {/* Figma: title 24/700, desc 18/500, gap 16, 패딩 28, 구분선은 카드 풀폭 */}
          {/* 좌측 이전 화살표는 제거(탭 + 하단 이전/다음 버튼과 중복). X는 생성/수정 모두 동일 기능(handleClose)으로 노출 */}
          <div className="hidden md:flex items-center justify-between gap-4 px-7 py-[26px]">
            <div className="flex items-center gap-4 min-w-0">
              <h2 className="text-[24px] font-bold leading-5 text-neutral-90 shrink-0">{step.title}</h2>
              <span className="w-px h-4 bg-neutral-60 shrink-0" />
              <p className="text-[18px] font-medium leading-5 text-neutral-60 min-w-0 truncate">{step.description}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="닫기"
              className="cursor-pointer w-6 h-6 grid place-items-center text-foreground hover:opacity-70 shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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
          <div role="separator" className="hidden md:block h-px bg-neutral-30 opacity-50" />

          {/* 본문 — Figma 모바일: 좌우 16, 상단에서 바로 필드 시작 */}
          <div className="flex-1 px-6 md:px-7 pt-4 md:pt-8 pb-7">{renderStep()}</div>

          {/* 푸터 — 데스크톱 전용, 모바일은 FormMobileActionBar(fixed)가 대신함 */}
          {/* Figma: 풀폭 Divider → 이전/다음 버튼 72×34 radius 5 */}
          <div role="separator" className="hidden md:block h-px bg-neutral-30 opacity-50" />
          <div className="hidden md:flex items-center justify-end gap-2 px-7 pt-[13px] pb-3">
            {!isFirst && (
              <button
                type="button"
                onClick={goBack}
                className="cursor-pointer inline-flex items-center justify-center w-[72px] h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground hover:bg-neutral-10"
              >
                이전
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center w-[72px] h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] hover:opacity-90 disabled:opacity-40"
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
