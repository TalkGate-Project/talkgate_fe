"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Checkbox from "@/components/common/Checkbox";
import { NoticesService } from "@/services/notices";
import { getSelectedProjectId } from "@/lib/project";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const data = (error as any)?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.code === "string") return data.code;
  return "요청 처리 중 오류가 발생했습니다.";
}

function NoticeWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const noticeIdParam = searchParams.get("id");
  const noticeId = useMemo(() => {
    if (!noticeIdParam) return null;
    const parsed = Number(noticeIdParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [noticeIdParam]);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    document.title = noticeId ? "TalkGate - 공지사항 수정" : "TalkGate - 공지사항 작성";
  }, [noticeId]);
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState<boolean>(Boolean(noticeId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  useEffect(() => {
    if (!projectId) return;
    if (!noticeId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const notice = await NoticesService.detail(noticeId, projectId);
        if (cancelled) return;
        setTitle(notice.title ?? "");
        setContent(notice.content ?? "");
        setIsImportant(Boolean(notice.important));
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, noticeId]);

  const isEditMode = Boolean(noticeId);

  const handleCancel = () => {
    router.push("/notices");
  };

  const handleSave = async () => {
    if (!projectId) return;
    const trimmedTitle = title.trim();
    const hasContent = content.trim();
    if (!trimmedTitle) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!hasContent) {
      setError("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (isEditMode && noticeId) {
        await NoticesService.update(noticeId, {
          projectId,
          title: trimmedTitle,
          content,
          important: isImportant,
        });
      } else {
        await NoticesService.create({
          projectId,
          title: trimmedTitle,
          content,
          important: isImportant,
        });
      }
      router.push("/notices");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!projectId) return null;

  return (
    <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
      <div className="bg-white rounded-[14px] p-6">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-bold text-[#252525]">
              {isEditMode ? "공지사항 수정" : "공지사항"}
            </h1>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isImportant}
                onChange={setIsImportant}
                size={24}
                ariaLabel="중요 공지 설정"
                disabled={submitting}
              />
              <span className="text-[18px] font-medium text-[#808080]">
                이 공지사항을 중요 공지로 설정
              </span>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="h-[34px] px-3 bg-white border border-[#E2E2E2] text-black rounded-[5px] text-[14px] font-semibold"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={submitting || loading}
              className="h-[34px] px-3 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold disabled:opacity-60"
            >
              {submitting ? "저장 중..." : isEditMode ? "수정" : "저장"}
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-[#E2E2E2] mb-6" />

        {error && (
          <div className="mb-6 rounded-[12px] bg-[#FFEBEB] px-4 py-3 text-[14px] text-[#D83232]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[14px] text-[#808080]">공지사항을 불러오는 중입니다...</div>
        ) : (
          <>
            {/* 제목 입력 */}
            <div className="mb-6">
              <label className="block text-[14px] font-medium text-[#808080] mb-2">
                제목
              </label>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full h-[34px] px-3 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] placeholder:text-[#808080] focus:outline-none focus:border-[#252525] disabled:bg-[#F5F5F5] disabled:text-[#808080]"
              />
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-[14px] font-medium text-[#808080] mb-2">
                내용
              </label>
              <textarea
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting}
                className="w-full h-[407px] px-3 py-3 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#252525] placeholder:text-[#808080] focus:outline-none focus:border-[#252525] resize-none disabled:bg-[#F5F5F5] disabled:text-[#808080]"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function NoticeWritePageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
          <div className="bg-white rounded-[14px] p-6">
            <div className="text-center text-[#808080]">불러오는 중...</div>
          </div>
        </main>
      }
    >
      <NoticeWritePage />
    </Suspense>
  );
}
