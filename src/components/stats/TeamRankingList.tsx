import { useStatsTeamRanking } from "@/hooks/useStatsRanking";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type TeamRankingListProps = {
  projectId: string | null;
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-neutral-30 bg-neutral-10 text-[14px] text-neutral-60">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 flex h-[160px] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
    </div>
  );
}

function ErrorState() {
  return (
    <div className="mt-6 flex h-[160px] items-center justify-center rounded-[12px] border border-dashed border-danger-20 bg-danger-10 text-[14px] text-danger-40">
      팀 랭킹을 불러오는 중 문제가 발생했습니다.
    </div>
  );
}

export default function TeamRankingList({ projectId }: TeamRankingListProps) {
  const { rows, isLoading, isError } = useStatsTeamRanking(projectId);

  if (!projectId) {
    return <EmptyState message="프로젝트를 먼저 선택해주세요." />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState />;
  }

  if (!rows.length) {
    return <EmptyState message="표시할 팀 랭킹 데이터가 없습니다." />;
  }

  return (
    <div className="bg-neutral-10 rounded-[12px] p-5">
      <div className="space-y-3">
        {rows.map((row) => {
          const change = row.rankChange ?? 0;
          const changeLabel = change > 0 ? `+${change}` : change < 0 ? `${change}` : "-";
          const badgeColor = change > 0 ? "bg-primary-10 text-primary-100" : change < 0 ? "bg-danger-10 text-danger-60" : "bg-neutral-20 text-neutral-70";
          
          return (
            <div key={`${row.teamId}-${row.teamName}-${row.rank}`} className="surface rounded-[12px] h-[88px] flex items-center px-5 justify-between">
              <div className="flex items-center gap-4">
                {row.rank === 1 ? (
                  <RankingGoldIcon className="w-[60px] h-[60px]" />
                ) : row.rank === 2 ? (
                  <RankingSilverIcon className="w-[60px] h-[60px]" />
                ) : row.rank === 3 ? (
                  <RankingBronzeIcon className="w-[60px] h-[60px]" />
                ) : (
                  <div className="w-[60px] h-[60px] rounded-[12px] bg-secondary-10 grid place-items-center text-[18px] font-bold text-neutral-60">
                    #{row.rank}
                  </div>
                )}
                <div>
                  <div className="text-[18px] font-bold text-neutral-90">{row.teamName ?? "소속없음"}</div>
                  <div className="mt-1 text-[14px] text-neutral-90">₩ {NUMBER_FORMATTER.format(row.totalAmount)}원 / {NUMBER_FORMATTER.format(row.totalCount)}건</div>
                </div>
              </div>
              <div className={`px-3 h-[25px] rounded-full grid place-items-center text-[14px] font-bold ${badgeColor}`}>
                {changeLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

