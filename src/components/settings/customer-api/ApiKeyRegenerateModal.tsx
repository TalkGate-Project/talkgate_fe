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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-white rounded-[14px] shadow-[0px_8px_12px_rgba(9,30,66,0.1),0px_13px_61px_rgba(169,169,169,0.366)] z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold text-foreground leading-[21px]">
            API 키 재발급
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-neutral-50 hover:text-neutral-70 transition-colors"
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
                stroke="#B0B0B0"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-7 pb-7">
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.9986 15V18.3333M19.9986 25H20.0153M8.45159 31.6667H31.5456C34.1116 31.6667 35.7153 28.8889 34.4323 26.6667L22.8853 6.66667C21.6023 4.44444 18.3948 4.44444 17.1118 6.66667L5.56484 26.6667C4.28184 28.8889 5.88559 31.6667 8.45159 31.6667Z"
                stroke="#D83232"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          {/* Warning Message */}
          <h3 className="text-[18px] font-semibold text-danger-40 text-center leading-[21px] mb-3">
            API 키를 재발급하시겠습니까?
          </h3>

          {/* Description */}
          <p className="text-[14px] font-medium text-foreground text-center leading-[17px] mb-6">
            새로운 API 키가 생성되면 기존 키는 즉시 비활성화됩니다. <br />
            현재 키를 사용하는 모든 시스템에서 새로운 키로 업데이트해야 합니다.
          </p>

          {/* Consequences Box */}
          <div className="bg-neutral-10 rounded-[5px] px-6 py-3 mb-6">
            <ul className="space-y-2 text-[14px] font-medium text-foreground leading-[24px]">
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

          {/* Divider */}
          <div className="w-full h-px bg-neutral-30 mb-4" />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground tracking-[-0.02em] hover:bg-neutral-10 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-neutral-20 tracking-[-0.02em] hover:opacity-90 transition-opacity"
            >
              재발급
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
