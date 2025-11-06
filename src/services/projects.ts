import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess } from "@/types/common";
import type {
  Project,
  ProjectSummary,
  CreateProjectPayload,
  UpdateProjectPayload,
  CheckSubDomainDuplicateResponse,
  ApiKeyResponse,
  ExternalApiEndpointResponse,
} from "@/types/projects";

export const ProjectsService = {
  create(payload: CreateProjectPayload) {
    return apiClient.post<ApiSuccess<Project>>("/v1/projects", payload);
  },
  update(payload: UpdateProjectPayload, headers?: Record<string, string>) {
    return apiClient.patch<ApiSuccess<Project>>("/v1/projects", payload, headers ? { headers } : undefined);
  },
  remove(headers?: Record<string, string>) {
    return apiClient.delete<ApiSuccess<Project>>("/v1/projects", headers ? { headers } : undefined);
  },
  list(query?: Record<string, string | number | boolean>) {
    return apiClient.get<ApiSuccess<ProjectSummary[]>>("/v1/projects", { query });
  },
  detailBySubDomain(subDomain: string, headers?: Record<string, string>) {
    return apiClient.get<ApiSuccess<Project>>(`/v1/projects/${subDomain}`, headers ? { headers } : undefined);
  },
  detailById(headers?: Record<string, string>) {
    return apiClient.get<ApiSuccess<Project>>("/v1/projects/by-id", headers ? { headers } : undefined);
  },
  checkSubDomainDuplicate(subDomain: string) {
    return apiClient.post<CheckSubDomainDuplicateResponse>(
      "/v1/projects/check-sub-domain-duplicate",
      { subDomain }
    );
  },
  getApiKey(headers?: Record<string, string>) {
    return apiClient.get<ApiKeyResponse>("/v1/projects/api-key", headers ? { headers } : undefined);
  },
  regenerateApiKey(headers?: Record<string, string>) {
    return apiClient.post<ApiKeyResponse>("/v1/projects/api-key/regenerate", {}, headers ? { headers } : undefined);
  },
  getExternalApiEndpoint(headers?: Record<string, string>) {
    return apiClient.get<ExternalApiEndpointResponse>("/v1/projects/external-api-endpoint", headers ? { headers } : undefined);
  },
  myProfile(query?: Record<string, string | number | boolean>) {
    return apiClient.get<ApiSuccess<unknown>>("/v1/projects/profile", { query });
  },
};
