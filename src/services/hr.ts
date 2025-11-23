import { apiClient } from "@/lib/apiClient";
import type { HrData, HrNote } from "@/types/members";

export type UpdateHrDataPayload = {
  realName: string;
  birth: string;
  address: string;
};

export type AddHrNotePayload = {
  note: string;
};

export type HrDataResponse = {
  result: boolean;
  data: HrData;
};

export type HrNoteResponse = {
  result: boolean;
  data: HrNote;
};

export const HRService = {
  updateMemberData(memberId: number, payload: UpdateHrDataPayload) {
    return apiClient.put<HrDataResponse>(`/v1/members/${memberId}/hr/data`, payload);
  },
  addMemberNote(memberId: number, payload: AddHrNotePayload) {
    return apiClient.post<HrNoteResponse>(`/v1/members/${memberId}/hr/notes`, payload);
  },
  removeMemberNote(memberId: number, noteId: number) {
    return apiClient.delete<void>(`/v1/members/${memberId}/hr/notes/${noteId}`);
  },
};
