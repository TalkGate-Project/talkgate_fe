"use client";

import type { AnalysisStatus } from "@/types/analysis";

type Props = {
  status: AnalysisStatus;
  actions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "primary" | "danger";
  }>;
};

const STEPS = [
  { status: "consulting", label: "상담중" },
  { status: "reviewing", label: "검토중" },
  { status: "contract_pending", label: "계약대기중" },
  { status: "in_progress", label: "절차진행중" },
] as const;

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path
        d="m5.75 10.25 2.65 2.65 5.85-5.85"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExceptionalStatusLabel({ status }: { status: "rejected" | "suspended" }) {
  const isRejected = status === "rejected";

  return (
    <div
      className={`flex items-center gap-2 text-[16px] font-medium leading-5 ${
        isRejected ? "text-danger-40" : "text-neutral-60"
      }`}
    >
      <svg className="size-5 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="10" fill="currentColor" />
        <path
          d="M10 5.25v6.25M10 14.75h.01"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>{isRejected ? "반려됨" : "중단됨"}</span>
    </div>
  );
}

function resolveCurrentStep(status: AnalysisStatus) {
  const matchedIndex = STEPS.findIndex((step) => step.status === status);
  if (matchedIndex >= 0) return matchedIndex;
  if (status === "suspended") return STEPS.length - 1;
  return 0;
}

function ProgressSteps({ currentStep, compact = false }: { currentStep: number; compact?: boolean }) {
  return (
    <ol className="flex min-w-0 items-center" aria-label="진행 상황">
      {STEPS.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li key={step.status} className="flex shrink-0 items-center">
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-semibold leading-none tracking-[-0.02em] ${
                isComplete
                  ? "text-success"
                  : isCurrent
                    ? "bg-neutral-90 text-neutral-20"
                    : "bg-neutral-20 text-neutral-70"
              }`}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${index + 1}단계 ${step.label}`}
            >
              {isComplete ? <CheckIcon /> : index + 1}
            </span>
            {!compact || isCurrent ? (
              <span
                className={`${compact ? "ml-2" : "ml-2"} text-[16px] leading-5 whitespace-nowrap ${
                  isCurrent
                    ? "font-semibold text-black dark:text-foreground"
                    : "font-medium text-neutral-60"
                }`}
              >
                {step.label}
              </span>
            ) : null}
            {index < STEPS.length - 1 ? (
              <span className="mx-2 h-px w-4 shrink-0 bg-neutral-30" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer inline-flex h-[34px] min-w-[72px] items-center justify-center rounded-[5px] px-3 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "danger"
          ? "border border-danger-40 bg-card text-danger-40"
          : "bg-neutral-90 text-neutral-20"
      }`}
    >
      {label}
    </button>
  );
}

export default function AnalysisProgressBanner({
  status,
  actions = [],
}: Props) {
  const currentStep = resolveCurrentStep(status);
  const description: Record<AnalysisStatus, string> = {
    consulting: "분석 결과를 공유하여 검토를 요청하거나 자체 진행을 선택할 수 있어요.",
    reviewing: "분석 내용을 확인하고 수락 또는 거절을 선택해 주세요.",
    rejected: "진행이 반려된 고객입니다. 반려 사유를 확인하고 내용을 보완해주세요.",
    contract_pending: "결제 정보를 입력해주세요.",
    in_progress: "진행중인 절차를 추적하고 일정을 계획할 수 있어요.",
    suspended: "진행이 중단된 고객입니다.",
  };
  const isExceptionalStatus = status === "rejected" || status === "suspended";

  const actionButtons = actions.map((action) => (
    <ActionButton
      key={action.label}
      label={action.label}
      onClick={action.onClick}
      disabled={action.disabled}
      variant={action.variant}
    />
  ));

  return (
    <>
      <section
        aria-label="분석 진행 단계"
        className={`md:hidden h-[122px] overflow-hidden rounded-[12px] border border-neutral-30 ${
          isExceptionalStatus ? "bg-card" : "bg-neutral-10 dark:bg-card"
        }`}
      >
        <div className="flex h-[58px] items-center justify-center border-b border-neutral-30/50">
          {isExceptionalStatus ? (
            <ExceptionalStatusLabel status={status} />
          ) : (
            <ProgressSteps currentStep={currentStep} compact />
          )}
        </div>
        <div className="flex h-[63px] items-center justify-between gap-3 px-5">
          <p className={`${actions.length > 1 ? "max-w-[135px]" : "max-w-[195px]"} text-[11px] font-normal leading-[13px] tracking-[-0.02em] text-neutral-80`}>
            {description[status]}
          </p>
          {actionButtons.length > 0 ? <div className="flex gap-2">{actionButtons}</div> : null}
        </div>
      </section>

      <section
        aria-label="분석 진행 단계"
        className="hidden min-h-[104px] flex-col justify-center gap-3 rounded-[12px] border border-neutral-30 bg-card px-[22px] py-4 shadow-[0_3px_4px_rgba(9,30,66,0.1)] dark:shadow-none md:flex lg:hidden"
      >
        <div className="min-w-0">
          {isExceptionalStatus ? (
            <ExceptionalStatusLabel status={status} />
          ) : (
            <ProgressSteps currentStep={currentStep} />
          )}
        </div>
        <div className="flex min-w-0 items-center justify-between gap-5">
          <p className="min-w-0 flex-1 break-keep text-[13px] font-normal leading-4 tracking-[-0.02em] text-neutral-60">
            {description[status]}
          </p>
          {actionButtons.length > 0 ? (
            <div className="flex shrink-0 items-center gap-2">{actionButtons}</div>
          ) : null}
        </div>
      </section>

      <section
        aria-label="분석 진행 단계"
        className="hidden min-h-[72px] items-center justify-between rounded-[12px] border border-neutral-30 bg-card px-[22px] shadow-[0_3px_4px_rgba(9,30,66,0.1)] dark:shadow-none lg:flex"
      >
        {isExceptionalStatus ? (
          <ExceptionalStatusLabel status={status} />
        ) : (
          <ProgressSteps currentStep={currentStep} />
        )}
        <div className="flex min-w-0 items-center justify-end gap-5">
          <p className="min-w-0 break-keep text-[13px] font-normal leading-4 tracking-[-0.02em] text-neutral-60">
            {description[status]}
          </p>
          {actionButtons.length > 0 ? (
            <div className="flex shrink-0 items-center gap-5">{actionButtons}</div>
          ) : null}
        </div>
      </section>
    </>
  );
}
