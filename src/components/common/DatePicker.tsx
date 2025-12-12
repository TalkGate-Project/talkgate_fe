import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { generateMonthCells } from "@/utils/calendar";

type DatePickerProps = {
	value: Date | null;
	onChange: (date: Date | null) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	minDate?: Date | null;
	maxDate?: Date | null;
    dateFormat?: string;
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function DatePicker(props: DatePickerProps) {
	const { value, onChange, placeholder = "연도 . 월 . 일", className = "", disabled, minDate, maxDate, dateFormat = "yyyy. MM. dd" } = props;

	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<"month" | "year">("month");
	const initial = useMemo(() => (value ? new Date(value) : new Date()), [value]);
	const [view, setView] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1));
	// Calculate yearStart: if minDate exists, start from minDate year, otherwise start from initial year - 20
	const minYear = minDate ? minDate.getFullYear() : null;
	const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 10;
	const defaultYearStart = minYear ? minYear : initial.getFullYear() - 20;
	const [yearStart, setYearStart] = useState<number>(defaultYearStart); // Starting year for year selection

	const rootRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

	const closeAndReset = useCallback(() => {
		setOpen(false);
		const base = value ? new Date(value) : new Date();
		setView(new Date(base.getFullYear(), base.getMonth(), 1));
		const resetMinYear = minDate ? minDate.getFullYear() : null;
		const resetYearStart = resetMinYear ? resetMinYear : base.getFullYear() - 20;
		setYearStart(resetYearStart);
		setMode("month");
	}, [value, minDate]);

	useEffect(() => {
		if (!open) return;
		function onDocMouseDown(e: MouseEvent) {
			const t = e.target as Node;
			const inRoot = !!rootRef.current?.contains(t);
			const inPanel = !!panelRef.current?.contains(t);
			if (!inRoot && !inPanel) closeAndReset();
		}
		function onEsc(e: KeyboardEvent) {
			if (e.key === "Escape") closeAndReset();
		}
		document.addEventListener("mousedown", onDocMouseDown, true);
		document.addEventListener("keydown", onEsc, true);
		return () => {
			document.removeEventListener("mousedown", onDocMouseDown, true);
			document.removeEventListener("keydown", onEsc, true);
		};
	}, [open, closeAndReset]);

	// Anchor the panel under the input (floating over modals)
	useEffect(() => {
		if (!open) return;
		function update() {
			const el = inputRef.current;
			const panel = panelRef.current;
			if (!el) return;
			
			const r = el.getBoundingClientRect();
			const panelHeight = panel?.offsetHeight || 400; // Default estimate 400px
			const viewportHeight = window.innerHeight;
			
			// Calculate if there's enough space below the input
			const spaceBelow = viewportHeight - r.bottom;
			const spaceAbove = r.top;
			
			// If not enough space below but enough space above, position above
			let top: number;
			if (spaceBelow < panelHeight + 8 && spaceAbove > panelHeight + 8) {
				// Position above input
				top = r.top - panelHeight - 8;
			} else {
				// Position below input (default)
				top = r.bottom + 8;
			}
			
			setPanelPos({ 
				top, 
				left: r.left 
			});
		}
		
		// Initial update after a small delay to ensure panel is rendered
		const timer = setTimeout(update, 0);
		update();
		
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [open]);

	useEffect(() => {
		// Keep view in sync when external value changes while closed
		if (!open) {
			const base = value ? new Date(value) : new Date();
			setView(new Date(base.getFullYear(), base.getMonth(), 1));
			const syncMinYear = minDate ? minDate.getFullYear() : null;
			const syncYearStart = syncMinYear ? syncMinYear : base.getFullYear() - 20;
			setYearStart(syncYearStart);
			setMode("month");
		}
	}, [value, open, minDate]);

	const label = useMemo(() => {
		const y = view.getFullYear();
		const m = view.getMonth() + 1;
		return `${m}월 ${y}`;
	}, [view]);

	function openPicker() {
		if (disabled) return;
		setOpen(true);
		setMode("month");
		const base = value ? new Date(value) : new Date();
		setView(new Date(base.getFullYear(), base.getMonth(), 1));
		const openMinYear = minDate ? minDate.getFullYear() : null;
		const openYearStart = openMinYear ? openMinYear : base.getFullYear() - 20;
		setYearStart(openYearStart);
	}



	function goPrev() {
		if (mode === "month") {
			setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
		}
	}

	function goNext() {
		if (mode === "month") {
			setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
		}
	}

	function onSelectDay(d: Date) {
		onChange(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
		closeAndReset();
	}

	function onSelectYear(y: number) {
		setView((v) => new Date(y, v.getMonth(), 1));
		setMode("month");
	}

	const monthCells = useMemo(() => generateMonthCells(view), [view]);

	return (
		<div ref={rootRef} className="relative w-full">
			<input
				ref={inputRef}
				readOnly
				disabled={disabled}
				onClick={openPicker}
				onFocus={openPicker}
				value={value ? format(value, dateFormat, { locale: ko }) : ""}
				placeholder={placeholder}
				className={`w-full outline-none text-[14px] leading-[17px] tracking-[-0.02em] h-[34px] rounded-[6px] border border-[#E5E7EB] px-3 cursor-pointer ${className}`}
			/>

			{open && panelPos && createPortal(
				<div
					ref={panelRef}
					className="z-[1000] w-[256px] bg-white rounded-[14px] shadow-[0px_18px_28px_rgba(9,30,66,0.10)] p-4"
					style={{ position: "fixed", top: panelPos.top, left: panelPos.left }}
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<button
							type="button"
							className="px-2 py-1 rounded-[6px] hover:bg-neutral-10 text-[14px] font-medium text-[#252525] flex items-center gap-2 cursor-pointer"
							onClick={() => {
								if (mode === "month") {
									setMode("year");
									// When switching to year mode, start from minYear if exists, otherwise from current year
									const toggleMinYear = minDate ? minDate.getFullYear() : null;
									const toggleYearStart = toggleMinYear ? toggleMinYear : view.getFullYear() - 20;
									setYearStart(toggleYearStart);
								} else {
									setMode("month");
								}
							}}
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
								/>
							</svg>
						</button>
						{mode === "month" && (
							<div className="flex items-center gap-2">
								<button
									type="button"
									className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer rounded-[6px] border border-[#E2E2E2] hover:bg-neutral-10"
									onClick={goPrev}
									aria-label="이전"
								>
									<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M7 13L1 7L7 1" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</button>
								<button
									type="button"
									className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer rounded-[6px] border border-[#E2E2E2] hover:bg-neutral-10"
									onClick={goNext}
									aria-label="다음"
								>
									<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1 13L7 7L1 1" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</button>
							</div>
						)}
					</div>

					{/* Body */}
					{mode === "month" ? (
						<div>
							{/* Weekday header */}
							<div className="grid grid-cols-7 gap-y-2 mb-2">
								{DAYS.map((d) => (
									<div key={d} className="w-8 h-8 flex items-center justify-center text-[12px] text-[#808080]">
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
									const minDateOnly = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;
									const maxDateOnly = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : null;
									
									const isDisabled = 
										(minDateOnly && dateOnly < minDateOnly) ||
										(maxDateOnly && dateOnly > maxDateOnly);
									
									const baseCls =
										"w-8 h-8 flex items-center justify-center rounded-full text-[14px]";
									const textCls = inCurrent ? "text-[#252525]" : "text-[#B0B0B0]";
									const selectedCls = isSelected ? "bg-[#D6FAE8]" : "hover:bg-neutral-20";
									const disabledCls = isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer";
									
										return (
											<button
											key={date.toISOString() + inCurrent}
											type="button"
											className={`${baseCls} ${textCls} ${isDisabled ? disabledCls : selectedCls} ${disabledCls}`}
											onClick={() => !isDisabled && onSelectDay(date)}
											disabled={isDisabled || undefined}
											style={{ fontFamily: "var(--font-montserrat)" }}
										>
											{date.getDate()}
										</button>
									);
								})}
							</div>
						</div>
					) : (
						<div className="max-h-[240px] overflow-y-auto custom-scrollbar">
							<div className="grid grid-cols-4 gap-2">
								{Array.from({ length: Math.min(80, maxYear - yearStart + 1) }).map((_, idx) => {
									const y = yearStart + idx;
									if (y > maxYear) return null;
									const isCurrentYear = view.getFullYear() === y;
									// Check if year is disabled based on minDate and maxDate
									const isDisabled = (minDate ? y < minDate.getFullYear() : false) || (maxDate ? y > maxDate.getFullYear() : false);
									return (
										<button
											key={y}
											type="button"
											onClick={() => !isDisabled && onSelectYear(y)}
											disabled={isDisabled || undefined}
											className={`h-8 rounded-[6px] text-[14px] ${
												isDisabled 
													? "opacity-30 cursor-not-allowed text-[#B0B0B0]"
													: isCurrentYear 
														? "bg-[#D6FAE8] text-[#252525] font-medium cursor-pointer" 
														: "text-[#252525] hover:bg-neutral-20 cursor-pointer"
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


