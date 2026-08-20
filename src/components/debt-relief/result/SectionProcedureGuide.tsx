"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type DiagnosisDetail,
  type ProcedureGuide,
  type ProcedureStep,
  type ProcedureStepHistoryItem,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import { useMyMember } from "@/hooks/useMyMember";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { formatDateTimeCompact } from "@/utils/datetime";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import CustomerLinkModeModal from "@/components/chat/customer-link/CustomerLinkModeModal";
import CustomerMatchModal from "./CustomerMatchModal";
import CustomerCreateMatchModal from "./CustomerCreateMatchModal";
import { DebtReliefSmsModal, buildProcedureStepTemplate } from "./sms";

// procedureGuideByProcedure에 해당 절차 키가 없을 때(방어적 폴백)만 쓰인다.
const EMPTY_PROCEDURE_GUIDE: ProcedureGuide = {
  procedureLabel: "",
  totalSteps: 0,
  currentStep: 0,
  estimatedRemaining: "-",
  totalPeriodHint: "-",
  progressPercent: 0,
  steps: [],
};

function SmsButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="문자 보내기"
      className={`inline-flex items-center justify-center gap-1 h-9 w-9 md:h-[34px] md:w-auto md:px-3 rounded-[5px] border border-neutral-30 bg-neutral-0 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-60 ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-neutral-10"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M5.83333 6.66634H14.1667M5.83333 9.99967H9.16667M10 16.6663L6.66667 13.333H4.16667C3.24619 13.333 2.5 12.5868 2.5 11.6663V4.99967C2.5 4.0792 3.24619 3.33301 4.16667 3.33301H15.8333C16.7538 3.33301 17.5 4.0792 17.5 4.99967V11.6663C17.5 12.5868 16.7538 13.333 15.8333 13.333H13.3333L10 16.6663Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Figma 모바일은 아이콘만, 데스크톱은 "문자" 라벨 유지 */}
      <span className="hidden md:inline">문자</span>
    </button>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={expanded ? "rotate-180" : ""}
    >
      <path
        d="M15.8332 7.5L9.99984 13.3333L4.1665 7.5"
        stroke="#959595"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 커스텀 셀렉트용 위·아래 삼각형 (닫힘=아래, 열림=위) */
function SelectCaretIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="6"
      viewBox="0 0 8 6"
      fill="none"
      aria-hidden
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 절차 미리보기 셀렉트. 여기서 고르는 것은 화면에 보여줄 절차를 바꿀 뿐 실제 추적 절차를
// 바꾸지 않는다 — 실제 전환(진행 단계가 1단계로 초기화되는 액션)은 미리보는 절차의 1단계
// "현재 단계로 설정" 버튼에서 확인 모달을 거쳐 이루어진다(SectionProcedureGuide 본문 참고).
// 그래서 status(locked)와 무관하게 항상 열람 가능해야 한다.
function ProcedureSelect({
  value,
  onSelect,
  disabled,
}: {
  value: RecommendedProcedure;
  onSelect: (procedure: RecommendedProcedure) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (disabled) {
    return (
      <span className="inline-flex items-center justify-center h-[22px] px-3 rounded-full bg-secondary-10 text-secondary-100 text-[12px] font-medium leading-[14px] opacity-80">
        {RECOMMENDED_PROCEDURE_LABEL[value]}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="cursor-pointer inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] border border-secondary-60 bg-secondary-10 text-secondary-100 text-[14px] font-semibold leading-[17px] hover:opacity-90"
      >
        {RECOMMENDED_PROCEDURE_LABEL[value]}
        <SelectCaretIcon open={open} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 z-30 min-w-[140px] rounded-[12px] bg-card border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden"
        >
          {RECOMMENDED_PROCEDURE_ORDER.filter((procedure) => procedure !== value).map(
            (procedure) => (
              <button
                key={procedure}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  setOpen(false);
                  onSelect(procedure);
                }}
                className="cursor-pointer w-full text-left px-4 py-3 text-[14px] font-medium text-foreground hover:bg-neutral-10 transition-colors"
              >
                {RECOMMENDED_PROCEDURE_LABEL[procedure]}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function StepSetByMeta({ history }: { history: ProcedureStepHistoryItem }) {
  const projectName = history.changedByProjectName?.trim();

  return (
    <div className="flex items-center justify-start md:justify-end gap-1 max-w-full min-w-0 flex-nowrap overflow-hidden">
      <span
        title={history.changedByMemberName}
        className="text-[13px] font-semibold leading-4 text-foreground shrink-0 max-w-[5.5rem] truncate"
      >
        {history.changedByMemberName}
      </span>
      {projectName ? (
        <span
          title={projectName}
          className="inline-flex items-center h-4 max-w-[10rem] min-w-0 px-1.5 rounded-[30px] bg-neutral-20 text-neutral-70 opacity-80 shrink"
        >
          <span className="text-[10px] font-medium leading-3 truncate">{projectName}</span>
        </span>
      ) : null}
      <span className="text-[12px] font-medium leading-[14px] text-neutral-60 opacity-80 whitespace-nowrap shrink-0">
        님이 {formatDateTimeCompact(history.changedAt)}에 설정
      </span>
    </div>
  );
}

function StepItem({
  step,
  effectiveStatus,
  expanded,
  onToggle,
  isCurrent,
  canSetCurrent,
  onSetCurrent,
  onSendSms,
  smsDisabled,
  stepHistory,
}: {
  step: ProcedureStep;
  effectiveStatus: "done" | "in_progress" | "pending";
  expanded: boolean;
  onToggle: () => void;
  isCurrent: boolean;
  /** 현재 단계보다 이전 단계는 되돌리기 불가 */
  canSetCurrent: boolean;
  onSetCurrent: () => void;
  onSendSms: () => void;
  smsDisabled: boolean;
  stepHistory?: ProcedureStepHistoryItem;
}) {
  const isActive = effectiveStatus === "in_progress";
  const hasBody = Boolean(step.detail || step.checklist || step.note);

  return (
    <div
      className={`rounded-[12px] bg-neutral-0 overflow-hidden border ${
        isActive ? "border-neutral-80" : "border-neutral-30"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 h-[56px]">
        <span
          className={`w-7 h-7 rounded-full grid place-items-center shrink-0 text-[13px] font-semibold leading-4 tracking-[-0.02em] ${
            isActive ? "bg-neutral-100 text-neutral-20" : "bg-neutral-20 text-neutral-70"
          }`}
        >
          {step.step}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold leading-4 tracking-[-0.02em] text-foreground truncate">
              {step.step}단계. {step.title}
            </span>
            {isActive && (
              <span className="inline-flex items-center justify-center h-[17px] px-1 rounded-[4px] bg-neutral-90 text-neutral-0 text-[11px] font-medium leading-[13px] shrink-0">
                진행중
              </span>
            )}
          </div>
          {step.period && step.period !== "-" && (
            <p className="text-[12px] font-normal leading-[14px] tracking-[-0.02em] text-neutral-60">
              {step.period}
            </p>
          )}
        </div>

        <SmsButton onClick={onSendSms} disabled={smsDisabled} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "접기" : "펼치기"}
          disabled={!hasBody}
          className={`w-5 h-5 grid place-items-center shrink-0 ${
            hasBody ? "cursor-pointer" : "opacity-40 cursor-default"
          }`}
        >
          <ChevronIcon expanded={expanded} />
        </button>
      </div>

      {/* 본문 — 모바일: 메타·버튼 좌정렬(콘텐츠 너비) / 데스크톱: 우측 정렬·세로 가운데 */}
      {expanded && hasBody && (
        <div className="border-t border-neutral-30 px-4 md:px-6 py-3.5 flex flex-col md:flex-row items-stretch md:justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            {step.detail && (
              <p className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60 mb-1">
                {step.detail}
              </p>
            )}
            {step.checklist && (
              <ul className="flex flex-col">
                {step.checklist.map((item, index) => (
                  <li
                    key={index}
                    className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60"
                  >
                    · {item}
                  </li>
                ))}
              </ul>
            )}
            {step.note && (
              <div
                className={`mt-3 inline-flex items-start gap-1.5 max-w-full min-h-7 px-3 py-1.5 rounded-[5px] ${
                  step.noteType === "warning"
                    ? "bg-procedure-warning-note"
                    : step.noteType === "info"
                    ? "bg-procedure-info-note"
                    : "bg-neutral-10"
                }`}
              >
                {step.noteType === "warning" && (
                  <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M7 1.5L13 12H1L7 1.5Z" fill="#EFB008" />
                    <path d="M7 5.5v3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="7" cy="10.2" r="0.7" fill="white" />
                  </svg>
                )}
                <span
                  className={`text-[12px] md:text-[14px] font-medium leading-[15px] md:leading-[17px] opacity-80 ${
                    step.noteType === "warning"
                      ? "text-warning-100 dark:text-warning-40"
                      : step.noteType === "info"
                      ? "text-secondary-100 dark:text-secondary-20"
                      : "text-neutral-60"
                  }`}
                >
                  {step.note}
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0 w-full md:w-[340px] self-stretch flex flex-col items-start md:items-end gap-3 md:gap-0 min-w-0">
            {stepHistory ? (
              <div className="w-full flex justify-start md:justify-end min-w-0">
                <StepSetByMeta history={stepHistory} />
              </div>
            ) : null}
            <div className="flex items-center justify-start md:flex-1 md:justify-end">
              {isCurrent ? (
                <span className="inline-flex items-center justify-center h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em]">
                  현재 단계
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onSetCurrent}
                  disabled={!canSetCurrent}
                  className={`h-[34px] px-3 rounded-[5px] border border-neutral-30 bg-neutral-0 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground ${
                    canSetCurrent
                      ? "cursor-pointer hover:bg-neutral-10"
                      : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  현재 단계로 설정
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  detail: DiagnosisDetail;
  // 고객 연동 플로우용 — 미연동 상태에서 문자 버튼 클릭 시 연동 모달을 띄운다(SectionSmsSend와 동일).
  projectId: string | null;
  onCustomerMatchChange: () => void;
  // 실 API(PATCH /v1/analysis/{id})에 currentProcedureStep을 저장. reject되면(Promise가 실패하면)
  // 낙관적으로 반영했던 currentStep·이력 표시를 이 컴포넌트가 직접 원복한다 — 호출부는 에러 모달
  // 표시 후 반드시 throw로 실패를 전파해야 한다(showErrorModal만 하고 삼키면 원복이 동작하지 않음).
  onSetCurrentStep?: (step: ProcedureStep) => Promise<void>;
  // 추적 절차 전환(PATCH /v1/analysis/{id}). 호출부에서 확인 모달 + refetch까지 책임진다.
  // 드롭다운 선택이 아니라, 미리보는(비추적) 절차의 1단계 "현재 단계로 설정" 버튼에서 호출된다.
  onChangeTrackingProcedure?: (procedure: RecommendedProcedure) => void;
  // false면 셀렉트를 비활성 배지로 대체 (예: 변호사 프로젝트가 공유받은 건은 읽기 전용).
  // locked(status 기반 잠금)와 달리 이 값이 false면 다른 절차 열람(미리보기)도 막는다.
  canChangeTrackingProcedure?: boolean;
  // true면 절차 확인(펼치기)은 그대로 두고, 절차 전환/문자 발송 등 실제 작업만 막는다.
  // (예: 계약 체결 전 상태 — 내용은 미리 볼 수 있어야 하지만 아직 작업 대상은 아님)
  locked?: boolean;
  // "현재 단계로 설정" 전용 잠금. currentProcedureStep 지정은 실 API가 절차진행중(in_progress)
  // 상태에서만 허용해서 locked보다 좁게 막아야 한다 — 생략 시 locked를 그대로 따른다(안전한 기본값).
  stepLocked?: boolean;
};

export default function SectionProcedureGuide({
  detail,
  projectId,
  onCustomerMatchChange,
  onSetCurrentStep,
  onChangeTrackingProcedure,
  canChangeTrackingProcedure = true,
  locked = false,
  stepLocked = locked,
}: Props) {
  const { member } = useMyMember();
  const { project } = useCurrentProjectDetail();

  // 드롭다운에서 고른, 지금 "보고 있는" 절차 — 실제 추적 절차(detail.trackingProcedure)와 다를 수
  // 있다. 다르면 미리보기 모드: 문자 발송은 막고, 단계 조작은 1단계 "현재 단계로 설정"만 남겨
  // 실제 전환 트리거로 쓴다(아래 StepItem map 참고).
  // 마운트 시엔 항상 추적 절차와 같다(부모가 trackingProcedure를 key로 써서 실제 전환 시
  // 리마운트하므로, 여기서 별도로 동기화할 필요가 없다).
  const [previewProcedure, setPreviewProcedure] = useState<RecommendedProcedure>(
    detail.trackingProcedure
  );
  const isPreviewingTracked = previewProcedure === detail.trackingProcedure;
  const guide = detail.procedureGuideByProcedure[previewProcedure] ?? EMPTY_PROCEDURE_GUIDE;

  const [currentStep, setCurrentStep] = useState(guide.currentStep);
  // 미리보기 중인 절차가 실제 추적 절차가 아니면 진행 단계는 항상 "진행 전"으로 취급한다.
  const displayCurrentStep = isPreviewingTracked ? currentStep : 0;
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set([guide.currentStep])
  );
  const [smsStep, setSmsStep] = useState<ProcedureStep | null>(null);
  const [linkStep, setLinkStep] = useState<null | "mode" | "existing" | "create">(null);
  const [optimisticHistory, setOptimisticHistory] = useState<
    Record<number, ProcedureStepHistoryItem>
  >({});
  // 서버는 공유 시 전달받은 연락처를 우선 쓰고, 없으면 매칭된 고객 연락처를 쓴다 — detail.phone이
  // 이미 그 결과를 반영하므로 phone 유무로만 판단한다(SectionSmsSend.tsx 참고).
  const canSendSms = Boolean(detail.phone);

  // 문자 버튼은 절차 잠금(locked)이 아니면 항상 활성화한다. 미연동 상태에서 누르면 발송 대신
  // 연동 유도 모달을 띄운다 — SectionSmsSend와 동일한 로직.
  const handleSendSms = (step: ProcedureStep) => {
    if (canSendSms) {
      setSmsStep(step);
      return;
    }
    showConfirmModal({
      type: "caution",
      title: "고객정보 연동",
      headline: "고객 정보를 연동하시겠습니까?",
      message: "문자 발송을 위해 고객 정보를 먼저 연동해 주세요.",
      confirmText: "연동하기",
      cancelText: "취소",
      onConfirm: () => setLinkStep("mode"),
    });
  };

  const historyByStepId = useMemo(() => {
    const map = new Map<number, ProcedureStepHistoryItem>();
    for (const item of detail.procedureStepHistory ?? []) {
      map.set(item.stepId, item);
    }
    for (const [stepId, item] of Object.entries(optimisticHistory)) {
      map.set(Number(stepId), item);
    }
    return map;
  }, [detail.procedureStepHistory, optimisticHistory]);

  const toggle = (step: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const effectiveStatus = (step: number): "done" | "in_progress" | "pending" =>
    step < displayCurrentStep ? "done" : step === displayCurrentStep ? "in_progress" : "pending";

  // "현재 단계로 설정"으로 currentStep이 바뀔 때마다 이전 단계까지 완료한 것으로 간주해 재계산한다.
  // (guide.progressPercent는 서버가 내려주는 최초 스냅샷 값이라 currentStep 변경을 반영하지 못해 사용하지 않는다.)
  const progressPercent =
    guide.totalSteps > 0 ? Math.round((displayCurrentStep / guide.totalSteps) * 100) : 0;
  const currentStepMeta = guide.steps.find((s) => s.step === displayCurrentStep);

  // 저장 요청이 진행 중인 동안엔 다른 "현재 단계로 설정" 클릭을 막는다 — 동시에 두 요청이
  // 나가면 실패 시 어느 시점 상태로 원복해야 할지 꼬여서(레이스) 화면이 잘못된 값에 멈출 수 있다.
  const [savingStep, setSavingStep] = useState(false);

  const handleSetCurrent = async (step: ProcedureStep) => {
    // 현재 단계보다 이전으로는 되돌릴 수 없음 (BE도 동일하게 거부)
    if (step.step <= currentStep || savingStep) return;

    const previousStep = currentStep;
    const optimisticHistoryStepId = step.stepId != null && member?.name ? step.stepId : null;

    setCurrentStep(step.step);

    if (optimisticHistoryStepId != null) {
      setOptimisticHistory((prev) => ({
        ...prev,
        [optimisticHistoryStepId]: {
          stepId: optimisticHistoryStepId,
          changedByMemberName: member!.name,
          changedByProjectName: project?.name?.trim() || null,
          changedAt: new Date().toISOString(),
        },
      }));
    }

    if (!onSetCurrentStep) return;

    setSavingStep(true);
    try {
      await onSetCurrentStep(step);
    } catch {
      // 저장 실패 — 낙관적으로 반영했던 현재 단계·이력 표시를 원복한다.
      setCurrentStep(previousStep);
      if (optimisticHistoryStepId != null) {
        setOptimisticHistory((prev) => {
          const next = { ...prev };
          delete next[optimisticHistoryStepId];
          return next;
        });
      }
    } finally {
      setSavingStep(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-semibold leading-[19px] tracking-[0.2px] text-foreground">
            절차안내
          </h2>
          <ProcedureSelect
            value={previewProcedure}
            onSelect={(procedure) => {
              setPreviewProcedure(procedure);
              setExpanded(new Set());
            }}
            disabled={!onChangeTrackingProcedure || !canChangeTrackingProcedure}
          />
          {guide.totalPeriodHint && guide.totalPeriodHint !== "-" && (
            <span className="hidden md:inline ml-auto text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">
              {guide.totalPeriodHint}
            </span>
          )}
        </div>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_297px] gap-4 md:gap-6 items-start">
        {/* 모바일 Figma: 현황 카드가 위, 아코디언이 아래 — order로 토글. 데스크톱은 좌(아코디언)·우(사이드바) */}
        <div className="order-2 lg:order-1 flex flex-col gap-3 min-w-0">
          {guide.steps.map((step) => {
            // 추적 절차가 아닌 다른 절차를 미리보는 중엔 1단계의 "현재 단계로 설정"만 활성화한다 —
            // 눌렀을 때 실제로는 이 절차로 추적 절차 자체를 전환한다(확인 모달 + 1단계 초기화 경고는
            // onChangeTrackingProcedure 호출부가 그대로 처리). 2단계 이상은 전환 없이 건너뛸 수
            // 없으므로 계속 비활성.
            const canSwitchViaStepOne =
              step.step === 1 &&
              !locked &&
              Boolean(onChangeTrackingProcedure) &&
              canChangeTrackingProcedure;

            return (
              <StepItem
                key={step.step}
                step={step}
                effectiveStatus={effectiveStatus(step.step)}
                expanded={expanded.has(step.step)}
                onToggle={() => toggle(step.step)}
                isCurrent={isPreviewingTracked && step.step === displayCurrentStep}
                canSetCurrent={
                  isPreviewingTracked
                    ? step.step > displayCurrentStep && !stepLocked && !savingStep
                    : canSwitchViaStepOne
                }
                onSetCurrent={() =>
                  isPreviewingTracked
                    ? handleSetCurrent(step)
                    : onChangeTrackingProcedure?.(previewProcedure)
                }
                onSendSms={() => handleSendSms(step)}
                smsDisabled={locked || !isPreviewingTracked}
                stepHistory={
                  isPreviewingTracked && step.stepId != null
                    ? historyByStepId.get(step.stepId)
                    : undefined
                }
              />
            );
          })}
        </div>

        <aside className="order-1 lg:order-2 rounded-[12px] border border-neutral-30 bg-neutral-10 overflow-hidden lg:sticky lg:top-[138px] lg:self-start lg:z-10">
          <div className="px-4 md:px-6 pt-5 md:pt-6">
            {/* 모바일 Figma: 현재 단계만. 데스크톱: 현재 단계 + 예상 남은 기간 */}
            <div className="flex flex-col gap-4 mb-5">
              <div className="min-w-0">
                <p className="text-[12px] md:text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-60 mb-1">
                  현재 단계
                </p>
                <p className="text-[14px] md:text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-foreground">
                  {displayCurrentStep > 0 && currentStepMeta
                    ? `${displayCurrentStep}단계. ${currentStepMeta.title}`
                    : "진행 전"}
                </p>
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-60 mb-1">
                  예상 남은 기간
                </p>
                <p className="text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-foreground">
                  {guide.estimatedRemaining}
                </p>
              </div>
            </div>

            {/* 세로 타임라인 — 진행선은 하단 구분선까지 연장. 모바일은 현재+다음 2단계만 */}
            <div className="relative pb-5">
              <div
                className="absolute left-[5px] top-[10px] bottom-0 w-px bg-neutral-30"
                aria-hidden
              />
              <ul className="flex flex-col gap-4">
                {guide.steps.map((step) => {
                  const status = effectiveStatus(step.step);
                  const isActive = status === "in_progress";
                  const isDone = status === "done";
                  const isPreview =
                    step.step === displayCurrentStep || step.step === displayCurrentStep + 1;
                  return (
                    <li
                      key={step.step}
                      className={`relative flex items-start gap-3 ${
                        isPreview ? "" : "hidden lg:flex"
                      }`}
                    >
                      {/* 현재·지난 단계 점 동일 색. 문구는 현재만 활성, 지난 단계는 비활성 유지 */}
                      <span
                        className={`relative z-[1] mt-1 w-3 h-3 rounded-full shrink-0 ${
                          isActive || isDone ? "bg-secondary-20" : "bg-neutral-30"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[13px] leading-4 tracking-[-0.02em] ${
                              isActive
                                ? "font-semibold text-foreground"
                                : "font-medium text-neutral-50"
                            }`}
                          >
                            {step.step}단계. {step.title}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center justify-center h-[17px] px-1 rounded-[4px] bg-neutral-90 text-neutral-0 text-[11px] font-medium leading-[13px]">
                              진행중
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[12px] font-normal leading-[14px] tracking-[-0.02em] ${
                            isActive ? "text-neutral-60" : "text-neutral-50"
                          }`}
                        >
                          {step.period || "-"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-30" />

          <div className="px-4 md:px-6 pt-[13px] pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-60">
                진행률
              </span>
              <span className="text-[12px] font-medium leading-[14px] text-neutral-60">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-30 overflow-hidden">
              <div
                className="h-full rounded-l-full bg-neutral-70"
                style={{ width: `${Math.max(progressPercent, 2)}%` }}
              />
            </div>
          </div>
        </aside>
      </div>

      {smsStep && (
        <DebtReliefSmsModal
          open={Boolean(smsStep)}
          onClose={() => setSmsStep(null)}
          diagnosisId={detail.id}
          recipientName={detail.customerName}
          recipientPhone={detail.phone}
          {...buildProcedureStepTemplate(detail, smsStep)}
        />
      )}

      {projectId && (
        <>
          <CustomerLinkModeModal
            open={linkStep === "mode"}
            onClose={() => setLinkStep(null)}
            onSelect={(mode) => setLinkStep(mode)}
            existingDescription="이미 등록된 고객 정보를 연동합니다."
          />
          <CustomerMatchModal
            open={linkStep === "existing"}
            onClose={() => setLinkStep(null)}
            onBack={() => setLinkStep("mode")}
            analysisId={detail.id}
            projectId={projectId}
            analysisCustomerName={detail.customerName}
            onMatched={onCustomerMatchChange}
          />
          <CustomerCreateMatchModal
            open={linkStep === "create"}
            onClose={() => setLinkStep(null)}
            onBack={() => setLinkStep("mode")}
            customerName={detail.customerName}
            analysisId={detail.id}
            projectId={projectId}
            onMatched={onCustomerMatchChange}
          />
        </>
      )}
    </div>
  );
}
