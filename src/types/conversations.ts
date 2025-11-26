// Shared conversation + chat socket types aligned with TalkGate specs

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "sticker"
  | "location"
  | "system";

export type MessageDirection = "incoming" | "outgoing";

export type MessageDeliveryStatus = "done" | "failed" | "unsupported";

export type ConversationStatus = "active" | "closed";

export type ChatMessage = {
  id: number;
  conversationId: number;
  type: MessageType;
  direction: MessageDirection;
  status: MessageDeliveryStatus;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  stickerPackageId?: string;
  stickerId?: string;
  stickerResourceType?: string;
  stickerEmoji?: string;
  sentAt: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};

export type Conversation = {
  id: number;
  memberId: number;
  /**
   * 연동된 고객 ID
   * TODO: [고객 연동 UI] 서버에서 conversationsList, conversation 소켓 이벤트에
   * 이 필드를 포함하여 반환해야 연동 버튼 UI가 정상 동작함
   * - 현재 linkCustomer REST API로 연동 후 로컬 상태만 업데이트 중
   * - 페이지 새로고침 시 서버 응답에 customerId가 없으면 연동 상태 초기화됨
   * - 관련 이슈: #62, #63
   */
  customerId?: number;
  platform: string;
  platformConversationId: string;
  name: string;
  profileUrl?: string;
  status: ConversationStatus;
  lastReadMessageId?: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
};

export type ConversationsListEvent = {
  conversations: Conversation[];
  limit: number;
  cursor?: number;
  nextCursor?: number;
  hasMore: boolean;
  timestamp: string;
};

export type ConversationEvent = {
  conversation: Conversation;
  timestamp: string;
};

export type MessageResultEvent = {
  success: boolean;
  messageId?: number;
  message?: string;
  tempMessageId?: string;
  conversationId: number;
  error?: string;
  timestamp: string;
};

export type MessagesMarkedReadEvent = {
  conversationId: number;
  timestamp: string;
};

export type MessagesListEvent = {
  conversationId: number;
  messages: ChatMessage[];
  limit: number;
  cursor?: number;
  nextCursor?: number;
  hasMore: boolean;
  timestamp: string;
};

export type NewMessageEvent = {
  conversation?: Conversation | null;
  message: ChatMessage;
  isNewConversation: boolean;
  timestamp: string;
};

export type SocketErrorEvent = {
  code: WebSocketErrorCode;
  message: string;
};

export type WebSocketErrorCode =
  | "AUTH_TOKEN_REQUIRED"
  | "PROJECT_ID_REQUIRED"
  | "INVALID_TOKEN"
  | "USER_NOT_FOUND"
  | "PROJECT_NOT_FOUND"
  | "NOT_PROJECT_MEMBER"
  | "UNAUTHORIZED_ROOM_ACCESS"
  | "UNKNOWN_ERROR"
  | "VALIDATION_ERROR"
  | "CONVERSATION_NOT_FOUND"
  | "MESSAGE_SEND_FAILED";

// REST API envelopes

import type { ApiSuccessResponse, ApiErrorResponse } from "./common";

export type ConversationActionResponse = ApiSuccessResponse<Record<string, unknown>>;

export type UnconnectedCustomer = {
  id: number;
  name: string;
  contact1?: string | null;
  contact2?: string | null;
  assignedMember?: {
    id: number;
    name: string;
    team?: {
      id: number;
      name: string;
    } | null;
  } | null;
};

export type UnconnectedCustomersResponse = ApiSuccessResponse<{
  customers: UnconnectedCustomer[];
  total: number;
}>;

// ============================================
// AI 상담 도우미 (Conversations AI Assistant)
// ============================================

export type AiAssistantMessage = {
  id: number;
  prompt: string;
  response: string;
  createdAt: string;
  updatedAt: string;
};

export type AiAssistantListResponse = ApiSuccessResponse<{
  conversations: AiAssistantMessage[];
  nextCursor?: number;
  hasMore: boolean;
}>;

export type AiAssistantAskResponse = ApiSuccessResponse<AiAssistantMessage>;


