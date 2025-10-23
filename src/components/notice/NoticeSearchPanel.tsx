"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NoticeSearchPanelProps {
  onSearch: (term: string) => void;
}

export default function NoticeSearchPanel({ onSearch }: NoticeSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch(searchTerm);
                }
              }}
              className="w-[296px] h-[34px] px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#808080] placeholder:text-[#808080] focus:outline-none focus:border-[#252525]"
            />
          </div>
          <button 
            onClick={() => onSearch(searchTerm)}
            className="h-[34px] px-3 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold"
          >
            검색
          </button>
        </div>

        {/* 글쓰기 버튼들 */}
        <div className="flex items-center gap-3">
          <button className="h-[34px] px-3 bg-white border border-[#E2E2E2] text-[#808080] rounded-[5px] text-[14px] font-semibold">
            글쓰기 권한없음 버튼
          </button>
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
