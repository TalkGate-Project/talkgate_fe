"use client";

type Props = {
  open: boolean;
  /** null이면 대기, 'save'/'reanalyze'면 해당 경로 진행 중 */
  submittingAction?: "save" | "reanalyze" | null;
  onClose: () => void;
  /** 값만 저장 — reanalyze: false */
  onSaveOnly: () => void;
  /** 다시 분석 — reanalyze: true */
  onReanalyze: () => void;
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
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

/**
 * 채무 상세 「적용하기」 직후 선택 모달.
 * - 값만 저장: 채무 구성만 갱신 (reanalyze:false)
 * - 다시 분석: 추천 절차·변제 계획까지 재계산 (reanalyze:true, 되돌릴 수 없음)
 */
export default function DebtApplyChoiceModal({
  open,
  submittingAction = null,
  onClose,
  onSaveOnly,
  onReanalyze,
}: Props) {
  if (!open) return null;

  const submitting = submittingAction != null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-[110]"
        onClick={() => !submitting && onClose()}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-apply-choice-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[calc(100%-2rem)] max-w-[440px] bg-card dark:bg-neutral-10 rounded-[14px] flex flex-col overflow-hidden"
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-4 shrink-0">
          <h2
            id="debt-apply-choice-title"
            className="text-[18px] leading-[21px] font-semibold text-foreground"
          >
            수정된 채무를 어떻게 할까요?
          </h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            aria-label="닫기"
            disabled={submitting}
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-50 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="px-7 pb-6 text-[14px] leading-5 font-medium text-neutral-70">
          다시 분석하면 추천 절차·변제 계획이 갱신되고, 값만 저장하면 채무 구성만 반영됩니다.
        </p>

        <div className="w-full h-px border-t border-neutral-30 shrink-0" />

        <div className="flex justify-end items-center gap-2 sm:gap-3 px-7 py-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            돌아가기
          </button>
          <button
            type="button"
            onClick={onSaveOnly}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingAction === "save" ? "저장 중..." : "값만 저장"}
          </button>
          <button
            type="button"
            onClick={onReanalyze}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingAction === "reanalyze" ? "분석 중..." : "다시 분석"}
          </button>
        </div>
      </div>
    </>
  );
}
