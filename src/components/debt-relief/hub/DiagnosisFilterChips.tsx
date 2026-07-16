"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisStatus } from "@/types/analysis";
import {
  DIAGNOSIS_STATUS_LABEL,
  RECOMMENDED_PROCEDURE_LABEL,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import DiagnosisFilterModal from "./DiagnosisFilterModal";

type Props = {
  procedure: RecommendedProcedure | undefined;
  status: AnalysisStatus | undefined;
  onChangeProcedure: (next: RecommendedProcedure | undefined) => void;
  onChangeStatus: (next: AnalysisStatus | undefined) => void;
};

// 고객목록(CustomersFilterBar/FilterChips)과 동일한 칩/아이콘 스타일 재사용
const CHIP_CLASS_NAME =
  "inline-flex items-center justify-center gap-1.5 px-3 h-[32px] rounded-[30px] border border-neutral-30 bg-card";

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M2.5 3.5C2.5 2.94771 2.94772 2.5 3.5 2.5H16.5C17.0523 2.5 17.5 2.94772 17.5 3.5V5.41912C17.5 5.68434 17.3946 5.93869 17.2071 6.12623L11.9596 11.3738C11.772 11.5613 11.6667 11.8157 11.6667 12.0809V14.1667L8.33333 17.5V12.0809C8.33333 11.8157 8.22798 11.5613 8.04044 11.3738L2.79289 6.12623C2.60536 5.93869 2.5 5.68434 2.5 5.41912V3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

// 목록 상단 절차/상태 필터 — 고객목록 페이지(CustomersFilterBar/FilterChips)와 같은 레이아웃:
// 왼쪽 고정 필터 아이콘(팝오버로 DiagnosisFilterModal 오픈) → 초기화 아이콘(필터 있을 때만) → 적용된 칩들.
export default function DiagnosisFilterChips({
  procedure,
  status,
  onChangeProcedure,
  onChangeStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const hasActiveFilter = Boolean(procedure) || Boolean(status);

  const handleResetAll = () => {
    onChangeProcedure(undefined);
    onChangeStatus(undefined);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative shrink-0" ref={triggerRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="필터"
          title="필터"
          className="cursor-pointer w-9 h-[36px] grid place-items-center shrink-0 bg-transparent border border-neutral-30 rounded-[6px] text-neutral-60 hover:bg-neutral-10"
        >
          <FilterIcon />
        </button>
        {open && (
          <DiagnosisFilterModal
            procedure={procedure}
            status={status}
            onApply={({ procedure: nextProcedure, status: nextStatus }) => {
              onChangeProcedure(nextProcedure);
              onChangeStatus(nextStatus);
            }}
            onClose={() => setOpen(false)}
          />
        )}
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleResetAll}
          aria-label="필터 전체 초기화"
          title="초기화"
          className={`${CHIP_CLASS_NAME} cursor-pointer w-[32px] !px-0 text-neutral-60 hover:bg-neutral-10 transition-colors`}
        >
          <ResetIcon />
        </button>
      )}

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
