import { apiClient } from "@/lib/apiClient";

export type Notice = unknown; // refine later

export const NoticesService = {
  list(query?: Record<string, string | number | boolean>) {
    return apiClient.get<Notice[]>(`/v1/notices`, { query });
  },
  create(payload: Record<string, unknown>) {
    return apiClient.post<Notice>(`/v1/notices`, payload);
  },
  detail(noticeId: string) {
    return apiClient.get<Notice>(`/v1/notices/${noticeId}`);
  },
  update(noticeId: string, payload: Record<string, unknown>) {
    return apiClient.patch<Notice>(`/v1/notices/${noticeId}`, payload);
  },
  remove(noticeId: string) {
    return apiClient.delete<void>(`/v1/notices/${noticeId}`);
  },
};


