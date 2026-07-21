"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";

type Mode = "accept" | "reject";

type Props = {
  open: boolean;
  mode: Mode;
  submitting: boolean;
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

// 변호사 프로젝트가 전달받은 분석 건을 수락/반려할 때 메시지(수락 인사말 또는 반려 사유)를
// 입력받는 모달. 여기서 입력한 메시지가 영업담당자에게 전달되며(rejectSharedAnalysis의
// message), 반려됨 상태 툴팁(DiagnosisBadges의 StatusBadge)의 데이터 출처가 된다.
export default function AnalysisReviewDecisionModal({
  open,
  mode,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  if (!open) return null;

  const isAccept = mode === "accept";
  const title = isAccept ? "분석 데이터 수락" : "분석 데이터 반려";
  const description = isAccept
    ? "수락 메시지를 입력해 주세요. 영업담당자에게 전달됩니다."
    : "반려 사유를 입력해 주세요. 영업담당자에게 전달됩니다.";
  const confirmLabel = isAccept ? "수락하기" : "반려하기";

  return (
    <BaseModal
      onClose={submitting ? () => {} : onClose}
      closeOnOverlayClick={!submitting}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      containerClassName="relative w-[92vw] max-w-[440px] rounded-[14px] bg-white dark:bg-neutral-10 flex flex-col"
      ariaLabel={title}
    >
      <div className="flex items-center justify-between px-7 pt-6 pb-4">
        <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-90">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="닫기"
          className="cursor-pointer grid h-6 w-6 place-items-center text-neutral-50 dark:text-[#959595] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-7 pb-6 flex flex-col gap-4">
        <p className="text-[14px] font-medium text-neutral-70 dark:text-neutral-80">{description}</p>
        <div>
          <label className="block text-[14px] font-medium text-neutral-60 dark:text-[#B9B9B9]">
            전달사항 (선택)
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="전달사항을 입력해 주세요"
            rows={4}
            disabled={submitting}
            className="mt-2 w-full min-h-[104px] resize-none rounded-[8px] border border-neutral-30 bg-card px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-neutral-50 focus:border-neutral-50 disabled:opacity-60 dark:border-[#4D4D4D] dark:bg-[#1E1E1E] dark:text-[#FDFDFD] dark:placeholder:text-[#959595] dark:focus:border-[#959595]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 px-7 py-4 border-t border-neutral-30 dark:border-[#4D4D4D]">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="cursor-pointer h-[34px] rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] px-3 text-[14px] font-semibold text-ink dark:text-neutral-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onSubmit(message.trim())}
          disabled={submitting}
          className={`cursor-pointer h-[34px] rounded-[5px] px-3 text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
            isAccept
              ? "bg-neutral-90 text-neutral-20 dark:bg-[#F5F5F5] dark:text-[#333333]"
              : "bg-danger-40 text-white"
          }`}
        >
          {submitting ? "처리 중..." : confirmLabel}
        </button>
      </div>
    </BaseModal>
  );
}
