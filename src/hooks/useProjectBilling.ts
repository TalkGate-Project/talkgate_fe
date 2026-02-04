import { useState } from "react";
import type { SubscriptionPlan, BillingCycle } from "@/types/subscription";
import type { Subscription } from "@/hooks/useSubscription";
import { SubscriptionService } from "@/services/subscription";
import { showConfirmModal } from "@/lib/confirmModalEvents";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { LANDING_URLS } from "@/lib/constants";

interface UseProjectBillingProps {
  projectId: string | number;
  projectName: string;
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  refetchSubscription: () => Promise<unknown>;
  refetchPayments: () => Promise<unknown>;
}

export function useProjectBilling({
  projectId,
  projectName,
  subscription,
  plans,
  refetchSubscription,
  refetchPayments,
}: UseProjectBillingProps) {
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<number | null>(null);

  // Basic/Pro 플랜 판단
  const isProPlan = (plan: SubscriptionPlan): boolean => {
    return /pro/i.test(plan.name);
  };

  const isBasicPlan = (plan: SubscriptionPlan): boolean => {
    return /basic/i.test(plan.name);
  };

  const handlePlanSelect = async (planId: number, newBillingCycle: BillingCycle) => {
    if (!subscription || !plans.length) return;

    const currentPlan = subscription.plan;
    const newPlan = plans.find((p) => p.id === planId);
    if (!newPlan) return;

    // 업그레이드 판단: Basic → Pro만 업그레이드
    const isUpgrade = isBasicPlan(currentPlan) && isProPlan(newPlan);

    if (isUpgrade) {
      // 업그레이드: checkout 페이지로 이동
      // billingCycle과 planType을 쿼리스트링에 포함하여 랜딩 페이지에서 바로 해당 플랜 선택 가능하도록 함
      const encodedProjectName = encodeURIComponent(projectName);
      const planType = isProPlan(newPlan) ? "pro" : "basic";
      const checkoutUrl = `${LANDING_URLS.PRICING}?step=checkout&projectId=${projectId}&projectName=${encodedProjectName}&billingCycle=${newBillingCycle}&planType=${planType}`;
      window.location.href = checkoutUrl;
      return;
    }

    // 단순 변경: API 호출
    const isSamePlan = currentPlan.id === newPlan.id;
    const isSameCycle = subscription.billingCycle === newBillingCycle;

    // 동일 플랜 + 동일 주기는 변경 불가 (모달에서 이미 처리되지만 안전장치)
    if (isSamePlan && isSameCycle) {
      return;
    }

    // 분기 → 월 (다른 플랜) 체크
    const isQuarterlyToMonthly = subscription.billingCycle === "quarterly" && newBillingCycle === "monthly";
    const isDifferentPlan = !isSamePlan;
    if (isQuarterlyToMonthly && isDifferentPlan) {
      showErrorModal({
        type: "error",
        headline: "변경할 수 없습니다",
        description: "해당 구독 상품으로는 변경할 수 없어요.",
        hideCancel: true,
      });
      return;
    }

    // 단순 변경 확인 모달
    const changeTypeMessage = isSamePlan
      ? "추가 결제 없이 다음 결제 주기에 적용됩니다."
      : "현재 사용 중인 기능은 이번 결제 주기 종료 시까지 그대로 유지되며,\n변경된 상품은 다음 갱신일에 적용됩니다.";

    showConfirmModal({
      type: "warning",
      title: "플랜 변경",
      headline: `[${newPlan.name}] 구독 상품을 변경할까요?`,
      message: `${changeTypeMessage}`,
      confirmText: "변경하기",
      cancelText: "취소",
      onConfirm: async () => {
        if (isUpdatingPlan) return;
        setIsUpdatingPlan(true);
        try {
          await SubscriptionService.changePlan(
            {
              newPlanId: planId,
              newBillingCycle: newBillingCycle,
            },
            { "x-project-id": String(projectId) }
          );
          await Promise.all([refetchSubscription(), refetchPayments()]);
          showErrorModal({
            type: "success",
            headline: "구독 상품이 성공적으로 변경되었습니다.",
            description: isSamePlan
              ? "추가 결제 없이 다음 결제 주기에 적용됩니다."
              : "변경된 상품은 다음 갱신일에 자동으로 적용됩니다.",
            hideCancel: true,
          });
        } catch (error) {
          console.error("Failed to change subscription plan:", error);
          showErrorModal({
            type: "error",
            headline: "플랜 변경에 실패했습니다.",
            description: "잠시 후 다시 시도해주세요.",
            hideCancel: true,
          });
        } finally {
          setIsUpdatingPlan(false);
        }
      },
    });
  };

  const handleCancelSubscription = () => {
    if (!subscription) return;
    showConfirmModal({
      title: "구독 취소",
      message:
        "자동 갱신을 중지하시겠습니까?\n만료일까지는 계속 이용 가능합니다.",
      confirmText: "구독 취소",
      cancelText: "취소",
      onConfirm: async () => {
        if (isCancelling) return;
        setIsCancelling(true);
        try {
          await SubscriptionService.cancel({ "x-project-id": String(projectId) });
          await refetchSubscription();
          showErrorModal({
            type: "success",
            headline: "구독이 취소되었습니다.",
            description: "만료일까지는 계속 이용할 수 있습니다.",
            hideCancel: true,
          });
        } catch (error) {
          console.error("Failed to cancel subscription:", error);
          showErrorModal({
            type: "error",
            headline: "구독 취소에 실패했습니다.",
            description: "잠시 후 다시 시도해주세요.",
            hideCancel: true,
          });
        } finally {
          setIsCancelling(false);
        }
      },
    });
  };

  const handleReactivateSubscription = async () => {
    if (!subscription || isReactivating) return;
    setIsReactivating(true);
    try {
      await SubscriptionService.reactivate({ "x-project-id": String(projectId) });
      await refetchSubscription();
      showErrorModal({
        type: "success",
        headline: "구독이 활성화되었습니다.",
        description: "결제 예정일에 자동으로 결제가 진행됩니다.",
        hideCancel: true,
      });
    } catch (error: any) {
      console.error("Failed to reactivate subscription:", error);
      const errorCode = error?.data?.code;
      if (errorCode === "INVALID_BILLING_KEY") {
        showErrorModal({
          type: "error",
          headline: "결제 수단을 등록해주세요.",
          description: "구독을 활성화하려면 결제 수단이 필요합니다.",
          hideCancel: true,
        });
      } else {
        showErrorModal({
          type: "error",
          headline: "구독 활성화에 실패했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          hideCancel: true,
        });
      }
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    if (downloadingPaymentId) return;
    setDownloadingPaymentId(paymentId);
    try {
      const res = await SubscriptionService.getPaymentReceipt(paymentId, {
        "x-project-id": String(projectId),
      });
      const receiptUrl = res.data.data.receiptUrl;
      if (!receiptUrl) {
        showErrorModal({
          type: "error",
          headline: "영수증을 생성하지 못했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          hideCancel: true,
        });
        return;
      }

      // 모바일 디바이스 감지
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 모바일에서는 window.open을 사용하여 새 창에서 열기
        // iOS Safari와 Android Chrome 모두에서 작동
        const newWindow = window.open(receiptUrl, "_blank", "noopener,noreferrer");
        
        // window.open이 실패한 경우 (팝업 차단 등), 직접 링크를 클릭하는 방식으로 대체
        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
          // 대체 방법: 직접 링크 생성 및 클릭
          const link = document.createElement("a");
          link.href = receiptUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          // 모바일에서도 작동하도록 스타일 추가
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          // 클릭 후 링크 제거
          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);
        }
      } else {
        // 데스크톱에서는 기존 방식 사용
        const link = document.createElement("a");
        link.href = receiptUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
    } catch (error) {
      console.error("Failed to fetch receipt:", error);
      showErrorModal({
        type: "error",
        headline: "영수증 다운로드에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
        hideCancel: true,
      });
    } finally {
      setDownloadingPaymentId(null);
    }
  };

  return {
    isUpdatingPlan,
    isCancelling,
    isReactivating,
    downloadingPaymentId,
    handlePlanSelect,
    handleCancelSubscription,
    handleReactivateSubscription,
    handleDownloadReceipt,
  };
}
