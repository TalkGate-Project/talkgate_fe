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

/**
 * 날짜를 한국어 형식 "YYYY. MM. DD." 형식으로 포맷합니다.
 * @param dateString - 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: "2025. 09. 15.")
 */
export function formatDateKR(dateString?: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ". ");
}

/**
 * 날짜와 시간을 한국어 형식 "YYYY. MM. DD. HH:mm:ss" 형식으로 포맷합니다.
 * @param dateString - 날짜 문자열
 * @returns 포맷된 날짜+시간 문자열 (예: "2025. 09. 15. 14:20:30")
 */
export function formatDateTimeKR(dateString?: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date
    .toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\. /g, ". ");
}

/**
 * 날짜를 "YYYY.MM.DD" 형식으로 포맷합니다 (공백 없음, 마지막 점 제거).
 * billing 등에서 사용하는 간결한 형식입니다.
 * @param dateString - 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: "2025.01.15")
 */
export function formatDateCompact(dateString?: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

/**
 * 날짜와 시간을 "YYYY.MM.DD HH:mm" 형식으로 포맷합니다 (공백 없음).
 * @param dateString - 날짜 문자열
 * @returns 포맷된 날짜+시간 문자열 (예: "2025.01.15 14:20")
 */
export function formatDateTimeCompact(dateString?: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

/**
 * 날짜와 시간을 "YYYY. MM. DD HH:mm" 형식으로 포맷합니다 (공백 있음).
 * @param dateString - 날짜 문자열
 * @returns 포맷된 날짜+시간 문자열 (예: "2025. 01. 15 14:20")
 */
export function formatDateTimeWithSpaces(dateString?: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date
    .toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\./g, ".")
    .replace(/, /g, " ");
}

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 "YYYY. MM. DD" 형식으로 변환합니다.
 * 필터 칩 등에서 사용하는 형식입니다.
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: "2025. 01. 15")
 */
export function formatDateForChip(dateStr: string): string {
  if (!dateStr) return "";
  // YYYY-MM-DD 형식을 YYYY. MM. DD로 변환
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}. ${parts[1]}. ${parts[2]}`;
}

/** YYYY-MM-DD 형식으로 반환 (필터/API용) */
function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 신청시간 퀵 필터: 당일 (오늘 날짜 from = to)
 * @returns { from: string; to: string } YYYY-MM-DD
 */
export function getApplicationDateRangeToday(): { from: string; to: string } {
  const today = new Date();
  const s = toYYYYMMDD(today);
  return { from: s, to: s };
}

/**
 * 신청시간 퀵 필터: 당월 (이번 달 1일 ~ 말일)
 * @returns { from: string; to: string } YYYY-MM-DD
 */
export function getApplicationDateRangeThisMonth(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toYYYYMMDD(from), to: toYYYYMMDD(to) };
}

/**
 * 신청시간 퀵 필터: 전월 (저번 달 1일 ~ 말일)
 * @returns { from: string; to: string } YYYY-MM-DD
 */
export function getApplicationDateRangeLastMonth(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toYYYYMMDD(from), to: toYYYYMMDD(to) };
}

