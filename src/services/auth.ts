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

/**
 * 로그인 응답에서 토큰과 사용자 정보를 추출하는 헬퍼 함수
 * 두 가지 응답 형식을 모두 지원:
 * 1. { result, data: { accessToken, refreshToken, user } } - 래핑된 형식
 * 2. { accessToken, refreshToken, user } - 직접 형식
 */
function extractLoginData(resData: any): {
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  projectId?: string | number;
} {
  console.log("[AuthService] 🔍 원본 응답 데이터 구조 분석:", {
    type: typeof resData,
    keys: resData ? Object.keys(resData) : [],
    hasResult: 'result' in (resData || {}),
    hasData: 'data' in (resData || {}),
    hasAccessToken: 'accessToken' in (resData || {}),
  });
  console.log("[AuthService] 📦 원본 응답 데이터:", JSON.stringify(resData, null, 2));

  // Case 1: { result, data: { accessToken, ... } } 형식
  if (resData?.data?.accessToken || resData?.data?.refreshToken) {
    console.log("[AuthService] ✅ 래핑된 응답 형식 감지 (result/data 구조)");
    return {
      accessToken: resData.data.accessToken,
      refreshToken: resData.data.refreshToken,
      user: resData.data.user,
      projectId: resData.data.projectId ?? resData.data.defaultProjectId ?? resData.data.user?.defaultProjectId ?? resData.data.user?.projectId,
    };
  }

  // Case 2: { accessToken, ... } 형식 (직접)
  if (resData?.accessToken || resData?.refreshToken) {
    console.log("[AuthService] ✅ 직접 응답 형식 감지 (accessToken 직접 포함)");
    return {
      accessToken: resData.accessToken,
      refreshToken: resData.refreshToken,
      user: resData.user,
      projectId: resData.projectId ?? resData.defaultProjectId ?? resData.user?.defaultProjectId ?? resData.user?.projectId,
    };
  }

  console.log("[AuthService] ⚠️ 토큰을 찾을 수 없음 - 알 수 없는 응답 형식");
  return {};
}

export const AuthService = {
  // Social login
  loginGoogle(input: SocialLoginInput) {
    console.log("[AuthService] 🔵 loginGoogle 호출:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return apiClient.post<LoginOutput>("/v1/auth/google", input).then((res) => {
      console.log("[AuthService] 📥 Google API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      console.log("[AuthService] 📊 추출된 데이터:", {
        hasAccessToken: !!extracted.accessToken,
        hasRefreshToken: !!extracted.refreshToken,
        hasUser: !!extracted.user,
        projectId: extracted.projectId,
      });

      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      } else {
        console.error("[AuthService] ❌ 토큰 추출 실패! 응답에 accessToken/refreshToken이 없습니다.");
      }

      if (extracted.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
        setSelectedProjectId(extracted.projectId);
      }

      return res;
    });
  },
  loginKakao(input: SocialLoginInput) {
    console.log("[AuthService] 🟡 loginKakao 호출:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return apiClient.post<LoginOutput>("/v1/auth/kakao", input).then((res) => {
      console.log("[AuthService] 📥 Kakao API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      console.log("[AuthService] 📊 추출된 데이터:", {
        hasAccessToken: !!extracted.accessToken,
        hasRefreshToken: !!extracted.refreshToken,
        hasUser: !!extracted.user,
        projectId: extracted.projectId,
      });

      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      } else {
        console.error("[AuthService] ❌ 토큰 추출 실패! 응답에 accessToken/refreshToken이 없습니다.");
      }

      if (extracted.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
        setSelectedProjectId(extracted.projectId);
      }

      return res;
    });
  },
  loginNaver(input: SocialLoginInput) {
    console.log("[AuthService] 🟢 loginNaver 호출:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return apiClient.post<LoginOutput>("/v1/auth/naver", input).then((res) => {
      console.log("[AuthService] 📥 Naver API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      console.log("[AuthService] 📊 추출된 데이터:", {
        hasAccessToken: !!extracted.accessToken,
        hasRefreshToken: !!extracted.refreshToken,
        hasUser: !!extracted.user,
        projectId: extracted.projectId,
      });

      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      } else {
        console.error("[AuthService] ❌ 토큰 추출 실패! 응답에 accessToken/refreshToken이 없습니다.");
      }

      if (extracted.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
        setSelectedProjectId(extracted.projectId);
      }

      return res;
    });
  },

  // Email/password
  login(input: LoginInput) {
    console.log("[AuthService] 📧 login 호출 (이메일/비밀번호)");
    return apiClient.post<LoginOutput>("/v1/auth/login", input).then((res) => {
      console.log("[AuthService] 📥 Login API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      console.log("[AuthService] 📊 추출된 데이터:", {
        hasAccessToken: !!extracted.accessToken,
        hasRefreshToken: !!extracted.refreshToken,
        hasUser: !!extracted.user,
        projectId: extracted.projectId,
      });

      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      }

      if (extracted.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
        setSelectedProjectId(extracted.projectId);
      }

      return res;
    });
  },
  signup(input: SignupInput) {
    return apiClient.post<SignupOutput>("/v1/auth/signup", input);
  },

  refresh() {
    console.log("[AuthService] 🔄 refresh 호출");
    return apiClient.post<unknown>("/v1/auth/refresh").then((res) => {
      console.log("[AuthService] 📥 Refresh API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 갱신 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      }
      return res;
    });
  },
  termsAccept() {
    return apiClient.post<unknown>("/v1/auth/terms");
  },
  verifyEmail(input: { token: string }) {
    console.log("[AuthService] ✉️ verifyEmail 호출");
    return apiClient.post<unknown>("/v1/auth/verify-email", input).then((res) => {
      console.log("[AuthService] 📥 VerifyEmail API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      }

      if (extracted.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
        setSelectedProjectId(extracted.projectId);
      }

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
    console.log("[AuthService] 🔐 twoFactorLogin 호출");
    return apiClient.post<TwoFactorLoginOutput>("/v1/auth/two-factor/login", input).then((res) => {
      console.log("[AuthService] 📥 TwoFactorLogin API 응답 수신:", { status: res.status, ok: res.ok });
      
      const extracted = extractLoginData(res.data);
      if (extracted.accessToken || extracted.refreshToken) {
        console.log("[AuthService] 🔑 토큰 저장 시작...");
        setTokens({ accessToken: extracted.accessToken, refreshToken: extracted.refreshToken });
      }

      if (extracted.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
        setSelectedProjectId(extracted.projectId);
      }

      return res;
    });
  },
};
