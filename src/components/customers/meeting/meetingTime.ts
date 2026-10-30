import type { CustomerMeeting } from "@/types/customers";

export function isMeetingActive(meeting: CustomerMeeting | null | undefined, now: Date = new Date()): boolean {
  if (!meeting) return false;
  return new Date(meeting.endsAt).getTime() > now.getTime();
}

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** 배지 툴팁/팝오버에 쓰는 종료시간 문구. 시간 미지정이면 표시하지 않는다. */
export function formatMeetingEndLabel(meeting: CustomerMeeting): string | null {
  if (!meeting.hasEndTime) return null;
  return `${formatClock(new Date(meeting.endsAt))}까지`;
}

export function addMinutesToDate(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

/**
 * "HH:mm"을 다가오는 해당 시각으로 바꾼다. 이미 지난 시각이면 다음 날로 본다
 * (23시에 01:00을 고르면 다음 날 01:00).
 */
export function resolveUpcomingTime(timeValue: string, now: Date = new Date()): Date | null {
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}
