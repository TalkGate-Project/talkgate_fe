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
