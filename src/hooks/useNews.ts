"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NewsService } from "@/services/news";
import type { NewsArticle } from "@/types/news";

const NEWS_PAGE_LIMIT = 20;

// 뉴스 무한스크롤 목록. enabled가 true로 바뀔 때(드로워가 열릴 때)마다 처음부터 새로 불러온다 —
// enabled가 false로 돌아가면 다음에 열릴 때 다시 불러오도록 로드 플래그만 리셋한다.
export function useNewsList(enabled: boolean) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      loadedRef.current = false;
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    setLoading(true);
    setError(null);

    NewsService.list({ limit: NEWS_PAGE_LIMIT })
      .then((result) => {
        if (cancelled) return;
        setArticles(result.articles);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load news list:", err);
        setError(err);
        setArticles([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    NewsService.list({ limit: NEWS_PAGE_LIMIT, cursor: cursor ?? undefined })
      .then((result) => {
        setArticles((prev) => [...prev, ...result.articles]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      })
      .catch((err) => {
        console.error("Failed to load more news:", err);
        setHasMore(false);
      })
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, hasMore, cursor]);

  return { articles, loading, loadingMore, hasMore, error, loadMore };
}
