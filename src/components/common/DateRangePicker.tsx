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
  /** "초기화" 버튼 노출 여부. 기본 true — 특정 화면에서만 임시로 숨기고 싶을 때 false로 전달 */
  showReset?: boolean;
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
  showReset = true,
}: DateRangePickerProps) {
  const handleReset = () => {
    onStartChange(null);
    onEndChange(null);
    onReset?.();
  };

  const renderDatePicker = (
    value: Date | null,
    onChange: (date: Date | null) => void,
    placeholderText: string,
    pickerClass?: string,
    maxDate?: Date | null,
    minDate?: Date | null
  ) => (
    <div className="flex-1 min-w-0 md:w-[175px] md:flex-none relative">
      <DatePicker
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
    <div className={`flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap ${className}`}>
      {renderDatePicker(
        startDate,
        onStartChange,
        "연도 . 월 . 일",
        undefined,
        endDate
      )}
      <span className="text-[14px] font-medium text-neutral-90 flex-shrink-0">-</span>
      {renderDatePicker(
        endDate,
        onEndChange,
        "연도 . 월 . 일",
        undefined,
        undefined,
        startDate
      )}
      {showReset && (
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="hidden md:inline-flex md:items-center h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-neutral-90 tracking-[-0.02em] hover:bg-neutral-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          초기화
        </button>
      )}
    </div>
  );
}

