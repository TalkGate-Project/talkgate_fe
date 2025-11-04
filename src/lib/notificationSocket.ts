"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { env } from "@/lib/env";
import type { NewNotificationEvent } from "@/types/notifications";

export class NotificationSocket {
  private socket: Socket | null = null;
  private projectId: number | null = null;

  connect(projectId: number) {
    const token = getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    
    // If already connected to the same project, return existing socket
    if (this.socket?.connected && this.projectId === projectId) {
      return this.socket;
    }

    // Disconnect previous socket if exists
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.projectId = projectId;
    const wsUrl = env.NEXT_PUBLIC_WS_NOTIFICATION_BASE_URL ?? "";

    this.socket = io(wsUrl, {
      auth: {
        token,
        projectId,
      },
      autoConnect: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    return this.socket;
  }

  get instance() {
    if (!this.socket) throw new Error("소켓이 연결되지 않았습니다.");
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.projectId = null;
  }

  // Register event listeners
  onNewNotification(callback: (event: NewNotificationEvent) => void) {
    if (!this.socket) return;
    this.socket.on("newNotification", callback);
  }

  onReady(callback: () => void) {
    if (!this.socket) return;
    this.socket.on("ready", callback);
  }

  // Remove event listeners
  offNewNotification(callback?: (event: NewNotificationEvent) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("newNotification", callback);
    } else {
      this.socket.off("newNotification");
    }
  }

  offReady(callback?: () => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("ready", callback);
    } else {
      this.socket.off("ready");
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const notificationSocket = new NotificationSocket();

