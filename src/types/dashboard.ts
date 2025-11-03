import type { ApiSuccessResponse } from "./statistics";

export type RecentlyAssignedCustomer = {
  id: number;
  name: string;
  contact1?: string;
  contact2?: string;
  applicationRoute?: string;
  mediaCompany?: string;
  site?: string;
  assignedAt?: string;
  assignedTeamName?: string;
  assignedMemberName?: string;
  messengers?: Array<{
    messenger: string;
    account: string;
  }>;
  [key: string]: unknown;
};

export type RecentlyAssignedCustomersResponse = ApiSuccessResponse<{
  data: RecentlyAssignedCustomer[];
  totalCount: number;
  page?: number;
  limit?: number;
}>;

export type WeeklyScheduleItem = {
  id: number;
  title?: string;
  description?: string;
  scheduleTime?: string; // ISO datetime
  endTime?: string | null;
  allDay?: boolean;
  memberName?: string;
  teamName?: string;
  color?: string | null;
  [key: string]: unknown;
};

export type ScheduleListResponse = ApiSuccessResponse<{
  data: WeeklyScheduleItem[];
  totalCount?: number;
}>;


