import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { RankingMyResponse, RankingMyTeamResponse } from "@/types/statistics";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type Props = {
  projectId: string | null;
  mode: "team" | "member";
};

export default function MyRankingCard({ projectId, mode }: Props) {
  const enabled = Boolean(projectId);

  const query = useQuery<RankingMyResponse | RankingMyTeamResponse>({
    queryKey: ["stats", "ranking", "my", mode, projectId],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      return mode === "team"
        ? (await StatisticsService.rankingMyTeam({ projectId })).data
        : (await StatisticsService.rankingMy({ projectId })).data;
    },
  });

  const payload: any = (query.data as any)?.data || null;

  // Don't render anything if no project, loading, error, or no data
  if (!enabled || query.isLoading || query.isError || !payload) {
    return null;
  }

  const rank: number = payload.rank ?? 0;
  const name: string = mode === "team" ? payload.teamName ?? "소속없음" : payload.memberName ?? "이름없음";
  const teamName: string | null = mode === "member" ? payload.teamName ?? null : null;
  const amount: number = payload.totalAmount ?? 0;
  const changeRateStr: string | null = payload.amountChangeRate ?? null;
  const changeRate = changeRateStr ? Number.parseFloat(changeRateStr) : NaN;
  const badgeColor =
    Number.isNaN(changeRate) ? "bg-neutral-20 text-neutral-70" : changeRate >= 0 ? "bg-primary-10 text-primary-100" : "bg-danger-10 text-danger-60";
  const badgeLabel = Number.isNaN(changeRate) ? "-" : `${changeRate > 0 ? "+" : ""}${changeRate}%`;

  return (
    <div className="mt-4 rounded-[12px] bg-neutral-10 border border-primary-60 p-5">
      <div className="surface rounded-[12px] h-[88px] flex items-center px-5 justify-between">
        <div className="flex items-center gap-4">
          {rank === 1 ? (
            <RankingGoldIcon className="w-[60px] h-[60px]" />
          ) : rank === 2 ? (
            <RankingSilverIcon className="w-[60px] h-[60px]" />
          ) : rank === 3 ? (
            <RankingBronzeIcon className="w-[60px] h-[60px]" />
          ) : (
            <div className="w-[60px] h-[60px] rounded-[12px] bg-secondary-10 grid place-items-center text-[18px] font-bold text-neutral-60">
              #{rank || "-"}
            </div>
          )}
          <div>
            <div className="text-[18px] font-bold text-primary-80">
              {name}
              {teamName && <span className="text-neutral-60 font-medium"> | {teamName}</span>}
            </div>
            <div className="mt-1 text-[14px] font-medium text-neutral-90">₩ {NUMBER_FORMATTER.format(amount)}원</div>
          </div>
        </div>
        <div className={`px-3 h-[25px] rounded-full grid place-items-center text-[14px] font-bold ${badgeColor}`}>
          {badgeLabel}
        </div>
      </div>
    </div>
  );
}


