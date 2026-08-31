"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectType } from "@/hooks/useProjectType";
import { AnalysisService } from "@/services/analysis";
import { DebtReliefService } from "@/services/debtRelief";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { AnalysisDelivery } from "@/types/analysis";

function TrashOutlineIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeDeliveries(data: AnalysisDelivery[] | AnalysisDelivery | null | undefined): AnalysisDelivery[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function hasActiveDelivery(deliveries: AnalysisDelivery[]): boolean {
  return deliveries.some((delivery) => delivery.status === "delivered");
}

type Props = {
  diagnosisId: string;
  projectId: string | null;
  /** 공유(납품)받은 분석 건 여부 — 변호사 상세에서 삭제 버튼 숨김 판별 */
  isShared: boolean;
};

/**
 * 진단 상세 하단 우측 삭제 버튼.
 * - 공유(납품) 중인 진단(isShared=true)이면 숨김, 아니면 노출.
 */
export default function ResultDeleteButton({ diagnosisId, projectId, isShared }: Props) {
  const router = useRouter();
  const { isAnalysis, ready: projectTypeReady } = useProjectType();
  const [checking, setChecking] = useState(false);

  const showButton = projectTypeReady && Boolean(projectId) && !isShared;

  if (!showButton || !projectId) return null;

  const confirmAndDelete = () => {
    showConfirmModal({
      title: "진단 삭제",
      headline: "이 진단을 삭제하시겠습니까?",
      message: "삭제된 진단은 복구할 수 없습니다.",
      type: "warning",
      confirmText: "삭제",
      cancelText: "취소",
      onConfirm: async () => {
        try {
          await DebtReliefService.deleteDiagnosis(projectId, diagnosisId);
          router.push("/debt-relief");
        } catch (error) {
          console.error("Failed to delete diagnosis:", error);
          showErrorModal({
            title: "삭제 실패",
            headline: "진단을 삭제하지 못했습니다.",
            description: "잠시 후 다시 시도해주세요.",
            hideCancel: true,
          });
        }
      },
    });
  };

  // 공유 철회 UI가 별도로 없어 "철회한 뒤 다시 시도" 안내는 사용자가 실행할 방법이 없는
  // 막다른 길이었다 — 실행 불가능한 다음 행동을 지시하지 않도록 안내만으로 축소.
  const showSharedDeleteBlockedModal = () => {
    showErrorModal({
      type: "info",
      title: "삭제 불가",
      headline: "공유 중인 진단은 삭제할 수 없습니다.",
      description: "공유받은 프로젝트와의 연결이 유지되는 동안은 삭제할 수 없습니다.",
      hideCancel: true,
    });
  };

  const handleDelete = async () => {
    if (checking) return;

    // 영업점: 활성 공유가 있으면 삭제 API가 거부되므로 철회 안내만 표시
    if (isAnalysis) {
      setChecking(true);
      try {
        const response = await AnalysisService.deliveries(Number(diagnosisId), projectId);
        if (hasActiveDelivery(normalizeDeliveries(response.data?.data))) {
          showSharedDeleteBlockedModal();
          return;
        }
      } catch (error) {
        console.error("Failed to check analysis deliveries before delete:", error);
        showErrorModal({
          title: "삭제 불가",
          headline: "공유 상태를 확인하지 못했습니다.",
          description: "잠시 후 다시 시도해주세요.",
          hideCancel: true,
        });
        return;
      } finally {
        setChecking(false);
      }
    }

    confirmAndDelete();
  };

  return (
    <div className="mx-6 flex justify-end border-t border-neutral-30 pt-3 md:mx-0 md:border-t-0 md:pt-0">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={checking}
        aria-label="진단 삭제"
        className="cursor-pointer inline-flex items-center justify-center gap-2.5 h-[34px] px-3 py-1.5 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-danger-40 hover:bg-neutral-10 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <TrashOutlineIcon />
        삭제
      </button>
    </div>
  );
}
