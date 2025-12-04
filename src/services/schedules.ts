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
  remove(input: { projectId: string; scheduleId: number }) {
    const { projectId, scheduleId } = input;
    return apiClient.delete<ApiSuccessResponse<null>>(`/v1/schedules/${scheduleId}`, {
      headers: { "x-project-id": projectId },
    });
  },
  create(input: { projectId: string; scheduleTime: string; description: string; colorCode: string }) {
    const { projectId, colorCode, ...rest } = input;
    // colorCode에 # 접두사 보장
    const normalizedColorCode = colorCode?.startsWith("#") ? colorCode : `#${colorCode}`;
    return apiClient.post<ApiSuccessResponse<WeeklyScheduleItem>>(`/v1/schedules`, { ...rest, colorCode: normalizedColorCode }, {
      headers: { "x-project-id": projectId },
    });
  },
  update(input: { projectId: string; scheduleId: number; scheduleTime: string; description: string; colorCode: string }) {
    const { projectId, scheduleId, colorCode, ...rest } = input;
    // colorCode에 # 접두사 보장
    const normalizedColorCode = colorCode?.startsWith("#") ? colorCode : `#${colorCode}`;
    return apiClient.patch<ApiSuccessResponse<WeeklyScheduleItem>>(`/v1/schedules/${scheduleId}`, { ...rest, colorCode: normalizedColorCode }, {
      headers: { "x-project-id": projectId },
    });
  },
};


