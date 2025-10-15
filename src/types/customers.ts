// Customers domain types

export type RecentNote = {
  id: number;
  categoryId: number;
  note: string;
  createdAt: string;
};

export type CustomerListItem = {
  id: number;
  name: string;
  contact1: string;
  contact2: string;
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  assignedTeamName: string;
  assignedMemberName: string;
  applicationDate: string;
  assignedAt: string;
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
  categoryIds?: number[];
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
  createdAt: string;
};

export type CustomerDetail = {
  id: number;
  name: string;
  contact1: string;
  contact2: string;
  residentId?: string;
  ageRange?: string;
  gender?: string; // e.g., "male"
  job?: string;
  messengers: CustomerMessenger[];
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  applicationDate: string;
  assignedAt: string;
  assignedTeamName: string;
  assignedMemberName: string;
  specialNotes?: string;
  investmentInfo?: string;
  investmentProfitLoss?: string;
  investmentRistLevel?: string;
  paymentHistories: CustomerPaymentHistory[];
  schedules: CustomerSchedule[];
  notes: RecentNote[];
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
  residentId?: string;
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
  memberTeamId: number;
  assignmentType: "ids" | "filters";
  customerIds?: number[];
  filterConditions?: AssignCustomersFilterConditions;
  expectedCount?: number;
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
export type ApiErrorResponse = {
  result: false;
  code: string;
  message: string;
  traceId: string;
};

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
  categoryId: number;
  note: string;
  projectId: string; // header
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
  projectId: string; // header
};

export type RemoveCustomerScheduleInput = {
  scheduleId: number;
  projectId: string; // header
};


