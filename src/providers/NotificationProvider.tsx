"use client";

import { useEffect, useRef, useCallback } from "react";
import { notificationSocket } from "@/lib/notificationSocket";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
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
      icon: "/favicon.ico", // You can customize this icon
      tag: `notification-${notification.id}`, // Prevent duplicate notifications
      requireInteraction: false,
      silent: false,
    });

    // Close notification after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);

    // Handle click on notification
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      // You can navigate to notification page or specific route here
      // window.location.href = `/notifications`;
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
  }, []);

  // Connect to notification WebSocket when project is ready
  useEffect(() => {
    if (!ready) return;

    const numericProjectId = projectId ? Number.parseInt(projectId, 10) : null;

    if (!numericProjectId || Number.isNaN(numericProjectId)) {
      // Disconnect if no valid project ID
      notificationSocket.disconnect();
      return;
    }

    try {
      const socket = notificationSocket.connect(numericProjectId);

      // Listen for Ready event
      socket.on("ready", () => {
        console.log("Notification socket ready");
      });

      // Listen for new notifications
      notificationSocket.onNewNotification(handleNewNotification);

      // Handle connection errors
      socket.on("connect_error", (error) => {
        console.error("Notification socket connection error:", error);
      });

      socket.on("disconnect", (reason) => {
        console.log("Notification socket disconnected:", reason);
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

