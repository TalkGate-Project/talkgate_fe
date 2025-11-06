// Light-weight service scaffolding for password reset flow.
// All functions currently resolve successfully to ease later API integration.

import type {
  RequestResetEmailInput,
  RequestResetEmailOutput,
  VerifyIdentityInput,
  VerifyIdentityOutput,
  SetNewPasswordInput,
  SetNewPasswordOutput,
} from "@/types/forgotPassword";

export const ForgotPasswordService = {
  requestResetEmail(input: RequestResetEmailInput): Promise<RequestResetEmailOutput> {
    return import("@/services/auth").then(({ AuthService }) => AuthService.sendPasswordResetCode({ email: input.email }));
  },
  verifyIdentity(input: VerifyIdentityInput): Promise<VerifyIdentityOutput> {
    return import("@/services/auth").then(({ AuthService }) => AuthService.verifyPasswordResetCode({ email: input.email, otp: input.otp }));
  },
  setNewPassword(input: SetNewPasswordInput): Promise<SetNewPasswordOutput> {
    return import("@/services/auth").then(({ AuthService }) => AuthService.resetPassword({ resetToken: input.resetToken, newPassword: input.newPassword }));
  },
};
