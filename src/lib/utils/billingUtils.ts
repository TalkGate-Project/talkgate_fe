// 범용 포맷팅 함수는 중앙 유틸리티에서 import하여 재export
// billing 도메인에서 사용하는 편의 함수들
export { formatDateCompact as formatDate, formatDateCompact as formatDateTime } from "@/utils/datetime";
export { formatAmountKR as formatAmount } from "@/utils/format";

// 결제 상태 한글 변환
export function getPaymentStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "대기",
    completed: "완료",
    failed: "실패",
    refunded: "환불",
  };
  return statusMap[status] || status;
}

// 결제 상태 색상
export function getPaymentStatusColor(status: string): "green" | "yellow" | "red" {
  if (status === "completed") return "green";
  if (status === "pending") return "yellow";
  return "red";
}

// 결제 타입 한글 변환
export function getPaymentTypeLabel(paymentType: string | null | undefined): string {
  if (!paymentType) return "-";
  const typeMap: Record<string, string> = {
    initial: "구독 시작",
    renewal: "구독 갱신",
    upgrade: "구독 변경",
    change: "구독 변경", // change도 upgrade와 동일하게 처리
    recurring: "구독 갱신", // recurring도 renewal과 동일하게 처리
  };
  return typeMap[paymentType] || paymentType;
}

// 카드사 색상 매핑
const CARD_COMPANY_COLORS: Record<string, string> = {
  BC: "#F04452",
  삼성: "#1428A0",
  신한: "#0046FF",
  현대: "#00693E",
  롯데: "#ED1C24",
  하나: "#009490",
  국민: "#FFBC00",
  농협: "#006747",
  우리: "#004B9C",
};

// 카드사 약어 가져오기
export function getCardCompanyAbbr(cardCompany: string): string {
  if (!cardCompany) return "카드";
  if (cardCompany.length <= 2) return cardCompany;
  return cardCompany.replace(/카드$/, "").slice(0, 2);
}

// 카드사 색상 가져오기
export function getCardCompanyColor(cardCompany: string): string {
  const abbr = getCardCompanyAbbr(cardCompany);
  return CARD_COMPANY_COLORS[abbr] || "#808080";
}
