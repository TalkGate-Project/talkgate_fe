"use client";

import { useMemo, useState } from "react";
import type { DiagnosisMessage, DiagnosisMessageType } from "@/types/debtRelief";
import { formatDateTimeDisplay } from "@/components/debt-relief/format";

const TYPE_LABEL: Record<DiagnosisMessageType, string> = {
  share: "공유",
  reject: "반려",
  accept: "수락",
  fee_create: "결제",
  fee_update: "결제",
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TimelineDot({
  isLatest,
  isReject,
}: {
  isLatest: boolean;
  isReject: boolean;
}) {
  // 최신 항목: 파란점. 최신이 반려면 빨간점. 그 외 반려도 빨간점(시안), 나머지는 회색.
  const className = isReject
    ? "bg-danger-20"
    : isLatest
      ? "bg-secondary-20"
      : "bg-neutral-30";

  return (
    <span
      className={`relative z-[1] block h-3 w-3 shrink-0 rounded-full ${className}`}
      aria-hidden
    />
  );
}

export default function SectionDeliveryMessages({
  messages,
}: {
  messages: DiagnosisMessage[];
}) {
  // false(접힘, 기본값) = 약 3건 높이로 제한하고 넘치면 내부 스크롤. true(펼침) = 높이 제한 없이 전체 표시.
  const [expanded, setExpanded] = useState(false);

  const ordered = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [messages]
  );

  if (ordered.length === 0) return null;

  return (
    <section
      className="rounded-[12px] border border-secondary-20 bg-card dark:border-secondary-40"
      aria-label="전달사항"
    >
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="text-[16px] font-semibold leading-[19px] tracking-[-0.02em] text-foreground">
          전달사항
        </h3>
        <span className="text-neutral-50 dark:text-neutral-60">
          <ChevronIcon expanded={expanded} />
        </span>
      </button>

      <ul
        className={`px-6 py-4 ${
          expanded ? "" : "max-h-[260px] overflow-y-auto"
        }`}
      >
        {ordered.map((item, index) => {
          const isLatest = index === 0;
          const isLast = index === ordered.length - 1;
          const isReject = item.type === "reject";
          const meta = [item.memberName, item.projectName].filter(Boolean).join(" ");

          return (
            <li key={`${item.type}-${item.createdAt}-${index}`} className="flex gap-3">
              {/* 점 아래부터 다음 행 시작까지 세로선이 이어져 점·점 사이 빈 공간이 없음 */}
              <div className="flex w-3 shrink-0 flex-col items-center self-stretch">
                <TimelineDot isLatest={isLatest} isReject={isReject} />
                {!isLast ? <span className="w-px flex-1 bg-neutral-30" aria-hidden /> : null}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-6"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[13px] font-bold leading-4 tracking-[-0.02em] text-foreground">
                      {TYPE_LABEL[item.type]}
                    </span>
                    {meta ? (
                      <span className="text-[12px] font-normal leading-[14px] tracking-[-0.02em] text-neutral-50">
                        {meta}
                      </span>
                    ) : null}
                  </div>
                  <time
                    dateTime={item.createdAt}
                    className="shrink-0 whitespace-nowrap text-[14px] font-medium leading-5 text-neutral-50"
                  >
                    {formatDateTimeDisplay(item.createdAt)}
                  </time>
                </div>
                {item.message?.trim() ? (
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-80">
                    {item.message}
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-40 dark:text-neutral-60">
                    내용 없음
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
