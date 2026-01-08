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
        // 모바일: 이모지 피커를 버튼 위쪽에 표시, x축을 왼쪽으로 100px 이동
        setEmojiPickerPosition({
          x: (rect.right - 100) / zoom,
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
            <svg
              width="68"
              height="68"
              viewBox="0 0 68 79"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[68px] h-[68px]"
            >
              <g filter="url(#filter0_d_190_1531)">
                <circle
                  cx="34"
                  cy="31"
                  r="30"
                  fill="url(#paint0_linear_190_1531)"
                />
                <path
                  d="M27.3333 31H27.35M34 31H34.0167M40.6667 31H40.6833M49 31C49 38.3638 42.2843 44.3334 34 44.3334C31.4346 44.3334 29.0195 43.7609 26.9078 42.7518L19 44.3334L21.325 38.1334C19.8526 36.0706 19 33.6238 19 31C19 23.6362 25.7157 17.6667 34 17.6667C42.2843 17.6667 49 23.6362 49 31Z"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <path
                d="M8.14062 76H6.76953L9.81641 67.5156H11.3047L14.3633 76H12.9922L12.2188 73.7617H8.91406L8.14062 76ZM9.28906 72.6836H11.8438L10.5898 69.0625H10.5312L9.28906 72.6836ZM16.7305 67.5156V76H15.4414V67.5156H16.7305ZM24.5234 68.1719C24.5234 69.5547 25.4844 70.832 27.0547 71.3477L26.457 72.2266C25.3086 71.8223 24.4473 71.002 23.9961 69.9648C23.5332 71.1426 22.6426 72.0625 21.418 72.5195L20.8203 71.6289C22.4609 71.043 23.4102 69.6484 23.4219 68.0781V67.0469H24.5234V68.1719ZM29.1523 66.4961V69.1328H30.6758V70.0703H29.1523V72.8359H28.0391V66.4961H29.1523ZM25.7656 73.082C27.9219 73.082 29.2461 73.7969 29.2461 75.0273C29.2461 76.2695 27.9219 76.9844 25.7656 76.9727C23.5859 76.9844 22.2383 76.2695 22.2383 75.0273C22.2383 73.7969 23.5859 73.082 25.7656 73.082ZM25.7656 73.9609C24.2422 73.9609 23.3398 74.3594 23.3516 75.0273C23.3398 75.7188 24.2422 76.0938 25.7656 76.1055C27.2773 76.0938 28.1562 75.7188 28.1562 75.0273C28.1562 74.3594 27.2773 73.9609 25.7656 73.9609ZM39.5234 66.4961V68.9922H41.0469V69.918H39.5234V72.4258H38.4102V66.4961H39.5234ZM36.4062 67.1875V68.0898H32.8438V70.9844C34.8887 70.9785 36.043 70.9023 37.3555 70.6445L37.4844 71.5352C36.0664 71.8398 34.8242 71.8867 32.5742 71.8867H31.7422V67.1875H36.4062ZM39.5234 72.9414V76.8555H32.8203V72.9414H39.5234ZM33.9102 73.832V75.9648H38.4219V73.832H33.9102ZM49.8242 66.4961V70.75H51.5117V71.6758H49.8242V76.9961H48.7227V66.4961H49.8242ZM47.8086 68.1367V69.0508H41.5859V68.1367H44.1758V66.6367H45.2891V68.1367H47.8086ZM44.7383 69.8242C46.2383 69.8242 47.3398 70.832 47.3516 72.2617C47.3398 73.7031 46.2383 74.6992 44.7383 74.7109C43.2266 74.6992 42.125 73.7031 42.125 72.2617C42.125 70.832 43.2266 69.8242 44.7383 69.8242ZM44.7383 70.7383C43.8477 70.7383 43.1797 71.3594 43.1914 72.2617C43.1797 73.1758 43.8477 73.7852 44.7383 73.7734C45.6289 73.7852 46.2852 73.1758 46.2852 72.2617C46.2852 71.3594 45.6289 70.7383 44.7383 70.7383ZM60.7461 66.4961V76.9961H59.6211V66.4961H60.7461ZM57.6172 67.6211C57.6172 70.6914 56.3047 73.3633 52.707 75.0859L52.1211 74.1836C54.916 72.8535 56.2754 70.9609 56.4922 68.5117H52.625V67.6211H57.6172Z"
                fill="#595959"
              />
              <defs>
                <filter
                  id="filter0_d_190_1531"
                  x="0"
                  y="0"
                  width="68"
                  height="68"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="3" />
                  <feGaussianBlur stdDeviation="2" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.0352941 0 0 0 0 0.117647 0 0 0 0 0.258824 0 0 0 0.1 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_190_1531"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_190_1531"
                    result="shape"
                  />
                </filter>
                <linearGradient
                  id="paint0_linear_190_1531"
                  x1="-25.0503"
                  y1="30.0503"
                  x2="33.0503"
                  y2="88.1509"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#A1FF8B" />
                  <stop offset="1" stopColor="#3F93FF" />
                </linearGradient>
              </defs>
            </svg>
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
