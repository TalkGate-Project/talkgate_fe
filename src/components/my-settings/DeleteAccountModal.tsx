"use client";

import { useState } from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const confirmText = "계정 삭제";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsConfirmed(value === confirmText);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setInputValue("");
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-[848px] bg-card dark:bg-neutral-10 rounded-[14px]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="cursor-pointer absolute top-6 right-6 w-6 h-6 flex items-center justify-center"
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
              className="text-neutral-50 dark:text-neutral-50"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="px-7 py-6 h-full flex flex-col">
          {/* Header */}
          <div className="text-danger-40 dark:text-danger-40 text-[18px] font-semibold mb-[30px]">
            계정 삭제확인
          </div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.9986 15V18.3333M19.9986 25H20.0153M8.45159 31.6667H31.5456C34.1116 31.6667 35.7153 28.8889 34.4323 26.6667L22.8853 6.66667C21.6023 4.44444 18.3948 4.44444 17.1118 6.66667L5.56484 26.6667C4.28184 28.8889 5.88559 31.6667 8.45159 31.6667Z"
                stroke="currentColor"
                className="text-danger-40 dark:text-danger-40"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Main Warning */}
          <div className="text-center mb-8">
            <div className="text-danger-40 dark:text-danger-40 text-[18px] font-semibold mb-2">
              정말로 계정을 삭제하시겠습니까?
            </div>
            <div className="text-ink dark:text-neutral-80 text-[14px] font-medium">
              이 작업은 <span className="font-bold">되돌릴 수 없으며,</span>{" "}
              다음 데이터가 영구적으로 삭제됩니다
            </div>
          </div>

          {/* Data to be Deleted List */}
          <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-6 py-3 mb-5">
            <div className="text-ink dark:text-neutral-80 text-[14px] font-medium leading-6">
              • 모든 개인 정보
              <br />
              • 상담 기록 및 메시지
              <br />
              • 설정 및 환경설정
              <br />• 업무 관련 모든 데이터
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-6 py-3">
            <div className="text-ink dark:text-neutral-80 text-[14px] leading-[24px] font-medium mb-2">
              계정 삭제를 확인하려면 아래에 이름 "{confirmText}"을 정확히
              입력하세요.
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={confirmText}
              className="w-full px-3 h-[34px] bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-medium text-foreground dark:text-neutral-80 focus:outline-none focus:border-danger-40 dark:focus:border-danger-40"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-neutral-30/40 dark:!bg-[#444444]"></div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 px-7 py-3">
          <button
            onClick={handleClose}
            className="cursor-pointer px-3 py-1.5 bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`cursor-pointer px-3 py-1.5 rounded-[5px] text-[14px] font-semibold transition-colors ${
              isConfirmed
                ? "bg-danger-40 dark:bg-danger-40 text-white hover:bg-danger-60 dark:hover:bg-danger-60 cursor-pointer"
                : "bg-neutral-50 dark:bg-neutral-50 text-neutral-60 dark:text-neutral-60 cursor-not-allowed"
            }`}
          >
            계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

