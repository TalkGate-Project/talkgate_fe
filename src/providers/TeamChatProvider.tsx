"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { teamChatSocket } from "@/lib/teamChatSocket";
import { getAccessToken } from "@/lib/token";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import type {
  TeamRoom,
  TeamMessage,
  TeamRoomParticipant,
  TeamRoomListEvent,
  TeamMessagesListEvent,
  NewTeamMessageEvent,
  TeamMessageSentEvent,
  TeamMessagesMarkedReadEvent,
  TeamReadCountUpdatedEvent,
  TeamRoomParticipantsEvent,
  TeamRoomRemovedEvent,
  ParticipantOnlineStatusEvent,
  TeamChatReadyEvent,
  TeamChatErrorEvent,
  SendTeamMessagePayload,
} from "@/types/teamChat";

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function shouldKeepLocalLastMessage(local: TeamRoom, incoming: TeamRoom) {
  const localLast = local.lastMessage;
  const incomingLast = incoming.lastMessage;
  if (!localLast) return false;
  if (!incomingLast) return true;

  if (localLast.id !== incomingLast.id) {
    return localLast.id > incomingLast.id;
  }

  return toTimestamp(localLast.sentAt) > toTimestamp(incomingLast.sentAt);
}

type TeamChatContextType = {
  connected: boolean;
  socketError: string | null;
  memberId: number | null;
  rooms: TeamRoom[];
  activeRoomId: number | null;
  setActiveRoomId: (id: number | null) => void;
  messagesByRoomId: Record<number, TeamMessage[]>;
  messagesCursorByRoomId: Record<number, number | null>;
  hasMoreByRoomId: Record<number, boolean>;
  participantsByRoomId: Record<number, TeamRoomParticipant[]>;
  totalUnreadCount: number;
  hasUnread: boolean;
  loadTeamMessages: (roomId: number, cursor?: number) => void;
  sendTeamMessage: (payload: SendTeamMessagePayload) => void;
  markTeamMessagesRead: (roomId: number, lastReadMessageId: number) => void;
  loadRoomParticipants: (roomId: number) => void;
  getSocket: () => Socket | null;
};

const TeamChatContext = createContext<TeamChatContextType | null>(null);

export function useTeamChatContext() {
  const ctx = useContext(TeamChatContext);
  if (!ctx) throw new Error("useTeamChatContext must be used within TeamChatProvider");
  return ctx;
}

export function useTeamChatContextSafe() {
  return useContext(TeamChatContext);
}

export default function TeamChatProvider({ children }: { children: ReactNode }) {
  const [selectedProjectId, ready] = useSelectedProjectId();
  const projectId = useMemo(() => {
    if (!ready || !selectedProjectId) return null;
    const parsed = Number.parseInt(selectedProjectId, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [selectedProjectId, ready]);

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<TeamRoom[]>([]);
  const [activeRoomId, setActiveRoomIdState] = useState<number | null>(null);
  const [messagesByRoomId, setMessagesByRoomId] = useState<Record<number, TeamMessage[]>>({});
  const [messagesCursorByRoomId, setMessagesCursorByRoomId] = useState<Record<number, number | null>>({});
  const [hasMoreByRoomId, setHasMoreByRoomId] = useState<Record<number, boolean>>({});
  const [participantsByRoomId, setParticipantsByRoomId] = useState<Record<number, TeamRoomParticipant[]>>({});
  const loadingMessagesRef = useRef<Record<number, boolean>>({});
  const loadingParticipantsRef = useRef<Record<number, boolean>>({});
  const participantsTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout> | null>>({});
  const activeRoomIdRef = useRef<number | null>(null);
  const roomsRef = useRef<TeamRoom[]>([]);
  const messagesByRoomIdRef = useRef<Record<number, TeamMessage[]>>({});

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  useEffect(() => {
    messagesByRoomIdRef.current = messagesByRoomId;
  }, [messagesByRoomId]);

  const totalUnreadCount = useMemo(
    () => rooms.reduce((sum, r) => sum + r.unreadCount, 0),
    [rooms]
  );
  const hasUnread = totalUnreadCount > 0;

  const setActiveRoomId = useCallback((id: number | null) => {
    setActiveRoomIdState(id);
    if (id !== null) {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, unreadCount: 0 } : r)));
      const room = roomsRef.current.find((r) => r.id === id);
      const lastReadId = room?.lastMessage?.id ?? 0;
      if (lastReadId > 0 && socketRef.current) {
        socketRef.current.emit("markTeamMessagesRead", { roomId: id, lastReadMessageId: lastReadId });
      }
    }
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  const markTeamMessagesRead = useCallback((roomId: number, lastReadMessageId: number) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("markTeamMessagesRead", { roomId, lastReadMessageId });
  }, []);

  const loadTeamMessages = useCallback((roomId: number, cursor?: number) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (loadingMessagesRef.current[roomId]) return;
    const messages = messagesByRoomId[roomId] ?? [];
    const hasMore = hasMoreByRoomId[roomId] ?? true;
    if (cursor === undefined && messages.length > 0) return;
    if (cursor !== undefined && !hasMore) return;

    loadingMessagesRef.current[roomId] = true;
    socket.emit("getTeamMessages", { roomId, limit: 50, cursor: cursor ?? undefined });
  }, [messagesByRoomId, hasMoreByRoomId]);

  const sendTeamMessage = useCallback((payload: SendTeamMessagePayload) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("sendTeamMessage", payload);
  }, []);

  const loadRoomParticipants = useCallback((roomId: number) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (loadingParticipantsRef.current[roomId]) return;
    loadingParticipantsRef.current[roomId] = true;
    if (participantsTimeoutRef.current[roomId]) {
      clearTimeout(participantsTimeoutRef.current[roomId]!);
    }
    participantsTimeoutRef.current[roomId] = setTimeout(() => {
      loadingParticipantsRef.current[roomId] = false;
      participantsTimeoutRef.current[roomId] = null;
    }, 5000);
    socket.emit("getTeamRoomParticipants", { roomId });
  }, []);

  useEffect(() => {
    if (!projectId) {
      teamChatSocket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocketError(null);
      setMemberId(null);
      setRooms([]);
      setActiveRoomIdState(null);
      setMessagesByRoomId({});
      setMessagesCursorByRoomId({});
      setHasMoreByRoomId({});
      setParticipantsByRoomId({});
      return;
    }

    const token = getAccessToken();
    if (!token) {
      teamChatSocket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocketError(null);
      return;
    }

    let socket: Socket | null;
    try {
      socket = teamChatSocket.connect(projectId);
      if (!socket) {
        setSocketError("팀채팅 소켓 URL이 설정되지 않았습니다.");
        return;
      }
      socketRef.current = socket;
    } catch (err) {
      console.error("Team chat socket connect failed:", err);
      setSocketError("소켓 연결에 실패했습니다.");
      return;
    }

    const handleConnect = () => {
      setConnected(true);
      setSocketError(null);
    };

    const handleReady = (payload: TeamChatReadyEvent) => {
      setConnected(true);
      setSocketError(null);
      if (payload?.memberId != null) setMemberId(payload.memberId);
    };

    const handleTeamRoomList = (payload: TeamRoomListEvent) => {
      const list = payload?.list ?? [];
      setRooms((prev) => {
        if (prev.length === 0) return list;

        const prevById = new Map(prev.map((room) => [room.id, room]));
        return list.map((incomingRoom) => {
          const localRoom = prevById.get(incomingRoom.id);
          if (!localRoom) return incomingRoom;

          const keepLocalLast = shouldKeepLocalLastMessage(localRoom, incomingRoom);
          const mergedUnreadCount = incomingRoom.id === activeRoomIdRef.current
            ? 0
            : Math.max(incomingRoom.unreadCount, localRoom.unreadCount);

          return {
            ...incomingRoom,
            unreadCount: mergedUnreadCount,
            lastMessage: keepLocalLast ? localRoom.lastMessage : incomingRoom.lastMessage,
          };
        });
      });
    };

    const handleTeamMessagesList = (payload: TeamMessagesListEvent) => {
      const { roomId, messages: list, nextCursor, hasMore } = payload ?? {};
      if (roomId == null) return;
      loadingMessagesRef.current[roomId] = false;

      setMessagesByRoomId((prev) => {
        const existing = prev[roomId] ?? [];
        const existingIds = new Set(existing.map((m) => m.id));
        const merged = [...existing];
        for (const m of list ?? []) {
          if (!existingIds.has(m.id)) {
            merged.push(m);
            existingIds.add(m.id);
          }
        }
        merged.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        return { ...prev, [roomId]: merged };
      });
      setMessagesCursorByRoomId((prev) => ({ ...prev, [roomId]: nextCursor ?? null }));
      setHasMoreByRoomId((prev) => ({ ...prev, [roomId]: hasMore ?? false }));
    };

      const handleTeamMessageSent = (_payload: TeamMessageSentEvent) => {
      // 발신자에게만 오며, 메시지는 이미 낙관적 반영하거나 newTeamMessage로 올 수 있음
    };

    const handleTeamMessagesMarkedRead = (_payload: TeamMessagesMarkedReadEvent) => {
      // 읽음 처리 완료 확인
    };

    const handleTeamReadCountUpdated = (payload: TeamReadCountUpdatedEvent) => {
      const { roomId, memberId: readerId, previousLastReadId, lastReadMessageId } = payload ?? {};
      if (roomId == null) return;
      const messagesInRoom = messagesByRoomIdRef.current[roomId] ?? [];
      let decrease = 0;
      for (const m of messagesInRoom) {
        if (m.id <= previousLastReadId || m.id > lastReadMessageId) continue;
        if (m.senderMemberId === readerId) continue;
        decrease += 1;
      }
      if (decrease === 0 && lastReadMessageId > previousLastReadId) decrease = 1;
      setRooms((prev) =>
        prev.map((r) => (r.id !== roomId ? r : { ...r, unreadCount: Math.max(0, r.unreadCount - decrease) }))
      );
    };

    const handleTeamRoomParticipants = (payload: TeamRoomParticipantsEvent) => {
      const { roomId, participants } = payload ?? {};
      if (roomId == null) return;
      loadingParticipantsRef.current[roomId] = false;
      if (participantsTimeoutRef.current[roomId]) {
        clearTimeout(participantsTimeoutRef.current[roomId]!);
        participantsTimeoutRef.current[roomId] = null;
      }
      setParticipantsByRoomId((prev) => ({ ...prev, [roomId]: participants ?? [] }));
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId ? { ...r, participantCount: (participants ?? []).length } : r
        )
      );
    };

    const handleTeamRoomRemoved = (payload: TeamRoomRemovedEvent) => {
      const roomIds = payload?.roomIds ?? [];
      if (roomIds.length === 0) return;
      const set = new Set(roomIds);
      setRooms((prev) => prev.filter((r) => !set.has(r.id)));
      if (activeRoomIdRef.current != null && set.has(activeRoomIdRef.current)) {
        setActiveRoomIdState(null);
      }
      setMessagesByRoomId((prev) => {
        const next = { ...prev };
        roomIds.forEach((id) => delete next[id]);
        return next;
      });
      setMessagesCursorByRoomId((prev) => {
        const next = { ...prev };
        roomIds.forEach((id) => delete next[id]);
        return next;
      });
      setHasMoreByRoomId((prev) => {
        const next = { ...prev };
        roomIds.forEach((id) => delete next[id]);
        return next;
      });
      setParticipantsByRoomId((prev) => {
        const next = { ...prev };
        roomIds.forEach((id) => delete next[id]);
        return next;
      });
    };

    const handleParticipantOnlineStatus = (payload: ParticipantOnlineStatusEvent) => {
      const { roomId, memberId: mid, isOnline } = payload ?? {};
      if (roomId == null || mid == null) return;
      setParticipantsByRoomId((prev) => {
        const list = prev[roomId] ?? [];
        return {
          ...prev,
          [roomId]: list.map((p) => (p.memberId === mid ? { ...p, isOnline } : p)),
        };
      });
    };

    const handleError = (payload: TeamChatErrorEvent) => {
      const code = payload?.code ? `[${payload.code}] ` : "";
      setSocketError(`${code}${payload?.message ?? "알 수 없는 오류"}`);
    };

    const handleConnectError = (err: unknown) => {
      setConnected(false);
      setSocketError(err && typeof err === "object" && "message" in err ? String((err as Error).message) : "소켓 연결에 실패했습니다.");
    };

    const handleDisconnect = (reason: string) => {
      setConnected(false);
      if (reason !== "io client disconnect") {
        setSocketError(`연결이 종료되었습니다: ${reason}`);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("ready", handleReady);
    socket.on("teamRoomList", handleTeamRoomList as (p: TeamRoomListEvent) => void);
    socket.on("teamMessagesList", handleTeamMessagesList as (p: TeamMessagesListEvent) => void);
    const updateRoomLastMessage = (roomId: number, message: TeamMessage) => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          return {
            ...r,
            lastMessage: {
              id: message.id,
              type: message.type,
              content: message.content,
              senderName: message.senderName,
              sentAt: message.sentAt,
            },
          };
        })
      );
    };

    socket.on("newTeamMessage", (p: NewTeamMessageEvent) => {
      const activeId = activeRoomIdRef.current;
      const msg = p?.message;
      if (!msg) return;
      const rid = msg.roomId;
      const isSystem = msg.type === "system";

      if (rid === activeId) {
        setMessagesByRoomId((prev) => {
          const list = prev[rid] ?? [];
          if (list.some((m) => m.id === msg.id)) return prev;
          return { ...prev, [rid]: [...list, msg] };
        });
        if (!isSystem) markTeamMessagesRead(rid, msg.id);
        // 현재 보고 있는 방이어도 방 목록의 최신 메시지/시간은 실시간 반영
        updateRoomLastMessage(rid, msg);
      } else {
        if (!isSystem) {
          setRooms((prev) =>
            prev.map((r) => {
              if (r.id !== rid) return r;
              return {
                ...r,
                unreadCount: r.unreadCount + 1,
                lastMessage: {
                  id: msg.id,
                  type: msg.type,
                  content: msg.content,
                  senderName: msg.senderName,
                  sentAt: msg.sentAt,
                },
              };
            })
          );
        } else {
          // 시스템 메시지도 방 목록 lastMessage에는 반영
          updateRoomLastMessage(rid, msg);
        }
        setMessagesByRoomId((prev) => {
          const list = prev[rid] ?? [];
          if (list.some((m) => m.id === msg.id)) return prev;
          return { ...prev, [rid]: [...list, msg] };
        });
      }
    });
    socket.on("teamMessageSent", handleTeamMessageSent as (p: TeamMessageSentEvent) => void);
    socket.on("teamMessagesMarkedRead", handleTeamMessagesMarkedRead as (p: TeamMessagesMarkedReadEvent) => void);
    socket.on("teamReadCountUpdated", (p: TeamReadCountUpdatedEvent) => {
      const { roomId, memberId: readerId, previousLastReadId, lastReadMessageId } = p ?? {};
      if (roomId == null) return;
      const messagesInRoom = messagesByRoomIdRef.current[roomId] ?? [];
      let decrease = 0;
      for (const m of messagesInRoom) {
        if (m.id <= previousLastReadId || m.id > lastReadMessageId) continue;
        if (m.senderMemberId === readerId) continue;
        decrease += 1;
      }
      if (decrease === 0 && lastReadMessageId > previousLastReadId) decrease = 1;
      setRooms((prev) =>
        prev.map((r) => (r.id !== roomId ? r : { ...r, unreadCount: Math.max(0, r.unreadCount - decrease) }))
      );
    });
    socket.on("teamRoomParticipants", handleTeamRoomParticipants as (p: TeamRoomParticipantsEvent) => void);
    socket.on("teamRoomRemoved", handleTeamRoomRemoved as (p: TeamRoomRemovedEvent) => void);
    socket.on("participantOnlineStatus", handleParticipantOnlineStatus as (p: ParticipantOnlineStatusEvent) => void);
    socket.on("error", handleError as (p: TeamChatErrorEvent) => void);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setConnected(true);
    }

    const beforeUnload = () => teamChatSocket.disconnect();
    if (typeof window !== "undefined") window.addEventListener("beforeunload", beforeUnload);
    const participantsTimeoutMap = participantsTimeoutRef.current;
    const loadingParticipantsMap = loadingParticipantsRef.current;

    return () => {
      socket.off("connect", handleConnect);
      socket.off("ready", handleReady);
      socket.off("teamRoomList", handleTeamRoomList as (p: TeamRoomListEvent) => void);
      socket.off("teamMessagesList", handleTeamMessagesList as (p: TeamMessagesListEvent) => void);
      socket.off("newTeamMessage");
      socket.off("teamMessageSent", handleTeamMessageSent as (p: TeamMessageSentEvent) => void);
      socket.off("teamMessagesMarkedRead", handleTeamMessagesMarkedRead as (p: TeamMessagesMarkedReadEvent) => void);
      socket.off("teamReadCountUpdated");
      socket.off("teamRoomParticipants", handleTeamRoomParticipants as (p: TeamRoomParticipantsEvent) => void);
      socket.off("teamRoomRemoved", handleTeamRoomRemoved as (p: TeamRoomRemovedEvent) => void);
      socket.off("participantOnlineStatus", handleParticipantOnlineStatus as (p: ParticipantOnlineStatusEvent) => void);
      socket.off("error", handleError as (p: TeamChatErrorEvent) => void);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      Object.keys(participantsTimeoutMap).forEach((key) => {
        const id = Number(key);
        if (participantsTimeoutMap[id]) {
          clearTimeout(participantsTimeoutMap[id]!);
          participantsTimeoutMap[id] = null;
        }
        loadingParticipantsMap[id] = false;
      });
      if (typeof window !== "undefined") window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [projectId, markTeamMessagesRead]);

  const value: TeamChatContextType = useMemo(
    () => ({
      connected,
      socketError,
      memberId,
      rooms,
      activeRoomId,
      setActiveRoomId,
      messagesByRoomId,
      messagesCursorByRoomId,
      hasMoreByRoomId,
      participantsByRoomId,
      totalUnreadCount,
      hasUnread,
      loadTeamMessages,
      sendTeamMessage,
      markTeamMessagesRead,
      loadRoomParticipants,
      getSocket,
    }),
    [
      connected,
      socketError,
      memberId,
      rooms,
      activeRoomId,
      setActiveRoomId,
      messagesByRoomId,
      messagesCursorByRoomId,
      hasMoreByRoomId,
      participantsByRoomId,
      totalUnreadCount,
      hasUnread,
      loadTeamMessages,
      sendTeamMessage,
      markTeamMessagesRead,
      loadRoomParticipants,
      getSocket,
    ]
  );

  return (
    <TeamChatContext.Provider value={value}>
      {children}
    </TeamChatContext.Provider>
  );
}
