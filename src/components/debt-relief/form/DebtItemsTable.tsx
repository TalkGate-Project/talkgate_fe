"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import DatePicker from "@/components/common/DatePicker";
import CalendarInlineIcon from "@/components/common/icons/CalendarInlineIcon";
import InfoCircleIcon from "@/components/common/icons/InfoCircleIcon";
import Tooltip from "@/components/common/Tooltip";
import { SelectField } from "@/components/customers/detail/SelectField";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import { calculateDebtItemAmortization } from "@/services/debtRelief";
import {
  DEBT_ITEM_TYPE_OPTIONS,
  REPAYMENT_METHOD_OPTIONS,
  createEmptyDebtItem,
  type AssetItemFormState,
  type DebtItemFormState,
} from "@/types/debtRelief";
import { getMissingDebtItemFields } from "./validateDiagnosisForm";
import { PercentInput, TextInput, WonInput } from "./FormControls";
import { AssetIcon } from "./assetIcons";
import { isDebtCollateralLoan, normalizeCreditCardDebt } from "@/types/analysis";

type Props = {
  debts: DebtItemFormState[];
  assets: AssetItemFormState[];
  mode: "simple" | "detailed";
  onChange: (debts: DebtItemFormState[]) => void;
  /** 담보/무담보 합산 카드 배경. 기본(신규 폼)은 카드 배경(neutral-0)과 대비되는 neutral-10 그대로 두고,
      모달처럼 컨테이너 자체가 이미 neutral-10인 곳에서는 묻히지 않도록 호출부에서 오버라이드한다. */
  sumCardBackgroundClassName?: string;
  /** 제출을 한 번 시도해 대출일·만기일·금액·금리 중 비어있는 값이 발견됐으면 true.
      이후 값이 채워지면 매 렌더마다 재계산되어 해당 셀만 즉시 해제된다. */
  showFieldErrors?: boolean;
  /** 자산 카드 안에서 새 행을 만들 때 해당 자산을 담보로 자동 연결한다. */
  defaultCollateralAssetId?: string;
  /** 담보/무담보/전체 합계 카드 표시 여부. 자산별 담보 표에서는 숨긴다. */
  showSummaryCards?: boolean;
  /** 자산 현황용 축약 표: 채무종류·채권처·연체·현재 잔액만 표시한다. */
  assetCollateralOnly?: boolean;
  /** 채무 현황에서 삭제할 수 없고 담보 선택을 비활성화할 행 ID. */
  lockedDebtIds?: readonly string[];
  /** 넘김 버튼 뒤 그라데이션이 맞닿는 컨테이너 색. 호출 화면의 실제 배경색에 맞춰 오버라이드한다. */
  scrollFadeColorClassName?: string;
  /** 합계 카드가 3열로 전환되는 기준. 결과 상세 모달은 기존 tablet, 신규/수정 폼은 desktop을 사용한다. */
  desktopLayoutBreakpoint?: "tablet" | "desktop";
  /** Figma 규격의 전용 가로 스크롤바를 상세 모드에만 또는 모든 모드에 사용한다. */
  customScrollbarMode?: "detailed" | "all";
  detailedLayout?: "table" | "cards";
};

// "YYYY-MM-DD" ↔ 로컬 Date. new Date(isoString)은 UTC로 해석돼 시간대에 따라 하루 밀릴 수
// 있어 직접 분해해서 로컬 Date를 만들고, 되돌릴 때도 로컬 getter로만 조립한다.
function parseDateOnly(iso?: string): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDateOnly(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

// 오늘부터 n개월 뒤 날짜. 목표 월에 오늘과 같은 일(day)이 없으면(예: 1/31 + 1개월) 그 달의
// 마지막 날로 내려 고정한다 — 그래야 결과 날짜를 다시 remainingMonthsUntil로 계산해도 n이
// 그대로 나오는 왕복 일관성이 보장된다(일자가 시작일보다 크면 +1개월 취급하는 반대 방향 규칙과 대칭).
function addMonthsClamped(start: Date, months: number): Date {
  const totalMonthIndex = start.getMonth() + months;
  const year = start.getFullYear() + Math.floor(totalMonthIndex / 12);
  const month = ((totalMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(start.getDate(), daysInTargetMonth);
  return new Date(year, month, day);
}

const OVERDUE_MAX_DIGITS = 3;

// Figma 상세 테이블: 셀 안 입력요소는 기본 테두리 없이 배경에 묻어가고, 행 사이 구분선
// (tr의 border-b)만 남는다. 포커스 시에만 테두리를 보여줘 편집 중임을 알린다.
// 아래 공유 컨트롤(SelectField/TextInput/DatePicker/WonInput/PercentInput)의 기본 테두리는
// 다른 화면(표 밖 폼)에서는 그대로 필요하므로, 테이블 셀에서만 이 클래스로 덮어쓴다.
const CELL_INPUT_BORDERLESS = "!border-transparent focus:!border-neutral-30";

// invalid 상태에서는 CELL_INPUT_BORDERLESS의 "!border-transparent"를 걷어내 컨트롤 자체의
// invalid 스타일(!border-danger-40)이 가려지지 않게 한다 — 두 !important 테두리 색을
// 동시에 주면 어느 쪽이 이기는지 클래스 순서로 보장되지 않는다.
function cellInputClassName(invalid: boolean): string {
  return invalid ? "" : CELL_INPUT_BORDERLESS;
}

function OverdueMonthsInput({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <input
      inputMode="numeric"
      value={value ? String(value) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, OVERDUE_MAX_DIGITS);
        onChange(digits ? parseInt(digits, 10) : 0);
      }}
      placeholder="0"
      className={`w-full h-[34px] px-3 py-2 rounded-[5px] border border-transparent focus:border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground text-right placeholder:text-neutral-50 focus:outline-none ${className}`}
    />
  );
}

// 열 순서·너비 단일 소스. thead/tbody/tfoot이 각자 셀 너비를 반복 지정하면 스크롤 중
// 어긋날 수 있어 colgroup 하나로 세 영역 모두를 맞춘다.
const COLUMN_WIDTHS = [
  116, // 채무종류
  88, // 담보
  112, // 채권처 — 우측 다음 열이 일부 보여 가로 스크롤 가능성을 인지할 수 있게 압축
  128, // 상환방식
  104, // 연체(개월) — Figma 헤더 폰트(16px)로 "연체(개월)" 텍스트가 92px에서 겹쳐 여유를 둠
  140, // 대출일
  140, // 만기일
  168, // 금액(원)
  100, // 금리(%)
  92, // 기간
  132, // 월불입
  132, // 총이자
  132, // 총상환
  48, // 삭제
];
// 헤더는 텍스트만이라 th 패딩이 그대로 시작 위치가 되지만, 바디 셀은 그 안의 input/select가
// 자체 좌우 패딩(px-2~px-3)을 또 갖고 있어서 td 패딩과 겹쳐 헤더 라벨이 실제 값보다 왼쪽으로
// 치우쳐 보인다. td 패딩을 줄이고 th 패딩을 늘려 그 격차를 좁힌다(완전한 픽셀 일치보단
// "표답게 보이는" 수준으로 절충).
const HEADER_CELL =
  "h-10 bg-neutral-20 px-3 text-left text-[16px] font-medium text-neutral-60 whitespace-nowrap first:rounded-l-[10px] last:rounded-r-[10px]";
const BODY_CELL = "px-1 py-2 align-middle";
const READONLY_CELL =
  "px-3 py-2 align-middle text-right text-[14px] font-medium text-neutral-90/80 whitespace-nowrap";

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 3.33333V12.6667M3.33333 8H12.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RemoveRowIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5 5L15 15M5 15L15 5"
        stroke="#B0B0B0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Figma: 24x24 rounded-full 배경(neutral-80) 위에 8x13 화살표(neutral-20)를 중앙 배치.
// 꺾쇠 모양 자체는 뾰족한 끝(점 하나)과 벌어진 끝(선 두 개)의 잉크량이 달라 stroke 좌우
// 여백이 수학적으로 대칭이어도 시각적으로는 벌어진 쪽이 더 무거워 보인다 — 뾰족한 방향으로
// 1px씩 광학 보정한다.
function ScrollEdgeArrowIcon({ pointsToStart }: { pointsToStart: boolean }) {
  return (
    <svg
      width="8"
      height="13"
      viewBox="0 0 8 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={pointsToStart ? "-translate-x-px" : "translate-x-px"}
    >
      <path
        d={pointsToStart ? "M7 1L1 6.33333L7 11.6667" : "M1 1L7 6.33333L1 11.6667"}
        stroke="var(--neutral-20)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollateralSelect({
  debt,
  asset,
  locked,
  className = "",
  onChange,
}: {
  debt: DebtItemFormState;
  asset?: AssetItemFormState;
  locked: boolean;
  className?: string;
  onChange: (isCollateralLoan: boolean) => void;
}) {
  const disabled = locked;

  return (
    <div className="relative">
      {locked && asset && (
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-neutral-50">
          <AssetIcon category={asset.category} />
        </span>
      )}
      <SelectField
        className={`h-[34px] disabled:!bg-neutral-20 disabled:!text-neutral-50 disabled:cursor-not-allowed ${locked && asset ? "!pl-9" : ""} ${className}`}
        disabled={disabled}
        value={isDebtCollateralLoan(debt) ? "secured" : "unsecured"}
        onChange={(event) => onChange(event.target.value === "secured")}
      >
        <option value="secured">담보</option>
        <option value="unsecured">무담보</option>
      </SelectField>
    </div>
  );
}

function DetailedScrollbarArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="rounded-full drop-shadow-[1px_2px_4px_rgba(0,0,0,0.2)]"
      aria-hidden
    >
      <path
        d={direction === "left" ? "M10 4L6 8L10 11.1111" : "M6.2222 4.4444L10.2222 8L6.2222 11.5556"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type EditableCalculationField = "monthlyPaymentWon" | "remainingInterestWon" | "totalRepaymentWon";
type AutomaticCalculationInputField =
  | "debtType"
  | "currentBalanceWon"
  | "interestRate"
  | "repaymentMethod"
  | "maturityDate";

const AUTOMATIC_CALCULATION_INPUT_FIELDS = new Set<AutomaticCalculationInputField>([
  "debtType",
  "currentBalanceWon",
  "interestRate",
  "repaymentMethod",
  "maturityDate",
]);

function CalculatedDebtField({
  label,
  value,
  disabled,
  overridden,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  disabled: boolean;
  overridden: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-[13px] font-medium leading-4 text-neutral-60">{label}</span>
      <div className="relative">
        <fieldset disabled={disabled} className="disabled:opacity-50">
          <WonInput value={value} onChange={onChange} className="pr-9 disabled:cursor-not-allowed disabled:!bg-neutral-20" />
        </fieldset>
        <button type="button" disabled={disabled || !overridden} onClick={onReset} aria-label={`${label} 계산값으로 되돌리기`} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-50 enabled:cursor-pointer enabled:hover:text-neutral-70 disabled:text-neutral-30">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 7A5.5 5.5 0 0 0 3 5L1.5 7M1.5 7V3M1.5 7H5.5M2.5 9A5.5 5.5 0 0 0 13 11L14.5 9M14.5 9V13M14.5 9H10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </label>
  );
}

// "만기일"과 시각적으로 이어붙는 입력칸. 값을 고치면 오늘 기준 n개월 뒤 날짜를 만기일로
// 역산해 넘기고(onChangeMonths), 만기일 쪽이 바뀌면 calculateDebtItemAmortization이 이 값을
// 다시 계산해 채운다 — 두 필드가 서로를 갱신하는 순환 구조.
//
// 화면에 보이는 문자열(draft)을 debt.remainingMonths와 분리된 로컬 상태로 따로 들고 간다.
// 그냥 value prop을 그대로 입력값으로 쓰면, 전부 지워서(빈 문자열) onChangeMonths를 호출하지
// 않는 순간 이 행과 무관한 다른 입력 때문에 테이블 전체가 리렌더될 때 React가 컨트롤드
// input을 마지막으로 커밋된 숫자로 되돌려버려 "15 → 1까지는 지워지는데 그 다음 백스페이스가
// 먹통"이 된다. 포커스 중엔 draft만 갱신하고, 포커스를 벗어나거나 외부에서 만기일이 바뀌어
// value가 달라졌을 때만 draft를 value와 다시 맞춘다.
function RemainingMonthsInput({
  value,
  onChangeMonths,
  onClear,
  disabled = false,
  invalid = false,
}: {
  value?: number;
  onChangeMonths: (months: number) => void;
  onClear: () => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState(() => (value ? String(value) : ""));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(value ? String(value) : "");
  }, [value]);

  return (
    <div className="relative -ml-px flex-1 min-w-0">
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={disabled ? "" : draft}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
          // 유효한 값(1 이상)으로 이어지지 못한 채 남은 입력(빈 문자열, "0" 등)은 버리고
          // 실제 커밋된 값으로 되돌린다 — 화면에 한 번도 반영된 적 없는 숫자가 남지 않도록.
          setDraft(value ? String(value) : "");
        }}
        onChange={(event) => {
          const digits = event.target.value
            .replace(/[^0-9]/g, "")
            .replace(/^0+(?=\d)/, "")
            .slice(0, 3);
          setDraft(digits);
          if (!digits) {
            onClear();
            return;
          }
          const months = parseInt(digits, 10);
          if (months >= 1) onChangeMonths(months);
        }}
        placeholder="-"
        className={`h-[34px] w-full rounded-l-none rounded-r-[5px] border border-neutral-30 bg-card pl-3 pr-9 text-right text-[14px] font-medium tracking-[-0.02em] text-foreground placeholder:text-neutral-50 focus:outline-none disabled:!bg-neutral-20 disabled:!text-neutral-50 disabled:cursor-not-allowed ${invalid ? "!border-danger-40 dark:!border-danger-40" : ""}`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-60">개월</span>
    </div>
  );
}

type DebtSums = {
  currentBalanceWon: number;
  monthlyPaymentWon: number;
  remainingInterestWon: number;
  totalRepaymentWon: number;
};

function sumDebtItems(items: DebtItemFormState[]): DebtSums {
  return items.reduce(
    (acc, debt) => ({
      currentBalanceWon: acc.currentBalanceWon + debt.currentBalanceWon,
      monthlyPaymentWon: acc.monthlyPaymentWon + (debt.monthlyPaymentWon ?? 0),
      remainingInterestWon: acc.remainingInterestWon + (debt.remainingInterestWon ?? 0),
      totalRepaymentWon: acc.totalRepaymentWon + (debt.totalRepaymentWon ?? 0),
    }),
    { currentBalanceWon: 0, monthlyPaymentWon: 0, remainingInterestWon: 0, totalRepaymentWon: 0 }
  );
}

function DebtSumCard({
  label,
  sums,
  highlight = false,
  backgroundClassName = "bg-neutral-10",
}: {
  label: string;
  sums: DebtSums;
  highlight?: boolean;
  backgroundClassName?: string;
}) {
  return (
    <div data-debt-summary-card data-highlight={highlight} className={`rounded-xl px-4 py-3.5 flex flex-col gap-2 ${highlight ? "bg-neutral-90" : backgroundClassName}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span data-summary-title className={`text-[14px] font-medium tracking-[0.2px] ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
          {label}
        </span>
        <span
          data-summary-amount
          className={`text-[16px] font-bold tracking-[-0.04em] whitespace-nowrap ${
            highlight ? "text-neutral-20" : "text-foreground"
          }`}
        >
          {formatWon(sums.currentBalanceWon)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span data-summary-label className="text-[14px] font-medium tracking-[0.2px] text-neutral-50">월불입</span>
        <span data-summary-value className={`text-[14px] font-medium tracking-[0.2px] text-right whitespace-nowrap ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
          {formatWon(sums.monthlyPaymentWon)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span data-summary-label className="text-[14px] font-medium tracking-[0.2px] text-neutral-50">잔여이자</span>
        <span data-summary-value className={`text-[14px] font-medium tracking-[0.2px] text-right whitespace-nowrap ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
          {formatWon(sums.remainingInterestWon)}
        </span>
      </div>
    </div>
  );
}

function SimpleDebtSumCard({
  label,
  amount,
  highlight = false,
  backgroundClassName = "bg-neutral-10",
}: {
  label: string;
  amount: number;
  highlight?: boolean;
  backgroundClassName?: string;
}) {
  return (
    <div
      data-debt-summary-card
      data-highlight={highlight}
      className={`flex min-h-[76px] flex-col justify-center gap-2 rounded-xl px-5 py-4 ${highlight ? "bg-neutral-100" : backgroundClassName}`}
    >
      <span className={`text-[14px] font-medium tracking-[0.2px] ${highlight ? "text-neutral-50" : "text-neutral-60"}`}>
        {label}
      </span>
      <strong className={`text-[16px] font-bold tracking-[-0.04em] ${highlight ? "text-neutral-0" : "text-foreground"}`}>
        {formatWon(amount)}
      </strong>
    </div>
  );
}

export default function DebtItemsTable({
  debts,
  assets,
  mode,
  onChange,
  sumCardBackgroundClassName = "bg-neutral-10",
  showFieldErrors = false,
  defaultCollateralAssetId,
  showSummaryCards = true,
  assetCollateralOnly = false,
  lockedDebtIds = [],
  scrollFadeColorClassName = "[--debt-scroll-fade:#FFFFFF] dark:[--debt-scroll-fade:#111111]",
  desktopLayoutBreakpoint = "tablet",
  customScrollbarMode,
  detailedLayout = "table",
}: Props) {
  const { containerRef, dragScrollHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const customScrollbarEnabled =
    customScrollbarMode === "all" ||
    (customScrollbarMode === "detailed" && mode === "detailed");
  const scrollContainerId = useId();
  const customScrollbarTrackRef = useRef<HTMLDivElement>(null);
  const customScrollbarThumbRef = useRef<HTMLDivElement>(null);
  const thumbDragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startScrollLeft: number;
  } | null>(null);
  const [horizontalScrollState, setHorizontalScrollState] = useState({
    hasOverflow: false,
    atStart: true,
    atEnd: false,
    progress: 0,
  });

  const updateHorizontalScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const scrollLeft = Math.min(maxScrollLeft, Math.max(0, container.scrollLeft));
    const nextState = {
      hasOverflow: maxScrollLeft > 1,
      atStart: scrollLeft <= 1,
      atEnd: maxScrollLeft > 0 && scrollLeft >= maxScrollLeft - 1,
      progress: customScrollbarEnabled && maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0,
    };

    setHorizontalScrollState((previousState) =>
      previousState.hasOverflow === nextState.hasOverflow &&
      previousState.atStart === nextState.atStart &&
      previousState.atEnd === nextState.atEnd &&
      Math.abs(previousState.progress - nextState.progress) < 0.0001
        ? previousState
        : nextState
    );
  }, [containerRef, customScrollbarEnabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateHorizontalScrollState();
    const resizeObserver = new ResizeObserver(updateHorizontalScrollState);
    resizeObserver.observe(container);
    if (container.firstElementChild) resizeObserver.observe(container.firstElementChild);

    return () => resizeObserver.disconnect();
  }, [assetCollateralOnly, containerRef, mode, updateHorizontalScrollState]);

  const scrollToOppositeEdge = () => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      left: horizontalScrollState.atEnd ? 0 : container.scrollWidth - container.clientWidth,
      behavior: "smooth",
    });
  };

  const scrollToTableEdge = (edge: "start" | "end") => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      left: edge === "start" ? 0 : container.scrollWidth - container.clientWidth,
      behavior: "smooth",
    });
  };

  const setTableScrollProgress = (progress: number) => {
    const container = containerRef.current;
    if (!container) return;

    const clampedProgress = Math.min(1, Math.max(0, progress));
    container.scrollLeft = clampedProgress * Math.max(0, container.scrollWidth - container.clientWidth);
  };

  const handleCustomTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === customScrollbarThumbRef.current) return;

    const track = customScrollbarTrackRef.current;
    const thumb = customScrollbarThumbRef.current;
    if (!track || !thumb) return;

    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const travelWidth = trackRect.width - thumbRect.width;
    if (travelWidth <= 0) return;

    setTableScrollProgress((event.clientX - trackRect.left - thumbRect.width / 2) / travelWidth);
  };

  const handleCustomThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbDragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: container.scrollLeft,
    };
  };

  const handleCustomThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = thumbDragStateRef.current;
    const container = containerRef.current;
    const track = customScrollbarTrackRef.current;
    const thumb = customScrollbarThumbRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !container || !track || !thumb) return;

    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const travelWidth = trackRect.width - thumbRect.width;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    if (travelWidth <= 0 || maxScrollLeft <= 0) return;

    container.scrollLeft = dragState.startScrollLeft + ((event.clientX - dragState.startClientX) / travelWidth) * maxScrollLeft;
  };

  const endCustomThumbDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (thumbDragStateRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    thumbDragStateRef.current = null;
  };

  const handleCustomThumbKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const keyboardStep = Math.max(40, container.clientWidth * 0.1);

    if (event.key === "Home") {
      event.preventDefault();
      scrollToTableEdge("start");
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      scrollToTableEdge("end");
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    container.scrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, container.scrollLeft + (event.key === "ArrowLeft" ? -keyboardStep : keyboardStep))
    );
  };

  const scrollEdgeControls = horizontalScrollState.hasOverflow ? (
    <>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 z-10 w-[90px] ${
          horizontalScrollState.atEnd
            ? "left-0 bg-[linear-gradient(270deg,transparent_0%,var(--debt-scroll-fade)_80%)]"
            : "right-0 bg-[linear-gradient(90deg,transparent_0%,var(--debt-scroll-fade)_80%)]"
        } ${scrollFadeColorClassName}`}
      />
      <button
        type="button"
        onClick={scrollToOppositeEdge}
        aria-label={horizontalScrollState.atEnd ? "채무내역 처음으로 이동" : "채무내역 끝으로 이동"}
        className={`absolute top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-40 ${
          horizontalScrollState.atEnd ? "left-0" : "right-0"
        }`}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-80 shadow-[1px_2px_4px_rgba(0,0,0,0.2)]">
          <ScrollEdgeArrowIcon pointsToStart={horizontalScrollState.atEnd} />
        </span>
      </button>
    </>
  ) : null;

  const customScrollbar = horizontalScrollState.hasOverflow ? (
    <div className="mt-3 flex h-4 w-full items-center gap-1" data-debt-detailed-scrollbar>
      <button
        type="button"
        onClick={() => scrollToTableEdge("start")}
        disabled={horizontalScrollState.atStart}
        aria-label="채무내역 처음으로 이동"
        className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-[#808080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-40 disabled:cursor-default disabled:text-[#E2E2E2]"
      >
        <DetailedScrollbarArrowIcon direction="left" />
      </button>
      <div
        ref={customScrollbarTrackRef}
        className="relative h-2 min-w-0 flex-1 touch-none rounded-[6px] bg-[#EDEDED]"
        onPointerDown={handleCustomTrackPointerDown}
      >
        <div
          ref={customScrollbarThumbRef}
          role="scrollbar"
          tabIndex={0}
          aria-label="채무 상세 내역 가로 스크롤"
          aria-controls={scrollContainerId}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(horizontalScrollState.progress * 100)}
          className="absolute top-0 h-2 w-[min(151px,100%)] touch-none cursor-grab rounded-[6px] bg-[#B0B0B0] transition-colors hover:bg-[#D0D0D0] active:cursor-grabbing"
          style={{
            left: `${horizontalScrollState.progress * 100}%`,
            transform: `translateX(-${horizontalScrollState.progress * 100}%)`,
          }}
          onPointerDown={handleCustomThumbPointerDown}
          onPointerMove={handleCustomThumbPointerMove}
          onPointerUp={endCustomThumbDrag}
          onPointerCancel={endCustomThumbDrag}
          onKeyDown={handleCustomThumbKeyDown}
        />
      </div>
      <button
        type="button"
        onClick={() => scrollToTableEdge("end")}
        disabled={horizontalScrollState.atEnd}
        aria-label="채무내역 끝으로 이동"
        className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-[#808080] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-40 disabled:cursor-default disabled:text-[#E2E2E2]"
      >
        <DetailedScrollbarArrowIcon direction="right" />
      </button>
    </div>
  ) : null;

  // DatePicker의 연도 선택 목록 기본 범위는 현재+10년까지라 장기 대출(20~30년 이상 만기)이
  // 캘린더로 선택되지 않는다. 만기일은 현재+50년까지 넉넉히 열어준다.
  const maxMaturityDate = new Date(new Date().getFullYear() + 50, 11, 31);

  const updateItem = (id: string, patch: Partial<DebtItemFormState>) => {
    onChange(
      debts.map((debt) => {
        if (debt.id !== id) return debt;
        const merged = { ...debt, ...patch };
        if (merged.debtType === "credit_card") return normalizeCreditCardDebt(merged);
        const shouldRecalculate = Object.keys(patch).some((field) =>
          AUTOMATIC_CALCULATION_INPUT_FIELDS.has(field as AutomaticCalculationInputField)
        );
        if (!shouldRecalculate) return merged;
        const calculated = calculateDebtItemAmortization(merged);
        return {
          ...merged,
          ...calculated,
          manualCalculationOverrides: undefined,
        };
      })
    );
  };

  const updateCalculatedItem = (id: string, field: EditableCalculationField, value: number) => {
    onChange(debts.map((debt) => debt.id === id ? {
      ...debt,
      [field]: value,
      manualCalculationOverrides: Array.from(new Set([...(debt.manualCalculationOverrides ?? []), field])),
    } : debt));
  };

  const resetCalculatedItem = (id: string, field: EditableCalculationField) => {
    onChange(debts.map((debt) => {
      if (debt.id !== id) return debt;
      const calculated = calculateDebtItemAmortization(debt);
      return {
        ...debt,
        [field]: calculated[field],
        manualCalculationOverrides: (debt.manualCalculationOverrides ?? []).filter((item) => item !== field),
      };
    }));
  };

  const addRow = () => {
    onChange([
      ...debts,
      {
        ...createEmptyDebtItem(crypto.randomUUID()),
        isCollateralLoan: Boolean(defaultCollateralAssetId),
        collateralAssetId: defaultCollateralAssetId,
      },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(debts.filter((debt) => debt.id !== id));
  };

  const totals = sumDebtItems(debts);
  const collateralTotals = sumDebtItems(debts.filter(isDebtCollateralLoan));
  const unsecuredTotals = sumDebtItems(debts.filter((debt) => !isDebtCollateralLoan(debt)));
  const addRowDividerClassName = debts.length > 0 ? "border-t border-neutral-30" : "";
  const summaryGridColumnsClassName =
    desktopLayoutBreakpoint === "desktop" ? "lg:grid-cols-3" : "md:grid-cols-3";
  const summaryCards = showSummaryCards ? (
    <div className={`grid grid-cols-1 ${summaryGridColumnsClassName} gap-3 p-3 border-t border-neutral-30`}>
      <DebtSumCard label="담보대출 합산" sums={collateralTotals} backgroundClassName={sumCardBackgroundClassName} />
      <DebtSumCard label="무담보대출 합산" sums={unsecuredTotals} backgroundClassName={sumCardBackgroundClassName} />
      <DebtSumCard label="총 합산" sums={totals} highlight />
    </div>
  ) : null;

  if (assetCollateralOnly && mode === "simple") {
    return (
      <div data-debt-items-table className="rounded-lg bg-neutral-10 px-5 pt-5 pb-4">
        <div
          id={scrollContainerId}
          className="table-horizontal-scroll overflow-x-auto"
          ref={containerRef}
          {...dragScrollHandlers}
          onScroll={updateHorizontalScrollState}
        >
          <div className="flex min-w-[854px] flex-col gap-4">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="relative grid h-[90px] grid-cols-[112px_266px_120px_minmax(220px,1fr)] gap-2.5 rounded-lg bg-card px-5 py-[15px] shadow-[0_1px_2px_rgba(9,30,66,0.12)]"
              >
                <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                  <span>채무종류</span>
                  <SelectField
                    className="h-[34px] !border-neutral-30 px-3 text-[14px] font-medium tracking-[-0.02em]"
                    value={debt.debtType}
                    onChange={(event) => updateItem(debt.id, { debtType: event.target.value as DebtItemFormState["debtType"] })}
                  >
                    {DEBT_ITEM_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SelectField>
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                  <span>채권처</span>
                  <TextInput value={debt.creditorName} onChange={(creditorName) => updateItem(debt.id, { creditorName })} placeholder="채권처" />
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                  <span>연체(개월)</span>
                  <OverdueMonthsInput value={debt.overdueMonths} onChange={(overdueMonths) => updateItem(debt.id, { overdueMonths })} className="!border-neutral-30" />
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                  <span>현재 잔액(원)</span>
                  <WonInput value={debt.currentBalanceWon} onChange={(currentBalanceWon) => updateItem(debt.id, { currentBalanceWon })} />
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(debt.id)}
                  aria-label="행 삭제"
                  className="absolute right-5 top-3 inline-flex h-5 w-5 cursor-pointer items-center justify-center text-neutral-50 hover:text-neutral-60"
                >
                  <RemoveRowIcon />
                </button>
              </div>
            ))}
            <button
              data-debt-add-row
              type="button"
              onClick={addRow}
              className="inline-flex h-10 w-full cursor-pointer items-center gap-1 px-3 text-[14px] font-medium tracking-[0.2px] text-neutral-60 rounded-lg border border-neutral-30 bg-card hover:border-neutral-50"
            >
              <PlusIcon />담보 대출 추가
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "simple") {
    return (
      <div data-debt-items-table className="flex min-w-0 flex-col gap-5">
        <div className="rounded-lg bg-neutral-10 px-5 pt-5 pb-4">
          <div
            id={scrollContainerId}
            className="table-horizontal-scroll overflow-x-auto"
            ref={containerRef}
            {...dragScrollHandlers}
            onScroll={updateHorizontalScrollState}
          >
            <div className="flex min-w-[854px] flex-col gap-4">
              {debts.map((debt) => {
                const locked = lockedDebtIds.includes(debt.id);
                const collateralAsset = assets.find((asset) => asset.id === debt.collateralAssetId);
                return (
                  <div
                    key={debt.id}
                    className="relative grid h-[90px] grid-cols-[114px_120px_136px_122px_minmax(220px,1fr)] gap-2.5 rounded-lg bg-card px-5 py-[15px] shadow-[0_1px_2px_rgba(9,30,66,0.12)]"
                  >
                    <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                      <span>채무종류</span>
                      <SelectField className="h-[34px] !border-neutral-30 px-3 text-[14px] font-medium tracking-[-0.02em]" value={debt.debtType} onChange={(event) => updateItem(debt.id, { debtType: event.target.value as DebtItemFormState["debtType"] })}>{DEBT_ITEM_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField>
                    </label>
                    <div className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                      <span>담보</span>
                      <CollateralSelect
                        debt={debt}
                        asset={collateralAsset}
                        locked={locked}
                        className="!border-neutral-30 px-3 text-[14px] font-medium tracking-[-0.02em]"
                        onChange={(isCollateralLoan) => updateItem(debt.id, { isCollateralLoan, collateralAssetId: undefined })}
                      />
                    </div>
                    <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                      <span>채권처</span>
                      <TextInput value={debt.creditorName} onChange={(creditorName) => updateItem(debt.id, { creditorName })} placeholder="채권처" />
                    </label>
                    <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                      <span>연체(개월)</span>
                      <OverdueMonthsInput value={debt.overdueMonths} onChange={(overdueMonths) => updateItem(debt.id, { overdueMonths })} className="!border-neutral-30" />
                    </label>
                    <label className="flex min-w-0 flex-col gap-2 text-[14px] font-medium leading-[17px] tracking-[0.2px] text-neutral-60">
                      <span className="inline-flex items-center gap-1">
                        현재 잔액(원)
                        <Tooltip content="오늘 기준으로 남은 원금을 적어주세요." position="bottom" delay={0.1} gap={10}>
                          <button type="button" aria-label="현재 잔액 입력 안내" className="inline-flex h-4 w-4 cursor-help items-center justify-center text-neutral-50 hover:text-neutral-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40">
                            <InfoCircleIcon size={14} />
                          </button>
                        </Tooltip>
                      </span>
                      <WonInput value={debt.currentBalanceWon} onChange={(currentBalanceWon) => updateItem(debt.id, { currentBalanceWon })} />
                    </label>
                    {!locked && (
                      <button type="button" onClick={() => removeRow(debt.id)} aria-label="행 삭제" className="absolute right-5 top-3 inline-flex h-5 w-5 cursor-pointer items-center justify-center text-neutral-50 hover:text-neutral-60">
                        <RemoveRowIcon />
                      </button>
                    )}
                  </div>
                );
              })}
              <button data-debt-add-row type="button" onClick={addRow} className="inline-flex h-10 w-full cursor-pointer items-center gap-1 rounded-lg border border-neutral-30 bg-card px-3 text-[14px] font-medium tracking-[0.2px] text-neutral-60 hover:border-neutral-50">
                <PlusIcon />행 추가
              </button>
            </div>
          </div>
        </div>
        {showSummaryCards && (
          <div className={`grid grid-cols-1 gap-5 ${summaryGridColumnsClassName}`}>
            <SimpleDebtSumCard label="담보대출 합산" amount={collateralTotals.currentBalanceWon} backgroundClassName={sumCardBackgroundClassName} />
            <SimpleDebtSumCard label="무담보대출 합산" amount={unsecuredTotals.currentBalanceWon} backgroundClassName={sumCardBackgroundClassName} />
            <SimpleDebtSumCard label="총 합산" amount={totals.currentBalanceWon} highlight />
          </div>
        )}
      </div>
    );
  }


  if (detailedLayout === "cards" && mode === "detailed") {
      return (<div data-debt-items-table className="flex min-w-0 flex-col gap-5">
          <div className="rounded-lg bg-neutral-10 p-5">
            <div
              id={scrollContainerId}
              ref={containerRef}
              {...dragScrollHandlers}
              onScroll={updateHorizontalScrollState}
              className={`table-horizontal-scroll overflow-x-auto ${customScrollbarEnabled ? "scrollbar-hide" : ""}`}
              style={{ scrollbarWidth: customScrollbarEnabled ? "none" : undefined }}
            >
              <div className="flex min-w-[854px] flex-col gap-4" aria-label="채무 상세 내역">
                {debts.map((debt) => {
              const missingFields = showFieldErrors ? getMissingDebtItemFields(debt) : [];
              const isFieldInvalid = (field: "loanDate" | "maturityDate" | "currentBalanceWon" | "interestRate") => missingFields.includes(field);
              const locked = lockedDebtIds.includes(debt.id);
              const collateralAsset = assets.find((asset) => asset.id === debt.collateralAssetId);
              return (<div key={debt.id} className={`relative flex flex-col gap-3 rounded-lg p-4 pt-4 pb-5 shadow-[0_1px_2px_rgba(9,30,66,0.12)] bg-card`}>
                      {!locked && <button type="button" onClick={() => removeRow(debt.id)} aria-label="행 삭제" className="absolute right-3 top-2 cursor-pointer text-neutral-50 hover:text-neutral-70"><RemoveRowIcon /></button>}
                      <div className={`grid gap-2.5 ${assetCollateralOnly ? "grid-cols-[114px_156px_92px_minmax(160px,1fr)_90px_110px]" : "grid-cols-[114px_100px_136px_82px_minmax(140px,1fr)_80px_100px]"}`}>
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">채무종류</span>
                    <SelectField className="h-[34px] text-[13px]" value={debt.debtType} onChange={(e) => updateItem(debt.id, { debtType: e.target.value as DebtItemFormState["debtType"] })}>
                      {DEBT_ITEM_TYPE_OPTIONS.map((option) => (<option key={option.value} value={option.value}>
                          {option.label}
                        </option>))}
                    </SelectField>
                  </div>
                        {!assetCollateralOnly && <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">담보</span>
                    <CollateralSelect debt={debt} asset={collateralAsset} locked={locked} className="text-[13px]" onChange={(isCollateralLoan) => updateItem(debt.id, { isCollateralLoan, collateralAssetId: undefined })}/>
                  </div>}
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">채권처</span>
                    <TextInput value={debt.creditorName} onChange={(value) => updateItem(debt.id, { creditorName: value })} placeholder="채권처"/>
                  </div>
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">연체(개월)</span>
                    <OverdueMonthsInput className="!border-neutral-30" value={debt.overdueMonths} onChange={(value) => updateItem(debt.id, { overdueMonths: value })}/>
                  </div>
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">현재 잔액(원) <Tooltip content="오늘 기준으로 남은 원금을 적어주세요." position="bottom"><span className="inline-flex align-middle" tabIndex={0} aria-label="현재 잔액 입력 안내"><InfoCircleIcon size={14}/></span></Tooltip></span>
                    <WonInput value={debt.currentBalanceWon} onChange={(value) => updateItem(debt.id, { currentBalanceWon: value })} invalid={isFieldInvalid("currentBalanceWon")}/>
                  </div>
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">금리(%)</span>
                    <fieldset className="min-w-0">
                      <PercentInput value={debt.interestRate} onChange={(value) => updateItem(debt.id, { interestRate: value ?? undefined })} invalid={isFieldInvalid("interestRate")}/>
                    </fieldset>
                  </div>
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">상환방식</span>
                    <fieldset className="min-w-0">
                      <SelectField className="h-[34px] text-[13px]" value={debt.repaymentMethod ?? "equal_principal_and_interest"} onChange={(e) => updateItem(debt.id, {
                      repaymentMethod: e.target.value as DebtItemFormState["repaymentMethod"],
                  })}>
                        {REPAYMENT_METHOD_OPTIONS.map((option) => (<option key={option.value} value={option.value}>
                            {option.label}
                          </option>))}
                      </SelectField>
                    </fieldset>
                  </div>
                      </div>
                      <div className="grid grid-cols-[132px_222px_minmax(136px,1fr)_minmax(136px,1fr)_minmax(148px,1fr)] gap-2.5">
                        <div className="min-w-0 flex flex-col gap-2"><span className="text-[13px] font-medium leading-4 text-neutral-60">대출일</span>
                    <fieldset className="min-w-0">
                      <div className="relative">
                        <DatePicker value={parseDateOnly(debt.loanDate)} onChange={(date) => updateItem(debt.id, { loanDate: formatDateOnly(date) })} allowTextInput invalid={isFieldInvalid("loanDate")} className="pr-8"/>
                        <CalendarInlineIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"/>
                      </div>
                    </fieldset>
                  </div>
                        <div className="min-w-0 flex flex-col gap-2">
                    <div className="flex">
                      <span className="w-[144px] shrink-0 text-[13px] font-medium leading-4 text-neutral-60">만기일</span>
                      <span className="text-[13px] font-medium leading-4 text-neutral-60">남은기간</span>
                    </div>
                    <fieldset className="min-w-0 flex">
                      <div className="relative w-[144px] shrink-0">
                        <DatePicker value={parseDateOnly(debt.maturityDate)} onChange={(date) => updateItem(debt.id, { maturityDate: formatDateOnly(date) })} allowTextInput maxDate={maxMaturityDate} invalid={isFieldInvalid("maturityDate")} className="pr-8 !rounded-r-none"/>
                        <CalendarInlineIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"/>
                      </div>
                      <RemainingMonthsInput
                        value={debt.remainingMonths}
                        invalid={isFieldInvalid("maturityDate")}
                        onChangeMonths={(months) => {
                          if (debt.debtType === "credit_card") {
                            updateItem(debt.id, { remainingMonths: months });
                            return;
                          }
                          const nextMaturityDate = addMonthsClamped(new Date(), months);
                          updateItem(debt.id, {
                            maturityDate: formatDateOnly(nextMaturityDate > maxMaturityDate ? maxMaturityDate : nextMaturityDate),
                          });
                        }}
                        onClear={() => updateItem(debt.id, debt.debtType === "credit_card" ? { remainingMonths: undefined } : { maturityDate: "" })}
                      />
                    </fieldset>
                  </div>
                        <CalculatedDebtField label="월불입" value={debt.monthlyPaymentWon ?? 0} disabled={false} overridden={debt.manualCalculationOverrides?.includes("monthlyPaymentWon") ?? false} onChange={(value) => updateCalculatedItem(debt.id, "monthlyPaymentWon", value)} onReset={() => resetCalculatedItem(debt.id, "monthlyPaymentWon")}/>
                        <CalculatedDebtField label="잔여이자" value={debt.remainingInterestWon ?? 0} disabled={false} overridden={debt.manualCalculationOverrides?.includes("remainingInterestWon") ?? false} onChange={(value) => updateCalculatedItem(debt.id, "remainingInterestWon", value)} onReset={() => resetCalculatedItem(debt.id, "remainingInterestWon")}/>
                        <CalculatedDebtField label="잔여상환액" value={debt.totalRepaymentWon ?? 0} disabled={false} overridden={debt.manualCalculationOverrides?.includes("totalRepaymentWon") ?? false} onChange={(value) => updateCalculatedItem(debt.id, "totalRepaymentWon", value)} onReset={() => resetCalculatedItem(debt.id, "totalRepaymentWon")}/>
                      </div>
                    </div>);
          })}
                <button data-debt-add-row type="button" onClick={addRow} className="inline-flex h-10 w-full cursor-pointer items-center gap-1 rounded-lg border border-neutral-30 bg-card px-3 text-[14px] font-medium text-neutral-60 hover:border-neutral-50"><PlusIcon />{assetCollateralOnly ? "담보 대출 추가" : "행 추가"}</button>
              </div>
            </div>
            {customScrollbarEnabled && customScrollbar}
          </div>
          {showSummaryCards && <div className={`grid grid-cols-1 ${summaryGridColumnsClassName} gap-5`}>
            <DebtSumCard label="담보대출 합산" sums={collateralTotals} backgroundClassName={sumCardBackgroundClassName}/>
            <DebtSumCard label="무담보대출 합산" sums={unsecuredTotals} backgroundClassName={sumCardBackgroundClassName}/>
            <DebtSumCard label="총 합산" sums={totals} highlight/>
          </div>}
        </div>);
  }

  const hideCollateralAssetColumn = assetCollateralOnly && Boolean(defaultCollateralAssetId);
  const detailedColumnWidths = hideCollateralAssetColumn
    ? COLUMN_WIDTHS.filter((_, index) => index !== 1)
    : COLUMN_WIDTHS;
  const detailedTableWidth = detailedColumnWidths.reduce((sum, width) => sum + width, 0);

  return (
    <div data-debt-items-table className="rounded-t-[10px] overflow-hidden">
      <div className="relative">
        <div
          id={scrollContainerId}
          className={`table-horizontal-scroll overflow-x-auto ${customScrollbarEnabled ? "scrollbar-hide" : ""}`}
          style={{ scrollbarWidth: customScrollbarEnabled ? "none" : undefined }}
          ref={containerRef}
          {...dragScrollHandlers}
          onScroll={updateHorizontalScrollState}
        >
          <table
            className="border-collapse table-fixed"
            style={{ width: detailedTableWidth, minWidth: detailedTableWidth }}
            aria-label="채무 상세 내역"
          >
          <colgroup>
            {detailedColumnWidths.map((width, index) => (
              <col key={index} style={{ width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={HEADER_CELL}>채무종류</th>
              {!hideCollateralAssetColumn && <th className={HEADER_CELL}>담보</th>}
              <th className={HEADER_CELL}>채권처</th>
              <th className={HEADER_CELL}>상환방식</th>
              <th className={HEADER_CELL}>연체(개월)</th>
              <th className={HEADER_CELL}>대출일</th>
              <th className={HEADER_CELL}>만기일</th>
              <th className={`${HEADER_CELL} text-right`}>
                <span className="inline-flex items-center justify-end gap-[5px]">
                  현재 잔액 (원)
                  <Tooltip
                    content="오늘 기준으로 남은 원금을 적어주세요."
                    position="bottom"
                    delay={0.1}
                    gap={10}
                  >
                    <button
                      type="button"
                      aria-label="현재 잔액 입력 안내"
                      className="inline-flex h-[20px] w-[20px] cursor-help items-center justify-center text-neutral-50 hover:text-neutral-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-40"
                    >
                      <InfoCircleIcon size={15} />
                    </button>
                  </Tooltip>
                </span>
              </th>
              <th className={`${HEADER_CELL} text-right`}>금리(%)</th>
              <th className={`${HEADER_CELL} text-right`}>남은 기간</th>
              <th className={`${HEADER_CELL} text-right`}>월불입</th>
              <th className={`${HEADER_CELL} text-right`}>잔여이자</th>
              <th className={`${HEADER_CELL} text-right`}>총상환</th>
              <th className={HEADER_CELL} aria-label="삭제" />
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => {
              const missingFields = showFieldErrors ? getMissingDebtItemFields(debt) : [];
              const isFieldInvalid = (field: "loanDate" | "maturityDate" | "currentBalanceWon" | "interestRate") =>
                missingFields.includes(field);
              const locked = lockedDebtIds.includes(debt.id);
              const collateralAsset = assets.find((asset) => asset.id === debt.collateralAssetId);
              return (
              <tr key={debt.id} className={`border-b-[0.4px] border-neutral-30 last:border-b-0 bg-card`}>
                <td className={BODY_CELL}>
                  <SelectField
                    className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
                    value={debt.debtType}
                    onChange={(e) =>
                      updateItem(debt.id, { debtType: e.target.value as DebtItemFormState["debtType"] })
                    }
                  >
                    {DEBT_ITEM_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </td>
                {!hideCollateralAssetColumn && <td className={BODY_CELL}>
                  <CollateralSelect
                    debt={debt}
                    asset={collateralAsset}
                    locked={locked}
                    className={`text-[13px] ${CELL_INPUT_BORDERLESS}`}
                    onChange={(isCollateralLoan) => updateItem(debt.id, { isCollateralLoan, collateralAssetId: undefined })}
                  />
                </td>}
                <td className={BODY_CELL}>
                  <TextInput
                    value={debt.creditorName}
                    onChange={(value) => updateItem(debt.id, { creditorName: value })}
                    placeholder="채권처"
                    className={CELL_INPUT_BORDERLESS}
                  />
                </td>
                <td className={BODY_CELL}>
                  <fieldset className="min-w-0">
                    <SelectField
                      className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
                      value={debt.repaymentMethod ?? "equal_principal_and_interest"}
                      onChange={(e) =>
                        updateItem(debt.id, {
                          repaymentMethod: e.target.value as DebtItemFormState["repaymentMethod"],
                        })
                      }
                    >
                      {REPAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </fieldset>
                </td>
                <td className={BODY_CELL}>
                  <OverdueMonthsInput
                    value={debt.overdueMonths}
                    onChange={(value) => updateItem(debt.id, { overdueMonths: value })}
                  />
                </td>
                <td className={BODY_CELL}>
                  <fieldset className="min-w-0">
                    <div className="relative">
                      <DatePicker
                        value={parseDateOnly(debt.loanDate)}
                        onChange={(date) => updateItem(debt.id, { loanDate: formatDateOnly(date) })}
                        allowTextInput
                        invalid={isFieldInvalid("loanDate")}
                        className={`pr-8 ${cellInputClassName(isFieldInvalid("loanDate"))}`}
                      />
                      <CalendarInlineIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                  </fieldset>
                </td>
                <td className={BODY_CELL}>
                  <fieldset className="min-w-0">
                    <div className="relative">
                      <DatePicker
                        value={parseDateOnly(debt.maturityDate)}
                        onChange={(date) => updateItem(debt.id, { maturityDate: formatDateOnly(date) })}
                        allowTextInput
                        maxDate={maxMaturityDate}
                        invalid={isFieldInvalid("maturityDate")}
                        className={`pr-8 ${cellInputClassName(isFieldInvalid("maturityDate"))}`}
                      />
                      <CalendarInlineIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                  </fieldset>
                </td>
                <td className={BODY_CELL}>
                  <WonInput
                    value={debt.currentBalanceWon}
                    onChange={(value) => updateItem(debt.id, { currentBalanceWon: value })}
                    invalid={isFieldInvalid("currentBalanceWon")}
                    className={cellInputClassName(isFieldInvalid("currentBalanceWon"))}
                  />
                </td>
                <td className={BODY_CELL}>
                  <fieldset className="min-w-0">
                    <PercentInput
                      value={debt.interestRate}
                      onChange={(value) => updateItem(debt.id, { interestRate: value ?? undefined })}
                      invalid={isFieldInvalid("interestRate")}
                      className={cellInputClassName(isFieldInvalid("interestRate"))}
                    />
                  </fieldset>
                </td>
                <td className={READONLY_CELL}>{debt.remainingMonths ? `${debt.remainingMonths}개월` : "-"}</td>
                <td className={READONLY_CELL}>{formatWon(debt.monthlyPaymentWon ?? 0)}</td>
                <td className={READONLY_CELL}>{formatWon(debt.remainingInterestWon ?? 0)}</td>
                <td className={READONLY_CELL}>{formatWon(debt.totalRepaymentWon ?? debt.currentBalanceWon)}</td>
                <td className={`${BODY_CELL} text-center`}>
                  {!lockedDebtIds.includes(debt.id) && <button type="button" onClick={() => removeRow(debt.id)} aria-label="행 삭제" className="cursor-pointer inline-flex items-center justify-center w-6 h-6 hover:opacity-70"><RemoveRowIcon /></button>}
                </td>
              </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={addRowDividerClassName}>
              <td colSpan={hideCollateralAssetColumn ? 13 : 14} className="py-2">
                <button
                  data-debt-add-row
                  type="button"
                  onClick={addRow}
                  className={`cursor-pointer w-full h-10 rounded-lg inline-flex items-center gap-1.5 px-3 text-[14px] font-medium text-neutral-50 hover:text-neutral-60 ${sumCardBackgroundClassName}`}
                >
                  <PlusIcon />
                  행 추가
                </button>
              </td>
            </tr>
          </tfoot>
          </table>
        </div>
        {scrollEdgeControls}
      </div>

      {customScrollbarEnabled && customScrollbar}

      {summaryCards}
    </div>
  );
}
