import type { ApiSuccessResponse } from "./common";
import type { RecentNote, AssignedMember } from "./customers";

export type RecentlyAssignedCustomer = {
  id: number;
  name: string;
  contact1?: string | null;
  contact2?: string | null;
  applicationRoute?: string | null;
  mediaCompany?: string | null;
  site?: string | null;
  assignedMember?: AssignedMember | null;
  assignedAt?: string | null;
  assignedTeamName?: string | null;
  assignedMemberName?: string | null;
  applicationDate?: string | null;
  status?: string | null; // e.g., "pending", "unconfirmed", "confirmed"
  createdAt?: string | null;
  recentNotes?: RecentNote[] | null;
  messengers?: Array<{
    messenger: string;
    account: string;
  }>;
  [key: string]: unknown;
};

export type RecentlyAssignedCustomersResponse = ApiSuccessResponse<{
  customers: RecentlyAssignedCustomer[] | null;
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
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


