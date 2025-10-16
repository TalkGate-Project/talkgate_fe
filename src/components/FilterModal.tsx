"use client";

import { ReactNode, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { CustomerNoteCategoriesService, CustomerNoteCategory } from "@/services/customerNoteCategories";

export type FilterValues = {
    teamId?: number;
    memberId?: number;
    applicationRoute?: string;
    mediaCompany?: string;
    site?: string;
    categoryIds?: number[];
    noteContent?: string;
    applicationDateFrom?: string;
    applicationDateTo?: string;
    assignedAtFrom?: string;
    assignedAtTo?: string;
};

type Option = { label: string; value: string | number };

type FilterModalProps = {
    open: boolean;
    onClose: () => void;
    onApply: (values: FilterValues) => void;
    defaults?: FilterValues;
    teamOptions?: Option[];
    memberOptions?: Option[];
    routeOptions?: Option[];
    mediaOptions?: Option[];
    siteOptions?: Option[];
    categoryOptions?: Option[];
};

export default function FilterModal({ open, onClose, onApply, defaults, teamOptions = [], memberOptions = [], routeOptions = [], mediaOptions = [], siteOptions = [], categoryOptions = [] }: FilterModalProps) {
    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (!open) return;
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Modal container (centered) */}
            <div className="absolute left-1/2 top-1/2" style={{ width: 848, height: 604, transform: "translate(-50%, -50%)" }}>
                <div className="relative w-full h-full bg-white rounded-[14px] shadow-[0px_13px_61px_rgba(169,169,169,0.37)]">
                    {/* Header */}
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                        <h2 className="text-[18px] leading-[21px] font-semibold text-black">필터추가</h2>
                        <button aria-label="close" onClick={onClose} className="w-6 h-6 grid place-items-center text-[#111827]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 18L18 6M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 pt-4 space-y-3 overflow-auto" style={{ height: 604 - 56 - 74 }}>
                        <div className="grid grid-cols-2 gap-4">
                            <LabeledSelect label="담당팀" options={teamOptions} placeholder="전체" />
                            <LabeledSelect label="담당자" options={memberOptions} placeholder="전체" />

                            <LabeledSelect label="신청경로" options={routeOptions} placeholder="전체" />
                            <LabeledSelect label="매체사" options={mediaOptions} placeholder="전체" />

                            <CategorySelector />
                            <LabeledSelect label="사이트" options={siteOptions} placeholder="전체" />

                            {/* 상담 내용 */}
                            <div className="col-span-2">
                                <label className="block text-[14px] text-[#808080] mb-2">상담 내용</label>
                                <div className="border border-[#E2E2E2] rounded-[5px] px-3 py-2 h-[66px] flex items-start">
                                    <textarea className="w-full h-[66px] resize-none outline-none text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080]" placeholder="상담 내용을 작성해주세요" />
                                </div>
                            </div>

                            {/* 신청시간 / 배정시간 */}
                            <div>
                                <label className="block text-[14px] text-[#808080] mb-2">신청시간</label>
                                <div className="flex items-center gap-3">
                                    <DateRange />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[14px] text-[#808080] mb-2">배정시간</label>
                                <div className="flex items-center gap-3">
                                    <DateRange />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[#E2E2E2]" />
                    <div className="px-6 py-3 flex items-center justify-end gap-3">
                        <button className="h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] text-[14px] font-semibold tracking-[-0.02em] text-[#000] bg-white">초기화</button>
                        <button className="h-[34px] px-3 rounded-[5px] bg-[#252525] text-[#D0D0D0] text-[14px] font-semibold tracking-[-0.02em]">적용완료</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LabeledSelect({ label, options, placeholder }: { label: string; options: Option[]; placeholder: string }) {
    return (
        <div>
            <label className="block text-[14px] text-[#808080] mb-2">{label}</label>
            <div className="relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] rounded-[5px] h-[34px]">
                <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
                    <select className="w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] appearance-none pr-6">
                        <option value="">{placeholder}</option>
                        {options.map((o) => (
                            <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                        ))}
                    </select>
                </div>
                {/* Custom dropdown arrow */}
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 1.87809e-07 0.647327 2.2346e-07L7.35267 8.0966e-07C7.76048 8.45312e-07 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z" fill="#000000" />
                </svg>
            </div>
        </div>
    );
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-2 px-3 h-[22px] rounded-full bg-[#D6FAE8]">
            <span className="text-[12px] leading-[14px] font-medium text-[#00B55B] opacity-80">{label}</span>
            <button aria-label="remove" onClick={onRemove} className="w-3 h-3 text-[#00B55B]">
                <span className="block w-3 h-3" style={{ borderRight: "1.5px solid currentColor", borderTop: "1.5px solid currentColor", transform: "rotate(45deg)" }} />
            </button>
        </div>
    );
}

function CategorySelector() {
    const [options, setOptions] = useState<CustomerNoteCategory[]>([]);
    const [selected, setSelected] = useState<CustomerNoteCategory[]>([]);

    useEffect(() => {
        CustomerNoteCategoriesService.list().then((res) => setOptions(res.data));
    }, []);

    return (
        <div>
            <label className="block text-[14px] text-[#808080] mb-2">상담 카테고리</label>
            {/* Selected pills */}
            <div className="flex items-center gap-2 mb-2">
                {selected.map((c) => (
                    <Pill key={c.id} label={c.name} onRemove={() => setSelected((prev) => prev.filter((x) => x.id !== c.id))} />
                ))}
            </div>
            {/* Dropdown style box listing categories */}
            <div className="border border-[#E2E2E2] rounded-[5px]">
                <div className="max-h-[200px] overflow-auto">
                    {options.map((c) => {
                        const checked = !!selected.find((s) => s.id === c.id);
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelected((prev) => (checked ? prev.filter((x) => x.id !== c.id) : [...prev, c]))}
                                className="w-full h-12 px-6 flex items-center gap-3 text-left hover:bg-[#F7F7F7]"
                            >
                                <span className={`w-6 h-6 rounded-[5px] grid place-items-center ${checked ? "bg-[#00E272]" : "border border-[#B0B0B0] bg-white"}`}>
                                    {checked && <span className="block w-3 h-3" style={{ borderRight: "2px solid white", borderTop: "2px solid white", transform: "rotate(45deg)" }} />}
                                </span>
                                <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-[#000]">{c.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function DateRange() {
    const [start, setStart] = useState<Date | null>(null);
    const [end, setEnd] = useState<Date | null>(null);
    return (
        <div className="flex items-center gap-3">
            <div className="border border-[#E2E2E2] rounded-[5px] h-[34px] w-[175px] px-2 flex items-center">
                <DatePicker
                    selected={start}
                    onChange={(d) => setStart(d)}
                    placeholderText="연도 . 월 . 일"
                    dateFormat="yyyy. MM. dd"
                    className="w-full outline-none text-[14px] leading-[17px] tracking-[-0.02em]"
                />
            </div>
            <span className="text-[14px]">-</span>
            <div className="border border-[#E2E2E2] rounded-[5px] h-[34px] w-[175px] px-2 flex items-center">
                <DatePicker
                    selected={end}
                    onChange={(d) => setEnd(d)}
                    placeholderText="연도 . 월 . 일"
                    dateFormat="yyyy. MM. dd"
                    className="w-full outline-none text-[14px] leading-[17px] tracking-[-0.02em]"
                />
            </div>
        </div>
    );
}


