import type { DiagnosisDetail } from "@/types/debtRelief";
import { formatDateTimeDisplay } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";
import SuccessDonut from "./SuccessDonut";

export default function SectionAiRecommendation({
  detail,
  showTopDivider = true,
}: {
  detail: DiagnosisDetail;
  // PC(lg+)에서 바로 위에 전달사항 카드가 쌓여 있으면 그 카드 자체 테두리와 겹쳐 보이므로
  // 이 구분선을 lg에서만 끈다(false). 모바일은 ResultHeader 쪽 구분선, 태블릿(md~lg)은 구분선 없음.
  showTopDivider?: boolean;
}) {
  const { recommendation, successProbability } = detail;

  return (
    // 구분선만 카드 풀폭. 전 구간 회색 카드(#F8F8F8, radius 12).
    // md~lg는 컴팩트 타이포로 문구/도넛 겹침을 피하고, lg+는 피그마 와이드 레이아웃.
    // 모바일 구분선은 ResultHeader 쪽으로 이동.
    // 태블릿(md~lg): 고객칩↔AI 구분선 제거, 상단 간격은 mt-4.
    // 모바일 mt-3 / 태블릿 mt-4 / PC(lg+) mt-6 + 구분선.
    <div
      className={`mt-3 md:mt-4 lg:mt-6 -mx-6 md:-mx-8 border-t-0 lg:border-t lg:pt-5 ${
        showTopDivider ? "" : "lg:border-t-0 lg:pt-0"
      } border-neutral-30 px-6 md:px-8`}
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
              <h3 className="text-[24px] font-extrabold leading-[29px] tracking-[-0.04em] text-neutral-90">
                {recommendation.title}
              </h3>
              <p className="mt-2 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
                {recommendation.description}
              </p>
            </div>
            {/* stroke 5: Figma cover 78px on 88px → (88-78)/2 */}
            <div className="shrink-0">
              <SuccessDonut value={successProbability} size={88} stroke={5} whiteCover />
            </div>
          </div>
        </div>
      </div>

      {/* 태블릿(md~lg): 회색 카드 + 컴팩트 타이포 (문구/도넛 겹침 방지) */}
      <div className="hidden md:block lg:hidden">
        <div className="rounded-[12px] bg-neutral-10 px-6 py-5 dark:bg-neutral-20">
          <div className="flex h-5 items-center mb-3">
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
            {/* stroke 7: cover 106 on 120 → (120-106)/2 ≈ 7 */}
            <div className="shrink-0 self-center">
              <SuccessDonut value={successProbability} size={120} stroke={7} whiteCover />
            </div>
          </div>
        </div>
      </div>

      {/* PC(lg+): 피그마 회색 카드 — 라벨+날짜 / 제목+설명 가로 / 우측 120 도넛 */}
      <div className="hidden lg:block">
        <div className="rounded-[12px] bg-neutral-10 px-10 py-6 dark:bg-neutral-20">
          <div className="flex items-center justify-between gap-10">
            <div className="min-w-0 flex-1 max-w-[800px]">
              <div className="flex h-6 items-center">
                <p className="inline-flex h-5 items-center text-[16px] font-medium leading-5 tracking-[-0.04em] text-neutral-60">
                  AI 분석 추천
                </p>
                <div className="ml-1 shrink-0 inline-flex h-6 items-center">
                  <DisclaimerInfoTooltip label="AI 분석 추천 안내">
                    본 기능은 고객 상담을 돕기 위한{" "}
                    <span className="font-extrabold">사전 분석 참고 도구</span>이며
                    <br />
                    법률 자문 또는 결과 보장을 제공하지 않습니다.
                  </DisclaimerInfoTooltip>
                </div>
                <span className="ml-4 inline-flex h-5 items-center text-[14px] font-medium leading-5 text-neutral-50 whitespace-nowrap">
                  {formatDateTimeDisplay(detail.consultedAt)}
                </span>
              </div>

              <div className="mt-6 flex flex-row items-start gap-[68px]">
                <h3 className="shrink-0 text-[36px] font-extrabold leading-[43px] tracking-[-0.04em] text-neutral-90">
                  {recommendation.title}
                </h3>
                <p className="min-w-0 w-[690px] max-w-[690px] shrink-0 text-[14px] font-medium leading-5 tracking-[-0.02em] text-neutral-90 whitespace-pre-line">
                  {recommendation.description}
                </p>
              </div>
            </div>

            {/* stroke 7: cover 106 on 120 → (120-106)/2 ≈ 7 */}
            <div className="shrink-0 self-center">
              <SuccessDonut value={successProbability} size={120} stroke={7} whiteCover />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
