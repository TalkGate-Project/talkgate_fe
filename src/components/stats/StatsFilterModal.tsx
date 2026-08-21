"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import BaseModal from "@/components/common/BaseModal";

import {
  DateRange,
  LabeledSelect,
  SearchableLabeledCombobox,
  normalizeCustomerFilterOptions,
  type CustomerFilterOptionKey,
  type Option,
} from "@/components/common/filterFields";
import { CustomersService } from "@/services/customers";
import type { StatsCommonFilter } from "@/types/statistics";

export type StatsFilterValues = StatsCommonFilter & {
  teamId?: number;
  memberId?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (values: StatsFilterValues) => void;
  onReset?: () => void;
  defaults: StatsFilterValues;
  projectId: string | null;
  /** 담당팀 필드 노출 여부 */
  showTeam?: boolean;
  /** 담당팀 필드를 표시하되 비활성(선택 불가)으로 둘지 여부 (배정통계 팀별) */
  teamDisabled?: boolean;
  /** 담당자 필드 노출 여부 (카테고리 통계) */
  showMember?: boolean;
  teamOptions?: Option[];
  /** 선택된 팀에 속한 담당자 옵션을 반환 */
  getMemberOptions?: (teamId: number | null) => Option[];
};

const INITIAL_LOADING: Record<CustomerFilterOptionKey, boolean> = {
  applicationRoutes: false,
  mediaCompanies: false,
  sites: false,
};

function stringToDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateToString(date: Date | null): string | undefined {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function StatsFilterModal({
  open,
  onClose,
  onApply,
  onReset,
  defaults,
  projectId,
  showTeam = false,
  teamDisabled = false,
  showMember = false,
  teamOptions = [],
  getMemberOptions,
}: Props) {
  const [form, setForm] = useState<StatsFilterValues>(defaults);
  const isMobile = useIsMobile();

  const [routeOptions, setRouteOptions] = useState<Option[]>([]);
  const [mediaOptions, setMediaOptions] = useState<Option[]>([]);
  const [siteOptions, setSiteOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState<Record<CustomerFilterOptionKey, boolean>>(INITIAL_LOADING);
  const [loaded, setLoaded] = useState<Record<CustomerFilterOptionKey, boolean>>(INITIAL_LOADING);

  useEffect(() => {
    if (open) setForm(defaults);
  }, [open, defaults]);

  useEffect(() => {
    setRouteOptions([]);
    setMediaOptions([]);
    setSiteOptions([]);
    setLoading(INITIAL_LOADING);
    setLoaded(INITIAL_LOADING);
  }, [projectId]);

  const fetchOptions = useCallback(
    async (key: CustomerFilterOptionKey) => {
      if (!projectId || loading[key] || loaded[key]) return;
      setLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const response =
          key === "applicationRoutes"
            ? await CustomersService.listApplicationRoutes(projectId)
            : key === "mediaCompanies"
            ? await CustomersService.listMediaCompanies(projectId)
            : await CustomersService.listSites(projectId);
        const normalized = normalizeCustomerFilterOptions(response.data?.data, key);
        if (key === "applicationRoutes") setRouteOptions(normalized);
        else if (key === "mediaCompanies") setMediaOptions(normalized);
        else setSiteOptions(normalized);
        setLoaded((prev) => ({ ...prev, [key]: true }));
      } catch (error) {
        console.error("Failed to load customer filter options:", error);
        if (key === "applicationRoutes") setRouteOptions([]);
        else if (key === "mediaCompanies") setMediaOptions([]);
        else setSiteOptions([]);
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [projectId, loading, loaded]
  );

  if (!open) return null;

  const memberOptions = getMemberOptions ? getMemberOptions(form.teamId ?? null) : [];
  const memberDisabled = !form.teamId;

  const handleReset = () => {
    setForm({});
    if (onReset) onReset();
  };

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      ariaLabel="필터추가"
      disableAutoContainerSizing
      positionerClassName="absolute inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:w-[calc(100%-2rem)] md:max-w-[960px] lg:w-[848px] lg:max-w-[848px] md:h-auto md:max-h-[90vh]"
      positionerStyle={{ transform: !isMobile ? "translate(-50%, -50%)" : "none" }}
      containerClassName="relative w-full h-full md:h-auto md:max-h-[90vh] bg-white dark:bg-neutral-10 rounded-t-[14px] md:rounded-[14px] flex flex-col overflow-hidden"
    >
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
            <button
              onClick={onClose}
              aria-label="close"
              className="hidden md:block cursor-pointer w-6 h-6 grid place-items-center text-[#111827] dark:text-neutral-70"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto px-4 md:px-7 pt-[18px] pb-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {showTeam && (
                <LabeledSelect
                  label="담당팀"
                  options={teamOptions}
                  placeholder="전체"
                  value={form.teamId ? String(form.teamId) : ""}
                  disabled={teamDisabled}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      teamId: v ? Number(v) : undefined,
                      // 팀이 바뀌면 담당자 초기화
                      memberId: undefined,
                    }))
                  }
                />
              )}
              {showMember && (
                <LabeledSelect
                  label="담당자"
                  options={memberOptions}
                  placeholder="전체"
                  value={form.memberId ? String(form.memberId) : ""}
                  disabled={memberDisabled}
                  onChange={(v) => setForm((f) => ({ ...f, memberId: v ? Number(v) : undefined }))}
                />
              )}

              <SearchableLabeledCombobox
                label="신청경로"
                options={routeOptions}
                placeholder="직접 입력 또는 선택"
                value={form.applicationRoute || ""}
                onChange={(v) => setForm((f) => ({ ...f, applicationRoute: v || undefined }))}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) void fetchOptions("applicationRoutes");
                }}
                loading={loading.applicationRoutes}
                emptyText="신청경로가 없습니다."
              />
              <SearchableLabeledCombobox
                label="매체사"
                options={mediaOptions}
                placeholder="직접 입력 또는 선택"
                value={form.mediaCompany || ""}
                onChange={(v) => setForm((f) => ({ ...f, mediaCompany: v || undefined }))}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) void fetchOptions("mediaCompanies");
                }}
                loading={loading.mediaCompanies}
                emptyText="매체사가 없습니다."
              />
              <SearchableLabeledCombobox
                label="사이트"
                options={siteOptions}
                placeholder="직접 입력 또는 선택"
                value={form.site || ""}
                onChange={(v) => setForm((f) => ({ ...f, site: v || undefined }))}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) void fetchOptions("sites");
                }}
                loading={loading.sites}
                emptyText="사이트가 없습니다."
              />

              <div>
                <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">신청시간</label>
                <DateRange
                  startValue={stringToDate(form.applicationDateStart)}
                  endValue={stringToDate(form.applicationDateEnd)}
                  onStartChange={(date) => setForm((f) => ({ ...f, applicationDateStart: dateToString(date) }))}
                  onEndChange={(date) => setForm((f) => ({ ...f, applicationDateEnd: dateToString(date) }))}
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#808080] dark:text-neutral-60 mb-2">배정시간</label>
                <DateRange
                  startValue={stringToDate(form.assignedAtStart)}
                  endValue={stringToDate(form.assignedAtEnd)}
                  onStartChange={(date) => setForm((f) => ({ ...f, assignedAtStart: dateToString(date) }))}
                  onEndChange={(date) => setForm((f) => ({ ...f, assignedAtEnd: dateToString(date) }))}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#E2E2E2] dark:border-[#444444] shrink-0" />
          <div className="px-4 md:px-7 py-3 flex items-center justify-end gap-3 shrink-0">
            <button
              className="cursor-pointer w-[60px] md:w-[60px] h-[40px] md:h-[34px] rounded-[5px] border border-[#E2E2E2] dark:border-[#444444] text-[14px] font-semibold tracking-[-0.02em] text-[#000] dark:text-neutral-80 bg-white dark:bg-neutral-20 hover:bg-neutral-10 dark:hover:bg-neutral-30"
              onClick={handleReset}
            >
              초기화
            </button>
            <button
              className="cursor-pointer w-[84px] md:w-[84px] h-[40px] md:h-[34px] rounded-[5px] bg-[#252525] dark:bg-neutral-80 text-[#D0D0D0] dark:text-neutral-10 text-[14px] font-semibold tracking-[-0.02em] hover:bg-[#353535] dark:hover:bg-neutral-70"
              onClick={() => onApply(form)}
            >
              적용완료
            </button>
          </div>
    </BaseModal>
  );
}
