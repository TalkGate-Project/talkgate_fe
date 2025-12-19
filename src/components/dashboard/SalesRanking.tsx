"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import Panel from "@/components/common/Panel";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { StatisticsService } from "@/services/statistics";
import type { RankingMemberResponse, RankingTeamResponse } from "@/types/statistics";
import { useSalesRankingData, type RankingMode, type RankingRow } from "@/hooks/useSalesRankingData";
import RankingSkeleton from "@/components/dashboard/RankingSkeleton";
import TeamMemberInfoModal from "@/components/settings/teamManagement/TeamMemberInfoModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function SalesRanking() {
  const router = useRouter();
  const [projectId, projectReady] = useSelectedProjectId();
  const waitingForProject = !projectReady;
  const hasProject = projectReady && Boolean(projectId);
  const missingProject = projectReady && !projectId;
  const [mode, setMode] = useState<RankingMode>("team");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const handleRowClick = useCallback((item: RankingRow) => {
    if (!item.memberId) return;
    setSelectedMemberId(item.memberId);
  }, []);

  const closeMemberModal = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const teamQuery = useQuery<RankingTeamResponse>({
    queryKey: ["dashboard", "ranking", "team", projectId],
    enabled: hasProject,
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

  const { rows, loading, error } = useSalesRankingData({ mode, teamQuery, memberQuery });

  return (
    <Panel
      title={<span className="typo-title-4">이달 판매 랭킹</span>}
      action={
        <button
          onClick={() => router.push(`/stats?tab=ranking&rank=${mode}`)}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-border bg-card text-[14px] font-semibold tracking-[-0.02em] text-foreground transition-colors hover:bg-neutral-10"
        >
          더보기
        </button>
      }
      className="rounded-[14px]"
      headerClassName="flex items-center justify-between px-7 pt-[22px]"
      style={{ height: 420, boxShadow: "6px 6px 54px 0px rgba(0, 0, 0, 0.05)" }}
    >
      <div className="w-full bg-neutral-20 rounded-[12px] px-3 py-2 grid grid-cols-2">
        <button
          className={`cursor-pointer h-[31px] rounded-[5px] typo-title-4 ${mode === "team" ? "bg-card text-foreground" : "text-neutral-60"}`}
          onClick={() => setMode("team")}
        >
          팀별
        </button>
        <button
          className={`cursor-pointer h-[31px] rounded-[5px] typo-title-4 ${mode === "member" ? "bg-card text-foreground" : "text-neutral-60"}`}
          onClick={() => setMode("member")}
        >
          팀원별
        </button>
      </div>

      <div className="mt-0">
        {waitingForProject ? (
          <div className="flex h-[240px] items-center justify-center">
            <LoadingSpinner size="2xl" />
          </div>
        ) : missingProject ? (
          <div className="flex h-[240px] items-center justify-center text-[14px] text-neutral-60">
            프로젝트를 먼저 선택해주세요.
          </div>
        ) : loading ? (
          <RankingSkeleton />
        ) : error ? (
          <div className="flex h-[240px] items-center justify-center text-[14px] text-danger-40">
            랭킹 정보를 불러오는 중 문제가 발생했습니다.
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-[14px] text-neutral-60">
            표시할 랭킹 데이터가 없습니다.
          </div>
        ) : (
          <ol>
            {rows.map((item) => (
              <li
                key={`${mode}-${item.rank}-${item.name}`}
                className="flex items-center justify-between py-4 border-b border-[#E2E2E266] dark:border-[#44444466] last:border-b-0 cursor-pointer hover:bg-neutral-10 transition-colors px-1"
                onClick={() => handleRowClick(item)}
              >
                <div className="flex items-center gap-2 pl-3">
                  <span
                    className={`grid place-items-center w-6 h-6 rounded-full text-[14px] font-montserrat ${
                      item.rank <= 3 ? "bg-neutral-90 text-neutral-0" : "bg-neutral-20 text-neutral-60"
                    }`}
                  >
                    {item.rank}
                  </span>
                  <span className="typo-title-4 text-foreground opacity-90">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="typo-body-3 text-foreground opacity-90 font-montserrat leading-[1] pr-[18px]">
                    {item.amountLabel}원
                  </span>
                  {/* <span
                    className={`px-2 py-1 rounded-[5px] typo-caption-2 leading-none bg-neutral-20 text-neutral-60`}
                  >
                    <span className="font-montserrat">{item.changeLabel}</span>
                  </span> */}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      {selectedMemberId && (
        <TeamMemberInfoModal
          open={Boolean(selectedMemberId)}
          memberId={selectedMemberId}
          onClose={closeMemberModal}
          projectId={projectId}
        />
      )}
    </Panel>
  );
}

// formatting helpers moved to @/utils/format


