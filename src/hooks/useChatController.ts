"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { talkgateSocket, Conversation, ChatMessage } from "@/lib/realtime";
import type {
  ConversationEvent,
  ConversationsListEvent,
  MessageResultEvent,
  MessagesListEvent,
  MessagesMarkedReadEvent,
  SocketErrorEvent,
  NewMessageEvent,
} from "@/types/conversations";
import { ConversationsService } from "@/services/conversations";
import { AssetsService } from "@/services/assets";
import { useBannerNotification } from "./useBannerNotification";

type Params = {
  projectId: number;
  status?: "all" | "active" | "closed";
  platform?: "line" | "telegram" | "instagram";
};

export function useChatController({ projectId, status = "all", platform }: Params) {
  // ============================================
  // 배너 알림 관리
  // ============================================
  const { banner, showBanner } = useBannerNotification();

  // ============================================
  // 소켓 연결 및 상태 관리
  // ============================================
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // ============================================
  // 대화 목록 관리
  // ============================================
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [convCursor, setConvCursor] = useState<number | undefined>(undefined);
  const [convHasMore, setConvHasMore] = useState<boolean>(false);
  const convLoadingRef = useRef(false);
  const lastConvCursorRequestedRef = useRef<number | undefined>(undefined);

  // ============================================
  // 메시지 관리
  // ============================================
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgCursor, setMsgCursor] = useState<number | undefined>(undefined);
  const [msgHasMore, setMsgHasMore] = useState<boolean>(false);
  const msgLoadingRef = useRef(false);
  const lastMsgCursorRequestedRef = useRef<number | undefined>(undefined);

  // ============================================
  // Optimistic UI 업데이트 관리
  // ============================================
  // 임시 메시지 ID 추적용 맵
  const tempIdSetRef = useRef<Set<string>>(new Set());

  // ============================================
  // 첨부파일 업로드 상태
  // ============================================
  const [attachmentUploading, setAttachmentUploading] = useState<boolean>(false);

  // ============================================
  // 파생 상태
  // ============================================
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // ============================================
  // 소켓 연결 및 이벤트 핸들러 설정
  // ============================================
  // showBanner를 ref로 안정화하여 useEffect 재실행 방지
  const showBannerRef = useRef(showBanner);
  useEffect(() => {
    showBannerRef.current = showBanner;
  }, [showBanner]);

  useEffect(() => {
    const socket = talkgateSocket.connect(projectId);
    socketRef.current = socket;

    // 소켓이 이미 연결되어 있으면 상태를 즉시 업데이트
    if (socket.connected) {
      setConnected(true);
      setSocketError(null);
    }

    // 페이지 새로고침/닫기 시 소켓 정리
    const handleBeforeUnload = () => {
      talkgateSocket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 소켓 연결 상태 핸들러
    const handleConnected = () => {
      setConnected(true);
      setSocketError(null);
    };

    const onReady = () => {
      setConnected(true);
      setSocketError(null);
    };

    const onConnectError = (err: any) => {
      setConnected(false);
      setSocketError(err?.message || "소켓 연결에 실패했습니다.");
    };

    const onSocketError = (payload: SocketErrorEvent) => {
      const code = payload?.code ? `[${payload.code}] ` : "";
      const message = payload?.message || "알 수 없는 오류";
      const combined = `${code}${message}`;
      setSocketError(combined);
      showBannerRef.current("error", combined);
    };

    const onDisconnect = (reason: any) => {
      setConnected(false);
      if (reason !== "io client disconnect") {
        const msg = `연결이 종료되었습니다: ${String(reason)}`;
        setSocketError(msg);
      } else {
        // 클라이언트가 의도적으로 연결을 끊은 경우 에러 메시지 제거
        setSocketError(null);
      }
    };

    // 대화 목록 관련 이벤트 핸들러
    const onConversationsList = (payload: ConversationsListEvent) => {
      const items = payload?.conversations ?? [];
      const nextCursor = (payload as any)?.nextCursor as number | undefined;
      const hasMore = Boolean((payload as any)?.hasMore);
      const requestedCursor = lastConvCursorRequestedRef.current;

      setConvCursor(nextCursor);
      setConvHasMore(hasMore);
      convLoadingRef.current = false;
      lastConvCursorRequestedRef.current = undefined;

      if (requestedCursor) {
        // 페이징: 기존 목록에 추가
        setConversations((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const merged = [...prev];
          for (const it of items) if (!existingIds.has(it.id)) merged.push(it);
          return merged;
        });
      } else {
        // 초기 로드/새로고침: 전체 교체
        setConversations(items);
      }
      // 대화 목록이 변경되어도 자동 선택하지 않음; 현재 선택이 유효하면 유지
      const current = activeIdRef.current;
      if (current && !items.some((c) => c.id === current)) {
        setActiveId(null);
      }
    };

    // 대화 업데이트 이벤트 핸들러
    const onConversation = (payload: ConversationEvent) => {
      if (!payload?.conversation) return;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === payload.conversation.id);
        if (!exists) return [payload.conversation, ...prev];
        return prev.map((c) => (c.id === payload.conversation.id ? payload.conversation : c));
      });
    };

    // 메시지 목록 관련 이벤트 핸들러
    const onMessagesList = (payload: MessagesListEvent) => {
      if (!payload || payload.conversationId !== activeIdRef.current) return;
      const msgs = payload.messages ?? [];
      const nextCursor = (payload as any)?.nextCursor as number | undefined;
      const hasMore = Boolean((payload as any)?.hasMore);
      const requestedCursor = lastMsgCursorRequestedRef.current;

      setMsgCursor(nextCursor);
      setMsgHasMore(hasMore);
      msgLoadingRef.current = false;
      lastMsgCursorRequestedRef.current = undefined;

      if (requestedCursor) {
        // 페이징: 기존 메시지 앞에 이전 메시지 추가 (백엔드가 오래된 메시지부터 보내는 것으로 가정)
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const merged = [...msgs.filter((m) => !existingIds.has(m.id)), ...prev];
          return merged;
        });
      } else {
        // 초기 로드: 전체 교체 (백엔드 순서 그대로 사용)
        setMessages(msgs);
      }
    };

    // 메시지 전송 결과 이벤트 핸들러
    const onMessageResult = (payload: MessageResultEvent) => {
      if (!payload?.success) {
        const message = payload?.error || payload?.message || "메시지 전송에 실패했습니다.";
        showBanner("error", message);
        // Optimistic UI 업데이트 실패 처리
        if (payload?.tempMessageId) {
          setMessages((prev) =>
            prev.map((m: any) =>
              m.tempMessageId === payload.tempMessageId ? { ...m, status: "failed" } : m
            )
          );
        }
        return;
      }
      // Optimistic UI 업데이트: 임시 메시지를 실제 메시지로 교체
      if ((payload as any).tempMessageId) {
        const tempId = (payload as any).tempMessageId as string;
        setMessages((prev) =>
          prev.map((m: any) =>
            m.tempMessageId === tempId
              ? { ...m, id: payload.messageId, status: "done", sentAt: new Date().toISOString() }
              : m
          )
        );
        tempIdSetRef.current.delete(tempId);
      }
    };

    // 새 메시지 수신 이벤트 핸들러
    const onNewMessage = (payload: NewMessageEvent) => {
      if (!payload) return;
      const { message, conversation } = payload;
      if (conversation) {
        // 대화 목록 업데이트 (최신 메시지가 있는 대화를 맨 위로 이동)
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conversation.id);
          if (!exists) return [conversation, ...prev];
          const others = prev.filter((c) => c.id !== conversation.id);
          return [conversation, ...others];
        });
      }
      const current = activeIdRef.current;
      if (message?.conversationId === current) {
        // 현재 활성 대화의 메시지면 뒤에 추가 (백엔드가 오래된 것부터 최신 순서로 관리)
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev; // 중복 제거
          return [...prev, message];
        });
        if (current) {
          // 읽음 처리
          socket.emit("markMessagesRead", { conversationId: current });
        }
      }
    };

    // 메시지 읽음 처리 이벤트 핸들러
    const onMessagesMarkedRead = (payload: MessagesMarkedReadEvent) => {
      if (!payload) return;
      const id = payload.conversationId;
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    };

    // Socket.IO 기본 이벤트: connect와 ready 이벤트 모두 처리
    // connect: Socket.IO 연결이 완료됨
    socket.on("connect", handleConnected);
    // ready: 서버에서 채팅 준비 완료를 알림 (소문자)
    socket.on("ready", onReady);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onSocketError as any);
    socket.on("conversationsList", onConversationsList as any);
    socket.on("conversation", onConversation as any);
    socket.on("messagesList", onMessagesList as any);
    socket.on("messageResult", onMessageResult as any);
    socket.on("newMessage", onNewMessage as any);
    socket.on("messagesMarkedRead", onMessagesMarkedRead as any);

    socket.emit("getConversations", {
      limit: 20,
      status: status === "all" ? undefined : status,
      platform,
    });
    lastConvCursorRequestedRef.current = undefined;
    convLoadingRef.current = true;

    // 클린업: 이벤트 리스너 제거 및 소켓 연결 해제
    return () => {
      socket.off("connect", handleConnected);
      socket.off("ready", onReady);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onSocketError as any);
      socket.off("conversationsList", onConversationsList as any);
      socket.off("conversation", onConversation as any);
      socket.off("messagesList", onMessagesList as any);
      socket.off("messageResult", onMessageResult as any);
      socket.off("newMessage", onNewMessage as any);
      socket.off("messagesMarkedRead", onMessagesMarkedRead as any);
      
      // beforeunload 이벤트 리스너 제거
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // 페이지 이탈 시 소켓 연결 해제
      talkgateSocket.disconnect();
    };
  }, [projectId, status, platform]); // showBanner 제거하여 불필요한 재연결 방지

  // ============================================
  // 활성 대화 변경 시 메시지 로드
  // ============================================
  useEffect(() => {
    if (!activeId) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("getMessages", { conversationId: activeId, limit: 50 });
    socket.emit("markMessagesRead", { conversationId: activeId });
    lastMsgCursorRequestedRef.current = undefined;
    msgLoadingRef.current = true;
  }, [activeId]);

  useEffect(() => {
    if (activeId !== null) return;
    setMessages([]);
  }, [activeId]);

  // ============================================
  // 메시지 전송 액션
  // ============================================
  const send = useCallback(
    (content: string) => {
      if (!content.trim() || !activeId) return;
      const socket = socketRef.current;
      if (!socket) {
        showBanner("error", "소켓 연결 상태를 확인해주세요.");
        return;
      }
      const tempMessageId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      tempIdSetRef.current.add(tempMessageId);
      const now = new Date().toISOString();
      // Optimistic UI: 즉시 메시지 추가 (뒤에 추가하여 최신 메시지가 아래로)
      const tempMessage = {
        id: Number.NEGATIVE_INFINITY, // 충돌하지 않는 임시 ID
        conversationId: activeId,
        type: "text",
        direction: "outgoing",
        status: "pending" as any,
        content,
        sentAt: now,
        createdAt: now,
        updatedAt: now,
        tempMessageId,
      } as any;
      
      setMessages((prev) => [...prev, tempMessage]);
      // Optimistic UI: 대화 목록 순서 업데이트 (최신 메시지가 있는 대화를 맨 위로)
      setConversations((prev) => {
        const target = prev.find((c) => c.id === activeId);
        if (!target) return prev;
        const updated: Conversation = {
          ...target,
          latestMessage: {
            id: Number.NEGATIVE_INFINITY as any,
            conversationId: activeId,
            type: "text",
            direction: "outgoing",
            status: "pending" as any,
            content,
            sentAt: now,
            createdAt: now,
            updatedAt: now,
          } as any,
          updatedAt: now as any,
        };
        const others = prev.filter((c) => c.id !== activeId);
        return [updated, ...others];
      });
      socket.emit("sendMessage", {
        conversationId: activeId,
        content,
        messageType: "text",
        tempMessageId,
      });
    },
    [activeId, showBanner]
  );

  // ============================================
  // 고객 연동 액션
  // ============================================
  const linkCustomerToConversation = useCallback(
    async (customerId: number) => {
      if (!activeId) throw new Error("대화방이 선택되지 않았습니다.");
      try {
        const response = await ConversationsService.linkCustomer({
          conversationId: activeId,
          projectId: String(projectId),
          customerId,
        });
        if (!response.data?.result) throw new Error("고객 연동에 실패했습니다.");
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, customerId } : c)));
        showBanner("success", "고객 연동이 완료되었습니다.");
      } catch (err: any) {
        const message = err?.data?.message || err?.message || "고객 연동에 실패했습니다.";
        showBanner("error", message);
        throw new Error(message);
      }
    },
    [activeId, projectId, showBanner]
  );

  // ============================================
  // 상담 완료 액션
  // ============================================
  const closeConversation = useCallback(async () => {
    if (!activeId) {
      showBanner("error", "대화방을 먼저 선택해주세요.");
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("현재 상담을 완료 처리하시겠습니까?");
      if (!confirmed) return;
    }
    try {
      const response = await ConversationsService.close({
        conversationId: activeId,
        projectId: String(projectId),
      });
      if (!response.data?.result) throw new Error("상담 완료 처리에 실패했습니다.");
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, status: "closed" } : c)));
      showBanner("success", "상담을 완료 처리했습니다.");
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "상담 완료 처리에 실패했습니다.";
      showBanner("error", message);
    }
  }, [activeId, projectId, showBanner]);

  // ============================================
  // 파일 전송 액션
  // ============================================
  const detectMessageType = (file: File): "image" | "video" | "audio" | "file" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "file";
  };

  const sendAttachment = useCallback(
    async (file: File) => {
      if (!activeId || !file) return;
      const socket = socketRef.current;
      if (!socket) {
        showBanner("error", "소켓 연결 상태를 확인해주세요.");
        return;
      }
      const tempMessageId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const messageType = detectMessageType(file);
      setAttachmentUploading(true);

      // Optimistic UI: 즉시 메시지 추가 (뒤에 추가하여 최신 메시지가 아래로)
      const tempMessage = {
        id: Number.NEGATIVE_INFINITY,
        conversationId: activeId,
        type: messageType,
        direction: "outgoing",
        status: "pending" as any,
        content: undefined,
        fileUrl: undefined,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        sentAt: now,
        createdAt: now,
        updatedAt: now,
        tempMessageId,
      } as any;
      
      setMessages((prev) => [...prev, tempMessage]);
      setConversations((prev) => {
        const target = prev.find((c) => c.id === activeId);
        if (!target) return prev;
        const updated: Conversation = {
          ...target,
          latestMessage: {
            id: Number.NEGATIVE_INFINITY as any,
            conversationId: activeId,
            type: messageType as any,
            direction: "outgoing",
            status: "pending" as any,
            content: undefined,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            sentAt: now,
            createdAt: now,
            updatedAt: now,
          } as any,
          updatedAt: now as any,
        };
        const others = prev.filter((c) => c.id !== activeId);
        return [updated, ...others];
      });

      try {
        const presigned = await AssetsService.presignAttachment({ fileName: file.name, fileType: file.type });
        const uploadUrl = presigned.data?.data?.uploadUrl;
        const fileUrl = presigned.data?.data?.fileUrl;
        if (!uploadUrl || !fileUrl) throw new Error("업로드 URL 발급에 실패했습니다.");
        await AssetsService.uploadToS3(uploadUrl, file, file.type);
        socket.emit("sendMessage", {
          conversationId: activeId,
          messageType,
          tempMessageId,
          fileUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m: any) => (m.tempMessageId === tempMessageId ? { ...m, status: "failed" } : m))
        );
        showBanner("error", err?.message || "파일 전송에 실패했습니다.");
      } finally {
        setAttachmentUploading(false);
      }
    },
    [activeId, showBanner]
  );

  // ============================================
  // 페이징 액션
  // ============================================
  const loadMoreConversations = useCallback(() => {
    if (convLoadingRef.current || !convHasMore) return;
    const socket = socketRef.current;
    if (!socket) return;
    convLoadingRef.current = true;
    lastConvCursorRequestedRef.current = convCursor;
    socket.emit("getConversations", {
      limit: 20,
      status: status === "all" ? undefined : status,
      platform,
      cursor: convCursor,
    });
  }, [convHasMore, convCursor, platform, status]);

  const loadOlderMessages = useCallback(() => {
    if (!activeId || msgLoadingRef.current || !msgHasMore) return;
    const socket = socketRef.current;
    if (!socket) return;
    msgLoadingRef.current = true;
    lastMsgCursorRequestedRef.current = msgCursor;
    socket.emit("getMessages", { conversationId: activeId, limit: 50, cursor: msgCursor });
  }, [activeId, msgHasMore, msgCursor]);

  return {
    connected,
    socketError,
    conversations,
    activeId,
    setActiveId,
    activeConversation,
    messages,
    banner,
    send,
    linkCustomerToConversation,
    closeConversation,
    notify: showBanner,
    attachmentUploading,
    sendAttachment,
    // 페이징
    conversationsPage: { hasMore: convHasMore },
    messagesPage: { hasMore: msgHasMore },
    loadMoreConversations,
    loadOlderMessages,
  } as const;
}


