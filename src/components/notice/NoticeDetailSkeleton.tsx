"use client";

/**
 * 공지사항 상세 페이지 로딩 스켈레톤
 */
export default function NoticeDetailSkeleton() {
  return (
    <main className="container mx-auto max-w-[1324px] pt-6 pb-12">
      <div className="bg-card rounded-[14px] p-6">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            {/* 뒤로가기 버튼 */}
            <div className="w-6 h-6 rounded bg-neutral-20 animate-pulse" />
            {/* 제목 */}
            <div className="h-7 flex-1 max-w-md rounded bg-neutral-20 animate-pulse" />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* 메타 정보 */}
        <div className="flex items-center gap-6 mb-6">
          <div className="h-5 w-32 rounded bg-neutral-20 animate-pulse" />
          <div className="h-5 w-32 rounded bg-neutral-20 animate-pulse" />
        </div>

        <div className="border-t border-border mb-6" />

        {/* 본문 영역 */}
        <div className="mb-8 min-h-[400px] space-y-3">
          <div className="h-4 w-full rounded bg-neutral-20 animate-pulse" />
          <div className="h-4 w-full rounded bg-neutral-20 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-neutral-20 animate-pulse" />
          <div className="h-4 w-full rounded bg-neutral-20 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-neutral-20 animate-pulse" />
        </div>

        <div className="border-t border-border mb-6" />

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-20 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-neutral-20 animate-pulse" />
          </div>
          <div className="h-[34px] w-24 rounded-[5px] bg-neutral-20 animate-pulse" />
        </div>
      </div>
    </main>
  );
}

