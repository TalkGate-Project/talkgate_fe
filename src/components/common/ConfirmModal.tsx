"use client";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  headline?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  open,
  title,
  description,
  headline,
  confirmText = "확인",
  cancelText = "취소",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div
        className="relative w-[440px] rounded-[14px] bg-white shadow-[0px_13px_61px_rgba(169,169,169,0.366013)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-[#1B1B1B]">{title}</h2>
            <button
              type="button"
              onClick={onCancel}
              aria-label="close modal"
              className="cursor-pointer h-6 w-6"
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center">
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
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-[#E43B3B]">
              {headline ?? title}
            </p>
            <p className="whitespace-pre-line text-[14px] font-medium text-[#1F1F1F]">
              {description}
            </p>
          </div>
        </div>
        <div className="h-px w-full bg-[#E2E2E2]"></div>
        <div className="px-8 py-4 flex justify-end gap-3">
          <button
            type="button"
            className="cursor-pointer flex h-[34px] items-center justify-center rounded-[5px] border border-[#E2E2E2] px-3 text-[14px] font-semibold tracking-[-0.02em] text-[#000000]"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="cursor-pointer flex h-[34px] items-center justify-center rounded-[5px] bg-[#252525] px-3 text-[14px] font-semibold tracking-[-0.02em] text-[#D0D0D0] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "확인 중..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
