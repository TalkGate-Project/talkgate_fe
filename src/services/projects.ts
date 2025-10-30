import { apiClient } from "@/lib/apiClient";

export type ApiSuccess<T> = {
  result: true;
  data: T;
};

export type ApiError = {
  result: false;
  code: string;
  message: string;
  traceId?: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type Project = {
  id: number;
  name: string;
  subDomain: string;
  logoUrl?: string | null;
  useAttendanceMenu: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = Project & {
  memberCount?: number;
  assignedCustomerCount?: number;
  todayScheduleCount?: number;
};

export type CreateProjectPayload = {
  name: string;
  subDomain?: string;
  logoUrl?: string;
  useAttendanceMenu?: boolean;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export type CheckSubDomainDuplicateResponse = ApiSuccess<{
  isDuplicate: boolean;
  message?: string;
}>;

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
  checkSubDomainDuplicate(subDomain: string) {
    return apiClient.post<CheckSubDomainDuplicateResponse>(
      "/v1/projects/check-sub-domain-duplicate",
      { subDomain }
    );
  },
  myProfile(query?: Record<string, string | number | boolean>) {
    return apiClient.get<ApiSuccess<unknown>>("/v1/projects/profile", { query });
  },
};


