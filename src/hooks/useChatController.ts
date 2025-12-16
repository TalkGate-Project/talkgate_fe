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
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
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

    // status/platform 변경 시 상태 초기화
    setConversations([]);
    setConvCursor(undefined);
    setConvHasMore(false);
    convLoadingRef.current = false;
    lastConvCursorRequestedRef.current = undefined;

    // 초기 데이터 요청 함수
    const requestInitialConversations = () => {
      socket.emit("getConversations", {
        limit: 20,
        status: status === "all" ? undefined : status,
        platform,
      });
      lastConvCursorRequestedRef.current = undefined;
      convLoadingRef.current = true;
    };

    // 소켓이 이미 연결되어 있으면 상태를 즉시 업데이트하고 데이터 요청
    if (socket.connected) {
      setConnected(true);
      setSocketError(null);
      // 이미 연결된 상태에서 status/platform이 변경된 경우 즉시 데이터 요청
      requestInitialConversations();
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
      
      // 서버 준비 완료 시 대화 목록 요청
      requestInitialConversations();
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
    // - conversationsList는 목록 조회용 (customerId가 포함되지 않을 수 있음)
    // - 개별 대화방 선택 시 getConversationById로 상세 정보(customerId 포함) 조회
    const onConversationsList = (payload: ConversationsListEvent) => {
      const items = payload?.conversations ?? [];
      const currentCursor = (payload as any)?.cursor as number | undefined;
      const nextCursor = (payload as any)?.nextCursor as number | undefined;
      let hasMore = Boolean((payload as any)?.hasMore);
      const requestedCursor = lastConvCursorRequestedRef.current;

      // 방어 로직: cursor와 nextCursor가 같으면 무한 루프 방지
      // TODO: [백엔드 버그] cursor === nextCursor인 경우 발생 - 백엔드에서 수정 필요
      if (currentCursor !== undefined && nextCursor !== undefined && currentCursor === nextCursor) {
        hasMore = false;
      }

      convLoadingRef.current = false;
      lastConvCursorRequestedRef.current = undefined;

      if (requestedCursor) {
        // 페이징: 기존 목록에 추가 (activeId는 건드리지 않음 - 기존 선택 유지)
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
          // 방어 로직: 새로 추가된 항목이 없으면 hasMore를 false로 처리
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
        // 초기 로드/새로고침: 전체 교체
        setConversations(items);
        setConvCursor(nextCursor);
        setConvHasMore(hasMore);
        // 초기 로드 시에만 선택 상태 검증 (선택된 대화방이 새 목록에 없으면 선택 해제)
        const current = activeIdRef.current;
        if (current && !items.some((c) => c.id === current)) {
          setActiveId(null);
        }
      }
    };

    // 대화 조회/업데이트 이벤트 핸들러
    // - getConversationById 호출 시 응답으로 사용됨 (단일 대화방 조회)
    // - 서버에서 대화방 업데이트 푸시 시에도 사용됨
    // - customerId 등 상세 정보가 포함되어 고객 연동 상태가 반영됨
    const onConversation = (payload: ConversationEvent) => {
      if (!payload?.conversation) return;
      const updatedConversation = payload.conversation;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === updatedConversation.id);
        if (!exists) return [updatedConversation, ...prev];
        return prev.map((c) => (c.id === updatedConversation.id ? updatedConversation : c));
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
      setIsMessagesLoading(false);
      lastMsgCursorRequestedRef.current = undefined;

      if (requestedCursor) {
        // 페이징: 기존 메시지 뒤에 이전 메시지 추가 (백엔드가 최신->오래된 순으로 보냄)
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = msgs.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMessages];
        });
      } else {
        // 초기 로드: 전체 교체 (백엔드 순서 그대로 사용: 최신 -> 오래된)
        setMessages(msgs);
      }
    };

    // 메시지 전송 결과 이벤트 핸들러
    const onMessageResult = (payload: MessageResultEvent) => {
      if (!payload?.success) {
        const message = payload?.error || payload?.message || "메시지 전송에 실패했습니다.";
        showBannerRef.current("error", message);
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
      const current = activeIdRef.current;
      const messageConvId = message?.conversationId;

      // 대화 목록 업데이트 (최신 메시지가 있는 대화를 맨 위로 이동, lastMessage/unreadCount 갱신)
      // 채팅방을 열지 않은 상태에서도 리스트가 갱신되어야 함
      setConversations((prev) => {
        // conversation 객체가 있으면 사용, 없으면 기존 목록에서 찾기
        const existingConv = prev.find((c) => c.id === (conversation?.id || messageConvId));
        
        if (conversation) {
          // 백엔드가 conversation 객체를 보내준 경우
          const others = prev.filter((c) => c.id !== conversation.id);
          // 활성 대화방이 아닐 때만 unreadCount 증가 (이미 증가된 값이 오지 않은 경우 대비)
          const shouldIncreaseUnread = current !== conversation.id && message?.direction === "incoming";
          const updated: Conversation = {
            ...conversation,
            lastMessage: conversation.lastMessage || message,
            unreadCount: shouldIncreaseUnread && conversation.unreadCount === (existingConv?.unreadCount ?? 0)
              ? (existingConv?.unreadCount ?? 0) + 1
              : conversation.unreadCount,
          };
          return [updated, ...others];
        } else if (message && existingConv) {
          // conversation 객체가 없지만 message로 대화 목록 업데이트 가능한 경우
          const others = prev.filter((c) => c.id !== messageConvId);
          // 활성 대화방이 아니고 incoming 메시지일 때만 unreadCount 증가
          const shouldIncreaseUnread = current !== messageConvId && message.direction === "incoming";
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

      // 현재 활성 대화의 메시지면 메시지 목록에 추가
      if (message && messageConvId === current) {
        // 앞에 추가 (배열: [최신, ..., 오래된] → reverse 후 화면: [오래된, ..., 최신])
        // send() 함수의 Optimistic UI와 동일한 방식으로 앞에 추가해야 새 메시지가 화면 하단에 표시됨
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev; // 중복 제거
          return [message, ...prev];
        });
        // 읽음 처리
        socket.emit("markMessagesRead", { conversationId: current });
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
  // 활성 대화 변경 시 메시지 및 대화방 상세 로드
  // ============================================
  useEffect(() => {
    if (!activeId) return;
    const socket = socketRef.current;
    if (!socket) return;
    // 단일 대화방 조회 (customerId 등 상세 정보 포함)
    socket.emit("getConversationById", { id: activeId });
    // 메시지 목록 조회
    socket.emit("getMessages", { conversationId: activeId, limit: 50 });
    socket.emit("markMessagesRead", { conversationId: activeId });
    lastMsgCursorRequestedRef.current = undefined;
    msgLoadingRef.current = true;
    setIsMessagesLoading(true);
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
      // Optimistic UI: 즉시 메시지 추가 (앞에 추가하여 최신 메시지가 위로 - 추후 렌더링 시 reverse됨)
      const tempIdNum = Date.now(); // number 타입의 임시 ID 사용
      const tempMessage = {
        id: tempIdNum, // number 타입이어야 함
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
      // Optimistic UI: 대화 목록 순서 업데이트 (최신 메시지가 있는 대화를 맨 위로)
      setConversations((prev) => {
        const target = prev.find((c) => c.id === activeId);
        if (!target) return prev;
        
        // 상담 완료된 상태에서 메시지를 보내면 다시 활성화됨 (Optimistic UI)
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
    [activeId, showBanner]
  );

  // ============================================
  // 고객 연동 액션
  // ============================================
  // - linkCustomer API 호출 후 로컬 상태를 즉시 업데이트 (Optimistic UI)
  // - 이후 대화방 재선택 시 getConversationById로 서버에서 customerId 포함된 정보 동기화
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
        // Optimistic UI: 로컬 상태 즉시 업데이트 (서버에서 customerId 반환 시 덮어쓰기됨)
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
      // Optimistic UI: 로컬 상태 즉시 업데이트
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, customerId: undefined } : c)));
      showBanner("success", "고객 연동이 해제되었습니다.");
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "고객 연동 해제에 실패했습니다.";
      showBanner("error", message);
      throw new Error(message);
    }
  }, [activeId, projectId, showBanner]);

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

      // Optimistic UI: 즉시 메시지 추가 (앞에 추가하여 최신 메시지가 위로 - 추후 렌더링 시 reverse됨)
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

        // 상담 완료된 상태에서 파일을 보내면 다시 활성화됨 (Optimistic UI)
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
    unlinkCustomerFromConversation,
    closeConversation,
    notify: showBanner,
    attachmentUploading,
    sendAttachment,
    isMessagesLoading,
    // 페이징
    conversationsPage: { hasMore: convHasMore },
    messagesPage: { hasMore: msgHasMore },
    loadMoreConversations,
    loadOlderMessages,
  } as const;
}


