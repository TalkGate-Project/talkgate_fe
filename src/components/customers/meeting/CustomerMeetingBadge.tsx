"use client";

import type { CustomerMeeting } from "@/types/customers";
import { formatMeetingEndLabel } from "./meetingTime";
import { useActiveMeeting } from "./useActiveMeeting";

export const MEETING_BADGE_CLASS_NAME =
  "inline-flex items-center gap-1 h-[22px] px-2 rounded-full bg-warning-10 text-warning-60 dark:bg-[rgb(var(--warning-100-rgb)/0.6)] dark:text-warning-20 text-[12px] font-semibold leading-[14px] whitespace-nowrap shrink-0";

/** 고객목록 이름 옆 미팅중 배지. 미팅중이 아니면 아무것도 그리지 않는다. */
export default function CustomerMeetingBadge({ meeting }: { meeting?: CustomerMeeting | null }) {
  const activeMeeting = useActiveMeeting(meeting);
  if (!activeMeeting) return null;

  const endLabel = formatMeetingEndLabel(activeMeeting);
  return (
    <span
      className={MEETING_BADGE_CLASS_NAME}
      title={endLabel ? `미팅중 · ${endLabel}` : "미팅중"}
      aria-label={endLabel ? `미팅중, ${endLabel}` : "미팅중"}
    >
      <span className="w-[6px] h-[6px] rounded-full bg-current" aria-hidden />
      미팅중
    </span>
  );
}
