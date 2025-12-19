import type { Metadata } from "next";
import NoticeDetailPageContent from "@/components/notice/NoticeDetailPageContent";

export const metadata: Metadata = {
  title: "TalkGate - 공지사항",
};

interface NoticeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params;
  return <NoticeDetailPageContent noticeIdParam={id} />;
}
