"use client";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import Panel from "@/components/common/Panel";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SchedulesService } from "@/services/schedules";
import type { WeeklyScheduleItem } from "@/types/dashboard";

const days = ["일", "월", "화", "수", "목", "금", "토"];
const COLORS = [
  "var(--primary-60)",
  "var(--primary-80)",
  "var(--secondary-20)",
  "var(--secondary-60)",
  "var(--warning-40)",
  "var(--danger-40)",
  "var(--danger-20)",
];

export default function CalendarSection() {
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const ym = `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, "0")}`;

  const goPrev = () => {
    const y = current.getFullYear();
    const m = current.getMonth();
    setCurrent(new Date(y, m - 1, 1));
  };
  const goNext = () => {
    const y = current.getFullYear();
    const m = current.getMonth();
    setCurrent(new Date(y, m + 1, 1));
  };

  type Cell = { date: Date; inCurrent: boolean };
  const cells: Cell[] = useMemo(() => {
    const y = current.getFullYear();
    const m = current.getMonth();
    const first = new Date(y, m, 1);
    const startDow = first.getDay(); // 0=Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();
    const totalCells = startDow + daysInMonth <= 35 ? 35 : 42; // 5주 또는 6주
    const result: Cell[] = [];
    for (let i = 0; i < totalCells; i++) {
      if (i < startDow) {
        const d = daysInPrev - startDow + 1 + i;
        result.push({ date: new Date(y, m - 1, d), inCurrent: false });
      } else if (i < startDow + daysInMonth) {
        const d = i - startDow + 1;
        result.push({ date: new Date(y, m, d), inCurrent: true });
      } else {
        const d = i - (startDow + daysInMonth) + 1;
        result.push({ date: new Date(y, m + 1, d), inCurrent: false });
      }
    }
    return result;
  }, [current]);
  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
  const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const startDateParam = format(monthStart, "yyyy-MM-dd");
  const endDateParam = format(monthEnd, "yyyy-MM-dd");

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["dashboard", "schedule", projectId, startDateParam, endDateParam],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await SchedulesService.list({ projectId, startDate: startDateParam, endDate: endDateParam });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, WeeklyScheduleItem[]>();
    const items: WeeklyScheduleItem[] = data?.data.data ?? [];
    for (const item of items) {
      const iso = extractDateTime(item);
      if (!iso) continue;
      const key = iso.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [data]);

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedSchedules = selectedKey ? schedulesByDay.get(selectedKey) ?? [] : [];
  const loading = isLoading && !data;
  const error = isError && !isFetching;

  return (
    <Panel
      title={<span className="typo-title-2">달력 & 일정</span>}
      action={
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="w-[34px] h-[34px] rounded-[5px] border border-border grid place-items-center text-neutral-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="px-3 h-[34px] grid place-items-center text-foreground font-[var(--font-montserrat)] font-bold text-[18px] leading-[22px] tracking-[1px]">
            {ym}
          </div>
          <button onClick={goNext} className="w-[34px] h-[34px] rounded-[5px] border border-border grid place-items-center text-neutral-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      }
      className="rounded-[14px]"
      style={{ boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
      bodyClassName="px-6 pb-6 pt-4"
    >
      <div className="w-[1324px] h-full gap-6 grid lg:flex lg:items-start">
        {/* Calendar grid */}
        <div className="order-2 lg:order-1 lg:w-[896px]">
          {/* Week header bar */}
          <div className="mb-2 bg-neutral-20 rounded-[12px]">
            <div className="grid" style={{ gridTemplateColumns: "repeat(7, 128px)" }}>
              {days.map((d) => (
                <div key={d} className="h-12 grid place-items-center text-neutral-60 typo-title-4">
                  {d}
                </div>
              ))}
            </div>
          </div>
          {/* Days */}
          <div className="grid gap-0" style={{ gridTemplateColumns: "repeat(7, 128px)" }}>
            {cells.map((cell, i) => {
              const isPrevMonth = !cell.inCurrent;
              const isSelected =
                selectedDate &&
                cell.date.getFullYear() === selectedDate.getFullYear() &&
                cell.date.getMonth() === selectedDate.getMonth() &&
                cell.date.getDate() === selectedDate.getDate();
              const borderClass = isSelected ? "border-2 border-primary-60" : "border border-border";
              const backgroundClass = isPrevMonth ? "bg-neutral-10" : "bg-card";
              const key = format(cell.date, "yyyy-MM-dd");
              const daySchedules = schedulesByDay.get(key) ?? [];
              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    if (!cell.inCurrent) {
                      setCurrent(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                    }
                  }}
                  className={`relative min-h-[93px] ${borderClass} ${backgroundClass} flex flex-col transition-colors`}
                >
                  <div
                    className={`font-[var(--font-montserrat)] text-[16px] leading-[20px] ml-2 mt-2 ${
                      isPrevMonth ? "text-neutral-50" : "text-neutral-70"
                    }`}
                  >
                    {cell.date.getDate()}
                  </div>
                  <div className="space-y-1 mt-auto mb-2 ml-2 mr-2">
                    {daySchedules.slice(0, 3).map((schedule, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[12px] text-neutral-60">
                        <span className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                        {schedule.title ?? schedule.description ?? schedule.memberName ?? "일정"}
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-60">그 외 {daySchedules.length - 3}건</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right schedule list */}
        <aside className="order-1 lg:order-2 lg:shrink-0">
          <div className="bg-neutral-10 rounded-[12px] p-4 h-full relative flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="typo-title-2">
                {selectedDate ? format(selectedDate, "MM.dd EEEE", { locale: ko }) : "일정"} ({selectedSchedules.length})
              </div>
            </div>
            <div className="space-y-3 pr-3 overflow-y-auto" style={{ maxHeight: 405 }}>
              {waitingForProject ? (
                <div className="flex h-[240px] items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
                </div>
              ) : missingProject ? (
                <div className="flex h-[240px] items-center justify-center text-[14px] text-neutral-60">
                  프로젝트를 먼저 선택해주세요.
                </div>
              ) : loading ? (
                <ScheduleSkeleton />
              ) : error ? (
                <div className="flex h-[240px] items-center justify-center text-[14px] text-danger-40">
                  일정을 불러오는 중 문제가 발생했습니다.
                </div>
              ) : selectedSchedules.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center text-[14px] text-neutral-60">
                  선택한 날짜에 일정이 없습니다.
                </div>
              ) : (
                selectedSchedules.map((schedule, idx) => (
                  <div key={`${schedule.id}-${idx}`} className="flex items-center gap-4 bg-card rounded-[12px] p-4" style={{ maxWidth: 304 }}>
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="typo-body-2 text-neutral-60 w-[61px] text-center self-center shrink-0">
                      {formatScheduleTime(schedule)}
                    </span>
                    <span className="typo-body-2 text-neutral-60 flex-1 break-words whitespace-normal">
                      {schedule.title ?? schedule.description ?? schedule.memberName ?? "일정"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </Panel>
  );
}

function extractDateTime(schedule: WeeklyScheduleItem) {
  return (
    (typeof schedule.scheduleTime === "string" && schedule.scheduleTime) ||
    (typeof (schedule as any).startAt === "string" && (schedule as any).startAt) ||
    (typeof (schedule as any).startTime === "string" && (schedule as any).startTime) ||
    null
  );
}

function formatScheduleTime(schedule: WeeklyScheduleItem) {
  const iso = extractDateTime(schedule);
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "HH:mm");
}

function ScheduleSkeleton() {
  return (
    <div className="flex h-[240px] flex-col justify-center gap-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <span className="h-4 w-4 rounded-full bg-neutral-20" />
          <span className="h-5 w-16 rounded bg-neutral-20" />
          <span className="h-5 flex-1 rounded bg-neutral-20" />
        </div>
      ))}
    </div>
  );
}


