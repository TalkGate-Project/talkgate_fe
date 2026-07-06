"use client";

import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";
import { CustomersService } from "@/services/customers";
import type { BulkCreateSchedulesFilterConditions } from "@/types/customers";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  /** API 성공 후(피드백 노출 여부와 무관) 목록 새로고침 및 선택 해제를 위해 호출 */
  onSuccess?: () => void;
  projectId: string;
  selectedIds: number[];
  /** "all"이면 필터 조건으로 등록, "page" 또는 null이면 selectedIds로 등록 */
  selectionMode: "page" | "all" | null;
  appliedFilters?: Record<string, unknown>;
  /** selectionMode === "all"일 때 예상 건수 */
  total: number;
  selectedCount: number;
};

const COLOR_PALETTE = [
  "#00E272", // primary-60
  "#00B55B", // primary-80
  "#7EA5F8", // secondary-20
  "#2563EB", // secondary-60
  "#EFB008", // warning-40
  "#976400", // warning-60
  "#D83232", // danger-40
  "#FC9595", // danger-20
];

const SCHEDULE_PRESETS = [
  { label: "30분 후", minutes: 30 },
  { label: "1시간 후", minutes: 60 },
  { label: "2시간 후", minutes: 120 },
  { label: "3시간 후", minutes: 180 },
  { label: "6시간 후", minutes: 360 },
  { label: "24시간 후", minutes: 1440 },
] as const;

function buildFilterConditions(
  appliedFilters?: Record<string, unknown>
): BulkCreateSchedulesFilterConditions {
  if (!appliedFilters || Object.keys(appliedFilters).length === 0) return {};

  const f = appliedFilters;
  const conditions: BulkCreateSchedulesFilterConditions = {};

  if (typeof f.name === "string") conditions.name = f.name;
  if (typeof f.contact1 === "string") conditions.contact1 = f.contact1;
  if (typeof f.contact2 === "string") conditions.contact2 = f.contact2;
  if (typeof f.noteContent === "string") conditions.noteContent = f.noteContent;
  if (f.assignType != null) conditions.assignType = String(f.assignType);
  if (typeof f.apiKeyId === "number") conditions.apiKeyId = f.apiKeyId;
  if (typeof f.teamId === "number") conditions.teamId = f.teamId;
  if (typeof f.memberId === "number") conditions.memberId = f.memberId;
  if (typeof f.applicationRoute === "string") conditions.applicationRoute = f.applicationRoute;
  if (typeof f.mediaCompany === "string") conditions.mediaCompany = f.mediaCompany;
  if (typeof f.site === "string") conditions.site = f.site;
  if (Array.isArray(f.categoryIds)) {
    conditions.categoryIds = f.categoryIds.map((id) => (id === null ? "null" : id)) as (
      | number
      | string
    )[];
  }
  if (typeof f.applicationDateFrom === "string") conditions.applicationDateFrom = f.applicationDateFrom;
  if (typeof f.applicationDateTo === "string") conditions.applicationDateTo = f.applicationDateTo;
  if (typeof f.assignedAtFrom === "string") conditions.assignedAtFrom = f.assignedAtFrom;
  if (typeof f.assignedAtTo === "string") conditions.assignedAtTo = f.assignedAtTo;
  if (typeof f.projectPartnerId === "number") conditions.projectPartnerId = f.projectPartnerId;

  return conditions;
}

function buildTimeFromMinutesFromNow(minutesToAdd: number): { date: Date; time: string } {
  const target = new Date();
  target.setMinutes(target.getMinutes() + minutesToAdd);
  target.setSeconds(0, 0);
  const hh = String(target.getHours()).padStart(2, "0");
  const mm = String(target.getMinutes()).padStart(2, "0");
  return { date: target, time: `${hh}:${mm}` };
}

export default function BulkScheduleCreateModal({
  open,
  onClose,
  onSuccess,
  projectId,
  selectedIds,
  selectionMode,
  appliedFilters,
  total,
  selectedCount,
}: Props) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [color, setColor] = useState<string>(COLOR_PALETTE[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = buildTimeFromMinutesFromNow(0);
    setSelectedPreset(null);
    setDate(initial.date);
    setTime(initial.time);
    setColor(COLOR_PALETTE[0]);
    setDescription("");
    setSubmitting(false);
  }, [open]);

  const buildIso = useMemo(() => {
    return (): string | null => {
      if (!date || !time) return null;
      const [hh, mm] = time.split(":").map((v) => Number(v));
      if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
      const base = new Date(date);
      base.setHours(hh, mm, 0, 0);
      return base.toISOString();
    };
  }, [date, time]);

  if (!open) return null;

  const handlePresetClick = (minutes: number) => {
    const next = buildTimeFromMinutesFromNow(minutes);
    setSelectedPreset(minutes);
    setDate(next.date);
    setTime(next.time);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const iso = buildIso();
    if (!iso) {
      showErrorModal({
        title: "알림",
        headline: "날짜와 시간을 선택하세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }
    if (!description.trim()) {
      showErrorModal({
        title: "알림",
        headline: "일정 내용을 입력하세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res =
        selectionMode === "all"
          ? await CustomersService.bulkCreateSchedules({
              projectId,
              assignmentType: "filter",
              filterConditions: buildFilterConditions(appliedFilters),
              expectedCount: total,
              scheduleTime: iso,
              description: description.trim(),
              colorCode: color,
            })
          : await CustomersService.bulkCreateSchedules({
              projectId,
              assignmentType: "ids",
              customerIds: selectedIds,
              scheduleTime: iso,
              description: description.trim(),
              colorCode: color,
            });

      const { successCount, failedCount } = res.data.data;

      onSuccess?.();
      onClose();

      if (failedCount === 0) {
        showErrorModal({
          type: "success",
          title: "일정 추가",
          headline: "일정이 추가되었습니다.",
        });
      } else if (successCount === 0) {
        showErrorModal({
          type: "error",
          title: "일정 추가",
          headline: "일정 추가에 실패했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      } else {
        showErrorModal({
          type: "success",
          title: "일정 추가",
          headline: "일정이 일부 추가되었습니다.",
          description: `${successCount}건 성공, ${failedCount}건 실패했습니다.`,
        });
      }
    } catch (e: any) {
      console.error("Bulk schedule create failed:", e);
      showErrorModal({
        type: "error",
        title: "오류 발생",
        headline: "일정 추가에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      onClose={() => (!submitting ? onClose() : undefined)}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="relative w-full h-full md:w-full md:max-w-[452px] md:h-auto rounded-[14px] bg-white dark:bg-neutral-10 flex flex-col md:max-h-[90vh]"
      ariaLabel="일정 추가"
    >
      {/* Header */}
      <div className="px-4 md:px-7 pt-4 md:pt-6">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[14px] md:text-[18px] font-semibold leading-[21px] text-ink dark:text-neutral-80">
            일정 추가
          </div>
          <button
            aria-label="close"
            onClick={() => !submitting && onClose()}
            className="cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" className="text-neutral-60 dark:text-neutral-60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="mb-4 md:mb-6 text-[13px] font-medium text-neutral-60 dark:text-neutral-60">
          선택한 {selectedCount.toLocaleString()}명의 고객에게 동일한 일정을 등록합니다.
        </p>
      </div>

      {/* Body */}
      <div className="px-4 md:px-7 flex-1 overflow-y-auto">
        {/* Date & Time */}
        <div className="mb-2 text-[14px] font-medium tracking-[0.2px] text-neutral-60">날짜</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 md:w-[175px] md:flex-none relative">
            <DatePicker
              value={date}
              onChange={(d) => {
                setSelectedPreset(null);
                setDate(d);
              }}
              className="pr-10"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="currentColor" className="text-neutral-50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 md:w-[209px] md:flex-none">
            <TimePicker
              value={time}
              onChange={(t) => {
                setSelectedPreset(null);
                setTime(t);
              }}
              minuteStep={10}
            />
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-5 flex flex-wrap gap-x-3 gap-y-5">
          {SCHEDULE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.minutes;
            return (
              <button
                key={preset.label}
                type="button"
                className={`cursor-pointer h-[34px] px-3 rounded-[5px] text-[14px] leading-[17px] tracking-[-0.02em] whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-primary-10/40 border border-primary-60 font-semibold text-foreground"
                    : "bg-card border border-neutral-30 dark:border-neutral-30 font-medium text-ink dark:text-neutral-80"
                }`}
                onClick={() => handlePresetClick(preset.minutes)}
                disabled={submitting}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Color */}
        <div className="mt-5">
          <div className="mb-3 text-[14px] font-medium tracking-[0.2px] text-neutral-60 dark:text-neutral-60">컬러</div>
          <div className="flex items-center gap-3 pb-0.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`cursor-pointer w-[18px] h-[18px] rounded-full ${color === c ? "ring-2 ring-ink dark:ring-neutral-80" : ""}`}
                style={{ background: c }}
                aria-label={`color ${c}`}
                disabled={submitting}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-5 mb-4">
          <div className="mb-2 text-[14px] font-medium tracking-[0.2px] text-neutral-60 dark:text-neutral-60">일정내용</div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="일정내용을 입력하세요"
            className="w-full h-[34px] rounded-[5px] border border-neutral-30 dark:border-neutral-30 px-3 text-[14px] font-medium tracking-[-0.02em] text-ink dark:text-neutral-80 placeholder:text-neutral-60 dark:placeholder:text-neutral-60 bg-card dark:bg-neutral-10"
            style={{ lineHeight: "17px" }}
            disabled={submitting}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-30 dark:border-neutral-30" />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-4 md:px-7 py-3">
        <button
          onClick={() => !submitting && onClose()}
          disabled={submitting}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-20 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-[#EDEDED] dark:text-neutral-20 disabled:opacity-60"
        >
          일정 추가
        </button>
      </div>
    </BaseModal>
  );
}
