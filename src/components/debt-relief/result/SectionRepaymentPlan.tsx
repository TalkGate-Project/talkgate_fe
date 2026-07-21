import type { DiagnosisDetail, RepaymentPlan } from "@/types/debtRelief";
import { formatManwonComma } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-medium leading-[17px] text-neutral-60">{label}</span>
      <span className="text-[14px] font-semibold leading-[17px] text-foreground">{value}</span>
    </div>
  );
}

/** notes 문자열의 **강조** 구간을 ExtraBold로 렌더 */
function renderNote(note: string) {
  const parts = note.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span
          key={index}
          className="font-extrabold text-[13px] leading-[22px] tracking-[-0.02em] text-neutral-70"
        >
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 size-5 md:size-6"
    >
      <path
        d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** consultedAt(ISO) → Date. 파싱 실패 시 null */
function parseConsultedAt(iso: string): Date | null {
  const datePart = iso.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1, day || 1);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}.${month}`;
}

function formatYearsLabel(months: number): string {
  const years = months / 12;
  if (Number.isInteger(years)) return String(years);
  return (Math.round(years * 10) / 10).toLocaleString("ko-KR");
}

function RepaymentTimeline({
  months,
  monthlyPaymentManwon,
  consultedAt,
}: {
  months: number;
  monthlyPaymentManwon: number;
  consultedAt: string;
}) {
  const startDate = parseConsultedAt(consultedAt);
  const endDate = startDate ? addMonths(startDate, months) : null;
  const startLabel = startDate ? formatYearMonth(startDate) : "—";
  const endLabel = endDate ? formatYearMonth(endDate) : "—";
  const monthlyLabel = formatManwonComma(monthlyPaymentManwon);
  const yearsLabel = formatYearsLabel(months);

  return (
    // 모바일 피그마: 327×118, pad 16, 헤더→타임라인 16, 타임라인 287×50
    // 데스크톱 피그마: 620×118, pad 20×16, 헤더→타임라인 12, 타임라인 max 446×50
    <div className="rounded-[12px] bg-neutral-10 px-4 py-4 md:px-5 flex flex-col gap-4 md:gap-3 min-h-[118px]">
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <p className="text-[14px] font-bold leading-[17px] md:text-[16px] md:leading-[19px] text-foreground">
          앞으로 {yearsLabel}년간 {monthlyLabel}씩 변제 예정입니다.
        </p>
      </div>

      <div className="relative mx-auto w-full md:max-w-[446px] h-[50px]">
        {/* Vector 563: secondary-20 (#7EA5F8) */}
        <div
          className="absolute left-[23px] right-[23px] top-[26px] h-px bg-secondary-20"
          aria-hidden
        />

        <div className="absolute left-0 top-0 flex flex-col items-center w-[47px]">
          <span className="text-[13px] font-medium leading-4 text-neutral-60">시작</span>
          <span
            className="mt-1 w-3 h-3 rounded-full bg-secondary-40 shadow-[0px_0px_7px_2px_#CDDDFF] dark:shadow-none"
            aria-hidden
          />
          <span className="mt-1 text-[12px] font-semibold leading-[14px] text-neutral-90 whitespace-nowrap">
            {startLabel}
          </span>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 -top-[5px] md:top-0">
          <span className="text-[13px] font-semibold leading-4 text-secondary-60 whitespace-nowrap">
            {months}개월 · {monthlyLabel}
          </span>
        </div>

        <div className="absolute right-0 top-0 flex flex-col items-center w-[45px]">
          <span className="text-[13px] font-medium leading-4 text-neutral-60">종료</span>
          <span
            className="mt-1 w-3 h-3 rounded-full bg-secondary-40 shadow-[0px_0px_7px_2px_#CDDDFF] dark:shadow-none"
            aria-hidden
          />
          <span className="mt-1 text-[12px] font-semibold leading-[14px] text-neutral-90 whitespace-nowrap">
            {endLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SectionRepaymentPlan({ detail }: { detail: DiagnosisDetail }) {
  const plan: RepaymentPlan = detail.repaymentPlan;

  return (
    <div className="flex flex-col gap-[21px]">
      <div>
        <div className="flex items-center gap-1">
          <h2 className="inline-flex h-6 items-center text-[16px] font-semibold leading-none tracking-[0.2px] text-foreground">
            예상 변제 계획
          </h2>
          <DisclaimerInfoTooltip label="예상 변제 계획 안내" maxWidthPx={480} fitContent>
            아래 금액·기간은 예상 시뮬레이션이며, 실제 인가·면책 범위는
            <br />
            법원 결정에 따라 달라질 수 있습니다.
          </DisclaimerInfoTooltip>
        </div>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      {/* 피그마: 열 간격 28px, 행 간격 16px / 셀 620×118 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-[28px] lg:gap-y-4">
        {/* 좌상: pad 32×17, 행 간격 16 */}
        <div className="rounded-[12px] border border-neutral-30 px-5 md:px-8 py-[17px] flex flex-col gap-4 lg:min-h-[118px]">
          <PlanRow label="월 변제액" value={formatManwonComma(plan.monthlyPaymentManwon)} />
          <PlanRow label="변제 기간" value={`${plan.months}개월 (${plan.years}년)`} />
          <PlanRow label="총 변제액" value={formatManwonComma(plan.totalPaymentManwon)} />
        </div>

        <RepaymentTimeline
          months={plan.months}
          monthlyPaymentManwon={plan.monthlyPaymentManwon}
          consultedAt={detail.consultedAt}
        />

        {/* 좌하: pad 32×16, 내부 간격 12 */}
        <div className="rounded-[12px] bg-neutral-10 px-5 md:px-8 py-4 flex flex-col gap-3 lg:min-h-[118px]">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60">예상 면책 채무</p>
          <p className="font-montserrat font-bold text-[28px] leading-7 tracking-[-0.03em] text-neutral-90">
            약 {formatManwonComma(plan.exemptedDebtManwon)}
          </p>
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60">
            변제 완료 후 법원 결정으로 면책되는 잔여 채무 금액입니다.
          </p>
        </div>

        {/* 우하: 제목→목록 8px, 줄간격 22 */}
        <div className="min-w-0 flex flex-col">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60 mb-2">주의사항</p>
          <ul className="flex flex-col">
            {plan.notes.map((note, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-[13px] font-medium leading-[22px] tracking-[-0.02em] text-neutral-70"
              >
                <span className="mt-[9px] w-1 h-1 rounded-full bg-neutral-50 shrink-0" aria-hidden />
                <span>{renderNote(note)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
