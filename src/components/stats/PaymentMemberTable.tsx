"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import MemberStatsFilterModal, { type MemberFilterState } from "@/components/common/MemberStatsFilterModal";
import Pagination from "@/components/common/Pagination";
import DateRangePicker from "@/components/common/DateRangePicker";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SortIcon from "@/components/common/SortIcon";
import type {
  CustomerPaymentMemberRecord,
  CustomerPaymentTeamRecord,
  CustomerPaymentByTeamResponse,
  CustomerPaymentByMemberResponse,
} from "@/types/statistics";
import { SortType } from "@/types/statistics";

const PAGE_SIZE = 10;
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");
const COLOR_PALETTE = [
  "var(--warning-20)",
  "var(--primary-20)",
  "var(--danger-20)",
  "var(--secondary-20)",
  "var(--secondary-10)",
  "var(--secondary-40)",
];

function formatCurrency(value: number) {
  return `${NUMBER_FORMATTER.format(value)}원`;
}

function formatCount(value: number) {
  return `${NUMBER_FORMATTER.format(value)}건`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export default function PaymentMemberTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const initialRange = getDefaultRange();
  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);

  const initialTeam = (searchParams.get("payTeam") as string | null) ?? "all";
  const initialSort = (searchParams.get("paySort") as "asc" | "desc" | null) ?? "desc";
  const initialPage = Number.parseInt(searchParams.get("payPage") ?? "1", 10);
  const initialSortType = (searchParams.get("paySortType") as SortType | null) ?? null;
  const initialSortOrder = (searchParams.get("paySortOrder") as "ASC" | "DESC" | null) ?? (initialSortType ? "DESC" : null);

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
    if (teamFilter && teamFilter !== "all") params.set("payTeam", teamFilter);
    else params.delete("payTeam");
    if (sortOrder !== "desc") params.set("paySort", sortOrder);
    else params.delete("paySort");
    if (page > 1) params.set("payPage", String(page));
    else params.delete("payPage");
    if (sortType) params.set("paySortType", sortType);
    else params.delete("paySortType");
    if (sortOrderState) params.set("paySortOrder", sortOrderState);
    else params.delete("paySortOrder");
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamFilter, sortOrder, page, sortType, sortOrderState]);

  const teamQuery = useQuery<CustomerPaymentByTeamResponse>({
    queryKey: ["stats", "payment", "team", { projectId, startDate, endDate }],
    enabled: hasProject,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerPaymentByTeam({ projectId, startDate, endDate });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const sortParam = sortOrderState ?? (sortOrder === "desc" ? "DESC" : "ASC");
  const teamIdParam = teamFilter !== "all" && /^\d+$/.test(teamFilter) ? Number(teamFilter) : undefined;

  const memberQuery = useQuery<CustomerPaymentByMemberResponse>({
    queryKey: [
      "stats",
      "payment",
      "member",
      { projectId, startDate, endDate, page, sort: sortParam, sortType, team: teamIdParam ?? "all" },
    ],
    enabled: hasProject,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.customerPaymentByMember({
        projectId,
        startDate,
        endDate,
        page,
        limit: PAGE_SIZE,
        sortOrder: sortParam,
        ...(sortType ? { sortType } : {}),
        ...(typeof teamIdParam === "number" ? { teamId: teamIdParam } : {}),
      });
      return res.data;
    },
  });

  const teamOptions = useMemo(() => {
    const base = [{ label: "전체", value: "all" }];
    const seen = new Set<string>();
    const records = teamQuery.data?.data.data === null ? [] : (teamQuery.data?.data.data ?? []);
    records
      .filter((item): item is CustomerPaymentTeamRecord => Boolean(item))
      .forEach((item) => {
        if (item.teamId === null) return;
        const value = String(item.teamId);
        if (seen.has(value)) return;
        seen.add(value);
        base.push({ label: item.teamName ?? `팀 ${item.teamId}`, value });
      });
    return base;
  }, [teamQuery.data]);

  const memberPayload = memberQuery.data?.data;
  const rows: CustomerPaymentMemberRecord[] = memberPayload?.data === null ? [] : (memberPayload?.data ?? []);
  const totalCount = memberPayload?.totalCount ?? 0;
  const limit = memberPayload?.limit ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const showSkeleton = memberQuery.isLoading && !memberQuery.data;
  const showError = memberQuery.isError && !memberQuery.isFetching;
  const showEmpty = !showSkeleton && !showError && (memberPayload?.data === null || rows.length === 0);

  const Header = (
    <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-[16px] font-semibold text-foreground">팀원별 결제 현황</div>
        <button
          aria-label="filter"
          className="cursor-pointer w-[26px] h-[26px] grid place-items-center rounded-[6px] border border-border text-neutral-60"
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
      <div className="h-0 border-b border-neutral-30 md:hidden my-3"></div>
      {/* Date range picker */}
      <DateRangePicker
        startDate={startDate ? new Date(startDate) : null}
        endDate={endDate ? new Date(endDate) : null}
        onStartChange={(date) => setStartDate(date ? formatDate(date) : "")}
        onEndChange={(date) => setEndDate(date ? formatDate(date) : "")}
        onReset={() => {
          const r = getDefaultRange();
          setStartDate(r.startDate);
          setEndDate(r.endDate);
        }}
        showInlineIcon
      />
    </div>
  );

  if (waitingForProject) {
    return (
      <div className="mt-1">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-[30px]">
          <LoadingSpinner size="xl" />
        </div>
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="mt-1">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-[30px] text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {Header}
      <div className="h-[40px] bg-neutral-20 rounded-[8px] grid items-center pl-5 md:px-[30px] text-[13px] md:text-[16px] text-neutral-70 font-medium" style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr' }}>
        <div>이름</div>
        <div>팀</div>
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
          if (sortType === SortType.Amount) {
            if (sortOrderState === "DESC") {
              setSortOrderState("ASC");
            } else if (sortOrderState === "ASC") {
              setSortType(null);
              setSortOrderState(null);
            } else {
              setSortOrderState("DESC");
            }
          } else {
            setSortType(SortType.Amount);
            setSortOrderState("DESC");
          }
          setPage(1);
        }}>
          결제금액
          <SortIcon state={sortType === SortType.Amount ? (sortOrderState === "ASC" ? "asc" : sortOrderState === "DESC" ? "desc" : "none") : "none"} />
        </div>
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
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
          결제 건수
          <SortIcon state={sortType === SortType.Count ? (sortOrderState === "ASC" ? "asc" : sortOrderState === "DESC" ? "desc" : "none") : "none"} />
        </div>
      </div>
      <div className="divide-y divide-neutral-30/40 min-h-[280px] bg-card">
        {showSkeleton && (
          <>
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="h-[56px] grid items-center pl-5 md:px-[30px] md:grid-cols-4 border-b border-[#E2E2E2] dark:!border-[#44444455] animate-pulse"
                style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr' }}
              >
                <div className="h-4 bg-neutral-20 rounded" />
                <div className="h-4 bg-neutral-20 rounded" />
                <div className="h-4 bg-neutral-20 rounded" />
                <div className="h-4 bg-neutral-20 rounded" />
              </div>
            ))}
          </>
        )}
        {showError && (
          <div className="flex h-[120px] items-center justify-center text-[14px] text-danger-40">
            결제 통계를 불러오는 중 오류가 발생했습니다.
          </div>
        )}
        {showEmpty && (
          <div className="flex h-[120px] items-center justify-center text-[14px] text-neutral-60">
            {memberPayload?.data === null ? "결제 통계 데이터가 없습니다." : "표시할 데이터가 없습니다."}
          </div>
        )}
        {!showSkeleton && !showError && rows.map((row, index) => {
          const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
          return (
            <div key={`${row.memberId}-${row.memberName}`} className="h-[56px] grid items-center pl-5 md:px-[30px] md:grid-cols-4" style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr' }}>
              <button
                onClick={() => handleMemberClick(row.memberId)}
                className="text-[14px] text-foreground opacity-80 text-left cursor-pointer hover:underline"
              >
                {row.memberName}
              </button>
              <div className="flex items-center gap-2 text-[14px] text-foreground opacity-80">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {row.teamName ?? "미지정"}
              </div>
              <div className="text-[14px] text-foreground opacity-80">{formatCurrency(row.totalAmount)}</div>
              <div className="text-[14px] text-foreground opacity-80">{formatCount(row.paymentCount)}</div>
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


