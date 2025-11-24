import Panel from "@/components/common/Panel";
import { formatDate } from "@/utils/attendance";
import DatePicker from "@/components/common/DatePicker";

interface AttendanceHeaderProps {
  selectedDate: string;
  onNavigateDate: (direction: "prev" | "next") => void;
  onDateChange: (date: Date) => void;
}

export default function AttendanceHeader({
  selectedDate,
  onNavigateDate,
  onDateChange,
}: AttendanceHeaderProps) {
  return (
    <Panel
      className="rounded-[14px] mb-9"
      title={
        <div className="flex items-end gap-4">
          <h1 className="text-[24px] leading-[20px] font-bold text-neutral-90">
            근태
          </h1>
          <span className="w-px h-4 bg-neutral-60 opacity-60" />
          <p className="text-[18px] leading-[20px] font-medium text-neutral-60">
            직원들의 출퇴근 현황을 확인하고 관리하세요
          </p>
        </div>
      }
      bodyClassName="px-7 py-[30px]  border-t border-neutral-30"
    >
      {/* Date selector */}
      <div className="flex justify-center w-full">
        <div className="w-full h-[48px] bg-neutral-20 rounded-[8px] px-3 flex justify-center items-center gap-3">
          {/* Previous button */}
          <button
            onClick={() => onNavigateDate("prev")}
            className="cursor-pointer w-[34px] h-[32px] bg-card border border-border rounded-[5px] flex items-center justify-center"
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

          {/* Date display */}
          <div className="px-8 py-[4px] bg-card rounded-[5px]">
            <DatePicker
              value={new Date(selectedDate)}
              onChange={(d) => d && onDateChange(d)}
              dateFormat="yyyy - MM - dd (EEE)"
              className="text-center font-bold text-[16px] text-foreground border-none bg-transparent h-auto p-0 cursor-pointer w-full focus:ring-0"
            />
          </div>

          {/* Next button */}
          <button
            onClick={() => onNavigateDate("next")}
            className="cursor-pointer w-[34px] h-[32px] bg-card border border-border rounded-[5px] flex items-center justify-center"
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
    </Panel>
  );
}

