import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatDateTimeDisplay, toRecommendationChipLabel } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";
import SuccessDonut from "./SuccessDonut";

function RecommendationChips({
  tags,
  truncateLabel = true,
}: {
  tags: string[];
  /** false면 말줄임 없이 전체 결론 라벨을 쓰고, 칩이 넘치면 개행한다. */
  truncateLabel?: boolean;
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
            className="inline-flex items-center justify-center h-[22px] px-3 rounded-full bg-neutral-20 text-[12px] font-medium leading-[14px] text-neutral-70 opacity-80 whitespace-nowrap shrink-0"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

export default function SectionAiRecommendation({ detail }: { detail: DiagnosisDetail }) {
  const { recommendation, successProbability } = detail;

  return (
    // 구분선만 카드 풀폭. 피그마: divider→라벨 46px / 좌측 68px(=32+36) / 도넛 우측 90px
    <div className="mt-0 md:mt-[22px] -mx-6 md:-mx-8 border-t border-neutral-30 pt-5 md:pt-[46px] px-6 md:pl-8 md:pr-[90px]">
      {/* 모바일 Figma: 헤더 → (제목+설명 | 도넛) → 칩. 도넛은 제목/설명 옆, 칩은 그 아래 풀폭 */}
      <div className="md:hidden">
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

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 max-w-[215px]">
            <h3 className="text-[24px] font-extrabold leading-[29px] tracking-[-0.04em] text-neutral-90">
              {recommendation.title}
            </h3>
            <p className="mt-[11px] text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
              {recommendation.description}
            </p>
          </div>
          {/* stroke 5: Figma cover 78px on 88px → (88-78)/2 */}
          <SuccessDonut value={successProbability} size={88} stroke={5} />
        </div>

        <div className="mt-5">
          <RecommendationChips tags={recommendation.tags} truncateLabel={false} />
        </div>
      </div>

      {/* 데스크톱: 좌측(헤더+제목/설명+칩) | 우측 도넛 */}
      <div className="hidden md:flex items-center justify-between gap-10">
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

            <RecommendationChips tags={recommendation.tags} />
          </div>
        </div>

        <div className="shrink-0 self-center">
          <SuccessDonut value={successProbability} />
        </div>
      </div>
    </div>
  );
}
