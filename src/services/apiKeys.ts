import { apiClient } from "@/lib/apiClient";
import type {
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
  UpdateApiKeyResponse,
  ApiKeyListQuery,
  ApiKeyListResponse,
  ApiKeyCustomerHistoryQuery,
  ApiKeyCustomerHistoryResponse,
} from "@/types/apiKeys";

export const ApiKeysService = {
  /**
   * API 키 추가 (Admin만 가능)
   * @param payload - API 키 생성 정보 (name)
   * @param headers - x-project-id 헤더 포함
   */
  create(payload: CreateApiKeyInput, headers?: Record<string, string>) {
    return apiClient.post<CreateApiKeyResponse>(
      "/v1/api-keys",
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * API 키 이름 수정 (Admin, SubAdmin만 가능)
   * PATCH /v1/api-keys/{id}
   * @param id - API 키 ID
   * @param payload - 수정할 이름 (name)
   * @param headers - x-project-id 헤더 포함
   */
  update(
    id: number,
    payload: UpdateApiKeyInput,
    headers?: Record<string, string>
  ) {
    return apiClient.patch<UpdateApiKeyResponse>(
      `/v1/api-keys/${id}`,
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * API 키 목록 조회 (Admin만 가능)
   * @param query - 페이지 번호(page)와 페이지 크기(limit)
   * @param headers - x-project-id 헤더 포함
   */
  list(query: ApiKeyListQuery, headers?: Record<string, string>) {
    return apiClient.get<ApiKeyListResponse>(
      "/v1/api-keys",
      {
        query: {
          page: query.page,
          limit: query.limit,
        },
        ...(headers ? { headers } : {}),
      }
    );
  },

  /**
   * API 키 삭제 (Admin만 가능)
   * @param id - 삭제할 API 키 ID
   * @param headers - x-project-id 헤더 포함
   */
  remove(id: number, headers?: Record<string, string>) {
    return apiClient.delete<{ result: true }>(
      `/v1/api-keys/${id}`,
      headers ? { headers } : undefined
    );
  },

  /**
   * API 키로 등록된 고객 히스토리 조회 (Admin, SubAdmin만 가능)
   * GET /v1/api-keys/{id}/customer-history
   * @param id - API 키 ID
   * @param query - page, limit, projectPartnerId(선택)
   * @param headers - x-project-id 헤더 포함
   */
  getCustomerHistory(
    id: number,
    query: ApiKeyCustomerHistoryQuery,
    headers?: Record<string, string>
  ) {
    return apiClient.get<ApiKeyCustomerHistoryResponse>(
      `/v1/api-keys/${id}/customer-history`,
      {
        query: {
          page: query.page,
          limit: query.limit,
          ...(query.projectPartnerId != null ? { projectPartnerId: query.projectPartnerId } : {}),
        },
        ...(headers ? { headers } : {}),
      }
    );
  },

  /**
   * API 키에 협력업체 연결 (Admin, SubAdmin만 가능)
   * POST /v1/api-keys/{apiKeyId}/partners/{partnerId}
   * @param apiKeyId - API 키 ID
   * @param partnerId - 협력업체 ID
   * @param headers - x-project-id 헤더 포함
   */
  connectPartner(
    apiKeyId: number,
    partnerId: number,
    headers?: Record<string, string>
  ) {
    return apiClient.post<{ result: true }>(
      `/v1/api-keys/${apiKeyId}/partners/${partnerId}`,
      undefined,
      headers ? { headers } : undefined
    );
  },

  /**
   * API 키에서 협력업체 연결 제거 (Admin, SubAdmin만 가능)
   * DELETE /v1/api-keys/{apiKeyId}/partners/{partnerId}
   * @param apiKeyId - API 키 ID
   * @param partnerId - 협력업체 ID
   * @param headers - x-project-id 헤더 포함
   */
  disconnectPartner(
    apiKeyId: number,
    partnerId: number,
    headers?: Record<string, string>
  ) {
    return apiClient.delete<{ result: true }>(
      `/v1/api-keys/${apiKeyId}/partners/${partnerId}`,
      headers ? { headers } : undefined
    );
  },
};
