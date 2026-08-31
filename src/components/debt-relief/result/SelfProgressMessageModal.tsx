"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";

type Props = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

export default function SelfProgressMessageModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  if (!open) return null;

  return (
    <BaseModal
      onClose={submitting ? () => {} : onClose}
      closeOnOverlayClick={!submitting}
      zIndexClassName="z-[270]"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="relative w-[92vw] max-w-[440px] rounded-[14px] bg-card dark:bg-neutral-10 flex flex-col"
      ariaLabel="자체진행 전달사항 입력"
    >
      <div className="flex items-center justify-between px-7 pt-6 pb-4">
        <h2 className="text-[18px] font-semibold text-foreground">자체진행</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="닫기"
          className="cursor-pointer grid h-6 w-6 place-items-center text-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="px-7 pb-6 flex flex-col gap-4">
        <p className="text-[14px] font-medium text-neutral-70 dark:text-neutral-80">
          자체진행과 함께 기록할 전달사항을 입력해 주세요.
        </p>
        <div>
          <label
            htmlFor="self-progress-message"
            className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]"
          >
            전달사항 (선택)
          </label>
          <textarea
            id="self-progress-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="전달사항을 입력해 주세요"
            rows={4}
            disabled={submitting}
            className="mt-2 w-full min-h-[104px] resize-y rounded-[8px] border border-neutral-30 bg-card px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-neutral-50 focus:border-neutral-50 disabled:opacity-60 dark:border-[#4D4D4D] dark:bg-[#1E1E1E] dark:placeholder:text-[#959595] dark:focus:border-[#959595]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 px-7 py-4 border-t border-neutral-30 dark:border-[#4D4D4D]">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="cursor-pointer h-[34px] rounded-[5px] border border-neutral-30 px-3 text-[14px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4D4D4D]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onSubmit(message.trim())}
          disabled={submitting}
          className="cursor-pointer h-[34px] rounded-[5px] bg-neutral-90 px-3 text-[14px] font-semibold text-neutral-20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F5F5F5] dark:text-[#333333]"
        >
          {submitting ? "처리 중..." : "자체진행"}
        </button>
      </div>
    </BaseModal>
  );
}
