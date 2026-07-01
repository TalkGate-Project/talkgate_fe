"use client";

import { useEffect, useRef, useCallback } from "react";
import { notificationSocket } from "@/lib/notificationSocket";
import { getAccessToken } from "@/lib/token";
import { setSelectedProjectId } from "@/lib/project";
import { getProjectSubdomainUrl } from "@/lib/subdomain";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useMe } from "@/hooks/useMe";
import { NotificationsService } from "@/services/notifications";
import type { NewNotificationEvent, Notification } from "@/types/notifications";

const NOTIFICATION_POLL_INTERVAL_MS = 15_000;

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

function showBrowserNotification(notification: Notification): void {
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
      tag: `notification-${notification.id}`,
      requireInteraction: false,
      silent: false,
    });

    setTimeout(() => {
      browserNotification.close();
    }, 5000);

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();

      if (notification.projectId) {
        setSelectedProjectId(String(notification.projectId));
      }

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
      } else if (notification.type === "customer_schedule" && notification.referenceId) {
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
  const knownNotificationIdsRef = useRef<Set<number>>(new Set());
  const seedCompleteRef = useRef(false);
  const isAllowNewNotificationRef = useRef(true);

  useEffect(() => {
    // 사용자 정보 로딩 중(undefined)에는 허용으로 간주, 명시적으로 false일 때만 차단
    isAllowNewNotificationRef.current = user?.isAllowNewNotification !== false;
  }, [user?.isAllowNewNotification]);

  useEffect(() => {
    if (!permissionRequestedRef.current && typeof window !== "undefined" && "Notification" in window) {
      const timer = setTimeout(() => {
        requestNotificationPermission().catch((error) => {
          console.error("Failed to request notification permission:", error);
        });
        permissionRequestedRef.current = true;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const dispatchNewNotificationEvent = useCallback((notification: Notification) => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("tg:new-notification", {
        detail: {
          notification,
          timestamp: notification.createdAt,
        } satisfies NewNotificationEvent,
      })
    );
  }, []);

  const processIncomingNotification = useCallback(
    (notification: Notification, options: { showBrowser: boolean }) => {
      if (knownNotificationIdsRef.current.has(notification.id)) {
        return;
      }

      knownNotificationIdsRef.current.add(notification.id);

      if (!seedCompleteRef.current) {
        return;
      }

      dispatchNewNotificationEvent(notification);

      if (options.showBrowser && isAllowNewNotificationRef.current) {
        showBrowserNotification(notification);
      }
    },
    [dispatchNewNotificationEvent]
  );

  const handleNewNotification = useCallback(
    (event: NewNotificationEvent) => {
      processIncomingNotification(event.notification, { showBrowser: true });
    },
    [processIncomingNotification]
  );

  // WebSocket 누락 대비: 기존 알림 시드 + 주기적 폴링 (예약 알림 등 서버 크론 발송 케이스)
  useEffect(() => {
    if (!ready) return;

    const numericProjectId = projectId ? Number.parseInt(projectId, 10) : null;
    if (!numericProjectId || Number.isNaN(numericProjectId)) {
      return;
    }

    let cancelled = false;
    knownNotificationIdsRef.current = new Set();
    seedCompleteRef.current = false;

    const pollNotifications = async () => {
      if (cancelled) return;

      try {
        const response = await NotificationsService.list({ limit: 10 });
        if (cancelled) return;

        const isInitialSeed = !seedCompleteRef.current;

        for (const notification of response.notifications) {
          if (isInitialSeed) {
            knownNotificationIdsRef.current.add(notification.id);
            continue;
          }

          processIncomingNotification(notification, { showBrowser: true });
        }

        seedCompleteRef.current = true;
      } catch (error) {
        console.error("Failed to poll notifications:", error);
        seedCompleteRef.current = true;
      }
    };

    void pollNotifications();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollNotifications();
      }
    }, NOTIFICATION_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pollNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ready, projectId, processIncomingNotification]);

  useEffect(() => {
    if (!ready) return;

    const numericProjectId = projectId ? Number.parseInt(projectId, 10) : null;

    if (!numericProjectId || Number.isNaN(numericProjectId)) {
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

      socket.on("ready", () => {
        // Socket ready
      });

      notificationSocket.onNewNotification(handleNewNotification);

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

  useEffect(() => {
    return () => {
      notificationSocket.disconnect();
    };
  }, []);

  return <>{children}</>;
}
