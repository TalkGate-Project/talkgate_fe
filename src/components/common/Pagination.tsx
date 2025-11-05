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
  const half = Math.floor(maxButtons / 2);
  const start = Math.max(1, Math.min(clampedPage - half, safeTotal - (maxButtons - 1)));
  const count = Math.min(maxButtons, safeTotal - start + 1);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        aria-label="prev"
        className="w-8 h-8 grid place-items-center text-[#B0B0B0] disabled:opacity-40"
        disabled={disabled || clampedPage <= 1}
        onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 19L8 12L15 5" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {Array.from({ length: count }).map((_, idx) => {
        const num = start + idx;
        const active = num === clampedPage;
        return (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-8 h-8 rounded-full grid place-items-center text-[14px] ${active ? "bg-[#252525] text-white" : "text-[#808080]"}`}
            disabled={disabled}
          >
            {num}
          </button>
        );
      })}
      <button
        aria-label="next"
        className="w-8 h-8 grid place-items-center text-[#B0B0B0] disabled:opacity-40"
        disabled={disabled || clampedPage >= safeTotal}
        onClick={() => onPageChange(Math.min(safeTotal, clampedPage + 1))}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 19L16 12L9 5" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
