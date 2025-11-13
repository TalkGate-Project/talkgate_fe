"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { env } from "@/lib/env";
export type { ChatMessage, Conversation, MessageType } from "@/types/conversations";

export class TalkgateSocket {
  private socket: Socket | null = null;
  private currentProjectId: number | null = null;

  connect(projectId: number) {
    const token = getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    // 이미 동일한 projectId로 연결되어 있고 소켓이 활성 상태면 재사용
    if (this.socket && this.currentProjectId === projectId) {
      if (this.socket.connected) {
        return this.socket;
      }
      // 소켓은 있지만 연결이 끊긴 경우, 재연결 시도
      if (!this.socket.active) {
        this.socket.connect();
      }
      return this.socket;
    }

    // 다른 projectId로 연결하거나 소켓이 없는 경우, 기존 연결 정리
    if (this.socket) {
      this.disconnect();
    }

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
    
    this.currentProjectId = projectId;
    return this.socket;
  }

  get instance() {
    if (!this.socket) throw new Error("소켓이 연결되지 않았습니다.");
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentProjectId(): number | null {
    return this.currentProjectId;
  }

  disconnect() {
    if (this.socket) {
      // 모든 이벤트 리스너 제거
      this.socket.removeAllListeners();
      // 소켓 연결 끊기
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentProjectId = null;
  }
}

export const talkgateSocket = new TalkgateSocket();


