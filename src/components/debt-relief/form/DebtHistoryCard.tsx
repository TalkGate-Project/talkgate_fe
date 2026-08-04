"use client";

import {
  DEBT_AMOUNT_LABELS,
  DEBT_TYPE_OPTIONS,
  createEmptyDebtItem,
  type DebtType,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, ManwonInput, MonthsInput } from "./FormControls";
import { PillMultiSelect } from "./PillSelect";
import DebtItemsTable from "./DebtItemsTable";

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
  return (
    <div
      role="tablist"
      aria-label="채무 입력 방식"
      className="flex items-center gap-1 shrink-0 rounded-full bg-neutral-20 p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "simple"}
        disabled={disabled}
        onClick={() => onChange("simple")}
        className={`cursor-pointer h-7 px-4 rounded-full text-[13px] font-semibold leading-[16px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          value === "simple"
            ? "bg-neutral-90 text-neutral-20"
            : "text-neutral-60 hover:text-foreground"
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
        className={`cursor-pointer inline-flex items-center gap-1.5 h-7 px-4 rounded-full text-[13px] font-semibold leading-[16px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          value === "detailed"
            ? "bg-neutral-90 text-neutral-20"
            : "text-neutral-60 hover:text-foreground"
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
};

export default function DebtHistoryCard({
  form,
  update,
  totalDebtManwon,
  disabled = false,
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
    <div className="min-w-0 rounded-[14px] border border-neutral-30 overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 md:py-5 border-b border-neutral-30">
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
        className={`px-5 md:px-6 py-5 md:py-6 ${disabled ? "pointer-events-none opacity-80" : ""}`}
      >
        {form.debtInputMode === "detailed" ? (
          <DebtItemsTable debts={form.debts} onChange={(debts) => update("debts", debts)} />
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

            <div className="flex items-center justify-between bg-neutral-10 rounded-[12px] px-4 md:px-7 h-12 md:h-[56px]">
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
          </div>
        )}
      </div>
    </div>
  );
}
