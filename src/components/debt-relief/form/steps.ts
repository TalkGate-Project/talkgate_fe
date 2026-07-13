// 진단 제출 폼의 5단계 정의
export type FormStepKey = "basic" | "assets" | "debts" | "income" | "others";

export type FormStepMeta = {
  key: FormStepKey;
  label: string; // 좌측 사이드바 짧은 라벨
  title: string; // 우측 패널 제목
  description: string; // 우측 패널 부제
};

export const FORM_STEPS: FormStepMeta[] = [
  { key: "basic", label: "기본정보", title: "기본정보", description: "고객의 인적사항을 확인합니다." },
  { key: "assets", label: "자산 현황", title: "자산 현황", description: "보유 자산의 종류와 규모를 파악합니다." },
  { key: "debts", label: "채무 현황", title: "채무 현황", description: "채무 규모와 연체 현황을 확인합니다." },
  { key: "income", label: "소득 / 지출", title: "소득 / 지출", description: "월 소득과 고정 지출을 계산합니다." },
  { key: "others", label: "기타사항", title: "기타사항", description: "신청 이력, 소송 여부 등을 확인합니다." },
];
