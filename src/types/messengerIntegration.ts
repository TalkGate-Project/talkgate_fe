// Messenger Integration domain types

export type Platform = "instagram" | "telegram" | "line";

export interface MessengerIntegration {
  id: number;
  memberId: number;
  platform: Platform;
  createdAt: string;
  webhookUrl: string;
}

export interface MessengerIntegrationListResponse {
  result: true;
  data: MessengerIntegration[];
}

export interface MessengerIntegrationCreateResponse {
  result: true;
  data: MessengerIntegration;
}

// 플랫폼별 연동 요청 타입
export interface InstagramIntegrationPayload {
  code: string;
}

export interface LineIntegrationPayload {
  channelId: string;
  channelSecret: string;
}

export interface TelegramIntegrationPayload {
  botToken: string;
}

export interface LineWebhookUrlResponse {
  result: true;
  data: {
    webhookUrl: string;
  };
}

