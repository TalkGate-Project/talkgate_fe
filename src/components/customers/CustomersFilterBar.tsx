import { CustomerFilters } from "@/hooks/useCustomersFilters";
import FilterIcon from "@/components/chat/icons/FilterIcon";

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
  // 모바일: 통합 검색어 (이름 또는 연락처)
  // 이름과 연락처 중 하나라도 값이 있으면 표시 (우선순위: name > contact1)
  const mobileSearchValue = filters.name || filters.contact1 || "";

  const handleMobileSearchChange = (value: string) => {
    // 통합 검색: 이름과 연락처 모두에 동일한 값 설정
    // (API가 OR 조건을 지원하거나, 백엔드에서 이름 또는 연락처 중 하나라도 일치하면 검색되도록 구현되어 있다고 가정)
    onFilterChange({ ...filters, name: value, contact1: value });
  };

  return (
    <div className="mb-2 flex flex-wrap items-end gap-3 md:min-h-[59px]">
      {/* 데스크탑: 이름 */}
      <div className="hidden md:block w-[200px]">
        <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">이름</label>
        <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] bg-neutral-0">
          <div className="flex flex-row items-center p-0 gap-[30px] w-[176px] h-[17px]">
            <input
              className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-neutral-90"
              placeholder="이름 검색"
              value={filters.name ?? ""}
              onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 데스크탑: 핸드폰번호 */}
      <div className="hidden md:block w-[200px]">
        <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">핸드폰번호</label>
        <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-neutral-30 rounded-[5px] bg-neutral-0">
          <div className="flex flex-row items-center p-0 gap-[30px] w-[176px] h-[17px]">
            <input
              className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-neutral-60 text-neutral-90"
              placeholder="핸드폰번호 검색"
              value={filters.contact1 ?? ""}
              onChange={(e) => onFilterChange({ ...filters, contact1: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 모바일: 통합 검색 인풋 */}
      <div className="md:hidden flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              className="w-full h-[34px] px-3 pr-10 rounded-[8px] border border-neutral-30 bg-neutral-0 text-[14px] outline-none placeholder:text-neutral-60 text-neutral-90"
              placeholder="이름 연락처로 검색..."
              value={mobileSearchValue}
              onChange={(e) => handleMobileSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1"
              onClick={onSearch}
              aria-label="검색"
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
          {/* 모바일: 필터 아이콘 버튼 */}
          <button
            className="cursor-pointer w-[34px] h-[34px] grid place-items-center rounded-[8px] shrink-0"
            onClick={onFilterOpen}
            aria-label="필터"
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect 
                x="0.5" 
                y="0.5" 
                width="25" 
                height="25" 
                rx="5.5" 
                className="stroke-[#E2E2E2] dark:stroke-neutral-30"
              />
              <path
                d="M7 8C7 7.44772 7.44772 7 8 7H18C18.5523 7 19 7.44772 19 8V9.25245C19 9.51767 18.8946 9.77202 18.7071 9.95956L14.6262 14.0404C14.4387 14.228 14.3333 14.4823 14.3333 14.7475V16.3333L11.6667 19V14.7475C11.6667 14.4823 11.5613 14.228 11.3738 14.0404L7.29289 9.95956C7.10536 9.77202 7 9.51767 7 9.25245V8Z"
                className="stroke-[#B0B0B0] dark:stroke-neutral-30"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 데스크탑: Buttons */}
      <div className="hidden md:flex items-end gap-3">
        <button
          className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 bg-neutral-0"
          onClick={onFilterOpen}
        >
          필터추가
        </button>
        <button
          className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em]"
          onClick={onSearch}
        >
          검색
        </button>
      </div>
    </div>
  );
}

