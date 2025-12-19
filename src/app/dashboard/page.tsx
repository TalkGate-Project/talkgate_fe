import type { Metadata } from "next";
import DashboardPageContent from "@/components/dashboard/DashboardPageContent";

export const metadata: Metadata = {
  title: "TalkGate",
};

export default function DashboardPage() {
  return <DashboardPageContent />;
}
