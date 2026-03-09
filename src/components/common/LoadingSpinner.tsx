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
  sm: "h-4 w-4 border-[3px]",
  md: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-[3px]",
  xl: "h-10 w-10 border-4",
  "2xl": "h-12 w-12 border-4",
};

type VariantStyle = {
  borderColor: string;
  borderTopColor: string;
};

const variantStyles: Record<LoadingSpinnerVariant, VariantStyle> = {
  default: {
    borderColor: "#e2e2e2", // neutral-30
    borderTopColor: "#595959", // neutral-70
  },
  primary: {
    borderColor: "#d0d0d0", // neutral-40
    borderTopColor: "#00e272", // primary-60
  },
  white: {
    borderColor: "rgba(255, 255, 255, 0.55)",
    borderTopColor: "#ffffff",
  },
  neutral: {
    borderColor: "#b0b0b0", // neutral-50
    borderTopColor: "#474747", // neutral-80
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
  const variantStyle = variantStyles[variant];

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: variantStyle.borderColor,
        borderTopColor: variantStyle.borderTopColor,
      }}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

