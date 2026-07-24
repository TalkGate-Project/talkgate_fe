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

// 모바일: 카드형(둥근 배경 + 발행사 배지) / 데스크톱: 구분선 리스트(점 구분자) — 브레이크포인트만 다르게 준다
// (이 프로젝트 md는 780px, globals.css --breakpoint-md 참고)
function NewsListItem({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block mx-4 mb-3 rounded-[12px] bg-neutral-10 px-4 py-4 hover:bg-neutral-20 transition-colors md:mx-0 md:mb-0 md:rounded-none md:bg-transparent md:px-6 md:py-5 md:border-b md:border-neutral-30 md:hover:bg-neutral-10"
    >
      <div className="flex items-center gap-2 mb-2 text-[13px]">
        <span className="font-semibold text-foreground md:font-medium md:text-neutral-60">
          {formatNewsDate(article.pubDate)}
        </span>
        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-neutral-40 shrink-0" />
        <span className="hidden md:inline truncate text-neutral-60">{article.publisher}</span>
        <span className="md:hidden shrink-0 truncate rounded-[4px] bg-neutral-20 px-1.5 py-0.5 text-[12px] font-medium text-neutral-70">
          {article.publisher}
        </span>
      </div>
      <h4 className="text-[15px] font-semibold text-foreground leading-[20px] mb-1 line-clamp-2">
        {article.title}
      </h4>
      <p className="text-[13px] text-neutral-60 leading-[18px] line-clamp-2 mb-2">
        {article.description}
      </p>
      <span className="text-[13px] font-medium text-neutral-70">자세히 보기 →</span>
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
              <h3 className="text-[18px] font-bold text-foreground">회생·파산 관련 뉴스</h3>
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
                  <div className="pt-3 md:pt-0">
                    {articles.map((article) => (
                      <NewsListItem key={article.id} article={article} />
                    ))}
                  </div>
                  {hasMore ? (
                    // 다음 페이지 로딩 중(스크롤로 sentinel에 닿아 자동 요청되는 동안) 표시.
                    // sentinel 자체는 항상 렌더링해 관찰 대상을 유지하고, 스피너만 로딩 중에만 보여준다.
                    <div ref={sentinelRef} className="py-6 flex justify-center">
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
