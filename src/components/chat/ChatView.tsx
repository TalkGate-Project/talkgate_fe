"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Conversation } from "@/lib/realtime";
import { useChatController } from "@/hooks/useChatController";
import { useChatContext } from "@/providers/ChatProvider";
import EmojiPicker from "./EmojiPicker";
import ChatLeftSidebar from "./ChatLeftSidebar";
import ChatMainView from "./ChatMainView";
import ChatRightSidebar from "./ChatRightSidebar";
import ChatFilterModal, { type ChatFilterDefaults, type Messenger } from "./ChatFilterModal";
import CustomerLinkModeModal from "./customer-link/CustomerLinkModeModal";
import CustomerLinkExistingModal from "./customer-link/CustomerLinkExistingModal";
import CustomerLinkCreateModal from "./customer-link/CustomerLinkCreateModal";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import UnlinkConversationModal from "@/components/common/UnlinkConversationModal";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import Image from "next/image";

function getBodyZoom(): number {
  if (typeof document === "undefined") return 1;
  const raw = String(((document.body.style as any).zoom ?? "") as string).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

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
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const mobileEmojiButtonRef = useRef<HTMLButtonElement>(null);
  // 채팅방별 입력 내용 저장
  const inputByConversationRef = useRef<Map<number, string>>(new Map());
  // 현재 활성 채팅방의 입력 내용
  const [input, setInput] = useState("");
  // 이전 activeId 추적 (채팅방 전환 감지용)
  const prevActiveIdRef = useRef<number | null>(null);
  // 작성 중인 메시지가 있는 채팅방 ID Set을 state로 관리 (리렌더링 트리거용)
  const [conversationsWithDraft, setConversationsWithDraft] = useState<Set<number>>(new Set());

  // 화면 폭에 따른 레이아웃 제어 (1280px 이상: 기존 3컬럼, 미만: AI 도우미 플로팅)
  const [isWideLayout, setIsWideLayout] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

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

  // 필터 모달용 상태
  const [filterDefaults, setFilterDefaults] = useState<ChatFilterDefaults>(() => {
    const messengerMap: Record<string, Messenger> = {
      telegram: "telegram",
      instagram: "instagram",
      line: "line",
    };
    return {
      messenger: platform ? (messengerMap[platform] || "all") : "all",
      categoryIds: undefined,
    };
  });

  // URL 쿼리 파라미터 변경 시 filterDefaults 동기화
  useEffect(() => {
    const messengerMap: Record<string, Messenger> = {
      telegram: "telegram",
      instagram: "instagram",
      line: "line",
    };
    setFilterDefaults(prev => ({
      ...prev,
      messenger: platform ? (messengerMap[platform] || "all") : "all",
    }));
  }, [platform]);

  // setFilters를 먼저 가져오기 (handleFilterApply에서 사용하기 위해)
  const { setFilters } = useChatContext();

  // 필터 적용 핸들러
  const handleFilterApply = useCallback((filters: ChatFilterDefaults) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // platform 파라미터 업데이트
    const platformValue = filters.messenger === "all" ? undefined : filters.messenger as "line" | "telegram" | "instagram" | undefined;
    if (platformValue) {
      params.set("platform", platformValue);
    } else {
      params.delete("platform");
    }
    
    // URL 업데이트
    router.replace(`?${params.toString()}`, { scroll: false });
    
    // 필터 상태 저장
    setFilterDefaults(filters);
    
    // 모달 닫기
    setFilterOpen(false);
    
    // setFilters를 명시적으로 호출하여 소켓 재요청 트리거
    setFilters({ 
      platform: platformValue,
      categoryIds: filters.categoryIds,
    });
  }, [searchParams, router, setFilterOpen, setFilters]);

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

  useEffect(() => {
    if (linkStep && !activeConversation) {
      setLinkStep(null);
    }
  }, [linkStep, activeConversation]);

  // 쿼리스트링 변경 감지: conversationId가 제거되면 activeId와 모달 상태 초기화
  // (브라우저 뒤로가기 등으로 쿼리스트링이 변경된 경우 처리)
  useEffect(() => {
    const currentConvId = searchParams.get("conversationId");
    const convIdNumber = currentConvId ? Number(currentConvId) : null;
    const isValidConvId = convIdNumber !== null && Number.isFinite(convIdNumber);
    
    // 쿼리스트링에 conversationId가 없는데 activeId가 있으면 초기화
    // (뒤로가기로 상담 목록으로 돌아온 경우)
    if (!currentConvId && activeId) {
      setActiveId(null);
      // 모달 상태도 초기화
      setLinkStep(null);
      setCustomerDetailOpen(false);
      setUnlinkModalOpen(false);
      setIsAiSidebarOpen(false);
      return;
    }
    
    // 쿼리스트링에 conversationId가 있는데 activeId와 다르면 동기화
    // (URL 직접 입력 또는 딥링크로 접근한 경우)
    if (isValidConvId && activeId !== convIdNumber) {
      // filteredConversations에 해당 conversationId가 있는지 확인
      const exists = filteredConversations.some((c) => c.id === convIdNumber);
      if (exists) {
        setActiveId(convIdNumber);
      } else {
        // 존재하지 않으면 activeId를 null로 설정 (필터 변경 등으로 목록에서 사라진 경우)
        setActiveId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 1280px 기준으로 레이아웃 전환
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsWideLayout(window.innerWidth >= 1279);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 넓은 레이아웃으로 전환되면 플로팅 패널은 자동으로 닫기
  useEffect(() => {
    if (isWideLayout && isAiSidebarOpen) {
      setIsAiSidebarOpen(false);
    }
  }, [isWideLayout, isAiSidebarOpen]);

  // AI 사이드바 닫기 이벤트 리스너
  useEffect(() => {
    const handleCloseAiSidebar = () => {
      setIsAiSidebarOpen(false);
    };
    window.addEventListener("close-ai-sidebar", handleCloseAiSidebar);
    return () => {
      window.removeEventListener("close-ai-sidebar", handleCloseAiSidebar);
    };
  }, []);

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

  // 입력 내용 변경 핸들러
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  function onSend() {
    if (!input.trim()) return;
    send(input);
    setInput("");
    // 현재 채팅방의 작성 중인 메시지 제거
    if (activeId) {
      inputByConversationRef.current.delete(activeId);
      setConversationsWithDraft((prev) => {
        const next = new Set(prev);
        next.delete(activeId);
        return next;
      });
    }
  }

  function handleEmojiButtonClick() {
    // 토글: 열려 있으면 닫기, 닫혀 있으면 compact로 열기
    if (emojiPickerOpen) {
      setEmojiPickerOpen(false);
      return;
    }
    
    // 모바일/데스크탑 버튼 중 활성화된 버튼 찾기
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const activeButton = isMobile && mobileEmojiButtonRef.current 
      ? mobileEmojiButtonRef.current 
      : emojiButtonRef.current;
    
      if (activeButton) {
      const rect = activeButton.getBoundingClientRect();
      // body zoom(컴팩트 0.8 / 기본 1) 기준으로 위치 보정
      const zoom = getBodyZoom();
      // 모바일에서는 입력 필드 내부 오른쪽에 있으므로 위치 조정
      if (isMobile && mobileEmojiButtonRef.current) {
        // 모바일: 이모지 피커를 버튼 위쪽에 표시, x축을 왼쪽으로 더 많이 이동하여 화면 밖으로 나가지 않도록 조정
        const pickerWidth = 216; // full mode width
        const screenWidth = window.innerWidth;
        // 피커가 화면 밖으로 나가지 않도록 계산
        // 버튼 오른쪽 끝에서 피커 너비만큼 왼쪽으로 이동, 최소 16px 여백 유지
        const desiredX = rect.right - pickerWidth - 16;
        // 화면 왼쪽 경계를 넘지 않도록 보정
        const finalX = Math.max(16, desiredX);
        setEmojiPickerPosition({
          x: finalX / zoom,
          y: rect.top / zoom,
        });
      } else if (emojiButtonRef.current) {
        // 데스크탑: 기존 위치 계산
        const desktopRect = emojiButtonRef.current.getBoundingClientRect();
        setEmojiPickerPosition({
          x: (desktopRect.left - 150) / zoom,
          y: desktopRect.top / zoom,
        });
      }
    }
    setEmojiPickerMode("compact");
    setEmojiPickerOpen(true);
  }

  function handleEmojiSelect(emoji: string) {
    setInput((prev) => {
      const newValue = prev + emoji;
      // 현재 활성 채팅방의 입력 내용 업데이트
      if (activeId) {
        inputByConversationRef.current.set(activeId, newValue);
      }
      return newValue;
    });
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

  useEffect(() => {
    const prevActiveId = prevActiveIdRef.current;
    
    // 채팅방이 변경되었을 때만 처리
    if (prevActiveId !== activeId) {
      // 이전 채팅방의 입력 내용 저장 (현재 input 값)
      if (prevActiveId !== null) {
        // 현재 input 값을 가져와서 저장
        setInput((currentInput) => {
          // 보내지 않은 메시지가 있으면 저장
          if (currentInput.trim()) {
            inputByConversationRef.current.set(prevActiveId, currentInput);
            setConversationsWithDraft((prev) => new Set(prev).add(prevActiveId));
          } else {
            // 빈 문자열이면 제거
            inputByConversationRef.current.delete(prevActiveId);
            setConversationsWithDraft((prev) => {
              const next = new Set(prev);
              next.delete(prevActiveId);
              return next;
            });
          }
          return currentInput;
        });
      }
      
      // 새로운 채팅방으로 전환 시 저장된 입력 내용 복원
      if (activeId !== null) {
        // 저장된 입력 내용이 있으면 복원, 없으면 빈 문자열
        const savedInput = inputByConversationRef.current.get(activeId) || "";
        setInput(savedInput);
      } else {
        // 채팅방을 나갔을 때 입력 내용 초기화
        setInput("");
      }
      
      // 이전 activeId 업데이트
      prevActiveIdRef.current = activeId;
    }
  }, [activeId]);

  // 입력 내용 변경 시 저장 및 conversationsWithDraft 업데이트
  useEffect(() => {
    if (activeId === null) {
      // activeId가 null이면 conversationsWithDraft에서 제거
      setConversationsWithDraft((prev) => {
        const next = new Set(prev);
        inputByConversationRef.current.forEach((_, id) => {
          if (!inputByConversationRef.current.get(id)?.trim()) {
            next.delete(id);
          } else {
            next.add(id);
          }
        });
        return next;
      });
      return;
    }
    
    // 현재 활성 채팅방의 입력 내용 저장
    if (input.trim()) {
      inputByConversationRef.current.set(activeId, input);
      setConversationsWithDraft((prev) => new Set(prev).add(activeId));
    } else {
      inputByConversationRef.current.delete(activeId);
      setConversationsWithDraft((prev) => {
        const next = new Set(prev);
        next.delete(activeId);
        return next;
      });
    }
  }, [input, activeId]);

  // 선택과 conversationId 파라미터 동기화 유지
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentConvId = params.get("conversationId");
    
    if (activeId) {
      // conversationId가 없을 때 추가하는 경우: push (히스토리 추가)
      // conversationId가 있을 때 변경하는 경우: replace (같은 페이지 내 전환)
      params.set("conversationId", String(activeId));
      if (currentConvId && currentConvId !== String(activeId)) {
        // 다른 대화로 전환: replace
        router.replace(`?${params.toString()}`, { scroll: false });
      } else if (!currentConvId) {
        // 대화 선택: push (히스토리 추가)
        router.push(`?${params.toString()}`, { scroll: false });
      }
    } else if (params.has("conversationId")) {
      // conversationId 제거: push (상담 목록으로 돌아가기, 히스토리 추가)
      params.delete("conversationId");
      router.push(`?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // 모바일에서 채팅방 닫기
  const handleCloseConversationMobile = useCallback(() => {
    setActiveId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("conversationId");
    // push를 사용하여 히스토리에 추가 (뒤로가기 시 상담 목록으로 이동)
    router.push(`?${params.toString()}`, { scroll: false });
  }, [setActiveId, searchParams, router]);

  return (
    <div className="flex gap-8 h-full relative">
      {/* 모바일: 리스트가 기본, 채팅방 선택 시 오버레이 */}
      <div className={`lg:block ${activeId ? "hidden lg:block" : "block"} w-full lg:w-auto h-full`}>
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

      {/* 모바일: 채팅방이 오버레이로 표시 */}
      <div className={`lg:block ${activeId ? "block" : "hidden lg:block"} absolute lg:relative inset-0 lg:inset-auto z-50 lg:z-auto bg-background lg:bg-transparent`}>
        <ChatMainView
          activeConversation={activeConversation}
          messages={messages}
          banner={banner}
          connected={connected}
          socketError={socketError}
          input={input}
          setInput={handleInputChange}
          onSend={onSend}
          onOpenLinkFlow={openLinkFlow}
          onOpenUnlinkModal={openUnlinkModal}
          onOpenCustomerDetail={openCustomerDetail}
          onCloseConversation={handleCloseConversationMobile}
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
        />
      </div>

      {/* 1280px 이상: 기존 우측 사이드바 사용 */}
      {isWideLayout && (
        <ChatRightSidebar projectId={projectId} conversationId={activeId} />
      )}

      {/* 1280px 미만: 플로팅 버튼 + 모달 형태의 AI 상담 도우미 */}
      {/* 모바일에서는 채팅방이 열려있을 때만 AI 버튼 표시 */}
      {!isWideLayout && activeId && (
        <>
          {/* 플로팅 버튼 */}
          <button
            type="button"
            aria-label="open-ai-assistant"
            className="fixed bottom-[94px] right-4 md:right-8 z-[80] cursor-pointer flex flex-col items-center gap-1"
            onClick={() => setIsAiSidebarOpen(true)}
          >
            <Image src="chat-floating.svg" alt="open-ai-assistant" width={60} height={78} />
          </button>

          {/* 플로팅 AI 상담 도우미 패널 */}
          {isAiSidebarOpen && (
            <div className="fixed inset-0 z-[90]">
              <div
                className="absolute inset-0 bg-black/20"
                onClick={() => setIsAiSidebarOpen(false)}
              />
              <div className="absolute bottom-0 md:bottom-44 right-0 w-full md:w-[320px] md:max-w-[90vw] h-[calc(100vh-54px)] md:h-auto md:min-h-[420px] md:max-h-[80vh] flex flex-col">
                <div className="h-full bg-background rounded-t-[14px] md:rounded-[14px] shadow-lg flex flex-col min-h-0 overflow-hidden">
                  <ChatRightSidebar
                    projectId={projectId}
                    conversationId={activeId}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 이모지 피커 */}
      <EmojiPicker
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onEmojiSelect={handleEmojiSelect}
        position={emojiPickerPosition}
        mode={emojiPickerMode}
        onToggleMode={(m) => setEmojiPickerMode(m)}
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
