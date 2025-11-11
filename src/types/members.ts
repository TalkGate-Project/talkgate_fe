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

// 멤버 목록 아이템
export interface MemberListItem {
  id: number;
  userId: number;
  projectId: number;
  name: string;
  email?: string; // API 응답에 없을 수 있음
  phone: string | null;
  profileImageUrl: string | null;
  role?: "admin" | "subAdmin" | "leader" | "member"; // API 응답에 없을 수 있음
  teamName?: string; // API 응답에 없을 수 있음
  createdAt: string;
  updatedAt: string;
}

// 멤버 목록 응답
export interface MemberListResponse {
  result: boolean;
  data: {
    members: MemberListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 멤버 초대 요청
export interface InviteMemberPayload {
  email: string;
  role: "subAdmin" | "member";
}

// 멤버 초대 응답
export interface InviteMemberResponse {
  result: boolean;
  data: {
    id: number;
    projectId: number;
    projectName: string;
    role: "admin" | "subAdmin" | "leader" | "member";
    email: string;
    token: string;
    expiresAt: string;
    status: "pending";
    createdAt: string;
    updatedAt: string;
  };
}

// 초대 목록 아이템
export interface InvitationListItem {
  id: number;
  projectId: number;
  projectName: string;
  role: "admin" | "subAdmin" | "leader" | "member";
  email: string;
  token: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  updatedAt: string;
}

// 초대 목록 응답
export interface InvitationListResponse {
  result: boolean;
  data: {
    invitations: InvitationListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}