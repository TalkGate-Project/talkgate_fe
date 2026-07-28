import { useEffect, useId, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { generateMonthCells } from "@/utils/calendar";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";

type DatePickerProps = {
	value: Date | null;
	onChange: (date: Date | null) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	minDate?: Date | null;
	maxDate?: Date | null;
    dateFormat?: string;
	/** 패널과 인풋 사이 세로 간격(px). 기본 8 */
	panelOffsetY?: number;
	/** 검증 실패 상태일 때 인풋 테두리를 빨간색으로 표시 */
	invalid?: boolean;
	/** 외부 <label htmlFor>와 연결할 때 사용하는 인풋 id */
	id?: string;
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = Array.from({ length: 12 }, (_, idx) => idx);

/** day: 일 선택 / month: 월 선택 / year: 연도 선택 */
type DatePickerMode = "day" | "month" | "year";

/**
 * 선택된 셀 스타일. 배경(primary-10)이 라이트/다크 공통으로 밝은 민트이므로 글자색도
 * 테마와 무관하게 어둡게 고정한다 — 다크모드에서 밝은 글자가 배경에 묻히는 것을 방지.
 *
 * 글자색에 `text-neutral-90`을 쓰면 안 된다. 그 토큰은 테마에 따라 뒤집혀
 * (globals.css의 `--neutral-90`이 다크에서 `--neutral-dark-90`이 됨) 같은 버그가 재발한다.
 * 팔레트 원본 토큰인 `--neutral-light-90`을 직접 참조해 고정한다.
 */
const SELECTED_CELL_CLS = "bg-primary-10 !text-[var(--neutral-light-90)]";

/** 패널 너비(px). 위치 계산과 실제 렌더 폭이 어긋나지 않도록 한 곳에서만 정의한다. */
const PANEL_WIDTH = 256;

/** minDate가 없을 때 연도 선택 목록이 거슬러 올라가는 하한(고령 고객 생년월일까지 커버) */
const EARLIEST_SELECTABLE_YEAR = 1920;
/** maxDate가 없을 때 연도 선택 목록이 나아가는 기본 범위 */
const DEFAULT_YEARS_AHEAD = 10;

export default function DatePicker(props: DatePickerProps) {
	const { value, onChange, placeholder = "연도 . 월 . 일", className = "", disabled, minDate, maxDate, dateFormat = "yyyy. MM. dd", panelOffsetY = 8, invalid = false, id } = props;

	const panelId = useId();
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<DatePickerMode>("day");
	const initial = useMemo(() => (value ? new Date(value) : new Date()), [value]);
	const [view, setView] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1));

	// 선택 가능한 연도 범위. min/max가 없으면 넉넉한 기본 범위를 쓰고,
	// 이미 선택된 값이 그 범위 밖이면(오래된 생년월일 등) 범위를 넓혀 항상 노출되게 한다.
	const currentYear = new Date().getFullYear();
	const initialYear = initial.getFullYear();
	const firstSelectableYear = minDate
		? minDate.getFullYear()
		: Math.min(EARLIEST_SELECTABLE_YEAR, initialYear);
	const lastSelectableYear = maxDate
		? maxDate.getFullYear()
		: Math.max(currentYear + DEFAULT_YEARS_AHEAD, initialYear);
	const selectableYears = useMemo(() => {
		const total = Math.max(0, lastSelectableYear - firstSelectableYear + 1);
		return Array.from({ length: total }, (_, idx) => firstSelectableYear + idx);
	}, [firstSelectableYear, lastSelectableYear]);

	const yearListRef = useRef<HTMLDivElement | null>(null);

	const closeAndReset = useCallback(() => {
		setOpen(false);
		const base = value ? new Date(value) : new Date();
		setView(new Date(base.getFullYear(), base.getMonth(), 1));
		setMode("day");
	}, [value]);

	const { rootRef, anchorRef, panelRef, panelPos } = useAnchoredPanel<HTMLInputElement>({
		open,
		onClose: closeAndReset,
		panelWidth: PANEL_WIDTH,
		estimatedPanelHeight: 400,
		offsetY: panelOffsetY,
		recalcKey: mode,
	});

	useEffect(() => {
		// Keep view in sync when external value changes while closed
		if (!open) {
			const base = value ? new Date(value) : new Date();
			setView(new Date(base.getFullYear(), base.getMonth(), 1));
			setMode("day");
		}
	}, [value, open]);

	// 연도 모드로 들어오면 현재 보고 있는 연도가 목록 가운데에 오도록 스크롤한다.
	useEffect(() => {
		if (!open || mode !== "year") return;
		const container = yearListRef.current;
		if (!container) return;
		const target = container.querySelector<HTMLElement>(`[data-year="${view.getFullYear()}"]`);
		if (!target) return;
		container.scrollTop = Math.max(
			0,
			target.offsetTop - container.clientHeight / 2 + target.offsetHeight / 2
		);
	}, [open, mode, view]);

	const label = useMemo(() => {
		const y = view.getFullYear();
		const m = view.getMonth() + 1;
		// 일 선택 화면에서만 월까지 보여준다. 월/연도 선택 중에는 기준 연도만 보여주는 편이 덜 헷갈린다.
		return mode === "day" ? `${m}월 ${y}` : `${y}`;
	}, [view, mode]);

	function openPicker() {
		if (disabled) return;
		setOpen(true);
		setMode("day");
		const base = value ? new Date(value) : new Date();
		setView(new Date(base.getFullYear(), base.getMonth(), 1));
	}

	// 연도 모드에서는 긴 연도 목록을 한 화면씩 넘긴다(휠 없이도 먼 연도로 이동 가능).
	function scrollYearList(direction: -1 | 1) {
		const container = yearListRef.current;
		if (!container) return;
		container.scrollBy({ top: direction * container.clientHeight, behavior: "smooth" });
	}

	function goPrev() {
		if (mode === "day") {
			setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
			return;
		}
		if (mode === "month") {
			setView((v) => new Date(v.getFullYear() - 1, v.getMonth(), 1));
			return;
		}
		scrollYearList(-1);
	}

	function goNext() {
		if (mode === "day") {
			setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
			return;
		}
		if (mode === "month") {
			setView((v) => new Date(v.getFullYear() + 1, v.getMonth(), 1));
			return;
		}
		scrollYearList(1);
	}

	function onSelectDay(d: Date) {
		onChange(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
		closeAndReset();
	}

	// 연도 → 월 → 일 순으로 좁혀 들어간다. 먼 과거(생년월일)로 이동할 때 화살표 연타를 없애기 위함.
	function onSelectYear(y: number) {
		setView((v) => new Date(y, v.getMonth(), 1));
		setMode("month");
	}

	function onSelectMonth(monthIndex: number) {
		setView((v) => new Date(v.getFullYear(), monthIndex, 1));
		setMode("day");
	}

	const monthCells = useMemo(() => generateMonthCells(view), [view]);
	const today = useMemo(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	}, []);

	return (
		<div ref={rootRef} className="relative w-full">
			<input
				ref={anchorRef}
				id={id}
				readOnly
				disabled={disabled}
				onClick={openPicker}
				onFocus={openPicker}
				value={value ? format(value, dateFormat, { locale: ko }) : ""}
				placeholder={placeholder}
				role="combobox"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={panelId}
				aria-invalid={invalid || undefined}
				className={`w-full outline-none text-[14px] leading-[17px] tracking-[-0.02em] h-[34px] rounded-[6px] border border-[#E5E7EB] dark:border-[#444444] px-3 cursor-pointer bg-white dark:bg-neutral-20 text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60 ${invalid ? "!border-danger-40 dark:!border-danger-40" : ""} ${className}`}
			/>

			{open && panelPos && createPortal(
				<div
					ref={panelRef}
					id={panelId}
					role="dialog"
					aria-modal="true"
					aria-label={mode === "day" ? "날짜 선택" : mode === "month" ? "월 선택" : "연도 선택"}
					className="z-[1000] bg-white dark:bg-neutral-20 rounded-[14px] shadow-[0px_18px_28px_rgba(9,30,66,0.10)] dark:shadow-[0px_18px_28px_rgba(0,0,0,0.4)] p-4 border border-transparent dark:border-[#444444]"
					style={{ position: "fixed", top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<button
							type="button"
							className="px-2 py-1 rounded-[6px] hover:bg-neutral-10 dark:hover:bg-neutral-30 text-[14px] font-medium text-[#252525] dark:text-neutral-80 flex items-center gap-2 cursor-pointer"
							onClick={() => setMode((m) => (m === "year" ? "day" : "year"))}
							aria-label="연도 선택 토글"
							style={{ fontFamily: "var(--font-montserrat)" }}
						>
							{label}
							{/* 토글 화살표 아이콘 */}
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className={`transition-transform ${mode === "year" ? "rotate-180" : ""}`}
							>
								<path
									d="M4 6L8 10L12 6"
									stroke="#808080"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="dark:stroke-neutral-60"
								/>
							</svg>
						</button>
						<div className="flex items-center gap-2">
							{mode === "day" && (
							<button
								type="button"
								className="w-[30px] h-[30px] flex items-center justify-center rounded-[6px] border border-[#E2E2E2] dark:border-[#444444] hover:bg-neutral-10 dark:hover:bg-neutral-30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
								onClick={() => onChange(null)}
								aria-label="선택 날짜 초기화"
								disabled={!value}
							>
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M2 2.8V5.8H5" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60" />
									<path d="M2.3 5.2C2.96 3.66 4.49 2.58 6.28 2.58C8.68 2.58 10.62 4.52 10.62 6.92C10.62 9.32 8.68 11.26 6.28 11.26C4.49 11.26 2.95 10.16 2.29 8.62" stroke="#B0B0B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60" />
								</svg>
							</button>
							)}
							<button
								type="button"
								className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer rounded-[6px] border border-[#E2E2E2] dark:border-[#444444] hover:bg-neutral-10 dark:hover:bg-neutral-30"
								onClick={goPrev}
								aria-label={mode === "day" ? "이전 달" : mode === "month" ? "이전 연도" : "이전 연도 목록"}
							>
								<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M7 13L1 7L7 1" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60"/>
								</svg>
							</button>
							<button
								type="button"
								className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer rounded-[6px] border border-[#E2E2E2] dark:border-[#444444] hover:bg-neutral-10 dark:hover:bg-neutral-30"
								onClick={goNext}
								aria-label={mode === "day" ? "다음 달" : mode === "month" ? "다음 연도" : "다음 연도 목록"}
							>
								<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M1 13L7 7L1 1" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60"/>
								</svg>
								</button>
						</div>
					</div>

					{/* Body */}
					{mode === "day" ? (
						<div>
							{/* Weekday header. role="grid"/"gridcell" 등 완전한 그리드 시맨틱은 방향키 내비게이션과
							    함께 넣는다 — 키보드 지원 없이 role만 붙이면 스크린리더가 그리드 탐색을
							    기대하게 만들어 오히려 혼란스럽다. 지금은 라벨만 보강한다. */}
							<div className="grid grid-cols-7 gap-y-2 mb-2">
								{DAYS.map((d) => (
									<div key={d} aria-label={`${d}요일`} className="w-8 h-8 flex items-center justify-center text-[12px] text-[#808080] dark:text-neutral-60">
										{d}
									</div>
								))}
							</div>
							{/* Dates */}
							<div className="grid grid-cols-7 gap-y-1">
								{monthCells.map(({ date, inCurrent }) => {
									const isSelected =
										value &&
										date.getFullYear() === value.getFullYear() &&
										date.getMonth() === value.getMonth() &&
										date.getDate() === value.getDate();
									
									// Check if date is disabled based on min/max
									const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
									const isToday =
										dateOnly.getFullYear() === today.getFullYear() &&
										dateOnly.getMonth() === today.getMonth() &&
										dateOnly.getDate() === today.getDate();
									const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
									const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
									
									const isDisabled = 
										(minDateOnly && dateOnly < minDateOnly) ||
										(maxDateOnly && dateOnly > maxDateOnly);
									
									const baseCls =
										"w-8 h-8 flex items-center justify-center rounded-full text-[14px]";
									const textCls = inCurrent ? "text-[#252525] dark:text-neutral-80" : "text-[#B0B0B0] dark:text-neutral-60";
									const selectedCls = isSelected
										? `${SELECTED_CELL_CLS} hover:bg-primary-10`
										: "hover:bg-neutral-20 dark:hover:bg-neutral-30";
									const disabledCls = isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer";
									
										const dayAriaLabel = `${format(date, "yyyy년 M월 d일 (EEEE)", { locale: ko })}${isToday ? " (오늘)" : ""}`;

										return (
											<button
											key={date.toISOString() + inCurrent}
											type="button"
											className={`${baseCls} ${textCls} ${isDisabled ? "" : selectedCls} ${disabledCls}`}
											onClick={() => !isDisabled && onSelectDay(date)}
											disabled={isDisabled || undefined}
											aria-label={dayAriaLabel}
											aria-pressed={!!isSelected}
											aria-current={isToday ? "date" : undefined}
											style={{ fontFamily: "var(--font-montserrat)" }}
										>
											{isToday && !isSelected ? (
												<div className="relative w-[24px] h-[24px] flex items-center justify-center">
													<div className="absolute w-full h-full bg-[#252525] dark:bg-[#F5F5F5] rounded-full" />
													<span className="relative text-[#FFFFFF] dark:text-[#111111]">
														{date.getDate()}
													</span>
												</div>
											) : (
												date.getDate()
											)}
										</button>
									);
								})}
							</div>
						</div>
					) : mode === "month" ? (
						<div className="grid grid-cols-3 gap-2 py-1">
							{MONTHS.map((monthIndex) => {
								const isCurrentMonth = view.getMonth() === monthIndex;
								// 해당 월 전체가 min/max 밖이면 선택 불가
								const monthStart = new Date(view.getFullYear(), monthIndex, 1);
								const monthEnd = new Date(view.getFullYear(), monthIndex + 1, 0);
								const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
								const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
								const isDisabled =
									(minDateOnly ? monthEnd < minDateOnly : false) ||
									(maxDateOnly ? monthStart > maxDateOnly : false);
								return (
									<button
										key={monthIndex}
										type="button"
										onClick={() => !isDisabled && onSelectMonth(monthIndex)}
										disabled={isDisabled || undefined}
										aria-label={`${view.getFullYear()}년 ${monthIndex + 1}월`}
										aria-pressed={isCurrentMonth}
										className={`h-9 rounded-[6px] text-[14px] ${
											isDisabled
												? "opacity-30 cursor-not-allowed text-[#B0B0B0] dark:text-neutral-60"
												: isCurrentMonth
													? `${SELECTED_CELL_CLS} font-medium cursor-pointer`
													: "text-[#252525] dark:text-neutral-80 hover:bg-neutral-20 dark:hover:bg-neutral-30 cursor-pointer"
										}`}
									>
										{monthIndex + 1}월
									</button>
								);
							})}
						</div>
					) : (
						<div ref={yearListRef} className="relative max-h-[240px] overflow-y-auto custom-scrollbar">
							<div className="grid grid-cols-4 gap-2">
								{/* selectableYears가 이미 min/max로 잘려 생성되므로(위 firstSelectableYear
								    /lastSelectableYear) 여기서 별도의 disabled 판정은 필요 없다. */}
								{selectableYears.map((y) => {
									const isCurrentYear = view.getFullYear() === y;
									return (
										<button
											key={y}
											type="button"
											data-year={y}
											onClick={() => onSelectYear(y)}
											aria-label={`${y}년`}
											aria-pressed={isCurrentYear}
											className={`h-8 rounded-[6px] text-[14px] cursor-pointer ${
												isCurrentYear
													? `${SELECTED_CELL_CLS} font-medium`
													: "text-[#252525] dark:text-neutral-80 hover:bg-neutral-20 dark:hover:bg-neutral-30"
											}`}
											style={{ fontFamily: "var(--font-montserrat)" }}
										>
											{y}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>,
				document.body
			)}
		</div>
	);
}


