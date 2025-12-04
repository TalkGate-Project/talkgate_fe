import type { BillingInfo } from "@/types/billing";
import type { Subscription, Payment, SubscriptionPlan } from "@/types/subscription";

// 결제 수단 더미 데이터
export const MOCK_BILLING_INFOS: BillingInfo[] = [
  {
    id: 1,
    userId: 1,
    lastFourDigits: "1234",
    cardCompany: "BC카드",
    cardType: "신용",
    ownerType: "개인",
    authenticatedAt: "2025-10-01T10:00:00Z",
    isActive: true,
    createdAt: "2025-10-01T10:00:00Z",
  },
];

// 구독 플랜 더미 데이터
export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    name: "Basic",
    description: "소규모 팀을 위한 기본 플랜",
    monthlyPrice: 199000,
    yearlyPrice: 1990000,
    aiUsageLimit: 100,
    smsUsageLimit: 500,
    maxMembers: 50,
    maxCustomers: 1000,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "Premium",
    description: "중규모 팀을 위한 프리미엄 플랜",
    monthlyPrice: 398000,
    yearlyPrice: 3980000,
    aiUsageLimit: 500,
    smsUsageLimit: 2000,
    maxMembers: 200,
    maxCustomers: 5000,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "Enterprise",
    description: "대규모 조직을 위한 엔터프라이즈 플랜",
    monthlyPrice: 990000,
    yearlyPrice: 9900000,
    aiUsageLimit: 2000,
    smsUsageLimit: 10000,
    maxMembers: 1000,
    maxCustomers: 50000,
    sortOrder: 3,
  },
];

// 구독 정보 더미 데이터
export const MOCK_SUBSCRIPTION: Subscription = {
  id: 1,
  projectId: 1,
  plan: MOCK_SUBSCRIPTION_PLANS[0], // Basic 플랜
  billingCycle: "monthly",
  status: "active",
  autoRenewal: true,
  startDate: "2025-11-01T00:00:00Z",
  endDate: "2025-12-01T00:00:00Z",
  nextBillingDate: "2025-12-01T23:59:00Z",
  cancelledAt: null,
  terminatedAt: null,
  isActive: true,
};

// 결제 내역 더미 데이터
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 1,
    subscriptionId: 1,
    amount: 199000,
    status: "pending",
    method: "카드결제",
    approvedAt: null,
    failureReason: null,
    createdAt: "2025-11-14T10:00:00Z",
  },
  {
    id: 2,
    subscriptionId: 1,
    amount: 199000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-10-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-10-14T10:00:00Z",
  },
  {
    id: 3,
    subscriptionId: 1,
    amount: 199000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-09-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-09-14T10:00:00Z",
  },
  {
    id: 4,
    subscriptionId: 1,
    amount: 398000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-08-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-08-14T10:00:00Z",
  },
  {
    id: 5,
    subscriptionId: 1,
    amount: 398000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-07-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-07-14T10:00:00Z",
  },
  {
    id: 6,
    subscriptionId: 1,
    amount: 398000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-06-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-06-14T10:00:00Z",
  },
  {
    id: 7,
    subscriptionId: 1,
    amount: 398000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-05-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-05-14T10:00:00Z",
  },
  {
    id: 8,
    subscriptionId: 1,
    amount: 597000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-04-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-04-14T10:00:00Z",
  },
  {
    id: 9,
    subscriptionId: 1,
    amount: 597000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-03-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-03-14T10:00:00Z",
  },
  {
    id: 10,
    subscriptionId: 1,
    amount: 597000,
    status: "completed",
    method: "카드결제",
    approvedAt: "2025-02-14T10:05:00Z",
    failureReason: null,
    createdAt: "2025-02-14T10:00:00Z",
  },
];





