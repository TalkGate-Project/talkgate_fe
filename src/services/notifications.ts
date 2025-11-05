import { apiClient } from "@/lib/apiClient";
import type {
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
  NotificationListQuery,
  NotificationCategory,
  NotificationType,
} from "@/types/notifications";

// API response wrapper types
type ApiSuccessResponse<T> = {
  result: true;
  data: T;
};

export const NotificationsService = {
  // Get notifications list with cursor-based pagination
  async list(query?: NotificationListQuery): Promise<NotificationListResponse> {
    const res = await apiClient.get<ApiSuccessResponse<NotificationListResponse>>("/v1/notifications", { query });
    return res.data.data;
  },

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiSuccessResponse<NotificationUnreadCountResponse>>("/v1/notifications/unread/count");
    return res.data.data.count;
  },

  // Mark specific notification as read
  async markAsRead(notificationId: number): Promise<Notification> {
    const res = await apiClient.post<ApiSuccessResponse<Notification>>("/v1/notifications/read", {
      notificationId,
    });
    return res.data.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await apiClient.post<ApiSuccessResponse<unknown>>("/v1/notifications/read/all");
  },
};

// Re-export types for convenience
export type {
  Notification,
  NotificationCategory,
  NotificationType,
  NotificationListResponse,
  NotificationUnreadCountResponse,
  NotificationListQuery,
} from "@/types/notifications";

