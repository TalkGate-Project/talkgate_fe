"use client";

export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import NoticeSearchPanel from "@/components/notice/NoticeSearchPanel";
import NoticeTable from "@/components/notice/NoticeTable";
import NoticePagination from "@/components/notice/NoticePagination";
import { useFetch } from "@/hooks/useFetch";
import { Notice, NoticeListData, NoticeListResponse } from "@/types/notices";
import { getSelectedProjectId } from "@/lib/project";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ITEMS_PER_PAGE = 10;

function NoticePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  const pageParam = searchParams.get("page");
  const rawTitleParam = searchParams.get("title") ?? "";
  const limitParam = searchParams.get("limit");

  const currentPage = useMemo(() => {
    const parsed = pageParam ? Number(pageParam) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [pageParam]);

  const limit = useMemo(() => {
    const parsed = limitParam ? Number(limitParam) : ITEMS_PER_PAGE;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : ITEMS_PER_PAGE;
  }, [limitParam]);

  useEffect(() => {
    setSearchInput(rawTitleParam);
  }, [rawTitleParam]);

  const baseQuery = useMemo(
    () => ({
      page: currentPage,
      limit,
      title: rawTitleParam.trim() ? rawTitleParam.trim() : undefined,
    }),
    [currentPage, limit, rawTitleParam]
  );

  const detailQueryString = useMemo(() => {
    const paramsClone = new URLSearchParams(searchParams);
    paramsClone.set("page", String(currentPage));
    paramsClone.set("limit", String(limit));
    return paramsClone.toString();
  }, [currentPage, limit, searchParams]);

  const buildNoticeHref = useCallback(
    (notice: Notice) => {
      const qs = detailQueryString;
      return qs ? `/notice/${notice.id}?${qs}` : `/notice/${notice.id}`;
    },
    [detailQueryString]
  );

  const request = useMemo(() => {
    if (!projectId) return null;
    return {
      query: baseQuery,
      headers: { "x-project-id": projectId },
    } as const;
  }, [baseQuery, projectId]);

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

  const notices = data?.notices ?? [];
  const totalPages = data ? Math.max(1, data.totalPages) : 1;

  const persistQuery = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      params.set("limit", String(limit));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [limit, pathname, router, searchParams]
  );

  useEffect(() => {
    if (!data) return;
    const pages = Math.max(1, data.totalPages);
    if (currentPage > pages) {
      persistQuery({ page: pages });
    }
  }, [currentPage, data, persistQuery]);

  const handlePageChange = (page: number) => {
    if (loading) return;
    if (page === currentPage) return;
    persistQuery({ page });
  };

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    persistQuery({ page: 1, title: trimmed || undefined });
  };

  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    const errData = (error as any)?.data;
    if (typeof errData?.message === "string") return errData.message;
    if (typeof errData?.code === "string") return errData.code;
    return "공지사항을 불러오지 못했습니다.";
  }, [error]);

  if (!projectId) return null;

  return (
    <main className="container mx-auto max-w-[1324px] pt-[90px] pb-12 bg-background">
      {/* 검색 및 글쓰기 패널 */}
      <div className="mb-6">
        <NoticeSearchPanel
          searchTerm={searchInput}
          onSearchTermChange={setSearchInput}
          onSearch={handleSearch}
        />
      </div>

      {/* 공지사항 목록 테이블 */}
      <div className="mb-6">
        <NoticeTable
          notices={notices}
          loading={loading}
          buildNoticeHref={buildNoticeHref}
        />
        {errorMessage && (
          <div className="mt-4 rounded-[12px] bg-danger-10 px-4 py-3 text-[14px] text-danger-40">
            {errorMessage}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center">
        <NoticePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
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
