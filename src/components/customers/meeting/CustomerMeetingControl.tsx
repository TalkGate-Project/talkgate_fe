"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomerMeeting } from "@/types/customers";
import TimePicker from "@/components/common/TimePicker";
import { MEETING_BADGE_CLASS_NAME } from "./CustomerMeetingBadge";
import { addMinutesToDate, formatMeetingEndLabel, resolveUpcomingTime } from "./meetingTime";
import { useActiveMeeting } from "./useActiveMeeting";

const START_PRESETS = [
  { label: "30분", minutes: 30 },
  { label: "1시간", minutes: 60 },
  { label: "2시간", minutes: 120 },
];

const EXTEND_PRESETS = [
  { label: "+30분", minutes: 30 },
  { label: "+1시간", minutes: 60 },
];

type Props = {
  meeting?: CustomerMeeting | null;
  /** endsAt을 생략하면 자정 자동 해제. 이미 미팅중이면 종료시간만 바뀐다 */
  onSetMeeting: (endsAt?: Date) => Promise<void>;
  onEndMeeting: () => Promise<void>;
};

const OPTION_BUTTON_CLASS_NAME =
  "cursor-pointer h-[30px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[13px] font-medium text-neutral-90 hover:bg-neutral-10 dark:hover:bg-neutral-30 disabled:opacity-50 disabled:cursor-default";

/** 상세 헤더의 미팅중 표시 + 설정/연장/해제 팝오버 */
export default function CustomerMeetingControl({ meeting, onSetMeeting, onEndMeeting }: Props) {
  const activeMeeting = useActiveMeeting(meeting);
  const endLabel = activeMeeting ? formatMeetingEndLabel(activeMeeting) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeValue, setTimeValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      // TimePicker 패널은 body 포털로 뜨므로 바깥 클릭으로 보지 않는다.
      if ((event.target as Element | null)?.closest?.("[data-anchored-panel]")) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const runAndClose = async (action: () => Promise<void>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await action();
      setIsOpen(false);
      setTimeValue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPickedTime = () => {
    const endsAt = resolveUpcomingTime(timeValue);
    if (!endsAt) return;
    void runAndClose(() => onSetMeeting(endsAt));
  };

  // 시간 미지정 미팅은 종료시간이 자정이라 거기서 더하면 의미가 없으므로 현재 시각 기준으로 연장한다.
  const extendBase = activeMeeting?.hasEndTime ? new Date(activeMeeting.endsAt) : new Date();

  return (
    <div ref={containerRef} className="relative">
      {activeMeeting ? (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={`${MEETING_BADGE_CLASS_NAME} !h-[28px] !px-2.5 cursor-pointer`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span className="w-[6px] h-[6px] rounded-full bg-current" aria-hidden />
          미팅중
          {endLabel && <span className="font-medium opacity-80">· {endLabel}</span>}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="cursor-pointer h-[28px] px-2.5 rounded-full border border-[#E2E2E2] dark:border-[#444444] text-[12px] font-semibold text-neutral-60 hover:bg-neutral-10 dark:hover:bg-neutral-30 whitespace-nowrap"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          미팅 시작
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          data-no-drag="true"
          aria-label={activeMeeting ? "미팅 시간 변경" : "미팅 시작"}
          className="absolute left-0 top-full mt-2 z-50 w-[264px] rounded-[10px] border border-[#E2E2E2] dark:border-[#444444] bg-card dark:bg-neutral-20 p-3 shadow-lg flex flex-col gap-3"
        >
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-neutral-60">{activeMeeting ? "연장" : "미팅 시간"}</span>
            <div className="flex flex-wrap gap-1.5">
              {(activeMeeting ? EXTEND_PRESETS : START_PRESETS).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={isSubmitting}
                  className={OPTION_BUTTON_CLASS_NAME}
                  onClick={() =>
                    void runAndClose(() =>
                      onSetMeeting(addMinutesToDate(activeMeeting ? extendBase : new Date(), preset.minutes))
                    )
                  }
                >
                  {preset.label}
                </button>
              ))}
              {(!activeMeeting || activeMeeting.hasEndTime) && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={OPTION_BUTTON_CLASS_NAME}
                  onClick={() => void runAndClose(() => onSetMeeting())}
                >
                  시간 미지정
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-neutral-60">종료 시각 지정</span>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <TimePicker
                  value={timeValue || null}
                  onChange={(next) => setTimeValue(next ?? "")}
                  minuteStep={10}
                  placeholder="종료 시각"
                  className="rounded-[5px] border-[#E5E7EB] dark:border-[#444444] text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10"
                />
              </div>
              <button
                type="button"
                disabled={isSubmitting || !timeValue}
                className={`${OPTION_BUTTON_CLASS_NAME} !h-[34px]`}
                onClick={applyPickedTime}
              >
                적용
              </button>
            </div>
            <span className="text-[11px] leading-[14px] text-neutral-50">
              시간 미지정은 자정에 자동 해제되고, 지정한 시각은 자정을 넘겨도 유지돼요.
            </span>
          </div>

          {activeMeeting && (
            <button
              type="button"
              disabled={isSubmitting}
              className="cursor-pointer h-[30px] rounded-[5px] text-[13px] font-semibold text-danger hover:bg-neutral-10 dark:hover:bg-neutral-30 disabled:opacity-50"
              onClick={() => void runAndClose(onEndMeeting)}
            >
              미팅 종료
            </button>
          )}
        </div>
      )}
    </div>
  );
}
