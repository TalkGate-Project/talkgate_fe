// Auth domain types

export type LoginInput = {
  email: string;
  password: string;
};

// Standard login response
export type LoginResponse = {
  result: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: any;
  };
};

// 2FA required response
export type TwoFactorRequiredResponse = {
  result: true;
  data: {
    twoFactorToken: string;
    message: string;
  };
};

export type LoginOutput = LoginResponse | TwoFactorRequiredResponse;

export type SocialLoginInput = {
  code: string;
  callbackUrl: string;
};

export type SignupInput = {
  email: string;
  password: string;
  name: string;
};

export type SignupOutput = unknown;

export type Me = unknown;

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  result: true;
  data: {
    message: string;
  };
};

export type UpdateProfileInput = {
  name?: string;
  profileImageUrl?: string;
  phone?: string;
};

export type ResendEmailVerificationInput = {
  email: string;
};

export type SendPasswordResetCodeInput = {
  email: string;
};

export type VerifyPasswordResetCodeInput = {
  email: string;
  otp: string;
};

export type VerifyPasswordResetCodeResponse = {
  result: true;
  data: {
    resetToken: string;
    message: string;
  };
};

export type ResetPasswordInput = {
  resetToken: string;
  newPassword: string;
};

export type BasicMessageResponse = {
  result: true;
  data: {
    message: string;
  };
};

// Two-Factor Authentication types
export type TwoFactorSetupResponse = {
  result: true;
  data: {
    secret: string;
    qrCodeDataUrl: string;
    message: string;
  };
};

export type TwoFactorSetupInput = {
  totpCode: string;
};

export type TwoFactorDisableSendCodeResponse = {
  result: true;
  data: {
    message: string;
  };
};

export type TwoFactorDisableInput = {
  emailCode: string;
  totpCode: string;
};

export type TwoFactorLoginInput = {
  twoFactorToken: string;
  totpCode: string;
};

export type TwoFactorLoginOutput = {
  result: true;
  data: {
    accessToken: string;
    refreshToken: string;
    user: any;
  };
};
