// Attendance domain types

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

