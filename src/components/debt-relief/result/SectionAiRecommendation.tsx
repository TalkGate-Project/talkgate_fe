import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatDateTimeDisplay } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";

type BriefingMetric = { label: string; amount: string; unit: string };

function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits });
}

function formatDebtMetric(manwon: number): BriefingMetric {
  if (Math.abs(manwon) >= 10_000) {
    return { label: "총 채무", amount: formatDecimal(manwon / 10_000), unit: "억원" };
  }
  return { label: "총 채무", amount: formatDecimal(manwon, 0), unit: "만원" };
}

function describeOccupation(occupation: string): string {
  const descriptions: Record<string, string> = {
    자영업: "자영업자",
    프리랜서: "프리랜서",
    무직: "무직",
  };
  return descriptions[occupation] ?? `${occupation} 근로자`;
}

function buildBriefing(detail: DiagnosisDetail): string {
  const { totalDebtManwon, totalAssetManwon, monthlyAvailableIncomeManwon, overdueMonths, composition } = detail.debtStatus;
  const debt = Math.abs(totalDebtManwon) >= 10_000
    ? `${formatDecimal(totalDebtManwon / 10_000)}억원`
    : `${formatDecimal(totalDebtManwon, 0)}만원`;
  const asset = `${formatDecimal(totalAssetManwon, 0)}만원`;
  const availableIncome = `${formatDecimal(monthlyAvailableIncomeManwon, 0)}만원`;
  const overdue = overdueMonths > 0
    ? `연체 ${formatDecimal(overdueMonths, 0)}개월이 확인됩니다.`
    : "현재 연체는 확인되지 않습니다.";
  const basicSummary = `${detail.customerName} 고객은 ${describeOccupation(detail.occupation)}로, 총 채무 ${debt}, 월 가용소득 ${availableIncome}, ${overdue}`;
  const privateDebt = composition.find((item) => /사채|대부|개인차용/.test(item.label));
  const incomeEvidence = /자영업|프리랜서/.test(detail.occupation)
    ? `${describeOccupation(detail.occupation)} 소득 증빙`
    : "소득의 지속 가능성";
  const decisionVariables = `${privateDebt ? `${privateDebt.label}가 포함된 채권 구성` : "채권 구성"}과 ${incomeEvidence}`;

  if (totalAssetManwon <= 0) {
    return `${basicSummary} 확인 가능한 자산이 없어 채무 전액이 자산을 초과하며, ${decisionVariables}이 이후 절차 판단의 핵심 변수입니다.`;
  }

  const debtToAssetRatio = totalDebtManwon / totalAssetManwon;
  const assetAssessment = debtToAssetRatio > 1
    ? `채무가 자산의 약 ${formatDecimal(debtToAssetRatio)}배에 달해 채무초과 상태에 해당하며`
    : `자산 대비 채무 비율은 약 ${formatDecimal(debtToAssetRatio)}배이며`;
  return `${basicSummary} 자산 ${asset}으로 ${assetAssessment}, ${decisionVariables}이 이후 절차 판단의 핵심 변수입니다.`;
}

function BriefingMetricItem({ metric, index }: { metric: BriefingMetric; index: number }) {
  return (
    <div className={`min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-2 ${index % 2 !== 0 ? "border-l border-neutral-30" : ""} ${index > 0 ? "lg:border-l lg:border-neutral-30" : ""}`}>
      <p className="text-[13px] font-medium leading-[17px] text-neutral-60 lg:text-[14px]">{metric.label}</p>
      <div className="mt-3 flex min-w-0 items-end gap-2">
        <strong className="min-w-0 font-montserrat text-[24px] font-extrabold leading-none tracking-[1px] text-neutral-90 lg:text-[28px] lg:leading-[34px]">
          {metric.amount}
        </strong>
        <span className="shrink-0 pb-0.5 text-[14px] font-semibold leading-[19px] text-neutral-90 lg:text-[16px]">{metric.unit}</span>
      </div>
    </div>
  );
}

export default function SectionAiRecommendation({
  detail,
  showTopDivider = true,
}: {
  detail: DiagnosisDetail;
  showTopDivider?: boolean;
}) {
  const { totalDebtManwon, totalAssetManwon, monthlyAvailableIncomeManwon, overdueMonths } = detail.debtStatus;
  const metrics: BriefingMetric[] = [
    formatDebtMetric(totalDebtManwon),
    { label: "총 자산", amount: formatDecimal(totalAssetManwon, 0), unit: "만원" },
    { label: "월 가용소득", amount: formatDecimal(monthlyAvailableIncomeManwon, 0), unit: "만원" },
    { label: "연체 기간", amount: formatDecimal(overdueMonths, 0), unit: "개월" },
  ];

  return (
    <div className={`mt-3 md:mt-4 lg:mt-6 -mx-6 border-t-0 px-6 md:-mx-8 md:px-8 lg:border-t lg:pt-5 ${showTopDivider ? "" : "lg:border-t-0 lg:pt-0"} border-neutral-30`}>
      <section aria-labelledby="analysis-briefing-title" className="rounded-[12px] bg-neutral-10 px-4 py-5 dark:bg-neutral-20 sm:px-6 lg:px-8 lg:py-[22px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 id="analysis-briefing-title" className="text-[14px] font-medium leading-5 tracking-[-0.04em] text-neutral-60 lg:text-[16px]">
            분석 브리핑
          </h2>
          <DisclaimerInfoTooltip label="분석 브리핑 안내" iconSize={24}>
            입력된 고객 정보와 분석 결과를 바탕으로 핵심 재무 상태를 요약합니다.
          </DisclaimerInfoTooltip>
          <span className="text-[13px] font-medium leading-5 text-neutral-50 sm:text-[14px]">
            {formatDateTimeDisplay(detail.consultedAt)}
          </span>
        </div>

        <p className="mt-4 px-2 text-[14px] font-semibold leading-6 tracking-[-0.02em] text-neutral-90 lg:px-4 lg:text-[16px]">
          {buildBriefing(detail)}
        </p>

        <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-[14px] bg-card py-2 lg:mt-10 lg:grid-cols-4 lg:py-6">
          {metrics.map((metric, index) => (
            <BriefingMetricItem
              key={metric.label}
              metric={metric}
              index={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
