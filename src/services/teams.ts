import { apiClient } from "@/lib/apiClient";

export type Team = unknown; // refine later

export const TeamsService = {
  create(payload: Record<string, unknown>) {
    return apiClient.post<Team>(`/v1/teams`, payload);
  },
  list(query?: Record<string, string | number | boolean>) {
    return apiClient.get<Team[]>(`/v1/teams`, { query });
  },
  update(teamId: string, payload: Record<string, unknown>) {
    return apiClient.patch<Team>(`/v1/teams/${teamId}`, payload);
  },
  remove(teamId: string) {
    return apiClient.delete<void>(`/v1/teams/${teamId}`);
  },
  detail(teamId: string) {
    return apiClient.get<Team>(`/v1/teams/${teamId}`);
  },
  addMember(teamId: string, payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/teams/${teamId}/members`, payload);
  },
  removeMember(teamId: string, memberId: string) {
    return apiClient.delete<void>(`/v1/teams/${teamId}/members/${memberId}`);
  },
  assignLeader(teamId: string, memberId: string) {
    return apiClient.patch<void>(`/v1/teams/${teamId}/members/${memberId}/assign-leader`, {});
  },
};


