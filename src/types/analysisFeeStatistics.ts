// Analysis Fee Statistics — 수임료 회차 통계 요약/목록

import type { ApiSuccess } from "./common";

/** 회차 납부 상태 */
export type FeeInstallmentStatus =
  | "scheduled"
  | "paid"
  | "unpaid"
  | "refunded"
  | "waived";

export type FeeStatisticsQuery = {
  /** 현재 프로젝트 ID (x-project-id 헤더) */
  projectId: string;
  /** 특정 프로젝트가 생성한 분석 건으로 필터링 (변호사: 공유해준 영업 프로젝트 ID) */
  filterProjectId?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
};

export type FeeStatisticsBucket = {
  count: number;
  amount: number; // 원(KRW)
};

export type FeeStatisticsSummary = {
  paid: FeeStatisticsBucket;
  unpaid: FeeStatisticsBucket;
  scheduled: FeeStatisticsBucket;
  refunded: FeeStatisticsBucket;
  // TODO: overdueCount when API provides it (미납 카드 "기한초과 N건 포함")
};

export type FeeStatisticsSummaryResponse = ApiSuccess<FeeStatisticsSummary>;

export type FeeStatisticsInstallmentItem = {
  id: number;
  analysisId: number;
  sourceProjectId: number;
  sourceProjectName: string | null;
  /** 담당자명 (영업점 담당 직원) */
  sourceMemberName: string | null;
  customerName: string;
  installmentNumber: number;
  /** 총 회차 수 (예: 3/8회차). 아직 엔드포인트가 내려주지 않아 없을 수 있음 — 없으면 현재 회차만 표시 */
  installmentCount?: number;
  amount: number; // 원(KRW)
  scheduledDate: string;
  paidAt: string | null;
  status: FeeInstallmentStatus;
};

export type FeeStatisticsInstallmentsPayload = {
  items: FeeStatisticsInstallmentItem[];
  total: number;
  page: number;
  limit: number;
};

export type FeeStatisticsInstallmentsResponse =
  ApiSuccess<FeeStatisticsInstallmentsPayload>;
