// SMS domain types

// SMS History types
export type SmsStatus = "PROCESSING" | "SUCCESS" | "FAILED";
export type SmsMessageType = "SMS" | "LMS" | "MMS";
export type SmsAdvertisementType = "informational" | "advertising";
export type SenderNumberType = "project" | "member";

// SMS Send types
export type SendSmsAssignmentType = "ids" | "filter";

export type SendSmsFilters = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
  assignType?: "all" | "assigned" | "unassigned";
  teamId?: number;
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: number[];
  applicationDateFrom?: string;
  applicationDateTo?: string;
  assignedAtFrom?: string;
  assignedAtTo?: string;
};

export type SendSmsInput = {
  assignmentType: SendSmsAssignmentType;
  customerIds?: number[];                  // assignmentType이 "ids"일 때 필수
  filters?: SendSmsFilters;                // assignmentType이 "filter"일 때 필수
  expectedCount?: number;                  // assignmentType이 "filter"일 때 필수
  senderNumberType: SenderNumberType;
  senderNumberId: number;
  advertisementType: SmsAdvertisementType;
  title?: string;                          // LMS/MMS에서 사용
  content: string;
  scheduledAt: string;                     // ISO 8601 형식 (필수! 즉시 발송 시 현재 시간)
  imageUrls?: string[];                    // 최대 3개
};

export type SendSmsResponseData = {
  smsHistoryId: number;
  totalRecipients: number;
  validContactsCount: number;
};

export type SendSmsResponse = {
  result: boolean;
  data?: SendSmsResponseData;
};

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

