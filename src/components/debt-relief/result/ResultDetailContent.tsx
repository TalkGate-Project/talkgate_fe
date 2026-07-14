"use client";

import { useEffect, useState } from "react";
import { useDiagnosisDetail } from "@/hooks/useDebtReliefHub";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { ProcedureStep } from "@/types/debtRelief";
import ResultAnchorNav, { type AnchorSection } from "./ResultAnchorNav";
import ResultHeader from "./ResultHeader";
import SectionCard from "./SectionCard";
import SectionAiRecommendation from "./SectionAiRecommendation";
import SectionProcedureScores from "./SectionProcedureScores";
import SectionDebtStatus from "./SectionDebtStatus";
import SectionRepaymentPlan from "./SectionRepaymentPlan";
import SectionCounselMents from "./SectionCounselMents";
import SectionProcedureGuide from "./SectionProcedureGuide";
import SectionSmsSend from "./SectionSmsSend";

const SECTION_IDS = ["overview", "scores", "debt", "repayment", "ments", "guide", "sms"];

export default function ResultDetailContent({ diagnosisId }: { diagnosisId: string }) {
  const { detail, loading, refetch } = useDiagnosisDetail(diagnosisId);
  const [projectId] = useSelectedProjectId();
  const [activeId, setActiveId] = useState("overview");

  const handleSetCurrentStep = async (step: ProcedureStep) => {
    if (!projectId || step.stepId == null || !detail) return;
    try {
      await DebtReliefService.updateProcedureProgress(projectId, diagnosisId, {
        trackingProcedure: detail.recommendedProcedure,
        currentProcedureStep: step.stepId,
      });
    } catch (error) {
      console.error("Failed to update procedure progress:", error);
      showErrorModal({
        headline: "단계 저장에 실패했습니다.",
        description: "화면에는 반영됐지만 저장되지 않았을 수 있어요. 잠시 후 다시 시도해주세요.",
      });
    }
  };

  // 스크롤 스파이: 화면 상단에 걸린 섹션을 활성 처리
  // 데스크톱은 전역 헤더(54px) + fixed 서브헤더(48px), 모바일은 전역 헤더(54px)만 고려
  useEffect(() => {
    if (!detail) return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: `${isDesktop ? "-102px" : "-64px"} 0px -55% 0px`, threshold: 0 }
    );

    SECTION_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [detail]);

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-[400px] grid place-items-center">
        <EmptyState message="진단 결과를 불러오지 못했습니다." error />
      </div>
    );
  }

  const sections: AnchorSection[] = [
    { id: "overview", label: detail.recommendation.title },
    { id: "scores", label: "절차별 성공 가능성" },
    { id: "debt", label: "채무현황" },
    { id: "repayment", label: "예상 변제 계획" },
    { id: "ments", label: "추천 상담 멘트" },
    { id: "guide", label: "절차 안내" },
    { id: "sms", label: "고객 문자 전송" },
  ];

  return (
    <>
      {/* 데스크톱만 fixed 서브헤더(48px) + 허브와 비슷한 상단 여백(36px) → 84px 확보.
          모바일은 탭 바가 문서 흐름 안에 있으므로 별도 상단 여백이 필요 없다. */}
      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-[84px] pb-[calc(3rem+env(safe-area-inset-bottom))] flex flex-col gap-0 md:gap-9">
      {/* 헤더 + 탭 바 + AI 분석 추천 (같은 카드).
          ResultAnchorNav는 모바일에선 이 자리(제목 행 아래) 일반 흐름으로, 데스크톱에선
          자체 md:fixed 스타일로 전역 헤더 바로 아래 전체 폭에 고정된다. */}
      <SectionCard id="overview" compactTop>
        <ResultHeader detail={detail} projectId={projectId} onCustomerMatchChange={refetch} />
        <div className="mt-3 md:mt-0">
          <ResultAnchorNav sections={sections} activeId={activeId} onNavigate={scrollTo} />
        </div>
        <SectionAiRecommendation detail={detail} />
      </SectionCard>

      <SectionCard id="scores" compactTop topDivider>
        <SectionProcedureScores detail={detail} />
      </SectionCard>

      <SectionCard id="debt" compactTop>
        <SectionDebtStatus detail={detail} />
      </SectionCard>

      <SectionCard id="repayment" compactTop>
        <SectionRepaymentPlan detail={detail} />
      </SectionCard>

      <SectionCard id="ments" compactTop>
        <SectionCounselMents detail={detail} projectId={projectId} />
      </SectionCard>

      <SectionCard id="guide" compactTop>
        <SectionProcedureGuide detail={detail} onSetCurrentStep={handleSetCurrentStep} />
      </SectionCard>

      <SectionCard id="sms" title="고객 문자 전송" compactTop>
        <SectionSmsSend detail={detail} />
      </SectionCard>
      </div>
    </>
  );
}
