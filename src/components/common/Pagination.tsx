"use client";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  disabled?: boolean;
  maxButtons?: number; // default 10
  className?: string;
};

export default function Pagination({ page, totalPages, onPageChange, disabled = false, maxButtons = 10, className = "" }: Props) {
  const safeTotal = Math.max(1, totalPages || 1);
  const clampedPage = Math.min(Math.max(1, page || 1), safeTotal);

  // 페이지 번호를 계산하는 로직
  const getPageNumbers = (): (number | string)[] => {
    if (safeTotal <= maxButtons) {
      // 전체 페이지가 maxButtons 이하면 모두 표시
      return Array.from({ length: safeTotal }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const sideButtons = 2; // 첫/끝에서 보여줄 버튼 수
    const middleButtons = maxButtons - 4; // 양쪽 ellipsis와 첫/끝 페이지를 제외한 중간 버튼 수

    // 항상 첫 페이지 포함
    pages.push(1);

    if (clampedPage <= sideButtons + middleButtons / 2) {
      // 시작 부분에 있을 때
      for (let i = 2; i < maxButtons - 1; i++) {
        pages.push(i);
      }
      pages.push("...");
    } else if (clampedPage >= safeTotal - sideButtons - middleButtons / 2) {
      // 끝 부분에 있을 때
      pages.push("...");
      for (let i = safeTotal - maxButtons + 3; i < safeTotal; i++) {
        pages.push(i);
      }
    } else {
      // 중간에 있을 때
      pages.push("...");
      const start = clampedPage - Math.floor(middleButtons / 2);
      const end = clampedPage + Math.floor(middleButtons / 2);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      pages.push("...");
    }

    // 항상 마지막 페이지 포함
    pages.push(safeTotal);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        aria-label="prev"
        className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-50 disabled:opacity-50"
        disabled={disabled || clampedPage <= 1}
        onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {pageNumbers.map((num, idx) => {
        if (num === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-neutral-60 cursor-default"
            >
              ...
            </span>
          );
        }

        const pageNum = num as number;
        const active = pageNum === clampedPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-normal leading-[17px] ${
              active 
                ? "bg-neutral-90 text-neutral-0" 
                : "text-neutral-60 hover:bg-neutral-10"
            }`}
            disabled={disabled}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        aria-label="next"
        className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-50 disabled:opacity-50"
        disabled={disabled || clampedPage >= safeTotal}
        onClick={() => onPageChange(Math.min(safeTotal, clampedPage + 1))}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="var(--neutral-50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
