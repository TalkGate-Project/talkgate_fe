"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NoticeSearchPanel from "@/components/notice/NoticeSearchPanel";
import NoticeTable from "@/components/notice/NoticeTable";
import Pagination from "@/components/common/Pagination";
import { getSelectedProjectId } from "@/lib/project";
import { useNoticeQueryParams } from "@/hooks/useNoticeQueryParams";
import { useNoticeList } from "@/hooks/useNoticeList";

function NoticePageContent() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    document.title = "TalkGate - 공지사항";
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  const { page, limit, title, updateQuery, buildDetailUrl } = useNoticeQueryParams();
  const { notices, loading, errorMessage, totalPages, data } = useNoticeList({
    projectId,
    page,
    limit,
    title,
  });

  // 검색어를 URL 파라미터와 동기화
  useEffect(() => {
    setSearchInput(title || "");
  }, [title]);

  // 페이지가 전체 페이지 수를 초과하면 마지막 페이지로 이동
  useEffect(() => {
    if (!data) return;
    const maxPage = Math.max(1, data.totalPages);
    if (page > maxPage) {
      updateQuery({ page: maxPage });
    }
  }, [page, data, updateQuery]);

  const handlePageChange = (newPage: number) => {
    if (loading || newPage === page) return;
    updateQuery({ page: newPage });
  };

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    updateQuery({ page: 1, title: trimmed || undefined });
  };

  if (!projectId) return null;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-6 pb-12">
        {/* 검색 및 글쓰기 패널 */}
        <NoticeSearchPanel
          searchTerm={searchInput}
          onSearchTermChange={setSearchInput}
          onSearch={handleSearch}
        />

        {/* 공지사항 목록 테이블 */}
        <div className="mt-4">
          <NoticeTable
            notices={notices ?? []}
            loading={loading}
            buildNoticeHref={(notice) => buildDetailUrl(notice.id)}
          />
          {errorMessage && (
            <div className="mt-4 rounded-[12px] bg-danger-10 px-4 py-3 text-[14px] text-danger-40">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </div>
      </div>
    </main>
  );
}

export default function NoticePage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12 text-[var(--neutral-60)]">
          공지사항을 불러오는 중입니다...
        </main>
      }
    >
      <NoticePageContent />
    </Suspense>
  );
}
