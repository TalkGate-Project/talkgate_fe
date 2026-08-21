"use client";

import { useEffect, useRef, useState } from "react";
import {
  AGE_GROUP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import LinkIcon from "@/components/icons/LinkIcon";
import { formatContactForDisplay } from "@/utils/format";

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | null
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? null;
}

export function buildCustomerMeta(form: DiagnosisFormState): string {
  const parts = [
    optionLabel(AGE_GROUP_OPTIONS, form.ageGroup),
    form.gender ? (form.gender === "male" ? "남" : "여") : null,
    optionLabel(EMPLOYMENT_TYPE_OPTIONS, form.employmentType) || "무직",
  ].filter(Boolean);
  return parts.join(" · ");
}

function UnlinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="m3 3 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.35 8.95 4.7 10.6a2.25 2.25 0 0 0 3.18 3.18l1.64-1.64M11.65 9.05l1.65-1.65a2.25 2.25 0 0 0-3.18-3.18L8.48 5.86" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FormCustomerSummary({
  form,
  isCustomerConnected = false,
  linkedCustomerName,
  linkedCustomerContact,
  onCustomerLink,
  onCustomerUnlink,
}: {
  form: DiagnosisFormState;
  isCustomerConnected?: boolean;
  linkedCustomerName?: string;
  linkedCustomerContact?: string;
  onCustomerLink?: () => void;
  onCustomerUnlink?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = buildCustomerMeta(form);
  const customerName = linkedCustomerName?.trim() || form.customerName || "고객명";
  const customerContact = linkedCustomerContact
    ? formatContactForDisplay(linkedCustomerContact)
    : "";

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLinkButtonClick = () => {
    if (isCustomerConnected) {
      setMenuOpen((open) => !open);
      return;
    }
    onCustomerLink?.();
  };

  return (
    <div className="flex h-[43px] min-w-0 items-center justify-between gap-3 text-left">
      <div className="w-[99px] min-w-0 shrink-0 self-start">
        <p className="truncate text-[18px] font-bold leading-[21px] text-ink">
          {form.customerName || "고객명"}
        </p>
        {meta && (
          <p className="mt-0.5 truncate text-[14px] font-medium leading-5 text-neutral-60">
            {meta}
          </p>
        )}
      </div>

      {onCustomerLink && (
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={handleLinkButtonClick}
            aria-label={isCustomerConnected ? `연결된 고객 ${customerName}` : "고객 연동"}
            aria-haspopup={isCustomerConnected ? "menu" : undefined}
            aria-expanded={isCustomerConnected ? menuOpen : undefined}
            className={`inline-flex h-[34px] cursor-pointer items-center justify-center gap-1 rounded-[5px] border px-[7px] py-1.5 transition-colors ${
              isCustomerConnected
                ? "w-[111px] border-secondary-60 bg-[#E4EDFF] text-secondary-60 hover:opacity-90 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                : "w-[97px] border-neutral-30 bg-card text-neutral-80 hover:bg-neutral-10"
            }`}
          >
            <LinkIcon size={20} className="shrink-0" />
            {isCustomerConnected ? (
              <span className="flex w-[73px] min-w-0 flex-col text-left text-[10px] font-medium leading-3">
                <span className="truncate">{customerName}{customerContact ? " ·" : ""}</span>
                {customerContact && <span className="whitespace-nowrap">{customerContact}</span>}
              </span>
            ) : (
              <span className="whitespace-nowrap text-[12px] font-medium leading-[14px]">고객연동</span>
            )}
          </button>

          {isCustomerConnected && menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-2 w-[140px] overflow-hidden rounded-[8px] bg-card shadow-[0_13px_61px_rgba(169,169,169,0.36)] dark:shadow-[0_13px_61px_rgba(0,0,0,0.45)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onCustomerLink();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium text-foreground transition-colors hover:bg-neutral-10"
              >
                <LinkIcon size={18} />
                연동 변경
              </button>
              {onCustomerUnlink && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onCustomerUnlink();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium text-foreground transition-colors hover:bg-neutral-10"
                >
                  <UnlinkIcon />
                  연동 해제
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
