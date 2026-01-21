import type { Subscription } from "@/hooks/useSubscription";
import type { BillingInfo } from "@/hooks/useBilling";
import { formatDateCompact } from "@/utils/datetime";
import { formatAmountKR } from "@/utils/format";
import PaymentMethodDisplay from "./PaymentMethodDisplay";

interface PaymentInfoSectionProps {
  subscription: Subscription | null;
  activeBillingInfo: BillingInfo | null;
  subscriptionLoading: boolean;
  billingLoading: boolean;
}

export default function PaymentInfoSection({
  subscription,
  activeBillingInfo,
  subscriptionLoading,
  billingLoading,
}: PaymentInfoSectionProps) {
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
            {subscriptionLoading ? (
              <div className="h-5 w-32 bg-neutral-20 rounded animate-pulse" />
            ) : (
              <span className="text-[12px] md:text-[14px] text-foreground">
                {subscription?.autoRenewal === false ? (
                  "-"
                ) : subscription?.plan ? (
                  <>
                      <span className="font-bold">
                        {formatAmountKR(
                          Math.floor(
                            (subscription.billingCycle === "monthly"
                              ? subscription.plan.monthlyPrice
                              : subscription.billingCycle === "quarterly"
                              ? (subscription.plan.quarterlyPrice ?? 0)
                              : (subscription.plan.yearlyPrice ?? 0)) * 1.1
                          )
                        )}
                      </span>
                    <span className="text-neutral-60 ml-1">
                      (부가세 포함)
                    </span>
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
