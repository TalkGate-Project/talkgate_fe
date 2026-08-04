import {
  CREDITOR_COUNT_OPTIONS,
  DEBT_AMOUNT_LABELS,
  DEBT_CAUSE_OPTIONS,
  DEBT_TYPE_OPTIONS,
  type DebtType,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, ManwonInput, MonthsInput } from "./FormControls";
import { PillSelect, PillMultiSelect } from "./PillSelect";
import { FormToggleRow } from "./FormToggle";
import { getOverLimitDebtFields } from "./validateDiagnosisForm";

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

// ════════════════════════════════════════════════════════════════════════
// TODO(Phase 4-3, 채무 상세입력 UI — 미착수): 이 컴포넌트는 현재 간편(simple) 모드
// 화면만 그린다. DiagnosisFormState.debtInputMode는 항상 "simple"로 시작하고 이
// 화면에 모드 전환 UI가 없어 사실상 고정돼 있다 — 즉 지금은 detailed 값이 만들어질
// 경로가 없으므로 안전하게 휴면 상태다.
//
// 상세모드 착수 시 필요한 것 (타입·서비스 계층은 이미 준비됨, docs/
// ANALYSIS_6_PROCEDURES_MIGRATION_TASKS.md Phase 4-3 참고):
//   - 카드 헤더에 간편/상세 세그먼트 토글 (샘플사이트 참고)
//   - 상세모드 진입 시 이 카드 안의 채무종류/금액그리드/합계/연체기간(52~122번 줄)을 숨기고
//     DebtItemFormState[] 행 테이블로 교체 (types/debtRelief.ts의 DebtItemFormState,
//     createEmptyDebtItem, DEBT_ITEM_TYPE_OPTIONS, REPAYMENT_METHOD_OPTIONS 사용)
//   - 「채무발생 원인」(158번 줄)은 샘플사이트 기준 두 모드가 공유하며 카드 바깥에 위치
//     — 상세모드 작업 시 이 컴포넌트 밖으로 빼내는 리팩터링 필요
//   - 상세모드에서는 원 단위 입력(WonInput, FormControls.tsx에 준비됨)을 쓰고
//     사이드바 등 표시부만 wonToManwon()으로 환산 (services/debtRelief.ts)
// ════════════════════════════════════════════════════════════════════════
export default function Step3Debts({ form, update, derived, debtSumOverLimitChecked = false }: Props) {
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
    <div>
      <FormSectionTitle>고객 채무 현황</FormSectionTitle>

      <div className="mt-0 md:mt-3 flex flex-col gap-5">
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
          <span className="text-[14px] font-medium tracking-[0.2px] text-neutral-60">총 채무 합계</span>
          <span className="flex items-end gap-1">
            <span className="font-montserrat font-bold text-[18px] md:text-[20px] leading-5 tracking-[-0.03em] text-neutral-90">
              {derived.totalDebtManwon.toLocaleString("ko-KR")}
            </span>
            <span className="text-[13px] font-semibold leading-4 text-neutral-60">만원</span>
          </span>
        </div>

        {/* Figma Frame: gap 20 — 채권자 수 → 연체기간 → 체납 토글 → 채무발생 원인 */}
        <div className="flex flex-col gap-5">
          <FormField label="채권자 수" required filled={form.creditorCount !== null}>
            <PillSelect
              options={CREDITOR_COUNT_OPTIONS}
              value={form.creditorCount}
              onChange={(value) => update("creditorCount", value)}
            />
          </FormField>

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

          {/* 2026-07-24 피드백 추가 항목 — 만원 단위 숫자입력 3종. 위 채무종류별 금액 그리드(62번 줄)와
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
    </div>
  );
}
