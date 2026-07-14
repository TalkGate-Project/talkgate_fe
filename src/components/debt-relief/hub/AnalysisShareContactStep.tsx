"use client";

import { useEffect, useState } from "react";
import { showErrorModal } from "@/lib/errorModalEvents";
import { formatPhoneInput } from "@/utils/format";
import { ContactType } from "@/types/customers";

type Props = {
  customerNameTitle: string;
  initialContact?: string;
  initialReferenceNote?: string;
  prefillLoading?: boolean;
  submitting: boolean;
  /** 중간 건: "다음으로", 마지막/단건: "공유하기" */
  submitLabel?: string;
  /** 뒤로가기 시 현재 입력값을 넘김 (미검증 draft 유지용) */
  onBack: (payload: { contact: string; referenceNote?: string }) => void;
  onClose: () => void;
  onSubmit: (payload: { contact: string; referenceNote?: string }) => void;
};

const CONTACT_TYPE_OPTIONS: { label: string; value: ContactType }[] = [
  { label: "휴대폰", value: ContactType.Phone },
  { label: "집", value: ContactType.Home },
  { label: "회사", value: ContactType.Office },
  { label: "기타", value: ContactType.Other },
];

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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
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

export default function AnalysisShareContactStep({
  customerNameTitle,
  initialContact = "",
  initialReferenceNote = "",
  prefillLoading = false,
  submitting,
  submitLabel = "공유하기",
  onBack,
  onClose,
  onSubmit,
}: Props) {
  const [contact1Type, setContact1Type] = useState<ContactType>(ContactType.Phone);
  const [contact1, setContact1] = useState("");
  const [referenceNote, setReferenceNote] = useState("");

  useEffect(() => {
    setContact1Type(ContactType.Phone);
    setContact1(initialContact ? formatPhoneInput(initialContact) : "");
    setReferenceNote(initialReferenceNote);
  }, [initialContact, initialReferenceNote]);

  const buildPayload = () => {
    const trimmedContact = contact1.replace(/\D/g, "");
    const note = referenceNote.trim();
    return {
      contact: trimmedContact,
      ...(note ? { referenceNote: note } : {}),
    };
  };

  const handleBack = () => {
    if (submitting) return;
    onBack(buildPayload());
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload.contact) {
      showErrorModal({
        headline: "필수 정보를 입력해주세요.",
        description: "연락처를 입력한 뒤 다시 시도해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    if (payload.contact.length < 9) {
      showErrorModal({
        headline: "연락처를 확인해주세요.",
        description: "올바른 형식의 연락처를 입력해주세요.",
        hideCancel: true,
        confirmText: "확인",
      });
      return;
    }
    onSubmit(payload);
  };

  const formDisabled = submitting || prefillLoading;

  return (
    <div
      className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-[480px] md:-translate-x-1/2 w-[calc(100%-2rem)] min-h-[446px] max-h-[80vh] bg-card dark:bg-neutral-10 rounded-[14px] z-50 flex flex-col overflow-hidden"
      style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-6 pt-5 pb-4 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로가기"
          className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-60 hover:opacity-70 shrink-0"
        >
          <BackIcon />
        </button>
        <h2 className="flex-1 min-w-0 text-[18px] font-semibold text-foreground truncate text-left">
          {customerNameTitle}
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
        {prefillLoading ? (
          <div className="flex flex-1 items-center justify-center py-12 text-[14px] text-neutral-60">
            불러오는 중...
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">
                연락처1<span className="text-danger-60">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative w-[106px] shrink-0">
                  <select
                    value={contact1Type}
                    onChange={(e) => setContact1Type(e.target.value as ContactType)}
                    disabled={formDisabled}
                    className="w-full h-[38px] px-3 pr-8 rounded-[8px] border border-neutral-30 bg-card text-[14px] text-neutral-60 appearance-none focus:outline-none focus:border-neutral-50 disabled:opacity-60"
                  >
                    {CONTACT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-60"
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={contact1}
                  onChange={(e) => setContact1(formatPhoneInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="010-1234-5678"
                  disabled={formDisabled}
                  className="flex-1 min-w-0 h-[38px] px-3 rounded-[8px] border border-neutral-30 bg-card text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[14px] leading-[17px] text-neutral-60 mb-2">참고사항</label>
              <textarea
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                placeholder="참고사항을 입력해 주세요"
                rows={5}
                disabled={formDisabled}
                className="w-full min-h-[120px] px-3 py-2.5 rounded-[8px] border border-neutral-30 bg-card text-[14px] text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50 resize-none disabled:opacity-60"
              />
            </div>
          </>
        )}
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
          onClick={handleSubmit}
          disabled={formDisabled}
          className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "공유 중..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
