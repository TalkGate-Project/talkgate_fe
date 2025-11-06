import { apiClient } from "@/lib/apiClient";
import type { ApiSuccessResponse } from "@/types/common";
import type { ScheduleListResponse, WeeklyScheduleItem } from "@/types/dashboard";

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
  create(input: { projectId: string; scheduleTime: string; description: string; colorCode: string }) {
    const { projectId, ...body } = input;
    return apiClient.post<ApiSuccessResponse<WeeklyScheduleItem>>(`/v1/schedules`, body, {
      headers: { "x-project-id": projectId },
    });
  },
};


