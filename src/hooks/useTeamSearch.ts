import { useCallback, useEffect, useMemo, useState } from "react";
import { TeamMember } from "@/types/teams";
import { flattenTeamData } from "@/hooks/useTeamTree";

export function useTeamSearch(teamMembers: TeamMember[]) {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedForSearch, setExpandedForSearch] = useState<Set<string>>(new Set());

  const flattenedMembers = useMemo(() => flattenTeamData(teamMembers), [teamMembers]);
  const lowerSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  const matchingIds = useMemo(() => {
    if (!lowerSearch) return new Set<string>();
    return new Set(
      flattenedMembers
        .filter(
          (member) =>
            member.name.toLowerCase().includes(lowerSearch) ||
            (member.department ? member.department.toLowerCase().includes(lowerSearch) : false)
        )
        .map((member) => member.id)
    );
  }, [flattenedMembers, lowerSearch]);

  const ensureExpandedForMatches = useCallback(
    (items: TeamMember[]) => {
      if (!lowerSearch) return;
      const next = new Set<string>();
      const walk = (nodes: TeamMember[], chain: string[] = []) => {
        nodes.forEach((node) => {
          const nextChain = [...chain, node.id];
          if (matchingIds.has(node.id)) {
            nextChain.slice(0, -1).forEach((id) => next.add(id));
          }
          if (node.children && node.children.length) {
            walk(node.children, nextChain);
          }
        });
      };
      walk(items);
      setExpandedForSearch(next);
    },
    [lowerSearch, matchingIds]
  );

  const executeSearch = useCallback(() => {
    const value = inputValue.trim();
    setSearchTerm(value);
    if (!value) {
      setExpandedForSearch(new Set());
    }
  }, [inputValue]);

  useEffect(() => {
    if (lowerSearch) {
      ensureExpandedForMatches(teamMembers);
    } else {
      setExpandedForSearch(new Set());
    }
  }, [lowerSearch, ensureExpandedForMatches, teamMembers]);

  return {
    inputValue,
    setInputValue,
    searchTerm,
    executeSearch,
    matchingIds,
    expandedForSearch,
  };
}
