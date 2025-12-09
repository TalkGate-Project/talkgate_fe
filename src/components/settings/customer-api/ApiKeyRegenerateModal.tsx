"use client";

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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-card dark:bg-neutral-0 rounded-[14px] shadow-[0px_8px_12px_rgba(9,30,66,0.1),0px_13px_61px_rgba(169,169,169,0.366)] z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold text-foreground dark:text-neutral-80 leading-[21px]">
            API 키 재발급
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer w-6 h-6 flex items-center justify-center text-neutral-50 dark:text-neutral-50 hover:text-neutral-70 dark:hover:text-neutral-60 transition-colors"
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
        <div className="px-7">
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

          {/* Warning Message */}
          <h3 className="text-[18px] font-semibold text-danger-40 dark:text-danger-40 text-center leading-[21px] mb-3">
            API 키를 재발급하시겠습니까?
          </h3>

          {/* Description */}
          <p className="text-[14px] font-medium text-foreground dark:text-neutral-80 text-center leading-[17px] mb-6">
            새로운 API 키가 생성되면 기존 키는 즉시 비활성화됩니다. <br />
            현재 키를 사용하는 모든 시스템에서 새로운 키로 업데이트해야 합니다.
          </p>

          {/* Consequences Box */}
          <div className="bg-neutral-10 dark:bg-neutral-20 rounded-[5px] px-6 py-3 mb-6">
            <ul className="text-[14px] font-medium text-foreground dark:text-neutral-80 leading-[24px]">
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
        {/* content 끝 */}

        {/* Divider */}
        <div className="w-full h-px bg-neutral-30 dark:bg-neutral-30" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 px-7 py-3">
          <button
            onClick={onClose}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-card dark:bg-neutral-10 border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 tracking-[-0.02em] hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold text-neutral-0 dark:text-neutral-0 tracking-[-0.02em] hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors"
          >
            계정 재발급
          </button>
        </div>
      </div>
    </>
  );
}
