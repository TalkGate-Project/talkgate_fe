// Mocked signup flow service to be replaced with real API calls later.
import { apiClient } from "@/lib/apiClient";

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
    return apiClient
      .post<any>("/v1/auth/check-email-duplicate", { email: input.email })
      .then((res) => {
        const dup = Boolean((res?.data as any)?.data?.isDuplicate);
        return { available: !dup } as CheckEmailOutput;
      });
  },

  sendEmailCode(email: string): Promise<{ success: true }> {
    // Replace with: return apiClient.post('/v1/auth/signup/send-email-code', { email }).then(r=>r.data)
    return Promise.resolve({ success: true });
  },

  verifyEmailCode(email: string, code: string): Promise<{ success: boolean }> {
    // Replace with: return apiClient.post('/v1/auth/signup/verify-email-code', { email, code }).then(r=>r.data)
    return Promise.resolve({ success: code === '000000' ? false : true });
  },

  register(input: RegisterInput): Promise<RegisterOutput> {
    const body: any = {
      email: input.email,
      password: input.password,
      isAllowTerms: Boolean(input.agreeTerms),
      isAllowPrivacy: Boolean(input.agreePrivacy),
      // Optional invitationToken is not present in our form; left undefined
    };
    return apiClient
      .post<any>("/v1/auth/signup", body)
      .then((res) => {
        return { success: true } as RegisterOutput;
      });
  },
};


