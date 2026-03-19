"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, Conversation } from "@/lib/realtime";
import type {
  MessagesListEvent,
  MessageResultEvent,
  NewMessageEvent,
} from "@/types/conversations";
import { ConversationsService } from "@/services/conversations";
import { AssetsService } from "@/services/assets";
import { useBannerNotification } from "./useBannerNotification";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { useChatContext } from "@/providers/ChatProvider";

// 파일 용량 제한 (바이트 단위)
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

type Params = {
  projectId: number;
  status?: "all" | "active" | "closed";
  platform?: "line" | "telegram" | "instagram";
};

export function useChatController({ projectId, status = "all", platform }: Params) {
  // ============================================
  // ChatProvider에서 전역 상태 가져오기
  // ============================================
  const {
    connected,
    socketError,
    conversations,
    conversationsPage,
    loadMoreConversations,
    setConversations,
    getSocket,
    setActiveConversationId,
    markMessagesRead,
    setFilters,
  } = useChatContext();

  // ============================================
  // 배너 알림 관리
  // ============================================
  const { banner, showBanner } = useBannerNotification();

  // ============================================
  // 로컬 상태 (채팅 페이지 전용)
  // ============================================
  const [activeId, setActiveIdState] = useState<number | null>(null);
  const activeIdRef = useRef<number | null>(null);
  const conversationCacheRef = useRef<Map<number, Conversation>>(new Map());

  // 메시지 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
  const [msgCursor, setMsgCursor] = useState<number | undefined>(undefined);
  const [msgHasMore, setMsgHasMore] = useState<boolean>(false);
  const msgLoadingRef = useRef(false);
  const lastMsgCursorRequestedRef = useRef<number | undefined>(undefined);

  // Optimistic UI 업데이트 관리
  const tempIdSetRef = useRef<Set<string>>(new Set());

  // 첨부파일 업로드 상태
  const [attachmentUploading, setAttachmentUploading] = useState<boolean>(false);

  // showBanner를 ref로 안정화
  const showBannerRef = useRef(showBanner);
  useEffect(() => {
    showBannerRef.current = showBanner;
  }, [showBanner]);

  useEffect(() => {
    conversations.forEach((conversation) => {
      conversationCacheRef.current.set(conversation.id, conversation);
    });
  }, [conversations]);

  // ============================================
  // 필터 동기화
  // ============================================
  useEffect(() => {
    setFilters({ status, platform });
  }, [status, platform, setFilters]);

  // ============================================
  // 파생 상태
  // ============================================
  const activeConversation = useMemo(
    () => {
      if (!activeId) return null;
      return (
        conversations.find((c) => c.id === activeId) ??
        conversationCacheRef.current.get(activeId) ??
        null
      );
    },
    [conversations, activeId]
  );

  // activeId 변경 시 동기화
  const setActiveId = useCallback((id: number | null) => {
    setActiveIdState(id);
    activeIdRef.current = id;
    setActiveConversationId(id);
  }, [setActiveConversationId]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // ============================================
  // 메시지 관련 이벤트 핸들러 설정
  // ============================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // 메시지 목록 수신
    const onMessagesList = (payload: MessagesListEvent) => {
      if (!payload || payload.conversationId !== activeIdRef.current) return;
      const msgs = payload.messages ?? [];
      const nextCursor = (payload as any)?.nextCursor as number | undefined;
      const hasMore = Boolean((payload as any)?.hasMore);
      const requestedCursor = lastMsgCursorRequestedRef.current;

      setMsgCursor(nextCursor);
      setMsgHasMore(hasMore);
      msgLoadingRef.current = false;
      setIsMessagesLoading(false);
      lastMsgCursorRequestedRef.current = undefined;

      if (requestedCursor !== undefined) {
        // 페이징: 기존 메시지 뒤에 이전 메시지 추가
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = msgs.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMessages];
        });
      } else {
        // 초기 로드: 전체 교체
        setMessages(msgs);
      }
    };

    // 메시지 전송 결과
    const onMessageResult = (payload: MessageResultEvent) => {
      if (!payload?.success) {
        const message = payload?.error || payload?.message || "메시지 전송에 실패했습니다.";
        showBannerRef.current("error", message);
        if (payload?.tempMessageId) {
          const serverMessage = (payload as any).message;
          const messageStatus = serverMessage?.status === "unsupported" ? "unsupported" : "failed";
          setMessages((prev) =>
            prev.map((m: any) =>
              m.tempMessageId === payload.tempMessageId ? { ...m, status: messageStatus } : m
            )
          );
        }
        return;
      }
      // Optimistic UI 업데이트: 임시 메시지를 실제 메시지로 교체
      if ((payload as any).tempMessageId) {
        const tempId = (payload as any).tempMessageId as string;
        const serverMessage = (payload as any).message;
        setMessages((prev) =>
          prev.map((m: any) => {
            if (m.tempMessageId !== tempId) return m;
            if (serverMessage) {
              return { ...serverMessage, tempMessageId: undefined };
            }
            return { ...m, id: payload.messageId, status: "done", sentAt: new Date().toISOString() };
          })
        );
        tempIdSetRef.current.delete(tempId);
      }
    };

    // 새 메시지 수신 (메시지 목록 업데이트)
    const onNewMessage = (payload: NewMessageEvent) => {
      if (!payload) return;
      const { message } = payload;
      const current = activeIdRef.current;
      const messageConvId = message?.conversationId;

      // 현재 활성 대화의 메시지면 메시지 목록에 추가
      if (message && messageConvId === current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [message, ...prev];
        });
        // 읽음 처리
        markMessagesRead(current);
      }
    };

    socket.on("messagesList", onMessagesList as any);
    socket.on("messageResult", onMessageResult as any);
    socket.on("newMessage", onNewMessage as any);

    return () => {
      socket.off("messagesList", onMessagesList as any);
      socket.off("messageResult", onMessageResult as any);
      socket.off("newMessage", onNewMessage as any);
    };
  }, [getSocket, markMessagesRead]);

  // ============================================
  // 활성 대화 변경 시 메시지 및 대화방 상세 로드
  // ============================================
  useEffect(() => {
    if (!activeId) return;
    const socket = getSocket();
    if (!socket) return;

    setMessages([]);
    setMsgCursor(undefined);
    setMsgHasMore(false);

    // 단일 대화방 조회 (customerId 등 상세 정보 포함)
    socket.emit("getConversationById", { id: activeId });
    // 메시지 목록 조회
    socket.emit("getMessages", { conversationId: activeId, limit: 50 });
    // 읽음 처리
    markMessagesRead(activeId);
    
    lastMsgCursorRequestedRef.current = undefined;
    msgLoadingRef.current = true;
    setIsMessagesLoading(true);
  }, [activeId, getSocket, markMessagesRead]);

  useEffect(() => {
    if (activeId !== null) return;
    setMessages([]);
    setMsgCursor(undefined);
    setMsgHasMore(false);
    setIsMessagesLoading(false);
  }, [activeId]);

  // ============================================
  // 메시지 전송 액션
  // ============================================
  const send = useCallback(
    (content: string) => {
      if (!content.trim() || !activeId) return;
      const socket = getSocket();
      if (!socket) {
        showBanner("error", "소켓 연결 상태를 확인해주세요.");
        return;
      }
      const tempMessageId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      tempIdSetRef.current.add(tempMessageId);
      const now = new Date().toISOString();
      const tempIdNum = Date.now();
      const tempMessage = {
        id: tempIdNum,
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

      setMessages((prev) => [tempMessage, ...prev]);
      
      // Optimistic UI: 대화 목록 순서 업데이트
      setConversations((prev) => {
        const target = prev.find((c) => c.id === activeId);
        if (!target) return prev;
        const isReopening = target.status === "closed";
        const updated: Conversation = {
          ...target,
          status: isReopening ? "active" : target.status,
          lastMessage: {
            id: tempIdNum as any,
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
    [activeId, getSocket, showBanner, setConversations]
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
    [activeId, projectId, showBanner, setConversations]
  );

  // ============================================
  // 고객 연동 해제 액션
  // ============================================
  const unlinkCustomerFromConversation = useCallback(async () => {
    if (!activeId) throw new Error("대화방이 선택되지 않았습니다.");
    try {
      const response = await ConversationsService.unlinkCustomer({
        conversationId: activeId,
        projectId: String(projectId),
      });
      if (!response.data?.result) throw new Error("고객 연동 해제에 실패했습니다.");
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, customerId: undefined } : c)));
      showBanner("success", "고객 연동이 해제되었습니다.");
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "고객 연동 해제에 실패했습니다.";
      showBanner("error", message);
      throw new Error(message);
    }
  }, [activeId, projectId, showBanner, setConversations]);

  // ============================================
  // 상담 완료 액션
  // ============================================
  const closeConversation = useCallback(async () => {
    if (!activeId) {
      showBanner("error", "대화방을 먼저 선택해주세요.");
      return;
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
  }, [activeId, projectId, showBanner, setConversations]);

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
      const socket = getSocket();
      if (!socket) {
        showBanner("error", "소켓 연결 상태를 확인해주세요.");
        return;
      }

      const messageType = detectMessageType(file);
      const isImage = messageType === "image";
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
      const maxSizeMB = isImage ? 8 : 20;

      if (file.size > maxSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        showErrorModal({
          type: "info",
          title: "파일 용량 초과",
          headline: `${isImage ? "이미지" : "파일"} 용량이 너무 큽니다.`,
          description: `최대 ${maxSizeMB}MB까지 업로드 가능합니다.\n현재 파일 크기: ${fileSizeMB}MB`,
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }

      const tempMessageId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      setAttachmentUploading(true);

      const tempIdNum = Date.now();
      const tempMessage = {
        id: tempIdNum,
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

      setMessages((prev) => [tempMessage, ...prev]);
      setConversations((prev) => {
        const target = prev.find((c) => c.id === activeId);
        if (!target) return prev;
        const isReopening = target.status === "closed";
        const updated: Conversation = {
          ...target,
          status: isReopening ? "active" : target.status,
          lastMessage: {
            id: tempIdNum as any,
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
    [activeId, getSocket, showBanner, setConversations]
  );

  // ============================================
  // 이전 메시지 로드
  // ============================================
  const loadOlderMessages = useCallback(() => {
    if (!activeId || msgLoadingRef.current || !msgHasMore) return;
    const socket = getSocket();
    if (!socket) return;
    msgLoadingRef.current = true;
    lastMsgCursorRequestedRef.current = msgCursor;
    socket.emit("getMessages", { conversationId: activeId, limit: 50, cursor: msgCursor });
  }, [activeId, msgHasMore, msgCursor, getSocket]);

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
    unlinkCustomerFromConversation,
    closeConversation,
    notify: showBanner,
    attachmentUploading,
    sendAttachment,
    isMessagesLoading,
    conversationsPage: {
      hasMore: conversationsPage.hasMore,
      loading: conversationsPage.loading,
      initialized: conversationsPage.initialized,
    },
    messagesPage: { hasMore: msgHasMore },
    loadMoreConversations,
    loadOlderMessages,
  } as const;
}
