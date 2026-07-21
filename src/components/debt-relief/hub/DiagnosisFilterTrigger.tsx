"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisStatus } from "@/types/analysis";
import type { DiagnosisHubSummary, RecommendedProcedure } from "@/types/debtRelief";
import DiagnosisFilterModal from "./DiagnosisFilterModal";

type Props = {
  procedure: RecommendedProcedure | undefined;
  status: AnalysisStatus | undefined;
  summary: DiagnosisHubSummary | null;
  onChangeProcedure: (next: RecommendedProcedure | undefined) => void;
  onChangeStatus: (next: AnalysisStatus | undefined) => void;
};

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

// 목록 상단 필터 트리거 — 아이콘 클릭 시 DiagnosisFilterModal 팝오버 오픈.
// 적용된 필터 칩·전체 초기화는 DiagnosisFilterAppliedChips가 검색행 아래 별도 줄에 렌더링한다.
export default function DiagnosisFilterTrigger({
  procedure,
  status,
  summary,
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

  return (
    <div className="relative shrink-0" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="필터"
        title="필터"
        className="cursor-pointer w-9 h-[38px] grid place-items-center shrink-0 bg-transparent border border-neutral-30 rounded-[8px] text-neutral-60 hover:bg-neutral-10"
      >
        <FilterIcon />
      </button>
      {open && (
        <DiagnosisFilterModal
          procedure={procedure}
          status={status}
          summary={summary}
          onApply={({ procedure: nextProcedure, status: nextStatus }) => {
            onChangeProcedure(nextProcedure);
            onChangeStatus(nextStatus);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
