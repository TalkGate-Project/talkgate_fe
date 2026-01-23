import { apiClient } from "@/lib/apiClient";
import type {
  CreateApiKeyInput,
  CreateApiKeyResponse,
  ApiKeyListQuery,
  ApiKeyListResponse,
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
};
