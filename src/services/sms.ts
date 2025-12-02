import { apiClient } from "@/lib/apiClient";
import type {
  SmsHistoryListQuery,
  SmsHistoryListResponse,
  MemberSenderNumberListQuery,
  MemberSenderNumberListResponse,
  ProjectSenderNumberListQuery,
  ProjectSenderNumberListResponse,
  SendSmsInput,
  SendSmsResponse,
} from "@/types/sms";

export const SmsService = {
  /**
   * 고객에게 문자 발송
   * 선택된 고객들에게 문자를 발송합니다.
   * 고객 ID 목록 또는 필터 조건으로 대상을 지정할 수 있습니다.
   */
  send(input: SendSmsInput) {
    return apiClient.post<SendSmsResponse>("/v1/customers/send-sms", input);
  },

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
  SenderNumberType,
  SendSmsAssignmentType,
  SendSmsFilters,
  SendSmsInput,
  SendSmsResponseData,
  SendSmsResponse,
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

