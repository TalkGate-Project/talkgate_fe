// Analysis Partners (영업 프로젝트 <-> 변호사 프로젝트 분석 공유 파트너) domain types
// src/types/projectPartners.ts(협력업체)와 동일한 승인/거부 워크플로 형태.

import type { ApiSuccess } from "./common";

export type AnalysisPartnerStatus = "pending" | "approved" | "rejected";

/** 분석 파트너 단일 항목 (추가/목록/상태변경 응답 공통) */
export type AnalysisPartner = {
  id: number;
  projectId: number; // 영업 프로젝트 ID
  partnerProjectId: number; // 변호사 프로젝트 ID
  partnerProjectName?: string;
  projectName?: string;
  description?: string;
  status: AnalysisPartnerStatus;
  createdAt: string;
};

/** 변호사 파트너 추가 요청 body */
export type CreateAnalysisPartnerInput = {
  partnerProjectId: number;
  description?: string;
};

export type CreateAnalysisPartnerResponse = ApiSuccess<AnalysisPartner>;

/** 변호사 파트너 목록 조회 쿼리 (영업 프로젝트 시점, 프로젝트 멤버 조회 가능) */
export type AnalysisPartnerListQuery = {
  status?: AnalysisPartnerStatus;
  page?: number;
  limit?: number;
};

export type AnalysisPartnerListResponse = ApiSuccess<{
  partners: AnalysisPartner[];
  total: number;
  page: number;
  limit: number;
}>;

export type RemoveAnalysisPartnerResponse = ApiSuccess<Record<string, never>>;

/** 파트너 요청 승인/거부 body (변호사 프로젝트 시점) */
export type UpdateAnalysisPartnerStatusInput = {
  status: "approved" | "rejected";
};

export type UpdateAnalysisPartnerStatusResponse = ApiSuccess<AnalysisPartner>;

/** 파트너 등록 요청 목록 조회 쿼리 (변호사 프로젝트 시점) */
export type AnalysisPartnerRequestsQuery = {
  status?: AnalysisPartnerStatus;
  page?: number;
  limit?: number;
};

export type AnalysisPartnerRequestsResponse = ApiSuccess<{
  partners: AnalysisPartner[];
  total: number;
  page: number;
  limit: number;
}>;
