import { apiClient } from "@/lib/apiClient";
import type {
  SmsHistoryListQuery,
  SmsHistoryListResponse,
  MemberSenderNumberListQuery,
  MemberSenderNumberListResponse,
  ProjectSenderNumberListQuery,
  ProjectSenderNumberListResponse,
} from "@/types/sms";

export const SmsService = {
  /**
   * SMS 발송 히스토리 조회
   * 어드민은 전체 히스토리 조회 가능, 일반 멤버는 자신 및 하위 멤버의 히스토리만 조회 가능
   */
  getHistory(query: SmsHistoryListQuery) {
    return apiClient.get<SmsHistoryListResponse>("/v1/sms/history", {
      query: query as Record<string, string | number | boolean>,
    });
  },

  /**
   * 멤버 발신번호 목록 조회
   */
  getMemberSenderNumbers(query: MemberSenderNumberListQuery) {
    return apiClient.get<MemberSenderNumberListResponse>("/v1/sms/sender-numbers/member", {
      query: query as Record<string, string | number | boolean>,
    });
  },

  /**
   * 프로젝트 발신번호 목록 조회
   */
  getProjectSenderNumbers(query: ProjectSenderNumberListQuery) {
    return apiClient.get<ProjectSenderNumberListResponse>("/v1/sms/sender-numbers/project", {
      query: query as Record<string, string | number | boolean>,
    });
  },
};

// Re-export types for convenience
export type {
  SmsStatus,
  SmsMessageType,
  SmsAdvertisementType,
  SmsHistory,
  SmsHistoryListQuery,
  SmsHistoryListResponse,
  MemberSenderNumber,
  MemberSenderNumberListQuery,
  MemberSenderNumberListResponse,
  ProjectSenderNumberStatus,
  ProjectSenderNumber,
  ProjectSenderNumberListQuery,
  ProjectSenderNumberListResponse,
} from "@/types/sms";

