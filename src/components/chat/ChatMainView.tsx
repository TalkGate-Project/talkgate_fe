"use client";

import { useCallback, useRef, useLayoutEffect, useState, DragEvent } from "react";
import { Conversation, ChatMessage } from "@/lib/realtime";
import ChatInputBar from "./ChatInputBar";
import EmptyUserIcon from "./icons/EmptyUserIcon";
import EmptyChatIcon from "./icons/EmptyChatIcon";
import LinkIcon from "./icons/LinkIcon";
import PlatformIcon from "./icons/PlatformIcon";
import Image from "next/image";
import TgsSticker from "./TgsSticker";
import ConversationAvatar from "./ConversationAvatar";

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
  onCloseConversation: () => void;
  attachmentUploading: boolean;
  onAttachImage: () => void;
  onAttachFile: () => void;
  onClickEmoji: () => void;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  emojiPickerOpen: boolean;
  loadOlderMessages: () => void;
  isMessagesLoading: boolean;
  onDropFile?: (file: File) => void;
};

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
  onCloseConversation,
  attachmentUploading,
  onAttachImage,
  onAttachFile,
  onClickEmoji,
  emojiButtonRef,
  emojiPickerOpen,
  loadOlderMessages,
  isMessagesLoading,
  onDropFile,
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
    <div className="max-w-[688px] flex justify-center h-full">
      <div 
        className="min-w-[688px] h-full rounded-[14px] bg-card dark:bg-neutral-0 flex flex-col relative"
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
        <div className="px-7 py-[15px] flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-4">
            {activeConversation ? (
              <>
                <ConversationAvatar
                  name={activeConversation.name}
                  profileUrl={activeConversation.profileUrl}
                  size="md"
                />
                <div>
                  <div className="flex items-center leading-[24px] gap-2">
                    <span className="text-[20px] font-bold text-ink">
                      {activeConversation.name}
                    </span>
                    <div className="shrink-0 w-5 h-5">
                      <PlatformIcon platform={activeConversation.platform} />
                    </div>
                  </div>
                  <div className="text-[12px] text-neutral-60">
                    ID : {activeConversation.platformConversationId || "-"}
                  </div>
                </div>
              </>
            ) : (
              <EmptyUserIcon />
            )}
          </div>
          {/* 연동 버튼 및 고객정보 버튼 - customerId 유무에 따라 표시
              - 대화방 선택 시 getConversationById로 customerId 포함된 상세 정보 조회
              - linkCustomer API 호출 후 로컬 상태 즉시 업데이트 (Optimistic UI)
          */}
          <div className="flex items-center gap-2">
            <button
              className={`cursor-pointer h-[34px] w-[34px] rounded-[5px] border flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
                activeConversation?.customerId
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
                className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-card border border-border text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                고객정보
              </button>
            )}
            <button
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onCloseConversation}
              disabled={
                !activeConversation || activeConversation?.status === "closed"
              }
            >
              {activeConversation?.status === "closed"
                ? "완료됨"
                : "상담완료"}
            </button>
          </div>
        </div>
        {/* Messages area */}
        {activeConversation ? (
          <div
            className="flex-1 overflow-auto p-7 space-y-5"
            ref={messagesScrollRef}
            onScroll={onMessagesScroll}
          >
            {isMessagesLoading && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
              </div>
            )}
            {banner && (
              <div
                className={`w-full rounded-[8px] border px-3 py-2 text-[12px] ${
                  banner.type === "success"
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
                className={`flex items-end gap-2 ${
                  m.direction === "outgoing" ? "justify-end" : ""
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
                  className={`max-w-[75%] rounded-[16px] ${
                    m.direction === "outgoing"
                      ? "bg-neutral-90 text-neutral-0 rounded-br-none"
                      : "bg-neutral-20 text-ink rounded-bl-none"
                  } ${
                    m.type === "image" || m.type === "video"
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
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60 mx-auto mb-2" />
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
                      ) : (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src={m.thumbnailUrl || m.fileUrl}
                            alt={m.fileName || "이미지"}
                            width={400}
                            height={400}
                            className="max-w-full h-auto object-contain cursor-pointer"
                            unoptimized
                          />
                        </a>
                      )}
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
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60 mx-auto mb-2" />
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
                            <div className="h-5 w-5 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
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
                            <div className="h-5 w-5 animate-spin rounded-full border-4 border-neutral-20 border-t-primary-60" />
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
                            /\.pdf$/i.test(m.fileUrl);
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
                        <Image
                          src={m.thumbnailUrl}
                          alt="스티커"
                          width={200}
                          height={200}
                          className="max-w-[200px] max-h-[200px] object-contain"
                          unoptimized
                        />
                      ) : m.fileUrl && /\.(png|jpg|jpeg|gif|webp)$/i.test(m.fileUrl) ? (
                        <Image
                          src={m.fileUrl}
                          alt="스티커"
                          width={200}
                          height={200}
                          className="max-w-[200px] max-h-[200px] object-contain"
                          unoptimized
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
                    className={`mt-2 text-[12px] text-[#B0B0B0] ${m.direction === "outgoing" ? "text-right" : "text-left"} ${
                      m.type === "image" || m.type === "video" ? "px-5 pb-3" : ""
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
          emojiPickerOpen={emojiPickerOpen}
          onAttachImage={onAttachImage}
          onAttachFile={onAttachFile}
          attachmentUploading={attachmentUploading}
          disabled={!activeConversation}
        />
      </div>
    </div>
  );
}

