// Subscription domain types

import type { ApiSuccess } from "./common";

// 구독 플랜
export type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  aiUsageLimit: number;
  smsUsageLimit: number;
  memberCountLimit?: number;
  maxMembers?: number;
  maxCustomers?: number;
  sortOrder: number;
};

// 결제 주기
export type BillingCycle = "monthly" | "quarterly" | "yearly";

// 구독 상태
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending";

// 결제 상태
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// 할인쿠폰
export type DiscountCouponType = "percentage" | "fixed" | "fixed_amount";

export type DiscountCoupon = {
  code: string;
  discountType: DiscountCouponType;
  discountValue: number;
  durationMonths: number;
  remainingCount: number;
};

// 구독 정보
export type Subscription = {
  id: number;
  projectId: number;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  autoRenewal: boolean;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  pendingPlanId?: number | null;
  pendingBillingCycle?: BillingCycle | null;
  cancelledAt: string | null;
  terminatedAt: string | null;
  isActive: boolean;
  discountCoupon?: DiscountCoupon | null;
};

// 결제 정보
export type Payment = {
  id: number;
  subscriptionId: number;
  baseAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  amount: number;
  status: PaymentStatus;
  method: string;
  planName?: string | null;
  paymentType?: "initial" | "recurring" | "change" | string;
  approvedAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

// === API Request Types ===

// POST /v1/subscriptions - 구독 시작
export type CreateSubscriptionInput = {
  projectId?: number;
  planId: number;
  billingCycle: BillingCycle;
  billingInfoId?: number;
  discountCouponCode?: string;
};

// === API Response Types ===

// POST /v1/subscriptions - 구독 시작 응답
export type CreateSubscriptionResponse = {
  result: true;
  data: {
    subscription: Subscription;
    payment: Payment;
  };
};

// GET /v1/subscriptions - 구독 정보 조회 응답
export type SubscriptionDetailResponse = {
  result: true;
  data: Subscription;
};

// GET /v1/subscriptions/payments - 결제 이력 조회 응답
export type PaymentListResponse = {
  result: true;
  data: {
    payments: Payment[];
  };
};

// GET /v1/subscriptions/plans - 구독 플랜 조회 응답
export type SubscriptionPlanListResponse = {
  result: true;
  data: {
    plans: SubscriptionPlan[];
  };
};

// GET /v1/subscriptions/payment/{id}/receipt - 결제 영수증 PDF 생성
export type SubscriptionPaymentReceiptResponse = ApiSuccess<{
  receiptUrl: string;
}>;

// GET /v1/subscriptions/admin/projects - Admin 프로젝트 구독 정보 조회 응답
export type SubscriptionState = "active" | "expired" | "none";

type SubscriptionAdminProjectBase = {
  projectId: number;
  projectName: string;
  projectLogoUrl?: string | null;
  currentMemberCount: number;
  currentAiUsage: number;
  currentSmsUsage: number;
};

export type SubscriptionAdminProjectActive = SubscriptionAdminProjectBase & {
  subscriptionState: "active";
  subscriptionName: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  billingCycle: BillingCycle;
  maxMembers: number;
  maxAiUsage: number;
  maxSmsUsage: number;
};

export type SubscriptionAdminProjectInactive = SubscriptionAdminProjectBase & {
  subscriptionState: "expired" | "none";
};

export type SubscriptionAdminProject =
  | SubscriptionAdminProjectActive
  | SubscriptionAdminProjectInactive;

export type SubscriptionAdminProjectsResponse = ApiSuccess<{
  projects: SubscriptionAdminProject[];
}>;

// POST /v1/subscriptions/plan/change - 플랜 변경
export type SubscriptionPlanChangeInput = {
  newPlanId: number;
  newBillingCycle: BillingCycle;
};

export type SubscriptionPlanChangeResponse = ApiSuccess<{
  subscription: Subscription;
  payment: Payment;
  isUpgrade: boolean;
}>;

// POST /v1/subscriptions/plan/estimate - 플랜 변경 비용 계산
export type SubscriptionPlanEstimateInput = {
  newPlanId: number;
  newBillingCycle: BillingCycle;
};

export type SubscriptionPlanEstimateResponse = ApiSuccess<{
  currentPlanId: number;
  currentBillingCycle: BillingCycle;
  newPlanId: number;
  newBillingCycle: BillingCycle;
  currentPlanPrice: number;
  newPlanPrice: number;
  additionalCost: number;
}>;

// POST /v1/subscriptions/charge - 즉시 결제 응답
export type ChargeResponse = {
  result: true;
  data: Payment;
};

// POST /v1/subscriptions/discount-coupon/info - 할인 쿠폰 정보 조회
export type DiscountCouponInfoInput = {
  code: string;
  planId: number;
  billingCycle: BillingCycle;
};

export type DiscountCouponPricing = {
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
  taxAmount: number;
  finalPrice: number;
};

export type DiscountCouponInfo = {
  code: string;
  name: string;
  description: string;
  discountType: DiscountCouponType;
  discountValue: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  pricing: DiscountCouponPricing;
  canUse: boolean;
  unavailableReason: string | null;
};

export type DiscountCouponInfoResponse = ApiSuccess<DiscountCouponInfo>;

// DELETE /v1/subscriptions, POST /v1/subscriptions/reactivate - 구독 취소/재활성화 응답
export type SubscriptionActionResponse = {
  result: true;
  data: Subscription;
};

// === 쿠폰 (POST /v1/subscriptions/coupon/*) ===

// POST /v1/subscriptions/coupon/apply - 쿠폰 적용 요청
export type CouponApplyInput = {
  code: string;
};

// POST /v1/subscriptions/coupon/apply - 쿠폰 적용 응답
export type CouponApplyResponse = ApiSuccess<{
  subscription: Subscription;
}>;

// POST /v1/subscriptions/coupon/info - 쿠폰 정보 조회 요청
export type CouponInfoInput = {
  code: string;
};

// POST /v1/subscriptions/coupon/info - 쿠폰 정보 조회 응답
export type CouponInfoResponse = ApiSuccess<{
  name: string;
  description: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  durationMonths: number;
  startDate: string;
  endDate: string;
  canUse: boolean;
  unavailableReason: string;
}>;

























