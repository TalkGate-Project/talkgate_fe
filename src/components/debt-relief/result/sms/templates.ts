import type { DiagnosisDetail, ProcedureStep, ProcedureStepNoteType } from "@/types/debtRelief";
import { RECOMMENDED_PROCEDURE_LABEL, PROCEDURE_GRADE_LABEL } from "@/types/debtRelief";

// 문자 모달 본문 입력창에 미리 채워 넣는 안내문 세트.
// initialBody는 발송 전 자유롭게 수정 가능하다.
export type SmsTemplate = {
  subtitle: string;
  initialBody: string;
};

const NOTE_LABEL: Record<ProcedureStepNoteType, string> = {
  warning: "⚠ 주의사항",
  info: "ℹ 참고사항",
  default: "안내",
};

function joinParts(...parts: string[]): string {
  return parts.filter((part) => part.trim().length > 0).join("\n\n");
}

// 절차안내 단계별 "문자" 버튼
export function buildProcedureStepTemplate(detail: DiagnosisDetail, step: ProcedureStep): SmsTemplate {
  const procedureShortLabel = RECOMMENDED_PROCEDURE_LABEL[detail.recommendedProcedure];

  const lines: string[] = [`[${procedureShortLabel}] ${step.step}단계. ${step.title}`];
  if (step.period && step.period !== "-") {
    lines.push(`예상 기간: ${step.period}`);
  }
  if (step.detail) {
    lines.push("", step.detail);
  }
  if (step.checklist && step.checklist.length > 0) {
    lines.push("", "■ 주요 내용", ...step.checklist.map((item) => `· ${item}`));
  }

  const noteBody = step.note ? `${NOTE_LABEL[step.noteType ?? "default"]}\n${step.note}` : "";

  return {
    subtitle: `${step.step}단계. ${step.title}`,
    initialBody: joinParts(lines.join("\n"), noteBody),
  };
}

// 자영업/프리랜서는 사업 소득 증빙, 그 외는 근로 소득 증빙 서류를 안내
function buildIncomeProofLine(occupation: string): string {
  if (occupation.includes("자영업") || occupation.includes("프리랜서")) {
    return "소득 증빙 서류 (사업자 매출장부, 세금계산서)";
  }
  return "소득 증빙 서류 (재직증명서, 최근 3개월 급여명세서)";
}

// 하단 "필요 서류 안내" 버튼
export function buildRequiredDocsTemplate(detail: DiagnosisDetail): SmsTemplate {
  const procedureLabel = RECOMMENDED_PROCEDURE_LABEL[detail.recommendedProcedure];
  const docsBlock = [
    `안녕하세요, ${detail.customerName} 고객님.`,
    "",
    `${procedureLabel} 신청을 위해 아래 서류를 준비해주시기 바랍니다.`,
    "",
    "[필수 서류]",
    "✅ 주민등록등본 1부",
    `✅ ${buildIncomeProofLine(detail.occupation)}`,
    "✅ 채무 증명서류 (각 금융기관 채무 잔액 증명서)",
    "✅ 재산 목록 (부동산·차량 없을 시 무재산 확인서)",
    "✅ 가족관계증명서 1부",
  ].join("\n");

  return {
    subtitle: "필요 서류 안내",
    initialBody: joinParts(docsBlock, "서류 준비에 어려움이 있으시면 언제든지 연락 주세요.\n\n감사합니다."),
  };
}

// 하단 "상담 일정 안내" 버튼
export function buildConsultScheduleTemplate(detail: DiagnosisDetail): SmsTemplate {
  const intro = [`안녕하세요, ${detail.customerName} 고객님.`, "", "다음 상담 일정을 안내드립니다."].join("\n");

  const scheduleBody = [
    "📅 일정: (상담 일시를 입력해주세요)",
    "📍 장소: 사무실 내방 (또는 전화 상담)",
    "⏱ 소요 시간: 약 60분",
    "",
    "상담 시 이전에 안내드린 서류를 지참해 주시면 더욱 원활한 진행이 가능합니다.",
    "",
    "일정 변경이 필요하시면 언제든지 연락 주세요.",
    "",
    "감사합니다.",
  ].join("\n");

  return { subtitle: "상담 일정 안내", initialBody: joinParts(intro, scheduleBody) };
}

// 분석결과 요약에 넣을 근거 문구 3개 선정: met → caution 순으로 우선순위를 두고,
// conditionAnalysis 자체가 상세 페이지의 "조건 분석" 섹션과 같은 원문이므로 그대로 재사용한다.
function pickAnalysisBullets(detail: DiagnosisDetail): string[] {
  const metTexts = detail.conditionAnalysis.filter((item) => item.status === "met").map((item) => item.text);
  const cautionTexts = detail.conditionAnalysis
    .filter((item) => item.status === "caution")
    .map((item) => item.text);

  const prioritized = [...metTexts.slice(0, 2), ...cautionTexts.slice(0, 1)];
  const fallback = detail.conditionAnalysis.map((item) => item.text);
  return (prioritized.length > 0 ? prioritized : fallback).slice(0, 3);
}

// 하단 "분석결과 공유" 버튼
export function buildAnalysisShareTemplate(detail: DiagnosisDetail): SmsTemplate {
  const procedureLabel = RECOMMENDED_PROCEDURE_LABEL[detail.recommendedProcedure];
  const score = detail.procedureScores.find((s) => s.procedure === detail.recommendedProcedure);
  const gradeLabel = score ? PROCEDURE_GRADE_LABEL[score.grade] : "";

  const summaryBlock = [
    `안녕하세요, ${detail.customerName} 고객님.`,
    "",
    "분석 결과를 공유드립니다.",
    "",
    `📊 ${procedureLabel} 성공 가능성: ${detail.successProbability}/100${gradeLabel ? ` (${gradeLabel})` : ""}`,
    `💡 추천 절차: ${procedureLabel}`,
    "",
    "[주요 분석 내용]",
    ...pickAnalysisBullets(detail).map((text) => `• ${text}`),
  ].join("\n");

  return {
    subtitle: "분석결과 공유",
    initialBody: joinParts(summaryBlock, "자세한 내용은 상담 시 설명드리겠습니다.\n\n감사합니다."),
  };
}

// 하단 "직접작성" 버튼 - 빈 본문으로 자유 작성
export function buildBlankTemplate(): SmsTemplate {
  return { subtitle: "직접작성", initialBody: "" };
}
