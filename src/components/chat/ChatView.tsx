"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useChatController } from "@/hooks/useChatController";
import { useChatInput } from "@/hooks/useChatInput";
import { useChatFilters } from "@/hooks/useChatFilters";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useChatAttachment } from "@/hooks/useChatAttachment";
import { useChatUrlSync } from "@/hooks/useChatUrlSync";
import { useChatLayout } from "@/hooks/useChatLayout";
import { useChatResizer } from "@/hooks/useChatResizer";
import { useAiAssistantPanel } from "@/hooks/useAiAssistantPanel";
import EmojiPicker from "./EmojiPicker";
import ChatLeftSidebar from "./ChatLeftSidebar";
import ChatMainView from "./ChatMainView";
import ChatRightSidebar from "./ChatRightSidebar";
import ChatFloatingAiSidebar from "./ChatFloatingAiSidebar";
import CustomerLinkModeModal from "./customer-link/CustomerLinkModeModal";
import CustomerLinkExistingModal from "./customer-link/CustomerLinkExistingModal";
import CustomerLinkCreateModal from "./customer-link/CustomerLinkCreateModal";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import UnlinkConversationModal from "@/components/common/UnlinkConversationModal";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type Props = { projectId: number };

export default function ChatView({ projectId }: Props) {
  const [viewMode, setViewMode] = useState<"list" | "album">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [linkStep, setLinkStep] = useState<null | "mode" | "existing" | "create">(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // 필터 관련 로직
  const {
    statusFilter,
    setStatusFilter,
    platform,
    filterDefaults,
    handleFilterApply: handleFilterApplyBase,
  } = useChatFilters();

  const handleFilterApply = useCallback((filters: Parameters<typeof handleFilterApplyBase>[0]) => {
    handleFilterApplyBase(filters);
    setFilterOpen(false);
  }, [handleFilterApplyBase]);

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
    unlinkCustomerFromConversation,
    closeConversation,
    notify,
    conversationsPage,
    messagesPage,
    loadMoreConversations,
    loadOlderMessages,
    attachmentUploading,
    sendAttachment,
    isMessagesLoading,
  } = useChatController({ projectId, status: statusFilter, platform });

  // 입력 내용 관리
  const { input, setInput, clearInput, conversationsWithDraft } = useChatInput(activeId);

  // 이모지 피커 관련 로직
  const {
    emojiPickerOpen,
    emojiPickerMode,
    emojiPickerPosition,
    emojiButtonRef,
    mobileEmojiButtonRef,
    handleEmojiButtonClick,
    handleClose: handleCloseEmojiPicker,
    setEmojiPickerMode,
  } = useEmojiPicker();

  // 파일 첨부 관련 로직
  const {
    imageInputRef,
    fileInputRef,
    onAttachImage,
    onAttachFile,
    onImageSelected,
    onFileSelected,
  } = useChatAttachment(sendAttachment);

  // 레이아웃 관련 로직
  const { isDesktopLayout, isAiSidebarOpen, setIsAiSidebarOpen } = useChatLayout();
  
  // 리사이저 관련 로직 (웹에서만 사용) - 버튼으로 너비 치환만 지원
  const {
    mainWidth,
    sidebarWidth,
    swapWidths,
    widthMode,
  } = useChatResizer();

  const aiAssistantPanel = useAiAssistantPanel({
    projectId,
    conversationId: activeId,
  });

  // 상태에 따른 필터링된 대화 목록
  const filteredConversations = useMemo(() => {
    if (statusFilter === "all") return conversations;
    return conversations.filter(
      (c) => c.status === (statusFilter === "active" ? "active" : "closed")
    );
  }, [conversations, statusFilter]);

  // URL 동기화 및 모달 상태 초기화
  const handleModalStateReset = useCallback(() => {
    setLinkStep(null);
    setCustomerDetailOpen(false);
    setUnlinkModalOpen(false);
    setIsAiSidebarOpen(false);
  }, [setIsAiSidebarOpen]);

  const { handleCloseConversationMobile } = useChatUrlSync(
    activeId,
    setActiveId,
    filteredConversations,
    {
      isConversationsLoading: conversationsPage.loading,
      hasInitializedConversations: conversationsPage.initialized,
      onModalStateReset: handleModalStateReset,
    }
  );

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

  const openUnlinkModal = useCallback(() => {
    if (!activeConversation?.customerId) {
      notify("error", "연동된 고객 정보가 없습니다.");
      return;
    }
    setUnlinkModalOpen(true);
  }, [activeConversation, notify]);

  const handleConfirmUnlink = useCallback(async () => {
    setUnlinking(true);
    try {
      await unlinkCustomerFromConversation();
      setUnlinkModalOpen(false);
    } finally {
      setUnlinking(false);
    }
  }, [unlinkCustomerFromConversation]);

  const handleLinkAndClose = useCallback(
    async (customerId: number) => {
      await linkCustomerToConversation(customerId);
      setLinkStep(null);
    },
    [linkCustomerToConversation]
  );

  const openCustomerDetail = useCallback(() => {
    if (!activeConversation) {
      return;
    }
    if (!activeConversation.customerId) {
      showErrorModal({
        title: "알림",
        headline: "연결된 고객 정보가 없습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }
    setCustomerDetailOpen(true);
  }, [activeConversation]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
  }, [setInput]);

  const onSend = useCallback(() => {
    if (!input.trim()) return;
    send(input);
    clearInput();
  }, [input, send, clearInput]);


  return (
    <div className="flex gap-8 h-full relative overflow-hidden md:overflow-visible">
      {/* 모바일: 리스트는 항상 렌더링 (오버레이 뒤에 위치) */}
      <div className="block w-full md:w-auto h-full">
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
          hasMoreConversations={conversationsPage.hasMore}
          filterDefaults={filterDefaults}
          onFilterApply={handleFilterApply}
          conversationsWithDraft={conversationsWithDraft}
        />
      </div>

      {/* 모바일: 채팅방이 오버레이로 표시 (슬라이드 트랜지션) */}
      <div
        className={`block absolute md:relative inset-0 md:inset-auto z-40 md:z-auto bg-background md:bg-transparent transition-transform duration-300 ease-in-out md:transition-none ${activeId ? "translate-x-0" : "translate-x-full md:translate-x-0"} ${isDesktopLayout ? "" : "md:flex-1 md:min-w-0"}`}
        style={
          isDesktopLayout
            ? { width: `${mainWidth}px`, flexShrink: 0 }
            : undefined
        }
      >
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
          onOpenUnlinkModal={openUnlinkModal}
          onOpenCustomerDetail={openCustomerDetail}
          onOpenAiSidebar={!isDesktopLayout && activeConversation ? () => setIsAiSidebarOpen(true) : undefined}
          onCloseConversation={handleCloseConversationMobile}
          onCompleteConversation={() => {
            void closeConversation();
          }}
          attachmentUploading={attachmentUploading}
          onAttachImage={onAttachImage}
          onAttachFile={onAttachFile}
          onClickEmoji={handleEmojiButtonClick}
          emojiButtonRef={emojiButtonRef}
          mobileEmojiButtonRef={mobileEmojiButtonRef}
          emojiPickerOpen={emojiPickerOpen}
          loadOlderMessages={loadOlderMessages}
          isMessagesLoading={isMessagesLoading}
          onDropFile={sendAttachment}
          onSwapWidths={isDesktopLayout ? swapWidths : undefined}
          isResizable={isDesktopLayout}
          enforceMinWidth={isDesktopLayout}
          widthMode={isDesktopLayout ? widthMode : undefined}
        />
      </div>

      {/* 1080px(lg) 이상: 기존 우측 사이드바 사용 */}
      {isDesktopLayout && (
        <div
          style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}
        >
          <ChatRightSidebar 
            conversationId={activeId}
            isResizable={isDesktopLayout}
            widthMode={isDesktopLayout ? widthMode : undefined}
            messages={aiAssistantPanel.messages}
            loading={aiAssistantPanel.loading}
            loadingMore={aiAssistantPanel.loadingMore}
            sending={aiAssistantPanel.sending}
            error={aiAssistantPanel.error}
            hasMore={aiAssistantPanel.hasMore}
            onLoadMore={aiAssistantPanel.loadMore}
            onSendMessage={aiAssistantPanel.sendMessage}
            onRetryMessage={aiAssistantPanel.retryMessage}
          />
        </div>
      )}

      {/* 1280px 미만(모바일+태블릿): 플로팅 형태의 AI 상담 도우미 */}
      {!isDesktopLayout && (
        <ChatFloatingAiSidebar
          conversationId={activeId}
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
          messages={aiAssistantPanel.messages}
          loading={aiAssistantPanel.loading}
          loadingMore={aiAssistantPanel.loadingMore}
          sending={aiAssistantPanel.sending}
          error={aiAssistantPanel.error}
          hasMore={aiAssistantPanel.hasMore}
          onLoadMore={aiAssistantPanel.loadMore}
          onSendMessage={aiAssistantPanel.sendMessage}
          onRetryMessage={aiAssistantPanel.retryMessage}
        />
      )}

      {/* 이모지 피커 */}
      <EmojiPicker
        isOpen={emojiPickerOpen}
        onClose={handleCloseEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        position={emojiPickerPosition}
        mode={emojiPickerMode}
        onToggleMode={setEmojiPickerMode}
        triggerRef={emojiButtonRef}
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

      {/* 고객 정보 모달 */}
      <CustomerDetailModal
        open={customerDetailOpen}
        onClose={() => setCustomerDetailOpen(false)}
        customerId={activeConversation?.customerId || null}
      />

      {/* 연동 끊기 확인 모달 */}
      {activeConversation && (
        <UnlinkConversationModal
          open={unlinkModalOpen}
          onClose={() => setUnlinkModalOpen(false)}
          onConfirm={handleConfirmUnlink}
          conversation={{
            id: activeConversation.id,
            name: activeConversation.name,
            platform: activeConversation.platform as "instagram" | "telegram" | "line" | "kakao",
            platformConversationId: activeConversation.platformConversationId,
            profileUrl: activeConversation.profileUrl,
          }}
          loading={unlinking}
        />
      )}
    </div>
  );
}
