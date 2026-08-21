"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMyMember } from "@/hooks/useMyMember";
import { useProjectType } from "@/hooks/useProjectType";
import { DebtReliefService } from "@/services/debtRelief";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  canEditDiagnosisInfo,
  createEmptyDiagnosisForm,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { useDiagnosisForm } from "./useDiagnosisForm";
import { useAnalysisDraft } from "./useAnalysisDraft";
import {
  getMissingDebtItemFieldLabels,
  getMissingRequiredFieldLabels,
  getMissingRequiredFieldLabelsForStep,
  isDiagnosisFormComplete,
  isDiagnosisFormDirty,
  isRecentAndSecuredDebtOverTotal,
} from "./validateDiagnosisForm";
import { FORM_STEPS } from "./steps";
import FormSidebar from "./FormSidebar";
import MobileFormSummaryDrawer from "./MobileFormSummaryDrawer";
import FormMobileActionBar from "./FormMobileActionBar";
import FormStepNavButton from "./FormStepNavButton";
import AnalysisLoadingOverlayHost, {
  type AnalysisProgressHandle,
} from "./AnalysisLoadingOverlayHost";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2Assets from "./Step2Assets";
import Step3Debts from "./Step3Debts";
import Step4IncomeExpense from "./Step4IncomeExpense";
import Step5Others from "./Step5Others";
import AnalysisRequiredFieldsModal from "./AnalysisRequiredFieldsModal";
import AnalysisDebtSelectionModal from "./AnalysisDebtSelectionModal";
import AnalysisDraftRestoreModal from "./AnalysisDraftRestoreModal";
import CustomerLinkModeModal from "@/components/chat/customer-link/CustomerLinkModeModal";
import CustomerMatchModal from "@/components/debt-relief/result/CustomerMatchModal";
import CustomerCreateModal from "@/components/customers/CustomerCreateModal";
import { CustomersService } from "@/services/customers";
import type { ConnectableCustomer } from "@/types/analysis";

function AnalyzeSparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9.38432 15.6434L9.37588 15.6447L9.32595 15.6672L9.31188 15.6697L9.30204 15.6672L9.2521 15.6441C9.2446 15.6423 9.23897 15.6436 9.23522 15.6479L9.23241 15.6543L9.22045 15.929L9.22397 15.9418L9.231 15.9502L9.30414 15.9977L9.31469 16.0002L9.32313 15.9977L9.39627 15.9502L9.40471 15.9399L9.40753 15.929L9.39557 15.655C9.3937 15.6481 9.38995 15.6443 9.38432 15.6434ZM9.56998 15.5709L9.56014 15.5722L9.43074 15.6319L9.4237 15.6383L9.42159 15.6453L9.43425 15.9213L9.43777 15.929L9.44339 15.9341L9.58475 15.9932C9.59366 15.9953 9.60046 15.9936 9.60515 15.9881L9.60796 15.9791L9.58405 15.585C9.58171 15.5769 9.57702 15.5722 9.56998 15.5709ZM9.06714 15.5722C9.06404 15.5705 9.06034 15.5699 9.0568 15.5706C9.05326 15.5713 9.05016 15.5733 9.04815 15.576L9.04393 15.585L9.02002 15.9791C9.02049 15.9868 9.02447 15.9919 9.03198 15.9945L9.04252 15.9932L9.18388 15.9335L9.19092 15.9284L9.19303 15.9213L9.20569 15.6453L9.20358 15.6376L9.19654 15.6312L9.06714 15.5722Z"
        fill="url(#analyzeSparkleSmallDesktopFooter)"
      />
      <path
        d="M6.93167 4.21289C7.35223 3.08976 9.05277 3.05574 9.55139 4.11085L9.59359 4.21353L10.1611 5.72816C10.2912 6.07551 10.5014 6.39338 10.7775 6.66031C11.0536 6.92724 11.3893 7.13702 11.7618 7.27551L11.9144 7.3275L13.5742 7.84478C14.8049 8.22857 14.8422 9.78042 13.6867 10.2354L13.5742 10.274L11.9144 10.7919C11.5336 10.9105 11.1852 11.1023 10.8926 11.3543C10.5999 11.6062 10.3699 11.9126 10.2181 12.2526L10.1611 12.3912L9.59429 13.9065C9.17373 15.0296 7.4732 15.0636 6.97528 14.0092L6.93167 13.9065L6.36483 12.3919C6.23485 12.0444 6.0247 11.7264 5.74857 11.4594C5.47244 11.1923 5.13675 10.9824 4.76416 10.8439L4.61225 10.7919L2.95251 10.2746C1.72106 9.8908 1.68379 8.33896 2.83998 7.88457L2.95251 7.84478L4.61225 7.3275C4.99289 7.2088 5.34121 7.01699 5.63371 6.76501C5.92622 6.51303 6.1561 6.20673 6.30786 5.86678L6.36483 5.72816L6.93167 4.21289ZM13.8892 2C14.0208 2 14.1497 2.03368 14.2614 2.09721C14.373 2.16075 14.4629 2.25158 14.5208 2.3594L14.5545 2.43449L14.8007 3.09297L15.523 3.31759C15.6548 3.35847 15.7704 3.43415 15.8551 3.53504C15.9397 3.63593 15.9897 3.75749 15.9986 3.88431C16.0075 4.01113 15.9749 4.1375 15.905 4.24741C15.8351 4.35732 15.731 4.44582 15.6059 4.5017L15.523 4.5325L14.8014 4.75713L14.5552 5.41625C14.5104 5.53654 14.4274 5.64196 14.3168 5.71917C14.2062 5.79637 14.073 5.84188 13.934 5.84992C13.795 5.85796 13.6566 5.82818 13.5362 5.76434C13.4158 5.7005 13.3189 5.60549 13.2577 5.49134L13.2239 5.41625L12.9778 4.75777L12.2555 4.53314C12.1237 4.49227 12.0081 4.41659 11.9234 4.3157C11.8387 4.21481 11.7888 4.09325 11.7799 3.96643C11.771 3.83961 11.8036 3.71324 11.8735 3.60333C11.9434 3.49342 12.0475 3.40492 12.1725 3.34904L12.2555 3.31824L12.9771 3.09361L13.2232 2.43449C13.2706 2.30769 13.3604 2.19761 13.4798 2.11969C13.5992 2.04177 13.7424 1.99992 13.8892 2Z"
        fill="url(#analyzeSparkleMainDesktopFooter)"
      />
      <defs>
        <linearGradient id="analyzeSparkleSmallDesktopFooter" x1="9.31399" y1="15.5703" x2="9.31399" y2="16.0002" gradientUnits="userSpaceOnUse">
          <stop className="analyze-sparkle-start" stopColor="#00E272" />
          <stop className="analyze-sparkle-end" offset="1" stopColor="#A9FFD4" />
        </linearGradient>
        <linearGradient id="analyzeSparkleMainDesktopFooter" x1="9" y1="2" x2="9" y2="14.7752" gradientUnits="userSpaceOnUse">
          <stop className="analyze-sparkle-start" stopColor="#00E272" />
          <stop className="analyze-sparkle-end" offset="1" stopColor="#A9FFD4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DiagnosisFormContent({ diagnosisId }: { diagnosisId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projectId, ready] = useSelectedProjectId();
  const { member, loading: memberLoading } = useMyMember(projectId);
  const { isAnalysis, ready: projectTypeReady } = useProjectType();
  const { form, setForm, update, derived } = useDiagnosisForm();
  const [analyzing, setAnalyzing] = useState(false);
  const [requiredFieldsModalOpen, setRequiredFieldsModalOpen] = useState(false);
  const [debtSelectionModalOpen, setDebtSelectionModalOpen] = useState(false);
  // 분석 API는 진행 신호를 주지 않아 경과시간 기반 추정 진행률을 보여준다.
  // 진행률 상태는 오버레이 안에 가둬 두고 여기서는 완료/중단만 지시한다.
  const analysisProgressRef = useRef<AnalysisProgressHandle | null>(null);
  // 분석하기 클릭 시 담보부채무·최근 3개월/1년 내 채무액 합이 총 채무 합계를 초과한 적이 있으면
  // true로 래치. Step3Debts가 이 값과 최신 폼 상태를 함께 계산해 여전히 초과 상태일 때만 필드
  // 테두리를 빨갛게 표시하고, 값이 다시 유효해지는 즉시(재계산 결과 false) 자동으로 해제된다.
  const [debtSumOverLimitChecked, setDebtSumOverLimitChecked] = useState(false);
  // 분석하기 클릭 시 상세모드 채무 항목의 대출일·만기일·금액·금리 중 비어있는 값이 발견된 적이
  // 있으면 true로 래치. 위 debtSumOverLimitChecked와 동일한 방식으로, 값이 채워지면 해당 셀만
  // 즉시 해제된다.
  const [debtItemFieldsMissingChecked, setDebtItemFieldsMissingChecked] = useState(false);

  const isEdit = Boolean(diagnosisId);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  // 수정 모드: 불러온 원본 스냅샷. dirty 비교용. 생성 모드에서는 null.
  const [baselineForm, setBaselineForm] = useState<DiagnosisFormState | null>(null);
  // 수정 모드: 불러온 진단이 실제 고객 레코드와 매칭되어 있는지. 생성 모드에서는 아래
  // linkedCustomerId(고객 상세 「추가하기」 진입)로 대체 판단한다.
  const [existingCustomerId, setExistingCustomerId] = useState<number | null>(null);
  const [linkedCustomerSummary, setLinkedCustomerSummary] = useState<{
    id: number;
    name: string;
    contact: string;
  } | null>(null);

  // 고객 상세 「추가하기」에서 진입한 경우: customerId를 분석 생성 시 함께 보내 자동 연결한다.
  // 수정 모드에는 적용하지 않는다(고객 매칭은 별도 UI로 이미 처리된 상태).
  const customerIdParam = searchParams.get("customerId");
  const initialLinkedCustomerId =
    !isEdit && customerIdParam && Number.isFinite(Number(customerIdParam))
      ? Number(customerIdParam)
      : undefined;
  const customerNameParam = searchParams.get("customerName");
  const genderParam = searchParams.get("gender");

  // 실제 고객 레코드와 연동된 데이터인지 — 생성: URL로 넘어온 연결 대상, 수정: 이미 매칭된 고객.
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [customerLinkStep, setCustomerLinkStep] = useState<
    null | "mode" | "existing" | "create"
  >(null);
  const isCustomerConnected = isEdit ? existingCustomerId !== null : Boolean(selectedCustomerId);

  // 현재 단계는 ?step= 쿼리스트링을 단일 진실 공급원으로 삼는다(1-indexed).
  // 브라우저 뒤로/앞으로 가기로 쿼리가 바뀌면 currentIndex도 함께 갱신된다.
  const stepParam = Number(searchParams.get("step"));
  const currentIndex =
    Number.isInteger(stepParam) && stepParam >= 1 && stepParam <= FORM_STEPS.length
      ? stepParam - 1
      : 0;

  const {
    state: analysisDraftState,
    activateWithoutDraft,
    restoreDraft,
    startFresh,
    finalizeDraft,
  } = useAnalysisDraft({
    enabled: !isEdit,
    identityReady: ready && !memberLoading,
    projectId,
    memberId: member?.id ?? null,
    form,
    selectedCustomerId: selectedCustomerId ?? null,
    step: currentIndex + 1,
  });
  const analysisDraftReady =
    isEdit || analysisDraftState.status === "active" || analysisDraftState.status === "disabled";
  const restoredAnalysisDraft =
    analysisDraftState.status === "active" && analysisDraftState.restored;

  useEffect(() => {
    if (analysisDraftState.status === "empty") activateWithoutDraft();
  }, [analysisDraftState.status, activateWithoutDraft]);

  const loadLinkedCustomerSummary = useCallback(
    async (customerId: number) => {
      if (!projectId) return null;
      try {
        const response = await CustomersService.detail(String(customerId)).withProject(projectId);
        const customer = response.data.data;
        setLinkedCustomerSummary({ id: customer.id, name: customer.name, contact: customer.contact1 });
        return customer;
      } catch (error) {
        console.error("Failed to load linked customer summary:", error);
        const status =
          error && typeof error === "object" && "status" in error
            ? Number((error as { status?: unknown }).status)
            : undefined;
        if (!isEdit && restoredAnalysisDraft && (status === 403 || status === 404)) {
          setSelectedCustomerId((current) => (current === customerId ? undefined : current));
          setLinkedCustomerSummary(null);
          showErrorModal({
            type: "info",
            title: "고객 연결 해제",
            headline: "연결된 고객 정보를 찾을 수 없습니다.",
            description: "작성한 분석 정보는 그대로 유지됩니다.",
            hideCancel: true,
          });
        }
        return null;
      }
    },
    [projectId, isEdit, restoredAnalysisDraft]
  );

  useEffect(() => {
    if (
      !isEdit &&
      analysisDraftReady &&
      !restoredAnalysisDraft &&
      initialLinkedCustomerId
    ) {
      setSelectedCustomerId(initialLinkedCustomerId);
    }
  }, [isEdit, analysisDraftReady, restoredAnalysisDraft, initialLinkedCustomerId]);

  useEffect(() => {
    if (!analysisDraftReady) return;
    const linkedCustomerId = isEdit ? existingCustomerId : selectedCustomerId;
    if (!linkedCustomerId) {
      setLinkedCustomerSummary(null);
      return;
    }
    if (linkedCustomerSummary?.id === linkedCustomerId) return;
    void loadLinkedCustomerSummary(linkedCustomerId);
  }, [analysisDraftReady, isEdit, existingCustomerId, selectedCustomerId, linkedCustomerSummary?.id, loadLinkedCustomerSummary]);

  const applySelectedCustomer = useCallback(
    async (customerId: number, fallbackName?: string) => {
      setSelectedCustomerId(customerId);
      if (fallbackName) {
        setForm((prev) => ({ ...prev, customerName: fallbackName }));
      }
      const customer = await loadLinkedCustomerSummary(customerId);
      if (customer) {
        setForm((prev) => ({
          ...prev,
          customerName: customer.name || prev.customerName,
          gender:
            customer.gender === "male" || customer.gender === "female"
              ? customer.gender
              : prev.gender,
        }));
      }
    },
    [loadLinkedCustomerSummary, setForm]
  );

  const replaceAnalysisCustomer = useCallback(
    async (customerId: number) => {
      if (!isEdit || !diagnosisId || !projectId) return;
      const previousCustomerId = existingCustomerId;

      if (previousCustomerId === customerId) {
        await loadLinkedCustomerSummary(customerId);
        return;
      }

      if (previousCustomerId !== null) {
        await AnalysisService.unmatchCustomer(Number(diagnosisId), projectId);
      }

      try {
        await AnalysisService.matchCustomer(Number(diagnosisId), { projectId, customerId });
      } catch (error) {
        if (previousCustomerId !== null) {
          try {
            await AnalysisService.matchCustomer(Number(diagnosisId), {
              projectId,
              customerId: previousCustomerId,
            });
          } catch (rollbackError) {
            console.error("Failed to restore previous customer match:", rollbackError);
            setExistingCustomerId(null);
            setLinkedCustomerSummary(null);
          }
        }
        throw error;
      }

      setExistingCustomerId(customerId);
      await loadLinkedCustomerSummary(customerId);
    },
    [isEdit, diagnosisId, projectId, existingCustomerId, loadLinkedCustomerSummary]
  );

  const handleExistingCustomerSelected = useCallback(
    async (customer: ConnectableCustomer) => {
      if (isEdit) {
        await replaceAnalysisCustomer(customer.id);
      } else {
        setLinkedCustomerSummary({ id: customer.id, name: customer.name, contact: customer.contact1 });
        await applySelectedCustomer(customer.id, customer.name);
      }
      setCustomerLinkStep(null);
    },
    [isEdit, replaceAnalysisCustomer, applySelectedCustomer]
  );

  const handleCustomerCreated = useCallback(
    async (customerId: number | null) => {
      if (!customerId) {
        showErrorModal({
          headline: "고객은 등록되었지만 연결 정보를 확인하지 못했습니다.",
          description: "기존 고객 연동에서 등록된 고객을 선택해주세요.",
        });
        return;
      }
      if (isEdit) {
        try {
          await replaceAnalysisCustomer(customerId);
        } catch (error) {
          console.error("Failed to link created customer to analysis:", error);
          showErrorModal({
            headline: "고객은 등록되었지만 연결에 실패했습니다.",
            description: "기존 고객 연동에서 등록된 고객을 다시 선택해주세요.",
          });
          return;
        }
      } else {
        await applySelectedCustomer(customerId);
      }
      setCustomerLinkStep(null);
    },
    [isEdit, replaceAnalysisCustomer, applySelectedCustomer]
  );

  const handleCustomerUnlink = useCallback(() => {
    if (!isCustomerConnected) return;

    showConfirmModal({
      headline: "고객 연결을 해제할까요?",
      message: "연결을 해제해도 입력한 분석 정보는 유지됩니다.",
      type: "warning",
      confirmText: "해제",
      onConfirm: async () => {
        try {
          if (isEdit) {
            if (!diagnosisId || !projectId) return;
            await AnalysisService.unmatchCustomer(Number(diagnosisId), projectId);
            setExistingCustomerId(null);
          } else {
            setSelectedCustomerId(undefined);
          }
          setLinkedCustomerSummary(null);
        } catch (error) {
          console.error("Failed to unlink customer from analysis:", error);
          showErrorModal({
            headline: "연결 해제에 실패했습니다.",
            description: "잠시 후 다시 시도해주세요.",
          });
        }
      },
    });
  }, [isCustomerConnected, isEdit, diagnosisId, projectId]);

  // 진입 시 1회, 고객명 입력값이 비어있을 때만 쿼리스트링의 고객명으로 채운다.
  useEffect(() => {
    if (isEdit || !analysisDraftReady || restoredAnalysisDraft || !customerNameParam) return;
    setForm((prev) => (prev.customerName ? prev : { ...prev, customerName: customerNameParam }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, analysisDraftReady, restoredAnalysisDraft, customerNameParam]);

  // 고객 상세 「추가하기」 진입 시 성별만 프리필한다. ageGroup/employmentType은 고객 쪽 값이
  // 자유 텍스트(ageRange)·추정(job)이라 잘못 매핑되면 분석 결과를 조용히 틀리게 만들 수 있어
  // 제외 — gender는 enum(male/female)-to-enum으로 무손실 매핑되는 유일한 필드.
  useEffect(() => {
    if (isEdit || !analysisDraftReady || restoredAnalysisDraft) return;
    if (genderParam !== "male" && genderParam !== "female") return;
    setForm((prev) => (prev.gender ? prev : { ...prev, gender: genderParam }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, analysisDraftReady, restoredAnalysisDraft, genderParam]);

  const goToStep = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), FORM_STEPS.length - 1);
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(clamped + 1));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleRestoreAnalysisDraft = useCallback(() => {
    const draft = restoreDraft();
    if (!draft) return;

    setForm(draft.form);
    setSelectedCustomerId(draft.selectedCustomerId ?? undefined);
    setLinkedCustomerSummary(null);
    setCustomerLinkStep(null);

    // 저장된 초안이 진입 URL의 다른 고객 프리필에 다시 덮이지 않게 관련 파라미터를 제거한다.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("customerId");
    params.delete("customerName");
    params.delete("gender");
    params.set("step", String(draft.step));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [restoreDraft, setForm, searchParams, router, pathname]);

  const handleStartFreshAnalysis = useCallback(() => {
    setForm(createEmptyDiagnosisForm());
    setSelectedCustomerId(undefined);
    setLinkedCustomerSummary(null);
    setCustomerLinkStep(null);
    startFresh();
  }, [setForm, startFresh]);

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
      .then(({ form: data, customerId, status, isReceivedShare, deliveryStatus }) => {
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
        if (!canEditDiagnosisInfo({ status, isReceivedShare, deliveryStatus })) {
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

  const incompleteSteps = useMemo(() => FORM_STEPS.flatMap((formStep, index) => {
    const missingFields = getMissingRequiredFieldLabelsForStep(form, formStep.key);
    if (formStep.key === "debts") missingFields.push(...getMissingDebtItemFieldLabels(form));
    const uniqueMissingFields = [...new Set(missingFields)];
    return uniqueMissingFields.length > 0 ? [{ index, label: formStep.label, missingFields: uniqueMissingFields }] : [];
  }), [form]);

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

  // 스텝 이동은 생성/수정 모두 자유롭게 허용한다(사이드바 체크리스트로도 어차피 스텝을
  // 자유 이동할 수 있어 여기만 막는 건 의미 없는 제약이었음). 실제 필수값 검증은 제출
  // 시점(canAnalyze/handleAnalyze)에서만 한다.
  const goNext = () => {
    if (!isLast) goToStep(currentIndex + 1);
  };

  // 모바일 폼 카드 우측 상단 X: 스텝과 무관하게 항상 이전 페이지(허브 또는 상세)로 나간다.
  // goBack의 isFirst 분기와 동일한 목적지를 재사용한다.
  const handleClose = () => {
    router.push(isEdit ? `/debt-relief/${diagnosisId}` : "/debt-relief");
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    if (!canAnalyze || incompleteSteps.length > 0) {
      setRequiredFieldsModalOpen(true);
      return;
    }

    if (!Number.isFinite(derived.totalDebtManwon) || derived.totalDebtManwon <= 0) {
      // 현재 잔액은 원 단위로 입력받지만 총 채무는 만원 단위로 반올림(wonToManwon)해서 계산한다
      // — 5,000원 미만만 입력한 경우 totalDebtManwon이 0이 돼 이 분기에 걸리는데, 사용자는
      // 분명히 금액을 입력했으므로 "채무를 아예 안 입력함"과는 다른 원인을 알려줘야 한다.
      const hasNonZeroDebtInput = form.debts.some((debt) => (debt.currentBalanceWon || 0) > 0);
      showErrorModal({
        type: "info",
        title: "알림",
        headline: hasNonZeroDebtInput ? "채무 금액이 너무 작습니다." : "채무 현황을 파악해주세요.",
        description: hasNonZeroDebtInput
          ? "채무 금액은 만원 단위로 반올림되어 계산됩니다. 5,000원 미만의 금액은 0만원으로 처리되니 정확한 금액을 다시 입력해주세요."
          : "분석을 진행하려면 채무 종류와 금액을 입력해주세요.",
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

    // canAnalyze(=isDiagnosisFormComplete)에는 일부러 포함하지 않은 검사 — 새 채무 행은
    // 항상 이 4개가 비어있는 상태로 시작해서, 포함시키면 버튼이 계속 비활성 상태에 갇혀
    // 클릭 자체가 막힌다. validateDiagnosisForm.ts의 getMissingDebtFieldLabels 주석 참고.
    const missingDebtItemFields = getMissingDebtItemFieldLabels(form);
    if (missingDebtItemFields.length > 0) {
      setDebtItemFieldsMissingChecked(true);
      showErrorModal({
        type: "info",
        title: "알림",
        headline: "채무 항목을 확인해주세요.",
        description: `${missingDebtItemFields.join(", ")}이(가) 입력되지 않았거나 올바르지 않은 채무 항목이 있습니다.`,
        confirmText: "채무 현황 입력",
        hideCancel: true,
        onConfirm: () => goToStep(2),
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

    setDebtSelectionModalOpen(true);
  };

  const continueAnalyze = async (analysisForm: DiagnosisFormState) => {
    // 재분석(수정 모드)은 성공 시 상태/절차/현재단계가 초기화되고 AI 채팅 이력이 삭제되는
    // 되돌릴 수 없는 부수효과가 있어 채무 선택 후 확인을 한 번 더 받는다.
    if (isEdit) {
      showConfirmModal({
        headline: "다시 분석할까요?",
        message: "다시 분석하면 진행 상태·절차가 1단계로 초기화되고 AI 상담 채팅 이력이 삭제됩니다.",
        type: "warning",
        confirmText: "다시 분석",
        onConfirm: () => submitAnalyze(analysisForm),
      });
      return;
    }

    await submitAnalyze(analysisForm);
  };

  const handleDebtSelectionConfirm = (selectedDebtIds: string[]) => {
    const selectedDebtIdSet = new Set(selectedDebtIds);
    const analysisForm: DiagnosisFormState = {
      ...form,
      debts: form.debts.map((debt) => ({
        ...debt,
        isExcludedFromAnalysis: !selectedDebtIdSet.has(debt.id),
      })),
    };

    setForm(analysisForm);
    setDebtSelectionModalOpen(false);
    void continueAnalyze(analysisForm);
  };

  const submitAnalyze = async (analysisForm: DiagnosisFormState = form) => {
    setAnalyzing(true);
    try {
      const result = isEdit
        ? await DebtReliefService.updateDiagnosis(projectId ?? "", diagnosisId!, analysisForm)
        : await DebtReliefService.createDiagnosis(projectId ?? "", analysisForm, selectedCustomerId);
      // API 성공 직후 저장을 영구 중단하고 초안을 지운다. settle 대기나 라우트 unmount 중
      // cleanup이 방금 지운 폼을 다시 저장하지 못하도록 finalizeDraft 내부 ref가 함께 잠긴다.
      if (!isEdit) finalizeDraft();
      // 진행률을 100%까지 채우고 여운을 준 뒤 이동한다. 실패 경로에서는 채우지 않는다.
      await analysisProgressRef.current?.settle();
      router.push(`/debt-relief/${result.id}`);
    } catch (error) {
      console.error("Failed to submit diagnosis:", error);
      analysisProgressRef.current?.abort();
      showErrorModal({
        headline: "분석 요청에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
      setAnalyzing(false);
    }
  };

  const initializingAnalysisDraft =
    !isEdit &&
    (analysisDraftState.status === "waiting" ||
      analysisDraftState.status === "checking" ||
      analysisDraftState.status === "empty" ||
      analysisDraftState.status === "prompting");

  if (loadingForm || initializingAnalysisDraft) {
    return (
      <>
        <div className="min-h-[400px] grid place-items-center">
          <LoadingSpinner />
        </div>
        <AnalysisDraftRestoreModal
          open={analysisDraftState.status === "prompting"}
          savedAt={
            analysisDraftState.status === "prompting"
              ? analysisDraftState.draft.savedAt
              : undefined
          }
          onRestore={handleRestoreAnalysisDraft}
          onStartFresh={handleStartFreshAnalysis}
        />
      </>
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
            debtItemFieldsMissingChecked={debtItemFieldsMissingChecked}
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
      {/* ref가 항상 살아 있어야 하므로 조건부 렌더하지 않는다(active로만 제어). */}
      <AnalysisLoadingOverlayHost active={analyzing} ref={analysisProgressRef} />

      <MobileFormSummaryDrawer
        form={form}
        derived={derived}
        steps={FORM_STEPS}
        currentIndex={currentIndex}
        onSelectStep={goToStep}
        onAnalyze={handleAnalyze}
        analyzing={analyzing}
        analyzeDisabled={!canAnalyze || incompleteSteps.length > 0}
        isCustomerConnected={isCustomerConnected}
        linkedCustomerName={linkedCustomerSummary?.name}
        linkedCustomerContact={linkedCustomerSummary?.contact}
        onCustomerLink={() => setCustomerLinkStep("mode")}
        onCustomerUnlink={handleCustomerUnlink}
      />

      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-9 pb-[90px] md:pb-12 flex flex-col md:flex-row gap-5 md:gap-[30px] items-start">
        <FormSidebar
          form={form}
          derived={derived}
          steps={FORM_STEPS}
          currentIndex={currentIndex}
          onSelectStep={goToStep}
          isCustomerConnected={isCustomerConnected}
          linkedCustomerName={linkedCustomerSummary?.name}
          linkedCustomerContact={linkedCustomerSummary?.contact}
          onCustomerLink={() => setCustomerLinkStep("mode")}
          onCustomerUnlink={handleCustomerUnlink}
        />

        <section className="relative flex-1 w-full min-w-0 surface md:rounded-[14px] shadow-none md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none flex flex-col min-h-0 md:min-h-[780px]">
          {/* Figma 모바일: X는 폼 카드 우측 상단 — stroke는 foreground 토큰(라이트=#000급 / 다크 반전).
              "기타사항" 스텝은 Step5Others의 첫 실제 섹션인 "새출발기금" 제목 행에 X를 배치한다. */}
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
          <div className="flex-1 min-w-0 px-6 md:px-7 pt-4 md:pt-8 pb-7">{renderStep()}</div>

          {/* 푸터 — 데스크톱 전용, 모바일은 FormMobileActionBar(fixed)가 대신함.
              3열 flex: 좌측 스페이서 ↔ 중앙 이전/다음 ↔ 우측 분석하기 (좌우 flex-1로 중앙 정렬 유지) */}
          <div role="separator" className="hidden md:block h-px bg-neutral-30 opacity-50" />
          <div className="hidden md:flex items-center px-7 pt-[13px] pb-3">
            <div className="flex-1" aria-hidden />
            <div className="flex items-center gap-2">
              <FormStepNavButton direction="prev" disabled={isFirst} onClick={goBack} />
              <FormStepNavButton direction="next" disabled={isLast} onClick={goNext} />
            </div>
            <div className="flex-1 flex justify-end">
              <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  aria-label={analyzing ? "분석 중" : "분석하기"}
                  className={`analyze-button ${canAnalyze && incompleteSteps.length === 0 ? "analyze-button-ready" : ""} inline-flex items-center justify-center gap-2.5 w-[96px] h-[34px] px-3 text-[14px] leading-[17px] tracking-[-0.02em] font-semibold whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                    <AnalyzeSparkleIcon />
                  </span>
                  <span className="relative z-10">{analyzing ? "분석 중" : "분석하기"}</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <FormMobileActionBar
        isFirst={isFirst}
        isLast={isLast}
        onBack={goBack}
        onNext={goNext}
      />

      <AnalysisRequiredFieldsModal
        open={requiredFieldsModalOpen}
        steps={incompleteSteps}
        unchanged={isEdit && incompleteSteps.length === 0 && !isDiagnosisFormDirty(form, baselineForm)}
        onClose={() => setRequiredFieldsModalOpen(false)}
        onSelectStep={(index) => {
          setRequiredFieldsModalOpen(false);
          goToStep(index);
        }}
      />
      <AnalysisDebtSelectionModal
        open={debtSelectionModalOpen}
        debts={form.debts}
        onClose={() => setDebtSelectionModalOpen(false)}
        onConfirm={handleDebtSelectionConfirm}
      />

      {projectId && (
        <>
          <CustomerLinkModeModal
            open={customerLinkStep === "mode"}
            onClose={() => setCustomerLinkStep(null)}
            onSelect={setCustomerLinkStep}
            existingDescription="이미 등록된 고객을 이번 분석에 연결합니다."
          />
          <CustomerMatchModal
            open={customerLinkStep === "existing"}
            onClose={() => setCustomerLinkStep(null)}
            onBack={() => setCustomerLinkStep("mode")}
            analysisId={isEdit ? diagnosisId : undefined}
            matchImmediately={!isEdit}
            projectId={projectId}
            analysisCustomerName={form.customerName}
            onSelected={handleExistingCustomerSelected}
          />
          <CustomerCreateModal
            open={customerLinkStep === "create"}
            onClose={() => setCustomerLinkStep(null)}
            onBack={() => setCustomerLinkStep("mode")}
            initialName={form.customerName}
            projectId={projectId}
            onCreated={handleCustomerCreated}
          />
        </>
      )}
    </>
  );
}
