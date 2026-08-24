import {
  AGE_GROUP_OPTIONS,
  REGION_OPTIONS,
  type CustomerGender,
  type DiagnosisFormState,
  type PillOption,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, TextInput } from "./FormControls";
import { PillSelect } from "./PillSelect";

const GENDER_OPTIONS: PillOption<CustomerGender>[] = [
  { value: "male", label: "남" },
  { value: "female", label: "여" },
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
          {/* 실제 폼 영역 너비를 기준으로 줄바꿈해 사이드바가 함께 보이는 태블릿에서도 넘치지 않도록 한다. */}
          <PillSelect
            options={REGION_OPTIONS}
            value={form.region}
            onChange={(value) => update("region", value)}
            className="w-full min-w-0"
          />
        </FormField>
      </div>
    </div>
  );
}
