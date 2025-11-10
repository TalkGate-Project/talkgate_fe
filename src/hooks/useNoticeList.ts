import { useCallback, useEffect, useMemo } from "react";
import { useFetch } from "@/hooks/useFetch";
import { NoticeListData, NoticeListResponse } from "@/types/notices";
import { formatErrorMessage } from "@/utils/error";

export interface UseNoticeListParams {
  projectId: string | null;
  page: number;
  limit: number;
  title?: string;
}

export interface UseNoticeListResult {
  /** 공지사항 목록 데이터 */
  data: NoticeListData | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 객체 */
  error: unknown;
  /** 에러 메시지 (사용자 표시용) */
  errorMessage: string | null;
  /** 데이터 재조회 */
  refetch: () => Promise<void>;
  /** 공지사항 배열 (빈 배열 보장) */
  notices: NoticeListData["notices"];
  /** 전체 페이지 수 */
  totalPages: number;
}

/**
 * 공지사항 목록을 조회하고 관리하는 훅
 */
export function useNoticeList(params: UseNoticeListParams): UseNoticeListResult {
  const { projectId, page, limit, title } = params;

  const request = useMemo(() => {
    if (!projectId) return null;
    return {
      query: {
        page,
        limit,
        title: title?.trim() || undefined,
      },
      headers: { "x-project-id": projectId },
    } as const;
  }, [projectId, page, limit, title]);

  const select = useCallback((raw: unknown): NoticeListData => {
    const response = raw as NoticeListResponse;
    if (!response?.data) {
      throw new Error("잘못된 공지사항 응답 형식입니다.");
    }
    return response.data;
  }, []);

  const { data, loading, error, refetch } = useFetch<NoticeListData>("/v1/notices", {
    immediate: false,
    request: request ?? undefined,
    select,
  });

  useEffect(() => {
    if (!request) return;
    void refetch();
  }, [request, refetch]);

  const errorMessage = useMemo(() => {
    return formatErrorMessage(error, "공지사항을 불러오지 못했습니다.");
  }, [error]);

  const notices = data?.notices ?? [];
  const totalPages = data ? Math.max(1, data.totalPages) : 1;

  return {
    data,
    loading,
    error,
    errorMessage: error ? errorMessage : null,
    refetch: async () => { await refetch(); },
    notices,
    totalPages,
  };
}

