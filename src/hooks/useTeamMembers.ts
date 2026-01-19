import { useMemo } from "react";
import { MemberTreeNode } from "@/types/membersTree";
import { TeamMember } from "@/types/teams";
import { transformMembers, isAssignedMember } from "@/utils/teamManagement";

export function useTeamMembers(
  treeData: MemberTreeNode[] | undefined,
  teamsData: Array<{ leaderMemberId: number; name: string }> | undefined
) {
  const teamNameByLeader = useMemo(() => {
    const map = new Map<number, string>();
    (teamsData ?? []).forEach((team) => {
      map.set(team.leaderMemberId, team.name);
    });
    return map;
  }, [teamsData]);

  const { assignedTreeData, unassignedTreeData } = useMemo(() => {
    if (!treeData) return { assignedTreeData: [], unassignedTreeData: [] };

    const assigned: MemberTreeNode[] = [];
    const unassigned: MemberTreeNode[] = [];

    treeData.forEach((node) => {
      if (isAssignedMember(node, teamNameByLeader)) {
        assigned.push(node);
      } else {
        unassigned.push(node);
      }
    });

    return { assignedTreeData: assigned, unassignedTreeData: unassigned };
  }, [treeData, teamNameByLeader]);

  const teamMembers = useMemo(
    () => transformMembers(treeData, teamNameByLeader),
    [treeData, teamNameByLeader]
  );
  const assignedMembers = useMemo(
    () => transformMembers(assignedTreeData, teamNameByLeader),
    [assignedTreeData, teamNameByLeader]
  );
  const unassignedMembers = useMemo(
    () => transformMembers(unassignedTreeData, teamNameByLeader),
    [unassignedTreeData, teamNameByLeader]
  );

  return {
    teamMembers,
    assignedMembers,
    unassignedMembers,
    teamNameByLeader,
  };
}
