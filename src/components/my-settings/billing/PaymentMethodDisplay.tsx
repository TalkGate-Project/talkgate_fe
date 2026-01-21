import type { BillingInfo } from "@/hooks/useBilling";

// 카드 브랜드 SVG 컴포넌트
function CardBrandIcon({ cardType }: { cardType: string | null | undefined }) {
  // cardType이 없으면 뱃지 표시 안 함
  if (!cardType) {
    return null;
  }
  
  const normalizedType = cardType.toLowerCase();
  
  // VISA
  if (normalizedType === "visa") {
    return (
      <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="flex-shrink-0">
        <rect width="24" height="16" rx="1" fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
        <rect x="1" y="5" width="22" height="6" fill="#171E6C"/>
      </svg>
    );
  }
  
  // Mastercard
  if (normalizedType === "mastercard" || normalizedType === "master") {
    return (
      <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="flex-shrink-0">
        <rect width="24" height="16" rx="1" fill="#252525"/>
        <circle cx="9" cy="8" r="3" fill="#EB001B"/>
        <circle cx="15" cy="8" r="3" fill="#F79E1B"/>
        <path d="M10 8C10 6.895 10.895 6 12 6C13.105 6 14 6.895 14 8C14 9.105 13.105 10 12 10C10.895 10 10 9.105 10 8Z" fill="#FF5F00"/>
      </svg>
    );
  }
  
  // 알 수 없는 cardType은 표시 안 함
  return null;
}

// 결제 수단 표시 컴포넌트
export default function PaymentMethodDisplay({ billingInfo }: { billingInfo: BillingInfo }) {
  // 카드 번호 마스킹 처리
  // lastFourDigits가 있으면 앞 4자리 + **** **** + 뒤 4자리 형식으로 표시
  // lastFourDigits만 있으면 카드사명과 함께 표시
  const maskedCardNumber = billingInfo.lastFourDigits
    ? `**** **** **** ${billingInfo.lastFourDigits}`
    : "**** **** **** ****";

  return (
    <div className="flex items-center gap-2">
      <CardBrandIcon cardType={billingInfo.cardType} />
      <span className="text-[12px] md:text-[14px] text-foreground">
        카드 결제 ({billingInfo.cardCompany} {maskedCardNumber})
      </span>
    </div>
  );
}
