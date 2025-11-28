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

// UI용 확장/변환 타입 (기존 mockAttendanceData에서 사용)
export interface AttendanceRecord {
  id: number;
  name: string;
  team: string;
  position: string;
  clockIn: string;
  clockOut: string;
  workTime: string;
}

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
    todayAttendance: AttendanceItem | null;
  };
};
