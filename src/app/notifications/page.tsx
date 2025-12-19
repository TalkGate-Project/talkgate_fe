import type { Metadata } from "next";
import NotificationsPageContent from "@/components/notifications/NotificationsPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 알림",
};

export default function NotificationsPage() {
  return <NotificationsPageContent />;
}
