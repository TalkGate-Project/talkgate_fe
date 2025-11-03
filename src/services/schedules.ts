import { apiClient } from "@/lib/apiClient";
import type { ScheduleListResponse } from "@/types/dashboard";

export type ScheduleListQuery = {
  projectId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  memberId?: number;
  teamId?: number;
};

export const SchedulesService = {
  list(query: ScheduleListQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<ScheduleListResponse>(`/v1/schedules`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },
};


