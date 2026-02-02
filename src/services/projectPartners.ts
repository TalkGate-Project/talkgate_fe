import { apiClient } from "@/lib/apiClient";
import type {
  CreateProjectPartnerInput,
  CreateProjectPartnerResponse,
  ProjectPartnerListQuery,
  ProjectPartnerListResponse,
  ProjectPartnerRequestsQuery,
  ProjectPartnerRequestsResponse,
  UpdateProjectPartnerStatusInput,
  UpdateProjectPartnerStatusResponse,
  ProjectPartnersWithApiKeyQuery,
  ProjectPartnersWithApiKeyResponse,
} from "@/types/projectPartners";
import type { ApiSuccess } from "@/types/common";

export const ProjectPartnersService = {
  /**
   * 협력업체 추가 (Admin, SubAdmin만 가능)
   * POST /v1/project-partners
   */
  create(payload: CreateProjectPartnerInput, headers?: Record<string, string>) {
    return apiClient.post<CreateProjectPartnerResponse>(
      "/v1/project-partners",
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * 협력업체 목록 조회 (Admin, SubAdmin만 가능)
   * GET /v1/project-partners
   */
  list(query: ProjectPartnerListQuery, headers?: Record<string, string>) {
    return apiClient.get<ProjectPartnerListResponse>("/v1/project-partners", {
      query: {
        page: query.page,
        limit: query.limit,
        ...(query.status != null ? { status: query.status } : {}),
      },
      ...(headers ? { headers } : {}),
    });
  },

  /**
   * 협력업체 제거 (Admin, SubAdmin만 가능)
   * DELETE /v1/project-partners/{id}
   */
  remove(id: number, headers?: Record<string, string>) {
    return apiClient.delete<ApiSuccess<unknown>>(
      `/v1/project-partners/${id}`,
      headers ? { headers } : undefined
    );
  },

  /**
   * 협력업체 요청 상태 변경 - 승인/거부 (Admin, SubAdmin만 가능)
   * PATCH /v1/project-partners/{id}/status
   */
  updateStatus(
    id: number,
    payload: UpdateProjectPartnerStatusInput,
    headers?: Record<string, string>
  ) {
    return apiClient.patch<UpdateProjectPartnerStatusResponse>(
      `/v1/project-partners/${id}/status`,
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * 자신의 프로젝트를 협력업체로 등록한 목록 조회 (Admin, SubAdmin만 가능)
   * GET /v1/project-partners/requests
   */
  listRequests(query: ProjectPartnerRequestsQuery, headers?: Record<string, string>) {
    return apiClient.get<ProjectPartnerRequestsResponse>(
      "/v1/project-partners/requests",
      {
        query: {
          page: query.page,
          limit: query.limit,
          ...(query.status != null ? { status: query.status } : {}),
        },
        ...(headers ? { headers } : {}),
      }
    );
  },

  /**
   * API 키 연결 여부를 포함한 승인된 협력업체 목록 조회 (Admin, SubAdmin만 가능)
   * GET /v1/project-partners/with-api-key
   */
  listWithApiKey(
    query: ProjectPartnersWithApiKeyQuery,
    headers?: Record<string, string>
  ) {
    return apiClient.get<ProjectPartnersWithApiKeyResponse>(
      "/v1/project-partners/with-api-key",
      {
        query: {
          apiKeyId: query.apiKeyId,
          page: query.page,
          limit: query.limit,
        },
        ...(headers ? { headers } : {}),
      }
    );
  },
};
