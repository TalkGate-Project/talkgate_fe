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
import { usePathname } from "next/navigation";
import type { Socket } from "socket.io-client";
import { talkgateSocket, Conversation } from "@/lib/realtime";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { useMe } from "@/hooks/useMe";
import { showChatNotification } from "@/utils/notification";
import { showToastNotification } from "@/lib/toastNotificationEvents";
import { getAccessToken } from "@/lib/token";
import type {
  ConversationsListEvent,
  NewMessageEvent,
  MessagesMarkedReadEvent,
  ConversationEvent,
  SocketErrorEvent,
} from "@/types/conversations";

// ============================================
// Context 타입 정의
// ============================================
type ChatContextType = {
  /** 소켓 연결 상태 */
  connected: boolean;
  /** 소켓 에러 메시지 */
  socketError: string | null;
  /** 대화 목록 */
  conversations: Conversation[];
  /** 총 안 읽은 메시지 수 */
  totalUnreadCount: number;
  /** 안 읽은 메시지 존재 여부 */
  hasUnread: boolean;
  /** 대화 목록 페이징 정보 */
  conversationsPage: {
    hasMore: boolean;
    cursor: number | undefined;
    loading: boolean;
    initialized: boolean;
  };
  /** 대화 목록 더 불러오기 */
  loadMoreConversations: () => void;
  /** 대화 목록 업데이트 (내부용) */
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  /** 소켓 인스턴스 접근 */
  getSocket: () => Socket | null;
  /** 현재 활성 대화방 ID 설정 (읽음 처리용) */
  setActiveConversationId: (id: number | null) => void;
  /** 메시지 읽음 처리 */
  markMessagesRead: (conversationId: number) => void;
  /** 현재 프로젝트 ID */
  projectId: number | null;
  /** 필터 상태 */
  filters: {
    status: "all" | "active" | "closed";
    platform: "line" | "telegram" | "instagram" | undefined;
    categoryIds?: (number | null)[]; // null은 "일반" 카테고리를 의미
  };
  /** 필터 변경 */
  setFilters: (filters: { status?: "all" | "active" | "closed"; platform?: "line" | "telegram" | "instagram" | undefined; categoryIds?: (number | null)[] }) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

/**
 * ChatProvider의 상태에 접근하는 훅
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}

/**
 * 안전하게 ChatContext에 접근 (Provider 외부에서도 사용 가능)
 */
export function useChatContextSafe() {
  return useContext(ChatContext);
}

// ============================================
// ChatProvider 컴포넌트
// ============================================
export default function ChatProvider({ children }: { children: ReactNode }) {
  const [selectedProjectId, ready] = useSelectedProjectId();
  const pathname = usePathname();
  const { user } = useMe();
  const { project } = useCurrentProjectDetail();
  const projectId = useMemo(() => {
    if (!ready || !selectedProjectId) return null;
    const parsed = Number.parseInt(selectedProjectId, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [selectedProjectId, ready]);

  // 토스트 알림용 프로젝트 이름 (ref로 참조해 소켓 재연결 트리거에서 제외)
  const projectNameRef = useRef<string | null>(null);
  useEffect(() => {
    projectNameRef.current = project?.name || null;
  }, [project?.name]);

  // 소켓 상태
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // 대화 목록 상태
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convCursor, setConvCursor] = useState<number | undefined>(undefined);
  const [convHasMore, setConvHasMore] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [hasInitializedConversations, setHasInitializedConversations] = useState(false);
  const convLoadingRef = useRef(false);
  const lastConvCursorRequestedRef = useRef<number | undefined>(undefined);

  // 필터 상태
  const [filters, setFiltersState] = useState<{
    status: "all" | "active" | "closed";
    platform: "line" | "telegram" | "instagram" | undefined;
    categoryIds?: (number | null)[]; // null은 "일반" 카테고리를 의미
  }>({ status: "all", platform: undefined, categoryIds: undefined });
  // 필터 ref (useEffect 내부에서 최신 값 참조용)
  const filtersRef = useRef(filters);
  
  // filters 변경 시 ref 업데이트
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // 현재 활성 대화방 ID (읽음 처리용)
  const activeConversationIdRef = useRef<number | null>(null);

  // 총 안 읽은 메시지 수 계산
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unreadCount ?? 0), 0);
  }, [conversations]);

  const hasUnread = totalUnreadCount > 0;

  // 필터 변경 함수
  const setFilters = useCallback((newFilters: { 
    status?: "all" | "active" | "closed"; 
    platform?: "line" | "telegram" | "instagram" | undefined;
    categoryIds?: (number | null)[]; // null은 "일반" 카테고리를 의미
  }) => {
    setFiltersState(prev => {
      const nextStatus = newFilters.status !== undefined ? newFilters.status : prev.status;
      // platform은 명시적으로 undefined를 전달할 수 있도록 처리
      // newFilters에 platform이 없으면(undefined) 이전 값 유지, 있으면(undefined 포함) 업데이트
      const nextPlatform = "platform" in newFilters ? newFilters.platform : prev.platform;
      // categoryIds는 명시적으로 전달된 경우에만 업데이트
      const nextCategoryIds = "categoryIds" in newFilters ? newFilters.categoryIds : prev.categoryIds;
      return {
        status: nextStatus,
        platform: nextPlatform,
        categoryIds: nextCategoryIds,
      };
    });
  }, []);

  // 소켓 인스턴스 접근
  const getSocket = useCallback(() => socketRef.current, []);

  // 활성 대화방 ID 설정
  const setActiveConversationId = useCallback((id: number | null) => {
    activeConversationIdRef.current = id;
  }, []);

  // 메시지 읽음 처리
  const markMessagesRead = useCallback((conversationId: number) => {
    const socket = socketRef.current;
    if (!socket) return;
    
    socket.emit("markMessagesRead", { conversationId });
  }, []);

  // 대화 목록 더 불러오기
  const loadMoreConversations = useCallback(() => {
    if (convLoadingRef.current || !convHasMore) return;
    const socket = socketRef.current;
    if (!socket) return;

    convLoadingRef.current = true;
    setIsConversationsLoading(true);
    lastConvCursorRequestedRef.current = convCursor;
    
    const requestPayload: any = { limit: 20, cursor: convCursor };
    if (filters.status !== "all") requestPayload.status = filters.status;
    // 전체 필터는 platform 필드를 보내지 않음 (undefined면 omit)
    if (filters.platform !== undefined) requestPayload.platform = filters.platform;
    // categoryIds가 있으면 포함
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      requestPayload.categoryIds = filters.categoryIds;
    }

    socket.emit("getConversations", requestPayload);
  }, [convHasMore, convCursor, filters.status, filters.platform, filters.categoryIds]);

  // ============================================
  // 소켓 연결 및 이벤트 핸들링
  // ============================================
  useEffect(() => {
    if (!projectId) {
      // 프로젝트 ID가 없으면 초기화
      if (socketRef.current) {
        talkgateSocket.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setSocketReady(false);
      setSocketError(null);
      setConversations([]);
      setConvCursor(undefined);
      setConvHasMore(false);
      setIsConversationsLoading(false);
      setHasInitializedConversations(false);
      return;
    }

    // 소켓 연결
    const accessToken = getAccessToken();
    if (!accessToken) {
      talkgateSocket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocketReady(false);
      setSocketError(null);
      setConversations([]);
      setConvCursor(undefined);
      setConvHasMore(false);
      setIsConversationsLoading(false);
      setHasInitializedConversations(false);
      return;
    }
    
    let socket: Socket | null;
    try {
      socket = talkgateSocket.connect(projectId);
      if (!socket) {
        return;
      }
      socketRef.current = socket;
      setSocketReady(false);
    } catch (error) {
      console.error("Failed to connect chat socket:", error);
      setSocketReady(false);
      setSocketError("소켓 연결에 실패했습니다.");
      return;
    }

    // 연결 상태 핸들러
    const handleConnect = () => {
      setConnected(true);
      setSocketError(null);
    };

    const handleReady = () => {
      setConnected(true);
      setSocketReady(true);
      setSocketError(null);
    };

    const handleConnectError = (err: any) => {
      setConnected(false);
      setSocketReady(false);
      setIsConversationsLoading(false);
      setSocketError(err?.message || "소켓 연결에 실패했습니다.");
    };

    const handleDisconnect = (reason: any) => {
      setConnected(false);
      setSocketReady(false);
      setIsConversationsLoading(false);
      if (reason !== "io client disconnect") {
        setSocketError(`연결이 종료되었습니다: ${String(reason)}`);
      }
    };

    const handleSocketError = (payload: SocketErrorEvent) => {
      const code = payload?.code ? `[${payload.code}] ` : "";
      const message = payload?.message || "알 수 없는 오류";
      setIsConversationsLoading(false);
      setSocketError(`${code}${message}`);
    };

    // 대화 목록 수신
    const handleConversationsList = (payload: ConversationsListEvent) => {
      const items = payload?.conversations ?? [];
      const currentCursor = (payload as any)?.cursor as number | undefined;
      const nextCursor = (payload as any)?.nextCursor as number | undefined;
      let hasMore = Boolean((payload as any)?.hasMore);
      const requestedCursor = lastConvCursorRequestedRef.current;

      // cursor === nextCursor인 경우 무한 루프 방지
      if (currentCursor !== undefined && nextCursor !== undefined && currentCursor === nextCursor) {
        hasMore = false;
      }

      convLoadingRef.current = false;
      setIsConversationsLoading(false);
      setHasInitializedConversations(true);
      lastConvCursorRequestedRef.current = undefined;

      if (requestedCursor !== undefined) {
        // 페이징: 기존 목록에 추가
        setConversations((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const merged = [...prev];
          let addedCount = 0;
          for (const it of items) {
            if (!existingIds.has(it.id)) {
              merged.push(it);
              addedCount++;
            }
          }
          if (addedCount === 0) {
            setConvHasMore(false);
            setConvCursor(undefined);
          } else {
            setConvCursor(nextCursor);
            setConvHasMore(hasMore);
          }
          return merged;
        });
      } else {
        // 초기 로드: 전체 교체
        setConversations(items);
        setConvCursor(nextCursor);
        setConvHasMore(hasMore);
      }
    };

    // 개별 대화 업데이트
    const handleConversation = (payload: ConversationEvent) => {
      if (!payload?.conversation) return;
      const updatedConversation = payload.conversation;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === updatedConversation.id);
        if (!exists) return [updatedConversation, ...prev];
        return prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c));
      });
    };

    // 새 메시지 수신
    const handleNewMessage = (payload: NewMessageEvent) => {
      if (!payload) return;
      const { message, conversation } = payload;
      const activeId = activeConversationIdRef.current;
      const messageConvId = message?.conversationId;

      setConversations((prev) => {
        const existingConv = prev.find((c) => c.id === (conversation?.id || messageConvId));

        // 브라우저 알림 표시 (상담 페이지가 아니고, 수신 메시지이고, 활성 대화방이 아니고, 알림 설정이 켜져 있을 때)
        const isConsultPage = pathname === "/consult";
        const isIncomingMessage = message?.direction === "incoming";
        const isNotActiveConversation = messageConvId !== activeId;
        const isChatNotificationEnabled = Boolean(user?.isAllowChatNotification);
        
        if (!isConsultPage && isIncomingMessage && isNotActiveConversation && isChatNotificationEnabled) {
          // 대화방 이름과 메시지 내용 추출
          const conversationName = conversation?.name || existingConv?.name || "알 수 없는 대화방";
          const messageContent = message?.content || 
            (message?.type === "image" ? "이미지" : 
             message?.type === "file" ? message?.fileName || "파일" :
             message?.type === "video" ? "동영상" :
             message?.type === "audio" ? "음성" :
             "새 메시지");
          
          showChatNotification(conversationName, messageContent);
          showToastNotification({
            projectName: projectNameRef.current || "프로젝트",
            category: "채팅",
            content: `${conversationName} | ${messageContent}`,
            onClick: () => {
              window.location.href = "/consult";
            },
          });
        }

        if (conversation) {
          const others = prev.filter((c) => c.id !== conversation.id);
          const isActiveConversation = conversation.id === activeId;
          const shouldIncreaseUnread = 
            !isActiveConversation && 
            message?.direction === "incoming" &&
            conversation.unreadCount === (existingConv?.unreadCount ?? 0);

          const updated: Conversation = {
            ...conversation,
            lastMessage: conversation.lastMessage || message,
            unreadCount: shouldIncreaseUnread
              ? (existingConv?.unreadCount ?? 0) + 1
              : conversation.unreadCount,
          };
          return [updated, ...others];
        } else if (message && existingConv) {
          const others = prev.filter((c) => c.id !== messageConvId);
          const isActiveConversation = messageConvId === activeId;
          const shouldIncreaseUnread = !isActiveConversation && message.direction === "incoming";

          const updated: Conversation = {
            ...existingConv,
            lastMessage: message,
            updatedAt: message.sentAt || message.createdAt,
            unreadCount: shouldIncreaseUnread ? existingConv.unreadCount + 1 : existingConv.unreadCount,
          };
          return [updated, ...others];
        }

        return prev;
      });
    };

    // 메시지 읽음 처리
    const handleMessagesMarkedRead = (payload: MessagesMarkedReadEvent) => {
      if (!payload) return;
      const id = payload.conversationId;
      setConversations((prev) => 
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    };

    // 이미 연결되어 있으면 즉시 데이터 요청
    if (socket.connected) {
      setConnected(true);
      setSocketReady(true);
    }

    // 이벤트 리스너 등록
    socket.on("connect", handleConnect);
    socket.on("ready", handleReady);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("error", handleSocketError as any);
    socket.on("conversationsList", handleConversationsList as any);
    socket.on("conversation", handleConversation as any);
    socket.on("newMessage", handleNewMessage as any);
    socket.on("messagesMarkedRead", handleMessagesMarkedRead as any);

    // 페이지 새로고침/닫기 시 소켓 정리
    const handleBeforeUnload = () => {
      talkgateSocket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("ready", handleReady);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("error", handleSocketError as any);
      socket.off("conversationsList", handleConversationsList as any);
      socket.off("conversation", handleConversation as any);
      socket.off("newMessage", handleNewMessage as any);
      socket.off("messagesMarkedRead", handleMessagesMarkedRead as any);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [projectId, pathname, user?.isAllowChatNotification]); // filters는 ref로 참조하므로 의존성 배열에서 제외

  // ============================================
  // 필터 변경 시 대화 목록 재요청
  // ============================================
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !projectId || !connected || !socketReady) return;

    // 필터가 변경되면 대화 목록을 다시 요청
    setConvCursor(undefined);
    setConvHasMore(false);
    setIsConversationsLoading(true);
    convLoadingRef.current = true;
    lastConvCursorRequestedRef.current = undefined;

    const requestPayload: any = { limit: 20 };
    if (filters.status !== "all") requestPayload.status = filters.status;
    // 전체 필터는 platform 필드를 보내지 않음 (undefined면 omit)
    if (filters.platform !== undefined) requestPayload.platform = filters.platform;
    // categoryIds가 있으면 포함
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      requestPayload.categoryIds = filters.categoryIds;
    }

    socket.emit("getConversations", requestPayload);
  }, [filters.status, filters.platform, filters.categoryIds, projectId, connected, socketReady]);

  // Context 값
  const value: ChatContextType = {
    connected,
    socketError,
    conversations,
    totalUnreadCount,
    hasUnread,
    conversationsPage: {
      hasMore: convHasMore,
      cursor: convCursor,
      loading: isConversationsLoading,
      initialized: hasInitializedConversations,
    },
    loadMoreConversations,
    setConversations,
    getSocket,
    setActiveConversationId,
    markMessagesRead,
    projectId,
    filters,
    setFilters,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

