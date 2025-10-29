"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { NoticesService } from "@/services/notices";
import { Notice, NoticeListData } from "@/types/notices";
import { getSelectedProjectId } from "@/lib/project";
import { useMyMember } from "@/hooks/useMyMember";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const data = (error as any)?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.code === "string") return data.code;
  return "요청 처리 중 오류가 발생했습니다.";
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState<string | null>(null);
  const { member: myMember } = useMyMember(projectId);

  const noticeId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return null;
    const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.floor(parsed);
  }, [params]);

  const page = useMemo(() => parsePositiveInt(searchParams.get("page"), 1), [searchParams]);
  const limit = useMemo(() => parsePositiveInt(searchParams.get("limit"), 10), [searchParams]);
  const titleFilter = useMemo(() => {
    const raw = searchParams.get("title") ?? "";
    return raw.trim() ? raw.trim() : undefined;
  }, [searchParams]);

  const listQueryString = useMemo(() => {
    const paramsCopy = new URLSearchParams(searchParams);
    return paramsCopy.toString();
  }, [searchParams]);

  const detailHref = useMemo(() => {
    const suffix = listQueryString ? `?${listQueryString}` : "";
    return {
      toList: `/notices${suffix}`,
      toDetail: (id: number) => `/notice/${id}${suffix}`,
      toEdit: (id: number) => `/notice/write?id=${id}${suffix ? `&${listQueryString}` : ""}`,
    } as const;
  }, [listQueryString]);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(noticeId));
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [listData, setListData] = useState<NoticeListData | null>(null);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  useEffect(() => {
    if (!projectId || !noticeId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await NoticesService.detail(noticeId, projectId);
        if (!cancelled) setNotice(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, noticeId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    (async () => {
      try {
        const data = await NoticesService.list({
          projectId,
          page,
          limit,
          title: titleFilter,
        });
        if (!cancelled) setListData(data);
      } catch (err) {
        if (!cancelled) setListError(getErrorMessage(err));
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, page, limit, titleFilter]);

  const neighbours = useMemo(() => {
    if (!notice || !listData?.notices?.length) {
      return { prev: null, next: null } as const;
    }
    const idx = listData.notices.findIndex((candidate) => candidate.id === notice.id);
    if (idx === -1) return { prev: null, next: null } as const;
    const prev = idx > 0 ? listData.notices[idx - 1] : null;
    const next = idx < listData.notices.length - 1 ? listData.notices[idx + 1] : null;
    return { prev, next } as const;
  }, [listData, notice]);

  const formattedDate = useMemo(() => {
    if (!notice?.createdAt) return "-";
    try {
      return format(new Date(notice.createdAt), "yyyy-MM-dd");
    } catch {
      return "-";
    }
  }, [notice?.createdAt]);

  const canEdit = useMemo(() => {
    if (!notice) return false;
    if (typeof (notice as any).isMyNotice === "boolean") return Boolean((notice as any).isMyNotice);
    if (typeof (notice as any).isMine === "boolean") return Boolean((notice as any).isMine);
    if (myMember?.id && notice.authorId) return myMember.id === notice.authorId;
    return false;
  }, [notice, myMember?.id]);

  const handleBackToList = () => {
    router.push(detailHref.toList);
  };

  const handleEdit = () => {
    if (!notice) return;
    router.push(detailHref.toEdit(notice.id));
  };

  const handleDelete = () => {
    if (!projectId || !notice) return;
    if (!window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;
    setDeleting(true);
    setDeleteError(null);
    void (async () => {
      try {
        await NoticesService.remove(notice.id, projectId);
        router.push(detailHref.toList);
        router.refresh();
      } catch (err) {
        setDeleteError(getErrorMessage(err));
        setDeleting(false);
      }
    })();
  };

  const handlePrevious = () => {
    if (!neighbours.prev) return;
    router.push(detailHref.toDetail(neighbours.prev.id));
  };

  const handleNext = () => {
    if (!neighbours.next) return;
    router.push(detailHref.toDetail(neighbours.next.id));
  };

  if (!projectId) return null;

  if (loading) {
    return (
      <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
        <div className="bg-white rounded-[14px] p-6 text-center" role="status">
          <p className="text-[14px] text-[#808080]">공지사항을 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (error || !notice) {
    return (
      <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
        <div className="bg-white rounded-[14px] p-6 text-center">
          <p className="mb-4 text-[14px] text-[#D83232]">{error || "공지사항을 찾을 수 없습니다."}</p>
          <button
            onClick={handleBackToList}
            className="h-[34px] px-4 bg-[#252525] text-white rounded-[5px] text-[14px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12">
      <div className="bg-white rounded-[14px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="w-6 h-6 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="#252525" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {notice.important && (
              <div className="px-3 py-1 bg-[#FFEBEB] rounded-[30px]">
                <span className="text-[12px] font-medium text-[#D83232]">중요</span>
              </div>
            )}
            <h1 className="text-[24px] font-bold text-[#252525]">{notice.title}</h1>
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59722 21.9983 8.005 21.9983C6.41278 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00167 17.5872 2.00167 15.995C2.00167 14.4028 2.63417 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38778 15.79 1.38778C16.8614 1.38778 17.8794 1.80944 18.63 2.56C19.3806 3.31056 19.8022 4.32856 19.8022 5.4C19.8022 6.47144 19.3806 7.48944 18.63 8.24L9.41 17.46C9.03473 17.8353 8.53127 18.0493 8.005 18.0493C7.47873 18.0493 6.97527 17.8353 6.6 17.46C6.22473 17.0847 6.01071 16.5813 6.01071 16.055C6.01071 15.5287 6.22473 15.0253 6.6 14.65L15.07 6.18"
                  stroke="#B0B0B0"
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
                className="h-[34px] px-3 bg-white border border-[#E2E2E2] text-black rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="h-[34px] px-3 bg-[#252525] text-white rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E2E2] mb-6" />

        <div className="flex items-center gap-6 mb-6 text-[14px] text-[#808080]">
          <div>
            <span className="font-medium">작성일: </span>
            <span>{formattedDate}</span>
          </div>
          <div>
            <span className="font-medium">작성자: </span>
            <span>{notice.authorName || "-"}</span>
          </div>
        </div>

        <div className="border-t border-[#E2E2E2] mb-6" />

        <div className="mb-8 min-h-[400px]">
          <div className="text-[14px] text-[#252525] leading-6 whitespace-pre-line">
            {notice.content}
          </div>
        </div>

        <div className="border-t border-[#E2E2E2] mb-6" />

        {(deleteError || listError) && (
          <div className="mb-4 rounded-[12px] bg-[#FFEBEB] px-4 py-3 text-[13px] text-[#D83232]">
            {deleteError ?? listError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={!neighbours.prev || listLoading || deleting}
              className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19L12 5M5 12L12 5L19 12" stroke="#808080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={!neighbours.next || listLoading || deleting}
              className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5L12 19M19 12L12 19L5 12" stroke="#808080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleBackToList}
            className="h-[34px] px-4 bg-[#252525] text-white rounded-[5px] text-[14px] font-semibold"
          >
            목록으로
          </button>
        </div>
      </div>
    </main>
  );
}
