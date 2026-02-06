import { apiClient } from "@/lib/apiClient";
import type { ProjectCouponResponse } from "@/types/coupons";

export const CouponsService = {
  /**
   * 프로젝트 쿠폰 정보 조회 (Admin, SubAdmin만 가능)
   * GET /v1/coupons
   * 데이터 제공자 프로젝트의 쿠폰 정보를 조회합니다.
   */
  getProjectCoupon(projectId: string) {
    return apiClient.get<ProjectCouponResponse>("/v1/coupons", {
      headers: { "x-project-id": projectId },
    });
  },
};

export type { ProjectCouponResponse, CouponInfo } from "@/types/coupons";
