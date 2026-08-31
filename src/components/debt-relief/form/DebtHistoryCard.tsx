"use client";

import { createEmptyDebtItem, type DiagnosisFormState } from "@/types/debtRelief";
import DebtItemsTable from "./DebtItemsTable";
import type { OverLimitDebtField } from "./validateDiagnosisForm";

type DebtDisplayMode = DiagnosisFormState["debtInputMode"];
const SUBTITLE: Record<DebtDisplayMode, string> = {
  simple: "채권처·현재 잔액을 입력하고 상환 조건은 선택적으로 입력",
  detailed: "채권처·상환방식·금리까지 상세 입력 (원 단위)",
};

export function DebtModeToggle({ value, onChange, disabled, compact = false }: { value: DebtDisplayMode; onChange: (mode: DebtDisplayMode) => void; disabled: boolean; compact?: boolean }) {
  return <div data-debt-mode-toggle role="tablist" aria-label="채무 입력 방식" className={`flex shrink-0 items-center bg-neutral-20 ${compact ? "h-8 w-[92px] gap-1 rounded-lg p-1" : "h-10 w-[200px] gap-3 rounded-lg px-1.5 py-[4.5px]"}`}>
    {(["simple", "detailed"] as const).map((mode) => <button key={mode} data-active={value === mode} type="button" role="tab" aria-selected={value === mode} disabled={disabled} onClick={() => onChange(mode)} className={`inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[5px] text-center disabled:opacity-60 ${compact ? "h-6 w-10 text-[13px] leading-4" : "h-[31px] w-[88px] text-[16px] leading-[19px]"} ${value === mode ? "bg-card font-bold text-neutral-90" : "font-medium text-neutral-60"}`}>{mode === "simple" ? "간편" : "상세"}</button>)}
  </div>;
}

export type DebtHistoryCardProps = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  totalDebtManwon: number;
  disabled?: boolean;
  areaBackgroundClassName?: string;
  showDebtItemFieldErrors?: boolean;
  overLimitFields?: OverLimitDebtField[];
  scrollFadeColorClassName?: string;
  /** 데스크톱형 카드 레이아웃 전환 기준. 신규/수정 폼은 desktop, 기존 재사용 화면은 tablet. */
  desktopLayoutBreakpoint?: "tablet" | "desktop";
  /** 전용 가로 스크롤바를 상세 모드에만 또는 모든 모드에 표시한다. */
  customScrollbarMode?: "detailed" | "all";
};

export default function DebtHistoryCard({ form, update, disabled = false, areaBackgroundClassName = "bg-neutral-10", showDebtItemFieldErrors = false, scrollFadeColorClassName, desktopLayoutBreakpoint = "tablet", customScrollbarMode }: DebtHistoryCardProps) {
  const handleModeChange = (mode: DebtDisplayMode) => {
    if (disabled) return;
    update("debtInputMode", mode);
    if (form.debts.length === 0) update("debts", [createEmptyDebtItem(crypto.randomUUID())]);
  };

  const desktopHeaderClassName = desktopLayoutBreakpoint === "desktop"
    ? "lg:flex-row lg:h-[70px] lg:items-center lg:px-6"
    : "md:flex-row md:h-[70px] md:items-center md:px-6";
  const desktopBodyPaddingClassName = desktopLayoutBreakpoint === "desktop" ? "lg:px-6" : "md:px-6";

  return <div data-debt-history-card className="min-w-0 overflow-hidden rounded-[14px] border border-neutral-30">
    <div data-debt-history-header className={`flex flex-col items-stretch justify-between gap-3 bg-neutral-10 px-5 py-4 ${desktopHeaderClassName}`}>
      <div><h3 className="text-[16px] font-bold text-foreground">채무내역</h3><p className="mt-1.5 text-[13px] text-neutral-60">{SUBTITLE[form.debtInputMode]}</p></div>
      <DebtModeToggle value={form.debtInputMode} onChange={handleModeChange} disabled={disabled} />
    </div>
    <div className={`flex flex-col gap-5 px-5 py-5 ${desktopBodyPaddingClassName} ${disabled ? "pointer-events-none opacity-80" : ""}`}>
      <DebtItemsTable debts={form.debts} assets={form.assets} mode={form.debtInputMode} onChange={(debts) => update("debts", debts)} sumCardBackgroundClassName={areaBackgroundClassName} showFieldErrors={showDebtItemFieldErrors} lockedDebtIds={form.assetOriginDebtIds} scrollFadeColorClassName={scrollFadeColorClassName} desktopLayoutBreakpoint={desktopLayoutBreakpoint} customScrollbarMode={customScrollbarMode} />
    </div>
  </div>;
}
