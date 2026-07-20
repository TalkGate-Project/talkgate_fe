import type { DiagnosisFormState } from "@/types/debtRelief";
import { FormSectionTitle } from "./FormControls";
import { FormToggleRow } from "./FormToggle";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
};

const DETAIL_INPUT_CLASS =
  "w-full h-[34px] px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground placeholder:text-neutral-60 focus:outline-none focus:border-neutral-50";

const TEXTAREA_CLASS =
  "w-full h-[84px] px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground placeholder:text-neutral-60 focus:outline-none focus:border-neutral-50 resize-none";

/**
 * 기타사항 스텝 — Figma: 토글 행(라벨+스위치) + on 시 상세 인풋, 특이사항 textarea.
 * 카드 보더 없음. 항목 간 gap 24px.
 */
export default function Step5Others({ form, update }: Props) {
  return (
    <div>
      <FormSectionTitle>소송 및 회생·파산 이력</FormSectionTitle>

      <div className="mt-0 md:mt-6 flex flex-col gap-6">
        <ToggleDetailRow
          label="이전 개인회생 / 파산 신청 이력 있음"
          checked={form.hasPreviousApplication}
          onChange={(checked) => update("hasPreviousApplication", checked)}
          detailValue={form.previousApplicationDetail}
          onDetailChange={(value) => update("previousApplicationDetail", value)}
          detailPlaceholder="신청 연도 및 결과"
        />
        <ToggleDetailRow
          label="보증인 / 연대보증 관계 있음"
          checked={form.hasGuarantor}
          onChange={(checked) => update("hasGuarantor", checked)}
          detailValue={form.guarantorDetail}
          onDetailChange={(value) => update("guarantorDetail", value)}
          detailPlaceholder="관계 내용 입력"
        />
        <ToggleDetailRow
          label="현재 진행중인 소송 / 압류 있음"
          checked={form.hasOngoingLitigation}
          onChange={(checked) => update("hasOngoingLitigation", checked)}
          detailValue={form.litigationDetail}
          onDetailChange={(value) => update("litigationDetail", value)}
          detailPlaceholder="소송·압류 상세 내용"
        />

        <div>
          <label
            className={`block text-[14px] font-medium leading-[17px] mb-2 ${
              form.counselorMemo.trim() ? "text-secondary-60 dark:text-secondary-20" : "text-foreground"
            }`}
          >
            특이사항
          </label>
          <textarea
            value={form.counselorMemo}
            onChange={(e) => update("counselorMemo", e.target.value)}
            placeholder="상담중 특이사항을 입력해주세요"
            className={TEXTAREA_CLASS}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleDetailRow({
  label,
  checked,
  onChange,
  detailValue,
  onDetailChange,
  detailPlaceholder,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  detailValue: string;
  onDetailChange: (value: string) => void;
  detailPlaceholder: string;
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <FormToggleRow label={label} checked={checked} onChange={onChange} />
      {checked ? (
        <input
          type="text"
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={detailPlaceholder}
          className={DETAIL_INPUT_CLASS}
        />
      ) : null}
    </div>
  );
}
