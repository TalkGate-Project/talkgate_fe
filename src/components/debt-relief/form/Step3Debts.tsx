"use client";

import {
  DEBT_CAUSE_OPTIONS,
  type DiagnosisDerivedValues,
  type DiagnosisFormState,
} from "@/types/debtRelief";
import { FormField, ManwonInput } from "./FormControls";
import { PillMultiSelect } from "./PillSelect";
import { FormToggleRow } from "./FormToggle";
import { getOverLimitDebtFields } from "./validateDiagnosisForm";
import DebtHistoryCard from "./DebtHistoryCard";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  derived: DiagnosisDerivedValues;
  // 분석하기 제출 시점에 담보부채무·최근 3개월/1년 내 채무액의 합이 총 채무 합계를 초과한 적이
  // 있으면 true. 이후 값이 다시 유효해지면(sum <= totalDebt) 매 렌더마다 재계산되어 즉시 해제된다.
  debtSumOverLimitChecked?: boolean;
};

export default function Step3Debts({ form, update, derived, debtSumOverLimitChecked = false }: Props) {
  // 값 하나만으로 총 채무를 넘는 필드가 있으면 그 필드만 표시하고, 여러 필드의 조합으로만
  // 초과하는 경우(원인을 특정할 수 없음)에는 세 필드 모두 표시한다 — getOverLimitDebtFields 참고.
  const overLimitFields = debtSumOverLimitChecked
    ? getOverLimitDebtFields(form, derived.totalDebtManwon)
    : [];

  return (
    <div className="flex flex-col gap-5">
      <DebtHistoryCard form={form} update={update} totalDebtManwon={derived.totalDebtManwon} />

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
