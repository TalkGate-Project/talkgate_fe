"use client";

import { useEffect, useRef, useCallback } from "react";
import { notificationSocket } from "@/lib/notificationSocket";
import { getAccessToken } from "@/lib/token";
import { setSelectedProjectId } from "@/lib/project";
import { getProjectSubdomainUrl } from "@/lib/subdomain";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMe } from "@/hooks/useMe";
import type { NewNotificationEvent } from "@/types/notifications";

// Browser notification permission status
export type NotificationPermission = "default" | "granted" | "denied";

// Request browser notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return "denied";
  }
}

// Show browser notification
function showBrowserNotification(notification: NewNotificationEvent["notification"]): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const browserNotification = new Notification(notification.title, {
      body: notification.content,
      icon: "/notification-icon.webp",
      tag: `notification-${notification.id}`, // Prevent duplicate notifications
      requireInteraction: false,
      silent: false,
    });

    // Close notification after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);

    // Handle click on notification - 알림 타입에 따라 적절한 페이지로 이동 또는 모달 띄우기
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();

      if (notification.projectId) {
        setSelectedProjectId(String(notification.projectId));
      }
      
      // 알림 타입에 따라 적절한 페이지로 이동 또는 모달 띄우기
      if (notification.type === "notice" && notification.referenceId) {
        const path = `/notice/${notification.referenceId}`;
        const targetSubdomain = notification.project?.subDomain?.trim();
        const subdomainUrl = targetSubdomain ? getProjectSubdomainUrl(targetSubdomain, path) : "";
        window.location.href = subdomainUrl || path;
      } else if (notification.type === "customer_registration" && notification.referenceId) {
        const path = `/customers?openCustomerId=${notification.referenceId}`;
        const targetSubdomain = notification.project?.subDomain?.trim();
        const subdomainUrl = targetSubdomain ? getProjectSubdomainUrl(targetSubdomain, path) : "";
        window.location.href = subdomainUrl || path;
      } else if (notification.type === "customer_assignment") {
        const path = "/customers";
        const targetSubdomain = notification.project?.subDomain?.trim();
        const subdomainUrl = targetSubdomain ? getProjectSubdomainUrl(targetSubdomain, path) : "";
        window.location.href = subdomainUrl || path;
      } else if (notification.type === "system") {
        window.location.href = "/my-settings?tab=billing";
      } else {
        // 기본적으로 알림 페이지로 이동
        window.location.href = "/notifications";
      }
    };
  } catch (error) {
    console.error("Failed to show browser notification:", error);
  }
}

/**
 * Global Notification Provider Component
 * Manages WebSocket connection for notifications and displays browser notifications
 */
export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [projectId, ready] = useSelectedProjectId();
  const { user } = useMe();
  const permissionRequestedRef = useRef(false);

  // Request notification permission once when component mounts
  useEffect(() => {
    if (!permissionRequestedRef.current && typeof window !== "undefined" && "Notification" in window) {
      // Request permission after a short delay to avoid blocking initial render
      const timer = setTimeout(() => {
        requestNotificationPermission().catch((error) => {
          console.error("Failed to request notification permission:", error);
        });
        permissionRequestedRef.current = true;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Handle new notification event
  const handleNewNotification = useCallback((event: NewNotificationEvent) => {
    // 알림 설정 확인 (새로운 소식 알림이 켜져 있는지)
    const isNewsNotificationEnabled = Boolean(user?.isAllowNewNotification);
    
    if (!isNewsNotificationEnabled) {
      // 알림 설정이 꺼져 있으면 브라우저 알림을 표시하지 않음
      // 하지만 이벤트는 여전히 발행하여 UI 업데이트는 진행
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tg:new-notification", {
            detail: event,
          })
        );
      }
      return;
    }

    // Show browser notification
    showBrowserNotification(event.notification);

    // You can also dispatch a custom event or update React Query cache here
    // For example, invalidate notification queries to refetch
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tg:new-notification", {
          detail: event,
        })
      );
    }
  }, [user?.isAllowNewNotification]);

  // Connect to notification WebSocket when project is ready
  useEffect(() => {
    if (!ready) return;

    const numericProjectId = projectId ? Number.parseInt(projectId, 10) : null;

    if (!numericProjectId || Number.isNaN(numericProjectId)) {
      // Disconnect if no valid project ID
      notificationSocket.disconnect();
      return;
    }
    
    const accessToken = getAccessToken();
    if (!accessToken) {
      notificationSocket.disconnect();
      return;
    }

    try {
      const socket = notificationSocket.connect(numericProjectId);
      if (!socket) {
        return;
      }

      // Listen for Ready event
      socket.on("ready", () => {
        // Socket ready
      });

      // Listen for new notifications
      notificationSocket.onNewNotification(handleNewNotification);

      // Handle connection errors
      socket.on("connect_error", (error) => {
        console.error("Notification socket connection error:", error);
      });

      socket.on("disconnect", () => {
        // Socket disconnected
      });

      return () => {
        notificationSocket.offNewNotification(handleNewNotification);
        notificationSocket.offReady();
      };
    } catch (error) {
      console.error("Failed to connect notification socket:", error);
    }
  }, [ready, projectId, handleNewNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationSocket.disconnect();
    };
  }, []);

  return <>{children}</>;
}

