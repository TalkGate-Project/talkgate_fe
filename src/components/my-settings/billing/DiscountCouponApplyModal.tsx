"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import BaseModal from "@/components/common/BaseModal";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { subscriptionQueryKeys } from "@/hooks/useSubscription";
import { showErrorModal } from "@/lib/errorModalEvents";
import { SubscriptionService } from "@/services/subscription";
import type { DiscountCouponInfo, Subscription } from "@/types/subscription";
import { formatAmountKR, formatCouponCodeForDisplay } from "@/utils/format";

type DiscountCouponApplyModalProps = {
  projectId: string | number;
  subscription: Subscription;
  onClose: () => void;
};

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;
  return (error as { data?: { code?: string } }).data?.code;
}

export default function DiscountCouponApplyModal({
  projectId,
  subscription,
  onClose,
}: DiscountCouponApplyModalProps) {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<DiscountCouponInfo | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const normalizedCode = couponCode.trim();
  const isBusy = isChecking || isApplying;

  const handleCouponCodeChange = (value: string) => {
    setCouponCode(formatCouponCodeForDisplay(value).slice(0, 30));
    setCouponInfo(null);
    setValidationMessage("");
  };

  const handleCheck = async () => {
    if (!normalizedCode || isBusy) return;
    setIsChecking(true);
    setCouponInfo(null);
    setValidationMessage("");

    try {
      const response = await SubscriptionService.getDiscountCouponInfo(
        {
          code: normalizedCode,
          planId: subscription.plan.id,
          billingCycle: subscription.billingCycle,
        },
        { "x-project-id": String(projectId) }
      );
      const info = response.data.data;
      if (!info.canUse) {
        setValidationMessage("유효하지 않은 쿠폰입니다.");
        return;
      }
      setCouponInfo(info);
    } catch (error) {
      console.error("Failed to check discount coupon:", error);
      setValidationMessage("유효하지 않은 쿠폰입니다.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleApply = async () => {
    if (!couponInfo || isBusy) return;
    setIsApplying(true);

    try {
      const response = await SubscriptionService.applyDiscountCoupon(
        { code: couponInfo.code || normalizedCode },
        { "x-project-id": String(projectId) }
      );
      const updatedSubscription = response.data.data.subscription;
      const projectQueryId = String(projectId);
      const appliedCouponCode =
        updatedSubscription.discountCoupon?.code ?? couponInfo.code;

      // 모달의 쿠폰 조회는 항상 서버에서 검증한다. 적용 성공 시에만 현재 결제 화면이
      // 이미 받은 응답을 재사용하도록 별도의 표시용 쿼리 캐시를 갱신한다.
      queryClient.setQueryData(
        subscriptionQueryKeys.discountCouponInfo(
          projectQueryId,
          appliedCouponCode,
          updatedSubscription.plan.id,
          updatedSubscription.billingCycle,
          isDemoMode
        ),
        couponInfo
      );
      queryClient.setQueryData(
        subscriptionQueryKeys.detail(projectQueryId, isDemoMode),
        updatedSubscription
      );
      onClose();
      showErrorModal({
        type: "success",
        headline: "할인쿠폰이 적용되었습니다.",
        description: "다음 자동 갱신 결제부터 할인이 적용됩니다.",
        hideCancel: true,
      });
    } catch (error) {
      console.error("Failed to apply discount coupon:", error);
      const errorCode = getErrorCode(error);
      const message =
        errorCode === "INVALID_DISCOUNT_COUPON"
          ? "쿠폰 코드를 확인해 주세요."
          : errorCode === "DISCOUNT_COUPON_EXPIRED"
            ? "사용 기간이 지난 쿠폰입니다."
            : errorCode === "DISCOUNT_COUPON_ALREADY_USED"
              ? "이미 사용한 할인쿠폰입니다."
              : errorCode === "SUBSCRIPTION_INACTIVE"
                ? "활성 구독에만 할인쿠폰을 적용할 수 있습니다."
                : errorCode === "ALREADY_CANCELLED"
                  ? "취소된 구독에는 할인쿠폰을 적용할 수 없습니다."
                  : errorCode === "FORBIDDEN"
                    ? "프로젝트 관리자만 할인쿠폰을 적용할 수 있습니다."
                    : "잠시 후 다시 시도해 주세요.";
      showErrorModal({
        type: "error",
        headline: "할인쿠폰을 적용하지 못했습니다.",
        description: message,
        hideCancel: true,
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <BaseModal
      onClose={() => !isBusy && onClose()}
      closeOnOverlayClick={!isBusy}
      overlayClassName="bg-black/30"
      ariaLabel="할인쿠폰 적용"
      containerClassName="w-full max-w-[440px] overflow-hidden rounded-[14px] bg-card shadow-[0_13px_61px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center justify-between px-6 py-5">
        <h2 className="text-[18px] font-bold text-foreground">할인쿠폰 적용하기</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          aria-label="닫기"
          className="cursor-pointer text-neutral-50 transition-colors hover:text-foreground disabled:cursor-not-allowed"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="rounded-[10px] bg-neutral-10 p-4 dark:bg-neutral-20">
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => handleCouponCodeChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCheck();
              }}
              maxLength={30}
              disabled={isBusy}
              placeholder="할인쿠폰 코드를 입력해주세요"
              className="h-10 min-w-0 flex-1 rounded-[5px] border border-border bg-card px-3 text-[14px] text-foreground outline-none placeholder:text-neutral-50 focus:border-neutral-50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleCheck}
              disabled={!normalizedCode || isBusy}
              className="h-10 shrink-0 cursor-pointer rounded-[5px] border border-border bg-card px-4 text-[13px] font-semibold text-foreground hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-30"
            >
              {isChecking ? "조회 중" : "할인쿠폰 조회"}
            </button>
          </div>

          {validationMessage && (
            <p className="mt-2 text-[13px] text-red-500">{validationMessage}</p>
          )}

          {couponInfo && (
            <div className="mt-3 text-[13px]">
              <p className="mb-3 font-medium text-[#00B95C]">
                유효한 할인쿠폰입니다.
              </p>
              <dl className="grid grid-cols-[92px_1fr] gap-y-2">
                {couponInfo.discountType === "percentage" && (
                  <>
                    <dt className="text-neutral-60">할인율</dt>
                    <dd className="font-semibold text-[#3F7FFF]">
                      {couponInfo.discountValue}%
                    </dd>
                  </>
                )}
                <dt className="text-neutral-60">할인금액</dt>
                <dd className="font-semibold text-[#3F7FFF]">
                  {formatAmountKR(couponInfo.pricing.discountAmount)}
                </dd>
                <dt className="text-neutral-60">할인 적용 기간</dt>
                <dd className="font-semibold text-[#3F7FFF]">
                  앞으로 {couponInfo.durationMonths}개월간 할인 적용
                </dd>
                <dt className="text-neutral-60">다음 결제 금액</dt>
                <dd className="font-semibold text-[#3F7FFF]">
                  {formatAmountKR(couponInfo.pricing.finalPrice)}
                </dd>
              </dl>
            </div>
          )}
        </div>
        <p className="mt-3 text-[12px] text-neutral-60">
          할인은 현재 기간이 아닌 다음 자동 갱신 결제부터 적용됩니다.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="h-10 cursor-pointer rounded-[5px] border border-border px-4 text-[13px] font-semibold text-foreground hover:bg-neutral-10 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-20"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!couponInfo || isBusy}
          className="h-10 cursor-pointer rounded-[5px] bg-neutral-90 px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-10"
        >
          {isApplying ? "적용 중" : "적용"}
        </button>
      </div>
    </BaseModal>
  );
}
