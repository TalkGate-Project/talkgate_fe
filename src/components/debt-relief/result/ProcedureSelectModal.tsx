"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import type { ProcedureScore, RecommendedProcedure } from "@/types/debtRelief";
import { ScoreRow } from "./SectionProcedureScores";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (procedure: RecommendedProcedure) => void;
  procedureScores: ProcedureScore[];
  defaultProcedure: RecommendedProcedure;
  submitting?: boolean;
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProcedureSelectModal({
  open,
  onClose,
  onConfirm,
  procedureScores,
  defaultProcedure,
  submitting = false,
}: Props) {
  const [selected, setSelected] = useState<RecommendedProcedure>(defaultProcedure);

  useEffect(() => {
    if (open) setSelected(defaultProcedure);
  }, [open, defaultProcedure]);

  if (!open) return null;

  return (
    <BaseModal
      onClose={submitting ? () => {} : onClose}
      closeOnOverlayClick={!submitting}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="relative w-[92vw] max-w-[440px] rounded-[14px] bg-white dark:bg-neutral-10 shadow-[0px_13px_61px_rgba(169,169,169,0.366)] dark:shadow-none flex flex-col"
      ariaLabel="진행 절차 선택"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-6 pb-4">
        <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-90">진행 절차 선택</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="닫기"
          className="cursor-pointer grid h-6 w-6 place-items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="border-t border-neutral-30 dark:border-[#4D4D4D]" />

      {/* Content */}
      <div className="px-7 pt-5 pb-2 flex flex-col gap-4">
        <div className="rounded-[12px] bg-[#F8F8F8] dark:bg-neutral-20 px-4 py-3">
          <p className="text-[13px] font-medium leading-4 text-ink dark:text-neutral-90">
            결제 정보 적용 후 진행할 절차를 선택해 주세요. 선택한 절차로 진행 단계가 시작됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {procedureScores.map((score) => (
            <ScoreRow
              key={score.procedure}
              score={score}
              isSelected={score.procedure === selected}
              onSelect={() => setSelected(score.procedure)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-7 py-4 border-t border-neutral-30 dark:border-[#4D4D4D]">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="w-[48px] h-[34px] rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] text-[14px] font-semibold text-ink dark:text-neutral-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          disabled={submitting}
          className="h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-[#F5F5F5] text-[14px] font-semibold text-neutral-20 dark:text-[#333333] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "적용 중..." : "적용"}
        </button>
      </div>
    </BaseModal>
  );
}
