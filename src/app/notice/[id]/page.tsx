"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSelectedProjectId } from "@/lib/project";
import { useNoticeQueryParams } from "@/hooks/useNoticeQueryParams";
import { useNoticeDetail } from "@/hooks/useNoticeDetail";
import { useNoticeList } from "@/hooks/useNoticeList";
import { useNoticeNeighbours } from "@/hooks/useNoticeNeighbours";
import NoticeDetailSkeleton from "@/components/notice/NoticeDetailSkeleton";

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [projectId, setProjectId] = useState<string | null>(null);

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

  const noticeId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return null;
    const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.floor(parsed);
  }, [params]);

  const { page, limit, title, queryString, buildDetailUrl, listUrl } = useNoticeQueryParams();

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
    const editUrl = `/notice/write?id=${notice.id}${queryString ? `&${queryString}` : ""}`;
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

  if (!projectId) return null;

  if (loading) {
    return <NoticeDetailSkeleton />;
  }

  if (error || !notice) {
    return (
      <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
        <div className="bg-card rounded-[14px] p-6 text-center">
          <p className="mb-4 text-[14px] text-danger-40">{error || "공지사항을 찾을 수 없습니다."}</p>
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
    <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
      <div className="bg-card rounded-[14px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="w-6 h-6 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="var(--neutral-90)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {notice.important && (
              <div className="px-3 py-1 bg-danger-10 rounded-[30px]">
                <span className="text-[12px] font-medium text-danger-40">중요</span>
              </div>
            )}
            <h1 className="text-[24px] font-bold text-foreground">{notice.title}</h1>
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00167 17.5872 2.00167 15.995C2.00167 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38778 15.79 1.38778C16.8614 1.38778 17.8794 1.80944 18.63 2.56C19.3806 3.31056 19.8022 4.32856 19.8022 5.4C19.8022 6.47144 19.3806 7.48944 18.63 8.24L9.41 17.46C9.03473 17.8353 8.53127 18.0493 8.005 18.0493C7.47873 18.0493 6.97527 17.8353 6.6 17.46C6.22473 17.0847 6.01071 16.5813 6.01071 16.055C6.01071 15.5287 6.22473 15.0253 6.6 14.65L15.07 6.18"
                  stroke="var(--neutral-50)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="h-[34px] px-3 bg-card border border-border text-foreground rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                수정
              </button>
              <button
                onClick={handleDeleteWithRedirect}
                className="h-[34px] px-3 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border mb-6" />

        <div className="flex items-center gap-6 mb-6 text-[14px] text-neutral-60">
          <div>
            <span className="font-medium">작성일: </span>
            <span>{formattedDate}</span>
          </div>
          <div>
            <span className="font-medium">작성자: </span>
            <span>{notice.authorName || "-"}</span>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-8 min-h-[400px]">
          <div className="text-[14px] text-foreground leading-6 whitespace-pre-line">
            {notice.content}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {(deleteError || listErrorMessage) && (
          <div className="mb-4 rounded-[12px] bg-danger-10 px-4 py-3 text-[13px] text-danger-40">
            {deleteError ?? listErrorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={!neighbours.prev || listLoading || deleting}
              className="w-8 h-8 bg-neutral-20 rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19L12 5M5 12L12 5L19 12" stroke="var(--neutral-60)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={!neighbours.next || listLoading || deleting}
              className="w-8 h-8 bg-neutral-20 rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5L12 19M19 12L12 19L5 12" stroke="var(--neutral-60)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleBackToList}
            className="h-[34px] px-4 bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </div>
    </main>
  );
}
