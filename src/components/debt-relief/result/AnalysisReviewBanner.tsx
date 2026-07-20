"use client";

import { useState } from "react";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { DiagnosisDetail } from "@/types/debtRelief";
import AnalysisReviewDecisionModal from "./AnalysisReviewDecisionModal";

type Props = {
  detail: DiagnosisDetail;
  projectId: string | null;
  onDecided: () => void;
};

const ACTION_BTN_BASE =
  "cursor-pointer inline-flex items-center justify-center h-[34px] w-[72px] rounded-[5px] text-[14px] font-semibold leading-[17px] tracking-[-0.02em] whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed";

// 영업점이 전달(공유)한 분석 건이 검토중 상태일 때, 변호사 프로젝트에서 수락/거절을 요청하는 배너.
// 피그마: 검토중 + deliveryStatus === "delivered"일 때만 노출.
export default function AnalysisReviewBanner({ detail, projectId, onDecided }: Props) {
  const [decisionMode, setDecisionMode] = useState<"accept" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const closeDecisionModal = () => {
    if (submitting) return;
    setDecisionMode(null);
  };

  const handleSubmitDecision = async (message: string) => {
    if (!projectId || !decisionMode || submitting) return;
    setSubmitting(true);
    try {
      if (decisionMode === "accept") {
        await DebtReliefService.acceptSharedAnalysis(projectId, detail.id, message || undefined);
      } else {
        await DebtReliefService.rejectSharedAnalysis(projectId, detail.id, message || undefined);
      }
      setDecisionMode(null);
      onDecided();
    } catch (error) {
      console.error(`Failed to ${decisionMode} shared analysis:`, error);
      showErrorModal({
        headline:
          decisionMode === "accept" ? "수락 처리에 실패했습니다." : "거절 처리에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-h-[72px] rounded-[12px] border border-neutral-30 bg-card shadow-[0px_3px_4px_rgba(9,30,86,0.1)] dark:shadow-none px-5 md:px-12 py-4 md:py-0">
        <div>
          <p className="text-[14px] font-bold leading-[17px] tracking-[-0.02em] text-black dark:text-foreground">
            분석 데이터 검토 요청
          </p>
          <p className="mt-1.5 text-[14px] font-normal leading-[17px] tracking-[-0.02em] text-neutral-80">
            영업팀이 전달한 AI 분석 결과를 검토하고 수락 또는 거절해 주세요.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setDecisionMode("reject")}
            disabled={submitting}
            className={`${ACTION_BTN_BASE} border border-danger-40 bg-card text-danger-40 hover:opacity-80`}
          >
            거절
          </button>
          <button
            type="button"
            onClick={() => setDecisionMode("accept")}
            disabled={submitting}
            className={`${ACTION_BTN_BASE} bg-neutral-90 text-neutral-20 hover:opacity-90`}
          >
            수락
          </button>
        </div>
      </div>

      <AnalysisReviewDecisionModal
        open={decisionMode !== null}
        mode={decisionMode ?? "accept"}
        submitting={submitting}
        onClose={closeDecisionModal}
        onSubmit={handleSubmitDecision}
      />
    </>
  );
}
