import { apiClient } from "@/lib/apiClient";

export type NotificationType = "notice" | "customer" | "system" | "security";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export type NotificationCategory = "all" | NotificationType;

export interface NotificationCounts {
  all: number;
  notice: number;
  customer: number;
  system: number;
  security: number;
}

export const NotificationsService = {
  // Get all notifications
  list(category?: NotificationCategory): Promise<{ data: Notification[] }> {
    const query = category && category !== "all" ? `?category=${category}` : "";
    return apiClient.get<Notification[]>(`/v1/notifications${query}`);
  },

  // Get notification counts by category
  getCounts(): Promise<{ data: NotificationCounts }> {
    return apiClient.get<NotificationCounts>("/v1/notifications/counts");
  },

  // Mark all as read
  markAllAsRead(): Promise<{ data: boolean }> {
    return apiClient.post("/v1/notifications/mark-all-read");
  },

  // Mark specific notification as read
  markAsRead(id: number): Promise<{ data: boolean }> {
    return apiClient.post(`/v1/notifications/${id}/mark-read`);
  },
};

