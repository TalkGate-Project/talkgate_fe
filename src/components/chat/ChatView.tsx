"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Conversation } from "@/lib/realtime";
import { useChatController } from "@/hooks/useChatController";
import EmojiPicker from "./EmojiPicker";
import ChatLeftSidebar from "./ChatLeftSidebar";
import ChatMainView from "./ChatMainView";
import ChatRightSidebar from "./ChatRightSidebar";
import CustomerLinkModeModal from "./customer-link/CustomerLinkModeModal";
import CustomerLinkExistingModal from "./customer-link/CustomerLinkExistingModal";
import CustomerLinkCreateModal from "./customer-link/CustomerLinkCreateModal";

type Props = { projectId: number };

export default function ChatView({ projectId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "album">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerMode, setEmojiPickerMode] = useState<"compact" | "full">(
    "compact"
  );
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    x: 0,
    y: 0,
  });
  const [linkStep, setLinkStep] = useState<
    null | "mode" | "existing" | "create"
  >(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [input, setInput] = useState("");

  // 쿼리 문자열과 동기화된 필터 상태: status = all | active | closed
  const statusFromQuery = (searchParams.get("status") || "all").toLowerCase();
  const statusFilter: "all" | "active" | "closed" =
    statusFromQuery === "active" || statusFromQuery === "closed"
      ? (statusFromQuery as any)
      : "all";

  function setStatusFilter(next: "all" | "active" | "closed") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const platformMap: Record<
    string,
    "line" | "telegram" | "instagram" | undefined
  > = {
    telegram: "telegram",
    instagram: "instagram",
    line: "line",
  };
  const platformQuery = (searchParams.get("platform") || "").toLowerCase();
  const platform = platformMap[platformQuery];

  // 쿼리 파라미터를 통한 딥링크 지원
  const paramConversationId = Number(searchParams.get("conversationId") || "");
  const paramCustomerId = Number(searchParams.get("customerId") || "");
  const desiredConvIdRef = useRef<number | null>(
    Number.isFinite(paramConversationId) ? paramConversationId : null
  );
  const desiredCustomerIdRef = useRef<number | null>(
    Number.isFinite(paramCustomerId) ? paramCustomerId : null
  );

  const {
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
    notify,
    conversationsPage,
    messagesPage,
    loadMoreConversations,
    loadOlderMessages,
    attachmentUploading,
    sendAttachment,
  } = useChatController({ projectId, status: statusFilter, platform });

  useEffect(() => {
    if (linkStep && !activeConversation) {
      setLinkStep(null);
    }
  }, [linkStep, activeConversation]);

  const openLinkFlow = useCallback(() => {
    if (!activeId) {
      notify("error", "대화방을 먼저 선택해주세요.");
      return;
    }
    setLinkStep("mode");
  }, [activeId, notify]);

  const closeLinkFlow = useCallback(() => {
    setLinkStep(null);
  }, []);

  const handleLinkAndClose = useCallback(
    async (customerId: number) => {
      await linkCustomerToConversation(customerId);
      setLinkStep(null);
    },
    [linkCustomerToConversation]
  );

  function onSend() {
    if (!input.trim()) return;
    send(input);
    setInput("");
  }

  function handleEmojiButtonClick() {
    // 토글: 열려 있으면 닫기, 닫혀 있으면 compact로 열기
    if (emojiPickerOpen) {
      setEmojiPickerOpen(false);
      return;
    }
    if (emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        x: rect.left - 108,
        y: rect.top,
      });
    }
    setEmojiPickerMode("compact");
    setEmojiPickerOpen(true);
  }

  function handleEmojiSelect(emoji: string) {
    setInput((prev) => prev + emoji);
  }

  // 첨부파일용 파일 입력
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onAttachImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);
  const onAttachFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const onImageSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) sendAttachment(file);
      e.target.value = ""; // 같은 파일 재선택 허용
    },
    [sendAttachment]
  );
  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) sendAttachment(file);
      e.target.value = "";
    },
    [sendAttachment]
  );

  // 상태에 따른 필터링된 대화 목록
  const filteredConversations = useMemo(() => {
    if (statusFilter === "all") return conversations;
    return conversations.filter(
      (c) => c.status === (statusFilter === "active" ? "active" : "closed")
    );
  }, [conversations, statusFilter]);

  // 현재 필터에서 activeId가 유효한지 확인
  useEffect(() => {
    if (!filteredConversations.length) {
      setActiveId(null);
      return;
    }
    // 데이터가 도착했을 때 딥링크된 conversationId / customerId를 한 번만 반영
    if (!activeId) {
      const wanted = desiredConvIdRef.current;
      if (wanted && filteredConversations.some((c) => c.id === wanted)) {
        setActiveId(wanted);
        desiredConvIdRef.current = null;
        return;
      }
      const wantedCustomer = desiredCustomerIdRef.current;
      if (wantedCustomer != null) {
        const hit = (filteredConversations as any[]).find(
          (c) => c.customerId === wantedCustomer
        );
        if (hit) {
          setActiveId((hit as any).id);
          desiredCustomerIdRef.current = null;
          return;
        }
      }
    }
    const stillVisible = filteredConversations.some((c) => c.id === activeId);
    if (!stillVisible) {
      // 선택된 항목이 없으면 유휴 상태 유지; 자동 선택하지 않음
      setActiveId(null);
    }
  }, [statusFilter, filteredConversations, activeId, setActiveId]);

  // 선택과 conversationId 파라미터 동기화 유지
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeId) {
      params.set("conversationId", String(activeId));
      router.replace(`?${params.toString()}`, { scroll: false });
    } else if (params.has("conversationId")) {
      params.delete("conversationId");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="grid grid-cols-12 gap-6">
      <ChatLeftSidebar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        loadMoreConversations={loadMoreConversations}
      />

      <ChatMainView
        activeConversation={activeConversation}
        messages={messages}
        banner={banner}
        connected={connected}
        socketError={socketError}
        input={input}
        setInput={setInput}
        onSend={onSend}
        onOpenLinkFlow={openLinkFlow}
        onCloseConversation={closeConversation}
        attachmentUploading={attachmentUploading}
        onAttachImage={onAttachImage}
        onAttachFile={onAttachFile}
        onClickEmoji={handleEmojiButtonClick}
        emojiButtonRef={emojiButtonRef}
        loadOlderMessages={loadOlderMessages}
      />

      <ChatRightSidebar />

      {/* 이모지 피커 */}
      <EmojiPicker
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onEmojiSelect={handleEmojiSelect}
        position={emojiPickerPosition}
        mode={emojiPickerMode}
        onToggleMode={(m) => setEmojiPickerMode(m)}
      />

      {/* 숨겨진 파일 입력 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageSelected}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
      />

      <CustomerLinkModeModal
        open={linkStep === "mode"}
        onClose={closeLinkFlow}
        onSelect={(mode) => setLinkStep(mode)}
      />
      <CustomerLinkExistingModal
        open={linkStep === "existing" && Boolean(activeConversation)}
        onClose={closeLinkFlow}
        onBack={() => setLinkStep("mode")}
        projectId={projectId}
        conversationName={activeConversation?.name}
        onLink={handleLinkAndClose}
      />
      <CustomerLinkCreateModal
        open={linkStep === "create" && Boolean(activeConversation)}
        onClose={closeLinkFlow}
        onBack={() => setLinkStep("mode")}
        projectId={projectId}
        conversationName={activeConversation?.name}
        onLink={handleLinkAndClose}
      />
    </div>
  );
}
