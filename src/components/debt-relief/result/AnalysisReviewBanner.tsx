"use client";

import { useState } from "react";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import type { DiagnosisDetail, RecommendedProcedure } from "@/types/debtRelief";
import AnalysisReviewDecisionModal from "./AnalysisReviewDecisionModal";
import ProcedureSelectModal from "./ProcedureSelectModal";

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
  const [procedureSelectOpen, setProcedureSelectOpen] = useState(false);
  const [procedureSubmitting, setProcedureSubmitting] = useState(false);

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
        setDecisionMode(null);
        // 결제 정보가 이미 입력돼 있는 건은 수락 직후 추적할 절차를 바로 정할 수 있게 한다.
        // onDecided(refetch)는 상태가 바뀌어 이 배너 자체가 사라지게 만들므로, 절차 선택
        // 모달이 뜨는 동안은 미루고 모달이 닫힐 때(선택 완료/취소) 호출한다.
        // defaultProcedure가 없으면(procedureScores 없음) 모달이 렌더링되지 않아 onDecided가
        // 영영 호출되지 않는 채로 멈추므로, 그 경우엔 절차 선택을 건너뛴다.
        if (detail.feePlan && defaultProcedure) {
          setProcedureSelectOpen(true);
        } else {
          onDecided();
        }
      } else {
        await DebtReliefService.rejectSharedAnalysis(projectId, detail.id, message || undefined);
        setDecisionMode(null);
        onDecided();
      }
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

  const defaultProcedure =
    detail.procedureScores.find((score) => score.recommended)?.procedure ??
    detail.procedureScores[0]?.procedure;

  const closeProcedureSelect = () => {
    if (procedureSubmitting) return;
    setProcedureSelectOpen(false);
    onDecided();
  };

  const handleConfirmProcedure = async (procedure: RecommendedProcedure) => {
    if (!projectId) return;
    setProcedureSubmitting(true);
    try {
      await DebtReliefService.updateProcedureProgress(projectId, detail.id, {
        trackingProcedure: procedure,
      });
      setProcedureSelectOpen(false);
      onDecided();
    } catch (error) {
      console.error("Failed to set tracking procedure:", error);
      showErrorModal({
        headline: "진행 절차를 설정하지 못했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setProcedureSubmitting(false);
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

      {defaultProcedure ? (
        <ProcedureSelectModal
          open={procedureSelectOpen}
          onClose={closeProcedureSelect}
          onConfirm={handleConfirmProcedure}
          procedureScores={detail.procedureScores}
          defaultProcedure={defaultProcedure}
          submitting={procedureSubmitting}
        />
      ) : null}
    </>
  );
}
