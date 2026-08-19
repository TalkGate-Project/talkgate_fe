"use client";

import InfoCircleIcon from "@/components/common/icons/InfoCircleIcon";
import type { ProcedureGuideDetail, ProcedureGuideNoteType } from "@/services/procedureGuide";

function WarningIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.75 14.5 13H1.5L8 1.75Z" fill="#EFB008" />
      <path d="M8 5.75v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.75" fill="white" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    box: "bg-warning-10/50 dark:bg-[rgb(var(--color-amber-600-rgb)/0.3)]",
    text: "text-warning-100 dark:text-warning-40",
  },
  info: {
    box: "bg-secondary-10/50 dark:bg-[rgb(var(--color-blue-600-rgb)/0.3)]",
    text: "text-secondary-100 dark:text-secondary-20",
  },
  tip: {
    box: "bg-primary-10/50 dark:bg-[rgb(var(--color-green-100-rgb)/0.18)]",
    text: "text-primary-100 dark:text-primary-10",
  },
};

function NoteBadge({ type, text }: { type: ProcedureGuideNoteType; text: string }) {
  const style = NOTE_STYLE[type];
  return (
    <div className={`inline-flex min-h-7 max-w-full items-center gap-2 rounded-[5px] px-3 py-1 ${style.box}`}>
      <span className={`shrink-0 ${style.text}`}>
        {type === "warning" && <WarningIcon />}
        {type === "info" && <InfoCircleIcon size={16} />}
        {type === "tip" && <TipIcon />}
      </span>
      <span className={`text-[13px] font-medium leading-5 tracking-[-0.02em] opacity-80 ${style.text}`}>
        {text}
      </span>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="surface px-4 py-6 md:rounded-[14px] md:px-7 md:py-6 md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
      {children}
    </section>
  );
}

function SectionHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-30 pb-4">
      <h2 className="text-[16px] font-semibold leading-5 tracking-[-0.02em] text-foreground">
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function ProcedureSummary({ detail }: { detail: ProcedureGuideDetail }) {
  const cards = [
    { label: "운영기관", value: detail.summary.operator },
    { label: "소요기간", value: detail.summary.duration },
    { label: "원금조정", value: detail.summary.principalAdjustment },
    { label: "이자 감면", value: detail.summary.interestReduction },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-7 md:grid-cols-4 md:gap-5 md:px-6">
      {cards.map((card) => (
        <div key={card.label} className="flex min-h-[106px] flex-col justify-center rounded-[12px] bg-neutral-10 px-4 py-5 dark:bg-neutral-20 md:min-h-[113px] md:px-7">
          <p className="text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-neutral-60">
            {card.label}
          </p>
          <p className="mt-3 text-[16px] font-semibold leading-5 tracking-[-0.02em] text-foreground md:text-[24px] md:leading-[29px]">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function EligibilityPanel({ title, titleClassName, items }: { title: string; titleClassName: string; items: ProcedureGuideDetail["eligibleApplicable"] }) {
  return (
    <div className="min-h-[348px] rounded-[12px] bg-neutral-10 px-5 py-5 dark:bg-neutral-20 md:px-7">
      <h3 className={`text-[16px] font-semibold leading-5 tracking-[-0.02em] ${titleClassName}`}>{title}</h3>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-80">{item.label}</p>
            <p className="mt-1 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">{item.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConditionsSection({ detail }: { detail: ProcedureGuideDetail }) {
  const midpoint = Math.ceil(detail.debtConditions.length / 2);
  const columns = [detail.debtConditions.slice(0, midpoint), detail.debtConditions.slice(midpoint)];

  return (
    <SectionCard>
      <SectionHeading>채무조건</SectionHeading>
      <div className="mt-4 grid gap-x-10 gap-y-3 rounded-[12px] border border-neutral-30 px-5 py-5 md:grid-cols-2 md:px-7">
        {columns.map((column, columnIndex) => (
          <dl key={columnIndex} className="flex min-w-0 flex-col gap-3">
            {column.map((condition) => (
              <div key={condition.label} className="grid min-w-0 grid-cols-1 gap-1 md:grid-cols-[140px_minmax(0,1fr)] md:gap-7">
                <dt className="text-[13px] font-semibold leading-5 tracking-[-0.02em] text-neutral-80">{condition.label}</dt>
                <dd className="min-w-0 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">{condition.value}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </SectionCard>
  );
}

function EffectsSection({ detail }: { detail: ProcedureGuideDetail }) {
  return (
    <SectionCard>
      <SectionHeading>주요효과</SectionHeading>
      <dl className="mt-4 flex flex-col gap-3 rounded-[12px] border border-neutral-30 px-5 py-5 md:px-7">
        {detail.effects.map((effect) => (
          <div key={effect.label} className="grid min-w-0 grid-cols-1 gap-1 md:grid-cols-[145px_minmax(0,1fr)] md:gap-7">
            <dt className="text-[13px] font-semibold leading-5 tracking-[-0.02em] text-foreground">{effect.label}</dt>
            <dd className="min-w-0 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">{effect.desc}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

function WarningsSection({ detail }: { detail: ProcedureGuideDetail }) {
  return (
    <SectionCard>
      <SectionHeading>주의사항</SectionHeading>
      <ul className="mt-4 flex flex-col gap-3">
        {detail.warnings.map((warning) => (
          <li key={warning} className="flex min-h-12 items-center gap-3 rounded-[12px] bg-warning-10/50 px-5 py-3 text-warning-100 dark:bg-[rgb(var(--color-amber-600-rgb)/0.3)] dark:text-warning-40">
            <WarningIcon />
            <span className="text-[14px] font-medium leading-5 tracking-[-0.02em] opacity-80">{warning}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function TimelineSection({ detail }: { detail: ProcedureGuideDetail }) {
  return (
    <SectionCard>
      <SectionHeading aside={<span className="text-[13px] font-medium leading-4 tracking-[-0.02em] text-neutral-60">{detail.summary.duration}</span>}>
        절차 ({detail.steps.length}단계)
      </SectionHeading>
      <ol className="mt-6">
        {detail.steps.map((step, index) => {
          const isLast = index === detail.steps.length - 1;
          return (
            <li key={step.no} className={`relative pl-6 ${isLast ? "" : "pb-5"}`}>
              <span className="absolute left-0 top-1.5 z-[1] h-3 w-3 rounded-full bg-neutral-30" aria-hidden />
              {!isLast && <span className="absolute bottom-0 left-[5px] top-[18px] w-px bg-neutral-30" aria-hidden />}
              <div className="flex min-h-[22px] items-start justify-between gap-3">
                <h3 className="pt-0.5 text-[13px] font-semibold leading-5 tracking-[-0.02em] text-foreground">{index + 1}. {step.title}</h3>
                <span className="shrink-0 rounded-full bg-neutral-20 px-3 py-1 text-[12px] font-medium leading-[14px] text-neutral-60">{step.duration}</span>
              </div>
              <div className="mt-2 rounded-[12px] border border-neutral-30 bg-neutral-10 px-5 py-5 dark:bg-neutral-20">
                <p className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">{step.description}</p>
                {step.bullets.length > 0 && (
                  <ul className="mt-1">
                    {step.bullets.map((bullet) => (
                      <li key={bullet} className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">· {bullet}</li>
                    ))}
                  </ul>
                )}
                {step.notes && step.notes.length > 0 && (
                  <div className="mt-3 flex flex-col items-start gap-2">
                    {step.notes.map((note, noteIndex) => (
                      <NoteBadge key={`${note.type}-${noteIndex}`} type={note.type} text={note.text} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

export default function ProcedureDetailView({ detail }: { detail: ProcedureGuideDetail }) {
  return (
    <div className="flex flex-col gap-5 md:gap-9">
      <SectionCard>
        <SectionHeading>신청대상</SectionHeading>
        <p className="mt-4 text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-80">{detail.target}</p>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7">
          <EligibilityPanel title="적용가능" titleClassName="text-primary-100" items={detail.eligibleApplicable} />
          <EligibilityPanel title="제외 또는 주의" titleClassName="text-danger-40" items={detail.eligibleExcluded} />
        </div>
      </SectionCard>
      <ConditionsSection detail={detail} />
      <EffectsSection detail={detail} />
      <WarningsSection detail={detail} />
      <TimelineSection detail={detail} />
    </div>
  );
}
