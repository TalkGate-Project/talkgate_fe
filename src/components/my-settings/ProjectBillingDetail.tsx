"use client";

import { useState, useEffect } from "react";
import { useBilling } from "@/hooks/useBilling";
import {
  useSubscription,
  usePaymentHistory,
  useSubscriptionPlans,
} from "@/hooks/useSubscription";
import { setSelectedProjectId, getSelectedProjectId } from "@/lib/project";
import SubscriptionPlanSelectModal from "./SubscriptionPlanSelectModal";
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

  // 비즈니스 로직 훅
  const {
    isUpdatingPlan,
    downloadingPaymentId,
    handlePlanSelect,
    handleCancelSubscription,
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
    <div className="space-y-0">
      <ProjectBillingHeader
        projectName={projectName}
        subscription={subscription}
        isLoading={isLoading}
        onBack={onBack}
        onPlanChange={() => setIsPlanModalOpen(true)}
        onCancelSubscription={handleCancelSubscription}
      />

      <PaymentInfoSection
        subscription={subscription}
        activeBillingInfo={activeBillingInfo}
        subscriptionLoading={subscriptionLoading}
        billingLoading={billingLoading}
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
    </div>
  );
}
