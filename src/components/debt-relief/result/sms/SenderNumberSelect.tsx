"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SenderNumberOption } from "@/components/customers/sms";
import { formatPhoneNumber } from "@/utils/format";

// 발신번호 등록 설정 탭 경로 — "발신번호 추가하기" 클릭 시 이동
const SENDER_NUMBER_SETTINGS_PATH = "/settings?tab=sender-numbers";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="8"
      height="6"
      viewBox="0 0 8 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8.5V15.5M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  senderNumbers: SenderNumberOption[];
  selectedSenderKey: string | null;
  selectedSender: SenderNumberOption | null;
  loading: boolean;
  onChange: (key: string) => void;
};

const keyOf = (num: SenderNumberOption) => `${num.source}-${num.id}`;

// 발신번호 커스텀 셀렉트. 네이티브 <select> 대신 폼 최상단에서 아래로 펼쳐지는 플로팅 패널을 쓴다.
// CSS absolute만 사용(portal 미사용) — 필드가 폼 상단이라 클리핑 여지가 없고, 이 방식은 body zoom에도
// 위치 보정이 필요 없다(레이아웃이 네이티브로 처리됨). 하단에는 발신번호 등록 설정으로 가는 고정 액션.
export default function SenderNumberSelect({
  senderNumbers,
  selectedSenderKey,
  selectedSender,
  loading,
  onChange,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("keydown", handleEsc, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEsc, true);
    };
  }, [open]);

  const triggerLabel = loading
    ? "발신번호 로딩 중..."
    : selectedSender
    ? formatPhoneNumber(selectedSender.phoneNumber)
    : "발신번호 선택";

  const handleSelect = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-[34px] pl-3 pr-3 flex items-center justify-between gap-2 border border-neutral-30 dark:border-neutral-30 rounded-[5px] bg-card dark:bg-neutral-10 outline-none disabled:cursor-default disabled:bg-neutral-10 dark:disabled:bg-neutral-20 cursor-pointer focus:border-neutral-60 dark:focus:border-neutral-60"
      >
        <span
          className={`truncate text-[14px] leading-[17px] tracking-[-0.02em] ${
            selectedSender ? "text-ink dark:text-neutral-90" : "text-neutral-60 dark:text-neutral-60"
          }`}
        >
          {triggerLabel}
        </span>
        <ChevronDownIcon
          className={`shrink-0 text-ink dark:text-neutral-90 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !loading && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-30 overflow-hidden rounded-[5px] bg-card dark:bg-neutral-10 border border-transparent dark:border-neutral-30 shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:shadow-[0px_8px_12px_rgba(0,0,0,0.4)]"
        >
          <div className="max-h-[240px] overflow-y-auto py-2">
            {senderNumbers.length === 0 ? (
              <p className="px-5 py-3 text-[14px] leading-[17px] tracking-[-0.02em] text-neutral-60 dark:text-neutral-60">
                등록된 발신번호가 없습니다
              </p>
            ) : (
              senderNumbers.map((num) => {
                const key = keyOf(num);
                const isSelected = key === selectedSenderKey;
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(key)}
                    className={`w-full text-left px-5 py-[10px] text-[14px] leading-[17px] tracking-[-0.02em] hover:bg-neutral-10 dark:hover:bg-neutral-20 cursor-pointer ${
                      isSelected
                        ? "font-semibold text-ink dark:text-neutral-90"
                        : "font-medium text-ink dark:text-neutral-90"
                    }`}
                  >
                    {formatPhoneNumber(num.phoneNumber)}
                  </button>
                );
              })
            )}
          </div>

          <div className="mx-0 border-t border-neutral-30 dark:border-neutral-30 opacity-50" aria-hidden />

          <button
            type="button"
            onClick={() => router.push(SENDER_NUMBER_SETTINGS_PATH)}
            className="w-full flex items-center gap-1 px-4 py-3 text-left hover:bg-neutral-10 dark:hover:bg-neutral-20 cursor-pointer"
          >
            <span className="text-neutral-50 dark:text-neutral-60 shrink-0">
              <PlusCircleIcon />
            </span>
            <span className="text-[13px] font-medium leading-[15px] tracking-[-0.02em] text-neutral-60 dark:text-neutral-60">
              발신번호 추가하기
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
