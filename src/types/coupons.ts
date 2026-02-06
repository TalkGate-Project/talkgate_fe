// Coupon domain types

export type CouponInfo = {
  code: string;
  name: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
};

// GET /v1/coupons - 프로젝트 쿠폰 정보 조회 (Admin, SubAdmin만 가능)
export type ProjectCouponResponse = {
  result: true;
  data: CouponInfo;
};
