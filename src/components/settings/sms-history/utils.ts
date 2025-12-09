import dayjs from "dayjs";

/**
 * 날짜 시간을 포맷팅합니다.
 * @param dateStr - ISO 날짜 문자열
 * @returns 포맷된 날짜 시간 문자열 (YYYY-MM-DD HH:mm)
 */
export function formatDateTime(dateStr: string): string {
  try {
    return dayjs(dateStr).format("YYYY-MM-DD HH:mm");
  } catch {
    return dateStr;
  }
}

/**
 * 날짜를 ISO 날짜 문자열로 변환합니다.
 * @param date - Date 객체 또는 null
 * @returns ISO 날짜 문자열 (YYYY-MM-DD) 또는 undefined
 */
export function dateToISOString(date: Date | null): string | undefined {
  return date ? date.toISOString().split("T")[0] : undefined;
}

