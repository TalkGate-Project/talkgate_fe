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

// create/remove/updateStatus/listRequests는 이 프론트엔드에서 사용하지 않는다.
// 변호사 파트너 등록/삭제/승인·거부 플로우는 별도의 임시 외부 admin이 전담하며,
// 이 프로젝트는 승인된 파트너 목록 조회(list)만 담당한다(2026-07-14 확정).
// 향후 이 플로우가 본 프로젝트로 이관되기 전까지는 특별한 지시 없이 아래 메서드들을
// 연동 잔량으로 취급하지 않는다.
export const AnalysisPartnersService = {
  /**
   * 변호사 파트너 추가 (영업 프로젝트, Admin/SubAdmin만 가능)
   * POST /v1/analysis-partners
   * 이 프론트엔드에서 미사용 — 외부 admin이 전담(파일 상단 안내 참고).
   */
  create(payload: CreateAnalysisPartnerInput, headers?: Record<string, string>) {
    return apiClient.post<CreateAnalysisPartnerResponse>(
      "/v1/analysis-partners",
      payload,
      headers ? { headers } : undefined
    );
  },

  /**
   * 변호사 파트너 목록 조회 (영업 프로젝트)
   * GET /v1/analysis-partners
   * 공유 대상 선택용. 프로젝트 멤버라면 누구나 조회 가능(승인된 파트너 필터: status=approved).
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
   * 이 프론트엔드에서 미사용 — 외부 admin이 전담(파일 상단 안내 참고).
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
   * 이 프론트엔드에서 미사용 — 외부 admin이 전담(파일 상단 안내 참고).
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
   * 이 프론트엔드에서 미사용 — 외부 admin이 전담(파일 상단 안내 참고).
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
