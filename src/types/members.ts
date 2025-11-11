export interface OrganizationTreeNode {
  id: number;
  role: "leader" | "member";
  name: string;
  email: string;
  teamName: string;
  profileImageUrl?: string | null;
  descendants: OrganizationTreeNode[];
}

export interface HrData {
  id: number;
  memberId: number;
  realName: string;
  birth: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface HrNote {
  id: number;
  memberId: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamChangeLog {
  id: number;
  memberId: number;
  previousTeamName: string;
  previousTeamLeaderName: string;
  newTeamName: string;
  newTeamLeaderName: string;
  type: "teamMove";
  createdAt: string;
}

export interface MyMember {
  id: number;
  userId: number;
  projectId: number;
  name: string;
  email: string;
  phone: string;
  profileImageUrl: string;
  organizationTree: OrganizationTreeNode;
  hrData: HrData;
  hrNotes: HrNote[];
  teamChangeLogs: TeamChangeLog[];
  createdAt: string;
  updatedAt: string;
}

export interface MyMemberResponse {
  result: boolean;
  data: MyMember;
}

// 프로필 업데이트 요청 타입
export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  profileImageUrl?: string;
}

// 프로필 업데이트 응답 타입 (간략한 정보만 반환)
export interface UpdateProfileResponse {
  result: true;
  data: {
    id: number;
    userId: number;
    projectId: number;
    name: string;
    phone: string;
    profileImageUrl: string;
    createdAt: string;
    updatedAt: string;
  };
}
