"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Checkbox from "@/components/common/Checkbox";
import { NoticesService } from "@/services/notices";
import { getSelectedProjectId } from "@/lib/project";
import { useMyMember } from "@/hooks/useMyMember";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const data = (error as any)?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.code === "string") return data.code;
  return "요청 처리 중 오류가 발생했습니다.";
}

function NoticeWritePageContentInner() {
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

  const { isAdminOrSubAdmin, loading: memberLoading } = useMyMember(projectId);

  // 권한 체크: admin 또는 subAdmin만 접근 가능
  useEffect(() => {
    if (!projectId || memberLoading) return;
    if (!isAdminOrSubAdmin) {
      showErrorModal({
        type: "error",
        headline: "공지사항 작성 권한이 없습니다. 관리자 또는 부관리자만 작성할 수 있습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      router.replace("/notices");
    }
  }, [projectId, memberLoading, isAdminOrSubAdmin, router]);

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

  // 권한이 없으면 아무것도 렌더링하지 않음 (리다이렉트 처리 중)
  if (!memberLoading && !isAdminOrSubAdmin) {
    return null;
  }

  return (
    <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
      <div className="bg-card rounded-[14px] py-[26px]">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6 px-7">
          <div className="flex items-center gap-4">
            <h1 className="text-[24px] font-bold text-foreground">
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
              <span className="text-[18px] font-medium text-neutral-60">
                이 공지사항을 중요 공지로 설정
              </span>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="cursor-pointer w-[66px] h-[34px] bg-card border border-border text-foreground rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] transition-colors hover:bg-neutral-10"
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={submitting || loading}
              className="cursor-pointer w-[66px] h-[34px] bg-foreground text-card rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] disabled:opacity-60 transition-colors hover:opacity-90"
            >
              {submitting ? "저장 중..." : isEditMode ? "수정" : "저장"}
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-neutral-30 mb-8" />

        <div className="px-7">
          {error && (
          <div className="mb-6 rounded-[12px] bg-danger-10 px-4 py-3 text-[14px] text-danger-40">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[14px] text-neutral-60">공지사항을 불러오는 중입니다...</div>
        ) : (
          <>
            {/* 제목 입력 */}
            <div className="mb-5">
              <label className="block text-[14px] font-medium text-neutral-60 leading-[1] mb-2">
                제목
              </label>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] text-foreground placeholder:text-neutral-60 bg-card focus:outline-none focus:border-foreground disabled:bg-neutral-10 disabled:text-neutral-60"
              />
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-[14px] font-medium text-neutral-60 leading-[1] mb-2">
                내용
              </label>
              <textarea
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting}
                className="w-full h-[407px] px-3 py-3 border border-neutral-30 rounded-[5px] text-[14px] text-foreground placeholder:text-neutral-60 bg-card focus:outline-none focus:border-foreground resize-none disabled:bg-neutral-10 disabled:text-neutral-60"
              />
            </div>
          </>
        )}
        </div>
      </div>
    </main>
  );
}

export default function NoticeWritePageContent() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
          <div className="bg-card rounded-[14px] p-6">
            <div className="text-center text-neutral-60">불러오는 중...</div>
          </div>
        </main>
      }
    >
      <NoticeWritePageContentInner />
    </Suspense>
  );
}

