import { apiClient } from "@/lib/apiClient";
import type { ApiSuccess } from "@/types/common";
import type {
  ProjectPrivacyConsent,
  ProjectPrivacyConsentStatus,
} from "@/types/projectPrivacyConsent";

const BASE_PATH = "/v1/project-privacy-processing-consents";

function buildHeaders(projectId: string | number): Record<string, string> {
  return { "x-project-id": String(projectId) };
}

export const ProjectPrivacyConsentService = {
  get(projectId: string | number) {
    return apiClient.get<ApiSuccess<ProjectPrivacyConsentStatus>>(BASE_PATH, {
      headers: buildHeaders(projectId),
    });
  },
  create(projectId: string | number) {
    return apiClient.post<ApiSuccess<ProjectPrivacyConsent>>(
      BASE_PATH,
      undefined,
      { headers: buildHeaders(projectId) }
    );
  },
};
