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

// POST /v1/billing/register - 빌링키 등록 (결제 수단 등록)
export type BillingRegisterInput = {
  cardNo: string;
  expYear: string;
  expMonth: string;
  idNo: string;
  cardPw: string;
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
};

export type BillingRegisterResponse = {
  result: true;
  data: BillingInfo;
};

// PUT /v1/billing/update - 빌링키 변경 (결제 수단 변경)
export type BillingUpdateInput = {
  billingInfoId: number;
  cardNo: string;
  expYear: string;
  expMonth: string;
  idNo: string;
  cardPw: string;
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
};

export type BillingUpdateResponse = {
  result: true;
  data: BillingInfo;
};

// DELETE /v1/billing/{id} - 빌링키 삭제 (응답 없음, 에러만 반환)
// 에러 응답은 common.ts의 ApiError 타입 사용

// GET /v1/billing/terms - 약관 조회
export type BillingTermsType = 
  | "ElectronicFinancialTransactions" 
  | "CollectPersonalInfo" 
  | "SharingPersonalInformation";

export type BillingTermsResponse = {
  result: true;
  data: {
    termsTitle: string;
    content: string;
  };
};

