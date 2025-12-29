"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import Panel from "@/components/common/Panel";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { NoticesService } from "@/services/notices";
import type { Notice } from "@/types/notices";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import TableSkeletonRow from "@/components/common/TableSkeletonRow";

export default function NoticeSection() {
  const router = useRouter();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["dashboard", "notices", projectId],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      return await NoticesService.list({ projectId, page: 1, limit: 5 });
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const notices: Notice[] = useMemo(() => {
    if (data?.notices === null) return [];
    return data?.notices ?? [];
  }, [data?.notices]);
  const loading = isLoading && !data;
  const error = isError && !isFetching;
  const showEmpty = !loading && !error && (data?.notices === null || notices.length === 0);

  return (
    <Panel
      title={<span className="text-[14px] md:typo-title-4 font-semibold">공지사항</span>}
      action={
        <button onClick={() => router.push("/notices")} className="cursor-pointer h-[24px] md:h-[34px] w-[42px] md:w-auto md:px-3 rounded-[5px] border border-border bg-card text-[11px] md:text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10">더보기</button>
      }
      className="rounded-[14px]"
      headerClassName="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-[22px]"
      bodyClassName="px-4 md:px-7 pb-4 md:pb-7 pt-4 md:pt-5"
      style={{ boxShadow: "6px 6px 54px 0px rgba(0, 0, 0, 0.05)" }}
    >
      {waitingForProject ? (
        <div className="flex h-[240px] items-center justify-center">
          <LoadingSpinner size="2xl" />
        </div>
      ) : missingProject ? (
        <NoticeEmpty message="프로젝트를 먼저 선택해주세요." />
      ) : loading ? (
        <NoticeSkeleton />
      ) : error ? (
        <NoticeEmpty message="공지사항을 불러오는 중 문제가 발생했습니다." error />
      ) : showEmpty ? (
        <NoticeEmpty message={data?.notices === null ? "공지사항 데이터가 없습니다." : "등록된 공지사항이 없습니다."} />
      ) : (
        <div className="divide-y divide-[var(--border)]/60 border-t border-[var(--border)]/60">
          {notices.map((n) => (
            <div
              key={n.id}
              onClick={() => router.push(`/notice/${n.id}`)}
              className="cursor-pointer md:px-[10px] flex items-center justify-between py-4 hover:bg-neutral-10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {n.important && (
                  <span className="md:px-2 md:py-1 rounded-[5px] text-[12px] leading-[14px] bg-danger-10 text-danger-40">
                    중요
                  </span>
                )}
                <span className="typo-body-2 text-foreground opacity-80 truncate">
                  {n.title}
                </span>
              </div>
              <div className="flex items-center gap-8 flex-none pl-4">
                <span className="typo-body-2 text-foreground opacity-80 md:w-[120px] shrink-0 text-left truncate">
                  {n.authorName ?? "-"}
                </span>
                <span className="typo-body-2 text-foreground opacity-80 md:w-[110px] shrink-0 text-right">
                  {formatNoticeTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function NoticeEmpty({ message, error }: { message: string; error?: boolean }) {
  return (
    <div className={`flex h-[240px] items-center justify-center text-[14px] ${error ? "text-danger-40" : "text-neutral-60"}`}>
      {message}
    </div>
  );
}

function NoticeSkeleton() {
  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse">
        <tbody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <TableSkeletonRow
              key={`skeleton-${idx}`}
              columns={[
                { width: "flex", paddingX: 2.5 }, // 제목 (중요 태그 포함)
                { width: 120, paddingX: 4 }, // 작성자
                { width: 110, paddingX: 4 }, // 시간
              ]}
              rowHeight={48}
              className="border-t border-[var(--border)]/60"
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNoticeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}


