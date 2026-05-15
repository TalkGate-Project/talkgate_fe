"use client";

import { useQuery } from "@tanstack/react-query";
import { SubscriptionService } from "@/services/subscription";
import type { Subscription, Payment, SubscriptionPlan } from "@/types/subscription";
import { getSelectedProjectId } from "@/lib/project";
import { useDemoMode } from "@/contexts/DemoModeContext";
import {
  MOCK_SUBSCRIPTION,
  MOCK_PAYMENTS,
  MOCK_SUBSCRIPTION_PLANS,
  MOCK_DISCOUNT_COUPON_INFO,
} from "@/mocks/billingMockData";
import type { DiscountCouponInfo } from "@/types/subscription";

/**
 * 프로젝트 구독 정보 조회 hook
 */
export function useSubscription() {
  const projectId = getSelectedProjectId();
  const { isDemoMode } = useDemoMode();

  const query = useQuery({
    queryKey: ["subscription", "detail", projectId, isDemoMode],
    queryFn: async () => {
      // 더미 모드일 때 목 데이터 반환
      if (isDemoMode) {
        return MOCK_SUBSCRIPTION;
      }
      if (!projectId) return null;
      const headers = { "x-project-id": projectId };
      const res = await SubscriptionService.get(headers);
      return res.data.data;
    },
    enabled: isDemoMode || !!projectId,
  });

  return {
    subscription: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}

/**
 * 결제 이력 조회 hook
 */
export function usePaymentHistory() {
  const projectId = getSelectedProjectId();
  const { isDemoMode } = useDemoMode();

  const query = useQuery({
    queryKey: ["subscription", "payments", projectId, isDemoMode],
    queryFn: async () => {
      // 더미 모드일 때 목 데이터 반환
      if (isDemoMode) {
        return MOCK_PAYMENTS;
      }
      if (!projectId) return [];
      const headers = { "x-project-id": projectId };
      const res = await SubscriptionService.getPayments(headers);
      return res.data.data.payments;
    },
    enabled: isDemoMode || !!projectId,
  });

  return {
    payments: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}

/**
 * 구독 플랜 목록 조회 hook
 */
export function useSubscriptionPlans() {
  const { isDemoMode } = useDemoMode();

  const query = useQuery({
    queryKey: ["subscription", "plans", isDemoMode],
    queryFn: async () => {
      // 더미 모드일 때 목 데이터 반환
      if (isDemoMode) {
        return MOCK_SUBSCRIPTION_PLANS;
      }
      const res = await SubscriptionService.getPlans();
      return res.data.data.plans;
    },
  });

  return {
    plans: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}

/**
 * 활성 구독의 할인쿠폰 가격 정보 조회 hook
 */
export function useSubscriptionDiscountCouponInfo(subscription: Subscription | null) {
  const projectId = getSelectedProjectId();
  const { isDemoMode } = useDemoMode();
  const discountCoupon = subscription?.discountCoupon;

  const query = useQuery<DiscountCouponInfo | null>({
    queryKey: [
      "subscription",
      "discount-coupon-info",
      projectId,
      discountCoupon?.code,
      subscription?.plan?.id,
      subscription?.billingCycle,
      isDemoMode,
    ],
    queryFn: async () => {
      if (!subscription?.plan?.id || !discountCoupon?.code) return null;

      if (isDemoMode) {
        return MOCK_DISCOUNT_COUPON_INFO;
      }

      try {
        const res = await SubscriptionService.getDiscountCouponInfo(
          {
            code: discountCoupon.code,
            planId: subscription.plan.id,
            billingCycle: subscription.billingCycle,
          },
          projectId ? { "x-project-id": projectId } : undefined
        );
        return res.data.data;
      } catch (error) {
        console.error("Failed to fetch discount coupon info:", error);
        return null;
      }
    },
    enabled:
      Boolean(subscription?.plan?.id) &&
      Boolean(discountCoupon?.code) &&
      (isDemoMode || Boolean(projectId)),
  });

  return {
    discountCouponInfo: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}

export type { Subscription, Payment, SubscriptionPlan };
