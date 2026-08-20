"use client";

import BaseModal from "@/components/common/BaseModal";

interface ApiKeyRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ApiKeyRegenerateModal({
  isOpen,
  onClose,
  onConfirm,
}: ApiKeyRegenerateModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal
      onClose={onClose}
      zIndexClassName="z-50"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel="API 키 재발급"
      positionerClassName="w-full h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4"
      disableAutoContainerSizing
      containerClassName="w-full h-full md:w-[440px] md:h-auto md:max-h-[90vh] bg-card dark:bg-neutral-10 md:rounded-[14px] flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-7 pt-4 md:pt-6 pb-3 md:pb-4 flex-shrink-0">
          <h2 className="text-[18px] md:text-[18px] font-semibold text-foreground dark:text-neutral-80 leading-[21px]">
            API 키 재발급
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-50 dark:text-neutral-50 hover:text-neutral-70 dark:hover:text-neutral-60 transition-colors flex-shrink-0"
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
          {/* Warning Icon */}
          <div className="flex justify-center mb-3 md:mb-4">
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

          {/* Warning Message */}
          <h3 className="text-[16px] md:text-[18px] font-semibold text-danger-40 dark:text-danger-40 text-center leading-[21px] mb-3">
            API 키를 재발급하시겠습니까?
          </h3>

          {/* Description */}
          <p className="text-[13px] md:text-[14px] font-medium text-foreground dark:text-neutral-80 text-center leading-[17px] mb-4 md:mb-6">
            새로운 API 키가 생성되면 기존 키는 즉시 비활성화됩니다. <br className="hidden md:block" />
            <span className="md:hidden"> </span>
            현재 키를 사용하는 모든 시스템에서 새로운 키로 업데이트해야 합니다.
          </p>

          {/* Consequences Box */}
          <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-4 md:px-6 py-3 mb-4 md:mb-6">
            <ul className="text-[13px] md:text-[14px] font-medium text-foreground dark:text-neutral-80 leading-[22px] md:leading-[24px]">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>기존 API 키는 즉시 사용 불가능해집니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>연동된 모든 시스템에서 키를 업데이트해야 합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>이 작업은 되돌릴 수 없습니다</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-neutral-30 dark:bg-neutral-30 flex-shrink-0" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 md:gap-3 px-4 md:px-7 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="cursor-pointer h-[34px] px-3 md:px-3 rounded-[5px] bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[13px] md:text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="cursor-pointer h-[34px] px-3 md:px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[13px] md:text-[14px] font-semibold text-neutral-0 dark:text-neutral-0 tracking-[-0.02em] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors"
          >
            API 키 재발급
          </button>
        </div>
    </BaseModal>
  );
}
