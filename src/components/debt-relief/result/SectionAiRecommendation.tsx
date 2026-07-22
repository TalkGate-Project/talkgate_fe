import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatDateTimeDisplay, toRecommendationChipLabel } from "@/components/debt-relief/format";
import { StatusBadge } from "@/components/debt-relief/DiagnosisBadges";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";
import SuccessDonut from "./SuccessDonut";

function RecommendationChips({
  tags,
  truncateLabel = true,
  /** 모바일 회색 카드 위에서는 흰 칩(피그마 chip2) */
  onMutedSurface = false,
}: {
  tags: string[];
  /** false면 말줄임 없이 전체 결론 라벨을 쓰고, 칩이 넘치면 개행한다. */
  truncateLabel?: boolean;
  onMutedSurface?: boolean;
}) {
  return (
    <div
      className={`flex gap-2 ${
        truncateLabel
          ? "flex-nowrap overflow-x-auto scrollbar-hide"
          : "flex-wrap"
      }`}
    >
      {tags.map((tag) => {
        const label = toRecommendationChipLabel(tag, {
          maxLength: truncateLabel ? undefined : null,
        });
        return (
          <span
            key={tag}
            title={tag}
            className={`inline-flex items-center justify-center h-5 px-3 rounded-full text-[12px] font-medium leading-[14px] text-neutral-70 opacity-80 whitespace-nowrap shrink-0 ${
              onMutedSurface
                ? "bg-white dark:bg-neutral-10"
                : "bg-neutral-20 dark:bg-neutral-30"
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

export default function SectionAiRecommendation({
  detail,
  showTopDivider = true,
}: {
  detail: DiagnosisDetail;
  // 데스크톱에서 바로 위에 전달사항 카드가 쌓여 있으면 그 카드 자체 테두리와 겹쳐 보이므로
  // 이 구분선을 끈다(false). 전달사항이 없으면 헤더와의 유일한 구분선이라 계속 그린다.
  showTopDivider?: boolean;
}) {
  const { recommendation, successProbability } = detail;
  const inProgressStepLabel =
    detail.status === "in_progress" && detail.procedureGuide.totalSteps > 1
      ? `${detail.procedureGuide.currentStep}/${detail.procedureGuide.totalSteps}`
      : undefined;

  return (
    // 구분선만 카드 풀폭. 피그마: divider→라벨 46px / 좌측 68px(=32+36) / 도넛 우측 90px
    // 와이드(PC) 레이아웃은 공식 desktop BP(1080)부터 — 수치·구조는 기존과 동일하게 유지.
    // md~lg(태블릿)는 컴팩트 레이아웃으로 두어 문구/도넛 겹침을 피한다.
    // 모바일은 이 구분선을 ResultHeader의 1줄·2줄 사이로 옮겨서(border-t-0) 여기서는 안 그린다.
    <div
      className={`mt-[22px] md:mt-6 -mx-6 md:-mx-8 border-t-0 ${showTopDivider ? "md:border-t md:pt-5" : ""} border-neutral-30 px-6 md:pl-8 md:pr-8 lg:pr-[90px]`}
    >
      {/* 모바일(피그마 375): 회색 카드 / 날짜 우측 / 도넛은 제목+설명 블록 세로 중앙 */}
      <div className="md:hidden">
        <div className="rounded-[12px] bg-neutral-10 p-4 dark:bg-neutral-20">
          <div className="mb-2 flex h-5 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center">
              <p className="inline-flex h-5 items-center text-[13px] font-medium leading-5 text-neutral-60">
                AI 분석 추천
              </p>
              <div className="ml-1 shrink-0 inline-flex h-5 items-center">
                <DisclaimerInfoTooltip label="AI 분석 추천 안내" iconSize={20}>
                  본 기능은 고객 상담을 돕기 위한{" "}
                  <span className="font-extrabold">사전 분석 참고 도구</span>이며
                  <br />
                  법률 자문 또는 결과 보장을 제공하지 않습니다.
                </DisclaimerInfoTooltip>
              </div>
            </div>
            <span className="shrink-0 text-[12px] font-medium leading-4 text-neutral-50 whitespace-nowrap">
              {formatDateTimeDisplay(detail.consultedAt)}
            </span>
          </div>

          {/* items-center: 도넛이 좌측(제목+설명) 블록의 세로 가운데에 오도록 */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[24px] font-extrabold leading-[29px] tracking-[-0.04em] text-neutral-90">
                  {recommendation.title}
                </h3>
                <div className="shrink-0">
                  <StatusBadge
                    status={detail.status}
                    rejectionReason={detail.rejectionReason}
                    stepLabel={inProgressStepLabel}
                  />
                </div>
              </div>
              <p className="mt-2 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
                {recommendation.description}
              </p>
            </div>
            {/* stroke 5: Figma cover 78px on 88px → (88-78)/2 */}
            <div className="shrink-0">
              <SuccessDonut value={successProbability} size={88} stroke={5} whiteCover />
            </div>
          </div>

          <div className="mt-3">
            <RecommendationChips
              tags={recommendation.tags}
              truncateLabel={false}
              onMutedSurface
            />
          </div>
        </div>
      </div>

      {/* 태블릿(md~lg): 기존 컴팩트 레이아웃 유지 */}
      <div className="hidden md:block lg:hidden">
        <div className="flex items-center h-5 mb-2">
          <p className="inline-flex h-5 items-center text-[13px] font-medium leading-5 text-neutral-60">
            AI 분석 추천
          </p>
          <div className="ml-1 shrink-0 inline-flex h-5 items-center">
            <DisclaimerInfoTooltip label="AI 분석 추천 안내" iconSize={20}>
              본 기능은 고객 상담을 돕기 위한{" "}
              <span className="font-extrabold">사전 분석 참고 도구</span>이며
              <br />
              법률 자문 또는 결과 보장을 제공하지 않습니다.
            </DisclaimerInfoTooltip>
          </div>
          <span className="ml-2 inline-flex h-5 items-center text-[14px] font-medium leading-5 text-neutral-50 whitespace-nowrap">
            {formatDateTimeDisplay(detail.consultedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-[24px] font-extrabold leading-[29px] tracking-[-0.04em] text-neutral-90">
              {recommendation.title}
            </h3>
            <p className="mt-[11px] text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
              {recommendation.description}
            </p>
          </div>
          <div className="shrink-0">
            <SuccessDonut value={successProbability} size={120} stroke={7} />
          </div>
        </div>

        <div className="mt-1 max-w-[480px]">
          <RecommendationChips tags={recommendation.tags} truncateLabel={false} />
        </div>
      </div>

      {/* PC(lg+): 기존 와이드 레이아웃 그대로 (gap/고정폭/도넛 크기 유지) */}
      <div className="hidden lg:flex items-center justify-between gap-10">
        <div className="min-w-0 w-full max-w-[581px] pl-[36px]">
          <div className="flex items-center mb-3">
            <p className="inline-flex h-6 items-center text-[16px] font-medium leading-none tracking-[-0.04em] text-neutral-60">
              AI 분석 추천
            </p>
            <div className="ml-1 shrink-0">
              <DisclaimerInfoTooltip label="AI 분석 추천 안내">
                본 기능은 고객 상담을 돕기 위한{" "}
                <span className="font-extrabold">사전 분석 참고 도구</span>이며
                <br />
                법률 자문 또는 결과 보장을 제공하지 않습니다.
              </DisclaimerInfoTooltip>
            </div>
            <span className="ml-4 inline-flex h-6 items-center text-[14px] font-medium leading-none text-neutral-50 whitespace-nowrap">
              {formatDateTimeDisplay(detail.consultedAt)}
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-row items-start gap-[68px]">
              <h3 className="shrink-0 text-[36px] font-extrabold leading-[43px] tracking-[-0.04em] text-neutral-90">
                {recommendation.title}
              </h3>
              <p className="min-w-0 w-[392px] max-w-[392px] shrink-0 text-[14px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
                {recommendation.description}
              </p>
            </div>

            <RecommendationChips tags={recommendation.tags} truncateLabel={false} />
          </div>
        </div>

        <div className="shrink-0 self-center">
          <SuccessDonut value={successProbability} />
        </div>
      </div>
    </div>
  );
}
