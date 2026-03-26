import { useEffect, useState } from "react";
import { CustomerFilters } from "@/hooks/useCustomersFilters";
import DatePicker from "@/components/common/DatePicker";
import {
  getApplicationDateRangeToday,
  getApplicationDateRangeThisMonth,
  getApplicationDateRangeLastMonth,
} from "@/utils/datetime";
import { sanitizeContactFilterInput } from "@/utils/format";

type CustomersFilterBarProps = {
  filters: CustomerFilters;
  onFilterChange: (filters: CustomerFilters) => void;
  onFilterOpen: () => void;
  onSearch: (filtersToApply?: CustomerFilters) => void;
};

function stringToDate(str?: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateToString(date: Date | null): string | undefined {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
  const [contactSearchInput, setContactSearchInput] = useState(
    sanitizeContactFilterInput(filters.contact1 ?? "")
  );

  useEffect(() => {
    setSearchInput(filters.name ?? "");
  }, [filters.name]);

  useEffect(() => {
    setContactSearchInput(sanitizeContactFilterInput(filters.contact1 ?? ""));
  }, [filters.contact1]);

  const handleSearch = () => {
    const nextFilters = { ...filters, name: searchInput.trim() || undefined };
    onFilterChange(nextFilters);
    onSearch(nextFilters);
  };

  const handleContactSearch = () => {
    const nextFilters = {
      ...filters,
      contact1: contactSearchInput.trim() || undefined,
    };
    onFilterChange(nextFilters);
    onSearch(nextFilters);
  };

  const applicationStart = stringToDate(filters.applicationDateFrom);
  const applicationEnd = stringToDate(filters.applicationDateTo);

  const applyApplicationDateRange = (from: string, to: string) => {
    const nextFilters = {
      ...filters,
      applicationDateFrom: from,
      applicationDateTo: to,
    };
    onFilterChange(nextFilters);
    onSearch(nextFilters);
  };

  const handleQuickToday = () => {
    const { from, to } = getApplicationDateRangeToday();
    applyApplicationDateRange(from, to);
  };
  const handleQuickThisMonth = () => {
    const { from, to } = getApplicationDateRangeThisMonth();
    applyApplicationDateRange(from, to);
  };
  const handleQuickLastMonth = () => {
    const { from, to } = getApplicationDateRangeLastMonth();
    applyApplicationDateRange(from, to);
  };

  const handleApplicationStartChange = (date: Date | null) => {
    const next = { ...filters, applicationDateFrom: dateToString(date) };
    onFilterChange(next);
    onSearch(next);
  };
  const handleApplicationEndChange = (date: Date | null) => {
    const next = { ...filters, applicationDateTo: dateToString(date) };
    onFilterChange(next);
    onSearch(next);
  };

  const quickBtnClass =
    "cursor-pointer h-[36px] px-3 rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] font-medium text-neutral-90 hover:bg-neutral-10 dark:bg-neutral-20 dark:border-neutral-40 dark:text-neutral-80 dark:hover:bg-neutral-30";

  const labelClass =
    "block text-[14px] text-[#808080] dark:text-neutral-50 font-medium mb-1";

  const searchFieldClass =
    "flex flex-col min-w-0 w-full lg:flex-1 lg:max-w-[236px]";

  return (
    <div className="mb-2 md:mb-3 grid grid-cols-1 gap-3 lg:flex lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-3 lg:gap-y-2">
      {/* max-lg: 세로 — 필터 → 이름 → 연락처 → 신청시간 / lg+: 가로 */}
      <div className="flex flex-col shrink-0 w-fit">
        <span className="hidden lg:block h-[14px] mb-1" aria-hidden="true" />
        <LocalIconTooltip label="필터 설정" position="bottom">
          <button
            className="cursor-pointer w-9 h-[36px] grid place-items-center shrink-0 bg-transparent border border-neutral-30 rounded-[6px]"
            onClick={onFilterOpen}
            aria-label="필터"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 3.5C2.5 2.94771 2.94772 2.5 3.5 2.5H16.5C17.0523 2.5 17.5 2.94772 17.5 3.5V5.41912C17.5 5.68434 17.3946 5.93869 17.2071 6.12623L11.9596 11.3738C11.772 11.5613 11.6667 11.8157 11.6667 12.0809V14.1667L8.33333 17.5V12.0809C8.33333 11.8157 8.22798 11.5613 8.04044 11.3738L2.79289 6.12623C2.60536 5.93869 2.5 5.68434 2.5 5.41912V3.5Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </LocalIconTooltip>
      </div>

      {/* 이름 */}
      <div className={searchFieldClass}>
        <label className={labelClass} htmlFor="customers-name-search">
          이름
        </label>
        <div className="relative">
          <input
            id="customers-name-search"
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

      {/* 연락처 */}
      <div className={searchFieldClass}>
        <label className={labelClass} htmlFor="customers-contact-search">
          연락처
        </label>
        <div className="relative">
          <input
            id="customers-contact-search"
            className="w-full h-[36px] px-3 pr-10 rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] outline-none placeholder:text-neutral-60 text-neutral-90"
            placeholder="연락처로 검색..."
            inputMode="numeric"
            autoComplete="tel"
            value={contactSearchInput}
            onChange={(e) =>
              setContactSearchInput(sanitizeContactFilterInput(e.target.value))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleContactSearch();
              }
            }}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1"
            onClick={handleContactSearch}
            aria-label="연락처 검색"
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

      {/* 신청시간: max-xl에서 레이블 행 / 다음 행에 날짜·퀵버튼 */}
      <div className="flex min-w-0 w-full flex-col lg:flex-1 lg:min-w-0">
        <span className={labelClass}>신청시간</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[120px] w-[min(100%,140px)] sm:w-[140px] lg:w-[160px]">
            <DatePicker
              value={applicationStart}
              onChange={handleApplicationStartChange}
              placeholder="연도.월.일"
              className="h-[36px] rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] w-full cursor-pointer"
            />
          </div>
          <span className="text-[14px] text-neutral-60 dark:text-neutral-50">-</span>
          <div className="relative min-w-[120px] w-[min(100%,140px)] sm:w-[140px] lg:w-[160px]">
            <DatePicker
              value={applicationEnd}
              onChange={handleApplicationEndChange}
              placeholder="연도.월.일"
              className="h-[36px] rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] w-full cursor-pointer"
            />
          </div>
          <button
            type="button"
            className={quickBtnClass}
            onClick={handleQuickToday}
            aria-label="당일"
          >
            당일
          </button>
          <button
            type="button"
            className={quickBtnClass}
            onClick={handleQuickThisMonth}
            aria-label="당월"
          >
            당월
          </button>
          <button
            type="button"
            className={quickBtnClass}
            onClick={handleQuickLastMonth}
            aria-label="전월"
          >
            전월
          </button>
        </div>
      </div>
    </div>
  );
}

