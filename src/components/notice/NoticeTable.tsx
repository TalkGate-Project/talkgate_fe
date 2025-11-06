"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Notice } from "@/types/notices";
import TableSkeleton from "@/components/common/TableSkeleton";

interface NoticeTableProps {
  notices: Notice[];
  loading?: boolean;
  buildNoticeHref?: (notice: Notice) => string;
}

export default function NoticeTable({ notices, loading = false, buildNoticeHref }: NoticeTableProps) {
  const router = useRouter();

  const handleNoticeClick = (notice: Notice) => {
    const href = buildNoticeHref ? buildNoticeHref(notice) : `/notice/${notice.id}`;
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
    <div className="bg-card rounded-[14px] p-6">
      {/* 테이블 헤더 */}
      <div className="bg-neutral-20 rounded-[12px] h-[48px] flex items-center px-6 mb-0">
        <div className="flex-1 text-[16px] font-bold text-neutral-60">제목</div>
        <div className="w-[100px] text-[16px] font-bold text-neutral-60 text-center">작성자</div>
        <div className="w-[120px] text-[16px] font-bold text-neutral-60 text-center">작성일</div>
      </div>

      {/* 테이블 본문 */}
      <div className="mt-0">
        {loading ? (
          <TableSkeleton rows={5} columns={["flex", 100, 120]} />
        ) : notices.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-neutral-60">등록된 공지사항이 없습니다.</div>
        ) : (
          notices.map((notice, index) => (
            <div key={notice.id}>
              <div
                className="flex items-center py-4 px-6 hover:bg-neutral-10 cursor-pointer transition-colors"
                onClick={() => handleNoticeClick(notice)}
              >
                {/* 제목 영역 */}
                <div className="flex-1 flex items-center gap-3">
                  {/* 중요 태그 */}
                  {notice.important && (
                    <div className="px-3 py-1 bg-danger-10 rounded-[30px]">
                      <span className="text-[12px] font-medium text-danger-40">중요</span>
                    </div>
                  )}
                  {/* 제목 */}
                  <span className="text-[14px] font-medium text-foreground opacity-80">
                    {notice.title}
                  </span>
                </div>

                {/* 작성자 */}
                <div className="w-[100px] text-[14px] font-medium text-foreground opacity-80 text-center">
                  {notice.authorName}
                </div>

                {/* 작성일 */}
                <div className="w-[120px] text-[14px] font-medium text-foreground opacity-80 text-center">
                  {renderDate(notice.createdAt)}
                </div>
              </div>

              {/* 구분선 */}
              {index < notices.length - 1 && (
                <div className="border-t border-border opacity-50" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
