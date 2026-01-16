import { apiClient } from "@/lib/apiClient";
import type {
  BillingListResponse,
  BillingRegisterInput,
  BillingRegisterResponse,
  BillingUpdateInput,
  BillingUpdateResponse,
  BillingTermsType,
  BillingTermsResponse,
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
   * 빌링키 삭제
   * 등록된 결제 수단을 삭제합니다.
   * 활성 구독이 있는 경우 자동 갱신이 불가능해집니다.
   */
  remove(id: string | number) {
    return apiClient.delete<void>(`/v1/billing/${id}`);
  },

  /**
   * 빌링키 등록 (결제 수단 등록)
   * 나이스페이 빌링키를 발급받아 결제 수단을 등록합니다.
   * 결제 수단은 한 개만 등록 가능하며, 이미 등록된 결제 수단이 있으면 에러가 발생합니다.
   */
  register(input: BillingRegisterInput) {
    return apiClient.post<BillingRegisterResponse>("/v1/billing/register", input);
  },

  /**
   * 빌링키 변경 (결제 수단 변경)
   * 등록된 결제 수단을 변경합니다.
   * 기존 빌링키 ID를 유지하면서 새로운 카드 정보로 업데이트합니다.
   */
  update(input: BillingUpdateInput) {
    return apiClient.put<BillingUpdateResponse>("/v1/billing/update", input);
  },

  /**
   * 약관 조회
   * 결제 서비스 약관을 조회합니다.
   * 결제 진행 전 사용자에게 약관을 표시해야 합니다.
   */
  getTerms(termsType: BillingTermsType) {
    return apiClient.get<BillingTermsResponse>("/v1/billing/terms", {
      query: { termsType },
    });
  },
};

// Re-export types for convenience
export type {
  BillingInfo,
  BillingListResponse,
  BillingRegisterInput,
  BillingRegisterResponse,
  BillingUpdateInput,
  BillingUpdateResponse,
  BillingTermsType,
  BillingTermsResponse,
} from "@/types/billing";

