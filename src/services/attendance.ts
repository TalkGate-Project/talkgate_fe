import { apiClient } from "@/lib/apiClient";

export type AttendanceItem = {
  id: number;
  memberId: number;
  memberName: string;
  teamName: string;
  role: string;
  attendanceAt: string | null;
  leaveAt: string | null;
};

export type AttendanceListResponse = {
  result: true;
  data: {
    attendances: AttendanceItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type MyStatusResponse = {
  result: true;
  data: {
    isCheckedIn: boolean;
    todayAttendance: Record<string, unknown> | null;
  };
};

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


