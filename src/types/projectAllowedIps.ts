import type { ApiSuccess } from "./common";

export type ProjectAllowedIp = {
  id: number;
  value: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectAllowedIpList = {
  isEnabled: boolean;
  currentIp: string;
  list: ProjectAllowedIp[];
};

export type CreateProjectAllowedIpPayload = {
  value: string;
  memo: string;
};

export type UpdateProjectAllowedIpPayload = {
  value: string;
  memo: string;
};

export type UpdateIpRestrictionEnabledPayload = {
  enabled: boolean;
};

export type ProjectAllowedIpResponse = ApiSuccess<ProjectAllowedIp>;
export type ProjectAllowedIpListResponse = ApiSuccess<ProjectAllowedIpList>;
