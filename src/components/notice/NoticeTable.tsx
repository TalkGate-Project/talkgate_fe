"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Notice } from "@/types/notices";
import TableSkeleton from "@/components/common/TableSkeleton";
import Pagination from "@/components/common/Pagination";

interface NoticeTableProps {
  notices: Notice[];
  loading?: boolean;
  buildNoticeHref?: (notice: Notice) => string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showImportantOnly?: boolean;
  onImportantFilterChange?: (checked: boolean) => void;
}

export default function NoticeTable({
  notices,
  loading = false,
  buildNoticeHref,
  currentPage,
  totalPages,
  onPageChange,
  showImportantOnly = false,
  onImportantFilterChange,
}: NoticeTableProps) {
  const router = useRouter();

  const handleNoticeClick = (notice: Notice) => {
    const href = buildNoticeHref
      ? buildNoticeHref(notice)
      : `/notice/${notice.id}`;
    router.push(href);
  };

  const renderDate = (value: string) => {
    if (!value) return "-";
    try {
      return format(new Date(value), "yyyy-MM-dd");
    } catch (error) {
      console.error("Failed to format notice date", error);
      return "-";
    }
  };

  return (
    <div className="bg-card rounded-[14px] px-7 py-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)]">
      {/* Title & Filter */}
      <div className="flex items-center justify-between mb-7">
        <h2 className="text-[18px] font-semibold text-neutral-90">
          공지사항
        </h2>
        
        {/* 중요 공지만 보기 체크박스 */}
        {onImportantFilterChange && (
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
        )}
      </div>

      {/* 테이블 헤더 */}
      <div className="bg-neutral-20 rounded-[8px] h-[40px] flex items-center px-6 mb-0">
        <div className="w-[90px] text-[16px] text-center">
          　
        </div>
        <div className="flex-1 text-[16px] font-medium text-neutral-60">제목</div>
        <div className="w-[210px] text-[16px] font-medium text-neutral-60 text-left">
          작성자
        </div>
        <div className="w-[160px] text-[16px] font-medium text-neutral-60 text-left">
          작성일
        </div>
      </div>

      {/* 테이블 본문 */}
      <div className="mt-0">
        {loading ? (
          <TableSkeleton rows={5} columns={["flex", 100, 120]} />
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-neutral-60">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          notices.map((notice, index) => (
            <div key={notice.id}>
              <div
                className="max-h-[48px] flex items-center py-[18px] px-6 hover:bg-neutral-10 cursor-pointer transition-colors "
                onClick={() => handleNoticeClick(notice)}
              >
                {/* 고유번호 영역 */}
                <div className="w-[90px] text-[14px] font-medium text-foreground opacity-80 text-center leading-[1]">
                  {notice.id}
                </div>

                {/* 제목 영역 */}
                <div className="flex-1 flex items-center gap-3 leading-[1]">
                  {/* 중요 태그 */}
                  {notice.important && (
                    <div className="px-3 py-1 bg-danger-10 rounded-[30px]">
                      <span className="text-[12px] font-medium text-danger-40 leading-[1]">
                        중요
                      </span>
                    </div>
                  )}
                  {/* 제목 */}
                  <span className="text-[14px] font-medium text-foreground opacity-80">
                    {notice.title}
                  </span>
                </div>

                {/* 작성자 */}
                <div className="w-[210px] text-[14px] font-medium text-foreground opacity-80 text-left leading-[1]">
                  {notice.authorName}
                </div>

                {/* 작성일 */}
                <div className="w-[160px] text-[14px] font-medium text-foreground opacity-80 text-left leading-[1]">
                  {renderDate(notice.createdAt)}
                </div>
              </div>

              {/* 구분선 */}
              {index < notices.length - 1 && (
                <div className="border-t border-neutral-30/40" />
              )}
            </div>
          ))
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-border opacity-50 my-4" />

      {/* Pagination */}
      <div className="flex justify-center">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>
    </div>
  );
}
