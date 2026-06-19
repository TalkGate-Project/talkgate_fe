"use client";

import { useState, useEffect } from "react";
import { useBilling } from "@/hooks/useBilling";
import {
  useSubscription,
  usePaymentHistory,
  useSubscriptionPlans,
  useSubscriptionDiscountCouponInfo,
} from "@/hooks/useSubscription";
import { setSelectedProjectId, getSelectedProjectId } from "@/lib/project";
import SubscriptionPlanSelectModal from "./SubscriptionPlanSelectModal";
import ReactivateSubscriptionModal from "./ReactivateSubscriptionModal";
import ProjectBillingHeader from "./billing/ProjectBillingHeader";
import PaymentInfoSection from "./billing/PaymentInfoSection";
import PaymentHistorySection from "./billing/PaymentHistorySection";
import { useProjectBilling } from "@/hooks/useProjectBilling";

interface ProjectBillingDetailProps {
  projectId: string | number;
  projectName: string;
  onBack: () => void;
}

export default function ProjectBillingDetail({
  projectId,
  projectName,
  onBack,
}: ProjectBillingDetailProps) {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);

  // 프로젝트 선택 (구독 정보를 가져오기 위해)
  useEffect(() => {
    const currentProjectId = getSelectedProjectId();
    setSelectedProjectId(projectId);

    return () => {
      // 이전 프로젝트로 복원
      if (currentProjectId) {
        setSelectedProjectId(currentProjectId);
      }
    };
  }, [projectId]);

  // API 데이터 가져오기
  const { activeBillingInfo, loading: billingLoading } = useBilling();
  const {
    subscription,
    loading: subscriptionLoading,
    refetch: refetchSubscription,
  } = useSubscription();
  const {
    payments,
    loading: paymentsLoading,
    refetch: refetchPayments,
  } = usePaymentHistory();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const {
    discountCouponInfo,
    loading: discountCouponLoading,
  } = useSubscriptionDiscountCouponInfo(subscription);

  // 비즈니스 로직 훅
  const {
    isUpdatingPlan,
    isReactivating,
    downloadingPaymentId,
    handlePlanSelect,
    handleCancelSubscription,
    handleReactivateSubscription,
    handleDownloadReceipt,
  } = useProjectBilling({
    projectId,
    projectName,
    subscription,
    plans,
    refetchSubscription,
    refetchPayments,
  });

  const isLoading = subscriptionLoading || billingLoading;
  const billingCycle = subscription?.billingCycle ?? "monthly";

  return (
    <div className="space-y-0 md:space-y-9">
      <ProjectBillingHeader
        projectName={projectName}
        subscription={subscription}
        isLoading={isLoading}
        onBack={onBack}
        onPlanChange={() => setIsPlanModalOpen(true)}
        onCancelSubscription={handleCancelSubscription}
        onReactivateSubscription={() => setIsReactivateModalOpen(true)}
      />

      <PaymentInfoSection
        subscription={subscription}
        activeBillingInfo={activeBillingInfo}
        discountCouponInfo={discountCouponInfo}
        subscriptionLoading={subscriptionLoading}
        billingLoading={billingLoading}
        discountCouponLoading={discountCouponLoading}
      />

      <PaymentHistorySection
        payments={payments}
        loading={paymentsLoading}
        onDownloadReceipt={handleDownloadReceipt}
        downloadingPaymentId={downloadingPaymentId}
      />

      <SubscriptionPlanSelectModal
        isOpen={isPlanModalOpen}
        plans={plans}
        currentPlanId={subscription?.plan?.id ?? null}
        currentBillingCycle={billingCycle}
        projectId={projectId}
        projectName={projectName}
        isLoading={plansLoading || isUpdatingPlan}
        onClose={() => setIsPlanModalOpen(false)}
        onSelect={(planId, billingCycle) => {
          setIsPlanModalOpen(false);
          handlePlanSelect(planId, billingCycle);
        }}
      />

      <ReactivateSubscriptionModal
        isOpen={isReactivateModalOpen}
        onClose={() => setIsReactivateModalOpen(false)}
        onConfirm={async () => {
          await handleReactivateSubscription();
          setIsReactivateModalOpen(false);
        }}
        isLoading={isReactivating}
      />
    </div>
  );
}
