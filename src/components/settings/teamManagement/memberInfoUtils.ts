import type { OrganizationTreeNode } from "@/types/members";

/**
 * 이름에서 첫 글자를 추출합니다. (아바타 이니셜용)
 */
export function initialFromName(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0);
}

/**
 * 멤버 역할을 한글 라벨로 변환합니다.
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "관리자";
    case "subAdmin":
      return "부관리자";
    case "leader":
      return "팀장";
    case "member":
      return "팀원";
    default:
      return role;
  }
}

/**
 * 조직도 노드 타입 (계층 구조 유지)
 */
export type OrgNode = {
  id: number;
  name: string;
  avatar: string;
  role: "leader" | "member" | string;
  department?: string;
  level: number;
  children: OrgNode[];
};

/**
 * OrganizationTreeNode를 OrgNode로 변환합니다. (계층 구조 유지)
 */
export function transformOrgTree(
  node: OrganizationTreeNode | undefined,
  level: number = 0
): OrgNode | null {
  if (!node) return null;

  const children = (node.descendants ?? [])
    .map((child) => transformOrgTree(child, level + 1))
    .filter((child): child is OrgNode => child !== null);

  return {
    id: node.id,
    name: node.name,
    avatar: initialFromName(node.name),
    role: node.role,
    department: node.teamName,
    level,
    children,
  };
}

