export interface AttendanceRecord {
  id: number;
  name: string;
  team: string;
  position: string;
  clockIn: string;
  clockOut: string;
  workTime: string;
}

export const mockAttendanceData: AttendanceRecord[] = [
  {
    id: 1,
    name: "김영업",
    team: "A팀",
    position: "팀장",
    clockIn: "09:42",
    clockOut: "17:22",
    workTime: "7시간 35분"
  },
  {
    id: 2,
    name: "이마케팅",
    team: "B팀",
    position: "팀원",
    clockIn: "09:48",
    clockOut: "17:48",
    workTime: "7시간 59분"
  },
  {
    id: 3,
    name: "박세일즈",
    team: "A팀",
    position: "팀원",
    clockIn: "08:58",
    clockOut: "18:22",
    workTime: "8시간 16분"
  },
  {
    id: 4,
    name: "최고객",
    team: "C팀",
    position: "팀장",
    clockIn: "09:42",
    clockOut: "19:42",
    workTime: "8시간 24분"
  },
  {
    id: 5,
    name: "오과장",
    team: "B팀",
    position: "팀원",
    clockIn: "08:58",
    clockOut: "18:58",
    workTime: "8시간 16분"
  },
  {
    id: 6,
    name: "박사원",
    team: "A팀",
    position: "팀원",
    clockIn: "08:44",
    clockOut: "17:44",
    workTime: "6시간 16분"
  },
  {
    id: 7,
    name: "배정되지않음",
    team: "배정되지않음",
    position: "팀원",
    clockIn: "08:52",
    clockOut: "18:52",
    workTime: "8시간 20분"
  }
];
