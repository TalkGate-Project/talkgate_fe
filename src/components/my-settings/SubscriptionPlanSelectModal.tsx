"use client";

import { useState, useMemo, useEffect } from "react";
import BaseModal from "@/components/common/BaseModal";
import type { BillingCycle, SubscriptionPlan } from "@/types/subscription";

interface SubscriptionPlanSelectModalProps {
  isOpen: boolean;
  plans: SubscriptionPlan[];
  currentPlanId?: number | null;
  currentBillingCycle: BillingCycle;
  projectId: string | number;
  projectName: string;
  isLoading?: boolean;
  onClose: () => void;
  onSelect: (planId: number, billingCycle: BillingCycle) => void;
}

const cycleLabel: Record<BillingCycle, string> = {
  monthly: "월간(1개월)",
  quarterly: "분기(3개월)",
  yearly: "연간",
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

function isBasicPlan(plan: SubscriptionPlan): boolean {
  return /basic/i.test(plan.name);
}

export default function SubscriptionPlanSelectModal({
  isOpen,
  plans,
  currentPlanId,
  currentBillingCycle,
  projectId,
  projectName,
  isLoading = false,
  onClose,
  onSelect,
}: SubscriptionPlanSelectModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>(currentBillingCycle);

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(currentPlanId ?? null);
      setSelectedBillingCycle(currentBillingCycle);
    }
  }, [isOpen, currentPlanId, currentBillingCycle]);

  // 현재 플랜 정보
  const currentPlan = useMemo(() => {
    return plans.find((p) => p.id === currentPlanId);
  }, [plans, currentPlanId]);

  // 선택된 플랜 정보
  const selectedPlan = useMemo(() => {
    return selectedPlanId ? plans.find((p) => p.id === selectedPlanId) : null;
  }, [plans, selectedPlanId]);

  // 변경 가능 여부 및 상태 판단
  const changeStatus = useMemo(() => {
    if (!currentPlan || !selectedPlan) {
      return {
        canChange: false,
        isUpgrade: false,
        statusMessage: "",
        disabledReason: "",
      };
    }

    const isSamePlan = currentPlan.id === selectedPlan.id;
    const isSameCycle = currentBillingCycle === selectedBillingCycle;
    const isUpgrade = isBasicPlan(currentPlan) && isProPlan(selectedPlan);
    const isQuarterlyToMonthly = currentBillingCycle === "quarterly" && selectedBillingCycle === "monthly";
    const isDifferentPlan = !isSamePlan;

    // 동일 플랜 + 동일 주기
    if (isSamePlan && isSameCycle) {
      return {
        canChange: false,
        isUpgrade: false,
        statusMessage: "현재 이용 중인 플랜입니다",
        disabledReason: "",
      };
    }

    // 분기 → 월 (다른 플랜): 불가
    if (isQuarterlyToMonthly && isDifferentPlan) {
      return {
        canChange: false,
        isUpgrade: false,
        statusMessage: "",
        disabledReason: "해당 구독 상품으로는 변경할 수 없어요",
      };
    }

    // 업그레이드 (Basic → Pro)
    if (isUpgrade) {
      return {
        canChange: true,
        isUpgrade: true,
        statusMessage: "",
        disabledReason: "추가 결제가 필요해요.",
      };
    }

    // 동일 플랜 변경 (주기 변경)
    if (isSamePlan && !isSameCycle) {
      return {
        canChange: true,
        isUpgrade: false,
        statusMessage: "",
        disabledReason: "다음 결제 주기부터 적용",
      };
    }

    // 기타 변경 (다운그레이드 등)
    return {
      canChange: true,
      isUpgrade: false,
      statusMessage: "",
      disabledReason: "다음 결제 주기부터 적용",
    };
  }, [currentPlan, selectedPlan, currentBillingCycle, selectedBillingCycle]);

  const handleConfirm = () => {
    if (!selectedPlanId || !changeStatus.canChange) return;
    onSelect(selectedPlanId, selectedBillingCycle);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      containerClassName="w-full max-w-[720px] bg-card dark:bg-neutral-10 rounded-[14px] md:rounded-[14px] flex flex-col max-h-screen md:max-h-[90vh]"
      ariaLabel="플랜 변경"
    >
      <div className="relative flex flex-col h-full md:h-auto overflow-hidden">
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 md:top-6 md:right-6 w-6 h-6 flex items-center justify-center z-10"
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

        <div className="px-4 py-4 md:px-7 md:py-6 overflow-y-auto flex-1">
          {/* 헤더 */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-2">
              플랜 변경
            </h2>
            <p className="text-[13px] text-neutral-60 dark:text-neutral-70">
              변경할 플랜과 결제 주기를 선택하세요.
            </p>
          </div>

          {/* 결제 주기 선택 */}
          <div className="mb-4 md:mb-6">
            <div className="text-[14px] font-medium text-foreground mb-3">결제 주기</div>
            <div className="flex gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setSelectedBillingCycle("monthly")}
                className={`cursor-pointer flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-[8px] text-[13px] md:text-[14px] font-medium transition-colors ${
                  selectedBillingCycle === "monthly"
                    ? "bg-neutral-90 text-white dark:bg-neutral-80 dark:text-neutral-0"
                    : "bg-neutral-20 text-neutral-70 dark:text-neutral-80 hover:bg-neutral-30"
                }`}
              >
                월간(1개월)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingCycle("quarterly")}
                className={`cursor-pointer flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-[8px] text-[13px] md:text-[14px] font-medium transition-colors ${
                  selectedBillingCycle === "quarterly"
                    ? "bg-neutral-90 text-white dark:bg-neutral-80 dark:text-neutral-0"
                    : "bg-neutral-20 text-neutral-70 dark:text-neutral-80 hover:bg-neutral-30"
                }`}
              >
                분기(3개월)
              </button>
            </div>
          </div>

          {/* 플랜 선택 */}
          <div className="mb-4 md:mb-6">
            <div className="text-[14px] font-medium text-foreground mb-3">플랜 선택</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = currentPlanId === plan.id;
                const price = getPlanPrice(plan, selectedBillingCycle);
                const isPro = isProPlan(plan);

                return (
                  <button
                    key={plan.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`group cursor-pointer text-left border-2 rounded-[12px] px-4 py-3 md:px-5 md:py-4 transition-all ${
                      isSelected
                        ? isPro
                          ? "border-[#00A052] bg-[#F0F9F5] dark:bg-[#0A3D26] outline outline-2 outline-offset-2 outline-[#00A052]"
                          : "border-neutral-90 dark:border-neutral-80 bg-neutral-10 dark:bg-neutral-20 outline outline-2 outline-offset-2 outline-neutral-90 dark:outline-neutral-80"
                        : isCurrent
                        ? "border-neutral-30 dark:border-neutral-40 bg-neutral-10 dark:bg-neutral-20 text-neutral-60 dark:text-neutral-70"
                        : isPro
                        ? "border-neutral-20 dark:border-neutral-30 bg-white dark:bg-neutral-20 hover:border-[#00A052] hover:shadow-[0_4px_12px_rgba(0,160,82,0.15)]"
                        : "border-neutral-20 dark:border-neutral-30 bg-white dark:bg-neutral-20 hover:border-neutral-40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-[15px] md:text-[16px] font-semibold text-foreground">
                        {plan.name}
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        {isPro ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#E7F7EF] dark:bg-[#0A3D26] text-[#00A052] dark:text-[#00E272] font-medium">
                            Pro
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-20 text-neutral-70 dark:text-neutral-80 font-medium">
                            Basic
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-20 text-neutral-70 dark:text-neutral-80">
                            현재
                          </span>
                        )}
                      </div>
                    </div>
                    {plan.description && (
                      <div className="text-[12px] text-neutral-60 dark:text-neutral-70 mb-2 md:mb-3">
                        {plan.description}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="text-[18px] md:text-[20px] font-bold text-foreground">
                        ₩ {formatAmount(price)}
                      </div>
                      <div className="text-[11px] text-neutral-60 dark:text-neutral-70 pb-[2px]">
                        / {cycleLabel[selectedBillingCycle]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 상태 안내 - 모든 메시지를 동일한 위치와 UI로 표시 */}
          {selectedPlan && (changeStatus.statusMessage || changeStatus.disabledReason) && (
            <div className="mb-3 md:mb-4 p-2.5 md:p-3 bg-neutral-10 dark:bg-neutral-20 border border-neutral-20 dark:border-neutral-30 rounded-[8px]">
              <p className="text-[12px] text-neutral-70 dark:text-neutral-60">
                {changeStatus.statusMessage || changeStatus.disabledReason}
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 md:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer flex-1 px-3 md:px-4 py-2 md:py-2.5 border border-neutral-30 rounded-[8px] text-[13px] md:text-[14px] font-medium text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!changeStatus.canChange || isLoading || !selectedPlanId}
              className="cursor-pointer flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-neutral-90 text-white dark:text-neutral-0 rounded-[8px] text-[13px] md:text-[14px] font-medium hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              변경하기
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
