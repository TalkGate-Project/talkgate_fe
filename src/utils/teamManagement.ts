import { TeamMember } from "@/types/teams";
import { MemberTreeNode } from "@/types/membersTree";

const ROLE_LABEL: Record<string, string> = {
  leader: "리더",
  member: "팀원",
};

export function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0);
}

export function transformMembers(
  nodes: MemberTreeNode[] | undefined,
  teamNameByLeader: Map<number, string>,
  parentId?: string,
  level: number = 0
): TeamMember[] {
  if (!nodes) return [];
  return nodes.map((node) => {
    const id = String(node.id);
    const teamName = node.teamName || teamNameByLeader.get(node.id) || "";
    const department = teamName || ROLE_LABEL[node.role] || node.role;
    const isLeader = teamNameByLeader.has(node.id) || node.role === "leader";
    const children = transformMembers(node.descendants, teamNameByLeader, id, level + 1);
    return {
      id,
      name: node.name,
      avatar: initialFromName(node.name),
      role: department,
      department,
      isLeader,
      level,
      parentId,
      children,
      isExpanded: true,
    };
  });
}

export function isAssignedMember(node: MemberTreeNode, teamNameByLeader: Map<number, string>): boolean {
  if (node.teamName?.trim()) return true;
  if (node.role === "leader") return true;
  return teamNameByLeader.has(node.id);
}

export function findNodeWithParent(
  tree: TeamMember[],
  targetId: string,
  parent?: TeamMember
): { node: TeamMember; parent?: TeamMember } | null {
  for (const node of tree) {
    if (node.id === targetId) return { node, parent };
    if (node.children && node.children.length) {
      const found = findNodeWithParent(node.children, targetId, node);
      if (found) return found;
    }
  }
  return null;
}
