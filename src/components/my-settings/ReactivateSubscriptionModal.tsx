"use client";

import BaseModal from "@/components/common/BaseModal";

interface ReactivateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ReactivateSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ReactivateSubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50 backdrop-blur-sm"
      containerClassName="w-full max-w-[440px] bg-white dark:bg-neutral-10 rounded-[14px] shadow-[0px_8px_12px_rgba(9,30,66,0.1)]"
      ariaLabel="구독 활성화 확인"
    >
      <div>
        {/* 내용 영역 */}
        <div className="p-6 md:p-8">
          {/* 제목 */}
          <h2 className="text-[18px] md:text-[20px] font-semibold text-foreground mb-4">
            구독을 다시 활성화할까요?
          </h2>

          {/* 설명 */}
          <div className="space-y-2">
            <p className="text-[14px] md:text-[16px] text-neutral-70 dark:text-neutral-50">
              결제 예정일에 다시 결제가 진행됩니다.
            </p>
            <p className="text-[14px] md:text-[16px] text-neutral-70 dark:text-neutral-50">
              결제 수단이 등록되어 있지 않으면 활성화할 수 없습니다.
            </p>
          </div>
        </div>

        {/* 버튼 영역 - 패딩에 영향받지 않고 꽉 차도록 */}
        <div className="border-t border-border dark:border-[#4D4D4D] px-6 md:px-8 py-3 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer px-4 py-2 border border-neutral-30 text-[14px] md:text-[16px] font-medium text-neutral-70 dark:text-neutral-50 rounded-[8px] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer px-4 py-2 bg-black dark:bg-neutral-90 text-white dark:text-neutral-0 text-[14px] md:text-[16px] font-medium rounded-[8px] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>처리 중...</span>
              </>
            ) : (
              "구독 활성화"
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
