import { format } from "date-fns";
import dayjs from "dayjs";

export function formatTimeFromISO(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "HH:mm");
}

export function formatMonthDay(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return typeof dateInput === "string" ? dateInput : "-";
  return format(date, "MM.dd");
}

/**
 * 날짜를 "YYYY-MM-DD HH:mm" 형식으로 포맷합니다.
 * @param dateInput - 날짜 문자열, Date 객체, 또는 타임스탬프
 * @returns 포맷된 날짜 문자열 (예: "2025-09-15 14:20")
 */
export function formatDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "-";
  
  const date = dayjs(dateInput);
  if (!date.isValid()) return "-";
  
  return date.format("YYYY-MM-DD HH:mm");
}


