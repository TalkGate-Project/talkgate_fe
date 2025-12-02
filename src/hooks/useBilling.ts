"use client";

import { useQuery } from "@tanstack/react-query";
import { BillingService, type BillingInfo } from "@/services/billing";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { MOCK_BILLING_INFOS } from "@/mocks/billingMockData";

export function useBilling() {
  const { isDemoMode } = useDemoMode();

  const query = useQuery({
    queryKey: ["billing", "list", isDemoMode],
    queryFn: async () => {
      // 더미 모드일 때 목 데이터 반환
      if (isDemoMode) {
        return MOCK_BILLING_INFOS;
      }
      const res = await BillingService.list();
      return res.data.data.billingInfos;
    },
  });

  // 활성화된 결제 수단 찾기
  const activeBillingInfo = query.data?.find((info) => info.isActive) ?? null;

  return {
    billingInfos: query.data ?? [],
    activeBillingInfo,
    loading: query.isLoading,
    error: (query.error as unknown) ?? null,
    refetch: query.refetch,
  } as const;
}

export type { BillingInfo };
