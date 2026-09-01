import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess } from "@/types/common";
import type {
  CreateProjectAllowedIpPayload,
  ProjectAllowedIpListResponse,
  ProjectAllowedIpResponse,
  UpdateIpRestrictionEnabledPayload,
  UpdateProjectAllowedIpPayload,
} from "@/types/projectAllowedIps";

const BASE_PATH = "/v1/project-allowed-ips";

function buildHeaders(projectId: string | number): Record<string, string> {
  return { "x-project-id": String(projectId) };
}

export const ProjectAllowedIpsService = {
  list(projectId: string | number) {
    return apiClient.get<ProjectAllowedIpListResponse>(BASE_PATH, {
      headers: buildHeaders(projectId),
    });
  },
  create(projectId: string | number, payload: CreateProjectAllowedIpPayload) {
    return apiClient.post<ProjectAllowedIpResponse>(BASE_PATH, payload, {
      headers: buildHeaders(projectId),
    });
  },
  update(
    projectId: string | number,
    id: number,
    payload: UpdateProjectAllowedIpPayload
  ) {
    return apiClient.patch<ProjectAllowedIpResponse>(
      `${BASE_PATH}/${id}`,
      payload,
      { headers: buildHeaders(projectId) }
    );
  },
  remove(projectId: string | number, id: number) {
    return apiClient.delete<ApiSuccess<unknown>>(`${BASE_PATH}/${id}`, {
      headers: buildHeaders(projectId),
    });
  },
  updateEnabled(
    projectId: string | number,
    payload: UpdateIpRestrictionEnabledPayload
  ) {
    return apiClient.patch<ProjectAllowedIpListResponse>(
      `${BASE_PATH}/enabled`,
      payload,
      { headers: buildHeaders(projectId) }
    );
  },
};
