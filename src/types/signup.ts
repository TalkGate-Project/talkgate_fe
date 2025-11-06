// Signup domain types

export type CheckEmailInput = {
  email: string;
};

export type CheckEmailOutput = {
  available: true;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  code?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

export type RegisterOutput = {
  success: true;
};

