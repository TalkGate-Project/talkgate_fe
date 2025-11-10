"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import MemberStatsFilterModal, { type MemberFilterState } from "@/components/common/MemberStatsFilterModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type {
  CustomerAssignmentByMemberResponse,
  CustomerAssignmentMemberRecord,
  CustomerAssignmentTeamRecord,
  CustomerAssignmentByTeamResponse,
} from "@/types/statistics";

const PAGE_SIZE = 10;
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");
const COLOR_PALETTE = [
  "var(--primary-20)",
  "var(--warning-20)",
  "var(--danger-20)",
  "var(--secondary-20)",
  "var(--secondary-10)",
  "var(--secondary-40)",
];

function formatCount(value: number) {
  return `${NUMBER_FORMATTER.format(value)}건`;
}

export default function AssignMemberTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const initialTeam = (searchParams.get("assignTeam") as string | null) ?? "all";
  const initialSort = (searchParams.get("assignSort") as MemberFilterState["sort"] | null) ?? "desc";
  const initialPage = Number.parseInt(searchParams.get("assignPage") ?? "1", 10);

  const [open, setOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<MemberFilterState["team"]>(initialTeam);
  const [sortOrder, setSortOrder] = useState<MemberFilterState["sort"]>(initialSort === "asc" ? "asc" : "desc");
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (teamFilter && teamFilter !== "all") params.set("assignTeam", teamFilter);
    else params.delete("assignTeam");
    if (sortOrder !== "desc") params.set("assignSort", sortOrder);
    else params.delete("assignSort");
    if (page > 1) params.set("assignPage", String(page));
    else params.delete("assignPage");
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamFilter, sortOrder, page]);

  const teamOverviewQuery = useQuery<CustomerAssignmentByTeamResponse>({
    queryKey: ["stats", "assignment", "team-overview", projectId],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerAssignmentByTeam({ projectId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const sortParam = sortOrder === "desc" ? "DESC" : "ASC";
  const teamIdParam = teamFilter !== "all" && /^\d+$/.test(teamFilter) ? Number(teamFilter) : undefined;

  const memberQuery = useQuery<CustomerAssignmentByMemberResponse>({
    queryKey: [
      "stats",
      "assignment",
      "member",
      projectId,
      { page, sort: sortParam, team: teamIdParam ?? "all" },
    ],
    enabled: hasProject,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerAssignmentByMember({
        projectId,
        page,
        limit: PAGE_SIZE,
        sortOrder: sortParam,
        ...(typeof teamIdParam === "number" ? { teamId: teamIdParam } : {}),
      });
      return res.data;
    },
  });

  const teamOptions = useMemo(() => {
    const base = [{ label: "전체", value: "all" }];
    const seen = new Set<string>();
    const records = teamOverviewQuery.data?.data.data === null ? [] : (teamOverviewQuery.data?.data.data ?? []);
    records.forEach((item) => {
      if (item.teamId === null) return;
      const value = String(item.teamId);
      if (seen.has(value)) return;
      seen.add(value);
      base.push({ label: item.teamName ?? `팀 ${item.teamId}`, value });
    });
    return base;
  }, [teamOverviewQuery.data]);

  const memberPayload = memberQuery.data?.data;
  const rows: CustomerAssignmentMemberRecord[] = memberPayload?.data === null ? [] : (memberPayload?.data ?? []);
  const totalCount = memberPayload?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  
  // 페이지네이션: 현재 페이지 기준 10개씩만 표시
  const pageNumbers = useMemo(() => {
    const maxPagesToShow = 10;
    const halfRange = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, page - halfRange);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // 끝 페이지가 10개 미만이면 시작 페이지 조정
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);
  }, [totalPages, page]);

  const showSkeleton = memberQuery.isLoading && !memberQuery.data;
  const showError = memberQuery.isError && !memberQuery.isFetching;
  const showEmpty = !showSkeleton && !showError && (memberPayload?.data === null || rows.length === 0);

  const Header = (
    <div className="mb-3 flex items-center gap-2">
      <div className="text-[16px] font-semibold text-neutral-90">팀원별 배정 현황</div>
      <button
        aria-label="filter"
        className="w-[26px] h-[26px] grid place-items-center rounded-[6px] border border-border text-neutral-60"
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 8C7 7.45 7.45 7 8 7H18C18.55 7 19 7.45 19 8V9.25C19 9.52 18.89 9.77 18.71 9.96L14.63 14.04C14.44 14.23 14.33 14.48 14.33 14.75V16.33L11.67 19V14.75C11.67 14.48 11.56 14.23 11.37 14.04L7.29 9.96C7.11 9.77 7 9.52 7 9.25V8Z"
            stroke="var(--neutral-40)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </button>
    </div>
  );

  if (waitingForProject) {
    return (
      <div className="mt-5">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
        </div>
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="mt-5">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {Header}
      <div className="h-[48px] bg-neutral-20 rounded-[12px] grid grid-cols-3 items-center px-6 text-[16px] text-neutral-60 font-semibold">
        <div>이름</div>
        <div>팀</div>
        <div>배정 건수</div>
      </div>
      <div className="divide-y divide-[#E2E2E2]/40 min-h-[280px] bg-card">
        {showSkeleton && <SkeletonRows columns={3} rows={PAGE_SIZE} />}
        {showError && (
          <div className="flex h-[120px] items-center justify-center text-[14px] text-danger-40">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        )}
        {showEmpty && (
          <div className="flex h-[120px] items-center justify-center text-[14px] text-neutral-60">
            {memberPayload?.data === null ? "배정 통계 데이터가 없습니다." : "표시할 데이터가 없습니다."}
          </div>
        )}
        {!showSkeleton && !showError && rows.map((r, index) => {
          const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
          return (
            <div key={`${r.memberId}-${r.memberName}`} className="h-[56px] grid grid-cols-3 items-center px-6">
              <div className="text-[14px] text-neutral-90 opacity-80">{r.memberName}</div>
              <div className="flex items-center gap-2 text-[14px] text-neutral-90">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {r.teamName ?? "미지정"}
              </div>
              <div className="text-[14px] text-neutral-90">{formatCount(r.totalAssignedCount)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          className="w-6 h-6 flex items-center justify-center disabled:opacity-50"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
          aria-label="이전 페이지"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {pageNumbers.map((num) => (
          <button
            key={num}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] ${
              num === page 
                ? 'bg-[#252525] text-white font-normal' 
                : 'text-[#808080] font-normal'
            }`}
            onClick={() => setPage(num)}
          >
            {num}
          </button>
        ))}
        <button
          className="w-6 h-6 flex items-center justify-center disabled:opacity-50"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
          aria-label="다음 페이지"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <MemberStatsFilterModal
        open={open}
        title="필터설정"
        onClose={() => setOpen(false)}
        onApply={(f) => {
          setTeamFilter(f.team);
          setSortOrder(f.sort);
          setPage(1);
          setOpen(false);
        }}
        defaults={{ team: teamFilter, sort: sortOrder }}
        teamOptions={teamOptions}
      />
    </div>
  );
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-[56px] grid items-center px-6"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, colIdx) => (
            <div key={colIdx} className="h-4 rounded bg-neutral-20 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

