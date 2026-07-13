import { apiClient } from "@/lib/apiClient";
import type {
  CreateAnalysisPartnerInput,
  CreateAnalysisPartnerResponse,
  AnalysisPartnerListQuery,
  AnalysisPartnerListResponse,
  RemoveAnalysisPartnerResponse,
  UpdateAnalysisPartnerStatusInput,
  UpdateAnalysisPartnerStatusResponse,
  AnalysisPartnerRequestsQuery,
  AnalysisPartnerRequestsResponse,
} from "@/types/analysisPartners";

export const AnalysisPartnersService = {
  /**
   * 변호사 파트너 추가 (영업 프로젝트, Admin/SubAdmin만 가능)
   * POST /v1/analysis-partners
   */
  create(payload: CreateAnalysisPartnerInput, headers?: Record<string, string>) {
    return apiClient.post<CreateAnalysisPartnerResponse>(
      "/v1/analysis-partners",
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * 변호사 파트너 목록 조회 (영업 프로젝트, Admin/SubAdmin만 가능)
   * GET /v1/analysis-partners
   */
  list(query: AnalysisPartnerListQuery, headers?: Record<string, string>) {
    return apiClient.get<AnalysisPartnerListResponse>("/v1/analysis-partners", {
      query: {
        page: query.page,
        limit: query.limit,
        ...(query.status != null ? { status: query.status } : {}),
      },
      ...(headers ? { headers } : {}),
    });
  },

  /**
   * 변호사 파트너 제거 (영업 프로젝트, Admin/SubAdmin만 가능)
   * DELETE /v1/analysis-partners/{id}
   */
  remove(id: number, headers?: Record<string, string>) {
    return apiClient.delete<RemoveAnalysisPartnerResponse>(
      `/v1/analysis-partners/${id}`,
      headers ? { headers } : undefined
    );
  },

  /**
   * 파트너 요청 승인/거부 (변호사 프로젝트, Admin/SubAdmin만 가능)
   * PATCH /v1/analysis-partners/{id}/status
   */
  updateStatus(
    id: number,
    payload: UpdateAnalysisPartnerStatusInput,
    headers?: Record<string, string>
  ) {
    return apiClient.patch<UpdateAnalysisPartnerStatusResponse>(
      `/v1/analysis-partners/${id}/status`,
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * 파트너 등록 요청 목록 조회 (변호사 프로젝트, Admin/SubAdmin만 가능)
   * GET /v1/analysis-partners/requests
   */
  listRequests(query: AnalysisPartnerRequestsQuery, headers?: Record<string, string>) {
    return apiClient.get<AnalysisPartnerRequestsResponse>("/v1/analysis-partners/requests", {
      query: {
        page: query.page,
        limit: query.limit,
        ...(query.status != null ? { status: query.status } : {}),
      },
      ...(headers ? { headers } : {}),
    });
  },
};
