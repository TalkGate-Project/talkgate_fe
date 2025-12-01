import { apiClient } from "@/lib/apiClient";
import type {
  BillingListResponse,
  BillingDetailResponse,
  BillingRegisterInput,
  BillingRegisterResponse,
} from "@/types/billing";

export const BillingService = {
  /**
   * 모든 빌링키 조회
   * 사용자의 모든 등록된 결제 수단을 조회합니다.
   */
  list() {
    return apiClient.get<BillingListResponse>("/v1/billing");
  },

  /**
   * 특정 빌링키 조회
   * ID로 특정 결제 수단을 조회합니다.
   */
  getById(id: string | number) {
    return apiClient.get<BillingDetailResponse>(`/v1/billing/${id}`);
  },

  /**
   * 빌링키 삭제
   * 등록된 결제 수단을 삭제합니다.
   * 활성 구독이 있는 경우 자동 갱신이 불가능해집니다.
   */
  remove(id: string | number) {
    return apiClient.delete<void>(`/v1/billing/${id}`);
  },

  /**
   * 빌링키 등록 (결제 수단 등록)
   * 토스페이먼츠 빌링키를 발급받아 결제 수단을 등록합니다.
   * 사용자별로 관리됩니다.
   */
  register(input: BillingRegisterInput) {
    return apiClient.post<BillingRegisterResponse>("/v1/billing/register", input);
  },
};

// Re-export types for convenience
export type {
  BillingInfo,
  BillingListResponse,
  BillingDetailResponse,
  BillingRegisterInput,
  BillingRegisterResponse,
} from "@/types/billing";

