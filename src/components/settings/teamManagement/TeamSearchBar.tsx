"use client";

interface TeamSearchBarProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSearch: () => void;
}

export default function TeamSearchBar({ inputValue, onInputChange, onSearch }: TeamSearchBarProps) {
  return (
    <div className="flex items-center gap-2 md:gap-4 mb-3">
      <div className="relative flex-1 md:flex-none">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="직원 및 팀 이름을 검색하세요"
          className="w-full md:min-w-[280px] md:max-w-[294px] px-3 h-[34px] border border-neutral-30 rounded-[5px] text-[13px] md:text-[14px] text-foreground bg-card focus:outline-none focus:border-foreground"
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="cursor-pointer w-[60px] md:w-[66px] h-[34px] bg-neutral-90 text-neutral-0 rounded-[5px] text-[13px] md:text-[14px] font-semibold flex-shrink-0"
      >
        검색
      </button>
    </div>
  );
}
