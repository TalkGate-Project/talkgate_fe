import { apiClient } from "@/lib/apiClient";

export const MessengerIntegrationService = {
  list() {
    return apiClient.get<unknown>(`/v1/messenger-integration`);
  },
  remove(platform: string) {
    return apiClient.delete<void>(`/v1/messenger-integration/${platform}`);
  },
  instagram(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/messenger-integration/instagram`, payload);
  },
  line(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/messenger-integration/line`, payload);
  },
  lineWebhookUrl() {
    return apiClient.get<unknown>(`/v1/messenger-integration/line/webhook-url`);
  },
  telegram(payload: Record<string, unknown>) {
    return apiClient.post<void>(`/v1/messenger-integration/telegram`, payload);
  },
};


