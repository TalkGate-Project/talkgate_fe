import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { parsePositiveInt } from "@/utils/format";

const DEFAULT_LIMIT = 10;

export interface NoticeQueryParams {
  page: number;
  limit: number;
  title?: string;
}

export interface UseNoticeQueryParamsResult {
  /** 현재 페이지 번호 */
  page: number;
  /** 페이지당 항목 수 */
  limit: number;
  /** 제목 검색어 */
  title?: string;
  /** 쿼리 스트링 (전체) */
  queryString: string;
  /** 쿼리 파라미터 업데이트 */
  updateQuery: (updates: Record<string, string | number | undefined | null>) => void;
  /** 공지사항 상세 페이지 URL 생성 */
  buildDetailUrl: (noticeId: number) => string;
  /** 공지사항 목록 페이지 URL */
  listUrl: string;
}

/**
 * 공지사항 관련 URL 쿼리 파라미터를 관리하는 훅
 */
export function useNoticeQueryParams(): UseNoticeQueryParamsResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(
    () => parsePositiveInt(searchParams.get("page"), 1),
    [searchParams]
  );

  const limit = useMemo(
    () => parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
    [searchParams]
  );

  const title = useMemo(() => {
    const raw = searchParams.get("title") ?? "";
    return raw.trim() ? raw.trim() : undefined;
  }, [searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.toString();
  }, [searchParams]);

  const updateQuery = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      // limit은 항상 유지
      if (!params.has("limit")) {
        params.set("limit", String(limit));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [limit, pathname, router, searchParams]
  );

  const buildDetailUrl = useCallback(
    (noticeId: number) => {
      const qs = queryString;
      return qs ? `/notice/${noticeId}?${qs}` : `/notice/${noticeId}`;
    },
    [queryString]
  );

  const listUrl = useMemo(() => {
    const qs = queryString;
    return qs ? `/notices?${qs}` : "/notices";
  }, [queryString]);

  return {
    page,
    limit,
    title,
    queryString,
    updateQuery,
    buildDetailUrl,
    listUrl,
  };
}

