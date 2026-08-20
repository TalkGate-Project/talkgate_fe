"use client";

import BaseModal from "@/components/common/BaseModal";

interface SelfAuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // 확인 버튼 클릭 시 호출되는 콜백
  purpose: "personal" | "common"; // 개인 발신번호 or 공통 발신번호 추가
}

export default function SelfAuthenticationModal({
  isOpen,
  onClose,
  onConfirm,
  purpose,
}: SelfAuthenticationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const getTitle = () => {
    return "본인인증";
  };

  const getMainText = () => {
    return "발신번호 등록을 위해 본인인증을 진행해주세요.";
  };

  const getSubText = () => {
    if (purpose === "personal") {
      return "본인인증이 완료되면 자동으로 발신번호에 추가됩니다.";
    }
    return null; // 공통 발신번호 추가시에는 하단 문구 숨김
  };

  return (
    <BaseModal
      onClose={onClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      ariaLabel="본인인증"
      disableAutoContainerSizing
      containerClassName="relative w-[440px] bg-card dark:bg-neutral-10 rounded-[14px] mx-4"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5">
          <h2 className="text-[18px] font-bold text-ink dark:text-neutral-80 leading-[1.4]">
            {getTitle()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-20 dark:hover:bg-neutral-20 transition-colors"
            aria-label="닫기"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-7 pb-[30px]">
          {/* Icon */}
          <div className="mb-4">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 20L18.3333 23.3333L25 16.6667M35 20C35 28.2843 28.2843 35 20 35C11.7157 35 5 28.2843 5 20C5 11.7157 11.7157 5 20 5C28.2843 5 35 11.7157 35 20Z" stroke="#00E272" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Main Text */}
          <p className="text-[18px] font-semibold text-ink dark:text-neutral-80 leading-[1.5] text-center mb-2">
            {getMainText()}
          </p>

          {/* Sub Text - 개인 발신번호 추가시에만 표시 */}
          {getSubText() && (
            <p className="text-[14px] text-neutral-60 dark:text-neutral-60 leading-[1.6] text-center">
              {getSubText()}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-30 dark:border-neutral-30" />

        {/* Actions */}
        <div className="flex gap-2 justify-end px-7 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-[48px] h-[34px] flex items-center justify-center rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-card dark:bg-neutral-10 text-[13px] font-medium text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="cursor-pointer w-[72px] h-[34px] flex items-center justify-center rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[13px] font-medium text-white dark:text-neutral-25 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors"
          >
            확인
          </button>
        </div>
    </BaseModal>
  );
}
