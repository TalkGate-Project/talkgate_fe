import type { ApiSuccessResponse } from "./common";

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
  data: RecentlyAssignedCustomer[] | null; // null when no data
  totalCount: number;
  page?: number;
  limit?: number;
}>;

export type WeeklyScheduleItem = {
  id: number;
  scheduleTime: string; // ISO datetime
  description: string;
  colorCode: string;
  customer?: {
    id: number;
    name: string;
  };
  createdAt: string;
  // Backward compatibility fields
  title?: string;
  endTime?: string | null;
  allDay?: boolean;
  memberName?: string;
  teamName?: string;
  color?: string | null;
};

export type ScheduleListResponse = ApiSuccessResponse<{
  schedules: WeeklyScheduleItem[] | null; // null when no data
}>;


