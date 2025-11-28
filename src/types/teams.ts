// Teams domain types

export type Team = unknown; // refine later

// 피그마 디자인/UI 조직도용 타입 (기존 mockTeamData에서 이동)
export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  isLeader: boolean;
  level: number;
  parentId?: string;
  children?: TeamMember[];
  isExpanded?: boolean;
}
