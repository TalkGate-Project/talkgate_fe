"use client";

import { useCallback } from "react";
import MonthPicker from "@/components/common/MonthPicker";

type FeeMonthSelectorProps = {
  selectedMonth: Date | null;
  onNavigateMonth: (direction: "prev" | "next") => void;
  onMonthChange: (date: Date) => void;
};

/** 피그마 Frame 13: 34px 버튼 + 227px 월 표시, gap 12 */
export default function FeeMonthSelector({
  selectedMonth,
  onNavigateMonth,
  onMonthChange,
}: FeeMonthSelectorProps) {
  const handleMonthChange = useCallback(
    (date: Date | null) => {
      if (date) onMonthChange(date);
    },
    [onMonthChange]
  );

  return (
    <div className="flex h-[34px] items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onNavigateMonth("prev")}
        aria-label="이전 달"
        className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-[#E2E2E2] bg-white dark:border-neutral-30 dark:bg-neutral-20"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18L9 12L15 6"
            stroke="#B0B0B0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="flex h-[34px] w-[227px] items-center justify-center rounded-[5px] border border-[#E2E2E2] bg-white px-8 dark:border-neutral-30 dark:bg-neutral-20">
        <MonthPicker
          value={selectedMonth}
          onChange={handleMonthChange}
          dateFormat="yyyy - MM월"
          className="h-[34px] w-full cursor-pointer border-none bg-transparent p-0 text-center text-[16px] font-bold leading-[19px] text-[#252525] focus:ring-0 dark:!bg-transparent dark:text-neutral-90"
        />
      </div>

      <button
        type="button"
        onClick={() => onNavigateMonth("next")}
        aria-label="다음 달"
        className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-[#E2E2E2] bg-white dark:border-neutral-30 dark:bg-neutral-20"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 18L15 12L9 6"
            stroke="#B0B0B0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
