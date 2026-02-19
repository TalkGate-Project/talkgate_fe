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
  // 너비 모드: normal = 메인 넓음, swapped = 메인 좁음
  widthMode?: "normal" | "swapped";
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
  widthMode,
}: Props) {
  // 모바일에서 파일 첨부 처리
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  // 웹에서 영역이 좁을 때 말줄임표 메뉴 처리
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false);
  const ellipsisMenuRef = useRef<HTMLDivElement>(null);
  
  // widthMode가 swapped일 때 말줄임표 버튼 표시
  const shouldShowEllipsis = widthMode === "swapped";

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

  // 웹에서 말줄임표 메뉴 처리
  const handleEllipsisClick = () => {
    setShowEllipsisMenu((prev) => !prev);
  };

  const handleEllipsisMenuImage = () => {
    setShowEllipsisMenu(false);
    onAttachImage();
  };

  const handleEllipsisMenuFile = () => {
    setShowEllipsisMenu(false);
    onAttachFile();
  };

  const handleEllipsisMenuEmoji = () => {
    setShowEllipsisMenu(false);
    onClickEmoji();
  };

  // 말줄임표 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showEllipsisMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        ellipsisMenuRef.current &&
        !ellipsisMenuRef.current.contains(e.target as Node)
      ) {
        setShowEllipsisMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEllipsisMenu]);

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
            className="w-full h-8 lg:h-[44px] rounded-[20px] lg:rounded-[8px] px-3 lg:px-4 pr-8 lg:pr-4 text-[14px] outline-none disabled:cursor-not-allowed bg-neutral-10  lg:bg-transparent resize-none leading-[18px] py-[7px] lg:leading-[20px] lg:py-[12px]"
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

        {/* 데스크탑: 이미지 첨부 (입력 필드 오른쪽) - 넓은 화면에서만 표시 */}
        <button
          aria-label="attach image"
          className={`hidden lg:grid ${shouldShowEllipsis ? "lg:hidden" : "lg:grid"} cursor-pointer mr-2 place-items-center disabled:opacity-40 disabled:cursor-not-allowed`}
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
        {/* 데스크탑: 파일 첨부 (입력 필드 오른쪽) - 넓은 화면에서만 표시 */}
        <button
          aria-label="attach file"
          className={`hidden lg:grid ${shouldShowEllipsis ? "lg:hidden" : "lg:grid"} cursor-pointer mr-2 place-items-center disabled:opacity-40 disabled:cursor-not-allowed`}
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
        {/* 데스크탑: 이모지 버튼 (입력 필드 오른쪽) - 넓은 화면에서만 표시 */}
        <button
          ref={emojiButtonRef}
          aria-label="emoji"
          className={`hidden lg:grid ${shouldShowEllipsis ? "lg:hidden" : "lg:grid"} cursor-pointer mr-2 place-items-center disabled:opacity-40 disabled:cursor-not-allowed`}
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

        {/* 웹: 말줄임표 버튼 (widthMode가 swapped일 때만 표시) */}
        {shouldShowEllipsis && (
          <div className="hidden lg:block relative" ref={ellipsisMenuRef}>
            <button
              aria-label="more options"
              className="cursor-pointer w-[34px] h-[34px] grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              onClick={handleEllipsisClick}
              disabled={disabled || attachmentUploading}
            >
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 17H10.01M17 17H17.01M24 17H24.01M11 17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17C9 16.4477 9.44772 16 10 16C10.5523 16 11 16.4477 11 17ZM18 17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17C16 16.4477 16.4477 16 17 16C17.5523 16 18 16.4477 18 17ZM25 17C25 17.5523 24.5523 18 24 18C23.4477 18 23 17.5523 23 17C23 16.4477 23.4477 16 24 16C24.5523 16 25 16.4477 25 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* 말줄임표 메뉴 팝업 */}
            {showEllipsisMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEllipsisMenu(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-neutral-10 rounded-[20px] shadow-lg border border-neutral-30 dark:border-neutral-30 z-50 px-3 py-2 flex items-center gap-3">
                  {/* 이미지 버튼 */}
                  <button
                    onClick={handleEllipsisMenuImage}
                    className="cursor-pointer w-8 h-8 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={disabled || attachmentUploading}
                    aria-label="attach image"
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
                  {/* 파일 버튼 */}
                  <button
                    onClick={handleEllipsisMenuFile}
                    className="cursor-pointer w-8 h-8 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={disabled || attachmentUploading}
                    aria-label="attach file"
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
                  {/* 이모지 버튼 */}
                  <button
                    ref={emojiButtonRef}
                    onClick={handleEllipsisMenuEmoji}
                    className="cursor-pointer w-8 h-8 grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label="emoji"
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
                </div>
              </>
            )}
          </div>
        )}

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

        {/* 데스크탑: 전송 버튼 - swapped 모드일 때는 아이콘, 아닐 때는 텍스트 */}
        {shouldShowEllipsis ? (
          <button
            className="hidden lg:grid cursor-pointer w-[34px] h-[34px] rounded-full bg-neutral-90 dark:bg-transparent grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-neutral-20 dark:text-neutral-60"
            onClick={onSend}
            disabled={disabled || !connected}
            aria-label="전송"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M17.0352 5.20623C17.5449 5.11557 18.0802 5.12144 18.4795 5.52069C18.8786 5.91992 18.8846 6.45535 18.7939 6.96502C18.7026 7.47838 18.4795 8.14174 18.209 8.95331L15.3721 17.466C14.985 18.6273 14.6782 19.5488 14.374 20.174C14.0903 20.7571 13.6906 21.3381 13 21.3381C12.3094 21.3381 11.9097 20.7571 11.626 20.174C11.3218 19.5488 11.015 18.6273 10.6279 17.466L9.8418 15.1066C9.67101 14.5943 9.62624 14.5015 9.5625 14.4377C9.49867 14.3738 9.4063 14.3293 8.89355 14.1584L6.53418 13.3723C5.37282 12.9851 4.45142 12.6783 3.82617 12.3742C3.24306 12.0905 2.66232 11.6906 2.66211 11.0002C2.66211 10.3096 3.243 9.90988 3.82617 9.62616C4.4514 9.322 5.37278 9.01524 6.53418 8.62811L15.0469 5.7912C15.8586 5.52062 16.5218 5.29757 17.0352 5.20623ZM17.7725 6.22772C17.7347 6.18999 17.6373 6.11459 17.21 6.19061C16.7862 6.26602 16.2072 6.45815 15.3633 6.73944L6.85059 9.57733C5.65911 9.97449 4.81502 10.2564 4.26367 10.5246C3.67044 10.8132 3.66211 10.9701 3.66211 11.0002C3.66218 11.0311 3.67268 11.1883 4.26367 11.4758C4.81504 11.7439 5.65916 12.0259 6.85059 12.423L9.51367 13.3107C9.80756 13.4134 10.0681 13.5273 10.2705 13.7297C10.5404 13.9997 10.6517 14.3734 10.791 14.7912L11.5771 17.1496C11.9743 18.341 12.2563 19.1852 12.5244 19.7365C12.813 20.3296 12.9699 20.3381 13 20.3381C13.0301 20.3381 13.187 20.3296 13.4756 19.7365C13.7437 19.1852 14.0257 18.3409 14.4229 17.1496L17.2607 8.6369C17.542 7.79322 17.7341 7.21391 17.8096 6.79022C17.8855 6.36355 17.8103 6.26559 17.7725 6.22772Z" fill="currentColor"/>
              <path d="M17.0352 5.20623L16.9476 4.71396L16.9476 4.71396L17.0352 5.20623ZM18.4795 5.52069L18.8331 5.16721L18.833 5.16713L18.4795 5.52069ZM18.7939 6.96502L19.2862 7.05264L19.2862 7.05258L18.7939 6.96502ZM18.209 8.95331L17.7346 8.79519L17.7346 8.79522L18.209 8.95331ZM15.3721 17.466L15.8464 17.6241L15.8464 17.6241L15.3721 17.466ZM14.374 20.174L14.8236 20.3928L14.8236 20.3927L14.374 20.174ZM11.626 20.174L11.1764 20.3927L11.1764 20.3928L11.626 20.174ZM10.6279 17.466L10.1536 17.6241L10.1536 17.6241L10.6279 17.466ZM9.8418 15.1066L10.3162 14.9486L10.3161 14.9485L9.8418 15.1066ZM9.5625 14.4377L9.91631 14.0844L9.91606 14.0841L9.5625 14.4377ZM8.89355 14.1584L9.05167 13.684L9.05161 13.684L8.89355 14.1584ZM6.53418 13.3723L6.37607 13.8466L6.37612 13.8466L6.53418 13.3723ZM3.82617 12.3742L3.60744 12.8238L3.60746 12.8238L3.82617 12.3742ZM2.66211 11.0002H2.16211L2.16211 11.0003L2.66211 11.0002ZM3.82617 9.62616L3.60744 9.17654L3.60743 9.17654L3.82617 9.62616ZM6.53418 8.62811L6.3761 8.15376L6.37607 8.15377L6.53418 8.62811ZM15.0469 5.7912L15.205 6.26555L15.205 6.26554L15.0469 5.7912ZM17.7725 6.22772L18.1264 5.87451L18.126 5.87416L17.7725 6.22772ZM17.21 6.19061L17.1224 5.69834L17.1224 5.69835L17.21 6.19061ZM15.3633 6.73944L15.2052 6.2651L15.2052 6.2651L15.3633 6.73944ZM6.85059 9.57733L7.0087 10.0517L7.00872 10.0517L6.85059 9.57733ZM4.26367 10.5246L4.04498 10.075L4.04493 10.075L4.26367 10.5246ZM3.66211 11.0002H3.16211L3.16211 11.0014L3.66211 11.0002ZM4.26367 11.4758L4.04494 11.9254L4.04499 11.9254L4.26367 11.4758ZM6.85059 12.423L7.0087 11.9487H7.0087L6.85059 12.423ZM9.51367 13.3107L9.67859 12.8387L9.67179 12.8364L9.51367 13.3107ZM10.2705 13.7297L10.6241 13.3762L10.6241 13.3761L10.2705 13.7297ZM10.791 14.7912L10.3167 14.9493V14.9493L10.791 14.7912ZM11.5771 17.1496L11.1028 17.3077V17.3077L11.5771 17.1496ZM12.5244 19.7365L12.0748 19.9552L12.0748 19.9553L12.5244 19.7365ZM13.4756 19.7365L13.9252 19.9553L13.9252 19.9552L13.4756 19.7365ZM14.4229 17.1496L13.9485 16.9915L13.9485 16.9915L14.4229 17.1496ZM17.2607 8.6369L17.7351 8.79503L17.7351 8.79501L17.2607 8.6369ZM17.8096 6.79022L18.3018 6.87788L18.3018 6.87779L17.8096 6.79022ZM17.0352 5.20623L17.1227 5.69851C17.5928 5.6149 17.9081 5.65637 18.1259 5.87424L18.4795 5.52069L18.833 5.16713C18.2524 4.5865 17.497 4.61624 16.9476 4.71396L17.0352 5.20623ZM18.4795 5.52069L18.1259 5.87417C18.3437 6.09208 18.3852 6.40762 18.3017 6.87747L18.7939 6.96502L19.2862 7.05258C19.384 6.50309 19.4134 5.74776 18.8331 5.16721L18.4795 5.52069ZM18.7939 6.96502L18.3017 6.87741C18.2183 7.34595 18.0106 7.96743 17.7346 8.79519L18.209 8.95331L18.6833 9.11142C18.9484 8.31605 19.1869 7.61082 19.2862 7.05264L18.7939 6.96502ZM18.209 8.95331L17.7346 8.79522L14.8977 17.3079L15.3721 17.466L15.8464 17.6241L18.6833 9.11139L18.209 8.95331ZM15.3721 17.466L14.8977 17.3079C14.5058 18.4837 14.2106 19.3669 13.9244 19.9553L14.374 20.174L14.8236 20.3927C15.1457 19.7307 15.4642 18.7709 15.8464 17.6241L15.3721 17.466ZM14.374 20.174L13.9244 19.9553C13.6369 20.5462 13.3588 20.8381 13 20.8381V21.3381V21.8381C14.0223 21.8381 14.5437 20.968 14.8236 20.3928L14.374 20.174ZM13 21.3381V20.8381C12.6412 20.8381 12.3631 20.5462 12.0756 19.9553L11.626 20.174L11.1764 20.3928C11.4563 20.968 11.9777 21.8381 13 21.8381V21.3381ZM11.626 20.174L12.0756 19.9553C11.7894 19.3669 11.4942 18.4837 11.1023 17.3079L10.6279 17.466L10.1536 17.6241C10.5358 18.7709 10.8543 19.7307 11.1764 20.3927L11.626 20.174ZM10.6279 17.466L11.1023 17.3079L10.3162 14.9486L9.8418 15.1066L9.36744 15.2647L10.1536 17.6241L10.6279 17.466ZM9.8418 15.1066L10.3161 14.9485C10.2314 14.6943 10.1716 14.5246 10.1221 14.4082C10.0686 14.2825 10.011 14.1792 9.91631 14.0844L9.5625 14.4377L9.20869 14.791C9.17779 14.76 9.17437 14.735 9.20191 14.7997C9.2334 14.8737 9.28141 15.0066 9.36746 15.2647L9.8418 15.1066ZM9.5625 14.4377L9.91606 14.0841C9.82123 13.9893 9.71787 13.9316 9.59208 13.8781C9.47572 13.8286 9.30603 13.7688 9.05167 13.684L8.89355 14.1584L8.73543 14.6327C8.99382 14.7189 9.12669 14.7668 9.20066 14.7983C9.26519 14.8257 9.23993 14.8222 9.20894 14.7912L9.5625 14.4377ZM8.89355 14.1584L9.05161 13.684L6.69223 12.8979L6.53418 13.3723L6.37612 13.8466L8.7355 14.6327L8.89355 14.1584ZM6.53418 13.3723L6.69229 12.8979C5.51639 12.5059 4.63332 12.2108 4.04489 11.9246L3.82617 12.3742L3.60746 12.8238C4.26951 13.1459 5.22925 13.4643 6.37607 13.8466L6.53418 13.3723ZM3.82617 12.3742L4.0449 11.9246C3.45416 11.6372 3.16222 11.3589 3.16211 11L2.66211 11.0002L2.16211 11.0003C2.16242 12.0224 3.03196 12.5439 3.60744 12.8238L3.82617 12.3742ZM2.66211 11.0002H3.16211C3.16211 10.6413 3.4539 10.3633 4.04492 10.0758L3.82617 9.62616L3.60743 9.17654C3.0321 9.45645 2.16211 9.97778 2.16211 11.0002H2.66211ZM3.82617 9.62616L4.0449 10.0758C4.63331 9.78953 5.51634 9.49444 6.69229 9.10245L6.53418 8.62811L6.37607 8.15377C5.22922 8.53605 4.26949 8.85446 3.60744 9.17654L3.82617 9.62616ZM6.53418 8.62811L6.69226 9.10246L15.205 6.26555L15.0469 5.7912L14.8888 5.31684L6.3761 8.15376L6.53418 8.62811ZM15.0469 5.7912L15.205 6.26554C16.0329 5.98955 16.6542 5.78186 17.1227 5.6985L17.0352 5.20623L16.9476 4.71396C16.3893 4.81328 15.6842 5.05169 14.8888 5.31685L15.0469 5.7912ZM17.7725 6.22772L18.126 5.87416C18.039 5.78712 17.9128 5.70626 17.7214 5.67362C17.5585 5.64586 17.3633 5.65549 17.1224 5.69834L17.21 6.19061L17.2975 6.68288C17.3878 6.66682 17.4516 6.66043 17.4945 6.65856C17.5378 6.65668 17.5547 6.65964 17.5533 6.65939C17.5505 6.65891 17.5275 6.65451 17.4947 6.63713C17.4785 6.62854 17.4628 6.61833 17.4482 6.60699C17.4337 6.59571 17.4234 6.58575 17.4189 6.58128L17.7725 6.22772ZM17.21 6.19061L17.1224 5.69835C16.6537 5.78176 16.0321 5.98944 15.2052 6.2651L15.3633 6.73944L15.5214 7.21378C16.3822 6.92686 16.9188 6.75028 17.2976 6.68287L17.21 6.19061ZM15.3633 6.73944L15.2052 6.2651L6.69246 9.10299L6.85059 9.57733L7.00872 10.0517L15.5214 7.21377L15.3633 6.73944ZM6.85059 9.57733L6.69247 9.10299C5.51668 9.49492 4.63336 9.78878 4.04498 10.075L4.26367 10.5246L4.48237 10.9742C4.99668 10.7241 5.80154 10.4541 7.0087 10.0517L6.85059 9.57733ZM4.26367 10.5246L4.04493 10.075C3.72513 10.2306 3.51526 10.3725 3.3805 10.5123C3.31051 10.5849 3.25217 10.6657 3.21312 10.7568C3.17008 10.8572 3.16211 10.943 3.16211 11.0002H3.66211H4.16211C4.16211 11.0134 4.16144 11.0396 4.15578 11.0712C4.15036 11.1014 4.14193 11.1281 4.13224 11.1508C4.11329 11.195 4.09411 11.2129 4.10035 11.2064C4.11807 11.188 4.20898 11.1072 4.48242 10.9742L4.26367 10.5246ZM3.66211 11.0002L3.16211 11.0014C3.16225 11.0608 3.17119 11.1467 3.21434 11.2461C3.25363 11.3367 3.31197 11.4171 3.38193 11.4894C3.51671 11.6287 3.7262 11.7703 4.04494 11.9254L4.26367 11.4758L4.4824 11.0261C4.21015 10.8937 4.1189 10.813 4.10066 10.7941C4.09412 10.7874 4.11288 10.8047 4.13172 10.8481C4.14135 10.8703 4.14983 10.8967 4.15538 10.9267C4.16118 10.958 4.16207 10.9842 4.16211 10.999L3.66211 11.0002ZM4.26367 11.4758L4.04499 11.9254C4.63338 12.2116 5.51672 12.5055 6.69247 12.8974L6.85059 12.423L7.0087 11.9487C5.8016 11.5463 4.9967 11.2763 4.48235 11.0261L4.26367 11.4758ZM6.85059 12.423L6.69247 12.8974L9.35556 13.7851L9.51367 13.3107L9.67179 12.8364L7.0087 11.9487L6.85059 12.423ZM9.51367 13.3107L9.34877 13.7828C9.63083 13.8813 9.79906 13.9653 9.91695 14.0832L10.2705 13.7297L10.6241 13.3761C10.3371 13.0892 9.9843 12.9455 9.67857 12.8387L9.51367 13.3107ZM10.2705 13.7297L9.91688 14.0831C10.0846 14.251 10.1632 14.4888 10.3167 14.9493L10.791 14.7912L11.2654 14.6331C11.1403 14.258 10.9961 13.7483 10.6241 13.3762L10.2705 13.7297ZM10.791 14.7912L10.3167 14.9493L11.1028 17.3077L11.5771 17.1496L12.0515 16.9915L11.2654 14.6331L10.791 14.7912ZM11.5771 17.1496L11.1028 17.3077C11.4947 18.4834 11.7886 19.3669 12.0748 19.9552L12.5244 19.7365L12.974 19.5178C12.7239 19.0035 12.4538 18.1985 12.0515 16.9915L11.5771 17.1496ZM12.5244 19.7365L12.0748 19.9553C12.2304 20.275 12.3723 20.4848 12.5121 20.6196C12.5846 20.6896 12.6654 20.7479 12.7564 20.787C12.8567 20.83 12.9426 20.8381 13 20.8381V20.3381V19.8381C13.0134 19.8381 13.0396 19.8388 13.0712 19.8444C13.1015 19.8499 13.1282 19.8583 13.1507 19.868C13.1949 19.8869 13.2127 19.9061 13.2062 19.8998C13.1878 19.882 13.107 19.7911 12.974 19.5177L12.5244 19.7365ZM13 20.3381V20.8381C13.0574 20.8381 13.1433 20.83 13.2436 20.787C13.3346 20.7479 13.4154 20.6896 13.4879 20.6196C13.6277 20.4848 13.7696 20.275 13.9252 19.9553L13.4756 19.7365L13.026 19.5177C12.893 19.7911 12.8122 19.882 12.7938 19.8998C12.7873 19.9061 12.8051 19.8869 12.8493 19.868C12.8718 19.8583 12.8985 19.8499 12.9288 19.8444C12.9604 19.8388 12.9866 19.8381 13 19.8381V20.3381ZM13.4756 19.7365L13.9252 19.9552C14.2114 19.3669 14.5053 18.4834 14.8972 17.3077L14.4229 17.1496L13.9485 16.9915C13.5462 18.1985 13.2761 19.0035 13.026 19.5178L13.4756 19.7365ZM14.4229 17.1496L14.8972 17.3077L17.7351 8.79503L17.2607 8.6369L16.7864 8.47877L13.9485 16.9915L14.4229 17.1496ZM17.2607 8.6369L17.7351 8.79501C18.0107 7.96818 18.2184 7.34651 18.3018 6.87788L17.8096 6.79022L17.3173 6.70256C17.2499 7.08131 17.0732 7.61826 16.7864 8.47878L17.2607 8.6369ZM17.8096 6.79022L18.3018 6.87779C18.3446 6.63718 18.3542 6.44206 18.3266 6.27934C18.2941 6.08842 18.2137 5.962 18.1264 5.87451L17.7725 6.22772L17.4186 6.58093C17.4139 6.57626 17.4039 6.5659 17.3927 6.55137C17.3814 6.53676 17.3712 6.52115 17.3627 6.50503C17.3455 6.47243 17.3412 6.44967 17.3407 6.447C17.3405 6.4457 17.3435 6.46267 17.3416 6.50595C17.3397 6.54891 17.3333 6.61254 17.3173 6.70265L17.8096 6.79022Z" fill="currentColor"/>
            </svg>
          </button>
        ) : (
          <button
            className="hidden lg:block cursor-pointer h-[34px] text-[14px] px-3 rounded-[8px] bg-neutral-90 text-neutral-20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            onClick={onSend}
            disabled={disabled || !connected}
          >
            전송하기
          </button>
        )}
      </div>
    </div>
  );
}


