import {
  FINANCIAL_ASSET_OPTIONS,
  REAL_ESTATE_OPTIONS,
  REAL_ESTATE_SELECT_OPTIONS,
  VEHICLE_OPTIONS,
  type DiagnosisFormState,
  type RealEstateSelectValue,
  type RealEstateType,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle, ManwonInput } from "./FormControls";
import { PillSelect, PillMultiSelect } from "./PillSelect";
import FormToggle from "./FormToggle";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
};

function isRealEstateType(value: RealEstateSelectValue): value is RealEstateType {
  return value !== "none";
}

export default function Step2Assets({ form, update }: Props) {
  const setRealEstateAmount = (type: RealEstateType, value: number) => {
    update("realEstateAmounts", { ...form.realEstateAmounts, [type]: value });
  };

  // 빈 배열(=없음)일 때도 UI에서는 "없음"이 선택된 것처럼 보이게 한다.
  const realEstateSelectValue: RealEstateSelectValue[] =
    form.realEstateTypes.length === 0 ? ["none"] : form.realEstateTypes;

  const handleRealEstateChange = (next: RealEstateSelectValue[]) => {
    const wasNone = form.realEstateTypes.length === 0;
    const types = next.filter(isRealEstateType);
    const includesNone = next.includes("none");

    let selectedTypes: RealEstateType[];
    if (includesNone && types.length === 0) {
      selectedTypes = [];
    } else if (includesNone && types.length > 0) {
      // 없음→종류: 종류만 유지 / 종류→없음: 전체 해제
      selectedTypes = wasNone ? types : [];
    } else {
      selectedTypes = types;
    }

    update("realEstateTypes", selectedTypes);

    if (selectedTypes.length === 0) {
      update("realEstateAmounts", {});
      return;
    }

    // 해제된 종류의 금액은 제거
    const pruned: Partial<Record<RealEstateType, number>> = {};
    selectedTypes.forEach((type) => {
      if (form.realEstateAmounts[type] != null) pruned[type] = form.realEstateAmounts[type];
    });
    update("realEstateAmounts", pruned);
  };

  // 선택된 종류만, 옵션 순서를 유지해 동적 입력을 렌더링한다 (채무현황과 동일 패턴)
  const selectedRealEstateTypes = REAL_ESTATE_OPTIONS.filter((option) =>
    form.realEstateTypes.includes(option.value)
  );

  return (
    <div>
      <FormSectionTitle>고객 자산 현황</FormSectionTitle>

      <div className="mt-0 md:mt-3 flex flex-col gap-5">
        <FormField label="부동산 보유 여부" hint="(중복선택 가능)">
          <PillMultiSelect
            options={REAL_ESTATE_SELECT_OPTIONS}
            value={realEstateSelectValue}
            onChange={handleRealEstateChange}
          />
        </FormField>

        {selectedRealEstateTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedRealEstateTypes.map((option) => (
              <FormField key={option.value} label={`${option.label} 시가 (만원)`}>
                <ManwonInput
                  value={form.realEstateAmounts[option.value] ?? 0}
                  onChange={(value) => setRealEstateAmount(option.value, value)}
                />
              </FormField>
            ))}
          </div>
        )}

        <FormField label="금융 자산 (예적금 + 주식 등)">
          <PillSelect
            options={FINANCIAL_ASSET_OPTIONS}
            value={form.financialAsset}
            onChange={(value) => update("financialAsset", value)}
          />
        </FormField>

        <FormField label="차량 보유">
          <PillSelect
            options={VEHICLE_OPTIONS}
            value={form.vehicle}
            onChange={(value) => update("vehicle", value)}
          />
        </FormField>

        {/* API: AnalysisFormInput.hasRecentAssetDisposal — Figma: 회색 필드 라벨 + 문구/토글 행 */}
        <FormField label="재산 처분이력">
          <div className="flex items-center justify-between gap-3 min-h-[34px]">
            <span className="flex-1 min-w-0 text-[14px] font-medium leading-[17px] text-foreground">
              최근 2년 내 부동산·차량 등 재산 처분 이력 있음
            </span>
            <FormToggle
              checked={form.hasRecentAssetDisposal}
              onChange={(checked) => update("hasRecentAssetDisposal", checked)}
              ariaLabel="최근 2년 내 부동산·차량 등 재산 처분 이력 있음"
            />
          </div>
        </FormField>
      </div>
    </div>
  );
}
