import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatDateTimeDisplay, toRecommendationChipLabel } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";
import SuccessDonut from "./SuccessDonut";

export default function SectionAiRecommendation({ detail }: { detail: DiagnosisDetail }) {
  const { recommendation, successProbability } = detail;

  return (
    // 구분선만 카드 풀폭. 피그마: divider→라벨 46px / 좌측 68px(=32+36) / 도넛 우측 90px
    // 모바일: 구분선을 탭 바 바로 아래(간격 없이)에 붙여, 활성 탭의 밑줄과 같은 선상에 겹치도록 한다.
    <div className="mt-0 md:mt-[22px] -mx-6 md:-mx-8 border-t border-neutral-30 pt-6 md:pt-[46px] px-6 md:pl-8 md:pr-[90px]">
      <div className="flex items-center justify-between gap-4 md:gap-10">
        {/* 피그마 Group 427320624: 좌측만 추가 들여쓰기, 폭 581px */}
        <div className="min-w-0 w-full md:max-w-[581px] md:pl-[36px]">
          <div className="flex items-center mb-3">
            <p className="inline-flex h-6 items-center text-[14px] md:text-[16px] font-medium leading-none tracking-[-0.04em] text-neutral-60">
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

          {/* 피그마: 제목 | 설명(392px) 同行 → 그 아래 태그 행 */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-[68px]">
              <h3 className="shrink-0 text-[26px] md:text-[36px] font-extrabold leading-[31px] md:leading-[43px] tracking-[-0.04em] text-neutral-90">
                {recommendation.title}
              </h3>
              <p className="min-w-0 w-full md:w-[392px] md:max-w-[392px] md:shrink-0 text-[14px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
                {recommendation.description}
              </p>
            </div>

            {/* 모바일: 칩이 잘리거나 스크롤 뒤에 숨지 않도록 줄바꿈. 데스크톱: 한 줄 유지 + 가로 스크롤 */}
            <div className="flex flex-wrap md:flex-nowrap gap-2 md:overflow-x-auto scrollbar-hide">
              {recommendation.tags.map((tag) => {
                const label = toRecommendationChipLabel(tag);
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
          </div>
        </div>

        <div className="shrink-0 self-center">
          <div className="md:hidden">
            <SuccessDonut value={successProbability} size={88} stroke={7} />
          </div>
          <div className="hidden md:block">
            <SuccessDonut value={successProbability} />
          </div>
        </div>
      </div>
    </div>
  );
}
