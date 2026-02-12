import { CustomerFilters } from "@/hooks/useCustomersFilters";

type CustomersFilterBarProps = {
  filters: CustomerFilters;
  onFilterChange: (filters: CustomerFilters) => void;
  onFilterOpen: () => void;
  onSearch: () => void;
};

export default function CustomersFilterBar({
  filters,
  onFilterChange,
  onFilterOpen,
  onSearch,
}: CustomersFilterBarProps) {
  return (
    <div className="mb-2 md:mb-3 flex items-center gap-3">
      <button
        className="cursor-pointer w-9 h-9 grid place-items-center shrink-0 bg-transparent"
        onClick={onFilterOpen}
        aria-label="필터"
        type="button"
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="35" height="35" rx="5.5" stroke="#E2E2E2" />
          <path
            d="M10.5 11.5C10.5 10.9477 10.9477 10.5 11.5 10.5H24.5C25.0523 10.5 25.5 10.9477 25.5 11.5V13.4191C25.5 13.6843 25.3946 13.9387 25.2071 14.1262L19.9596 19.3738C19.772 19.5613 19.6667 19.8157 19.6667 20.0809V22.1667L16.3333 25.5V20.0809C16.3333 19.8157 16.228 19.5613 16.0404 19.3738L10.7929 14.1262C10.6054 13.9387 10.5 13.6843 10.5 13.4191V11.5Z"
            stroke="#B0B0B0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="flex-1 min-w-0 md:max-w-[300px] relative">
        <input
          className="w-full h-[36px] px-3 pr-10 rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] outline-none placeholder:text-neutral-60 text-neutral-90"
          placeholder="이름으로 검색..."
          value={filters.name ?? ""}
          onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
          }}
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1"
          onClick={onSearch}
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

