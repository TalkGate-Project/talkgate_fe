import { apiClient } from "@/lib/apiClient";

// DTOs can be refined later per actual contract
export type LoginInput = { email: string; password: string };
export type LoginOutput = unknown;
export type OAuthInput = { code: string };
export type SignupInput = { email: string; password: string; name: string };
export type SignupOutput = unknown;
export type Me = unknown;

export const AuthService = {
  // Social login
  loginGoogle(input: OAuthInput) {
    return apiClient.post<LoginOutput>("/v1/auth/google", input);
  },
  loginKakao(input: OAuthInput) {
    return apiClient.post<LoginOutput>("/v1/auth/kakao", input);
  },
  loginNaver(input: OAuthInput) {
    return apiClient.post<LoginOutput>("/v1/auth/naver", input);
  },

  // Email/password
  login(input: LoginInput) {
    return apiClient.post<LoginOutput>("/v1/auth/login", input);
  },
  signup(input: SignupInput) {
    return apiClient.post<SignupOutput>("/v1/auth/signup", input);
  },

  refresh() {
    return apiClient.post<unknown>("/v1/auth/refresh");
  },
  termsAccept() {
    return apiClient.post<unknown>("/v1/auth/terms");
  },
  verifyEmail(input: { token: string }) {
    return apiClient.post<unknown>("/v1/auth/verify-email", input);
  },

  me() {
    return apiClient.get<Me>("/v1/auth/user");
  },
};


