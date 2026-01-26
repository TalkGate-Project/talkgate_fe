import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { RankingMyResponse, RankingMyTeamResponse } from "@/types/statistics";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";
import { formatCurrencyKRMobile } from "@/utils/format";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type Props = {
  projectId: string | null;
  mode: "team" | "member";
  month?: Date | null;
};

export default function MyRankingCard({ projectId, mode, month }: Props) {
  const year = month ? month.getFullYear() : undefined;
  const monthNum = month ? month.getMonth() + 1 : undefined;
  const enabled = Boolean(projectId) && Boolean(year) && Boolean(monthNum);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProjectId] = useSelectedProjectId();

  // 현재 선택된 월이 이번달인지 확인 (now - 1day 기준)
  const isCurrentMonth = useMemo(() => {
    if (!month) return false;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      month.getFullYear() === yesterday.getFullYear() &&
      month.getMonth() === yesterday.getMonth()
    );
  }, [month]);

  const query = useQuery<RankingMyResponse | RankingMyTeamResponse>({
    queryKey: ["stats", "ranking", "my", mode, projectId, year, monthNum],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트를 선택해주세요.");
      if (!year || !monthNum) throw new Error("년도와 월을 선택해주세요.");
      const queryParams = { projectId, year, month: monthNum };
      return mode === "team"
        ? (await StatisticsService.rankingMyTeam(queryParams)).data
        : (await StatisticsService.rankingMy(queryParams)).data;
    },
  });

  // query.data는 { result: true, data: { data: {...}, roundNumber: ... } } 형태
  // 실제 랭킹 데이터는 query.data.data.data에 있음
  const payload: any = (query.data as any)?.data?.data || null;

  // Don't render anything if no project, loading, error, or no data
  if (!enabled || query.isLoading || query.isError || !payload || !payload.rank) {
    return null;
  }

  const rank: number = payload.rank;
  const name: string = mode === "team" ? payload.teamName ?? "소속없음" : payload.memberName ?? "이름없음";
  const teamName: string | null = mode === "member" ? payload.teamName ?? null : null;
  const amount: number = payload.totalAmount ?? 0;
  
  // 모달을 열기 위한 memberId 추출
  const memberIdForModal: number | null = mode === "team" 
    ? (payload.leaderMemberId ?? null)
    : (payload.memberId ?? null);
  
  // 이번달일 경우 yesterdayRank, yesterdayTotalAmount 사용, 그 외에는 previousRank, previousTotalAmount 사용
  const yesterdayRank: number | null = payload.yesterdayRank ?? null;
  const yesterdayTotalAmount: number | null = payload.yesterdayTotalAmount ?? null;
  const previousAmount: number = isCurrentMonth && yesterdayTotalAmount !== null 
    ? yesterdayTotalAmount 
    : (payload.previousTotalAmount ?? 0);
  
  // 순위 변화 계산 (이번달일 경우만)
  const rankChange = isCurrentMonth && yesterdayRank !== null 
    ? yesterdayRank - rank 
    : null;
  
  // 매출액 변화 계산
  const diff = amount - previousAmount;
  
  // 이번달일 경우 순위 변화와 매출액 변화 표시
  const showRankChange = isCurrentMonth && rankChange !== null;
  const showAmountChange = isCurrentMonth && yesterdayTotalAmount !== null;
  
  const rankChangeLabel = rankChange !== null && rankChange !== 0
    ? `${rankChange > 0 ? "▲" : "▼"} ${Math.abs(rankChange)}위`
    : null;
  
  const badgeLabelWeb = showAmountChange 
    ? `${diff > 0 ? "+" : ""}${NUMBER_FORMATTER.format(diff)}`
    : `${diff > 0 ? "+" : ""}${NUMBER_FORMATTER.format(diff)}`;
  const badgeLabelMobile = diff === 0 ? "0" : `${diff > 0 ? "+" : "-"}${formatCurrencyKRMobile(Math.abs(diff))}`;
  
  const title = mode === "team" ? "나의 팀 랭킹" : "나의 랭킹";

  const handleNameClick = () => {
    if (memberIdForModal) {
      setSelectedMemberId(memberIdForModal);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

  return (
    <>
      <div className="mt-[30px] md:mt-[30px]">
        <h3 className="text-[16px] font-semibold text-neutral-90">{title}</h3>
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
              <div className="text-[16px] md:text-[18px] font-bold text-primary-80 flex items-center gap-2">
                <button
                  onClick={handleNameClick}
                  disabled={!memberIdForModal}
                  className={`text-left ${
                    memberIdForModal ? "cursor-pointer hover:underline" : "cursor-default"
                  }`}
                >
                  {name}
                </button>
                {teamName && <span className="text-neutral-60 font-medium"> | {teamName}</span>}
              </div>
              <div className="mt-1 text-[12px] md:text-[14px] font-medium text-neutral-90">
                <span className="hidden md:inline">₩ {NUMBER_FORMATTER.format(amount)}원</span>
                <span className="md:hidden">₩ {formatCurrencyKRMobile(amount)}원</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showRankChange && rankChange !== null && rankChange !== 0 && (
              <div 
                className="flex items-center justify-end px-3 py-1 h-[25px] rounded-[30px] text-[14px] font-bold opacity-80"
                style={{
                  background: '#EDEDED',
                  color: rankChange > 0 ? '#D83232' : '#4D82F3'
                }}
              >
                {rankChange > 0 ? '▲' : '▼'} {Math.abs(rankChange)}위
              </div>
            )}
            {showAmountChange && (
              <div className="px-2 py-1 md:px-3 md:py-1 h-[25px] rounded-[30px] grid place-items-center text-[12px] md:text-[14px] font-bold bg-primary-10 text-primary-100 dark:bg-[rgba(214,250,232,0.9)] dark:text-[#004824]">
                <span className="dark:opacity-80 hidden md:inline">{badgeLabelWeb}</span>
                <span className="dark:opacity-80 md:hidden">{badgeLabelMobile}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedMemberId !== null && (
        <TeamMemberInfoModal
          open={isModalOpen}
          memberId={selectedMemberId}
          onClose={handleCloseModal}
          projectId={currentProjectId}
        />
      )}
    </>
  );
}


