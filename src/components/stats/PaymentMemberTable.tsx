"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import MemberStatsFilterModal, { type MemberFilterState } from "@/components/common/MemberStatsFilterModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type {
  CustomerPaymentMemberRecord,
  CustomerPaymentTeamRecord,
  CustomerPaymentByTeamResponse,
  CustomerPaymentByMemberResponse,
} from "@/types/statistics";

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
  const { startDate, endDate } = getDefaultRange();

  const initialTeam = (searchParams.get("payTeam") as string | null) ?? "all";
  const initialSort = (searchParams.get("paySort") as MemberFilterState["sort"] | null) ?? "desc";
  const initialPage = Number.parseInt(searchParams.get("payPage") ?? "1", 10);

  const [open, setOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<MemberFilterState["team"]>(initialTeam);
  const [sortOrder, setSortOrder] = useState<MemberFilterState["sort"]>(initialSort === "asc" ? "asc" : "desc");
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (teamFilter && teamFilter !== "all") params.set("payTeam", teamFilter);
    else params.delete("payTeam");
    if (sortOrder !== "desc") params.set("paySort", sortOrder);
    else params.delete("paySort");
    if (page > 1) params.set("payPage", String(page));
    else params.delete("payPage");
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamFilter, sortOrder, page]);

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

  const sortParam = sortOrder === "desc" ? "DESC" : "ASC";
  const teamIdParam = teamFilter !== "all" && /^\d+$/.test(teamFilter) ? Number(teamFilter) : undefined;

  const memberQuery = useQuery<CustomerPaymentByMemberResponse>({
    queryKey: [
      "stats",
      "payment",
      "member",
      { projectId, startDate, endDate, page, sort: sortParam, team: teamIdParam ?? "all" },
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
  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, idx) => idx + 1), [totalPages]);

  const showSkeleton = memberQuery.isLoading && !memberQuery.data;
  const showError = memberQuery.isError && !memberQuery.isFetching;
  const showEmpty = !showSkeleton && !showError && (memberPayload?.data === null || rows.length === 0);

  const Header = (
    <div className="mb-3 flex items-center gap-2">
      <div className="text-[16px] font-semibold text-neutral-90">팀원별 결제 현황</div>
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
      <div className="mt-1">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
        </div>
      </div>
    );
  }

  if (missingProject) {
    return (
      <div className="mt-1">
        {Header}
        <div className="flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-card px-6 text-[14px] text-neutral-60">
          프로젝트를 먼저 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1">
      {Header}
      <div className="h-[48px] bg-neutral-20 rounded-[12px] grid grid-cols-4 items-center px-6 text-[16px] text-neutral-60 font-semibold">
        <div>이름</div>
        <div>팀</div>
        <div>결제금액</div>
        <div>결제 건수</div>
      </div>
      <div className="divide-y divide-neutral-30 min-h-[280px] bg-card">
        {showSkeleton && <SkeletonRows columns={4} rows={PAGE_SIZE} />}
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
            <div key={`${row.memberId}-${row.memberName}`} className="h-[56px] grid grid-cols-4 items-center px-6">
              <div className="text-[14px] text-neutral-90 opacity-80">{row.memberName}</div>
              <div className="flex items-center gap-2 text-[14px] text-neutral-90">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {row.teamName ?? "미지정"}
              </div>
              <div className="text-[14px] text-neutral-90">{formatCurrency(row.totalAmount)}</div>
              <div className="text-[14px] text-neutral-90">{formatCount(row.paymentCount)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[14px] text-neutral-60">
        <button
          className="w-8 h-8 rounded-full grid place-items-center border-2 border-neutral-40 rotate-90 disabled:border-neutral-30 disabled:text-neutral-40"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
        />
        {pageNumbers.map((num) => (
          <button
            key={num}
            className={`w-8 h-8 rounded-full grid place-items-center ${num === page ? "bg-neutral-90 text-neutral-0" : ""}`}
            onClick={() => setPage(num)}
          >
            {num}
          </button>
        ))}
        <button
          className="w-8 h-8 rounded-full grid place-items-center border-2 border-neutral-40 -rotate-90 disabled:border-neutral-30 disabled:text-neutral-40"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
        />
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
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
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

