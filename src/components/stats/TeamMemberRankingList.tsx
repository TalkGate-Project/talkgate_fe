import { useStatsMemberRanking } from "@/hooks/useStatsRanking";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type TeamMemberRankingListProps = {
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
      팀원 랭킹을 불러오는 중 문제가 발생했습니다.
    </div>
  );
}

export default function TeamMemberRankingList({ projectId }: TeamMemberRankingListProps) {
  const { rows, isLoading, isError } = useStatsMemberRanking(projectId);

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
    return <EmptyState message="표시할 팀원 랭킹 데이터가 없습니다." />;
  }

  return (
    <div className="bg-neutral-10 rounded-[12px] p-5">
      <div className="space-y-3">
        {rows.map((row) => {
          const changeRate = row.amountChangeRate ?? "0";
          const rateValue = Number.parseFloat(changeRate);
          const badgeColor = Number.isNaN(rateValue)
            ? "bg-neutral-20 text-neutral-70"
            : rateValue >= 0
              ? "bg-primary-10 text-primary-100"
              : "bg-danger-10 text-danger-60";
          const badgeLabel = Number.isNaN(rateValue) ? "-" : `${rateValue > 0 ? "+" : ""}${rateValue}%`;
          
          return (
            <div key={`${row.memberId}-${row.memberName}`} className="surface rounded-[12px] h-[88px] flex items-center px-5 justify-between">
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
                  <div className="text-[18px] font-bold text-neutral-90 flex items-center gap-2">
                    {row.memberName}
                    <span className="text-[14px] font-medium text-neutral-60">
                      {typeof row.previousRank === "number" ? `전 순위 ${row.previousRank}` : "전 순위 정보 없음"}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] text-neutral-90">₩ {NUMBER_FORMATTER.format(row.totalAmount)}원</div>
                </div>
              </div>
              <div className={`px-3 h-[25px] rounded-full grid place-items-center text-[14px] font-bold ${badgeColor}`}>
                {badgeLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

