// Light-weight service scaffolding for password reset flow.
// All functions currently resolve successfully to ease later API integration.

export type RequestResetEmailInput = { email: string };
export type RequestResetEmailOutput = { success: true };

export type VerifyIdentityInput = {
  email: string;
  name: string;
  phone: string; // digits only
  code?: string; // optional verification code if required
};
export type VerifyIdentityOutput = { success: true };

export type SetNewPasswordInput = { email: string; password: string; passwordConfirm: string };
export type SetNewPasswordOutput = { success: true };

export const ForgotPasswordService = {
  requestResetEmail(input: RequestResetEmailInput): Promise<RequestResetEmailOutput> {
    // Replace with: return apiClient.post('/v1/auth/forgot/request', input).then(r => r.data)
    return Promise.resolve({ success: true });
  },
  verifyIdentity(input: VerifyIdentityInput): Promise<VerifyIdentityOutput> {
    // Replace with: return apiClient.post('/v1/auth/forgot/verify', input).then(r => r.data)
    return Promise.resolve({ success: true });
  },
  setNewPassword(input: SetNewPasswordInput): Promise<SetNewPasswordOutput> {
    // Replace with: return apiClient.post('/v1/auth/forgot/reset', input).then(r => r.data)
    return Promise.resolve({ success: true });
  },
};


