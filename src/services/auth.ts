import { apiClient } from "@/lib/apiClient";
import { setTokens, clearTokens } from "@/lib/token";

// DTOs can be refined later per actual contract
export type LoginInput = { email: string; password: string };
export type LoginOutput = unknown;
export type SocialLoginInput = { code: string; callbackUrl: string };
export type SignupInput = { email: string; password: string; name: string };
export type SignupOutput = unknown;
export type Me = unknown;

export const AuthService = {
  // Social login
  loginGoogle(input: SocialLoginInput) {
    return apiClient.post<LoginOutput>("/v1/auth/google", input).then((res) => {
      // Expecting { result, data: { accessToken, refreshToken, user } }
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      return res;
    });
  },
  loginKakao(input: SocialLoginInput) {
    return apiClient.post<LoginOutput>("/v1/auth/kakao", input).then((res) => {
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      return res;
    });
  },
  loginNaver(input: SocialLoginInput) {
    return apiClient.post<LoginOutput>("/v1/auth/naver", input).then((res) => {
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      return res;
    });
  },

  // Email/password
  login(input: LoginInput) {
    return apiClient.post<LoginOutput>("/v1/auth/login", input).then((res) => {
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      return res;
    });
  },
  signup(input: SignupInput) {
    return apiClient.post<SignupOutput>("/v1/auth/signup", input);
  },

  refresh() {
    // In case the client-side interceptor isn't used directly
    return apiClient.post<unknown>("/v1/auth/refresh").then((res) => {
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      return res;
    });
  },
  termsAccept() {
    return apiClient.post<unknown>("/v1/auth/terms");
  },
  verifyEmail(input: { token: string }) {
    return apiClient.post<unknown>("/v1/auth/verify-email", input).then((res) => {
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      return res;
    });
  },

  me() {
    return apiClient.get<Me>("/v1/auth/user");
  },

  // Profile & Security
  changePassword(input: { currentPassword: string; newPassword: string }) {
    return apiClient.patch<{ result: true; data: { message: string } }>("/v1/auth/change-password", input);
  },
  updateProfile(input: { name?: string; profileImageUrl?: string; phone?: string }) {
    return apiClient.patch<Me>("/v1/auth/profile", input);
  },
  resendEmailVerification(input: { email: string }) {
    return apiClient.post<{ result: true; data: { message: string } }>("/v1/auth/resend-email-verification", input);
  },
  sendPasswordResetCode(input: { email: string }) {
    return apiClient.post<{ result: true; data: { message: string } }>("/v1/auth/send-password-reset-code", input);
  },
  verifyPasswordResetCode(input: { email: string; otp: string }) {
    return apiClient.post<{ result: true; data: { resetToken: string; message: string } }>("/v1/auth/verify-password-reset-code", input);
  },
  resetPassword(input: { resetToken: string; newPassword: string }) {
    return apiClient.post<{ result: true; data: { message: string } }>("/v1/auth/reset-password", input);
  },
};


