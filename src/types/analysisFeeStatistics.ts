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
  customerName: string;
  installmentNumber: number;
  // TODO: total installmentCount when API provides it (예: 3/8회차)
  amount: number; // 원(KRW)
  scheduledDate: string;
  paidAt: string | null;
  status: FeeInstallmentStatus;
  // TODO: assignee name when API provides it (담당자명 + 영업점)
};

export type FeeStatisticsInstallmentsPayload = {
  items: FeeStatisticsInstallmentItem[];
  total: number;
  page: number;
  limit: number;
};

export type FeeStatisticsInstallmentsResponse =
  ApiSuccess<FeeStatisticsInstallmentsPayload>;
