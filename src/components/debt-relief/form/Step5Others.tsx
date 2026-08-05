import { useEffect, useState } from "react";
import { showConfirmModal } from "@/providers/ConfirmModalProvider";
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
// 전제로 hidden md:block이다 — 이 스텝에 섹션이 "소송 및 채무조정 이력" 하나뿐일 때는 맞는
// 전제였지만, 새출발기금 섹션이 추가되며 모바일에서 두 섹션의 경계가 안 보이게 됐다(바로
// 다음 항목인 "이전 신청 이력 있음"↔"이전 개인회생/파산 신청 이력 있음"이 라벨까지 비슷해
// 헷갈리기 쉬움). FormSectionTitle 자체(다른 스텝도 공유)는 그대로 두고, 이 스텝에서만
// 모바일 전용 제목을 나란히 둔다.
function MobileSectionTitle({ children }: { children: string }) {
  return (
    <h3 className="md:hidden text-[16px] font-semibold tracking-[0.2px] text-foreground pb-3 border-b border-neutral-30">
      {children}
    </h3>
  );
}

/**
 * 기타사항 스텝 — Figma: 토글 행(라벨+스위치) + on 시 상세 인풋, 특이사항 textarea.
 * 카드 보더 없음. 항목 간 gap 24px.
 */
export default function Step5Others({ form, update, onClose }: Props) {
  // "'20.4~'25.6 기간 중 영위했는지"는 API에 대응 필드가 없는 로컬 전용 상태다 — 1단계
  // isOperatingBusiness(사업 영위 이력 전체)와 새출발기금 특례 기간이 항상 일치하진 않아서
  // (예: 2015~2018년에만 사업했다 접은 경우 1단계는 "예"지만 이 기간엔 "아니오"), 상담사가
  // "사업영위 해당 시 추가 확인" 박스를 볼지 말지만 이걸로 로컬 판단한다. isOperatingBusiness가
  // true가 될 때마다 "예"로 리셋되고, 저장되지 않으므로 페이지를 새로고침하면 다시 "예"로
  // 돌아온다 — 실제 제출 데이터(현재 사업 상태 등)는 이 값과 무관하게 그대로 유지된다.
  const [appliesToFreshStartFundPeriod, setAppliesToFreshStartFundPeriod] = useState(true);
  useEffect(() => {
    if (form.isOperatingBusiness) setAppliesToFreshStartFundPeriod(true);
  }, [form.isOperatingBusiness]);

  // "예"/"아니오" 버튼은 항상 둘 다 보인다. 1단계가 "아니오"인 상태에서 "예"를 누르면 —
  // 이 질문이 사실상 1단계 "사업 영위 이력"의 특례기간 한정 버전이라 — 1단계 값도 함께
  // 켜야 앞뒤가 맞는다는 걸 상담사가 놓치기 쉬워, 확인 모달로 명시하고 동의 시에만 두 값을
  // 같이 켠다. 1단계가 이미 "예"면 이 로컬 플래그만 토글하면 되니 모달 없이 바로 처리한다.
  const freshStartFundPeriodSelectedAsYes = form.isOperatingBusiness && appliesToFreshStartFundPeriod;

  const handleFreshStartFundPeriodYes = () => {
    if (form.isOperatingBusiness) {
      setAppliesToFreshStartFundPeriod(true);
      return;
    }
    showConfirmModal({
      headline: "사업 영위 이력을 함께 켤까요?",
      message:
        "1단계(기본정보)의 \"사업 영위 이력\"이 꺼져 있어요. 새출발기금 특례기간 질문에 \"예\"로 답하면 1단계 값도 함께 \"예\"로 바뀝니다.",
      confirmText: "예로 변경",
      onConfirm: () => {
        update("isOperatingBusiness", true);
        setAppliesToFreshStartFundPeriod(true);
      },
    });
  };

  const handleFreshStartFundPeriodNo = () => {
    if (form.isOperatingBusiness) setAppliesToFreshStartFundPeriod(false);
    // 1단계가 이미 "아니오"면 이 질문도 사실상 "아니오"라 더 할 일이 없다.
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
      {/* 모바일 전용 — 이 스텝은 다른 스텝과 달리 본문이 토글 목록으로 바로 시작해서, 카드
          우상단에 절대배치된 닫기(X)만 있으면 첫 항목 옆에 어색하게 떠 보인다. 타이틀 행을
          만들어 그 오른쪽 끝에 X를 두고, 카드 우상단의 절대배치 X는 이 스텝에서만 숨긴다
          (DiagnosisFormContent.tsx 참고). 새출발기금 섹션이 추가되며 이 스텝이 더 이상 "소송
          이력" 하나만 다루지 않아 스텝 이름(steps.ts의 "기타사항")으로 바꿨다. */}
      <div className="md:hidden flex items-center justify-between pb-3 border-b border-neutral-30">
        <h3 className="text-[16px] font-semibold tracking-[0.2px] text-foreground">
          기타사항
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

      <MobileSectionTitle>새출발기금</MobileSectionTitle>
      <FormSectionTitle>새출발기금</FormSectionTitle>
      <div className="mt-3 md:mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium leading-[17px] text-neutral-60">
            &apos;20.4월 ~ &apos;25.6월 중 개인사업자·소상공인으로 사업 영위한 적 있음
            (현재 고용 형태와 무관·휴업·폐업 포함)
          </p>
          {/* 예/아니오 버튼은 1단계 값과 무관하게 항상 둘 다 눌린다. 1단계가 "아니오"인 상태에서
              "예"를 누르면 확인 모달을 거쳐 1단계 값도 함께 켠다(handleFreshStartFundPeriodYes) —
              그래서 이 로컬 상태가 1단계보다 앞서 "예"가 되는 경우가 없다. */}
          <div className="flex gap-2">
            <PillButton
              label="예"
              selected={freshStartFundPeriodSelectedAsYes}
              onClick={handleFreshStartFundPeriodYes}
            />
            <PillButton
              label="아니오"
              selected={!freshStartFundPeriodSelectedAsYes}
              onClick={handleFreshStartFundPeriodNo}
            />
          </div>
        </div>

        {freshStartFundPeriodSelectedAsYes && (
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
