"use client";
import { useMemo, useState, type CSSProperties } from "react";
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
import ConfirmModal from "@/components/common/ConfirmModal";
import MonthPicker from "@/components/common/MonthPicker";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Tooltip from "@/components/common/Tooltip";

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
  const [current, setCurrent] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [scheduleToRemove, setScheduleToRemove] =
    useState<WeeklyScheduleItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const montserratStyle = {
    fontFamily:
      'var(--font-montserrat), "Pretendard Variable", Pretendard, ui-sans-serif, system-ui',
  };

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

  const cells: CalendarCell[] = useMemo(
    () => generateMonthCells(current),
    [current]
  );
  const year = current.getFullYear();
  const month = current.getMonth() + 1; // 1-12

  // 달력의 행 수 계산 (5줄 또는 6줄)
  const calendarRows = cells.length / 7;
  // 달력 전체 높이 = 요일 헤더(40px + mb-3 = 52px) + (행 수 × 최소 높이 93px)
  const calendarHeight = 52 + calendarRows * 93;

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
    const schedules =
      data?.data.schedules === null ? [] : data?.data.schedules ?? [];
    for (const item of schedules) {
      const iso = item.scheduleTime;
      if (!iso) continue;
      // 서버에서 내려오는 ISO(UTC 기준) 문자열을 브라우저 로컬 시간대(KST 등) 기준 날짜로 변환해서 키를 만든다.
      // 이렇게 해야 달력 셀(로컬 날짜 기준)과 우측 상세(로컬 시간 기준)가 동일한 날짜에 매핑된다.
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) continue;
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [data]);

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedSchedules = selectedKey
    ? schedulesByDay.get(selectedKey) ?? []
    : [];
  const loading = isLoading && !data;
  const error = isError && !isFetching;
  const [showCreate, setShowCreate] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklyScheduleItem | null>(null);

  const handleRequestRemove = (schedule: WeeklyScheduleItem) => {
    setScheduleToRemove(schedule);
  };

  const handleCancelRemove = () => {
    if (isRemoving) return;
    setScheduleToRemove(null);
  };

  const handleConfirmRemove = async () => {
    if (!projectId || !scheduleToRemove) return;
    setIsRemoving(true);
    try {
      await SchedulesService.remove({
        projectId,
        scheduleId: scheduleToRemove.id,
      });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "schedule", projectId, year, month],
      });
    } catch (err) {
      console.error("Failed to remove schedule", err);
    } finally {
      setIsRemoving(false);
      setScheduleToRemove(null);
    }
  };

  return (
    <Panel
      title={<span className="text-[14px] md:typo-title-4 font-semibold min-w-0 truncate">달력 & 일정</span>}
      action={
        <div className="flex items-center gap-[10px] shrink-0">
          <button
            onClick={goPrev}
            className="cursor-pointer w-[18px] h-[18px] md:w-[35px] md:h-[35px] flex items-center justify-center shrink-0"
          >
            <CalendarPrevIcon />
          </button>
          <div className="w-[90px] md:w-[120px] shrink-0">
            <MonthPicker
              value={current}
              onChange={(date) => date && setCurrent(date)}
              dateFormat="yyyy.MM"
              className="font-montserrat font-bold text-[14px] md:text-[18px] leading-[22px] tracking-[1px] text-center border-none bg-transparent h-[34px] p-0 cursor-pointer text-foreground focus:ring-0"
            />
          </div>
          <button
            onClick={goNext}
            className="cursor-pointer w-[18px] h-[18px] md:w-[35px] md:h-[35px] flex items-center justify-center shrink-0"
          >
            <CalendarNextIcon />
          </button>
        </div>
      }
      className="rounded-[14px]"
      headerClassName="flex items-center justify-between px-4 md:px-7 pt-2 md:pt-[22px]"
      style={{ boxShadow: "6px 6px 54px 0px rgba(0, 0, 0, 0.05)" }}
      bodyClassName="px-4 md:px-6 pb-6 pt-2 md:pt-4"
    >
      <div className="w-full max-w-[1324px] gap-3 grid lg:flex lg:items-stretch">
        {/* Calendar grid */}
        <div className="order-2 lg:order-1 lg:w-[912px] flex flex-col">
          {/* Week header bar */}
          <div className="mb-3 bg-neutral-20 rounded-[12px]">
            <div className="grid grid-cols-7">
              {days.map((d) => (
                <div
                  key={d}
                  className="h-10 grid place-items-center text-neutral-60 typo-title-4 text-[11px] md:text-[14px]"
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-0">
            {cells.map((cell, i) => {
              const isPrevMonth = !cell.inCurrent;
              const isSelected =
                selectedDate &&
                cell.date.getFullYear() === selectedDate.getFullYear() &&
                cell.date.getMonth() === selectedDate.getMonth() &&
                cell.date.getDate() === selectedDate.getDate();
              const isToday =
                cell.date.getFullYear() === today.getFullYear() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getDate() === today.getDate();
              const borderClass = isSelected
                ? "md:border md:border-primary-60"
                : "md:border md:border-[#E2E2E266] dark:md:border-[#33333366]";
              const backgroundClass = "bg-card";
              const key = format(cell.date, "yyyy-MM-dd");
              const daySchedules = schedulesByDay.get(key) ?? [];
              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    if (!cell.inCurrent) {
                      setCurrent(
                        new Date(
                          cell.date.getFullYear(),
                          cell.date.getMonth(),
                          1
                        )
                      );
                    }
                  }}
                  className={`cursor-pointer relative min-h-[45px] md:min-h-[93px] ${borderClass} ${backgroundClass} flex flex-col transition-colors overflow-hidden`}
                >
                  <div
                    className={`font-montserrat font-medium text-[14px] md:text-[16px] leading-[20px] flex items-center justify-center md:items-start md:justify-start md:ml-3 mt-1 md:mt-2 shrink-0 ${
                      isPrevMonth ? "text-figma-muted" : "text-neutral-70"
                    }`}
                    style={montserratStyle}
                  >
                    {isToday ? (
                      <div className="relative w-[20px] h-[20px] md:w-[24px] md:h-[24px] flex items-center justify-center">
                        <div className="absolute w-full h-full bg-[#252525] dark:bg-[#F5F5F5] rounded-full" />
                        <span className="relative text-[#FFFFFF] dark:text-[#111111] font-normal text-[12px] md:text-[14px]">
                          {cell.date.getDate()}
                        </span>
                      </div>
                    ) : (
                      cell.date.getDate()
                    )}
                  </div>
                  {/* 모바일: circle만 표시, 데스크톱: 텍스트와 함께 표시 */}
                  <div className="flex-1 flex flex-col justify-center items-center md:items-start md:ml-4 md:mr-2 gap-0.5 md:gap-1 pb-1 md:pb-3 min-w-0 w-full overflow-hidden">
                    {/* 모바일: circle만 표시 */}
                    <div className="flex items-center gap-1 md:hidden justify-center flex-wrap max-w-full">
                      {daySchedules.slice(0, 4).map((schedule, idx) => (
                        <span
                          key={idx}
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background:
                              schedule.colorCode || COLORS[idx % COLORS.length],
                          }}
                        />
                      ))}
                      {daySchedules.length > 4 && (
                        <span className="text-[8px] text-neutral-60 font-medium shrink-0">
                          +{daySchedules.length - 4}
                        </span>
                      )}
                    </div>
                    {/* 데스크톱: 텍스트와 함께 표시 */}
                    <div className="hidden md:flex flex-col gap-1 w-full min-w-0">
                      {daySchedules.slice(0, 2).map((schedule, idx) => (
                        <Tooltip
                          key={idx}
                          content={schedule.description ||
                            schedule.customer?.name ||
                            "일정"}
                          multiline={true}
                          maxWidth="250px"
                          position="top"
                          delay={0.3}
                          className="flex items-center gap-1 text-[12px] text-neutral-60 min-w-0 w-full"
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              background:
                                schedule.colorCode || COLORS[idx % COLORS.length],
                            }}
                          />
                          <span className="truncate font-medium min-w-0 flex-1" style={{ maxWidth: 'calc(100% - 40px)' }}>
                            {schedule.description ||
                              schedule.customer?.name ||
                              "일정"}
                          </span>
                        </Tooltip>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="flex items-center text-[10px] leading-[1] font-medium text-neutral-60 shrink-0">
                          그 외&nbsp;
                          <span
                            className="font-montserrat"
                            style={montserratStyle}
                          >
                            {daySchedules.length - 2}
                          </span>
                          건
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right schedule list */}
        <aside
          className="order-1 lg:order-2 lg:shrink-0 w-full lg:max-w-[343px]"
        >
          <div 
            className="bg-neutral-10 rounded-[12px] p-4 md:p-7 h-full relative flex flex-col min-h-[182px] lg:min-h-[var(--calendar-height)]"
            style={{ "--calendar-height": `${calendarHeight}px` } as CSSProperties}
          >
            <div className="flex items-center justify-between mb-3 md:mb-5 gap-2">
              <div className="text-[14px] md:typo-title-2 font-semibold md:font-normal">
                {selectedDate ? (
                  <>
                    <span
                      className="font-montserrat tracking-[1px] text-[14px] md:text-[18px]"
                      style={montserratStyle}
                    >
                      {format(selectedDate, "MM.dd")}
                    </span>
                    &nbsp;&nbsp;
                    <span className="text-[14px] md:text-[18px]">
                      {format(selectedDate, "EEEE", { locale: ko })}
                    </span>
                  </>
                ) : (
                  "일정"
                )}{" "}
                (
                {
                  <span className="font-montserrat text-[14px] md:text-[18px]" style={montserratStyle}>
                    {selectedSchedules.length}
                  </span>
                }
                )
              </div>
              <button
                className="cursor-pointer h-[24px] md:h-[34px] px-3 rounded-[5px] bg-neutral-90 text-[12px] md:text-[14px] font-semibold tracking-[-0.02em] text-neutral-20 whitespace-nowrap"
                onClick={() => setShowCreate(true)}
              >
                일정추가
              </button>
            </div>
            <div className="border-t border-[#E2E2E255] dark:border-[#44444455] mb-2 md:mb-3"></div>
            <div className="overflow-y-auto flex-1 space-y-2 md:space-y-3 max-h-[182px] md:max-h-[490px]">
              {waitingForProject ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner size="2xl" />
                </div>
              ) : missingProject ? (
                <div className="flex h-full items-center justify-center text-[14px] text-neutral-60">
                  프로젝트를 먼저 선택해주세요.
                </div>
              ) : loading ? (
                <ScheduleSkeleton />
              ) : error ? (
                <div className="flex h-full items-center justify-center text-[14px] text-danger-40">
                  일정을 불러오는 중 문제가 발생했습니다.
                </div>
              ) : selectedSchedules.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[14px] text-neutral-60">
                  {data?.data.schedules === null
                    ? "일정 데이터가 없습니다."
                    : "선택한 날짜에 일정이 없습니다."}
                </div>
              ) : (
                selectedSchedules.map((schedule) => {
                  const hasCustomer = schedule.customer && schedule.customer.id;
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-2 md:gap-4 bg-card rounded-[8px] md:rounded-[12px] p-3 md:p-4 min-w-0 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-0 transition-colors"
                      onClick={() => {
                        if (hasCustomer) {
                          setSelectedCustomerId(schedule.customer!.id);
                        } else {
                          setEditingSchedule(schedule);
                        }
                      }}
                    >
                      <span
                        className="leading-[1] w-3 h-3 md:w-4 md:h-4 rounded-full shrink-0"
                        style={{
                          background:
                            schedule.colorCode ||
                            COLORS[schedule.id % COLORS.length],
                        }}
                      />
                      <span className="inline-flex items-center leading-[1] text-[12px] md:typo-body-2 text-neutral-60 w-[50px] md:w-[60px] text-left shrink-0 font-montserrat">
                        {formatTimeFromISO(schedule.scheduleTime)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Tooltip
                          content={schedule.description ||
                            schedule.customer?.name ||
                            "일정"}
                          multiline={true}
                          maxWidth="280px"
                          position="top"
                          align="start"
                          gap={10}
                          delay={0.3}
                          className="w-full"
                        >
                          <span className="inline-flex w-full items-center leading-[1] text-[12px] md:typo-body-2 text-neutral-60 flex-1 min-w-0 truncate">
                            {schedule.description ||
                              schedule.customer?.name ||
                              "일정"}
                          </span>
                        </Tooltip>
                      </div>
                      <button
                        type="button"
                        className="cursor-pointer shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestRemove(schedule);
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          className="md:w-4 md:h-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 12L12 4M4 4L12 12"
                            stroke="#B0B0B0"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })
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
            queryClient.invalidateQueries({
              queryKey: ["dashboard", "schedule", projectId, year, month],
            });
          }}
        />
      )}
      {editingSchedule && (
        <ScheduleCreateModal
          editSchedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onCreated={() => {
            if (!projectId) return;
            queryClient.invalidateQueries({
              queryKey: ["dashboard", "schedule", projectId, year, month],
            });
          }}
        />
      )}
      <ConfirmModal
        open={Boolean(scheduleToRemove)}
        title="일정 삭제"
        headline="일정을 삭제하시겠습니까?"
        description="삭제하면 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        loading={isRemoving}
        onCancel={handleCancelRemove}
        onConfirm={handleConfirmRemove}
      />
      <CustomerDetailModal
        open={selectedCustomerId !== null}
        onClose={() => setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
      />
    </Panel>
  );
}
