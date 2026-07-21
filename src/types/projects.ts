// Projects domain types

import type { ApiSuccess } from "./common";
import type { MemberRole } from "./members";

export enum ProjectSubscriptionStatus {
  None = 'none', // 구독 한 적 없음.
  Active = 'active', // 구독 활성화 상태
  Inactive = 'inactive', // 구독 했다가 끝난 상태
}

/** 프로젝트 타입. general: 일반, analysis: 회생/파산 분석 영업, lawyer: 변호사사무실 */
export type ProjectType = "general" | "analysis" | "lawyer";

/**
 * 프로젝트 단건 타입.
 * GET /v1/projects/{subDomain}, GET /v1/projects/by-id 등 응답 data 필드와 동일.
 */
export type Project = {
  id: number;
  name: string;
  subDomain: string;
  logoUrl?: string | null;
  useAttendanceMenu: boolean;
  /** 데이터 제공자 여부. true면 데이터 제공자, false면 일반 프로젝트 */
  isDataProvider: boolean;
  type: ProjectType;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = Project & {
  memberCount?: number;
  assignedCustomerCount?: number;
  todayScheduleCount?: number;
  myRole?: MemberRole;
  role?: MemberRole;
  hasActiveSubscription?: boolean;
  subscriptionStatus?: ProjectSubscriptionStatus;
};

export type CreateProjectPayload = {
  name: string;
  subDomain?: string;
  logoUrl?: string;
  useAttendanceMenu?: boolean;
  /** 프로젝트 타입. 기본값 general */
  type?: ProjectType;
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

