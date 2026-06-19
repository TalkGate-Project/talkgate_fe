// Statistics domain types

import type { ApiSuccessResponse } from "./common";

export type SortOrder = "ASC" | "DESC";

export enum SortType {
  Amount = 'amount',
  Count = 'count',
}

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

// 통계 공통 필터 (신청경로/매체사/사이트/신청시간/배정시간). 날짜는 YYYY-MM-DD(한국시간 기준).
export type StatsCommonFilter = {
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  applicationDateStart?: string;
  applicationDateEnd?: string;
  assignedAtStart?: string;
  assignedAtEnd?: string;
};

// -------------------- Customer Assignment --------------------

export type CustomerAssignmentByMemberQuery = PaginationQuery & StatsCommonFilter & {
  sortOrder: SortOrder;
  sortType?: SortType;
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

export type CustomerAssignmentByTeamQuery = StatsCommonFilter & {
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

export type CustomerNoteStatusQuery = StatsCommonFilter & {
  projectId: string;
  teamId?: number;
  memberId?: number;
};

export type CustomerNoteStatusRecord = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  colorCode?: string | null;
  totalCount: number;
  percentage: number;
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
  sortType?: SortType;
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

export type CustomerPaymentDetailsSortField =
  | "memberName"
  | "amount"
  | "paymentDate";

export type CustomerPaymentDetailsQuery = PaginationQuery & {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  sortField: CustomerPaymentDetailsSortField;
  sortOrder: SortOrder;
  projectId: string;
};

export type CustomerPaymentDetailRecord = {
  id: number;
  customerId: number;
  memberId: number;
  customerName: string;
  memberName: string;
  paymentMethod: string;
  amount: number;
  description: string | null;
  paymentDate: string;
};

export type CustomerPaymentDetailsResponse = ApiSuccessResponse<
  PagedPayload<CustomerPaymentDetailRecord>
>;

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
  partnerCopyCount: number;
};

export type CustomerRegistrationResponse = ApiSuccessResponse<
  PagedPayload<CustomerRegistrationRecord>
>;

// -------------------- Rankings --------------------

export type RankingMemberQuery = PaginationQuery & {
  projectId: string;
  year: number;
  month: number;
};

export type RankingMemberRecord = {
  id: number;
  memberId: number;
  memberName: string;
  teamId: number | null;
  teamName: string | null;
  totalAmount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
  yesterdayRank: number | null;
  yesterdayTotalAmount: number | null;
};

export type RankingMemberResponse = ApiSuccessResponse<
  PagedPayload<RankingMemberRecord> & {
    roundNumber: number;
  }
>;

export type RankingTeamQuery = PaginationQuery & {
  projectId: string;
  year: number;
  month: number;
};

export type RankingTeamRecord = {
  id: number;
  teamId: number | null;
  teamName: string | null;
  leaderMemberId: number | null;
  totalAmount: number;
  totalCount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
  yesterdayRank: number | null;
  yesterdayTotalAmount: number | null;
};

export type RankingTeamResponse = ApiSuccessResponse<
  PagedPayload<RankingTeamRecord> & {
    roundNumber: number;
  }
>;

export type RankingMyQuery = {
  projectId: string;
  year: number;
  month: number;
};

export type RankingMyRecord = {
  id: number;
  memberId: number;
  memberName: string;
  teamId: number | null;
  teamName: string | null;
  totalAmount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
  yesterdayRank: number | null;
  yesterdayTotalAmount: number | null;
};

export type RankingMyResponse = ApiSuccessResponse<{
  data: RankingMyRecord | null;
  roundNumber: number;
}>;

export type RankingMyTeamRecord = {
  id: number;
  teamId: number | null;
  teamName: string | null;
  leaderMemberId: number | null;
  totalAmount: number;
  totalCount: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  previousTotalAmount: number | null;
  amountChangeRate: string | null;
  yesterdayRank: number | null;
  yesterdayTotalAmount: number | null;
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


