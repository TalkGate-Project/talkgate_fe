// Customers domain types

export enum ContactType {
  Phone = 'phone', // 휴대폰
  Home = 'home', // 집
  Office = 'office', // 회사
  Other = 'other', // 기타
}

// 고객 성향
export enum CustomerTendency {
  ImmediateDecision = 'immediateDecision', // 즉시 결정형
  ComparativeReview = 'comparativeReview', // 비교 검토형
  InformationCollection = 'informationCollection', // 정보 수집형
  PriceSensitive = 'priceSensitive', // 가격 민감형
  Aggressive = 'aggressive', // 공격적
  Friendly = 'friendly', // 친화적
  RejectionDefensive = 'rejectionDefensive', // 거절 방어적
}

export type RecentNote = {
  id: number;
  memberId?: number | null;
  memberName?: string | null;
  categoryId: number | null;
  note: string;
  createdAt: string;
};

export type AssignedMember = {
  id: number;
  name: string;
  teamId: number;
  teamName: string;
};

export type CustomerListItem = {
  id: number;
  name: string;
  contact1: string;
  contact2: string;
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  keyword?: string | null;
  assignedMember?: AssignedMember | null;
  assignedTeamName?: string | null;
  assignedMemberName?: string | null;
  applicationDate: string;
  assignedAt?: string | null;
  status?: string; // e.g., "pending", "unconfirmed", "confirmed"
  createdAt: string;
  recentNotes: RecentNote[];
  duplicateCount?: number;
};

export type CustomersListResponse = {
  result: true;
  data: {
    customers: CustomerListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** 연락처(contact1)가 동일한 고객 목록 조회 시 각 항목 타입 */
export type CustomerDuplicateItem = CustomerListItem & {
  duplicateCount: number;
};

/** 고객 중복 데이터 목록 조회 응답 (GET /v1/customers/{customerId}/duplicates) */
export type CustomerDuplicatesResponse = {
  result: true;
  data: {
    customers: CustomerDuplicateItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CustomersListQuery = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
  assignType?: "all" | "assigned" | "unassigned";
  projectPartnerId?: number;
  teamId?: number; // -1: 할당 대기 중
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: (number | string)[]; // number 또는 문자열 "null" - "null"은 "일반" 카테고리를 의미
  applicationDateFrom?: string; // YYYY-MM-DD
  applicationDateTo?: string;   // YYYY-MM-DD
  assignedAtFrom?: string;      // YYYY-MM-DD
  assignedAtTo?: string;        // YYYY-MM-DD
  sortType?: "applicationDate" | "assignedMember";
  sortOrder?: "ASC" | "DESC";
  page: number;                 // required
  limit: number;                // required
  projectId: string;            // header: x-project-id
};

export type CreateCustomerMessengerInfo = {
  messenger: string; // e.g., "line"
  account: string;
};

export type CreateCustomerInput = {
  name: string;
  contact1: string;
  contact2?: string;
  contact1Type?: ContactType | null;
  contact2Type?: ContactType | null;
  birth?: string;
  residentId?: string;
  ageRange?: string;
  gender?: string; // e.g., "male"
  job?: string;
  messengerInfo?: CreateCustomerMessengerInfo[];
  applicationRoute?: string;
  site?: string;
  mediaCompany?: string;
  ipAddress?: string;
  keyword?: string;
  specialNotes?: string;
  teamId?: number;
  summary?: string;
  assetStatus?: string;
  tendency?: string;
  rejectionReason?: string;
  projectId: string; // header: x-project-id
};

export type CreateCustomerResponse = {
  result: true;
  data: CustomerListItem;
};

// Detail types
export type CustomerMessenger = {
  id: number;
  messenger: string;
  account: string;
  createdAt?: string;
};

export type CustomerPaymentHistory = {
  id: number;
  description: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string; // e.g., "creditCard"
  createdAt: string;
};

export type CustomerSchedule = {
  id: number;
  scheduleTime: string;
  description: string;
  /** 6자리 HEX (예: "00E272"), '#' 제외일 가능성 있음 */
  colorCode?: string | null;
  createdAt: string;
};

export type CustomerDetail = {
  id: number;
  name: string;
  contact1: string;
  contact2: string;
  contact1Type?: ContactType | null;
  contact2Type?: ContactType | null;
  birth?: string;
  ageRange?: string;
  gender?: string; // e.g., "male"
  job?: string;
  messengers: CustomerMessenger[];
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  keyword?: string | null;
  ipAddress?: string | null;
  assignedMember?: AssignedMember | null;
  assignedTeamName?: string | null;
  assignedMemberName?: string | null;
  applicationDate: string;
  assignedAt?: string | null;
  status?: string; // e.g., "pending", "unconfirmed", "confirmed"
  specialNotes?: string;
  summary?: string;
  assetStatus?: string;
  tendency?: string;
  rejectionReason?: string;
  conversation?: {
    id: number;
    platform: string;
    name: string;
    profileUrl?: string | null;
    platformConversationId?: string;
  } | null;
  paymentHistories: CustomerPaymentHistory[];
  schedules: CustomerSchedule[];
  notes: RecentNote[];
  recentNotes?: RecentNote[]; // 일부 API 응답에서 사용
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetailResponse = {
  result: true;
  data: CustomerDetail;
};

// Update (PATCH) types
export type UpdateCustomerInput = {
  name?: string;
  contact1?: string;
  contact2?: string;
  contact1Type?: ContactType | null;
  contact2Type?: ContactType | null;
  birth?: string;
  ageRange?: string;
  gender?: string;
  job?: string;
  applicationRoute?: string;
  site?: string;
  mediaCompany?: string;
  keyword?: string;
  ipAddress?: string;
  specialNotes?: string;
  summary?: string;
  assetStatus?: string;
  tendency?: string;
  rejectionReason?: string;
  applicationDate?: string; // ISO
  projectId: string; // header: x-project-id
};

export type UpdateCustomerResponse = {
  result: true;
  data: CustomerListItem;
};

// Bulk delete customers
export type DeleteCustomersFilterConditions = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
  assignType?: "all" | string;
  teamId?: number;
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: (number | string)[];
  applicationDateFrom?: string;
  applicationDateTo?: string;
  assignedAtFrom?: string;
  assignedAtTo?: string;
  projectPartnerId?: number;
};

export type BulkDeleteCustomersInput = {
  deleteType: "ids" | "filter";
  customerIds?: number[];
  filterConditions?: DeleteCustomersFilterConditions;
  expectedCount?: number;
  projectId: string; // header: x-project-id
};

// Assign customers
export type AssignCustomersFilterConditions = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
  assignType?: "all" | "assigned" | "unassigned";
  projectPartnerId?: number;
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

export type AssignCustomersInput = {
  memberId: number; // target member to assign to
  assignmentType: "ids" | "filter";
  customerIds?: number[];
  filterConditions?: AssignCustomersFilterConditions;
  expectedCount?: number; // 필수: assignmentType이 "filter"일 때만
  projectId: string; // header: x-project-id
};

export type AssignCustomersResponse = {
  result: true;
  data: {
    assignedCount: number;
    failedCount: number;
    totalCount: number;
    failedCustomerIds: number[];
  };
};

// Unassign customers
export type UnassignCustomersInput = {
  assignmentType: "ids" | "filters";
  customerIds?: number[];
  filterConditions?: AssignCustomersFilterConditions;
  expectedCount?: number;
  projectId: string; // header: x-project-id
};

export type UnassignCustomersResponse = {
  result: true;
  data: {
    unassignedCount: number;
    failedCount: number;
    totalCount: number;
    failedCustomerIds: number[];
  };
};

// Copy customers to partner (협력업체에 고객 복제) - Admin, SubAdmin만 가능
export type CopyToPartnerFilterConditions = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
  assignType?: "all" | string;
  teamId?: number;
  memberId?: number;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  categoryIds?: (number | string)[];
  applicationDateFrom?: string;
  applicationDateTo?: string;
  assignedAtFrom?: string;
  assignedAtTo?: string;
};

export type CopyToPartnerInput = {
  /** 협력업체(ProjectPartner) ID 배열 */
  partnerIds: number[];
  /** "ids" = customerIds로 지정, "filter" = filterConditions로 지정 */
  copyType: "ids" | "filter";
  /** copyType === "ids"일 때 필수 */
  customerIds?: number[];
  /** copyType === "filter"일 때 사용 */
  filterConditions?: CopyToPartnerFilterConditions;
  /** copyType === "filter"일 때 예상 건수 (선택) */
  expectedCount?: number;
  projectId: string; // header: x-project-id
};

export type CopyToPartnerResultItem = {
  partnerId: number;
  copiedCount: number;
  failedCount: number;
  totalCount: number;
  failedCustomerIds: number[];
};

export type CopyToPartnerResponse = {
  result: true;
  data: {
    results: CopyToPartnerResultItem[];
  };
};

// Common error envelope (thrown by ApiClient on non-2xx)
import type { ApiErrorResponse } from "./common";

// Messenger add/remove
export type AddCustomerMessengerInput = {
  customerId: number;
  messenger: string; // e.g., "line"
  account: string;
  projectId: string; // header
};

export type RemoveCustomerMessengerInput = {
  messengerId: number;
  projectId: string; // header
};

export type BasicSuccessResponse = { result: true; data?: unknown };

// Notes add/remove
export type AddCustomerNoteInput = {
  customerId: number;
  categoryId: number | null;
  note: string;
  projectId: string; // header
};

export type AddCustomerNoteResponse = {
  result: true;
  data: RecentNote;
};

export type RemoveCustomerNoteInput = {
  noteId: number;
  projectId: string; // header
};

// Payment histories add/remove
export type AddCustomerPaymentHistoryInput = {
  customerId: number;
  description: string;
  paymentDate: string; // ISO
  amount: number;
  paymentMethod: string; // e.g., "creditCard"
  projectId: string; // header
};

export type RemoveCustomerPaymentHistoryInput = {
  paymentHistoryId: number;
  projectId: string; // header
};

// Schedules add/remove
export type AddCustomerScheduleInput = {
  customerId: number;
  scheduleTime: string; // ISO
  description: string;
  /** 6자리 HEX (예: "#00E272"), '#' 포함 */
  colorCode: string;
  projectId: string; // header
};

export type RemoveCustomerScheduleInput = {
  scheduleId: number;
  projectId: string; // header
};

// Confirm customer
export type ConfirmCustomerResponse = {
  result: true;
  data: CustomerDetail;
};

// Confirm all customers
export type ConfirmAllCustomersResponse = {
  result: true;
  data: {
    confirmedCount: number;
  };
};
