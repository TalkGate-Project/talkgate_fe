import { apiClient } from "@/lib/apiClient";
import {
  CustomersListQuery,
  CustomersListResponse,
  CustomerFilterOptionListResponse,
  CreateCustomerInput,
  CreateCustomerResponse,
  CustomerDetailResponse,
  CustomerDuplicatesResponse,
  UpdateCustomerInput,
  UpdateCustomerResponse,
  AssignCustomersInput,
  AssignCustomersResponse,
  CopyToPartnerInput,
  CopyToPartnerResponse,
  AddCustomerMessengerInput,
  RemoveCustomerMessengerInput,
  BasicSuccessResponse,
  AddCustomerNoteInput,
  AddCustomerNoteResponse,
  RemoveCustomerNoteInput,
  AddCustomerPaymentHistoryInput,
  RemoveCustomerPaymentHistoryInput,
  AddCustomerScheduleInput,
  RemoveCustomerScheduleInput,
  BulkDeleteCustomersInput,
  UnassignCustomersInput,
  UnassignCustomersResponse,
  ConfirmCustomerResponse,
  ConfirmAllCustomersResponse,
  UpdateCustomerCategoryInput,
  CustomerCategoryHistoryItem,
} from "@/types/customers";
import type { RecentlyAssignedCustomersResponse } from "@/types/dashboard";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function normalizeCustomerCategoryHistoryItem(
  input: unknown,
  fallbackIndex: number
): CustomerCategoryHistoryItem | null {
  if (!input || typeof input !== "object") return null;

  const item = input as Record<string, unknown>;
  const categoryObject =
    item.category && typeof item.category === "object"
      ? (item.category as Record<string, unknown>)
      : item.customerCategory && typeof item.customerCategory === "object"
        ? (item.customerCategory as Record<string, unknown>)
        : item.customerNoteCategory && typeof item.customerNoteCategory === "object"
          ? (item.customerNoteCategory as Record<string, unknown>)
      : null;
  const memberObject =
    item.member && typeof item.member === "object"
      ? (item.member as Record<string, unknown>)
      : null;

  const createdAt =
    toStringOrNull(item.createdAt) ??
    toStringOrNull(item.changedAt) ??
    toStringOrNull(item.updatedAt);

  if (!createdAt) return null;

  const categoryId =
    toNullableNumber(item.categoryId) ??
    toNullableNumber(item.newCategoryId) ??
    toNullableNumber(item.customerCategoryId) ??
    toNullableNumber(categoryObject?.id ?? null);
  const categoryName =
    toStringOrNull(item.categoryName) ??
    toStringOrNull(item.newCategoryName) ??
    toStringOrNull(item.customerCategoryName) ??
    toStringOrNull(item.customerNoteCategoryName) ??
    toStringOrNull(item.category) ??
    toStringOrNull(categoryObject?.name ?? null) ??
    NO_CATEGORY_LABEL;
  const colorCode =
    toStringOrNull(item.colorCode) ??
    toStringOrNull(categoryObject?.colorCode ?? null) ??
    toStringOrNull(categoryObject?.color ?? null);
  const memberName =
    toStringOrNull(item.memberName) ??
    toStringOrNull(item.changedByMemberName) ??
    toStringOrNull(memberObject?.name ?? null);
  const idSource =
    toStringOrNull(item.id) ??
    (typeof item.id === "number" ? String(item.id) : null) ??
    `${createdAt}-${categoryId ?? "general"}-${fallbackIndex}`;

  return {
    id: idSource,
    categoryId,
    categoryName,
    colorCode,
    memberName,
    createdAt,
  };
}

export function normalizeCustomerCategoryHistory(
  input: unknown
): CustomerCategoryHistoryItem[] {
  const rawList = Array.isArray(input)
    ? input
    : input &&
        typeof input === "object" &&
        Array.isArray((input as Record<string, unknown>).list)
      ? ((input as Record<string, unknown>).list as unknown[])
      : input &&
          typeof input === "object" &&
          Array.isArray((input as Record<string, unknown>).histories)
        ? ((input as Record<string, unknown>).histories as unknown[])
        : [];

  return rawList
    .map((item, index) => normalizeCustomerCategoryHistoryItem(item, index))
    .filter((item): item is CustomerCategoryHistoryItem => item !== null);
}

export const CustomersService = {
  // 고객 목록 조회 (권한별 필터 자동 적용)
  list(query: CustomersListQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<CustomersListResponse>(`/v1/customers`, {
      query: qs as any,
      headers: { "x-project-id": projectId },
    });
  },
  listMediaCompanies(projectId: string) {
    return apiClient.get<CustomerFilterOptionListResponse>(`/v1/customers/media-companies`, {
      headers: { "x-project-id": projectId },
    });
  },
  listSites(projectId: string) {
    return apiClient.get<CustomerFilterOptionListResponse>(`/v1/customers/sites`, {
      headers: { "x-project-id": projectId },
    });
  },
  listApplicationRoutes(projectId: string) {
    return apiClient.get<CustomerFilterOptionListResponse>(`/v1/customers/application-routes`, {
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
  // 고객 중복 데이터 목록 조회 (연락처 contact1 동일한 고객 목록, 권한 범위 내)
  duplicates(customerId: string, projectId: string) {
    return apiClient.get<CustomerDuplicatesResponse>(`/v1/customers/${customerId}/duplicates`, {
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
  // 고객 일괄 삭제 (Admin 또는 SubAdmin)
  bulkDelete(input: BulkDeleteCustomersInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BasicSuccessResponse>(`/v1/customers/bulk-delete`, body, {
      headers: { "x-project-id": projectId },
    });
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
    return apiClient.post<AddCustomerNoteResponse>(`/v1/customers/notes`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  changeCategory(customerId: string, input: UpdateCustomerCategoryInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<BasicSuccessResponse>(`/v1/customers/${customerId}/category`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  categoryHistory(customerId: string, projectId: string) {
    return apiClient.get<BasicSuccessResponse>(`/v1/customers/${customerId}/category-history`, {
      headers: { "x-project-id": projectId },
    });
  },
  removeNote(input: RemoveCustomerNoteInput) {
    return apiClient.delete<void>(`/v1/customers/notes/${input.noteId}`, {
      headers: { "x-project-id": input.projectId },
    });
  },
  // 매출 내역 추가/삭제
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
    const { projectId, colorCode, ...rest } = input;
    // colorCode에 # 접두사 보장
    const normalizedColorCode = colorCode?.startsWith("#") ? colorCode : `#${colorCode}`;
    return apiClient.post<BasicSuccessResponse>(`/v1/customers/schedules`, { ...rest, colorCode: normalizedColorCode }, {
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
  // 고객 정보를 협력업체에 복제 (Admin, SubAdmin만 가능)
  copyToPartner(input: CopyToPartnerInput) {
    const { projectId, ...body } = input;
    return apiClient.post<CopyToPartnerResponse>(`/v1/customers/copy-to-partner`, body, {
      headers: { "x-project-id": projectId },
    });
  },
  recentlyAssigned(projectId: string, query?: { limit?: number; page?: number }) {
    return apiClient.get<RecentlyAssignedCustomersResponse>(`/v1/customers/recently-assigned`, {
      query,
      headers: { "x-project-id": projectId },
    });
  },
  // 고객 상태를 확인됨으로 변경 (배정된 멤버만 가능)
  confirm(customerId: string, projectId: string) {
    return apiClient.patch<ConfirmCustomerResponse>(`/v1/customers/${customerId}/confirm`, undefined, {
      headers: { "x-project-id": projectId },
    });
  },
  // 자신에게 직접 할당된 모든 고객을 확인됨으로 일괄 변경
  confirmAll(projectId: string) {
    return apiClient.post<ConfirmAllCustomersResponse>(`/v1/customers/confirm-all`, undefined, {
      headers: { "x-project-id": projectId },
    });
  },
};

// Re-export types for convenience
export type {
  CustomersListQuery,
  CustomersListResponse,
  CustomerFilterOptionListResponse,
  CreateCustomerInput,
  CreateCustomerResponse,
  CustomerDetailResponse,
  CustomerDuplicateItem,
  CustomerDuplicatesResponse,
  UpdateCustomerInput,
  UpdateCustomerResponse,
  AssignCustomersInput,
  AssignCustomersResponse,
  CopyToPartnerInput,
  CopyToPartnerResponse,
  CopyToPartnerFilterConditions,
  CopyToPartnerResultItem,
  AddCustomerMessengerInput,
  RemoveCustomerMessengerInput,
  BasicSuccessResponse,
  AddCustomerNoteInput,
  RemoveCustomerNoteInput,
  AddCustomerPaymentHistoryInput,
  RemoveCustomerPaymentHistoryInput,
  AddCustomerScheduleInput,
  RemoveCustomerScheduleInput,
  BulkDeleteCustomersInput,
  DeleteCustomersFilterConditions,
  UnassignCustomersInput,
  UnassignCustomersResponse,
  ConfirmCustomerResponse,
  ConfirmAllCustomersResponse,
  UpdateCustomerCategoryInput,
  CustomerCategoryHistoryItem,
} from "@/types/customers";
