import { useState } from "react";
import DatePicker from "./DatePicker";

type DateRangePickerProps = {
  startDate: Date | null;
  endDate: Date | null;
  onStartChange: (date: Date | null) => void;
  onEndChange: (date: Date | null) => void;
  onReset?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onReset,
  className = "",
  disabled = false,
}: DateRangePickerProps) {
  const [startKey, setStartKey] = useState(0);
  const [endKey, setEndKey] = useState(0);

  const handleStartChange = (date: Date | null) => {
    onStartChange(date);
    // 시작일이 종료일보다 나중이면 종료일 초기화
    if (date && endDate && date > endDate) {
      onEndChange(null);
      setEndKey((k) => k + 1); // Force re-render of end picker
    }
  };

  const handleEndChange = (date: Date | null) => {
    onEndChange(date);
  };

  const handleReset = () => {
    onStartChange(null);
    onEndChange(null);
    setStartKey((k) => k + 1);
    setEndKey((k) => k + 1);
    onReset?.();
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-[175px]">
          <DatePicker
            key={startKey}
            value={startDate}
            onChange={handleStartChange}
            placeholder="연도 . 월 . 일"
            disabled={disabled}
            maxDate={endDate}
            className="border-neutral-30 cursor-pointer"
          />
        </div>
        <span className="text-[14px] font-medium text-neutral-90">-</span>
        <div className="w-[175px]">
          <DatePicker
            key={endKey}
            value={endDate}
            onChange={handleEndChange}
            placeholder="연도 . 월 . 일"
            disabled={disabled}
            minDate={startDate}
            className="border-neutral-30 cursor-pointer"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleReset}
        disabled={disabled}
        className="h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-neutral-90 tracking-[-0.02em] hover:bg-neutral-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        초기화
      </button>
    </div>
  );
}

