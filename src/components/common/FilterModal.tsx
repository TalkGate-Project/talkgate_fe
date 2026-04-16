"use client";

import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import DatePicker from "@/components/common/DatePicker";
import type { CustomerNoteCategory } from "@/types/customerNoteCategories";
import { useCustomerNoteCategories } from "@/hooks/useCustomerNoteCategories";
import { ProjectPartnersService } from "@/services/projectPartners";
import { ApiKeysService } from "@/services/apiKeys";
import { CustomersService } from "@/services/customers";
import Checkbox from "@/components/common/Checkbox";
import { sanitizeContactFilterInput } from "@/utils/format";
import { getBadgeStyle } from "@/utils/categoryBadge";
import { NO_CATEGORY_LABEL } from "@/utils/customerCategory";

function getBodyZoom(): number {
    if (typeof document === "undefined") return 1;
    const raw = String(((document.body.style as any).zoom ?? "") as string).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export type FilterValues = {
    name?: string;
    contact1?: string;
    apiKeyId?: number;
    teamId?: number;
    memberId?: number;
    applicationRoute?: string;
    mediaCompany?: string;
    site?: string;
    categoryIds?: (number | null)[];
    assignType?: "all" | "assigned" | "unassigned";
    projectPartnerId?: number;
    noteContent?: string;
    applicationDateFrom?: string;
    applicationDateTo?: string;
    assignedAtFrom?: string;
    assignedAtTo?: string;
    /** 키워드 */
    keyword?: string;
    /** IP 주소 */
    ipAddress?: string;
    /** 특이사항 */
    notablePoints?: string;
    /** 요약정보 */
    summaryInfo?: string;
};

type Option = { label: string; value: string | number };

type FilterModalProps = {
    open: boolean;
    onClose: () => void;
    onApply: (values: FilterValues, meta: { categories: CustomerNoteCategory[] }) => void;
    /** 초기화 클릭 시 호출. 전달 시 빈 필터 적용만 하고 모달은 닫지 않음. 미전달 시 onApply({}) 호출로 적용 후 부모가 모달 닫음. */
    onReset?: () => void;
    defaults?: FilterValues;
    projectId?: string | null;
    isAdminOrSubAdmin?: boolean;
    isDataProvider?: boolean;
    teamOptions?: Option[];
    memberOptions?: Option[];
    routeOptions?: Option[];
    mediaOptions?: Option[];
    siteOptions?: Option[];
    categoryOptions?: Option[];
};

type ProjectPartnerOption = {
    id: number;
    name: string;
    logoUrl?: string | null;
};
type ApiKeyOption = {
    id: number;
    name: string;
};

type CustomerFilterOptionKey = "applicationRoutes" | "mediaCompanies" | "sites";

const INITIAL_CUSTOMER_FILTER_LOADING_STATE: Record<CustomerFilterOptionKey, boolean> = {
    applicationRoutes: false,
    mediaCompanies: false,
    sites: false,
};

export default function FilterModal({
    open,
    onClose,
    onApply,
    onReset,
    defaults,
    projectId,
    isAdminOrSubAdmin = false,
    isDataProvider = false,
    teamOptions = [],
    memberOptions = [],
    routeOptions = [],
    mediaOptions = [],
    siteOptions = [],
    categoryOptions: _categoryOptions = [],
}: FilterModalProps) {
    const [form, setForm] = useState<FilterValues>(defaults ?? {});
    const [isMobile, setIsMobile] = useState(false);
    const [partnerOpen, setPartnerOpen] = useState(false);
    const [partnerSearch, setPartnerSearch] = useState("");
    const [partnerOptions, setPartnerOptions] = useState<ProjectPartnerOption[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const [apiKeyOpen, setApiKeyOpen] = useState(false);
    const [apiKeyOptions, setApiKeyOptions] = useState<ApiKeyOption[]>([]);
    const [loadingApiKeys, setLoadingApiKeys] = useState(false);
    const [applicationRouteOptions, setApplicationRouteOptions] = useState<Option[]>([]);
    const [mediaCompanyOptions, setMediaCompanyOptions] = useState<Option[]>([]);
    const [siteFilterOptions, setSiteFilterOptions] = useState<Option[]>([]);
    const [loadingCustomerFilterOptions, setLoadingCustomerFilterOptions] = useState<Record<CustomerFilterOptionKey, boolean>>(INITIAL_CUSTOMER_FILTER_LOADING_STATE);
    const [loadedCustomerFilterOptions, setLoadedCustomerFilterOptions] = useState<Record<CustomerFilterOptionKey, boolean>>(INITIAL_CUSTOMER_FILTER_LOADING_STATE);
    const partnerWrapRef = useRef<HTMLDivElement | null>(null);
    const apiKeyWrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const base = defaults ?? {};
        const withContact =
            base.contact1 != null && base.contact1 !== ""
                ? {
                    ...base,
                    contact1:
                        sanitizeContactFilterInput(base.contact1) || undefined,
                }
                : base;
        setForm(withContact);
    }, [open, defaults]);

    const shouldShowPartnerFilter = isDataProvider && isAdminOrSubAdmin;
    /** 일반 프로젝트일 때만 어드민/서브어드민에게 고객 배정 여부 노출 (파트너 프로젝트는 노출하지 않음) */
    const shouldShowAssignFilter = !isDataProvider && isAdminOrSubAdmin;
    const shouldShowApiKeyFilter = isAdminOrSubAdmin;

    const selectedPartner = useMemo(
        () => partnerOptions.find((partner) => partner.id === form.projectPartnerId),
        [partnerOptions, form.projectPartnerId]
    );
    const selectedApiKey = useMemo(
        () => apiKeyOptions.find((apiKey) => apiKey.id === form.apiKeyId),
        [apiKeyOptions, form.apiKeyId]
    );
    const filteredPartners = useMemo(() => {
        const term = partnerSearch.trim().toLowerCase();
        if (!term) return partnerOptions;
        return partnerOptions.filter((partner) => partner.name.toLowerCase().includes(term));
    }, [partnerOptions, partnerSearch]);
    const mergedRouteOptions = useMemo(
        () => mergeOptions(routeOptions, applicationRouteOptions),
        [routeOptions, applicationRouteOptions]
    );
    const mergedMediaOptions = useMemo(
        () => mergeOptions(mediaOptions, mediaCompanyOptions),
        [mediaOptions, mediaCompanyOptions]
    );
    const mergedSiteOptions = useMemo(
        () => mergeOptions(siteOptions, siteFilterOptions),
        [siteOptions, siteFilterOptions]
    );

    useEffect(() => {
        if (!open || !shouldShowPartnerFilter || !projectId) return;
        let cancelled = false;

        const run = async () => {
            setLoadingPartners(true);
            try {
                const response = await ProjectPartnersService.list(
                    { page: 1, limit: 100 },
                    { "x-project-id": projectId }
                );
                if (cancelled) return;
                const list = response.data?.data?.list ?? [];
                const approvedOnly = list.filter((partner) =>
                    "status" in partner ? (partner as any).status === "approved" : true
                );
                const normalized = approvedOnly.map((partner: any) => ({
                    id: partner.id,
                    name: partner.partnerProjectName ?? `파트너 ${partner.id}`,
                    logoUrl:
                        partner.partnerProjectLogoUrl ??
                        partner.projectLogoUrl ??
                        partner.logoUrl ??
                        null,
                }));
                setPartnerOptions(normalized);
            } catch {
                if (!cancelled) setPartnerOptions([]);
            } finally {
                if (!cancelled) setLoadingPartners(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [open, shouldShowPartnerFilter, projectId]);

    useEffect(() => {
        if (!open || !shouldShowApiKeyFilter || !projectId) return;
        let cancelled = false;

        const run = async () => {
            setLoadingApiKeys(true);
            try {
                const response = await ApiKeysService.list(
                    { page: 1, limit: 100 },
                    { "x-project-id": projectId }
                );
                if (cancelled) return;
                const apiKeys = response.data?.data?.apiKeys ?? [];
                setApiKeyOptions(
                    apiKeys.map((apiKey) => ({
                        id: apiKey.id,
                        name: apiKey.name,
                    }))
                );
            } catch {
                if (!cancelled) setApiKeyOptions([]);
            } finally {
                if (!cancelled) setLoadingApiKeys(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [open, shouldShowApiKeyFilter, projectId]);

    useEffect(() => {
        setApplicationRouteOptions([]);
        setMediaCompanyOptions([]);
        setSiteFilterOptions([]);
        setLoadingCustomerFilterOptions(INITIAL_CUSTOMER_FILTER_LOADING_STATE);
        setLoadedCustomerFilterOptions(INITIAL_CUSTOMER_FILTER_LOADING_STATE);
    }, [projectId]);

    const fetchCustomerFilterOptions = useCallback(async (key: CustomerFilterOptionKey) => {
        if (!projectId || loadingCustomerFilterOptions[key] || loadedCustomerFilterOptions[key]) {
            return;
        }

        setLoadingCustomerFilterOptions((prev) => ({ ...prev, [key]: true }));

        try {
            const response =
                key === "applicationRoutes"
                    ? await CustomersService.listApplicationRoutes(projectId)
                    : key === "mediaCompanies"
                        ? await CustomersService.listMediaCompanies(projectId)
                        : await CustomersService.listSites(projectId);
            const normalizedOptions = normalizeCustomerFilterOptions(response.data?.data, key);

            if (key === "applicationRoutes") {
                setApplicationRouteOptions(normalizedOptions);
            } else if (key === "mediaCompanies") {
                setMediaCompanyOptions(normalizedOptions);
            } else {
                setSiteFilterOptions(normalizedOptions);
            }

            setLoadedCustomerFilterOptions((prev) => ({ ...prev, [key]: true }));
        } catch {
            if (key === "applicationRoutes") {
                setApplicationRouteOptions([]);
            } else if (key === "mediaCompanies") {
                setMediaCompanyOptions([]);
            } else {
                setSiteFilterOptions([]);
            }
        } finally {
            setLoadingCustomerFilterOptions((prev) => ({ ...prev, [key]: false }));
        }
    }, [loadedCustomerFilterOptions, loadingCustomerFilterOptions, projectId]);

    useEffect(() => {
        if (!open || (!partnerOpen && !apiKeyOpen)) return;
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (partnerOpen && partnerWrapRef.current && !partnerWrapRef.current.contains(target)) {
                setPartnerOpen(false);
            }
            if (apiKeyOpen && apiKeyWrapRef.current && !apiKeyWrapRef.current.contains(target)) {
                setApiKeyOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open, partnerOpen, apiKeyOpen]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 780);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
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
            <div className="absolute inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:w-[calc(100%-2rem)] md:max-w-[960px] md:h-auto md:max-h-[90vh] lg:w-[848px] lg:max-w-[848px]" style={{ transform: !isMobile ? 'translate(-50%, -50%)' : 'none' }}>
                <div className="relative w-full h-full md:h-auto md:max-h-[90vh] bg-white dark:bg-neutral-10 md:rounded-[14px] md:shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] md:drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:md:shadow-none dark:md:drop-shadow-none flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-4 md:px-7 pt-4 md:pt-7 pb-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="md:hidden cursor-pointer p-1 -ml-1">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-neutral-80" />
                                </svg>
                            </button>
                            <h2 className="text-[18px] leading-[21px] font-semibold text-black dark:text-neutral-80">필터추가</h2>
                        </div>
                        <button aria-label="close" onClick={onClose} className="hidden md:block cursor-pointer w-6 h-6 grid place-items-center text-[#111827] dark:text-neutral-70">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto px-4 md:px-7 pt-[18px] space-y-3 pb-7">
                        {(shouldShowPartnerFilter || shouldShowAssignFilter || shouldShowApiKeyFilter) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-5">
                                {shouldShowPartnerFilter && (
                                    <div ref={partnerWrapRef} className="relative">
                                        <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">
                                            파트너 업체
                                            <span className="ml-1 text-[14px] text-[#B0B0B0] dark:text-neutral-60">
                                                (선택한 업체에 배정된 고객을 제외 합니다.)
                                            </span>
                                        </label>
                                        <div
                                            className="w-full h-[34px] px-3 border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-neutral-20 flex items-center gap-2"
                                            onClick={() => {
                                                if (!selectedPartner) setPartnerSearch("");
                                                setPartnerOpen(true);
                                            }}
                                        >
                                            <input
                                                value={partnerOpen ? partnerSearch : (selectedPartner?.name ?? "")}
                                                onFocus={() => setPartnerOpen(true)}
                                                onChange={(e) => {
                                                    if (selectedPartner) {
                                                        setForm((f) => ({ ...f, projectPartnerId: undefined }));
                                                    }
                                                    setPartnerSearch(e.target.value);
                                                    setPartnerOpen(true);
                                                }}
                                                placeholder="전체"
                                                autoComplete="off"
                                                className="flex-1 min-w-0 h-[17px] bg-transparent outline-none text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60"
                                            />
                                            {selectedPartner && (
                                                <button
                                                    type="button"
                                                    aria-label="선택 파트너 해제"
                                                    className="cursor-pointer w-5 h-5 grid place-items-center shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setForm((f) => ({ ...f, projectPartnerId: undefined }));
                                                        setPartnerSearch("");
                                                        setPartnerOpen(false);
                                                    }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 14L14 6M6 6L14 14" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            )}
                                            <span className="w-5 h-5 grid place-items-center shrink-0 pointer-events-none">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                        </div>
                                        {partnerOpen && (
                                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 bg-white dark:bg-neutral-20 border border-[#E2E2E2] dark:border-[#444444] rounded-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                                                <div className="max-h-[220px] overflow-auto">
                                                    {loadingPartners ? (
                                                        <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                                                            불러오는 중...
                                                        </div>
                                                    ) : (
                                                        filteredPartners.map((partner) => (
                                                            <button
                                                                key={partner.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm((f) => ({ ...f, projectPartnerId: partner.id }));
                                                                    setPartnerSearch(partner.name);
                                                                    setPartnerOpen(false);
                                                                }}
                                                                className="cursor-pointer w-full h-[48px] px-4 flex items-center gap-2 text-left hover:bg-neutral-10 dark:hover:bg-neutral-30"
                                                            >
                                                                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-20 dark:bg-neutral-30 flex items-center justify-center shrink-0">
                                                                    {partner.logoUrl ? (
                                                                        <img src={partner.logoUrl} alt={partner.name} className="w-5 h-5 object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-semibold text-neutral-60 dark:text-neutral-50">
                                                                            {partner.name.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[14px] leading-[20px] text-[#000] dark:text-neutral-80 truncate">
                                                                    {partner.name}
                                                                </span>
                                                            </button>
                                                        ))
                                                    )}
                                                    {!loadingPartners && filteredPartners.length === 0 && (
                                                        <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                                                            업체가 없습니다.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {shouldShowAssignFilter && (
                                    <div>
                                        <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">고객 배정 여부</label>
                                        <div className="h-[34px] flex items-center gap-6">
                                            {([
                                                { id: "all", label: "전체" },
                                                { id: "assigned", label: "배정됨" },
                                                { id: "unassigned", label: "배정대기" },
                                            ] as const).map((item) => (
                                                <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="assignType"
                                                        checked={(form.assignType ?? "all") === item.id}
                                                        onChange={() => setForm((f) => ({ ...f, assignType: item.id }))}
                                                        className="sr-only"
                                                    />
                                                    <span
                                                        className={`w-5 h-5 rounded-full border grid place-items-center ${(form.assignType ?? "all") === item.id
                                                                ? "border-primary-60"
                                                                : "border-[#B0B0B0] dark:border-neutral-60"
                                                            }`}
                                                    >
                                                        {(form.assignType ?? "all") === item.id && (
                                                            <span className="w-2.5 h-2.5 rounded-full bg-primary-60" />
                                                        )}
                                                    </span>
                                                    <span className="text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80">
                                                        {item.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {shouldShowApiKeyFilter && (
                                    <div ref={apiKeyWrapRef} className="relative">
                                        <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">API 키</label>
                                        <button
                                            type="button"
                                            className="cursor-pointer w-full h-[34px] px-3 border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] bg-white dark:bg-neutral-20 flex items-center justify-between text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80"
                                            onClick={() => setApiKeyOpen((prev) => !prev)}
                                        >
                                            <span className="truncate">{selectedApiKey?.name ?? "전체"}</span>
                                            <svg className="shrink-0" width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 1.87809e-07 0.647327 2.2346e-07L7.35267 8.0966e-07C7.76048 8.45312e-07 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z" fill="currentColor" className="text-[#000] dark:text-neutral-70" />
                                            </svg>
                                        </button>
                                        {apiKeyOpen && (
                                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 bg-white dark:bg-neutral-20 border border-[#E2E2E2] dark:border-[#444444] rounded-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                                                <div className="max-h-[220px] overflow-auto">
                                                    {loadingApiKeys ? (
                                                        <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                                                            전체
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm((f) => ({ ...f, apiKeyId: undefined }));
                                                                    setApiKeyOpen(false);
                                                                }}
                                                                className="cursor-pointer w-full h-[48px] px-4 flex items-center text-left hover:bg-neutral-10 dark:hover:bg-neutral-30 text-[14px] text-[#000] dark:text-neutral-80"
                                                            >
                                                                전체
                                                            </button>
                                                            {apiKeyOptions.map((apiKey) => (
                                                                <button
                                                                    key={apiKey.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setForm((f) => ({ ...f, apiKeyId: apiKey.id }));
                                                                        setApiKeyOpen(false);
                                                                    }}
                                                                    className="cursor-pointer w-full h-[48px] px-4 flex items-center text-left hover:bg-neutral-10 dark:hover:bg-neutral-30 text-[14px] text-[#000] dark:text-neutral-80"
                                                                >
                                                                    {apiKey.name}
                                                                </button>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            {/* 이름 / 연락처 */}
                            <LabeledSelect
                                label="이름"
                                options={[]}
                                placeholder="이름을 입력해주세요"
                                value={form.name || ""}
                                onChange={(v) => setForm((f) => ({ ...f, name: v || undefined }))}
                                freeText
                            />
                            <LabeledSelect
                                label="연락처"
                                options={[]}
                                placeholder="연락처를 입력해주세요"
                                value={form.contact1 || ""}
                                onChange={(v) => setForm((f) => ({ ...f, contact1: v || undefined }))}
                                freeText
                                sanitizeInput={sanitizeContactFilterInput}
                                inputMode="numeric"
                                autoComplete="tel"
                            />

                            {/* 담당팀 / 담당자 */}
                            <LabeledSelect label="담당팀" options={teamOptions} placeholder="전체" value={form.teamId ? String(form.teamId) : ""} onChange={(v) => setForm((f) => ({ ...f, teamId: v ? Number(v) : undefined }))} />
                            <LabeledSelect label="담당자" options={memberOptions} placeholder="전체" value={form.memberId ? String(form.memberId) : ""} onChange={(v) => setForm((f) => ({ ...f, memberId: v ? Number(v) : undefined }))} />

                            {/* 신청경로 / 매체사 */}
                            <SearchableLabeledCombobox
                                label="신청경로"
                                options={mergedRouteOptions}
                                placeholder="직접 입력 또는 선택"
                                value={form.applicationRoute || ""}
                                onChange={(v) => setForm((f) => ({ ...f, applicationRoute: v || undefined }))}
                                onOpenChange={(nextOpen) => {
                                    if (nextOpen) {
                                        void fetchCustomerFilterOptions("applicationRoutes");
                                    }
                                }}
                                loading={loadingCustomerFilterOptions.applicationRoutes}
                                emptyText="신청경로가 없습니다."
                            />
                            <SearchableLabeledCombobox
                                label="매체사"
                                options={mergedMediaOptions}
                                placeholder="직접 입력 또는 선택"
                                value={form.mediaCompany || ""}
                                onChange={(v) => setForm((f) => ({ ...f, mediaCompany: v || undefined }))}
                                onOpenChange={(nextOpen) => {
                                    if (nextOpen) {
                                        void fetchCustomerFilterOptions("mediaCompanies");
                                    }
                                }}
                                loading={loadingCustomerFilterOptions.mediaCompanies}
                                emptyText="매체사가 없습니다."
                            />

                            {/* 사이트 / 특이사항 */}
                            <SearchableLabeledCombobox
                                label="사이트"
                                options={mergedSiteOptions}
                                placeholder="직접 입력 또는 선택"
                                value={form.site || ""}
                                onChange={(v) => setForm((f) => ({ ...f, site: v || undefined }))}
                                onOpenChange={(nextOpen) => {
                                    if (nextOpen) {
                                        void fetchCustomerFilterOptions("sites");
                                    }
                                }}
                                loading={loadingCustomerFilterOptions.sites}
                                emptyText="사이트가 없습니다."
                            />
                            <LabeledSelect
                                label="특이사항"
                                options={[]}
                                placeholder="특이사항을 입력해주세요"
                                value={form.notablePoints || ""}
                                onChange={(v) => setForm((f) => ({ ...f, notablePoints: v || undefined }))}
                                freeText
                            />

                            {/* 키워드 / IP 주소 */}
                            <LabeledSelect
                                label="키워드"
                                options={[]}
                                placeholder="키워드를 입력해주세요"
                                value={form.keyword || ""}
                                onChange={(v) => setForm((f) => ({ ...f, keyword: v || undefined }))}
                                freeText
                            />
                            <LabeledSelect
                                label="IP 주소"
                                options={[]}
                                placeholder="IP 주소를 입력해주세요"
                                value={form.ipAddress || ""}
                                onChange={(v) => setForm((f) => ({ ...f, ipAddress: v || undefined }))}
                                freeText
                            />

                            {/* 카테고리 / 요약정보 */}
                            <CategorySelector
                                defaultIds={form.categoryIds}
                                onChangeIds={handleCategoryIds}
                            />
                            <LabeledSelect
                                label="요약정보"
                                options={[]}
                                placeholder="요약정보를 입력해주세요"
                                value={form.summaryInfo || ""}
                                onChange={(v) => setForm((f) => ({ ...f, summaryInfo: v || undefined }))}
                                freeText
                            />

                            {/* 상담 내용 (한 줄 전체) */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">상담 내용</label>
                                <div className="border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] px-3 py-2 min-h-[66px] flex items-start bg-white dark:bg-neutral-20">
                                    <textarea value={form.noteContent || ""} onChange={(e) => setForm((f) => ({ ...f, noteContent: e.target.value || undefined }))} className="w-full min-h-[66px] resize-none outline-none text-[14px] leading-[17px] tracking-[-0.02em] placeholder:text-[#808080] dark:placeholder:text-neutral-60 text-[#000] dark:text-neutral-80 bg-transparent" placeholder="상담 내용을 작성해주세요" />
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
                    <div className="border-t border-[#E2E2E2] dark:border-[#444444] shrink-0" />
                    <div className="px-4 md:px-7 py-3 flex items-center justify-end gap-3 shrink-0">
                        <button className="cursor-pointer w-[60px] md:w-[60px] h-[40px] md:h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-neutral-80 bg-white dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30" onClick={() => { const resetValues = {}; setForm(resetValues); if (onReset) onReset(); else onApply(resetValues, { categories: [] }); }}>초기화</button>
                        <button className="cursor-pointer w-[72px] md:w-[72px] h-[40px] md:h-[34px] rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[#D0D0D0] dark:text-neutral-10 text-[14px] font-semibold tracking-[-0.02em] hover:bg-[#353535] dark:hover:bg-neutral-70" onClick={() => onApply(form, { categories: [] })}>확인</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LabeledSelect({
    label,
    options,
    placeholder,
    value,
    onChange,
    freeText,
    sanitizeInput,
    inputMode,
    autoComplete,
}: {
    label: string;
    options: Option[];
    placeholder: string;
    value?: string;
    onChange?: (v: string) => void;
    freeText?: boolean;
    sanitizeInput?: (raw: string) => string;
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
    autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
}) {
    return (
        <div>
            <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">{label}</label>
            <div className="relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] h-[34px] bg-white dark:bg-neutral-20">
                <div className="flex flex-row items-center p-0 gap-[30px] w-full lg:w-[360px] h-[17px]">
                    {freeText ? (
                        <input
                            value={value ?? ""}
                            inputMode={inputMode}
                            autoComplete={autoComplete}
                            onChange={(e) => {
                                if (!onChange) return;
                                const raw = e.target.value;
                                onChange(sanitizeInput ? sanitizeInput(raw) : raw);
                            }}
                            className="w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60"
                            placeholder={placeholder}
                        />
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

function SearchableLabeledCombobox({
    label,
    options,
    placeholder,
    value,
    onChange,
    onOpenChange,
    loading = false,
    emptyText,
}: {
    label: string;
    options: Option[];
    placeholder: string;
    value?: string;
    onChange?: (v: string) => void;
    onOpenChange?: (open: boolean) => void;
    loading?: boolean;
    emptyText: string;
}) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    const updateOpen = useCallback((nextOpen: boolean) => {
        setOpen((prevOpen) => {
            if (prevOpen === nextOpen) {
                return prevOpen;
            }
            onOpenChange?.(nextOpen);
            return nextOpen;
        });
    }, [onOpenChange]);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (wrapRef.current && !wrapRef.current.contains(target)) {
                updateOpen(false);
            }
        };

        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open, updateOpen]);

    const filteredOptions = useMemo(() => {
        const term = value?.trim().toLowerCase() ?? "";
        if (!term) return options;
        return options.filter((option) => option.label.toLowerCase().includes(term));
    }, [options, value]);

    return (
        <div ref={wrapRef} className="relative">
            <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">{label}</label>
            <div
                className="relative flex flex-col justify-center items-center px-3 py-2 gap-[10px] border border-[#E2E2E2] dark:border-[#444444] rounded-[5px] h-[34px] bg-white dark:bg-neutral-20"
                onClick={() => updateOpen(true)}
            >
                <div className="flex flex-row items-center p-0 gap-[30px] w-full lg:w-[360px] h-[17px]">
                    <input
                        value={value ?? ""}
                        onFocus={() => updateOpen(true)}
                        onChange={(event) => {
                            onChange?.(event.target.value);
                            updateOpen(true);
                        }}
                        className="w-full h-[17px] outline-none bg-transparent text-[14px] leading-[17px] tracking-[-0.02em] text-[#000] dark:text-neutral-80 placeholder:text-[#808080] dark:placeholder:text-neutral-60"
                        placeholder={placeholder}
                    />
                </div>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.40544 5.4382C4.20587 5.71473 3.79413 5.71473 3.59456 5.4382L0.241885 0.792604C0.00323535 0.461921 0.239523 1.87809e-07 0.647327 2.2346e-07L7.35267 8.0966e-07C7.76048 8.45312e-07 7.99676 0.461922 7.75812 0.792604L4.40544 5.4382Z" fill="currentColor" className="text-[#000] dark:text-neutral-70" />
                </svg>
            </div>
            {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 bg-white dark:bg-neutral-20 border border-[#E2E2E2] dark:border-[#444444] rounded-[8px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                    <div className="max-h-[220px] overflow-auto">
                        {loading ? (
                            <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                                불러오는 중...
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={`${label}-${String(option.value)}`}
                                    type="button"
                                    onClick={() => {
                                        onChange?.(String(option.value));
                                        updateOpen(false);
                                    }}
                                    className="cursor-pointer w-full h-[48px] px-4 flex items-center text-left hover:bg-neutral-10 dark:hover:bg-neutral-30 text-[14px] text-[#000] dark:text-neutral-80"
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="h-[48px] px-4 flex items-center text-[14px] text-[#808080] dark:text-neutral-60">
                                {emptyText}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function normalizeCustomerFilterOptions(
    payload: unknown,
    key: CustomerFilterOptionKey
): Option[] {
    const values = Array.isArray(payload)
        ? payload
        : typeof payload === "object" && payload !== null
            ? [
                ...(Array.isArray((payload as { list?: unknown[] }).list) ? (payload as { list: unknown[] }).list : []),
                ...(Array.isArray((payload as { items?: unknown[] }).items) ? (payload as { items: unknown[] }).items : []),
                ...(Array.isArray((payload as Record<CustomerFilterOptionKey, unknown[]>)[key])
                    ? (payload as Record<CustomerFilterOptionKey, unknown[]>)[key]
                    : []),
            ]
            : [];

    return Array.from(
        new Set(
            values
                .filter((value): value is string => typeof value === "string")
                .map((value) => value.trim())
                .filter(Boolean)
        )
    ).map((value) => ({ label: value, value }));
}

function mergeOptions(primary: Option[], secondary: Option[]): Option[] {
    const merged = new Map<string, Option>();

    [...primary, ...secondary].forEach((option) => {
        const normalizedValue = String(option.value).trim();
        const normalizedLabel = option.label.trim();
        if (!normalizedValue || !normalizedLabel) return;
        const key = `${normalizedLabel}::${normalizedValue}`;
        if (!merged.has(key)) {
            merged.set(key, {
                label: normalizedLabel,
                value: normalizedValue,
            });
        }
    });

    return Array.from(merged.values());
}

function Pill({
    label,
    onRemove,
    style,
}: {
    label: string;
    onRemove: () => void;
    style?: CSSProperties;
}) {
    return (
        <div
            className="flex items-center gap-2 px-2.5 h-[22px] rounded-full shrink-0 whitespace-nowrap"
            style={style ?? { backgroundColor: "#D6FAE8", color: "#00B55B" }}
        >
            <span className="text-[12px] leading-[14px] font-medium opacity-80">{label}</span>
            <button aria-label="remove" onClick={onRemove} className="w-3 h-3 grid place-items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L9 3M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function CategorySelector({
    defaultIds,
    onChangeIds,
}: {
    defaultIds?: (number | null)[];
    onChangeIds?: (ids: (number | null)[]) => void;
}) {
    const { categories: options } = useCustomerNoteCategories();
    const [selected, setSelected] = useState<(number | null)[]>(defaultIds || []);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

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

    const getCategoryPreviewStyle = (id: number | null, name?: string, colorCode?: string | null) =>
        getBadgeStyle(name ?? NO_CATEGORY_LABEL, id ?? 0, colorCode);

    return (
        <div ref={wrapRef} className="relative">
            <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">카테고리</label>
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
                <div className="w-full lg:w-[384px] mt-2 overflow-x-auto no-scrollbar">
                    <div className={`flex items-center gap-2 w-max ${open ? "relative z-20" : ""}`}>
                        {selected.map((id) => {
                            if (id === null) {
                                return <Pill key="general" label={NO_CATEGORY_LABEL} style={getCategoryPreviewStyle(null)} onRemove={() => {
                                    setSelected((prev) => prev.filter((x) => x !== null));
                                }} />;
                            }
                            const c = options.find((o) => o.id === id);
                            if (!c) return null;
                            return <Pill key={id} label={c.name} style={getCategoryPreviewStyle(c.id, c.name, c.colorCode)} onRemove={() => {
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
                        className={`w-full h-[48px] px-6 flex items-center gap-3 text-left rounded-[5px] cursor-pointer ${selected.includes(null)
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
                            ariaLabel={NO_CATEGORY_LABEL}
                        />
                        <span
                            className="inline-flex items-center justify-center h-[22px] rounded-[30px] px-3 text-[12px] leading-[14px] font-medium opacity-80"
                            style={getCategoryPreviewStyle(null)}
                        >
                            {NO_CATEGORY_LABEL}
                        </span>
                    </label>
                    {(options || []).map((c) => {
                        const checked = selected.includes(c.id);
                        const optionStyle = getCategoryPreviewStyle(c.id, c.name, c.colorCode);
                        return (
                            <label
                                key={c.id}
                                className={`w-full h-[48px] px-6 flex items-center gap-3 text-left rounded-[5px] cursor-pointer ${checked
                                        ? "bg-primary-10/30 dark:bg-primary-40/20"
                                        : "bg-card dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30"
                                    }`}
                            >
                                <Checkbox checked={checked} onChange={(next) => {
                                    setSelected((prev) => (next ? [...prev, c.id] : prev.filter((x) => x !== c.id)));
                                }} ariaLabel={c.name} />
                                <span
                                    className="inline-flex items-center justify-center h-[22px] rounded-[30px] px-3 text-[12px] leading-[14px] font-medium opacity-80"
                                    style={optionStyle}
                                >
                                    {c.name}
                                </span>
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
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1 lg:w-[175px]">
                <DatePicker value={startValue} onChange={onStartChange} className="cursor-pointer pr-10 w-full" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60" />
                    </svg>
                </div>
            </div>
            <span className="text-[14px] text-[#000] dark:text-neutral-80 hidden lg:inline">-</span>
            <div className="relative flex-1 lg:w-[175px]">
                <DatePicker value={endValue} onChange={onEndChange} className="cursor-pointer pr-10 w-full" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5Z" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-neutral-60" />
                    </svg>
                </div>
            </div>
        </div>
    );
}


