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

type Params = {
  projectId: number;
  status?: "all" | "active" | "closed";
  platform?: "line" | "telegram" | "instagram";
};

type Banner = { type: "success" | "error"; message: string } | null;

export function useChatController({ projectId, status = "all", platform }: Params) {
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [banner, setBanner] = useState<Banner>(null);
  const [attachmentUploading, setAttachmentUploading] = useState<boolean>(false);
  const [convCursor, setConvCursor] = useState<number | undefined>(undefined);
  const [convHasMore, setConvHasMore] = useState<boolean>(false);
  const convLoadingRef = useRef(false);
  const lastConvCursorRequestedRef = useRef<number | undefined>(undefined);

  const [msgCursor, setMsgCursor] = useState<number | undefined>(undefined);
  const [msgHasMore, setMsgHasMore] = useState<boolean>(false);
  const msgLoadingRef = useRef(false);
  const lastMsgCursorRequestedRef = useRef<number | undefined>(undefined);

  // optimistic map: tempId -> true
  const tempIdSetRef = useRef<Set<string>>(new Set());

  const showBanner = useCallback((type: "success" | "error", message: string) => {
    setBanner({ type, message });
  }, []);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const socket = talkgateSocket.connect(projectId);
    socketRef.current = socket;

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
      showBanner("error", combined);
    };

    const onDisconnect = (reason: any) => {
      setConnected(false);
      if (reason !== "io client disconnect") {
        const msg = `연결이 종료되었습니다: ${String(reason)}`;
        setSocketError(msg);
      }
    };

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
        // pagination append
        setConversations((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const merged = [...prev];
          for (const it of items) if (!existingIds.has(it.id)) merged.push(it);
          return merged;
        });
      } else {
        // initial load/refresh
        setConversations(items);
      }
      const current = activeIdRef.current;
      if ((!current || !items.some((c) => c.id === current)) && items[0]?.id) {
        setActiveId(items[0].id);
      }
    };

    const onConversation = (payload: ConversationEvent) => {
      if (!payload?.conversation) return;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === payload.conversation.id);
        if (!exists) return [payload.conversation, ...prev];
        return prev.map((c) => (c.id === payload.conversation.id ? payload.conversation : c));
      });
    };

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
        // prepend older
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const merged = [...msgs.filter((m) => !existingIds.has(m.id)), ...prev];
          return merged;
        });
      } else {
        setMessages(msgs);
      }
    };

    const onMessageResult = (payload: MessageResultEvent) => {
      if (!payload?.success) {
        const message = payload?.error || payload?.message || "메시지 전송에 실패했습니다.";
        showBanner("error", message);
        // mark optimistic as failed
        if (payload?.tempMessageId) {
          setMessages((prev) =>
            prev.map((m: any) =>
              m.tempMessageId === payload.tempMessageId ? { ...m, status: "failed" } : m
            )
          );
        }
        return;
      }
      // reconcile optimistic
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

    const onNewMessage = (payload: NewMessageEvent) => {
      if (!payload) return;
      const { message, conversation } = payload;
      if (conversation) {
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conversation.id);
          if (!exists) return [conversation, ...prev];
          const others = prev.filter((c) => c.id !== conversation.id);
          return [conversation, ...others];
        });
      }
      const current = activeIdRef.current;
      if (message?.conversationId === current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev; // dedup
          return [...prev, message];
        });
        if (current) {
          socket.emit("markMessagesRead", { conversationId: current });
        }
      }
    };

    const onMessagesMarkedRead = (payload: MessagesMarkedReadEvent) => {
      if (!payload) return;
      const id = payload.conversationId;
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    };

    socket.on("Ready", onReady);
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

    return () => {
      socket.off("Ready", onReady);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onSocketError as any);
      socket.off("conversationsList", onConversationsList as any);
      socket.off("conversation", onConversation as any);
      socket.off("messagesList", onMessagesList as any);
      socket.off("messageResult", onMessageResult as any);
      socket.off("newMessage", onNewMessage as any);
      socket.off("messagesMarkedRead", onMessagesMarkedRead as any);
    };
  }, [projectId, status, platform, showBanner]);

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
      // optimistic append
      setMessages((prev) => [
        ...prev,
        {
          id: Number.NEGATIVE_INFINITY, // temporary non-colliding id
          conversationId: activeId,
          type: "text",
          direction: "outgoing",
          status: "pending" as any,
          content,
          sentAt: now,
          createdAt: now,
          updatedAt: now,
          tempMessageId,
        } as any,
      ]);
      // bump conversation order locally
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

      // optimistic
      setMessages((prev) => [
        ...prev,
        {
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
        } as any,
      ]);
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
    // pagination
    conversationsPage: { hasMore: convHasMore },
    messagesPage: { hasMore: msgHasMore },
    loadMoreConversations,
    loadOlderMessages,
  } as const;
}


