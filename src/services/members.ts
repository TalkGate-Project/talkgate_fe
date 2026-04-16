import { apiClient } from "@/lib/apiClient";
import type { MemberTreeResponse } from "@/types/membersTree";
import type { 
  MyMemberResponse, 
  MemberDetailResponse,
  UpdateProfilePayload, 
  UpdateProfileResponse,
  MemberListQuery,
  MemberListResponse,
  InviteMemberPayload,
  InviteMemberResponse,
  UpdateMemberRolePayload,
  InvitationListResponse
} from "@/types/members";

export type Member = {
  id: number;
  role: "leader" | "member" | string;
  name: string;
  profileImageUrl?: string | null;
  descendants?: Member[];
};

export const MembersService = {
  list(query: MemberListQuery) {
    return apiClient.get<MemberListResponse>(`/v1/members`, { query });
  },
  remove(memberId: number) {
    return apiClient.delete<void>(`/v1/members/${memberId}`);
  },
  my(headers?: Record<string, string>) {
    return apiClient.get<MyMemberResponse>(`/v1/members/my`, headers ? { headers } : undefined);
  },
  updateSelf(payload: UpdateProfilePayload, headers?: Record<string, string>) {
    return apiClient.patch<UpdateProfileResponse>(`/v1/members`, payload, headers ? { headers } : undefined);
  },
  updateRole(payload: UpdateMemberRolePayload) {
    return apiClient.patch<void>(`/v1/members/role`, payload);
  },
  detail(memberId: string | number) {
    return apiClient.get<MemberDetailResponse>(`/v1/members/${memberId}`);
  },

  // Invitations
  invite(payload: InviteMemberPayload) {
    return apiClient.post<InviteMemberResponse>(`/v1/members/invitations`, payload);
  },
  listInvitations(query?: Record<string, string | number | boolean>) {
    return apiClient.get<InvitationListResponse>(`/v1/members/invitations`, { query });
  },
  cancelInvitation(invitationId: number) {
    return apiClient.delete<void>(`/v1/members/invitations/${invitationId}`);
  },
  acceptInvitation(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/invitations/accept`, payload);
  },
  resendInvitation(invitationId: number) {
    return apiClient.post<void>(`/v1/members/invitations/resend`, { invitationId });
  },
  verifyInvitation(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/invitations/verify`, payload);
  },
  projectTree() {
    return apiClient.get<MemberTreeResponse>(`/v1/members-tree/tree`);
  },

  /**
   * 팀 ID로 팀 리더의 멤버 상세 정보 조회
   * GET /v1/members/by-team/{teamId}
   */
  getTeamLeaderMemberDetail(teamId: number) {
    return apiClient.get<MemberDetailResponse>(`/v1/members/by-team/${teamId}`);
  },
};
