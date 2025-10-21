// Mocked signup flow service to be replaced with real API calls later.

export type CheckEmailInput = { email: string };
export type CheckEmailOutput = { available: true };

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  code?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};
export type RegisterOutput = { success: true };

export const SignupService = {
  checkEmailAvailable(input: CheckEmailInput): Promise<CheckEmailOutput> {
    // Replace with: return apiClient.get(`/v1/auth/signup/check-email?email=${encodeURIComponent(input.email)}`).then(r => r.data)
    return Promise.resolve({ available: true });
  },

  register(input: RegisterInput): Promise<RegisterOutput> {
    // Replace with: return apiClient.post('/v1/auth/signup', input).then(r => r.data)
    return Promise.resolve({ success: true });
  },
};


