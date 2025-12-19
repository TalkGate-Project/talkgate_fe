import type { Metadata } from "next";
import NoticesPageContent from "@/components/notice/NoticesPageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TalkGate - 공지사항",
};

export default function NoticePage() {
  return <NoticesPageContent />;
}
