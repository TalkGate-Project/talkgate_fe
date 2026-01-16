"use client";

import { Ref, useState, useEffect, useRef } from "react";

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  connected: boolean;
  onClickEmoji: () => void;
  emojiButtonRef: Ref<HTMLButtonElement>;
  emojiPickerOpen?: boolean;
  onAttachImage: () => void;
  onAttachFile: () => void;
  attachmentUploading?: boolean;
  disabled?: boolean;
  // 모바일 이모지 버튼 ref (입력 필드 내부)
  mobileEmojiButtonRef?: Ref<HTMLButtonElement>;
};

export default function ChatInputBar({
  input,
  onInputChange,
  onSend,
  connected,
  onClickEmoji,
  emojiButtonRef,
  emojiPickerOpen = false,
  onAttachImage,
  onAttachFile,
  attachmentUploading,
  disabled = false,
  mobileEmojiButtonRef,
}: Props) {
  // 모바일에서 파일 첨부 처리
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const handleMobileAttach = () => {
    setShowAttachMenu(true);
  };

  const handleAttachImage = () => {
    setShowAttachMenu(false);
    onAttachImage();
  };

  const handleAttachFile = () => {
    setShowAttachMenu(false);
    onAttachFile();
  };

  return (
    <div className="h-[64px] lg:h-[76px] px-4 lg:px-6 border-t border-border dark:border-neutral-30">
      <div className="h-full flex items-center gap-2 lg:gap-1">
        {/* 모바일: 통합 파일 첨부 버튼 (+) */}
        <div className="lg:hidden relative">
          <button
            aria-label="attach"
            className="cursor-pointer w-8 h-8 rounded-full bg-neutral-20 dark:bg-neutral-20 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            onClick={handleMobileAttach}
            disabled={disabled || attachmentUploading}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* 모바일 첨부 메뉴 */}
          {showAttachMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAttachMenu(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-neutral-10 rounded-[8px] shadow-lg border border-neutral-30 dark:border-neutral-30 z-50 min-w-[120px]">
                <button
                  onClick={handleAttachImage}
                  className="w-full px-4 py-2 text-left text-[14px] text-neutral-90 hover:bg-neutral-10 dark:hover:bg-neutral-20 first:rounded-t-[8px] last:rounded-b-[8px]"
                >
                  이미지
                </button>
                <button
                  onClick={handleAttachFile}
                  className="w-full px-4 py-2 text-left text-[14px] text-neutral-90 hover:bg-neutral-10 dark:hover:bg-neutral-20 first:rounded-t-[8px] last:rounded-b-[8px]"
                >
                  파일
                </button>
              </div>
            </>
          )}
        </div>

        {/* 입력 필드 - 모바일에서만 회색 배경 */}
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            className="w-full h-8 lg:h-[44px] rounded-[20px] lg:rounded-[8px] px-3 lg:px-4 pr-8 lg:pr-4 text-[14px] outline-none disabled:cursor-not-allowed bg-neutral-10 dark:bg-neutral-20 lg:bg-transparent resize-none leading-[18px] py-[7px] lg:leading-[20px] lg:py-[12px]"
            placeholder={disabled ? "채팅을 선택해주세요" : "메세지를 입력하세요."}
            disabled={disabled}
          />
          {/* 모바일: 이모지 버튼 (입력 필드 내부 오른쪽) */}
          <button
            ref={mobileEmojiButtonRef || emojiButtonRef}
            aria-label="emoji"
            className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onClickEmoji}
            disabled={disabled}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: "scaleX(-1)" }}
            >
              <path
                d="M14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284M9 10H9.01M15 10H15.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke={emojiPickerOpen ? "#00E272" : "#B0B0B0"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 데스크탑: 이미지 첨부 (입력 필드 오른쪽) */}
        <button
          aria-label="attach image"
          className="hidden lg:grid cursor-pointer mr-2 place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onAttachImage}
          disabled={disabled || attachmentUploading}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* 데스크탑: 파일 첨부 (입력 필드 오른쪽) */}
        <button
          aria-label="attach file"
          className="hidden lg:grid cursor-pointer mr-2 place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onAttachFile}
          disabled={disabled || attachmentUploading}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.1716 7L8.58579 13.5858C7.80474 14.3668 7.80474 15.6332 8.58579 16.4142C9.36684 17.1953 10.6332 17.1953 11.4142 16.4142L17.8284 9.82843C19.3905 8.26633 19.3905 5.73367 17.8284 4.17157C16.2663 2.60948 13.7337 2.60948 12.1716 4.17157L5.75736 10.7574C3.41421 13.1005 3.41421 16.8995 5.75736 19.2426C8.1005 21.5858 11.8995 21.5858 14.2426 19.2426L20.5 13"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* 데스크탑: 이모지 버튼 (입력 필드 오른쪽) */}
        <button
          ref={emojiButtonRef}
          aria-label="emoji"
          className="hidden lg:grid cursor-pointer mr-2 place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onClickEmoji}
          disabled={disabled}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284M9 10H9.01M15 10H15.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke={emojiPickerOpen ? "#00E272" : "#B0B0B0"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 모바일: 원형 전송 버튼 */}
        <button
          className="lg:hidden cursor-pointer w-8 h-8 rounded-full bg-neutral-90 dark:bg-neutral-90 grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          onClick={onSend}
          disabled={disabled || !connected}
          aria-label="전송"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="#D0D0D0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 데스크탑: 텍스트 전송 버튼 */}
        <button
          className="hidden lg:block cursor-pointer h-[34px] text-[14px] px-3 rounded-[8px] bg-neutral-90 text-neutral-20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={onSend}
          disabled={disabled || !connected}
        >
          전송하기
        </button>
      </div>
    </div>
  );
}


