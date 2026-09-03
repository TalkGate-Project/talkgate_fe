"use client";

import { useMemo, useState } from "react";
import { flattenTeamData } from "@/hooks/useTeamTree";
import { TeamMember } from "@/types/teams";
import TeamNameBadge from "@/components/common/TeamNameBadge";
import TeamSearchBar from "./TeamSearchBar";

type TeamSummary = {
  name: string;
  leaderMemberId: number;
};

type Props = {
  teams: TeamSummary[];
  members: TeamMember[];
  onNavigate: (memberId: string) => void;
};

export default function TeamTreeNavigator({ teams, members, onNavigate }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) return [];

    return flattenTeamData(members).filter((member) =>
      member.name.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [members, searchTerm]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!value.trim()) {
      setSearchTerm("");
    }
  };

  const executeSearch = () => {
    setSearchTerm(inputValue.trim());
  };

  const hasSearchTerm = Boolean(searchTerm.trim());

  return (
    <div className="relative z-10 flex-shrink-0 pb-3 pr-[42px] pt-4 md:pr-[132px]">
      <TeamSearchBar
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSearch={executeSearch}
        placeholder="배정된 구성원을 검색하세요"
      />

      {!hasSearchTerm ? (
        <div
          className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-30 scrollbar-track-transparent pb-1"
          aria-label="팀 바로가기"
        >
          {teams.map((team) => (
            <button
              key={`${team.leaderMemberId}-${team.name}`}
              type="button"
              onClick={() => onNavigate(String(team.leaderMemberId))}
              className="flex-shrink-0 cursor-pointer rounded-[30px] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
              aria-label={`${team.name} 팀으로 이동`}
            >
              <TeamNameBadge label={team.name} className="transition-opacity hover:opacity-80" />
            </button>
          ))}
        </div>
      ) : searchResults.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-30 scrollbar-track-transparent pb-1"
          aria-label="구성원 검색 결과"
        >
          {searchResults.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onNavigate(member.id)}
              className={`flex h-[22px] flex-shrink-0 cursor-pointer items-center justify-center rounded-[30px] px-3 text-[12px] font-medium transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 ${
                member.isLeader
                  ? "bg-primary-10 text-primary-100 focus-visible:ring-primary-80"
                  : "bg-secondary-10 text-secondary-100 focus-visible:ring-secondary-40"
              }`}
              aria-label={`${member.name}${member.isLeader ? " 팀장" : " 팀원"} 위치로 이동`}
            >
              <span className="whitespace-nowrap">{member.name}</span>
              <span className="ml-1 opacity-70">{member.isLeader ? "팀장" : "팀원"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="h-[22px] text-[12px] leading-[22px] text-muted-foreground">
          일치하는 배정 구성원이 없습니다.
        </p>
      )}
    </div>
  );
}
