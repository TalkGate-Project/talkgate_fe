"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Notice } from "@/types/notices";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";
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

  const renderDate = (value: string, formatString: string) => {
    if (!value) return "-";
    try {
      return format(new Date(value), formatString);
    } catch (error) {
      console.error("Failed to format notice date", error);
      return "-";
    }
  };

  return (
    <div className="bg-card rounded-none md:rounded-[14px] px-4 md:px-7 pt-4 md:pt-[30px] pb-4 md:pb-[30px] shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none h-full md:h-auto flex flex-col">
      {/* Title & Filter */}
      <div className="hidden md:flex items-center justify-between mb-7">
        <h2 className="text-[18px] font-semibold text-neutral-90">
          공지사항
        </h2>
        
        {/* 중요 공지만 보기 체크박스 (데스크탑만) */}
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
      <div className="bg-neutral-20 rounded-[8px] h-[40px] flex items-center px-5 md:px-6 mb-0 flex-shrink-0">
        <div className="hidden md:block w-[90px] text-[13px] md:text-[16px] text-center">
          　
        </div>
        <div className="flex-1 text-[13px] md:text-[16px] font-medium text-neutral-60">제목</div>
        <div className="w-[80px] md:w-[210px] text-[13px] md:text-[16px] font-medium text-neutral-60 text-left pl-2 md:pl-0">
          작성자
        </div>
        <div className="w-[70px] md:w-[160px] text-[13px] md:text-[16px] font-medium text-neutral-60 text-left">
          작성일
        </div>
      </div>

      {/* 테이블 본문 */}
      <div className="mt-0 flex-1 overflow-y-auto md:overflow-visible">
        {loading ? (
          <div className="overflow-hidden">
            <table className="w-full border-collapse">
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TableSkeletonRow
                    key={`skeleton-${idx}`}
                    columns={[
                      { width: 90, paddingX: 6, className: "hidden md:table-cell" }, // 고유번호
                      { width: "flex", paddingX: 6 }, // 제목
                      { width: 80, paddingX: 6, className: "md:w-[210px]" }, // 작성자
                      { width: 70, paddingX: 6, className: "md:w-[160px]" }, // 작성일
                    ]}
                    rowHeight={48}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-neutral-60">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          notices.map((notice, index) => (
            <div key={notice.id}>
              <div
                className="max-h-[48px] flex items-center py-[18px] px-3 md:px-6 hover:bg-neutral-10 cursor-pointer transition-colors"
                onClick={() => handleNoticeClick(notice)}
              >
                {/* 고유번호 영역 */}
                <div className="hidden md:block w-[90px] text-[14px] font-medium text-foreground opacity-80 text-center leading-[1]">
                  {notice.id}
                </div>

                {/* 제목 영역 */}
                <div className="flex-1 flex items-center gap-2 md:gap-3 leading-[1] min-w-0 pr-2 md:pr-0">
                  {/* 중요 태그 */}
                  {notice.important && (
                    <div className="px-2 md:px-3 py-1 bg-danger-10 rounded-[30px] flex-shrink-0">
                      <span className="text-[12px] font-medium text-danger-40 leading-[1]">
                        중요
                      </span>
                    </div>
                  )}
                  {/* 제목 */}
                  <span className="text-[14px] leading-[18px] font-medium text-foreground opacity-80 truncate">
                    {notice.title}
                  </span>
                </div>

                {/* 작성자 */}
                <div className="w-[80px] md:w-[210px] text-[14px] font-medium text-foreground opacity-80 text-left leading-[1] flex-shrink-0">
                  <span className="truncate block leading-[18px]">{notice.authorName}</span>
                </div>

                {/* 작성일 */}
                <div className="w-[70px] md:w-[160px] text-[14px] font-medium text-foreground opacity-80 text-left leading-[1] flex-shrink-0 whitespace-nowrap">
                  <span className="md:hidden">{renderDate(notice.createdAt, "yy.MM.dd")}</span>
                  <span className="hidden md:inline">{renderDate(notice.createdAt, "yyyy-MM-dd")}</span>
                </div>
              </div>

              {/* 구분선 */}
              {index < notices.length - 1 && (
                <div className="border-t border-neutral-30/40 dark:!border-[#44444455]" />
              )}
            </div>
          ))
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-border opacity-50 my-2 md:my-4 flex-shrink-0" />

      {/* Pagination */}
      <div className="flex justify-center flex-shrink-0">
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
