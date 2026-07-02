"use client";

import Panel from "@/components/common/Panel";
import CurrentProjectBadge from "@/components/common/CurrentProjectBadge";
import DatePicker from "@/components/common/DatePicker";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";

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
  const { project, isLoading: isProjectLoading } = useCurrentProjectDetail();

  return (
    <Panel
      className="rounded-none md:rounded-[14px] md:mb-9"
      title={
        <div className="flex w-full min-w-0 items-center justify-between gap-3 md:items-start">
          <div className="flex min-w-0 items-end gap-4">
            <h1 className="translate-y-[3px] text-[18px] md:text-[24px] md:leading-[20px] font-bold text-neutral-90">
              근태
            </h1>
            <span className="hidden md:block w-px h-4 bg-neutral-60 opacity-60" />
            <p className="hidden md:block translate-y-[3px] text-[18px] leading-[20px] font-medium text-neutral-60">
              직원들의 출퇴근 현황을 확인하고 관리하세요
            </p>
          </div>
          <CurrentProjectBadge
            projectName={project?.name}
            projectLogoUrl={project?.logoUrl}
            loading={isProjectLoading}
            className="max-w-[60%] justify-end md:max-w-[240px]"
          />
        </div>
      }
      bodyClassName="px-6 md:px-7 pb-4 md:py-7.5 border-t-0 md:border-t border-b md:border-b-0 border-neutral-30"
    >
      {/* Date selector */}
      <div className="flex justify-center w-full">
        <div className="w-full h-[48px] md:bg-neutral-20 md:rounded-[8px] md:px-3 flex justify-center items-center gap-3 ">
          {/* Previous button */}
          <button
            onClick={() => onNavigateDate("prev")}
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

          {/* Date display */}
          <div className="md:px-8 h-[34px] md:h-auto md:py-[4px] bg-card rounded-[5px]">
            <DatePicker
              value={new Date(selectedDate)}
              onChange={(d) => d && onDateChange(d)}
              dateFormat="yyyy - MM - dd (EEE)"
              className="text-center font-bold text-[16px] text-foreground dark:!bg-[#111111] h-[34px] md:h-auto p-0 cursor-pointer w-full focus:ring-0 border border-neutral-30 md:border-none"
            />
          </div>

          {/* Next button */}
          <button
            onClick={() => onNavigateDate("next")}
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
    </Panel>
  );
}

