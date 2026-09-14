"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { RECOMMENDED_PROCEDURE_LABEL, isAdjustableRepaymentProcedure, type RecommendedProcedure } from "@/types/debtRelief";
import AnalyzeSparkleIcon from "./AnalyzeSparkleIcon";

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

function DoubleChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5.5 4.5 10.5 10 5.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 4.5 15.5 10 10.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      containerClassName="w-[calc(100vw-2rem)] max-w-[597px] overflow-hidden rounded-[14px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.366)] drop-shadow-[0_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
      ariaLabel="희망 절차 선택"
      disableAutoContainerSizing
    >
      <div className="relative flex flex-col gap-1 px-7 pb-2 pt-6 sm:flex-row sm:items-center sm:gap-3">
        <h2 className="pr-8 text-[18px] font-semibold leading-[21px] text-foreground sm:pr-0">희망 절차 선택</h2>
        <span className="hidden h-4 w-px bg-neutral-60 sm:block" aria-hidden />
        <p className="text-[14px] font-medium leading-5 text-neutral-60 sm:text-[16px]">
          고객이 희망하는 채무조정 절차를 선택해 주세요.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-7 top-6 grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-7 pb-7 pt-4">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-neutral-10 p-6 sm:gap-x-6 sm:gap-y-5 sm:p-10">
          {PROCEDURE_GRID_ORDER.map((procedure) => {
            const isSelected = selected === procedure;
            return (
              <button
                key={procedure}
                type="button"
                onClick={() => setSelected(procedure)}
                aria-pressed={isSelected}
                className={`h-12 cursor-pointer rounded-lg text-[16px] tracking-[-0.02em] transition-colors ${
                  isSelected
                    ? "bg-neutral-90 font-semibold text-neutral-20"
                    : "border border-neutral-30 bg-card font-medium text-foreground hover:bg-neutral-20/50"
                }`}
              >
                {RECOMMENDED_PROCEDURE_LABEL[procedure]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-[60px] items-center justify-between border-t border-neutral-30 px-6">
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-semibold text-neutral-60 hover:text-neutral-70"
        >
          <DoubleChevronRightIcon />
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
          {primaryLabel === "분석하기" ? (
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onSubmit(selected)}
              className={`analyze-button ${selected ? "analyze-button-ready" : ""} inline-flex h-[34px] w-[100px] cursor-pointer items-center justify-center gap-2 text-[14px] font-semibold tracking-[-0.02em] disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                <AnalyzeSparkleIcon />
              </span>
              <span className="relative z-10">분석하기</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onSubmit(selected)}
              className="h-[34px] cursor-pointer rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
