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
import SectionDebtAdjustmentComparison from "./SectionDebtAdjustmentComparison";
import SectionDebtStatus from "./SectionDebtStatus";
import SectionRepaymentPlan from "./SectionRepaymentPlan";
import SectionCounselMents from "./SectionCounselMents";
import SectionProcedureGuide from "./SectionProcedureGuide";
import SectionSmsSend from "./SectionSmsSend";
import ResultDeleteButton from "./ResultDeleteButton";
import AnalysisPrintDocument from "./AnalysisPrintDocument";

const ALL_SECTION_IDS = ["overview", "scores", "debt", "repayment", "ments", "guide", "sms"];

export default function ResultDetailContent({ diagnosisId }: { diagnosisId: string }) {
  const { detail, loading, refetch } = useDiagnosisDetail(diagnosisId);
  const [projectId] = useSelectedProjectId();
  const { isLawyer, ready: projectTypeReady } = useProjectType();
  const [activeId, setActiveId] = useState("overview");
  // 모바일·태블릿(lg 미만) "전달사항" 토글(AI 추천 영역을 덮는 팝업).
  // PC(lg+)는 항상 접이식 섹션으로 쌓아 보여준다.
  const [mobileMessagesOpen, setMobileMessagesOpen] = useState(false);
  // "절차별 성공 가능성"에서 고른 절차 — "예상 변제 계획" 섹션이 같은 값을 보고 표시 내용을
  // 통째로 바꿔야 해서(개인회생/새출발기금/개인워크아웃은 기존 UI, 파산은 "예상 면책 결과",
  // 신속채무조정·프리워크아웃은 "예상 조정 요약") 두 섹션의 공통 조상인 여기서 상태를 소유한다.
  // detail은 아래에서 로딩/에러 가드를 통과한 뒤에만 확정되므로, 훅 자체는 항상 호출하되
  // null이면 렌더 시점에 detail.trackingProcedure로 지연 대체한다.
  const [selectedProcedure, setSelectedProcedure] = useState<RecommendedProcedure | null>(null);

  // 변호사 프로젝트에서 공유받은(납품받은) 분석 건은 상담사가 직접 관리할 대상이 아니므로
  // AI 분석 추천·상담 멘트만 숨긴다. 변호사가 직접 등록한 건은 자체 분석이므로 그대로 노출한다.
  // isReceivedShare는 반려/철회된 공유 건까지 포함한다(isShared는 delivered일 때만 true).
  // 추적 절차 변경 드롭다운은 영업점/법무법인 구분 없이 계속 사용 가능해야 한다 —
  // canChangeTrackingProcedure에는 반영하지 않는다.
  const lawyerReceivedReadOnly =
    projectTypeReady && isLawyer && Boolean(detail?.isReceivedShare);
  const hideAiRecommendation = lawyerReceivedReadOnly;
  const hideCounselMents = lawyerReceivedReadOnly;
  const sectionIds = hideCounselMents
    ? ALL_SECTION_IDS.filter((id) => id !== "ments")
    : ALL_SECTION_IDS;

  // SectionProcedureGuide가 currentStep을 낙관적으로 먼저 반영한 뒤 이 함수를 호출한다.
  // 실패 시 반드시 throw해야 그쪽에서 낙관적 반영을 원복한다 — 여기서 에러를 삼키면
  // 저장은 실패했는데 화면엔 성공한 것처럼 남는다.
  const handleSetCurrentStep = async (step: ProcedureStep) => {
    if (!projectId || step.stepId == null || !detail) {
      throw new Error("Missing projectId/detail/stepId for procedure step update");
    }
    try {
      await DebtReliefService.updateProcedureProgress(projectId, diagnosisId, {
        trackingProcedure: detail.trackingProcedure,
        currentProcedureStep: step.stepId,
      });
    } catch (error) {
      console.error("Failed to update procedure progress:", error);
      showErrorModal({
        headline: "단계 저장에 실패했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      });
      throw error;
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

  // behavior:"smooth"(scrollIntoView든 scrollTo든 동일)는 body에 zoom:0.8이 걸린 상태(데스크톱
  // ≥1280px, CLAUDE.md 줌 정책)에서 특정 폭·상태 조합일 때 스크롤이 아예 일어나지 않는 크로미움 버그가
  // 있어 애니메이션 없는 즉시 이동으로 우회한다(zoom과 무관하게 항상 동작 확인됨).
  const scrollTo = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "auto" });
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

  // 사용자가 아직 카드를 클릭하지 않았으면 추적 중인 절차를 기본값으로 보여준다.
  const activeProcedure = selectedProcedure ?? detail.trackingProcedure;

  // 영업점이 전달한 검토중 건을 변호사 프로젝트가 열었을 때만 수락/반려 배너 노출.
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
              <SectionProcedureScores
                detail={detail}
                selectedProcedure={activeProcedure}
                onSelectProcedure={setSelectedProcedure}
              />
            </SectionCard>
          </div>
        ) : (
          <>
            {/* AI 추천이 있는 overview → scores: 모바일 풀폭 구분선 제거 후 간격이 넓어
                mobileCompactBottom으로 overview 하단만 pb-2. md+는 className의 pb-[30px] 유지.
                변호사 공유(joined) 분기에는 넘기지 않는다. */}
            <SectionCard
              id="overview"
              compactTop
              mobileCompactBottom
              className="max-md:!pt-0 md:!pt-[12px] lg:!pt-[20px] md:!pb-[30px]"
            >
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
              {/* PC(lg+)는 AI 추천 위에 전달사항을 쌓아 보여준다. 모바일·태블릿은 공간이
                  좁아 전달사항이 AI 추천을 밀어내지 않도록, ResultHeader의 말풍선 토글로
                  여는 팝업(아래 relative 래퍼)이 AI 추천 영역을 덮는 방식으로 대신한다. */}
              {detail.messages.length > 0 ? (
                <div className="hidden lg:block mt-3 -mx-6 md:-mx-8 border-t border-neutral-30 px-6 pt-3 md:pt-5 md:px-8">
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

            <SectionCard id="scores" compactTop>
              <SectionProcedureScores
                detail={detail}
                selectedProcedure={activeProcedure}
                onSelectProcedure={setSelectedProcedure}
              />
            </SectionCard>
          </>
        )}

        {/* trackingProcedure와 무관하게 서버가 문구를 내려줄 때만 노출 — 앵커 내비에는 항목을 두지 않는다. */}
        {detail.debtAdjustmentComparison && (
          <SectionCard id="debt-adjustment-comparison" compactTop>
            <SectionDebtAdjustmentComparison detail={detail} />
          </SectionCard>
        )}

        <SectionCard id="debt" compactTop>
          <SectionDebtStatus detail={detail} projectId={projectId} onDebtApplied={refetch} />
        </SectionCard>

        <SectionCard id="repayment" compactTop>
          <SectionRepaymentPlan detail={detail} selectedProcedure={activeProcedure} />
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
            projectId={projectId}
            onCustomerMatchChange={refetch}
            onSetCurrentStep={handleSetCurrentStep}
            onChangeTrackingProcedure={handleChangeTrackingProcedure}
            locked={!DIAGNOSIS_PROCEDURE_GUIDE_UNLOCKED_STATUSES.includes(detail.status)}
            stepLocked={!DIAGNOSIS_PROCEDURE_STEP_UNLOCKED_STATUSES.includes(detail.status)}
          />
        </SectionCard>

        <SectionCard id="sms" title="고객 문자 전송" compactTop>
          <SectionSmsSend detail={detail} projectId={projectId} onCustomerMatchChange={refetch} />
        </SectionCard>

        <ResultDeleteButton
          diagnosisId={detail.id}
          projectId={projectId}
          isShared={detail.isShared}
        />
      </div>
      <AnalysisPrintDocument
        detail={detail}
        projectId={projectId}
        selectedProcedure={activeProcedure}
      />
    </>
  );
}
