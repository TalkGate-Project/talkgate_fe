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
      title={<span className="typo-title-2">공지사항</span>}
      action={
        <button onClick={() => router.push("/notices")} className="h-[34px] px-3 rounded-[5px] border border-border bg-card text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10">더보기</button>
      }
      className="rounded-[14px]"
    >
      {waitingForProject ? (
        <div className="flex h-[240px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
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
        <div className="divide-y divide-[var(--border)]/60">
          {notices.map((n) => (
            <div key={n.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                {n.important && (
                  <span className="px-2 py-1 rounded-[5px] text-[12px] leading-[14px] bg-danger-10 text-danger-40">중요</span>
                )}
                <span className="typo-body-2 text-foreground opacity-80">{n.title}</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="typo-body-2 text-foreground opacity-80">{n.authorName ?? "-"}</span>
                <span className="typo-body-2 text-foreground opacity-80">{formatNoticeTime(n.createdAt)}</span>
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
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 py-4">
          <span className="h-5 w-48 animate-pulse rounded bg-neutral-20" />
          <span className="h-5 w-32 animate-pulse rounded bg-neutral-20" />
        </div>
      ))}
    </div>
  );
}

function formatNoticeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}


