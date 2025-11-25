import { apiClient } from "@/lib/apiClient";
import { setTokens } from "@/lib/token";
import { setSelectedProjectId } from "@/lib/project";
import type {
  LoginInput,
  LoginOutput,
  SocialLoginInput,
  SignupInput,
  SignupOutput,
  Me,
  ChangePasswordInput,
  ChangePasswordResponse,
  UpdateProfileInput,
  ResendEmailVerificationInput,
  SendPasswordResetCodeInput,
  VerifyPasswordResetCodeInput,
  VerifyPasswordResetCodeResponse,
  ResetPasswordInput,
  BasicMessageResponse,
  TwoFactorSetupResponse,
  TwoFactorSetupInput,
  TwoFactorDisableSendCodeResponse,
  TwoFactorDisableInput,
  TwoFactorLoginInput,
  TwoFactorLoginOutput,
} from "@/types/auth";

export const AuthService = {
  // Social login
  loginGoogle(input: SocialLoginInput) {
    console.log("[AuthService] 🔵 loginGoogle 호출:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return apiClient.post<LoginOutput>("/v1/auth/google", input).then((res) => {
      console.log("[AuthService] 📥 Google API 응답 수신:", { status: res.status, ok: res.ok });
      // Expecting { result, data: { accessToken, refreshToken, user, projectId? } }
      const anyRes: any = res.data as any;
      console.log("[AuthService] 📊 응답 데이터:", {
        hasAccessToken: !!anyRes?.data?.accessToken,
        hasRefreshToken: !!anyRes?.data?.refreshToken,
        hasUser: !!anyRes?.data?.user,
        projectId: anyRes?.data?.projectId,
        defaultProjectId: anyRes?.data?.defaultProjectId,
      });
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      try {
        const pid = anyRes?.data?.projectId
          ?? anyRes?.data?.defaultProjectId
          ?? anyRes?.data?.user?.defaultProjectId
          ?? anyRes?.data?.user?.projectId
          ?? null;
        console.log("[AuthService] 📁 추출된 프로젝트 ID:", pid);
        if (pid != null) setSelectedProjectId(pid);
      } catch {}
      return res;
    });
  },
  loginKakao(input: SocialLoginInput) {
    console.log("[AuthService] 🟡 loginKakao 호출:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return apiClient.post<LoginOutput>("/v1/auth/kakao", input).then((res) => {
      console.log("[AuthService] 📥 Kakao API 응답 수신:", { status: res.status, ok: res.ok });
      const anyRes: any = res.data as any;
      console.log("[AuthService] 📊 응답 데이터:", {
        hasAccessToken: !!anyRes?.data?.accessToken,
        hasRefreshToken: !!anyRes?.data?.refreshToken,
        hasUser: !!anyRes?.data?.user,
        projectId: anyRes?.data?.projectId,
        defaultProjectId: anyRes?.data?.defaultProjectId,
      });
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      try {
        const pid = anyRes?.data?.projectId
          ?? anyRes?.data?.defaultProjectId
          ?? anyRes?.data?.user?.defaultProjectId
          ?? anyRes?.data?.user?.projectId
          ?? null;
        console.log("[AuthService] 📁 추출된 프로젝트 ID:", pid);
        if (pid != null) setSelectedProjectId(pid);
      } catch {}
      return res;
    });
  },
  loginNaver(input: SocialLoginInput) {
    console.log("[AuthService] 🟢 loginNaver 호출:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return apiClient.post<LoginOutput>("/v1/auth/naver", input).then((res) => {
      console.log("[AuthService] 📥 Naver API 응답 수신:", { status: res.status, ok: res.ok });
      const anyRes: any = res.data as any;
      console.log("[AuthService] 📊 응답 데이터:", {
        hasAccessToken: !!anyRes?.data?.accessToken,
        hasRefreshToken: !!anyRes?.data?.refreshToken,
        hasUser: !!anyRes?.data?.user,
        projectId: anyRes?.data?.projectId,
        defaultProjectId: anyRes?.data?.defaultProjectId,
      });
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      try {
        const pid = anyRes?.data?.projectId
          ?? anyRes?.data?.defaultProjectId
          ?? anyRes?.data?.user?.defaultProjectId
          ?? anyRes?.data?.user?.projectId
          ?? null;
        console.log("[AuthService] 📁 추출된 프로젝트 ID:", pid);
        if (pid != null) setSelectedProjectId(pid);
      } catch {}
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
      try {
        const pid = anyRes?.data?.projectId
          ?? anyRes?.data?.defaultProjectId
          ?? anyRes?.data?.user?.defaultProjectId
          ?? anyRes?.data?.user?.projectId
          ?? null;
        if (pid != null) setSelectedProjectId(pid);
      } catch {}
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
      try {
        const pid = anyRes?.data?.projectId
          ?? anyRes?.data?.defaultProjectId
          ?? anyRes?.data?.user?.defaultProjectId
          ?? anyRes?.data?.user?.projectId
          ?? null;
        if (pid != null) setSelectedProjectId(pid);
      } catch {}
      return res;
    });
  },

  me() {
    return apiClient.get<Me>("/v1/auth/user");
  },

  // Profile & Security
  changePassword(input: ChangePasswordInput) {
    return apiClient.patch<ChangePasswordResponse>("/v1/auth/change-password", input);
  },
  updateProfile(input: UpdateProfileInput) {
    return apiClient.patch<Me>("/v1/auth/profile", input);
  },
  resendEmailVerification(input: ResendEmailVerificationInput) {
    return apiClient.post<BasicMessageResponse>("/v1/auth/resend-email-verification", input);
  },
  sendPasswordResetCode(input: SendPasswordResetCodeInput) {
    return apiClient.post<BasicMessageResponse>("/v1/auth/send-password-reset-code", input);
  },
  verifyPasswordResetCode(input: VerifyPasswordResetCodeInput) {
    return apiClient.post<VerifyPasswordResetCodeResponse>("/v1/auth/verify-password-reset-code", input);
  },
  resetPassword(input: ResetPasswordInput) {
    return apiClient.post<BasicMessageResponse>("/v1/auth/reset-password", input);
  },

  // Two-Factor Authentication
  twoFactorSetup() {
    return apiClient.get<TwoFactorSetupResponse>("/v1/auth/two-factor/setup");
  },
  twoFactorEnable(input: TwoFactorSetupInput) {
    return apiClient.post<Me>("/v1/auth/two-factor/setup", input);
  },
  twoFactorDisableSendCode() {
    return apiClient.post<TwoFactorDisableSendCodeResponse>("/v1/auth/two-factor/disable/send-code");
  },
  twoFactorDisable(input: TwoFactorDisableInput) {
    return apiClient.delete<BasicMessageResponse>("/v1/auth/two-factor/disable", { body: input });
  },
  twoFactorLogin(input: TwoFactorLoginInput) {
    return apiClient.post<TwoFactorLoginOutput>("/v1/auth/two-factor/login", input).then((res) => {
      const anyRes: any = res.data as any;
      if (anyRes?.data?.accessToken || anyRes?.data?.refreshToken) {
        setTokens({ accessToken: anyRes.data.accessToken, refreshToken: anyRes.data.refreshToken });
      }
      try {
        const pid = anyRes?.data?.projectId
          ?? anyRes?.data?.defaultProjectId
          ?? anyRes?.data?.user?.defaultProjectId
          ?? anyRes?.data?.user?.projectId
          ?? null;
        if (pid != null) setSelectedProjectId(pid);
      } catch {}
      return res;
    });
  },
};
