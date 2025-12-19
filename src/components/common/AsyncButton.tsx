"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import LoadingSpinner, { type LoadingSpinnerSize } from "./LoadingSpinner";

export type AsyncButtonVariant = "primary" | "secondary" | "ghost" | "auth";
export type AsyncButtonSize = "sm" | "md" | "lg";

type AsyncButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 중 표시할 텍스트 (없으면 스피너만 표시, 큰 버튼에서 사용 권장) */
  loadingText?: string;
  /** 버튼 변형 */
  variant?: AsyncButtonVariant;
  /** 버튼 크기 */
  size?: AsyncButtonSize;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 왼쪽 아이콘/요소 */
  leftIcon?: ReactNode;
  /** 오른쪽 아이콘/요소 */
  rightIcon?: ReactNode;
};

const sizeClasses: Record<AsyncButtonSize, string> = {
  sm: "h-[34px] text-[13px] px-3",
  md: "h-[40px] text-[14px] px-4",
  lg: "h-[48px] text-[15px] px-5",
};

const spinnerSizeMap: Record<AsyncButtonSize, LoadingSpinnerSize> = {
  sm: "xs",
  md: "sm",
  lg: "sm",
};

const variantClasses: Record<AsyncButtonVariant, string> = {
  // 기본 primary 버튼 (primary 색상)
  primary: "bg-primary-60 text-neutral-10 hover:bg-primary-70",
  // secondary 버튼 (어두운 배경)
  secondary: "bg-neutral-20 text-neutral-80 hover:bg-neutral-30",
  // ghost 버튼 (투명 배경)
  ghost: "bg-transparent text-neutral-60 hover:text-neutral-80 hover:bg-neutral-10",
  // 인증 폼용 버튼 (기존 로그인/회원가입 스타일)
  auth: "bg-[#252525] text-[#D0D0D0] hover:bg-[#2F2F2F]",
};

// TODO: 버튼 variant에 따른 스피너 색상 매핑 (현재는 default 사용)
// const spinnerVariantMap: Record<AsyncButtonVariant, "default" | "white" | "primary" | "neutral"> = {
//   primary: "white",
//   secondary: "neutral",
//   ghost: "neutral",
//   auth: "white",
// };

/**
 * 비동기 작업을 위한 공용 버튼 컴포넌트
 * 
 * @example
 * // 기본 사용 - 로딩 시 스피너만 표시 (작은 버튼에 권장)
 * <AsyncButton loading={isSubmitting}>저장</AsyncButton>
 * 
 * @example
 * // 로딩 텍스트 지정 - 큰 버튼(로그인 등)에서 사용
 * <AsyncButton loading={isSubmitting} loadingText="처리 중...">다음</AsyncButton>
 * 
 * @example
 * // 인증 폼 스타일 (fullWidth + loadingText 권장)
 * <AsyncButton variant="auth" loading={loading} loadingText="로그인 중..." fullWidth>로그인</AsyncButton>
 * 
 * @example
 * // 아이콘 포함
 * <AsyncButton leftIcon={<PhoneIcon />} loading={loading}>본인인증</AsyncButton>
 */
const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      variant = "auth",
      size = "md",
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const spinnerSize = spinnerSizeMap[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          // 기본 스타일
          "inline-flex items-center justify-center gap-2 rounded-[5px] font-semibold transition-colors",
          "cursor-pointer",
          // 비활성화 스타일
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // 크기
          sizeClasses[size],
          // 변형
          variantClasses[variant],
          // 전체 너비
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={spinnerSize} />
            {loadingText}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

AsyncButton.displayName = "AsyncButton";

export default AsyncButton;

