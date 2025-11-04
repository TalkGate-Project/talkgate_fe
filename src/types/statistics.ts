// Statistics domain types

export type SortOrder = "ASC" | "DESC";

export type ApiSuccessResponse<T> = {
  result: true;
  data: T;
};

export type ApiErrorResponse = {
  result: false;
  code: string;
  message: string;
  traceId: string;
};

export type PaginationQuery = {
  page: number;
  limit: number;
};

export type PagedPayload<T> = {
  data: T[] | null; // null when no data
  totalCount: number;
  page: number;
  limit: number;
};

// -------------------- Customer Assignment --------------------

export type CustomerAssignmentByMemberQuery = PaginationQuery & {
  sortOrder: SortOrder;
  teamId?: number;
  projectId: string;
};

export type CustomerAssignmentMemberRecord = {
  id: number;
  teamId: number | null;
  teamName: string | null;
  memberId: number;
  memberName: string;
  totalAssignedCount: number;
};

export type CustomerAssignmentByMemberResponse = ApiSuccessResponse<
  PagedPayload<CustomerAssignmentMemberRecord>
>;

export type CustomerAssignmentByTeamQuery = {
  projectId: string;
};

export type CustomerAssignmentTeamRecord = {
  teamId: number | null;
  teamName: string | null;
  totalAssignedCount: number;
};

export type CustomerAssignmentByTeamResponse = ApiSuccessResponse<{
  data: CustomerAssignmentTeamRecord[] | null; // null when no data
  totalCount: number;
}>;

// -------------------- Customer Note Status --------------------

export type CustomerNoteStatusQuery = {
  projectId: string;
};

export type CustomerNoteStatusRecord = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  totalCount: number;
};

export type CustomerNoteStatusResponse = ApiSuccessResponse<{
  data: CustomerNoteStatusRecord[] | null; // null when no data
  totalCount: number;
}>;

// -------------------- Customer Payment --------------------

export type CustomerPaymentByMemberQuery = PaginationQuery & {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  sortOrder: SortOrder;
  teamId?: number;
  projectId: string;
};

export type CustomerPaymentMemberRecord = {
  teamId: number | null;
  teamName: string | null;
  memberId: number;
  memberName: string;
  totalAmount: number;
  paymentCount: number;
};

export type CustomerPaymentByMemberResponse = ApiSuccessResponse<
  PagedPayload<CustomerPaymentMemberRecord>
>;

export type CustomerPaymentByTeamQuery = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  projectId: string;
};

export type CustomerPaymentTeamRecord = {
  teamId: number | null;
  teamName: string | null;
  totalAmount: number;
  paymentCount: number;
};

export type CustomerPaymentByTeamResponse = ApiSuccessResponse<{
  data: Array<CustomerPaymentTeamRecord | null> | null; // null when no data
  totalCount: number;
}>;

export type CustomerPaymentWeeklyQuery = {
  weeks: number;
  projectId: string;
};

export type CustomerPaymentWeeklyRecord = {
  weekStartDate: string;
  weekEndDate: string;
  totalAmount: number;
  paymentCount: number;
};

export type CustomerPaymentWeeklyResponse = ApiSuccessResponse<{
  data: CustomerPaymentWeeklyRecord[] | null; // null when no data
  totalCount: number;
}>;

// -------------------- Customer Registration --------------------

export type CustomerRegistrationQuery = PaginationQuery & {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  projectId: string;
};

export type CustomerRegistrationRecord = {
  id: number;
  statisticsDate: string;
  totalCount: number;
  directInputCount: number;
  excelUploadCount: number;
  apiCount: number;
};

export type CustomerRegistrationResponse = ApiSuccessResponse<
  PagedPayload<CustomerRegistrationRecord>
>;

// -------------------- Rankings --------------------

export type RankingMemberQuery = PaginationQuery & {
  projectId: string;
};

export type RankingMemberRecord = {
  id: number;
  memberId: number;
  memberName: string;
  totalAmount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
};

export type RankingMemberResponse = ApiSuccessResponse<
  PagedPayload<RankingMemberRecord> & {
    roundNumber: number;
  }
>;

export type RankingTeamQuery = PaginationQuery & {
  projectId: string;
};

export type RankingTeamRecord = {
  id: number;
  teamId: number | null;
  teamName: string | null;
  totalAmount: number;
  totalCount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
};

export type RankingTeamResponse = ApiSuccessResponse<
  PagedPayload<RankingTeamRecord> & {
    roundNumber: number;
  }
>;

export type RankingMyQuery = {
  projectId: string;
};

export type RankingMyRecord = {
  id: number;
  memberId: number;
  memberName: string;
  totalAmount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
};

export type RankingMyResponse = ApiSuccessResponse<{
  data: RankingMyRecord | null;
  roundNumber: number;
}>;

export type RankingMyTeamRecord = {
  id: number;
  teamId: number | null;
  teamName: string | null;
  totalAmount: number;
  totalCount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
};

export type RankingMyTeamResponse = ApiSuccessResponse<{
  data: RankingMyTeamRecord | null;
  roundNumber: number;
}>;

// -------------------- Summary --------------------

export type SummaryQuery = {
  projectId: string;
};

export type SummaryRecord = {
  todayQuote: string | null;
  recentlyAssignedCustomers: number;
  totalAssignedCustomers: number;
  paymentRate: number;
  totalPaymentAmount: number;
};

export type SummaryResponse = ApiSuccessResponse<SummaryRecord>;


