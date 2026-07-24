import type { DiagnosisFormState } from "@/types/debtRelief";
import { FormSectionTitle } from "./FormControls";
import { FormToggleRow } from "./FormToggle";

type Props = {
  form: DiagnosisFormState;
  update: <K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) => void;
  /** 모바일 전용 타이틀 행의 닫기(X) 버튼 — 카드 우상단 절대배치 X와 동일 기능(handleClose) */
  onClose: () => void;
};

const DETAIL_INPUT_CLASS =
  "w-full h-[34px] px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground placeholder:text-neutral-60 focus:outline-none focus:border-neutral-50";

const TEXTAREA_CLASS =
  "w-full h-[84px] px-3 py-2 rounded-[5px] border border-neutral-30 bg-card text-[14px] font-medium tracking-[-0.02em] text-foreground placeholder:text-neutral-60 focus:outline-none focus:border-neutral-50 resize-none";

/**
 * 기타사항 스텝 — Figma: 토글 행(라벨+스위치) + on 시 상세 인풋, 특이사항 textarea.
 * 카드 보더 없음. 항목 간 gap 24px.
 */
export default function Step5Others({ form, update, onClose }: Props) {
  return (
    <div>
      {/* 모바일 전용 — 이 스텝은 다른 스텝과 달리 본문이 토글 목록으로 바로 시작해서, 카드
          우상단에 절대배치된 닫기(X)만 있으면 첫 항목 옆에 어색하게 떠 보인다. 타이틀 행을
          만들어 그 오른쪽 끝에 X를 두고, 카드 우상단의 절대배치 X는 이 스텝에서만 숨긴다
          (DiagnosisFormContent.tsx 참고). */}
      <div className="md:hidden flex items-center justify-between pb-3 border-b border-neutral-30">
        <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground">
          소송 및 회생·파산 이력
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="cursor-pointer w-6 h-6 grid place-items-center text-foreground hover:opacity-70 shrink-0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <FormSectionTitle>소송 및 회생·파산 이력</FormSectionTitle>

      <div className="mt-3 md:mt-6 flex flex-col gap-6">
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

        {/* 2026-07-24 피드백 추가 항목 — 위 3개 토글과 같은 gap-6 리듬을 타도록 별도 wrapper 없이 직계 자식으로 배치 */}
        <FormToggleRow
          label="만 29세 이하"
          checked={form.isAge29OrUnder}
          onChange={(checked) => update("isAge29OrUnder", checked)}
        />
        <FormToggleRow
          label="만 65세 이상"
          checked={form.isAge65OrOver}
          onChange={(checked) => update("isAge65OrOver", checked)}
        />
        <FormToggleRow
          label="중증 장애인"
          checked={form.hasSevereDisability}
          onChange={(checked) => update("hasSevereDisability", checked)}
        />
        <FormToggleRow
          label="전세사기 피해자"
          checked={form.isJeonseFraudVictim}
          onChange={(checked) => update("isJeonseFraudVictim", checked)}
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
