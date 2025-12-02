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
} from "@/mocks/billingMockData";

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

export type { Subscription, Payment, SubscriptionPlan };
