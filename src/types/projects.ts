// Projects domain types

import type { ApiSuccess } from "./common";

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

export type UpdateProjectPayload = {
  name?: string;
  logoUrl?: string;
  subDomain?: string;
  useAttendanceMenu?: boolean;
};

export type CheckSubDomainDuplicateResponse = ApiSuccess<{
  isDuplicate: boolean;
  message?: string;
}>;

export type ApiKeyResponse = ApiSuccess<{
  apiKey: string;
}>;

export type ExternalApiEndpointResponse = ApiSuccess<{
  endpoint: string;
}>;

