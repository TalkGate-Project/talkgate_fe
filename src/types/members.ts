export interface MyMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  name?: string;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  joinedAt?: string | null;
}

export interface MyMemberResponse {
  result: boolean;
  data: MyMember;
}
