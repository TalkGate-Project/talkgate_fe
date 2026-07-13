import type { DiagnosisFormState } from "@/types/debtRelief";

// ⚠️ 편집(정보 수정) 진입 시 폼에 채울 원본 입력값 더미 (폼 스크린샷 김민수 샘플 기준).
// 실제 API 연동 시 getDiagnosisForm은 해당 진단의 원본 제출 값을 반환한다.
export const MOCK_DIAGNOSIS_FORM: DiagnosisFormState = {
  customerName: "김민수",
  gender: "male",
  ageGroup: "40s",
  region: "seoul",
  employmentType: "self_employed",
  dependents: "2",
  spouseIncome: true,
  realEstateTypes: [],
  realEstateAmounts: {},
  financialAsset: "500_2000",
  vehicle: "500_2000",
  hasRecentAssetDisposal: false,
  debtTypes: ["bank_loan", "card_loan", "capital"],
  debtAmounts: { bank_loan: 15000, card_loan: 8000, capital: 5000 },
  overduePeriod: "3_6m",
  debtCauses: ["business_failure"],
  creditorCount: "6_10",
  hasTaxArrears: false,
  monthlyIncome: "200_300",
  housingType: "monthly_rent",
  expenses: { housing: 70, food: 40, education: 30, transportation: 15, other: 20 },
  hasPreviousApplication: true,
  previousApplicationDetail: "",
  hasGuarantor: false,
  guarantorDetail: "",
  hasOngoingLitigation: false,
  litigationDetail: "",
  counselorMemo: "",
};
