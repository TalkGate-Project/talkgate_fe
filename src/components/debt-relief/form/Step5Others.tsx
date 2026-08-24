import type { AnalysisFreshStartFundInsolvencyReason } from "@/types/analysis";
import {
  BUSINESS_OPERATION_STATUS_OPTIONS,
  FRESH_START_FUND_INSOLVENCY_REASON_OPTIONS,
  SPECIAL_ELIGIBILITY_OPTIONS,
  type DiagnosisFormState,
  type SpecialEligibilityType,
} from "@/types/debtRelief";
import { FormField, FormSectionTitle } from "./FormControls";
import { FormToggleRow } from "./FormToggle";
import { PillButton, PillMultiSelect, PillSelect } from "./PillSelect";

// 만 29세 이하/만 65세 이상은 동시 선택 불가 — 서로의 상대값
const AGE_EXCLUSIVE_PAIR: Partial<Record<SpecialEligibilityType, SpecialEligibilityType>> = {
  age_29_or_under: "age_65_or_over",
  age_65_or_over: "age_29_or_under",
};

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

// FormSectionTitle(FormControls.tsx)은 "데스크톱만, 모바일은 상단 드로어 스텝명이 대신함"
// 전제로 hidden lg:block이다 — 이 스텝에 섹션이 "소송 및 채무조정 이력" 하나뿐일 때는 맞는
// 전제였지만, 새출발기금 섹션이 추가되며 모바일에서 두 섹션의 경계가 안 보이게 됐다(바로
// 다음 항목인 "이전 신청 이력 있음"↔"이전 개인회생/파산 신청 이력 있음"이 라벨까지 비슷해
// 헷갈리기 쉬움). FormSectionTitle 자체(다른 스텝도 공유)는 그대로 두고, 이 스텝에서만
// 모바일 전용 제목을 나란히 둔다.
function MobileSectionTitle({ children, onClose }: { children: string; onClose?: () => void }) {
  return (
    <div className="lg:hidden flex items-center justify-between gap-3 border-b border-neutral-30 pb-3">
      <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground">
        {children}
      </h3>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center text-foreground hover:opacity-70"
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
      ) : null}
    </div>
  );
}

/**
 * 기타사항 스텝 — Figma: 토글 행(라벨+스위치) + on 시 상세 인풋, 특이사항 textarea.
 * 카드 보더 없음. 항목 간 gap 24px.
 */
export default function Step5Others({ form, update, onClose }: Props) {
  // 사업 영위 이력(isOperatingBusiness)은 5단계에서만 관리한다 — 예/아니오가 API 게이트를
  // 직접 토글하고, "예"일 때만 아래 상세 4종을 노출한다.
  const handleFreshStartFundPeriodYes = () => {
    update("isOperatingBusiness", true);
  };

  const handleFreshStartFundPeriodNo = () => {
    update("isOperatingBusiness", false);
  };

  const handleSpecialEligibilityChange = (next: SpecialEligibilityType[]) => {
    const added = next.find((item) => !form.specialEligibility.includes(item));
    const conflicting = added ? AGE_EXCLUSIVE_PAIR[added] : undefined;
    update("specialEligibility", conflicting ? next.filter((item) => item !== conflicting) : next);
  };

  // "해당없음"은 다른 부실사유와 동시 선택 불가 — 어느 한쪽을 새로 고르면 반대쪽을 모두 걷어낸다.
  const handleInsolvencyReasonsChange = (next: AnalysisFreshStartFundInsolvencyReason[]) => {
    const added = next.find((item) => !form.freshStartFundInsolvencyReasons.includes(item));
    if (added === "not_applicable") {
      update("freshStartFundInsolvencyReasons", ["not_applicable"]);
      return;
    }
    if (added) {
      update(
        "freshStartFundInsolvencyReasons",
        next.filter((item) => item !== "not_applicable")
      );
      return;
    }
    update("freshStartFundInsolvencyReasons", next);
  };

  return (
    <div>
      {/* 모바일 상단 드로어가 이미 스텝명 "기타사항"을 보여주므로 본문은 실제 첫 섹션부터 시작한다.
          카드 우상단에 따로 떠 있던 닫기 버튼은 첫 섹션 제목 행에 배치한다. */}
      <MobileSectionTitle onClose={onClose}>새출발기금</MobileSectionTitle>
      <FormSectionTitle>새출발기금</FormSectionTitle>
      <div className="mt-3 lg:mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60">
            &apos;20.4월 ~ &apos;25.6월 중 개인사업자·소상공인으로 사업 영위한 적 있음
            (현재 고용 형태와 무관·휴업·폐업 포함)
          </p>
          <div className="flex gap-2">
            <PillButton
              label="예"
              selected={form.isOperatingBusiness}
              onClick={handleFreshStartFundPeriodYes}
            />
            <PillButton
              label="아니오"
              selected={!form.isOperatingBusiness}
              onClick={handleFreshStartFundPeriodNo}
            />
          </div>
        </div>

        {form.isOperatingBusiness && (
          <div className="rounded-[14px] border border-neutral-30 overflow-hidden">
            {/* Figma: 헤더 스트립(위쪽만 라운드)만 회색, divider 아래 본문은 흰 배경 —
                DebtHistoryCard.tsx와 동일한 헤더/바디 분리 패턴 */}
            <div className="bg-neutral-10 px-5 py-3.5 border-b border-neutral-30">
              <h4 className="text-[14px] font-semibold text-neutral-70">사업영위 해당 시 추가 확인</h4>
            </div>
            <div className="bg-card px-5 py-5 flex flex-col gap-5">
              <FormField label="현재 사업 상태" filled={form.businessOperationStatus !== null}>
                <PillSelect
                  options={BUSINESS_OPERATION_STATUS_OPTIONS}
                  value={form.businessOperationStatus}
                  onChange={(value) => update("businessOperationStatus", value)}
                />
              </FormField>

              <FormField
                label="부실·부실우려 해당 여부"
                hint="(중복선택 가능)"
                filled={form.freshStartFundInsolvencyReasons.length > 0}
              >
                <PillMultiSelect
                  options={FRESH_START_FUND_INSOLVENCY_REASON_OPTIONS}
                  value={form.freshStartFundInsolvencyReasons}
                  onChange={handleInsolvencyReasonsChange}
                />
              </FormField>

              <div className="flex flex-col gap-3">
                <span className="text-[14px] font-medium leading-[17px] text-foreground">
                  결격·이력 확인
                </span>
                <FormToggleRow
                  label="제외 업종 해당 (부동산 임대업, 법무·회계·세무 등)"
                  checked={form.isExcludedIndustryForFreshStartFund}
                  onChange={(checked) => update("isExcludedIndustryForFreshStartFund", checked)}
                  wideGap
                />
                <FormToggleRow
                  label="이전 신청 이력 있음 (원칙적으로 1회만 신청 가능)"
                  checked={form.hasPreviousFreshStartFundApplication}
                  onChange={(checked) => update("hasPreviousFreshStartFundApplication", checked)}
                  wideGap
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <MobileSectionTitle>소송 및 채무조정 이력</MobileSectionTitle>
        <FormSectionTitle>소송 및 채무조정 이력</FormSectionTitle>
      </div>

      <div className="mt-3 lg:mt-6 flex flex-col gap-6">
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

        {/* 2026-07-24 피드백: 토글 4종 → 중복선택 가능한 pill로 변경. 만 29세 이하/만 65세 이상은
            동시 선택 불가(handleSpecialEligibilityChange에서 상호배타 처리) */}
        <FormField label="특례 대상" hint="(중복선택 가능)" filled={form.specialEligibility.length > 0}>
          <PillMultiSelect
            options={SPECIAL_ELIGIBILITY_OPTIONS}
            value={form.specialEligibility}
            onChange={handleSpecialEligibilityChange}
          />
        </FormField>

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
