"use client";

import {
  CREDITOR_COUNT_OPTIONS,
  DEBT_AMOUNT_LABELS,
  DEBT_TYPE_OPTIONS,
  createEmptyDebtItem,
  type DebtType,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, ManwonInput, MonthsInput } from "./FormControls";
import { PillMultiSelect, PillSelect } from "./PillSelect";
import DebtItemsTable from "./DebtItemsTable";
import type { OverLimitDebtField } from "./validateDiagnosisForm";

// ── 「채무내역」 카드 — 신규 폼(Step3)과 결과 화면 채무 상세 모달이 공유 ────────
// form.debtInputMode를 그대로 토글에 연결한다 — 상세모드로 전환해도 간편모드 값
// (debtTypes/debtAmounts/overdueMonths)은 지우지 않고 유지한다(다시 간편으로 돌아왔을 때
// 손실 없게). 제출은 모드에 맞는 필드만 검증/전송한다.

type DebtDisplayMode = DiagnosisFormState["debtInputMode"];

const DEBT_DISPLAY_MODE_SUBTITLE: Record<DebtDisplayMode, string> = {
  simple: "종류별 잔액만 간편하게 입력",
  detailed: "채권처·상환방식·금리까지 상세 입력 (원 단위)",
};

function getDebtAmountFields(selectedTypes: DebtType[]): { key: DebtType; label: string }[] {
  return DEBT_TYPE_OPTIONS.filter((option) => selectedTypes.includes(option.value)).map(
    (option) => ({ key: option.value, label: DEBT_AMOUNT_LABELS[option.value] })
  );
}

function DebtModeToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: DebtDisplayMode;
  onChange: (mode: DebtDisplayMode) => void;
  disabled?: boolean;
}) {
  // 세그먼트 탭 다크모드 — DiagnosisListTabs / ChatLeftSidebar / SalesRanking과 동일:
  // 트랙 bg-neutral-20, 선택 bg-card + text-foreground (하드코딩 bg-white 금지)
  return (
    <div
      role="tablist"
      aria-label="채무 입력 방식"
      className="flex h-12 w-full md:w-[212px] shrink-0 items-center gap-3 rounded-[12px] bg-neutral-20 px-3 py-[8.5px]"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "simple"}
        disabled={disabled}
        onClick={() => onChange("simple")}
        className={`inline-flex h-[31px] flex-1 md:w-[88px] md:flex-none cursor-pointer items-center justify-center whitespace-nowrap rounded-[5px] text-[16px] leading-[19px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          value === "simple"
            ? "bg-card font-bold text-foreground"
            : "bg-transparent font-medium text-neutral-60 hover:text-foreground"
        }`}
      >
        간편
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "detailed"}
        disabled={disabled}
        onClick={() => onChange("detailed")}
        className={`inline-flex h-[31px] flex-1 md:w-[88px] md:flex-none cursor-pointer items-center justify-center whitespace-nowrap rounded-[5px] text-[16px] leading-[19px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          value === "detailed"
            ? "bg-card font-bold text-foreground"
            : "bg-transparent font-medium text-neutral-60 hover:text-foreground"
        }`}
      >
        상세
      </button>
    </div>
  );
}

export type DebtHistoryCardProps = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  totalDebtManwon: number;
  disabled?: boolean;
  /** 담보/무담보 합산 카드·총 채무 합계 영역 배경. 기본(신규 폼)은 카드 배경(neutral-0)과 대비되는
      neutral-10 그대로 두고, 모달처럼 컨테이너 자체가 이미 neutral-10인 곳에서는 묻히지 않도록
      호출부에서 오버라이드한다. */
  areaBackgroundClassName?: string;
  /** 제출을 한 번 시도해 상세모드 채무 항목의 대출일·만기일·금액·금리 중 비어있는 값이
      발견됐으면 true. 상세모드 테이블에만 영향을 준다. */
  showDebtItemFieldErrors?: boolean;
  /** 담보부채무·최근 3/6개월·1년 내 채무액 중 합계 초과로 판정된 필드 (빨간 테두리 표시).
      결과화면 채무 상세 모달은 이 검사를 하지 않아 기본값(빈 배열)을 그대로 쓴다. */
  overLimitFields?: OverLimitDebtField[];
};

export default function DebtHistoryCard({
  form,
  update,
  totalDebtManwon,
  disabled = false,
  areaBackgroundClassName = "bg-neutral-10",
  showDebtItemFieldErrors = false,
  overLimitFields = [],
}: DebtHistoryCardProps) {
  const handleModeChange = (mode: DebtDisplayMode) => {
    if (disabled) return;
    update("debtInputMode", mode);
    // 상세모드로 처음 전환할 때 빈 테이블만 덩그러니 보이지 않도록 행 1개를 미리 채워준다.
    if (mode === "detailed" && form.debts.length === 0) {
      update("debts", [createEmptyDebtItem(crypto.randomUUID())]);
    }
  };

  const setAmount = (type: DebtType, value: number) => {
    update("debtAmounts", { ...form.debtAmounts, [type]: value });
  };

  const handleDebtTypesChange = (nextTypes: DebtType[]) => {
    update("debtTypes", nextTypes);
    const pruned: Partial<Record<DebtType, number>> = {};
    nextTypes.forEach((type) => {
      if (form.debtAmounts[type] != null) pruned[type] = form.debtAmounts[type];
    });
    update("debtAmounts", pruned);
  };

  const amountFields = getDebtAmountFields(form.debtTypes);

  return (
    // min-w-0: 상세모드 테이블(가로스크롤)이 flex 조상의 min-content 폭을 밀어올리지 않게
    <div className="min-w-0 overflow-hidden rounded-[14px] border border-neutral-30">
      <div className="flex flex-col md:flex-row md:h-[70px] items-stretch md:items-center justify-between gap-3 md:gap-4 bg-neutral-10 px-5 py-4 md:py-0 md:px-6">
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold leading-5 text-foreground">채무내역</h3>
          <p className="mt-1.5 text-[13px] leading-4 text-neutral-60">
            {DEBT_DISPLAY_MODE_SUBTITLE[form.debtInputMode]}
          </p>
        </div>
        <DebtModeToggle
          value={form.debtInputMode}
          onChange={handleModeChange}
          disabled={disabled}
        />
      </div>

      <div
        className={`flex flex-col gap-5 px-5 md:px-6 py-5 md:py-6 ${disabled ? "pointer-events-none opacity-80" : ""}`}
      >
        {form.debtInputMode === "detailed" ? (
          <DebtItemsTable
            debts={form.debts}
            onChange={(debts) => update("debts", debts)}
            sumCardBackgroundClassName={areaBackgroundClassName}
            showFieldErrors={showDebtItemFieldErrors}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <FormField
              label="채무종류"
              hint="(중복선택 가능)"
              required
              filled={form.debtTypes.length > 0}
            >
              <PillMultiSelect
                options={DEBT_TYPE_OPTIONS}
                value={form.debtTypes}
                onChange={handleDebtTypesChange}
              />
            </FormField>

            {amountFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-4 md:gap-y-5">
                {amountFields.map((field) => (
                  <FormField
                    key={field.key}
                    label={field.label}
                    filled={(form.debtAmounts[field.key] ?? 0) > 0}
                  >
                    <ManwonInput
                      value={form.debtAmounts[field.key] ?? 0}
                      onChange={(value) => setAmount(field.key, value)}
                    />
                  </FormField>
                ))}
              </div>
            )}

            <div role="separator" className="h-px bg-neutral-30" />

            <div
              className={`flex items-center justify-between rounded-[12px] px-4 md:px-7 h-12 md:h-[56px] ${areaBackgroundClassName}`}
            >
              <span className="text-[14px] font-medium tracking-[0.2px] text-neutral-60">
                총 채무 합계
              </span>
              <span className="flex items-end gap-1">
                <span className="font-montserrat font-bold text-[18px] md:text-[20px] leading-5 tracking-[-0.03em] text-neutral-90">
                  {totalDebtManwon.toLocaleString("ko-KR")}
                </span>
                <span className="text-[13px] font-semibold leading-4 text-neutral-60">만원</span>
              </span>
            </div>

            <FormField
              label="연체기간"
              hint="여러 채무가 있으면 가장 긴 연체 기준으로"
              required
              filled={form.overdueMonths !== null}
            >
              <MonthsInput
                value={form.overdueMonths}
                onChange={(value) => update("overdueMonths", value)}
              />
            </FormField>

            {/* 2026-08-07: 채무내역 카드 바깥(Step3Debts)에 있던 걸 카드 안으로 이동.
                상세모드는 채무 항목 테이블 행 개수를 그대로 쓰므로 노출하지 않는다. */}
            <FormField label="채권자 수" required filled={form.creditorCount !== null}>
              <PillSelect
                options={CREDITOR_COUNT_OPTIONS}
                value={form.creditorCount}
                onChange={(value) => update("creditorCount", value)}
              />
            </FormField>
          </div>
        )}

        {/* 채무 종류별 잔액과 무관하게 입력 방식(간편/상세)과 상관없이 항상 필요한 항목 —
            2026-08-06: 기존에 카드 바깥에 있던 것을 「채무내역」 카드 안으로 이동. */}
        <div role="separator" className="h-px bg-neutral-30" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-4 md:gap-y-5">
          <FormField label="최근 3개월 내 채무액" filled={form.recentDebtWithin3Months > 0}>
            <ManwonInput
              value={form.recentDebtWithin3Months}
              onChange={(value) => update("recentDebtWithin3Months", value)}
              invalid={overLimitFields.includes("recentDebtWithin3Months")}
            />
          </FormField>
          <FormField label="최근 6개월 내 채무액" filled={form.recentDebtWithin6Months > 0}>
            <ManwonInput
              value={form.recentDebtWithin6Months}
              onChange={(value) => update("recentDebtWithin6Months", value)}
              invalid={overLimitFields.includes("recentDebtWithin6Months")}
            />
          </FormField>
          <FormField label="최근 1년 내 채무액" filled={form.recentDebtWithin1Year > 0}>
            <ManwonInput
              value={form.recentDebtWithin1Year}
              onChange={(value) => update("recentDebtWithin1Year", value)}
              invalid={overLimitFields.includes("recentDebtWithin1Year")}
            />
          </FormField>
          <FormField label="담보부채무" filled={form.securedDebt > 0}>
            <ManwonInput
              value={form.securedDebt}
              onChange={(value) => update("securedDebt", value)}
              invalid={overLimitFields.includes("securedDebt")}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
