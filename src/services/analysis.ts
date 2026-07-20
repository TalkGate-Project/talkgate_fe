import { apiClient } from "@/lib/apiClient";
import { readEventStream } from "@/lib/sse";
import { setAuthSessionExpired } from "@/lib/authSession";
import type {
  CreateAnalysisInput,
  CreateAnalysisResponse,
  AnalysisListQuery,
  AnalysisListResponse,
  AnalysisDetailResponse,
  UpdateAnalysisInput,
  UpdateAnalysisResponse,
  ReanalyzeAnalysisInput,
  ReanalyzeAnalysisResponse,
  DeleteAnalysisResponse,
  AnalysisChatHistoryResponse,
  AnalysisChatSendInput,
  AnalysisChatStreamEvent,
  ConnectableCustomersQuery,
  ConnectableCustomersResponse,
  MatchAnalysisCustomerInput,
  MatchAnalysisCustomerResponse,
  UnmatchAnalysisCustomerResponse,
  DeliverAnalysisInput,
  DeliverAnalysisResponse,
  AnalysisDeliveriesResponse,
  RevokeAnalysisDeliveryResponse,
  AcceptAnalysisInput,
  AcceptAnalysisResponse,
  RejectAnalysisInput,
  RejectAnalysisResponse,
  AnalysisSummaryResponse,
  AnalysisProceduresResponse,
  AnalysisProcedureChangesResponse,
  AnalysisSendSmsInput,
  AnalysisSendSmsResponse,
  BulkDeleteAnalysisInput,
  BulkDeleteAnalysisResponse,
  BulkDeliverAnalysisInput,
  BulkDeliverAnalysisResponse,
} from "@/types/analysis";
import type {
  FeeStatisticsQuery,
  FeeStatisticsSummaryResponse,
  FeeStatisticsInstallmentsResponse,
} from "@/types/analysisFeeStatistics";
import type {
  CreateFeePlanInput,
  CreateFeePlanResponse,
  UpdateFeePlanInput,
  UpdateFeePlanResponse,
  PayFeeInstallmentInput,
  PayFeeInstallmentResponse,
  UnpayFeeInstallmentResponse,
  RefundFeePlanResponse,
  StopFeePlanResponse,
} from "@/types/analysisFeePlan";

export type AnalysisChatStreamCallbacks = {
  onDelta: (delta: string) => void;
  onDone: () => void;
};

export const AnalysisService = {
  // 분석 생성 및 AI 진단 실행
  create(input: CreateAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<CreateAnalysisResponse>(`/v1/analysis`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 목록 조회
  list(query: AnalysisListQuery) {
    const { projectId, ...qs } = query;
    return apiClient.get<AnalysisListResponse>(`/v1/analysis`, {
      query: qs,
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 상세 조회
  detail(id: number, projectId: string) {
    return apiClient.get<AnalysisDetailResponse>(`/v1/analysis/${id}`, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 상태/절차 단계 업데이트
  update(id: number, input: UpdateAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<UpdateAnalysisResponse>(`/v1/analysis/${id}`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 입력값 수정 및 AI 재진단 (자체 생성 분석 건만 가능). 성공 시 status/trackingProcedure/
  // currentProcedureStep이 초기화되고 AI 채팅 이력이 삭제된다 — 호출 전 UI에서 사용자에게 안내 필요.
  reanalyze(id: number, input: ReanalyzeAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<ReanalyzeAnalysisResponse>(`/v1/analysis/${id}/input`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 삭제 (공유받은 분석 건은 삭제 불가)
  remove(id: number, projectId: string) {
    return apiClient.delete<DeleteAnalysisResponse>(`/v1/analysis/${id}`, {
      headers: { "x-project-id": projectId },
    });
  },

  // 채팅 히스토리 조회
  chatHistory(id: number, projectId: string) {
    return apiClient.get<AnalysisChatHistoryResponse>(`/v1/analysis/${id}/chat`, {
      headers: { "x-project-id": projectId },
    });
  },

  // AI 채팅 메시지 전송 (SSE 스트리밍)
  //
  // apiClient는 응답을 완전히 버퍼링한 뒤 반환하므로 SSE에 쓸 수 없다.
  // /api/proxy는 그대로 경유하되(백엔드 직접 호출 금지 규칙 준수) apiClient 래퍼를 우회해
  // fetch로 직접 스트림을 읽는다. 이 스트림이 실제로 흐르려면 서버 쪽
  // src/app/api/proxy/[...path]/route.ts가 text/event-stream 응답을 버퍼링 없이
  // pass-through 하도록 되어 있어야 한다(2026-07-10 기준 적용됨).
  //
  // apiClient와 달리 401 자동 refresh/retry는 프록시가 대신 처리해주지만(재시도 후에도
  // 실패한 "진짜" 401만 여기로 내려온다), suppressAutoLogout 등 apiClient의 세부 예외
  // 옵션은 없다. 이 엔드포인트는 CLAUDE.md의 401 예외 목록에 없으므로 진짜 401이면
  // apiClient와 동일하게 세션 만료 처리한다.
  async streamChatMessage(
    input: AnalysisChatSendInput,
    callbacks: AnalysisChatStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const { id, projectId, message } = input;

    const response = await fetch(`/api/proxy/v1/analysis/${id}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-project-id": projectId,
      },
      credentials: "include",
      body: JSON.stringify({ message }),
      signal,
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("text/event-stream")) {
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setAuthSessionExpired("401");
      }

      throw Object.assign(new Error(`Chat stream request failed: ${response.status}`), {
        status: response.status,
        data,
      });
    }

    await readEventStream(response, (payload) => {
      let event: AnalysisChatStreamEvent;
      try {
        event = JSON.parse(payload);
      } catch {
        return;
      }

      if ("done" in event && event.done) {
        callbacks.onDone();
        return;
      }
      if ("delta" in event && typeof event.delta === "string") {
        callbacks.onDelta(event.delta);
      }
    });
  },

  // 매칭 가능 고객 목록 조회 (자체 생성 분석 건만 가능)
  connectableCustomers(id: number, projectId: string, query?: ConnectableCustomersQuery) {
    return apiClient.get<ConnectableCustomersResponse>(
      `/v1/analysis/${id}/connectable-customers`,
      {
        query,
        headers: { "x-project-id": projectId },
      }
    );
  },

  // 분석 건에 고객 매칭
  matchCustomer(id: number, input: MatchAnalysisCustomerInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<MatchAnalysisCustomerResponse>(`/v1/analysis/${id}/customer`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 건 고객 매칭 해제
  unmatchCustomer(id: number, projectId: string) {
    return apiClient.delete<UnmatchAnalysisCustomerResponse>(`/v1/analysis/${id}/customer`, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 건 공유 (영업 프로젝트). 접근 권한이 있는 멤버면 공유 가능.
  // 활성 공유는 분석 건당 변호사 프로젝트 1곳으로 제한됨.
  deliver(id: number, input: DeliverAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<DeliverAnalysisResponse>(`/v1/analysis/${id}/deliver`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 공유받은 분석 건 수락 (변호사 프로젝트). 검토중 상태의 건만 가능 — 성공 시 계약대기중으로 전환.
  accept(id: number, input: AcceptAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<AcceptAnalysisResponse>(`/v1/analysis/${id}/accept`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 공유받은 분석 건 반려 (변호사 프로젝트). 검토중 상태의 건만 가능 — 성공 시 반려됨으로 전환.
  // 반려돼도 접근 권한(isShared 조회)은 유지되고, 영업 프로젝트는 동일 파트너에게 재공유 가능.
  reject(id: number, input: RejectAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<RejectAnalysisResponse>(`/v1/analysis/${id}/reject`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 건 공유 이력 조회
  deliveries(id: number, projectId: string) {
    return apiClient.get<AnalysisDeliveriesResponse>(`/v1/analysis/${id}/deliveries`, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 건 공유 철회
  revokeDelivery(id: number, deliveryId: number, projectId: string) {
    return apiClient.delete<RevokeAnalysisDeliveryResponse>(
      `/v1/analysis/${id}/deliveries/${deliveryId}`,
      {
        headers: { "x-project-id": projectId },
      }
    );
  },

  // 분석 절차 변경 이력 조회 (최신 변경 스냅샷)
  procedureChanges(id: number, projectId: string) {
    return apiClient.get<AnalysisProcedureChangesResponse>(
      `/v1/analysis/${id}/procedure-changes`,
      {
        headers: { "x-project-id": projectId },
      }
    );
  },

  // 분석 일괄 삭제 (자체 생성 건만). ID 목록 또는 필터 조건.
  bulkDelete(input: BulkDeleteAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BulkDeleteAnalysisResponse>(`/v1/analysis/bulk-delete`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 일괄 공유 (영업 프로젝트). 활성 공유는 건당 파트너 1곳.
  bulkDeliver(input: BulkDeliverAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<BulkDeliverAnalysisResponse>(`/v1/analysis/bulk-deliver`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 요약 통계 조회 (총 건수, 이번 달 건수, 평균 성공 가능성, 절차·단계 분포)
  summary(projectId: string) {
    return apiClient.get<AnalysisSummaryResponse>(`/v1/analysis/summary`, {
      headers: { "x-project-id": projectId },
    });
  },

  // 절차 마스터 데이터 조회
  procedures(projectId: string) {
    return apiClient.get<AnalysisProceduresResponse>(`/v1/analysis/procedures`, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 건 연락처로 문자 발송 (공유 시 전달받은 연락처 우선, 없으면 매칭된 고객 연락처)
  sendSms(id: number, projectId: string, input: AnalysisSendSmsInput) {
    return apiClient.post<AnalysisSendSmsResponse>(`/v1/analysis/${id}/send-sms`, input, {
      headers: { "x-project-id": projectId },
    });
  },

  // --- Fee Statistics (통계 탭 연동) ---

  /** GET /v1/analysis/fee-statistics/summary */
  feeStatisticsSummary(query: FeeStatisticsQuery) {
    const { projectId, filterProjectId, startDate, endDate, page, limit } = query;
    return apiClient.get<FeeStatisticsSummaryResponse>(
      `/v1/analysis/fee-statistics/summary`,
      {
        query: {
          ...(filterProjectId != null ? { projectId: filterProjectId } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          ...(page != null ? { page } : {}),
          ...(limit != null ? { limit } : {}),
        },
        headers: { "x-project-id": projectId },
      }
    );
  },

  /** GET /v1/analysis/fee-statistics/installments */
  feeStatisticsInstallments(query: FeeStatisticsQuery) {
    const { projectId, filterProjectId, startDate, endDate, page, limit } = query;
    return apiClient.get<FeeStatisticsInstallmentsResponse>(
      `/v1/analysis/fee-statistics/installments`,
      {
        query: {
          ...(filterProjectId != null ? { projectId: filterProjectId } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          ...(page != null ? { page } : {}),
          ...(limit != null ? { limit } : {}),
        },
        headers: { "x-project-id": projectId },
      }
    );
  },

  // --- Fee Plan (추후 UI 연동용. 현재 호출부 없음) ---

  /** POST /v1/analysis/{id}/fee-plan */
  createFeePlan(id: number, input: CreateFeePlanInput) {
    const { projectId, ...body } = input;
    return apiClient.post<CreateFeePlanResponse>(`/v1/analysis/${id}/fee-plan`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  /** PATCH /v1/analysis/{id}/fee-plan */
  updateFeePlan(id: number, input: UpdateFeePlanInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<UpdateFeePlanResponse>(`/v1/analysis/${id}/fee-plan`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  /** POST /v1/analysis/{id}/fee-plan/installments/{installmentId}/pay */
  payFeeInstallment(
    id: number,
    installmentId: number,
    input: PayFeeInstallmentInput
  ) {
    const { projectId, ...body } = input;
    return apiClient.post<PayFeeInstallmentResponse>(
      `/v1/analysis/${id}/fee-plan/installments/${installmentId}/pay`,
      body,
      { headers: { "x-project-id": projectId } }
    );
  },

  /** DELETE /v1/analysis/{id}/fee-plan/installments/{installmentId}/pay */
  unpayFeeInstallment(id: number, installmentId: number, projectId: string) {
    return apiClient.delete<UnpayFeeInstallmentResponse>(
      `/v1/analysis/${id}/fee-plan/installments/${installmentId}/pay`,
      { headers: { "x-project-id": projectId } }
    );
  },

  /** POST /v1/analysis/{id}/fee-plan/refund */
  refundFeePlan(id: number, projectId: string) {
    return apiClient.post<RefundFeePlanResponse>(
      `/v1/analysis/${id}/fee-plan/refund`,
      {},
      { headers: { "x-project-id": projectId } }
    );
  },

  /** POST /v1/analysis/{id}/fee-plan/stop */
  stopFeePlan(id: number, projectId: string) {
    return apiClient.post<StopFeePlanResponse>(
      `/v1/analysis/${id}/fee-plan/stop`,
      {},
      { headers: { "x-project-id": projectId } }
    );
  },
};
