"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { env } from "@/lib/env";
export type { ChatMessage, Conversation, MessageType } from "@/types/conversations";

export class TalkgateSocket {
  private socket: Socket | null = null;

  connect(projectId: number) {
    const token = getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    if (this.socket?.connected) return this.socket;

    const wsUrl = env.NEXT_PUBLIC_WS_CHAT_BASE_URL ?? "";

    this.socket = io(wsUrl, {
      auth: { token, projectId },
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
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const talkgateSocket = new TalkgateSocket();


