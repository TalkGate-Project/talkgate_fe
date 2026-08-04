import {
  AGE_GROUP_OPTIONS,
  DEPENDENT_OPTIONS,
  REGION_OPTIONS,
  type CustomerGender,
  type DiagnosisFormState,
  type PillOption,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, TextInput } from "./FormControls";
import { PillSelect } from "./PillSelect";
import { FormToggleRow } from "./FormToggle";

const GENDER_OPTIONS: PillOption<CustomerGender>[] = [
  { value: "male", label: "남" },
  { value: "female", label: "여" },
];

const SPOUSE_INCOME_OPTIONS: PillOption<"none" | "yes">[] = [
  { value: "none", label: "없음" },
  { value: "yes", label: "있음" },
];

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
};

export default function Step1BasicInfo({ form, update }: Props) {
  return (
    <div>
      <FormSectionTitle>고객 정보</FormSectionTitle>

      {/* Figma: 섹션 구분선 → 첫 필드 13px, 필드 간 20px */}
      <div className="mt-0 md:mt-3 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-7">
          <FormField
            label="고객명"
            required
            filled={Boolean(form.customerName.trim())}
            className="flex-1 min-w-0 md:max-w-[230px]"
          >
            <TextInput
              value={form.customerName}
              onChange={(value) => update("customerName", value)}
              placeholder="고객명을 입력하세요"
            />
          </FormField>
          <FormField label="성별" required filled={form.gender !== null}>
            <PillSelect
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(value) => update("gender", value)}
            />
          </FormField>
        </div>

        <FormField label="연령대" required filled={form.ageGroup !== null}>
          <PillSelect
            options={AGE_GROUP_OPTIONS}
            value={form.ageGroup}
            onChange={(value) => update("ageGroup", value)}
          />
        </FormField>

        <FormField label="거주 지역" required filled={form.region !== null}>
          {/* 옵션이 17개라 한 줄에 끝까지 늘어지면 부자연스러워 태블릿은 한 줄 최대 6개, 데스크톱은 9개로 제한 */}
          <PillSelect
            options={REGION_OPTIONS}
            value={form.region}
            onChange={(value) => update("region", value)}
            className="md:grid md:grid-cols-[repeat(6,max-content)] lg:grid-cols-[repeat(9,max-content)]"
          />
        </FormField>

        <FormField label="부양가족" required filled={form.dependents !== null}>
          <PillSelect
            options={DEPENDENT_OPTIONS}
            value={form.dependents}
            onChange={(value) => update("dependents", value)}
          />
        </FormField>

        <FormField label="배우자 소득" required filled={form.spouseIncome !== null}>
          <PillSelect
            options={SPOUSE_INCOME_OPTIONS}
            value={form.spouseIncome === null ? null : form.spouseIncome ? "yes" : "none"}
            onChange={(value) => update("spouseIncome", value === null ? null : value === "yes")}
          />
        </FormField>

        {/* 새출발기금 후보 게이트 — false면 결과에서 새출발기금이 아예 후보에서 빠진다.
            "현재 또는 과거"를 묻는 항목이라 고용형태와 같은 맥락에서 받는다. */}
        <FormField label="사업 영위 이력">
          <FormToggleRow
            label="현재 또는 과거에 사업을 영위한 적 있음"
            checked={form.isOperatingBusiness}
            onChange={(checked) => update("isOperatingBusiness", checked)}
          />
        </FormField>
      </div>
    </div>
  );
}
