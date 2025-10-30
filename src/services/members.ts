import { apiClient } from "@/lib/apiClient";

export type Member = {
  id: number;
  role: "leader" | "member" | string;
  name: string;
  profileImageUrl?: string | null;
  descendants?: Member[];
};

export type MembersTreeResponse = {
  result: true;
  data: { rootMembers: Member[] };
};

export const MembersService = {
  list(query?: Record<string, string | number | boolean>) {
    return apiClient.get<Member[]>(`/v1/members`, { query });
  },
  remove(payload: Record<string, unknown>) {
    return apiClient.delete<void>(`/v1/members`, { body: payload } as any);
  },
  updateSelf(payload: Record<string, unknown>) {
    return apiClient.patch<Member>(`/v1/members`, payload);
  },
  detail(memberId: string | number) {
    return apiClient.get<Member>(`/v1/members/${memberId}`);
  },

  // Invitations
  invite(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/invitations`, payload);
  },
  listInvitations(query?: Record<string, string | number | boolean>) {
    return apiClient.get<unknown>(`/v1/members/invitations`, { query });
  },
  cancelInvitation(invitationId: string) {
    return apiClient.delete<void>(`/v1/members/invitations/${invitationId}`);
  },
  acceptInvitation(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/invitations/accept`, payload);
  },
  resendInvitation(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/invitations/resend`, payload);
  },
  verifyInvitation(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/invitations/verify`, payload);
  },
};


