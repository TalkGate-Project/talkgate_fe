"use client";

import { useEffect, useState } from "react";
import { useDiagnosisDetail } from "@/hooks/useDebtReliefHub";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { useProjectType } from "@/hooks/useProjectType";
import { DebtReliefService } from "@/services/debtRelief";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import {
  DIAGNOSIS_PROCEDURE_GUIDE_UNLOCKED_STATUSES,
  DIAGNOSIS_PROCEDURE_STEP_UNLOCKED_STATUSES,
  RECOMMENDED_PROCEDURE_LABEL,
  type ProcedureStep,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import ResultAnchorNav, { type AnchorSection } from "./ResultAnchorNav";
import AnalysisReviewBanner from "./AnalysisReviewBanner";
import ResultHeader from "./ResultHeader";
import SectionCard from "./SectionCard";
import SectionAiRecommendation from "./SectionAiRecommendation";
import SectionDeliveryMessages from "./SectionDeliveryMessages";
import DeliveryMessagesPopup from "./DeliveryMessagesPopup";
import SectionProcedureScores from "./SectionProcedureScores";
import SectionDebtStatus from "./SectionDebtStatus";
import SectionRepaymentPlan from "./SectionRepaymentPlan";
import SectionCounselMents from "./SectionCounselMents";
import SectionProcedureGuide from "./SectionProcedureGuide";
import SectionSmsSend from "./SectionSmsSend";
import ResultDeleteButton from "./ResultDeleteButton";

const ALL_SECTION_IDS = ["overview", "scores", "debt", "repayment", "ments", "guide", "sms"];

export default function ResultDetailContent({ diagnosisId }: { diagnosisId: string }) {
  const { detail, loading, refetch } = useDiagnosisDetail(diagnosisId);
  const [projectId] = useSelectedProjectId();
  const { isLawyer, ready: projectTypeReady } = useProjectType();
  const [activeId, setActiveId] = useState("overview");
  // 모바일 전용 "전달사항" 토글(AI 추천 영역을 덮는 팝업). 데스크톱은 항상 접이식 섹션으로 쌓아 보여준다.
  const [mobileMessagesOpen, setMobileMessagesOpen] = useState(false);

  // 변호사 프로젝트에서 공유받은(납품받은) 분석 건은 상담사가 직접 관리할 대상이 아니므로
  // AI 분석 추천·상담 멘트 숨김 + 추적 절차 변경도 읽기 전용으로 막는다.
  const lawyerReceivedReadOnly = projectTypeReady && isLawyer && Boolean(detail?.isShared);
  const hideAiRecommendation = lawyerReceivedReadOnly;
  const hideCounselMents = lawyerReceivedReadOnly;
  const sectionIds = hideCounselMents
    ? ALL_SECTION_IDS.filter((id) => id !== "ments")
    : ALL_SECTION_IDS;

  const handleSetCurrentStep = async (step: ProcedureStep) => {
    if (!projectId || step.stepId == null || !detail) return;
    try {
      await DebtReliefService.updateProcedureProgress(projectId, diagnosisId, {
        trackingProcedure: detail.trackingProcedure,
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

  // 절차 변경 시 새 절차의 1단계로 초기화된다 — 진행 이력(currentProcedureStep)이 절차별로
  // 따로 저장되지 않고 분석 건에 하나뿐이라, 변경 즉시 확인 없이는 되돌릴 수 없다.
  const handleChangeTrackingProcedure = (procedure: RecommendedProcedure) => {
    if (!projectId || !detail) return;
    showConfirmModal({
      headline: "추적 절차를 변경할까요?",
      message: `${RECOMMENDED_PROCEDURE_LABEL[procedure]}(으)로 변경하면 진행 단계가 1단계로 초기화됩니다.`,
      type: "warning",
      confirmText: "변경",
      onConfirm: async () => {
        try {
          // currentProcedureStep은 생략 — 함께 보내면 이전 단계 대비 "건너뛰기"로 취급돼
          // ANALYSIS_PROCEDURE_STEP_SKIP_NOT_ALLOWED 오류가 난다. 서버가 절차 전환 시 초기화한다.
          await DebtReliefService.updateProcedureProgress(projectId, diagnosisId, {
            trackingProcedure: procedure,
          });
          refetch();
        } catch (error) {
          console.error("Failed to change tracking procedure:", error);
          showErrorModal({
            headline: "절차 변경에 실패했습니다.",
            description: "잠시 후 다시 시도해주세요.",
          });
        }
      },
    });
  };

  // 스크롤 스파이: 화면 상단에 걸린 섹션을 활성 처리
  // 데스크톱/모바일 모두 전역 헤더(54) + 앵커 내비(48) = 102px
  useEffect(() => {
    if (!detail) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-102px 0px -55% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [detail, sectionIds]);

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

  // 영업점이 전달한 검토중 건을 변호사 프로젝트가 열었을 때만 수락/거절 배너 노출.
  // 배너는 lawyerReceivedReadOnly(읽기전용/AI추천 숨김)와는 별개 조건 — 검토중일 때만이다.
  const showReviewBanner =
    projectTypeReady &&
    isLawyer &&
    detail.isShared &&
    detail.status === "reviewing" &&
    detail.deliveryStatus === "delivered";

  const sections: AnchorSection[] = [
    { id: "overview", label: RECOMMENDED_PROCEDURE_LABEL[detail.trackingProcedure] },
    { id: "scores", label: "절차별 성공 가능성" },
    { id: "debt", label: "채무현황" },
    { id: "repayment", label: "예상 변제 계획" },
    ...(hideCounselMents ? [] : [{ id: "ments", label: "상담 포인트" }]),
    { id: "guide", label: "절차 안내" },
    { id: "sms", label: "고객 문자 전송" },
  ];

  return (
    <>
      {/* 데스크톱만 fixed 서브헤더(48px) + 허브와 비슷한 상단 여백(36px) → 84px 확보.
          모바일은 sticky 내비(48px)가 문서 흐름에 자리를 차지하므로 별도 상단 여백이 필요 없다. */}
      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 md:pt-[84px] pb-[calc(3rem+env(safe-area-inset-bottom))] flex flex-col gap-0 md:gap-9">
        {/* 모바일: 내비게이터만 전역 헤더(54px) 아래 고정. 제목/액션은 카드 안에서 스크롤된다.
            카드 밖에 두어 overview를 지나도 sticky가 풀리지 않도록 한다. */}
        <div className="md:hidden sticky top-[54px] z-30 bg-card border-b border-neutral-30">
          <ResultAnchorNav sections={sections} activeId={activeId} onNavigate={scrollTo} />
        </div>

        {showReviewBanner && (
          <div className="px-6 md:px-0 pt-4 md:pt-0">
            <AnalysisReviewBanner detail={detail} projectId={projectId} onDecided={refetch} />
          </div>
        )}

        {/* 헤더 + (데스크톱) 탭 바 + AI 분석 추천 (같은 카드).
            변호사 공유 건은 AI 분석 추천을 숨기고 overview·scores를 하나의 카드처럼 붙인다. */}
        {hideAiRecommendation ? (
          <div className="flex flex-col gap-0 md:rounded-[14px] md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:md:shadow-none">
            <SectionCard
              id="overview"
              compactTop
              joined="start"
              joinBottomDivider={detail.messages.length === 0}
              className="max-md:!pt-0"
            >
              <ResultHeader detail={detail} projectId={projectId} onCustomerMatchChange={refetch} />
              <div className="hidden md:block mt-0">
                <ResultAnchorNav sections={sections} activeId={activeId} onNavigate={scrollTo} />
              </div>
              {detail.messages.length > 0 ? (
                <div className="mt-3 -mx-6 md:-mx-8 border-t border-neutral-30 px-6 pt-3 md:px-8">
                  <SectionDeliveryMessages messages={detail.messages} />
                </div>
              ) : null}
            </SectionCard>
            <SectionCard id="scores" compactTop joined="end">
              <SectionProcedureScores detail={detail} />
            </SectionCard>
          </div>
        ) : (
          <>
            <SectionCard id="overview" compactTop className="max-md:!pt-0 md:!pb-[46px]">
              <ResultHeader
                detail={detail}
                projectId={projectId}
                onCustomerMatchChange={refetch}
                showMessagesToggle={detail.messages.length > 0}
                messagesOpen={mobileMessagesOpen}
                onToggleMessages={() => setMobileMessagesOpen((previous) => !previous)}
              />
              <div className="hidden md:block mt-0">
                <ResultAnchorNav sections={sections} activeId={activeId} onNavigate={scrollTo} />
              </div>
              {/* 데스크톱은 AI 추천 위에 전달사항을 쌓아 보여준다. 모바일은 공간이 좁아
                  전달사항이 AI 추천을 밀어내지 않도록, ResultHeader의 말풍선 토글로 여는
                  팝업(아래 relative 래퍼)이 AI 추천 영역을 덮는 방식으로 대신한다. */}
              {detail.messages.length > 0 ? (
                <div className="hidden md:block mt-3 -mx-6 md:-mx-8 border-t border-neutral-30 px-6 pt-3 md:px-8">
                  <SectionDeliveryMessages messages={detail.messages} />
                </div>
              ) : null}
              <div className="relative">
                <SectionAiRecommendation detail={detail} showTopDivider={detail.messages.length === 0} />
                {mobileMessagesOpen && detail.messages.length > 0 ? (
                  <DeliveryMessagesPopup
                    messages={detail.messages}
                    onClose={() => setMobileMessagesOpen(false)}
                  />
                ) : null}
              </div>
            </SectionCard>

            <SectionCard id="scores" compactTop topDivider>
              <SectionProcedureScores detail={detail} />
            </SectionCard>
          </>
        )}

        <SectionCard id="debt" compactTop>
          <SectionDebtStatus detail={detail} />
        </SectionCard>

        <SectionCard id="repayment" compactTop>
          <SectionRepaymentPlan detail={detail} />
        </SectionCard>

        {!hideCounselMents && (
          <SectionCard id="ments" compactTop>
            <SectionCounselMents detail={detail} projectId={projectId} />
          </SectionCard>
        )}

        <SectionCard id="guide" compactTop>
          {/* trackingProcedure가 바뀌면(절차 전환) 이전 절차의 로컬 진행 상태(currentStep 등)가
              남아있지 않도록 key로 강제 리마운트한다. 계약 체결(계약대기중) 전에는 내용은 미리
              볼 수 있되 절차 전환·현재 단계 설정·문자 발송 등 실제 작업은 잠근다. */}
          <SectionProcedureGuide
            key={detail.trackingProcedure}
            detail={detail}
            onSetCurrentStep={handleSetCurrentStep}
            onChangeTrackingProcedure={handleChangeTrackingProcedure}
            canChangeTrackingProcedure={!lawyerReceivedReadOnly}
            locked={!DIAGNOSIS_PROCEDURE_GUIDE_UNLOCKED_STATUSES.includes(detail.status)}
            stepLocked={!DIAGNOSIS_PROCEDURE_STEP_UNLOCKED_STATUSES.includes(detail.status)}
          />
        </SectionCard>

        <SectionCard id="sms" title="고객 문자 전송" compactTop>
          <SectionSmsSend detail={detail} />
        </SectionCard>

        <ResultDeleteButton
          diagnosisId={detail.id}
          projectId={projectId}
          isShared={detail.isShared}
        />
      </div>
    </>
  );
}
