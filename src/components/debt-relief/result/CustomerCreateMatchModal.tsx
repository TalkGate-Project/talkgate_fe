"use client";

import { useState } from "react";
import CustomerCreateModal from "@/components/customers/CustomerCreateModal";
import { AnalysisService } from "@/services/analysis";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  customerName: string;
  analysisId: string;
  projectId: string;
  onMatched: () => void;
};

/**
 * 진단 상세의 "새 고객 정보 추가" 플로우.
 * 고객 등록은 /customers의 고객등록 모달을 그대로 재사용하고, 등록이 끝나면
 * 생성된 고객을 곧바로 이 진단에 연동한다.
 */
export default function CustomerCreateMatchModal({
  open,
  onClose,
  onBack,
  customerName,
  analysisId,
  projectId,
  onMatched,
}: Props) {
  const [matching, setMatching] = useState(false);

  const handleCreated = async (createdCustomerId: number | null) => {
    if (!createdCustomerId) {
      console.error("Customer create returned no id");
      showErrorModal({
        headline: "고객은 등록되었지만 연동에 실패했습니다.",
        description: "고객 목록에서 등록된 고객을 확인한 뒤 기존 고객 연동으로 다시 시도해주세요.",
      });
      return;
    }

    setMatching(true);
    try {
      await AnalysisService.matchCustomer(Number(analysisId), {
        projectId,
        customerId: createdCustomerId,
      });
      onMatched();
    } catch (error: unknown) {
      console.error("Failed to match created customer:", error);
      const code = (error as { data?: { code?: string } })?.data?.code;
      if (code === "ANALYSIS_ALREADY_CONNECTED") {
        showErrorModal({
          headline: "이미 다른 고객과 연결된 진단입니다.",
          description: "새로고침 후 다시 시도해주세요.",
        });
      } else {
        showErrorModal({
          headline: "고객은 등록되었지만 연동에 실패했습니다.",
          description: "잠시 후 기존 고객 연동으로 다시 시도해주세요.",
        });
      }
    } finally {
      setMatching(false);
    }
  };

  return (
    <CustomerCreateModal
      open={open}
      onClose={() => !matching && onClose()}
      onBack={() => !matching && onBack()}
      initialName={customerName}
      projectId={projectId}
      onCreated={handleCreated}
    />
  );
}
