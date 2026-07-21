// Analysis Fee Plan — 수임료 계획

import type { ApiSuccess } from "./common";
export type FeePaymentType = "lump_sum" | "installment";

export type FeePlanStatus = "active" | "refunded" | "stopped";

export type FeePlanInstallmentStatus = "scheduled" | "paid" | "refunded" | "waived";

export type FeePlanInstallment = {
  id: number;
  installmentNumber: number;
  /** 만원 */
  amount: number;
  scheduledDate: string;
  paidAt: string | null;
  status: FeePlanInstallmentStatus;
};

export type FeePlan = {
  id: number;
  analysisId: number;
  /** 만원 */
  totalAmount: number;
  paymentType: FeePaymentType;
  installmentCount: number;
  firstPaymentDate: string;
  /** 전달사항 (선택) — API 응답에는 포함되지 않아, 마지막 저장 시 입력값을 클라이언트에서 직접 채워 넣는 값 */
  note?: string | null;
  status: FeePlanStatus;
  installments: FeePlanInstallment[];
  createdAt: string;
  updatedAt: string;
};

/** GET /v1/analysis 목록용 축약형 — 회차 배열 없이 진행현황만. 상세는 FeePlan 참고. */
export type FeePlanSummary = {
  /** 만원 */
  totalAmount: number;
  paymentType: FeePaymentType;
  installmentCount: number;
  paidInstallmentCount: number;
  status: FeePlanStatus;
};

/** POST /v1/analysis/{id}/fee-plan — 계약대기중 이전 단계에서도 저장 가능하도록 trackingProcedure는 받지 않는다.
 * 절차 지정은 계약대기중 상태에서 별도로 DebtReliefService.updateProcedureProgress(PATCH /v1/analysis/{id})로 한다. */
export type CreateFeePlanInput = {
  projectId: string;
  totalAmount: number;
  paymentType: FeePaymentType;
  installmentCount: number;
  firstPaymentDate: string;
  /** 전달사항 (선택) */
  message?: string | null;
};

export type CreateFeePlanResponse = ApiSuccess<FeePlan>;

/** PATCH /v1/analysis/{id}/fee-plan */
export type UpdateFeePlanInput = {
  projectId: string;
  totalAmount: number;
  paymentType: FeePaymentType;
  installmentCount: number;
  firstPaymentDate: string;
  /** 전달사항 (선택) */
  message?: string | null;
};

export type UpdateFeePlanResponse = ApiSuccess<FeePlan>;

/** POST /v1/analysis/{id}/fee-plan/installments/{installmentId}/pay */
export type PayFeeInstallmentInput = {
  projectId: string;
  paidAt?: string;
};

export type PayFeeInstallmentResponse = ApiSuccess<FeePlan>;

/** DELETE /v1/analysis/{id}/fee-plan/installments/{installmentId}/pay */
export type UnpayFeeInstallmentResponse = ApiSuccess<FeePlan>;

/** POST /v1/analysis/{id}/fee-plan/refund */
export type RefundFeePlanInput = {
  /** 전달사항 (선택) */
  message?: string | null;
};

export type RefundFeePlanResponse = ApiSuccess<FeePlan>;

/** POST /v1/analysis/{id}/fee-plan/stop */
export type StopFeePlanInput = {
  /** 전달사항 (선택) */
  message?: string | null;
};

export type StopFeePlanResponse = ApiSuccess<FeePlan>;
