// API Keys domain types

import type { ApiSuccess } from "./common";

export type ApiKey = {
  id: number;
  name: string;
  keyValue: string;
  createdAt: string;
};

export type CreateApiKeyInput = {
  name: string;
};

export type CreateApiKeyResponse = ApiSuccess<ApiKey>;

export type ApiKeyListQuery = {
  page: number;
  limit: number;
};

export type ApiKeyListResponse = ApiSuccess<{
  apiKeys: ApiKey[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

/** API 키 고객 히스토리 항목 - 복제된 협력업체 프로젝트 포함 */
export type ApiKeyCustomerHistoryItem = {
  /** 고객 ID (이메일 등 고객 식별자) */
  customerId: string | number;
  customerName: string;
  customerCreatedAt: string;
  copiedPartnerProjects: Array<{
    projectId: number;
    name: string;
    logoUrl: string;
  }>;
};

/** API 키 고객 히스토리 조회 쿼리 */
export type ApiKeyCustomerHistoryQuery = {
  page: number;
  limit: number;
  projectPartnerId?: number;
};

export type ApiKeyCustomerHistoryResponse = ApiSuccess<{
  items: ApiKeyCustomerHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;
