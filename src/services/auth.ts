import { apiClient } from "@/lib/apiClient";
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
 * 로그인 응답 데이터 타입
 */
export type LoginResponseData = {
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  projectId?: string | number;
  twoFactorToken?: string; // 2FA가 필요한 경우 반환되는 토큰
  requiresTwoFactor?: boolean;
};

/**
 * 로그인 응답에서 토큰과 사용자 정보를 추출하는 헬퍼 함수
 * 세 가지 응답 형식을 모두 지원:
 * 1. { result, data: { accessToken, refreshToken, user } } - 래핑된 형식
 * 2. { accessToken, refreshToken, user } - 직접 형식
 * 3. { result, data: { twoFactorToken, message } } - 2FA 필요 형식
 */
function extractLoginData(resData: any): LoginResponseData {
  console.log("[AuthService] 🔍 원본 응답 데이터 구조 분석:", {
    type: typeof resData,
    keys: resData ? Object.keys(resData) : [],
    hasResult: 'result' in (resData || {}),
    hasData: 'data' in (resData || {}),
    hasAccessToken: 'accessToken' in (resData || {}),
    hasTwoFactorToken: 'twoFactorToken' in (resData?.data || resData || {}),
  });
  console.log("[AuthService] 📦 원본 응답 데이터:", JSON.stringify(resData, null, 2));

  // Case 0: 2FA 필요 응답 - { result, data: { twoFactorToken, message } } 형식
  if (resData?.data?.twoFactorToken) {
    console.log("[AuthService] 🔐 2FA 필요 응답 감지");
    return {
      twoFactorToken: resData.data.twoFactorToken,
      requiresTwoFactor: true,
    };
  }

  // Case 0-1: 2FA 필요 응답 - { twoFactorToken } 직접 형식
  if (resData?.twoFactorToken) {
    console.log("[AuthService] 🔐 2FA 필요 응답 감지 (직접 형식)");
    return {
      twoFactorToken: resData.twoFactorToken,
      requiresTwoFactor: true,
    };
  }

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

/**
 * 소셜 로그인 결과 타입
 */
export type SocialLoginResult = {
  success: boolean;
  requiresTwoFactor: boolean;
  twoFactorToken?: string;
  isNewUser?: boolean; // 신규 가입 사용자 여부
  response: any;
};

/**
 * 소셜 로그인 공통 처리 함수
 */
function handleSocialLoginResponse(res: any, provider: string): SocialLoginResult {
  console.log(`[AuthService] 📥 ${provider} API 응답 수신:`, { status: res.status, ok: res.ok });
  
  const extracted = extractLoginData(res.data);
  console.log("[AuthService] 📊 추출된 데이터:", {
    hasAccessToken: !!extracted.accessToken,
    hasRefreshToken: !!extracted.refreshToken,
    hasUser: !!extracted.user,
    projectId: extracted.projectId,
    requiresTwoFactor: extracted.requiresTwoFactor,
    hasTwoFactorToken: !!extracted.twoFactorToken,
  });

  // 2FA가 필요한 경우
  if (extracted.requiresTwoFactor && extracted.twoFactorToken) {
    console.log("[AuthService] 🔐 2FA 필요 - 토큰 저장하지 않고 2FA 플로우로 진행");
    return {
      success: true,
      requiresTwoFactor: true,
      twoFactorToken: extracted.twoFactorToken,
      response: res,
    };
  }

  // 일반 로그인 성공
  // 토큰은 서버에서 httpOnly 쿠키로 설정되므로 클라이언트에서 저장 불필요
  if (!extracted.accessToken && !extracted.refreshToken) {
    console.error("[AuthService] ❌ 토큰 추출 실패! 응답에 accessToken/refreshToken이 없습니다.");
  }

  if (extracted.projectId != null) {
    console.log("[AuthService] 📁 프로젝트 ID 저장:", extracted.projectId);
    setSelectedProjectId(extracted.projectId);
  }

  return {
    success: true,
    requiresTwoFactor: false,
    response: res,
  };
}

export const AuthService = {
  // Social login
  loginGoogle(input: SocialLoginInput): Promise<SocialLoginResult> {
    console.log("[AuthService] 🔵 loginGoogle 호출 - 서버 API 사용:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return fetch("/api/auth/social/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw Object.assign(new Error(`Social login failed: ${res.status}`), {
          status: res.status,
          data,
        });
      }

      // 토큰은 서버에서 httpOnly 쿠키로 설정됨
      if (data.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", data.projectId);
        setSelectedProjectId(data.projectId);
      }

      return {
        success: data.success,
        requiresTwoFactor: data.requiresTwoFactor || false,
        twoFactorToken: data.twoFactorToken,
        isNewUser: data.isNewUser ?? false,
        response: { ok: true, status: res.status, data },
      };
    });
  },
  loginKakao(input: SocialLoginInput): Promise<SocialLoginResult> {
    console.log("[AuthService] 🟡 loginKakao 호출 - 서버 API 사용:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return fetch("/api/auth/social/kakao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw Object.assign(new Error(`Social login failed: ${res.status}`), {
          status: res.status,
          data,
        });
      }

      // 토큰은 서버에서 httpOnly 쿠키로 설정됨
      if (data.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", data.projectId);
        setSelectedProjectId(data.projectId);
      }

      return {
        success: data.success,
        requiresTwoFactor: data.requiresTwoFactor || false,
        twoFactorToken: data.twoFactorToken,
        isNewUser: data.isNewUser ?? false,
        response: { ok: true, status: res.status, data },
      };
    });
  },
  loginNaver(input: SocialLoginInput): Promise<SocialLoginResult> {
    console.log("[AuthService] 🟢 loginNaver 호출 - 서버 API 사용:", { callbackUrl: input.callbackUrl, codePreview: input.code?.slice(0, 20) + "..." });
    return fetch("/api/auth/social/naver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw Object.assign(new Error(`Social login failed: ${res.status}`), {
          status: res.status,
          data,
        });
      }

      // 토큰은 서버에서 httpOnly 쿠키로 설정됨
      if (data.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", data.projectId);
        setSelectedProjectId(data.projectId);
      }

      return {
        success: data.success,
        requiresTwoFactor: data.requiresTwoFactor || false,
        twoFactorToken: data.twoFactorToken,
        isNewUser: data.isNewUser ?? false,
        response: { ok: true, status: res.status, data },
      };
    });
  },

  // Email/password
  login(input: LoginInput) {
    console.log("[AuthService] 📧 login 호출 (이메일/비밀번호) - 서버 API 사용");
    // 서버 API 라우트를 사용하여 쿠키가 서버에서 설정되도록 함
    return fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw Object.assign(new Error(`Login failed: ${res.status}`), {
          status: res.status,
          data,
        });
      }
      
      console.log("[AuthService] 📥 로그인 응답 수신:", { 
        hasUser: !!data.user, 
        projectId: data.projectId,
        requiresTwoFactor: data.requiresTwoFactor,
        hasTwoFactorToken: !!data.twoFactorToken,
      });
      
      // 토큰은 서버에서 httpOnly 쿠키로 설정됨
      if (data.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", data.projectId);
        setSelectedProjectId(data.projectId);
      }

      // apiClient와 동일한 형식으로 반환 ({ ok, status, data })
      return { ok: true, status: res.status, data };
    });
  },
  signup(input: SignupInput) {
    return apiClient.post<SignupOutput>("/v1/auth/signup", input);
  },

  refresh() {
    console.log("[AuthService] 🔄 refresh 호출 - 프록시에서 자동 처리됨");
    // 토큰 갱신은 API 프록시에서 401 응답 시 자동으로 처리됨
    // 별도 호출이 필요한 경우를 위해 프록시를 통해 호출
    return apiClient.post<unknown>("/v1/auth/refresh");
  },
  termsAccept() {
    return apiClient.post<unknown>("/v1/auth/terms");
  },
  verifyEmail(input: { token: string }) {
    console.log("[AuthService] ✉️ verifyEmail 호출");
    return apiClient.post<unknown>("/v1/auth/verify-email", input).then((res) => {
      console.log("[AuthService] 📥 VerifyEmail API 응답 수신:", { status: res.status, ok: res.ok });
      
      // 토큰은 서버에서 httpOnly 쿠키로 설정됨 (프록시에서 처리)
      const extracted = extractLoginData(res.data);
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
    console.log("[AuthService] 🔐 twoFactorLogin 호출 - 서버 API 사용");
    // 서버 API 라우트를 사용하여 쿠키가 서버에서 설정되도록 함
    return fetch("/api/auth/two-factor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        twoFactorToken: input.twoFactorToken,
        totpCode: input.totpCode, // 백엔드는 totpCode를 기대함
      }),
      credentials: "include",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw Object.assign(new Error(`2FA Login failed: ${res.status}`), {
          status: res.status,
          data,
        });
      }
      
      console.log("[AuthService] 📥 2FA 로그인 응답 수신:", { 
        hasUser: !!data.user, 
        projectId: data.projectId,
      });
      
      // 토큰은 서버에서 httpOnly 쿠키로 설정됨
      if (data.projectId != null) {
        console.log("[AuthService] 📁 프로젝트 ID 저장:", data.projectId);
        setSelectedProjectId(data.projectId);
      }

      // apiClient와 동일한 형식으로 반환 ({ ok, status, data })
      return { ok: true, status: res.status, data };
    });
  },
};
