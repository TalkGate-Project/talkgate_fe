import type { CustomerGender } from "@/types/debtRelief";
import type { FeePlanSummary } from "@/types/analysisFeePlan";

// 총 채무 (만원) → "3.1억원" / "5,000만원"
export function formatDebtManwon(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    const text = Number.isInteger(eok) ? String(eok) : eok.toFixed(1);
    return `${text}억원`;
  }
  return `${manwon.toLocaleString("ko-KR")}만원`;
}

// 테이블 강조 표기용: "51억원" → { amount: "51억", unit: "원" }
export function formatDebtManwonParts(manwon: number): { amount: string; unit: string } {
  const full = formatDebtManwon(manwon);
  if (full.endsWith("원")) {
    return { amount: full.slice(0, -1), unit: "원" };
  }
  return { amount: full, unit: "" };
}

// 월 가용 소득 (만원, 음수 가능) → "+45만원" / "-20만원"
export function formatAvailableIncome(manwon: number): string {
  const sign = manwon >= 0 ? "+" : "";
  return `${sign}${manwon.toLocaleString("ko-KR")}만원`;
}

// "YYYY-MM-DD" → "MM/DD"
export function formatConsultedDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[1]}/${parts[2]}`;
}

// API가 내려주는 UTC ISO 문자열(예: "2026-08-21T03:08:00.000Z")을 로컬(브라우저) 타임존
// 기준으로 "YYYY.MM.DD HH:mm"로 표시한다. 예전엔 문자열을 그대로 잘라 썼는데, 그러면 UTC
// 시각이 그대로 노출돼 KST(UTC+9)보다 9시간 늦게 보였다(예: 실제 12:08 KST가 03:08로 표시).
export function formatDateTimeDisplay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 만원 → "3억 1천만원" 형태가 아닌 콤마 표기 "31,000만원"
// 담보 채무 분석 등 일부 인쇄용 항목은 API가 null을 내려줄 수 있어(타입 선언은 number지만 실제로는
// nullable) 방어적으로 처리 — formatWon과 동일하게 "-"로 표기한다.
export function formatManwonComma(manwon: number | null | undefined): string {
  if (manwon == null) return "-";
  return `${manwon.toLocaleString("ko-KR")}만원`;
}

// 고객 부가정보 → "42세 · 남" / "40대 · 남 · 자영업" (있는 필드만 표시)
export function formatCustomerMeta(
  age?: number,
  gender?: CustomerGender,
  occupation?: string,
  ageGroupLabel?: string
): string {
  const parts: string[] = [];
  if (typeof age === "number") parts.push(`${age}세`);
  else if (ageGroupLabel) parts.push(ageGroupLabel);
  if (gender) parts.push(gender === "male" ? "남" : "여");
  if (occupation) parts.push(occupation);
  return parts.join(" · ");
}

// 결제 정보 요약 → "분할납부 3/12회 · 1,200만원" / "일괄납부 1/1회 · 500만원"
export function formatFeePlanSummary(summary: FeePlanSummary): string {
  const paymentTypeLabel = summary.paymentType === "lump_sum" ? "일괄납부" : "분할납부";
  return `${paymentTypeLabel} ${summary.paidInstallmentCount}/${summary.installmentCount}회 · ${summary.totalAmount.toLocaleString("ko-KR")}만원`;
}
