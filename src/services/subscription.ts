import { apiClient } from "@/lib/apiClient";
import type {
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  SubscriptionDetailResponse,
  PaymentListResponse,
  SubscriptionPlanListResponse,
  ChargeResponse,
  SubscriptionActionResponse,
} from "@/types/subscription";

export const SubscriptionService = {
  /**
   * 구독 시작 (Admin만 가능)
   * 빌링키가 등록된 상태에서 구독을 시작합니다. 첫 결제를 즉시 수행합니다.
   */
  create(input: CreateSubscriptionInput, headers?: Record<string, string>) {
    return apiClient.post<CreateSubscriptionResponse>(
      "/v1/subscriptions",
      input,
      headers ? { headers } : undefined
    );
  },

  /**
   * 구독 취소 (자동 갱신 중지, Admin만 가능)
   * 즉시 비활성화되지 않고, 만료일까지 계속 사용 가능합니다. 자동 갱신만 중지됩니다.
   */
  cancel(headers?: Record<string, string>) {
    return apiClient.delete<SubscriptionActionResponse>(
      "/v1/subscriptions",
      headers ? { headers } : undefined
    );
  },

  /**
   * 프로젝트 구독 정보 조회
   */
  get(headers?: Record<string, string>) {
    return apiClient.get<SubscriptionDetailResponse>(
      "/v1/subscriptions",
      headers ? { headers } : undefined
    );
  },

  /**
   * 즉시 결제 (Admin만 가능)
   */
  charge(headers?: Record<string, string>) {
    return apiClient.post<ChargeResponse>(
      "/v1/subscriptions/charge",
      {},
      headers ? { headers } : undefined
    );
  },

  /**
   * 결제 이력 조회
   */
  getPayments(headers?: Record<string, string>) {
    return apiClient.get<PaymentListResponse>(
      "/v1/subscriptions/payments",
      headers ? { headers } : undefined
    );
  },

  /**
   * 모든 구독 플랜 조회
   */
  getPlans() {
    return apiClient.get<SubscriptionPlanListResponse>("/v1/subscriptions/plans");
  },

  /**
   * 구독 재활성화 (자동 갱신 재시작, Admin만 가능)
   * 취소한 구독을 다시 활성화하여 만료일 이후 자동 갱신되도록 합니다.
   */
  reactivate(headers?: Record<string, string>) {
    return apiClient.post<SubscriptionActionResponse>(
      "/v1/subscriptions/reactivate",
      {},
      headers ? { headers } : undefined
    );
  },
};

// Re-export types for convenience
export type {
  SubscriptionPlan,
  BillingCycle,
  SubscriptionStatus,
  PaymentStatus,
  Subscription,
  Payment,
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  SubscriptionDetailResponse,
  PaymentListResponse,
  SubscriptionPlanListResponse,
  ChargeResponse,
  SubscriptionActionResponse,
} from "@/types/subscription";













