"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type MemberSearchResult = {
  member: TeamMember;
  teamName: string;
};

function flattenMembersWithTeam(
  members: TeamMember[],
  teamNameByLeaderId: Map<string, string>,
  inheritedTeamName: string = ""
): MemberSearchResult[] {
  return members.flatMap((member) => {
    const teamName = teamNameByLeaderId.get(member.id) ?? inheritedTeamName;
    return [
      { member, teamName },
      ...flattenMembersWithTeam(member.children ?? [], teamNameByLeaderId, teamName),
    ];
  });
}

export default function TeamTreeNavigator({ teams, members, onNavigate }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [areTeamsExpanded, setAreTeamsExpanded] = useState(false);
  const [canToggleTeams, setCanToggleTeams] = useState(false);
  const teamListRef = useRef<HTMLDivElement>(null);
  const [areSearchResultsExpanded, setAreSearchResultsExpanded] = useState(false);
  const [canToggleSearchResults, setCanToggleSearchResults] = useState(false);
  const searchResultListRef = useRef<HTMLDivElement>(null);

  const teamNameByLeaderId = useMemo(
    () => new Map(teams.map((team) => [String(team.leaderMemberId), team.name])),
    [teams]
  );

  const searchResults = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) return [];

    return flattenMembersWithTeam(members, teamNameByLeaderId).filter(({ member }) =>
      member.name.toLowerCase().includes(normalizedSearchTerm)
    );
  }, [members, searchTerm, teamNameByLeaderId]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!value.trim()) {
      setSearchTerm("");
      setAreSearchResultsExpanded(false);
    }
  };

  const executeSearch = () => {
    setAreSearchResultsExpanded(false);
    setSearchTerm(inputValue.trim());
  };

  const hasSearchTerm = Boolean(searchTerm.trim());

  useEffect(() => {
    if (hasSearchTerm) return;
    const teamListElement = teamListRef.current;
    if (!teamListElement) return;

    const updateTeamOverflow = () => {
      const teamButtons = Array.from(teamListElement.children) as HTMLElement[];
      const columnGap = Number.parseFloat(window.getComputedStyle(teamListElement).columnGap) || 0;
      const contentWidth = teamButtons.reduce(
        (totalWidth, button) => totalWidth + button.offsetWidth,
        Math.max(0, teamButtons.length - 1) * columnGap
      );
      const hasOverflow = contentWidth > teamListElement.clientWidth + 1;
      setCanToggleTeams(hasOverflow);
      if (!hasOverflow) setAreTeamsExpanded(false);
    };

    updateTeamOverflow();
    const resizeObserver = new ResizeObserver(updateTeamOverflow);
    resizeObserver.observe(teamListElement);
    return () => resizeObserver.disconnect();
  }, [hasSearchTerm, teams]);

  useEffect(() => {
    if (!hasSearchTerm) return;
    const searchResultListElement = searchResultListRef.current;
    if (!searchResultListElement) return;

    const updateSearchResultOverflow = () => {
      const resultButtons = Array.from(searchResultListElement.children) as HTMLElement[];
      const columnGap = Number.parseFloat(window.getComputedStyle(searchResultListElement).columnGap) || 0;
      const contentWidth = resultButtons.reduce(
        (totalWidth, button) => totalWidth + button.offsetWidth,
        Math.max(0, resultButtons.length - 1) * columnGap
      );
      const hasOverflow = contentWidth > searchResultListElement.clientWidth + 1;
      setCanToggleSearchResults(hasOverflow);
      if (!hasOverflow) setAreSearchResultsExpanded(false);
    };

    updateSearchResultOverflow();
    const resizeObserver = new ResizeObserver(updateSearchResultOverflow);
    resizeObserver.observe(searchResultListElement);
    return () => resizeObserver.disconnect();
  }, [hasSearchTerm, searchResults]);

  return (
    <div className="relative z-10 flex-shrink-0 pb-3 pr-[42px] pt-4 md:pr-[132px]">
      <TeamSearchBar
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSearch={executeSearch}
        placeholder="배정된 구성원을 검색하세요"
      />

      {!hasSearchTerm ? (
        <div className="flex min-h-[22px] items-start gap-2" aria-label="팀 바로가기">
          <div
            ref={teamListRef}
            className={`flex min-w-0 flex-1 gap-2 ${
              areTeamsExpanded
                ? "flex-wrap overflow-visible pb-[6px]"
                : "max-h-[28px] flex-nowrap overflow-hidden pb-[6px]"
            }`}
          >
            {teams.map((team) => (
              <button
                key={`${team.leaderMemberId}-${team.name}`}
                type="button"
                onClick={() => onNavigate(String(team.leaderMemberId))}
                className="flex-shrink-0 cursor-pointer rounded-[30px] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
                aria-label={`${team.name} 팀으로 이동`}
              >
                <TeamNameBadge
                  label={team.name}
                  className="transition-opacity hover:opacity-80"
                />
              </button>
            ))}
          </div>

          {canToggleTeams && (
            <button
              type="button"
              onClick={() => setAreTeamsExpanded((isExpanded) => !isExpanded)}
              className="mt-[3px] flex h-[22px] w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded text-neutral-50 hover:text-neutral-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
              aria-expanded={areTeamsExpanded}
              aria-label={areTeamsExpanded ? "팀 바로가기 접기" : "팀 바로가기 펼치기"}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d={areTeamsExpanded ? "M4 11L9 6L14 11" : "M4 7L9 12L14 7"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="flex min-h-[22px] items-start gap-2" aria-label="구성원 검색 결과">
          <div
            ref={searchResultListRef}
            className={`flex min-w-0 flex-1 gap-2 ${
              areSearchResultsExpanded
                ? "flex-wrap overflow-visible pb-[6px]"
                : "max-h-[28px] flex-nowrap overflow-hidden pb-[6px]"
            }`}
          >
            {searchResults.map(({ member, teamName }) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onNavigate(member.id)}
                className="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-[30px] transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
                aria-label={`${teamName ? `${teamName} ` : ""}${member.name}${member.isLeader ? " 팀장" : " 팀원"} 위치로 이동`}
              >
                {teamName && <TeamNameBadge label={teamName} />}
                <span
                  className={`flex h-[22px] items-center justify-center rounded-[30px] px-3 text-[12px] font-medium ${
                    member.isLeader
                      ? "bg-primary-10 text-primary-100"
                      : "bg-secondary-10 text-secondary-100"
                  }`}
                >
                  <span className="whitespace-nowrap">{member.name}</span>
                </span>
              </button>
            ))}
          </div>

          {canToggleSearchResults && (
            <button
              type="button"
              onClick={() => setAreSearchResultsExpanded((isExpanded) => !isExpanded)}
              className="mt-[3px] flex h-[22px] w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded text-neutral-50 hover:text-neutral-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
              aria-expanded={areSearchResultsExpanded}
              aria-label={areSearchResultsExpanded ? "검색 결과 접기" : "검색 결과 펼치기"}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d={areSearchResultsExpanded ? "M4 11L9 6L14 11" : "M4 7L9 12L14 7"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <p className="h-[22px] text-[12px] leading-[22px] text-muted-foreground">
          일치하는 배정 구성원이 없습니다.
        </p>
      )}
    </div>
  );
}
