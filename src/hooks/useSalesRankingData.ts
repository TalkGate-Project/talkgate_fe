import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  RankingMemberRecord,
  RankingMemberResponse,
  RankingTeamRecord,
  RankingTeamResponse,
} from "@/types/statistics";
import { formatCurrencyKR, formatAmountChangeKR, formatPercentChange, formatRankChange, parseFloatSafe } from "@/utils/format";

export type RankingMode = "team" | "member";

export type RankingRow = {
  rank: number;
  name: string;
  amountLabel: string;
  changeLabel: string;
  changePositive: boolean;
};

export function useSalesRankingData({
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
      if (payload?.data === null) return [];
      const list: RankingTeamRecord[] = payload?.data ?? [];
      return list.map((item) => ({
        rank: item.rank,
        name: item.teamName ?? "소속없음",
        amountLabel: `₩ ${formatCurrencyKR(item.totalAmount)}`,
        changeLabel: formatAmountChangeKR(item.totalAmount, item.previousTotalAmount),
        changePositive: item.previousTotalAmount !== null && item.previousTotalAmount !== undefined
          ? item.totalAmount >= item.previousTotalAmount
          : true,
      }));
    }
    const payload = memberQuery.data?.data;
    if (payload?.data === null) return [];
    const list: RankingMemberRecord[] = payload?.data ?? [];
    return list.map((item) => ({
      rank: item.rank,
      name: item.memberName,
      amountLabel: `₩ ${formatCurrencyKR(item.totalAmount)}`,
      changeLabel: formatAmountChangeKR(item.totalAmount, item.previousTotalAmount),
      changePositive: item.previousTotalAmount !== null && item.previousTotalAmount !== undefined
        ? item.totalAmount >= item.previousTotalAmount
        : true,
    }));
  }, [mode, teamQuery.data, memberQuery.data]);

  return { rows, loading, error } as const;
}


