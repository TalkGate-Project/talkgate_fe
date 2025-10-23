import { apiClient } from "@/lib/apiClient";
import {
  CustomersListQuery,
  CustomersListResponse,
  CreateCustomerInput,
  CreateCustomerResponse,
  CustomerDetailResponse,
  UpdateCustomerInput,
  UpdateCustomerResponse,
  AssignCustomersInput,
  AssignCustomersResponse,
  AddCustomerMessengerInput,
  RemoveCustomerMessengerInput,
  BasicSuccessResponse,
  AddCustomerNoteInput,
  RemoveCustomerNoteInput,
  AddCustomerPaymentHistoryInput,
  RemoveCustomerPaymentHistoryInput,
  AddCustomerScheduleInput,
  RemoveCustomerScheduleInput,
  UnassignCustomersInput,
  UnassignCustomersResponse,
} from "@/types/customers";

export const CustomersService = {
  // 고객 목록 조회 (권한별 필터 자동 적용)
  list(query: CustomersListQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomersListResponse>(`/v1/customers`, {
      query: qs as any,
      headers: { "x-project-id": projectId },
    });
  },
  // 고객 단건 등록
  create(input: CreateCustomerInput) {
    const { projectId, ...body } = input;
    return apiClient.post<CreateCustomerResponse>(`/v1/customers`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  // 고객 상세 조회
  detail(customerId: string) {
    // Require x-project-id header for detail, align with Swagger
    return {
      withProject(projectId: string) {
        return apiClient.get<CustomerDetailResponse>(`/v1/customers/${customerId}`, {
          headers: { "x-project-id": projectId },
        });
      },
    } as const;
  },
  // 고객 정보 수정
  update(customerId: string, input: UpdateCustomerInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<UpdateCustomerResponse>(`/v1/customers/${customerId}`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  // 고객 삭제 (Admin)
  remove(customerId: string) {
    return {
      withProject(projectId: string) {
        return apiClient.delete<void>(`/v1/customers/${customerId}`, {
          headers: { "x-project-id": projectId },
        });
      },
    } as const;
  },
  // 고객 할당 (Admin 또는 팀장)
  assign(input: AssignCustomersInput) {
    const { projectId, ...body } = input;
    return apiClient.post<AssignCustomersResponse>(`/v1/customers/assign`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  // 메신저 정보 추가/삭제
  addMessenger(input: AddCustomerMessengerInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BasicSuccessResponse>(`/v1/customers/messengers`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  removeMessenger(input: RemoveCustomerMessengerInput) {
    return apiClient.delete<void>(`/v1/customers/messengers/${input.messengerId}`, {
      headers: { "x-project-id": input.projectId },
    });
  },
  // 상담 노트 추가/삭제
  addNote(input: AddCustomerNoteInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BasicSuccessResponse>(`/v1/customers/notes`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  removeNote(input: RemoveCustomerNoteInput) {
    return apiClient.delete<void>(`/v1/customers/notes/${input.noteId}`, {
      headers: { "x-project-id": input.projectId },
    });
  },
  // 결제 내역 추가/삭제
  addPaymentHistory(input: AddCustomerPaymentHistoryInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BasicSuccessResponse>(`/v1/customers/payment-histories`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  removePaymentHistory(input: RemoveCustomerPaymentHistoryInput) {
    return apiClient.delete<void>(`/v1/customers/payment-histories/${input.paymentHistoryId}`, {
      headers: { "x-project-id": input.projectId },
    });
  },
  // 일정 추가/삭제
  addSchedule(input: AddCustomerScheduleInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BasicSuccessResponse>(`/v1/customers/schedules`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  removeSchedule(input: RemoveCustomerScheduleInput) {
    return apiClient.delete<void>(`/v1/customers/schedules/${input.scheduleId}`, {
      headers: { "x-project-id": input.projectId },
    });
  },
  // 고객 할당 해제 (Admin)
  unassign(input: UnassignCustomersInput) {
    const { projectId, ...body } = input;
    return apiClient.post<UnassignCustomersResponse>(`/v1/customers/unassign`, body, {
      headers: { "x-project-id": projectId },
    });
  },
};

// Re-export types for convenience
export type {
  CustomersListQuery,
  CustomersListResponse,
  CreateCustomerInput,
  CreateCustomerResponse,
  CustomerDetailResponse,
  UpdateCustomerInput,
  UpdateCustomerResponse,
  AssignCustomersInput,
  AssignCustomersResponse,
  AddCustomerMessengerInput,
  RemoveCustomerMessengerInput,
  BasicSuccessResponse,
  AddCustomerNoteInput,
  RemoveCustomerNoteInput,
  AddCustomerPaymentHistoryInput,
  RemoveCustomerPaymentHistoryInput,
  AddCustomerScheduleInput,
  RemoveCustomerScheduleInput,
  UnassignCustomersInput,
  UnassignCustomersResponse,
} from "@/types/customers";
