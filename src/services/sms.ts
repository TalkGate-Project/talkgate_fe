import { apiClient } from "@/lib/apiClient";
import type {
  SmsHistoryListQuery,
  SmsHistoryListResponse,
  MemberSenderNumberListQuery,
  MemberSenderNumberListResponse,
  ProjectSenderNumberListQuery,
  ProjectSenderNumberListResponse,
  RegisterMemberSenderNumberInput,
  RegisterMemberSenderNumberResponse,
  RegisterProjectSenderNumberInput,
  RegisterProjectSenderNumberResponse,
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

  /**
   * 개인 발신번호 등록
   * 본인인증을 통해 개인 발신번호를 등록합니다.
   */
  registerMemberSenderNumber(input: { verificationToken: string }) {
    return apiClient.post<{
      result: boolean;
      data?: {
        id: number;
        memberId: number;
        phoneNumber: string;
        createdAt: string;
      };
    }>("/v1/sms/sender-numbers/member", input);
  },

  /**
   * 프로젝트 발신번호 등록
   * 프로젝트 발신번호를 등록합니다. 관련 서류를 첨부해야 합니다.
   */
  registerProjectSenderNumber(input: {
    number: string;
    documentImage1: string;
    documentImage2: string;
    documentImage3: string;
    /** 담당자 신분증 선택 시에만 필요. 대표자 신분증 선택 시 생략 */
    documentImage4?: string;
  }) {
    return apiClient.post<{
      result: boolean;
      data?: {
        id: number;
        projectId: number;
        number: string;
        status: string;
        documentImage1: string;
        documentImage2: string;
        documentImage3: string;
        documentImage4: string;
        createdAt: string;
      };
    }>("/v1/sms/sender-numbers/project", input);
  },

  /**
   * 개인 발신번호 삭제
   * 본인의 개인 발신번호를 삭제합니다.
   */
  deleteMemberSenderNumber(id: number) {
    return apiClient.delete<{
      result: boolean;
      data: {
        success: boolean;
      };
    }>("/v1/sms/sender-numbers/member", {
      query: { id },
    });
  },

  /**
   * 프로젝트 발신번호 삭제
   * 프로젝트 발신번호를 삭제합니다. (Admin/SubAdmin 전용)
   */
  deleteProjectSenderNumber(id: number) {
    return apiClient.delete<{
      result: boolean;
      data: {
        success: boolean;
      };
    }>("/v1/sms/sender-numbers/project", {
      query: { id },
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

