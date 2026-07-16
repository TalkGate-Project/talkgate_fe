"use client";

import { formatCustomerMeta } from "@/components/debt-relief/format";
import type { CustomerGender } from "@/types/debtRelief";
import { formatPhoneInput } from "@/utils/format";

type Props = {
  open: boolean;
  customerName: string;
  age?: number;
  ageGroupLabel?: string;
  gender?: CustomerGender;
  occupation?: string;
  partnerName: string;
  contact: string;
  referenceNote?: string;
  confirmLabel?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
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

export default function AnalysisShareConfirmModal({
  open,
  customerName,
  age,
  ageGroupLabel,
  gender,
  occupation,
  partnerName,
  contact,
  referenceNote,
  confirmLabel = "공유하기",
  submitting = false,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  const customerMeta = formatCustomerMeta(age, gender, occupation, ageGroupLabel);
  const formattedContact = formatPhoneInput(contact);
  const displayName = customerName || "고객";
  const displayPartnerName = partnerName || "프로젝트";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-[#000000CC] z-[60]"
        onClick={() => !submitting && onClose()}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-share-confirm-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[calc(100%-2rem)] max-w-[440px] bg-card dark:bg-neutral-10 rounded-[14px] flex flex-col overflow-hidden"
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-[30px] shrink-0">
          <h2
            id="analysis-share-confirm-title"
            className="text-[18px] leading-[21px] font-semibold text-foreground"
          >
            공유결과 확인
          </h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            aria-label="닫기"
            className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-50 hover:opacity-70"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="px-7 pb-[30px] text-[16px] leading-[19px] font-medium text-foreground text-center">
          공유 전 고객 정보를 다시 한번 확인해 주세요.
        </p>

        <div className="px-7 pb-6 flex flex-col gap-2">
          <div className="flex items-center gap-4 px-6 py-4 rounded-[12px] border border-neutral-30 bg-card">
            <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-[16px] leading-[19px] font-semibold text-foreground">
                {displayName}
              </span>
              {customerMeta ? (
                <span className="text-[12px] leading-[14px] font-medium text-neutral-60 opacity-80">
                  {customerMeta}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 rounded-[8px] bg-neutral-10 dark:bg-neutral-25">
            <div
              className="w-5 h-5 rounded-full bg-neutral-20 dark:bg-neutral-30 shrink-0 grid place-items-center text-[11px] font-semibold text-neutral-60"
              aria-hidden
            >
              {displayPartnerName.charAt(0).toUpperCase() || "?"}
            </div>
            <span className="text-[14px] leading-5 font-semibold text-foreground truncate min-w-0">
              {displayPartnerName}
            </span>
          </div>

          <div className="px-6 py-3 rounded-[8px] bg-neutral-10 dark:bg-neutral-25 min-h-[84px]">
            <p className="text-[14px] leading-5 font-medium text-neutral-60 whitespace-pre-line">
              {formattedContact}
              {referenceNote ? `\n참고사항 : ${referenceNote}` : ""}
            </p>
          </div>
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
            onClick={onConfirm}
            disabled={submitting}
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "공유 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
