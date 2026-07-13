import {
  RECOMMENDED_PROCEDURE_ORDER,
  type DiagnosisHubSummary,
} from "@/types/debtRelief";
import { ProcedureBadge } from "@/components/debt-relief/DiagnosisBadges";
import SortIcon from "@/components/common/SortIcon";

const BOX_CLASS = "bg-neutral-10 rounded-[14px] px-4 py-4 md:px-6 md:py-[22px] min-h-[120px] md:min-h-[148px] flex flex-col";
const LABEL_CLASS = "text-[13px] md:text-[14px] text-neutral-60 mb-2.5 md:mb-4";
// 제목을 제외한 콘텐츠 영역 공통 상한 — 카드 4개의 높이를 일정하게 맞추고, 넘치는 콘텐츠는 스크롤 처리
const CONTENT_MAX_H_CLASS = "max-h-[98px]";
// 추천 절차 분포 · 진행단계 목록 전용 상한 (다른 두 카드보다 낮게)
const PROGRESS_STEP_LIST_MAX_H_CLASS = "max-h-[80px]";

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${BOX_CLASS} animate-pulse`}>
          <div className="h-4 w-24 bg-neutral-20 rounded mb-4" />
          <div className="h-8 w-16 bg-neutral-20 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function SummaryCards({
  summary,
  loading,
}: {
  summary: DiagnosisHubSummary | null;
  loading: boolean;
}) {
  if (loading || !summary) return <SummaryCardsSkeleton />;

  const maxProcedureCount = Math.max(
    1,
    ...RECOMMENDED_PROCEDURE_ORDER.map((key) => summary.procedureDistribution[key])
  );

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {/* 총 분석 건수 */}
      <div className={BOX_CLASS}>
        <p className={LABEL_CLASS}>총 분석 건수</p>
        <div className={`flex flex-col flex-1 min-h-0 ${CONTENT_MAX_H_CLASS}`}>
          <p className="text-[22px] md:text-[28px] font-bold text-neutral-90 leading-none tracking-[0.5px]">
            {summary.totalAnalysisCount.toLocaleString("ko-KR")}
            <span className="text-[14px] md:text-[16px] font-semibold text-neutral-90 ml-1.5">건</span>
          </p>
          <p className="text-[13px] md:text-[15px] text-neutral-60 mt-auto pt-3 md:pt-5">
            이번 달 {summary.thisMonthCount}건
          </p>
        </div>
      </div>

      {/* 평균 성공 가능성 */}
      <div className={BOX_CLASS}>
        <p className={LABEL_CLASS}>평균 성공 가능성</p>
        <div className={`flex flex-col flex-1 min-h-0 ${CONTENT_MAX_H_CLASS}`}>
          <p className="text-[22px] md:text-[28px] font-bold text-neutral-90 leading-none tracking-[0.5px]">
            {summary.averageSuccessProbability}
            <span className="text-[15px] md:text-[18px] font-semibold text-neutral-60 ml-1">/100</span>
          </p>
          <div className="mt-auto pt-3 md:pt-5">
            <div className="h-2 rounded-full bg-neutral-30 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-40"
                style={{ width: `${Math.min(100, Math.max(0, summary.averageSuccessProbability))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 추천 절차 분포 */}
      <div className={BOX_CLASS}>
        <p className={LABEL_CLASS}>추천 절차 분포</p>
        <div className={`flex flex-col gap-1.5 md:gap-2 mt-auto overflow-y-auto ${PROGRESS_STEP_LIST_MAX_H_CLASS}`}>
          {RECOMMENDED_PROCEDURE_ORDER.map((key) => {
            const count = summary.procedureDistribution[key];
            return (
              <div key={key} className="flex items-center gap-1.5 md:gap-2.5">
                <span className="shrink-0">
                  <ProcedureBadge procedure={key} />
                </span>
                <div className="flex-1 min-w-0 h-1.5 rounded-full bg-neutral-30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral-70"
                    style={{ width: `${(count / maxProcedureCount) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] text-neutral-60 shrink-0 w-6 md:w-7 text-right">{count}건</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 진행단계 분포 — 피그마 스펙(행 16px, gap 14px)에 맞춰 80px 상한, 넘치면 내부 스크롤 */}
      <div className={BOX_CLASS}>
        <div className="flex items-center gap-0.5 mb-2.5 md:mb-4 shrink-0">
          <p className="text-[13px] md:text-[14px] text-neutral-60">진행단계</p>
          <SortIcon state="none" />
        </div>
        <div className={`flex flex-col gap-2.5 md:gap-3.5 overflow-y-auto ${PROGRESS_STEP_LIST_MAX_H_CLASS}`}>
          {summary.progressStepDistribution.map(({ step, count }) => (
            <div key={step} className="flex items-center justify-between h-4 shrink-0">
              <span className="inline-flex items-center gap-1.5 md:gap-2">
                <span className="w-2 h-2 rounded-full shrink-0 bg-secondary-20" />
                <span className="text-[12px] md:text-[13px] font-semibold leading-4 text-neutral-100">{step}단계</span>
              </span>
              <span className="text-[12px] md:text-[13px] leading-4 text-neutral-60">{count}건</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
