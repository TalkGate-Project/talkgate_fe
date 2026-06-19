import type { Subscription } from "@/hooks/useSubscription";
import type { BillingInfo } from "@/hooks/useBilling";
import type { DiscountCoupon, DiscountCouponInfo } from "@/types/subscription";
import { formatDateCompact } from "@/utils/datetime";
import { formatAmountKR } from "@/utils/format";
import PaymentMethodDisplay from "./PaymentMethodDisplay";

interface PaymentInfoSectionProps {
  subscription: Subscription | null;
  activeBillingInfo: BillingInfo | null;
  discountCouponInfo: DiscountCouponInfo | null;
  subscriptionLoading: boolean;
  billingLoading: boolean;
  discountCouponLoading: boolean;
}

function getPlanPrice(subscription: Subscription): number {
  if (subscription.billingCycle === "quarterly") {
    return subscription.plan.quarterlyPrice ?? 0;
  }
  if (subscription.billingCycle === "yearly") {
    return subscription.plan.yearlyPrice ?? 0;
  }
  return subscription.plan.monthlyPrice;
}

function calculateDiscountedPrice(
  basePrice: number,
  discountCoupon?: DiscountCoupon | null
) {
  const discountValue = discountCoupon?.discountValue ?? 0;
  const discountAmount =
    discountCoupon?.discountType === "percentage"
      ? Math.floor(basePrice * (discountValue / 100))
      : Math.min(basePrice, discountValue);
  const discountedPrice = Math.max(0, basePrice - discountAmount);

  return {
    originalPrice: Math.floor(basePrice * 1.1),
    discountAmount,
    finalPrice: Math.floor(discountedPrice * 1.1),
  };
}

function getPaymentAmountDisplay(
  subscription: Subscription,
  discountCouponInfo: DiscountCouponInfo | null
) {
  const basePrice = getPlanPrice(subscription);
  const fallbackPricing = calculateDiscountedPrice(
    basePrice,
    subscription.discountCoupon
  );

  if (discountCouponInfo?.pricing) {
    return {
      originalPrice: discountCouponInfo.pricing.originalPrice,
      discountAmount: discountCouponInfo.pricing.discountAmount,
      finalPrice: discountCouponInfo.pricing.finalPrice,
    };
  }

  if (subscription.discountCoupon) {
    return fallbackPricing;
  }

  return {
    originalPrice: Math.floor(basePrice * 1.1),
    discountAmount: 0,
    finalPrice: Math.floor(basePrice * 1.1),
  };
}

function DiscountInfoTooltip({
  subscription,
  discountCouponInfo,
  originalPrice,
  discountAmount,
}: {
  subscription: Subscription;
  discountCouponInfo: DiscountCouponInfo | null;
  originalPrice: number;
  discountAmount: number;
}) {
  const discountCoupon = subscription.discountCoupon;
  if (!discountCoupon) return null;

  const showDiscountRate = discountCoupon.discountType === "percentage";
  const durationMonths =
    discountCouponInfo?.durationMonths ?? discountCoupon.durationMonths;
  const remainingCount = discountCoupon.remainingCount;

  return (
    <span className="relative inline-flex items-center group">
      <button
        type="button"
        className="cursor-pointer text-[#3F7FFF] hover:underline focus:outline-none focus:underline"
        aria-describedby="discount-info-tooltip"
      >
        할인정보
      </button>
      <span
        id="discount-info-tooltip"
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-[220px] -translate-x-1/2 rounded-[8px] border border-neutral-20 bg-card px-4 py-3 text-[12px] text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] group-hover:block group-focus-within:block dark:border-neutral-30 dark:bg-neutral-10"
      >
        <span className="flex justify-between gap-4">
          <span className="text-neutral-60">할인 전 금액</span>
          <span className="font-semibold">{formatAmountKR(originalPrice)}</span>
        </span>
        {showDiscountRate && (
          <span className="mt-2 flex justify-between gap-4">
            <span className="text-neutral-60">할인율</span>
            <span className="font-semibold">{discountCoupon.discountValue}%</span>
          </span>
        )}
        <span className="mt-2 flex justify-between gap-4">
          <span className="text-neutral-60">할인금액</span>
          <span className="font-semibold text-[#3F7FFF]">
            {formatAmountKR(discountAmount)}
          </span>
        </span>
        <span className="mt-2 flex justify-between gap-4">
          <span className="text-neutral-60">할인 적용 기간</span>
          <span className="font-semibold text-[#3F7FFF]">
            {remainingCount > 0
              ? `${remainingCount}개월 남음`
              : `${durationMonths}개월`}
          </span>
        </span>
      </span>
    </span>
  );
}

export default function PaymentInfoSection({
  subscription,
  activeBillingInfo,
  discountCouponInfo,
  subscriptionLoading,
  billingLoading,
  discountCouponLoading,
}: PaymentInfoSectionProps) {
  const paymentAmountDisplay =
    subscription?.plan && subscription.autoRenewal !== false
      ? getPaymentAmountDisplay(subscription, discountCouponInfo)
      : null;

  return (
    <div className="bg-card rounded-[14px] p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-[16px] md:text-[18px] font-bold text-foreground">결제정보</h2>
        <p className="text-[12px] md:text-[14px] text-neutral-60 mt-1">
          결제 상태 및 처리 내역을 관리합니다.
        </p>
      </div>

      {/* 구분선 */}
      <div className="w-full h-[1px] bg-border opacity-70 mb-4 md:mb-6"></div>

      <div className="space-y-3 md:space-y-4">
        {/* 구독 */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
          <span className="w-[100px] md:w-[120px] text-[12px] md:text-[14px] text-neutral-60 flex-shrink-0">구독</span>
          {subscriptionLoading ? (
            <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
          ) : subscription ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] md:text-[14px] text-foreground">
                프로젝트 구독
              </span>
              <span className="px-2 py-0.5 bg-neutral-20 text-neutral-70 text-[11px] md:text-[12px] font-medium rounded">
                {subscription.plan?.name || "-"}
              </span>
            </div>
          ) : (
            <span className="text-[12px] md:text-[14px] text-neutral-60">
              구독 정보 없음
            </span>
          )}
        </div>

        {/* 결제 수단 */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
          <span className="w-[100px] md:w-[120px] text-[12px] md:text-[14px] text-neutral-60 flex-shrink-0">
            결제 수단
          </span>
          <div className="flex items-center gap-3">
            {billingLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 bg-neutral-20 rounded-sm animate-pulse" />
                <div className="w-40 h-4 bg-neutral-20 rounded animate-pulse" />
              </div>
            ) : activeBillingInfo ? (
              <PaymentMethodDisplay billingInfo={activeBillingInfo} />
            ) : (
              <span className="text-[12px] md:text-[14px] text-neutral-60">
                등록된 결제 수단이 없습니다
              </span>
            )}
          </div>
        </div>

        {/* 이용시작 일시 */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
          <span className="w-[100px] md:w-[120px] text-[12px] md:text-[14px] text-neutral-60 flex-shrink-0">
            이용시작 일시
          </span>
          {subscriptionLoading ? (
            <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : (
              <span className="text-[12px] md:text-[14px] text-foreground">
                {subscription ? formatDateCompact(subscription.startDate) : "-"}
              </span>
            )}
        </div>

        {/* 다음 결제 예정일 */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
          <span className="w-[100px] md:w-[120px] text-[12px] md:text-[14px] text-neutral-60 flex-shrink-0">
            다음 결제 예정일
          </span>
          {subscriptionLoading ? (
            <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
          ) : (
              <span className="text-[12px] md:text-[14px] text-foreground">
                {subscription?.autoRenewal === false
                  ? "-"
                  : subscription?.nextBillingDate
                  ? formatDateCompact(subscription.nextBillingDate)
                  : subscription?.endDate
                  ? formatDateCompact(subscription.endDate)
                  : "-"}
              </span>
          )}
        </div>

        {/* 결제 예정 금액 */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
          <span className="w-[100px] md:w-[120px] text-[12px] md:text-[14px] text-neutral-60 flex-shrink-0">
            결제 예정 금액
          </span>
          <div className="flex items-center gap-3">
            {subscriptionLoading || discountCouponLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : (
              <span className="text-[12px] md:text-[14px] text-foreground">
                {subscription?.autoRenewal === false ? (
                  "-"
                ) : subscription?.plan ? (
                  <>
                    <span className="font-bold">
                      {formatAmountKR(paymentAmountDisplay?.finalPrice ?? 0)}
                    </span>
                    <span className="text-neutral-60 ml-1">
                      (부가세 포함)
                    </span>
                    {subscription.discountCoupon && paymentAmountDisplay && (
                      <span className="ml-2">
                        <DiscountInfoTooltip
                          subscription={subscription}
                          discountCouponInfo={discountCouponInfo}
                          originalPrice={paymentAmountDisplay.originalPrice}
                          discountAmount={paymentAmountDisplay.discountAmount}
                        />
                      </span>
                    )}
                  </>
                ) : (
                  "-"
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
