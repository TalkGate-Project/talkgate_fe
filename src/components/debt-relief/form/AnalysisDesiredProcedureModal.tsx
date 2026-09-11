"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { RECOMMENDED_PROCEDURE_LABEL, isAdjustableRepaymentProcedure, type RecommendedProcedure } from "@/types/debtRelief";

type Props = {
  open: boolean;
  /** 이전에 선택한 값이 있으면(편집 중 재진입 등) 미리 선택해서 보여준다 */
  initialProcedure?: RecommendedProcedure | null;
  onClose: () => void;
  /** "이전" — 채무 현황 선택 모달로 돌아간다 */
  onBack: () => void;
  /** "건너뛰기" — 희망 절차를 지정하지 않고 바로 제출한다 */
  onSkip: () => void;
  /** 절차 선택 후 주 버튼("다음"/"분석하기") 클릭 */
  onSubmit: (procedure: RecommendedProcedure) => void;
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 18 18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 이 모달 전용 표시 순서 — RECOMMENDED_PROCEDURE_ORDER(목록/탭용)와는 별개로 2열 그리드
// 배치 기준(개인회생·신속채무조정 / 프리워크아웃·개인워크아웃 / 새출발기금·파산)을 따른다.
const PROCEDURE_GRID_ORDER: RecommendedProcedure[] = [
  "individual_rehabilitation",
  "speedy_debt_adjustment",
  "pre_workout",
  "personal_workout",
  "fresh_start_fund",
  "bankruptcy",
];

export default function AnalysisDesiredProcedureModal({
  open,
  initialProcedure,
  onClose,
  onBack,
  onSkip,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<RecommendedProcedure | null>(initialProcedure ?? null);

  useEffect(() => {
    if (open) setSelected(initialProcedure ?? null);
  }, [open, initialProcedure]);

  if (!open) return null;

  const primaryLabel = selected && isAdjustableRepaymentProcedure(selected) ? "다음" : "분석하기";

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-[14px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.366)] drop-shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
      ariaLabel="희망 절차 선택"
      disableAutoContainerSizing
    >
      <div className="relative px-6 pb-4 pt-6">
        <h2 className="text-[16px] font-semibold leading-[19px] text-foreground">희망 절차 선택</h2>
        <p className="mt-2 pr-8 text-[13px] font-medium leading-5 text-neutral-60">
          고객이 희망하는 채무조정 절차를 선택해 주세요.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-6 top-6 grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pb-6">
        {PROCEDURE_GRID_ORDER.map((procedure) => {
          const isSelected = selected === procedure;
          return (
            <button
              key={procedure}
              type="button"
              onClick={() => setSelected(procedure)}
              aria-pressed={isSelected}
              className={`h-11 rounded-[10px] border text-[14px] font-semibold tracking-[-0.02em] transition-colors ${
                isSelected
                  ? "border-primary-60 bg-primary-10 text-primary-80 dark:bg-primary-10/30"
                  : "border-neutral-30 bg-card text-neutral-70 hover:bg-neutral-10"
              }`}
            >
              {RECOMMENDED_PROCEDURE_LABEL[procedure]}
            </button>
          );
        })}
      </div>

      <div className="flex h-[60px] items-center justify-between border-t border-neutral-30 px-6">
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-[14px] font-medium text-neutral-50 hover:text-neutral-70"
        >
          건너뛰기
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-[34px] cursor-pointer rounded-[5px] border border-neutral-30 px-3 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10"
          >
            이전
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSubmit(selected)}
            className="h-[34px] cursor-pointer rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
