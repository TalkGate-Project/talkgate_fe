import { apiClient } from "@/lib/apiClient";

export const HRService = {
  updateMemberData(memberId: string, payload: Record<string, unknown>) {
    return apiClient.put<void>(`/v1/members/${memberId}/hr/data`, payload);
  },
  addMemberNote(memberId: string, payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/members/${memberId}/hr/notes`, payload);
  },
  removeMemberNote(memberId: string, noteId: string) {
    return apiClient.delete<void>(`/v1/members/${memberId}/hr/notes/${noteId}`);
  },
};


