"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { env } from "@/lib/env";

export class TeamChatSocket {
  private socket: Socket | null = null;
  private currentProjectId: number | null = null;

  connect(projectId: number): Socket | null {
    const token = getAccessToken();
    if (!token) return null;

    if (this.socket && this.currentProjectId === projectId) {
      if (this.socket.connected) return this.socket;
      if (!this.socket.active) this.socket.connect();
      return this.socket;
    }

    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = env.NEXT_PUBLIC_WS_TEAM_CHAT_BASE_URL ?? "";
    if (!wsUrl) return null;

    this.socket = io(wsUrl, {
      auth: { token, projectId },
      autoConnect: true,
      transports: ["websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.currentProjectId = projectId;
    return this.socket;
  }

  get instance(): Socket {
    if (!this.socket) throw new Error("팀채팅 소켓이 연결되지 않았습니다.");
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentProjectId(): number | null {
    return this.currentProjectId;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentProjectId = null;
  }
}

export const teamChatSocket = new TeamChatSocket();
