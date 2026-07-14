"use client";

import { useRouter } from "next/navigation";
import LinkIcon from "@/components/icons/LinkIcon";
import { ProcedureBadge, DebtAmountText, SuccessProbabilityText } from "@/components/debt-relief/DiagnosisBadges";
import { useDebtReliefMenu } from "@/hooks/useDebtReliefMenu";
import type { RecommendedProcedure } from "@/types/debtRelief";
import type { AnalysisProcedureType } from "@/types/analysis";
import type { CustomerLinkedAnalysis } from "@/types/customers";

type Props = {
  customerId: number;
  customerName: string;
  linkedAnalysis?: CustomerLinkedAnalysis | null;
};

// debtRelief.ts의 PROCEDURE_FROM_ANALYSIS와 동일한 매핑(모듈 비공개라 재사용 불가 — 값 3개뿐이라 로컬 복제)
const PROCEDURE_FROM_ANALYSIS: Record<AnalysisProcedureType, RecommendedProcedure> = {
  individual_rehabilitation: "individual_rehab",
  debt_adjustment: "debt_adjustment",
  bankruptcy: "bankruptcy",
};

function formatBasicInfoMeta(basicInfo: CustomerLinkedAnalysis["basicInfo"]): string {
  const genderLabel =
    basicInfo.gender === "male" ? "남" : basicInfo.gender === "female" ? "여" : basicInfo.gender;
  return [basicInfo.ageGroup, genderLabel, basicInfo.employmentType].filter(Boolean).join(" · ");
}

// procedureSteps는 실 API가 내려주는 절차 단계 원본이라 debtRelief.ts의 정적 단계명 추정 테이블보다
// 정확하다 — isCurrent 우선, 없으면 stepId로 currentProcedureStep을 찾아 위치를 역산한다.
function resolveProgress(linkedAnalysis: CustomerLinkedAnalysis): {
  current: number;
  total: number;
  title: string;
} {
  const steps = linkedAnalysis.procedureSteps;
  if (steps.length === 0) return { current: 1, total: 1, title: "확인 중" };

  let currentIndex = steps.findIndex((step) => step.isCurrent);
  if (currentIndex < 0) {
    currentIndex = steps.findIndex((step) => step.stepId === linkedAnalysis.currentProcedureStep);
  }
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  return {
    current: resolvedIndex + 1,
    total: steps.length,
    title: steps[resolvedIndex]?.title ?? "확인 중",
  };
}

export default function CustomerLinkedAnalysisSection({ customerId, customerName, linkedAnalysis }: Props) {
  const router = useRouter();
  const [showDebtReliefMenu, debtReliefReady] = useDebtReliefMenu();

  // 헤더에 회생·파산 메뉴가 노출되는 프로젝트(analysis/lawyer)에서만 표시 (useDebtReliefMenu와 동일 기준)
  if (!debtReliefReady || !showDebtReliefMenu) return null;

  return (
    <div className="md:col-span-2">
      <div className="text-[16px] font-semibold text-neutral-90 mb-3">회생·파산 진단 정보</div>
      <div className="border-b border-[#E2E2E2] dark:border-[#e2e2e266] mb-3" />

      {!linkedAnalysis ? (
        <div className="flex items-center gap-4 h-[58px] px-4 py-3 rounded-[12px] border border-[#E2E2E2] dark:border-[#444444] bg-card dark:bg-neutral-10">
          <div className="w-[34px] h-[34px] shrink-0 rounded-[5px] bg-neutral-10 dark:bg-neutral-20 border border-[#E2E2E2] dark:border-[#444444] flex items-center justify-center">
            <LinkIcon size={20} className="text-neutral-50" />
          </div>
          <span className="flex-1 inline-flex items-center h-[24px] px-3 rounded-full bg-neutral-10 dark:bg-neutral-20 text-[12px] font-medium text-neutral-60 opacity-80 w-fit">
            진단 데이터가 없습니다.
          </span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/debt-relief/new?customerId=${customerId}&customerName=${encodeURIComponent(customerName)}`
              )
            }
            className="cursor-pointer shrink-0 h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold text-ink hover:bg-neutral-10 dark:hover:bg-neutral-20"
          >
            추가하기
          </button>
        </div>
      ) : (
        (() => {
          const procedure = linkedAnalysis.currentProcedure
            ? PROCEDURE_FROM_ANALYSIS[linkedAnalysis.currentProcedure]
            : undefined;
          const { current, total, title } = resolveProgress(linkedAnalysis);
          const isProgressKnown = total > 1;
          const progressPercent = isProgressKnown ? Math.round((current / total) * 100) : 0;

          return (
            <div className="flex items-center gap-4 h-[58px] px-4 py-3 rounded-[12px] border border-[#E2E2E2] dark:border-[#444444] bg-card dark:bg-neutral-10">
              <div className="w-[34px] h-[34px] shrink-0 rounded-[5px] bg-secondary-10 border border-secondary-60 flex items-center justify-center">
                <LinkIcon size={20} className="text-secondary-60" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 w-[120px] shrink-0">
                <p className="text-[14px] font-bold text-neutral-90 opacity-80 truncate">{customerName}</p>
                <p className="text-[12px] font-medium text-neutral-60 opacity-80 truncate">
                  {formatBasicInfoMeta(linkedAnalysis.basicInfo)}
                </p>
              </div>
              <DebtAmountText manwon={linkedAnalysis.totalDebt} />
              <SuccessProbabilityText value={linkedAnalysis.currentProcedureScore ?? 0} />
              <div className="flex-1 min-w-[120px] max-w-[220px] flex flex-col justify-between gap-1.5 h-[26px]">
                <p className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-90 whitespace-nowrap truncate">
                  {isProgressKnown ? `${current}/${total} · ${title}` : title}
                </p>
                <div className="h-[6px] w-full max-w-[140px] rounded-[30px] bg-neutral-30 overflow-hidden">
                  <div
                    className="h-full rounded-l-[30px] bg-secondary-20"
                    style={{ width: `${isProgressKnown ? Math.max(progressPercent, 4) : 0}%` }}
                  />
                </div>
              </div>
              <ProcedureBadge procedure={procedure} />
              <button
                type="button"
                onClick={() => router.push(`/debt-relief/${linkedAnalysis.analysisId}`)}
                className="cursor-pointer shrink-0 h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold text-ink hover:bg-neutral-10 dark:hover:bg-neutral-20"
              >
                결과보기
              </button>
            </div>
          );
        })()
      )}
    </div>
  );
}
