export interface MemberTreeNode {
  id: number;
  role: string;
  name: string;
  profileImageUrl: string | null;
  descendants: MemberTreeNode[];
}

export interface MemberTreeResponse {
  result: boolean;
  data: {
    rootMembers: MemberTreeNode[];
  };
}

export interface MemberSubtreeResponse {
  result: boolean;
  data: {
    memberTree: MemberTreeNode;
  };
}

export interface TeamsResponse {
  result: boolean;
  data: {
    teams: Array<{
      id: number;
      name: string;
      leaderMemberId: number;
      leaderMemberName: string;
    }>;
  };
}

export interface CreateTeamInput {
  projectId: string | number;
  memberId: number;
  teamName: string;
}

export interface DeleteTeamInput {
  projectId: string | number;
  memberId: number;
}

export interface MoveTeamInput {
  projectId: string | number;
  memberId: number;
  newParentId: number;
}
