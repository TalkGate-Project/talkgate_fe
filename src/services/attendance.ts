import { apiClient } from "@/lib/apiClient";
import type {
  AttendanceItem,
  AttendanceListResponse,
  MyStatusResponse,
} from "@/types/attendance";

export const AttendanceService = {
  checkIn(projectId: string) {
    return apiClient.post<AttendanceItem>("/v1/attendance/check-in", {}, {
      headers: { "x-project-id": projectId },
    });
  },
  checkOut(projectId: string) {
    return apiClient.post<AttendanceItem>("/v1/attendance/check-out", {}, {
      headers: { "x-project-id": projectId },
    });
  },
  list(params: { projectId: string; date: string; page: number; limit: number }) {
    const { projectId, date, page, limit } = params;
    return apiClient.get<AttendanceListResponse>("/v1/attendance/list", {
      query: { date, page, limit },
      headers: { "x-project-id": projectId },
    });
  },
  myStatus(projectId: string) {
    return apiClient.get<MyStatusResponse>("/v1/attendance/my-status", {
      headers: { "x-project-id": projectId },
    });
  },
};
