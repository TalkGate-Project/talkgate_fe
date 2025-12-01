// SMS domain types

// SMS History types
export type SmsStatus = "PROCESSING" | "SUCCESS" | "FAILED";
export type SmsMessageType = "SMS" | "LMS" | "MMS";
export type SmsAdvertisementType = "informational" | "advertising";

export type SmsHistory = {
  id: number;
  projectId: number;
  memberId: number;
  senderPhoneNumber: string;
  messageType: SmsMessageType;
  advertisementType: SmsAdvertisementType;
  title: string;
  content: string;
  totalRecipients: number;
  successCount: number;
  failCount: number;
  status: SmsStatus;
  scheduledAt: string;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  createdAt: string;
  updatedAt: string;
};

export type SmsHistoryListQuery = {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  status?: SmsStatus;
};

export type SmsHistoryListResponse = {
  histories: SmsHistory[];
  total: number;
  page: number;
  limit: number;
};

// Member Sender Numbers types
export type MemberSenderNumber = {
  id: number;
  memberId: number;
  phoneNumber: string;
  createdAt: string;
};

export type MemberSenderNumberListQuery = {
  page: number;
  limit: number;
};

export type MemberSenderNumberListResponse = {
  numbers: MemberSenderNumber[];
  total: number;
  page: number;
  limit: number;
};

// Project Sender Numbers types
export type ProjectSenderNumberStatus = "verified" | "pending" | "rejected";

export type ProjectSenderNumber = {
  id: number;
  projectId: number;
  number: string;
  status: ProjectSenderNumberStatus;
  documentImage1?: string;
  documentImage2?: string;
  documentImage3?: string;
  documentImage4?: string;
  createdAt: string;
};

export type ProjectSenderNumberListQuery = {
  page: number;
  limit: number;
};

export type ProjectSenderNumberListResponse = {
  numbers: ProjectSenderNumber[];
  total: number;
  page: number;
  limit: number;
};

