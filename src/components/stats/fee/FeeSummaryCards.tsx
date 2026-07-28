"use client";

import type { FeeStatisticsSummary } from "@/types/analysisFeeStatistics";
import { formatWonAsManwonNumber } from "./feeFormat";

type FeeSummaryCardsProps = {
  summary: FeeStatisticsSummary | null | undefined;
  isLoading: boolean;
  isError: boolean;
};

type CardTone = "paid" | "scheduled" | "unpaid" | "refunded";

/** 피그마 순서: 납부완료 → 결제예정 → 미납 → 환불 */
const CARD_META: {
  key: keyof FeeStatisticsSummary;
  tone: CardTone;
  label: string;
  countClass: string;
}[] = [
  {
    key: "paid",
    tone: "paid",
    label: "납부완료",
    countClass: "text-[#00B55B]",
  },
  {
    key: "scheduled",
    tone: "scheduled",
    label: "결제예정",
    countClass: "text-[#2563EB]",
  },
  {
    key: "unpaid",
    tone: "unpaid",
    label: "미납",
    countClass: "text-[#D83232]",
  },
  {
    key: "refunded",
    tone: "refunded",
    label: "환불",
    countClass: "text-[#595959]",
  },
];

function PaidIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle
        cx="28"
        cy="28"
        r="28"
        className="fee-summary-icon-bg-paid"
        fill="rgba(214, 250, 232, 0.5)"
      />
      <path
        d="M16 25.3337H40M21.3333 32.0003H22.6667M28 32.0003H29.3333M20 37.3337H36C38.2091 37.3337 40 35.5428 40 33.3337V22.667C40 20.4579 38.2091 18.667 36 18.667H20C17.7909 18.667 16 20.4579 16 22.667V33.3337C16 35.5428 17.7909 37.3337 20 37.3337Z"
        stroke="#00E272"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScheduledIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle
        cx="28"
        cy="28"
        r="28"
        className="fee-summary-icon-bg-scheduled"
        fill="rgba(228, 237, 255, 0.5)"
      />
      <path
        d="M28 22.6667V28L32 32M40 28C40 34.6274 34.6274 40 28 40C21.3726 40 16 34.6274 16 28C16 21.3726 21.3726 16 28 16C34.6274 16 40 21.3726 40 28Z"
        stroke="#4D82F3"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UnpaidIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle
        cx="28"
        cy="28"
        r="28"
        className="fee-summary-icon-bg-unpaid"
        fill="rgba(255, 235, 235, 0.5)"
      />
      <path
        d="M28 24V26.6667M28 32H28.0134M18.7624 37.3333H37.2376C39.2904 37.3333 40.5735 35.1111 39.5471 33.3333L30.3094 17.3333C29.283 15.5556 26.717 15.5556 25.6906 17.3333L16.453 33.3333C15.4266 35.1111 16.7096 37.3333 18.7624 37.3333Z"
        stroke="#D83232"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefundedIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle
        cx="28"
        cy="28"
        r="28"
        className="fee-summary-icon-bg-refunded"
        fill="#EDEDED"
      />
      <path
        d="M33.3335 32V30.6667C33.3335 27.7211 30.9457 25.3333 28.0002 25.3333H22.6668M26.6668 21.3333L22.6668 25.3333L26.6668 29.3333M38.6668 40V18.6667C38.6668 17.1939 37.4729 16 36.0002 16H20.0002C18.5274 16 17.3335 17.1939 17.3335 18.6667V40L22.6668 37.3333L28.0002 40L33.3335 37.3333L38.6668 40Z"
        stroke="#808080"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusIcon({ tone }: { tone: CardTone }) {
  if (tone === "paid") return <PaidIcon />;
  if (tone === "scheduled") return <ScheduledIcon />;
  if (tone === "unpaid") return <UnpaidIcon />;
  return <RefundedIcon />;
}

export default function FeeSummaryCards({
  summary,
  isLoading,
  isError,
}: FeeSummaryCardsProps) {
  if (isError) {
    return (
      <div className="flex h-[148px] items-center justify-center rounded-[14px] border border-dashed border-danger-20 bg-danger-10 px-6 text-[14px] text-danger-40">
        결제 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  return (
    // 모바일·태블릿: 2×2 / PC(lg+): 1×4
    <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
      {CARD_META.map((card) => {
        const bucket = summary?.[card.key];
        return (
          <div
            key={card.key}
            className="flex h-auto min-h-[96px] items-center gap-3 rounded-[14px] border border-white bg-neutral-10 px-3 py-4 md:h-[148px] md:gap-6 md:px-7 md:py-0 dark:border-neutral-20"
          >
            <div className="w-8 h-8 shrink-0 md:w-14 md:h-14">
              <StatusIcon tone={card.tone} />
            </div>

            <div className="flex min-w-0 flex-col">
              <p className="text-[14px] font-medium leading-[17px] text-neutral-60">
                {card.label}
              </p>

              {isLoading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-[34px] w-28 animate-pulse rounded bg-neutral-20" />
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-20" />
                </div>
              ) : (
                <>
                  {/* 피그마: 모바일 Montserrat 18 / 데스크톱 28, "만원" 병기 */}
                  <p className="mt-2 flex items-end gap-1.5">
                    <span className="font-montserrat text-[18px] font-bold leading-[20px] tracking-[-0.02em] text-neutral-90 md:text-[28px] md:leading-[34px]">
                      {formatWonAsManwonNumber(bucket?.amount ?? 0)}
                    </span>
                    <span className="pb-0.5 text-[12px] font-semibold leading-[17px] text-neutral-90 md:pb-1.5 md:text-[16px]">
                      만원
                    </span>
                  </p>
                  <p
                    className={`mt-2 text-[14px] font-bold leading-[17px] opacity-80 ${card.countClass}`}
                  >
                    {(bucket?.count ?? 0).toLocaleString("ko-KR")}건
                    {/* TODO: overdueCount when API provides it (미납 카드 "기한초과 N건 포함") */}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
