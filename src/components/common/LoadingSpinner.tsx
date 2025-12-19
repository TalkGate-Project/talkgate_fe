"use client";

import { cn } from "@/utils/cn";

export type LoadingSpinnerSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type LoadingSpinnerVariant = "default" | "primary" | "white" | "neutral";

type LoadingSpinnerProps = {
  /** 스피너 크기 */
  size?: LoadingSpinnerSize;
  /** 스피너 색상 변형 */
  variant?: LoadingSpinnerVariant;
  /** 추가 클래스명 */
  className?: string;
  /** 접근성을 위한 aria-label */
  "aria-label"?: string;
};

const sizeClasses: Record<LoadingSpinnerSize, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-10 w-10 border-4",
  "2xl": "h-12 w-12 border-4",
};

const variantClasses: Record<LoadingSpinnerVariant, { border: string; borderTop: string }> = {
  default: {
    border: "border-neutral-20",
    borderTop: "border-t-primary-60",
  },
  primary: {
    border: "border-primary-20",
    borderTop: "border-t-primary-60",
  },
  white: {
    border: "border-white/30",
    borderTop: "border-t-white",
  },
  neutral: {
    border: "border-neutral-30",
    borderTop: "border-t-neutral-70",
  },
};

/**
 * 공용 로딩 스피너 컴포넌트
 * 
 * @example
 * // 기본 사용
 * <LoadingSpinner />
 * 
 * @example
 * // 크기 지정
 * <LoadingSpinner size="lg" />
 * 
 * @example
 * // 색상 변형
 * <LoadingSpinner variant="white" />
 * 
 * @example
 * // 커스텀 클래스
 * <LoadingSpinner className="mx-auto" />
 */
export default function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  "aria-label": ariaLabel = "로딩 중",
}: LoadingSpinnerProps) {
  const variantStyle = variantClasses[variant];

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantStyle.border,
        variantStyle.borderTop,
        className
      )}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

