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
    <div className="mb-2 flex flex-wrap items-end gap-3" style={{ minHeight: 59 }}>
      {/* 이름 */}
      <div className="min-w-[384px]" style={{ width: 384 }}>
        <label className="block text-[14px] leading-[17px] text-[#808080] dark:text-[#B9B9B9] mb-2">이름</label>
        <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-[#111111]">
          <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
            <input
              className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] dark:placeholder:text-[#B9B9B9] text-[#252525] dark:text-[#E9E9E9]"
              placeholder="이름 검색"
              value={filters.name ?? ""}
              onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 핸드폰번호 */}
      <div className="min-w-[384px]" style={{ width: 384 }}>
        <label className="block text-[14px] leading-[17px] text-[#808080] dark:text-[#B9B9B9] mb-2">핸드폰번호</label>
        <div className="flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-[#111111]">
          <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
            <input
              className="w-full h-[17px] outline-none border-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] dark:placeholder:text-[#B9B9B9] text-[#252525] dark:text-[#E9E9E9]"
              placeholder="핸드폰번호 검색"
              value={filters.contact1 ?? ""}
              onChange={(e) => onFilterChange({ ...filters, contact1: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Buttons immediately after inputs */}
      <div className="flex items-end gap-2">
        <button
          className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-[#FDFDFD] bg-white dark:bg-[#111111]"
          onClick={onFilterOpen}
        >
          필터추가
        </button>
        <button
          className="h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-[#E9E9E9] text-[#D0D0D0] dark:text-[#111111] text-[14px] font-semibold tracking-[-0.02em]"
          onClick={onSearch}
        >
          검색
        </button>
      </div>
    </div>
  );
}

