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
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";

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
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [input, setInput] = useState("");

  // 화면 폭에 따른 레이아웃 제어 (1440px 이상: 기존 3컬럼, 미만: AI 도우미 플로팅)
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
    isMessagesLoading,
  } = useChatController({ projectId, status: statusFilter, platform });

  useEffect(() => {
    if (linkStep && !activeConversation) {
      setLinkStep(null);
    }
  }, [linkStep, activeConversation]);

  // 1440px 기준으로 레이아웃 전환
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsWideLayout(window.innerWidth >= 1440);
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

  const openCustomerDetail = useCallback(() => {
    if (!activeConversation) {
      return;
    }
    if (!activeConversation.customerId) {
      alert("연결된 고객 정보가 없습니다.");
      return;
    }
    setCustomerDetailOpen(true);
  }, [activeConversation]);

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
    <div className="flex gap-8 h-full relative">
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
        onOpenCustomerDetail={openCustomerDetail}
        onCloseConversation={closeConversation}
        attachmentUploading={attachmentUploading}
        onAttachImage={onAttachImage}
        onAttachFile={onAttachFile}
        onClickEmoji={handleEmojiButtonClick}
        emojiButtonRef={emojiButtonRef}
        emojiPickerOpen={emojiPickerOpen}
        loadOlderMessages={loadOlderMessages}
        isMessagesLoading={isMessagesLoading}
      />

      {/* 1440px 이상: 기존 우측 사이드바 사용 */}
      {isWideLayout && (
        <ChatRightSidebar projectId={projectId} conversationId={activeId} />
      )}

      {/* 1440px 미만: 플로팅 버튼 + 모달 형태의 AI 상담 도우미 */}
      {!isWideLayout && (
        <>
          {/* 플로팅 버튼 */}
          <button
            type="button"
            aria-label="open-ai-assistant"
            className="fixed bottom-[94px] right-8 z-[80] cursor-pointer"
            onClick={() => setIsAiSidebarOpen(true)}
          >
            <svg
              width="68"
              height="79"
              viewBox="0 0 68 79"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
              <div className="absolute bottom-44 right-0 w-[320px] max-w-[90vw]">
                <div className="h-full min-h-[420px] max-h-[80vh]">
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
    </div>
  );
}
