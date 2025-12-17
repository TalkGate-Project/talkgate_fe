// Signup domain types

export type CheckEmailInput = {
  email: string;
};

export type CheckEmailOutput = {
  available: boolean;
};

export type RegisterInput = {
  email: string;
  password: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  invitationToken?: string;
};

export type RegisterOutput = {
  success: true;
  // 초대 플로우에서는 이메일 인증 없이 토큰이 바로 반환될 수 있음
  tokens?: SignupTokens;
};

export type VerifyEmailInput = {
  email: string;
  otp: string;
};

export type VerifyEmailUser = {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string;
  phone: string;
  status: "active" | string;
  emailVerifiedAt: string;
  lastLoginAt: string;
  isAllowTerms: boolean;
  isAllowPrivacy: boolean;
  isAllowChatNotification: boolean;
  isAllowNewNotification: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VerifyEmailOutput = {
  result: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: VerifyEmailUser;
  };
};

// 회원가입 플로우에서 임시로 보관하는 토큰 정보
export type SignupTokens = {
  accessToken: string;
  refreshToken: string;
};

