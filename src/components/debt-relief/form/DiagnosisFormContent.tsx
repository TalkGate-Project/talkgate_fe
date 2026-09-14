"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMyMember } from "@/hooks/useMyMember";
import { useProjectType } from "@/hooks/useProjectType";
import { DebtReliefService, getUnsecuredDebtManwon } from "@/services/debtRelief";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AnalyzeSparkleIcon from "./AnalyzeSparkleIcon";
import {
  canEditDiagnosisInfo,
  createEmptyDiagnosisForm,
  isAdjustableRepaymentProcedure,
  type DiagnosisFormState,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import { useDiagnosisForm } from "./useDiagnosisForm";
import { useAnalysisDraft } from "./useAnalysisDraft";
import {
  getMissingDebtItemFieldLabels,
  getMissingDraftRequiredFieldLabels,
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
import DraftSavedCheckIcon from "./DraftSavedCheckIcon";
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
import AnalysisDesiredProcedureModal from "./AnalysisDesiredProcedureModal";
import AnalysisAdjustedRepaymentModal from "./AnalysisAdjustedRepaymentModal";
import AnalysisDraftRestoreModal from "./AnalysisDraftRestoreModal";
import CustomerLinkModeModal from "@/components/chat/customer-link/CustomerLinkModeModal";
import CustomerMatchModal from "@/components/debt-relief/result/CustomerMatchModal";
import CustomerCreateModal from "@/components/customers/CustomerCreateModal";
import AssignCustomersModal from "@/components/customers/AssignCustomersModal";
import { CustomersService } from "@/services/customers";
import type {
  AnalysisAdjustedRepaymentProcedure,
  AnalysisStatus,
  ConnectableCustomer,
} from "@/types/analysis";
import FloatingCustomerDetailModal from "@/components/customers/FloatingCustomerDetailModal";


export default function DiagnosisFormContent({ diagnosisId }: { diagnosisId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projectId, ready] = useSelectedProjectId();
  const { member, loading: memberLoading, isAdminOrSubAdmin } = useMyMember(projectId);
  const { isAnalysis, ready: projectTypeReady } = useProjectType();
  const { form, setForm, update, derived } = useDiagnosisForm();
  const [analyzing, setAnalyzing] = useState(false);
  // 임시저장(작성중, 서버 저장 — localStorage 기반 useAnalysisDraft와는 별개). 신규작성 중 처음
  // 임시저장하면 여기 생성된 분석 id가 담기고, 이후 "분석하기"는 새로 만들지 않고 이 id를
  // 재분석(PATCH .../input)해 finalize한다(중복 분석 건 생성 방지).
  const [draftId, setDraftId] = useState<number | null>(diagnosisId ? Number(diagnosisId) : null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedDraftForm, setSavedDraftForm] = useState<DiagnosisFormState | null>(null);
  // 수정 모드 진입 시 로드된 분석의 실제 상태. drafting 건만 임시저장 버튼을 다시 노출한다 —
  // PATCH /analysis/:id/draft가 drafting 상태 건에서만 허용되기 때문(백엔드 제약).
  const [loadedAnalysisStatus, setLoadedAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [requiredFieldsModalOpen, setRequiredFieldsModalOpen] = useState(false);
  // 임시저장 버튼은 항상 클릭 가능한 상태로 두고(disabled로 숨기지 않는다), 클릭 시점에
  // 막힌 이유를 모달로 설명한다 — "customer"(고객 미연동)·"fields"(필수값 미입력)는 사용자가
  // 바로 해소할 수 있고, "status"(이미 분석된 건이라 drafting 전용 API를 쓸 수 없음)는 해소
  // 방법이 없지만 그래도 버튼을 죽이지 않고 왜 안 되는지 알려주는 쪽을 택했다 — 이유 없이
  // 회색으로 비활성화된 버튼은 사용자에게 "고장난 버튼"으로 보인다는 피드백 반영(2026-09-14).
  const [draftBlockReason, setDraftBlockReason] = useState<null | "customer" | "fields" | "status">(
    null
  );
  const [debtSelectionModalOpen, setDebtSelectionModalOpen] = useState(false);
  // 채무 현황 선택("다음") → 희망 절차 선택 → (대상 절차면) 희망 변제율 설정 → 분석하기, 순서로
  // 이어지는 제출 직전 모달 체인. pendingAnalysisForm은 채무 선택이 반영된 폼을 체인 내내 들고
  // 있다가 각 단계에서 desiredProcedure/adjustedRepayment만 더해 최종 continueAnalyze로 넘긴다.
  const [desiredProcedureModalOpen, setDesiredProcedureModalOpen] = useState(false);
  const [adjustedRepaymentModalOpen, setAdjustedRepaymentModalOpen] = useState(false);
  const [pendingAnalysisForm, setPendingAnalysisForm] = useState<DiagnosisFormState | null>(null);
  const [pendingAdjustableProcedure, setPendingAdjustableProcedure] =
    useState<AnalysisAdjustedRepaymentProcedure | null>(null);
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
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [createdCustomerToAssignId, setCreatedCustomerToAssignId] = useState<number | null>(null);
  const createdCustomerAssignedRef = useRef(false);
  const initialCustomerDetailOpenedRef = useRef(false);

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
  const linkedCustomerId = isEdit ? existingCustomerId : selectedCustomerId ?? null;

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
    finalizeAllDrafts,
  } = useAnalysisDraft({
    enabled: !isEdit,
    identityReady: ready && !memberLoading,
    projectId,
    memberId: member?.id ?? null,
    form,
    selectedCustomerId: selectedCustomerId ?? null,
    step: currentIndex + 1,
    draftId,
    // 서버 임시저장과 동일한 제약: 관리자·부관리자가 고객 미연동 상태로 작성 중이면 브라우저
    // 로컬 자동저장(새로고침/탭 종료 복원용)도 남기지 않는다.
    canPersistDraft: !(isAdminOrSubAdmin && !isCustomerConnected),
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

  // 고객 상세의 「추가하기」에서 진입한 경우에는 분석 폼 위에 해당 고객 정보를 곧바로 띄운다.
  // ref로 최초 1회만 열어 사용자가 직접 닫은 뒤 데이터 재조회로 다시 열리지 않게 한다.
  useEffect(() => {
    if (
      initialCustomerDetailOpenedRef.current ||
      !initialLinkedCustomerId ||
      linkedCustomerSummary?.id !== initialLinkedCustomerId
    ) {
      return;
    }
    initialCustomerDetailOpenedRef.current = true;
    setCustomerDetailOpen(true);
  }, [initialLinkedCustomerId, linkedCustomerSummary?.id]);

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
      if (!isEdit) setCustomerDetailOpen(true);
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
      // 관리자·부관리자는 본인이 담당자가 아니므로 배정을 먼저 받고 연동한다.
      if (isAdminOrSubAdmin) {
        createdCustomerAssignedRef.current = false;
        setCreatedCustomerToAssignId(customerId);
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
      if (!isEdit) setCustomerDetailOpen(true);
    },
    [isEdit, isAdminOrSubAdmin, replaceAnalysisCustomer, applySelectedCustomer]
  );

  const handleCreatedCustomerAssign = useCallback(
    async (targetMemberId: number) => {
      if (!projectId || createdCustomerToAssignId == null) return;

      await CustomersService.assign({
        assignmentType: "ids",
        memberId: targetMemberId,
        customerIds: [createdCustomerToAssignId],
        projectId,
      });
      if (isEdit) {
        await replaceAnalysisCustomer(createdCustomerToAssignId);
      } else {
        await applySelectedCustomer(createdCustomerToAssignId);
      }
      createdCustomerAssignedRef.current = true;
      if (!isEdit) setCustomerDetailOpen(true);
    },
    [projectId, createdCustomerToAssignId, isEdit, replaceAnalysisCustomer, applySelectedCustomer]
  );

  // 배정 모달은 성공·취소 모두 onClose로 닫힌다. 취소로 닫힌 경우에만 안내해야 해서
  // 성공 여부를 ref로 구분한다(닫히는 시점엔 이미 id가 비워질 수 있어 state로는 늦다).
  const handleCreatedCustomerAssignClose = useCallback(() => {
    setCreatedCustomerToAssignId(null);
    if (createdCustomerAssignedRef.current) return;

    showErrorModal({
      type: "info",
      headline: "배정이 취소되었습니다.",
      description: "고객은 생성되었지만 이번 진단에는 연동되지 않았습니다.",
      hideCancel: true,
    });
  }, []);

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
    // 초안 저장 당시 이미 서버 임시저장이 된 건이면 그 id도 함께 되돌려야, 다음 임시저장이
    // 새 건을 또 만들지 않고(PATCH) 이어서 수정된다.
    setDraftId(draft.draftId ?? null);

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
        setLoadedAnalysisStatus(status);
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

  // 생성: 필수값 전부 채워졌을 때만. 수정: 원본 대비 변경 + 필수값 유지일 때만. drafting 건은
  // 아직 한 번도 분석된 적이 없어(첫 분석) "원본 대비 변경" 요건이 의미가 없다 — 생성과 동일하게
  // 필수값만 채워지면 바로 분석 가능해야 한다.
  const canAnalyze = useMemo(() => {
    if (!isDiagnosisFormComplete(form)) return false;
    if (isEdit && loadedAnalysisStatus !== "drafting") return isDiagnosisFormDirty(form, baselineForm);
    return true;
  }, [form, isEdit, baselineForm, loadedAnalysisStatus]);

  const missingDraftFields = useMemo(() => getMissingDraftRequiredFieldLabels(form), [form]);
  const draftSaved = useMemo(
    () => savedDraftForm !== null && !isDiagnosisFormDirty(form, savedDraftForm),
    [form, savedDraftForm]
  );

  const handleSaveDraft = async () => {
    if (savingDraft || analyzing || !projectId) return;
    // 관리자·부관리자는 생성/수정 모두 실제 고객과 연동된 진단만 임시저장할 수 있다.
    if (isAdminOrSubAdmin && !isCustomerConnected) {
      setDraftBlockReason("customer");
      return;
    }
    if (missingDraftFields.length > 0) {
      setDraftBlockReason("fields");
      return;
    }
    // 임시저장 수정 API는 작성중(drafting) 건에만 허용된다(백엔드 제약, OpenAPI 스펙 확인 완료).
    // 이미 분석된 수정 건에 요청을 보내 일반 서버 오류를 띄우지 않고, 클릭 시점에 현재 상태의
    // 제약을 명확히 안내한다.
    if (isEdit && loadedAnalysisStatus !== "drafting") {
      setDraftBlockReason("status");
      return;
    }

    setSavingDraft(true);
    const draftFormSnapshot = structuredClone(form);
    try {
      if (draftId == null) {
        const result = await DebtReliefService.createAnalysisDraft(projectId, draftFormSnapshot, selectedCustomerId);
        setDraftId(Number(result.id));
      } else {
        await DebtReliefService.updateAnalysisDraft(projectId, draftId, draftFormSnapshot);
      }
      // 서버 임시저장이 성공한 시점부터는 서버 데이터를 단일 진실 공급원으로 삼는다. 예약된
      // 자동저장까지 중단한 뒤 분석 폼 관련 로컬 초안을 모두 지워, 이후 새 분석 진입 시 과거
      // 스텝이 복원되는 간헐적 경쟁 조건을 막는다.
      finalizeAllDrafts();
      setSavedDraftForm(draftFormSnapshot);
    } catch (error) {
      console.error("Failed to save analysis draft:", error);
      showErrorModal({
        headline: "임시저장에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const incompleteSteps = useMemo(() => FORM_STEPS.flatMap((formStep, index) => {
    const missingFields = getMissingRequiredFieldLabelsForStep(form, formStep.key);
    if (formStep.key === "debts") missingFields.push(...getMissingDebtItemFieldLabels(form));
    const uniqueMissingFields = [...new Set(missingFields)];
    return uniqueMissingFields.length > 0 ? [{ index, label: formStep.label, missingFields: uniqueMissingFields }] : [];
  }), [form]);

  const step = FORM_STEPS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === FORM_STEPS.length - 1;

  // drafting 건은 analysisResult가 없어 상세페이지가 성립하지 않는다 — 나갈 때 상세 대신 허브
  // 목록으로 보낸다. 로딩 중(loadedAnalysisStatus 미확정)엔 폼 자체가 렌더되지 않아 도달하지 않는다.
  const exitTarget =
    isEdit && loadedAnalysisStatus !== "drafting" ? `/debt-relief/${diagnosisId}` : "/debt-relief";

  const goBack = () => {
    if (isFirst) {
      router.push(exitTarget);
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
    router.push(exitTarget);
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    // 수정 모드도 포함한다. 이미 저장된 미연동 건을 소급해서 손대지는 않지만, 수정해서 다시
    // 제출하는 시점에는 신규와 같은 기준을 적용한다.
    if (isAdminOrSubAdmin && !isCustomerConnected) {
      showErrorModal({
        type: "info",
        title: "고객 연동 필요",
        headline: "고객 정보를 먼저 연동해주세요.",
        description: "관리자와 부관리자는 고객을 연동한 뒤 분석을 진행할 수 있습니다.",
        confirmText: "고객 연동",
        hideCancel: true,
        onConfirm: () => setCustomerLinkStep("mode"),
      });
      return;
    }
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

    // canAnalyze(=isDiagnosisFormComplete)에는 일부러 포함하지 않은 항목 단위 검사 — 새 채무 행은
    // 현재 잔액이 비어있는 상태로 시작해서, 포함시키면 버튼이 계속 비활성 상태에 갇혀
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
    // 되돌릴 수 없는 부수효과가 있어 채무 선택 후 확인을 한 번 더 받는다. drafting 건은
    // 애초에 상태·절차·채팅 이력이 생긴 적이 없어(첫 분석) 이 경고가 해당되지 않는다.
    if (isEdit && loadedAnalysisStatus !== "drafting") {
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
    setPendingAnalysisForm(analysisForm);
    setDesiredProcedureModalOpen(true);
  };

  const handleDesiredProcedureBack = () => {
    setDesiredProcedureModalOpen(false);
    setDebtSelectionModalOpen(true);
  };

  const handleAdjustedRepaymentBack = () => {
    setAdjustedRepaymentModalOpen(false);
    setDesiredProcedureModalOpen(true);
  };

  const handleDesiredProcedureSkip = () => {
    if (!pendingAnalysisForm) return;
    const nextForm: DiagnosisFormState = { ...pendingAnalysisForm, desiredProcedure: null, adjustedRepayment: {} };
    setForm(nextForm);
    setDesiredProcedureModalOpen(false);
    void continueAnalyze(nextForm);
  };

  const handleDesiredProcedureSubmit = (procedure: RecommendedProcedure) => {
    if (!pendingAnalysisForm) return;

    if (isAdjustableRepaymentProcedure(procedure)) {
      const nextForm: DiagnosisFormState = { ...pendingAnalysisForm, desiredProcedure: procedure };
      setForm(nextForm);
      setPendingAnalysisForm(nextForm);
      setPendingAdjustableProcedure(procedure);
      setDesiredProcedureModalOpen(false);
      setAdjustedRepaymentModalOpen(true);
      return;
    }

    // 변제계획 조정 대상이 아닌 절차를 선택하면 이전에 설정해둔 수정안은 의미가 없어져 함께 지운다.
    const nextForm: DiagnosisFormState = { ...pendingAnalysisForm, desiredProcedure: procedure, adjustedRepayment: {} };
    setForm(nextForm);
    setDesiredProcedureModalOpen(false);
    void continueAnalyze(nextForm);
  };

  const handleAdjustedRepaymentReset = () => {
    if (!pendingAnalysisForm || !pendingAdjustableProcedure) return;
    const { [pendingAdjustableProcedure]: _removed, ...restAdjustedRepayment } = pendingAnalysisForm.adjustedRepayment;
    const nextForm: DiagnosisFormState = { ...pendingAnalysisForm, adjustedRepayment: restAdjustedRepayment };
    setForm(nextForm);
    setAdjustedRepaymentModalOpen(false);
    void continueAnalyze(nextForm);
  };

  const handleAdjustedRepaymentConfirm = (value: { monthlyPayment: number; periodMonths: number }) => {
    if (!pendingAnalysisForm || !pendingAdjustableProcedure) return;
    const nextForm: DiagnosisFormState = {
      ...pendingAnalysisForm,
      adjustedRepayment: { ...pendingAnalysisForm.adjustedRepayment, [pendingAdjustableProcedure]: value },
    };
    setForm(nextForm);
    setAdjustedRepaymentModalOpen(false);
    void continueAnalyze(nextForm);
  };

  const submitAnalyze = async (analysisForm: DiagnosisFormState = form) => {
    setAnalyzing(true);
    try {
      // 신규작성 중 임시저장으로 이미 drafting 건이 만들어져 있으면(draftId) 새로 만들지 않고
      // 그 건을 재분석(PATCH .../input)해 finalize한다 — 그대로 create를 또 부르면 임시저장한
      // drafting 건은 고아로 남고 완전히 별개인 분석 건이 하나 더 생기는 중복 생성 버그가 된다.
      const finalizeTargetId = isEdit ? diagnosisId! : draftId != null ? String(draftId) : null;
      const result = finalizeTargetId
        ? await DebtReliefService.updateDiagnosis(projectId ?? "", finalizeTargetId, analysisForm)
        : await DebtReliefService.createDiagnosis(projectId ?? "", analysisForm, selectedCustomerId);
      // updateDiagnosis(재분석)는 customerId를 받지 않는다(고객 매칭은 별도 API) — 임시저장 단계
      // 이후에 고객을 연결/변경했다면 여기서 한 번 더 반영해 finalize 시점 기준으로 맞춘다.
      if (!isEdit && draftId != null && selectedCustomerId) {
        try {
          await AnalysisService.matchCustomer(draftId, {
            projectId: projectId ?? "",
            customerId: selectedCustomerId,
          });
        } catch (matchError) {
          console.error("Failed to sync customer match when finalizing draft:", matchError);
        }
      }
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
        <div className="min-h-[calc(100vh-54px)] bg-card lg:bg-background grid place-items-center">
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
    <div className="min-h-[calc(100vh-54px)] bg-card lg:bg-background">
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
        onSaveDraft={handleSaveDraft}
        savingDraft={savingDraft}
        draftSaved={draftSaved}
        isCustomerConnected={isCustomerConnected}
        linkedCustomerName={linkedCustomerSummary?.name}
        linkedCustomerContact={linkedCustomerSummary?.contact}
        onCustomerLink={() => setCustomerLinkStep("mode")}
        onCustomerInfo={() => setCustomerDetailOpen(true)}
        onCustomerUnlink={handleCustomerUnlink}
      />

      <div className="mx-auto max-w-[1324px] w-full px-0 lg:pt-9 pb-[90px] lg:pb-12 flex flex-col lg:flex-row gap-5 lg:gap-[30px] items-start">
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
          onCustomerInfo={() => setCustomerDetailOpen(true)}
          onCustomerUnlink={handleCustomerUnlink}
        />

        <section className="relative flex-1 w-full min-w-0 surface lg:rounded-[14px] shadow-none lg:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none flex flex-col min-h-0 lg:min-h-[780px]">
          {/* Figma 모바일: X는 폼 카드 우측 상단 — stroke는 foreground 토큰(라이트=#000급 / 다크 반전).
              "기타사항" 스텝은 Step5Others의 첫 실제 섹션인 "새출발기금" 제목 행에 X를 배치한다. */}
          {step.key !== "others" && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="닫기"
              className="lg:hidden absolute top-[8px] right-6 z-10 cursor-pointer w-6 h-6 grid place-items-center text-foreground hover:opacity-70"
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
          <div className="hidden lg:flex items-center justify-between gap-4 px-7 py-[26px]">
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
          <div role="separator" className="hidden lg:block h-px bg-neutral-30 opacity-50" />

          {/* 본문 — Figma 모바일: 좌우 16, 상단에서 바로 필드 시작 */}
          <div className="flex-1 min-w-0 px-6 lg:px-7 pt-4 lg:pt-8 pb-7">{renderStep()}</div>

          {/* 푸터 — 데스크톱 전용, 모바일은 FormMobileActionBar(fixed)가 대신함.
              3열 flex: 좌측 스페이서 ↔ 중앙 이전/다음 ↔ 우측 분석하기 (좌우 flex-1로 중앙 정렬 유지) */}
          <div role="separator" className="hidden lg:block h-px bg-neutral-30 opacity-50" />
          <div className="hidden lg:flex items-center px-7 pt-[13px] pb-3">
            <div className="flex-1" aria-hidden />
            <div className="flex items-center gap-2">
              <FormStepNavButton direction="prev" disabled={isFirst} onClick={goBack} />
              <FormStepNavButton direction="next" disabled={isLast} onClick={goNext} />
            </div>
            <div className="flex-1 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || analyzing}
                aria-label={savingDraft ? "임시저장 중" : draftSaved ? "저장됨" : "임시저장"}
                className="inline-flex h-[34px] w-[92px] items-center justify-center rounded-[5px] border border-neutral-30 bg-card px-2 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-70 whitespace-nowrap cursor-pointer hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingDraft ? (
                  "저장 중"
                ) : draftSaved ? (
                  <span className="inline-flex items-center gap-1" aria-live="polite">
                    <DraftSavedCheckIcon />
                    저장됨
                  </span>
                ) : (
                  "임시저장"
                )}
              </button>
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
        unchanged={
          isEdit &&
          loadedAnalysisStatus !== "drafting" &&
          incompleteSteps.length === 0 &&
          !isDiagnosisFormDirty(form, baselineForm)
        }
        onClose={() => setRequiredFieldsModalOpen(false)}
        onSelectStep={(index) => {
          setRequiredFieldsModalOpen(false);
          goToStep(index);
        }}
      />
      <AnalysisRequiredFieldsModal
        open={draftBlockReason !== null}
        mode="draft"
        // 고객 미연동은 "분석하기"의 동일 상황(고객 연동 필요 안내)과 같은 성격의 안내라
        // warning이 아니라 기존 info(파란색) 톤을 맞춰 쓴다. 실제로 막힌(필수값 미입력·이미
        // 분석된 건) 경우만 warning 톤을 유지한다.
        tone={draftBlockReason === "customer" ? "info" : "warning"}
        headline={
          draftBlockReason === "customer"
            ? "고객 정보가 연동되지 않았습니다."
            : draftBlockReason === "status"
              ? "임시저장할 수 없는 진단입니다."
              : undefined
        }
        description={
          draftBlockReason === "customer"
            ? "관리자와 부관리자는 고객을 연동한 뒤 임시저장할 수 있습니다."
            : draftBlockReason === "status"
              ? "작성중 상태의 진단만 임시저장할 수 있습니다."
              : undefined
        }
        steps={
          draftBlockReason === "customer"
            ? [{ index: -1, label: "고객 정보", missingFields: ["고객 연동"] }]
            : draftBlockReason === "fields"
              ? [{ index: 0, label: FORM_STEPS[0].label, missingFields: missingDraftFields }]
              : []
        }
        unchanged={false}
        onClose={() => setDraftBlockReason(null)}
        onSelectStep={(index) => {
          setDraftBlockReason(null);
          if (index === -1) {
            setCustomerLinkStep("mode");
            return;
          }
          goToStep(index);
        }}
      />
      <AnalysisDebtSelectionModal
        open={debtSelectionModalOpen}
        debts={form.debts}
        onClose={() => setDebtSelectionModalOpen(false)}
        onConfirm={handleDebtSelectionConfirm}
      />
      <AnalysisDesiredProcedureModal
        open={desiredProcedureModalOpen}
        initialProcedure={pendingAnalysisForm?.desiredProcedure ?? null}
        onClose={() => setDesiredProcedureModalOpen(false)}
        onBack={handleDesiredProcedureBack}
        onSkip={handleDesiredProcedureSkip}
        onSubmit={handleDesiredProcedureSubmit}
      />
      <AnalysisAdjustedRepaymentModal
        open={adjustedRepaymentModalOpen}
        procedure={pendingAdjustableProcedure}
        unsecuredDebtManwon={pendingAnalysisForm ? getUnsecuredDebtManwon(pendingAnalysisForm) : 0}
        disposableIncomeManwon={derived.monthlyAvailableIncomeManwon}
        initialValue={
          pendingAdjustableProcedure
            ? pendingAnalysisForm?.adjustedRepayment[pendingAdjustableProcedure] ?? null
            : null
        }
        onClose={() => setAdjustedRepaymentModalOpen(false)}
        onSkip={handleAdjustedRepaymentReset}
        onBack={handleAdjustedRepaymentBack}
        onReset={
          pendingAdjustableProcedure &&
          pendingAnalysisForm?.adjustedRepayment[pendingAdjustableProcedure]
            ? handleAdjustedRepaymentReset
            : undefined
        }
        onConfirm={handleAdjustedRepaymentConfirm}
      />
      <FloatingCustomerDetailModal
        open={customerDetailOpen}
        customerId={linkedCustomerId}
        onClose={() => setCustomerDetailOpen(false)}
        onCustomerUpdated={() => {
          if (linkedCustomerId) void loadLinkedCustomerSummary(linkedCustomerId);
        }}
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
          {createdCustomerToAssignId != null && (
            <AssignCustomersModal
              open
              onClose={handleCreatedCustomerAssignClose}
              selectedCustomerIds={[createdCustomerToAssignId]}
              selectionMode={null}
              totalCount={1}
              onAssign={handleCreatedCustomerAssign}
              projectId={projectId}
            />
          )}
        </>
      )}
    </div>
  );
}
