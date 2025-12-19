import type { Metadata } from "next";
import NoticeWritePageContent from "@/components/notice/NoticeWritePageContent";

interface NoticeWritePageProps {
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ searchParams }: NoticeWritePageProps): Promise<Metadata> {
  const { id } = await searchParams;
  const isEditMode = Boolean(id);
  return {
    title: isEditMode ? "TalkGate - 공지사항 수정" : "TalkGate - 공지사항 작성",
  };
}

export default function NoticeWritePage() {
  return <NoticeWritePageContent />;
}
