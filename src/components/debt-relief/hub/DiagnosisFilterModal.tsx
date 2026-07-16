"use client";

import { useEffect, useState } from "react";
import type { AnalysisStatus } from "@/types/analysis";
import {
  DIAGNOSIS_STATUS_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  RECOMMENDED_PROCEDURE_ORDER,
  type RecommendedProcedure,
} from "@/types/debtRelief";

// 상태 pill 표시 순서 — 피그마 순서(절차진행중 → 상담중 → 검토중 / 계약대기중 → 반려됨 → 중단됨)
const STATUS_ORDER: AnalysisStatus[] = [
  "in_progress",
  "consulting",
  "reviewing",
  "contract_pending",
  "rejected",
  "suspended",
];

type Props = {
  procedure: RecommendedProcedure | undefined;
  status: AnalysisStatus | undefined;
  onApply: (next: { procedure: RecommendedProcedure | undefined; status: AnalysisStatus | undefined }) => void;
  onClose: () => void;
};

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer inline-flex items-center justify-center h-[34px] px-4 rounded-full text-[14px] font-medium transition-colors ${
        selected
          ? "border-2 border-primary-40 bg-primary-10/40 text-foreground"
          : "border border-neutral-30 bg-card text-foreground/80 hover:bg-neutral-10"
      }`}
    >
      {label}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

// "필터추가" 팝오버 패널 — 절차/상태 각각 카테고리당 단일선택. draft 상태로만 들고 있다가
// "적용완료"를 눌러야 실제 목록 쿼리(useDebtReliefList)에 반영된다.
export default function DiagnosisFilterModal({ procedure, status, onApply, onClose }: Props) {
  const [draftProcedure, setDraftProcedure] = useState(procedure);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftProcedure(procedure);
    setDraftStatus(status);
  }, [procedure, status]);

  const toggleProcedure = (next: RecommendedProcedure) => {
    setDraftProcedure((prev) => (prev === next ? undefined : next));
  };
  const toggleStatus = (next: AnalysisStatus) => {
    setDraftStatus((prev) => (prev === next ? undefined : next));
  };

  const handleReset = () => {
    setDraftProcedure(undefined);
    setDraftStatus(undefined);
  };

  const handleApply = () => {
    onApply({ procedure: draftProcedure, status: draftStatus });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="필터 추가"
      className="absolute left-0 top-full mt-2 z-30 w-[360px] max-w-[92vw] rounded-[14px] bg-card border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <h2 className="text-[16px] font-semibold text-foreground">필터추가</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-50 hover:opacity-70"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 pb-2">
        <p className="text-[13px] font-medium text-neutral-60 mb-2">진행절차</p>
        <div className="flex flex-wrap gap-2">
          {RECOMMENDED_PROCEDURE_ORDER.map((key) => (
            <FilterPill
              key={key}
              label={RECOMMENDED_PROCEDURE_LABEL[key]}
              selected={draftProcedure === key}
              onClick={() => toggleProcedure(key)}
            />
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-[13px] font-medium text-neutral-60 mb-2">상태</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((key) => (
            <FilterPill
              key={key}
              label={DIAGNOSIS_STATUS_LABEL[key]}
              selected={draftStatus === key}
              onClick={() => toggleStatus(key)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-30 px-5 py-4">
        <button
          type="button"
          onClick={handleReset}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground hover:bg-neutral-10"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold hover:opacity-90"
        >
          적용완료
        </button>
      </div>
    </div>
  );
}
