"use client";

import BaseModal from "@/components/common/BaseModal";

type AnalysisDraftRestoreModalProps = {
  open: boolean;
  savedAt?: number;
  onRestore: () => void;
  onStartFresh: () => void;
};

export default function AnalysisDraftRestoreModal({
  open,
  savedAt,
  onRestore,
  onStartFresh,
}: AnalysisDraftRestoreModalProps) {
  if (!open) return null;

  const savedAtText = savedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(savedAt))
    : null;

  return (
    <BaseModal
      onClose={onStartFresh}
      overlayClassName="bg-black/35 dark:bg-[#000000CC]"
      containerClassName="w-[calc(100vw-2rem)] sm:w-[440px] sm:min-w-[440px] max-w-[440px] rounded-[14px] bg-card shadow-[0_18px_50px_rgba(0,0,0,0.22)] dark:shadow-none"
      ariaLabel="작성 중인 분석 복원"
    >
      <div className="px-7 pt-6 pb-[30px]">
        <div className="flex items-start justify-between">
          <h2 className="text-[18px] font-semibold text-neutral-90">작성 중인 분석</h2>
          <button
            type="button"
            onClick={onStartFresh}
            aria-label="닫기"
            className="grid h-6 w-6 cursor-pointer place-items-center text-neutral-50 hover:text-neutral-70"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 18 18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex justify-center text-secondary-80 dark:text-secondary-20">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
            <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="4" />
            <path
              d="M20 11v11M20 29h.01"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-5 text-center text-[18px] font-semibold leading-[21px] text-secondary-80 dark:text-secondary-20">
          작성하던 내용을 복원할까요?
        </p>
        <p className="mt-3 text-center text-[14px] font-medium leading-[20px] text-neutral-70">
          {savedAtText ? `${savedAtText}에 마지막으로 저장되었습니다.` : "이 기기에 저장된 내용이 있습니다."}
        </p>
      </div>

      <div className="h-px bg-neutral-30" />
      <div className="flex justify-end gap-3 px-7 py-4">
        <button
          type="button"
          onClick={onStartFresh}
          className="flex h-[34px] min-w-[88px] cursor-pointer items-center justify-center rounded-[5px] border border-neutral-30 px-3 text-[14px] font-semibold text-neutral-90"
        >
          새로 작성
        </button>
        <button
          type="button"
          onClick={onRestore}
          className="flex h-[34px] min-w-[88px] cursor-pointer items-center justify-center rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold text-neutral-20"
        >
          내용 복원
        </button>
      </div>
    </BaseModal>
  );
}
