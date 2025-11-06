"use client";

import { Ref } from "react";

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  connected: boolean;
  onClickEmoji: () => void;
  emojiButtonRef: Ref<HTMLButtonElement>;
  onAttachImage: () => void;
  onAttachFile: () => void;
  attachmentUploading?: boolean;
  disabled?: boolean;
};

export default function ChatInputBar({
  input,
  onInputChange,
  onSend,
  connected,
  onClickEmoji,
  emojiButtonRef,
  onAttachImage,
  onAttachFile,
  attachmentUploading,
  disabled = false,
}: Props) {
  return (
    <div className="h-[76px] px-6 border-t border-border dark:border-neutral-30">
      <div className="h-full flex items-center gap-1">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex-1 h-[44px] rounded-[8px] px-4 text-[12px] outline-none disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          placeholder={disabled ? "채팅을 선택해주세요" : "메세지를 입력하세요."}
          disabled={disabled}
        />
        {/* 이미지 첨부 */}
        <button
          aria-label="attach image"
          className="w-9 h-9 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
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
        {/* 파일 첨부 */}
        <button
          aria-label="attach file"
          className="w-9 h-9 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
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
        {/* 이모지 */}
        <button
          ref={emojiButtonRef}
          aria-label="emoji"
          className="w-9 h-9 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
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
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="h-[48px] px-4 rounded-[8px] bg-neutral-90 text-neutral-40 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSend}
          disabled={disabled || !connected}
        >
          전송하기
        </button>
      </div>
    </div>
  );
}


