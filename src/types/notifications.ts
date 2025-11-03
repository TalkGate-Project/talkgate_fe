// Notification types aligned with TalkGate API spec

export type NotificationType = "customer_assignment" | "notice";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  referenceId?: number; // 참조 id (notice 타입일 경우 새로 등록된 noticeId)
  isRead: boolean;
  readAt?: string | null; // ISO string
  createdAt: string; // ISO string
}

export interface NotificationListResponse {
  notifications: Notification[];
  nextCursor?: number | null;
  hasMore: boolean;
}

export interface NotificationUnreadCountResponse {
  count: number;
}

// WebSocket event types
export interface NewNotificationEvent {
  notification: Notification;
  timestamp: string; // ISO string
}

// API request/response types
export interface MarkNotificationReadRequest {
  notificationId: number;
}

export interface NotificationListQuery {
  limit?: number;
  cursor?: number;
  isRead?: boolean;
}

