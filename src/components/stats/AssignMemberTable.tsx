"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import StatsFilterModal, { type StatsFilterValues } from "@/components/stats/StatsFilterModal";
import { readStatsFilter, writeStatsFilter } from "@/components/stats/statsFilterParams";
import type { Option } from "@/components/common/filterFields";
import Pagination from "@/components/common/Pagination";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SortIcon from "@/components/common/SortIcon";
import type {
  CustomerAssignmentByMemberResponse,
  CustomerAssignmentMemberRecord,
  CustomerAssignmentByTeamResponse,
} from "@/types/statistics";
import { SortType } from "@/types/statistics";

const FILTER_PREFIX = "am";

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

export type AssignMemberTableHandle = {
  openFilter: () => void;
};

const AssignMemberTable = forwardRef<AssignMemberTableHandle>(function AssignMemberTable(_, ref) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;

  const initialSort = (searchParams.get("assignSort") as "asc" | "desc" | null) ?? "desc";
  const initialPage = Number.parseInt(searchParams.get("assignPage") ?? "1", 10);
  const initialSortType = (searchParams.get("assignSortType") as SortType | null) ?? null;
  const initialSortOrder = (searchParams.get("assignSortOrder") as "ASC" | "DESC" | null) ?? (initialSortType ? "DESC" : null);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<StatsFilterValues>(() => readStatsFilter(searchParams, FILTER_PREFIX));
  const isSyncingFromUrl = useRef(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSort === "asc" ? "asc" : "desc");
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortType, setSortType] = useState<SortType | null>(initialSortType);
  const [sortOrderState, setSortOrderState] = useState<"ASC" | "DESC" | null>(initialSortOrder);

  useImperativeHandle(ref, () => ({
    openFilter: () => setOpen(true),
  }));

  useEffect(() => {
    const fromUrl = readStatsFilter(searchParams, FILTER_PREFIX);
    setFilter((prev) => {
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(fromUrl);
      if (prevStr === nextStr) return prev;
      isSyncingFromUrl.current = true;
      return fromUrl;
    });

    const parsedPage = Number.parseInt(searchParams.get("assignPage") ?? "1", 10);
    const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [searchParams]);

  const handleMemberClick = (memberId: number) => {
    setSelectedMemberId(memberId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

  useEffect(() => {
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    writeStatsFilter(params, FILTER_PREFIX, filter);
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
  }, [filter, sortOrder, page, sortType, sortOrderState]);

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
  // by-member API는 memberId를 받지 않으므로 제외하고 teamId + 공통 필터만 전달한다.
  const { memberId: _ignoredMemberId, ...memberFilterQuery } = filter;

  const memberQuery = useQuery<CustomerAssignmentByMemberResponse>({
    queryKey: [
      "stats",
      "assignment",
      "member",
      projectId,
      { page, sort: sortParam, sortType, filter: memberFilterQuery },
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
        ...memberFilterQuery,
      });
      return res.data;
    },
  });

  const teamOptions = useMemo<Option[]>(() => {
    const options: Option[] = [];
    const seen = new Set<number>();
    const records = teamOverviewQuery.data?.data.data === null ? [] : (teamOverviewQuery.data?.data.data ?? []);
    records.forEach((item) => {
      if (item.teamId === null || seen.has(item.teamId)) return;
      seen.add(item.teamId);
      options.push({ label: item.teamName ?? `팀 ${item.teamId}`, value: item.teamId });
    });
    return options;
  }, [teamOverviewQuery.data]);

  const memberPayload = memberQuery.data?.data;
  const rows: CustomerAssignmentMemberRecord[] = memberPayload?.data === null ? [] : (memberPayload?.data ?? []);
  const totalCount = memberPayload?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const showSkeleton = memberQuery.isLoading && !memberQuery.data;
  const showError = memberQuery.isError && !memberQuery.isFetching;
  const showEmpty = !showSkeleton && !showError && (memberPayload?.data === null || rows.length === 0);

  const Header = (
    <div className="mb-5">
      <div className="text-[16px] font-semibold text-foreground">팀원별 배정 현황</div>
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
      <StatsFilterModal
        open={open}
        onClose={() => setOpen(false)}
        onApply={(values) => {
          setFilter(values);
          setPage(1);
          setOpen(false);
        }}
        defaults={filter}
        projectId={projectId}
        showTeam
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
});

export default AssignMemberTable;


