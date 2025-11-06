// Forgot Password domain types

export type RequestResetEmailInput = {
  email: string;
};

export type RequestResetEmailOutput = {
  result: true;
  data: {
    message: string;
  };
};

export type VerifyIdentityInput = {
  email: string;
  otp: string;
};

export type VerifyIdentityOutput = {
  result: true;
  data: {
    resetToken: string;
    message: string;
  };
};

export type SetNewPasswordInput = {
  resetToken: string;
  newPassword: string;
};

export type SetNewPasswordOutput = {
  result: true;
  data: {
    message: string;
  };
};

