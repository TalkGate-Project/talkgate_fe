"use client";

import {
  DEBT_AMOUNT_LABELS,
  DEBT_CAUSE_OPTIONS,
  DEBT_TYPE_OPTIONS,
  createEmptyDebtItem,
  type DebtType,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, ManwonInput, MonthsInput } from "./FormControls";
import { PillMultiSelect } from "./PillSelect";
import { FormToggleRow } from "./FormToggle";
import { getOverLimitDebtFields } from "./validateDiagnosisForm";
import DebtItemsTable from "./DebtItemsTable";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  derived: DiagnosisDerivedValues;
  // 분석하기 제출 시점에 담보부채무·최근 3개월/1년 내 채무액의 합이 총 채무 합계를 초과한 적이
  // 있으면 true. 이후 값이 다시 유효해지면(sum <= totalDebt) 매 렌더마다 재계산되어 즉시 해제된다.
  debtSumOverLimitChecked?: boolean;
};

function getDebtAmountFields(selectedTypes: DebtType[]): { key: DebtType; label: string }[] {
  return DEBT_TYPE_OPTIONS.filter((option) => selectedTypes.includes(option.value)).map(
    (option) => ({ key: option.value, label: DEBT_AMOUNT_LABELS[option.value] })
  );
}

// ── 「채무내역」 카드 헤더 — 간편/상세 세그먼트 토글 ────────────────────────
// 백엔드 샘플사이트 UI(docs/ANALYSIS_6_PROCEDURES_MIGRATION_TASKS.md Phase 4-3)를 기준으로
// 카드를 구성한다. form.debtInputMode를 그대로 토글에 연결한다 — 상세모드로 전환해도
// 간편모드 값(debtTypes/debtAmounts/overdueMonths)은 지우지 않고 유지한다(다시 간편으로
// 돌아왔을 때 손실 없게). 제출은 모드에 맞는 필드만 검증/전송한다(validateDiagnosisForm,
// services/debtRelief.ts의 toAnalysisFormInput 참고).
type DebtDisplayMode = DiagnosisFormState["debtInputMode"];

const DEBT_DISPLAY_MODE_SUBTITLE: Record<DebtDisplayMode, string> = {
  simple: "종류별 잔액만 간편하게 입력",
  detailed: "채권처·상환방식·금리까지 상세 입력 (원 단위)",
};

function DebtModeToggle({
  value,
  onChange,
}: {
  value: DebtDisplayMode;
  onChange: (mode: DebtDisplayMode) => void;
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
        onClick={() => onChange("simple")}
        className={`cursor-pointer h-7 px-4 rounded-full text-[13px] font-semibold leading-[16px] transition-colors ${
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
        onClick={() => onChange("detailed")}
        className={`cursor-pointer inline-flex items-center gap-1.5 h-7 px-4 rounded-full text-[13px] font-semibold leading-[16px] transition-colors ${
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

export default function Step3Debts({ form, update, derived, debtSumOverLimitChecked = false }: Props) {
  // 상세모드로 처음 전환할 때 빈 테이블만 덩그러니 보이지 않도록 행 1개를 미리 채워준다.
  const handleModeChange = (mode: DebtDisplayMode) => {
    update("debtInputMode", mode);
    if (mode === "detailed" && form.debts.length === 0) {
      update("debts", [createEmptyDebtItem(crypto.randomUUID())]);
    }
  };

  // 값 하나만으로 총 채무를 넘는 필드가 있으면 그 필드만 표시하고, 여러 필드의 조합으로만
  // 초과하는 경우(원인을 특정할 수 없음)에는 세 필드 모두 표시한다 — getOverLimitDebtFields 참고.
  const overLimitFields = debtSumOverLimitChecked
    ? getOverLimitDebtFields(form, derived.totalDebtManwon)
    : [];

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
    <div className="flex flex-col gap-5">
      {/* 「채무내역」 카드 — 종류별 잔액 입력(간편) / 상세 입력(예정)만 담당.
          min-w-0: 상세모드 테이블(가로스크롤, 내용 폭 ~1580px)이 flex 조상들의 min-content
          폭을 밀어올려 카드·section 전체가 넓어지는 걸 막는다 — 실제 스크롤은 DebtItemsTable의
          overflow-x-auto 안에서만 일어나야 한다(DiagnosisFormContent.tsx의 section/본문 div에도
          동일한 이유로 min-w-0을 걸어뒀다). */}
      <div className="min-w-0 rounded-[14px] border border-neutral-30 overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 md:py-5 border-b border-neutral-30">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold leading-5 text-foreground">채무내역</h3>
            <p className="mt-1.5 text-[13px] leading-4 text-neutral-60">
              {DEBT_DISPLAY_MODE_SUBTITLE[form.debtInputMode]}
            </p>
          </div>
          <DebtModeToggle value={form.debtInputMode} onChange={handleModeChange} />
        </div>

        <div className="px-5 md:px-6 py-5 md:py-6">
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

              {/* Figma: 금액 영역과 합계 사이 콘텐츠 폭 Divider */}
              <div role="separator" className="h-px bg-neutral-30" />

              {/* Figma: 총 채무 합계 — 모바일 h-48 px-16 / 데스크톱 h-56 px-28, radius 12, 숫자 Montserrat */}
              <div className="flex items-center justify-between bg-neutral-10 rounded-[12px] px-4 md:px-7 h-12 md:h-[56px]">
                <span className="text-[14px] font-medium tracking-[0.2px] text-neutral-60">
                  총 채무 합계
                </span>
                <span className="flex items-end gap-1">
                  <span className="font-montserrat font-bold text-[18px] md:text-[20px] leading-5 tracking-[-0.03em] text-neutral-90">
                    {derived.totalDebtManwon.toLocaleString("ko-KR")}
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

      {/* 카드 바깥 공통 영역 — 채무 종류별 잔액과 무관하게 입력 방식 상관없이 항상 필요한 항목.
          「채무발생 원인」은 샘플사이트 기준 두 모드가 공유하는 필드라 카드 밖에 둔다. */}
      <div className="flex flex-col gap-5">
        {/* 2026-08-04: 채권자 수는 화면에 노출하지 않는다 — 간편모드는 채무종류 배지 개수,
            상세모드는 채무 항목 테이블 행 개수를 분석 제출 시점(services/debtRelief.ts의
            toAnalysisFormInput)에 내부적으로 계산해서 보낼 뿐, 상담사가 확인/수정할 UI는 두지 않는다. */}

        {/* 2026-07-24 피드백 추가 항목 — 만원 단위 숫자입력 3종. 채무종류별 금액 그리드와
            동일하게 2열(md:grid-cols-2)로 배치 — 3번째 필드는 다음 줄로 넘어간다. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-4 md:gap-y-5">
          <FormField label="최근 3개월 내 채무액" filled={form.recentDebtWithin3Months > 0}>
            <ManwonInput
              value={form.recentDebtWithin3Months}
              onChange={(value) => update("recentDebtWithin3Months", value)}
              invalid={overLimitFields.includes("recentDebtWithin3Months")}
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

        <FormField label="체납이력">
          <FormToggleRow
            label="세금/4대보험 체납이력 있음"
            checked={form.hasTaxArrears}
            onChange={(checked) => update("hasTaxArrears", checked)}
          />
        </FormField>

        <FormField
          label="채무발생 원인"
          hint="(중복선택 가능)"
          filled={form.debtCauses.length > 0}
        >
          <PillMultiSelect
            options={DEBT_CAUSE_OPTIONS}
            value={form.debtCauses}
            onChange={(value) => update("debtCauses", value)}
          />
        </FormField>
      </div>
    </div>
  );
}
