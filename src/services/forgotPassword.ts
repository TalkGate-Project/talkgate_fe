// Light-weight service scaffolding for password reset flow.
// All functions currently resolve successfully to ease later API integration.

export type RequestResetEmailInput = { email: string };
export type RequestResetEmailOutput = { result: true; data: { message: string } };

export type VerifyIdentityInput = { email: string; otp: string };
export type VerifyIdentityOutput = { result: true; data: { resetToken: string; message: string } };

export type SetNewPasswordInput = { resetToken: string; newPassword: string };
export type SetNewPasswordOutput = { result: true; data: { message: string } };

export const ForgotPasswordService = {
  requestResetEmail(input: RequestResetEmailInput) {
    return import("@/services/auth").then(({ AuthService }) => AuthService.sendPasswordResetCode({ email: input.email }));
  },
  verifyIdentity(input: VerifyIdentityInput) {
    return import("@/services/auth").then(({ AuthService }) => AuthService.verifyPasswordResetCode({ email: input.email, otp: input.otp }));
  },
  setNewPassword(input: SetNewPasswordInput) {
    return import("@/services/auth").then(({ AuthService }) => AuthService.resetPassword({ resetToken: input.resetToken, newPassword: input.newPassword }));
  },
};


