import type { DiagnosisFormState } from "@/types/debtRelief";
import { FormSectionTitle } from "./FormControls";
import FormToggle from "./FormToggle";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
};

export default function Step5Others({ form, update }: Props) {
  return (
    <div>
      <FormSectionTitle>소송 및 회생·파산 이력</FormSectionTitle>

      <div className="mt-3 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <ToggleDetailRow
            label="이전 개인회생 / 파산 신청 이력 있음"
            checked={form.hasPreviousApplication}
            onChange={(checked) => update("hasPreviousApplication", checked)}
            detailValue={form.previousApplicationDetail}
            onDetailChange={(value) => update("previousApplicationDetail", value)}
            placeholder="신청 연도 및 결과"
          />
          <ToggleDetailRow
            label="보증인 / 연대보증 관계 있음"
            checked={form.hasGuarantor}
            onChange={(checked) => update("hasGuarantor", checked)}
            detailValue={form.guarantorDetail}
            onDetailChange={(value) => update("guarantorDetail", value)}
            placeholder="관계 내용 입력"
          />
          <ToggleDetailRow
            label="현재 진행중인 소송 / 압류 있음"
            checked={form.hasOngoingLitigation}
            onChange={(checked) => update("hasOngoingLitigation", checked)}
            detailValue={form.litigationDetail}
            onDetailChange={(value) => update("litigationDetail", value)}
            placeholder="소송·압류 상세 내용"
          />
        </div>

        <div>
          <label className="block text-[14px] font-medium tracking-[0.2px] text-neutral-60 mb-2">
            상담사 메모
          </label>
          <textarea
            value={form.counselorMemo}
            onChange={(e) => update("counselorMemo", e.target.value)}
            placeholder="상담 중 특이사항, 고객 태도, 추가 메모 등"
            rows={5}
            className="w-full px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// 토글 on 시에만 상세 내용 입력창을 노출하는 카드. 세 항목(이전 이력/보증인/소송) 모두 동일한 패턴을 공유한다.
function ToggleDetailRow({
  label,
  checked,
  onChange,
  detailValue,
  onDetailChange,
  placeholder,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  detailValue: string;
  onDetailChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="border border-neutral-30 rounded-[8px] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 min-w-0 text-[14px] font-medium text-foreground leading-5">{label}</span>
        <FormToggle checked={checked} onChange={onChange} ariaLabel={label} />
      </div>
      {checked && (
        <input
          type="text"
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={placeholder}
          className="mt-3 w-full h-[34px] px-3 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium text-foreground placeholder:text-neutral-50 focus:outline-none focus:border-neutral-50"
        />
      )}
    </div>
  );
}
