import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import CalendarPrevIcon from "@/components/common/icons/CalendarPrevIcon";
import CalendarNextIcon from "@/components/common/icons/CalendarNextIcon";

type MonthPickerProps = {
	value: Date | null;
	onChange: (date: Date | null) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	minDate?: Date | null;
	maxDate?: Date | null;
    dateFormat?: string;
};

export default function MonthPicker(props: MonthPickerProps) {
	const { value, onChange, placeholder = "연도 . 월", className = "", disabled, minDate, maxDate, dateFormat = "yyyy. MM" } = props;

	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<"month" | "year">("month");
	const initial = useMemo(() => (value ? new Date(value) : new Date()), [value]);
	// view tracks the currently displayed year
	const [viewYear, setViewYear] = useState<number>(initial.getFullYear());
	const [yearStart, setYearStart] = useState<number>(initial.getFullYear() - 12); // 24-year page

	const rootRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

	const closeAndReset = useCallback(() => {
		setOpen(false);
		const base = value ? new Date(value) : new Date();
		setViewYear(base.getFullYear());
		setYearStart(base.getFullYear() - 12);
		setMode("month");
	}, [value]);

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

	// Anchor the panel under the input
	useEffect(() => {
		if (!open) return;
		function update() {
			const el = inputRef.current;
			const panel = panelRef.current;
			if (!el) return;
			
			const r = el.getBoundingClientRect();
			const panelHeight = panel?.offsetHeight || 300;
			const viewportHeight = window.innerHeight;
			
			const spaceBelow = viewportHeight - r.bottom;
			const spaceAbove = r.top;
			
			let top: number;
			if (spaceBelow < panelHeight + 8 && spaceAbove > panelHeight + 8) {
				top = r.top - panelHeight - 8;
			} else {
				top = r.bottom + 8;
			}
			
			setPanelPos({ 
				top, 
				left: r.left 
			});
		}
		
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
		if (!open) {
			const base = value ? new Date(value) : new Date();
			setViewYear(base.getFullYear());
			setYearStart(base.getFullYear() - 12);
			setMode("month");
		}
	}, [value, open]);

	function openPicker() {
		if (disabled) return;
		setOpen(true);
		setMode("month");
		const base = value ? new Date(value) : new Date();
		setViewYear(base.getFullYear());
		setYearStart(base.getFullYear() - 12);
	}

	function goPrev() {
		if (mode === "month") {
			setViewYear((y) => y - 1);
		} else {
			setYearStart((s) => s - 24);
		}
	}

	function goNext() {
		if (mode === "month") {
			setViewYear((y) => y + 1);
		} else {
			setYearStart((s) => s + 24);
		}
	}

	function onSelectMonth(monthIndex: number) {
		const newDate = new Date(viewYear, monthIndex, 1);
		onChange(newDate);
		closeAndReset();
	}

	function onSelectYear(y: number) {
		setViewYear(y);
		setMode("month");
	}

	return (
		<div ref={rootRef} className="relative w-full">
			<input
				ref={inputRef}
				readOnly
				disabled={disabled}
				onClick={openPicker}
				onFocus={openPicker}
				value={value ? format(value, dateFormat) : ""}
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
							className="w-6 h-6 flex items-center justify-center"
							onClick={goPrev}
							aria-label="이전"
						>
							<CalendarPrevIcon className="w-6 h-6" />
						</button>
						<button
							type="button"
							className="px-2 py-1 rounded-[6px] hover:bg-neutral-10 text-[14px] text-[#252525] flex items-center gap-1"
							onClick={() => {
								if (mode === "month") {
									setMode("year");
									setYearStart(viewYear - 12);
								} else {
									setMode("month");
								}
							}}
							aria-label="연도 선택 토글"
							style={{ fontFamily: "var(--font-montserrat)" }}
						>
							{mode === "month" ? `${viewYear}` : `${yearStart} - ${yearStart + 23}`}
						</button>
						<button
							type="button"
							className="w-6 h-6 flex items-center justify-center"
							onClick={goNext}
							aria-label="다음"
						>
							<CalendarNextIcon className="w-6 h-6" />
						</button>
					</div>

					{/* Body */}
					{mode === "month" ? (
						<div className="grid grid-cols-3 gap-2">
							{Array.from({ length: 12 }).map((_, i) => {
								const isSelected =
									value &&
									value.getFullYear() === viewYear &&
									value.getMonth() === i;
								
								// Check min/max
								const currentMonthDate = new Date(viewYear, i, 1);
                                // For disabling, we check if the entire month is out of range
                                // But usually checking the 1st of month is enough, or checking if the month end/start overlaps
                                // Simple check: 
                                const min = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null;
                                const max = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
                                
                                const isBeforeMin = min ? currentMonthDate < min : false;
                                const isAfterMax = max ? currentMonthDate > max : false;
                                const isDisabled = isBeforeMin || isAfterMax;

								return (
									<button
										key={i}
										type="button"
										onClick={() => !isDisabled && onSelectMonth(i)}
										className={`h-10 rounded-[6px] text-[14px] flex items-center justify-center transition-colors
                                            ${isSelected ? "bg-[#D6FAE8] text-[#252525]" : "text-[#252525] hover:bg-neutral-20"}
                                            ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                                        `}
										style={{ fontFamily: "var(--font-montserrat)" }}
                                        disabled={isDisabled}
									>
										{i + 1}월
									</button>
								);
							})}
						</div>
					) : (
						<div>
							<div className="grid grid-cols-4 gap-2">
								{Array.from({ length: 24 }).map((_, idx) => {
									const y = yearStart + idx;
                                    const isSelected = value && value.getFullYear() === y;
									return (
										<button
											key={y}
											type="button"
											onClick={() => onSelectYear(y)}
											className={`h-8 rounded-[6px] text-[14px] flex items-center justify-center hover:bg-neutral-20
                                                ${isSelected ? "bg-[#D6FAE8] text-[#252525]" : "text-[#252525]"}
                                            `}
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

