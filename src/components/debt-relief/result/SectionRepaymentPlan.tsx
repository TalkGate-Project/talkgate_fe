import type { DiagnosisDetail, RecommendedProcedure, RepaymentPlan } from "@/types/debtRelief";
import { formatManwonComma } from "@/components/debt-relief/format";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";

// "절차별 성공 가능성"에서 고른 절차에 따라 이 섹션의 구성이 통째로 바뀐다(2026-08-07 백엔드
// 확정 지침). 백엔드가 expectedRepayment를 절차별로 다르게 내려주는 이유와 1:1 대응된다:
// - full: 개인회생/새출발기금/개인워크아웃 — 실제 월 분할 변제 스케줄이 있는 절차. 기존 UI 그대로
//   (3행 패널 + 타임라인 슬라이더 + 면책/잔여 두 박스).
// - bankruptcy_result: 파산 — expectedRepayment는 있지만 monthlyPayment/periodMonths/
//   totalPayment가 항상 0이다(분할 변제 개념 자체가 없음, 전액 면책만 있음). "예상 면책 결과"로
//   타이틀을 바꾸고, 의미 없는 0값 3행 패널과 타임라인은 그리지 않는다.
// - adjustment_summary: 신속채무조정/프리워크아웃 — expectedRepayment가 게이트와 무관하게
//   항상 null이다(2026-08-07 실 데이터로 확인: expectedRepayment.pre_workout === null).
//   보여줄 수치 자체가 없어 "예상 조정 요약" 타이틀 아래 안내 문구만 표시한다.
type RepaymentSectionKind = "full" | "bankruptcy_result" | "adjustment_summary";

const ADJUSTMENT_SUMMARY_PROCEDURES: readonly RecommendedProcedure[] = [
  "speedy_debt_adjustment",
  "pre_workout",
];

function resolveSectionKind(procedure: RecommendedProcedure): RepaymentSectionKind {
  if (procedure === "bankruptcy") return "bankruptcy_result";
  if (ADJUSTMENT_SUMMARY_PROCEDURES.includes(procedure)) return "adjustment_summary";
  return "full";
}

const SECTION_TITLE: Record<RepaymentSectionKind, string> = {
  full: "예상 변제 계획",
  bankruptcy_result: "예상 면책 결과",
  adjustment_summary: "예상 조정 요약",
};

// 예상 잔여 채무 박스의 부제 — 파산만 문구가 다르다("면책 시 갚을 금액"). 나머지(개인회생/
// 새출발기금/개인워크아웃)는 "절차 진행 시 갚아야 하는 금액"으로 동일(2026-08-08 샘플사이트 확인).
const REMAINING_DEBT_SUBTITLE: Record<RepaymentSectionKind, string> = {
  full: "절차 진행 시 갚아야 하는 금액",
  bankruptcy_result: "면책 시 갚을 금액 (세금 등 제외채무 별도)",
  adjustment_summary: "",
};

type SummaryRow = { label: string; value: string };
type BucketSummaryContent = { rows: SummaryRow[]; sentence: string };

// ⚠️ 이 표의 라벨·값·문장은 API 응답이 아니라 프론트 하드코딩이다. 파산/신속채무조정/프리워크아웃은
// expectedRepayment가 없거나(신속·프리는 null) 의미 없는 0값(파산)이라, 절차 자체의 일반적 특성
// (감면 방식·상환기간 등)을 설명하는 교육용 문구를 대신 보여준다 — 개별 분석 결과에 따라 달라지는
// 값이 아니라 절차 3종 고정 문구다(2026-08-08 샘플사이트 텍스트 그대로 옮김, 법무 검토 전 워딩).
const BUCKET_SUMMARY: Partial<Record<RecommendedProcedure, BucketSummaryContent>> = {
  bankruptcy: {
    rows: [
      { label: "변제 계획", value: "해당 없음" },
      { label: "핵심 결과", value: "잔여 채무 면책" },
      { label: "자산", value: "환가·처분 검토 대상" },
    ],
    sentence: "파산은 월 변제 계획보다 면책 가능 여부와 자산 처분·취업 제한이 핵심입니다.",
  },
  speedy_debt_adjustment: {
    rows: [
      { label: "조정 방식", value: "이자율 인하 · 분할상환" },
      { label: "원금 감면", value: "없음" },
      { label: "상환 기간", value: "최장 10년" },
    ],
    sentence: "원금 감면 없이 이자·기간 조정이 중심이라 월 변제 계획보다 조정 조건이 중요합니다.",
  },
  pre_workout: {
    rows: [
      { label: "조정 방식", value: "연체이자 감면 · 이자율 조정" },
      { label: "원금 감면", value: "원칙적으로 없음" },
      { label: "상환 기간", value: "최장 10년" },
    ],
    sentence:
      "연체 초기에 유리한 제도로, 장기 연체·고액 감면이 목적이면 개인워크아웃·회생과 비교가 필요합니다.",
  },
};

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

function PlanRowsPanel({ plan }: { plan: RepaymentPlan }) {
  return (
    // pad 32×17, 행 간격 16
    <div className="rounded-[12px] border border-neutral-30 px-5 md:px-8 py-[17px] flex flex-col gap-4 lg:min-h-[118px]">
      <PlanRow label="월 변제액" value={formatManwonComma(plan.monthlyPaymentManwon)} />
      <PlanRow label="변제 기간" value={`${plan.months}개월 (${plan.years}년)`} />
      <PlanRow label="총 변제액" value={formatManwonComma(plan.totalPaymentManwon)} />
    </div>
  );
}

// 절차별 3행 요약표 + 설명 문장 — 파산/신속채무조정/프리워크아웃 전용(BUCKET_SUMMARY 참고).
function SummaryInfoCard({ content }: { content: BucketSummaryContent }) {
  return (
    <div className="rounded-[12px] border border-neutral-30 px-5 md:px-8 py-[17px] flex flex-col gap-4 lg:min-h-[118px]">
      <div className="flex flex-col gap-4">
        {content.rows.map((row) => (
          <PlanRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
      <p className="text-[13px] font-medium leading-[20px] text-neutral-60 pt-3 border-t border-neutral-30">
        {content.sentence}
      </p>
    </div>
  );
}

/** 금액 + 만원 단위 — 피그마 Frame 1000001015 (숫자 Montserrat 28 / 단위 Pretendard 14) */
function ExemptionAmount({ manwon }: { manwon: number }) {
  return (
    <p className="flex items-end gap-1">
      <span className="font-montserrat font-bold text-[20px] lg:text-[28px] leading-7 tracking-[-0.03em] text-neutral-70">
        약 {manwon.toLocaleString("ko-KR")}
      </span>
      <span className="text-[14px] font-semibold leading-[17px] text-neutral-60">만원</span>
    </p>
  );
}

/** 면책/잔여 금액 한 묶음 — 라벨(이자 포함/원금 기준) + 금액 */
function ExemptionAmountBlock({ label, manwon }: { label: string; manwon: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-medium leading-[17px] text-neutral-60">{label}</p>
      <ExemptionAmount manwon={manwon} />
    </div>
  );
}

function ExemptionBoxes({
  plan,
  remainingSubtitle,
}: {
  plan: RepaymentPlan;
  remainingSubtitle: string;
}) {
  // 이자 포함 값은 채무 상세입력 모드 건에만 존재 — 있으면 이자 포함·원금 기준을
  // gap 16px로 나란히 병기. 없으면 원금 기준만 표시(2026-08 피그마).
  const hasInterest = plan.exemptedDebtWithInterestManwon != null;

  return (
    // 피그마: 좌(면책) | Divider | 우(잔여). 타이틀 상단·설명 하단 정렬.
    // 이자 병기 시 좌측(이자+원금)이 더 넓어지므로 flex 비율을  asymmetric 하게 둔다.
    <div className="rounded-[12px] bg-neutral-10 px-6 md:px-8 lg:pl-11 py-5 lg:py-6 flex items-stretch gap-4 sm:gap-0 min-h-[99px] lg:min-h-[118px]">
      <div
        className={`min-w-0 flex flex-col gap-[10px] ${
          hasInterest ? "flex-[1.6]" : "flex-1"
        }`}
      >
        <p className="text-[14px] font-medium leading-[17px] text-neutral-70">예상 면책 채무</p>
        {/* gap-x는 "이자 포함" 값이 길어질 때 옆 칸("원금 기준")과 개행되지 않도록 25px보다 좁힘 */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {hasInterest && (
            <ExemptionAmountBlock
              label="이자 포함"
              manwon={plan.exemptedDebtWithInterestManwon!}
            />
          )}
          <ExemptionAmountBlock label="원금 기준" manwon={plan.exemptedDebtManwon} />
        </div>
        <p className="text-[13px] font-medium leading-4 text-neutral-50 mt-auto">
          변제 완료 후 탕감되는 금액
        </p>
      </div>

      {/* 피그마 Divider — 80px 세로선 */}
      <div
        className="hidden sm:block w-px h-20 bg-neutral-30 self-center shrink-0 mx-4 md:mx-6 lg:mx-8"
        aria-hidden
      />

      <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
        <p className="text-[14px] font-medium leading-[17px] text-neutral-70">예상 잔여 채무</p>
        {/* 잔여 채무는 이자 포함 값이 아예 없는 항목(RepaymentPlan에 필드 자체가 없음)이라
            항상 원금 기준 — 좌측과 같은 라벨을 붙여 여백도 채우고 정렬도 맞춘다. */}
        <ExemptionAmountBlock label="원금 기준" manwon={plan.totalPaymentManwon} />
        {remainingSubtitle && (
          <p className="text-[13px] font-medium leading-4 text-neutral-50 mt-auto">
            {remainingSubtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function PrecautionsList({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    // 제목→목록 8px, 줄간격 22
    <div className="min-w-0 flex flex-col">
      <p className="text-[14px] font-medium leading-[17px] text-neutral-60 mb-2">주의사항</p>
      <ul className="flex flex-col">
        {notes.map((note, index) => (
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
  );
}

export default function SectionRepaymentPlan({
  detail,
  selectedProcedure,
}: {
  detail: DiagnosisDetail;
  selectedProcedure: RecommendedProcedure;
}) {
  const kind = resolveSectionKind(selectedProcedure);
  const plan = detail.repaymentPlanByProcedure[selectedProcedure];

  return (
    <div className="flex flex-col gap-[21px]">
      <div>
        <div className="flex items-center gap-1">
          <h2 className="inline-flex h-6 items-center text-[16px] font-semibold leading-none tracking-[0.2px] text-foreground">
            {SECTION_TITLE[kind]}
          </h2>
          <DisclaimerInfoTooltip label={`${SECTION_TITLE[kind]} 안내`} maxWidthPx={480} fitContent>
            아래 금액·기간은 예상 시뮬레이션이며, 실제 인가·면책 범위는
            <br />
            법원 결정에 따라 달라질 수 있습니다.
          </DisclaimerInfoTooltip>
        </div>
        <div className="mt-3 border-t border-neutral-30" />
      </div>

      {kind === "full" && plan ? (
        // 피그마: 열 간격 28px, 행 간격 16px / 셀 620×118 — 그래프(타임라인)가 있는 절차만
        // 2x2 그리드(3행 패널+타임라인 / 면책·잔여 박스+주의사항)를 그대로 유지한다.
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-[28px] lg:gap-y-4">
          <PlanRowsPanel plan={plan} />
          <RepaymentTimeline
            months={plan.months}
            monthlyPaymentManwon={plan.monthlyPaymentManwon}
            consultedAt={detail.consultedAt}
          />
          <ExemptionBoxes plan={plan} remainingSubtitle={REMAINING_DEBT_SUBTITLE.full} />
          <PrecautionsList notes={detail.repaymentNotes} />
        </div>
      ) : (
        // 그래프(타임라인)가 없는 절차 — 파산/신속채무조정/프리워크아웃. 왼쪽 컬럼에 절차 요약표
        // (+파산이면 면책/잔여 박스까지)를 세로로 쌓고, 오른쪽 컬럼 전체를 주의사항이 차지한다
        // (2026-08-08 사용자 확인 — 그래프 없는 경우엔 좌우 2분할로 배치가 바뀐다).
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-[28px] lg:gap-y-4">
          <div className="flex flex-col gap-4">
            {BUCKET_SUMMARY[selectedProcedure] && (
              <SummaryInfoCard content={BUCKET_SUMMARY[selectedProcedure]!} />
            )}
            {/* 신속채무조정·프리워크아웃은 expectedRepayment가 항상 null이라 plan 자체가 없다 —
                면책/잔여 박스를 그릴 수치가 없으므로 요약표만 남는다. */}
            {plan && <ExemptionBoxes plan={plan} remainingSubtitle={REMAINING_DEBT_SUBTITLE[kind]} />}
          </div>
          <PrecautionsList notes={detail.repaymentNotes} />
        </div>
      )}
    </div>
  );
}
