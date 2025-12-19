import type { Metadata } from "next";
import AttendancePageContent from "@/components/attendance/AttendancePageContent";

export const metadata: Metadata = {
  title: "TalkGate - 근태",
};

export default function AttendancePage() {
  return <AttendancePageContent />;
}
