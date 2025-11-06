import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { NoticesService } from "@/services/notices";
import { Notice } from "@/types/notices";
import { getErrorMessage } from "@/utils/error";
import { useMyMember } from "@/hooks/useMyMember";

export interface UseNoticeDetailParams {
  noticeId: number | null;
  projectId: string | null;
}

export interface UseNoticeDetailResult {
  /** 공지사항 상세 데이터 */
  notice: Notice | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 포맷된 작성일 (YYYY-MM-DD) */
  formattedDate: string;
  /** 수정 권한 여부 */
  canEdit: boolean;
  /** 삭제 중 상태 */
  deleting: boolean;
  /** 삭제 에러 메시지 */
  deleteError: string | null;
  /** 공지사항 삭제 */
  handleDelete: () => Promise<void>;
}

/**
 * 공지사항 상세 정보를 조회하고 관리하는 훅
 */
export function useNoticeDetail(params: UseNoticeDetailParams): UseNoticeDetailResult {
  const { noticeId, projectId } = params;
  const { member: myMember } = useMyMember(projectId);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(noticeId));
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 공지사항 상세 조회
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

  // 작성일 포맷팅
  const formattedDate = useMemo(() => {
    if (!notice?.createdAt) return "-";
    try {
      return format(new Date(notice.createdAt), "yyyy-MM-dd");
    } catch {
      return "-";
    }
  }, [notice?.createdAt]);

  // 수정 권한 확인
  const canEdit = useMemo(() => {
    if (!notice) return false;
    if (typeof (notice as any).isMyNotice === "boolean") return Boolean((notice as any).isMyNotice);
    if (typeof (notice as any).isMine === "boolean") return Boolean((notice as any).isMine);
    if (myMember?.id && notice.authorId) return myMember.id === notice.authorId;
    return false;
  }, [notice, myMember?.id]);

  // 공지사항 삭제
  const handleDelete = async () => {
    if (!projectId || !notice) return;
    if (!window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await NoticesService.remove(notice.id, projectId);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setDeleting(false);
      throw err; // 호출자가 처리하도록
    }
  };

  return {
    notice,
    loading,
    error,
    formattedDate,
    canEdit,
    deleting,
    deleteError,
    handleDelete,
  };
}

