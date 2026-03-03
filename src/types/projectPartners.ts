// Project Partners (협력업체) domain types

import type { ApiSuccess } from "./common";

export type ProjectPartnerStatus = "pending" | "approved" | "rejected";

/** 협력업체 단일 항목 (목록/추가 응답) */
export type ProjectPartner = {
  id: number;
  projectId: number;
  partnerProjectId: number;
  partnerProjectName: string;
  description: string;
  status: ProjectPartnerStatus;
  createdAt: string;
  updatedAt: string;
};

/** 협력업체 추가 요청 body */
export type CreateProjectPartnerInput = {
  partnerProjectId: number;
  description: string;
};

export type CreateProjectPartnerResponse = ApiSuccess<ProjectPartner>;

/** 협력업체 목록 조회 쿼리 */
export type ProjectPartnerListQuery = {
  page: number;
  limit: number;
  status?: ProjectPartnerStatus;
};

export type ProjectPartnerListResponse = ApiSuccess<{
  list: ProjectPartner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

/** 특정 파트너에게 복제된 고객 목록 조회 쿼리 */
export type ProjectPartnerCopiedCustomersQuery = {
  name?: string;
  page: number;
  limit: number;
};

/** 특정 파트너에게 복제된 고객 목록 단일 항목 */
export type ProjectPartnerCopiedCustomer = {
  customerId: number;
  customerName: string;
  copiedAt: string;
};

/** 특정 파트너에게 복제된 고객 목록 응답 */
export type ProjectPartnerCopiedCustomersResponse = ApiSuccess<{
  list: ProjectPartnerCopiedCustomer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

/** 자신의 프로젝트를 협력업체로 등록한 요청 단일 항목 */
export type ProjectPartnerRequest = {
  id: number;
  projectId: number;
  projectName: string;
  projectLogoUrl: string;
  partnerProjectId: number;
  status: ProjectPartnerStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectPartnerRequestsQuery = {
  page: number;
  limit: number;
  status?: ProjectPartnerStatus;
};

export type ProjectPartnerRequestsResponse = ApiSuccess<{
  list: ProjectPartnerRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

/** 협력업체 요청 상태 변경 (승인/거부) body */
export type UpdateProjectPartnerStatusInput = {
  status: "approved" | "rejected";
};

/** 협력업체 요청 상태 변경 응답 */
export type ProjectPartnerStatusUpdateResult = {
  id: number;
  projectId: number;
  projectName: string;
  projectLogoUrl: string;
  partnerProjectId: number;
  status: ProjectPartnerStatus;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProjectPartnerStatusResponse = ApiSuccess<ProjectPartnerStatusUpdateResult>;

/** API 키 연결 여부 포함 협력업체 항목 */
export type ProjectPartnerWithApiKey = {
  id: number;
  projectId: number;
  partnerProjectId: number;
  partnerProjectName: string;
  description: string;
  status: ProjectPartnerStatus;
  isConnectedToApiKey: boolean;
  createdAt: string;
  updatedAt: string;
};

/** API 키 연결 여부 포함 협력업체 목록 조회 쿼리 */
export type ProjectPartnersWithApiKeyQuery = {
  apiKeyId: number;
  page: number;
  limit: number;
};

export type ProjectPartnersWithApiKeyResponse = ApiSuccess<{
  partners: ProjectPartnerWithApiKey[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;
