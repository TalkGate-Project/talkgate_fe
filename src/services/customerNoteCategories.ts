import { apiClient } from "@/lib/apiClient";

export type CustomerNoteCategory = unknown; // refine later

export const CustomerNoteCategoriesService = {
  list() {
    return apiClient.get<CustomerNoteCategory[]>("/v1/customer-note-categories");
  },
  create(payload: Record<string, unknown>) {
    return apiClient.post<CustomerNoteCategory>("/v1/customer-note-categories", payload);
  },
  update(id: string, payload: Record<string, unknown>) {
    return apiClient.patch<CustomerNoteCategory>(`/v1/customer-note-categories/${id}`, payload);
  },
  remove(id: string) {
    return apiClient.delete<void>(`/v1/customer-note-categories/${id}`);
  },
};


