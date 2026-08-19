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

// 채무조정 6개 제도의 절차·조건·효과 원문 데이터. 백엔드 샘플 페이지(sp.talkgate.im/checklist/procedure)의
// 콘텐츠를 그대로 옮겨왔다 — 법률/정책 정보라 임의 요약·재구성 없이 원문 유지.
export const PROCEDURE_GUIDE_DETAILS: ProcedureGuideDetail[] = [
  {
    key: "individual_rehabilitation",
    tabLabel: "개인회생",
    summary: {
      operator: "법원",
      duration: "42~54개월",
      principalAdjustment: "원금 30~70% 감면",
      interestReduction: "이자 100% 면제",
    },
    target: "지속적 소득이 있으나 현재 채무 상환이 불가능한 개인",
    incomeRequired: true,
    eligibleApplicable: [
      { label: "소득 요건", desc: "최저생계비를 초과하는 지속적 수입 (급여·사업소득·연금 등)" },
      { label: "무담보 채무", desc: "10억 원 이하" },
      { label: "담보 채무", desc: "15억 원 이하" },
      { label: "채무 유형", desc: "사금융·세금 체납 포함 가능 (법원 절차로 포괄)" },
      { label: "재산 보유", desc: "차량·부동산 유지 가능 (청산가치 이상 변제 조건)" },
    ],
    eligibleExcluded: [
      { label: "면책 후 5년 미경과", desc: "직전 면책결정일로부터 5년 이내 재신청 불가" },
      { label: "도박·사기·낭비 채무", desc: "면책 불허가 사유 — 법무사 검토 필수" },
      { label: "소득 無", desc: "최저생계비 이하 또는 소득 없는 경우 신청 어려움" },
    ],
    debtConditions: [
      { label: "무담보 채무 한도", value: "10억 원" },
      { label: "담보 채무 한도", value: "15억 원" },
      { label: "포함 가능 채무", value: "은행·카드·캐피탈·사금융·세금 체납" },
      { label: "제외 채무", value: "양육비, 벌금, 고의 손해배상 등" },
      { label: "이자 처리", value: "전액 면제" },
      { label: "원금 감면 폭", value: "청산가치 이상 납부 조건으로 결정 (통상 30~70%)" },
    ],
    effects: [
      { label: "추심 즉시 중단", desc: "금지·중지명령으로 신청 시점부터 전화·압류 등 추심 행위 정지" },
      { label: "이자 전액 면제", desc: "인가결정 후 확정된 원금 범위 내에서 이자 추가 발생 없음" },
      { label: "채권자 동의 불필요", desc: "법원이 직권으로 변제계획 인가 가능 — 채권자 반대에도 확정" },
      { label: "변제 완료 후 면책", desc: "계획대로 납부 완료 시 잔여 채무 전액 면제" },
    ],
    warnings: [
      "변제 중단·미납 누적 시 인가취소로 원채무 부활",
      "재산 은닉·허위 신고 적발 시 면책 불허가 및 형사처벌 위험",
      "면책 후 7년간 신용불량 기록 유지 (신용정보 등록)",
    ],
    steps: [
      {
        no: "01",
        title: "신청서 작성 및 접수",
        duration: "1~2주",
        description: "법원에 개인회생 신청서와 첨부 서류를 제출하고 사건번호를 부여받는 단계입니다.",
        bullets: [
          "개인회생 신청서",
          "채권자 목록",
          "재산 목록",
          "수입·지출 목록",
          "변제계획안",
          "소득 증빙자료 (급여명세서, 세금계산서 등)",
        ],
        notes: [{ type: "info", text: "접수 후 법원 사건번호가 부여됩니다." }],
      },
      {
        no: "02",
        title: "금지명령·중지명령",
        duration: "신청 후 1~4주",
        description: "신청 후 법원 판단에 따라 채권자의 강제집행 등을 막는 명령이 내려질 수 있습니다.",
        bullets: ["채권자의 전화·서면 독촉 중지", "급여·통장 압류 중지", "강제집행 정지"],
        notes: [
          {
            type: "warning",
            text: "금지명령은 모든 사건에서 자동으로 인정되는 것은 아닙니다. 법원의 재량에 따라 발령 여부가 결정됩니다.",
          },
        ],
      },
      {
        no: "03",
        title: "보정권고·보정명령",
        duration: "1~3개월",
        description: "법원이 서류를 검토하면서 추가 자료를 요구하는 단계로, 실무에서 가장 중요한 단계입니다.",
        bullets: [
          "최근 대출 사용처 소명",
          "카드 사용내역 제출",
          "재산 관계 확인 자료",
          "소득 확인 서류 (추가)",
          "배우자 재산 관련 자료",
        ],
        notes: [
          { type: "warning", text: "보정 기한을 놓치면 사건이 기각될 수 있으므로 기한 관리가 매우 중요합니다." },
        ],
      },
      {
        no: "04",
        title: "개시결정",
        duration: "1개월 내외",
        description: "법원이 개인회생 절차를 진행하기로 결정하는 단계입니다.",
        bullets: ["정식 회생 절차 시작", "채권자 이의기간 진행 (개시결정일로부터 약 2개월)", "개시결정 공고"],
      },
      {
        no: "05",
        title: "채권자집회",
        duration: "1~2개월",
        description: "채무자가 변제계획의 요지를 직접 설명하고 채권자가 이의를 진술할 수 있는 절차입니다.",
        bullets: [
          "채무자 본인 출석 필수 (대리 출석 불가)",
          "변제계획안 요지 설명",
          "채권자의 이의진술 (이의진술서 제출로 갈음 가능)",
          "변제금 수령용 계좌번호 신고",
        ],
        notes: [
          { type: "warning", text: "정당한 사유 없이 불출석하거나 설명을 거부하면 절차가 폐지될 수 있습니다." },
        ],
      },
      {
        no: "06",
        title: "인가결정",
        duration: "1개월 내외",
        description: "법원이 변제계획을 최종 승인하는 단계입니다.",
        bullets: ["변제계획 내용 확정", "인가 후 계획대로 변제 의무 발생"],
        notes: [
          {
            type: "tip",
            text: "예) 채무 1억 5천만원 → 월 변제금 100만원 × 36개월 = 3,600만원 변제 후 나머지 면책 대상",
          },
        ],
      },
      {
        no: "07",
        title: "변제 수행",
        duration: "36개월 (경우에 따라 60개월)",
        description: "인가된 변제계획대로 매월 납부하는 단계입니다.",
        bullets: ["매월 정해진 금액 변제", "소득 변동 시 변제계획 변경 신청 가능", "정해진 기간 동안 성실히 납부"],
        notes: [{ type: "warning", text: "변제를 중단하거나 미납이 누적되면 인가취소로 이어질 수 있습니다." }],
      },
      {
        no: "08",
        title: "면책결정",
        duration: "변제 완료 후 1~2개월",
        description: "변제 완료 후 법원이 면책을 결정하면 남은 채무가 면제됩니다.",
        bullets: ["변제 완료 보고서 제출", "법원 면책 심사", "면책결정 시 잔여 채무 면제"],
        notes: [
          { type: "warning", text: "면책 이력은 신용정보에 기록되며 일정 기간 금융 활동에 제한이 있을 수 있습니다." },
        ],
      },
    ],
  },
  {
    key: "bankruptcy",
    tabLabel: "파산·면책",
    summary: {
      operator: "법원",
      duration: "6~18개월",
      principalAdjustment: "원금 전액 면제",
      interestReduction: "이자 전액 면제",
    },
    target: "지급불능 상태로 소득으로는 채무 상환이 불가능한 개인",
    incomeRequired: false,
    eligibleApplicable: [
      { label: "소득 요건", desc: "소득 없어도 신청 가능 (지급불능 상태 요건)" },
      { label: "채무 한도", desc: "채무 금액 제한 없음" },
      { label: "재산 상태", desc: "재산이 없어도 신청 가능 (실무상 90% 이상 동시폐지)" },
      { label: "채무 유형", desc: "사금융·세금 체납 포함" },
    ],
    eligibleExcluded: [
      { label: "도박·사기·낭비 채무", desc: "면책 불허가 주요 사유 — 발생 경위 소명 필요" },
      { label: "재산 은닉·허위 신고", desc: "면책 취소 및 형사처벌 위험" },
      { label: "직전 7년 내 파산 경험", desc: "면책 불허가 사유 해당 가능" },
    ],
    debtConditions: [
      { label: "채무 한도", value: "제한 없음" },
      { label: "포함 가능 채무", value: "은행·카드·캐피탈·사금융·세금 체납 등 거의 전부" },
      { label: "면책 제외 채무", value: "세금, 양육비, 벌금, 고의·과실 손해배상" },
      { label: "이자 처리", value: "전액 면제" },
      { label: "원금 처리", value: "전액 면제 (면책 제외 채무 제외)" },
      { label: "재산 처리", value: "청산 (단, 실무상 재산 거의 없어 동시폐지 처리)" },
    ],
    effects: [
      { label: "전 채무 일시 소멸", desc: "면책결정 확정 시 면책 제외 채무를 제외한 모든 채무 소멸" },
      { label: "단기 처리", desc: "개인회생 대비 처리 기간 짧음 — 통상 동시폐지 사건 6개월 내외" },
      { label: "당연복권", desc: "면책결정 확정 시 채무자회생법에 따라 당연복권 (별도 신청 불필요)" },
      { label: "소득 불필요", desc: "지급불능 상태이면 소득이 없어도 신청 가능" },
    ],
    warnings: [
      "면책 후 약 7년간 신용불량 기록 유지 — 카드 발급·대출 제한",
      "세금, 양육비, 벌금 등 면책 제외 채무는 면책 후에도 상환 의무 존속",
      "도박·낭비·사기 등의 채무 발생 경위가 있으면 면책 불허가 위험",
    ],
    steps: [
      {
        no: "01",
        title: "신청서 작성·접수",
        duration: "1~2주",
        description: "법원에 파산 및 면책 신청서와 첨부 서류를 제출하는 단계입니다.",
        bullets: ["파산·면책 신청서", "채권자 목록", "재산 목록", "수입·지출 목록", "진술서 (채무 발생 경위 등)"],
        notes: [{ type: "info", text: "파산신청과 면책신청을 동시에 제출하는 것이 일반적입니다." }],
      },
      {
        no: "02",
        title: "파산선고",
        duration: "2~3개월",
        description:
          "법원이 지급불능 상태를 인정해 파산을 선고하는 단계입니다. 배당할 재산이 없으면 동시폐지 후 곧바로 면책 절차로 넘어갑니다.",
        bullets: [
          "법원의 파산 요건(지급불능) 심사",
          "파산선고 결정",
          "재산 부족 시 동시폐지 결정 (실무상 90% 이상)",
          "재산 있으면 파산관재인 선임 후 환가·배당 진행",
        ],
        notes: [
          {
            type: "warning",
            text: "동시폐지가 아닌 경우 파산관재인의 재산 조사와 채권자 배당 절차가 추가되어 기간이 길어질 수 있습니다.",
          },
        ],
      },
      {
        no: "03",
        title: "면책 심문",
        duration: "1~2개월",
        description: "법원이 면책 허가 여부를 판단하는 단계입니다.",
        bullets: ["면책 불허가 사유 검토", "채무자 심문 (필요 시 출석)", "채권자 이의 여부 확인"],
        notes: [
          { type: "warning", text: "도박, 낭비, 사기 등으로 채무가 발생한 경우 면책이 불허가될 수 있습니다." },
        ],
      },
      {
        no: "04",
        title: "면책결정",
        duration: "심문 후 확정",
        description: "법원이 면책을 결정하면 파산절차가 완료되고 채무가 면제됩니다.",
        bullets: [
          "면책결정 확정 (즉시항고 기간 14일 경과 후 확정)",
          "모든 채무 면제 (면책 제외 채무 제외)",
          "채무자회생법에 따라 당연복권",
        ],
        notes: [
          {
            type: "warning",
            text: "면책 제외 채무: 세금, 양육비, 벌금, 고의·과실 손해배상채무 등은 면책되지 않습니다.",
          },
        ],
      },
    ],
  },
  {
    key: "fresh_start_fund",
    tabLabel: "새출발기금",
    summary: {
      operator: "캠코 (한국자산관리공사)",
      duration: "접수 후 3~6개월",
      principalAdjustment: "최대 60~80% 원금 감면",
      interestReduction: "이자 전액 또는 일부 면제",
    },
    target: "코로나19 등 경기 악화로 피해를 입은 소상공인·자영업자",
    incomeRequired: false,
    eligibleApplicable: [
      { label: "대상자", desc: "소상공인·자영업자 (폐업자 포함)" },
      { label: "사업 증빙", desc: "사업자등록증 또는 사업 영위 사실 증빙 (폐업 무관)" },
      { label: "연체 전 차주", desc: "금리 인하, 만기 연장 등 조정 가능" },
      { label: "연체 후 차주", desc: "최대 원금 60~80% 조정, 취약계층 추가 감면" },
    ],
    eligibleExcluded: [
      { label: "사업 영위 이력 無", desc: "사업 영위 사실 자체가 핵심 요건 — 일반 급여생활자 제외" },
      { label: "과다 재산 보유", desc: "재산 보유 수준이 높으면 원금 조정 폭 축소 또는 제외" },
      { label: "재산 은닉 적발", desc: "조정 취소 및 신청 자격 박탈" },
    ],
    debtConditions: [
      { label: "신청 대상 채무", value: "사업 관련 대출·카드채무·보증채무" },
      { label: "연체 전 조정", value: "금리 인하, 만기 연장, 상환 유예" },
      { label: "연체 후 원금 감면", value: "일반 최대 60~80%, 취약계층 추가 감면 가능" },
      { label: "상환 기간", value: "최장 10년 분할 상환" },
      { label: "거치 기간", value: "일정 기간 거치 후 분할 상환 구조 가능" },
      { label: "신용정보", value: "성실 상환 시 신용정보 회복 지원" },
    ],
    effects: [
      { label: "자영업자 전용 설계", desc: "급여생활자 대상 일반 채무조정과 달리 사업 특수성을 반영한 맞춤 조정" },
      {
        label: "대폭 원금 감면",
        desc: "일반 최대 60~80%, 취약계층(기초수급자 등)은 추가 감면으로 상환 부담 대폭 축소",
      },
      { label: "장기 분할 상환", desc: "최장 10년 분할 상환으로 월 납부 부담 최소화" },
      { label: "정책 프로그램", desc: "캠코가 채권을 매입해 조정 — 민간 금융사 직접 협상 불필요" },
    ],
    warnings: [
      "사업 영위 이력이 없는 순수 급여생활자는 신청 불가",
      "상환을 장기간 연체하면 조정 효력 취소 후 원채무 부활",
      "재산 조사에서 은닉 재산 발견 시 조정 거절 또는 취소",
    ],
    steps: [
      {
        no: "01",
        title: "대상 확인 및 서류 준비",
        duration: "1~2주",
        description: "소상공인·자영업자 대상 여부를 확인하고 신청 서류를 준비하는 단계입니다.",
        bullets: [
          "사업자등록증(폐업 포함) 또는 사업 영위 증빙",
          "채무 현황(대출·카드·보증 등) 확인",
          "소득금액증명원 등 소득 증빙자료",
        ],
        notes: [
          { type: "info", text: "한국자산관리공사(캠코)가 운영하는 정책형 채무조정 프로그램입니다." },
          { type: "warning", text: "사업 영위 이력이 없으면 신청 대상에서 제외됩니다." },
        ],
      },
      {
        no: "02",
        title: "온라인/오프라인 접수",
        duration: "1주 내외",
        description: "새출발기금 홈페이지 또는 캠코 현장창구를 통해 채무조정을 신청하는 단계입니다.",
        bullets: ["채무조정 신청서 제출", "연체 여부에 따른 신청 유형 선택"],
      },
      {
        no: "03",
        title: "심사 및 조정방식 결정",
        duration: "1~2개월",
        description:
          "연체 여부·상환능력을 심사하여 만기연장, 상환유예, 원금감면 등 조정 방식이 결정되는 단계입니다.",
        bullets: [
          "연체 전 — 금리 인하, 만기 연장 위주",
          "연체 후 — 최대 원금 60~80% 조정 검토",
          "보유 재산·상환능력 조사",
        ],
        notes: [
          {
            type: "warning",
            text: "재산 은닉·과다 재산 보유가 확인되면 원금 조정 폭이 축소되거나 대상에서 제외될 수 있습니다.",
          },
        ],
      },
      {
        no: "04",
        title: "채권금융회사 동의·조정 확정",
        duration: "1~2개월",
        description: "채권금융회사의 동의를 거쳐 조정안이 확정되는 단계입니다.",
        bullets: ["채권금융회사 채무조정안 통지", "조정 조건 최종 확정"],
      },
      {
        no: "05",
        title: "변제 이행",
        duration: "최장 10년",
        description: "확정된 조정 조건에 따라 상환을 이행하는 단계입니다.",
        bullets: ["거치기간 후 분할 상환", "성실 상환 시 신용정보 회복 지원"],
        notes: [{ type: "warning", text: "상환을 장기간 연체하면 조정 효력이 취소될 수 있습니다." }],
      },
    ],
  },
  {
    key: "speedy_debt_adjustment",
    tabLabel: "신속채무조정",
    summary: {
      operator: "신용회복위원회",
      duration: "접수 후 1~2개월",
      principalAdjustment: "원금 감면 없음",
      interestReduction: "이자율 인하 위주",
    },
    target: "연체가 없거나 30일 이내 단기 연체 중인 채무자",
    incomeRequired: true,
    eligibleApplicable: [
      { label: "연체 상태", desc: "연체 없음 또는 30일 이내 단기 연체" },
      { label: "소득 요건", desc: "상환능력이 있는 소득 보유자" },
      { label: "목적", desc: "연체 장기화 사전 예방 목적" },
      { label: "채무 유형", desc: "신용회복위원회 가입 금융사 채무" },
    ],
    eligibleExcluded: [
      { label: "90일 이상 장기연체", desc: "개인워크아웃 대상으로 안내됨" },
      { label: "소득 없음", desc: "상환능력 없으면 적용 불가" },
      { label: "신불위 미가입 채무", desc: "신용회복위원회 가입 금융사 채무만 대상" },
    ],
    debtConditions: [
      { label: "대상 채무", value: "신용회복위원회 가입 금융사 채무 전반" },
      { label: "원금 조정", value: "없음 (원금 유지)" },
      { label: "이자율 조정", value: "최대한도 인하 (채무자 상환능력 기준)" },
      { label: "상환 기간", value: "최장 10년 연장 가능" },
      { label: "상환 유예", value: "일정 기간 유예 가능" },
      { label: "연체 가산이자", value: "면제 또는 감면 가능" },
    ],
    effects: [
      { label: "연체 예방 효과", desc: "신청 기간 중 연체 발생이 유예되어 신용등급 하락 방지" },
      { label: "이자 부담 경감", desc: "이자율 인하와 상환 기간 연장으로 월 납부 부담 감소" },
      { label: "신속 처리", desc: "신청 후 1~2개월 내 조정 확정으로 빠른 해결 가능" },
      { label: "신용 유지 가능", desc: "조기 신청 시 신용불량 등록 전 정상화 기회" },
    ],
    warnings: [
      "원금 자체는 감면되지 않아 총 상환 금액은 유지됨",
      "상환 불이행 시 개인워크아웃 등 후속 절차로 전환 안내",
      "신용회복위원회 비가입 금융사(일부 대부업체 등) 채무는 조정 불가",
    ],
    steps: [
      {
        no: "01",
        title: "신청 및 상담",
        duration: "1주 내외",
        description: "연체가 발생하기 전이거나 단기(30일 이내) 연체 단계에서 신용회복위원회에 신청하는 단계입니다.",
        bullets: ["채무조정 신청서 제출", "소득·채무 현황 상담"],
        notes: [
          { type: "info", text: "연체 장기화를 예방하기 위한 사전형 채무조정 제도입니다." },
          { type: "warning", text: "이미 90일 이상 장기 연체 중이면 개인워크아웃 대상으로 안내될 수 있습니다." },
        ],
      },
      {
        no: "02",
        title: "채권금융회사 통지·심의",
        duration: "2~4주",
        description: "채권금융회사에 채무조정 신청 사실이 통지되고, 이 기간 중 연체 발생이 유예됩니다.",
        bullets: ["채권금융회사 채무조정 통지", "심의위원회 조정안 심의"],
      },
      {
        no: "03",
        title: "조정안 확정·채권자 동의",
        duration: "2~4주",
        description: "이자율 인하·상환유예 등을 포함한 조정안이 확정되고 채권자 동의를 받는 단계입니다.",
        bullets: ["이자율 조정(최대 인하)", "상환기간 연장 검토"],
      },
      {
        no: "04",
        title: "변제 이행",
        duration: "최장 10년",
        description: "확정된 조정안에 따라 상환을 이행하는 단계입니다.",
        bullets: ["변경된 조건으로 정상 상환 재개"],
        notes: [{ type: "warning", text: "상환을 이행하지 못하면 일반 연체·개인워크아웃 절차로 전환될 수 있습니다." }],
      },
    ],
  },
  {
    key: "pre_workout",
    tabLabel: "프리워크아웃",
    summary: {
      operator: "신용회복위원회",
      duration: "접수 후 1~2개월",
      principalAdjustment: "원금 감면 없음",
      interestReduction: "이자율 인하 위주",
    },
    target: "31~89일 단기 연체 중인 채무자 (장기연체 전환 예방)",
    incomeRequired: true,
    eligibleApplicable: [
      { label: "연체 상태", desc: "31일 이상 ~ 89일 이하 연체" },
      { label: "소득 요건", desc: "일정 수준의 상환능력 보유" },
      { label: "목적", desc: "장기연체(90일↑) 전환 전 사전 지원" },
      { label: "채무 유형", desc: "신용회복위원회 가입 금융사 채무" },
    ],
    eligibleExcluded: [
      { label: "90일 이상 장기연체", desc: "개인워크아웃 대상으로 자동 전환" },
      { label: "연체 30일 이하", desc: "신속채무조정 대상으로 안내" },
      { label: "소득 없음", desc: "상환능력 없으면 적용 어려움" },
    ],
    debtConditions: [
      { label: "대상 채무", value: "신용회복위원회 가입 금융사 채무" },
      { label: "원금 조정", value: "없음 (원금 유지)" },
      { label: "이자율 조정", value: "인하 (채무자 상환능력 기준 산정)" },
      { label: "상환 기간", value: "최장 10년 연장" },
      { label: "연체이자·가산금", value: "면제 또는 감면" },
      { label: "분할 상환", value: "조정 확정 후 즉시 시작" },
    ],
    effects: [
      { label: "장기연체 전환 차단", desc: "90일 연체 전 조기 개입으로 불량 등록·추심 확대 방지" },
      { label: "이자 부담 감소", desc: "이자율 인하와 상환 기간 연장으로 월 납부액 감소" },
      { label: "빠른 조정 완료", desc: "신청 후 1~2개월 내 조정 확정으로 신속한 정상화" },
      { label: "금융사 협의 지원", desc: "신용회복위원회가 채권자와 협상 중재" },
    ],
    warnings: [
      "원금은 그대로이므로 이자 인하만으로 상환 불가 시 개인워크아웃 검토 필요",
      "90일 초과 연체 시 개인워크아웃으로 자동 전환 안내",
      "조정 후에도 상환 불이행 시 개인워크아웃 또는 법원 절차로 전환 가능",
    ],
    steps: [
      {
        no: "01",
        title: "신청 및 상담",
        duration: "1주 내외",
        description: "단기연체자(통상 31~89일 연체)가 신용회복위원회에 사전 채무조정을 신청하는 단계입니다.",
        bullets: ["채무조정 신청서 제출", "연체 기간·소득 현황 확인"],
        notes: [
          { type: "info", text: "연체가 장기화(90일 이상)되기 전 지원하는 채무조정 제도입니다." },
          { type: "warning", text: "연체가 90일을 넘으면 개인워크아웃 대상으로 전환됩니다." },
        ],
      },
      {
        no: "02",
        title: "채권금융회사 통지·심의",
        duration: "2~4주",
        description: "채권금융회사에 통지 후 상환능력을 심사하여 조정안을 마련하는 단계입니다.",
        bullets: ["이자율 인하 폭 산정", "상환유예·분할상환 조건 검토"],
      },
      {
        no: "03",
        title: "조정안 확정·채권자 동의",
        duration: "2~4주",
        description: "채권금융회사 동의를 받아 조정안이 확정되는 단계입니다.",
        bullets: ["이자율·상환조건 최종 확정"],
      },
      {
        no: "04",
        title: "변제 이행",
        duration: "최장 10년",
        description: "확정된 조건에 따라 상환을 이행하는 단계입니다.",
        bullets: ["거치기간 후 분할 상환"],
        notes: [{ type: "warning", text: "상환을 이행하지 못하면 개인워크아웃 등 후속 절차로 전환될 수 있습니다." }],
      },
    ],
  },
  {
    key: "personal_workout",
    tabLabel: "개인워크아웃",
    summary: {
      operator: "신용회복위원회",
      duration: "접수 후 2~3개월",
      principalAdjustment: "원금 일부 감면 가능",
      interestReduction: "이자 감면",
    },
    target: "90일 이상 장기연체 중인 개인 채무자",
    incomeRequired: true,
    eligibleApplicable: [
      { label: "연체 상태", desc: "90일 이상 장기연체" },
      { label: "소득 요건", desc: "일정 수준의 상환능력 보유 (소득 있어야 함)" },
      { label: "채무 유형", desc: "신용회복위원회 가입 금융사 채무" },
      { label: "원금 조정", desc: "상환능력 심사 후 원금 일부 감면 가능" },
    ],
    eligibleExcluded: [
      { label: "소득 無", desc: "상환능력이 전혀 없으면 파산 절차 권고" },
      { label: "도박·사치 채무 다수", desc: "지원 제한 또는 조정 불가 사유" },
      { label: "재산 과다 보유", desc: "재산이 채무액을 크게 초과하면 조정 폭 제한" },
    ],
    debtConditions: [
      { label: "대상 채무", value: "신용회복위원회 가입 금융사 채무 전반" },
      { label: "원금 조정", value: "상환능력 심사 후 일부 감면 가능" },
      { label: "이자율", value: "인하 (연체이자 면제 포함)" },
      { label: "상환 기간", value: "최장 8~10년" },
      { label: "거치 기간", value: "최대 3년 이내 거치 후 분할 상환" },
      { label: "완료 후", value: "성실 상환 완료 시 신용정보 정상 등록" },
    ],
    effects: [
      { label: "원금 감면", desc: "심사를 통해 원금 일부 감면 가능 — 신속채무조정·프리워크아웃과 차별점" },
      { label: "거치 후 분할 상환", desc: "최대 3년 거치 후 분할 상환으로 초기 부담 최소화" },
      { label: "신용 정상화", desc: "성실 상환 완료 후 신용정보 정상 등록으로 금융 정상화" },
      { label: "제도권 통합 관리", desc: "신용회복위원회가 다수 채권금융기관을 일괄 협의·관리" },
    ],
    warnings: [
      "3개월 이상 상환 연체 시 조정 효력 상실 후 원채무 부활",
      "상환능력이 없으면 워크아웃이 아닌 파산·면책 또는 개인회생 검토 필요",
      "신용회복위원회 비가입 금융사 채무(일부 대부업체 등)는 조정 불가",
    ],
    steps: [
      {
        no: "01",
        title: "신청 및 채무조정 상담",
        duration: "1~2주",
        description: "90일 이상 장기연체 중인 채무자가 신용회복위원회에 채무조정을 신청하는 단계입니다.",
        bullets: ["채무조정 신청서 제출", "연체 기간·채무 현황 확인", "소득 증빙자료 제출"],
        notes: [
          { type: "info", text: "신용회복위원회가 운영하는 개인채무자 신용회복지원제도입니다." },
          { type: "warning", text: "도박·사치 등 채무 발생 사유에 따라 지원이 제한될 수 있습니다." },
        ],
      },
      {
        no: "02",
        title: "심사",
        duration: "3~6주",
        description: "신용회복위원회가 상환능력·재산 상태를 심사하는 단계입니다.",
        bullets: ["상환능력 조사", "재산 조사", "채무조정안(원금 조정 포함) 마련"],
        notes: [{ type: "warning", text: "재산이 채무액을 상당히 초과하면 조정 폭이 제한될 수 있습니다." }],
      },
      {
        no: "03",
        title: "채무조정안 의결·채권자 동의",
        duration: "3~4주",
        description: "채권금융기관협의회의 의결을 거쳐 조정안이 확정되는 단계입니다.",
        bullets: ["원금 조정 비율 확정", "이자율·상환기간 확정"],
      },
      {
        no: "04",
        title: "변제 이행",
        duration: "최장 8~10년",
        description: "확정된 조정 조건에 따라 상환을 이행하는 단계입니다.",
        bullets: ["거치기간 후 분할 상환", "성실 상환 완료 시 신용정보 정상 등록"],
        notes: [{ type: "warning", text: "3개월 이상 상환을 연체하면 조정 효력이 상실될 수 있습니다." }],
      },
    ],
  },
];

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
