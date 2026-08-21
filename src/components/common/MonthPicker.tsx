import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";

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

/** 선택된 셀 스타일. 배경이 라이트/다크 공통이라 글자색도 테마와 무관하게 어둡게 고정한다(DatePicker와 동일). */
const SELECTED_CELL_CLS = "bg-primary-10 !text-[var(--neutral-light-90)]";

/** 패널 너비(px). 위치 계산과 실제 렌더 폭이 어긋나지 않도록 한 곳에서만 정의한다. */
const PANEL_WIDTH = 256;

export default function MonthPicker(props: MonthPickerProps) {
	const { value, onChange, placeholder = "연도 . 월", className = "", disabled, minDate, maxDate, dateFormat = "yyyy. MM" } = props;

	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<"month" | "year">("month");
	const initial = useMemo(() => (value ? new Date(value) : new Date()), [value]);
	// view tracks the currently displayed year
	const [viewYear, setViewYear] = useState<number>(initial.getFullYear());
	const [yearStart, setYearStart] = useState<number>(initial.getFullYear() - 20); // 40-year page with scroll

	const closeAndReset = useCallback(() => {
		setOpen(false);
		const base = value ? new Date(value) : new Date();
		setViewYear(base.getFullYear());
		setYearStart(base.getFullYear() - 20);
		setMode("month");
	}, [value]);

	// 사용처가 모두 "◀ [가운데 정렬 텍스트] ▶" 형태라 인풋(120~163px)보다 패널이 넓다.
	// 좌측 정렬하면 시각적 중심이 어긋나므로 align="center"를 쓴다.
	const { rootRef, anchorRef, panelRef, panelPos } = useAnchoredPanel<HTMLInputElement>({
		open,
		onClose: closeAndReset,
		panelWidth: PANEL_WIDTH,
		estimatedPanelHeight: 300,
		align: "center",
		recalcKey: mode,
	});

	useEffect(() => {
		if (!open) {
			const base = value ? new Date(value) : new Date();
			setViewYear(base.getFullYear());
			setYearStart(base.getFullYear() - 20);
			setMode("month");
		}
	}, [value, open]);

	function openPicker() {
		if (disabled) return;
		setOpen(true);
		setMode("month");
		const base = value ? new Date(value) : new Date();
		setViewYear(base.getFullYear());
		setYearStart(base.getFullYear() - 20);
	}

	function goPrev() {
		if (mode === "month") {
			setViewYear((y) => y - 1);
		} else {
			setYearStart((s) => s - 40);
		}
	}

	function goNext() {
		if (mode === "month") {
			setViewYear((y) => y + 1);
		} else {
			setYearStart((s) => s + 40);
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
		<div ref={rootRef} className="relative w-full min-w-0">
			<input
				ref={anchorRef}
				readOnly
				disabled={disabled}
				onClick={openPicker}
				onFocus={openPicker}
				value={value ? format(value, dateFormat) : ""}
				placeholder={placeholder}
				className={`w-full min-w-0 appearance-none outline-none text-[14px] leading-[17px] tracking-[-0.02em] h-[34px] rounded-[6px] border border-[#E5E7EB] dark:border-[#444444] px-3 cursor-pointer bg-white dark:bg-neutral-20 text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60 ${className}`}
			/>

			{open && panelPos && createPortal(
				<div
					ref={panelRef}
					data-anchored-panel
					className="z-[1000] bg-white dark:bg-neutral-20 rounded-[14px] shadow-[0px_18px_28px_rgba(9,30,66,0.10)] dark:shadow-[0px_18px_28px_rgba(0,0,0,0.4)] p-4 border border-transparent dark:border-[#444444]"
					style={{ position: "fixed", top: panelPos.top, left: panelPos.left, width: PANEL_WIDTH }}
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<button
							type="button"
							className="px-2 py-1 rounded-[6px] hover:bg-neutral-10 dark:hover:bg-neutral-30 text-[14px] font-medium text-[#252525] dark:text-neutral-80 flex items-center gap-2 cursor-pointer"
							onClick={() => {
								if (mode === "month") {
									setMode("year");
									setYearStart(viewYear - 20);
								} else {
									setMode("month");
								}
							}}
							aria-label="연도 선택 토글"
							style={{ fontFamily: "var(--font-montserrat)" }}
						>
							{mode === "month" ? `${viewYear}` : `${yearStart} - ${yearStart + 39}`}
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
							<button
								type="button"
								className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer rounded-[6px] border border-[#E2E2E2] dark:border-[#444444] hover:bg-neutral-10 dark:hover:bg-neutral-30"
								onClick={goPrev}
								aria-label="이전"
							>
								<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M7 13L1 7L7 1" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60"/>
								</svg>
							</button>
							<button
								type="button"
								className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer rounded-[6px] border border-[#E2E2E2] dark:border-[#444444] hover:bg-neutral-10 dark:hover:bg-neutral-30"
								onClick={goNext}
								aria-label="다음"
							>
								<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M1 13L7 7L1 1" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60"/>
								</svg>
							</button>
						</div>
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
                                            ${isSelected ? SELECTED_CELL_CLS : "text-[#252525] dark:text-neutral-80 hover:bg-neutral-20 dark:hover:bg-neutral-30"}
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
						<div className="max-h-[240px] overflow-y-auto custom-scrollbar">
							<div className="grid grid-cols-4 gap-2">
								{Array.from({ length: 40 }).map((_, idx) => {
									const y = yearStart + idx;
									const isCurrentYear = viewYear === y;
									const isSelected = value && value.getFullYear() === y;
									return (
										<button
											key={y}
											type="button"
											onClick={() => onSelectYear(y)}
											className={`h-8 rounded-[6px] text-[14px] flex items-center justify-center cursor-pointer ${
												isSelected || isCurrentYear
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

