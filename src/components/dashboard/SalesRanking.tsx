"use client";

import { useMemo, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import Panel from "@/components/common/Panel";
import { StatisticsService } from "@/services/statistics";
import { getSelectedProjectId } from "@/lib/project";
import type {
  RankingMemberRecord,
  RankingMemberResponse,
  RankingTeamRecord,
  RankingTeamResponse,
} from "@/types/statistics";

type RankingMode = "team" | "member";

export default function SalesRanking() {
  const projectId = getSelectedProjectId();
  const [mode, setMode] = useState<RankingMode>("team");

  const teamQuery = useQuery<RankingTeamResponse>({
    queryKey: ["dashboard", "ranking", "team", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.rankingTeam({ projectId, page: 1, limit: 5 });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const memberQuery = useQuery<RankingMemberResponse>({
    queryKey: ["dashboard", "ranking", "member", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const res = await StatisticsService.rankingMember({ projectId, page: 1, limit: 5 });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const { rows, loading, error } = useRankingData({ mode, teamQuery, memberQuery });

  return (
    <Panel
      title={<span className="typo-title-2">이달 판매 랭킹</span>}
      action={
        <button className="h-[34px] px-3 rounded-[5px] border border-[var(--border)] bg-[var(--neutral-0)] text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-[var(--neutral-10)]">
          더보기
        </button>
      }
      className="rounded-[14px]"
      style={{ height: 420, boxShadow: "6px 6px 54px rgba(0,0,0,0.05)" }}
    >
      <div className="w-full bg-[var(--neutral-20)] rounded-[12px] p-1 grid grid-cols-2">
        <button
          className={`h-[31px] rounded-[5px] typo-title-4 ${mode === "team" ? "bg-[var(--neutral-0)] text-[var(--foreground)]" : "text-[var(--neutral-60)]"}`}
          onClick={() => setMode("team")}
        >
          팀별
        </button>
        <button
          className={`h-[31px] rounded-[5px] typo-title-4 ${mode === "member" ? "bg-[var(--neutral-0)] text-[var(--foreground)]" : "text-[var(--neutral-60)]"}`}
          onClick={() => setMode("member")}
        >
          팀원별
        </button>
      </div>

      <div className="mt-6">
        {!projectId ? (
          <div className="flex h-[240px] items-center justify-center text-[14px] text-[var(--neutral-60)]">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : loading ? (
          <RankingSkeleton />
        ) : error ? (
          <div className="flex h-[240px] items-center justify-center text-[14px] text-[var(--danger-40)]">
            랭킹 정보를 불러오는 중 문제가 발생했습니다.
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-[14px] text-[var(--neutral-60)]">
            표시할 랭킹 데이터가 없습니다.
          </div>
        ) : (
          <ol>
            {rows.map((item) => (
              <li key={`${mode}-${item.rank}-${item.name}`} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid place-items-center w-6 h-6 rounded-full text-[14px] ${
                      item.rank <= 3
                        ? "bg-[var(--neutral-90)] text-[var(--neutral-0)]"
                        : "bg-[var(--neutral-20)] text-[var(--neutral-60)]"
                    }`}
                  >
                    {item.rank}
                  </span>
                  <span className="typo-title-4 text-foreground opacity-90">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="typo-body-3 text-foreground opacity-90">{item.amountLabel}</span>
                  <span
                    className={`px-2 py-1 rounded-[5px] typo-caption-2 leading-none ${
                      item.changePositive
                        ? "bg-[var(--neutral-20)] text-[var(--neutral-60)]"
                        : "bg-[var(--danger-10)] text-[var(--danger-40)]"
                    }`}
                  >
                    {item.changeLabel}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Panel>
  );
}

type RankingRow = {
  rank: number;
  name: string;
  amountLabel: string;
  changeLabel: string;
  changePositive: boolean;
};

function useRankingData({
  mode,
  teamQuery,
  memberQuery,
}: {
  mode: RankingMode;
  teamQuery: UseQueryResult<RankingTeamResponse>;
  memberQuery: UseQueryResult<RankingMemberResponse>;
}) {
  const loading = mode === "team"
    ? teamQuery.isLoading && !teamQuery.data
    : memberQuery.isLoading && !memberQuery.data;

  const error = mode === "team"
    ? teamQuery.isError && !teamQuery.isFetching
    : memberQuery.isError && !memberQuery.isFetching;

  const rows = useMemo<RankingRow[]>(() => {
    if (mode === "team") {
      const payload = teamQuery.data?.data;
      const list: RankingTeamRecord[] = payload?.data ?? [];
      return list.map((item) => ({
        rank: item.rank,
        name: item.teamName ?? "소속없음",
        amountLabel: `₩ ${formatCurrency(item.totalAmount)}`,
        changeLabel: formatRankChange(item.rankChange),
        changePositive: (item.rankChange ?? 0) >= 0,
      }));
    }
    const payload = memberQuery.data?.data;
    const list: RankingMemberRecord[] = payload?.data ?? [];
    return list.map((item) => ({
      rank: item.rank,
      name: item.memberName,
      amountLabel: `₩ ${formatCurrency(item.totalAmount)}`,
      changeLabel: formatPercentChange(item.amountChangeRate),
      changePositive: parseFloatSafe(item.amountChangeRate) >= 0,
    }));
  }, [mode, teamQuery.data, memberQuery.data]);

  return { rows, loading, error } as const;
}

function RankingSkeleton() {
  return (
    <div className="flex h-[240px] flex-col justify-center gap-3">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="mx-2 flex items-center justify-between gap-3">
          <span className="h-6 w-6 rounded-full bg-[var(--neutral-20)]" />
          <span className="flex-1 h-5 rounded bg-[var(--neutral-20)]" />
          <span className="h-5 w-20 rounded bg-[var(--neutral-20)]" />
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatRankChange(change: number | null | undefined) {
  if (change === null || change === undefined) return "-";
  if (change === 0) return "유지";
  return `${change > 0 ? "+" : ""}${change}`;
}

function parseFloatSafe(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatPercentChange(value: string | number | null | undefined) {
  const parsed = parseFloatSafe(value);
  if (parsed === 0) return "0%";
  const display = Math.round(parsed * 10) / 10;
  return `${display > 0 ? "+" : ""}${display}%`;
}


