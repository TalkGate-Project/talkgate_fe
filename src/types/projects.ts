// Projects domain types

import type { ApiSuccess } from "./common";
import type { MemberRole } from "./members";

export enum ProjectSubscriptionStatus {
  None = 'none', // 구독 한 적 없음.
  Active = 'active', // 구독 활성화 상태
  Inactive = 'inactive', // 구독 했다가 끝난 상태
}

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
  role?: MemberRole;
  hasActiveSubscription?: boolean;
  subscriptionStatus?: ProjectSubscriptionStatus;
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

