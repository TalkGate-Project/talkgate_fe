"use client";

import InfoCircleIcon from "@/components/common/icons/InfoCircleIcon";
import type { ProcedureGuideDetail, ProcedureGuideNoteType } from "./procedureGuideData";

function WarningIcon() {
  return (
    <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1.5L13 12H1L7 1.5Z" fill="#EFB008" />
      <path d="M7 5.5v3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="10.2" r="0.7" fill="white" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.4.3.6.8.6 1.3V16h5.8v-.8c0-.5.2-1 .6-1.3A6 6 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NOTE_STYLE: Record<ProcedureGuideNoteType, { box: string; text: string }> = {
  warning: {
    box: "bg-warning-10 dark:bg-[rgb(var(--color-amber-600-rgb)/0.3)]",
    text: "text-warning-100 dark:text-warning-40",
  },
  info: {
    box: "bg-secondary-10 dark:bg-[rgb(var(--color-blue-600-rgb)/0.3)]",
    text: "text-secondary-100 dark:text-secondary-20",
  },
  tip: {
    box: "bg-primary-10 dark:bg-[rgb(var(--color-green-100-rgb)/0.3)]",
    text: "text-primary-100 dark:text-primary-10",
  },
};

function NoteBadge({ type, text }: { type: ProcedureGuideNoteType; text: string }) {
  const style = NOTE_STYLE[type];
  return (
    <div
      className={`inline-flex items-start gap-1.5 max-w-full min-h-7 px-3 py-1.5 rounded-[5px] ${style.box}`}
    >
      <span className={`shrink-0 ${style.text}`}>
        {type === "warning" && <WarningIcon />}
        {type === "info" && <InfoCircleIcon size={14} />}
        {type === "tip" && <TipIcon />}
      </span>
      <span
        className={`text-[12px] md:text-[14px] font-medium leading-[15px] md:leading-[17px] opacity-80 ${style.text}`}
      >
        {text}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] md:text-[16px] font-semibold leading-[19px] text-foreground">
      {children}
    </h3>
  );
}

interface ProcedureDetailViewProps {
  detail: ProcedureGuideDetail;
}

export default function ProcedureDetailView({ detail }: ProcedureDetailViewProps) {
  return (
    <div className="flex flex-col gap-7">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "운영 기관", value: detail.summary.operator },
          { label: "소요 기간", value: detail.summary.duration },
          { label: "원금 조정", value: detail.summary.principalAdjustment },
          { label: "이자 감면", value: detail.summary.interestReduction },
        ].map((card) => (
          <div key={card.label} className="rounded-[10px] bg-neutral-10 dark:bg-neutral-20 px-4 py-3.5">
            <p className="text-[12px] font-medium leading-4 text-neutral-60 mb-1">{card.label}</p>
            <p className="text-[14px] md:text-[15px] font-semibold leading-5 text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* 신청 대상 + 적용가능/제외 */}
      <div className="flex flex-col gap-4">
        <div>
          <SectionTitle>신청 대상</SectionTitle>
          <p className="mt-2 text-[14px] font-medium leading-5 text-neutral-80">{detail.target}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rounded-[12px] border border-neutral-30 p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold leading-4 text-primary-100 pb-2 border-b border-neutral-30">
              적용 가능
            </p>
            <ul className="flex flex-col gap-3">
              {detail.eligibleApplicable.map((item) => (
                <li key={item.label}>
                  <p className="text-[13px] font-semibold leading-4 text-foreground">{item.label}</p>
                  <p className="mt-1 text-[13px] font-medium leading-5 text-neutral-60">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold leading-4 text-danger-60 pb-2 border-b border-neutral-30">
              제외 또는 주의
            </p>
            <ul className="flex flex-col gap-3">
              {detail.eligibleExcluded.map((item) => (
                <li key={item.label}>
                  <p className="text-[13px] font-semibold leading-4 text-foreground">{item.label}</p>
                  <p className="mt-1 text-[13px] font-medium leading-5 text-neutral-60">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 채무 조건 */}
      <div>
        <SectionTitle>채무 조건</SectionTitle>
        <div className="mt-3 rounded-[12px] border border-neutral-30 divide-y divide-neutral-30">
          {detail.debtConditions.map((condition) => (
            <div
              key={condition.label}
              className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3"
            >
              <p className="w-[140px] shrink-0 text-[13px] font-medium leading-5 text-neutral-60">
                {condition.label}
              </p>
              <p className="text-[13px] font-semibold leading-5 text-foreground">{condition.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 주요 효과 */}
      <div>
        <SectionTitle>주요 효과</SectionTitle>
        <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {detail.effects.map((effect) => (
            <li key={effect.label} className="rounded-[10px] bg-neutral-10 dark:bg-neutral-20 px-4 py-3.5">
              <p className="text-[13px] font-semibold leading-4 text-foreground">{effect.label}</p>
              <p className="mt-1.5 text-[13px] font-medium leading-5 text-neutral-60">{effect.desc}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* 주의사항 */}
      <div>
        <SectionTitle>주의사항</SectionTitle>
        <ul className="mt-3 flex flex-col gap-2">
          {detail.warnings.map((warning) => (
            <li key={warning}>
              <NoteBadge type="warning" text={warning} />
            </li>
          ))}
        </ul>
      </div>

      {/* 절차 — 좌측 레일(원형 번호 + svg 연결선)과 우측 콘텐츠 카드로 분리. 레일은 li와 같은 높이로
          늘어나므로(flex 기본 stretch) 콘텐츠 길이가 제각각이어도 다음 원 중심까지 선이 정확히 이어진다. */}
      <div>
        <SectionTitle>절차 ({detail.steps.length}단계)</SectionTitle>
        <ul className="mt-3 flex flex-col">
          {detail.steps.map((step, index) => {
            const isLast = index === detail.steps.length - 1;
            return (
              <li key={step.no} className="flex gap-3 md:gap-4">
                <div className="relative flex w-7 shrink-0 flex-col items-center">
                  <span className="relative z-[1] w-7 h-7 shrink-0 rounded-full grid place-items-center bg-neutral-20 text-neutral-70 text-[13px] font-semibold leading-4 tracking-[-0.02em]">
                    {step.no}
                  </span>
                  {!isLast && (
                    <svg
                      className="absolute left-1/2 top-7 bottom-0 -translate-x-1/2"
                      width="2"
                      height="100%"
                      viewBox="0 0 2 100"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2="100"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        className="stroke-neutral-30"
                      />
                    </svg>
                  )}
                </div>

                <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                  <div className="rounded-[12px] border border-neutral-30 bg-neutral-0 px-4 md:px-6 py-4">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-[14px] font-semibold leading-5 tracking-[-0.02em] text-foreground">
                        {step.title}
                      </span>
                      <span className="text-[12px] font-medium leading-4 tracking-[-0.02em] text-neutral-60">
                        {step.duration}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">
                      {step.description}
                    </p>
                    {step.bullets.length > 0 && (
                      <ul className="mt-2 flex flex-col">
                        {step.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60"
                          >
                            · {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                    {step.notes && step.notes.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {step.notes.map((note, noteIndex) => (
                          <NoteBadge key={noteIndex} type={note.type} text={note.text} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
