import { apiClient } from "@/lib/apiClient";
import type {
  MessengerIntegrationListResponse,
  MessengerIntegrationCreateResponse,
  InstagramIntegrationPayload,
  LineIntegrationPayload,
  TelegramIntegrationPayload,
  LineWebhookUrlResponse,
  Platform,
} from "@/types/messengerIntegration";

export const MessengerIntegrationService = {
  list(headers?: Record<string, string>) {
    return apiClient.get<MessengerIntegrationListResponse>(`/v1/messenger-integration`, headers ? { headers } : undefined);
  },
  remove(platform: Platform, headers?: Record<string, string>) {
    return apiClient.delete<{ result: true }>(`/v1/messenger-integration/${platform}`, headers ? { headers } : undefined);
  },
  instagram(payload: InstagramIntegrationPayload, headers?: Record<string, string>) {
    return apiClient.post<MessengerIntegrationCreateResponse>(`/v1/messenger-integration/instagram`, payload, headers ? { headers } : undefined);
  },
  line(payload: LineIntegrationPayload, headers?: Record<string, string>) {
    return apiClient.post<MessengerIntegrationCreateResponse>(`/v1/messenger-integration/line`, payload, headers ? { headers } : undefined);
  },
  lineWebhookUrl(headers?: Record<string, string>) {
    return apiClient.get<LineWebhookUrlResponse>(`/v1/messenger-integration/line/webhook-url`, headers ? { headers } : undefined);
  },
  telegram(payload: TelegramIntegrationPayload, headers?: Record<string, string>) {
    return apiClient.post<MessengerIntegrationCreateResponse>(`/v1/messenger-integration/telegram`, payload, headers ? { headers } : undefined);
  },
};


