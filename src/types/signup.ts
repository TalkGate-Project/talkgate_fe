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
};

