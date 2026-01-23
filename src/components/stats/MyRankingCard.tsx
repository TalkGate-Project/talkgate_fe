import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { RankingMyResponse, RankingMyTeamResponse } from "@/types/statistics";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";
import { formatCurrencyKRMobile } from "@/utils/format";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type Props = {
  projectId: string | null;
  mode: "team" | "member";
  month?: Date | null;
};

export default function MyRankingCard({ projectId, mode, month }: Props) {
  const enabled = Boolean(projectId);
  const year = month ? month.getFullYear() : undefined;
  const monthNum = month ? month.getMonth() + 1 : undefined;

  const query = useQuery<RankingMyResponse | RankingMyTeamResponse>({
    queryKey: ["stats", "ranking", "my", mode, projectId, year, monthNum],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      const queryParams: any = { projectId };
      if (year && monthNum) {
        queryParams.year = year;
        queryParams.month = monthNum;
      }
      return mode === "team"
        ? (await StatisticsService.rankingMyTeam(queryParams)).data
        : (await StatisticsService.rankingMy(queryParams)).data;
    },
  });

  const payload: any = (query.data as any)?.data || null;

  // Don't render anything if no project, loading, error, or no data
  if (!enabled || query.isLoading || query.isError || !payload || !payload.rank) {
    return null;
  }

  const rank: number = payload.rank;
  const name: string = mode === "team" ? payload.teamName ?? "소속없음" : payload.memberName ?? "이름없음";
  const teamName: string | null = mode === "member" ? payload.teamName ?? null : null;
  const amount: number = payload.totalAmount ?? 0;
  const previousAmount: number = payload.previousTotalAmount ?? 0;
  const diff = amount - previousAmount;
  const badgeLabelWeb = `${diff > 0 ? "+" : ""}${NUMBER_FORMATTER.format(diff)}`;
  const badgeLabelMobile = diff === 0 ? "0" : `${diff > 0 ? "+" : "-"}${formatCurrencyKRMobile(Math.abs(diff))}`;

  return (
    <>
      <div className="mt-[30px] md:mt-[30px]">
        <h3 className="text-[16px] font-semibold text-neutral-90">나의 랭킹</h3>
      </div>
      <div className="mt-4 rounded-[12px] bg-neutral-10 border border-primary-60 p-3 md:p-5">
        <div className="surface rounded-[12px] h-[88px] flex items-center px-3 md:px-5 justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {rank === 1 ? (
              <RankingGoldIcon className="w-[50px] h-[50px] md:w-[60px] md:h-[60px]" />
            ) : rank === 2 ? (
              <RankingSilverIcon className="w-[50px] h-[50px] md:w-[60px] md:h-[60px]" />
            ) : rank === 3 ? (
              <RankingBronzeIcon className="w-[50px] h-[50px] md:w-[60px] md:h-[60px]" />
            ) : (
              <div className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-[12px] bg-secondary-10 grid place-items-center text-[16px] md:text-[18px] font-bold text-neutral-60">
                #{rank || "-"}
              </div>
            )}
            <div>
              <div className="text-[16px] md:text-[18px] font-bold text-primary-80">
                {name}
                {teamName && <span className="text-neutral-60 font-medium"> | {teamName}</span>}
              </div>
              <div className="mt-1 text-[12px] md:text-[14px] font-medium text-neutral-90">
                <span className="hidden md:inline">₩ {NUMBER_FORMATTER.format(amount)}원</span>
                <span className="md:hidden">₩ {formatCurrencyKRMobile(amount)}원</span>
              </div>
            </div>
          </div>
          <div className="px-2 py-1 md:px-3 md:py-1 h-[25px] rounded-[30px] grid place-items-center text-[12px] md:text-[14px] font-bold bg-primary-10 text-primary-100 dark:bg-[rgba(214,250,232,0.9)] dark:text-[#004824]">
            <span className="dark:opacity-80 hidden md:inline">{badgeLabelWeb}</span>
            <span className="dark:opacity-80 md:hidden">{badgeLabelMobile}</span>
          </div>
        </div>
      </div>
    </>
  );
}


