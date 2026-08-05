"use client";

import { useEffect, useState } from "react";
import BaseModal from "@/components/common/BaseModal";
import { RECOMMENDED_PROCEDURE_LABEL, type RecommendedProcedure } from "@/types/debtRelief";

type ProcedureGuideContent = {
  procedure: RecommendedProcedure;
  summary: string;
  eligibility: string[];
  coreRules: string[];
  reliefStructure: string;
  duration: string;
  caution: string;
};

// 6개 절차 제도 안내 원문 — 상담사가 고객에게 절차 개요를 설명할 때 참고하는 고정 문구.
const PROCEDURE_GUIDE_CONTENTS: ProcedureGuideContent[] = [
  {
    procedure: "individual_rehabilitation",
    summary: "법원을 통해 채무를 조정하고 가용소득으로 분할 변제하는 제도",
    eligibility: [
      "무담보 10억 이하 / 담보 15억 이하",
      "장래 계속적·반복적 수입 가능",
      "채무초과 상태 (채무 > 재산)",
    ],
    coreRules: [
      "변제계획안 제출 및 법원 인가 필요",
      "인가 후 채권자 추심·강제집행 제한",
      "이전 면책 후 일정 기간 재신청 제한",
    ],
    reliefStructure: "가용소득 기준 월 변제 · 변제 완료 후 잔여 채무 면책",
    duration: "통상 3~5년 (최장 5년, 실무상 최대 7년 사례 있음)",
    caution: "소득·재산 허위 신고 시 면책 취소·형사 리스크",
  },
  {
    procedure: "speedy_debt_adjustment",
    summary: "연체 초기 채무의 이자·기간을 조정하는 신용회복위원회 제도",
    eligibility: [
      "연체 30일 이하 (단기 연체)",
      "총 채무 일정 한도 이내 (무담보·담보 기준)",
      "협약 금융회사 채무 중심",
    ],
    coreRules: [
      "원금 감면 없음이 원칙",
      "이자율 인하·분할상환 중심",
      "채권기관 동의 절차 필요",
    ],
    reliefStructure: "연체이자·약정이자 조정 · 원금은 원칙적으로 전액 상환",
    duration: "최장 10년 분할상환",
    caution: "장기 연체·고액 감면이 목표면 개인워크아웃·회생과 비교 필요",
  },
  {
    procedure: "pre_workout",
    summary: "연체 31~89일 구간의 이자·기간 조정을 위한 신용회복 제도",
    eligibility: [
      "연체 31일 이상 89일 미만",
      "총 채무 15억 이하 (무담보 5억·담보 10억)",
      "협약 가입 금융기관 채무",
    ],
    coreRules: [
      "원금 감면은 원칙적으로 없음",
      "연체이자 감면·이자율 조정이 중심",
      "채권기관 동의율 충족 필요",
    ],
    reliefStructure: "연체이자 감면 · 이자율 조정 · 분할상환",
    duration: "최장 10년 분할상환",
    caution: "연체 기간이 길어지면 개인워크아웃 전환을 검토",
  },
  {
    procedure: "personal_workout",
    summary: "연체 90일 이상 채무의 이자·원금 일부를 조정하는 신용회복 제도",
    eligibility: [
      "연체 90일 이상",
      "총 채무 15억 이하",
      "최저생계비 이상 수입 또는 상환 가능성",
    ],
    coreRules: [
      "이자 전액 감면·원금 일부 감면 검토 가능",
      "사채·비협약 채무는 대상 제외될 수 있음",
      "성실 납부 시 신용 회복에 유리",
    ],
    reliefStructure: "이자 감면 + 원금 일부 감면 후 분할상환",
    duration: "최장 8~10년 분할상환 (조건에 따라 상이)",
    caution: "감면 폭·대상 채무 범위는 사전 확인 필수",
  },
  {
    procedure: "fresh_start_fund",
    summary: "코로나 시기 개인사업자·소상공인 대상 채무조정 제도",
    eligibility: [
      "'20.4~'25.6 중 개인사업자·소상공인 사업 영위",
      "부실·부실우려 요건 해당",
      "제외 업종·기신청 이력 없을 것",
    ],
    coreRules: [
      "원칙적으로 1회만 신청 가능",
      "협약 금융회사 사업·가계대출 중심",
      "사업 상태(영업·휴업·폐업)에 따라 조건 상이",
    ],
    reliefStructure: "원금·이자 조정 후 장기 분할상환 (소득·재산에 따라 감면율 변동)",
    duration: "최장 10년 분할상환",
    caution: "제외 업종·법인 폐업·기신청 여부를 반드시 확인",
  },
  {
    procedure: "bankruptcy",
    summary: "지급불능 상태에서 채무를 정리하고 면책을 받는 법원 절차",
    eligibility: [
      "지급불능 상태 (소득·재산으로 변제 곤란)",
      "채무초과",
      "면책 불허가 사유 해당 여부 검토",
    ],
    coreRules: [
      "월 변제계획보다 면책·자산 환가가 핵심",
      "일부 직종 취업 제한 가능",
      "세금·양육비 등 면책 제외 채무 존재",
    ],
    reliefStructure: "면책결정 시 잔여 채무 소멸 (제외채무 제외)",
    duration: "통상 수개월~1년 내외 (사안별 상이)",
    caution: "가용소득이 있으면 파산보다 개인회생이 권고되는 경우가 많음",
  },
];

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6L18 18"
        stroke="#B0B0B0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={direction === "left" ? "rotate-90" : "-rotate-90"}
    >
      <path
        d="M15.8332 7.5L9.99984 13.3333L4.1665 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1.5L13 12H1L7 1.5Z" fill="#EFB008" />
      <path d="M7 5.5v3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="10.2" r="0.7" fill="white" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  // 열릴 때 어느 절차 페이지부터 보여줄지 — 결과 화면에서 현재 선택된 절차로 맞춰 연다.
  initialProcedure?: RecommendedProcedure;
};

export default function ProcedureGuideModal({ open, onClose, initialProcedure }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const foundIndex = PROCEDURE_GUIDE_CONTENTS.findIndex(
      (content) => content.procedure === initialProcedure
    );
    setIndex(foundIndex >= 0 ? foundIndex : 0);
  }, [open, initialProcedure]);

  if (!open) return null;

  const total = PROCEDURE_GUIDE_CONTENTS.length;
  const content = PROCEDURE_GUIDE_CONTENTS[index];
  const canGoPrev = index > 0;
  const canGoNext = index < total - 1;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/50 dark:bg-[#000000CC]"
      disableAutoContainerSizing
      containerClassName="relative w-[92vw] max-w-[520px] md:w-[520px] max-h-[90vh] rounded-[14px] bg-white dark:bg-neutral-10 shadow-[0px_13px_61px_rgba(169,169,169,0.366)] dark:shadow-none flex flex-col overflow-hidden"
      ariaLabel="제도 안내"
    >
      <div className="flex items-center justify-between px-6 md:px-7 pt-6 pb-4 shrink-0">
        <h2 className="text-[18px] font-semibold text-ink dark:text-neutral-90">제도 안내</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="cursor-pointer grid h-6 w-6 place-items-center"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="border-t border-neutral-30 dark:border-[#4D4D4D] shrink-0" />

      <div className="min-w-0 flex-1 overflow-y-auto px-6 md:px-7 py-5 flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[20px] font-bold leading-6 tracking-[-0.02em] text-foreground">
            {RECOMMENDED_PROCEDURE_LABEL[content.procedure]}
          </h3>
          <span className="shrink-0 text-[13px] font-medium leading-4 text-neutral-60">
            {index + 1}/{total}
          </span>
        </div>
        <p className="text-[14px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">
          {content.summary}
        </p>

        <div>
          <p className="text-[13px] font-semibold leading-4 tracking-[-0.02em] text-foreground mb-1.5">
            대상 / 자격
          </p>
          <ul className="flex flex-col gap-1">
            {content.eligibility.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60"
              >
                · {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-semibold leading-4 tracking-[-0.02em] text-foreground mb-1.5">
            핵심 규칙
          </p>
          <ul className="flex flex-col gap-1">
            {content.coreRules.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60"
              >
                · {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-semibold leading-4 tracking-[-0.02em] text-foreground mb-1.5">
            감면·변제 구조
          </p>
          <p className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">
            {content.reliefStructure}
          </p>
        </div>

        <div>
          <p className="text-[13px] font-semibold leading-4 tracking-[-0.02em] text-foreground mb-1.5">
            기간
          </p>
          <p className="text-[13px] font-medium leading-5 tracking-[-0.02em] text-neutral-60">
            {content.duration}
          </p>
        </div>

        <div className="inline-flex items-start gap-1.5 max-w-full min-h-7 px-3 py-1.5 rounded-[5px] bg-warning-10 dark:bg-[rgb(var(--color-amber-600-rgb)/0.3)]">
          <WarningIcon />
          <span className="text-[13px] font-medium leading-5 tracking-[-0.02em] opacity-80 text-warning-100 dark:text-warning-40">
            {content.caution}
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-30 dark:border-[#4D4D4D] shrink-0" />
      <div className="flex items-center justify-between px-6 md:px-7 py-3.5 shrink-0">
        <button
          type="button"
          onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
          disabled={!canGoPrev}
          className={`inline-flex items-center gap-1 h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] bg-white dark:bg-neutral-10 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-ink dark:text-neutral-90 ${
            canGoPrev ? "cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-20" : "opacity-40 cursor-not-allowed"
          }`}
        >
          <ChevronIcon direction="left" />
          이전
        </button>

        <div className="flex items-center gap-1.5">
          {PROCEDURE_GUIDE_CONTENTS.map((item, itemIndex) => (
            <button
              key={item.procedure}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`${RECOMMENDED_PROCEDURE_LABEL[item.procedure]} 안내로 이동`}
              aria-current={itemIndex === index}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                itemIndex === index ? "w-5 bg-neutral-90 dark:bg-neutral-90" : "w-2 bg-neutral-30"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIndex((prev) => Math.min(total - 1, prev + 1))}
          disabled={!canGoNext}
          className={`inline-flex items-center gap-1 h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-[#4D4D4D] bg-white dark:bg-neutral-10 text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-ink dark:text-neutral-90 ${
            canGoNext ? "cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-20" : "opacity-40 cursor-not-allowed"
          }`}
        >
          다음
          <ChevronIcon direction="right" />
        </button>
      </div>
    </BaseModal>
  );
}
