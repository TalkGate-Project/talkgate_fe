"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNewsList } from "@/hooks/useNews";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { NewsArticle } from "@/types/news";

interface RelatedNewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatNewsDate(pubDate: string): string {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function NewsListItem({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-[12px] bg-neutral-10 px-4 py-4 transition-colors hover:bg-neutral-20"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[14px] font-semibold leading-[20px] text-primary-80">
          {formatNewsDate(article.pubDate)}
        </span>
        <span className="rounded-[24px] border border-neutral-20 bg-card px-2 py-0.5 text-[10px] font-semibold leading-[16px] text-neutral-60">
          {article.publisher}
        </span>
      </div>
      <h4 className="mb-2 truncate text-[14px] font-semibold leading-[16px] text-foreground">
        {article.title}
      </h4>
      <p className="mb-2 truncate text-[13px] font-medium leading-[16px] text-neutral-60">
        {article.description}
      </p>
      <span className="flex h-4 items-center text-[13px] font-semibold tracking-[-0.02em] text-neutral-80">
        자세히 보기 →
      </span>
    </a>
  );
}

export default function RelatedNewsDrawer({ isOpen, onClose }: RelatedNewsDrawerProps) {
  const { articles, loading, loadingMore, hasMore, error, loadMore } = useNewsList(isOpen);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 무한 스크롤: sentinel이 보이면 다음 페이지 요청
  useEffect(() => {
    if (!isOpen || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasMore, loadMore, articles.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-card z-[101] shadow-lg flex flex-col"
          >
            <div className="h-[64px] flex items-center justify-between px-6 border-b border-neutral-30 flex-shrink-0">
              <h3 className="text-[18px] font-semibold text-foreground">회생·파산 관련 뉴스</h3>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-60 hover:text-foreground"
                aria-label="닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid place-items-center py-16">
                  <LoadingSpinner />
                </div>
              ) : articles.length === 0 ? (
                <EmptyState message={error ? "뉴스를 불러오지 못했습니다." : "관련 뉴스가 없습니다."} error={Boolean(error)} />
              ) : (
                <>
                  <div className="flex flex-col gap-4 px-6 py-4">
                    {articles.map((article) => (
                      <NewsListItem key={article.id} article={article} />
                    ))}
                  </div>
                  {hasMore ? (
                    // 다음 페이지 로딩 중(스크롤로 sentinel에 닿아 자동 요청되는 동안) 표시.
                    // sentinel 자체는 항상 렌더링해 관찰 대상을 유지하고, 스피너만 로딩 중에만 보여준다.
                    <div ref={sentinelRef} className="pb-6 flex justify-center">
                      {loadingMore && <LoadingSpinner size="sm" />}
                    </div>
                  ) : (
                    <div className="border-t border-neutral-30 py-6 text-center text-[13px] font-medium text-neutral-60">
                      모든 뉴스를 확인했어요.
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
