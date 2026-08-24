"use client";

import type { ProcedureGuideDetail, ProcedureGuideNoteType } from "@/services/procedureGuide";

function WarningIcon() {
  return (
    <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25706 3.09956C9.02167 1.74025 10.9788 1.74025 11.7434 3.09956L17.3237 13.0201C18.0736 14.3533 17.1102 16.0006 15.5805 16.0006H4.4199C2.89025 16.0006 1.92682 14.3533 2.67675 13.0201L8.25706 3.09956ZM11.0001 13.0007C11.0001 13.553 10.5524 14.0007 10.0001 14.0007C9.44784 14.0007 9.00012 13.553 9.00012 13.0007C9.00012 12.4484 9.44784 12.0007 10.0001 12.0007C10.5524 12.0007 11.0001 12.4484 11.0001 13.0007ZM10.0001 5.00073C9.44784 5.00073 9.00012 5.44845 9.00012 6.00073V9.00073C9.00012 9.55302 9.44784 10.0007 10.0001 10.0007C10.5524 10.0007 11.0001 9.55302 11.0001 9.00073V6.00073C11.0001 5.44845 10.5524 5.00073 10.0001 5.00073Z"
        fill="#EFB008"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10ZM11 14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14C9 13.4477 9.44772 13 10 13C10.5523 13 11 13.4477 11 14ZM10 5C9.44772 5 9 5.44772 9 6V10C9 10.5523 9.44772 11 10 11C10.5523 11 11 10.5523 11 10V6C11 5.44772 10.5523 5 10 5Z"
        fill="#4D82F3"
      />
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
    box: "bg-procedure-warning-note",
    text: "text-warning-100 dark:text-warning-40",
  },
  info: {
    box: "bg-procedure-info-note",
    text: "text-secondary-100 dark:text-secondary-20",
  },
  tip: {
    box: "bg-procedure-tip-note",
    text: "text-primary-80 dark:text-primary-60",
  },
};

function NoteBadge({ type, text }: { type: ProcedureGuideNoteType; text: string }) {
  const style = NOTE_STYLE[type];
  return (
    <div className={`inline-flex min-h-7 max-w-full items-center gap-1 rounded-[5px] px-3 py-1 ${style.box}`}>
      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center ${style.text}`}>
        {type === "warning" && <WarningIcon />}
        {type === "info" && <InfoIcon />}
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
    <section className="surface px-[clamp(16px,6.4vw,24px)] py-0 md:rounded-[14px] md:px-7 md:py-6 md:shadow-[0_13px_61px_rgba(169,169,169,0.12)] dark:shadow-none">
      {children}
    </section>
  );
}

function SectionHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-30 pb-3 md:pb-4">
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
    {
      label: "원금 조정",
      value: detail.summary.principalAdjustment.emphasis,
      qualifier: detail.summary.principalAdjustment.qualifier,
      isEffect: true,
    },
    {
      label: "이자 감면",
      value: detail.summary.interestReduction.emphasis,
      qualifier: detail.summary.interestReduction.qualifier,
      isEffect: true,
    },
  ];

  return (
    <div className="px-[clamp(16px,6.4vw,24px)] pb-0 pt-5 md:px-6 md:py-7">
      <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex min-h-[77px] min-w-0 flex-col justify-center rounded-[8px] bg-neutral-10 px-4 py-4 dark:bg-neutral-20 md:min-h-[113px] md:rounded-[12px] md:px-7 md:py-5"
          >
            <p className="text-[14px] font-medium leading-[17px] tracking-[-0.02em] text-neutral-60">
              {card.label}
            </p>
            <p
              className={`mt-2 break-keep font-bold text-foreground md:mt-3 ${
                card.isEffect
                  ? "text-[20px] leading-6 tracking-[-0.02em] md:text-[24px] md:leading-7"
                  : "text-[16px] leading-[19px] tracking-[-0.04em] md:text-[20px] md:leading-6 md:tracking-[-0.02em]"
              }`}
            >
              {card.value}
            </p>
            {card.qualifier ? (
              <p className="mt-1 break-keep text-[13px] font-semibold leading-4 tracking-[-0.02em] text-neutral-60">
                {card.qualifier}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <NoteBadge
          type="info"
          text="표시된 조정·감면 범위는 일반적인 안내이며, 실제 결과는 신청인의 상황과 심사 및 변제계획 이행 결과에 따라 달라질 수 있어요."
        />
      </div>
    </div>
  );
}

function EligibilityPanel({ title, titleClassName, items }: { title: string; titleClassName: string; items: ProcedureGuideDetail["eligibleApplicable"] }) {
  return (
    <div className="rounded-[12px] bg-neutral-10 px-4 py-4 dark:bg-neutral-20 md:min-h-[348px] md:px-7 md:py-5">
      <h3 className={`text-[16px] font-semibold leading-5 tracking-[-0.02em] ${titleClassName}`}>{title}</h3>
      <ul className="mt-4 flex flex-col gap-5 md:gap-4">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-neutral-80">{item.label}</p>
            <p className="mt-1 text-[13px] font-medium leading-4 tracking-[-0.04em] text-neutral-60 md:leading-5 md:tracking-[-0.02em]">{item.desc}</p>
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
          <li key={warning} className="flex min-h-12 items-center gap-2 rounded-[12px] bg-procedure-warning-note px-5 py-3 text-warning-100 dark:text-warning-40">
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
        <p className="mt-3 text-[14px] font-medium leading-5 tracking-[-0.02em] text-neutral-80 md:mt-4 md:text-[13px]">{detail.target}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-7">
          <EligibilityPanel title="적용가능" titleClassName="text-primary-80" items={detail.eligibleApplicable} />
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
