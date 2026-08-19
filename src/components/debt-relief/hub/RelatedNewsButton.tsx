"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NewsService } from "@/services/news";
import type { NewsArticle } from "@/types/news";

interface RelatedNewsButtonProps {
  onClick: () => void;
}

const PREVIEW_LIMIT = 10;
const ROLL_INTERVAL_MS = 2500;

function formatNewsDate(pubDate: string): string {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function NewspaperIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M15.8333 16.6668H4.16667C3.24619 16.6668 2.5 15.9206 2.5 15.0002L2.5 5.00016C2.5 4.07969 3.24619 3.3335 4.16667 3.3335L12.5 3.3335C13.4205 3.3335 14.1667 4.07969 14.1667 5.00016V5.8335M15.8333 16.6668C14.9129 16.6668 14.1667 15.9206 14.1667 15.0002L14.1667 5.8335M15.8333 16.6668C16.7538 16.6668 17.5 15.9206 17.5 15.0002V7.50016C17.5 6.57969 16.7538 5.8335 15.8333 5.8335L14.1667 5.8335M10.8333 3.3335L7.5 3.3335M5.83333 13.3335H10.8333M5.83333 6.66683H10.8333V10.0002H5.83333V6.66683Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NewsTicker({ articles }: { articles: NewsArticle[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [articles]);

  useEffect(() => {
    if (articles.length <= 1) return;
    const timerId = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % articles.length);
    }, ROLL_INTERVAL_MS);
    return () => window.clearInterval(timerId);
  }, [articles.length]);

  const article = articles.length > 0 ? articles[index % articles.length] : null;
  const dateLabel = article ? formatNewsDate(article.pubDate) : "";

  return (
    // 로딩 전·뉴스 없음에도 슬롯을 유지해 아이콘·「관련뉴스」 라벨이 밀리지 않게 한다.
    // 모바일: flex-1로 남은 폭 사용 / 데스크톱: 스펙 폭(날짜+gap+제목 ≈ 256px) 고정
    <div
      className="relative h-5 min-w-0 flex-1 overflow-hidden md:w-[256px] md:flex-none"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!article}
    >
      {article ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={article.id}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center gap-2.5"
          >
            {dateLabel ? (
              <span className="shrink-0 text-[14px] font-semibold leading-none text-primary-80">
                {dateLabel}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate text-left text-[14px] font-medium leading-none text-foreground">
              {article.title}
            </span>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}

export default function RelatedNewsButton({ onClick }: RelatedNewsButtonProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    let cancelled = false;
    NewsService.list({ limit: PREVIEW_LIMIT })
      .then((result) => {
        if (cancelled) return;
        setArticles(result.articles);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load news preview:", err);
        setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="관련뉴스"
      onClick={onClick}
      className="cursor-pointer flex h-[34px] min-w-0 flex-1 items-center justify-center gap-2.5 rounded-[5px] border border-neutral-30 px-3 text-foreground transition-colors hover:bg-neutral-10 md:w-[368px] md:flex-none md:shrink-0"
    >
      <NewspaperIcon />
      <span className="inline-flex h-5 shrink-0 items-center text-[14px] font-semibold leading-none tracking-[-0.02em] text-foreground">
        관련뉴스
      </span>
      <NewsTicker articles={articles} />
    </button>
  );
}
