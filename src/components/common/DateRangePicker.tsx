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
  showInlineIcon?: boolean;
};

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onReset,
  className = "",
  disabled = false,
  showInlineIcon = false,
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

  const renderDatePicker = (
    pickerKey: number,
    value: Date | null,
    onChange: (date: Date | null) => void,
    placeholderText: string,
    pickerClass?: string,
    maxDate?: Date | null,
    minDate?: Date | null
  ) => (
    <div className="w-[175px] relative">
      <DatePicker
        key={pickerKey}
        value={value}
        onChange={onChange}
        placeholder={placeholderText}
        disabled={disabled}
        maxDate={maxDate}
        minDate={minDate}
        className={`border-neutral-30 cursor-pointer ${showInlineIcon ? "pr-10" : ""} ${pickerClass ?? ""}`}
      />
      {showInlineIcon && (
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        {renderDatePicker(
          startKey,
          startDate,
          handleStartChange,
          "연도 . 월 . 일",
          undefined,
          endDate
        )}
        <span className="text-[14px] font-medium text-neutral-90">-</span>
        {renderDatePicker(
          endKey,
          endDate,
          handleEndChange,
          "연도 . 월 . 일",
          undefined,
          undefined,
          startDate
        )}
      </div>
      <button
        type="button"
        onClick={handleReset}
        disabled={disabled}
        className="h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-neutral-90 tracking-[-0.02em] hover:bg-neutral-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        초기화
      </button>
    </div>
  );
}

