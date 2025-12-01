// Billing domain types

export type BillingInfo = {
  id: number;
  userId: number;
  lastFourDigits: string;
  cardCompany: string;
  cardType: string;
  ownerType: string;
  authenticatedAt: string;
  isActive: boolean;
  createdAt: string;
};

// GET /v1/billing - 모든 빌링키 조회
export type BillingListResponse = {
  result: true;
  data: {
    billingInfos: BillingInfo[];
  };
};

// GET /v1/billing/{id} - 특정 빌링키 조회
export type BillingDetailResponse = {
  result: true;
  data: BillingInfo;
};

// POST /v1/billing/register - 빌링키 등록
export type BillingRegisterInput = {
  authKey: string;
  customerKey: string;
};

export type BillingRegisterResponse = {
  result: true;
  data: BillingInfo;
};

// DELETE /v1/billing/{id} - 빌링키 삭제 (응답 없음, 에러만 반환)
// 에러 응답은 common.ts의 ApiError 타입 사용

