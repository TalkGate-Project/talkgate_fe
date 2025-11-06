"use client";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Panel from "@/components/common/Panel";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { SchedulesService } from "@/services/schedules";
import type { WeeklyScheduleItem } from "@/types/dashboard";
import { generateMonthCells, type CalendarCell } from "@/utils/calendar";
import { formatTimeFromISO } from "@/utils/datetime";
import CalendarPrevIcon from "@/components/common/icons/CalendarPrevIcon";
import CalendarNextIcon from "@/components/common/icons/CalendarNextIcon";
import ScheduleCreateModal from "@/components/dashboard/ScheduleCreateModal";
import ScheduleSkeleton from "@/components/dashboard/ScheduleSkeleton";

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
  const queryClient = useQueryClient();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const ym = `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, "0")}`;
  const montserratStyle = { fontFamily: 'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui' };

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

  const cells: CalendarCell[] = useMemo(() => generateMonthCells(current), [current]);
  const year = current.getFullYear();
  const month = current.getMonth() + 1; // 1-12

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["dashboard", "schedule", projectId, year, month],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await SchedulesService.list({ projectId, year, month });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, WeeklyScheduleItem[]>();
    const schedules = data?.data.schedules === null ? [] : (data?.data.schedules ?? []);
    for (const item of schedules) {
      const iso = item.scheduleTime;
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
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Panel
      title={<span className="typo-title-4">달력 & 일정</span>}
      action={
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="w-[36px] h-[36px] grid place-items-center">
            <CalendarPrevIcon />
          </button>
          <div className="px-3 h-[34px] grid place-items-center text-foreground font-montserrat font-bold text-[18px] leading-[22px] tracking-[1px]" style={montserratStyle}>
            {ym}
          </div>
          <button onClick={goNext} className="w-[36px] h-[36px] grid place-items-center">
            <CalendarNextIcon />
          </button>
        </div>
      }
      className="rounded-[14px]"
      style={{ boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
      bodyClassName="px-6 pb-6 pt-4"
    >
      <div className="w-[1324px] h-full gap-6 grid lg:flex lg:items-start">
        {/* Calendar grid */}
        <div className="order-2 lg:order-1 lg:w-[912px]">
          {/* Week header bar */}
          <div className="mb-2 bg-neutral-20 rounded-[12px]">
            <div className="grid" style={{ gridTemplateColumns: "repeat(7, 130px)" }}>
              {days.map((d) => (
                <div key={d} className="h-12 grid place-items-center text-neutral-60 typo-title-4">
                  {d}
                </div>
              ))}
            </div>
          </div>
          {/* Days */}
          <div className="grid gap-0" style={{ gridTemplateColumns: "repeat(7, 130px)" }}>
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
                    className={`font-montserrat font-medium text-[16px] leading-[20px] ml-3 mt-2 ${
                      isPrevMonth ? "text-figma-muted" : "text-neutral-70"
                    }`}
                    style={montserratStyle}
                  >
                    {cell.date.getDate()}
                  </div>
                  <div className="mt-auto mb-2 ml-4 mr-2">
                    {daySchedules.slice(0, 2).map((schedule, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[12px] text-neutral-60 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: schedule.colorCode || COLORS[idx % COLORS.length] }} />
                        <span className="truncate" style={{ maxWidth: 102 }}>
                          {schedule.description || schedule.customer?.name || "일정"}
                        </span>
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-60">
                        그 외 <span className="font-montserrat" style={montserratStyle}>{daySchedules.length - 2}</span>건
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right schedule list */}
        <aside className="order-1 lg:order-2 lg:shrink-0 w-full max-w-[343px]">
          <div className="bg-neutral-10 rounded-[12px] p-4 h-full relative flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="typo-title-2">
                {selectedDate ? (
                  <>
                    <span className="font-montserrat" style={montserratStyle}>{format(selectedDate, "MM.dd")}</span>{" "}
                    {format(selectedDate, "EEEE", { locale: ko })}
                  </>
                ) : (
                  "일정"
                )} ({<span className="font-montserrat" style={montserratStyle}>{selectedSchedules.length}</span>})
              </div>
              <button
                className="h-[34px] px-3 rounded-[5px] border border-border bg-card text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10"
                onClick={() => setShowCreate(true)}
              >
                일정 추가
              </button>
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
                  {data?.data.schedules === null ? "일정 데이터가 없습니다." : "선택한 날짜에 일정이 없습니다."}
                </div>
              ) : (
                selectedSchedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-4 bg-card rounded-[12px] p-4 min-w-0" style={{ maxWidth: 304 }}>
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: schedule.colorCode || COLORS[schedule.id % COLORS.length] }} />
                    <span className="typo-body-2 text-neutral-60 w-[61px] text-center self-center shrink-0 font-montserrat" style={montserratStyle}>
                      {formatTimeFromISO(schedule.scheduleTime)}
                    </span>
                    <span className="typo-body-2 text-neutral-60 flex-1 truncate">
                      {schedule.description || schedule.customer?.name || "일정"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
      {showCreate && (
        <ScheduleCreateModal
          defaultDate={selectedDate ?? current}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            if (!projectId) return;
            queryClient.invalidateQueries({ queryKey: ["dashboard", "schedule", projectId, year, month] });
          }}
        />
      )}
    </Panel>
  );
}


