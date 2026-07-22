import { useCallback } from "react";
import MonthPicker from "@/components/common/MonthPicker";

interface MonthSelectorProps {
  selectedMonth: Date | null;
  onNavigateMonth: (direction: "prev" | "next") => void;
  onMonthChange: (date: Date) => void;
}

export default function MonthSelector({
  selectedMonth,
  onNavigateMonth,
  onMonthChange,
}: MonthSelectorProps) {
  const handleMonthChange = useCallback(
    (date: Date | null) => {
      if (date) {
        onMonthChange(date);
      }
    },
    [onMonthChange]
  );

  return (
    <div className="flex justify-center w-full">
      <div className="w-full h-[48px] md:bg-neutral-20 md:rounded-[8px] md:px-3 flex justify-center items-center gap-3">
        {/* Previous button */}
        <button
          onClick={() => onNavigateMonth("prev")}
          className="cursor-pointer min-w-[34px] h-[32px] bg-card border border-border rounded-[5px] flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="var(--neutral-50)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Month display */}
        <div className="md:px-8 h-[34px] md:h-auto md:py-[4px] bg-card rounded-[5px]">
          <MonthPicker
            value={selectedMonth}
            onChange={handleMonthChange}
            dateFormat="yyyy - MM월"
            className="text-center font-bold text-[16px] text-foreground dark:!bg-[#111111] h-[34px] md:h-auto p-0 cursor-pointer w-full focus:ring-0 border border-neutral-30 md:border-none"
          />
        </div>

        {/* Next button */}
        <button
          onClick={() => onNavigateMonth("next")}
          className="cursor-pointer min-w-[34px] h-[32px] bg-card border border-border rounded-[5px] flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="var(--neutral-50)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
