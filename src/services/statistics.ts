import { apiClient } from "@/lib/apiClient";
import {
  CustomerAssignmentByMemberQuery,
  CustomerAssignmentByMemberResponse,
  CustomerAssignmentByTeamQuery,
  CustomerAssignmentByTeamResponse,
  CustomerNoteStatusQuery,
  CustomerNoteStatusResponse,
  CustomerPaymentByMemberQuery,
  CustomerPaymentByMemberResponse,
  CustomerPaymentByTeamQuery,
  CustomerPaymentByTeamResponse,
  CustomerPaymentWeeklyQuery,
  CustomerPaymentWeeklyResponse,
  CustomerRegistrationQuery,
  CustomerRegistrationResponse,
  RankingMemberQuery,
  RankingMemberResponse,
  RankingTeamQuery,
  RankingTeamResponse,
  RankingMyQuery,
  RankingMyResponse,
  RankingMyTeamResponse,
  SummaryQuery,
  SummaryResponse,
} from "@/types/statistics";

export const StatisticsService = {
  customerAssignmentByMember(query: CustomerAssignmentByMemberQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomerAssignmentByMemberResponse>(
      `/v1/statistics/customer-assignment/by-member`,
      {
        query: qs,
        headers: { "x-project-id": projectId },
      }
    );
  },

  customerAssignmentByTeam({ projectId }: CustomerAssignmentByTeamQuery) {
    return apiClient.get<CustomerAssignmentByTeamResponse>(
      `/v1/statistics/customer-assignment/by-team`,
      {
        headers: { "x-project-id": projectId },
      }
    );
  },

  customerNoteStatus({ projectId }: CustomerNoteStatusQuery) {
    return apiClient.get<CustomerNoteStatusResponse>(`/v1/statistics/customer-note-status`, {
      headers: { "x-project-id": projectId },
    });
  },

  customerPaymentByMember(query: CustomerPaymentByMemberQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomerPaymentByMemberResponse>(`/v1/statistics/customer-payment/by-member`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  customerPaymentByTeam(query: CustomerPaymentByTeamQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomerPaymentByTeamResponse>(`/v1/statistics/customer-payment/by-team`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  customerPaymentWeekly(query: CustomerPaymentWeeklyQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomerPaymentWeeklyResponse>(`/v1/statistics/customer-payment/weekly`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  customerRegistration(query: CustomerRegistrationQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomerRegistrationResponse>(`/v1/statistics/customer-registration`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  rankingMember(query: RankingMemberQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<RankingMemberResponse>(`/v1/statistics/ranking/member`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  rankingTeam(query: RankingTeamQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<RankingTeamResponse>(`/v1/statistics/ranking/team`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  rankingMy(query: RankingMyQuery) {
    return apiClient.get<RankingMyResponse>(`/v1/statistics/ranking/my`, {
      headers: { "x-project-id": query.projectId },
    });
  },

  rankingMyTeam(query: RankingMyQuery) {
    return apiClient.get<RankingMyTeamResponse>(`/v1/statistics/ranking/my-team`, {
      headers: { "x-project-id": query.projectId },
    });
  },

  summary(query: SummaryQuery) {
    return apiClient.get<SummaryResponse>(`/v1/summary`, {
      headers: { "x-project-id": query.projectId },
    });
  },
};

export type {
  CustomerAssignmentByMemberQuery,
  CustomerAssignmentByMemberResponse,
  CustomerAssignmentByTeamResponse,
  CustomerNoteStatusResponse,
  CustomerPaymentByMemberQuery,
  CustomerPaymentByMemberResponse,
  CustomerPaymentByTeamResponse,
  CustomerPaymentWeeklyResponse,
  CustomerRegistrationQuery,
  CustomerRegistrationResponse,
  RankingMemberQuery,
  RankingMemberResponse,
  RankingTeamQuery,
  RankingTeamResponse,
  RankingMyQuery,
  RankingMyResponse,
  RankingMyTeamResponse,
  SummaryQuery,
  SummaryResponse,
} from "@/types/statistics";


