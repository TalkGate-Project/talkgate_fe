"use client";

import type { AnalysisStatus } from "@/types/analysis";
import {
  DIAGNOSIS_STATUS_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  type RecommendedProcedure,
} from "@/types/debtRelief";

type Props = {
  procedure: RecommendedProcedure | undefined;
  status: AnalysisStatus | undefined;
  onChangeProcedure: (next: RecommendedProcedure | undefined) => void;
  onChangeStatus: (next: AnalysisStatus | undefined) => void;
};

// 고객목록(CustomersFilterBar/FilterChips)과 동일한 칩/아이콘 스타일 재사용
const CHIP_CLASS_NAME =
  "inline-flex items-center justify-center gap-1.5 px-3 h-[32px] rounded-[30px] border border-neutral-30 bg-card";

function ResetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M4 12L12 4M4 4L12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={`${CHIP_CLASS_NAME} text-neutral-60`}>
      <span className="text-[14px] font-medium text-foreground opacity-80">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} 필터 해제`}
        className="cursor-pointer w-4 h-4 grid place-items-center"
      >
        <RemoveIcon />
      </button>
    </span>
  );
}

// 검색행 아래 별도 줄에 노출되는 적용된 필터 칩 목록 — 활성 필터가 없으면 아무것도 렌더링하지 않는다.
export default function DiagnosisFilterAppliedChips({
  procedure,
  status,
  onChangeProcedure,
  onChangeStatus,
}: Props) {
  const hasActiveFilter = Boolean(procedure) || Boolean(status);
  if (!hasActiveFilter) return null;

  const handleResetAll = () => {
    onChangeProcedure(undefined);
    onChangeStatus(undefined);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleResetAll}
        aria-label="필터 전체 초기화"
        title="초기화"
        className={`${CHIP_CLASS_NAME} cursor-pointer w-[32px] !px-0 text-neutral-60 hover:bg-neutral-10 transition-colors`}
      >
        <ResetIcon />
      </button>

      {procedure && (
        <FilterChip
          label={RECOMMENDED_PROCEDURE_LABEL[procedure]}
          onRemove={() => onChangeProcedure(undefined)}
        />
      )}
      {status && (
        <FilterChip label={DIAGNOSIS_STATUS_LABEL[status]} onRemove={() => onChangeStatus(undefined)} />
      )}
    </div>
  );
}
