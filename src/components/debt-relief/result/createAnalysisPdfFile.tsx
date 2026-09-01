import type { DiagnosisDetail, RecommendedProcedure } from "@/types/debtRelief";
import type { DebtReliefChatUiMessage } from "./useDebtReliefAiChat";
import type { AnalysisPdfWorkerRequest, AnalysisPdfWorkerResponse } from "./analysisPdfWorker";

// PDF 생성(폰트 파싱 + 레이아웃)이 CPU를 오래 점유해 메인스레드를 멈춰 버리므로 Worker에서
// 실행한다. Worker는 요청마다 새로 띄운다 — react-pdf의 Font 레지스트리는 같은 family를
// 다시 register해도 먼저 등록된 소스를 우선 사용해, Worker를 재사용하면 두 번째 다운로드부터
// 문서별로 새로 받은 서브셋 폰트가 무시되고 첫 번째 폰트가 계속 쓰인다.
//
// 워커 소스(analysisPdfWorker.tsx)나 그 의존 모듈(AnalysisPdfDocument 등)을 고치면
// Turbopack의 new URL(..., import.meta.url) 워커 처리 버그를 피하려고 esbuild로 미리
// 번들링해 둔 정적 파일이라 `node scripts/build-analysis-pdf-worker.mjs`로 다시 빌드해야 한다.
export async function createAnalysisPdfFile({
  detail,
  selectedProcedure,
  chatMessages,
}: {
  detail: DiagnosisDetail;
  selectedProcedure: RecommendedProcedure;
  chatMessages: DebtReliefChatUiMessage[];
}): Promise<File> {
  const generatedAt = new Date();
  const worker = new Worker("/workers/analysis-pdf-worker.js", { type: "module" });

  try {
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<AnalysisPdfWorkerResponse>) => {
        if (event.data.ok) {
          resolve(event.data.buffer);
        } else {
          reject(new Error(event.data.message));
        }
      };
      worker.onerror = (event) => {
        reject(new Error(event.message || "PDF worker crashed"));
      };

      const request: AnalysisPdfWorkerRequest = {
        requestId: 0,
        detail,
        selectedProcedure,
        chatMessages,
        generatedAt,
      };
      worker.postMessage(request);
    });

    return new File([buffer], `채무조정_진단서_${detail.id}.pdf`, {
      type: "application/pdf",
      lastModified: generatedAt.getTime(),
    });
  } finally {
    worker.terminate();
  }
}
