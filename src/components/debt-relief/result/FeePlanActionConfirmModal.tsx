"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";

export type FeePlanAction = "refund" | "stop";

const ACTION_COPY: Record<
  FeePlanAction,
  { title: string; message: string; confirmLabel: string }
> = {
  refund: {
    title: "환불 처리",
    message:
      "지금까지 납부한 금액은 환불 처리되고\n이미 납부한 회차는 '환불'로 표시되며, 남은 회차는 청구되지 않습니다.",
    confirmLabel: "환불하기",
  },
  stop: {
    title: "중단 처리",
    message: "지금까지 납부한 회차는 그대로 유지되고,\n남은 회차는 앞으로 청구되지 않습니다.",
    confirmLabel: "중단하기",
  },
};

type Props = {
  open: boolean;
  action: FeePlanAction;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
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

export default function FeePlanActionConfirmModal({
  open,
  action,
  submitting = false,
  onClose,
  onConfirm,
}: Props) {
  const [note, setNote] = useState("");

  // 모달을 다시 열 때마다(환불↔중단 전환 포함) 이전 입력이 남아있지 않도록 초기화
  useEffect(() => {
    if (open) setNote("");
  }, [open, action]);

  if (!open) return null;

  const copy = ACTION_COPY[action];
  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <BaseModal
      onClose={handleClose}
      closeOnOverlayClick={!submitting}
      zIndexClassName="z-[120]"
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      ariaLabel={copy.title}
      disableAutoContainerSizing
      containerClassName="w-[calc(100%-2rem)] max-w-[440px] bg-card dark:bg-neutral-10 rounded-[14px] flex flex-col overflow-hidden drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:drop-shadow-none"
    >
        <div className="flex items-center justify-between px-7 pt-6 pb-[30px] shrink-0">
          <h2
            id="fee-plan-action-confirm-title"
            className="text-[18px] leading-[21px] font-semibold text-foreground"
          >
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-50 hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="px-7 pb-[30px] text-[14px] leading-5 font-medium text-foreground text-center whitespace-pre-line">
          {copy.message}
        </p>

        <div className="px-7 pb-6 flex flex-col gap-2">
          <label
            htmlFor="fee-plan-action-note"
            className="text-[14px] leading-[17px] font-medium text-neutral-60 tracking-[0.2px]"
          >
            전달사항 (선택)
          </label>
          <textarea
            id="fee-plan-action-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="전달사항을 입력해 주세요"
            rows={3}
            disabled={submitting}
            className="w-full min-h-[80px] resize-none rounded-[5px] border border-neutral-30 bg-card px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-neutral-50 focus:border-neutral-50 disabled:opacity-60"
          />
        </div>

        <div className="w-full h-px border-t border-neutral-30 shrink-0" />

        <div className="flex justify-end items-center gap-3 px-7 py-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-foreground hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note.trim())}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-danger-40 text-white text-[14px] font-semibold tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "처리 중..." : copy.confirmLabel}
          </button>
        </div>
    </BaseModal>
  );
}
