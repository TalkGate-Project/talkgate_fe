"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSelectedProjectId } from "@/lib/project";
import { useNoticeQueryParams } from "@/hooks/useNoticeQueryParams";
import { useNoticeDetail } from "@/hooks/useNoticeDetail";
import { useNoticeList } from "@/hooks/useNoticeList";
import { useNoticeNeighbours } from "@/hooks/useNoticeNeighbours";
import NoticeDetailSkeleton from "@/components/notice/NoticeDetailSkeleton";

interface NoticeDetailPageContentProps {
  noticeIdParam: string;
}

export default function NoticeDetailPageContent({ noticeIdParam }: NoticeDetailPageContentProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후에만 조건부 렌더링 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  const noticeId = useMemo(() => {
    if (!noticeIdParam) return null;
    const parsed = Number(noticeIdParam);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.floor(parsed);
  }, [noticeIdParam]);

  const { page, limit, title, queryString, buildDetailUrl, listUrl } =
    useNoticeQueryParams();

  const {
    notice,
    loading,
    error,
    formattedDate,
    canEdit,
    deleting,
    deleteError,
    handleDelete,
  } = useNoticeDetail({ noticeId, projectId });

  const {
    data: listData,
    loading: listLoading,
    errorMessage: listErrorMessage,
  } = useNoticeList({
    projectId,
    page,
    limit,
    title,
  });

  const neighbours = useNoticeNeighbours(notice, listData);

  const handleBackToList = () => {
    router.push(listUrl);
  };

  const handleEdit = () => {
    if (!notice) return;
    const editUrl = `/notice/write?id=${notice.id}${
      queryString ? `&${queryString}` : ""
    }`;
    router.push(editUrl);
  };

  const handleDeleteWithRedirect = async () => {
    try {
      await handleDelete();
      router.push(listUrl);
      router.refresh();
    } catch {
      // handleDelete already handles error state
    }
  };

  const handlePrevious = () => {
    if (!neighbours.prev) return;
    router.push(buildDetailUrl(neighbours.prev.id));
  };

  const handleNext = () => {
    if (!neighbours.next) return;
    router.push(buildDetailUrl(neighbours.next.id));
  };

  const getNoticeErrorMessage = () => {
    if (!error && !notice) return "찾을 수 없는 게시물입니다.";
    const rawError = (error || "").toLowerCase();
    if (
      rawError.includes("404") ||
      rawError.includes("not found") ||
      rawError.includes("찾을 수 없")
    ) {
      return "찾을 수 없는 게시물입니다.";
    }
    if (rawError.includes("delete") || rawError.includes("삭제")) {
      return "삭제된 게시물입니다.";
    }
    return "공지사항을 불러오지 못했습니다.";
  };

  if (!projectId) return null;

  // 서버와 클라이언트 초기 렌더링을 일치시키기 위해 첫 렌더링에서는 항상 같은 구조 유지
  // 클라이언트 마운트 후에만 로딩 스켈레톤 표시
  if (mounted && loading) {
    return <NoticeDetailSkeleton />;
  }

  if (error || !notice) {
    return (
      <main className="container mx-auto max-w-[1324px] md:pt-6 md:pb-12">
        <div className="bg-card rounded-none md:rounded-[14px] p-4 md:p-6 text-center">
          <p className="mb-4 text-[14px] text-danger-40">
            {getNoticeErrorMessage()}
          </p>
          <button
            onClick={handleBackToList}
            className="h-[34px] px-4 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-[1324px] px-0 md:px-6 lg:px-0 md:pt-6 md:pb-12">
      <div className="bg-card rounded-none md:rounded-[14px] px-4 md:px-7 py-4 md:py-[22px]">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={handleBackToList}
              className="cursor-pointer w-[34px] h-[34px] flex items-center justify-center flex-shrink-0"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="dark:stroke-neutral-60"
                />
              </svg>
            </button>
            <h1 className="text-[18px] md:text-[24px] font-bold text-foreground">
              공지사항
            </h1>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleEdit}
                className="cursor-pointer w-[66px] h-[34px] bg-card border border-border text-foreground rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                수정
              </button>
              <button
                onClick={handleDeleteWithRedirect}
                className="cursor-pointer w-[66px] h-[34px] bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border mb-4 md:mb-5" />

        {/* 중요 태그 및 제목 */}
        <div className="mb-4 md:mb-5">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            {notice.important && (
              <div className="h-[22px] px-3 bg-danger-10 rounded-[30px] flex-shrink-0 inline-flex items-center justify-center">
                <span className="text-[12px] font-medium text-danger-40 leading-none">
                  중요
                </span>
              </div>
            )}
            <h2 className="text-[18px] md:text-[24px] font-bold text-foreground">
              {notice.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-5 text-[14px] text-neutral-60">
          <div className="leading-[1]">
            <span className="font-medium">작성일: </span>
            <span>{formattedDate}</span>
          </div>
          <div className="leading-[1]">
            <span className="font-medium">작성자: </span>
            <span>{notice.authorName || "-"}</span>
          </div>
        </div>

        <div className="border-t border-border mb-6 md:mb-[30px]" />

        <div className="mb-6 md:mb-8 min-h-[400px]">
          <div className="text-[14px] text-foreground leading-6 whitespace-pre-line">
            {notice.content}
          </div>
        </div>

        <div className="border-t border-border mb-4 md:mb-6" />

        {(deleteError || listErrorMessage) && (
          <div className="mb-4 rounded-[12px] bg-danger-10 px-4 py-3 text-[13px] text-danger-40">
            {deleteError ?? listErrorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handlePrevious}
              disabled={!neighbours.prev || listLoading || deleting}
              className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="35.5"
                  y="0.5"
                  width="35"
                  height="35"
                  rx="5.5"
                  transform="rotate(90 35.5 0.5)"
                  className="fill-white dark:fill-[#111111] stroke-[#E2E2E2] dark:stroke-[#4D4D4D]"
                />
                <path
                  d="M11.1914 21L18.1914 14L25.1914 21"
                  stroke="#B0B0B0"
                  className="dark:stroke-[#959595]"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={!neighbours.next || listLoading || deleting}
              className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="35"
                  height="35"
                  rx="5.5"
                  transform="matrix(0 -1 -1 0 36 36)"
                  className="fill-white dark:fill-[#111111] stroke-[#E2E2E2] dark:stroke-[#4D4D4D]"
                />
                <path
                  d="M11.1914 15L18.1914 22L25.1914 15"
                  stroke="#B0B0B0"
                  className="dark:stroke-[#959595]"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={handleBackToList}
            className="cursor-pointer w-[72px] h-[34px] bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </div>
    </main>
  );
}




