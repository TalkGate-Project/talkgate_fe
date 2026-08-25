import { apiClient } from "@/lib/apiClient";
import { readEventStream } from "@/lib/sse";
import { setAuthSessionExpired } from "@/lib/authSession";
import { env } from "@/lib/env";
import { getAccessToken } from "@/lib/token";
import { AuthService } from "@/services/auth";
import type {
  CreateAnalysisInput,
  CreateAnalysisResponse,
  AnalysisListQuery,
  AnalysisListResponse,
  AnalysisDetailResponse,
  UpdateAnalysisInput,
  UpdateAnalysisResponse,
  SelfProgressAnalysisInput,
  SelfProgressAnalysisResponse,
  ReanalyzeAnalysisInput,
  ReanalyzeAnalysisResponse,
  UpdateAnalysisDebtsInput,
  UpdateAnalysisDebtsResponse,
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
  RefundFeePlanInput,
  RefundFeePlanResponse,
  StopFeePlanInput,
  StopFeePlanResponse,
} from "@/types/analysisFeePlan";

export type AnalysisChatStreamCallbacks = {
  onDelta: (delta: string) => void;
  onDone: () => void;
};

export const AnalysisService = {
  // 분석 생성 및 AI 진단 실행. 실제 LLM 호출이 끼어 있어 apiClient 기본 타임아웃(30초)을
  // 넘기는 경우가 있어(2026-07-24 확인 — AbortError로 실패하지만 서버는 정상 완료됨) 2분으로 연장.
  // 서버는 완료됐는데 클라이언트만 타임아웃나면 재시도 시 중복 분석 건이 생기므로 주의
  // (2026-07-24 실사용 중 "채무테스트" 3건 중복 생성 확인).
  create(input: CreateAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<CreateAnalysisResponse>(`/v1/analysis`, body, {
      headers: { "x-project-id": projectId },
      timeoutMs: 120000,
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

  // 계약대기중/절차진행중 분석의 추적 절차 및 현재 단계 업데이트
  update(id: number, input: UpdateAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<UpdateAnalysisResponse>(`/v1/analysis/${id}`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 영업점이 법무법인 공유 없이 자체 진행. 수임료 계획 유무에 따라 서버가
  // contract_pending 또는 in_progress로 전환하고 기존 법무법인 연결을 해제한다.
  selfProgress(id: number, input: SelfProgressAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.post<SelfProgressAnalysisResponse>(`/v1/analysis/${id}/self-progress`, body, {
      headers: { "x-project-id": projectId },
    });
  },

  // 분석 입력값 수정 및 AI 재진단 (자체 생성 분석 건만 가능). 성공 시 status/trackingProcedure/
  // currentProcedureStep이 초기화되고 AI 채팅 이력이 삭제된다 — 호출 전 UI에서 사용자에게 안내 필요.
  // create와 동일하게 실제 LLM 호출이 있어 타임아웃을 넉넉히 연장(위 create 주석 참고).
  reanalyze(id: number, input: ReanalyzeAnalysisInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<ReanalyzeAnalysisResponse>(`/v1/analysis/${id}/input`, body, {
      headers: { "x-project-id": projectId },
      timeoutMs: 120000,
    });
  },

  // 채무 정보만 수정 (자체 생성 분석 건만). reanalyze=false는 상태·공유 여부와 무관하게 가능하고,
  // true는 재분석 권한을 따른다. AI 재진단 가능성이 있어 타임아웃을 넉넉히 연장한다.
  updateDebts(id: number, input: UpdateAnalysisDebtsInput) {
    const { projectId, ...body } = input;
    return apiClient.patch<UpdateAnalysisDebtsResponse>(`/v1/analysis/${id}/debts`, body, {
      headers: { "x-project-id": projectId },
      timeoutMs: 120000,
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
  // 이 엔드포인트만 예외적으로 /api/proxy를 거치지 않고 브라우저가 AWS 백엔드에 직접
  // 요청한다(백엔드 팀 제안, 2026-07-27). 원인: 배포된 파이프라인이 Vercel(프론트)과
  // AWS(백엔드)로 나뉘어 있는데, 프록시(Vercel 서버리스 함수)를 한 번 거치면 그 구간에서
  // 응답이 버퍼링되어 SSE가 스트리밍이 아니라 한 번에 도착한다(로컬/백엔드까지 전부 Vercel인
  // 경우엔 문제없이 스트리밍됨). CLAUDE.md의 "클라이언트는 백엔드를 직접 호출하지 않는다"
  // 원칙의 의도적 예외 — 실시간 채팅 소켓(src/lib/realtime.ts)도 같은 이유로 이미 직접
  // 연결하고 있어 선례가 있다.
  //
  // 프록시를 안 거치므로 401 자동 refresh/retry도 여기서 직접 처리해야 한다: 토큰은
  // apiClient처럼 쿠키(x-project-id)+Authorization 헤더로 넘기되, Authorization은
  // getAccessToken()으로 non-httpOnly 쿠키에서 읽어 수동 구성한다(realtime.ts와 동일 패턴).
  // 첫 요청이 401이면 AuthService.refresh()(프록시 경유, CORS 문제 없음)로 한 번만
  // 갱신을 시도하고, 새 토큰으로 스트림 요청을 한 번 재시도한다. 재시도까지 실패하면
  // apiClient와 동일하게 세션 만료 처리.
  async streamChatMessage(
    input: AnalysisChatSendInput,
    callbacks: AnalysisChatStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const { id, projectId, message } = input;
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/v1/analysis/${id}/chat/stream`;

    // 백엔드가 인증을 Authorization 헤더로만 판별하므로(프록시가 쿠키→헤더 변환해오던 방식과 동일),
    // 쿠키를 굳이 전송할 필요가 없다 — credentials를 생략해 크로스오리진 CORS 요건을
    // Allow-Credentials 없이 Origin 허용만으로 단순화한다.
    const requestStream = (accessToken: string | null) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-project-id": projectId,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal,
      });

    let response = await requestStream(getAccessToken());

    if (response.status === 401) {
      const refreshed = await AuthService.refresh().catch(() => null);
      if (refreshed?.ok) {
        response = await requestStream(getAccessToken());
      }
    }

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

  // 매칭 가능 고객 목록 조회 (자체 생성 분석 건만 가능) — 구버전, analysisId가 path에 있어야만
  // 호출 가능해서 신규 화면(아직 분석 ID가 없음)에서는 쓸 수 없었다. 실사용 연동은 아래
  // connectableCustomersV2로 옮겼고, 롤백 대비로 삭제하지 않고 남겨둠(호출부 없음).
  connectableCustomers(id: number, projectId: string, query?: ConnectableCustomersQuery) {
    return apiClient.get<ConnectableCustomersResponse>(
      `/v1/analysis/${id}/connectable-customers`,
      {
        query,
        headers: { "x-project-id": projectId },
      }
    );
  },

  // 매칭 가능 고객 목록 조회 v2 — analysisId를 path가 아닌 optional 쿼리로 받는다. 있으면 해당
  // 분석 담당 멤버 기준, 없으면(신규 생성 화면) 요청 멤버 기준으로 매칭 가능 고객을 반환한다.
  connectableCustomersV2(projectId: string, query?: ConnectableCustomersQuery) {
    return apiClient.get<ConnectableCustomersResponse>("/v1/analysis/connectable-customers", {
      query,
      headers: { "x-project-id": projectId },
    });
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

  // --- Fee Plan ---

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
  refundFeePlan(id: number, projectId: string, input?: RefundFeePlanInput) {
    return apiClient.post<RefundFeePlanResponse>(
      `/v1/analysis/${id}/fee-plan/refund`,
      { message: input?.message || undefined },
      { headers: { "x-project-id": projectId } }
    );
  },

  /** POST /v1/analysis/{id}/fee-plan/stop */
  stopFeePlan(id: number, projectId: string, input?: StopFeePlanInput) {
    return apiClient.post<StopFeePlanResponse>(
      `/v1/analysis/${id}/fee-plan/stop`,
      { message: input?.message || undefined },
      { headers: { "x-project-id": projectId } }
    );
  },
};
