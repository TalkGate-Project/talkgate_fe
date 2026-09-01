import { pdf, Font } from "@react-pdf/renderer";
import AnalysisPdfDocument, { PRETENDARD_PDF_FONT_FAMILY } from "./AnalysisPdfDocument";
import type { DiagnosisDetail, RecommendedProcedure } from "@/types/debtRelief";
import type { DebtReliefChatUiMessage } from "./useDebtReliefAiChat";

export type AnalysisPdfWorkerRequest = {
  requestId: number;
  detail: DiagnosisDetail;
  selectedProcedure: RecommendedProcedure;
  chatMessages: DebtReliefChatUiMessage[];
  generatedAt: Date;
};

export type AnalysisPdfWorkerResponse =
  | { requestId: number; ok: true; buffer: ArrayBuffer }
  | { requestId: number; ok: false; message: string };

const FULL_FONT_PATHS = {
  regular: "/fonts/pretendard/Pretendard-Regular.woff",
  semibold: "/fonts/pretendard/Pretendard-SemiBold.woff",
};

// react-pdf가 레이아웃 시점에 동적으로 채우는 텍스트(페이지 번호 등)는 트리 순회로 못 잡는다.
// 그런 자리에 나올 수 있는 문자를 최소한으로 미리 얹어 둔다.
const BASELINE_TEXT = "0123456789 /.,()%-·’‘“”";

// AnalysisPdfDocument가 만든 React 엘리먼트 트리를 순회해 실제 렌더링될 문자만 모은다.
// 정적 서브셋 대신 이 방식을 쓰는 이유: 고객명·메모·채팅 등은 자유 텍스트라 미리 정해둔
// 글자 집합만으로는 실제 문서에 나오는 희귀 글자를 놓쳐 PDF에 빈 글자(tofu)가 뜰 수 있다.
function collectText(node: unknown, out: string[]): void {
  if (node == null || typeof node === "boolean") return;
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, out);
    return;
  }
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    collectText((node as { props?: { children?: unknown } }).props?.children, out);
  }
}

function registerFullFonts() {
  Font.register({
    family: PRETENDARD_PDF_FONT_FAMILY,
    fonts: [
      { src: FULL_FONT_PATHS.regular, fontWeight: 400 },
      { src: FULL_FONT_PATHS.semibold, fontWeight: 600 },
    ],
  });
}

// 문서에 실제 쓰인 글자만 담은 서브셋 폰트를 서버에서 받아 등록한다. 서브셋 자체(harfbuzzjs)가
// Node 전용이라 브라우저 Worker 안에서는 만들 수 없어 /api/pdf-font-subset에 위임한다.
// 원본 폰트(1MB+, 전체 한글 글리프 포함)를 그대로 쓰면 fontkit 파싱 비용 때문에 생성이
// 수십 초씩 걸린다(2026-09-01 실측) — 서브셋은 보통 수백 글자 수준이라 훨씬 빠르게 파싱된다.
async function registerSubsetFonts(text: string): Promise<void> {
  const response = await fetch("/api/pdf-font-subset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Font subset request failed: ${response.status}`);
  }
  const { regular, semibold } = (await response.json()) as { regular: string; semibold: string };

  Font.register({
    family: PRETENDARD_PDF_FONT_FAMILY,
    fonts: [
      { src: `data:font/ttf;base64,${regular}`, fontWeight: 400 },
      { src: `data:font/ttf;base64,${semibold}`, fontWeight: 600 },
    ],
  });
}

self.onmessage = async (event: MessageEvent<AnalysisPdfWorkerRequest>) => {
  const { requestId, detail, selectedProcedure, chatMessages, generatedAt } = event.data;

  try {
    const element = AnalysisPdfDocument({ detail, selectedProcedure, chatMessages, generatedAt });

    const textParts: string[] = [BASELINE_TEXT];
    collectText(element, textParts);

    try {
      await registerSubsetFonts(textParts.join(" "));
    } catch (error) {
      // 서브셋 요청이 실패해도(네트워크 문제 등) 원본 폰트로 계속 생성은 되게 한다 — 느려질
      // 뿐 기능 자체가 막히진 않아야 한다.
      console.error("Font subset failed, falling back to full font:", error);
      registerFullFonts();
    }

    const blob = await pdf(element).toBlob();
    const buffer = await blob.arrayBuffer();
    const response: AnalysisPdfWorkerResponse = { requestId, ok: true, buffer };
    (self as unknown as Worker).postMessage(response, [buffer]);
  } catch (error) {
    const response: AnalysisPdfWorkerResponse = {
      requestId,
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
    (self as unknown as Worker).postMessage(response);
  }
};
