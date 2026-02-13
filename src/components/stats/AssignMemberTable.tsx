"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import MemberStatsFilterModal, { type MemberFilterState } from "@/components/common/MemberStatsFilterModal";
import Pagination from "@/components/common/Pagination";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SortIcon from "@/components/common/SortIcon";
import type {
  CustomerAssignmentByMemberResponse,
  CustomerAssignmentMemberRecord,
  CustomerAssignmentTeamRecord,
  CustomerAssignmentByTeamResponse,
} from "@/types/statistics";
import { SortType } from "@/types/statistics";

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

function LocalIconTooltip({
  label,
  children,
  position = "top",
}: {
  label: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
}) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className={`pointer-events-none hidden md:block absolute left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity ${
          position === "bottom" ? "top-full mt-2" : "-top-9"
        }`}
      >
        <span className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
          {label}
        </span>
      </span>
    </span>
  );
}

export default function AssignMemberTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const initialTeam = (searchParams.get("assignTeam") as string | null) ?? "all";
  const initialSort = (searchParams.get("assignSort") as "asc" | "desc" | null) ?? "desc";
  const initialPage = Number.parseInt(searchParams.get("assignPage") ?? "1", 10);
  const initialSortType = (searchParams.get("assignSortType") as SortType | null) ?? null;
  const initialSortOrder = (searchParams.get("assignSortOrder") as "ASC" | "DESC" | null) ?? (initialSortType ? "DESC" : null);

  const [open, setOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<MemberFilterState["team"]>(initialTeam);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSort === "asc" ? "asc" : "desc");
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortType, setSortType] = useState<SortType | null>(initialSortType);
  const [sortOrderState, setSortOrderState] = useState<"ASC" | "DESC" | null>(initialSortOrder);

  const handleMemberClick = (memberId: number) => {
    setSelectedMemberId(memberId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (teamFilter && teamFilter !== "all") params.set("assignTeam", teamFilter);
    else params.delete("assignTeam");
    if (sortOrder !== "desc") params.set("assignSort", sortOrder);
    else params.delete("assignSort");
    if (page > 1) params.set("assignPage", String(page));
    else params.delete("assignPage");
    if (sortType) params.set("assignSortType", sortType);
    else params.delete("assignSortType");
    if (sortOrderState) params.set("assignSortOrder", sortOrderState);
    else params.delete("assignSortOrder");
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamFilter, sortOrder, page, sortType, sortOrderState]);

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

  const sortParam = sortOrderState ?? (sortOrder === "desc" ? "DESC" : "ASC");
  const teamIdParam = teamFilter !== "all" && /^\d+$/.test(teamFilter) ? Number(teamFilter) : undefined;

  const memberQuery = useQuery<CustomerAssignmentByMemberResponse>({
    queryKey: [
      "stats",
      "assignment",
      "member",
      projectId,
      { page, sort: sortParam, sortType, team: teamIdParam ?? "all" },
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

  const showSkeleton = memberQuery.isLoading && !memberQuery.data;
  const showError = memberQuery.isError && !memberQuery.isFetching;
  const showEmpty = !showSkeleton && !showError && (memberPayload?.data === null || rows.length === 0);

  const Header = (
    <div className="mb-5 flex items-center gap-3">
      <div className="text-[16px] font-semibold text-foreground">팀원별 배정 현황</div>
      <LocalIconTooltip label="필터 설정" position="bottom">
        <button
          aria-label="filter"
          className="cursor-pointer w-[26px] h-[26px] grid place-items-center font-medium rounded-[6px] border border-border text-neutral-60"
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
      </LocalIconTooltip>
    </div>
  );

  if (waitingForProject) {
    return (
      <div className="mt-4">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6">
          <LoadingSpinner size="xl" />
        </div>
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="mt-4">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {Header}
      <div className="h-[40px] bg-neutral-20 rounded-[8px] md:rounded-[12px] grid items-center pl-5 md:px-[30px] text-[13px] md:text-[16px] text-neutral-70 font-medium" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr' }}>
        <div className="md:col-span-1">이름</div>
        <div className="md:col-span-1">팀</div>
        <div className="md:col-span-1 flex items-center gap-1 cursor-pointer" onClick={() => {
          if (sortType === SortType.Count) {
            if (sortOrderState === "DESC") {
              setSortOrderState("ASC");
            } else if (sortOrderState === "ASC") {
              setSortType(null);
              setSortOrderState(null);
            } else {
              setSortOrderState("DESC");
            }
          } else {
            setSortType(SortType.Count);
            setSortOrderState("DESC");
          }
          setPage(1);
        }}>
          배정 건수
          <SortIcon state={sortType === SortType.Count ? (sortOrderState === "ASC" ? "asc" : sortOrderState === "DESC" ? "desc" : "none") : "none"} />
        </div>
      </div>
      <div className="divide-y divide-[#44444433] min-h-[280px] bg-card border-b border-[#44444455]">
        {showSkeleton && (
          <>
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="h-[48px] grid items-center px-[30px] border-b border-[#E2E2E2] dark:!border-[#44444455] animate-pulse md:grid-cols-3"
                style={{ gridTemplateColumns: '1fr 1.5fr 1fr' }}
              >
                <div className="h-4 bg-neutral-20 rounded" />
                <div className="h-4 bg-neutral-20 rounded" />
                <div className="h-4 bg-neutral-20 rounded" />
              </div>
            ))}
          </>
        )}
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
            <div key={`${r.memberId}-${r.memberName}`} className="h-[48px] grid items-center pl-5 md:px-[30px] md:grid-cols-3" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr' }}>
              <button
                onClick={() => handleMemberClick(r.memberId)}
                className="text-[14px] text-foreground opacity-80 text-left cursor-pointer hover:underline"
              >
                {r.memberName}
              </button>
              <div className="flex items-center gap-2 text-[14px] text-foreground opacity-80">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {r.teamName ?? "미지정"}
              </div>
              <div className="text-[14px] text-foreground opacity-80">{formatCount(r.totalAssignedCount)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={memberQuery.isLoading}
        />
      </div>
      <MemberStatsFilterModal
        open={open}
        title="필터설정"
        onClose={() => setOpen(false)}
        onApply={(f) => {
          setTeamFilter(f.team);
          setPage(1);
          setOpen(false);
        }}
        defaults={{ team: teamFilter }}
        teamOptions={teamOptions}
      />
      {selectedMemberId !== null && (
        <TeamMemberInfoModal
          open={isModalOpen}
          memberId={selectedMemberId}
          onClose={handleCloseModal}
          projectId={projectId}
        />
      )}
    </div>
  );
}


