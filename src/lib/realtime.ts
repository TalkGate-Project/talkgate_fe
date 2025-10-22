"use client";

import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "sticker"
  | "location"
  | "system";

export type ChatMessage = {
  id: number;
  conversationId: number;
  type: MessageType;
  direction: "incoming" | "outgoing";
  status: "done" | "failed" | "unsupported";
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: number;
  memberId: number;
  customerId?: number;
  platform: string;
  platformConversationId: string;
  name: string;
  profileUrl?: string;
  status: "active" | "closed";
  lastReadMessageId?: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  latestMessage?: ChatMessage;
  unreadCount: number;
};

type ConversationsListPayload = {
  conversations: Conversation[];
  limit: number;
  cursor?: number;
  nextCursor?: number;
  hasMore: boolean;
  timestamp: string;
};

export class TalkgateSocket {
  private socket: Socket | null = null;

  connect(projectId: number) {
    const token = getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    if (this.socket?.connected) return this.socket;
    this.socket = io('/chat', {
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


