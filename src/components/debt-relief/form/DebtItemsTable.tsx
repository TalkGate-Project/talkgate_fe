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
import { isDebtCollateralLoan } from "@/types/analysis";

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
  /** 채무 현황에서 삭제할 수 없고 회색 배경으로 구분할 행 ID. */
  lockedDebtIds?: readonly string[];
  /** 넘김 버튼 뒤 그라데이션이 맞닿는 컨테이너 색. 호출 화면의 실제 배경색에 맞춰 오버라이드한다. */
  scrollFadeColorClassName?: string;
  /** 합계 카드가 3열로 전환되는 기준. 결과 상세 모달은 기존 tablet, 신규/수정 폼은 desktop을 사용한다. */
  desktopLayoutBreakpoint?: "tablet" | "desktop";
  /** 신규/수정 화면의 상세 채무내역에서 Figma 규격의 전용 가로 스크롤바를 사용한다. */
  useDetailedCustomScrollbar?: boolean;
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
}: {
  value: number;
  onChange: (value: number) => void;
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
      className={`w-full h-[34px] px-3 py-2 rounded-[5px] border border-transparent focus:border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground text-right placeholder:text-neutral-50 focus:outline-none`}
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
        stroke="#B0B0B0"
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
  useDetailedCustomScrollbar = false,
}: Props) {
  const { containerRef, dragScrollHandlers } = useHorizontalDragScroll<HTMLDivElement>();
  const detailedCustomScrollbarEnabled = useDetailedCustomScrollbar && mode === "detailed";
  const detailedScrollContainerId = useId();
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
      progress: detailedCustomScrollbarEnabled && maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0,
    };

    setHorizontalScrollState((previousState) =>
      previousState.hasOverflow === nextState.hasOverflow &&
      previousState.atStart === nextState.atStart &&
      previousState.atEnd === nextState.atEnd &&
      Math.abs(previousState.progress - nextState.progress) < 0.0001
        ? previousState
        : nextState
    );
  }, [containerRef, detailedCustomScrollbarEnabled]);

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

  const scrollToDetailedTableEdge = (edge: "start" | "end") => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      left: edge === "start" ? 0 : container.scrollWidth - container.clientWidth,
      behavior: "smooth",
    });
  };

  const setDetailedTableScrollProgress = (progress: number) => {
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

    setDetailedTableScrollProgress((event.clientX - trackRect.left - thumbRect.width / 2) / travelWidth);
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
      scrollToDetailedTableEdge("start");
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      scrollToDetailedTableEdge("end");
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

  const detailedCustomScrollbar = horizontalScrollState.hasOverflow ? (
    <div className="mt-3 flex h-4 w-full items-center gap-1" data-debt-detailed-scrollbar>
      <button
        type="button"
        onClick={() => scrollToDetailedTableEdge("start")}
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
          aria-controls={detailedScrollContainerId}
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
        onClick={() => scrollToDetailedTableEdge("end")}
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
        return { ...merged, ...calculateDebtItemAmortization(merged) };
      })
    );
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
    const assetColumnWidths = [180, 220, 150, 220, 48];
    const assetTableWidth = assetColumnWidths.reduce((sum, width) => sum + width, 0);
    return (
      <div data-debt-items-table className="rounded-t-[10px] overflow-hidden">
        <div className="relative">
          <div className="table-horizontal-scroll overflow-x-auto" ref={containerRef} {...dragScrollHandlers} onScroll={updateHorizontalScrollState}>
            <table className="border-collapse table-fixed" style={{ width: assetTableWidth, minWidth: "100%" }} aria-label="자산 담보대출 내역">
            <colgroup>{assetColumnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            <thead><tr>
              <th className={HEADER_CELL}>채무종류</th>
              <th className={HEADER_CELL}>채권처</th>
              <th className={`${HEADER_CELL} text-right`}>연체(개월)</th>
              <th className={`${HEADER_CELL} text-right`}>현재 잔액 (원)</th>
              <th className={HEADER_CELL} aria-label="삭제" />
            </tr></thead>
            <tbody>{debts.map((debt) => <tr key={debt.id} className="border-b-[0.4px] border-neutral-30 last:border-b-0">
              <td className={BODY_CELL}><SelectField className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`} value={debt.debtType} onChange={(event) => updateItem(debt.id, { debtType: event.target.value as DebtItemFormState["debtType"] })}>{DEBT_ITEM_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField></td>
              <td className={BODY_CELL}><TextInput value={debt.creditorName} onChange={(creditorName) => updateItem(debt.id, { creditorName })} placeholder="채권처" className={CELL_INPUT_BORDERLESS} /></td>
              <td className={BODY_CELL}><OverdueMonthsInput value={debt.overdueMonths} onChange={(overdueMonths) => updateItem(debt.id, { overdueMonths })} /></td>
              <td className={BODY_CELL}><WonInput value={debt.currentBalanceWon} onChange={(currentBalanceWon) => updateItem(debt.id, { currentBalanceWon })} className={CELL_INPUT_BORDERLESS} /></td>
              <td className={`${BODY_CELL} text-center`}><button type="button" onClick={() => removeRow(debt.id)} aria-label="행 삭제" className="cursor-pointer inline-flex h-6 w-6 items-center justify-center hover:opacity-70"><RemoveRowIcon /></button></td>
            </tr>)}</tbody>
            <tfoot><tr className="border-t border-neutral-30"><td colSpan={5} className="py-2"><button data-debt-add-row type="button" onClick={addRow} className={`cursor-pointer w-full h-10 rounded-lg inline-flex items-center gap-1.5 px-3 text-[14px] font-medium text-neutral-50 hover:text-neutral-60 ${sumCardBackgroundClassName}`}><PlusIcon />담보 대출 추가</button></td></tr></tfoot>
            </table>
          </div>
          {scrollEdgeControls}
        </div>
      </div>
    );
  }

  if (mode === "simple") {
    const simpleColumnWidths = [150, 100, 200, 140, 210, 48];
    const simpleTableWidth = simpleColumnWidths.reduce((sum, width) => sum + width, 0);
    return (
      <div data-debt-items-table className="rounded-t-[10px] overflow-hidden">
        <div className="relative">
          <div className="table-horizontal-scroll overflow-x-auto" ref={containerRef} {...dragScrollHandlers} onScroll={updateHorizontalScrollState}>
            <table className="border-collapse table-fixed" style={{ width: simpleTableWidth, minWidth: "100%" }} aria-label="채무 간편 내역">
            <colgroup>{simpleColumnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            <thead><tr>
              <th className={HEADER_CELL}>채무종류</th>
              <th className={HEADER_CELL}>담보</th>
              <th className={HEADER_CELL}>채권처</th>
              <th className={`${HEADER_CELL} text-right`}>연체(개월)</th>
              <th className={`${HEADER_CELL} text-right`}>현재 잔액 (원)</th>
              <th className={HEADER_CELL} aria-label="삭제" />
            </tr></thead>
            <tbody>{debts.map((debt) => {
              const locked = lockedDebtIds.includes(debt.id);
              const collateralAsset = debt.collateralAssetId
                ? assets.find((asset) => asset.id === debt.collateralAssetId)
                : undefined;
              return <tr key={debt.id} className={`border-b-[0.4px] border-neutral-30 last:border-b-0 ${locked ? "bg-neutral-10 [&_input]:!bg-neutral-10 [&_select]:!bg-neutral-10" : ""}`}>
                <td className={BODY_CELL}><SelectField className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`} value={debt.debtType} onChange={(event) => updateItem(debt.id, { debtType: event.target.value as DebtItemFormState["debtType"] })}>{DEBT_ITEM_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField></td>
                <td className={`${BODY_CELL} text-[14px] font-medium text-neutral-90/80`}>
                  {locked ? (
                    <span className="flex h-[34px] items-center gap-2 px-3 whitespace-nowrap">
                      {collateralAsset && <AssetIcon category={collateralAsset.category} />}
                      담보
                    </span>
                  ) : (
                    <SelectField
                      className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
                      value={isDebtCollateralLoan(debt) ? "secured" : "unsecured"}
                      onChange={(event) => updateItem(debt.id, {
                        isCollateralLoan: event.target.value === "secured",
                        collateralAssetId: undefined,
                      })}
                    >
                      <option value="secured">담보</option>
                      <option value="unsecured">무담보</option>
                    </SelectField>
                  )}
                </td>
                <td className={BODY_CELL}><TextInput value={debt.creditorName} onChange={(creditorName) => updateItem(debt.id, { creditorName })} placeholder="채권처" className={CELL_INPUT_BORDERLESS} /></td>
                <td className={BODY_CELL}><OverdueMonthsInput value={debt.overdueMonths} onChange={(overdueMonths) => updateItem(debt.id, { overdueMonths })} /></td>
                <td className={BODY_CELL}><WonInput value={debt.currentBalanceWon} onChange={(currentBalanceWon) => updateItem(debt.id, { currentBalanceWon })} className={CELL_INPUT_BORDERLESS} /></td>
                <td className={`${BODY_CELL} text-center`}>{!locked && <button type="button" onClick={() => removeRow(debt.id)} aria-label="행 삭제" className="cursor-pointer inline-flex h-6 w-6 items-center justify-center hover:opacity-70"><RemoveRowIcon /></button>}</td>
              </tr>;
            })}</tbody>
            <tfoot><tr className="border-t border-neutral-30"><td colSpan={6} className="py-2"><button data-debt-add-row type="button" onClick={addRow} className={`cursor-pointer w-full h-10 rounded-lg inline-flex items-center gap-1.5 px-3 text-[14px] font-medium text-neutral-50 hover:text-neutral-60 ${sumCardBackgroundClassName}`}><PlusIcon />행 추가</button></td></tr></tfoot>
            </table>
          </div>
          {scrollEdgeControls}
        </div>
        {summaryCards}
      </div>
    );
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
          id={detailedScrollContainerId}
          className={`table-horizontal-scroll overflow-x-auto ${detailedCustomScrollbarEnabled ? "scrollbar-hide" : ""}`}
          style={{ scrollbarWidth: detailedCustomScrollbarEnabled ? "none" : undefined }}
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
              const collateralAsset = debt.collateralAssetId
                ? assets.find((asset) => asset.id === debt.collateralAssetId)
                : undefined;
              return (
              <tr key={debt.id} className={`border-b-[0.4px] border-neutral-30 last:border-b-0 ${locked ? "bg-neutral-10 [&_input]:!bg-neutral-10 [&_select]:!bg-neutral-10" : ""}`}>
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
                  {locked ? (
                    <span className="inline-flex h-[34px] items-center gap-2 px-3 text-[13px] font-medium text-neutral-90/80 whitespace-nowrap">
                      {collateralAsset && <AssetIcon category={collateralAsset.category} />}
                      담보
                    </span>
                  ) : (
                    <SelectField
                      className={`h-[34px] text-[13px] ${CELL_INPUT_BORDERLESS}`}
                      value={isDebtCollateralLoan(debt) ? "secured" : "unsecured"}
                      onChange={(event) => updateItem(debt.id, {
                        isCollateralLoan: event.target.value === "secured",
                        collateralAssetId: undefined,
                      })}
                    >
                      <option value="secured">담보</option>
                      <option value="unsecured">무담보</option>
                    </SelectField>
                  )}
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
                </td>
                <td className={BODY_CELL}>
                  <OverdueMonthsInput
                    value={debt.overdueMonths}
                    onChange={(value) => updateItem(debt.id, { overdueMonths: value })}
                  />
                </td>
                <td className={BODY_CELL}>
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
                </td>
                <td className={BODY_CELL}>
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
                  <PercentInput
                    value={debt.interestRate}
                    onChange={(value) => updateItem(debt.id, { interestRate: value ?? undefined })}
                    invalid={isFieldInvalid("interestRate")}
                    className={cellInputClassName(isFieldInvalid("interestRate"))}
                  />
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
            <tr className="border-t border-neutral-30">
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
        {!detailedCustomScrollbarEnabled && scrollEdgeControls}
      </div>

      {detailedCustomScrollbarEnabled && detailedCustomScrollbar}

      {summaryCards}
    </div>
  );
}
