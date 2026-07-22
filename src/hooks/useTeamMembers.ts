import { useMemo } from "react";
import { MemberTreeNode } from "@/types/membersTree";
import { transformMembers, isAssignedMember } from "@/utils/teamManagement";

function splitMembersByAssignment(
  nodes: MemberTreeNode[],
  teamNameByLeader: Map<number, string>,
  depth: number = 0,
  hasAssignedAncestor: boolean = false
): { assigned: MemberTreeNode[]; unassigned: MemberTreeNode[] } {
  const assigned: MemberTreeNode[] = [];
  const unassigned: MemberTreeNode[] = [];

  nodes.forEach((node) => {
    // 루트에 떠 있는 일반 멤버는 팀명이 있더라도 미배정 목록으로 분류한다.
    // (API 트리/팀 메타가 잠시 불일치하는 케이스 방어)
    const isRootMember = depth === 0 && node.role !== "leader";
    const selfAssigned = !isRootMember && isAssignedMember(node, teamNameByLeader);
    const { assigned: assignedDescendants, unassigned: unassignedDescendants } = splitMembersByAssignment(
      node.descendants ?? [],
      teamNameByLeader,
      depth + 1,
      hasAssignedAncestor || selfAssigned
    );
    const assignedMember = hasAssignedAncestor || selfAssigned;
    const currentNode: MemberTreeNode = {
      ...node,
      descendants: assignedMember ? assignedDescendants : unassignedDescendants,
    };

    if (assignedMember) {
      assigned.push(currentNode);
      unassigned.push(...unassignedDescendants);
      return;
    }

    unassigned.push(currentNode);
    assigned.push(...assignedDescendants);
  });

  return { assigned, unassigned };
}

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
    const { assigned, unassigned } = splitMembersByAssignment(treeData, teamNameByLeader);
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
