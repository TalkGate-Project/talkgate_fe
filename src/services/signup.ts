// Signup flow service
import { apiClient } from "@/lib/apiClient";
import type {
  CheckEmailInput,
  CheckEmailOutput,
  RegisterInput,
  RegisterOutput,
  VerifyEmailInput,
  VerifyEmailOutput,
  SignupTokens,
} from "@/types/signup";

export const SignupService = {
  checkEmailAvailable(input: CheckEmailInput): Promise<CheckEmailOutput> {
    return apiClient
      .post<any>("/v1/auth/check-email-duplicate", { email: input.email })
      .then((res) => {
        const dup = Boolean((res?.data as any)?.data?.isDuplicate);
        return { available: !dup } as CheckEmailOutput;
      });
  },

  sendEmailCode(email: string): Promise<{ success: true }> {
    // Replace with: return apiClient.post('/v1/auth/signup/send-email-code', { email }).then(r=>r.data)
    return Promise.resolve({ success: true });
  },

  /**
   * 이메일 인증 코드 검증
   * 성공 시 accessToken과 refreshToken을 반환
   * 이 토큰은 쿠키에 저장하지 않고 state로 관리하여 프로필 업데이트에 사용
   */
  verifyEmailCode(
    input: VerifyEmailInput
  ): Promise<{ success: true; tokens: SignupTokens }> {
    return apiClient
      .post<VerifyEmailOutput>("/v1/auth/verify-email", {
        email: input.email,
        otp: input.otp,
      })
      .then((res) => {
        const data = (res.data as any)?.data ?? res.data;
        return {
          success: true as const,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
        };
      });
  },

  register(input: RegisterInput): Promise<RegisterOutput> {
    const body = {
      email: input.email,
      password: input.password,
      isAllowTerms: input.agreeTerms,
      isAllowPrivacy: input.agreePrivacy,
      isAllowPrivacyProcessing: input.agreeDataProcessing,
      isAllowCustomerInfoLegal: input.agreeThirdParty,
      isAllowMarketing: input.agreeMarketing,
      invitationToken: input.invitationToken,
    };
    return apiClient
      .post<any>("/v1/auth/signup", body)
      .then((res) => {
        const data = (res.data as any)?.data ?? res.data;
        
        // 초대 플로우인 경우 백엔드에서 토큰을 반환할 수 있음
        // QA 요구사항: invitationToken을 넘겼다면 이메일 인증 절차는 필요 없음
        if (input.invitationToken && data?.accessToken && data?.refreshToken) {
          return {
            success: true,
            tokens: {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            },
          } as RegisterOutput;
        }
        
        return { success: true } as RegisterOutput;
      });
  },
};
