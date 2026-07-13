type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

// 실시간 검색이 아니라 Enter 또는 돋보기 버튼 클릭으로만 검색을 실행한다.
export default function DiagnosisSearchInput({ value, onChange, onSearch, onClear }: Props) {
  return (
    <div className="relative w-full max-w-[188px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        placeholder="고객명 검색"
        className="w-full h-[38px] pl-3.5 pr-16 rounded-[8px] border border-border bg-card text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className="cursor-pointer absolute right-8 top-0 h-full w-8 flex items-center justify-center text-neutral-50 hover:text-neutral-70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={onSearch}
        aria-label="검색"
        className="cursor-pointer absolute right-0 top-0 h-full w-9 flex items-center justify-center text-neutral-50 hover:text-neutral-70"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
