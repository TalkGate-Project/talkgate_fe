"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import DatePicker from "@/components/common/DatePicker";
import { getBodyZoom } from "@/utils/zoom";

export type Option = { label: string; value: string | number };

export type CustomerFilterOptionKey = "applicationRoutes" | "mediaCompanies" | "sites";

export function LabeledSelect({
  label,
  options,
  placeholder,
  value,
  onChange,
  freeText,
  sanitizeInput,
  inputMode,
  autoComplete,
  disabled,
}: {
  label: string;
  options: Option[];
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  freeText?: boolean;
  sanitizeInput?: (raw: string) => string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  disabled?: boolean;
}) {
  const containerClassName = disabled
    ? "relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-neutral-30 rounded-[5px] h-[34px] bg-[#EDEDED] dark:bg-neutral-25 cursor-not-allowed"
    : "relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] h-[34px] bg-white dark:bg-neutral-20";

  const fieldClassName = disabled
    ? "w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] font-medium text-[#808080] dark:text-neutral-60 cursor-not-allowed"
    : "w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80";

  const placeholderClassName = disabled
    ? `${fieldClassName} placeholder:text-[#808080] dark:placeholder:text-neutral-60`
    : `${fieldClassName} placeholder:text-[#808080] dark:placeholder:text-neutral-60`;

  const selectClassName = disabled
    ? `${fieldClassName} appearance-none pr-6`
    : `${fieldClassName} appearance-none pr-6 cursor-pointer`;

  const arrowClassName = disabled
    ? "text-[#808080] dark:text-neutral-60"
    : "text-[#000] dark:text-neutral-70";

  return (
    <div>
      <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">{label}</label>
      <div className={containerClassName}>
        <div className="flex flex-row items-center p-0 gap-[30px] w-full lg:w-[360px] h-[17px]">
          {freeText ? (
            <input
              value={value ?? ""}
              inputMode={inputMode}
              autoComplete={autoComplete}
              disabled={disabled}
              onChange={(e) => {
                if (!onChange) return;
                const raw = e.target.value;
                onChange(sanitizeInput ? sanitizeInput(raw) : raw);
              }}
              className={placeholderClassName}
              placeholder={placeholder}
            />
          ) : (
            <select
              value={value ?? ""}
              disabled={disabled}
              onChange={(e) => onChange && onChange(e.target.value)}
              className={selectClassName}
            >
              <option value="" className="bg-[#EDEDED] dark:bg-neutral-25 text-[#808080] dark:text-neutral-60">
                {placeholder}
              </option>
              {options.map((o) => (
                <option
                  key={String(o.value)}
                  value={String(o.value)}
                  className="bg-white dark:bg-neutral-20 text-[#000] dark:text-neutral-80"
                >
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
        {/* Custom dropdown arrow - freeText(일반 입력 필드)일 때는 숨김 */}
        {!freeText && (
          <svg
            className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${arrowClassName}`}
            width="8"
            height="6"
            viewBox="0 0 8 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 1.87809e-07 0.647327 2.2346e-07L7.35267 8.0966e-07C7.76048 8.45312e-07 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export function SearchableLabeledCombobox({
  label,
  options,
  placeholder,
  value,
  onChange,
  onOpenChange,
  loading = false,
  emptyText,
}: {
  label: string;
  options: Option[];
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  onOpenChange?: (open: boolean) => void;
  loading?: boolean;
  emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateOpen = useCallback(
    (nextOpen: boolean) => {
      setOpen((prevOpen) => {
        if (prevOpen === nextOpen) {
          return prevOpen;
        }
        onOpenChange?.(nextOpen);
        return nextOpen;
      });
    },
    [onOpenChange]
  );

  const filteredOptions = useMemo(() => {
    const term = value?.trim().toLowerCase() ?? "";
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, value]);

  const updatePanelPos = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const zoom = getBodyZoom();
    const panelHeight = panel?.offsetHeight || 220;
    const gap = 8;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    if (spaceBelow < panelHeight + gap && spaceAbove > panelHeight + gap) {
      top = (rect.top - panelHeight - gap) / zoom;
    } else {
      top = (rect.bottom + gap) / zoom;
    }

    setPanelPos({
      top,
      left: rect.left / zoom,
      width: rect.width / zoom,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }

    const timer = window.setTimeout(updatePanelPos, 0);
    updatePanelPos();
    window.addEventListener("resize", updatePanelPos);
    window.addEventListener("scroll", updatePanelPos, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updatePanelPos);
      window.removeEventListener("scroll", updatePanelPos, true);
    };
  }, [open, filteredOptions.length, loading, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      updateOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, updateOpen]);

  const dropdownPanel =
    open && panelPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="z-[1000] bg-white dark:bg-neutral-20 border border-[#E2E2E2] dark:border-[#444444] rounded-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            style={{
              position: "fixed",
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
            }}
          >
            <div className="max-h-[220px] overflow-auto">
              {loading ? (
                <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                  불러오는 중...
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={`${label}-${String(option.value)}`}
                    type="button"
                    onClick={() => {
                      onChange?.(String(option.value));
                      updateOpen(false);
                    }}
                    className="cursor-pointer w-full h-[48px] px-4 flex items-center text-left hover:bg-neutral-10 dark:hover:bg-neutral-30 text-[14px] text-[#000] dark:text-neutral-80"
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                  {emptyText}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">{label}</label>
      <div
        ref={triggerRef}
        className="relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] h-[34px] bg-white dark:bg-neutral-20"
        onClick={() => updateOpen(true)}
      >
        <div className="flex flex-row items-center p-0 gap-[30px] w-full lg:w-[360px] h-[17px]">
          <input
            value={value ?? ""}
            onFocus={() => updateOpen(true)}
            onChange={(event) => {
              onChange?.(event.target.value);
              updateOpen(true);
            }}
            className="w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60"
            placeholder={placeholder}
          />
        </div>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="8"
          height="6"
          viewBox="0 0 8 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 1.87809e-07 0.647327 2.2346e-07L7.35267 8.0966e-07C7.76048 8.45312e-07 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z"
            fill="currentColor"
            className="text-[#000] dark:text-neutral-70"
          />
        </svg>
      </div>
      {dropdownPanel}
    </div>
  );
}

export function DateRange({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  startValue: Date | null;
  endValue: Date | null;
  onStartChange: (date: Date | null) => void;
  onEndChange: (date: Date | null) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      <div className="relative flex-1 lg:w-[175px]">
        <DatePicker value={startValue} onChange={onStartChange} className="cursor-pointer pr-10 w-full" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-neutral-60"
            />
          </svg>
        </div>
      </div>
      <span className="text-[14px] text-[#000] dark:text-neutral-80 hidden lg:inline">-</span>
      <div className="relative flex-1 lg:w-[175px]">
        <DatePicker value={endValue} onChange={onEndChange} className="cursor-pointer pr-10 w-full" />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-neutral-60"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function normalizeCustomerFilterOptions(
  payload: unknown,
  key: CustomerFilterOptionKey
): Option[] {
  const values = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
    ? [
        ...(Array.isArray((payload as { list?: unknown[] }).list) ? (payload as { list: unknown[] }).list : []),
        ...(Array.isArray((payload as { items?: unknown[] }).items) ? (payload as { items: unknown[] }).items : []),
        ...(Array.isArray((payload as Record<CustomerFilterOptionKey, unknown[]>)[key])
          ? (payload as Record<CustomerFilterOptionKey, unknown[]>)[key]
          : []),
      ]
    : [];

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).map((value) => ({ label: value, value }));
}

export function mergeOptions(primary: Option[], secondary: Option[]): Option[] {
  const merged = new Map<string, Option>();

  [...primary, ...secondary].forEach((option) => {
    const normalizedValue = String(option.value).trim();
    const normalizedLabel = option.label.trim();
    if (!normalizedValue || !normalizedLabel) return;
    const key = `${normalizedLabel}::${normalizedValue}`;
    if (!merged.has(key)) {
      merged.set(key, {
        label: normalizedLabel,
        value: normalizedValue,
      });
    }
  });

  return Array.from(merged.values());
}
