"use client";

import { useState } from "react";
import BaseModal from "@/components/common/BaseModal";

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
    <BaseModal
      onClose={handleClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel="API 키 생성"
      positionerClassName="w-full h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4"
      disableAutoContainerSizing
      containerClassName="w-full h-full md:w-[440px] md:h-[224px] bg-white dark:bg-neutral-10 md:rounded-[14px] flex flex-col drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:drop-shadow-none"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 relative">
          <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-80 leading-[21px]">
            API 키 생성
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="cursor-pointer w-6 h-6 flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="닫기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 18L18 6M6 6L18 18"
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
        <div className="flex-1 overflow-y-auto px-7 pb-4">
          {/* Input Field: 모바일 전체 너비, 데스크톱 384px */}
          <div className="relative w-full md:w-[384px]">
            <label className="block text-[14px] font-medium text-neutral-60 dark:text-neutral-60 leading-[17px] mb-2" style={{ letterSpacing: "0.2px" }}>
              API 키 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="추가할 API 키 이름을 입력해 주세요."
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-10 rounded-[5px] text-[14px] text-neutral-60 dark:text-neutral-60 font-medium outline-none border border-neutral-30 dark:border-neutral-30 focus:border-neutral-50 dark:focus:border-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ letterSpacing: "-0.02em", lineHeight: "17px", minHeight: "34px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && !isSubmitting) {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px border-t border-neutral-30 dark:border-neutral-30 flex-shrink-0" />

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-[12px] px-7 py-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="cursor-pointer min-w-[48px] h-[34px] flex items-center justify-center px-3 py-[6px] rounded-[5px] bg-white dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ lineHeight: "17px" }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim() || isSubmitting}
            className="cursor-pointer min-w-[72px] h-[34px] flex items-center justify-center px-3 py-[6px] rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[14px] font-semibold text-[#EDEDED] dark:text-neutral-20 tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ lineHeight: "17px" }}
          >
            생성하기
          </button>
        </div>
    </BaseModal>
  );
}
