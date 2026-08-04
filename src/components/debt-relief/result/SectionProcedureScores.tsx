"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONDITION_STATUS_LABEL,
  PROCEDURE_GRADE_LABEL,
  type ConditionItem,
  type ConditionStatus,
  type DiagnosisDetail,
  type ProcedureGrade,
  type ProcedureScore,
  type RecommendedProcedure,
} from "@/types/debtRelief";
import { scoreToGrade } from "@/services/debtRelief";
import DisclaimerInfoTooltip from "./DisclaimerInfoTooltip";

// 신용회복 3종(신속채무조정/프리워크아웃/개인워크아웃)은 API에 자체 대표 점수가 없어,
// 결과 화면에서만 "신용회복" 카드 + 플로팅 드롭다운으로 묶어 보여준다. 화면 전용 그룹핑이라
// 여기서만 쓴다 — 절차 전환 모달(ProcedureSelectModal 등)은 여전히 flat한 6개 절차 중
// 하나를 직접 골라야 하므로 detail.procedureScores 원본은 건드리지 않는다.
// 그리드에는 항상 4장(신용회복·개인회생·개인파산·새출발기금)만 두고, 하위 3종은 드롭다운에만 둔다.
const CREDIT_RECOVERY_GROUP: readonly RecommendedProcedure[] = [
  "speedy_debt_adjustment",
  "pre_workout",
  "personal_workout",
];
const CREDIT_RECOVERY_LABEL = "신용회복";

type ScoreCardEntry =
  | { kind: "single"; score: ProcedureScore }
  | {
      kind: "group";
      label: string;
      members: ProcedureScore[];
      // 하위 절차 중 최고점을 대표값으로 쓴다 — "이 카테고리에서 가장 유리한 옵션"을 보여주는 편이
      // 평균/최저보다 상담 맥락에 맞다고 판단(2026-08-04 확인).
      representativeScore: number;
      grade: ProcedureGrade;
      recommended: boolean;
    };

function buildScoreCardEntries(procedureScores: ProcedureScore[]): ScoreCardEntry[] {
  const groupMembers = procedureScores.filter((score) =>
    CREDIT_RECOVERY_GROUP.includes(score.procedure)
  );
  const singleScores = procedureScores.filter(
    (score) => !CREDIT_RECOVERY_GROUP.includes(score.procedure)
  );

  const entries: ScoreCardEntry[] = singleScores.map((score) => ({ kind: "single", score }));

  if (groupMembers.length > 0) {
    const best = groupMembers.reduce((max, score) => (score.score > max.score ? score : max));
    entries.push({
      kind: "group",
      label: CREDIT_RECOVERY_LABEL,
      members: groupMembers,
      representativeScore: best.score,
      grade: scoreToGrade(best.score),
      recommended: groupMembers.some((score) => score.recommended),
    });
  }

  // 추천 절차(또는 추천이 속한 그룹)가 항상 먼저 오고, 그다음은 대표점수 내림차순.
  return entries.sort((a, b) => {
    const aRecommended = a.kind === "single" ? a.score.recommended : a.recommended;
    const bRecommended = b.kind === "single" ? b.score.recommended : b.recommended;
    const aScore = a.kind === "single" ? a.score.score : a.representativeScore;
    const bScore = b.kind === "single" ? b.score.score : b.representativeScore;
    return Number(bRecommended) - Number(aRecommended) || bScore - aScore;
  });
}

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

export function ScoreRow({
  score,
  isSelected,
  onSelect,
  // 피그마 드롭다운 하위 행: 44px / 흰 배경(#FFF) / fill Light-40.
  compact = false,
}: {
  score: ProcedureScore;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`px-3 md:px-6 rounded-[12px] flex items-center gap-2 md:gap-3 w-full text-left cursor-pointer transition-colors ${
        compact ? "h-11" : "h-[56px]"
      } ${
        isSelected
          ? "bg-neutral-0 border border-neutral-80"
          : compact
            ? "bg-neutral-0"
            : "bg-neutral-10"
      }`}
    >
      <div
        className={`shrink-0 flex items-center gap-1.5 ${
          compact ? "w-[88px] md:w-[104px]" : "w-[88px] md:w-[120px]"
        }`}
      >
        <span
          className={`text-[13px] leading-4 tracking-[-0.02em] text-neutral-100 truncate ${
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
          className={`h-full rounded-l-full ${
            isSelected && !compact ? "bg-neutral-70" : "bg-neutral-40"
          }`}
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
          isSelected ? "font-semibold text-neutral-100" : "font-medium text-neutral-80"
        }`}
      >
        {PROCEDURE_GRADE_LABEL[score.grade]}
      </span>
    </button>
  );
}

// 신용회복 그룹 헤더 — 56px 행. 닫힘/열림(패널 상단) 공용.
// 피그마: 열림 시 caret rotate(-180deg)·패널과 같은 Light-10 배경, 닫힘 시 그리드 카드.
function GroupScoreHeader({
  label,
  score,
  grade,
  recommended,
  open,
  highlighted,
  onToggle,
  // 플로팅 패널 상단에 붙을 때는 패널 배경을 이어받고 테두리를 쓰지 않는다.
  inPanel = false,
}: {
  label: string;
  score: number;
  grade: ProcedureGrade;
  recommended: boolean;
  open: boolean;
  highlighted: boolean;
  onToggle: () => void;
  inPanel?: boolean;
}) {
  const surfaceClass = inPanel
    ? "bg-transparent rounded-t-[12px]"
    : highlighted
      ? "bg-neutral-0 border border-neutral-80 rounded-[12px]"
      : "bg-neutral-10 rounded-[12px]";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-haspopup="listbox"
      className={`h-[56px] px-3 md:px-6 flex items-center gap-2 md:gap-3 w-full text-left cursor-pointer transition-colors ${surfaceClass}`}
    >
      <svg
        width="10"
        height="8"
        viewBox="0 0 10 8"
        fill="none"
        aria-hidden
        className={`shrink-0 transition-transform ${
          open ? "rotate-180 text-neutral-100" : "-rotate-90 text-neutral-60"
        }`}
      >
        <path d="M5 8L0 0H10L5 8Z" fill="currentColor" />
      </svg>

      <div className="w-[72px] md:w-[104px] shrink-0 flex items-center gap-1.5">
        <span
          className={`text-[13px] leading-4 tracking-[-0.02em] text-neutral-100 truncate ${
            highlighted || inPanel ? "font-semibold" : "font-medium"
          }`}
        >
          {label}
        </span>
        {recommended && (
          <span className="inline-flex items-center justify-center h-[17px] px-1 rounded-[4px] bg-neutral-90 text-neutral-0 text-[11px] font-medium leading-[13px] shrink-0">
            추천
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 h-2 rounded-full bg-neutral-30 overflow-hidden">
        <div
          className={`h-full rounded-l-full ${
            highlighted && !inPanel ? "bg-neutral-70" : "bg-neutral-40"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex items-baseline gap-0.5 shrink-0 w-[42px] md:w-[49px] justify-end">
        <span className="text-[16px] font-semibold leading-[19px] text-neutral-90 text-right">
          {score}
        </span>
        <span className="text-[12px] font-medium leading-[14px] tracking-[-0.02em] text-neutral-60">
          /100
        </span>
      </div>

      <span
        className={`w-6 shrink-0 text-[14px] leading-[17px] tracking-[-0.02em] text-right ${
          highlighted || inPanel
            ? "font-semibold text-neutral-100"
            : "font-medium text-neutral-80"
        }`}
      >
        {PROCEDURE_GRADE_LABEL[grade]}
      </span>
    </button>
  );
}

function CreditRecoveryGroupCard({
  entry,
  selectedProcedure,
  onSelectMember,
  open,
  onOpenChange,
}: {
  entry: Extract<ScoreCardEntry, { kind: "group" }>;
  selectedProcedure: RecommendedProcedure;
  onSelectMember: (procedure: RecommendedProcedure) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const memberSelected = entry.members.some(
    (member) => member.procedure === selectedProcedure
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className={`relative ${open ? "z-20" : ""}`}>
      {/* 그리드 높이 유지용 앵커. 열리면 패널이 같은 자리를 덮으므로 시각적으로만 숨긴다. */}
      <div className={open ? "invisible" : undefined} aria-hidden={open}>
        <GroupScoreHeader
          label={entry.label}
          score={entry.representativeScore}
          grade={entry.grade}
          recommended={entry.recommended}
          open={false}
          highlighted={memberSelected}
          onToggle={() => onOpenChange(true)}
        />
      </div>

      {open && (
        <div
          role="listbox"
          aria-label={`${entry.label} 절차 선택`}
          className="absolute left-0 right-0 top-0 z-30 rounded-[12px] bg-neutral-10 shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:shadow-[0px_8px_12px_rgba(0,0,0,0.4)]"
        >
          <GroupScoreHeader
            label={entry.label}
            score={entry.representativeScore}
            grade={entry.grade}
            recommended={entry.recommended}
            open
            highlighted
            inPanel
            onToggle={() => onOpenChange(false)}
          />
          {/* 피그마: 패널 620×212 / 흰 행 604×44 → 좌우·상단 8px, 행간 8px */}
          <div className="flex flex-col gap-2 px-2 pt-2 pb-2">
            {entry.members.map((member) => (
              <ScoreRow
                key={member.procedure}
                score={member}
                isSelected={member.procedure === selectedProcedure}
                compact
                onSelect={() => {
                  onSelectMember(member.procedure);
                  onOpenChange(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SectionProcedureScores({
  detail,
  selectedProcedure,
  onSelectProcedure,
}: {
  detail: DiagnosisDetail;
  // "예상 변제 계획" 섹션이 같은 선택 상태를 참조해 내용을 바꿔야 해서(ResultDetailContent.tsx
  // 참고) 부모가 상태를 소유하고 여기서는 값과 변경 함수만 받는다.
  selectedProcedure: RecommendedProcedure;
  onSelectProcedure: (procedure: RecommendedProcedure) => void;
}) {
  // 하위 절차는 플로팅 드롭다운으로만 보여서 그리드 높이를 밀지 않는다.
  // 기본은 닫힘 — 헤더 선택 스타일로 신용회복 그룹 선택 여부를 표시한다.
  const [creditRecoveryOpen, setCreditRecoveryOpen] = useState(false);

  const selectedScore = detail.procedureScores.find(
    (score) => score.procedure === selectedProcedure
  );
  const selectedConditionAnalysis =
    detail.conditionAnalysisByProcedure[selectedProcedure] ?? detail.conditionAnalysis;

  const cardEntries = buildScoreCardEntries(detail.procedureScores);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* 절차별 성공 가능성 타이틀 */}
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

      {/* 절차 점수 카드: 항상 최대 4장(신용회복 그룹 + 단일 절차 3종).
          추천 절차(속한 그룹 포함)가 먼저 오고, 신용회복 하위는 플로팅 드롭다운으로만 연다. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {cardEntries.map((entry) =>
          entry.kind === "single" ? (
            <ScoreRow
              key={entry.score.procedure}
              score={entry.score}
              isSelected={entry.score.procedure === selectedProcedure}
              onSelect={() => {
                setCreditRecoveryOpen(false);
                onSelectProcedure(entry.score.procedure);
              }}
            />
          ) : (
            <CreditRecoveryGroupCard
              key="credit-recovery"
              entry={entry}
              selectedProcedure={selectedProcedure}
              onSelectMember={onSelectProcedure}
              open={creditRecoveryOpen}
              onOpenChange={setCreditRecoveryOpen}
            />
          )
        )}
      </div>

      {/* 조건 분석 카드 */}
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
            const showBottomBorder =
              !isLast || selectedConditionAnalysis.length < 5;
            return (
              <li
                key={index}
                className={`flex items-center gap-2 px-4 md:px-5 py-[13px] ${
                  showBottomBorder ? "border-b border-neutral-30" : ""
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
