/**
 * 팀채팅(직원채팅) WebSocket 스펙 기준 타입 정의
 */

/** 메시지 타입 (전송 시) */
export type TeamMessageType = "text" | "image" | "file";

/** 수신 메시지 type (시스템 포함) */
export type TeamMessageTypeReceived = TeamMessageType | "system";

/** 방 목록 아이템의 lastMessage */
export type TeamRoomLastMessage = {
  id: number;
  type: string;
  content: string | null;
  senderName: string;
  sentAt: string; // ISO / Date
};

/** 방 목록 아이템 */
export type TeamRoom = {
  id: number;
  teamId: number | null;
  name: string;
  unreadCount: number;
  participantCount: number;
  lastMessage: TeamRoomLastMessage | null;
};

/** teamRoomList 이벤트 */
export type TeamRoomListEvent = {
  list: TeamRoom[];
  timestamp: string;
};

/** 메시지 아이템 (목록/수신 공통) */
export type TeamMessage = {
  id: number;
  roomId: number;
  senderMemberId: number | null;
  senderName: string;
  senderProfileImageUrl: string | null;
  type: TeamMessageTypeReceived;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  sentAt: string;
  createdAt: string;
  unreadCount: number;
};

/** teamMessagesList 이벤트 */
export type TeamMessagesListEvent = {
  roomId: number;
  messages: TeamMessage[];
  nextCursor: number | null;
  hasMore: boolean;
  timestamp: string;
};

/** newTeamMessage 이벤트 */
export type NewTeamMessageEvent = {
  message: TeamMessage;
  timestamp: string;
};

/** teamMessageSent 이벤트 */
export type TeamMessageSentEvent = {
  messageId: number;
  roomId: number;
  timestamp: string;
};

/** teamMessagesMarkedRead 이벤트 */
export type TeamMessagesMarkedReadEvent = {
  roomId: number;
  lastReadMessageId: number;
  timestamp: string;
};

/** teamReadCountUpdated 이벤트 */
export type TeamReadCountUpdatedEvent = {
  roomId: number;
  memberId: number;
  previousLastReadId: number;
  lastReadMessageId: number;
  timestamp: string;
};

/** 참여자 아이템 */
export type TeamRoomParticipant = {
  memberId: number;
  name: string;
  profileImageUrl: string | null;
  isOnline: boolean;
};

/** teamRoomParticipants 이벤트 */
export type TeamRoomParticipantsEvent = {
  roomId: number;
  participants: TeamRoomParticipant[];
  timestamp: string;
};

/** teamRoomRemoved 이벤트 */
export type TeamRoomRemovedEvent = {
  roomIds: number[];
  timestamp: string;
};

/** participantOnlineStatus 이벤트 */
export type ParticipantOnlineStatusEvent = {
  memberId: number;
  isOnline: boolean;
  roomId: number;
  timestamp: string;
};

/** ready 이벤트 */
export type TeamChatReadyEvent = {
  memberId: number;
};

/** error 이벤트 */
export type TeamChatErrorEvent = {
  code?: string;
  message: string;
};

// --- 클라이언트 emit 페이로드 ---

/** getTeamMessages 요청 */
export type GetTeamMessagesPayload = {
  roomId: number;
  limit?: number;
  cursor?: number;
};

/** sendTeamMessage 요청 */
export type SendTeamMessagePayload = {
  roomId: number;
  type: TeamMessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
};

/** markTeamMessagesRead 요청 */
export type MarkTeamMessagesReadPayload = {
  roomId: number;
  lastReadMessageId: number;
};

/** getTeamRoomParticipants 요청 */
export type GetTeamRoomParticipantsPayload = {
  roomId: number;
};
