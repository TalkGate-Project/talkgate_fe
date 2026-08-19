import type { RecommendedProcedure } from "@/types/debtRelief";

export type ProcedureGuideNoteType = "info" | "warning" | "tip";

export interface ProcedureGuideNote {
  type: ProcedureGuideNoteType;
  text: string;
}

export interface ProcedureGuideStep {
  no: string;
  title: string;
  duration: string;
  description: string;
  bullets: string[];
  notes?: ProcedureGuideNote[];
}

export interface ProcedureGuideListItem {
  label: string;
  desc: string;
}

export interface ProcedureGuideConditionItem {
  label: string;
  value: string;
}

export interface ProcedureGuideDetail {
  key: RecommendedProcedure;
  tabLabel: string;
  summary: {
    operator: string;
    duration: string;
    principalAdjustment: string;
    interestReduction: string;
  };
  target: string;
  incomeRequired: boolean;
  eligibleApplicable: ProcedureGuideListItem[];
  eligibleExcluded: ProcedureGuideListItem[];
  debtConditions: ProcedureGuideConditionItem[];
  effects: ProcedureGuideListItem[];
  warnings: string[];
  steps: ProcedureGuideStep[];
}

const PROCEDURE_GUIDE_DATA_URL = "/data/debt-relief/procedure-guide.json";

// 채무조정 6개 제도의 절차·조건·효과 원문 콘텐츠는 코드가 아닌 별도 JSON으로 관리한다.
// 비개발자가 문구를 직접 수정할 수 있고, 추후 백엔드 API로 전환할 때는 이 함수 내부만
// apiClient 호출로 교체하면 되며 호출부(컴포넌트)는 변경할 필요가 없다.
export async function fetchProcedureGuideDetails(): Promise<ProcedureGuideDetail[]> {
  const res = await fetch(PROCEDURE_GUIDE_DATA_URL);
  if (!res.ok) {
    throw new Error(`Failed to load procedure guide data: ${res.status}`);
  }
  return res.json();
}

export const PROCEDURE_GUIDE_COMPARISON_ROWS: {
  label: string;
  getValue: (item: ProcedureGuideDetail) => string;
  isIncomeRow?: boolean;
}[] = [
  { label: "운영 기관", getValue: (item) => item.summary.operator },
  { label: "소요 기간", getValue: (item) => item.summary.duration },
  { label: "원금 조정", getValue: (item) => item.summary.principalAdjustment },
  { label: "이자 감면", getValue: (item) => item.summary.interestReduction },
  { label: "소득 요건", getValue: (item) => (item.incomeRequired ? "필요" : "불필요"), isIncomeRow: true },
  { label: "절차 단계 수", getValue: (item) => `${item.steps.length}단계` },
  { label: "대상자", getValue: (item) => item.target },
];
