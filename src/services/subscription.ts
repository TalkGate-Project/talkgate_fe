import { apiClient } from "@/lib/apiClient";
import type {
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  SubscriptionDetailResponse,
  PaymentListResponse,
  SubscriptionPlanListResponse,
  SubscriptionPaymentReceiptResponse,
  SubscriptionAdminProjectsResponse,
  SubscriptionPlanChangeInput,
  SubscriptionPlanChangeResponse,
  SubscriptionPlanEstimateInput,
  SubscriptionPlanEstimateResponse,
  ChargeResponse,
  SubscriptionActionResponse,
  DiscountCouponInfoInput,
  DiscountCouponInfoResponse,
  CouponApplyInput,
  CouponApplyResponse,
  CouponInfoInput,
  CouponInfoResponse,
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
   * 결제 영수증 PDF 생성
   */
  getPaymentReceipt(paymentId: string | number, headers?: Record<string, string>) {
    return apiClient.get<SubscriptionPaymentReceiptResponse>(
      `/v1/subscriptions/payment/${paymentId}/receipt`,
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
   * Admin 프로젝트 구독 정보 조회
   * 사용자가 Admin인 모든 프로젝트의 구독 정보를 조회합니다.
   */
  getAdminProjects() {
    return apiClient.get<SubscriptionAdminProjectsResponse>(
      "/v1/subscriptions/admin/projects"
    );
  },

  /**
   * 플랜 변경
   */
  changePlan(input: SubscriptionPlanChangeInput, headers?: Record<string, string>) {
    return apiClient.post<SubscriptionPlanChangeResponse>(
      "/v1/subscriptions/plan/change",
      input,
      headers ? { headers } : undefined
    );
  },

  /**
   * 플랜 변경 비용 계산
   */
  estimatePlan(input: SubscriptionPlanEstimateInput, headers?: Record<string, string>) {
    return apiClient.post<SubscriptionPlanEstimateResponse>(
      "/v1/subscriptions/plan/estimate",
      input,
      headers ? { headers } : undefined
    );
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

  /**
   * 할인 쿠폰 정보 조회 (구독 시작 전 미리보기)
   */
  getDiscountCouponInfo(
    input: DiscountCouponInfoInput,
    headers?: Record<string, string>
  ) {
    return apiClient.post<DiscountCouponInfoResponse>(
      "/v1/subscriptions/discount-coupon/info",
      input,
      headers ? { headers } : undefined
    );
  },

  /**
   * 쿠폰 정보 조회 (Admin만 가능)
   * 쿠폰 코드를 입력하여 적용될 플랜 정보와 사용 가능 여부를 미리 확인합니다.
   */
  getCouponInfo(input: CouponInfoInput, headers?: Record<string, string>) {
    return apiClient.post<CouponInfoResponse>(
      "/v1/subscriptions/coupon/info",
      input,
      headers ? { headers } : undefined
    );
  },

  /**
   * 쿠폰 사용하여 무료 구독 활성화 (Admin만 가능)
   * 쿠폰 코드를 사용하여 무료로 구독을 활성화합니다. 동일 프로젝트는 모든 쿠폰 통틀어 1회만 사용 가능합니다.
   */
  applyCoupon(input: CouponApplyInput, headers?: Record<string, string>) {
    return apiClient.post<CouponApplyResponse>(
      "/v1/subscriptions/coupon/apply",
      input,
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
  SubscriptionPaymentReceiptResponse,
  SubscriptionAdminProject,
  SubscriptionAdminProjectActive,
  SubscriptionAdminProjectInactive,
  SubscriptionAdminProjectsResponse,
  SubscriptionState,
  SubscriptionPlanChangeInput,
  SubscriptionPlanChangeResponse,
  SubscriptionPlanEstimateInput,
  SubscriptionPlanEstimateResponse,
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  SubscriptionDetailResponse,
  PaymentListResponse,
  SubscriptionPlanListResponse,
  ChargeResponse,
  SubscriptionActionResponse,
  DiscountCoupon,
  DiscountCouponType,
  DiscountCouponPricing,
  DiscountCouponInfo,
  DiscountCouponInfoInput,
  DiscountCouponInfoResponse,
  CouponApplyInput,
  CouponApplyResponse,
  CouponInfoInput,
  CouponInfoResponse,
} from "@/types/subscription";

























