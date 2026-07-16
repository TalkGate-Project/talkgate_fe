"use client";

import { useState } from "react";
import {
  CONDITION_STATUS_LABEL,
  PROCEDURE_GRADE_LABEL,
  type ConditionItem,
  type ConditionStatus,
  type DiagnosisDetail,
  type ProcedureScore,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";

const CONDITION_TEXT_COLOR: Record<ConditionStatus, string> = {
  met: "text-neutral-90",
  caution: "text-warning-100 dark:text-warning-40",
  risk: "text-danger-100 dark:text-danger-40",
};

// 다크모드는 SummaryCards.tsx의 PROCEDURE_CHIP_STYLE / DiagnosisBadges.tsx와 동일한 chip 스펙 값으로 통일
const STATUS_CHIP: Record<ConditionStatus, string> = {
  met: "bg-primary-10 text-primary-80 dark:bg-primary-10/90 dark:text-primary-100",
  caution: "bg-warning-10 text-warning-60 dark:bg-warning-10/90 dark:text-warning-80",
  risk: "bg-danger-10 text-danger-40 dark:bg-danger-10/90 dark:text-danger-80",
};

function ConditionIcon({ status }: { status: ConditionStatus }) {
  if (status === "met") {
    return (
      <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8" fill="#00E272" />
        <path
          d="M6.5 10.2l2.2 2.2 4.8-4.8"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "caution") {
    return (
      <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 2.5L18 16.5H2L10 2.5Z" fill="#EFB008" />
        <path d="M10 8v4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="14.2" r="1" fill="white" />
      </svg>
    );
  }
  return (
    <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="#B01212" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ScoreRow({
  score,
  isSelected,
  onSelect,
}: {
  score: ProcedureScore;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`h-[56px] px-3 md:px-6 rounded-[12px] flex items-center gap-2 md:gap-3 w-full text-left cursor-pointer transition-colors ${
        isSelected ? "bg-neutral-0 border border-neutral-80" : "bg-neutral-10"
      }`}
    >
      <div className="w-[88px] md:w-[120px] shrink-0 flex items-center gap-1.5">
        <span
          className={`text-[13px] leading-4 tracking-[-0.02em] text-foreground truncate ${
            isSelected ? "font-semibold" : "font-medium"
          }`}
        >
          {score.label}
        </span>
        {score.recommended && (
          <span className="inline-flex items-center justify-center h-[17px] px-1 rounded-[4px] bg-neutral-90 text-neutral-0 text-[11px] font-medium leading-[13px] shrink-0">
            추천
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 h-2 rounded-full bg-neutral-30 overflow-hidden">
        <div
          className={`h-full rounded-l-full ${isSelected ? "bg-neutral-70" : "bg-neutral-40"}`}
          style={{ width: `${score.score}%` }}
        />
      </div>

      <div className="flex items-baseline gap-0.5 shrink-0 w-[42px] md:w-[49px] justify-end">
        <span className="text-[16px] font-semibold leading-[19px] text-neutral-90 text-right">
          {score.score}
        </span>
        <span className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-60">
          /100
        </span>
      </div>

      <span
        className={`w-6 shrink-0 text-[14px] leading-[17px] tracking-[-0.02em] text-right ${
          isSelected ? "font-semibold text-foreground" : "font-medium text-neutral-80"
        }`}
      >
        {PROCEDURE_GRADE_LABEL[score.grade]}
      </span>
    </button>
  );
}

export default function SectionProcedureScores({ detail }: { detail: DiagnosisDetail }) {
  const [selectedProcedure, setSelectedProcedure] = useState<RecommendedProcedure>(
    detail.recommendedProcedure
  );

  const selectedScore = detail.procedureScores.find(
    (score) => score.procedure === selectedProcedure
  );
  const selectedConditionAnalysis =
    detail.conditionAnalysisByProcedure[selectedProcedure] ?? detail.conditionAnalysis;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-9">
      {/* 좌: 절차별 성공 가능성 */}
      <div className="min-w-0 flex flex-col">
        <div>
          <div className="flex items-center gap-1">
            <h2 className="inline-flex h-6 items-center text-[16px] font-semibold leading-none tracking-[0.2px] text-foreground">
              절차별 성공 가능성
            </h2>
            <DisclaimerInfoTooltip label="절차별 성공 가능성 안내">
              성공 가능성 점수는 입력 정보 기준{" "}
              <span className="font-extrabold">AI 참고 지표</span>이며,
              <br />
              법원·채권자 심사 결과를 보장하지 않습니다.
            </DisclaimerInfoTooltip>
          </div>
          <div className="mt-3 border-t border-neutral-30" />
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3 md:gap-5 mt-5 md:mt-8">
          {detail.procedureScores.map((score) => (
            <ScoreRow
              key={score.procedure}
              score={score}
              isSelected={score.procedure === selectedProcedure}
              onSelect={() => setSelectedProcedure(score.procedure)}
            />
          ))}
        </div>
      </div>

      {/* 우: 조건 분석 카드 */}
      <div className="min-w-0 rounded-[12px] border border-neutral-30 overflow-hidden">
        <div className="min-h-[42px] px-4 md:px-5 py-2 md:py-0 bg-neutral-10 flex flex-wrap items-center justify-between gap-2 md:gap-3">
          <h3 className="text-[14px] font-semibold leading-[17px] tracking-[-0.02em] text-foreground">
            {selectedScore?.label ?? detail.recommendation.title} 조건 분석
          </h3>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {(["met", "caution", "risk"] as ConditionStatus[]).map((status) => (
              <span
                key={status}
                className={`inline-flex items-center justify-center h-[22px] px-2 md:px-3 rounded-full text-[12px] font-medium leading-[14px] opacity-80 ${STATUS_CHIP[status]}`}
              >
                {CONDITION_STATUS_LABEL[status]}
              </span>
            ))}
          </div>
        </div>

        <ul>
          {selectedConditionAnalysis.map((item: ConditionItem, index) => {
            const isLast = index === selectedConditionAnalysis.length - 1;
            return (
              <li
                key={index}
                className={`flex items-center gap-2 px-4 md:px-5 py-[13px] ${
                  isLast ? "" : "border-b border-neutral-30"
                }`}
              >
                <ConditionIcon status={item.status} />
                <span
                  className={`text-[14px] font-medium leading-[17px] opacity-80 ${CONDITION_TEXT_COLOR[item.status]}`}
                >
                  {item.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
