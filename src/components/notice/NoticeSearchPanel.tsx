"use client";

import { useRouter } from "next/navigation";
import Panel from "@/components/common/Panel";

interface NoticeSearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
  canWrite?: boolean;
  showImportantOnly?: boolean;
  onImportantFilterChange?: (checked: boolean) => void;
}

export default function NoticeSearchPanel({ 
  searchTerm, 
  onSearchTermChange, 
  onSearch, 
  canWrite = false,
  showImportantOnly = false,
  onImportantFilterChange,
}: NoticeSearchPanelProps) {
  const router = useRouter();

  return (
    <Panel
      className="rounded-none md:rounded-[14px]"
      title={
        <div className="flex items-end gap-4">
          <h1 className="text-[18px] md:text-[24px] md:leading-[20px] font-bold text-neutral-90">공지사항</h1>
          <span className="hidden md:block w-px h-4 bg-neutral-60 opacity-60" />
          <p className="hidden md:block text-[18px] leading-[20px] font-medium text-neutral-60">
            공지사항과 중요한 안내사항을 확인하세요
          </p>
        </div>
      }
      bodyClassName="px-4 md:px-7 py-4 md:py-[30px] border-t border-neutral-30"
    >
      {/* 검색 및 버튼 영역 */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* 검색 영역 */}
        <div className="relative flex-1 md:max-w-[294px]">
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
            className="w-full h-[34px] pl-3 pr-10 py-2 border border-neutral-30 rounded-[5px] text-[14px] text-neutral-60 placeholder:text-neutral-60 bg-card focus:outline-none focus:border-neutral-90"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 글쓰기 버튼 */}
        {canWrite && (
          <button 
            onClick={() => router.push("/notice/write")}
            className="cursor-pointer w-[60px] h-[34px] bg-neutral-90 text-neutral-0 rounded-[5px] text-[14px] font-semibold flex-shrink-0"
          >
            글쓰기
          </button>
        )}
      </div>

      {/* 모바일: 중요 공지만 보기 체크박스 */}
      {onImportantFilterChange && (
        <div className="md:hidden mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showImportantOnly}
                onChange={(e) => onImportantFilterChange(e.target.checked)}
                className="peer sr-only"
              />
              <div
                className="w-6 h-6 border border-[#B0B0B0] rounded-[5px] peer-checked:bg-primary-60 peer-checked:border-primary-60 transition-colors flex items-center justify-center"
              >
                {showImportantOnly && (
                  <svg
                    width="14"
                    height="11"
                    viewBox="0 0 14 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5.5L5 9.5L13 1.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[14px] font-medium text-[#808080] leading-5">
              중요 공지만 보기
            </span>
          </label>
        </div>
      )}
    </Panel>
  );
}
