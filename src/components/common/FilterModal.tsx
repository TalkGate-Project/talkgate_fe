"use client";

import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import DatePicker from "@/components/common/DatePicker";
import { CustomerNoteCategoriesService, CustomerNoteCategory } from "@/services/customerNoteCategories";
import Checkbox from "@/components/common/Checkbox";

function getBodyZoom(): number {
    if (typeof document === "undefined") return 1;
    const raw = String(((document.body.style as any).zoom ?? "") as string).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export type FilterValues = {
    teamId?: number;
    memberId?: number;
    applicationRoute?: string;
    mediaCompany?: string;
    site?: string;
    categoryIds?: (number | null)[];
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
    onApply: (values: FilterValues, meta: { categories: CustomerNoteCategory[] }) => void;
    defaults?: FilterValues;
    teamOptions?: Option[];
    memberOptions?: Option[];
    routeOptions?: Option[];
    mediaOptions?: Option[];
    siteOptions?: Option[];
    categoryOptions?: Option[];
};

export default function FilterModal({ open, onClose, onApply, defaults, teamOptions = [], memberOptions = [], routeOptions = [], mediaOptions = [], siteOptions = [], categoryOptions = [] }: FilterModalProps) {
    const [form, setForm] = useState<FilterValues>(defaults || {});
    useEffect(() => { if (open) setForm(defaults || {}); }, [open, defaults]);
    const handleCategoryIds = useCallback((ids: (number | null)[]) => {
        setForm((f) => ({ ...f, categoryIds: ids }));
    }, []);
    
    // Helper functions to convert between Date and string (YYYY-MM-DD)
    const stringToDate = (str?: string): Date | null => {
        if (!str) return null;
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    };
    const dateToString = (date: Date | null): string | undefined => {
        if (!date) return undefined;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    
    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (!open) return;
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    /**
     * TODO:
     * 필터 추가 모달은 어드민 버전은 따로 존재해야함.
     * 따로 할지 이 파일에서 상태관리로 할지 고민 후 결정 예정
     */

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={onClose} />

            {/* Modal container (centered) */}
            <div className="absolute left-1/2 top-1/2" style={{ width: 848, transform: "translate(-50%, -50%)" }}>
                <div className="relative w-full h-full bg-white dark:bg-neutral-10 rounded-[14px]">
                    {/* Header */}
                    <div className="px-7 pt-7 pb-3 flex items-center justify-between">
                        <h2 className="text-[18px] leading-[21px] font-semibold text-black dark:text-neutral-80">필터추가</h2>
                        <button aria-label="close" onClick={onClose} className="cursor-pointer w-6 h-6 grid place-items-center text-[#111827] dark:text-neutral-70">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-7 pt-[18px] space-y-3 overflow-auto pb-7">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                            <LabeledSelect label="담당팀" options={teamOptions} placeholder="전체" value={form.teamId ? String(form.teamId) : ""} onChange={(v) => setForm((f) => ({ ...f, teamId: v ? Number(v) : undefined }))} />
                            <LabeledSelect label="담당자" options={memberOptions} placeholder="전체" value={form.memberId ? String(form.memberId) : ""} onChange={(v) => setForm((f) => ({ ...f, memberId: v ? Number(v) : undefined }))} />

                            <LabeledSelect label="신청경로" options={routeOptions} placeholder="전체" value={form.applicationRoute || ""} onChange={(v) => setForm((f) => ({ ...f, applicationRoute: v || undefined }))} freeText />
                            <LabeledSelect label="매체사" options={mediaOptions} placeholder="전체" value={form.mediaCompany || ""} onChange={(v) => setForm((f) => ({ ...f, mediaCompany: v || undefined }))} freeText />

                            <CategorySelector defaultIds={form.categoryIds} onChangeIds={handleCategoryIds} />
                            <LabeledSelect label="사이트" options={siteOptions} placeholder="전체" value={form.site || ""} onChange={(v) => setForm((f) => ({ ...f, site: v || undefined }))} freeText />

                            {/* 상담 내용 */}
                            <div className="col-span-2">
                                <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">상담 내용</label>
                                <div className="border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] px-3 py-2 h-[34px] flex items-start bg-white dark:bg-neutral-20">
                                    <textarea value={form.noteContent || ""} onChange={(e) => setForm((f) => ({ ...f, noteContent: e.target.value || undefined }))} className="w-full h-[66px] resize-none outline-none text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] dark:placeholder:text-neutral-60 text-[#000] dark:text-neutral-80 bg-transparent" placeholder="상담 내용을 작성해주세요" />
                                </div>
                            </div>

                            {/* 신청시간 / 배정시간 */}
                            <div>
                                <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">신청시간</label>
                                <div className="flex items-center gap-3">
                                    <DateRange 
                                        startValue={stringToDate(form.applicationDateFrom)}
                                        endValue={stringToDate(form.applicationDateTo)}
                                        onStartChange={(date) => setForm((f) => ({ ...f, applicationDateFrom: dateToString(date) }))}
                                        onEndChange={(date) => setForm((f) => ({ ...f, applicationDateTo: dateToString(date) }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">배정시간</label>
                                <div className="flex items-center gap-3">
                                    <DateRange 
                                        startValue={stringToDate(form.assignedAtFrom)}
                                        endValue={stringToDate(form.assignedAtTo)}
                                        onStartChange={(date) => setForm((f) => ({ ...f, assignedAtFrom: dateToString(date) }))}
                                        onEndChange={(date) => setForm((f) => ({ ...f, assignedAtTo: dateToString(date) }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[#E2E2E2] dark:border-[#444444]" />
                    <div className="px-7 py-3 flex items-center justify-end gap-3">
                        <button className="cursor-pointer w-[60px] h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-neutral-80 bg-white dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30" onClick={() => setForm({})}>초기화</button>
                        <button className="cursor-pointer w-[72px] h-[34px] rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[#D0D0D0] dark:text-neutral-10 text-[14px] font-semibold tracking-[-0.02em] hover:bg-[#353535] dark:hover:bg-neutral-70" onClick={() => onApply(form, { categories: [] })}>적용완료</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LabeledSelect({ label, options, placeholder, value, onChange, freeText }: { label: string; options: Option[]; placeholder: string; value?: string; onChange?: (v: string) => void; freeText?: boolean }) {
    return (
        <div>
            <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">{label}</label>
            <div className="relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] h-[34px] bg-white dark:bg-neutral-20">
                <div className="flex flex-row items-center p-0 gap-[30px] w-[360px] h-[17px]">
                    {freeText ? (
                        <input value={value ?? ""} onChange={(e) => onChange && onChange(e.target.value)} className="w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60" placeholder={placeholder} />
                    ) : (
                        <select value={value ?? ""} onChange={(e) => onChange && onChange(e.target.value)} className="w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 appearance-none pr-6 cursor-pointer">
                            <option value="" className="bg-white dark:bg-neutral-20 text-[#000] dark:text-neutral-80">{placeholder}</option>
                            {options.map((o) => (
                                <option key={String(o.value)} value={String(o.value)} className="bg-white dark:bg-neutral-20 text-[#000] dark:text-neutral-80">{o.label}</option>
                            ))}
                        </select>
                    )}
                </div>
                {/* Custom dropdown arrow - freeText(일반 입력 필드)일 때는 숨김 */}
                {!freeText && (
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 1.87809e-07 0.647327 2.2346e-07L7.35267 8.0966e-07C7.76048 8.45312e-07 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z" fill="currentColor" className="text-[#000] dark:text-neutral-70" />
                    </svg>
                )}
            </div>
        </div>
    );
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-2 px-2.5 h-[22px] rounded-full bg-[#D6FAE8] shrink-0 whitespace-nowrap">
            <span className="text-[12px] leading-[14px] font-medium text-[#00B55B] opacity-80">{label}</span>
            <button aria-label="remove" onClick={onRemove} className="w-3 h-3 grid place-items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L9 3M3 3L9 9" stroke="#00B55B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}

function arraysEqual(a: (number | null)[], b: (number | null)[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

function CategorySelector({ defaultIds, onChangeIds }: { defaultIds?: (number | null)[]; onChangeIds?: (ids: (number | null)[]) => void }) {
    const [options, setOptions] = useState<CustomerNoteCategory[]>([]);
    const [selected, setSelected] = useState<(number | null)[]>(defaultIds || []);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        CustomerNoteCategoriesService.list().then((res) => {
            const arr = (res.data as any)?.data ?? (res.data as any);
            setOptions(Array.isArray(arr) ? arr : []);
        });
    }, []);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!open) return;
            const t = e.target as Node;
            const inWrap = wrapRef.current?.contains(t);
            const inPanel = panelRef.current?.contains(t);
            if (!inWrap && !inPanel) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    // Sync from parent defaults if actually changed to avoid loops
    const lastDefaultsRef = useRef<string>("[]");
    useEffect(() => {
        const ids = (defaultIds || []).slice();
        const norm = JSON.stringify(ids);
        if (lastDefaultsRef.current !== norm) {
            lastDefaultsRef.current = norm;
            setSelected((prev) => (arraysEqual(prev, ids) ? prev : ids));
        }
    }, [defaultIds]);
    // Notify parent after selection changes (post-render) to avoid parent update during child render
    const lastNotifiedRef = useRef<string>(JSON.stringify(selected));
    useEffect(() => {
        const norm = JSON.stringify(selected);
        if (lastNotifiedRef.current !== norm) {
            lastNotifiedRef.current = norm;
            onChangeIds && onChangeIds(selected);
        }
    }, [selected, onChangeIds]);
    const selectedCount = selected.filter(id => id !== null).length;
    const hasGeneral = selected.includes(null);
    const summaryLabel = selectedCount > 0 || hasGeneral 
        ? `${selectedCount + (hasGeneral ? 1 : 0)}개 선택됨` 
        : "전체";

    return (
        <div ref={wrapRef} className="relative">
            <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">상담 카테고리</label>
            {/* Combobox trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => {
                    setOpen((v) => {
                        const next = !v;
                        if (next && triggerRef.current) {
                            const r = triggerRef.current.getBoundingClientRect();
                            const zoom = getBodyZoom();
                            // Zoom을 고려하여 위치 계산
                            setPanelPos({ 
                                top: (r.bottom + 8) / zoom + window.scrollY, 
                                left: r.left / zoom + window.scrollX, 
                                width: r.width / zoom 
                            });
                        }
                        return next;
                    });
                }}
                className="w-full border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] h-[34px] px-3 relative text-left flex items-center justify-between bg-white dark:bg-neutral-20"
            >
                <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 opacity-80">{summaryLabel}</span>
                <svg className="pointer-events-none" width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 0 0.647327 0L7.35267 0C7.76048 0 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z" fill="currentColor" className="text-[#000] dark:text-neutral-70" />
                </svg>
            </button>

            {/* Selected pills - ensure dropdown overlays them when open */}
            {selected.length > 0 && (
                <div className="w-[384px] mt-2 overflow-x-auto no-scrollbar">
                    <div className={`flex items-center gap-2 w-max ${open ? "relative z-20" : ""}`}>
                        {selected.map((id, index) => {
                            if (id === null) {
                                return <Pill key="general" label="일반" onRemove={() => {
                                    setSelected((prev) => prev.filter((x) => x !== null));
                                }} />;
                            }
                            const c = options.find((o) => o.id === id);
                            if (!c) return null;
                            return <Pill key={id} label={c.name} onRemove={() => {
                                setSelected((prev) => prev.filter((x) => x !== id));
                            }} />;
                        })}
                    </div>
                </div>
            )}

            {/* Dropdown panel */}
            {open && panelPos && createPortal(
                <div
                    ref={panelRef}
                    className="z-[1000] border border-[#E2E2E2] dark:border-[#444444] rounded-[8px] bg-white dark:bg-neutral-20 shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)] max-h-[240px] overflow-auto"
                    style={{ position: "fixed", top: panelPos.top, left: panelPos.left, width: panelPos.width }}
                >
                    {/* 일반 옵션 */}
                    <label
                        className={`w-full h-[48px] px-6 flex items-center gap-3 text-left rounded-[5px] cursor-pointer ${
                            selected.includes(null)
                                ? "bg-primary-10/30 dark:bg-primary-40/20"
                                : "bg-card dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30"
                        }`}
                    >
                        <Checkbox 
                            checked={selected.includes(null)} 
                            onChange={(next) => {
                                setSelected((prev) => {
                                    if (next) {
                                        return prev.includes(null) ? prev : [...prev, null];
                                    } else {
                                        return prev.filter((x) => x !== null);
                                    }
                                });
                            }} 
                            ariaLabel="일반" 
                        />
                        <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80">일반</span>
                    </label>
                    {(options || []).map((c) => {
                        const checked = selected.includes(c.id);
                        return (
                            <label
                                key={c.id}
                                className={`w-full h-[48px] px-6 flex items-center gap-3 text-left rounded-[5px] cursor-pointer ${
                                    checked
                                        ? "bg-primary-10/30 dark:bg-primary-40/20"
                                        : "bg-card dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30"
                                }`}
                            >
                                <Checkbox checked={checked} onChange={(next) => {
                                    setSelected((prev) => (next ? [...prev, c.id] : prev.filter((x) => x !== c.id)));
                                }} ariaLabel={c.name} />
                                <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80">{c.name}</span>
                            </label>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
}

function DateRange({ 
    startValue, 
    endValue, 
    onStartChange, 
    onEndChange 
}: { 
    startValue: Date | null; 
    endValue: Date | null; 
    onStartChange: (date: Date | null) => void; 
    onEndChange: (date: Date | null) => void; 
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative w-[175px]">
                <DatePicker value={startValue} onChange={onStartChange} className="cursor-pointer pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60"/>
                    </svg>
                </div>
            </div>
            <span className="text-[14px] text-[#000] dark:text-neutral-80">-</span>
            <div className="relative w-[175px]">
                <DatePicker value={endValue} onChange={onEndChange} className="cursor-pointer pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60"/>
                    </svg>
                </div>
            </div>
        </div>
    );
}


