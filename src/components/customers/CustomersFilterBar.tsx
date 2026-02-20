import { useEffect, useState } from "react";
import { CustomerFilters } from "@/hooks/useCustomersFilters";

type CustomersFilterBarProps = {
  filters: CustomerFilters;
  onFilterChange: (filters: CustomerFilters) => void;
  onFilterOpen: () => void;
  onSearch: (filtersToApply?: CustomerFilters) => void;
};

function LocalIconTooltip({
  label,
  children,
  position = "top",
}: {
  label: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
}) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className={`pointer-events-none hidden md:block absolute left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity ${position === "bottom" ? "top-full mt-2" : "-top-9"
          }`}
      >
        <span className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
          {label}
        </span>
      </span>
    </span>
  );
}

export default function CustomersFilterBar({
  filters,
  onFilterChange,
  onFilterOpen,
  onSearch,
}: CustomersFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.name ?? "");

  useEffect(() => {
    setSearchInput(filters.name ?? "");
  }, [filters.name]);

  const handleSearch = () => {
    const nextFilters = { ...filters, name: searchInput.trim() || undefined };
    onFilterChange(nextFilters);
    onSearch(nextFilters);
  };

  return (
    <div className="mb-2 md:mb-3 flex items-center gap-3">
      <LocalIconTooltip label="필터 설정" position="bottom">
        <button
          className="cursor-pointer w-9 h-9 grid place-items-center shrink-0 bg-transparent border border-neutral-30 rounded-[6px]"
          onClick={onFilterOpen}
          aria-label="필터"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 3.5C2.5 2.94771 2.94772 2.5 3.5 2.5H16.5C17.0523 2.5 17.5 2.94772 17.5 3.5V5.41912C17.5 5.68434 17.3946 5.93869 17.2071 6.12623L11.9596 11.3738C11.772 11.5613 11.6667 11.8157 11.6667 12.0809V14.1667L8.33333 17.5V12.0809C8.33333 11.8157 8.22798 11.5613 8.04044 11.3738L2.79289 6.12623C2.60536 5.93869 2.5 5.68434 2.5 5.41912V3.5Z" stroke="#B0B0B0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </LocalIconTooltip>

      <div className="flex-1 min-w-0 md:max-w-[300px] relative">
        <input
          className="w-full h-[36px] px-3 pr-10 rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] outline-none placeholder:text-neutral-60 text-neutral-90"
          placeholder="이름으로 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1"
          onClick={handleSearch}
          aria-label="검색"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

