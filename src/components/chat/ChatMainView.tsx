"use client";

import { useCallback, useRef, useLayoutEffect, useState, DragEvent } from "react";
import { Conversation, ChatMessage } from "@/lib/realtime";
import ChatInputBar from "./ChatInputBar";
import EmptyUserIcon from "./icons/EmptyUserIcon";
import EmptyChatIcon from "./icons/EmptyChatIcon";
import LinkIcon from "./icons/LinkIcon";
import PlatformIcon from "./icons/PlatformIcon";
import TgsSticker from "./TgsSticker";
import ConversationAvatar from "./ConversationAvatar";
import LoadingSpinner from "@/components/common/LoadingSpinner";

type Props = {
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  banner: { type: "success" | "error"; message: string } | null;
  connected: boolean;
  socketError: string | null;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onOpenLinkFlow: () => void;
  onOpenUnlinkModal: () => void;
  onOpenCustomerDetail: () => void;
  onOpenAiSidebar?: () => void;
  onCloseConversation: () => void;
  onCompleteConversation: () => void;
  attachmentUploading: boolean;
  onAttachImage: () => void;
  onAttachFile: () => void;
  onClickEmoji: () => void;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  mobileEmojiButtonRef?: React.RefObject<HTMLButtonElement | null>;
  emojiPickerOpen: boolean;
  loadOlderMessages: () => void;
  isMessagesLoading: boolean;
  onDropFile?: (file: File) => void;
  onSwapWidths?: () => void;
  isResizable?: boolean; // 리사이저 모드일 때 고정 너비 클래스 제거
  widthMode?: "normal" | "swapped"; // 너비 모드: normal = 메인 넓음, swapped = 메인 좁음
};

function LocalIconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-9 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="rounded-[8px] bg-card border border-border px-3 py-2 text-[12px] text-foreground shadow-lg whitespace-nowrap">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function ChatMainView({
  activeConversation,
  messages,
  banner,
  connected,
  socketError,
  input,
  setInput,
  onSend,
  onOpenLinkFlow,
  onOpenUnlinkModal,
  onOpenCustomerDetail,
  onOpenAiSidebar,
  onCloseConversation,
  onCompleteConversation,
  attachmentUploading,
  onAttachImage,
  onAttachFile,
  onClickEmoji,
  emojiButtonRef,
  mobileEmojiButtonRef,
  emojiPickerOpen,
  loadOlderMessages,
  isMessagesLoading,
  onDropFile,
  onSwapWidths,
  isResizable = false,
  widthMode,
}: Props) {
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true); // 사용자가 스크롤을 위로 올렸는지 추적
  const prevMessagesLengthRef = useRef(0);

  // 드래그 앤 드롭 상태
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "오후" : "오전";
    const hour12 = hours % 12 || 12;

    return `${month}. ${day}. ${ampm} ${hour12}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (!onDropFile || !activeConversation || !connected) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // 첫 번째 파일만 업로드 (여러 파일은 순차 처리도 가능하지만 현재는 단일 파일)
      const file = files[0];
      onDropFile(file);
    }
  }, [onDropFile, activeConversation, connected]);

  const downloadFile = useCallback(async (url: string, fileName?: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      // iOS Safari는 a.download 지원이 제한적 → 새 탭으로 열기
      const ua = navigator.userAgent || "";
      const isIOS = /iP(ad|hone|od)/.test(navigator.platform) || /iOS|iPhone|iPad|iPod/i.test(ua);
      if (isIOS) {
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
        return;
      }

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (e) {
      // CORS 등으로 blob 다운로드가 불가능할 때는 새 탭으로 여는 것으로 폴백
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  // 백엔드가 메시지를 보내는 순서를 그대로 사용하되, 렌더링 시 역순으로 표시
  // (백엔드 응답: [최신, ..., 오래된] -> 렌더링: [오래된, ..., 최신] (위에서 아래로))
  const displayMessages = [...messages].reverse();

  const onMessagesScroll = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    // 사용자가 스크롤을 위로 올렸는지 확인
    // 스크롤이 맨 아래에서 100px 이상 떨어져 있으면 사용자가 위로 스크롤한 것으로 간주
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;

    if (el.scrollTop <= 48) {
      // load older messages when near top
      loadOlderMessages();
    }
  }, [loadOlderMessages]);

  // 메시지가 변경되거나 새 메시지가 추가되면 스크롤을 최신 메시지로 이동
  useLayoutEffect(() => {
    const el = messagesScrollRef.current;
    if (!el || !activeConversation) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const isInitialLoad = prevMessagesLengthRef.current === 0 && messages.length > 0;
    const shouldScroll = shouldAutoScrollRef.current || isNewMessage || isInitialLoad;

    if (shouldScroll) {
      // 다음 프레임에서 스크롤을 실행하여 DOM 업데이트가 완료된 후 실행
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
        shouldAutoScrollRef.current = true;
      });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, activeConversation, displayMessages]);

  // 드래그 앤 드롭 가능 여부
  const canDrop = Boolean(activeConversation && connected && onDropFile);

  return (
    <div className={`${isResizable ? "w-full" : "flex-1"} flex ${isResizable ? "" : "justify-center"} h-full`}>
      <div
        className={`w-full ${isResizable ? "" : "lg:min-w-[688px]"} h-full rounded-[14px] lg:rounded-[14px] rounded-t-none lg:rounded-t-[14px] bg-card dark:bg-neutral-0 flex flex-col relative`}
        onDragEnter={canDrop ? handleDragEnter : undefined}
        onDragLeave={canDrop ? handleDragLeave : undefined}
        onDragOver={canDrop ? handleDragOver : undefined}
        onDrop={canDrop ? handleDrop : undefined}
      >
        {/* 드래그 앤 드롭 오버레이 */}
        {isDragging && canDrop && (
          <div className="absolute inset-0 z-50 bg-primary-80/20 dark:bg-primary-80/30 backdrop-blur-[2px] rounded-[14px] border-2 border-dashed border-primary-80 flex items-center justify-center cursor-copy">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-80 flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-[18px] font-semibold text-primary-80">
                파일을 여기에 놓으세요
              </div>
              <div className="text-[14px] text-neutral-60 mt-1">
                이미지, 동영상, 문서 등을 업로드할 수 있습니다
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="px-4 md:px-7 py-3 md:py-[15px] flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* 모바일 뒤로가기 버튼 */}
            <button
              onClick={onCloseConversation}
              className="lg:hidden cursor-pointer p-1 -ml-1 mr-1 text-neutral-90 dark:text-neutral-70"
              aria-label="뒤로가기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {activeConversation ? (
              <>
                {/* 프로필 썸네일: 데스크탑에서만 표시 */}
                <div className="hidden lg:block">
                  <ConversationAvatar
                    name={activeConversation.name}
                    profileUrl={activeConversation.profileUrl}
                    size="md"
                  />
                </div>
                {widthMode !== "swapped" && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center leading-[24px] gap-2">
                      <span className="text-[18px] md:text-[20px] font-bold text-ink truncate">
                        {activeConversation.name}
                      </span>
                      <div className="shrink-0 w-5 h-5">
                        <PlatformIcon platform={activeConversation.platform} />
                      </div>
                    </div>
                    <div className="text-[12px] text-neutral-60 truncate">
                      {activeConversation.platformConversationId || "-"}
                    </div>
                  </div>
                )}

              </>
            ) : (
              <EmptyUserIcon />
            )}
          </div>
          {/* 연동 버튼 및 고객정보 버튼 - customerId 유무에 따라 표시
              - 대화방 선택 시 getConversationById로 customerId 포함된 상세 정보 조회
              - linkCustomer API 호출 후 로컬 상태 즉시 업데이트 (Optimistic UI)
          */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {onOpenAiSidebar && (
              <button
                type="button"
                aria-label="open-ai-assistant"
                className="lg:hidden cursor-pointer h-[42px] w-[42px] shrink-0 flex items-center justify-center translate-y-[3px]"
                onClick={onOpenAiSidebar}
              >
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 42 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="block"
                >
                  <g filter="url(#filter0_d_4783_37208)">
                    <circle cx="21" cy="18" r="17" fill="url(#paint0_linear_4783_37208)" />
                    <path
                      d="M18.6556 12.8148C19.1323 11.4199 21.0595 11.3776 21.6247 12.6881L21.6725 12.8156L22.3157 14.6967C22.4631 15.1281 22.7013 15.5229 23.0143 15.8544C23.3272 16.186 23.7076 16.4465 24.1298 16.6185L24.3027 16.6831L26.1838 17.3255C27.5786 17.8022 27.6209 19.7296 26.3113 20.2947L26.1838 20.3425L24.3027 20.9858C23.8712 21.1331 23.4763 21.3713 23.1446 21.6843C22.813 21.9972 22.5523 22.3777 22.3803 22.8L22.3157 22.9722L21.6733 24.8541C21.1966 26.249 19.2694 26.2913 18.7051 24.9816L18.6556 24.8541L18.0132 22.973C17.8659 22.5414 17.6277 22.1465 17.3148 21.8148C17.0018 21.4831 16.6214 21.2225 16.1991 21.0504L16.027 20.9858L14.1459 20.3433C12.7503 19.8667 12.708 17.9393 14.0184 17.375L14.1459 17.3255L16.027 16.6831C16.4583 16.5357 16.8531 16.2974 17.1846 15.9845C17.5161 15.6715 17.7767 15.2911 17.9487 14.8689L18.0132 14.6967L18.6556 12.8148ZM26.5409 10.0664C26.69 10.0664 26.8361 10.1082 26.9626 10.1871C27.0892 10.2661 27.191 10.3789 27.2566 10.5128L27.2949 10.606L27.5738 11.4239L28.3924 11.7028C28.5419 11.7536 28.6728 11.8476 28.7688 11.9729C28.8648 12.0982 28.9214 12.2492 28.9314 12.4067C28.9415 12.5642 28.9046 12.7212 28.8254 12.8577C28.7462 12.9942 28.6282 13.1041 28.4865 13.1735L28.3924 13.2117L27.5746 13.4907L27.2957 14.3093C27.2448 14.4587 27.1508 14.5897 27.0254 14.6856C26.9001 14.7814 26.7491 14.838 26.5916 14.848C26.4341 14.8579 26.2772 14.821 26.1407 14.7417C26.0043 14.6624 25.8944 14.5444 25.8251 14.4026L25.7869 14.3093L25.5079 13.4915L24.6893 13.2125C24.5399 13.1618 24.4089 13.0678 24.3129 12.9425C24.217 12.8172 24.1604 12.6662 24.1503 12.5087C24.1402 12.3512 24.1771 12.1942 24.2563 12.0577C24.3356 11.9212 24.4535 11.8113 24.5953 11.7419L24.6893 11.7036L25.5071 11.4247L25.7861 10.606C25.8398 10.4486 25.9415 10.3118 26.0769 10.2151C26.2122 10.1183 26.3745 10.0663 26.5409 10.0664Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_4783_37208"
                      x="0"
                      y="0"
                      width="42"
                      height="42"
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
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4783_37208" />
                      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4783_37208" result="shape" />
                    </filter>
                    <linearGradient
                      id="paint0_linear_4783_37208"
                      x1="-12.4618"
                      y1="17.4618"
                      x2="20.4618"
                      y2="50.3855"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#A1FF8B" />
                      <stop offset="1" stopColor="#3F93FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
            )}
            {/* 너비 치환 버튼 (웹에서만 표시) */}
            {onSwapWidths && (
              <LocalIconTooltip label="메인 뷰와 사이드바 너비 교환">
                <button
                  className="hidden lg:flex cursor-pointer h-[34px] w-[34px] md:h-[36px] md:w-[36px] rounded-[5px] border border-[#E2E2E2] dark:border-neutral-30 items-center justify-center hover:bg-neutral-20 transition-colors"
                  onClick={onSwapWidths}
                  aria-label="너비 치환"
                >
                  {widthMode === "normal" ? (
                    // 메인 뷰를 줄여야 할 때 (왼쪽 화살표)
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.16671 15.8333L3.33337 9.99996L9.16671 4.16663M15.8334 15.8333L10 9.99996L15.8334 4.16663" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                  ) : (
                    // 메인 뷰를 늘려야 할 때 (오른쪽 화살표)
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.8333 15.8334L16.6666 10.0001L10.8333 4.16675M4.16663 15.8334L9.99996 10.0001L4.16662 4.16675" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                  )}
                </button>
              </LocalIconTooltip>
            )}
            {/* 모바일에서는 연동 버튼과 상담완료 버튼만 표시 */}
            <button
              className={`cursor-pointer h-[34px] w-[34px] md:h-[36px] md:w-[36px] rounded-[5px] border flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${activeConversation?.customerId
                ? "bg-primary-10 border-primary-80"
                : "border-border"
                }`}
              onClick={activeConversation?.customerId ? onOpenUnlinkModal : onOpenLinkFlow}
            >
              <LinkIcon color={activeConversation?.customerId ? "#00B55B" : "#B0B0B0"} />
            </button>
            {activeConversation && activeConversation.customerId && (
              <button
                onClick={onOpenCustomerDetail}
                className="hidden lg:inline-flex cursor-pointer h-[34px] md:h-[36px] px-2 md:px-3 rounded-[5px] bg-card border border-border text-[12px] md:text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                고객정보
              </button>
            )}
            <button
              className="lg:hidden cursor-pointer h-[36px] w-[36px] rounded-[6px] border border-[#E2E2E2] dark:border-neutral-30 bg-card dark:bg-neutral-10 text-neutral-50 dark:text-neutral-60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              onClick={onCompleteConversation}
              disabled={
                !activeConversation || activeConversation?.status === "closed"
              }
              aria-label="상담완료"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="35"
                  height="35"
                  rx="5.5"
                  stroke="currentColor"
                />
                <path
                  d="M12.166 18.8335L15.4993 22.1668L23.8327 13.8335"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {widthMode !== "swapped" && (
              <button
                className="hidden lg:inline-flex cursor-pointer h-[34px] md:h-[36px] px-2 md:px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[12px] md:text-[14px] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap items-center justify-center leading-none"
                onClick={onCompleteConversation}
                disabled={
                  !activeConversation || activeConversation?.status === "closed"
                }
              >
                {activeConversation?.status === "closed"
                  ? "완료됨"
                  : "상담완료"}
              </button>
            )}
          </div>
        </div>
        {/* Messages area */}
        {activeConversation ? (
          <div
            className="flex-1 overflow-auto p-4 md:p-7 space-y-4 md:space-y-5 min-h-0"
            ref={messagesScrollRef}
            onScroll={onMessagesScroll}
          >
            {isMessagesLoading && (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
            {banner && (
              <div
                className={`w-full rounded-[8px] border px-3 py-2 text-[12px] ${banner.type === "success"
                  ? "bg-primary-10 border-primary-20 text-primary-80"
                  : "bg-danger-10 border-danger-20 text-danger-60"
                  }`}
              >
                {banner.message}
              </div>
            )}
            {!connected || socketError ? (
              <div className="mb-4">
                <div className="w-full rounded-[8px] border border-danger-20 bg-danger-10 text-danger-60 text-[12px] px-3 py-2">
                  {socketError ? socketError : "서버에 연결 중입니다..."}
                </div>
                {socketError && (
                  <div className="mt-2 text-[12px] text-neutral-60">
                    문제가 지속되면 페이지를 새로고침하거나, 네트워크 상태를
                    확인해주세요.
                  </div>
                )}
              </div>
            ) : null}
            {displayMessages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${m.direction === "outgoing" ? "justify-end" : ""
                  }`}
              >
                {/* 상대방 메시지일 때만 프로필 이미지 표시 */}
                {m.direction === "incoming" && activeConversation && (
                  <ConversationAvatar
                    name={activeConversation.name}
                    profileUrl={activeConversation.profileUrl}
                    size="md"
                  />
                )}
                <div
                  className={`max-w-[75%] rounded-[16px] ${m.direction === "outgoing"
                    ? "bg-neutral-90 text-neutral-0 rounded-br-none"
                    : "bg-neutral-20 text-ink rounded-bl-none"
                    } ${m.type === "image" || m.type === "video"
                      ? "p-0 overflow-hidden"
                      : "px-5 py-3"
                    }`}
                >
                  {/* 텍스트 메시지 */}
                  {m.type === "text" && m.content && (
                    <div className="text-[14px] leading-[26px] whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                  )}

                  {/* 이미지 메시지 */}
                  {m.type === "image" && (
                    <div className="relative">
                      {/* 로딩 중 (pending 상태이거나 fileUrl이 없는 경우) */}
                      {((m as any).status === "pending" || (!m.fileUrl && m.status !== "failed" && m.status !== "unsupported")) ? (
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-neutral-20 dark:bg-neutral-80 rounded-[8px]">
                          <div className="text-center">
                            <LoadingSpinner size="lg" className="mx-auto mb-2" />
                            <div className="text-[12px] text-neutral-60">
                              {m.fileName || "이미지 전송 중..."}
                            </div>
                          </div>
                        </div>
                      ) : m.status === "failed" || m.status === "unsupported" ? (
                        <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-neutral-20 dark:bg-neutral-80 rounded-[8px] border border-danger-20">
                          <div className="text-center px-4">
                            <svg
                              className="h-8 w-8 text-danger-60 mx-auto mb-2"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <div className="text-[12px] font-medium text-danger-60 mb-1">
                              전송 실패
                            </div>
                            {m.status === "unsupported" && (
                              <div className="text-[11px] text-neutral-60">
                                지원하지 않는 파일 형식
                              </div>
                            )}
                            {m.fileName && (
                              <div className="text-[11px] text-neutral-60 mt-1 truncate max-w-[180px]">
                                {m.fileName}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (m.thumbnailUrl || m.fileUrl) ? (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={m.thumbnailUrl || m.fileUrl}
                            alt={m.fileName || "이미지"}
                            className="max-w-full h-auto object-contain cursor-pointer"
                          />
                        </a>
                      ) : null}
                      {m.content && (
                        <div className="px-5 py-2 text-[14px] leading-[26px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 비디오 메시지 */}
                  {m.type === "video" && (
                    <div className="relative">
                      {/* 로딩 중 (pending 상태이거나 fileUrl이 없는 경우) */}
                      {((m as any).status === "pending" || (!m.fileUrl && m.status !== "failed" && m.status !== "unsupported")) ? (
                        <div className="w-[200px] h-[150px] flex items-center justify-center bg-neutral-20 dark:bg-neutral-80 rounded-[8px]">
                          <div className="text-center">
                            <LoadingSpinner size="lg" className="mx-auto mb-2" />
                            <div className="text-[12px] text-neutral-60">
                              {m.fileName || "비디오 전송 중..."}
                            </div>
                          </div>
                        </div>
                      ) : m.status === "failed" || m.status === "unsupported" ? (
                        <div className="w-[200px] h-[150px] flex flex-col items-center justify-center bg-neutral-20 dark:bg-neutral-80 rounded-[8px] border border-danger-20">
                          <div className="text-center px-4">
                            <svg
                              className="h-8 w-8 text-danger-60 mx-auto mb-2"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <div className="text-[12px] font-medium text-danger-60 mb-1">
                              전송 실패
                            </div>
                            {m.status === "unsupported" && (
                              <div className="text-[11px] text-neutral-60">
                                지원하지 않는 파일 형식
                              </div>
                            )}
                            {m.fileName && (
                              <div className="text-[11px] text-neutral-60 mt-1 truncate max-w-[180px]">
                                {m.fileName}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <video
                          src={m.fileUrl}
                          controls
                          className="max-w-full max-h-[400px] object-contain"
                          preload="metadata"
                        >
                          비디오를 재생할 수 없습니다.
                        </video>
                      )}
                      {m.content && (
                        <div className="px-5 py-2 text-[14px] leading-[26px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 오디오 메시지 */}
                  {m.type === "audio" && (
                    <div className="space-y-2">
                      {/* 로딩 중 (pending 상태이거나 fileUrl이 없는 경우) */}
                      {((m as any).status === "pending" || (!m.fileUrl && m.status !== "failed" && m.status !== "unsupported")) ? (
                        <div className="w-[200px] h-[60px] flex items-center justify-center bg-neutral-20 dark:bg-neutral-80 rounded-[8px]">
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="xs" />
                            <div className="text-[12px] text-neutral-60">
                              {m.fileName || "오디오 전송 중..."}
                            </div>
                          </div>
                        </div>
                      ) : m.status === "failed" || m.status === "unsupported" ? (
                        <div className="w-[200px] min-h-[60px] flex flex-col items-center justify-center bg-neutral-20 dark:bg-neutral-80 rounded-[8px] border border-danger-20 px-4 py-3">
                          <div className="text-center w-full">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <svg
                                className="h-5 w-5 text-danger-60"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              <div className="text-[12px] font-medium text-danger-60">
                                전송 실패
                              </div>
                            </div>
                            {m.status === "unsupported" && (
                              <div className="text-[11px] text-neutral-60 mb-1">
                                지원하지 않는 파일 형식
                              </div>
                            )}
                            {m.fileName && (
                              <div className="text-[11px] text-neutral-60 truncate max-w-full">
                                {m.fileName}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <audio
                            src={m.fileUrl}
                            controls
                            className="w-full"
                            preload="metadata"
                          >
                            오디오를 재생할 수 없습니다.
                          </audio>
                          {m.fileName && (
                            <div className="text-[12px] leading-[20px] break-words">
                              {m.fileName}
                            </div>
                          )}
                        </>
                      )}
                      {m.content && (
                        <div className="text-[14px] leading-[26px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 파일 메시지 */}
                  {m.type === "file" && (
                    <div className="space-y-2">
                      {/* 로딩 중 (pending 상태이거나 fileUrl이 없는 경우) */}
                      {((m as any).status === "pending" || (!m.fileUrl && m.status !== "failed" && m.status !== "unsupported")) ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[8px] bg-neutral-20 dark:bg-neutral-80 flex items-center justify-center flex-shrink-0">
                            <LoadingSpinner size="xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium leading-[20px] break-words">
                              {m.fileName || "파일 전송 중..."}
                            </div>
                            {m.fileSize && (
                              <div className="text-[12px] opacity-70">
                                {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                              </div>
                            )}
                          </div>
                        </div>
                      ) : m.status === "failed" || m.status === "unsupported" ? (
                        <div className="flex items-center gap-3 border border-danger-20 rounded-[8px] bg-neutral-20 dark:bg-neutral-80 px-3 py-2">
                          <div className="w-10 h-10 rounded-[8px] bg-danger-10 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-danger-60"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-danger-60 leading-[20px] break-words mb-1">
                              전송 실패
                            </div>
                            {m.status === "unsupported" && (
                              <div className="text-[11px] text-neutral-60 mb-1">
                                지원하지 않는 파일 형식
                              </div>
                            )}
                            {m.fileName && (
                              <div className="text-[12px] text-neutral-60 break-words">
                                {m.fileName}
                              </div>
                            )}
                            {m.fileSize && (
                              <div className="text-[11px] text-neutral-60 opacity-70 mt-1">
                                {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const isPdf =
                            (m.fileType && /pdf/i.test(m.fileType)) ||
                            (m.fileName && /\.pdf$/i.test(m.fileName)) ||
                            (m.fileUrl && /\.pdf$/i.test(m.fileUrl));
                          if (isPdf) {
                            return (
                              <button
                                onClick={() => downloadFile(m.fileUrl!, m.fileName || "document.pdf")}
                                className="cursor-pointer flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                              >
                                <div className="w-10 h-10 rounded-[8px] bg-neutral-20 flex items-center justify-center flex-shrink-0">
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8 13h8M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-medium leading-[20px] break-words">
                                    {m.fileName || "PDF 파일"}
                                  </div>
                                  {m.fileSize && (
                                    <div className="text-[12px] opacity-70">
                                      {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          }
                          return (
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cursor-pointer flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              <div className="w-10 h-10 rounded-[8px] bg-neutral-20 flex items-center justify-center flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M8 13h8M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium leading-[20px] break-words">
                                  {m.fileName || "파일"}
                                </div>
                                {m.fileSize && (
                                  <div className="text-[12px] opacity-70">{(m.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                                )}
                              </div>
                            </a>
                          );
                        })()
                      )}
                      {m.content && (
                        <div className="text-[14px] leading-[26px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 스티커 메시지 */}
                  {m.type === "sticker" && (
                    <div className="py-2">
                      {/** 우선순위: .tgs → thumbnailUrl → (png/jpg 등 이미지형 fileUrl) → stickerEmoji → 텍스트 대체 */}
                      {m.fileUrl && /\.tgs$/i.test(m.fileUrl) ? (
                        <TgsSticker src={m.fileUrl} width={120} height={120} />
                      ) : m.thumbnailUrl ? (
                        <img
                          src={m.thumbnailUrl}
                          alt="스티커"
                          className="max-w-[200px] max-h-[200px] object-contain"
                        />
                      ) : m.fileUrl && /\.(png|jpg|jpeg|gif|webp)$/i.test(m.fileUrl) ? (
                        <img
                          src={m.fileUrl}
                          alt="스티커"
                          className="max-w-[200px] max-h-[200px] object-contain"
                        />
                      ) : m.stickerEmoji ? (
                        <div className="w-[120px] h-[120px] grid place-items-center text-[64px]">
                          {m.stickerEmoji}
                        </div>
                      ) : (
                        <div className="text-[12px] opacity-70">
                          스티커 {m.stickerId ? `(${m.stickerId})` : "미리보기를 지원하지 않는 형식"}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 위치 메시지 */}
                  {m.type === "location" && (
                    <div className="space-y-2">
                      <div className="w-full h-[200px] bg-neutral-20 rounded-[8px] flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="mx-auto mb-2 opacity-50"
                          >
                            <path
                              d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="10"
                              r="3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="text-[12px] opacity-70">
                            위치 정보
                          </div>
                        </div>
                      </div>
                      {m.content && (
                        <div className="text-[14px] leading-[26px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 시스템 메시지 */}
                  {m.type === "system" && (
                    <div className="text-[14px] leading-[26px] whitespace-pre-wrap break-words opacity-70 italic">
                      {m.content || "시스템 메시지"}
                    </div>
                  )}

                  {/* 타임스탬프 */}
                  <div
                    className={`mt-2 text-[12px] text-[#B0B0B0] ${m.direction === "outgoing" ? "text-right" : "text-left"} ${m.type === "image" || m.type === "video" ? "px-5 pb-3" : ""
                      }`}
                  >
                    {formatMessageTime(m.sentAt || m.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-neutral-60">
              <div className="mb-3 mx-auto grid place-items-center">
                <EmptyChatIcon />
              </div>
              <div className="text-[16px] font-semibold text-neutral-60">
                채팅을 선택하세요
              </div>
              <div className="text-[13px] text-neutral-60">
                왼쪽 목록에서 상담할 고객을 선택하세요.
              </div>
            </div>
          </div>
        )}
        {/* Input bar */}
        <ChatInputBar
          input={input}
          onInputChange={setInput}
          onSend={onSend}
          connected={connected && Boolean(activeConversation)}
          onClickEmoji={onClickEmoji}
          emojiButtonRef={emojiButtonRef}
          mobileEmojiButtonRef={mobileEmojiButtonRef}
          emojiPickerOpen={emojiPickerOpen}
          onAttachImage={onAttachImage}
          onAttachFile={onAttachFile}
          attachmentUploading={attachmentUploading}
          disabled={!activeConversation}
          widthMode={widthMode}
        />
      </div>
    </div>
  );
}

