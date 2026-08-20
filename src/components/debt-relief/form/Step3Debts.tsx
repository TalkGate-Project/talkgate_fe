"use client";

import {
  DEBT_CAUSE_OPTIONS,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField } from "./FormControls";
import { PillMultiSelect } from "./PillSelect";
import { FormToggleRow } from "./FormToggle";
import { getOverLimitDebtFields } from "./validateDiagnosisForm";
import DebtHistoryCard from "./DebtHistoryCard";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  derived: DiagnosisDerivedValues;
  // 분석하기 제출 시점에 담보부채무·최근 3/6개월/1년 내 채무액의 합이 총 채무 합계를 초과한 적이
  // 있으면 true. 이후 값이 다시 유효해지면(sum <= totalDebt) 매 렌더마다 재계산되어 즉시 해제된다.
  debtSumOverLimitChecked?: boolean;
  // 분석하기 제출 시점에 상세모드 채무 항목의 대출일·만기일·금액·금리 중 비어있는 값이
  // 발견된 적이 있으면 true. 이후 값이 채워지면 해당 셀만 즉시 해제된다.
  debtItemFieldsMissingChecked?: boolean;
};

export default function Step3Debts({
  form,
  update,
  derived,
  debtSumOverLimitChecked = false,
  debtItemFieldsMissingChecked = false,
}: Props) {
  // 값 하나만으로 총 채무를 넘는 필드가 있으면 그 필드만 표시하고, 여러 필드의 조합으로만
  // 초과하는 경우(원인을 특정할 수 없음)에는 네 필드 모두 표시한다 — getOverLimitDebtFields 참고.
  const overLimitFields = debtSumOverLimitChecked
    ? getOverLimitDebtFields(form, derived.totalDebtManwon)
    : [];

  return (
    <div className="flex flex-col gap-5">
      <DebtHistoryCard
        form={form}
        update={update}
        totalDebtManwon={derived.totalDebtManwon}
        showDebtItemFieldErrors={debtItemFieldsMissingChecked}
        overLimitFields={overLimitFields}
      />

      {/* 카드 바깥 공통 영역 — 채무 종류별 잔액과 무관하게 입력 방식 상관없이 항상 필요한 항목.
          「채무발생 원인」은 샘플사이트 기준 두 모드가 공유하는 필드라 카드 밖에 둔다. */}
      <div className="flex flex-col gap-5">
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
          required
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
