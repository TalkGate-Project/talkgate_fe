export type ProjectPrivacyConsent = {
  id: number;
  projectId: number;
  userId: number;
  agreedAt: string;
  createdAt: string;
};

export type ProjectPrivacyConsentStatus = {
  isConsented: boolean;
  consent: ProjectPrivacyConsent | null;
};
