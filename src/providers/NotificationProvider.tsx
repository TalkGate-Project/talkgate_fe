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

export type NotificationPermission = "default" | "granted" | "denied";

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

function parseNotificationFromSocketPayload(payload: unknown): Notification | null {
  if (!payload || typeof payload !== "object") return null;

  const event = payload as Partial<NewNotificationEvent> & Partial<Notification>;

  if (
    event.notification &&
    typeof event.notification === "object" &&
    typeof event.notification.id === "number"
  ) {
    return event.notification;
  }

  if (typeof event.id === "number" && typeof event.type === "string") {
    return event as Notification;
  }

  return null;
}

function showBrowserNotification(notification: Notification): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    console.error(
      "Browser notification skipped: Notification.permission is",
      Notification.permission
    );
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

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [projectId, ready] = useSelectedProjectId();
  const { user } = useMe();
  const permissionRequestedRef = useRef(false);
  const knownNotificationIdsRef = useRef<Set<number>>(new Set());
  const seedCompleteRef = useRef(false);
  const pendingDuringSeedRef = useRef<Notification[]>([]);
  const isAllowNewNotificationRef = useRef(true);

  useEffect(() => {
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

  // 자동 권한 요청이 차단된 경우, 첫 사용자 클릭 시 한 번 더 요청
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const handleFirstInteraction = () => {
      void requestNotificationPermission();
      document.removeEventListener("pointerdown", handleFirstInteraction);
    };

    document.addEventListener("pointerdown", handleFirstInteraction);
    return () => document.removeEventListener("pointerdown", handleFirstInteraction);
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

  const deliverNotification = useCallback(
    (notification: Notification, showBrowser: boolean) => {
      if (!notification?.id) return;
      if (knownNotificationIdsRef.current.has(notification.id)) return;

      knownNotificationIdsRef.current.add(notification.id);
      dispatchNewNotificationEvent(notification);

      if (showBrowser && isAllowNewNotificationRef.current) {
        showBrowserNotification(notification);
      }
    },
    [dispatchNewNotificationEvent]
  );

  const flushPendingNotifications = useCallback(() => {
    const pending = pendingDuringSeedRef.current.splice(0);
    for (const notification of pending) {
      deliverNotification(notification, true);
    }
  }, [deliverNotification]);

  const handleIncomingNotification = useCallback(
    (notification: Notification | null | undefined, showBrowser: boolean) => {
      if (!notification?.id) return;

      if (!seedCompleteRef.current) {
        if (!pendingDuringSeedRef.current.some((item) => item.id === notification.id)) {
          pendingDuringSeedRef.current.push(notification);
        }
        return;
      }

      deliverNotification(notification, showBrowser);
    },
    [deliverNotification]
  );

  const handleNewNotification = useCallback(
    (payload: NewNotificationEvent) => {
      const notification = parseNotificationFromSocketPayload(payload);
      handleIncomingNotification(notification, true);
    },
    [handleIncomingNotification]
  );

  useEffect(() => {
    if (!ready) return;

    const numericProjectId = projectId ? Number.parseInt(projectId, 10) : null;
    if (!numericProjectId || Number.isNaN(numericProjectId)) {
      return;
    }

    let cancelled = false;
    knownNotificationIdsRef.current = new Set();
    pendingDuringSeedRef.current = [];
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

          handleIncomingNotification(notification, true);
        }

        if (isInitialSeed) {
          seedCompleteRef.current = true;
          flushPendingNotifications();
        }
      } catch (error) {
        console.error("Failed to poll notifications:", error);
        if (!seedCompleteRef.current) {
          seedCompleteRef.current = true;
          flushPendingNotifications();
        }
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
  }, [ready, projectId, handleIncomingNotification, flushPendingNotifications]);

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
