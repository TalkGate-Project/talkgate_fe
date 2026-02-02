import { useState, useEffect, useMemo } from "react";
import { useStatsTeamRanking } from "@/hooks/useStatsRanking";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import RankingGoldIcon from "@/components/common/icons/RankingGoldIcon";
import RankingSilverIcon from "@/components/common/icons/RankingSilverIcon";
import RankingBronzeIcon from "@/components/common/icons/RankingBronzeIcon";
import Pagination from "@/components/common/Pagination";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatCurrencyKRMobile, formatAmountChangeKRWithUnit } from "@/utils/format";

const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type TeamRankingListProps = {
  projectId: string | null;
  month?: Date | null;
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
      <LoadingSpinner size="2xl" />
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

export default function TeamRankingList({ projectId, month }: TeamRankingListProps) {
  const [page, setPage] = useState(1);
  const limit = 5;
  const { rows, totalCount, isLoading, isError } = useStatsTeamRanking(projectId, page, limit, month);
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

  useEffect(() => {
    setPage(1);
  }, [projectId, month]);

  const handleTeamClick = (leaderMemberId: number | null) => {
    if (leaderMemberId) {
      setSelectedMemberId(leaderMemberId);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemberId(null);
  };

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

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      <div className="bg-neutral-10 rounded-[12px] px-3 py-3 md:px-7 md:py-5">
        <div className="space-y-2 md:space-y-3">
          {rows.map((row) => {
            // 이번달일 경우 yesterdayTotalAmount 사용, 그 외에는 previousTotalAmount 사용
            const previousAmount = isCurrentMonth && row.yesterdayTotalAmount !== null
              ? row.yesterdayTotalAmount
              : (row.previousTotalAmount ?? 0);
            const diff = row.totalAmount - previousAmount;
            
            // 이번달일 경우만 변화량 표시
            const showChange = isCurrentMonth && row.yesterdayTotalAmount !== null;
            
            // 순위 변화 계산 (이번달일 경우만)
            const rankChange = isCurrentMonth && row.yesterdayRank !== null 
              ? row.yesterdayRank - row.rank 
              : null;
            
            // 이번달일 경우 순위 변화와 매출액 변화 표시
            const showRankChange = isCurrentMonth && rankChange !== null;
            
            const changeLabelWeb = showChange 
              ? formatAmountChangeKRWithUnit(diff)
              : "";
            const changeLabelMobile = showChange
              ? formatAmountChangeKRWithUnit(diff)
              : "";
            
            return (
              <div key={`${row.teamId}-${row.teamName}-${row.rank}`} className="bg-white dark:bg-neutral-20 rounded-[12px] h-[88px] flex items-center md:items-center px-5 py-3 md:py-0 justify-between">
                <div className="flex flex-col md:flex-row md:items-center gap-[10px] md:gap-4 md:gap-10">
                  <div className="flex items-center gap-2">
                    {row.rank === 1 ? (
                      <RankingGoldIcon className="w-6 h-6 md:w-[60px] md:h-[60px] flex-shrink-0" />
                    ) : row.rank === 2 ? (
                      <RankingSilverIcon className="w-6 h-6 md:w-[60px] md:h-[60px] flex-shrink-0" />
                    ) : row.rank === 3 ? (
                      <RankingBronzeIcon className="w-6 h-6 md:w-[60px] md:h-[60px] flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 md:w-[60px] md:h-[60px] rounded-[12px] bg-neutral-10 dark:bg-neutral-30 grid place-items-center text-[10px] md:text-[18px] font-bold text-neutral-60 dark:text-neutral-70 flex-shrink-0">
                        <span className="md:hidden">#{row.rank}</span>
                        <span className="hidden md:inline">#{row.rank}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleTeamClick(row.leaderMemberId)}
                      disabled={!row.leaderMemberId}
                      className={`text-[16px] md:text-[18px] leading-[21px] font-bold text-neutral-90 dark:text-neutral-80 text-left ${
                        row.leaderMemberId ? "cursor-pointer hover:underline" : "cursor-default"
                      }`}
                    >
                      {row.teamName ?? "소속없음"}
                    </button>
                  </div>
                  {/* 모바일: 좌하단 - 금액 */}
                  <div className="text-[14px] md:text-[14px] leading-[1] text-neutral-90 dark:text-neutral-80 md:mt-2 md:mt-3">
                    <span className="hidden md:inline">₩ {NUMBER_FORMATTER.format(row.totalAmount)}원</span>
                    <span className="md:hidden">{formatCurrencyKRMobile(row.totalAmount)}원</span>
                  </div>
                </div>
                {/* 모바일: 우측 영역 */}
                <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-2">
                  {/* 모바일: 우상단 - rankChange 뱃지 */}
                  {showRankChange && rankChange !== null && rankChange !== 0 && (
                    <div 
                      className="flex items-center justify-end px-3 py-1 h-[25px] rounded-[30px] text-[12px] md:text-[14px] font-bold bg-neutral-20 dark:bg-neutral-30 text-neutral-90 dark:text-neutral-80"
                    >
                      {Math.abs(rankChange)}위&nbsp;<span style={{ color: rankChange > 0 ? '#D83232' : '#4D82F3' }}>{rankChange > 0 ? '▲' : '▼'}</span>
                    </div>
                  )}
                  {/* 모바일: 우하단 - 변화량 */}
                  {showChange && diff !== 0 && (
                    <div className="px-2 md:px-3 h-[25px] rounded-[30px] grid place-items-center text-[12px] md:text-[14px] font-bold bg-primary-10 text-primary-100 dark:bg-[rgba(214,250,232,0.9)] dark:text-[#004824]">
                      <span className="dark:opacity-80 hidden md:inline">{changeLabelWeb}</span>
                      <span className="dark:opacity-80 md:hidden">{changeLabelMobile}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
      {selectedMemberId !== null && (
        <TeamMemberInfoModal
          open={isModalOpen}
          memberId={selectedMemberId}
          onClose={handleCloseModal}
          projectId={currentProjectId}
        />
      )}
    </div>
  );
}

