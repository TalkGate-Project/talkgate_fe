"use client";

import { useCallback, useRef, useLayoutEffect } from "react";
import { Conversation, ChatMessage } from "@/lib/realtime";
import ChatInputBar from "./ChatInputBar";
import EmptyUserIcon from "./icons/EmptyUserIcon";
import EmptyChatIcon from "./icons/EmptyChatIcon";
import LinkIcon from "./icons/LinkIcon";
import Image from "next/image";
import DefaultProfile from "@/assets/images/common/default_profile.png";

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
  onCloseConversation: () => void;
  attachmentUploading: boolean;
  onAttachImage: () => void;
  onAttachFile: () => void;
  onClickEmoji: () => void;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  loadOlderMessages: () => void;
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
  onCloseConversation,
  attachmentUploading,
  onAttachImage,
  onAttachFile,
  onClickEmoji,
  emojiButtonRef,
  loadOlderMessages,
}: Props) {
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true); // 사용자가 스크롤을 위로 올렸는지 추적
  const prevMessagesLengthRef = useRef(0);

  // 백엔드가 메시지를 보내는 순서를 그대로 사용하되, 렌더링 시 역순으로 표시
  // (백엔드 순서: [오래된, ..., 최신] → 렌더링: [최신, ..., 오래된])
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

  return (
    <div className="col-span-6 flex justify-center">
      <div className="w-[688px] h-[840px] rounded-[14px] bg-white dark:bg-[#111111] border border-[#E2E2E2] dark:border-[#444444] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeConversation ? (
              <>
                <div className="w-10 h-10 rounded-full bg-[#F2F2F2]" />
                <div>
                  <div className="text-[20px] font-bold text-[#000]">
                    {activeConversation.name}
                  </div>
                  <div className="text-[14px] text-[#808080]">
                    ID : {activeConversation.platformConversationId || "-"}
                  </div>
                </div>
              </>
            ) : (
              <EmptyUserIcon />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="cursor-pointer h-[34px] px-2 rounded-[5px] border border-[#E2E2E2] text-white text-[12px] font-semibold disabled:bg-[#A5E3C9] disabled:text-white disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onOpenLinkFlow}
            >
              <LinkIcon />
            </button>
            {activeConversation && (
              <button className="cursor-pointer h-[34px] px-4 rounded-[5px] bg-white border border-[#E2E2E2] text-[12px] disabled:opacity-60 disabled:cursor-not-allowed">
                고객정보
              </button>
            )}
            <button
              className="cursor-pointer h-[34px] px-4 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex-1 overflow-auto p-6 space-y-6"
            ref={messagesScrollRef}
            onScroll={onMessagesScroll}
          >
            {banner && (
              <div
                className={`w-full rounded-[8px] border px-3 py-2 text-[12px] ${
                  banner.type === "success"
                    ? "bg-[#E6F7EF] border-[#B9EBD3] text-[#0E7A4D]"
                    : "bg-[#FFF7F7] border-[#FFE2E2] text-[#B42318]"
                }`}
              >
                {banner.message}
              </div>
            )}
            {!connected || socketError ? (
              <div className="mb-4">
                <div className="w-full rounded-[8px] border border-[#FFE2E2] bg-[#FFF7F7] text-[#B42318] text-[12px] px-3 py-2">
                  {socketError ? socketError : "서버에 연결 중입니다..."}
                </div>
                {socketError && (
                  <div className="mt-2 text-[12px] text-[#808080]">
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
                {m.direction === "incoming" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {activeConversation?.profileUrl ? (
                      <Image
                        src={activeConversation.profileUrl}
                        alt={activeConversation.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={DefaultProfile.src}
                        alt="기본 프로필"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-[16px] ${
                    m.direction === "outgoing"
                      ? "bg-[#252525] text-white rounded-br-none"
                      : "bg-[#EDEDED] text-[#000] rounded-bl-none"
                  } ${
                    m.type === "image" || m.type === "video"
                      ? "p-0 overflow-hidden"
                      : "px-5 py-3"
                  }`}
                >
                  {/* 텍스트 메시지 */}
                  {m.type === "text" && m.content && (
                    <div className="text-[12px] leading-[20px] whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                  )}

                  {/* 이미지 메시지 */}
                  {m.type === "image" && m.fileUrl && (
                    <div className="relative">
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
                      {m.content && (
                        <div className="px-5 py-2 text-[12px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 비디오 메시지 */}
                  {m.type === "video" && m.fileUrl && (
                    <div className="relative">
                      <video
                        src={m.fileUrl}
                        controls
                        className="max-w-full max-h-[400px] object-contain"
                        preload="metadata"
                      >
                        비디오를 재생할 수 없습니다.
                      </video>
                      {m.content && (
                        <div className="px-5 py-2 text-[12px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 오디오 메시지 */}
                  {m.type === "audio" && m.fileUrl && (
                    <div className="space-y-2">
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
                      {m.content && (
                        <div className="text-[12px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 파일 메시지 */}
                  {m.type === "file" && m.fileUrl && (
                    <div className="space-y-2">
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-[8px] bg-[#F2F2F2] flex items-center justify-center flex-shrink-0">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14 2V8H20"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 13H16"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 17H16"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium leading-[20px] break-words">
                            {m.fileName || "파일"}
                          </div>
                          {m.fileSize && (
                            <div className="text-[11px] opacity-70">
                              {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          )}
                        </div>
                      </a>
                      {m.content && (
                        <div className="text-[12px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 스티커 메시지 */}
                  {m.type === "sticker" && (
                    <div className="py-2">
                      {m.fileUrl ? (
                        <Image
                          src={m.fileUrl}
                          alt="스티커"
                          width={200}
                          height={200}
                          className="max-w-[200px] max-h-[200px] object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="text-[12px] opacity-70">
                          스티커 {m.stickerId ? `(${m.stickerId})` : ""}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 위치 메시지 */}
                  {m.type === "location" && (
                    <div className="space-y-2">
                      <div className="w-full h-[200px] bg-[#F2F2F2] rounded-[8px] flex items-center justify-center">
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
                        <div className="text-[12px] leading-[20px] whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 시스템 메시지 */}
                  {m.type === "system" && (
                    <div className="text-[12px] leading-[20px] whitespace-pre-wrap break-words opacity-70 italic">
                      {m.content || "시스템 메시지"}
                    </div>
                  )}

                  {/* 타임스탬프 */}
                  <div
                    className={`mt-2 text-[11px] ${
                      m.direction === "outgoing"
                        ? "text-[#B0B0B0]"
                        : "text-[#808080]"
                    } ${m.type === "image" || m.type === "video" ? "px-5 pb-3" : ""}`}
                  >
                    {new Date(m.sentAt || m.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#9CA3AF]">
              <div className="mb-3 mx-auto grid place-items-center">
                <EmptyChatIcon />
              </div>
              <div className="text-[16px] font-semibold text-[#4B5563]">
                채팅을 선택하세요
              </div>
              <div className="text-[13px] text-[#6B7280]">
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
          onAttachImage={onAttachImage}
          onAttachFile={onAttachFile}
          attachmentUploading={attachmentUploading}
          disabled={!activeConversation}
        />
      </div>
    </div>
  );
}

