"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";

type Props = {
  open: boolean;
  /** 헤더 제목에 쓸 고객명. 연동된 고객이 있으면 그쪽 이름을 넘긴다. */
  customerName: string;
  submitting: boolean;
  /** 진행 선택(자체진행/공유하기) 단계로 되돌아간다. */
  onBack: () => void;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 19L8 12L15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SelfProgressMessageModal({
  open,
  customerName,
  submitting,
  onBack,
  onClose,
  onSubmit,
}: Props) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  if (!open) return null;

  const title = `${customerName?.trim() || "고객"}님 자체진행 정보 입력`;

  return (
    <BaseModal
      onClose={submitting ? () => {} : onClose}
      closeOnOverlayClick={!submitting}
      zIndexClassName="z-[270]"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel={title}
      disableAutoContainerSizing
      containerClassName="w-full md:w-[480px] max-h-[80vh] bg-card dark:bg-neutral-10 rounded-[14px] flex flex-col overflow-hidden drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:drop-shadow-none"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 shrink-0">
          <button
            type="button"
            onClick={() => !submitting && onBack()}
            aria-label="뒤로가기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70 shrink-0"
          >
            <BackIcon />
          </button>
          <h2 className="flex-1 min-w-0 text-[18px] font-semibold text-foreground truncate text-left">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70 shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6 pb-6 flex-1 flex flex-col gap-5 overflow-y-auto min-h-0">
          <div>
            <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
              전달사항 (선택)
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="전달사항을 입력해 주세요"
              rows={5}
              disabled={submitting}
              className="w-full min-h-[120px] px-3 py-2.5 rounded-[8px] border border-neutral-30 bg-card text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50 resize-none disabled:opacity-60"
            />
          </div>
        </div>

        <div className="border-t border-neutral-30 px-6 py-4 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold text-foreground bg-card hover:bg-neutral-10 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSubmit(message.trim())}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "처리 중..." : "자체진행"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
