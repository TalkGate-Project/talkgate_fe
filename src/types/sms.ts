// SMS domain types

// SMS History types
export type SmsStatus = "pending" | "processing" | "success" | "failed";
export type SmsMessageType = "SMS" | "LMS" | "MMS";
export type SmsAdvertisementType = "informational" | "advertising";
export type SenderNumberType = "project" | "member";

// 상태 라벨 매핑
export const SMS_STATUS_LABEL: Record<SmsStatus, string> = {
  pending: "대기중",
  processing: "처리중",
  success: "완료",
  failed: "실패",
} as const;

// SMS Send types
export type SendSmsAssignmentType = "ids" | "filter";

export type SendSmsFilters = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
  assignType?: "all" | "assigned" | "unassigned";
  apiKeyId?: number;
  teamId?: number;
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: (number | string)[]; // number 또는 빈 문자열("") - 빈 문자열은 "일반" 카테고리를 의미
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
  serviceName?: string; // 광고성 문자일 경우 필수
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
  rejectionReason?: string;
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

// Register Member Sender Number types
export type RegisterMemberSenderNumberInput = {
  verificationToken: string;
};

export type RegisterMemberSenderNumberData = {
  id: number;
  memberId: number;
  phoneNumber: string;
  createdAt: string;
};

export type RegisterMemberSenderNumberResponse = {
  result: boolean;
  data?: RegisterMemberSenderNumberData;
};

// Register Project Sender Number types
export type RegisterProjectSenderNumberInput = {
  number: string;
  documentImage1: string;
  documentImage2: string;
  documentImage3: string;
  /** 담당자 신분증 선택 시에만 필요. 대표자 신분증 선택 시 생략 */
  documentImage4?: string;
};

export type RegisterProjectSenderNumberData = {
  id: number;
  projectId: number;
  number: string;
  status: ProjectSenderNumberStatus;
  documentImage1: string;
  documentImage2: string;
  documentImage3: string;
  documentImage4: string;
  createdAt: string;
};

export type RegisterProjectSenderNumberResponse = {
  result: boolean;
  data?: RegisterProjectSenderNumberData;
};

