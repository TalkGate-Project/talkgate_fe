"use client";
import { useState } from "react";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: number; // px
  className?: string;
  ariaLabel?: string;
};

export default function Checkbox({ checked, onChange, disabled, size = 18, className, ariaLabel }: Props) {
  const [imgBroken, setImgBroken] = useState(false);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel || (checked ? "checked" : "unchecked")}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`inline-flex items-center justify-center ${disabled ? "opacity-50" : "cursor-pointer"} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {!imgBroken ? (
        // Use native img to bypass Next.js optimizer; more resilient to small PNGs
        <img
          src={checked ? "/checked.png" : "/unchecked.png"}
          alt={checked ? "checked" : "unchecked"}
          width={size}
          height={size}
          onError={() => setImgBroken(true)}
          style={{ display: "block" }}
        />
      ) : (
        // Fallback SVG if image fails to load
        checked ? (
          <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="0" y="0" width="24" height="24" rx="4" fill="#00E272" />
            <path d="M6 12l3.5 3.5L18 7" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="1" y="1" width="22" height="22" rx="4" fill="#fff" stroke="#9CA3AF" strokeWidth="2" />
          </svg>
        )
      )}
    </button>
  );
}


