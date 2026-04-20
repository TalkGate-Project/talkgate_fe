import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatisticsService } from "@/services/statistics";
import type { RankingMyResponse, RankingMyTeamResponse } from "@/types/statistics";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";
import { formatCurrencyKRMobile, formatAmountChangeKRWithUnit } from "@/utils/format";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { isCurrentRankingMonth } from "@/utils/datetime";
import { getCurrentMonthRankingChange } from "@/utils/ranking";

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

  const isCurrentMonth = useMemo(() => {
    return isCurrentRankingMonth(month);
  }, [month]);

  const query = useQuery<RankingMyResponse | RankingMyTeamResponse>({
    queryKey: ["stats", "ranking", "my", mode, projectId, year, monthNum],
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
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
  
  const rankingChange = getCurrentMonthRankingChange({
    rank,
    totalAmount: amount,
    previousRank: payload.previousRank,
    rankChange: payload.rankChange,
    previousTotalAmount: payload.previousTotalAmount,
    yesterdayRank: payload.yesterdayRank,
    yesterdayTotalAmount: payload.yesterdayTotalAmount,
  });

  const diff = rankingChange.amountDiff ?? 0;
  const rankChange = rankingChange.rankChange;
  const showRankChange = isCurrentMonth && rankingChange.showRankChange;
  const showAmountChange = isCurrentMonth && rankingChange.showAmountChange;
  
  const badgeLabelWeb = showAmountChange 
    ? formatAmountChangeKRWithUnit(diff)
    : "";
  const badgeLabelMobile = showAmountChange
    ? formatAmountChangeKRWithUnit(diff)
    : "";
  
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
        <div className="bg-white dark:bg-neutral-20 rounded-[12px] h-[88px] flex items-center md:items-center px-5 py-3 md:py-0 justify-between">
          {/* 모바일: 좌측 영역 */}
          <div className="flex flex-col md:flex-row md:items-center gap-[10px] md:gap-3 md:gap-4">
            {/* 모바일: 좌상단 - 아이콘 | 이름 | 팀 */}
            <div className="flex items-center gap-2">
              {rank === 1 ? (
                <RankingGoldIcon className="w-6 h-6 md:w-[60px] md:h-[60px] flex-shrink-0" />
              ) : rank === 2 ? (
                <RankingSilverIcon className="w-6 h-6 md:w-[60px] md:h-[60px] flex-shrink-0" />
              ) : rank === 3 ? (
                <RankingBronzeIcon className="w-6 h-6 md:w-[60px] md:h-[60px] flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 md:w-[60px] md:h-[60px] rounded-[12px] bg-secondary-10 dark:bg-neutral-30 grid place-items-center text-[10px] md:text-[18px] font-bold text-neutral-60 dark:text-neutral-70 flex-shrink-0">
                  <span className="md:hidden">#{rank || "-"}</span>
                  <span className="hidden md:inline">#{rank || "-"}</span>
                </div>
              )}
              <div className="text-[16px] md:text-[18px] font-bold text-primary-80 dark:text-primary-40 flex items-center gap-2">
                <button
                  onClick={handleNameClick}
                  disabled={!memberIdForModal}
                  className={`text-left ${
                    memberIdForModal ? "cursor-pointer hover:underline" : "cursor-default"
                  }`}
                >
                  {name}
                </button>
                {teamName && <span className="text-[14px] md:text-[18px] text-neutral-60 dark:text-neutral-60 font-medium"> | {teamName}</span>}
              </div>
            </div>
            {/* 모바일: 좌하단 - 금액 */}
            <div className="text-[14px] md:text-[14px] font-medium text-neutral-90 dark:text-neutral-80 md:mt-1">
              <span className="hidden md:inline">₩ {NUMBER_FORMATTER.format(amount)}원</span>
              <span className="md:hidden">{formatCurrencyKRMobile(amount)}원</span>
            </div>
          </div>
          {/* 모바일: 우측 영역 */}
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-2">
            {/* 모바일: 우상단 - rankChange 뱃지 */}
            {showRankChange && rankChange !== null && rankChange !== 0 && (
              <div 
                className="flex items-center justify-end px-3 py-1 h-[25px] rounded-[30px] text-[12px] md:text-[14px] font-bold bg-neutral-20 dark:bg-neutral-30 text-neutral-90 dark:text-neutral-80"
              >
                {Math.abs(rankChange)}&nbsp;<span style={{ color: rankChange > 0 ? '#D83232' : '#4D82F3' }}>{rankChange > 0 ? '▲' : '▼'}</span>
              </div>
            )}
            {/* 모바일: 우하단 - 변화량 */}
            {showAmountChange && diff !== 0 && (
              <div className="px-2 md:px-3 h-[25px] rounded-[30px] grid place-items-center text-[12px] md:text-[14px] font-bold bg-primary-10 text-primary-100 dark:bg-[rgba(214,250,232,0.9)] dark:text-[#004824]">
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


