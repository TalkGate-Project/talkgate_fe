import { apiClient } from "@/lib/apiClient";
import type {
  VerificationIdentityResponse,
  PhoneVerificationResponse,
} from "@/types/verification";

export const VerificationService = {
  /**
   * 본인인증 정보 조회
   * 로그인한 유저의 본인인증 정보를 조회합니다.
   */
  getIdentity() {
    return apiClient.get<VerificationIdentityResponse>("/v1/verification/identity");
  },

  /**
   * 휴대폰 본인인증 시작 (계정 인증 용)
   * 휴대폰 본인인증을 시작하고 본인인증 Form 데이터를 반환합니다.
   * 프론트엔드에서 해당 데이터로 Form을 생성하여 submit하면 본인인증창으로 이동합니다.
   * @param accessToken 회원가입 직후 아직 쿠키에 저장되지 않은 경우 직접 전달
   */
  startPhoneVerificationForAccount(accessToken?: string) {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return apiClient.post<PhoneVerificationResponse>(
      "/v1/verification/phone/account-verification",
      undefined,
      Object.keys(headers).length > 0 ? { headers } : undefined
    );
  },

  /**
   * 휴대폰 본인인증 시작 (문자 발신번호 등록 용)
   * 휴대폰 본인인증을 시작하고 본인인증 Form 데이터를 반환합니다.
   * 프론트엔드에서 해당 데이터로 Form을 생성하여 submit하면 본인인증창으로 이동합니다.
   * x-project-id 헤더는 apiClient가 쿠키에서 자동으로 추가합니다.
   */
  startPhoneVerificationForSmsSenderNumber() {
    return apiClient.post<PhoneVerificationResponse>(
      "/v1/verification/phone/sms-sender-number-registration"
    );
  },
};

// Re-export types for convenience
export type {
  VerificationIdentity,
  VerificationIdentityResponse,
  VerificationFormData,
  PhoneVerificationData,
  PhoneVerificationResponse,
} from "@/types/verification";

