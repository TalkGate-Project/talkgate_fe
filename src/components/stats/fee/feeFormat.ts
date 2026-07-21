import type { FeeInstallmentStatus } from "@/types/analysisFeeStatistics";

/** API amount(원) → 만원 정수 (소수점 버림) */
export function wonToManwon(amountWon: number): number {
  const value = Number.isFinite(amountWon) ? amountWon : 0;
  return Math.floor(value / 10000);
}

/** API 원(KRW) → 만원 숫자 문자열 (예: 1_562_000 → "156") */
export function formatWonAsManwonNumber(amountWon: number): string {
  return wonToManwon(amountWon).toLocaleString("ko-KR");
}

/** API 원(KRW) → "156 만원" 형태 */
export function formatWonAsManwon(amountWon: number): string {
  return `${formatWonAsManwonNumber(amountWon)} 만원`;
}

/** 테이블용 짧은 금액 (예: 125만원) */
export function formatWonAsManwonCompact(amountWon: number): string {
  return `${formatWonAsManwonNumber(amountWon)}만원`;
}

/** scheduledDate 등 → YYYY.MM.DD */
export function formatFeeDateDot(input: string | null | undefined): string {
  if (!input) return "-";
  const raw = input.slice(0, 10);
  const parts = raw.split("-");
  if (parts.length !== 3) return input;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

export type FeeStatusPill = {
  label: string;
  className: string;
};

export function getFeeStatusPill(status: FeeInstallmentStatus | string): FeeStatusPill {
  switch (status) {
    case "paid":
      return {
        label: "납부",
        className: "bg-[#E8F8EF] text-[#1B9E4B] dark:bg-emerald-950 dark:text-emerald-300",
      };
    case "unpaid":
      return {
        label: "미납",
        className: "bg-[#FDECEC] text-[#E5484D] dark:bg-red-950 dark:text-red-300",
      };
    case "scheduled":
      return {
        label: "예정",
        className: "bg-[#EAF2FF] text-[#3B82F6] dark:bg-blue-950 dark:text-blue-300",
      };
    case "refunded":
      return {
        label: "환불",
        className: "bg-neutral-20 text-neutral-60 dark:bg-neutral-30 dark:text-neutral-70",
      };
    case "waived":
      return {
        label: "면제",
        className: "bg-neutral-20 text-neutral-60 dark:bg-neutral-30 dark:text-neutral-70",
      };
    default:
      return {
        label: "기타",
        className: "bg-neutral-20 text-neutral-60",
      };
  }
}

export function toApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 선택 월의 1일~말일 (YYYY-MM-DD) */
export function getMonthDateRange(month: Date): { startDate: string; endDate: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { startDate: toApiDate(start), endDate: toApiDate(end) };
}
