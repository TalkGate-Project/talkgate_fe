"use client";

import { useRouter } from "next/navigation";

interface NoticeSearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
}

export default function NoticeSearchPanel({ searchTerm, onSearchTermChange, onSearch }: NoticeSearchPanelProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-[14px] p-6">
      {/* 제목 및 설명 */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[24px] font-bold text-[#252525]">공지사항</h1>
        <div className="w-px h-4 bg-[#808080]" />
        <p className="text-[18px] font-medium text-[#808080]">
          공지사항과 중요한 안내사항을 확인하세요
        </p>
      </div>

      {/* 검색 및 버튼 영역 */}
      <div className="flex items-center justify-between">
        {/* 검색 영역 */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearch();
                }
              }}
              className="w-[296px] h-[34px] px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#808080] placeholder:text-[#808080] focus:outline-none focus:border-[#252525]"
            />
          </div>
          <button 
            onClick={onSearch}
            className="h-[34px] px-3 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold"
          >
            검색
          </button>
        </div>

        {/* 글쓰기 버튼 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/notice/write")}
            className="h-[34px] px-3 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold"
          >
            글쓰기
          </button>
        </div>
      </div>
    </div>
  );
}
