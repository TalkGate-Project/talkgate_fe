import { formatDateTime as formatDateTimeUtil } from "@/utils/datetime";

/**
 * 날짜 시간을 포맷팅합니다.
 * @deprecated 중앙 유틸리티의 formatDateTime을 직접 사용하세요.
 * @param dateStr - ISO 날짜 문자열
 * @returns 포맷된 날짜 시간 문자열 (YYYY-MM-DD HH:mm)
 */
export function formatDateTime(dateStr: string): string {
  return formatDateTimeUtil(dateStr);
}

/**
 * 날짜를 ISO 날짜 문자열로 변환합니다.
 * @param date - Date 객체 또는 null
 * @returns ISO 날짜 문자열 (YYYY-MM-DD) 또는 undefined
 */
export function dateToISOString(date: Date | null): string | undefined {
  return date ? date.toISOString().split("T")[0] : undefined;
}

