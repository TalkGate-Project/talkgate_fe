type RankingChangeSource = {
  rank: number;
  totalAmount: number;
  previousRank?: number | null;
  rankChange?: number | null;
  previousTotalAmount?: number | null;
  yesterdayRank?: number | null;
  yesterdayTotalAmount?: number | null;
};

export function getCurrentMonthRankingChange(source: RankingChangeSource) {
  const comparisonRank = source.yesterdayRank ?? source.previousRank ?? null;
  const comparisonAmount =
    source.yesterdayTotalAmount ?? source.previousTotalAmount ?? null;

  const rankChange =
    comparisonRank !== null
      ? comparisonRank - source.rank
      : source.rankChange ?? null;

  const amountDiff =
    comparisonAmount !== null ? source.totalAmount - comparisonAmount : null;

  return {
    comparisonRank,
    comparisonAmount,
    rankChange,
    amountDiff,
    showRankChange: rankChange !== null,
    showAmountChange: amountDiff !== null,
  };
}
