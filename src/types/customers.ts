// Customers domain types

export enum ContactType {
  Phone = 'phone', // 휴대폰
  Home = 'home', // 집
  Office = 'office', // 회사
  Other = 'other', // 기타
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
  assignedMember?: AssignedMember | null;
  assignedTeamName: string;
  assignedMemberName: string;
  applicationDate: string;
  assignedAt: string;
  status?: string; // e.g., "pending", "unconfirmed", "confirmed"
  createdAt: string;
  recentNotes: RecentNote[];
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

export type CustomersListQuery = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
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
  birth?: string;
  residentId?: string;
  ageRange?: string;
  gender?: string; // e.g., "male"
  job?: string;
  messengerInfo?: CreateCustomerMessengerInfo[];
  applicationRoute?: string;
  site?: string;
  mediaCompany?: string;
  specialNotes?: string;
  teamId?: number;
  investmentInfo?: string;
  investmentProfitLoss?: string;
  investmentRistLevel?: string; // e.g., "aggressive"
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
  assignedMember?: AssignedMember | null;
  assignedTeamName: string;
  assignedMemberName: string;
  applicationDate: string;
  assignedAt: string;
  status?: string; // e.g., "pending", "unconfirmed", "confirmed"
  specialNotes?: string;
  investmentInfo?: string;
  investmentProfitLoss?: string;
  investmentRistLevel?: string;
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
  specialNotes?: string;
  investmentInfo?: string;
  investmentProfitLoss?: string;
  investmentRistLevel?: string;
  applicationDate?: string; // ISO
  projectId: string; // header: x-project-id
};

export type UpdateCustomerResponse = {
  result: true;
  data: CustomerListItem;
};

// Delete requires x-project-id header; use method args rather than body

// Assign customers
export type AssignCustomersFilterConditions = {
  name?: string;
  contact1?: string;
  contact2?: string;
  noteContent?: string;
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
