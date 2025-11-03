import { apiClient } from "@/lib/apiClient";
import type { ScheduleListResponse } from "@/types/dashboard";

export type ScheduleListQuery = {
  projectId: string;
  year: number;
  month: number; // 1-12
};

export const SchedulesService = {
  list(query: ScheduleListQuery) {
    const { projectId, year, month } = query;
    return apiClient.get<ScheduleListResponse>(`/v1/schedules`, {
      query: { year, month },
      headers: { "x-project-id": projectId },
    });
  },
};


