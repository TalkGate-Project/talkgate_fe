type CustomersPaginationProps = {
  total: number;
  selectedCount: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function CustomersPagination({
  total,
  selectedCount,
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: CustomersPaginationProps) {
  return (
    <div className="h-[64px] flex items-center justify-between gap-4 mt-2">
      <div className="text-neutral-50 text-[14px]">
        총 {total}건 ({selectedCount}개 선택)
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="prev"
          disabled={page <= 1}
          onClick={() => {
            const next = Math.max(1, page - 1);
            onPageChange(next);
          }}
          className="w-8 h-8 grid place-items-center text-neutral-50 disabled:opacity-40"
        >
          <span
            className="block w-4 h-4 border-2 border-current rotate-90"
            style={{ borderLeft: "transparent", borderBottom: "transparent" }}
          />
        </button>
        {Array.from({ length: Math.min(10, totalPages) }).map((_, i) => {
          const start = Math.max(1, Math.min(page - 4, totalPages - 9));
          const num = start + i;
          const isActive = num === page;
          return (
            <button
              key={i}
              onClick={() => onPageChange(num)}
              className={`w-8 h-8 rounded-full grid place-items-center text-[14px] ${
                isActive ? "bg-neutral-90 text-neutral-0" : "text-neutral-60"
              }`}
            >
              {num}
            </button>
          );
        })}
        <button
          aria-label="next"
          disabled={page >= totalPages}
          onClick={() => {
            const next = Math.min(totalPages, page + 1);
            onPageChange(next);
          }}
          className="w-8 h-8 grid place-items-center text-neutral-50 disabled:opacity-40"
        >
          <span
            className="block w-4 h-4 border-2 border-current -rotate-90"
            style={{ borderLeft: "transparent", borderBottom: "transparent" }}
          />
        </button>
      </div>
      <select
        className="h-[34px] px-2 border border-neutral-30 rounded-[5px] bg-neutral-0 text-neutral-90"
        value={String(limit)}
        onChange={(e) => {
          const nextLimit = Number(e.target.value);
          onLimitChange(nextLimit);
        }}
      >
        {[10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n}개
          </option>
        ))}
      </select>
    </div>
  );
}

