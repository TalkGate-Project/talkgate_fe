"use client";

import BaseModal from "@/components/common/BaseModal";
import type { BillingCycle, SubscriptionPlan } from "@/types/subscription";

interface SubscriptionPlanSelectModalProps {
  isOpen: boolean;
  plans: SubscriptionPlan[];
  currentPlanId?: number | null;
  billingCycle: BillingCycle;
  isLoading?: boolean;
  onClose: () => void;
  onSelect: (plan: SubscriptionPlan) => void;
}

const cycleLabel: Record<BillingCycle, string> = {
  monthly: "월마다",
  quarterly: "분기마다",
  yearly: "연마다",
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

function getPlanPrice(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
  if (billingCycle === "quarterly") return plan.quarterlyPrice ?? 0;
  if (billingCycle === "yearly") return plan.yearlyPrice ?? 0;
  return plan.monthlyPrice;
}

function isProPlan(plan: SubscriptionPlan): boolean {
  return /pro/i.test(plan.name);
}

export default function SubscriptionPlanSelectModal({
  isOpen,
  plans,
  currentPlanId,
  billingCycle,
  isLoading = false,
  onClose,
  onSelect,
}: SubscriptionPlanSelectModalProps) {
  if (!isOpen) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="w-full max-w-[720px] bg-card dark:bg-neutral-10 rounded-[14px]"
      ariaLabel="플랜 변경"
    >
      <div className="relative">
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-6 right-6 w-6 h-6 flex items-center justify-center"
          aria-label="close plan modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              className="text-neutral-50 dark:text-neutral-50"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="px-7 py-6">
          <div className="text-[18px] font-semibold text-foreground mb-2">
            플랜 변경
          </div>
          <div className="text-[13px] text-neutral-60 mb-6">
            현재 결제 주기 기준으로 요금을 표시합니다. ({cycleLabel[billingCycle]})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const price = getPlanPrice(plan, billingCycle);
              const isPro = isProPlan(plan);
              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={isLoading || isCurrent}
                  onClick={() => onSelect(plan)}
                  className={`group cursor-pointer text-left border rounded-[18px] px-6 py-5 transition-all ${
                    isCurrent
                      ? "border-neutral-30 bg-neutral-10 text-neutral-60 cursor-not-allowed"
                      : isPro
                      ? "border-[#00A052] bg-white hover:shadow-[0_14px_36px_rgba(0,160,82,0.22)]"
                      : "border-neutral-20 bg-white hover:border-neutral-40 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="text-[18px] font-semibold text-foreground">
                      {plan.name}
                    </div>
                    <div className="flex items-center gap-2">
                      {isPro ? (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-[#E7F7EF] text-[#00A052] font-medium">
                          Pro
                        </span>
                      ) : null}
                      {isCurrent ? (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-20 text-neutral-70">
                          현재 플랜
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {plan.description ? (
                    <div className="text-[12px] text-neutral-60 mb-4">
                      {plan.description}
                    </div>
                  ) : null}
                  <div className="flex items-end gap-2 mb-4">
                    <div className="text-[22px] font-bold text-foreground">
                      ₩ {formatAmount(price)}
                    </div>
                    <div className="text-[12px] text-neutral-60 pb-[2px]">
                      / {cycleLabel[billingCycle]}
                    </div>
                  </div>
                  <div className="text-[12px] text-neutral-60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>멤버 수</span>
                      <span className="text-foreground font-medium">
                        최대 {formatAmount(plan.maxMembers ?? 0)}명
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI 상담 도우미</span>
                      <span className="text-foreground font-medium">
                        월 {formatAmount(plan.aiUsageLimit)}회
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>문자 전송 횟수</span>
                      <span className="text-foreground font-medium">
                        월 {formatAmount(plan.smsUsageLimit)}회
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
