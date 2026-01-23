"use client";

import { useState } from "react";

interface ApiKeyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}

export default function ApiKeyCreateModal({
  isOpen,
  onClose,
  onConfirm,
}: ApiKeyCreateModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setName("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onConfirm(name.trim());
      setName("");
      onClose();
    } catch (err) {
      console.error("Failed to create API key", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-40" onClick={handleClose} />

      {/* Modal */}
      <div
        className="fixed inset-0 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full h-full md:w-[440px] md:h-auto md:max-h-[90vh] bg-card dark:bg-neutral-10 md:rounded-[14px] z-50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-6 pb-3 md:pb-4 flex-shrink-0">
          <h2 className="text-[18px] md:text-[18px] font-semibold text-foreground dark:text-neutral-80 leading-[21px]">
            API 키 생성
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-50 dark:text-neutral-50 hover:text-neutral-70 dark:hover:text-neutral-60 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7">
          {/* Description */}
          <p className="text-[13px] md:text-[14px] font-medium text-foreground dark:text-neutral-80 leading-[17px] mb-4 md:mb-6">
            API 키에 이름을 지정하여 여러 개의 키를 생성하고 관리할 수 있습니다.
          </p>

          {/* Input Field */}
          <div className="space-y-2 mb-4 md:mb-6">
            <label className="text-[13px] md:text-[14px] font-medium text-foreground dark:text-neutral-80 leading-[1]">
              API 키 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: OPENAI_API_KEY, PROD_API_KEY"
              disabled={isSubmitting}
              className="w-full h-[50px] px-3 md:px-6 bg-neutral-10 dark:bg-neutral-20 rounded-[5px] text-[13px] md:text-[14px] text-foreground dark:text-neutral-80 font-medium outline-none border border-neutral-30 dark:border-neutral-30 focus:border-neutral-50 dark:focus:border-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && !isSubmitting) {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-neutral-30 dark:bg-neutral-30 flex-shrink-0" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 md:gap-3 px-4 md:px-7 py-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="cursor-pointer h-[34px] px-3 md:px-3 rounded-[5px] bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[13px] md:text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim() || isSubmitting}
            className="cursor-pointer h-[34px] px-3 md:px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[13px] md:text-[14px] font-semibold text-neutral-0 dark:text-neutral-0 tracking-[-0.02em] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            생성
          </button>
        </div>
      </div>
    </>
  );
}
