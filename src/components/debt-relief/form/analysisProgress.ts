import type { FakeProgressConfig, FakeProgressStage } from "@/hooks/useFakeProgress";

/**
 * 분석 생성/재분석 API는 진행 신호를 주지 않고 소요시간이 10~58초로 편차가 크다.
 * cap/tau는 그 범위를 기준으로 잡았다 — p(t) = 96 × (1 − e^(−t/16000)) 기준으로
 * 10초 45% / 20초 68% / 30초 81% / 45초 90% / 58초 93%에 도달하고 96%를 넘지 않는다.
 *
 * 40초를 넘기면 곡선이 초당 0.2% 미만으로 움직여 눈으로는 정지한 것처럼 보인다.
 * 오버레이의 광택 스윕과 단계 라벨 전환이 그 구간의 체감 정체를 대신 메운다.
 */
const ANALYSIS_PROGRESS_STAGES: FakeProgressStage[] = [
  { from: 0, label: "입력하신 정보를 정리하고 있어요" },
  { from: 20, label: "채무 구조를 분석하고 있어요" },
  { from: 45, label: "회생·파산 가능성을 계산하고 있어요" },
  { from: 70, label: "변제 가능성을 검토하고 있어요" },
  { from: 88, label: "결과를 정리하고 있어요" },
];

export const ANALYSIS_PROGRESS_CONFIG: FakeProgressConfig = {
  cap: 96,
  tau: 16_000,
  // 관측된 최장이 58초라 그보다 뒤에 둔다. 정상 범위에서 사과 문구가 뜨면 의미가 없다.
  overrunAfter: 65_000,
  stages: ANALYSIS_PROGRESS_STAGES,
};

export const ANALYSIS_PROGRESS_DONE_LABEL = "분석이 완료되었습니다";
export const ANALYSIS_PROGRESS_HINT = "최대 1분 정도 소요될 수 있습니다.";
export const ANALYSIS_PROGRESS_OVERRUN_HINT =
  "예상보다 오래 걸리고 있습니다. 조금만 더 기다려주세요.";
